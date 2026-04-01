const mongo = require("mongodb");
const path = require("path");
const responseService = require("../controller/response");
const ResMessage = require("../../Settings/service/message");
const responseModel = require("../models/response.model");
require("../../Questions/models/questions.model");
require("../../../Project/Settings/models/question_type.model");
require("../../../Project/User/models/user.model");

// ====================================
// Helper: Build clean query from request body
// ====================================
const buildCleanQuery = (body = {}) => {
    const systemFields = ['apiId', 'token', 'user', 'form_id', 'responder_id', 'question_id'];
    const aliasMap = { form_id: 'form', responder_id: 'responder', question_id: 'question' };
    const idFields = ['_id', 'form', 'responder', 'question'];
    const cleanQuery = {};

    // Map aliases first (form_id → form, etc.)
    if (body.form_id && !body.form) body.form = body.form_id;
    if (body.responder_id && !body.responder) body.responder = body.responder_id;
    if (body.question_id && !body.question) body.question = body.question_id;

    Object.keys(body).forEach(key => {
        if (systemFields.includes(key) || body[key] === undefined) return;

        if (idFields.includes(key)) {
            try {
                cleanQuery[key] = mongo.ObjectId.isValid(body[key])
                    ? new mongo.ObjectId(body[key])
                    : body[key];
            } catch (e) {
                cleanQuery[key] = body[key];
            }
        } else {
            cleanQuery[key] = body[key];
        }
    });
    return cleanQuery;
};

const getApiId = function (request) {
    return Number(request.query.apiId || request.body.apiId) || 0;
};

const getSuccessCode = function (request) {
    return 20000 + getApiId(request);
};

const toPlainObject = function (doc) {
    if (!doc) return doc;
    return typeof doc.toObject === 'function' ? doc.toObject() : JSON.parse(JSON.stringify(doc));
};

const sanitizeUser = function (user) {
    if (!user) return user;
    const cleanUser = { ...user };
    delete cleanUser.password;
    return cleanUser;
};

const sanitizeResponsePayload = function (doc) {
    if (!doc) return doc;

    const cleanDoc = toPlainObject(doc);

    if (cleanDoc.responder) {
        cleanDoc.responder = sanitizeUser(cleanDoc.responder);
    }

    if (cleanDoc.form) {
        cleanDoc.form = toPlainObject(cleanDoc.form);

        if (cleanDoc.form.creator && typeof cleanDoc.form.creator === 'object') {
            cleanDoc.form.creator = sanitizeUser(cleanDoc.form.creator);
        }

        if (Array.isArray(cleanDoc.form.responses)) {
            cleanDoc.form.responses = cleanDoc.form.responses.map((item) => {
                const cleanItem = toPlainObject(item);
                if (cleanItem && cleanItem.responder) {
                    cleanItem.responder = sanitizeUser(cleanItem.responder);
                }
                return cleanItem;
            });
        }
    }

    return cleanDoc;
};

const sanitizeResponseListPayload = function (docs) {
    if (!Array.isArray(docs)) return docs;
    return docs.map(doc => sanitizeResponsePayload(doc));
};

const getUploadUrl = function (file) {
    if (!file) return null;

    const filePath = file.path || '';
    const normalized = String(filePath).split(path.sep).join('/');
    const marker = '/public/';
    const markerIndex = normalized.lastIndexOf(marker);

    if (markerIndex !== -1) {
        return normalized.slice(markerIndex + '/public'.length);
    }

    if (file.filename) {
        return `/uploads/${file.filename}`;
    }

    return null;
};

// ====================================
// Helper: Attach uploaded files to answers array
// ====================================
const attachFilesToAnswers = function (answers, files, body) {
    if (!files || !files.length) return answers;

    let fileQuestions = body['answers[question]'] || body['answers[0][question]'];
    if (fileQuestions === undefined) fileQuestions = [];
    if (!Array.isArray(fileQuestions)) fileQuestions = [fileQuestions];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadUrl = getUploadUrl(file);
        const questionForFile = fileQuestions[i] || null;
        let attached = false;

        if (questionForFile) {
            for (const ans of answers) {
                if (ans && String(ans.question) === String(questionForFile)) {
                    ans.response = uploadUrl;
                    attached = true;
                    break;
                }
            }
        }

        if (!attached) {
            for (const ans of answers) {
                if (!ans || ans.response === null || ans.response === undefined || ans.response === '') {
                    ans.response = uploadUrl;
                    attached = true;
                    break;
                }
            }
        }

        if (!attached) {
            answers.push({ question: questionForFile || null, response: uploadUrl });
        }
    }

    return answers;
};

exports.onQuerys = async function (request, response) {
    try {
        const querys = {};
        const doc = await responseService.onQuerys(querys);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), sanitizeResponseListPayload(doc));
    } catch (err) {
        console.error("Query responses error:", err);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
}

