'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongo = require('mongodb');

let devEphemeralJwtSecret = null;

function isDeveloperEnv() {
    return (process.env.APP_ENV || 'production').toLowerCase() === 'developer';
}

function getJwtSecret() {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    }
    if (isDeveloperEnv()) {
        if (!devEphemeralJwtSecret) {
            devEphemeralJwtSecret = crypto.randomBytes(32).toString('hex');
        }
        return devEphemeralJwtSecret;
    }
    throw new Error('JWT_SECRET environment variable is required when APP_ENV is not developer');
}

function getVerificationJwtSecret() {
    try {
        return getJwtSecret();
    } catch (err) {
        return null;
    }
}

function toIdString(val) {
    if (!val && val !== 0) return '';
    if (typeof val === 'object') {
        if (val instanceof mongo.ObjectId || val._bsontype === 'ObjectId' || typeof val.toHexString === 'function') {
            return String(val).trim();
        }
        if (val._id !== undefined) return toIdString(val._id);
        if (val.value !== undefined) return toIdString(val.value);
        if (val.id !== undefined && !Buffer.isBuffer(val.id)) return toIdString(val.id);
        return String(val).trim();
    }
    return String(val).trim();
}

function isValidObjectId(val) {
    const str = toIdString(val);
    if (!str || str === 'null' || str === 'undefined') return false;
    return mongo.ObjectId.isValid(str) && String(new mongo.ObjectId(str)) === str;
}

function normalizeGuestSessionId(val) {
    if (!val || typeof val !== 'string') return null;
    const trimmed = val.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
    return trimmed.slice(0, 128);
}

function sanitizeResponderInput(val) {
    const str = toIdString(val);
    if (!str || str === 'null' || str === 'undefined') return null;
    return isValidObjectId(str) ? str : null;
}

const SCHEDULE_MODES = ['always', 'range', 'end_only', 'scheduled'];

function parseValidDate(val) {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
}

function getNowMs(now = new Date()) {
    const parsed = parseValidDate(now);
    return parsed ? parsed.getTime() : Date.now();
}

function resolveScheduleMode(schedule, now = new Date()) {
    if (schedule && SCHEDULE_MODES.includes(schedule.mode)) {
        return schedule.mode;
    }
    const start = parseValidDate(schedule && schedule.startAt);
    const end = parseValidDate(schedule && schedule.endAt);
    if (!start && end) return 'end_only';
    if (start && end) return 'range';
    if (start && !end) {
        return getNowMs(now) < start.getTime() ? 'scheduled' : 'always';
    }
    return 'always';
}

function isSchedulePublished(schedule) {
    if (!schedule || typeof schedule !== 'object') return false;
    if (typeof schedule.isPublished === 'boolean') {
        return schedule.isPublished;
    }
    // Backward compatibility: legacy records without explicit isPublished flag
    return Boolean(parseValidDate(schedule.startAt) || parseValidDate(schedule.endAt));
}

function getScheduleStatus(schedule, now = new Date()) {
    if (!schedule || typeof schedule !== 'object') return 'draft';

    // Explicit draft gate: never treat an unpublished form as open/closed/scheduled
    if (schedule.isPublished === false) return 'draft';

    const start = parseValidDate(schedule.startAt);
    const end = parseValidDate(schedule.endAt);
    const mode = schedule.mode;

    if (schedule.isPublished === true) {
        if (!start && !end) {
            return mode === 'always' ? 'open_forever' : 'draft';
        }
        if (!start && end) return 'closed_forever';
        if (end && end.getTime() <= start.getTime()) return 'closed';

        const nowMs = getNowMs(now);
        if (nowMs < start.getTime()) return 'scheduled';
        if (!end) return 'open_forever';
        if (nowMs <= end.getTime()) return 'open';
        return 'closed';
    }

    if (!start && !end) return 'draft';
    if (!start && end) return 'closed_forever';
    if (end && end.getTime() <= start.getTime()) return 'closed';

    const nowMs = getNowMs(now);
    if (nowMs < start.getTime()) return 'scheduled';
    if (!end) return 'open_forever';
    if (nowMs <= end.getTime()) return 'open';
    return 'closed';
}

