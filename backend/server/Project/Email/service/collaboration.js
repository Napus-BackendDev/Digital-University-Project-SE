'use strict';

const mongo = require("mongodb");
const FormModel = require("../../Form/models/form.model");
const UserModel = require("../../User/models/user.model");
const mailer = require("../../../../helpers/mailer");
const {
  buildInvitationCollaborationHtml,
  buildInvitationCollaborationText,
} = require("../templates/invitationCollaboration");

// Helper to extract title from localized array
const getFormTitle = (form) => {
    if (!form || !form.title || !Array.isArray(form.title) || form.title.length === 0) return 'Untitled Form';
    const enTitle = form.title.find(t => t.key === 'en');
    const thTitle = form.title.find(t => t.key === 'th');
    return enTitle ? enTitle.value : (thTitle ? thTitle.value : form.title[0].value);
};

// Helper to normalize IDs to strings
const toIdString = (id) => String(id?._id || id || '').trim();

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
  if (!mongo.ObjectId.isValid(userId)) return false;

  const user = await UserModel.findById(userId).select('name email').lean();
  if (!user || !isValidEmail(user.email)) return false;

  const permissionLabel = permission === 'edit' ? 'Editor' : 'Viewer';
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  
  // Build professional link
  const invitationLink = permission === 'edit' 
    ? `${baseUrl}/manage/${formId}` 
    : `${baseUrl}/forms/${formId}?mode=preview&source=invite`;

  const subject = `Invitation: ${formTitle} (${permissionLabel})`;
  const params = {
    inviterName,
    collaboratorName: user.name || 'Collaborator',
    formTitle,
    permission: permissionLabel,
    invitationLink,
  };

  const textContent = buildInvitationCollaborationText(params);
  const htmlContent = buildInvitationCollaborationHtml(params);

  const sent = await mailer.sendMail(user.email, subject, textContent, htmlContent);
  return sent;
};

/**
 * Analyzes form diff and sends invitations to NEW collaborators only.
 */
exports.maybeSendCollaborationInvites = async ({
  previousDoc = null,
  currentDoc,
}) => {
  if (!currentDoc?._id) return;

  try {
    // Fetch current state with full population to get names and emails
    const populated = await FormModel.findById(currentDoc._id)
      .select('title settings.allowedUser collaborator creator')
      .populate({ path: 'creator', select: 'name' })
      .lean();
    
    if (!populated) return;

    const formTitle = getFormTitle(populated);
    const inviterName = populated.creator?.name || 'Form Owner';

    // 1. Build map of userIds to permission level in PREVIOUS version
    const prevMap = new Map();
    if (previousDoc) {
        (previousDoc.settings?.allowedUser || []).forEach(id => {
            if (id) prevMap.set(toIdString(id), 'view');
        });
        (previousDoc.collaborator || []).forEach(c => {
            if (c?.user) prevMap.set(toIdString(c.user), 'edit');
        });
    }

    // 2. Build map for CURRENT version
    const nextMap = new Map();
    (populated.settings?.allowedUser || []).forEach(id => {
        if (id) nextMap.set(toIdString(id), 'view');
    });
    (populated.collaborator || []).forEach(c => {
        if (c?.user) nextMap.set(toIdString(c.user), 'edit');
    });

    // 3. Find truly NEW entries
    const invitationTasks = [];
    for (const [userId, permission] of nextMap.entries()) {
        // Only invite if they weren't in the previous list at all
        if (!prevMap.has(userId)) {
            // Don't invite the form owner to their own form
            if (toIdString(populated.creator) === userId) continue;

            invitationTasks.push(sendInvitationToUser({
                userId,
                inviterName,
                formTitle,
                permission,
                formId: populated._id,
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
