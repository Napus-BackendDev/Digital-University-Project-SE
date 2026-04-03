const mongo = require("mongodb");
const path = require("path");
const responseService = require("../controller/response");
const ResMessage = require("../../Settings/service/message");
const { isSubmitted, maybeSendSubmissionConfirmation } = require("../../Email/service/submission");
const { mapResponseDto, mapResponseListDto } = require("../dto/response.dto");
require("../../Questions/models/questions.model");
require("../../Settings/models/question_type.model");
require("../../User/models/user.model");

// ====================================
// Helper: Build clean query from request body
// ====================================
const buildCleanQuery = (body = {}) => {
    const systemFields = ['apiId', 'token', 'user', 'form_id', 'responder_id', 'question_id'];
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
        console.log(`[API ${getApiId(request)}] GET /api/v1/response/exp (onQuerys)`);
        const querys = {};
        const doc = await responseService.onQuerys(querys);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseListDto(doc));
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
}

exports.onQuery = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] POST /api/v1/response/get (onQuery)`);
        const cleanQuery = buildCleanQuery(request.body || {});

        // If _id is requested, return single document. Otherwise return list by filter.
        if (cleanQuery._id) {
            const doc = await responseService.onQuery(cleanQuery);

            if (!doc) {
                return ResMessage.sendResponse(response, getApiId(request), 40400, "Response not found");
            }

            return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseDto(doc));
        }

        const docs = await responseService.onQuerys(cleanQuery);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseListDto(docs || []));
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onCreate = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] POST /api/v1/response (onCreate)`);
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
        
        const shouldSendConfirmation = isSubmitted(request.body.submit);
        await maybeSendSubmissionConfirmation({
            shouldSend: shouldSendConfirmation,
            doc,
            body: request.body,
            logLabel: 'on create'
        });

        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseDto(doc));
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] PUT /api/v1/response (onUpdate)`);
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

        await maybeSendSubmissionConfirmation({
            shouldSend: isSubmitted(request.body.submit) && !existingResponse.submit,
            doc,
            body: request.body,
            fallback: existingResponse,
            logLabel: 'on update'
        });

        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseDto(doc));
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onDelete = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] DELETE /api/v1/response (onDelete)`);
        // Check body, query, and params for the ID to be more resilient
        const idStr = (request.body && (request.body._id || request.body.id)) || 
                      (request.query && (request.query._id || request.query.id)) || 
                      (request.params && (request.params._id || request.params.id));

        if (!idStr) {
            return ResMessage.sendResponse(response, getApiId(request), 40000, "Response ID is required");
        }

        if (!mongo.ObjectId.isValid(idStr)) {
            return ResMessage.sendResponse(response, getApiId(request), 40000, "Invalid Response ID format");
        }

        const query = { _id: new mongo.ObjectId(idStr) };
        const doc = await responseService.onDelete(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        console.error("CRITICAL DELETE ERROR:", err);
        // Fallback to a plain response if ResMessage or other logic is failing
        return response.status(500).json({
            code: 50000,
            httpcode: 500,
            message: "Internal Server Error during deletion",
            error: err.message
        });
    }
};
