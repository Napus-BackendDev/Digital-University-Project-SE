const mongo = require("mongodb");
const Role = require("../controller/role");
const ResMessage = require("../../Settings/service/message");

const getApiId = function (request) {
  return Number(request.body.apiId) || 0;
};

const getSuccessCode = function (request) {
  return 20000 + getApiId(request);
};

// apiId = 31 — Get one role by ID
exports.onQuery = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.query._id);

    const doc = await Role.onQuery(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

// apiId = 32 — Get all roles
exports.onQuerys = async function (request, response) {
  try {
    var querys = {};
    const doc = await Role.onQuerys(querys);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

// apiId = 33 — Create role
exports.onCreate = async function (request, response) {
  try {
    const doc = await Role.onCreate(request.body);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

// apiId = 34 — Update role
exports.onUpdate = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);

    const doc = await Role.onUpdate(query, request.body);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

// apiId = 35 — Delete role
exports.onDelete = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await Role.onDelete(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};
