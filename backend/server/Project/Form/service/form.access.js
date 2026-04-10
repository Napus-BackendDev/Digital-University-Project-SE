const mongo = require("mongodb");
const { getComputedStatus, canResponderViewForm } = require("./form.status");
const { getRoleTitleText } = require("../../../../helpers/authUtils");

const hasEditorCollaboratorAccess = function (formDoc, userId) {
  if (!formDoc || !Array.isArray(formDoc.collaborator)) return false;
  const userIdStr = String(userId);
  return formDoc.collaborator.some((item) => {
    const collabUserId = String(item?.user?._id || item?.user || '');
    if (collabUserId !== userIdStr) return false;
    const typeText = getRoleTitleText(item?.type);
    return typeText.includes('edit') || typeText.includes('แก้ไข');
  });
};

<<<<<<< HEAD
const buildUserFormsMatchCondition = ({ isAdmin, targetUserId, organizationId }) => {
  if (isAdmin) {
    return {};
=======
const normalizeNullableId = function (value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined') return null;
  return normalized;
};

const GENERAL_ORG_ID = process.env.GENERAL_ORG_ID;

const isGeneralOrganization = function (organization) {
  const organizations = Array.isArray(organization) ? organization : [organization];
  return organizations.some((item) => {
    if (!item) return false;
    const titleText = Array.isArray(item.title)
      ? item.title.map((titleItem) => String(titleItem?.value || '')).join(' ').toLowerCase()
      : String(item.title || '').toLowerCase();
    return titleText.includes('general') || titleText.includes('ทั่วไป') || normalizeNullableId(item?._id || item) === GENERAL_ORG_ID;
  });
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
    { organization: GENERAL_ORG_ID },
  ];

  if (userOID) {
    orConditions.push({ creator: userOID });
    orConditions.push({ "controll.user": userOID });
    orConditions.push({ "settings.allowedUser": userOID });
>>>>>>> 85c61afe831f80497f7226c786e833dde151c5f4
  }

  const userOID = new mongo.ObjectId(targetUserId);
  const orgOID = organizationId && mongo.ObjectId.isValid(organizationId)
    ? new mongo.ObjectId(organizationId)
    : null;

  return {
    $or: [
      { creator: userOID },
      { "collaborator.user": userOID },
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

<<<<<<< HEAD
  const userIdStr = String(targetUserId);
  const isCreator = doc.creator && String(doc.creator._id || doc.creator) === userIdStr;
  const isController = Array.isArray(doc.collaborator) && doc.collaborator.some((item) => {
    return item && item.user && String(item.user._id || item.user) === userIdStr;
=======
  const userIdStr = normalizeNullableId(targetUserId);
  const access = String(doc?.access || '').toLowerCase();
  const isPublic = !access || access === 'public';
  if (isGeneralOrganization(doc?.organization)) return true;

  if (!userIdStr) return isPublic;

  const isCreator = String(doc?.creator?._id || doc?.creator || '') === userIdStr;
  const isController = Array.isArray(doc?.controll) && doc.controll.some((item) => {
    return String(item?.user?._id || item?.user || '') === userIdStr;
>>>>>>> 85c61afe831f80497f7226c786e833dde151c5f4
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
<<<<<<< HEAD
  canUserSeeListedForm
};
=======
  canUserSeeListedForm,
  normalizeNullableId,
  isGeneralOrganization,
};
>>>>>>> 85c61afe831f80497f7226c786e833dde151c5f4
