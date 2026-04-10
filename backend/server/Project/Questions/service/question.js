const mongo = require('mongodb');
const path = require('path');
const Questions = require('../controller/questions');
const ResMessage = require("../../Settings/service/message");
const { getApiId,getSuccessCode } = require("../../../../helpers/apiUtils");
const { normalizeQuestionPayload } = require('./question.normalize');
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