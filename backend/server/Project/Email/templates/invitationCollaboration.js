'use strict';

const baseLayout = require('./baseLayout');

const escapeHtml = function (value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const buildInvitationCollaborationHtml = function ({
  inviterName = 'Form Owner',
  collaboratorName = 'Collaborator',
  formTitle = 'Untitled Form',
  permission = 'view',
  invitationLink = '',
}) {
  const safeInviterName = escapeHtml(inviterName);
  const safeCollaboratorName = escapeHtml(collaboratorName);
  const safeFormTitle = escapeHtml(formTitle);
  const safePermission = escapeHtml(permission);
  const safeInvitationLink = escapeHtml(invitationLink || '');

  const content = `
    <p style="font-size:16px; margin-bottom:20px; color:#2d3748;">Dear <strong>${safeCollaboratorName}</strong>,</p>
    <p style="font-size:15px; color:#4a5568; line-height:1.6; margin-bottom:25px;">
      <strong>${safeInviterName}</strong> has invited you to ${safePermission.toLowerCase() === 'viewer' ? 'view' : 'collaborate on'} a form.
    </p>

    <div style="padding:20px; background:#fff5f5; border-left:4px solid #ac1515; border-radius:8px; margin-bottom:25px;">
      <p style="margin:8px 0; font-size:14px; color:#2d3748;"><strong style="color:#ac1515;">Form:</strong> ${safeFormTitle}</p>
      <p style="margin:8px 0; font-size:14px; color:#2d3748;"><strong style="color:#ac1515;">Permission:</strong> ${safePermission}</p>
    </div>

    ${safeInvitationLink ? `
    <div style="margin: 30px 0; text-align: center;">
        <a href="${safeInvitationLink}" style="background-color: #ac1515; color: #ffffff; padding: 12px 30px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px rgba(172, 21, 21, 0.2);">
            Open Form
        </a>
    </div>` : ''}

    <p style="font-size:14px; color:#718096; margin-top:25px;">
      If you were not expecting this invitation, please contact the form owner.
    </p>
  `;

  return baseLayout.wrapInLayout(content, {
      title: `Collaboration Invitation: ${safeFormTitle}`,
      preheader: `${safeInviterName} invited you to collaborate on ${safeFormTitle}`
  });
};

const buildInvitationCollaborationText = function ({
  inviterName = 'Form Owner',
  collaboratorName = 'Collaborator',
  formTitle = 'Untitled Form',
  permission = 'view',
  invitationLink = '',
}) {
  return [
    `Dear ${collaboratorName},`,
    '',
    `${inviterName} invited you to ${permission.toLowerCase() === 'viewer' ? 'view' : 'collaborate on'} a form.`,
    `Form: ${formTitle}`,
    `Permission: ${permission}`,
    invitationLink ? `Open Form: ${invitationLink}` : '',
    '',
    'If you were not expecting this invitation, please contact the form owner.',
  ].filter(Boolean).join('\n');
};

module.exports = {
  buildInvitationCollaborationHtml,
  buildInvitationCollaborationText,
};
