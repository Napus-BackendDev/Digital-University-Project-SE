const mongo = require('mongodb');
const moment = require('moment');
const Response = require('../controller/response');
const ResMessage = require("../../Settings/service/message");
const sentMail = require("../../../../helpers/google/Mail");
const { attachFilesToAnswers, cleanUpOrphanedFile } = require('./utils/utils');
const { buildSubmissionConfirmationHtml, buildSubmissionConfirmationText } = require('../../Email/templates/submissionConfirmation');

// Helper to extract title from localized array
const getFormTitle = (form) => {
    if (!form || !form.title || !Array.isArray(form.title) || form.title.length === 0) return 'Untitled Form';
    const enTitle = form.title.find(t => t.key === 'en');
    const thTitle = form.title.find(t => t.key === 'th');
    return enTitle ? enTitle.value : (thTitle ? thTitle.value : form.title[0].value);
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

        // Ensure responder ID is ObjectId if provided
        if (request.body.responder && typeof request.body.responder === 'string') {
            request.body.responder = new mongo.ObjectId(request.body.responder);
        }

        const doc = await Response.onCreate(request.body);
        
        const isSubmitting = String(request.body.submit) === 'true';
        
        // Use professional template for email notification if submitted immediately
        if (isSubmitting && doc.responder && doc.responder.email) {
            const formTitle = getFormTitle(doc.form);
            const emailMessage = doc.form?.settings?.emailMessage || '';
            const responderName = doc.responder.name || 'Student';
            const submittedAt = moment(doc.createdAt).format('DD MMM YYYY, HH:mm');

            const emailHtml = buildSubmissionConfirmationHtml({
                name: responderName,
                formTitle: formTitle,
                submittedAt: submittedAt,
                referenceNo: String(doc._id),
                emailMessage: emailMessage
            });

            const emailText = buildSubmissionConfirmationText({
                name: responderName,
                formTitle: formTitle,
                submittedAt: submittedAt,
                referenceNo: String(doc._id),
                emailMessage: emailMessage
            });

            sentMail.sendMail(
                doc.responder.email, 
                `Submission Confirmation: ${formTitle}`, 
                emailText, 
                emailHtml
            ).catch(e => console.error("Email send failed:", e));
        }

        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.error("[response.service.js] onCreate Error:", err);
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

        const doc = await Response.onUpdate(query, request.body);

        const isSubmitting = String(request.body.submit) === 'true';
        
        // Use professional template for email notification if freshly submitted
        if (isSubmitting && !existingResponse.submit && doc.responder && doc.responder.email) {
            const formTitle = getFormTitle(doc.form);
            const emailMessage = doc.form?.settings?.emailMessage || '';
            const responderName = doc.responder.name || 'Student';
            const submittedAt = moment(doc.updatedAt || doc.createdAt).format('DD MMM YYYY, HH:mm');

            const emailHtml = buildSubmissionConfirmationHtml({
                name: responderName,
                formTitle: formTitle,
                submittedAt: submittedAt,
                referenceNo: String(doc._id),
                emailMessage: emailMessage
            });

            const emailText = buildSubmissionConfirmationText({
                name: responderName,
                formTitle: formTitle,
                submittedAt: submittedAt,
                referenceNo: String(doc._id),
                emailMessage: emailMessage
            });

            sentMail.sendMail(
                doc.responder.email, 
                `Submission Confirmation: ${formTitle}`, 
                emailText, 
                emailHtml
            ).catch(e => console.error("Email send failed:", e));
        }

        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
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