function isFormOpenForSubmission(schedule, now = new Date()) {
    const status = getScheduleStatus(schedule, now);
    return status === 'open' || status === 'open_forever';
}

/**
 * Validates schedule date integrity while editing or before publishing.
 * Checks past end dates, reversed ranges, future-start requirement for 'scheduled',
 * and optionally enforces required dates for publishing (`requireComplete`).
 */
function validateScheduleConfig(schedule, { now = new Date(), requireComplete = false } = {}) {
    const sched = (schedule && typeof schedule === 'object') ? schedule : {};
    const mode = resolveScheduleMode(sched, now);
    const start = parseValidDate(sched.startAt);
    const end = parseValidDate(sched.endAt);
    const nowMs = getNowMs(now);
    const isPublished = sched.isPublished === true;

    if (mode === 'always') {
        return { valid: true, mode, reason: null, field: null, message: '' };
    }

    if (mode === 'end_only') {
        if (!end) {
            return requireComplete
                ? { valid: false, mode, reason: 'END_REQUIRED', field: 'endAt', message: 'End date and time is required before publishing.' }
                : { valid: true, mode, reason: null, field: null, message: '' };
        }
        if (end.getTime() <= nowMs) {
            return { valid: false, mode, reason: 'END_IN_PAST', field: 'endAt', message: 'End date and time cannot be in the past.' };
        }
        return { valid: true, mode, reason: null, field: null, message: '' };
    }

    if (mode === 'range') {
        if (end && end.getTime() <= nowMs) {
            return { valid: false, mode, reason: 'END_IN_PAST', field: 'endAt', message: 'End date and time cannot be in the past.' };
        }
        if (start && end && end.getTime() <= start.getTime()) {
            return { valid: false, mode, reason: 'END_BEFORE_START', field: 'endAt', message: 'End date and time must be later than start date and time.' };
        }
        if (requireComplete && (!start || !end)) {
            return { valid: false, mode, reason: 'RANGE_DATES_REQUIRED', field: !start ? 'startAt' : 'endAt', message: 'Both start and end dates are required before publishing.' };
        }
        return { valid: true, mode, reason: null, field: null, message: '' };
    }

    // mode === 'scheduled'
    if (start && (!isPublished || requireComplete) && start.getTime() <= nowMs) {
        return { valid: false, mode, reason: 'START_MUST_BE_FUTURE', field: 'startAt', message: 'Scheduled start date and time must be in the future.' };
    }
    if (end && end.getTime() <= nowMs) {
        return { valid: false, mode, reason: 'END_IN_PAST', field: 'endAt', message: 'End date and time cannot be in the past.' };
    }
    if (start && end && end.getTime() <= start.getTime()) {
        return { valid: false, mode, reason: 'END_BEFORE_START', field: 'endAt', message: 'End date and time must be later than start date and time.' };
    }
    if (requireComplete && !start) {
        return { valid: false, mode, reason: 'START_REQUIRED', field: 'startAt', message: 'Scheduled start date and time is required before publishing.' };
    }
    return { valid: true, mode, reason: null, field: null, message: '' };
}

function validateScheduleForPublish(schedule, now = new Date()) {
    return validateScheduleConfig(schedule, { now, requireComplete: true });
}

function buildPublishedSchedule(schedule, now = new Date()) {
    const check = validateScheduleForPublish(schedule, now);
    if (!check.valid) {
        return { ...check, schedule: null };
    }
    const sched = (schedule && typeof schedule === 'object') ? schedule : {};
    const mode = check.mode;
    const nowIso = new Date(getNowMs(now)).toISOString();
    const start = parseValidDate(sched.startAt);
    const end = parseValidDate(sched.endAt);

    let nextSchedule;
    if (mode === 'always') {
        nextSchedule = { isPublished: true, mode: 'always', startAt: nowIso, endAt: null };
    } else if (mode === 'end_only') {
        nextSchedule = { isPublished: true, mode: 'end_only', startAt: nowIso, endAt: end.toISOString() };
    } else if (mode === 'range') {
        nextSchedule = { isPublished: true, mode: 'range', startAt: start.toISOString(), endAt: end.toISOString() };
    } else {
        nextSchedule = { isPublished: true, mode: 'scheduled', startAt: start.toISOString(), endAt: end ? end.toISOString() : null };
    }
    return { valid: true, mode, reason: null, field: null, message: '', schedule: nextSchedule };
}

