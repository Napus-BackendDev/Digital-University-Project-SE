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
