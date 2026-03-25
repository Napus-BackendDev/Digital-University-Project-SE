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

exports.onQuery = async function (request, response) {
    try {
        let query = request.body || {};

        const systemFields = ['apiId', 'token', 'user'];
        const cleanQuery = {};
        Object.keys(query).forEach(key => {
            if (!systemFields.includes(key) && query[key] !== undefined) {
                if (key === '_id' || key === 'form' || key === 'responder' || key === 'question') {
                    try {
                        if (mongo.ObjectId.isValid(query[key])) {
                            cleanQuery[key] = new mongo.ObjectId(query[key]);
                        } else {
                            cleanQuery[key] = query[key];
                        }
                    } catch (e) {
                        cleanQuery[key] = query[key];
                    }
                } else {
                    cleanQuery[key] = query[key];
                }
            }
        });

        const doc = await responseService.onQuery(cleanQuery);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc || null);
    } catch (err) {
        console.error("Query response error:", err);
        return ResMessage.sendResponse(response, request.body.apiId, 50000, "Failed to fetch response", err.message);
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

        // Email Notification Logic
        if (request.body.submit === true && !existingResponse.submit) {
            try {
                // Fetch to get form settings and user email
                const formCtrl = require('../../Form/controller/form');
                const userCtrl = require('../../User/controller/user');
                const mailer = require('../../../../helpers/mailer');

                const formInfo = await formCtrl.onQuery({ _id: doc.form });
                if (formInfo && formInfo.settings && formInfo.settings.emailNotifications) {
                    const responderInfo = await userCtrl.onQuery({ _id: doc.responder });
                    if (responderInfo && responderInfo.email) {
                        const titleObj = formInfo.title && formInfo.title.find(t => t.value) || { value: 'Form' };
                        const subject = `Confirmation: ${titleObj.value} Submitted`;
                        const textMessage = formInfo.settings.emailMessage || formInfo.settings.confirmMessage || "Thank you for completing this survey. Your response has been recorded.";
                        
                        await mailer.sendMail(responderInfo.email, subject, textMessage);
                    }
                }
            } catch (mailErr) {
                console.error("Error dispatching email:", mailErr);
            }
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
