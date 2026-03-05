const mongo = require("mongodb");
const responseService = require("../controllers/response");
const ResMessage = require("../../Settings/service/message");
const { Parser } = require('json2csv');

const responseModel = require("../model/response.model");
require("../../Questions/models/questions.model");
require("express-validator/check");

const getApiId = function (request) {
    return Number(request.body.apiId) || 0;
};

const getSuccessCode = function (request) {
    return 20000 + getApiId(request);
};



exports.onGetByFormId = async function (request, response) {
    try {
        let query = {};
        query.form = request.body.form_id;
        const doc = await responseService.onQuerys(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};


exports.onGetById = async function (request, response) {
    try {
        let query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await responseService.onQuery(query);
        if (!doc) {
            return ResMessage.sendResponse(response, getApiId(request), 40400, "Response not found");
        }
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onCreate = async function (request, response) {
    try {
        let { answers } = request.body;
        if (!Array.isArray(answers)) {
            answers = [answers];
        }
        if (request.file) {
            answers = answers.map(ans => ({
                ...ans,
                response: request.file.path
            }));
        }
        request.body.answers = answers;
        const doc = await responseService.onCreate(request.body);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        let query = {}
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await responseService.onUpdate(query, request.body);
        if (!doc) {
            return ResMessage.sendResponse(response, getApiId(request), 40400, "Response not found");
        }
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onDelete = async function (request, response) {
    try {
        let query = {}
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await responseService.onDelete(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onDeleteByFormId = async function (request, response) {
    try {
        let query = {}
        query.form = request.body.form_id;
        const doc = await responseService.onDelete(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

// exports.generateExportLinkByFormAndResponse = async function (request, response) {
//     try {
//         const { formId, _id } = request.body;
//         if (!formId || !mongo.ObjectId.isValid(formId)) {
//             return ResMessage.sendResponse(response, getApiId(request), 40000, "Invalid form ID");
//         }
//         //Need to uncomment for production
//         if (_id && !mongo.ObjectId.isValid(_id)) {
//             return ResMessage.sendResponse(response, getApiId(request), 40000, "Invalid response ID");
//         }
//         let exportLink = `${request.protocol}://${request.get('host')}/api/v1/response/export/${formId}/user/${_id}`;
//         return ResMessage.sendResponse(response, getApiId(request), 20000, {
//             downloadLink: exportLink,
//             formId: formId,
//             responseId: _id
//         });

//     }
//     catch (err) {
//         return ResMessage.sendResponse(response, getApiId(request), 50000, "Failed to generate export link", err.message);
//     }
// };
// exports.generateExportLinkFormId = async function (request, response) {
//     try {
//         const { form_id } = request.body;
//         if (!form_id || !mongo.ObjectId.isValid(form_id)) {
//             return ResMessage.sendResponse(response, getApiId(request), 40000, "Invalid form ID");
//         }

//         const exportLink = `${request.protocol}://${request.get('host')}/api/v1/response/download/${form_id}`;

//         return ResMessage.sendResponse(response, getApiId(request), 20000, {
//             downloadLink: exportLink,
//             formId: form_id
//         });
//     } catch (err) {
//         return ResMessage.sendResponse(response, getApiId(request), 50000, "Failed to generate export link", err.message);
//     }
// };
exports.downloadResponseJSON = async function (request, response) {
    try {
        const { form_id, _id } = request.params;

        if (!form_id || !mongo.ObjectId.isValid(form_id)) {
            return ResMessage.sendResponse(response, getApiId(request), 40000, "Invalid form ID");
        }
        if (_id && !mongo.ObjectId.isValid(_id)) {
            return ResMessage.sendResponse(response, getApiId(request), 40000, "Invalid response ID");
        }

        const query = { form: form_id };
        if (_id) {
            query._id = _id;
        }

        const responses = await responseModel.find(query)
            .populate('form', 'title')
            .populate('answers.question', 'title type config order');

        if (!responses || responses.length === 0) {
            return ResMessage.sendResponse(response, getApiId(request), 40400, "No responses found for the specified criteria");
        }

        const formattedData = {
            formId: form_id,
            formTitle: responses[0]?.form?.title || [],
            totalResponses: responses.length,
            exportedAt: new Date(),
            responses: responses.map(resp => ({
                responseId: resp._id,
                responderId: resp.responder,
                submittedAt: resp.getTimestamp(),
                answers: resp.answers.map(answer => ({
                    question: {
                        id: answer.question?._id,
                        title: answer.question?.title,
                        type: answer.question?.type,
                        order: answer.question?.order
                    },
                    response: answer.response
                }))
            }))
        };

        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Content-Disposition', `attachment; filename="responses_${form_id}_${_id || 'all'}_${Date.now()}.json"`);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), formattedData);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, "Failed to download responses", err.message);
    }
}
exports.downloadFormJSON = async function (request, response) {
    try {
        const { form_id } =  request.params;

        if (!form_id || !mongo.ObjectId.isValid(form_id)) {
            return ResMessage.sendResponse(response, getApiId(request), 40000, "Invalid form ID");
        }

        const responses = await responseModel.find({ form: form_id })
            .populate('form', 'title')
            .populate('answers.question', 'title type config order');

        if (!responses || responses.length === 0) {
            return ResMessage.sendResponse(response, getApiId(request), 40400, "No responses found for the specified form ID");
        }

        const formattedData = {
            formId: form_id,
            formTitle: responses[0]?.form?.title || [],
            totalResponses: responses.length,
            exportedAt: new Date(),
            responses: responses.map(resp => ({
                responseId: resp._id,
                responderId: resp.responder || null,
                submittedAt: resp.submittedAt,
                answers: resp.answers.map(answer => ({
                    question: {
                        id: answer.question?._id,
                        title: answer.question?.title,
                        type: answer.question?.type,
                        order: answer.question?.order
                    },
                    response: answer.response
                }))
            }))
        };

        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Content-Disposition', `attachment; filename="responses_${form_id}_${Date.now()}.json"`);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), formattedData);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, "Failed to download responses", err.message);
    }
};