const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmailAddress(val) {
    if (typeof val !== 'string') return false;
    return SIMPLE_EMAIL_REGEX.test(val.trim());
}

function normalizeAllowedEmails(rawList) {
    const items = Array.isArray(rawList)
        ? rawList
        : (typeof rawList === 'string' ? rawList.split(/[\s,;]+/) : []);
    const seen = new Set();
    const normalized = [];
    items.forEach((entry) => {
        if (typeof entry !== 'string') return;
        const email = entry.trim().toLowerCase();
        if (!email || !isValidEmailAddress(email) || seen.has(email)) return;
        seen.add(email);
        normalized.push(email);
    });
    return normalized;
}

const GENERAL_ORG_ID = '6a0b51af2dbf6e77c4df73fe';

function isGeneralOrgEntry(orgRef) {
    if (!orgRef) return false;
    if (toIdString(orgRef) === GENERAL_ORG_ID) return true;
    if (typeof orgRef === 'object') {
        const titles = Array.isArray(orgRef.title) ? orgRef.title : [];
        if (titles.some(t => t && typeof t.value === 'string' && ['general', 'ทั่วไป'].includes(t.value.trim().toLowerCase()))) {
            return true;
        }
        if (typeof orgRef.name === 'string' && ['general', 'ทั่วไป'].includes(orgRef.name.trim().toLowerCase())) {
            return true;
        }
    }
    return false;
}

function isMfuInstitutionalEmail(email) {
    if (typeof email !== 'string') return false;
    const clean = email.trim().toLowerCase();
    const atIdx = clean.lastIndexOf('@');
    if (atIdx < 1) return false;
    const domain = clean.slice(atIdx + 1);
    return domain === 'mfu.ac.th' || domain === 'lamduan.mfu.ac.th';
}

function resolveFormAccessMode(form) {
    const doc = (form && typeof form === 'object') ? form : {};
    const s = (doc.settings && typeof doc.settings === 'object') ? doc.settings : {};
    if (s.accessMode === 'private' || s.accessMode === 'public') {
        return s.accessMode;
    }

    const orgs = Array.isArray(doc.organization) ? doc.organization.filter(Boolean) : [];
    const hasAllowedUsers = Array.isArray(s.allowedUser) && s.allowedUser.length > 0;
    const hasAllowedEmails = normalizeAllowedEmails(s.allowedEmails).length > 0;
    const hasAllowedRoles = Array.isArray(s.allowedRoles) && s.allowedRoles.length > 0;

    if (hasAllowedUsers || hasAllowedEmails || hasAllowedRoles) {
        return 'private';
    }
    if (orgs.length > 0 && !orgs.some(isGeneralOrgEntry)) {
        return 'private';
    }
    return 'public';
}

function isLoginRequiredByForm(form) {
    const s = (form && form.settings) || {};
    if (resolveFormAccessMode(form) === 'private') {
        return true;
    }
    if (s.accessMode === 'public') {
        return Boolean(s.requireLogin);
    }
    return Boolean(s.requireLogin || s.collectEmail);
}

function isUserAllowedByOrganizationAndRole(form, userDoc) {
    if (!form) {
        return { allowed: false, reason: 'ACCESS_DENIED_ORG', message: 'Your organization is not permitted to access this form.' };
    }
    const formOrgs = Array.isArray(form.organization) ? form.organization.filter(Boolean) : [];
    if (formOrgs.length === 0) {
        return {
            allowed: false,
            reason: 'ACCESS_DENIED_ORG',
            message: 'An authorized organization must be selected when role restrictions are configured.'
        };
    }

    const isPublicGeneral = formOrgs.some(isGeneralOrgEntry);
    const userOrgId = userDoc ? toIdString(userDoc.organization) : '';
    const formOrgIds = formOrgs.map(toIdString).filter(Boolean);
    const orgMatches = isPublicGeneral || (Boolean(userOrgId) && formOrgIds.includes(userOrgId));

    if (!orgMatches) {
        return {
            allowed: false,
            reason: 'ACCESS_DENIED_ORG',
            message: 'Your organization is not permitted to access this form.'
        };
    }

    const settings = form.settings || {};
    const allowedRoles = Array.isArray(settings.allowedRoles) ? settings.allowedRoles : [];
    if (allowedRoles.length > 0) {
        const userRoleId = userDoc ? toIdString(userDoc.role) : '';
        const isAllowedRole = Boolean(userRoleId) && allowedRoles.some(r => toIdString(r) === userRoleId);
        if (!isAllowedRole) {
            return {
                allowed: false,
                reason: 'ACCESS_DENIED_ROLE',
                message: 'Your role within the authorized organization is not permitted to access this form.'
            };
        }
    }

    return { allowed: true };
}

