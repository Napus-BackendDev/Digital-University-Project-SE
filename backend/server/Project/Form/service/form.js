const mongo = require("mongodb");
const Form = require("../controller/form");
const ResMessage = require("../../Settings/service/message");

exports.onQuery = async function (request, response) {
  try {
    let query = {};
    query._id = new mongo.ObjectId(request.query._id);

    const doc = await Form.onAggregate([
      { $match: query },
      {
        $graphLookup: {
          from: "Forms",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "originalFormId",
          as: "childrenForms",
          depthField: "depth",
        },
      },
      {
        $addFields: {
          childrenForms: {
            $sortArray: {
              input: "$childrenForms",
              sortBy: { depth: 1, createdAt: -1 },
            },
          },
        },
      },
    ]);

    return ResMessage.sendResponse(response, 0, 20000, doc[0]);
  } catch (err) {
    return ResMessage.sendResponse(response, 0, 40400, err.message);
  }
};

exports.onQuerys = async function (request, response) {
  try {
    let query = {};
    const doc = await Form.onQuerys(query);
    return ResMessage.sendResponse(response, 0, 20000, doc);
  } catch (err) {
    return ResMessage.sendResponse(response, 0, 40400, err.message);
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
