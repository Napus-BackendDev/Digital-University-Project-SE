'use strict';

const { toIdString, getScheduleStatus, getCollaboratorAccessRole, normalizeAllowedEmails } = require('./responsePolicy');

const GENERAL_ORG_ID = '6a0b51af2dbf6e77c4df73fe';
const PUBLIC_ORG_KEYWORDS = ['general', 'public', 'ทั่วไป', 'สาธารณะ'];
const NON_INPUT_QUESTION_TYPES = new Set(['section', 'title_description', 'title & description', 'image']);

function normalizeOrigin(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    return rawUrl.trim().replace(/\/+$/, '');
}

/**
 * Resolves the public/localhost server origin for absolute upload links in exported API payloads.
 */
function resolveServerOrigin({ baseUrl, request } = {}) {
    const explicit = normalizeOrigin(baseUrl);
    if (explicit) return explicit;

    if (request) {
        const rawHost = (typeof request.get === 'function' ? request.get('host') : null)
            || (request.headers && (request.headers['x-forwarded-host'] || request.headers.host));
        if (rawHost) {
            const rawProto = (request.headers && request.headers['x-forwarded-proto']) || request.protocol || 'http';
            const protocol = String(rawProto).split(',')[0].trim() || 'http';
            const host = String(rawHost).split(',')[0].trim();
            if (host) return `${protocol}://${host}`;
        }
    }

    const envUrl = normalizeOrigin(process.env.BASE_SERVER_URL);
    if (envUrl) return envUrl;

    const port = process.env.PORT || '8081';
    return `http://localhost:${port}`;
}

function parseStructuredAnswer(rawValue) {
    if (typeof rawValue !== 'string') return rawValue;
    const trimmed = rawValue.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
            return JSON.parse(trimmed);
        } catch (_) {
            return rawValue;
        }
    }
    return rawValue;
}

function toAbsoluteUploadUrl(rawValue, baseUrl = '') {
    if (typeof rawValue !== 'string') return rawValue;
    const trimmed = rawValue.trim();
    if (!trimmed) return '';
    if (/^(https?:\/\/|data:)/i.test(trimmed)) return trimmed.replace(/ /g, '%20');

    const normalized = trimmed.replace(/\\/g, '/');
    if (normalized.startsWith('/uploads/') || normalized.startsWith('uploads/')) {
        const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
        const origin = normalizeOrigin(baseUrl) || resolveServerOrigin();
        return `${origin}${cleanPath}`.replace(/ /g, '%20');
    }
    return trimmed;
}

/**
 * Normalizes a multilingual array (`[{ key, value }]`) or string into a clean `[{ key, value }]` array.
 */
function normalizeLocalizedArray(val) {
    if (Array.isArray(val)) {
        return val
            .filter((item) => item && item.key !== undefined)
            .map((item) => ({
                key: String(item.key).trim(),
                value: item.value === null || item.value === undefined ? '' : String(item.value)
            }));
    }
    if (typeof val === 'string' && val.trim()) {
        return [{ key: 'en', value: val.trim() }];
    }
    return [];
}

/**
 * Builds a `{ th, en }` object from multilingual entries cleanly.
 */
function resolveLangPair(val) {
    const normalized = normalizeLocalizedArray(val);
    const pair = {};
    normalized.forEach((item) => {
        const k = item.key.toLowerCase();
        if (k === 'th' || k === 'en') {
            pair[k] = item.value.trim();
        }
    });
    return {
        th: pair.th || '',
        en: pair.en || ''
    };
}

/**
 * Picks a display label from multilingual `[{ key, value }]` entries with fallback.
 */
function resolveLocalizedText(val, preferredLang = 'en') {
    if (typeof val === 'string') return val.trim();
    if (!Array.isArray(val) || val.length === 0) return '';

    const normalized = normalizeLocalizedArray(val);
    const preferred = normalized.find((item) => item.key.toLowerCase() === preferredLang && item.value.trim());
    if (preferred) return preferred.value.trim();

    const enMatch = normalized.find((item) => item.key.toLowerCase() === 'en' && item.value.trim());
    if (enMatch) return enMatch.value.trim();

    const thMatch = normalized.find((item) => item.key.toLowerCase() === 'th' && item.value.trim());
    if (thMatch) return thMatch.value.trim();

    const firstNonEmpty = normalized.find((item) => item.value.trim());
    return firstNonEmpty ? firstNonEmpty.value.trim() : '';
}

