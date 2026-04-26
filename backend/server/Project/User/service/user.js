const mongo = require("mongodb");
const User = require("../controller/user");
const ResMessage = require("../../Settings/service/message");
const { mapUserDto, mapUserListDto } = require("../dto/user.dto");
const getApiId = function (request) {
  return Number(request?.query?.apiId || request?.body?.apiId) || 0;
};
const getSuccessCode = function (request) {
  return 20000 + getApiId(request);
};
const getErrorCode = function () {
  return 50000;
};

exports.onQuery = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await User.onQuery(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapUserDto(doc));
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
  }
};

exports.onQuerys = async function (request, response) {
  try {
    var querys = {};
    // Use light population for list of all users to prevent excessive data payload
    const lightPopulate = [
        { path: 'role' },
        { path: 'organization', select: 'title' }
    ];
    const doc = await User.onQuerys(querys, lightPopulate);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapUserListDto(doc));
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
  }
};

exports.onCreate = async function (request, response) {
  try {
    const lightPopulate = [
        { path: 'role' },
        { path: 'organization', select: 'title' }
    ];
    const doc = await User.onCreate(request.body, lightPopulate);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapUserDto(doc));
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
  }
};

exports.onUpdate = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);

    const lightPopulate = [
        { path: 'role' },
        { path: 'organization', select: 'title' }
    ];
    const doc = await User.onUpdate(query, request.body, lightPopulate);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), mapUserDto(doc));
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
  }
};

exports.onDelete = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await User.onDelete(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
  }
};
