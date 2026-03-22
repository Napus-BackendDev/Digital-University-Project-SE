const mongo = require("mongodb");
const responseService = require("../controllers/response");
const ResMessage = require("../../Settings/service/message");
const responseModel = require("../model/response.model");
require("../../Questions/models/questions.model");
require("express-validator/check");

const getApiId = function (request) {
    return Number(request.body.apiId) || 0;
};

const getSuccessCode = function (request) {
    return 20000 + getApiId(request);
};

exports.onQuerys = async function (request, response) {
    try {
        var querys = {};
        const doc = await responseService.onQuerys(querys);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
    }
}

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
        return ResMessage.sendResponse(response, request.body.apiId, 50000, "Failed to fetch response by ID", err.message);
    }
};

exports.onCreate = async function (request, response) {
    try {
        let answers = request.body.answers || request.body['answers'];

        if (typeof answers === 'string') {
            try { answers = JSON.parse(answers); } catch (e) { }
        }

        if (!Array.isArray(answers)) {
            const singleQ = request.body['answers[question]'] || request.body['answers[0][question]'];
            const singleR = request.body['answers[response]'] || request.body['answers[0][response]'];
            if (singleQ || singleR) {
                answers = [{ question: singleQ || null, response: singleR || null }];
            } else if (answers && typeof answers === 'object') {
                answers = [answers];
            } else {
                answers = [];
            }
        }

        if (request.files && request.files.length) {
            let fileQuestions = request.body['answers[question]'] || request.body['answers[0][question]'];
            if (fileQuestions === undefined) fileQuestions = [];
            if (!Array.isArray(fileQuestions)) fileQuestions = [fileQuestions];

            for (let i = 0; i < request.files.length; i++) {
                const file = request.files[i];
                const questionForFile = fileQuestions[i] || null;
                let attached = false;

                if (questionForFile) {
                    for (let ans of answers) {
                        if (ans && String(ans.question) === String(questionForFile)) {
                            ans.response = file.path;
                            attached = true;
                            break;
                        }
                    }
                }

                if (!attached) {
                    for (let ans of answers) {
                        if (!ans || ans.response === null || ans.response === undefined || ans.response === '') {
                            ans.response = file.path;
                            attached = true;
                            break;
                        }
                    }
                }

                if (!attached) {
                    answers.push({ question: questionForFile || null, response: file.path });
                }
            }
        }

        request.body.answers = answers;
        const doc = await responseService.onCreate(request.body);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        console.error("Create response error:", err);
        return ResMessage.sendResponse(response, request.body.apiId, 50000, "Failed to create response", err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        let query = {}
        query._id = new mongo.ObjectId(request.body._id);

        // Fetch existing response to merge answers instead of replacing
        const existingResponse = await responseService.onQuery(query);
        if (!existingResponse) {
            return ResMessage.sendResponse(response, getApiId(request), 40400, "Response not found");
        }

        let answers = request.body.answers || request.body['answers'];
        if (typeof answers === 'string') {
            try { answers = JSON.parse(answers); } catch (e) { answers = []; }
        }
        if (!Array.isArray(answers)) answers = answers && typeof answers === 'object' ? [answers] : [];

        // Attach uploaded files to answers
        if (request.files && request.files.length) {
            let fileQuestions = request.body['answers[question]'] || request.body['answers[0][question]'];
            if (fileQuestions === undefined) fileQuestions = [];
            if (!Array.isArray(fileQuestions)) fileQuestions = [fileQuestions];

            for (let i = 0; i < request.files.length; i++) {
                const file = request.files[i];
                const questionForFile = fileQuestions[i] || null;
                let attached = false;

                if (questionForFile) {
                    for (let ans of answers) {
                        if (ans && String(ans.question) === String(questionForFile)) {
                            ans.response = file.path;
                            attached = true;
                            break;
                        }
                    }
                }

                if (!attached) {
                    for (let ans of answers) {
                        if (!ans || ans.response === null || ans.response === undefined || ans.response === '') {
                            ans.response = file.path;
                            attached = true;
                            break;
                        }
                    }
                }

                if (!attached) {
                    answers.push({ question: questionForFile || null, response: file.path });
                }
            }
        }

        // Merge answers: update existing answers or add new ones
        const existingAnswers = existingResponse.answers || [];
        const mergedAnswers = [...existingAnswers];

        answers.forEach(newAns => {
            const existingIndex = mergedAnswers.findIndex(
                oldAns => oldAns.question && newAns.question && String(oldAns.question._id || oldAns.question) === String(newAns.question)
            );

            if (existingIndex !== -1) {
                // Update existing answer
                mergedAnswers[existingIndex].response = newAns.response;
            } else {
                // Add new answer
                mergedAnswers.push({ question: newAns.question, response: newAns.response });
            }
        });

        request.body.answers = mergedAnswers;

        const doc = await responseService.onUpdate(query, request.body);
        if (!doc) {
            return ResMessage.sendResponse(response, getApiId(request), 40400, "Response not found after update");
        }
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        console.error("Update response error:", err);

        return ResMessage.sendResponse(response, request.body.apiId, 50000, "Failed to update response", err.message);
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

exports.generateExportLinkByFormAndUser = async function (request, response) {
    try {
        const { formId, userId } = request.body;
        if (!formId || !mongo.ObjectId.isValid(formId)) {
            return ResMessage.sendResponse(response, request.body.apiId, 40000, "Invalid form ID");
        }
        //Need to uncomment for production
        if (userId && !mongo.ObjectId.isValid(userId)) {
            return ResMessage.sendResponse(response, request.body.apiId, 40000, "Invalid user ID");
        }
        let exportLink = `${request.protocol}://${request.get('host')}/api/v1/response/export/${formId}/user/${userId}`;
        return ResMessage.sendResponse(response, request.body.apiId, 20000, {
            downloadLink: exportLink,
            formId: formId,
            userId: userId
        });
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

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
        const { form_id } = request.params;

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
                submittedAt: resp.createdAt,
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
