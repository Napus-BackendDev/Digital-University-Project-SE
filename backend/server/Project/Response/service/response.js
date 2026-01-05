const mongo = require("mongodb");
const responseService = require("../controllers/response");
const ResMessage = require("../../Settings/service/message");
const { Parser } = require('json2csv');

const responseModel = require("../model/response.model");
const formModel = require("../../Form/models/form.model");
const { Questions } = require("../../Questions/models/questions.model");
const message = require("../../Settings/controller/message");
const { check } = require("express-validator/check");

exports.onQuerys = async function (request, response) {
    try {
        let query = {};
        const doc = await responseService.onQuerys(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to fetch responses",
            error: err.message
        });
    }
}

exports.onGetByFormId = async function (request, response) {
    try {
        let query = {};
        query.form = request.query.form_id;
        const doc = await responseService.onQuerys(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to fetch responses by form ID",
            error: err.message
        });
    }
};
exports.onGetByUserId = async function (request, response) {
    try {
        let query = {};
        query.responder = request.user.id;
        const doc = await responseService.onQuerys(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to fetch responses by user ID",
            error: err.message
        });
    }
};

exports.onGetById = async function (request, response) {
    try {
        let query = {};
        query._id = new mongo.ObjectId(request.query._id);
        const doc = await responseService.onQuery(query);
        if (!doc) {
            return response.status(404).json({
                success: false,
                message: "Response not found"
            });
        }
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to fetch response",
            error: err.message
        });
    }
};

// exports.onExportResponses = async function (request, response) {
//     try {
//         const {form_id} = request.query;
//         if(!form_id|| !mongo.ObjectId.isValid(form_id)){
//             console.log("Invalid form_id");
//             return response.status(400).json({
//                 success: false,
//                 message: "Invalid form ID"
//             });
//         }

//         // Get form
//         const form = await formModel.findById(form_id).lean();
//         if(!form){
//             console.log("Form not found");
//             return response.status(404).json({
//                 success: false,
//                 message: "Form not found"
//             });
//         }

//         // Get responses with populated questions and sub-questions
//         const responses = await responseModel.find({ form: form_id })
//             .populate({
//                 path: 'answers.question',
//                 populate: {
//                     path: 'subQuestion'
//                 }
//             })
//             .lean();

//         if(!responses || responses.length === 0){
//             console.log("No responses found for the form");
//             return response.status(404).json({
//                 success: false,
//                 message: "No responses found for this form"
//             });
//         }

//         // Collect all unique questions (including sub-questions) from responses
//         const questionMap = new Map();
//         responses.forEach(resp => {
//             resp.answers.forEach(answer => {
//                 if (answer.question && answer.question._id) {
//                     const qId = answer.question._id.toString();
//                     if (!questionMap.has(qId)) {
//                         questionMap.set(qId, answer.question);
//                     }

//                     // Add sub-questions if they exist
//                     if (answer.question.subQuestion && Array.isArray(answer.question.subQuestion)) {
//                         answer.question.subQuestion.forEach(subQ => {
//                             if (subQ && subQ._id) {
//                                 const subQId = subQ._id.toString();
//                                 if (!questionMap.has(subQId)) {
//                                     questionMap.set(subQId, subQ);
//                                 }
//                             }
//                         });
//                     }
//                 }
//             });
//         });

//         const questions = Array.from(questionMap.values()).sort((a, b) => (a.order || 0) - (b.order || 0));

//         if(questions.length === 0){
//             console.log("No questions found in responses");
//             return response.status(404).json({
//                 success: false,
//                 message: "No questions found in responses"
//             });
//         }

//         // Prepare CSV headers
//         const questionHeaders = questions.map(q => q.questionText || 'Question');
//         const fields = ['Response ID', 'Responder ID', ...questionHeaders, 'Submitted At'];

//         // Build CSV rows
//         const rows = responses.map(resp => {
//             const answerMap = {};
//             resp.answers.forEach(a => {
//                 if (a.question && a.question._id) {
//                     answerMap[a.question._id.toString()] = a.response;
//                 }
//             });

//             const row = {
//                 'Response ID': resp._id.toString(),
//                 'Responder ID': resp.responder_id ? resp.responder_id.toString() : 'N/A',
//                 'Submitted At': resp.submittedAt || 'N/A'
//             };

//             questions.forEach(q => {
//                 const raw = answerMap[q._id.toString()];
//                 let value = null;
//                 if (raw !== undefined && raw !== null) {
//                     if (Array.isArray(raw)) {
//                         value = raw.join('; ');
//                     } else if (typeof raw === 'object') {
//                         value = JSON.stringify(raw);
//                     } else {
//                         value = String(raw);
//                     }
//                 }
//                 row[q.questionText || 'Question'] = value;
//             });

//             return row;
//         });

//         const parser = new Parser({ fields });
//         const csv = parser.parse(rows);

//         const formTitle = Array.isArray(form.title) && form.title.length > 0 
//             ? (form.title.find(t => t.key === 'en')?.value || form.title[0].value || 'form')
//             : 'form';
//         const safeTitle = formTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

