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
  schedulePeriod = '',
  openDate = '',
  closeDate = '',
  qrCodeHtml = '',
  contactOrganization = '',
  contactEmail = '',
  appName = '',
}) {
  const safeOrgName = escapeHtml(organizationName);
  const safeResponderName = escapeHtml(responderName);
  const safeFormTitle = escapeHtml(formTitle);
  const safeInvitationLink = escapeHtml(invitationLink || '');
  const safeSchedule = escapeHtml(schedulePeriod || (openDate && closeDate ? `${openDate} – ${closeDate}` : ''));

  const content = `
    <p style="font-size:16px; margin-bottom:20px; color:#2d3748;">Dear <strong>${safeResponderName}</strong>,</p>
    <p style="font-size:15px; color:#4a5568; line-height:1.6; margin-bottom:25px;">
      An official questionnaire has been shared with all members of <strong>${safeOrgName}</strong>.
    </p>

    <div style="margin:25px 0; padding:20px; background:#f7fafc; border-left:5px solid #8c1515; border-radius:8px;">
      <p style="margin:0; font-size:12px; color:#8c1515; text-transform:uppercase; letter-spacing:1px; font-weight:bold;">Questionnaire Invitation</p>
      <p style="margin:10px 0 0; font-size:18px; color:#1a202c; font-weight:700;">${safeFormTitle}</p>
      ${safeSchedule ? `<p style="margin:8px 0 0; font-size:13px; color:#475569;"><strong>Available Period:</strong> ${safeSchedule}</p>` : ''}
    </div>

    ${safeInvitationLink ? `
    <div style="margin: 26px 0; text-align: center;">
        <a href="${safeInvitationLink}" style="background-color: #8c1515; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px rgba(140, 21, 21, 0.2);">
            Open Questionnaire
        </a>
    </div>` : ''}

    ${qrCodeHtml || ''}

    <p style="margin-top:26px; font-size:14px; color:#718096; text-align:center; font-style:italic;">
      Your participation helps our university improve services for everyone.
    </p>
  `;

  return baseLayout.wrapInLayout(content, {
      title: `Questionnaire Invitation: ${formTitle}`,
      preheader: `New questionnaire invitation for members of ${organizationName}`,
      appName,
      contactOrganization,
      contactEmail
  });
};

const buildOrganizationInvitationText = function ({
  organizationName = 'Your Organization',
  responderName = 'Member',
  formTitle = 'Untitled Form',
  invitationLink = '',
  schedulePeriod = '',
  contactOrganization = '',
  contactEmail = '',
}) {
  return [
    `Dear ${responderName},`,
    '',
    `An official questionnaire has been shared with all members of ${organizationName}.`,
    '',
    `Form: ${formTitle}`,
    schedulePeriod ? `Available Period: ${schedulePeriod}` : '',
    invitationLink ? `Open Questionnaire: ${invitationLink}` : '',
    '',
    'Your participation helps our university improve services for everyone.',
    contactOrganization || contactEmail
      ? `Contact: ${[contactOrganization, contactEmail].filter(Boolean).join(' · ')}`
      : '',
    '',
    'Digital University Form Service',
    'Mae Fah Luang University',
  ].filter(Boolean).join('\n');
};

module.exports = {
  buildOrganizationInvitationHtml,
  buildOrganizationInvitationText,
};
