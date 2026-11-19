import { pickLocalizedText } from '@/projects/utils/analyticsWorkbook';

export const SCHEDULE_MODES = ['always', 'range', 'end_only', 'scheduled'];

function parseValidDate(val) {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
}

function getNowMs(now = new Date()) {
    const parsed = parseValidDate(now);
    return parsed ? parsed.getTime() : Date.now();
}

export function resolveScheduleMode(schedule, now = new Date()) {
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

export function isSchedulePublished(schedule) {
    if (!schedule || typeof schedule !== 'object') return false;
    if (typeof schedule.isPublished === 'boolean') {
        return schedule.isPublished;
    }
    // Backward compatibility: legacy records without explicit isPublished flag
    return Boolean(parseValidDate(schedule.startAt) || parseValidDate(schedule.endAt));
}

export function getScheduleStatus(schedule, now = new Date()) {
    if (!schedule || typeof schedule !== 'object') return 'draft';

    // Explicit draft gate: unpublished forms remain Draft regardless of configured dates
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

export function isFormOpenForSubmission(schedule, now = new Date()) {
    const status = getScheduleStatus(schedule, now);
    return status === 'open' || status === 'open_forever';
}

export function validateScheduleConfig(schedule, { now = new Date(), requireComplete = false } = {}) {
    const sched = (schedule && typeof schedule === 'object') ? schedule : {};
    const mode = resolveScheduleMode(sched, now);
    const start = parseValidDate(sched.startAt);
    const end = parseValidDate(sched.endAt);
    const nowMs = getNowMs(now);
    const isPublished = sched.isPublished === true;

    if (mode === 'always') {
        return { valid: true, mode, reason: null, field: null };
    }

    if (mode === 'end_only') {
        if (!end) {
            return requireComplete
                ? { valid: false, mode, reason: 'END_REQUIRED', field: 'endAt' }
                : { valid: true, mode, reason: null, field: null };
        }
        if (end.getTime() <= nowMs) {
            return { valid: false, mode, reason: 'END_IN_PAST', field: 'endAt' };
        }
        return { valid: true, mode, reason: null, field: null };
    }

    if (mode === 'range') {
        if (end && end.getTime() <= nowMs) {
            return { valid: false, mode, reason: 'END_IN_PAST', field: 'endAt' };
        }
        if (start && end && end.getTime() <= start.getTime()) {
            return { valid: false, mode, reason: 'END_BEFORE_START', field: 'endAt' };
        }
        if (requireComplete && (!start || !end)) {
            return { valid: false, mode, reason: 'RANGE_DATES_REQUIRED', field: !start ? 'startAt' : 'endAt' };
        }
        return { valid: true, mode, reason: null, field: null };
    }

    // mode === 'scheduled'
    if (start && (!isPublished || requireComplete) && start.getTime() <= nowMs) {
        return { valid: false, mode, reason: 'START_MUST_BE_FUTURE', field: 'startAt' };
    }
    if (end && end.getTime() <= nowMs) {
        return { valid: false, mode, reason: 'END_IN_PAST', field: 'endAt' };
    }
    if (start && end && end.getTime() <= start.getTime()) {
        return { valid: false, mode, reason: 'END_BEFORE_START', field: 'endAt' };
    }
    if (requireComplete && !start) {
        return { valid: false, mode, reason: 'START_REQUIRED', field: 'startAt' };
    }
    return { valid: true, mode, reason: null, field: null };
}

export function validateScheduleForPublish(schedule, now = new Date()) {
    return validateScheduleConfig(schedule, { now, requireComplete: true });
}

export function buildPublishedSchedule(schedule, now = new Date()) {
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
    return { valid: true, mode, reason: null, field: null, schedule: nextSchedule };
}

export function buildUnpublishedSchedule(schedule) {
    const sched = (schedule && typeof schedule === 'object') ? schedule : {};
    const mode = resolveScheduleMode(sched);
    const end = parseValidDate(sched.endAt);
    const start = parseValidDate(sched.startAt);

    if (mode === 'always') {
        return { isPublished: false, mode: 'always', startAt: null, endAt: null };
    }
    if (mode === 'end_only') {
        return { isPublished: false, mode: 'end_only', startAt: null, endAt: end ? end.toISOString() : null };
    }
    return {
        isPublished: false,
        mode,
        startAt: start ? start.toISOString() : null,
        endAt: end ? end.toISOString() : null
    };
}

export function getScheduleValidationMessageKey(reason) {
    switch (reason) {
        case 'END_IN_PAST':
            return 'editor.settings.status.endInPast';
        case 'END_BEFORE_START':
            return 'editor.settings.status.endBeforeStart';
        case 'START_MUST_BE_FUTURE':
            return 'editor.settings.status.startMustBeFuture';
        case 'END_REQUIRED':
            return 'editor.settings.status.endRequired';
        case 'RANGE_DATES_REQUIRED':
            return 'editor.settings.status.rangeDatesRequired';
        case 'START_REQUIRED':
            return 'editor.settings.status.startRequired';
        default:
            return '';
    }
}

const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailAddress(val) {
    if (typeof val !== 'string') return false;
    return SIMPLE_EMAIL_REGEX.test(val.trim());
}

export function normalizeAllowedEmails(rawList) {
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

export function parseEmailInputList(rawText = '') {
    const tokens = String(rawText || '')
        .split(/[\s,;]+/)
        .map(t => t.trim())
        .filter(Boolean);
    const validEmails = [];
    const invalidEntries = [];
    const seen = new Set();
    tokens.forEach((token) => {
        const lower = token.toLowerCase();
        if (isValidEmailAddress(lower)) {
            if (!seen.has(lower)) {
                seen.add(lower);
                validEmails.push(lower);
            }
        } else {
            invalidEntries.push(token);
        }
    });
    return { validEmails, invalidEntries };
}

export function isMfuInstitutionalEmail(email) {
    if (typeof email !== 'string') return false;
    const clean = email.trim().toLowerCase();
    const atIdx = clean.lastIndexOf('@');
    if (atIdx < 1) return false;
    const domain = clean.slice(atIdx + 1);
    return domain === 'mfu.ac.th' || domain === 'lamduan.mfu.ac.th';
}

export function resolveFormAccessMode(form) {
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

export function isLoginRequiredByForm(form) {
    const s = (form && form.settings) || {};
    if (resolveFormAccessMode(form) === 'private') {
        return true;
    }
    if (s.accessMode === 'public') {
        return Boolean(s.requireLogin);
    }
    return Boolean(s.requireLogin || s.collectEmail);
}

const GENERAL_ORG_ID = '6a0b51af2dbf6e77c4df73fe';

export function isGeneralOrgEntry(orgRef) {
    if (!orgRef) return false;
    if (toPolicyIdStr(orgRef) === GENERAL_ORG_ID) return true;
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

export function isUserAllowedByOrganizationAndRole(form, currentUser) {
    if (!form) {
        return { allowed: false, reason: 'ACCESS_DENIED_ORG' };
    }
    const formOrgs = Array.isArray(form.organization) ? form.organization.filter(Boolean) : [];
    if (formOrgs.length === 0) {
        return { allowed: false, reason: 'ACCESS_DENIED_ORG' };
    }

    const isPublicGeneral = formOrgs.some(isGeneralOrgEntry);
    const userOrgId = currentUser ? toPolicyIdStr(currentUser.organization) : '';
    const formOrgIds = formOrgs.map(toPolicyIdStr).filter(Boolean);
    const orgMatches = isPublicGeneral || (Boolean(userOrgId) && formOrgIds.includes(userOrgId));

    if (!orgMatches) {
        return { allowed: false, reason: 'ACCESS_DENIED_ORG' };
    }

    const settings = form.settings || {};
    const allowedRoles = Array.isArray(settings.allowedRoles) ? settings.allowedRoles : [];
    if (allowedRoles.length > 0) {
        const userRoleId = currentUser ? toPolicyIdStr(currentUser.role) : '';
        const isAllowedRole = Boolean(userRoleId) && allowedRoles.some(r => toPolicyIdStr(r) === userRoleId);
        if (!isAllowedRole) {
            return { allowed: false, reason: 'ACCESS_DENIED_ROLE' };
        }
    }

    return { allowed: true };
}

export function isUserAllowedByIndividualAccess(settings = {}, userId = null, userEmail = '') {
    const s = settings || {};
    const hasAllowedUsers = Array.isArray(s.allowedUser) && s.allowedUser.length > 0;
    const allowedEmailList = normalizeAllowedEmails(s.allowedEmails);
    if (!hasAllowedUsers && allowedEmailList.length === 0) {
        return true;
    }

    const uid = toPolicyIdStr(userId);
    if (uid && hasAllowedUsers && s.allowedUser.some(u => toPolicyIdStr(u) === uid)) {
        return true;
    }

    const normalizedUserEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
    if (normalizedUserEmail && allowedEmailList.includes(normalizedUserEmail)) {
        return true;
    }

    return false;
}

export function normalizeMaxResponses(val) {
    if (val === null || val === undefined || val === '') return null;
    const parsed = Number(val);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.floor(parsed);
}

export function getSubmittedCountFromForm(form) {
    if (!form) return 0;
    if (Array.isArray(form.responses)) {
        return form.responses.filter(r => r && (r.submit === true || r.submit === 1 || String(r.submit).toLowerCase() === 'true')).length;
    }
    return Number(form.responsesCount || 0);
}

export function isQuotaReached(form, hasEditableExistingSubmission = false) {
    if (hasEditableExistingSubmission) return false;
    const quota = normalizeMaxResponses(form && form.settings && form.settings.maxResponses);
    if (quota === null) return false;
    return getSubmittedCountFromForm(form) >= quota;
}

export function hasAnswerValue(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (value === null || value === undefined) return false;
    return String(value).trim() !== '';
}

export function findMissingRequiredQuestions({ questions = [], answers = {}, isTypeFn, isVisibleFn, convertIdToStrFn }) {
    const getId = typeof convertIdToStrFn === 'function' ? convertIdToStrFn : (id) => String(id);
    const isNonInput = typeof isTypeFn === 'function'
        ? (q) => isTypeFn(q, 'section', 'title_description', 'image')
        : (q) => isNonInputQuestionType(q);
    const checkVisible = typeof isVisibleFn === 'function' ? isVisibleFn : () => true;

    return (questions || []).filter((q) => {
        if (!q || isNonInput(q)) return false;
        if (!checkVisible(q)) return false;
        if (!q.isRequired) return false;
        const val = answers[getId(q._id)];
        return !hasAnswerValue(val);
    });
}

export function getOrCreateGuestSessionId(formId) {
    const storageKey = `du.formfill.guest.${formId}`;
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const existing = window.localStorage.getItem(storageKey);
            if (existing && existing.trim()) return existing.trim();
            const created = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
            window.localStorage.setItem(storageKey, created);
            return created;
        }
    } catch (e) {
        // fallback below if localStorage blocked
    }
    return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function extractPolicyErrorReason(err) {
    return (err && err.response && err.response.data && err.response.data.data && err.response.data.data.reason) || '';
}

function toPolicyIdStr(val) {
    if (!val && val !== 0) return '';
    if (typeof val === 'object') {
        if (val._id) return String(val._id);
        if (val.id) return String(val.id);
    }
    return String(val);
}

export const KNOWN_ROLE_IDS = {
    ADMIN: '69aec1c73996270d703db3d7',
    STUDENT: '69e9e2226c400846810ef687',
    STAFF: '69e9e2226c400846810ef689',
    LECTURER: '69e9e2226c400846810ef688'
};

const MANAGE_PAGE_KEYS = new Set(['manage', 'forms-management', 'create', 'manage-forms', 'manageforms']);

export function canManageForms(user) {
    if (!user || typeof user !== 'object') return false;

    const role = user.role !== undefined ? user.role : (user.permission || user.title ? user : null);
    if (!role) return false;

    const roleId = toPolicyIdStr(role);

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

/**
 * Computes the set of reachable top-level question IDs from the ordered question list
 * by following active choice-level `nextQuestion` branches and question-level `nextQuestion`
 * links, falling back linearly to the next question when `nextQuestion` is unset.
 * Handles `'submit'` terminators and cyclic references safely in O(N).
 */
export function getReachableQuestionIds({ questions = [], answers = {}, followUpMap = {} } = {}) {
    const ordered = [...(Array.isArray(questions) ? questions : [])]
        .sort((a, b) => ((a && a.order) || 0) - ((b && b.order) || 0));

    const topLevel = ordered.filter((q) => {
        const qId = toPolicyIdStr(q && q._id);
        return qId && !(Array.isArray(followUpMap[qId]) && followUpMap[qId].length > 0);
    });

    const reachable = new Set();
    if (!topLevel.length) return reachable;

    const indexById = new Map();
    topLevel.forEach((q, idx) => {
        const qId = toPolicyIdStr(q && q._id);
        if (qId && !indexById.has(qId)) indexById.set(qId, idx);
    });

    const visited = new Set();
    let currentIdx = 0;

    while (currentIdx >= 0 && currentIdx < topLevel.length) {
        const q = topLevel[currentIdx];
        const qId = toPolicyIdStr(q && q._id);
        if (!qId || visited.has(qId)) break;

        visited.add(qId);
        reachable.add(qId);

        let rawTarget = null;
        const ans = answers ? answers[qId] : undefined;
        const choices = q && q.config && Array.isArray(q.config.choices) ? q.config.choices : null;
        const isMultiChoice = Boolean(
            (q && q.config && q.config.allowMultipleSelect)
            || normalizeQuestionTypeKey(q && q.type && (q.type.type || q.type.name || q.type)) === 'checkbox'
        );
        const hasChoiceBranch = Boolean(
            choices && !isMultiChoice && choices.some(c => Boolean(c && c.nextQuestion && toPolicyIdStr(c.nextQuestion)))
        );
        const isAnswered = ans !== undefined && ans !== null && String(ans).trim() !== '' && !Array.isArray(ans);

        if (hasChoiceBranch && !isAnswered) {
            break;
        }

        if (choices && isAnswered) {
            const matched = choices.find((c, cIdx) => {
                const optKey = (c && c.key !== undefined && c.key !== null) ? String(c.key) : String(cIdx);
                return optKey === String(ans);
            });
            if (matched && matched.nextQuestion) {
                rawTarget = matched.nextQuestion;
            }
        }

        if (!rawTarget && q && q.nextQuestion) {
            rawTarget = q.nextQuestion;
        }

        const targetStr = toPolicyIdStr(rawTarget);
        if (targetStr === 'submit') {
            break;
        }
        if (targetStr && indexById.has(targetStr)) {
            currentIdx = indexById.get(targetStr);
        } else {
            currentIdx += 1;
        }
    }

    return reachable;
}

export function buildActiveResponseRuleBadges(rawSettings = {}, translate = (key) => key) {
    const t = typeof translate === 'function' ? translate : (key) => key;
    const maxQuota = normalizeMaxResponses(rawSettings.maxResponses);
    const descriptors = [
        {
            key: 'collectEmail',
            icon: 'cil-envelope-closed',
            iconClass: 'setting-icon-login',
            active: Boolean(rawSettings.collectEmail),
            tooltip: t('table.settingTooltips.collectEmail')
        },
        {
            key: 'requireLogin',
            icon: 'cil-lock-locked',
            iconClass: 'setting-icon-login',
            active: Boolean(rawSettings.requireLogin),
            tooltip: t('table.settingTooltips.requireLogin')
        },
        {
            key: 'limitResponse',
            icon: 'cil-check-circle',
            iconClass: 'setting-icon-limit',
            active: Boolean(rawSettings.limitResponse),
            tooltip: t('table.settingTooltips.limitResponse')
        },
        {
            key: 'allowEditAfterSubmit',
            icon: 'cil-pencil',
            iconClass: 'setting-icon-edit',
            active: Boolean(rawSettings.allowEditAfterSubmit),
            tooltip: t('table.settingTooltips.allowEditAfterSubmit')
        },
        {
            key: 'maxResponses',
            icon: 'cil-speedometer',
            iconClass: 'setting-icon-quota',
            active: maxQuota !== null,
            valueText: maxQuota !== null ? String(maxQuota) : null,
            tooltip: maxQuota !== null ? t('table.settingTooltips.maxResponses', { count: maxQuota }) : ''
        },
        {
            key: 'emailNotifications',
            icon: 'cil-envelope-closed',
            iconClass: 'setting-icon-email',
            active: Boolean(rawSettings.emailNotifications),
            tooltip: t('table.settingTooltips.emailNotifications')
        },
        {
            key: 'notifyCreator',
            icon: 'cil-bell',
            iconClass: 'setting-icon-notify',
            active: Boolean(rawSettings.notifyCreator),
            tooltip: t('table.settingTooltips.notifyCreator')
        }
    ];
    return descriptors.filter(rule => rule.active);
}

export function buildResponseRuleDetails(
    rawSettings = {},
    translate = (key) => key,
    {
        isSignedIn = true,
        schedule = null,
        form = null,
        submittedCount = null,
        locale = 'th'
    } = {}
) {
    const t = typeof translate === 'function' ? translate : (key) => key;
    const settings = rawSettings || (form && form.settings) || {};
    const sched = schedule || (form && form.schedule) || {};
    const items = [];

    const startText = formatSettingDateSummary(sched.startAt, locale);
    const endText = formatSettingDateSummary(sched.endAt, locale);
    let periodDesc = t('form.responseSummary.periodAlwaysDesc');
    if (startText && endText) {
        periodDesc = t('form.responseSummary.periodRangeDesc', { start: startText, end: endText });
    } else if (endText) {
        periodDesc = t('form.responseSummary.periodUntilDesc', { end: endText });
    } else if (startText) {
        periodDesc = t('form.responseSummary.periodSinceDesc', { start: startText });
    }
    items.push({
        key: 'schedulePeriod',
        icon: 'cil-calendar',
        iconClass: 'setting-icon-period',
        title: t('form.responseSummary.periodTitle'),
        description: periodDesc
    });

    const effectiveForm = form || { settings };
    const requiresLogin = isLoginRequiredByForm(effectiveForm);
    items.push(
        requiresLogin
            ? {
                key: 'requireLogin',
                icon: 'cil-lock-locked',
                iconClass: 'setting-icon-login',
                title: t('table.settingTooltips.requireLogin'),
                description: t('form.responseSummary.requireLoginDesc')
            }
            : {
                key: 'noLogin',
                icon: 'cil-user',
                iconClass: 'setting-icon-login',
                title: t('form.responseSummary.noLoginTitle'),
                description: t('form.responseSummary.noLoginDesc')
            }
    );

    if (settings.collectEmail) {
        items.push({
            key: 'collectEmail',
            icon: 'cil-envelope-closed',
            iconClass: 'setting-icon-email',
            title: t('table.settingTooltips.collectEmail'),
            description: t('form.responseSummary.collectEmailDesc')
        });
    }

    items.push(
        settings.limitResponse
            ? {
                key: 'limitResponse',
                icon: 'cil-check-circle',
                iconClass: 'setting-icon-limit',
                title: t('table.settingTooltips.limitResponse'),
                description: t('form.responseSummary.limitOneDesc')
            }
            : {
                key: 'unlimitedSubmits',
                icon: 'cil-reload',
                iconClass: 'setting-icon-limit',
                title: t('form.responseSummary.unlimitedTitle'),
                description: t('form.responseSummary.unlimitedDesc')
            },
        settings.allowEditAfterSubmit
            ? {
                key: 'allowEditAfterSubmit',
                icon: 'cil-pencil',
                iconClass: 'setting-icon-edit',
                title: t('table.settingTooltips.allowEditAfterSubmit'),
                description: t('form.responseSummary.allowEditDesc')
            }
            : {
                key: 'noEditAfterSubmit',
                icon: 'cil-ban',
                iconClass: 'setting-icon-edit',
                title: t('form.responseSummary.noEditTitle'),
                description: t('form.responseSummary.noEditDesc')
            }
    );

    const maxQuota = normalizeMaxResponses(settings.maxResponses);
    if (maxQuota !== null) {
        const hasKnownCount = (typeof submittedCount === 'number' && Number.isFinite(submittedCount))
            || Boolean(form && (Array.isArray(form.responses) || typeof form.responsesCount === 'number'));
        const usedCount = typeof submittedCount === 'number' && Number.isFinite(submittedCount)
            ? Math.max(0, Math.floor(submittedCount))
            : (hasKnownCount ? getSubmittedCountFromForm(form) : null);
        const remaining = usedCount !== null ? Math.max(0, maxQuota - usedCount) : null;
        const quotaTitle = remaining !== null
            ? t('form.responseSummary.quotaWithRemaining', { max: maxQuota, remaining })
            : t('table.settingTooltips.maxResponses', { count: maxQuota });
        items.push({
            key: 'maxResponses',
            icon: 'cil-speedometer',
            iconClass: 'setting-icon-quota',
            title: quotaTitle,
            description: t('form.responseSummary.maxResponsesDesc')
        });
    }

    if (settings.emailNotifications && isSignedIn) {
        items.push({
            key: 'emailNotifications',
            icon: 'cil-envelope-closed',
            iconClass: 'setting-icon-email',
            title: t('table.settingTooltips.emailNotifications'),
            description: t('form.responseSummary.notificationsDesc')
        });
    }
    return items;
}

function pickFallbackText(val) {
    if (!val) return '';
    if (typeof val === 'string') return val.trim();
    if (Array.isArray(val)) {
        const found = val.find(entry => entry && entry.value && String(entry.value).trim());
        return found ? String(found.value).trim() : '';
    }
    if (typeof val === 'object') return String(val.en || val.th || '').trim();
    return '';
}

function resolveUserLinkedLabel(userRef, fieldKey, { users = [], catalog = [], getText } = {}) {
    if (!userRef) return '';
    const pickText = typeof getText === 'function' ? getText : pickFallbackText;

    let fieldRef = typeof userRef === 'object' ? userRef[fieldKey] : null;
    const refId = typeof userRef === 'object'
        ? (userRef._id || userRef.id ? String(userRef._id || userRef.id) : '')
        : String(userRef).trim();

    if ((!fieldRef || typeof fieldRef === 'string') && Array.isArray(users) && refId) {
        const matchedUser = users.find(u => u && String(u._id || u.id) === refId);
        if (matchedUser && matchedUser[fieldKey]) fieldRef = matchedUser[fieldKey];
    }
    if (!fieldRef) return '';
    if (typeof fieldRef === 'string') {
        const s = fieldRef.trim();
        if (s && Array.isArray(catalog) && catalog.length > 0) {
            const matchedItem = catalog.find(item => item && String(item._id || item.id) === s);
            if (matchedItem) {
                return pickText(matchedItem.title) || matchedItem.name || '';
            }
        }
        return /^[0-9a-f]{24}$/i.test(s) ? '' : s;
    }
    if (typeof fieldRef === 'object') {
        return pickText(fieldRef.title) || fieldRef.name || '';
    }
    return '';
}

export function resolveUserRoleLabel(userRef, { users = [], getText } = {}) {
    return resolveUserLinkedLabel(userRef, 'role', { users, getText });
}

export function resolveUserOrganizationLabel(userRef, { organizations = [], users = [], getText } = {}) {
    return resolveUserLinkedLabel(userRef, 'organization', { users, catalog: organizations, getText });
}

export const NON_INPUT_QUESTION_TYPES = new Set([
    'section',
    'title_description',
    'title & description',
    'image'
]);

/**
 * Checks whether a question object or type string represents a Section Divider.
 */
export function isSectionQuestionType(questionOrType) {
    if (!questionOrType) return false;
    const rawSource = typeof questionOrType === 'object'
        ? (questionOrType.type && typeof questionOrType.type === 'object'
            ? (questionOrType.type.type || questionOrType.type.name || '')
            : (questionOrType.type || questionOrType.name || ''))
        : questionOrType;
    return normalizeQuestionTypeKey(rawSource) === 'section';
}

/**
 * Checks whether a question object or type string represents a non-input layout element.
 */
export function isNonInputQuestionType(questionOrType) {
    if (!questionOrType) return false;
    const rawSource = typeof questionOrType === 'object'
        ? (questionOrType.type && typeof questionOrType.type === 'object'
            ? (questionOrType.type.type || questionOrType.type.name || '')
            : (questionOrType.type || questionOrType.name || ''))
        : questionOrType;
    const raw = String(rawSource || '').trim().toLowerCase();
    if (!raw) return false;
    return NON_INPUT_QUESTION_TYPES.has(raw) || NON_INPUT_QUESTION_TYPES.has(raw.replace(/\s+/g, '_'));
}

/**
 * Computes the 1-based question number within its Section (resetting at each 'section' divider).
 */
export function getQuestionNumberInSection(questions = [], targetQuestionOrIndex, { isSkipFn } = {}) {
    const list = Array.isArray(questions) ? questions : [];
    const targetIsIndex = typeof targetQuestionOrIndex === 'number';
    let num = 0;
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (isSectionQuestionType(item)) {
            num = 0;
        } else if (item && !isNonInputQuestionType(item) && !(typeof isSkipFn === 'function' && isSkipFn(item))) {
            num++;
        }
        if ((targetIsIndex && i === targetQuestionOrIndex) || (!targetIsIndex && item === targetQuestionOrIndex)) {
            return num;
        }
    }
    return num;
}

/**
 * Collects unique normalized lowercase language keys across form meta and questions.
 */
export function extractFormLanguages(form, questionsOverride = null) {
    const langs = [];
    const addKey = (k) => {
        if (!k) return;
        const normalized = String(k).trim().toLowerCase();
        if (normalized && !langs.includes(normalized)) {
            langs.push(normalized);
        }
    };

    if (form && Array.isArray(form.title)) {
        form.title.forEach(t => addKey(t && t.key));
    }
    if (form && Array.isArray(form.description)) {
        form.description.forEach(d => addKey(d && d.key));
    }
    const qList = Array.isArray(questionsOverride)
        ? questionsOverride
        : (form && Array.isArray(form.questions) ? form.questions : []);
    qList.forEach(q => {
        if (!q) return;
        if (Array.isArray(q.title)) {
            q.title.forEach(t => addKey(t && t.key));
        }
        if (Array.isArray(q.description)) {
            q.description.forEach(d => addKey(d && d.key));
        }
        if (q.config && Array.isArray(q.config.description)) {
            q.config.description.forEach(d => addKey(d && d.key));
        }
        if (q.config && Array.isArray(q.config.choices)) {
            q.config.choices.forEach(c => {
                if (c && Array.isArray(c.lang)) {
                    c.lang.forEach(l => addKey(l && l.key));
                }
            });
        }
    });
    return langs.length > 0 ? langs : ['en'];
}

export function countInputQuestions(questions) {
    if (!Array.isArray(questions)) return 0;
    return questions.filter((q) => {
        if (!q) return false;
        if (!q.type) return true;
        return !isNonInputQuestionType(q);
    }).length;
}

export function countValidAnswers(answers) {
    if (!Array.isArray(answers)) return 0;
    return answers.filter((a) => {
        if (!a || a.response === null || a.response === undefined) return false;
        const val = a.response;
        if (typeof val === 'string') {
            const s = val.trim();
            return s !== '' && s !== 'null' && s !== 'undefined' && s !== '[]' && s !== '[""]';
        }
        if (Array.isArray(val)) {
            return val.length > 0 && val.some(v => v !== '' && v !== null);
        }
        return true;
    }).length;
}

const FREE_TEXT_QUESTION_TYPES = new Set([
    'free_text',
    'free text',
    'short_answer',
    'short answer',
    'paragraph',
    'short',
    'text'
]);

export function normalizeQuestionTypeKey(typeStr) {
    const raw = String(typeStr || '').trim().toLowerCase().replace(/\s+/g, '_');
    if (!raw) return '';
    return FREE_TEXT_QUESTION_TYPES.has(raw) ? 'free_text' : raw;
}

export function isFreeTextQuestionType(typeStr) {
    return normalizeQuestionTypeKey(typeStr) === 'free_text';
}

/**
 * Collapses legacy short_answer / paragraph types alongside free_text into a
 * single canonical "Free Text" entry for builder selectors while keeping a valid DB _id.
 */
export function consolidateQuestionTypes(rawTypes = []) {
    if (!Array.isArray(rawTypes) || rawTypes.length === 0) return [];
    const freeEntries = rawTypes.filter(t => t && isFreeTextQuestionType(t.type));
    const preferredFree = freeEntries.find(t => String(t.type || '').trim().toLowerCase() === 'free_text')
        || freeEntries.find(t => String(t.type || '').trim().toLowerCase() === 'paragraph')
        || freeEntries[0];

    const result = [];
    let insertedFree = false;
    rawTypes.forEach(t => {
        if (!t) return;
        if (isFreeTextQuestionType(t.type)) {
            if (!insertedFree && preferredFree) {
                result.push({ ...preferredFree, type: 'free_text' });
                insertedFree = true;
            }
            return;
        }
        result.push({ ...t });
    });
    return result;
}

/**
 * Groups an ordered list of form items into Section slices.
 * Returns [] when the form has no 'section' divider at all.
 */
export function buildQuestionSectionGroups(questions = []) {
    const list = Array.isArray(questions) ? questions : [];
    if (!list.some(item => isSectionQuestionType(item))) return [];

    const groups = [];
    let current = null;

    const pushCurrent = (endIndex) => {
        if (!current) return;
        current.endIndex = endIndex;
        groups.push(current);
    };

    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (!item) continue;
        if (isSectionQuestionType(item)) {
            pushCurrent(i - 1);
            current = {
                sectionNumber: groups.length + 1,
                headerIndex: i,
                startIndex: i,
                endIndex: i,
                headerQuestion: item,
                items: [],
                questionCount: 0
            };
        } else {
            if (!current) {
                current = {
                    sectionNumber: 1,
                    headerIndex: -1,
                    startIndex: 0,
                    endIndex: i,
                    headerQuestion: null,
                    items: [],
                    questionCount: 0
                };
            }
            current.items.push(item);
            if (!isNonInputQuestionType(item)) {
                current.questionCount += 1;
            }
        }
    }

    pushCurrent(list.length - 1);
    return groups;
}

/**
 * Returns the 0-based section group index containing `targetIndex`, or -1 if unsectioned.
 */
export function getQuestionSectionIndex(questions = [], targetIndex) {
    if (typeof targetIndex !== 'number' || targetIndex < 0) return -1;
    const groups = buildQuestionSectionGroups(questions);
    return groups.findIndex(g => targetIndex >= g.startIndex && targetIndex <= g.endIndex);
}

/**
 * Moves a non-section question from `sourceIndex` to the end of `targetSectionIdx`.
 */
export function reorderMoveQuestionToSection(questions = [], sourceIndex, targetSectionIdx) {
    const list = Array.isArray(questions) ? [...questions] : [];
    const groups = buildQuestionSectionGroups(list);
    if (sourceIndex < 0 || sourceIndex >= list.length) return { questions: list, newIndex: sourceIndex };
    if (targetSectionIdx < 0 || targetSectionIdx >= groups.length) return { questions: list, newIndex: sourceIndex };

    const item = list[sourceIndex];
    if (!item || isSectionQuestionType(item)) return { questions: list, newIndex: sourceIndex };

    const currentSectionIdx = getQuestionSectionIndex(list, sourceIndex);
    if (currentSectionIdx === targetSectionIdx) return { questions: list, newIndex: sourceIndex };

    const targetGroup = groups[targetSectionIdx];
    const [removed] = list.splice(sourceIndex, 1);
    const insertAt = sourceIndex < targetGroup.endIndex
        ? targetGroup.endIndex
        : targetGroup.endIndex + 1;
    list.splice(insertAt, 0, removed);
    return { questions: list, newIndex: insertAt };
}

/**
 * Swaps an entire section slice (header + its questions) up (-1) or down (+1).
 */
export function reorderMoveSectionGroup(questions = [], sectionHeaderIndex, delta) {
    const list = Array.isArray(questions) ? [...questions] : [];
    const groups = buildQuestionSectionGroups(list);
    const groupIdx = groups.findIndex(g => g.headerIndex === sectionHeaderIndex || g.startIndex === sectionHeaderIndex);
    const swapIdx = groupIdx + (delta < 0 ? -1 : 1);
    if (groupIdx === -1 || swapIdx < 0 || swapIdx >= groups.length) {
        return { questions: list, newHeaderIndex: sectionHeaderIndex };
    }

    const slices = groups.map(g => list.slice(g.startIndex, g.endIndex + 1));
    const movedSlice = slices[groupIdx];
    slices.splice(groupIdx, 1);
    slices.splice(swapIdx, 0, movedSlice);

    const nextQuestions = slices.reduce((acc, chunk) => acc.concat(chunk), []);
    const movedItem = groups[groupIdx].headerQuestion;
    const newHeaderIndex = movedItem ? nextQuestions.indexOf(movedItem) : 0;
    return { questions: nextQuestions, newHeaderIndex };
}

/**
 * Merges a reordered list of visible items (when some sections are collapsed) back with
 * each collapsed section's hidden child questions so no hidden items are lost or displaced.
 */
export function mergeVisibleOrderWithHiddenSections(allQuestions = [], reorderedVisible = []) {
    const full = Array.isArray(allQuestions) ? allQuestions : [];
    const visible = Array.isArray(reorderedVisible) ? reorderedVisible : [];
    const visibleSet = new Set(visible);
    const hiddenByHeader = new Map();
    const leadingHidden = [];

    let currentHeader = null;
    for (let i = 0; i < full.length; i++) {
        const item = full[i];
        if (!item) continue;
        if (isSectionQuestionType(item)) {
            currentHeader = item;
            if (!hiddenByHeader.has(item)) hiddenByHeader.set(item, []);
        } else if (!visibleSet.has(item)) {
            if (currentHeader) {
                hiddenByHeader.get(currentHeader).push(item);
            } else {
                leadingHidden.push(item);
            }
        }
    }

    const merged = [...leadingHidden];
    for (let i = 0; i < visible.length; i++) {
        const item = visible[i];
        merged.push(item);
        if (item && hiddenByHeader.has(item)) {
            merged.push(...hiddenByHeader.get(item));
        }
    }
    return merged;
}

/**
 * Opens native date/datetime picker popup when supported (e.g. Chromium/Edge).
 */
export function tryOpenDatePicker(inputEl) {
    if (!inputEl || typeof inputEl.showPicker !== 'function') return;
    try {
        inputEl.showPicker();
    } catch (e) {
        // Ignore SecurityError / InvalidStateError in restricted or non-gesture contexts
    }
}

/**
 * Disables manual free-text keyboard entry on date/datetime inputs while keeping Tab/Escape
 * accessibility and opening the calendar popup via Enter or Space.
 */
export function handleDatePickerKeydown(event) {
    if (!event) return;
    const key = event.key;
    if (key === 'Tab' || key === 'Escape') {
        return;
    }
    if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        tryOpenDatePicker(event.target);
        return;
    }
    event.preventDefault();
}

/**
 * Blocks direct free-text / IME / paste / delete mutations via beforeinput on picker-only fields.
 */
export function blockFreeTextBeforeInput(event) {
    if (!event) return;
    const type = String(event.inputType || '');
    if (
        !type ||
        type.startsWith('insertText') ||
        type.startsWith('insertComposition') ||
        type.startsWith('insertFromPaste') ||
        type.startsWith('insertFromDrop') ||
        type.startsWith('deleteContent')
    ) {
        event.preventDefault();
    }
}


const DEFAULT_CONFIRM_MESSAGE = 'Thank you for completing this survey. Your response has been recorded.';

/**
 * Formats a date/timestamp cleanly for collapsed settings summary pills.
 */
export function formatSettingDateSummary(val, locale = 'th') {
    const parsed = parseValidDate(val);
    if (!parsed) return '';
    const langTag = String(locale || 'th').toLowerCase() === 'th' ? 'th-TH' : 'en-GB';
    try {
        return new Intl.DateTimeFormat(langTag, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(parsed);
    } catch (e) {
        return parsed.toISOString().slice(0, 16).replace('T', ' ');
    }
}

/**
 * Reports whether a form settings section currently holds non-default configuration.
 */
export function isSettingSectionUsed(sectionKey, form = {}) {
    const doc = (form && typeof form === 'object') ? form : {};
    const sched = (doc.schedule && typeof doc.schedule === 'object') ? doc.schedule : {};
    const inner = (doc.settings && typeof doc.settings === 'object') ? doc.settings : {};

    if (sectionKey === 'status') {
        return (
            resolveScheduleMode(sched) !== 'always' ||
            isSchedulePublished(sched) ||
            Boolean(parseValidDate(sched.startAt) || parseValidDate(sched.endAt))
        );
    }

    if (sectionKey === 'access') {
        return Array.isArray(doc.collaborator) && doc.collaborator.length > 0;
    }

    if (sectionKey === 'organization') {
        if (inner.accessMode === 'public') {
            return false;
        }
        if (inner.accessMode === 'private') {
            return true;
        }
        const orgs = Array.isArray(doc.organization) ? doc.organization.filter(Boolean) : [];
        const roles = (orgs.length > 0 && Array.isArray(inner.allowedRoles)) ? inner.allowedRoles.filter(Boolean) : [];
        const users = Array.isArray(inner.allowedUser) ? inner.allowedUser.filter(Boolean) : [];
        const extEmails = normalizeAllowedEmails(inner.allowedEmails);
        return orgs.length > 0 || roles.length > 0 || users.length > 0 || extEmails.length > 0;
    }

    if (sectionKey === 'response') {
        const rawConfirm = typeof inner.confirmMessage === 'string' ? inner.confirmMessage.trim() : '';
        const hasCustomConfirm = Boolean(rawConfirm && rawConfirm !== DEFAULT_CONFIRM_MESSAGE);
        return Boolean(
            inner.requireLogin ||
            inner.limitResponse ||
            inner.allowEditAfterSubmit ||
            normalizeMaxResponses(inner.maxResponses) ||
            inner.emailNotifications ||
            inner.notifyCreator ||
            hasCustomConfirm
        );
    }

    return false;
}

function resolveEntityLabel(ref, list = [], locale = 'th', fallbackPrefix = '') {
    if (!ref) return '';
    if (typeof ref === 'object') {
        const direct = pickLocalizedText(ref.title || ref.name || ref.fullname || ref.email, locale);
        if (direct) return direct;
    }
    const id = toPolicyIdStr(ref);
    if (!id) return '';
    const found = Array.isArray(list) ? list.find(item => item && toPolicyIdStr(item._id) === id) : null;
    if (found) {
        return pickLocalizedText(found.title || found.name || found.fullname || found.email, locale) || id;
    }
    return fallbackPrefix ? `${fallbackPrefix}${id}` : id;
}

/**
 * Builds human-readable summary chips representing active selections inside a collapsed setting card.
 */
export function buildSettingSectionSummary(
    sectionKey,
    form = {},
    {
        users = [],
        organizations = [],
        roles = [],
        collaboratorTypes = [],
        locale = 'th',
        t = (k) => k
    } = {}
) {
    const doc = (form && typeof form === 'object') ? form : {};
    const sched = (doc.schedule && typeof doc.schedule === 'object') ? doc.schedule : {};
    const inner = (doc.settings && typeof doc.settings === 'object') ? doc.settings : {};

    if (sectionKey === 'status') {
        const mode = resolveScheduleMode(sched);
        const modeTitleMap = {
            always: t('editor.settings.status.modes.always.title'),
            range: t('editor.settings.status.modes.range.title'),
            end_only: t('editor.settings.status.modes.end_only.title'),
            scheduled: t('editor.settings.status.modes.scheduled.title')
        };
        const statusCode = getScheduleStatus(sched);
        const published = isSchedulePublished(sched);
        const statusTone = !published
            ? 'neutral'
            : (statusCode === 'open' || statusCode === 'open_forever')
                ? 'success'
                : statusCode === 'scheduled'
                    ? 'info'
                    : 'warning';
        const statusLabel = published
            ? t('editor.settings.status.publishedBadge')
            : t('editor.settings.status.draftBadge');

        const chips = [
            { label: modeTitleMap[mode] || mode, tone: mode === 'always' ? 'neutral' : 'accent' },
            { label: statusLabel, tone: statusTone }
        ];

        const startText = formatSettingDateSummary(sched.startAt, locale);
        const endText = formatSettingDateSummary(sched.endAt, locale);

        if (mode === 'range' || mode === 'scheduled') {
            chips.push(startText
                ? { label: `${t('editor.settings.collapse.startPrefix')}: ${startText}`, tone: 'info' }
                : { label: t('editor.settings.collapse.missingStart'), tone: 'warning' });
        }
        if (mode === 'range' || mode === 'end_only' || (mode === 'scheduled' && endText)) {
            chips.push(endText
                ? { label: `${t('editor.settings.collapse.endPrefix')}: ${endText}`, tone: 'info' }
                : { label: t('editor.settings.collapse.missingEnd'), tone: 'warning' });
        }
        return chips;
    }

    if (sectionKey === 'access') {
        const collabs = Array.isArray(doc.collaborator) ? doc.collaborator.filter(Boolean) : [];
        if (collabs.length === 0) {
            return [{ label: t('editor.settings.access.noCollaborators'), tone: 'neutral' }];
        }
        const chips = collabs.slice(0, 4).map(c => {
            const userLabel = (c.email && (!c.user || typeof c.user !== 'object'))
                ? c.email
                : (resolveEntityLabel(c.user, users, locale) || c.email || 'Unknown');
            let roleLabel = resolveEntityLabel(c.type, collaboratorTypes, locale) || t('editor.settings.access.viewer');
            if (String(roleLabel).trim() === 'ผู้ดู') {
                roleLabel = t('editor.settings.access.viewer');
            }
            return { label: `${userLabel} · ${roleLabel}`, tone: 'info' };
        });
        if (collabs.length > 4) {
            chips.push({ label: `+${collabs.length - 4}`, tone: 'neutral' });
        }
        return chips;
    }

    if (sectionKey === 'organization') {
        const explicitMode = (inner.accessMode === 'private' || inner.accessMode === 'public')
            ? inner.accessMode
            : null;
        const orgs = Array.isArray(doc.organization) ? doc.organization.filter(Boolean) : [];
        const orgNames = orgs.map(o => resolveEntityLabel(o, organizations, locale)).filter(Boolean);
        const roleNames = orgs.length > 0 && Array.isArray(inner.allowedRoles)
            ? inner.allowedRoles.filter(Boolean).map(r => resolveEntityLabel(r, roles, locale)).filter(Boolean)
            : [];
        const userLabels = [
            ...(Array.isArray(inner.allowedUser) ? inner.allowedUser.filter(Boolean).map(u => resolveEntityLabel(u, users, locale)) : []),
            ...normalizeAllowedEmails(inner.allowedEmails)
        ].filter(Boolean);

        const resolvedMode = explicitMode || ((orgNames.length > 0 && !orgs.some(isGeneralOrgEntry)) || userLabels.length > 0 ? 'private' : 'public');

        if (resolvedMode === 'public') {
            if (!explicitMode && orgNames.length === 0 && roleNames.length === 0 && userLabels.length === 0) {
                return [{ label: t('editor.settings.collapse.noAudienceRestriction'), tone: 'neutral' }];
            }
            return [
                { label: t('editor.settings.organization.modePublicSummary'), tone: 'neutral' },
                { label: t('editor.settings.organization.publicSummaryOpen'), tone: 'neutral' }
            ];
        }

        const chips = [
            { label: t('editor.settings.organization.modePrivateSummary'), tone: 'accent' },
            { label: t('editor.settings.organization.privateCollectEmailLockedSummary'), tone: 'info' }
        ];
        if (orgNames.length > 0) {
            const preview = orgNames.length > 3 ? `${orgNames.slice(0, 3).join(', ')} +${orgNames.length - 3}` : orgNames.join(', ');
            chips.push({ label: `${t('editor.settings.collapse.orgPrefix')}: ${preview}`, tone: 'accent' });
        }
        if (roleNames.length > 0) {
            const preview = roleNames.length > 3 ? `${roleNames.slice(0, 3).join(', ')} +${roleNames.length - 3}` : roleNames.join(', ');
            chips.push({ label: `${t('editor.settings.collapse.rolePrefix')}: ${preview}`, tone: 'info' });
        }
        if (userLabels.length > 0) {
            const preview = userLabels.length > 2 ? `${userLabels.slice(0, 2).join(', ')} +${userLabels.length - 2}` : userLabels.join(', ');
            chips.push({ label: `${t('editor.settings.collapse.peoplePrefix')}: ${preview}`, tone: 'info' });
        }
        return chips;
    }

    if (sectionKey === 'response') {
        const chips = [];
        if (inner.requireLogin) {
            chips.push({ label: t('editor.settings.response.requireLogin'), tone: 'info' });
        } else {
            chips.push({ label: t('editor.settings.collapse.requireLoginOffSummary'), tone: 'neutral' });
        }

        if (inner.limitResponse) {
            chips.push({ label: t('editor.settings.response.limitOne'), tone: 'accent' });
        }
        if (inner.allowEditAfterSubmit) {
            chips.push({ label: t('editor.settings.response.allowEdit'), tone: 'accent' });
        }
        const quota = normalizeMaxResponses(inner.maxResponses);
        if (quota) {
            chips.push({ label: `${t('editor.settings.collapse.quotaPrefix')}: ${quota}`, tone: 'accent' });
        }
        if (inner.emailNotifications) {
            chips.push({ label: t('editor.settings.response.notifications'), tone: 'info' });
        }
        if (inner.notifyCreator) {
            chips.push({ label: t('editor.settings.response.notifyCreator'), tone: 'info' });
        }
        const rawConfirm = typeof inner.confirmMessage === 'string' ? inner.confirmMessage.trim() : '';
        if (rawConfirm && rawConfirm !== DEFAULT_CONFIRM_MESSAGE) {
            chips.push({ label: t('editor.settings.collapse.customConfirm'), tone: 'neutral' });
        }
        return chips;
    }

    return [];
}
