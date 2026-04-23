const mongo = require('mongodb');
const Question = require('../controller/questions');
const ResMessage = require("../../Settings/service/message");
const { getUploadUrl } = require('../../../../helpers/upload');

exports.onQuery = async function (request, response) {
    try {
        let query = {};
        const doc = await Question.onQuery(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onQuerys = async function (request, response) {
    try {
        let query = {};
        const doc = await Question.onQuerys(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onCreate = async function (request, response) {
    try {
        let body = request.body || {};
        if (body.payload && typeof body.payload === 'string') {
            try { body = { ...body, ...JSON.parse(body.payload) }; } catch (e) { /* keep original body */ }
        }

        if (request.file) {
            const imagePath = getUploadUrl(request.file);
            if (imagePath) {
                if (!body.config || typeof body.config !== 'object') body.config = {};
                body.config.image = imagePath;
            }
        }

        const doc = await Question.onCreate(body);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        let body = request.body || {};
        if (body.payload && typeof body.payload === 'string') {
            try { body = { ...body, ...JSON.parse(body.payload) }; } catch (e) { /* keep original body */ }
        }

        let query = {};
        query._id = new mongo.ObjectId(body._id);

        if (request.file) {
            const imagePath = getUploadUrl(request.file);
            if (imagePath) {
                if (!body.config || typeof body.config !== 'object') body.config = {};
                body.config.image = imagePath;
            }
        }

        const doc = await Question.onUpdate(query, body);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.error(err);
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onDelete = async function (request, response) {
    try {
        let query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Question.onDelete(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};
