const mongo = require('mongodb');
const Questions = require('../controller/questions');
const ResMessage = require("../../Settings/service/message");
const FormModel = require('../../Form/models/form.model');
const { normalizeQuestionPayload } = require('./question.normalize');

const getApiId = (request) => Number(request?.query?.apiId || request?.body?.apiId) || 0;
const getSuccessCode = (request) => 20000 + getApiId(request);

const checkFormAccess = async (request, formId) => {
    if (!formId || !mongo.ObjectId.isValid(formId)) {
        throw new Error("Valid form ID is required for this operation");
    }

    const form = await FormModel.findById(formId).select('creator collaborator').lean();
    if (!form) {
        throw new Error("Form not found");
    }

    return true;
};


exports.onQuery = async function (request, response) {
    try {
        const query = { _id: new mongo.ObjectId(request.body._id) };

        const doc = await Questions.onQuery(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onQuerys = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] GET /api/v1/question/exp (onQuerys)`);
        const formId = request.body.form || request.query.form;
        if (!formId) {
            return sendResponse(response, getApiId(request), 40000, "Form ID is required to query questions.");
        }
        const querys = { form: new mongo.ObjectId(formId) };
        const doc = await Questions.onQuerys(querys);
        return sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onCreate = async function (request, response) {
    try {
        const payload = await normalizeQuestionPayload(request);
        
        await checkFormAccess(request, payload.form);

        const doc = await Questions.onCreate(payload);
        return sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        const code = 50000;
        return sendResponse(response, getApiId(request), code, err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        const payload = await normalizeQuestionPayload(request);
        const query = { _id: new mongo.ObjectId(payload._id) };

        const existingQuestion = await Questions.onQuery(query);
        if (!existingQuestion) {
            return sendResponse(response, getApiId(request), 40400, "Question not found");
        }

        const targetFormId = payload.form || existingQuestion.form;
        await checkFormAccess(request, targetFormId);

        const doc = await Questions.onUpdate(query, payload);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        
        return sendResponse(response, getApiId(request), code, err.message);
    }
};

exports.onDelete = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] DELETE /api/v1/question (onDelete)`);
        if (!request.body._id || !mongo.ObjectId.isValid(request.body._id)) {
            return sendResponse(response, getApiId(request), 40000, "Valid question _id is required");
        }

        const query = { _id: new mongo.ObjectId(request.body._id) };
        const existingQuestion = await Questions.onQuery(query);
        if (!existingQuestion) {
            return ResMessage.sendResponse(response, getApiId(request), 40400, "Question not found");
        }

        await checkFormAccess(request, existingQuestion.form);

        const doc = await Questions.onDelete(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        const code = 50000;
        return ResMessage.sendResponse(response, getApiId(request), code, err.message);
    }
};