const mongo = require('mongodb');
const path = require('path');
const Questions = require('../controller/questions');
const ResMessage = require("../../Settings/service/message");
const { getApiId,getSuccessCode } = require("../../../../helpers/apiUtils");
const { getUploadUrl}= require("../../../../helpers/upload");
const parseMaybeJson = function (value) {
    if (typeof value !== 'string') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch (err) {
        return value;
    }
};

const isDataUri = function (value) {
    return typeof value === 'string' && value.startsWith('data:');
};
const normalizeQuestionPayload = async function (request) {
    const rawBody = parseMaybeJson(request.body) || {};
    const body = parseMaybeJson(rawBody.payload) || rawBody;

    body.title = parseMaybeJson(body.title) || body.title;
    body.description = parseMaybeJson(body.description) || body.description;
    body.form = parseMaybeJson(body.form) || body.form;
    body.type = parseMaybeJson(body.type) || body.type;
    body.order = parseMaybeJson(body.order) || body.order;
    body.isRequired = parseMaybeJson(body.isRequired) || body.isRequired;
    body.nextQuestion = parseMaybeJson(body.nextQuestion) || body.nextQuestion;
    body.config = parseMaybeJson(body.config) || {};

    if (isDataUri(body.config.image)) {
        throw new Error('Base64 image is not allowed. Please upload image file instead.');
    }

    if (request.file) {
        const uploadedUrl = getUploadUrl(request.file);
        if (uploadedUrl) {
            body.config.image = uploadedUrl;
        }
    }

    return body;
};

exports.onQuery = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] POST /api/v1/question/get (onQuery)`);
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
        const querys = {};
        const doc = await Questions.onQuerys(querys);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onCreate = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] POST /api/v1/question (onCreate)`);
        const payload = await normalizeQuestionPayload(request);
        const doc = await Questions.onCreate(payload);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] PUT /api/v1/question (onUpdate)`);
        const payload = await normalizeQuestionPayload(request);
        const query = { _id: new mongo.ObjectId(payload._id) };
        const doc = await Questions.onUpdate(query, payload);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onDelete = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] DELETE /api/v1/question (onDelete)`);
        const query = { _id: new mongo.ObjectId(request.body._id) };
        const doc = await Questions.onDelete(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};