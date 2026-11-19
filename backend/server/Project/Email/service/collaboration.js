'use strict';

const mongo = require("mongodb");
const FormModel = require("../../Form/models/form.model");
const UserModel = require("../../User/models/user.model");
const dynamicEmail = require('../service/dynamicEmail');

const {
  getFormTitle,
  toIdString,
  isValidEmail,
  buildFormLink,
  resolveFormContactInfo
} = require("./email.utils");

const sendInvitationToUser = async ({
  userId,
  inviterName,
  formTitle,
  permission,
  formId,
  ownerId,
  contactOrganization,
  contactEmail,
}) => {
  if (!mongo.ObjectId.isValid(userId)) return false;

  const user = await UserModel.findById(userId).select('name email').lean();
  if (!user || !isValidEmail(user.email)) return false;

  const permissionLabel = permission === 'edit' ? 'Editor' : 'Viewer';
  const manageLink = buildFormLink(formId, 'manage');
  const formUrl = buildFormLink(formId, 'fill');

  const variables = {
    UserName: user.name || 'Collaborator',
    CollaboratorName: user.name || 'Collaborator',
    FormName: formTitle,
    FormTitle: formTitle,
    FormURL: formUrl,
    ManageURL: manageLink,
    InvitationLink: manageLink,
    InviterName: inviterName,
    Permission: permissionLabel,
    Organization: contactOrganization || 'Digital University',
    ContactOrganization: contactOrganization || '',
    ContactEmail: contactEmail || '',
  };

  const sent = await dynamicEmail.sendDynamicEmail(
    'invitationCollaboration',
    variables,
    user.email,
    {
      ...(ownerId ? { ownerId } : {}),
      ...(contactOrganization ? { contactOrganization } : {}),
      ...(contactEmail ? { contactEmail, replyTo: contactEmail } : {}),
    }
  );
  return Boolean(sent && sent.success);
};

/**
 * Analyzes form diff and sends invitations to NEW collaborators only.
 * Both Editor and Viewer receive the management dashboard link (/manage/:id).
 */
exports.maybeSendCollaborationInvites = async ({
  previousDoc = null,
  currentDoc,
}) => {
  if (!currentDoc?._id) return;

  try {
    const populated = await FormModel.findById(currentDoc._id)
      .select('title settings collaborator creator organization')
      .populate({
        path: 'creator',
        select: 'name email organization',
        populate: { path: 'organization', select: 'title' }
      })
      .populate({ path: 'organization', select: 'title' })
      .populate({
        path: 'collaborator',
        populate: { path: 'type', select: 'title' }
      })
      .lean();

    if (!populated) return;

    const formTitle = getFormTitle(populated);
    const inviterName = populated.creator?.name || 'Form Owner';
    const ownerId = toIdString(populated.creator);
    const { contactOrganization, contactEmail } = resolveFormContactInfo(populated);

    const getRoleFromCollaborator = (c) => {
        if (!c?.type?.title) return 'edit';
        const titleItems = Array.isArray(c.type.title) ? c.type.title : [];
        const enTitle = titleItems.find(t => t.key === 'en')?.value || '';
        const thTitle = titleItems.find(t => t.key === 'th')?.value || '';
        const rawTitle = titleItems[0]?.value || '';

        const fullTitle = (enTitle + thTitle + rawTitle).toLowerCase();
        return fullTitle.includes('view') || fullTitle.includes('ดู') ? 'view' : 'edit';
    };

    const prevMap = new Map();
    if (previousDoc) {
        (previousDoc.collaborator || []).forEach(c => {
            if (c?.user) prevMap.set(toIdString(c.user), getRoleFromCollaborator(c));
        });
    }

    const nextMap = new Map();
    (populated.collaborator || []).forEach(c => {
        if (c?.user) nextMap.set(toIdString(c.user), getRoleFromCollaborator(c));
    });

    const invitationTasks = [];
    for (const [userId, permission] of nextMap.entries()) {
        if (!prevMap.has(userId)) {
            if (ownerId && ownerId === userId) continue;

            invitationTasks.push(sendInvitationToUser({
                userId,
                inviterName,
                formTitle,
                permission,
                formId: populated._id,
                ownerId,
                contactOrganization,
                contactEmail,
            }));
        }
    }

    if (invitationTasks.length > 0) {
        console.log(`[Collaboration Email] Processing ${invitationTasks.length} new invitations for form: ${formTitle}`);
        await Promise.all(invitationTasks);
    }

  } catch (err) {
    console.error('[Collaboration Email] Error during diffing/sending:', err.message);
  }
};
