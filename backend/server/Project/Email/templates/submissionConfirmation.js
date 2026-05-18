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

const buildSubmissionConfirmationHtml = function ({
  name = 'Student',
  formTitle = 'Form Submission',
  submittedAt = '',
  referenceNo = '',
  status = 'Received',
  emailMessage = '',
}) {
  const safeName = escapeHtml(name);
  const safeFormTitle = escapeHtml(formTitle);
  const safeSubmittedAt = escapeHtml(submittedAt || '-');
  const safeReferenceNo = escapeHtml(referenceNo || '-');
  const safeStatus = escapeHtml(status);
  const safeEmailMessage = escapeHtml(emailMessage);

  const content = `
    <p style="font-size:16px; margin-bottom:20px; color:#2d3748;">Dear <strong>${safeName}</strong>,</p>
    <p style="font-size:15px; color:#4a5568; line-height:1.6; margin-bottom:25px;">
      ${safeEmailMessage || 'Your response has been successfully submitted. This email confirms that the system has received your submission.'}
    </p>

    <div style="padding:20px; background:#fff5f5; border-left:4px solid #ac1515; border-radius:8px; margin-bottom:25px;">
      <p style="margin:8px 0; font-size:14px; color:#2d3748;"><strong style="color:#ac1515;">Form:</strong> ${safeFormTitle}</p>
      <p style="margin:8px 0; font-size:14px; color:#2d3748;"><strong style="color:#ac1515;">Submitted:</strong> ${safeSubmittedAt}</p>
      <p style="margin:8px 0; font-size:14px; color:#2d3748;"><strong style="color:#ac1515;">Reference No:</strong> ${safeReferenceNo}</p>
      <p style="margin:8px 0; font-size:14px; color:#2d3748;">
        <strong style="color:#ac1515;">Status:</strong>
        <span style="background:#fed7d7; color:#822727; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; display:inline-block; margin-left:5px;">
          ${safeStatus}
        </span>
      </p>
    </div>

    <p style="font-size:14px; color:#718096;">
      Please keep this email for your records. If you need assistance, contact the system administrator.
    </p>
  `;

  return baseLayout.wrapInLayout(content, {
      title: `Submission Confirmation: ${safeFormTitle}`,
      preheader: `Confirmation for your submission to ${safeFormTitle}`
  });
};

const buildSubmissionConfirmationText = function ({
  name = 'Student',
  formTitle = 'Form Submission',
  submittedAt = '',
  referenceNo = '',
  status = 'Received',
  emailMessage = '',
}) {
  return [
    `Dear ${name},`,
    '',
    emailMessage || 'Your response has been successfully submitted. This email confirms that the system has received your submission.',
    '',
    `Form: ${formTitle}`,
    `Submitted: ${submittedAt || '-'}`,
    `Reference No: ${referenceNo || '-'}`,
    `Status: ${status}`,
    '',
    'Please keep this email for your records.',
    'If you need assistance, contact the system administrator.',
  ].join('\n');
};

module.exports = {
  buildSubmissionConfirmationHtml,
  buildSubmissionConfirmationText,
};