/**
 * Returns true if an organization reference or populated organization doc represents General/Public access.
 */
function isGeneralOrgRef(orgRef, organizations = []) {
    if (!orgRef) return false;
    const id = toIdString(orgRef);
    if (id === GENERAL_ORG_ID) return true;

    let orgDoc = typeof orgRef === 'object' && Array.isArray(orgRef.title) ? orgRef : null;
    if (!orgDoc && id && Array.isArray(organizations)) {
        orgDoc = organizations.find((o) => toIdString(o && o._id) === id) || null;
    }
    if (!orgDoc) return false;

    const titles = normalizeLocalizedArray(orgDoc.title);
    const joined = titles.map((t) => t.value.toLowerCase()).join(' ');
    return PUBLIC_ORG_KEYWORDS.some((kw) => joined.includes(kw));
}

function resolveOrgLabel(orgRef, organizations = []) {
    if (!orgRef) return null;
    const id = toIdString(orgRef);
    let orgDoc = typeof orgRef === 'object' && Array.isArray(orgRef.title) ? orgRef : null;
    if (!orgDoc && id && Array.isArray(organizations)) {
        orgDoc = organizations.find((o) => toIdString(o && o._id) === id) || null;
    }
    if (orgDoc) {
        return resolveLocalizedText(orgDoc.title) || id || null;
    }
    return id || null;
}

function resolveRoleLabel(roleRef) {
    if (!roleRef) return null;
    if (typeof roleRef === 'object' && Array.isArray(roleRef.title)) {
        return resolveLocalizedText(roleRef.title) || toIdString(roleRef) || null;
    }
    return toIdString(roleRef) || null;
}

function formatFlatUser(userDoc, organizations = []) {
    if (!userDoc) {
        return {
            _id: null,
            name: 'Anonymous',
            email: null,
            organization: null,
            role: null
        };
    }
    return {
        _id: toIdString(userDoc._id || userDoc.id || userDoc) || null,
        name: userDoc.name || null,
        email: userDoc.email || null,
        organization: resolveOrgLabel(userDoc.organization, organizations),
        role: resolveRoleLabel(userDoc.role)
    };
}

function formatFormPeople(form) {
    const creatorDoc = form && form.creator && typeof form.creator === 'object' ? form.creator : null;
    const creator = form && form.creator
        ? {
            _id: toIdString(form.creator) || null,
            name: (creatorDoc && creatorDoc.name) || null,
            email: (creatorDoc && creatorDoc.email) || null
        }
        : null;

    const rawCollaborators = Array.isArray(form && form.collaborator) ? form.collaborator : [];
    const collaborators = rawCollaborators
        .filter((c) => c && c.user)
        .map((c) => {
            const uDoc = typeof c.user === 'object' ? c.user : null;
            const uid = toIdString(c.user);
            const role = getCollaboratorAccessRole(form, uid) || 'viewer';
            return {
                _id: uid || null,
                name: (uDoc && uDoc.name) || null,
                email: (uDoc && uDoc.email) || null,
                role
            };
        });

    return { creator, collaborators };
}

/**
 * Resolves required target evaluators for a form matching analytics.js semantics:
 * General/Public or listed `form.organization`, filtered by `settings.allowedRoles`, union `settings.allowedUser`.
 */
