const mongo = require("mongodb");
const Form = require("../controller/form");
const ResMessage = require("../../Settings/service/message");
const FormModel = require("../models/form.model");
const UserModel = require("../../User/models/user.model");
const {getApiId,getSuccessCode}=require("../../../../helpers/apiUtils");

exports.onQuerys = async function (request, response) {
    try {
        let query = {};
        const docs=await Form.onQuerys(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), docs);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
}

exports.onQuery = async function (request, response) {
    try{
        const {_id} = request.body;
        const doc = await Form.onQuery({_id});  
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
}

exports.onQueryByUser = async function (request, response) {
    try{
        const {userId} = request.params;
        const query = { creator: new mongo.ObjectId(userId) };
        const doc=await Form.onQuerys(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    }
    catch(err){
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
}

exports.onCreate = async function (request, response) {
    try{
        const doc = await Form.onCreate(request.body);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
}

exports.onUpdate = async function (request, response) {
    try{
        let query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Form.onUpdate(query, request.body);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
}

exports.onDelete = async function (request, response) {
    try{
        let query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Form.onDelete(query);
        return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
    } catch (err) {
        return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
    }
}