const mongo = require('mongodb');
const Questions = require('../controller/questions');
const ResMessage = require("../../Settings/service/message");

exports.onQuery = async function (request, response) {
    try {
        var query = {};
        query._id = new mongo.ObjectId(request.query._id);

        const doc = await Questions.onQuery(query);
        return ResMessage.sendResponse(response, request.body.apiId, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, request.body.apiId, 40400, err.message);
    }
};

exports.onQuerys = async function (request, response) {
    try {
        var querys = {};
        const doc = await Questions.onQuerys(querys);
        return ResMessage.sendResponse(response, request.body.apiId, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, request.body.apiId, 40400, err.message);
    }
};

exports.onCreate = async function (request, response) {
    try {
        const doc = await Questions.onCreate(request.body);
        return ResMessage.sendResponse(response, request.body.apiId, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, request.body.apiId, 40400, err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        var query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Questions.onUpdate(query, request.body);
        return ResMessage.sendResponse(response, request.body.apiId, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, request.body.apiId, 40400, err.message);
    }
};

exports.onDelete = async function (request, response) {
    try {
        var query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Questions.onDelete(query);
        return ResMessage.sendResponse(response, request.body.apiId, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, request.body.apiId, 40400, err.message);
    }
};