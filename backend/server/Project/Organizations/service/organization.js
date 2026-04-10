const mongo = require("mongodb");
const Org = require("../controller/organization");
const ResMessage = require("../../Settings/service/message");
const { getApiId, getSuccessCode } = require("../../../../helpers/apiUtils");

exports.onQuery = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await Org.onQuery(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
  }
};

exports.onQuerys = async function (request, response) {
  try {
    var querys = {};
    const doc = await Org.onQuerys(querys);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
  }
};

exports.onCreate = async function (request, response) {
  try {
    const doc = await Org.onCreate(request.body);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
  }
};

exports.onUpdate = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await Org.onUpdate(query, request.body);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
  }
};

exports.onDelete = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await Org.onDelete(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
  }
};