function isUserAllowedByIndividualAccess(settings = {}, userId = null, userEmail = '') {
    const s = settings || {};
    const hasAllowedUsers = Array.isArray(s.allowedUser) && s.allowedUser.length > 0;
    const allowedEmailList = normalizeAllowedEmails(s.allowedEmails);
    if (!hasAllowedUsers && allowedEmailList.length === 0) {
        return true;
    }

    const uid = sanitizeResponderInput(userId) || toIdString(userId);
    if (uid && hasAllowedUsers && s.allowedUser.some(u => toIdString(u) === uid)) {
        return true;
    }

    const normalizedUserEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
    if (normalizedUserEmail && allowedEmailList.includes(normalizedUserEmail)) {
        return true;
    }

    return false;
}

function normalizeMaxResponses(val) {
    if (val === null || val === undefined || val === '') return null;
    const parsed = Number(val);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.floor(parsed);
}

function isAdminUser(userDoc) {
    if (!userDoc || !userDoc.role) return false;
    const roleTitle = userDoc.role.title !== undefined ? userDoc.role.title : userDoc.role;
    if (Array.isArray(roleTitle)) {
        return roleTitle.some(t => t && t.value && String(t.value).toLowerCase().includes('admin'));
    }
    return String(roleTitle || '').toLowerCase().includes('admin');
}

const KNOWN_ROLE_IDS = {
    ADMIN: '69aec1c73996270d703db3d7',
    STUDENT: '69e9e2226c400846810ef687',
    STAFF: '69e9e2226c400846810ef689',
    LECTURER: '69e9e2226c400846810ef688'
};

const MANAGE_PAGE_KEYS = new Set(['manage', 'forms-management', 'create', 'manage-forms', 'manageforms']);

function canManageForms(userDoc) {
    if (!userDoc || typeof userDoc !== 'object') return false;

    const role = userDoc.role !== undefined ? userDoc.role : (userDoc.permission || userDoc.title ? userDoc : null);
    if (!role) return false;

    const roleId = toIdString(role);

    const texts = [];
    if (typeof role === 'string') {
        texts.push(role);
    } else if (typeof role === 'object') {
        if (role.name) texts.push(String(role.name));
        if (typeof role.title === 'string') {
            texts.push(role.title);
        } else if (Array.isArray(role.title)) {
            role.title.forEach(t => {
                if (t && t.value) texts.push(String(t.value));
            });
        }
    }
    const combinedText = texts.join(' ').toLowerCase();

    // 1. Admin role
    if (roleId === KNOWN_ROLE_IDS.ADMIN || combinedText.includes('admin') || combinedText.includes('ผู้ดูแลระบบ')) {
        return true;
    }

    // 2. Role permission matrix grants access on page "manage" / "forms-management" / "create"
    const permissions = (typeof role === 'object' && Array.isArray(role.permission)) ? role.permission : [];
    const manageEntries = permissions.filter(p => {
        if (!p || !p.page) return false;
        const normalized = String(p.page).trim().toLowerCase().replace(/\s+/g, '-');
        return MANAGE_PAGE_KEYS.has(normalized);
    });

    if (manageEntries.length > 0) {
        const grantsAccess = manageEntries.some(entry => {
            if (!entry || !entry.access) return false;
            if (Array.isArray(entry.access)) {
                return entry.access.some(a => a && (a.value === true || String(a.value).toLowerCase() === 'true'));
            }
            if (typeof entry.access === 'object') {
                return Object.values(entry.access).some(val => val === true || String(val).toLowerCase() === 'true');
            }
            return entry.access === true;
        });
        if (grantsAccess) {
            return true;
        }
        return false;
    }

    // 3. (matrix has no entry for the manage page) -> Staff or Lecturer role
    const isStaff = roleId === KNOWN_ROLE_IDS.STAFF ||
        combinedText.includes('staff') ||
        combinedText.includes('เจ้าหน้าที่') ||
        combinedText.includes('บุคลากร');

    const isLecturer = roleId === KNOWN_ROLE_IDS.LECTURER ||
        combinedText.includes('lecturer') ||
        combinedText.includes('อาจารย์');

    if (isStaff || isLecturer) {
        return true;
    }

    // Users with no role, a Student role, or an unknown role => false
    return false;
}

