const formCtrl = require('../../Form/controller/form');
const userCtrl = require('../../User/controller/user');
const mailer = require('../../../../helpers/mailer');

const DEFAULT_CONFIRM_MESSAGE = 'Thank you for completing this survey. Your response has been recorded.';

const isSubmitted = function (value) {
    return value === true || value === 'true';
};

const getFormTitle = function (formInfo) {
    if (!formInfo || !Array.isArray(formInfo.title)) return 'Form';
    const titleEntry = formInfo.title.find(item => item && item.value);
    return titleEntry && titleEntry.value ? titleEntry.value : 'Form';
};

const stripHtml = function (value = '') {
    return String(value)
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const renderConfirmationTemplate = function (template, formInfo, responderInfo) {
    const formTitle = getFormTitle(formInfo);
    const replacements = {
        'User.name': responderInfo && responderInfo.name ? responderInfo.name : '',
        'User.email': responderInfo && responderInfo.email ? responderInfo.email : '',
        'Form.title': formTitle,
        'Form.id': formInfo && formInfo._id ? String(formInfo._id) : '',
    };

    return String(template || '').replace(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g, (match, token) => {
        if (replacements[token] !== undefined) {
            return replacements[token];
        }
        return match;
    });
};

const getConfirmationContext = function ({ doc, body = {}, fallback = {} }) {
    return {
        formId: doc && doc.form ? doc.form : (body.form || fallback.form),
        responderId: doc && doc.responder ? doc.responder : (body.responder || fallback.responder)
    };
};

const sendSubmissionConfirmation = async function ({ formId, responderId }) {
    if (!formId || !responderId) return false;

    const [formInfo, responderInfo] = await Promise.all([
        formCtrl.onQuery({ _id: formId }),
        userCtrl.onQuery({ _id: responderId })
    ]);

    if (!formInfo || !formInfo.settings || !formInfo.settings.emailNotifications) {
        return false;
    }

    if (!responderInfo || !responderInfo.email) {
        return false;
    }

    const subject = `Confirmation: ${getFormTitle(formInfo)} Submitted`;
    const template = formInfo.settings.confirmMessage
        || formInfo.settings.emailMessage
        || DEFAULT_CONFIRM_MESSAGE;
    const renderedMessage = renderConfirmationTemplate(template, formInfo, responderInfo);
    const text = stripHtml(renderedMessage) || DEFAULT_CONFIRM_MESSAGE;

    return mailer.sendMail(responderInfo.email, subject, text);
};

const maybeSendSubmissionConfirmation = async function ({ shouldSend, doc, body, fallback, logLabel }) {
    if (!shouldSend) return false;

    try {
        const context = getConfirmationContext({ doc, body, fallback });
        return await sendSubmissionConfirmation(context);
    } catch (mailErr) {
        console.error(`Error dispatching confirmation email${logLabel ? ` ${logLabel}` : ''}:`, mailErr);
        return false;
    }
};

module.exports = {
    isSubmitted,
    maybeSendSubmissionConfirmation
};