//         response.header('Content-Type', 'text/csv; charset=UTF-8');
//         response.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_responses.csv"`);
//         response.status(200).send(csv);

//     } catch (error) {
//         console.error('Export responses error:', error);
//         return response.status(500).json({ message: 'Error exporting responses', error: error.message });
//     }
// };

exports.onCreate = async function (request, response) {
    try {
        const responseData = {
            ...request.body,
            responder: request.user?.id || null // เปลี่ยนเป็น responder ให้ตรงกับ model
        };
        console.log('Creating response with data:', responseData); // Debug log
        const doc = await responseService.onCreate(responseData);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log('Error in onCreate:', err);
        return response.status(500).json({
            success: false,
            message: "Failed to create response",
            error: err.message
        });
    }
};

exports.onUpdate = async function (request, response) {
    try {
        let query = {}
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await responseService.onUpdate(query, request.body);
        if (!doc) {
            return response.status(404).json({
                success: false,
                message: "Response not found"
            });
        }
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to update response",
            error: err.message
        });
    }
};

exports.onDelete = async function (request, response) {
    try {
        let query = {}
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await responseService.onDelete(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to delete response",
            error: err.message
        });
    }
};
exports.onDeleteByFormId = async function (request, response) {
    try {
        let query = {}
        query.form = request.body.form_id;
        const doc = await responseService.onDelete(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to delete responses by form ID",
            error: err.message
        });
    }
};
exports.generateExportLinkByFormAndUser = async function (request, response) {
    try {
        const { formId, userId } = request.body;
        if (!formId || !mongo.ObjectId.isValid(formId)) {
            return response.status(400).json({
                success: false,
                message: "Invalid form ID"
            });
        }
        //Need to uncomment for production
        // if (userId && !mongo.ObjectId.isValid(userId)) {
        //     return response.status(400).json({
        //         success: false,
        //         message: "Invalid user ID"
        //     });
        // }
        let exportLink = `${request.protocol}://${request.get('host')}/api/v1/response/export/${formId}/user/${userId}`;
        return response.status(200).json({
            success: true,
            message: "Export link generated successfully",
            data: {
                downloadLink: exportLink,
                formId: formId,
                userId: userId || null
            }
        });

    }
    catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to generate export link",
            error: err.message
        });
    }
};
exports.generateExportLinkFormId = async function (request, response) {
    try {
        const { form_id } = request.body;
        if (!form_id || !mongo.ObjectId.isValid(form_id)) {
            return response.status(400).json({
                success: false,
                message: "Invalid form ID"
            });
        }

        const exportLink = `${request.protocol}://${request.get('host')}/api/v1/response/download/${form_id}`;

        return response.status(200).json({
            success: true,
            message: "Export link generated successfully",
            data: {
                downloadLink: exportLink,
                formId: form_id
            }
        });
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to generate export link",
            error: err.message
        });
    }
};
exports.downloadUserJSON = async function (request, response) {
    try {
        const { form_id, user_id } = request.params;

        if (!form_id || !mongo.ObjectId.isValid(form_id)) {
            return response.status(400).json({
                success: false,
                message: "Invalid form ID"
            });
        }
        if (user_id && !mongo.ObjectId.isValid(user_id)) {
            return response.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const query = { form: form_id };
        if (user_id) {
            query.responder = user_id;
        }

        const responses = await responseModel.find(query)
            .populate('form', 'title')
            .populate('answers.question', 'title type config order');

        if (!responses || responses.length === 0) {
            return response.status(404).json({
                success: false,
                message: "No responses found for this form and user"
            });
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
        response.setHeader('Content-Disposition', `attachment; filename="responses_${form_id}_${user_id || 'all'}_${Date.now()}.json"`);
        return response.status(200).send(JSON.stringify(formattedData, null, 2));
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to download responses",
            error: err.message
        });
    }
}
exports.publicDownloadUsersJSON = async function (request, response) {
    try {
        const { form_id } = request.params;

        if (!form_id || !mongo.ObjectId.isValid(form_id)) {
            return response.status(400).json({
                success: false,
                message: "Invalid form ID"
            });
        }

        const responses = await responseModel.find({ form: form_id })
            .populate('form', 'title')
            .populate('answers.question', 'title type config order');

        if (!responses || responses.length === 0) {
            return response.status(404).json({
                success: false,
                message: "No responses found for this form"
            });
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
        return response.status(200).send(JSON.stringify(formattedData, null, 2));

    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to download responses",
            error: err.message
        });
    }
};

exports.onUpdate = async function (request, response) {
    try {
        let query = {}
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await responseService.onUpdate(query, request.body);
        if (!doc) {
            return response.status(404).json({
                success: false,
                message: "Response not found"
            });
        }
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to update response",
            error: err.message
        });
    }
};

exports.onDelete = async function (request, response) {
    try {
        let query = {}
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await responseService.onDelete(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to delete response",
            error: err.message
        });
    }
};
exports.onDeleteByFormId = async function (request, response) {
    try {
        let query = {}
        query.form = request.body.form_id;
        const doc = await responseService.onDelete(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to delete responses by form ID",
            error: err.message
        });
    }
};




