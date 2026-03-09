const mongo = require("mongodb");
const User = require("../controller/user");
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
    const doc = await User.onQuery(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

exports.onQuerys = async function (request, response) {
  try {
    var querys = {};
    const doc = await User.onQuerys(querys);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

exports.onCreate = async function (request, response) {
  try {
    const doc = await User.onCreate(request.body);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

exports.onUpdate = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);

    const doc = await User.onUpdate(query, request.body);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

exports.onDelete = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await User.onDelete(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};
