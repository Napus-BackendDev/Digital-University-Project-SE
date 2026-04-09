const mongo = require("mongodb");
const Form = require("../controller/form");
const ResMessage = require("../../Settings/service/message");
const FormModel = require("../models/form.model");
const UserModel = require("../../User/models/user.model");
const { getComputedStatus, canResponderViewForm } = require("./form.status");
const { maybeSendCollaborationInvites } = require("../../Email/service/collaboration");
const { getApiId, getSuccessCode, getErrorCode } = require("../../../../helpers/apiUtils");
const { normalizeFormPayload } = require("./form.normalize");

// Extract helper functions
const { getDemoAuthUser, isAdminUser, normalizeNullableId } = require("../../../../helpers/authUtils");
const { hasEditorCollaboratorAccess, buildUserFormsMatchCondition, canUserSeeListedForm } = require("./form.access");

/**
 * GET SPECIFIC FORM BY ID
 * Uses a MongoDB Aggregate Pipeline. Aggregation is like a SQL query builder (JOINs, Filters).
 */
exports.onQuery = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] POST /api/v1/form/get (onQuery)`);
    let formId = new mongo.ObjectId(request.body._id);

    // Technique: MongoDB Aggregation Pipeline
    // A pipeline is a sequence of data processing stages.
    const pipeline = [
      { $match: { _id: formId } }, // Stage 1: Find the form where _id matches

      // Stage 2: $graphLookup
      // Recursively searches for "Children Forms" (e.g. templates or previous versions)
      // by following the 'originalFormId' field.
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

      // Stage 3-6: $lookup (like join)
      // Fetches related documents from other collections (Questions, Status, Creator)
      {
        $lookup: {
          from: "Questions",
          localField: "questions",
          foreignField: "_id",
          as: "questions",
        },
      },
      {
        $lookup: {
          from: "Setting_Status",
          localField: "status",
          foreignField: "_id",
          as: "status",
        },
      },
      // $unwind flattens an array into a single object. 
      // preserveNullAndEmptyArrays keeps the form even if the status array is empty.
      { $unwind: { path: "$status", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "Users",
          localField: "creator",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "Users",
          localField: "settings.allowedUser",
          foreignField: "_id",
          as: "settings.allowedUser",
        },
      },

      // Stage 7: $project (Similar to SQL SELECT)
      // Specifies exactly which fields to include/exclude. 
      // Setting to 0 excludes the field (hiding passwords from the API JSON response).
      {
        $project: {
          "creator.password": 0,
          "settings.allowedUser.password": 0,
        }
      },

      // Stage 8: Nested $lookup Pipeline
      // Fetches Responses specific to this form, sorts them, and populates the Responder.
      {
        $lookup: {
          from: "Responses",
          let: { form_id: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$form", "$$form_id"] } } }, // Match Response.form == Form._id
            { $sort: { createdAt: -1 } },
            {
              $lookup: {
                from: "Users",
                localField: "responder",
                foreignField: "_id",
                as: "responder",
              },
            },
            { $unwind: { path: "$responder", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                "responder.password": 0, // Security: Never send passwords!
              },
            },
          ],
          as: "responses",
        },
      },
    ];

    const results = await Form.onAggregate(pipeline);

    if (results.length === 0) {
      return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
    }

    let doc = results[0]; // Extract the first (and only) document from the array

    // FormModel.populate: Uses Mongoose to resolve nested references not covered by the aggregation
    await FormModel.populate(doc, { path: 'controll.user controll.type' });

    // --- Access Control Logic (JavaScript checks) ---
    const authUser = getDemoAuthUser(request);
    const authUserId = authUser ? normalizeNullableId(authUser._id || authUser.id || authUser.userId) : null;
    const isAdmin = authUser?.role?.code === 'admin' || isAdminUser(authUser);

    if (!isAdmin) {
      let isPrivileged = false;
      let hasSubmitted = false;

      if (authUserId && mongo.ObjectId.isValid(authUserId)) {
        const userIdStr = String(authUserId);
        // Determine if the user is the creator, an allowed user, or a collaborator
        const isCreator = doc.creator && String(doc.creator._id || doc.creator) === userIdStr;
        const isController = Array.isArray(doc.controll) && doc.controll.some((item) => {
          return item && item.user && String(item.user._id || item.user) === userIdStr;
        });
        const isAllowedUser = Array.isArray(doc.settings?.allowedUser) && doc.settings.allowedUser.some((item) => {
          return item && String(item._id || item) === userIdStr;
        });
        isPrivileged = isCreator || isController || isAllowedUser;
      }

      const status = getComputedStatus(doc.schedule);

      if (!isPrivileged && status === 'closed' && authUserId) {
        const count = await FormModel.db.collection('Responses').countDocuments({
          form: doc._id,
          responder: new mongo.ObjectId(authUserId),
          submit: true
        });
        hasSubmitted = count > 0;
      }

      if (!canResponderViewForm({ isPrivileged, status, hasSubmitted })) {
        return ResMessage.sendResponse(response, getApiId(request), 40400, "Form not found");
      }
    }

    // Sort childrenForms manually 
    if (doc.childrenForms) {
      doc.childrenForms.sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    // Mongoose population for related Question Types
    if (doc.questions && doc.questions.length > 0) {
      const Question = require("../../Questions/models/questions.model");
      await Question.populate(doc.questions, { path: 'type', select: 'type' });
    }

    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), err.message);
  }
};

/**
 * LIST FORMS FOR A CURRENT USER
 * Built dynamically using 'matchCondition'
 */

exports.onQueryByUser = async function (request, response) {
  try {
    console.log('[API ' + getApiId(request) + '] GET /api/v1/form/user/:userId (onQueryByUser)');
    const targetUserId = request.params.userId;

    if (!targetUserId || !mongo.ObjectId.isValid(targetUserId)) {
      return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "A valid userId is required");
    }

    // Security improvement: authorization context comes from auth middleware only.
    // Do NOT trust query params for role/org authorization decisions.
    const authUser = getDemoAuthUser(request);  //Change this when done authentication
    if (!authUser) {
      return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request, 40100), "Unauthorized");
    }

    const authUserId = normalizeNullableId(authUser._id || authUser.userId || authUser.id);
    const isAdmin = authUser?.role?.code === 'admin';
    const organizationId = normalizeNullableId(authUser.organizationId || authUser.organization);

    // Security hardening: non-admin users may only list forms for themselves.
    if (!isAdmin && authUserId && authUserId !== String(targetUserId)) {
      return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request, 40300), "Forbidden");
    }

    const matchCondition = buildUserFormsMatchCondition({
      isAdmin,
      targetUserId,
      organizationId,
    });

    // Pipeline to get all forms matching the visibility rules
    const pipeline = [
      { $match: matchCondition }, // Stage 1: Filter documents based on matchCondition
      { $sort: { createdAt: -1 } }, // Stage 2: Sort by newest first
      {
        $lookup: {
          from: "Setting_Status",
          localField: "status",
          foreignField: "_id",
          as: "status",
        },
      },
      { $unwind: { path: "$status", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "Users",
          localField: "creator",
          foreignField: "_id",
          as: "creator",
        },
      },
      {
        $lookup: {
          from: "Organizations",
          localField: "organization",
          foreignField: "_id",
          as: "organization",
        }
      },
      {
        $lookup: {
          from: "Users",
          localField: "settings.allowedUser",
          foreignField: "_id",
          as: "settings.allowedUser",
        },
      },
      { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },

      // Technique: Counting Responses without memory overhead
      // Instead of fetching all the response documents, this counts them directly 
      // inside the lookup pipeline and returns just the final count number
      {
        $lookup: {
          from: "Responses",
          let: { form_id: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$form", "$$form_id"] }, submit: true } },
            { $count: "count" }
          ],
          as: "submittedResponses"
        }
      },
      // $addFields: Appends new computed properties to the document
      {
        $addFields: {
          // If submittedResponses is an array, take the first item's 'count'. Else default 0.
          responsesCount: { $ifNull: [{ $arrayElemAt: ["$submittedResponses.count", 0] }, 0] }
        }
      },
      {
        $project: {
          responses: 0,
          submittedResponses: 0,
          "creator.password": 0,
          "settings.allowedUser.password": 0,
        }
      }
    ];

    const docs = await Form.onAggregate(pipeline);
    await FormModel.populate(docs, { path: 'controll.user controll.type' });

    // Business filter remains unchanged, moved to helper for readability.
    const filteredDocs = docs.filter((doc) => canUserSeeListedForm({
      doc,
      targetUserId,
      isAdmin,
    }));

    // Deprecated compatibility behavior:
    // Keep mocked response array for legacy frontend components expecting responses array.
    filteredDocs.forEach(doc => {
      doc.responses = new Array(doc.responsesCount).fill({ submit: true });
    });

    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), filteredDocs);
  } catch (err) {
    console.error('[API ' + getApiId(request) + '] Error:', err.message);
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

/**
 * PUBLIC EXPLORE ROUTE
 */
// exports.onQuerys = async function (request, response) {
//   try {
//     console.log(`[API ${getApiId(request)}] GET /api/v1/form/exp (onQuerys)`);
//     // 1. Extract context from request or auth token
//     const userId = request.query.userId || request.body.userId;
//     const organizationId = request.query.organizationId || request.body.organizationId;
//     const isAdmin = request.query.isAdmin === 'true' || request.body.isAdmin === true;

//     // 2. Build match condition
//     let matchCondition = {};

//     if (!isAdmin && organizationId) {
//       matchCondition = {
//         $or: [
//           { access: 'public' },
//           { organization: new mongo.ObjectId(organizationId) },
//           { "settings.allowedUser": new mongo.ObjectId(userId) },
//           { "controll.user": new mongo.ObjectId(userId) }
//         ]
//       };
//     }

//     const pipeline = [
//       { $match: matchCondition },
//       { $sort: { createdAt: -1 } }, // Sort by newest first
//       {
//         $lookup: {
//           from: "Setting_Status", //Where or Which collection to join with
//           localField: "status", //Field from the Form collection
//           foreignField: "_id",  //Field from the Setting_Status collection
//           as: "status", //As "status" for the joined data (will be an array)
//         },
//       },
//       { $unwind: { path: "$status", preserveNullAndEmptyArrays: true } },
//       {
//         // Technique: Counting response sub-documents directly per-form
//         $lookup: {
//           from: "Responses",
//           let: { form_id: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$form", "$$form_id"] },
//                 submit: true
//               }
//             },
//             {
//               $project: {
//                 _id: 0,
//                 submit: 1,
//                 createdAt: 1
//               }
//             }
//           ],
//           as: "submittedResponses"
//         }
//       },
//       {
//         $addFields: {
//           responses: "$submittedResponses",
//           responsesCount: { $size: "$submittedResponses" }
//         }
//       },
//       {
//         $project: {
//           submittedResponses: 0,
//           "settings.allowedUser.password": 0,
//           "creator.password": 0,
//         }
//       }
//     ];

//     const docs = await Form.onAggregate(pipeline);
//     await FormModel.populate(docs, { path: 'controll.user controll.type' });

//     return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), docs);
//   } catch (err) {
//     return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
//   }
// };

/**
 * CREATE NEW FORM
 */
exports.onCreate = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] POST /api/v1/form (onCreate)`);
    // Before creating, normalize the payload to fix Object vs String ID issues using the helper
    const payload = request.body;
    const doc = await Form.onCreate(payload);

    // Check if collaboration email invites need to be sent
    await maybeSendCollaborationInvites({
      previousDoc: null,
      currentDoc: doc,
      actorId: payload.user || payload.creator || doc.creator
    });
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

