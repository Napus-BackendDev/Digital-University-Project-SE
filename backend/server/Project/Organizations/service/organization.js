const mongo = require("mongodb");
const Org = require("../controller/organization");
const ResMessage = require("../../Settings/service/message");
const getApiId = function (request) {
  return Number(request?.query?.apiId || request?.body?.apiId) || 0;
};

exports.onQuery = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await Org.onQuery(query);
    return ResMessage.sendResponse(response, getApiId(request), 20000, doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

exports.onQuerys = async function (request, response) {
  try {
    var querys = {};
    const doc = await Org.onQuerys(querys);
    return ResMessage.sendResponse(response, getApiId(request), 20000, doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

exports.onCreate = async function (request, response) {
  try {
    const doc = await Org.onCreate(request.body);
    return ResMessage.sendResponse(response, getApiId(request), 20000, doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

exports.onUpdate = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await Org.onUpdate(query, request.body);
    return ResMessage.sendResponse(response, getApiId(request), 20000, doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

exports.onDelete = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.body._id);
    const doc = await Org.onDelete(query);
    return ResMessage.sendResponse(response, getApiId(request), 20000 , doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};
