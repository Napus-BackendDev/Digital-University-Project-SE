const mongo = require('mongodb');
const moment = require('moment');
const Response = require('../controller/response');
const ResMessage = require("../../Settings/service/message");
const dynamicEmail = require('../../Email/service/dynamicEmail');
const { attachFilesToAnswers, cleanUpOrphanedFile } = require('./utils/utils');

// Helper to extract title from localized array
const { getFormTitle, buildFormLink } = require('../../Email/service/email.utils');

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
            const responderName = doc.responder.name || 'Student';
            const submittedAt = moment(doc.createdAt).format('DD MMM YYYY, HH:mm');

            const variables = {
                UserName: responderName,
                Responder: responderName,
                FormName: formTitle,
                FormURL: buildFormLink(doc.form?._id),
                Organization: 'Digital University',
                SubmittedAt: submittedAt,
                ReferenceNo: String(doc._id)
            };

            dynamicEmail.sendDynamicEmail('submissionConfirmation', variables, doc.responder.email)
                .catch(e => console.error("Dynamic Email send failed:", e));
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
            const responderName = doc.responder.name || 'Student';
            const submittedAt = moment(doc.updatedAt || doc.createdAt).format('DD MMM YYYY, HH:mm');

            const variables = {
                UserName: responderName,
                Responder: responderName,
                FormName: formTitle,
                FormURL: buildFormLink(doc.form?._id),
                Organization: 'Digital University',
                SubmittedAt: submittedAt,
                ReferenceNo: String(doc._id)
            };

            dynamicEmail.sendDynamicEmail('submissionConfirmation', variables, doc.responder.email)
                .catch(e => console.error("Dynamic Email send failed:", e));
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
