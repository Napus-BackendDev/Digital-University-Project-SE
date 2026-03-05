const mongo = require("mongodb");
const UserCtrl = require("../controller/user");
const Role = require("../../Role/models/role.model");
const ResMessage = require("../../Settings/service/message");

const getApiId = function (request) {
  return Number(request.body.apiId) || 0;
};

const getSuccessCode = function (request) {
  return 20000 + getApiId(request);
};

// apiId = 41 — Get one user by ID
exports.onQuery = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.query._id);

    const doc = await UserCtrl.onQuery(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

// apiId = 42 — Get all users
exports.onQuerys = async function (request, response) {
  try {
    var querys = {};
    const doc = await UserCtrl.onQuerys(querys);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

// apiId = 44 — Update user
exports.onUpdate = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);

    const doc = await UserCtrl.onUpdate(query, request.body);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

// apiId = 45 — Delete user
exports.onDelete = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await UserCtrl.onDelete(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};

// apiId = 46 — Assign roles to a user
exports.onAssignRoles = async function (request, response) {
  try {
    const { _id, roles } = request.body;
    if (!_id || !Array.isArray(roles)) {
      return ResMessage.sendResponse(response, getApiId(request), 40400, '_id and roles[] are required');
    }

    // Validate role IDs exist
    const validRoles = await Role.find({ _id: { $in: roles } });
    if (validRoles.length !== roles.length) {
      return ResMessage.sendResponse(response, getApiId(request), 40400, 'One or more role IDs are invalid');
    }

    let query = {};
    query._id = new mongo.ObjectId(_id);

    const doc = await UserCtrl.onUpdate(query, { roles });
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 40400, err.message);
  }
};
