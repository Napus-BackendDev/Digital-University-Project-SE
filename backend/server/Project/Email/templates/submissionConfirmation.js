'use strict';

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

  return `
  <div style="margin:0;padding:0;background-color:#fff6f6;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #f1caca;box-shadow:0 8px 20px rgba(172,21,21,0.08);">
      <div style="background:#ac1515;color:#ffffff;padding:24px;">
        <h2 style="margin:0;font-size:20px;letter-spacing:0.2px;">Digital University</h2>
        <p style="margin:6px 0 0;font-size:13px;opacity:0.95;">Form Response Confirmation</p>
      </div>

      <div style="padding:24px;">
        <p style="font-size:15px;margin-bottom:12px;color:#2f2a2a;">Dear <strong>${safeName}</strong>,</p>
        <p style="font-size:14px;color:#4b3f3f;line-height:1.6;">
          ${safeEmailMessage || 'Your response has been successfully submitted. This email confirms that the system has received your submission.'}
        </p>

        <div style="margin-top:18px;padding:16px;background:#fff1f1;border-left:4px solid #ac1515;border-radius:8px;">
          <p style="margin:6px 0;font-size:14px;color:#3f2f2f;"><strong style="color:#8c1515;">Form:</strong> ${safeFormTitle}</p>
          <p style="margin:6px 0;font-size:14px;color:#3f2f2f;"><strong style="color:#8c1515;">Submitted:</strong> ${safeSubmittedAt}</p>
          <p style="margin:6px 0;font-size:14px;color:#3f2f2f;"><strong style="color:#8c1515;">Reference No:</strong> ${safeReferenceNo}</p>
          <p style="margin:6px 0;font-size:14px;color:#3f2f2f;">
            <strong style="color:#8c1515;">Status:</strong>
            <span style="background:#f9d4d4;color:#8c1515;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">
              ${safeStatus}
            </span>
          </p>
        </div>

        <p style="margin-top:20px;font-size:14px;color:#5a4a4a;">
          Please keep this email for your records. If you need assistance, contact the system administrator.
        </p>
      </div>

      <div style="background:#fff8f8;border-top:1px solid #f1caca;padding:16px;font-size:12px;color:#7a6161;">
        <strong style="color:#ac1515;">Digital University Form Service</strong><br/>
        Mae Fah Luang University<br/>
        This is an automated message. Please do not reply.
      </div>
    </div>
  </div>
  `;
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
