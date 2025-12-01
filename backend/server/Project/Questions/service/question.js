const mongo = require('mongodb');
const Questions = require('../controller/questions');

exports.onQuerys = async function (request, response) {
    try {
        let query = {};
        const doc = await Questions.onQuerys(query);

        response.json({
            message: 'Questions fetched successfully',
            status: 'OK',
            data: doc,
            timestamp: new Date()
        });
        // return ResMessage(response, doc);
    } catch (err) {
        response.json({
            message: 'Questions fetched error',
            error: err.message
        });
        // return ResMessage(response);
    }
};

exports.onCreate = async function (request, response) {
    try {
        const doc = await Questions.onCreate(request.body);

        response.json({
            message: 'Questions create successfully',
            status: 'OK',
            data: doc,
            timestamp: new Date()
        });
        // return ResMessage(response, doc);
    } catch (err) {
        response.json({
            message: 'Questions create error',
            error: err.message
        });
        // return ResMessage(response);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        let query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Questions.onUpdate(query, request.body);

        response.json({
            message: 'Questions update successfully',
            status: 'OK',
            data: doc,
            timestamp: new Date()
        });
        // return ResMessage(response, doc);
    } catch (err) {
        response.json({
            message: 'Questions update error',
            error: err.message
        });
        // return ResMessage(response);
    }
};

exports.onDelete = async function (request, response) {
    try {
        let query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Questions.onDelete(query);
        
        response.json({
            message: 'Questions delete successfully',
            status: 'OK',
            data: doc,
            timestamp: new Date()
        });
        // return ResMessage(response, doc);
    } catch (err) {
        response.json({
            message: 'Questions delete error',
            error: err.message
        });
        // return ResMessage(response);
    }
};