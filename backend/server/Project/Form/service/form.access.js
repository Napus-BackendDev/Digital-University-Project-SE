const mongo = require("mongodb");
const { getComputedStatus, canResponderViewForm } = require("./form.status");
const { getRoleTitleText } = require("../../../../helpers/authUtils");

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

const buildUserFormsMatchCondition = ({ isAdmin, targetUserId, organizationId }) => {
  if (isAdmin) {
    return {};
  }

  const userOID = new mongo.ObjectId(targetUserId);
  const orgOID = organizationId && mongo.ObjectId.isValid(organizationId)
    ? new mongo.ObjectId(organizationId)
    : null;

  return {
    $or: [
      { creator: userOID },
      { "controll.user": userOID },
      { "settings.allowedUser": userOID },
      ...(orgOID ? [{
        $and: [
          { organization: orgOID },
          {
            $or: [
              { access: 'organization' },
              { access: 'public' },
              { access: { $exists: false } },
            ],
          },
        ],
      }] : []),
      { access: 'public' },
    ],
  };
};

const canUserSeeListedForm = ({ doc, targetUserId, isAdmin }) => {
  if (isAdmin) return true;

  const userIdStr = String(targetUserId);
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
};

module.exports = {
  hasEditorCollaboratorAccess,
  buildUserFormsMatchCondition,
  canUserSeeListedForm
};
const mongo = require("mongodb");

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

const normalizeNullableId = function (value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined') return null;
  return normalized;
};

const buildUserFormsMatchCondition = function ({ userId, organizationId, isAdmin }) {
  if (isAdmin) return {};

  const normalizedUserId = normalizeNullableId(userId);
  const normalizedOrgId = normalizeNullableId(organizationId);

  // Legacy compatibility: when no user/org context is provided, return the same full list.
  if (!normalizedUserId && !normalizedOrgId) return {};

  const hasValidUserId = normalizedUserId && mongo.ObjectId.isValid(normalizedUserId);
  const hasValidOrgId = normalizedOrgId && mongo.ObjectId.isValid(normalizedOrgId);
  const userOID = hasValidUserId ? new mongo.ObjectId(normalizedUserId) : null;
  const orgOID = hasValidOrgId ? new mongo.ObjectId(normalizedOrgId) : null;

  const orConditions = [
    { access: 'public' },
    { access: { $exists: false } },
  ];

  if (userOID) {
    orConditions.push({ creator: userOID });
    orConditions.push({ "controll.user": userOID });
    orConditions.push({ "settings.allowedUser": userOID });
  }

  if (orgOID) {
    orConditions.push({
      $and: [
        { organization: orgOID },
        {
          $or: [
            { access: 'organization' },
            { access: 'public' },
            { access: { $exists: false } },
          ],
        },
      ],
    });
  }

  return { $or: orConditions };
};

const canUserSeeListedForm = function ({ doc, targetUserId, isAdmin }) {
  if (isAdmin) return true;

  const userIdStr = normalizeNullableId(targetUserId);
  const access = String(doc?.access || '').toLowerCase();
  const isPublic = !access || access === 'public';

  if (!userIdStr) return isPublic;

  const isCreator = String(doc?.creator?._id || doc?.creator || '') === userIdStr;
  const isController = Array.isArray(doc?.controll) && doc.controll.some((item) => {
    return String(item?.user?._id || item?.user || '') === userIdStr;
  });
  const isAllowedUser = Array.isArray(doc?.settings?.allowedUser) && doc.settings.allowedUser.some((item) => {
    return String(item?._id || item || '') === userIdStr;
  });

  return isPublic || isCreator || isController || isAllowedUser;
};

module.exports = {
  getRoleTitleText,
  isAdminUser,
  hasEditorCollaboratorAccess,
  buildUserFormsMatchCondition,
  canUserSeeListedForm,
  normalizeNullableId,
};