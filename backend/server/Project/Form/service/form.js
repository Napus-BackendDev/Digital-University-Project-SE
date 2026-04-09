const mongo = require("mongodb");
const Form = require("../controller/form");
const ResMessage = require("../../Settings/service/message");
const FormModel = require("../models/form.model");
const UserModel = require("../../User/models/user.model");
const { getComputedStatus, canResponderViewForm } = require("./form.status");
const { maybeSendCollaborationInvites } = require("../../Email/service/collaboration");


const getApiId = function (request) {
  return Number(request.query.apiId || request.body.apiId) || 0;
};

const getSuccessCode = function (request) {
  return 20000 + getApiId(request);
};

const isValidObjectId = function (value) {
  return Boolean(value) && mongo.ObjectId.isValid(value);
};

const toObjectId = function (value) {
  return new mongo.ObjectId(String(value));
};

const parseBooleanFlag = function (value) {
  return value === true || String(value || '').toLowerCase() === 'true';
};

const normalizeOptionalId = function (value) {
  if (value === 'null' || value === 'undefined' || value === '') return null;
  return value || null;
};

const getDocVisibilityFlags = function (doc, userId) {
  const userIdStr = String(userId || '');
  const isCreator = doc.creator && String(doc.creator._id || doc.creator) === userIdStr;
  const isController = Array.isArray(doc.controll) && doc.controll.some((item) => {
    return item && item.user && String(item.user._id || item.user) === userIdStr;
  });
  const isAllowedUser = Array.isArray(doc.settings?.allowedUser) && doc.settings.allowedUser.some((item) => {
    return item && String(item._id || item) === userIdStr;
  });

  return {
    isCreator,
    isController,
    isAllowedUser,
    isPrivileged: isCreator || isController || isAllowedUser,
  };
};

const attachResponsePlaceholders = function (docs = []) {
  docs.forEach((doc) => {
    doc.responses = new Array(doc.responsesCount).fill({ submit: true });
  });
};

const normalizeObjectIdRef = function (value) {
  if (!value) return value;
  if (typeof value === 'object') {
    if (value._id) return value._id;
    if (value.value) return value.value;
  }
  return value;
};

const normalizeIdArray = function (values = []) {
  if (!Array.isArray(values)) return [];
  return values.map((item) => normalizeObjectIdRef(item)).filter(Boolean);
};

const normalizeControllArray = function (values = []) {
  if (!Array.isArray(values)) return [];

  return values
    .map((item) => ({
      user: normalizeObjectIdRef(item?.user),
      type: normalizeObjectIdRef(item?.type),
    }))
    .filter((item) => item.user && item.type);
};

const normalizeFormPayload = function (payload = {}) {
  const clean = { ...payload };

  if (Array.isArray(clean.organization)) {
    clean.organization = normalizeIdArray(clean.organization);
  }

  if (Array.isArray(clean.controll)) {
    clean.controll = normalizeControllArray(clean.controll);
  }

  if (clean.settings && typeof clean.settings === 'object' && Array.isArray(clean.settings.allowedUser)) {
    clean.settings = { ...clean.settings };
    clean.settings.allowedUser = normalizeIdArray(clean.settings.allowedUser);
  }

  return clean;
};

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



