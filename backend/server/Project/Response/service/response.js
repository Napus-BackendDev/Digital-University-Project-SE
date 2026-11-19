const mongo = require('mongodb');
const moment = require('moment');
const Response = require('../controller/response');
const ResponseModel = require('../models/response.model');
const FormModel = require('../../Form/models/form.model');
const UserModel = require('../../User/models/user.model');
const OrganizationModel = require('../../Organizations/models/organization.model');
const RolesModel = require('../../User/models/roles.model');
const ResMessage = require("../../Settings/service/message");
const { buildFormExportPayload, resolveServerOrigin } = require('../utils/exportPayload');
const { buildAnalyticsExportPayload } = require('../utils/analyticsExport');
const dynamicEmail = require('../../Email/service/dynamicEmail');
const { attachFilesToAnswers, cleanUpOrphanedFile, extractUploadUrls } = require('./utils/utils');
const { getUploadUrl } = require('../../../../helpers/upload');
const {
    getFormTitle,
    buildFormLink,
    isValidEmail,
    resolveFormContactInfo
} = require('../../Email/service/email.utils');
const {
    toIdString,
    isValidObjectId,
    normalizeGuestSessionId,
    normalizeMaxResponses,
    isAdminUser,
    canUserManageOrViewForm,
    buildManagedFormsQuery,
    resolveRequestIdentity,
    resolveReadScopeUserId,
    validateResponseMutation
} = require('../utils/responsePolicy');

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

function parseFilterQuery(raw = {}) {
    const query = { ...raw };
    delete query.apiId;
    delete query.userId;

    ['_id', 'form', 'responder'].forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(query, key)) return;
        const val = query[key];
        if (val === 'null' || val === null || val === '') {
            query[key] = null;
        } else if (typeof val === 'string' && isValidObjectId(val)) {
            query[key] = new mongo.ObjectId(val);
        }
    });

    if (Object.prototype.hasOwnProperty.call(query, 'submit')) {
        if (query.submit === 'true' || query.submit === true) query.submit = true;
        else if (query.submit === 'false' || query.submit === false) query.submit = false;
    }

    if (Object.prototype.hasOwnProperty.call(query, 'guestSessionId')) {
        query.guestSessionId = normalizeGuestSessionId(query.guestSessionId);
    }

    return query;
}

function formatCustomEmailMessage(template, variables) {
    if (!template || typeof template !== 'string') return '';
    return template
        .replace(/\{\{\s*UserName\s*\}\}|\{name\}/gi, variables.UserName || '')
        .replace(/\{\{\s*Responder\s*\}\}|\{responder\}/gi, variables.Responder || '')
        .replace(/\{\{\s*Email\s*\}\}|\{email\}/gi, variables.ResponderEmail || '')
        .replace(/\{\{\s*FormName\s*\}\}|\{form\}/gi, variables.FormName || '');
}

function cleanupUploadedRequestFiles(files) {
    if (!Array.isArray(files) || files.length === 0) return;
    files.forEach((f) => cleanUpOrphanedFile(getUploadUrl(f)));
}

const formWriteQueues = new Map();

/**
 * Serializes response mutations per form within this Node process so concurrent
 * quota checks (`maxResponses`) and single-response checks cannot race past countDocuments.
 */
async function runWithFormLock(formId, task) {
    const key = isValidObjectId(formId) ? toIdString(formId) : '';
    if (!key) return task();

    const prev = formWriteQueues.get(key) || Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
        release = resolve;
    });
    const tail = prev.catch(() => {}).then(() => current);
    formWriteQueues.set(key, tail);

    await prev.catch(() => {});
    try {
        return await task();
    } finally {
        release();
        if (formWriteQueues.get(key) === tail) {
            formWriteQueues.delete(key);
        }
    }
}

