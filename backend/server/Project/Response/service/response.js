const mongo = require("mongodb");
const responseService = require("../controller/response");
const ResMessage = require("../../Settings/service/message");
const { isSubmitted, maybeSendSubmissionConfirmation } = require("../../Email/service/submission");
const { mapResponseDto, mapResponseListDto } = require("../dto/response.dto");
const { attachFilesToAnswers } = require("./utils/utils");
const { getApiId,getSuccessCode, getErrorCode}= require("../../../../helpers/apiUtils")

const FormModel = require('../../Form/models/form.model');
const { getDemoAuthUser, isAdminUser } = require('../../../../helpers/authUtils');
const { hasEditorCollaboratorAccess } = require('../../Form/service/form.access');

require("../../Questions/models/questions.model");
require("../../Settings/models/question_type.model");
require("../../User/models/user.model");

const checkResponseAccess = async (request, doc) => {
    const authUser = getDemoAuthUser(request);
    if (!authUser) throw new Error("Unauthorized");
    if (isAdminUser(authUser)) return true;

    // Check if user is the responder
    if (doc.responder && String(doc.responder._id || doc.responder) === String(authUser._id)) {
        return true;
    }

    // Check if user is form owner/editor
    const formId = doc.form?._id || doc.form;
    if (formId) {
        const form = await FormModel.findById(formId).select('creator collaborator').lean();
        if (form) {
            const isCreator = String(form.creator?._id || form.creator || '') === String(authUser._id);
            const isEditor = hasEditorCollaboratorAccess(form, authUser._id);
            if (isCreator || isEditor) return true;
        }
    }

    throw new Error("Forbidden: You do not have permission to access or modify this response");
};

exports.onQuerys = async function (request, response) {
    try {
<<<<<<< HEAD
        console.log(`[API ${getApiId(request)}] GET /api/v1/response/exp (onQuerys)`);
        
        const authUser = getDemoAuthUser(request);
        if (!authUser) {
            return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Unauthorized");
        }

        let query = {};
        if (!isAdminUser(authUser)) {
            // For general users, restrict querying to only their own responses globally
            query = { responder: new mongo.ObjectId(authUser._id) };
        }

        const docs = await responseService.onQuerys(query);
=======
        const docs = await responseService.onQuerys({});
>>>>>>> 85c61afe831f80497f7226c786e833dde151c5f4
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseListDto(docs || []));
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
    }
};

exports.onQuery = async function (request, response) {
    try {
<<<<<<< HEAD
        console.log(`[API ${getApiId(request)}] POST /api/v1/response/get (onQuery)`);
        const body = request.body;
=======
        const body = request.body|| {};
>>>>>>> 85c61afe831f80497f7226c786e833dde151c5f4

        // If _id is requested, return one document. Otherwise return list by filter.
        if (body._id) {
            if (!mongo.ObjectId.isValid(body._id)) {
                return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Invalid Response ID format");
            }

            const doc = await responseService.onQuery({ _id: new mongo.ObjectId(String(body._id)) });
            if (!doc) {
                return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Response not found");
            }

            await checkResponseAccess(request, doc);

            return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseDto(doc));
        }

        const authUser = getDemoAuthUser(request);
        if (!authUser) {
             return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Unauthorized");
        }

        const query = { ...body };
<<<<<<< HEAD
        // If not admin, bind queries to either their own user ID or explicitly check the form access beforehand. 
        if (!isAdminUser(authUser)) {
            if (query.form) {
                const form = await FormModel.findById(query.form).select('creator collaborator').lean();
                const isCreator = String(form?.creator?._id || form?.creator || '') === String(authUser._id);
                const isEditor = form && hasEditorCollaboratorAccess(form, authUser._id);
                if (!isCreator && !isEditor) {
                     query.responder = new mongo.ObjectId(authUser._id);
                }
            } else {
                query.responder = new mongo.ObjectId(authUser._id);
            }
        }
=======
        
>>>>>>> 85c61afe831f80497f7226c786e833dde151c5f4

        const docs = await responseService.onQuerys(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapResponseListDto(docs || []));
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
    }
};

exports.onCreate = async function (request, response) {
    try {
        // console.log(`[API ${getApiId(request)}] POST /api/v1/response (onCreate)`);

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

        const authUser = getDemoAuthUser(request);
        if (authUser && authUser._id) {
            request.body.responder = new mongo.ObjectId(authUser._id);
        }

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
        return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        // console.log(`[API ${getApiId(request)}] PUT /api/v1/response (onUpdate)`);

        if (!request.body._id) {
            return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Response ID is required");
        }
        if (!mongo.ObjectId.isValid(request.body._id)) {
            return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Invalid Response ID format");
        }

        const query = { _id: new mongo.ObjectId(String(request.body._id)) };

        // Fetch existing response to merge answers instead of replacing
        const existingResponse = await responseService.onQuery(query);
        if (!existingResponse) {
            return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Response not found");
        }
        
        await checkResponseAccess(request, existingResponse);

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
            return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Response not found after update");
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
        return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
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
            return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Response ID is required");
        }

        if (!mongo.ObjectId.isValid(idStr)) {
            return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Invalid Response ID format");
        }

        const query = { _id: new mongo.ObjectId(String(idStr)) };
        
        const existingResponse = await responseService.onQuery(query);
        if (!existingResponse) {
             return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Response not found");
        }
        await checkResponseAccess(request, existingResponse);

        const doc = await responseService.onDelete(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        console.error(`[API ${getApiId(request)}] Error:`, err.message);
        return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
    }
};