function getCollaboratorAccessRole(formDoc, userId) {
    const uid = sanitizeResponderInput(userId);
    if (!formDoc || !uid) return null;

    if (toIdString(formDoc.creator) === uid) {
        return 'creator';
    }

    if (!Array.isArray(formDoc.collaborator)) {
        return null;
    }

    const match = formDoc.collaborator.find((c) => toIdString(c && c.user) === uid);
    if (!match) return null;

    const rawTitle = match.type && match.type.title !== undefined ? match.type.title : match.type;
    const titleStr = Array.isArray(rawTitle)
        ? rawTitle.map((t) => String((t && t.value) || '')).join(' ').toLowerCase()
        : String(rawTitle || '').toLowerCase();

    if (titleStr.includes('edit') || titleStr.includes('แก้ไข')) {
        return 'editor';
    }
    return 'viewer';
}

function isCollaboratorUser(formDoc, userId) {
    const accessRole = getCollaboratorAccessRole(formDoc, userId);
    return accessRole === 'editor' || accessRole === 'viewer';
}

function canUserManageOrViewForm(formDoc, userDoc) {
    if (!formDoc || !userDoc) return false;
    if (isAdminUser(userDoc)) return true;
    const accessRole = getCollaboratorAccessRole(formDoc, userDoc._id || userDoc.id);
    return accessRole === 'creator' || accessRole === 'editor' || accessRole === 'viewer';
}

function buildManagedFormsQuery(userDoc) {
    if (!userDoc) return null;
    if (isAdminUser(userDoc)) return {};
    const uid = sanitizeResponderInput(userDoc._id || userDoc.id);
    if (!uid) return null;
    const objId = new mongo.ObjectId(uid);
    return {
        $or: [
            { creator: objId },
            { collaborator: { $elemMatch: { user: objId } } }
        ]
    };
}

function extractBearerToken(request) {
    const authHeader = request && request.headers && request.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') return null;
    const parts = authHeader.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        return parts[1];
    }
    return null;
}

/**
 * Resolves respondent identity from verified JWT (or developer-mode header/body) and guest session ID.
 * Never trusts spoofed body.responder outside APP_ENV=developer without a valid JWT.
 */
function resolveRequestIdentity({ request, body = {} }) {
    const guestSessionId = normalizeGuestSessionId(body.guestSessionId || (request && request.headers && request.headers['x-guest-session-id']));

    if (request && request.user && (request.user.id || request.user._id)) {
        const reqUserId = sanitizeResponderInput(request.user.id || request.user._id);
        if (reqUserId) {
            return { userId: reqUserId, source: 'request-user', guestSessionId };
        }
    }

    const token = (request && request.cookies && request.cookies.token) || extractBearerToken(request);
    const verifySecret = getVerificationJwtSecret();
    if (token && verifySecret) {
        try {
            const decoded = jwt.verify(token, verifySecret);
            const jwtUserId = sanitizeResponderInput(decoded && decoded.userId);
            if (jwtUserId) {
                return { userId: jwtUserId, source: 'jwt', guestSessionId };
            }
        } catch (err) {
            // Invalid or expired token falls through cleanly as unauthenticated
        }
    }

    if (isDeveloperEnv()) {
        const bodyResponderId = sanitizeResponderInput(body.responder);
        if (bodyResponderId) {
            return { userId: bodyResponderId, source: 'developer-body', guestSessionId };
        }
    }

    return { userId: null, source: 'guest', guestSessionId };
}

