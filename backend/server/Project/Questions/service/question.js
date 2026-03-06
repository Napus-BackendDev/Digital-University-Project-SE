const mongo = require('mongodb');
const Questions = require('../controller/questions');
const ResMessage = require("../../Settings/service/message");

const getApiId = function (request) {
    return Number(request.body.apiId) || 0;
};

const getSuccessCode = function (request) {
    return 20000 + getApiId(request);
};

exports.onQuery = async function (request, response) {
    try {
        var query = {};
        query._id = new mongo.ObjectId(request.query._id);

        const doc = await Questions.onQuery(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
    }
};

exports.onQuerys = async function (request, response) {
    try {
        var querys = {};
        const doc = await Questions.onQuerys(querys);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
    }
};

exports.onCreate = async function (request, response) {
    try {
        const doc = await Questions.onCreate(request.body);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        var query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Questions.onUpdate(query, request.body);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
    }
};

exports.onDelete = async function (request, response) {
    try {
        var query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Questions.onDelete(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
    }
};