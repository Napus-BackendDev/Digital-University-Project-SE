const mongo = require("mongodb");
const Form = require("../controller/form");
const ResMessage = require("../../Settings/service/message");
const FormModel = require("../models/form.model");
const UserModel = require("../../User/models/user.model");
const { getComputedStatus, canResponderViewForm } = require("./form.status");
const { maybeSendCollaborationInvites } = require("../../Email/service/collaboration");
const { getApiId, getSuccessCode } = require("../../../../helpers/apiUtils");

/**
 * Technique: Data Normalization
 * 
 * normalizeObjectIdRef: Extract the MongoDB ObjectId string from various possible formats. 
 * The frontend might send just the ID string or a full object (like {_id: "5f...", name: "X"}).
 * This ensures the backend always stores just the string ID in the database references.
 */
const normalizeObjectIdRef = function (value) {
  if (!value) return value;
  if (typeof value === 'object') {
    if (value._id) return value._id; // Evaluates if object has _id
    if (value.value) return value.value; // Maps from {value: 'id', label: 'something'} format
  }
  return value;
};

/**
 * normalizeFormPayload: This function cleans up the request payload before Save/Update.
 * It uses the 'spread operator' ({ ...payload }) to copy existing data into 'clean', 
 * and Array.map() / Array.filter() to ensure relationships contain only IDs.
 */
const normalizeFormPayload = function (payload = {}) {
  const clean = { ...payload };

  if (Array.isArray(clean.organization)) {
    clean.organization = clean.organization.map((item) => normalizeObjectIdRef(item));
  }

  if (Array.isArray(clean.controll)) {
    clean.controll = clean.controll
      .map((item) => ({
        user: normalizeObjectIdRef(item?.user), // ?. (Optional Chaining) checks if user exists before getting properties
        type: normalizeObjectIdRef(item?.type),
      }))
      .filter((item) => item.user && item.type); // Filter removes missing users/types
  }

  if (clean.settings && typeof clean.settings === 'object' && Array.isArray(clean.settings.allowedUser)) {
    clean.settings = { ...clean.settings }; // Clone nested object to prevent unexpected mutation
    clean.settings.allowedUser = clean.settings.allowedUser
      .map((item) => normalizeObjectIdRef(item))
      .filter(Boolean); // Boolean constructor inside filter removes falsy values (null/undefined/empty)
  }

  return clean;
};

// Helper: Safely extracts text from a role object, searching for words like 'admin' or 'edit'.
const getRoleTitleText = function (role) {
  if (!role || !role.title) return '';
  if (Array.isArray(role.title)) {
    return role.title.map((t) => String(t?.value || '')).join(' ').toLowerCase();
  }
  return String(role.title || '').toLowerCase();
};

const isAdminUser = function (user) {
  return getRoleTitleText(user?.role).includes('admin');
};