exports.onQuery = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] POST /api/v1/form/get (onQuery)`);
    let formId = toObjectId(request.body._id);

    const pipeline = [
      { $match: { _id: formId } },
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
      {
        $project: {
          "creator.password": 0,
          "settings.allowedUser.password": 0,
        }
      },
      {
        $lookup: {
          from: "Responses",
          let: { form_id: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$form", "$$form_id"] } } },
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
                "responder.password": 0,
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

    let doc = results[0];
    await FormModel.populate(doc, { path: 'controll.user controll.type' });

    const userId = request.body.userId || request.query.userId;
    const isAdmin = parseBooleanFlag(request.body.isAdmin) || parseBooleanFlag(request.query.isAdmin);
    if (isValidObjectId(userId) && !isAdmin) {
      const { isPrivileged } = getDocVisibilityFlags(doc, userId);
      const status = getComputedStatus(doc.schedule);

      let hasSubmitted = false;
      if (!isPrivileged && status === 'closed') {
        const count = await FormModel.db.collection('Responses').countDocuments({
          form: doc._id,
          responder: toObjectId(userId),
          submit: true
        });
        hasSubmitted = count > 0;
      }

      if (!canResponderViewForm({ isPrivileged, status, hasSubmitted })) {
        return ResMessage.sendResponse(response, getApiId(request), 40400, "Form not found");
      }
    }

    // Sort childrenForms manually or in projection
    if (doc.childrenForms) {
      doc.childrenForms.sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    // Population of question types still needs to happen.
    // Since we've already fetched the questions in the lookup, we can manually populate their types if needed,
    // or just use a more complex lookup. For simplicity and to match original logic,
    // we can do a quick population for the questions' types if there are not too many.
    if (doc.questions && doc.questions.length > 0) {
      // Use mongoose's populate on the already fetched questions
      const Question = require("../../Questions/models/questions.model");
      await Question.populate(doc.questions, { path: 'type', select: 'type' });
    }

    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

exports.onQueryByUser = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] GET /api/v1/form/user/:userId (onQueryByUser)`);
    const userId = request.params.userId;
    let organizationId = normalizeOptionalId(request.query.organizationId);
    const isAdmin = parseBooleanFlag(request.query.isAdmin);

    if (!isValidObjectId(userId)) {
      return ResMessage.sendResponse(response, getApiId(request), 40000, "A valid userId is required");
    }

    let matchCondition = {};

    if (isAdmin) {
      // System Admins see everything. 
      // This is essential for management and debugging.
      matchCondition = {};
    } else {
      // Normal User / Switched User Visibility Rules:
      const userOID = toObjectId(userId);
      const orgOID = isValidObjectId(organizationId) ? toObjectId(organizationId) : null;

      matchCondition = {
        $or: [
          // 1. Ownership & Direct Collaboration (Highest priority, can be cross-organization)
          { creator: userOID },
          { "controll.user": userOID },
          { "settings.allowedUser": userOID },

          // 2. Organization-based Access (Only if user has an organization)
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
      {
        $addFields: {
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

    const filteredDocs = docs.filter((doc) => {
      if (isAdmin) return true;

      const { isPrivileged } = getDocVisibilityFlags(doc, userId);
      const status = getComputedStatus(doc.schedule);
      const hasSubmitted = Number(doc.responsesCount || 0) > 0;

      return canResponderViewForm({ isPrivileged, status, hasSubmitted });
    });

    attachResponsePlaceholders(filteredDocs);

    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), filteredDocs);
  } catch (err) {
    console.error(`[API ${getApiId(request)}] Error:`, err.message);
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

exports.onQuerys = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] GET /api/v1/form/exp (onQuerys)`);
    // 1. Extract context from query (GET should not rely on request body)
    const userId = request.query.userId;
    const organizationId = normalizeOptionalId(request.query.organizationId);
    const isAdmin = parseBooleanFlag(request.query.isAdmin);

    // 2. Build match condition
    let matchCondition = {};

    if (!isAdmin && isValidObjectId(organizationId)) {
      // If not admin, filter by visibility rules:
      // - Forms that are public (access: 'public')
      // - Forms that belong to the user's organization (organization: organizationId)
      // - Forms where the user is specifically allowed (settings.allowedUser: userId)
      // - Forms where the user is a collaborator (controll.user: userId)
      const orRules = [
        { access: 'public' },
        { organization: toObjectId(organizationId) }
      ];

      if (isValidObjectId(userId)) {
        orRules.push({ "settings.allowedUser": toObjectId(userId) });
        orRules.push({ "controll.user": toObjectId(userId) });
      }

      matchCondition = {
        $or: orRules
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
      {
        $addFields: {
          responsesCount: { $ifNull: [{ $arrayElemAt: ["$submittedResponses.count", 0] }, 0] }
        }
      },
      {
        $project: {
          responses: 0,
          submittedResponses: 0,
          "settings.allowedUser.password": 0,
          "creator.password": 0,
        }
      }
    ];

    const docs = await Form.onAggregate(pipeline);
    await FormModel.populate(docs, { path: 'controll.user controll.type' });

    attachResponsePlaceholders(docs);

    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), docs);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};

exports.onCreate = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] POST /api/v1/form (onCreate)`);
    const payload = normalizeFormPayload(request.body);
    const doc = await Form.onCreate(payload);
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

exports.onUpdate = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] PUT /api/v1/form (onUpdate)`);
    const query = { _id: toObjectId(request.body._id) };
    const payload = normalizeFormPayload(request.body);
    const hasCollabUpdate = Array.isArray(payload?.controll) ||
      Array.isArray(payload?.settings?.allowedUser);
    const needPreviousDoc = Boolean(payload.user) || hasCollabUpdate;
    let previousDoc = null;
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

    // Enforce edit permissions when caller identity is provided.
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

exports.onDelete = async function (request, response) {
  try {
    console.log(`[API ${getApiId(request)}] DELETE /api/v1/form (onDelete)`);
    const query = { _id: toObjectId(request.body._id) };
    const doc = await Form.onDelete(query);
    return ResMessage.sendResponse(response, getApiId(request), getSuccessCode(request), doc);
  } catch (err) {
    return ResMessage.sendResponse(response, getApiId(request), 50000, err.message);
  }
};
