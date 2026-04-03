const FormModel = require("../../Form/models/form.model");
const UserModel = require("../../User/models/user.model");
const path = require("path");
const mailer = require("../../../../helpers/mailer");

// Basic email validation regex
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Helper to check if a response is considered "submitted"
exports.isSubmitted = (submitValue) => {
  return submitValue === true || submitValue === 'true';
};

exports.isValidEmail = isValidEmail;

/**
 * maybeSendSubmissionConfirmation
 * Sends a confirmation email to the responder only.
 * Uses helpers/mailer.js for sending.
 */
exports.maybeSendSubmissionConfirmation = async ({ shouldSend, doc, body, logLabel = '' }) => {
  if (!shouldSend) {
    return;
  }

  try {
    // 1. Fetch Form settings
    const formId = doc.form?._id || doc.form || body.form_id || body.form;
    if (!formId) {
      console.error('[Email] No form ID found - skipping');
      return;
    }

    const form = await FormModel.findById(formId).select('title settings').lean();
    if (!form) {
      console.error(`[Email] Form not found: ${formId}`);
      return;
    }

    // Only proceed if collectEmail is enabled
    if (!form.settings?.collectEmail) {
      return;
    }

    // 2. Determine responder's email
    let responderEmail = null;
    const responderData = doc.responder;
    
    if (responderData) {
      if (typeof responderData === 'object' && isValidEmail(responderData.email)) {
        responderEmail = responderData.email;
      } else {
        const user = await UserModel.findById(responderData).select('email').lean();
        if (user && isValidEmail(user.email)) {
          responderEmail = user.email;
        }
      }
    }

    if (!responderEmail) {
      console.warn('[Email] No valid responder email found');
      return;
    }

    // 3. Prepare text content for mailer.js
    const formTitle = form.title[0]?.value || 'Untitled Form';
    const emailMessage = form.settings.emailMessage || 'Thank you for your submission!';
    const confirmationMessage = form.settings.confirmMessage || 'Your response has been recorded.';
    const formLink = `${process.env.FRONTEND_URL}/forms/${formId}/response/${doc._id}`;

    const subject = `Form Confirmation: ${formTitle}`;
    const textContent = `
Dear User,

${emailMessage}

Your response to the form "${formTitle}" has been successfully recorded.
${confirmationMessage}

You can view your submission here:
${formLink}

Thank you!
    `.trim();

    // 4. Send email using helper/mailer.js
    const success = await mailer.sendMail(responderEmail, subject, textContent);

    if (success) {
      console.log(`[Email] Sent confirmation to: ${responderEmail}`);
    } else {
      console.error(`[Email] Failed to send to: ${responderEmail}`);
    }

  } catch (err) {
    console.error(`[Email] Error:`, err.message);
  }
};