exports.onQuery = async function (request, response) {
    try {
        const cleanQuery = buildCleanQuery(request.body || {});

        // If _id is requested, return single document. Otherwise return list by filter.
        if (cleanQuery._id) {
            const doc = await responseService.onQuery(cleanQuery);

            if (!doc) {
                return ResMessage.sendResponse(response, getApiId(request), 40400, "Response not found");
            }

            return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), sanitizeResponsePayload(doc));
        }

        const docs = await responseService.onQuerys(cleanQuery);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), sanitizeResponseListPayload(docs || []));
    } catch (err) {
        console.error("Query response error:", err);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onCreate = async function (request, response) {
    try {
        let answers = request.body.answers || request.body['answers'];

        if (typeof answers === 'string') {
            try { answers = JSON.parse(answers); } catch (e) { }
        }

        if (!Array.isArray(answers)) {
            const singleQ = request.body['answers[question]'] || request.body['answers[0][question]'];
            const singleR = request.body['answers[response]'] || request.body['answers[0][response]'];
            if (singleQ || singleR) {
                answers = [{ question: singleQ || null, response: singleR || null }];
            } else if (answers && typeof answers === 'object') {
                answers = [answers];
            } else {
                answers = [];
            }
        }

        attachFilesToAnswers(answers, request.files, request.body);

        request.body.answers = answers;
        const doc = await responseService.onCreate(request.body);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), sanitizeResponsePayload(doc));
    } catch (err) {
        console.error("Create response error:", err);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        const query = { _id: new mongo.ObjectId(request.body._id) };

        // Fetch existing response to merge answers instead of replacing
        const existingResponse = await responseService.onQuery(query);
        if (!existingResponse) {
            return ResMessage.sendResponse(response, getApiId(request), 40400, "Response not found");
        }

        let answers = request.body.answers || request.body['answers'];
        if (typeof answers === 'string') {
            try { answers = JSON.parse(answers); } catch (e) { answers = []; }
        }
        if (!Array.isArray(answers)) answers = answers && typeof answers === 'object' ? [answers] : [];

        // Attach uploaded files to answers
        attachFilesToAnswers(answers, request.files, request.body);

        // Merge answers: update existing answers or add new ones
        const existingAnswers = existingResponse.answers || [];
        const mergedAnswers = [...existingAnswers];

        answers.forEach(newAns => {
            const existingIndex = mergedAnswers.findIndex(
                oldAns => oldAns.question && newAns.question && String(oldAns.question._id || oldAns.question) === String(newAns.question)
            );

            if (existingIndex !== -1) {
                mergedAnswers[existingIndex].response = newAns.response;
            } else {
                mergedAnswers.push({ question: newAns.question, response: newAns.response });
            }
        });

        request.body.answers = mergedAnswers;

        const doc = await responseService.onUpdate(query, request.body);
        if (!doc) {
            return ResMessage.sendResponse(response, getApiId(request), 40400, "Response not found after update");
        }

        // Email Notification on first submit
        if (request.body.submit === true && !existingResponse.submit) {
            try {
                const formCtrl = require('../../Form/controller/form');
                const userCtrl = require('../../User/controller/user');
                const mailer = require('../../../../helpers/mailer');

                const formInfo = await formCtrl.onQuery({ _id: doc.form });
                if (formInfo && formInfo.settings && formInfo.settings.emailNotifications) {
                    const responderInfo = await userCtrl.onQuery({ _id: doc.responder });
                    if (responderInfo && responderInfo.email) {
                        const titleObj = (formInfo.title && formInfo.title.find(t => t.value)) || { value: 'Form' };
                        const subject = `Confirmation: ${titleObj.value} Submitted`;
                        let textMessage = formInfo.settings.emailMessage || formInfo.settings.confirmMessage || 'Thank you for completing this survey. Your response has been recorded.';

                        if (textMessage.includes('{{')) {
                            textMessage = textMessage.replace(/\{\{\s*User\.(\w+)\s*\}\}/gi, (match, field) => {
                                const key = field.toLowerCase();
                                if (key === 'name') return responderInfo.name || match;
                                if (key === 'email') return responderInfo.email || match;
                                return responderInfo[field] !== undefined ? responderInfo[field] : match;
                            });
                        }

                        await mailer.sendMail(responderInfo.email, subject, textMessage);
                    }
                }
            } catch (mailErr) {
                console.error('Error dispatching email:', mailErr);
            }
        }

        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), sanitizeResponsePayload(doc));
    } catch (err) {
        console.error("Update response error:", err);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onDelete = async function (request, response) {
    try {
        const query = { _id: new mongo.ObjectId(request.body._id) };
        const doc = await responseService.onDelete(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), sanitizeResponsePayload(doc));
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};
