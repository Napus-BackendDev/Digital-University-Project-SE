'use strict';

const QRCode = require('qrcode');
const { isGeneralOrgEntry } = require('../../Response/utils/responsePolicy');

/**
 * Extracts a localized title string (preferring English, then Thai, then first available).
 */
exports.getLocalizedTitle = (entity, fallback = '') => {
    const titleArr = Array.isArray(entity)
        ? entity
        : (entity && Array.isArray(entity.title) ? entity.title : null);
    if (!titleArr || titleArr.length === 0) {
        if (entity && typeof entity.title === 'string' && entity.title.trim()) {
            return entity.title.trim();
        }
        return fallback;
    }
    const enTitle = titleArr.find(t => t && t.key === 'en' && t.value);
    const thTitle = titleArr.find(t => t && t.key === 'th' && t.value);
    const first = titleArr.find(t => t && t.value);
    return (enTitle && enTitle.value) || (thTitle && thTitle.value) || (first && first.value) || fallback;
};

/**
 * Extracts a localized title from a form object.
 * Defaults to 'Untitled Form'.
 */
exports.getFormTitle = (form) => {
    if (!form || !form.title || !Array.isArray(form.title) || form.title.length === 0) return 'Untitled Form';
    return exports.getLocalizedTitle(form.title, 'Untitled Form');
};

/**
 * Validates an email address.
 */
exports.isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
};

/**
 * Normalizes an ID to a string.
 */
exports.toIdString = (id) => String(id?._id || id || '').trim();

/**
 * Builds a professional frontend link for form access.
 * - 'manage': form management & responses (/manage/:id)
 * - 'preview': creator preview (/forms/:id?mode=preview&source=invite)
 * - default ('fill' / 'public'): respondent submission link (/forms/:id?mode=public)
 */
exports.buildFormLink = (formId, mode = 'fill') => {
    const baseUrl = String(process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/+$/, '');
    if (mode === 'manage') {
        return `${baseUrl}/manage/${formId}`;
    }
    if (mode === 'preview') {
        return `${baseUrl}/forms/${formId}?mode=preview&source=invite`;
    }
    return `${baseUrl}/forms/${formId}?mode=public`;
};

function formatDateBangkok(dateInput) {
    if (!dateInput) return '';
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '';
    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Bangkok',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(d);
    } catch (_err) {
        return d.toISOString().slice(0, 16).replace('T', ' ');
    }
}

/**
 * Formats form schedule metadata for invitation emails.
 */
exports.formatFormScheduleForEmail = (schedule) => {
    const s = schedule && typeof schedule === 'object' ? schedule : {};
    const mode = s.mode || 'always';
    const startText = formatDateBangkok(s.startAt);
    const endText = formatDateBangkok(s.endAt);

    if (mode === 'always' || (!startText && !endText)) {
        return {
            openDate: 'Open immediately',
            closeDate: 'No expiration date',
            schedulePeriod: 'Open immediately · No expiration date'
        };
    }

    if (mode === 'end_only' || (!startText && endText)) {
        return {
            openDate: 'Open immediately',
            closeDate: endText,
            schedulePeriod: `Now – ${endText}`
        };
    }

    if (startText && endText) {
        return {
            openDate: startText,
            closeDate: endText,
            schedulePeriod: `${startText} – ${endText}`
        };
    }

    if (startText && !endText) {
        return {
            openDate: startText,
            closeDate: 'No expiration date',
            schedulePeriod: `Opens ${startText} · No expiration date`
        };
    }

    return {
        openDate: 'Open immediately',
        closeDate: 'No expiration date',
        schedulePeriod: 'Open immediately · No expiration date'
    };
};

/**
 * Generates a PNG base64 data URI QR code for the given URL.
 */
exports.generateQrCodeDataUri = async (url) => {
    if (!url || typeof url !== 'string') return '';
    try {
        return await QRCode.toDataURL(url, {
            width: 220,
            margin: 1,
            color: {
                dark: '#1a202c',
                light: '#ffffff'
            }
        });
    } catch (err) {
        console.warn('[Email Utils] Failed to generate QR code:', err && err.message ? err.message : err);
        return '';
    }
};

/**
 * Builds an inline-ready QR code HTML card (converted automatically to CID MIME attachment by Mail.js).
 */
exports.buildQrCodeHtmlBlock = (qrDataUri, targetUrl = '') => {
    if (!qrDataUri) return '';
    const safeUrl = String(targetUrl || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    return [
        '<div data-qr-block="true" style="margin: 22px 0 8px; padding: 18px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">',
        '<p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #8c1515; text-transform: uppercase; letter-spacing: 0.6px;">Scan QR Code via Mobile</p>',
        `<img src="${qrDataUri}" alt="Questionnaire QR Code" width="168" height="168" style="display: block; margin: 0 auto; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; padding: 6px;" />`,
        safeUrl ? `<p style="margin: 10px 0 0; font-size: 11px; color: #64748b; word-break: break-all;">${safeUrl}</p>` : '',
        '</div>'
    ].filter(Boolean).join('');
};

/**
 * Resolves the form's contact organization and contact email (with per-form overrides taking precedence).
 */
exports.resolveFormContactInfo = (formDoc, { fallbackOrganization = 'Digital University', fallbackEmail = '' } = {}) => {
    const settings = (formDoc && formDoc.settings) || {};
    const creator = (formDoc && formDoc.creator && typeof formDoc.creator === 'object') ? formDoc.creator : {};

    const customOrg = typeof settings.contactOrganization === 'string' ? settings.contactOrganization.trim() : '';
    const creatorOrg = creator.organization ? exports.getLocalizedTitle(creator.organization, '') : '';

    let formOrgFallback = '';
    if (formDoc && Array.isArray(formDoc.organization)) {
        for (const org of formDoc.organization) {
            if (!org || isGeneralOrgEntry(org)) continue;
            const title = exports.getLocalizedTitle(org, '');
            if (title) {
                formOrgFallback = title;
                break;
            }
        }
    }

    const contactOrganization = customOrg || creatorOrg || formOrgFallback || fallbackOrganization || 'Digital University';

    const customEmail = typeof settings.contactEmail === 'string' ? settings.contactEmail.trim() : '';
    const creatorEmail = typeof creator.email === 'string' ? creator.email.trim() : '';
    const rawFallbackEmail = typeof fallbackEmail === 'string' ? fallbackEmail.trim() : '';

    let contactEmail = '';
    if (exports.isValidEmail(customEmail)) {
        contactEmail = customEmail;
    } else if (exports.isValidEmail(creatorEmail)) {
        contactEmail = creatorEmail;
    } else if (exports.isValidEmail(rawFallbackEmail)) {
        contactEmail = rawFallbackEmail;
    }

    return {
        contactOrganization,
        contactEmail
    };
};