/**
 * Resolves caller identity for read-scoped endpoints (Analytics / Manage Forms / Response pools).
 * In production, only verified JWT/request.user is trusted; in developer mode an explicit dev fallbackId may override.
 */
function resolveReadScopeUserId({ request, fallbackId = null } = {}) {
    if (request && request.user && (request.user.id || request.user._id)) {
        const reqUserId = sanitizeResponderInput(request.user.id || request.user._id);
        if (reqUserId) {
            return { userId: reqUserId, source: 'request-user' };
        }
    }

    let jwtUserId = null;
    const token = (request && request.cookies && request.cookies.token) || extractBearerToken(request);
    const verifySecret = getVerificationJwtSecret();
    if (token && verifySecret) {
        try {
            const decoded = jwt.verify(token, verifySecret);
            jwtUserId = sanitizeResponderInput(decoded && decoded.userId);
        } catch (err) {
            jwtUserId = null;
        }
    }

    if (isDeveloperEnv()) {
        const devFallback = sanitizeResponderInput(fallbackId);
        if (devFallback) {
            return { userId: devFallback, source: jwtUserId ? 'developer-override' : 'developer-fallback', jwtUserId };
        }
    }

    if (jwtUserId) {
        return { userId: jwtUserId, source: 'jwt', jwtUserId };
    }

    return { userId: null, source: 'unauthenticated', jwtUserId: null };
}

function deny(code, reason, message) {
    return { allowed: false, code, reason, message };
}

/**
 * Pure validator for form response creation and updates against schedule, auth/access,
 * single-response limits, post-submit editing, and max quota settings.
 */
