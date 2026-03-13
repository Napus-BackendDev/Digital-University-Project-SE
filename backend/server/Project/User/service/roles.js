const mongo = require("mongodb");
const Roles = require("../controller/roles");
const ResMessage = require("../../Settings/service/message");

const getApiId = function (request) {
    return Number(request.body.apiId) || 0;
};

const getSuccessCode = function (request) {
    return 20000 + getApiId(request);
};


exports.onQuery = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await Roles.onQuery(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

exports.onQuerys = async function (request, response) {
  try {
    var querys = {};
    const doc = await Roles.onQuerys(querys);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

exports.onCreate = async function (request, response) {
  try {
    const doc = await Roles.onCreate(request.body);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

exports.onUpdate = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);

    const doc = await Roles.onUpdate(query, request.body);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

exports.onDelete = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await Roles.onDelete(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};
