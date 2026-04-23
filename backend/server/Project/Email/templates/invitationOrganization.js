'use strict';

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

  return `
  <div style="margin:0;padding:0;background-color:#f4f7f9;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e1e8ed;box-shadow:0 8px 16px rgba(0,0,0,0.05);">
      <div style="background:#005596;color:#ffffff;padding:25px;text-align:center;">
        <h2 style="margin:0;font-size:22px;letter-spacing:0.5px;">Digital University</h2>
        <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">New Participation Request</p>
      </div>

      <div style="padding:30px;">
        <p style="font-size:16px;color:#2c3e50;">Hello <strong>${safeResponderName}</strong>,</p>
        <p style="font-size:15px;color:#57606f;line-height:1.6;">
          An official form has been shared with all members of <strong>${safeOrgName}</strong>.
        </p>

        <div style="margin:25px 0;padding:20px;background:#f8fbfe;border-left:5px solid #005596;border-radius:8px;">
          <p style="margin:0;font-size:14px;color:#7f8c8d;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Form Invitation</p>
          <p style="margin:10px 0 0;font-size:18px;color:#2c3e50;font-weight:600;">${safeFormTitle}</p>
        </div>

        ${safeInvitationLink ? `
        <div style="margin-top:30px;text-align:center;">
          <a href="${safeInvitationLink}" style="display:inline-block;background:#005596;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 6px rgba(0,85,150,0.2);">
            Start Response
          </a>
        </div>` : ''}

        <p style="margin-top:30px;font-size:14px;color:#95a5a6;text-align:center;font-style:italic;">
          Your participation helps our university improve services for everyone.
        </p>
      </div>

      <div style="background:#fdfdfe;border-top:1px solid #ecf0f1;padding:20px;font-size:12px;color:#bdc3c7;text-align:center;">
        <strong style="color:#7f8c8d;">Digital University Form Service</strong><br/>
        Mae Fah Luang University<br/>
        This is an automated message for organizational members.
      </div>
    </div>
  </div>
  `;
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