function getFormTargetUsers(form, users = [], organizations = []) {
    if (!form || !Array.isArray(users)) {
        return { targetUsers: [] };
    }

    const rawOrgs = form.organization || [];
    const orgList = (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs]).filter(Boolean);
    const formOrgIds = orgList.map((o) => toIdString(o)).filter(Boolean);
    const isPublicForm = orgList.some((o) => isGeneralOrgRef(o, organizations));

    const allowedRoles = (form.settings && Array.isArray(form.settings.allowedRoles)) ? form.settings.allowedRoles : [];
    const allowedRoleIds = allowedRoles.map((r) => toIdString(r)).filter(Boolean);
    const hasRoleFilter = allowedRoleIds.length > 0;

    const targetMap = new Map();

    users.forEach((u) => {
        if (!u || !u._id) return;
        const uId = toIdString(u._id);
        const uOrgId = toIdString(u.organization);
        const uRoleId = toIdString(u.role);
        const roleMatches = !hasRoleFilter || (uRoleId && allowedRoleIds.includes(uRoleId));

        if (isPublicForm || (uOrgId && formOrgIds.includes(uOrgId))) {
            if (roleMatches) {
                targetMap.set(uId, u);
            }
        }
    });

    const allowedUsers = (form.settings && Array.isArray(form.settings.allowedUser)) ? form.settings.allowedUser : [];
    allowedUsers.forEach((u) => {
        const uId = toIdString(u);
        if (!uId || targetMap.has(uId)) return;
        const found = users.find((x) => toIdString(x && x._id) === uId);
        targetMap.set(uId, found || (typeof u === 'object' ? u : { _id: uId }));
    });

    const allowedEmails = normalizeAllowedEmails(form.settings && form.settings.allowedEmails);
    if (allowedEmails.length > 0) {
        const presentEmails = new Set(
            Array.from(targetMap.values())
                .map((u) => (u && typeof u.email === 'string' ? u.email.trim().toLowerCase() : ''))
                .filter(Boolean)
        );
        allowedEmails.forEach((email) => {
            if (presentEmails.has(email)) return;
            const matchedUser = users.find((x) => x && typeof x.email === 'string' && x.email.trim().toLowerCase() === email);
            if (matchedUser && matchedUser._id) {
                const uid = toIdString(matchedUser._id);
                if (uid && !targetMap.has(uid)) {
                    targetMap.set(uid, matchedUser);
                }
            } else {
                targetMap.set(`email:${email}`, { _id: `email:${email}`, name: email, email });
            }
            presentEmails.add(email);
        });
    }

    return {
        targetUsers: Array.from(targetMap.values())
    };
}

function getQuestionTypeString(question) {
    if (!question || !question.type) return '';
    if (typeof question.type === 'object' && question.type.type) {
        return String(question.type.type).trim().toLowerCase();
    }
    return String(question.type).trim().toLowerCase();
}

function isChoiceQuestionType(qType) {
    return qType.includes('choice') || qType.includes('checkbox') || qType.includes('multiple');
}

function getOrderedInputQuestions(rawQuestions = []) {
    return [...(Array.isArray(rawQuestions) ? rawQuestions : [])]
        .filter((q) => q && q._id && !NON_INPUT_QUESTION_TYPES.has(getQuestionTypeString(q)))
        .sort((a, b) => {
            const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
            const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
            return ao - bo;
        });
}

function formatQuestionSchema(q, index) {
    const qType = getQuestionTypeString(q);
    const out = {
        _id: toIdString(q._id),
        order: typeof q.order === 'number' ? q.order : index + 1,
        title: resolveLangPair(q.title),
        description: resolveLangPair(q.description),
        type: qType || null,
        isRequired: Boolean(q.isRequired)
    };

    if (qType === 'rating') {
        out.maxRating = Number(q.config && q.config.maxRating) || 5;
    }

    if (isChoiceQuestionType(qType)) {
        const rawChoices = (q.config && Array.isArray(q.config.choices))
            ? q.config.choices
            : (Array.isArray(q.options) ? q.options : []);
        out.choices = rawChoices.map((c, idx) => {
            const langSource = Array.isArray(c && c.lang) ? c.lang : (c && c.label);
            const fallbackLabel = c && c.value !== undefined && c.value !== null
                ? String(c.value)
                : String(c && c.key !== undefined ? c.key : idx);
            const resolvedPair = resolveLangPair(langSource);
            if (!resolvedPair.th && !resolvedPair.en && fallbackLabel) {
                resolvedPair.en = fallbackLabel;
            }
            return {
                key: c && c.key !== undefined && c.key !== null ? String(c.key) : String(idx),
                label: resolvedPair
            };
        });
    }

    return out;
}

/**
 * Resolves a stored answer value (choice key/id/index, rating, array, upload path, or text) to a readable value.
 */
