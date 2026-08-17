const mongo = require('mongodb');
const moment = require('moment');
const Response = require('../controller/response');
const ResMessage = require("../../Settings/service/message");
const dynamicEmail = require('../../Email/service/dynamicEmail');
const { attachFilesToAnswers, cleanUpOrphanedFile } = require('./utils/utils');

// Helper to extract title from localized array
const { getFormTitle, buildFormLink } = require('../../Email/service/email.utils');
const FormModel = require('../../Form/models/form.model');
const ResponseModel = require('../models/response.model');
const { generateToken, hashToken, isValidToken } = require('../../../../helpers/export-api-token');

const objectIdPattern = /^[a-f\d]{24}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isSubmitting = body => String(body && body.submit).toLowerCase() === 'true';
const normalizeEmail = value => String(value || '').trim().toLowerCase();
const isBlankAnswer = value => {
    if (Array.isArray(value)) return value.length === 0 || value.every(isBlankAnswer);
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return true;
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed.length === 0 || parsed.every(isBlankAnswer);
        } catch (e) { /* plain text answer */ }
    }
    return false;
};

const loadFormForSubmission = formId => FormModel.findById(formId)
    .populate({ path: 'questions', populate: { path: 'type' } })
    .lean();

const validateSubmission = (form, body, answers, identity) => {
    if (!form) return { status: 404, message: 'Form not found' };
    const settings = form.settings || {};
    const email = normalizeEmail(identity.email);

    if (!identity.responder && !settings.allowPublicResponses) {
        return { status: 403, message: 'This form does not accept public responses' };
    }
    if ((settings.collectEmail || (settings.limitResponse && !identity.responder)) && !emailPattern.test(email)) {
        return { status: 400, message: 'A valid responder email is required' };
    }

    const answerMap = new Map((answers || []).map(answer => [String(answer.question || ''), answer.response]));
    const missing = (form.questions || []).filter(question => {
        const type = String(question && question.type && (question.type.type || question.type) || '').toLowerCase();
        if (type === 'title_description' || type === 'image') return false;
        if (!settings.requireResponse && !question.isRequired) return false;
        return isBlankAnswer(answerMap.get(String(question._id)));
    });
    if (missing.length) {
        return {
            status: 400,
            message: 'Required questions are missing answers',
            missingQuestionIds: missing.map(question => String(question._id))
        };
    }

    if (settings.limitResponse) {
        const identityValue = identity.responder ? `user:${identity.responder}` : `email:${email}`;
        body.submissionKey = `${form._id}:${identityValue}`;
    } else {
        body.submissionKey = null;
    }
    return null;
};

const sendSubmissionEmail = doc => {
    const settings = doc && doc.form && doc.form.settings || {};
    if (!settings.emailNotifications) return;
    const email = normalizeEmail((doc.responder && doc.responder.email) || doc.responderEmail);
    if (!emailPattern.test(email)) return;

    const formTitle = getFormTitle(doc.form);
    const responderName = (doc.responder && doc.responder.name) || doc.responderName || email;
    const submittedAt = moment(doc.updatedAt || doc.createdAt).format('DD MMM YYYY, HH:mm');
    const variables = {
        UserName: responderName,
        Responder: responderName,
        FormName: formTitle,
        FormURL: buildFormLink(doc.form?._id),
        Organization: 'Digital University',
        SubmittedAt: submittedAt,
        ReferenceNo: String(doc._id),
        EmailMessage: settings.emailMessage || ''
    };
    dynamicEmail.sendDynamicEmail('submissionConfirmation', variables, email)
        .catch(() => console.error('[response.service.js] submission email failed'));
};

exports.onExportApiRotate = async function (request, response) {
    try {
        const formId = String(request.params.formId || '');
        if (!objectIdPattern.test(formId)) {
            return response.status(400).json({ success: false, message: 'Invalid form ID' });
        }

        const token = generateToken();
        const form = await FormModel.findByIdAndUpdate(
            formId,
            {
                $set: {
                    exportApiTokenHash: hashToken(token),
                    exportApiTokenCreatedAt: new Date()
                }
            },
            { new: true, projection: { _id: 1, exportApiTokenCreatedAt: 1 } }
        ).lean();

        if (!form) {
            return response.status(404).json({ success: false, message: 'Form not found' });
        }

        response.set('Cache-Control', 'no-store');
        return response.status(200).json({
            success: true,
            data: { token, createdAt: form.exportApiTokenCreatedAt }
        });
    } catch (err) {
        console.error('[response.service.js] export API rotation failed');
        return response.status(500).json({ success: false, message: 'Could not create export API URL' });
    }
};

exports.onExportApiRead = async function (request, response) {
    try {
        const token = String(request.params.token || '');
        if (!isValidToken(token)) {
            return response.status(404).json({ success: false, message: 'Export API URL not found' });
        }

        const form = await FormModel.findOne({ exportApiTokenHash: hashToken(token) })
            .select('_id title description exportApiTokenCreatedAt')
            .lean();
        if (!form) {
            return response.status(404).json({ success: false, message: 'Export API URL is invalid or has been replaced' });
        }

        const responses = await ResponseModel.find({ form: form._id, submit: true })
            .select('answers responder createdAt updatedAt')
            .sort({ createdAt: -1 })
            .populate({ path: 'responder', select: 'name email organization' })
            .populate({ path: 'answers.question' })
            .lean();

        response.set({
            'Cache-Control': 'no-store',
            'Referrer-Policy': 'no-referrer',
            'X-Content-Type-Options': 'nosniff'
        });
        return response.status(200).json({
            success: true,
            data: {
                form: { _id: form._id, title: form.title, description: form.description },
                generatedAt: new Date().toISOString(),
                totalResponses: responses.length,
                responses
            }
        });
    } catch (err) {
        console.error('[response.service.js] export API read failed');
        return response.status(500).json({ success: false, message: 'Could not export responses' });
    }
};

