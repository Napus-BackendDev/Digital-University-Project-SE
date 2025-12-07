const mongo = require("mongodb");
const responseService = require("../controller/response");
const ResMessage = require("../../Settings/service/message");
const { Parser } = require('json2csv');

const responseModel = require("../models/response.model");
const formModel = require("../../Form/models/form.model");

exports.onQuery = async function (request, response) {
    try {
        let query = {};
        query._id = new mongo.ObjectId(request.query._id);
        const doc = await responseService.onQuery(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.onQueryByUserId = async function (request, response) {
    try {
        let query = {};
        query.responder = request.user.id;
        const doc = await responseService.onQuerys(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.onQueryByFormId = async function (request, response) {
    try {
        let query = {};
        query.form = request.query.form;
        const doc = await responseService.onQuery(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.onQuerys = async function (request, response) {
    try {
        let query = {};
        const doc = await responseService.onQuerys(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
}

exports.onExport = async function (request, response) {
    try {
        const { form } = request.query;
        if (!form || !mongo.ObjectId.isValid(form)) {
            console.log("Invalid form");
            return response.status(400).json({
                success: false,
                message: "Invalid form ID"
            });
        }

        // Get form
        const formData = await formModel.findById(form).lean();
        if (!formData) {
            console.log("Form not found");
            return response.status(404).json({
                success: false,
                message: "Form not found"
            });
        }

        // Get responses with populated questions and sub-questions
        const responses = await responseModel.find({ form: form })
            .populate({
                path: 'answers.question',
                populate: {
                    path: 'subQuestion'
                }
            })
            .lean();

        if (!responses || responses.length === 0) {
            console.log("No responses found for the form");
            return response.status(404).json({
                success: false,
                message: "No responses found for this form"
            });
        }

        // Collect all unique questions (including sub-questions) from responses
        const questionMap = new Map();
        responses.forEach(resp => {
            resp.answers.forEach(answer => {
                if (answer.question && answer.question._id) {
                    const qId = answer.question._id.toString();
                    if (!questionMap.has(qId)) {
                        questionMap.set(qId, answer.question);
                    }

                    // Add sub-questions if they exist
                    if (answer.question.subQuestion && Array.isArray(answer.question.subQuestion)) {
                        answer.question.subQuestion.forEach(subQ => {
                            if (subQ && subQ._id) {
                                const subQId = subQ._id.toString();
                                if (!questionMap.has(subQId)) {
                                    questionMap.set(subQId, subQ);
                                }
                            }
                        });
                    }
                }
            });
        });

        const questions = Array.from(questionMap.values()).sort((a, b) => (a.order || 0) - (b.order || 0));

        if (questions.length === 0) {
            console.log("No questions found in responses");
            return response.status(404).json({
                success: false,
                message: "No questions found in responses"
            });
        }

        // Prepare CSV headers
        const questionHeaders = questions.map(q => q.questionText || 'Question');
        const fields = ['Response ID', 'Responder ID', ...questionHeaders, 'Submitted At'];

        // Build CSV rows
        const rows = responses.map(resp => {
            const answerMap = {};
            resp.answers.forEach(a => {
                if (a.question && a.question._id) {
                    answerMap[a.question._id.toString()] = a.response;
                }
            });

            const row = {
                'Response ID': resp._id.toString(),
                'Responder ID': resp.responder ? resp.responder.toString() : 'N/A',
                'Submitted At': resp.submittedAt || 'N/A'
            };

            questions.forEach(q => {
                const raw = answerMap[q._id.toString()];
                let value = null;
                if (raw !== undefined && raw !== null) {
                    if (Array.isArray(raw)) {
                        value = raw.join('; ');
                    } else if (typeof raw === 'object') {
                        value = JSON.stringify(raw);
                    } else {
                        value = String(raw);
                    }
                }
                row[q.questionText || 'Question'] = value;
            });

            return row;
        });

        const parser = new Parser({ fields });
        const csv = parser.parse(rows);

        const formTitle = Array.isArray(form.title) && form.title.length > 0
            ? (form.title.find(t => t.key === 'en')?.value || form.title[0].value || 'form')
            : 'form';
        const safeTitle = formTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        response.header('Content-Type', 'text/csv; charset=UTF-8');
        response.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_responses.csv"`);
        response.status(200).send(csv);

    } catch (error) {
        console.error('Export responses error:', error);
        return response.status(500).json({ message: 'Error exporting responses', error: error.message });
    }
};

exports.onCreate = async function (request, response) {
    try {
        const responseData = {
            ...request.body,
            responder: request.user.id
        };
        const doc = await responseService.onCreate(responseData);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.log(err);
        return ResMessage.sendResponse(response, 0, 40400, err.message);
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
        return ResMessage.sendResponse(response, 0, 40400, err.message);
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
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};