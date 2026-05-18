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

const buildOrganizationInvitationHtml = function ({
  organizationName = 'Your Organization',
  responderName = 'Member',
  formTitle = 'Untitled Form',
  invitationLink = '',
}) {
  const safeOrgName = escapeHtml(organizationName);
  const safeResponderName = escapeHtml(responderName);
  const safeFormTitle = escapeHtml(formTitle);
  const safeInvitationLink = escapeHtml(invitationLink || '');

  const content = `
    <p style="font-size:16px; margin-bottom:20px; color:#2d3748;">Hello <strong>${safeResponderName}</strong>,</p>
    <p style="font-size:15px; color:#4a5568; line-height:1.6; margin-bottom:25px;">
      An official form has been shared with all members of <strong>${safeOrgName}</strong>.
    </p>

    <div style="margin:25px 0; padding:20px; background:#f7fafc; border-left:5px solid #ac1515; border-radius:8px;">
      <p style="margin:0; font-size:12px; color:#ac1515; text-transform:uppercase; letter-spacing:1px; font-weight:bold;">Form Invitation</p>
      <p style="margin:10px 0 0; font-size:18px; color:#1a202c; font-weight:700;">${safeFormTitle}</p>
    </div>

    ${safeInvitationLink ? `
    <div style="margin: 30px 0; text-align: center;">
        <a href="${safeInvitationLink}" style="background-color: #ac1515; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px rgba(172, 21, 21, 0.2);">
            Start Response
        </a>
    </div>` : ''}

    <p style="margin-top:30px; font-size:14px; color:#718096; text-align:center; font-style:italic;">
      Your participation helps our university improve services for everyone.
    </p>
  `;

  return baseLayout.wrapInLayout(content, {
      title: `Organization Invitation: ${safeFormTitle}`,
      preheader: `New form invitation for members of ${safeOrgName}`
  });
};

const buildOrganizationInvitationText = function ({
  organizationName = 'Your Organization',
  responderName = 'Member',
  formTitle = 'Untitled Form',
  invitationLink = '',
}) {
  return [
    `Hello ${responderName},`,
    '',
    `An official form has been shared with all members of ${organizationName}.`,
    '',
    `Form: ${formTitle}`,
    invitationLink ? `Start Response: ${invitationLink}` : '',
    '',
    'Your participation helps our university improve services for everyone.',
    '',
    'Digital University Form Service',
    'Mae Fah Luang University',
  ].filter(Boolean).join('\n');
};

module.exports = {
  buildOrganizationInvitationHtml,
  buildOrganizationInvitationText,
};
