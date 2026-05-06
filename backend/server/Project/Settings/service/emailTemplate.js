var mongo = require('mongodb');
var EmailTemplate = require('../controller/emailTemplate');
const resMsg = require("../service/message");

exports.onQuery = async function (request, response, next) {
    try {
        var query = {};
        if (request.query.id) {
            query._id = new mongo.ObjectId(request.query.id);
        }
        const doc = await EmailTemplate.onQuery(query);
        var resData = await resMsg.onMessage_Response(0, 20000)
        resData.data = doc
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0, 40400)
        response.status(404).json(resData);
    }
};

exports.onQuerys = async function (request, response, next) {
    try {
        var querys = {};
        const doc = await EmailTemplate.onQuerys(querys);
        var resData = await resMsg.onMessage_Response(0, 20000)
        resData.data = doc
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0, 40400)
        response.status(404).json(resData);
    }
};

exports.onCreate = async function (request, response, next) {
    try {
        const doc = await EmailTemplate.onCreate(request.body);
        var resData = await resMsg.onMessage_Response(0, 20000)
        resData.data = doc
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0, 40400)
        response.status(404).json(resData);
    }
};

exports.onUpdate = async function (request, response, next) {
    try {
        var query = {}
        if (request.body._id) {
            query._id = new mongo.ObjectId(request.body._id);
            delete request.body._id;
        } else if (request.query.id) {
            query._id = new mongo.ObjectId(request.query.id);
        }

        const doc = await EmailTemplate.onUpdate(query, request.body);
        var resData = await resMsg.onMessage_Response(0, 20000)
        resData.data = doc
        response.status(200).json(resData);
    } catch (err) {
        console.error(err);
        var resData = await resMsg.onMessage_Response(0, 40400)
        response.status(404).json(resData);
    }
};

exports.onDelete = async function (request, response, next) {
    try {
        var query = {};
        query._id = new mongo.ObjectId(request.body.id || request.query.id)
        const doc = await EmailTemplate.onDelete(query);
        var resData = await resMsg.onMessage_Response(0, 20000)
        resData.data = doc
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0, 40400)
        response.status(404).json(resData);
    }
};