async function evaluateMutationPolicy({ request, formId, isSubmitting, existingResponse = null }) {
    const resolvedFormId = toIdString(formId || (existingResponse && existingResponse.form));
    if (!isValidObjectId(resolvedFormId)) {
        return {
            allowed: false,
            code: 40000,
            reason: 'INVALID_FORM_ID',
            message: 'Valid form ID is required.'
        };
    }

    const formDoc = await FormModel.findById(resolvedFormId)
        .populate({
            path: 'creator',
            select: 'name email organization',
            populate: { path: 'organization', select: 'title' }
        })
        .populate('organization', 'title')
        .populate('settings.allowedRoles', 'title')
        .lean();

    if (!formDoc) {
        return {
            allowed: false,
            code: 40400,
            reason: 'FORM_NOT_FOUND',
            message: 'Form not found.'
        };
    }

    const identity = resolveRequestIdentity({ request, body: request.body || {} });

    let userDoc = null;
    if (identity.userId && isValidObjectId(identity.userId)) {
        userDoc = await UserModel.findById(identity.userId).populate('role', 'title').lean();
    }

    let alreadySubmittedResponse = null;
    if (formDoc.settings && formDoc.settings.limitResponse) {
        if (identity.userId) {
            alreadySubmittedResponse = await ResponseModel.findOne({
                form: formDoc._id,
                responder: new mongo.ObjectId(identity.userId),
                submit: true
            }).select('_id submit responder guestSessionId').lean();
        } else if (identity.guestSessionId) {
            alreadySubmittedResponse = await ResponseModel.findOne({
                form: formDoc._id,
                responder: null,
                guestSessionId: identity.guestSessionId,
                submit: true
            }).select('_id submit responder guestSessionId').lean();
        }
    }

    const submittedCount = normalizeMaxResponses(formDoc.settings && formDoc.settings.maxResponses) !== null
        ? await ResponseModel.countDocuments({
            form: formDoc._id,
            submit: true
        })
        : 0;

    const policy = validateResponseMutation({
        form: formDoc,
        identity,
        isSubmitting,
        existingResponse,
        alreadySubmittedResponse,
        submittedCount,
        userDoc,
        now: new Date()
    });

    return {
        ...policy,
        formDoc,
        identity,
        userDoc
    };
}

async function sendPostSubmissionNotifications({ formDoc, doc, isInitialSubmission }) {
    if (!isInitialSubmission || !formDoc || !doc) return;

    const settings = formDoc.settings || {};
    const formTitle = getFormTitle(formDoc);
    const submittedAt = moment(doc.updatedAt || doc.createdAt).format('DD MMM YYYY, HH:mm');
    const responderEmail = doc.responder && doc.responder.email ? doc.responder.email : '';
    const responderName = (doc.responder && (doc.responder.name || doc.responder.email)) || 'Anonymous (Guest)';
    const formOwnerId = formDoc.creator && (formDoc.creator._id || formDoc.creator);
    const { contactOrganization, contactEmail } = resolveFormContactInfo(formDoc);
    const ownerOption = {
        ...(formOwnerId ? { ownerId: String(formOwnerId) } : {}),
        ...(contactOrganization ? { contactOrganization } : {}),
        ...(contactEmail ? { contactEmail, replyTo: contactEmail } : {})
    };

    if (settings.emailNotifications === true && isValidEmail(responderEmail)) {
        const baseVars = {
            UserName: responderName,
            Responder: responderName,
            ResponderEmail: responderEmail,
            FormName: formTitle,
            FormURL: buildFormLink(formDoc._id, 'fill'),
            Organization: contactOrganization || 'Digital University',
            ContactOrganization: contactOrganization || '',
            ContactEmail: contactEmail || '',
            SubmittedAt: submittedAt,
            ReferenceNo: String(doc._id)
        };
        const customEmailMessage = formatCustomEmailMessage(settings.emailMessage, baseVars);
        const variables = {
            ...baseVars,
            EmailMessage: customEmailMessage
        };

        dynamicEmail.sendDynamicEmail('submissionConfirmation', variables, responderEmail, ownerOption)
            .catch(e => console.error("Dynamic Email send failed:", e));
    }

    const creatorEmail = formDoc.creator && formDoc.creator.email ? formDoc.creator.email : '';
    if (settings.notifyCreator === true && isValidEmail(creatorEmail)) {
        const creatorVars = {
            UserName: (formDoc.creator && formDoc.creator.name) || 'Form Creator',
            Responder: responderName,
            FormName: formTitle,
            FormTitle: formTitle,
            FormURL: buildFormLink(formDoc._id, 'fill'),
            ManageURL: buildFormLink(formDoc._id, 'manage'),
            DashboardLink: buildFormLink(formDoc._id, 'manage'),
            ContactOrganization: contactOrganization || '',
            ContactEmail: contactEmail || '',
            SubmittedAt: submittedAt,
            ReferenceNo: String(doc._id)
        };

        dynamicEmail.sendDynamicEmail('creatorNotification', creatorVars, creatorEmail, ownerOption)
            .catch(e => console.error("Creator notification email failed:", e));
    }
}