function validateResponseMutation({
    form,
    identity = {},
    isSubmitting = false,
    existingResponse = null,
    alreadySubmittedResponse = null,
    submittedCount = 0,
    userDoc = null,
    now = new Date()
}) {
    if (!form) {
        return deny(40400, 'FORM_NOT_FOUND', 'Form not found.');
    }

    const schedStatus = getScheduleStatus(form.schedule, now);
    if (schedStatus === 'draft') {
        return deny(40300, 'FORM_DRAFT', 'This form is still a draft and not accepting responses.');
    }
    if (schedStatus === 'scheduled') {
        return deny(40300, 'FORM_SCHEDULED', 'This form is not open yet.');
    }
    if (schedStatus === 'closed' || schedStatus === 'closed_forever') {
        return deny(40300, 'FORM_CLOSED', 'This form is closed and no longer accepting responses.');
    }

    const settings = form.settings || {};
    const userId = sanitizeResponderInput(identity.userId);
    const guestSessionId = normalizeGuestSessionId(identity.guestSessionId);
    const accessMode = resolveFormAccessMode(form);
    const isPrivateMode = accessMode === 'private';
    const requiresLogin = isLoginRequiredByForm(form);

    if (requiresLogin) {
        if (!userId || !userDoc) {
            return deny(40100, 'LOGIN_REQUIRED', 'Sign-in is required to access or submit this form.');
        }

        if (isPrivateMode && !isAdminUser(userDoc)) {
            const hasAllowedUsers = Array.isArray(settings.allowedUser) && settings.allowedUser.length > 0;
            const allowedEmailList = normalizeAllowedEmails(settings.allowedEmails);
            const hasIndividualAccess = hasAllowedUsers || allowedEmailList.length > 0;
            const formOrgs = Array.isArray(form.organization) ? form.organization.filter(Boolean) : [];
            const hasSelectedOrgs = formOrgs.length > 0;
            const hasAllowedRoles = Array.isArray(settings.allowedRoles) && settings.allowedRoles.length > 0;
            const hasOrgOrRoleScope = hasSelectedOrgs || hasAllowedRoles;

            const isAllowedIndividual = hasIndividualAccess
                && isUserAllowedByIndividualAccess(settings, userId, userDoc.email);

            if (!isAllowedIndividual) {
                if (hasOrgOrRoleScope) {
                    if (typeof userDoc.email === 'string' && userDoc.email.trim() && !isMfuInstitutionalEmail(userDoc.email)) {
                        return deny(40300, 'ACCESS_DENIED_MFU_DOMAIN', 'Private forms accept university accounts (@lamduan.mfu.ac.th / @mfu.ac.th) only.');
                    }
                    const orgRoleCheck = isUserAllowedByOrganizationAndRole(form, userDoc);
                    if (!orgRoleCheck.allowed) {
                        return deny(40300, orgRoleCheck.reason, orgRoleCheck.message);
                    }
                } else if (hasIndividualAccess) {
                    return deny(40300, 'ACCESS_DENIED_USER', 'You do not have permission to access this form.');
                } else {
                    if (typeof userDoc.email === 'string' && userDoc.email.trim() && !isMfuInstitutionalEmail(userDoc.email)) {
                        return deny(40300, 'ACCESS_DENIED_MFU_DOMAIN', 'Private forms accept university accounts (@lamduan.mfu.ac.th / @mfu.ac.th) only.');
                    }
                    const orgRoleCheck = isUserAllowedByOrganizationAndRole(form, userDoc);
                    if (!orgRoleCheck.allowed) {
                        return deny(40300, orgRoleCheck.reason, orgRoleCheck.message);
                    }
                }
            }
        }
    } else if (!userId && !guestSessionId && settings.limitResponse) {
        return deny(40000, 'GUEST_SESSION_REQUIRED', 'Guest session identifier is required for limited public forms.');
    }

    if (existingResponse) {
        const existingUserId = sanitizeResponderInput(existingResponse.responder);
        const existingGuestId = normalizeGuestSessionId(existingResponse.guestSessionId);
        const isOwner = existingUserId
            ? Boolean(userId && existingUserId === userId)
            : Boolean(existingGuestId && guestSessionId && existingGuestId === guestSessionId);

        if (!isOwner && !isAdminUser(userDoc)) {
            return deny(40300, 'RESPONSE_OWNERSHIP_DENIED', 'You cannot modify another respondent response.');
        }

        if (existingResponse.submit === true) {
            if (!settings.allowEditAfterSubmit) {
                return deny(40300, 'EDIT_NOT_ALLOWED', 'Editing responses after submission is disabled for this form.');
            }
            return { allowed: true, mode: 'edit_submitted' };
        }
    }

    if (settings.limitResponse && alreadySubmittedResponse) {
        const isSameExisting = existingResponse && toIdString(alreadySubmittedResponse._id) === toIdString(existingResponse._id);
        if (!isSameExisting) {
            return deny(40900, 'LIMIT_RESPONSE_REACHED', 'You have already submitted a response to this form.');
        }
    }

    const quota = normalizeMaxResponses(settings.maxResponses);
    if (isSubmitting && quota !== null && Number(submittedCount || 0) >= quota) {
        return deny(40300, 'QUOTA_REACHED', 'Maximum number of responses has been reached.');
    }

    return { allowed: true, mode: existingResponse ? 'update_draft' : 'create' };
}

module.exports = {
    isDeveloperEnv,
    getJwtSecret,
    toIdString,
    isValidObjectId,
    normalizeGuestSessionId,
    sanitizeResponderInput,
    SCHEDULE_MODES,
    resolveScheduleMode,
    isSchedulePublished,
    getScheduleStatus,
    isFormOpenForSubmission,
    validateScheduleConfig,
    validateScheduleForPublish,
    buildPublishedSchedule,
    isLoginRequiredByForm,
    isGeneralOrgEntry,
    isMfuInstitutionalEmail,
    resolveFormAccessMode,
    isValidEmailAddress,
    normalizeAllowedEmails,
    isUserAllowedByIndividualAccess,
    isUserAllowedByOrganizationAndRole,
    normalizeMaxResponses,
    isAdminUser,
    canManageForms,
    getCollaboratorAccessRole,
    isCollaboratorUser,
    canUserManageOrViewForm,
    buildManagedFormsQuery,
    resolveRequestIdentity,
    resolveReadScopeUserId,
    validateResponseMutation
};
