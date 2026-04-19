'use strict';

const mongo = require("mongodb");
const FormModel = require("../../Form/models/form.model");
const UserModel = require("../../User/models/user.model");
const mailer = require("../../../../helpers/mailer");
const {
  buildInvitationCollaborationHtml,
  buildInvitationCollaborationText,
} = require("../templates/invitationCollaboration");
const {
  normalizeObjectIdRef,
  normalizeIdList,
  getNewMemberIds,
  getPermissionFromControlType,
  getPermissionLabel,
  buildFrontendLink,
} = require("./collaboration.utils");

const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const sendInvitationToUser = async ({
  userId,
  inviterName,
  formTitle,
  permission,
  formId,
}) => {
  const normalizedUserId = normalizeObjectIdRef(userId);
  if (!mongo.ObjectId.isValid(normalizedUserId)) {
    console.warn(`[Collaboration Email] Skip invalid userId: ${normalizedUserId}`);
    return false;
  }
  const user = await UserModel.findById(normalizedUserId).select('name email').lean();
  if (!user || !isValidEmail(user.email)) {
    console.warn(`[Collaboration Email] Skip user without valid email: ${normalizedUserId}`);
    return false;
  }

  const permissionLabel = getPermissionLabel(permission);
  const invitationLink = buildFrontendLink({
    formId,
    permission,
    userId: normalizedUserId,
  });

  const subject = `Invitation: ${formTitle} (${permissionLabel})`;
  const textContent = buildInvitationCollaborationText({
    inviterName,
    collaboratorName: user.name || 'Collaborator',
    formTitle,
    permission: permissionLabel,
    invitationLink,
  });
  const htmlContent = buildInvitationCollaborationHtml({
    inviterName,
    collaboratorName: user.name || 'Collaborator',
    formTitle,
    permission: permissionLabel,
    invitationLink,
  });

  const sent = await mailer.sendMail(user.email, subject, textContent, htmlContent);
  if (sent) {

  } else {
    console.warn(`[Collaboration Email] Invite failed to ${user.email} (${permissionLabel})`);
  }
  return sent;
};

exports.maybeSendCollaborationInvites = async ({
  previousDoc = null,
  currentDoc,
  actorId = null,
}) => {
  if (!currentDoc?._id) return;
  const currentId = String(currentDoc._id || '');
  if (!mongo.ObjectId.isValid(currentId)) return;

  try {
    const populated = await FormModel.findById(currentId)
      .select('title settings.allowedUser collaborator creator')
      .populate({ path: 'collaborator.type', select: 'title' })
      .lean();
    if (!populated) return;

    const formTitle = populated.title?.[0]?.value || 'Untitled Form';
    const inviterId = normalizeObjectIdRef(actorId || populated.creator || '');
    const inviter = mongo.ObjectId.isValid(inviterId)
      ? await UserModel.findById(inviterId).select('name').lean()
      : null;
    const inviterName = inviter?.name || 'Form Owner';

    const prevAllowed = previousDoc?.settings?.allowedUser || [];
    const nextAllowed = populated?.settings?.allowedUser || [];
    const newAllowedUserIds = getNewMemberIds({ prev: prevAllowed, next: nextAllowed });

    const prevControllers = previousDoc?.collaborator || [];
    const nextControllers = populated?.collaborator || [];
    const prevControllerUserIds = new Set(normalizeIdList(prevControllers.map((item) => item?.user)));
    const newControllerEntries = nextControllers
      .map((item) => ({
        userId: normalizeObjectIdRef(item?.user),
        permission: getPermissionFromControlType(item?.type),
      }))
      .filter((item) => item.userId && !prevControllerUserIds.has(item.userId));

    const invitationTasks = [];

    newAllowedUserIds.forEach((userId) => {
      if (userId === inviterId) return;
      invitationTasks.push(sendInvitationToUser({
        userId,
        inviterName,
        formTitle,
        permission: 'view',
        formId: populated._id,
      }));
    });

    newControllerEntries.forEach(({ userId, permission }) => {
      if (userId === inviterId) return;
      invitationTasks.push(sendInvitationToUser({
        userId,
        inviterName,
        formTitle,
        permission,
        formId: populated._id,
      }));
    });

    if (!invitationTasks.length) {

      return;
    }
    await Promise.all(invitationTasks);
  } catch (err) {
    console.error('[Collaboration Email] Error:', err.message);
  }
};