/**
 * UPDATE EXISTING FORM
 */
exports.onUpdate = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] PUT /api/v1/form (onUpdate)`);
    const query = { _id: new mongo.ObjectId(request.body._id) };
    const payload = normalizeFormPayload(request.body);
    const hasCollabUpdate = Array.isArray(payload?.controll) ||
      Array.isArray(payload?.settings?.allowedUser);
    const needPreviousDoc = Boolean(payload.user) || hasCollabUpdate;
    let previousDoc = null;

    // Fetch previous state of Form Document to compare changes
    if (needPreviousDoc) {
      previousDoc = typeof Form.onQuery === 'function'
        ? await Form.onQuery(query)
        : null;
      if (!previousDoc) {
        previousDoc = await FormModel.findOne(query)
          .populate('creator controll.user controll.type')
          .lean();
      }
    }
    // Security Check: Enforce edit permissions
    const authUser = getDemoAuthUser(request);  //Change this when done authentication
    if (!authUser) {
      return ResMessage.sendResponse(response, getApiId(request), 40100, "Unauthorized");
    }

    const authUserId = normalizeNullableId(authUser._id || authUser.id || authUser.userId);
    const isAdmin = authUser?.role?.code === 'admin' || isAdminUser(authUser);

    if (!previousDoc) {
      return ResMessage.sendResponse(response, getApiId(request), 40400, "Form not found");
    }

    const canEdit = isAdmin ||
      String(previousDoc.creator?._id || previousDoc.creator || '') === String(authUserId) ||
      hasEditorCollaboratorAccess(previousDoc, authUserId);

    if (!canEdit) {
      return ResMessage.sendResponse(response, getApiId(request), 40300, "You do not have permission to edit this form");
    }

    const actorId = authUserId; // Used for email invites below

    const doc = await Form.onUpdate(query, payload);

    // If Collaborators changed, send them email invites
    if (hasCollabUpdate && previousDoc) {
      await maybeSendCollaborationInvites({
        previousDoc,
        currentDoc: doc,
        actorId
      });
    }
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

/**
 * DELETE FORM
 */
exports.onDelete = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] DELETE /api/v1/form (onDelete)`);

    const authUser = getDemoAuthUser(request);  //Change this when done authentication
    if (!authUser) {
      return ResMessage.sendResponse(response, getApiId(request), getErrorCode(request), "Unauthorized");
    }

    const authUserId = normalizeNullableId(authUser._id || authUser.id || authUser.userId);
    const isAdmin = authUser?.role?.code === 'admin' || isAdminUser(authUser);

    const query = { _id: new mongo.ObjectId(request.body._id) };

    const previousDoc = await FormModel.findOne(query).select('creator controll').lean();
    if (!previousDoc) {
      return ResMessage.sendResponse(response, getApiId(request), 40400, "Form not found");
    }

    const canDelete = isAdmin ||
      String(previousDoc.creator?._id || previousDoc.creator || '') === String(authUserId) ||
      hasEditorCollaboratorAccess(previousDoc, authUserId);

    if (!canDelete) {
      return ResMessage.sendResponse(response, getApiId(request), 40300, "You do not have permission to delete this form");
    }

    const doc = await Form.onDelete(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};
