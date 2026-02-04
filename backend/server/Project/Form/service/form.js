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
    var querys = {};
    const doc = await Form.onQuerys(querys);
    return ResMessage.sendResponse(response, request.body.apiId, 20000, doc);
  } catch (err) {
    return ResMessage.sendResponse(response, request.body.apiId, 40400, err.message);
  }
  // try {
  //   // Check if user is admin
  //   const isAdmin = request.user?.roles?.includes('ADMIN') || request.query.isAdmin === 'true';

  //   if (!isAdmin) {
  //     // Get "Open" status ID first (better performance - filter early)
  //     const Setting_Status = require('../../Settings/models/status.model');
  //     const openStatus = await Setting_Status.findOne({
  //       'title.value': { $regex: /^open$/i }
  //     }, { _id: 1, title: 1 }).lean();

  //     if (!openStatus) {
  //       return ResMessage.sendResponse(response, 0, 20000, []);
  //     }

  //     // Optimized pipeline - filter first, then populate only what's needed
  //     const pipeline = [
  //       // Filter by status early (reduces documents to process)
  //       { $match: { status: openStatus._id } },
  //       { $sort: { createdAt: -1 } },
  //       // Populate relationships
  //       {
  //         $lookup: {
  //           from: 'Questions',
  //           localField: 'questions',
  //           foreignField: '_id',
  //           as: 'questions'
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: 'Responses',
  //           localField: 'responses',
  //           foreignField: '_id',
  //           as: 'responses'
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: 'Setting_Respond',
  //           localField: 'settings.whoCanRespond',
  //           foreignField: '_id',
  //           as: 'whoCanRespondArr'
  //         }
  //       },
  //       {
  //         $addFields: {
  //           status: openStatus,
  //           'settings.whoCanRespond': { $arrayElemAt: ['$whoCanRespondArr', 0] }
  //         }
  //       },
  //       { $project: { whoCanRespondArr: 0 } }
  //     ];

  //     const doc = await Form.onAggregate(pipeline);
  //     return ResMessage.sendResponse(response, 0, 20000, doc);
  //   } else {
  //     // Admin sees all forms
  //     let query = {};
  //     const doc = await Form.onQuerys(query);
  //     return ResMessage.sendResponse(response, 0, 20000, doc);
  //   }
  // } catch (err) {
  //   return ResMessage.sendResponse(response, 0, 40400, err.message);
  // }
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
