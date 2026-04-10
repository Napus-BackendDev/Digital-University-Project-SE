const mongo = require("mongodb");
const responseService = require("../controller/response");
const ResMessage = require("../../Settings/service/message");
const { isSubmitted, maybeSendSubmissionConfirmation } = require("../../Email/service/submission");
const { mapResponseDto, mapResponseListDto } = require("../dto/response.dto");
const { attachFilesToAnswers } = require("./utils/utils.response");
const { getApiId,getSuccessCode}= require("../../../../helpers/apiUtils")
require("../../Questions/models/questions.model");
require("../../Settings/models/question_type.model");
require("../../User/models/user.model");

exports.onQuerys = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] GET /api/v1/response/exp (onQuerys)`);
        const docs = await responseService.onQuerys({});
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseListDto(docs || []));
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onQuery = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] POST /api/v1/response/get (onQuery)`);
        const body = request.body || {};

        // If _id is requested, return one document. Otherwise return list by filter.
        if (body._id) {
            if (!mongo.ObjectId.isValid(body._id)) {
                return ResMessage.sendResponse(response, getApiId(request), 40000, "Invalid Response ID format");
            }

            const doc = await responseService.onQuery({ _id: new mongo.ObjectId(String(body._id)) });
            if (!doc) {
                return ResMessage.sendResponse(response, getApiId(request), 40400, "Response not found");
            }

            return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseDto(doc));
        }

        const query = { ...body };
        

        const docs = await responseService.onQuerys(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseListDto(docs || []));
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onCreate = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] POST /api/v1/response (onCreate)`);

        let answers = request.body.answers || request.body["answers"];
        if (typeof answers === "string") {
            try {
                answers = JSON.parse(answers);
            } catch (e) {
                answers = [];
            }
        }
        if (!Array.isArray(answers)) {
            const singleQ = request.body["answers[question]"] || request.body["answers[0][question]"];
            const singleR = request.body["answers[response]"] || request.body["answers[0][response]"];
            if (singleQ || singleR) {
                answers = [{ question: singleQ || null, response: singleR || null }];
            } else if (answers && typeof answers === "object") {
                answers = [answers];
            } else {
                answers = [];
            }
        }

        attachFilesToAnswers(answers, request.files, request.body);

        request.body.answers = answers;
        const doc = await responseService.onCreate(request.body);

        await maybeSendSubmissionConfirmation({
            shouldSend: isSubmitted(request.body.submit),
            doc,
            body: request.body,
            logLabel: "on create",
        });

        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseDto(doc));
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] PUT /api/v1/response (onUpdate)`);

        if (!request.body._id) {
            return ResMessage.sendResponse(response, getApiId(request), 40000, "Response ID is required");
        }
        if (!mongo.ObjectId.isValid(request.body._id)) {
            return ResMessage.sendResponse(response, getApiId(request), 40000, "Invalid Response ID format");
        }

        const query = { _id: new mongo.ObjectId(String(request.body._id)) };

        // Fetch existing response to merge answers instead of replacing
        const existingResponse = await responseService.onQuery(query);
        if (!existingResponse) {
            return ResMessage.sendResponse(response, getApiId(request), 40400, "Response not found");
        }

        let answers = request.body.answers || request.body["answers"];
        if (typeof answers === "string") {
            try {
                answers = JSON.parse(answers);
            } catch (e) {
                answers = [];
            }
        }
        if (!Array.isArray(answers)) {
            const singleQ = request.body["answers[question]"] || request.body["answers[0][question]"];
            const singleR = request.body["answers[response]"] || request.body["answers[0][response]"];
            if (singleQ || singleR) {
                answers = [{ question: singleQ || null, response: singleR || null }];
            } else if (answers && typeof answers === "object") {
                answers = [answers];
            } else {
                answers = [];
            }
        }
        attachFilesToAnswers(answers, request.files, request.body);

        const mergedAnswers = [...(existingResponse.answers || [])];
        answers.forEach((newAns) => {
            const existingIndex = mergedAnswers.findIndex((oldAns) => {
                return oldAns.question && newAns.question &&
                    String(oldAns.question._id || oldAns.question) === String(newAns.question);
            });

            if (existingIndex !== -1) {
                mergedAnswers[existingIndex].response = newAns.response;
                return;
            }

            mergedAnswers.push({ question: newAns.question, response: newAns.response });
        });
        request.body.answers = mergedAnswers;

        const doc = await responseService.onUpdate(query, request.body);
        if (!doc) {
            return ResMessage.sendResponse(response, getApiId(request), 40400, "Response not found after update");
        }

        await maybeSendSubmissionConfirmation({
            shouldSend: isSubmitted(request.body.submit) && !existingResponse.submit,
            doc,
            body: request.body,
            fallback: existingResponse,
            logLabel: "on update",
        });

        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseDto(doc));
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};

exports.onDelete = async function (request, response) {
    try {
        console.log(`[API ${getApiId(request)}] DELETE /api/v1/response (onDelete)`);

        // Check body, query, and params for the ID to be resilient.
        const idStr = (request.body && (request.body._id || request.body.id)) ||
            (request.query && (request.query._id || request.query.id)) ||
            (request.params && (request.params._id || request.params.id));

        if (!idStr) {
            return ResMessage.sendResponse(response, getApiId(request), 40000, "Response ID is required");
        }

        if (!mongo.ObjectId.isValid(idStr)) {
            return ResMessage.sendResponse(response, getApiId(request), 40000, "Invalid Response ID format");
        }

        const query = { _id: new mongo.ObjectId(String(idStr)) };
        const doc = await responseService.onDelete(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
};