function resolveAnswerDisplayValue(question, rawValue, { baseUrl } = {}) {
    if (rawValue === null || rawValue === undefined) return '';
    const qType = getQuestionTypeString(question);
    const parsedValue = parseStructuredAnswer(rawValue);

    if (question && isChoiceQuestionType(qType)) {
        const options = (question.config && Array.isArray(question.config.choices))
            ? question.config.choices
            : (Array.isArray(question.options) ? question.options : []);

        if (options.length > 0) {
            const values = Array.isArray(parsedValue) ? parsedValue : [parsedValue];
            const labels = values.map((val) => {
                const strVal = String(val);
                let opt = options.find((o) =>
                    o && (
                        String(o.key) === strVal ||
                        (o._id && String(o._id) === strVal) ||
                        (o.value !== undefined && String(o.value) === strVal)
                    )
                );
                if (!opt && !Number.isNaN(Number(val)) && options[Number(val)]) {
                    opt = options[Number(val)];
                }
                if (opt) {
                    if (Array.isArray(opt.lang)) return resolveLocalizedText(opt.lang) || strVal;
                    if (opt.label) return resolveLocalizedText(opt.label) || strVal;
                    if (opt.value !== undefined && opt.value !== null) return String(opt.value);
                }
                return strVal;
            });
            return labels.join(', ');
        }
    }

    const formatScalar = (entry) => {
        if (entry === null || entry === undefined) return '';
        if (typeof entry === 'object') {
            const fileRef = entry.url || entry.path || entry.name;
            if (fileRef) return toAbsoluteUploadUrl(String(fileRef), baseUrl);
            return JSON.stringify(entry);
        }
        return typeof entry === 'string' ? toAbsoluteUploadUrl(entry, baseUrl) : String(entry);
    };

    if (Array.isArray(parsedValue)) {
        return parsedValue
            .map(formatScalar)
            .filter(Boolean)
            .join(', ');
    }

    if (parsedValue && typeof parsedValue === 'object') {
        return formatScalar(parsedValue);
    }

    if (typeof parsedValue === 'string') {
        return toAbsoluteUploadUrl(parsedValue, baseUrl);
    }

    return parsedValue;
}

function formatResponseAnswers(responseDoc, orderedQuestions = [], { baseUrl } = {}) {
    const answerEntries = Array.isArray(responseDoc && responseDoc.answers) ? responseDoc.answers : [];
    const answerByQuestionId = new Map();
    answerEntries.forEach((ans) => {
        const qid = toIdString(ans && ans.question);
        if (qid) answerByQuestionId.set(qid, ans);
    });

    const formatted = [];
    orderedQuestions.forEach((q, idx) => {
        const qType = getQuestionTypeString(q);
        const qid = toIdString(q._id);
        const matched = answerByQuestionId.get(qid);
        const rawValue = matched ? matched.response : null;
        formatted.push({
            questionId: qid,
            order: typeof q.order === 'number' ? q.order : idx + 1,
            questionTitle: resolveLocalizedText(q.title) || `Question ${idx + 1}`,
            type: qType || null,
            value: resolveAnswerDisplayValue(q, rawValue, { baseUrl })
        });
        answerByQuestionId.delete(qid);
    });

    answerByQuestionId.forEach((ans, qid) => {
        const qDoc = ans.question && typeof ans.question === 'object' ? ans.question : null;
        const qType = getQuestionTypeString(qDoc);
        const titleArr = qDoc ? normalizeLocalizedArray(qDoc.title) : [];
        formatted.push({
            questionId: qid,
            order: formatted.length + 1,
            questionTitle: resolveLocalizedText(titleArr) || qid,
            type: qType || null,
            value: resolveAnswerDisplayValue(qDoc, ans.response, { baseUrl })
        });
    });

    return formatted;
}

/**
 * Builds the Export payload containing full form metadata (`title`, `description`, `schedule`,
 * `organizations`, `creator`, `collaborators`), ordered `questions`, and a unified `results` list.
 */
