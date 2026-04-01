const mongo = require('mongodb');
const path = require('path');
const Questions = require('../controller/questions');
const ResMessage = require("../../Settings/service/message");

const getApiId = function (request) {
    return Number(request.query.apiId || request.body.apiId) || 0;
};

const getSuccessCode = function (request) {
    return 20000 + getApiId(request);
};

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
        const query = { _id: new mongo.ObjectId(request.body._id) };

        const doc = await Questions.onQuery(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onQuerys = async function (request, response) {
    try {
        const querys = {};
        const doc = await Questions.onQuerys(querys);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onCreate = async function (request, response) {
    try {
        const payload = await normalizeQuestionPayload(request);
        const doc = await Questions.onCreate(payload);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
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
        const query = { _id: new mongo.ObjectId(request.body._id) };
        const doc = await Questions.onDelete(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};