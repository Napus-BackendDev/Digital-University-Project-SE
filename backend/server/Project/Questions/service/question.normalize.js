const { getUploadUrl } = require('../../../../helpers/upload');

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

module.exports = {
    normalizeQuestionPayload
};