const hasEditorCollaboratorAccess = function (formDoc, userId) {
  if (!formDoc || !Array.isArray(formDoc.controll)) return false;
  const userIdStr = String(userId);
  return formDoc.controll.some((item) => {
    const collabUserId = String(item?.user?._id || item?.user || '');
    if (collabUserId !== userIdStr) return false;
    const typeText = getRoleTitleText(item?.type);
    return typeText.includes('edit') || typeText.includes('แก้ไข');
  });
};


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
      
      // Stage 3-6: $lookup (Similar to SQL JOIN)
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
      return ResMessage.sendResponse(response, getApiId(request), 40400, "Form not found");
    }

    let doc = results[0]; // Extract the first (and only) document from the array

    // FormModel.populate: Uses Mongoose to resolve nested references not covered by the aggregation
    await FormModel.populate(doc, { path: 'controll.user controll.type' });

    // --- Access Control Logic (JavaScript checks) ---
    const userId = request.body.userId || request.query.userId;
    const isAdmin = request.body.isAdmin === true || request.query.isAdmin === 'true';
    if (userId && mongo.ObjectId.isValid(userId) && !isAdmin) {
      const userIdStr = String(userId);
      // Determine if the user is the creator, an allowed user, or a collaborator
      const isCreator = doc.creator && String(doc.creator._id || doc.creator) === userIdStr;
      const isController = Array.isArray(doc.controll) && doc.controll.some((item) => {
        return item && item.user && String(item.user._id || item.user) === userIdStr;
      });
      const isAllowedUser = Array.isArray(doc.settings?.allowedUser) && doc.settings.allowedUser.some((item) => {
        return item && String(item._id || item) === userIdStr;
      });
      
      const isPrivileged = isCreator || isController || isAllowedUser;
      const status = getComputedStatus(doc.schedule);

      let hasSubmitted = false;
      if (!isPrivileged && status === 'closed') {
        const count = await FormModel.db.collection('Responses').countDocuments({
          form: doc._id,
          responder: new mongo.ObjectId(userId),
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
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

/**
 * LIST FORMS FOR A CURRENT USER
 * Built dynamically using 'matchCondition'
 */
exports.onQueryByUser = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] GET /api/v1/form/user/:userId (onQueryByUser)`);
    const userId = request.params.userId;
    let organizationId = request.query.organizationId;
    const isAdmin = request.query.isAdmin === 'true';

    // Normalize organizationId: treat "null", "undefined", or empty string as actual null
    if (organizationId === 'null' || organizationId === 'undefined' || !organizationId) {
      organizationId = null;
    }

    if (!userId || !mongo.ObjectId.isValid(userId)) {
      return ResMessage.sendResponse(response, getApiId(request), 40000, "A valid userId is required");
    }

    let matchCondition = {};

    if (isAdmin) {
      // System Admins see everything. 
      matchCondition = {};
    } else {
      // Normal User / Switched User Visibility Rules:
      const userOID = new mongo.ObjectId(userId);
      const orgOID = organizationId && mongo.ObjectId.isValid(organizationId) ? new mongo.ObjectId(organizationId) : null;

      // $or operator means if ANY of these rules are true, the form will be returned
      matchCondition = {
        $or: [
          // 1. Ownership & Direct Collaboration (Highest priority)
          { creator: userOID },
          { "controll.user": userOID },
          { "settings.allowedUser": userOID },

          // 2. Organization-based Access (Only if user has an organization)
          // Uses the spread operator (...) to conditionally add this array if orgOID exists
          ...(orgOID ? [{
            $and: [
              { organization: orgOID },
              {
                $or: [
                   { access: 'organization' },
                   { access: 'public' },
                   { access: { $exists: false } } // Handle legacy data
                ]
              }
            ]
          }] : []),

          // 3. Global Public Access (Regardless of organization)
          { access: 'public' }
        ]
      };
    }

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

    // JS-based Filter: Checks precise constraints after the pipeline results are returned
    const filteredDocs = docs.filter((doc) => {
      if (isAdmin) return true;

      const userIdStr = String(userId);
      const isCreator = doc.creator && String(doc.creator._id || doc.creator) === userIdStr;
      const isController = Array.isArray(doc.controll) && doc.controll.some((item) => {
        return item && item.user && String(item.user._id || item.user) === userIdStr;
      });
      const isAllowedUser = Array.isArray(doc.settings?.allowedUser) && doc.settings.allowedUser.some((item) => {
        return item && String(item._id || item) === userIdStr;
      });
      const isPrivileged = isCreator || isController || isAllowedUser;
      const status = getComputedStatus(doc.schedule);
      const hasSubmitted = Number(doc.responsesCount || 0) > 0;

      return canResponderViewForm({ isPrivileged, status, hasSubmitted });
    });

    // Mock an array for backwards compatibility across older frontend code components
    filteredDocs.forEach(doc => {
      doc.responses = new Array(doc.responsesCount).fill({ submit: true });
    });

    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), filteredDocs);
  } catch (err) {
    console.error(`[API ${getApiId(request)}] Error:`, err.message);
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

/**
 * PUBLIC EXPLORE ROUTE
 */
exports.onQuerys = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] GET /api/v1/form/exp (onQuerys)`);
    // 1. Extract context from request
    const userId = request.query.userId;
    const organizationId = request.query.organizationId || request.body.organizationId;
    const isAdmin = request.query.isAdmin === 'true' || request.body.isAdmin === true;

    // 2. Build match condition
    let matchCondition = {};

    if (!isAdmin && organizationId) {
      matchCondition = {
        $or: [
          { access: 'public' },
          { organization: new mongo.ObjectId(organizationId) },
          { "settings.allowedUser": new mongo.ObjectId(userId) },
          { "controll.user": new mongo.ObjectId(userId) }
        ]
      };
    }

    const pipeline = [
      { $match: matchCondition },
      { $sort: { createdAt: -1 } },
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
        // Technique: Counting response sub-documents directly per-form
        $lookup: {
          from: "Responses",
          let: { form_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$form", "$$form_id"] },
                submit: true
              }
            },
            {
              $project: {
                _id: 0,
                submit: 1,
                createdAt: 1
              }
            }
          ],
          as: "submittedResponses"
        }
      },
      {
        $addFields: {
          responses: "$submittedResponses",
          responsesCount: { $size: "$submittedResponses" }
        }
      },
      {
        $project: {
          submittedResponses: 0,
          "settings.allowedUser.password": 0,
          "creator.password": 0,
        }
      }
    ];

    const docs = await Form.onAggregate(pipeline);
    await FormModel.populate(docs, { path: 'controll.user controll.type' });

    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), docs);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

/**
 * CREATE NEW FORM
 */
exports.onCreate = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] POST /api/v1/form (onCreate)`);
    // Before creating, normalize the payload to fix Object vs String ID issues using the helper
    const payload = normalizeFormPayload(request.body);
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
    const actorId = payload.user || payload.creator || previousDoc?.creator;

    // Security Check: Enforce edit permissions
    // Keep backward compatibility for legacy clients that do not send user context.
    if (payload.user) {
      if (!previousDoc) {
        return ResMessage.sendResponse(response, getApiId(request), 40400, "Form not found");
      }
      const actor = await UserModel.findById(actorId)
        .select('role')
        .populate({ path: 'role', select: 'title' })
        .lean();
        
      const canEdit = isAdminUser(actor) ||
        String(previousDoc.creator?._id || previousDoc.creator || '') === String(actorId) ||
        hasEditorCollaboratorAccess(previousDoc, actorId);

      if (!canEdit) {
        return ResMessage.sendResponse(response, getApiId(request), 40300, "You do not have permission to edit this form");
      }
    }

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
    const query = { _id: new mongo.ObjectId(request.body._id) };
    const doc = await Form.onDelete(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};
