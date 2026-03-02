const mongo = require("mongodb");
const Form = require("../controller/form");
const ResMessage = require("../../Settings/service/message");

exports.onQuery = async function (request, response) {
  try {
    const query = { _id: new mongo.ObjectId(request.body._id) };
    // Use onQuery so that defaultPopulate runs:
    //   questions → { path: 'questions', populate: { path: 'type' } }
    //   responses, status
    const doc = await Form.onQuery(query);
    if (!doc) return ResMessage.sendResponse(response, 0, 40400, "Form not found");
    return ResMessage.sendResponse(response, 0, 20000, doc);
  } catch (err) {
    return ResMessage.sendResponse(response, 0, 40400, err.message);
  }
};

exports.onQuerys = async function (request, response) {
  try {
    var querys = {};
    const doc = await Form.onQuerys(querys);
    return ResMessage.sendResponse(response, request.body.apiId, 20000, doc);
  } catch (err) {
    return ResMessage.sendResponse(response, request.body.apiId, 40400, err.message);
  }
};

exports.onCreate = async function (request, response) {
  try {
    const doc = await Form.onCreate(request.body);
    return ResMessage.sendResponse(response, 0, 20000, doc);
  } catch (err) {
    return ResMessage.sendResponse(response, 0, 40400, err.message);
  }
};

exports.onUpdate = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);

    const doc = await Form.onUpdate(query, request.body);
    return ResMessage.sendResponse(response, 0, 20000, doc);
  } catch (err) {
    return ResMessage.sendResponse(response, 0, 40400, err.message);
  }
};

exports.onDelete = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await Form.onDelete(query);
    return ResMessage.sendResponse(response, 0, 20000, doc);
  } catch (err) {
    return ResMessage.sendResponse(response, 0, 40400, err.message);
  }
};