function buildFormExportPayload({ form, responses = [], users = [], organizations = [], baseUrl = '', exportedAt = new Date() }) {
    const resolvedBaseUrl = resolveServerOrigin({ baseUrl });
    const exportedIso = (exportedAt instanceof Date ? exportedAt : new Date(exportedAt)).toISOString();
    const orderedQuestions = getOrderedInputQuestions(form.questions);
    const questions = orderedQuestions.map((q, idx) => formatQuestionSchema(q, idx));

    const scheduleStatus = getScheduleStatus(form.schedule, new Date(exportedIso));
    const rawOrgs = Array.isArray(form.organization) ? form.organization : (form.organization ? [form.organization] : []);
    const formOrgLabels = rawOrgs.map((o) => resolveOrgLabel(o, organizations)).filter(Boolean);
    const { creator, collaborators } = formatFormPeople(form);

    const submittedResponses = [...responses]
        .filter((r) => r && r.submit === true)
        .sort((a, b) => {
            const aMs = new Date(a.createdAt || a.updatedAt || 0).getTime();
            const bMs = new Date(b.createdAt || b.updatedAt || 0).getTime();
            return bMs - aMs;
        });

    const latestSubmissionByUserId = new Map();
    const anonymousSubmissions = [];

    submittedResponses.forEach((resp) => {
        const uid = resp.responder ? toIdString(resp.responder) : '';
        if (!uid) {
            anonymousSubmissions.push(resp);
            return;
        }
        if (!latestSubmissionByUserId.has(uid)) {
            latestSubmissionByUserId.set(uid, resp);
        }
    });

    const { targetUsers } = getFormTargetUsers(form, users, organizations);
    const targetUserIds = new Set();
    const submittedTargetResults = [];
    const pendingTargetResults = [];

    targetUsers.forEach((u) => {
        const uid = toIdString(u._id || u);
        if (!uid) return;
        targetUserIds.add(uid);

        const flatUser = formatFlatUser(u, organizations);
        const submission = latestSubmissionByUserId.get(uid) || null;

        if (submission) {
            submittedTargetResults.push({
                ...flatUser,
                isTarget: true,
                submitted: true,
                submittedAt: submission.createdAt ? new Date(submission.createdAt).toISOString() : null,
                answers: formatResponseAnswers(submission, orderedQuestions, { baseUrl: resolvedBaseUrl })
            });
        } else {
            pendingTargetResults.push({
                ...flatUser,
                isTarget: true,
                submitted: false,
                submittedAt: null,
                answers: []
            });
        }
    });

    submittedTargetResults.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    pendingTargetResults.sort((a, b) => String(a.name || a.email || '').localeCompare(String(b.name || b.email || '')));

    const extraResults = [];
    latestSubmissionByUserId.forEach((submission, uid) => {
        if (targetUserIds.has(uid)) return;
        const flatUser = formatFlatUser(submission.responder || { _id: uid }, organizations);
        extraResults.push({
            ...flatUser,
            isTarget: false,
            submitted: true,
            submittedAt: submission.createdAt ? new Date(submission.createdAt).toISOString() : null,
            answers: formatResponseAnswers(submission, orderedQuestions, { baseUrl: resolvedBaseUrl })
        });
    });

    anonymousSubmissions.forEach((submission) => {
        extraResults.push({
            ...formatFlatUser(null, organizations),
            isTarget: false,
            submitted: true,
            submittedAt: submission.createdAt ? new Date(submission.createdAt).toISOString() : null,
            answers: formatResponseAnswers(submission, orderedQuestions, { baseUrl: resolvedBaseUrl })
        });
    });

    return {
        form: {
            _id: toIdString(form._id),
            title: resolveLangPair(form.title),
            description: resolveLangPair(form.description),
            schedule: {
                startAt: form.schedule && form.schedule.startAt ? new Date(form.schedule.startAt).toISOString() : null,
                endAt: form.schedule && form.schedule.endAt ? new Date(form.schedule.endAt).toISOString() : null,
                status: scheduleStatus
            },
            organizations: formOrgLabels,
            creator,
            collaborators
        },
        questions,
        exportedAt: exportedIso,
        results: [
            ...submittedTargetResults,
            ...extraResults,
            ...pendingTargetResults
        ]
    };
}

module.exports = {
    GENERAL_ORG_ID,
    normalizeLocalizedArray,
    resolveLocalizedText,
    resolveLangPair,
    isGeneralOrgRef,
    getFormTargetUsers,
    resolveServerOrigin,
    parseStructuredAnswer,
    toAbsoluteUploadUrl,
    getQuestionTypeString,
    isChoiceQuestionType,
    resolveAnswerDisplayValue,
    formatFlatUser,
    getOrderedInputQuestions,
    formatResponseAnswers,
    buildFormExportPayload
};