// Helper to parse answers from various formats (string, object, array)
const parseAnswers = (input) => {
    let answers = input;
    if (typeof answers === "string") {
        try {
            answers = JSON.parse(answers);
        } catch (e) {
            answers = [];
        }
    }
    if (!Array.isArray(answers)) {
        if (answers && typeof answers === "object") {
            answers = [answers];
        } else {
            answers = [];
        }
    }
    return answers;
};

exports.onQuery = async function (request, response) {
    try {
        let query = { ...request.body };
        if (query._id) {
            query._id = new mongo.ObjectId(String(query._id));
        }
        const doc = await Response.onQuery(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.error("onQuery Error:", err);
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.onQuerys = async function (request, response) {
    try {
        let query = { ...request.body };
        const doc = await Response.onQuerys(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onCreate = async function (request, response) {
    try {
        let answers = parseAnswers(request.body.answers);

        // Attach files if any
        attachFilesToAnswers(answers, request.files, request.body);

        request.body.answers = answers;

        const form = await loadFormForSubmission(request.body.form);
        const responderEmail = normalizeEmail(request.body.responderEmail);
        request.body.responderEmail = responderEmail || null;
        request.body.responderName = String(request.body.responderName || '').trim() || null;
        if (!request.body.responder) request.body.responder = null;

        if (isSubmitting(request.body)) {
            let accountEmail = '';
            if (request.body.responder) {
                const UserModel = require('../../User/models/user.model');
                const account = await UserModel.findById(request.body.responder).select('email').lean();
                accountEmail = account && account.email;
            }
            const validationError = validateSubmission(form, request.body, answers, {
                responder: request.body.responder,
                email: accountEmail || responderEmail
            });
            if (validationError) return response.status(validationError.status).json({ success: false, ...validationError });
        } else if (!request.body.responder && !(form && form.settings && form.settings.allowPublicResponses)) {
            return response.status(403).json({ success: false, message: 'This form does not accept public responses' });
        }

        // Ensure responder ID is ObjectId if provided
        if (request.body.responder && typeof request.body.responder === 'string') {
            request.body.responder = new mongo.ObjectId(request.body.responder);
        }

        const doc = await Response.onCreate(request.body);
        
        if (isSubmitting(request.body)) sendSubmissionEmail(doc);

        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.error("[response.service.js] onCreate Error:", err);
        if (err && err.code === 11000 && err.keyPattern && err.keyPattern.submissionKey) {
            return response.status(409).json({ success: false, message: 'This respondent has already submitted this form' });
        }
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        if (!request.body._id) {
            return ResMessage.sendResponse(response, 0, 40400, "Response ID is required");
        }

        let query = { _id: new mongo.ObjectId(request.body._id) };

        // Fetch existing response to merge answers
        const existingResponse = await Response.onQuery(query);
        if (!existingResponse) {
            return ResMessage.sendResponse(response, 0, 40400, "Response not found");
        }

        let answers = parseAnswers(request.body.answers);
        attachFilesToAnswers(answers, request.files, request.body);
        if (existingResponse && Array.isArray(existingResponse.answers)) {
            existingResponse.answers.forEach(oldAns => {
                const oldUrl = oldAns?.response;
                if (oldUrl && typeof oldUrl === 'string' && oldUrl.includes('/uploads/')) {
                    const stillExists = answers.some(newAns => newAns.response === oldUrl);
                    if (!stillExists) {
                        cleanUpOrphanedFile(oldUrl);
                    }
                }
            });
        }

        // Directly overwrite answers because the frontend sends the complete list on every save
        request.body.answers = answers;

        const formId = request.body.form || (existingResponse.form && (existingResponse.form._id || existingResponse.form));
        const form = await loadFormForSubmission(formId);
        if (isSubmitting(request.body)) {
            const responder = request.body.responder || (existingResponse.responder && (existingResponse.responder._id || existingResponse.responder));
            const responderEmail = normalizeEmail(request.body.responderEmail || existingResponse.responderEmail);
            let accountEmail = '';
            if (responder) {
                const UserModel = require('../../User/models/user.model');
                const account = await UserModel.findById(responder).select('email').lean();
                accountEmail = account && account.email;
            }
            request.body.responderEmail = responderEmail || null;
            const validationError = validateSubmission(form, request.body, answers, { responder, email: accountEmail || responderEmail });
            if (validationError) return response.status(validationError.status).json({ success: false, ...validationError });
        }

        const doc = await Response.onUpdate(query, request.body);

        if (isSubmitting(request.body) && !existingResponse.submit) sendSubmissionEmail(doc);

        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        if (err && err.code === 11000 && err.keyPattern && err.keyPattern.submissionKey) {
            return response.status(409).json({ success: false, message: 'This respondent has already submitted this form' });
        }
        console.error("[response.service.js] onUpdate Error:", err);
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onDelete = async function (request, response) {
    try {
        let query = {};
        query._id = new mongo.ObjectId(request.body._id);

        const existingResponse = await Response.onQuery(query);
        const doc = await Response.onDelete(query);

        // Wipe all files associated with this response since it was completely deleted
        if (existingResponse && Array.isArray(existingResponse.answers)) {
            existingResponse.answers.forEach(ans => cleanUpOrphanedFile(ans?.response));
        }

        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};