exports.onQuery = async function (request, response) {
    try {
        let query = parseFilterQuery(request.body || {});
        const doc = query._id ? await Response.onQuery(query) : await Response.onQuerys(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.error("onQuery Error:", err);
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.onQuerys = async function (request, response) {
    try {
        const merged = { ...(request.query || {}), ...(request.body || {}) };
        const query = parseFilterQuery(merged);

        // Allow unauthenticated guest respondents to fetch ONLY their own draft/submission for a specific form
        const isGuestSelfLookup = Boolean(
            query.form &&
            query.responder === null &&
            query.guestSessionId
        );
        if (isGuestSelfLookup) {
            const doc = await Response.onQuerys(query);
            return ResMessage.sendResponse(response, 0, 20000, doc);
        }

        const fallbackId = merged.userId || (query.form && isValidObjectId(merged.responder) ? merged.responder : null);
        const { userId: callerId } = resolveReadScopeUserId({ request, fallbackId });
        if (!callerId) {
            return ResMessage.sendResponse(response, 0, 40100);
        }

        const callerDoc = await UserModel.findById(callerId)
            .populate('role')
            .select('_id organization role')
            .lean();
        if (!callerDoc) {
            return ResMessage.sendResponse(response, 0, 40400);
        }

        if (!isAdminUser(callerDoc)) {
            const isSignedInSelfLookup = Boolean(query.form && toIdString(query.responder) === callerId);
            if (!isSignedInSelfLookup) {
                if (query.form) {
                    const formDoc = await FormModel.findById(query.form)
                        .select('_id creator collaborator')
                        .lean();
                    if (!formDoc || !canUserManageOrViewForm(formDoc, callerDoc)) {
                        return ResMessage.sendResponse(response, 0, 40300);
                    }
                } else {
                    const managedQuery = buildManagedFormsQuery(callerDoc);
                    const managedForms = await FormModel.find(managedQuery || { _id: null })
                        .select('_id')
                        .lean();
                    const allowedFormIds = (managedForms || []).map((f) => f._id);
                    if (allowedFormIds.length === 0) {
                        return ResMessage.sendResponse(response, 0, 20000, []);
                    }
                    query.form = { $in: allowedFormIds };
                }
            }
        }

        const doc = await Response.onQuerys(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onCreate = async function (request, response) {
    const formLockKey = request && request.body ? request.body.form : null;
    return runWithFormLock(formLockKey, async () => {
        try {
            request.body = request.body || {};
            const isSubmitting = String(request.body.submit) === 'true';
            const evaluation = await evaluateMutationPolicy({
                request,
                formId: request.body.form,
                isSubmitting,
                existingResponse: null
            });

            if (!evaluation.allowed) {
                cleanupUploadedRequestFiles(request.files);
                return ResMessage.sendResponse(response, 0, evaluation.code, {
                    reason: evaluation.reason,
                    message: evaluation.message
                });
            }

            let answers = parseAnswers(request.body.answers);
            attachFilesToAnswers(answers, request.files, request.body);

            const payload = {
                ...request.body,
                form: new mongo.ObjectId(toIdString(evaluation.formDoc._id)),
                responder: evaluation.identity.userId ? new mongo.ObjectId(evaluation.identity.userId) : null,
                guestSessionId: evaluation.identity.userId ? null : (evaluation.identity.guestSessionId || null),
                answers,
                submit: isSubmitting
            };

            const doc = await Response.onCreate(payload);
            await sendPostSubmissionNotifications({
                formDoc: evaluation.formDoc,
                doc,
                isInitialSubmission: isSubmitting
            });

            return ResMessage.sendResponse(response, 0, 20000, doc);
        } catch (err) {
            cleanupUploadedRequestFiles(request.files);
            console.error("[response.service.js] onCreate Error:", err);
            return ResMessage.sendResponse(response, 0, 40400);
        }
    });
};

exports.onUpdate = async function (request, response) {
    try {
        request.body = request.body || {};
        if (!request.body._id || !isValidObjectId(request.body._id)) {
            cleanupUploadedRequestFiles(request.files);
            return ResMessage.sendResponse(response, 0, 40000, {
                reason: 'MISSING_RESPONSE_ID',
                message: 'Valid response ID is required.'
            });
        }

        const query = { _id: new mongo.ObjectId(String(request.body._id)) };
        let existingResponse = await Response.onQuery(query);
        if (!existingResponse) {
            cleanupUploadedRequestFiles(request.files);
            return ResMessage.sendResponse(response, 0, 40400, {
                reason: 'RESPONSE_NOT_FOUND',
                message: 'Response not found.'
            });
        }

        const formLockKey = toIdString(existingResponse.form && (existingResponse.form._id || existingResponse.form));
        const hadContention = Boolean(formLockKey && formWriteQueues.has(formLockKey));

        return await runWithFormLock(formLockKey, async () => {
            if (hadContention) {
                existingResponse = await Response.onQuery(query);
                if (!existingResponse) {
                    cleanupUploadedRequestFiles(request.files);
                    return ResMessage.sendResponse(response, 0, 40400, {
                        reason: 'RESPONSE_NOT_FOUND',
                        message: 'Response not found.'
                    });
                }
            }

            const requestedSubmit = Object.prototype.hasOwnProperty.call(request.body, 'submit')
                ? String(request.body.submit) === 'true'
                : Boolean(existingResponse.submit);
            const effectiveSubmit = existingResponse.submit === true ? true : requestedSubmit;

            const evaluation = await evaluateMutationPolicy({
                request,
                formId: existingResponse.form,
                isSubmitting: effectiveSubmit,
                existingResponse
            });

            if (!evaluation.allowed) {
                cleanupUploadedRequestFiles(request.files);
                return ResMessage.sendResponse(response, 0, evaluation.code, {
                    reason: evaluation.reason,
                    message: evaluation.message
                });
            }

            let answers = parseAnswers(request.body.answers);
            attachFilesToAnswers(answers, request.files, request.body);
            if (Array.isArray(existingResponse.answers)) {
                const remainingUrls = new Set();
                answers.forEach((newAns) => {
                    extractUploadUrls(newAns && newAns.response).forEach((u) => remainingUrls.add(u));
                });
                existingResponse.answers.forEach((oldAns) => {
                    extractUploadUrls(oldAns && oldAns.response).forEach((oldUrl) => {
                        if (!remainingUrls.has(oldUrl)) {
                            cleanUpOrphanedFile(oldUrl);
                        }
                    });
                });
            }

            const updatePayload = {
                answers,
                submit: effectiveSubmit
            };

            const doc = await Response.onUpdate(query, updatePayload);
            const isInitialSubmission = effectiveSubmit && !existingResponse.submit;
            await sendPostSubmissionNotifications({
                formDoc: evaluation.formDoc,
                doc,
                isInitialSubmission
            });

            return ResMessage.sendResponse(response, 0, 20000, doc);
        });
    } catch (err) {
        cleanupUploadedRequestFiles(request.files);
        console.error("[response.service.js] onUpdate Error:", err);
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onDelete = async function (request, response) {
    try {
        let query = {};
        const idToDel = request.body?._id || request.params?.id || request.query?._id;
        if (!idToDel || !isValidObjectId(idToDel)) {
            return ResMessage.sendResponse(response, 0, 40000);
        }
        query._id = new mongo.ObjectId(String(idToDel));

        const existingResponse = await Response.onQuery(query);
        const doc = await Response.onDelete(query);

        if (existingResponse && Array.isArray(existingResponse.answers)) {
            existingResponse.answers.forEach(ans => cleanUpOrphanedFile(ans?.response));
        }

        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

/**
 * Single public Export API returning target evaluator status (evaluated vs pending + org breakdown)
 * and individual assessment answers for external system consumption.
 */
exports.onExport = async function (request, response) {
    try {
        const rawFormId = (request.params && request.params.formId) ||
            (request.query && (request.query.formId || request.query.form));
        if (!rawFormId || !isValidObjectId(rawFormId)) {
            return ResMessage.sendResponse(response, 0, 40000, {
                reason: 'INVALID_FORM_ID',
                message: 'A valid formId is required.'
            });
        }

        const formObjectId = new mongo.ObjectId(toIdString(rawFormId));
        const formDoc = await FormModel.findById(formObjectId)
            .populate({ path: 'questions', populate: { path: 'type', select: 'type' } })
            .populate({ path: 'organization', select: 'title' })
            .populate({ path: 'settings.allowedUser', select: '_id name email organization role' })
            .populate({ path: 'settings.allowedRoles', select: '_id title' })
            .populate({ path: 'creator', select: '_id name email' })
            .populate({
                path: 'collaborator',
                populate: [
                    { path: 'user', select: '_id name email' },
                    { path: 'type', select: 'title' }
                ]
            })
            .lean();

        if (!formDoc) {
            return ResMessage.sendResponse(response, 0, 40400, {
                reason: 'FORM_NOT_FOUND',
                message: 'Form not found.'
            });
        }

        const [responses, users, organizations] = await Promise.all([
            ResponseModel.find({ form: formObjectId })
                .populate({
                    path: 'responder',
                    select: '_id name email organization role',
                    populate: [
                        { path: 'organization', select: '_id title' },
                        { path: 'role', select: '_id title' }
                    ]
                })
                .sort({ createdAt: -1 })
                .lean(),
            UserModel.find({})
                .select('_id name email organization role')
                .populate({ path: 'organization', select: '_id title' })
                .populate({ path: 'role', select: '_id title' })
                .lean(),
            OrganizationModel.find({})
                .select('_id title')
                .lean()
        ]);

        const baseUrl = resolveServerOrigin({ request });
        const payload = buildFormExportPayload({
            form: formDoc,
            responses: responses || [],
            users: users || [],
            organizations: organizations || [],
            baseUrl
        });

        return ResMessage.sendResponse(response, 0, 20000, payload);
    } catch (err) {
        console.error('onExport Error:', err);
        return ResMessage.sendResponse(response, 0, 50000, err.message);
    }
};

/**
 * Single public/scoped Analytics Export API returning Overall KPIs + Trend + Breakdown
 * and per-form summary, question statistics, and respondent answers.
 */
exports.onExportAnalytics = async function (request, response) {
    try {
        const q = request.query || {};
        const timeRange = ['1d', '7d', '30d', 'all'].includes(q.timeRange) ? q.timeRange : 'all';
        const orgId = q.orgId ? String(q.orgId) : 'all';
        const status = q.status ? String(q.status) : 'all';
        const searchQuery = q.searchQuery ? String(q.searchQuery) : '';
        const formIds = q.formIds
            ? String(q.formIds).split(',').map((s) => s.trim()).filter(isValidObjectId)
            : [];

        const rawUserId = q.userId || (request.user && (request.user._id || request.user.id));
        let currentUser = null;
        if (rawUserId && isValidObjectId(rawUserId)) {
            currentUser = await UserModel.findById(new mongo.ObjectId(toIdString(rawUserId)))
                .populate({ path: 'role', select: '_id title' })
                .lean();
        } else if (request.user) {
            currentUser = request.user;
        }

        const [forms, responses, users, organizations, roles] = await Promise.all([
            FormModel.find({})
                .populate({ path: 'questions', populate: { path: 'type', select: 'type' } })
                .populate({ path: 'organization', select: 'title' })
                .populate({ path: 'settings.allowedUser', select: '_id name email organization role' })
                .populate({ path: 'settings.allowedRoles', select: '_id title' })
                .populate({ path: 'creator', select: '_id name email' })
                .populate({
                    path: 'collaborator',
                    populate: [
                        { path: 'user', select: '_id name email' },
                        { path: 'type', select: 'title' }
                    ]
                })
                .lean(),
            ResponseModel.find({})
                .populate({
                    path: 'responder',
                    select: '_id name email organization role',
                    populate: [
                        { path: 'organization', select: '_id title' },
                        { path: 'role', select: '_id title' }
                    ]
                })
                .sort({ createdAt: -1 })
                .lean(),
            UserModel.find({})
                .select('_id name email organization role')
                .populate({ path: 'organization', select: '_id title' })
                .populate({ path: 'role', select: '_id title' })
                .lean(),
            OrganizationModel.find({}).select('_id title').lean(),
            RolesModel.find({}).select('_id title').lean()
        ]);

        const baseUrl = resolveServerOrigin({ request });
        const payload = buildAnalyticsExportPayload({
            forms: forms || [],
            responses: responses || [],
            users: users || [],
            organizations: organizations || [],
            roles: roles || [],
            currentUser,
            timeRange,
            orgId,
            status,
            searchQuery,
            formIds,
            baseUrl
        });

        return ResMessage.sendResponse(response, 0, 20000, payload);
    } catch (err) {
        console.error('onExportAnalytics Error:', err);
        return ResMessage.sendResponse(response, 0, 50000, err.message);
    }
};

exports._testables = {
    parseAnswers,
    parseFilterQuery,
    formatCustomEmailMessage,
    evaluateMutationPolicy,
    sendPostSubmissionNotifications
};
