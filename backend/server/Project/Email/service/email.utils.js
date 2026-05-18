'use strict';

/**
 * Extracts a localized title from a form object.
 * Defaults to 'Untitled Form'.
 */
exports.getFormTitle = (form) => {
    if (!form || !form.title || !Array.isArray(form.title) || form.title.length === 0) return 'Untitled Form';
    const enTitle = form.title.find(t => t.key === 'en');
    const thTitle = form.title.find(t => t.key === 'th');
    return enTitle ? enTitle.value : (thTitle ? thTitle.value : form.title[0].value);
};

/**
 * Validates an email address.
 */
exports.isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

/**
 * Normalizes an ID to a string.
 */
exports.toIdString = (id) => String(id?._id || id || '').trim();

/**
 * Builds a professional frontend link for form access.
 */
exports.buildFormLink = (formId, mode = 'preview') => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    if (mode === 'manage') {
        return `${baseUrl}/manage/${formId}`;
    }
    return `${baseUrl}/forms/${formId}?mode=preview&source=invite`;
};
