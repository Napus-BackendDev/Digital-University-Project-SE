'use strict';

const {
    GENERAL_ORG_ID,
    resolveLocalizedText,
    isGeneralOrgRef,
    getFormTargetUsers,
    resolveServerOrigin,
    parseStructuredAnswer,
    getQuestionTypeString,
    isChoiceQuestionType,
    formatFlatUser,
    getOrderedInputQuestions,
    formatResponseAnswers,
    buildFormExportPayload
} = require('./exportPayload');
const {
    toIdString,
    getScheduleStatus,
    isAdminUser,
    canUserManageOrViewForm
} = require('./responsePolicy');

const DAY_MS = 24 * 60 * 60 * 1000;

function resolveDisplayStatus(schedule, now = new Date()) {
    const raw = getScheduleStatus(schedule, now);
    if (raw === 'open' || raw === 'open_forever') return 'Active';
    if (raw === 'closed' || raw === 'closed_forever') return 'Closed';
    return 'Pending';
}

function getDaysLeft(schedule, now = new Date()) {
    if (!schedule || !schedule.endAt) return null;
    const end = new Date(schedule.endAt);
    if (Number.isNaN(end.getTime())) return null;
    const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
    const diff = end.getTime() - nowMs;
    if (diff < 0) return null;
    return Math.ceil(diff / DAY_MS);
}

function resolveTimeRangeStart(timeRange = 'all', now = new Date()) {
    const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
    if (timeRange === '1d') return nowMs - DAY_MS;
    if (timeRange === '7d') return nowMs - (7 * DAY_MS);
    if (timeRange === '30d') return nowMs - (30 * DAY_MS);
    return null;
}

function isResponseInRange(resp, timeRange = 'all', now = new Date()) {
    if (!resp) return false;
    const startMs = resolveTimeRangeStart(timeRange, now);
    if (startMs === null) return true;
    const ts = new Date(resp.createdAt || resp.updatedAt || 0).getTime();
    if (Number.isNaN(ts) || ts <= 0) return false;
    const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
    return ts >= startMs && ts <= nowMs;
}

function resolveLabelById(idOrDoc, list = []) {
    if (!idOrDoc) return '';
    if (typeof idOrDoc === 'object' && Array.isArray(idOrDoc.title)) {
        return resolveLocalizedText(idOrDoc.title) || toIdString(idOrDoc);
    }
    const id = toIdString(idOrDoc);
    const match = (list || []).find((item) => toIdString(item && item._id) === id);
    if (match) {
        return resolveLocalizedText(match.title || match.name) || id;
    }
    return id;
}

function createEmptyRatingDist() {
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

function computeFormRatingAndStats(formDoc, submittedResponses = [], orderedQuestions = []) {
    const ratingDist = createEmptyRatingDist();
    let totalRatingScore = 0;
    let totalRatingCount = 0;

    const qList = Array.isArray(orderedQuestions) ? orderedQuestions : [];
    const answersByQ = new Map();
    qList.forEach((q) => answersByQ.set(String(q._id), []));

    submittedResponses.forEach((resp) => {
        (Array.isArray(resp.answers) ? resp.answers : []).forEach((ans) => {
            const qid = toIdString(ans && ans.question);
            if (!qid || !answersByQ.has(qid)) return;
            answersByQ.get(qid).push(ans.response);
        });
    });

    const enrichedQuestions = qList.map((q) => {
        const qid = String(q._id);
        const qAnswers = answersByQ.get(qid) || [];
        const qType = String(q.type || '').toLowerCase();

        const nonEmpty = qAnswers.filter((v) => {
            if (v === null || v === undefined) return false;
            if (typeof v === 'string') return v.trim() !== '' && v.trim() !== '[]';
            if (Array.isArray(v)) return v.length > 0;
            return true;
        });

        if (qType === 'rating') {
            const dist = createEmptyRatingDist();
            let sum = 0;
            let count = 0;
            let min = null;
            let max = null;
            nonEmpty.forEach((val) => {
                const num = Number(val);
                if (!Number.isFinite(num) || num < 1 || num > 5) return;
                const bucket = Math.round(num);
                dist[bucket] += 1;
                ratingDist[bucket] += 1;
                sum += num;
                count += 1;
                totalRatingScore += num;
                totalRatingCount += 1;
                if (min === null || num < min) min = num;
                if (max === null || num > max) max = num;
            });
            return {
                ...q,
                stats: {
                    answeredCount: count,
                    average: count > 0 ? Math.round((sum / count) * 100) / 100 : null,
                    min,
                    max,
                    distribution: dist
                }
            };
        }

        if (isChoiceQuestionType(qType)) {
            const counts = new Map();
            const rawChoices = Array.isArray(q.choices) ? q.choices : [];
            rawChoices.forEach((c) => {
                counts.set(String(c.key), {
                    key: String(c.key),
                    label: c.label,
                    count: 0,
                    percentage: 0
                });
            });

            nonEmpty.forEach((rawVal) => {
                const parsed = parseStructuredAnswer(rawVal);
                const selectedList = Array.isArray(parsed) ? parsed : [parsed];
                selectedList.forEach((item) => {
                    const str = String(item).trim();
                    if (!str) return;
                    let matched = counts.get(str);
                    if (!matched && !Number.isNaN(Number(str)) && rawChoices[Number(str)]) {
                        matched = counts.get(String(rawChoices[Number(str)].key));
                    }
                    if (!matched) {
                        matched = {
                            key: str,
                            label: { th: '', en: str },
                            count: 0,
                            percentage: 0
                        };
                        counts.set(str, matched);
                    }
                    matched.count += 1;
                });
            });

            const totalAnswered = nonEmpty.length;
            const options = Array.from(counts.values()).map((opt) => ({
                ...opt,
                percentage: totalAnswered > 0 ? Math.round((opt.count / totalAnswered) * 1000) / 10 : 0
            }));
            const sorted = [...options].sort((a, b) => b.count - a.count);
            const top = sorted[0] && sorted[0].count > 0 ? sorted[0] : null;

            return {
                ...q,
                stats: {
                    answeredCount: totalAnswered,
                    topOption: top ? (top.label.en || top.label.th || top.key) : null,
                    options
                }
            };
        }

        return {
            ...q,
            stats: {
                answeredCount: nonEmpty.length
            }
        };
    });

    const avgRating = totalRatingCount > 0 ? Math.round((totalRatingScore / totalRatingCount) * 100) / 100 : null;
    return {
        avgRating,
        ratingCount: totalRatingCount,
        totalRatingScore,
        ratingDistribution: ratingDist,
        questions: enrichedQuestions
    };
}

function buildGroupBreakdown({ targetUsers = [], submittedResponses = [], users = [], organizations = [], roles = [] }) {
    const orgStats = new Map();
    const roleStats = new Map();

    const ensure = (map, id, label) => {
        if (!map.has(id)) {
            map.set(id, { id, label, target: 0, completed: 0, pending: 0, rate: 0 });
        }
        return map.get(id);
    };

    const submittedIds = new Set();
    submittedResponses.forEach((r) => {
        const uid = toIdString(r && r.responder);
        if (uid) submittedIds.add(uid);
    });

    const countedOrgUsers = new Set();
    const countedRoleUsers = new Set();

    targetUsers.forEach((u) => {
        const uid = toIdString(u && u._id);
        const submitted = Boolean(uid && submittedIds.has(uid));

        const uOrgId = toIdString(u && u.organization);
        if (uOrgId && !isGeneralOrgRef(uOrgId, organizations)) {
            const label = resolveLabelById(u.organization, organizations) || uOrgId;
            const entry = ensure(orgStats, uOrgId, label);
            entry.target += 1;
            if (submitted) entry.completed += 1;
            if (uid) countedOrgUsers.add(`${uOrgId}:${uid}`);
        }

        const uRoleId = toIdString(u && u.role);
        if (uRoleId) {
            const label = resolveLabelById(u.role, roles) || uRoleId;
            const entry = ensure(roleStats, uRoleId, label);
            entry.target += 1;
            if (submitted) entry.completed += 1;
            if (uid) countedRoleUsers.add(`${uRoleId}:${uid}`);
        }
    });

    const seenResponders = new Set();
    submittedResponses.forEach((r) => {
        const uid = toIdString(r && r.responder);
        if (!uid || seenResponders.has(uid)) return;
        seenResponders.add(uid);

        const respObj = typeof r.responder === 'object' ? r.responder : null;
        const userDoc = (users || []).find((u) => toIdString(u && u._id) === uid) || {};
        const orgRef = (respObj && respObj.organization) || userDoc.organization;
        const roleRef = (respObj && respObj.role) || userDoc.role;

        const rOrgId = toIdString(orgRef);
        if (rOrgId && !isGeneralOrgRef(rOrgId, organizations) && !countedOrgUsers.has(`${rOrgId}:${uid}`)) {
            const label = resolveLabelById(orgRef, organizations) || rOrgId;
            ensure(orgStats, rOrgId, label).completed += 1;
            countedOrgUsers.add(`${rOrgId}:${uid}`);
        }

        const rRoleId = toIdString(roleRef);
        if (rRoleId && !countedRoleUsers.has(`${rRoleId}:${uid}`)) {
            const label = resolveLabelById(roleRef, roles) || rRoleId;
            ensure(roleStats, rRoleId, label).completed += 1;
            countedRoleUsers.add(`${rRoleId}:${uid}`);
        }
    });

    const finalize = (map) => Array.from(map.values())
        .map((item) => ({
            ...item,
            pending: Math.max(0, item.target - item.completed),
            rate: item.target > 0 ? Math.round((item.completed / item.target) * 1000) / 10 : 0
        }))
        .sort((a, b) => (b.rate - a.rate) || (b.completed - a.completed) || (b.target - a.target));

    return {
        byOrganization: finalize(orgStats),
        byRole: finalize(roleStats)
    };
}

function formatTrendKey(dateObj, mode) {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    const h = String(dateObj.getUTCHours()).padStart(2, '0');
    if (mode === 'hourly') return `${y}-${m}-${d} ${h}:00`;
    if (mode === 'monthly') return `${y}-${m}`;
    return `${y}-${m}-${d}`;
}

function buildTrendSeries(responses = [], timeRange = 'all', now = new Date()) {
    const dated = (responses || [])
        .map((r) => {
            const d = new Date(r.createdAt || r.updatedAt || 0);
            return Number.isNaN(d.getTime()) ? null : { r, d };
        })
        .filter(Boolean);

    const nowDate = now instanceof Date ? now : new Date(now);
    let mode = 'daily';
    const labels = [];
    const completedMap = new Map();
    const ongoingMap = new Map();

    const addBucket = (key) => {
        if (!completedMap.has(key)) {
            labels.push(key);
            completedMap.set(key, 0);
            ongoingMap.set(key, 0);
        }
    };

    if (timeRange === '1d') {
        mode = 'hourly';
        for (let i = 23; i >= 0; i--) {
            const slot = new Date(nowDate.getTime() - i * 3600 * 1000);
            addBucket(formatTrendKey(slot, mode));
        }
    } else if (timeRange === '7d' || timeRange === '30d') {
        const days = timeRange === '30d' ? 30 : 7;
        for (let i = days - 1; i >= 0; i--) {
            const slot = new Date(nowDate.getTime() - i * DAY_MS);
            addBucket(formatTrendKey(slot, mode));
        }
    } else if (dated.length === 0) {
        mode = 'monthly';
        for (let i = 5; i >= 0; i--) {
            const d = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth() - i, 1));
            addBucket(formatTrendKey(d, mode));
        }
    } else {
        let minMs = dated[0].d.getTime();
        let maxMs = nowDate.getTime();
        dated.forEach(({ d }) => {
            const t = d.getTime();
            if (t < minMs) minMs = t;
            if (t > maxMs) maxMs = t;
        });
        const spanDays = Math.max(1, Math.ceil((maxMs - minMs) / DAY_MS));
        if (spanDays > 31) {
            mode = 'monthly';
            const minD = new Date(minMs);
            const maxD = new Date(maxMs);
            let cursorY = minD.getUTCFullYear();
            let cursorM = minD.getUTCMonth();
            const endY = maxD.getUTCFullYear();
            const endM = maxD.getUTCMonth();
            while (cursorY < endY || (cursorY === endY && cursorM <= endM)) {
                addBucket(formatTrendKey(new Date(Date.UTC(cursorY, cursorM, 1)), mode));
                cursorM += 1;
                if (cursorM > 11) {
                    cursorM = 0;
                    cursorY += 1;
                }
            }
        } else {
            mode = 'daily';
            const totalDays = Math.max(7, spanDays);
            for (let i = totalDays - 1; i >= 0; i--) {
                const slot = new Date(maxMs - i * DAY_MS);
                addBucket(formatTrendKey(slot, mode));
            }
        }
    }

    dated.forEach(({ r, d }) => {
        const key = formatTrendKey(d, mode);
        if (!completedMap.has(key)) return;
        if (r.submit === true) {
            completedMap.set(key, completedMap.get(key) + 1);
        } else {
            ongoingMap.set(key, ongoingMap.get(key) + 1);
        }
    });

    return {
        mode,
        labels,
        completedData: labels.map((l) => completedMap.get(l) || 0),
        ongoingData: labels.map((l) => ongoingMap.get(l) || 0)
    };
}

/**
 * Builds the unified multi-form Analytics Export payload (`overall` + per-form `forms[]`).
 * Matches the `/api/v1/response/export/:formId` per-form structure while adding Overall KPIs,
 * Time Trend, Org/Role Breakdown, and per-question statistics for BI / Excel / presentation export.
 */
function buildAnalyticsExportPayload({
    forms = [],
    responses = [],
    users = [],
    organizations = [],
    roles = [],
    currentUser = null,
    timeRange = 'all',
    orgId = 'all',
    status = 'all',
    searchQuery = '',
    formIds = [],
    baseUrl = '',
    exportedAt = new Date()
} = {}) {
    const nowDate = exportedAt instanceof Date ? exportedAt : new Date(exportedAt);
    const exportedIso = nowDate.toISOString();
    const resolvedBaseUrl = resolveServerOrigin({ baseUrl });

    const scopedForms = currentUser
        ? (isAdminUser(currentUser) ? forms : forms.filter((f) => canUserManageOrViewForm(f, currentUser)))
        : (Array.isArray(forms) ? forms : []);

    const requestedIds = new Set((Array.isArray(formIds) ? formIds : []).map((id) => toIdString(id)).filter(Boolean));
    const searchLower = String(searchQuery || '').trim().toLowerCase();

    const filteredForms = scopedForms.filter((f) => {
        if (!f || !f._id) return false;
        const fid = toIdString(f._id);
        if (requestedIds.size > 0 && !requestedIds.has(fid)) return false;

        if (orgId && orgId !== 'all') {
            const rawOrgs = Array.isArray(f.organization) ? f.organization : (f.organization ? [f.organization] : []);
            const hasPublic = rawOrgs.some((o) => isGeneralOrgRef(o, organizations));
            const matchesOrg = hasPublic || rawOrgs.some((o) => toIdString(o) === String(orgId));
            if (!matchesOrg) return false;
        }

        const displayStatus = resolveDisplayStatus(f.schedule, nowDate);
        const daysLeft = getDaysLeft(f.schedule, nowDate);
        const isClosingSoon = displayStatus === 'Active' && daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

        if (status && status !== 'all') {
            if (status === 'closingSoon') {
                if (!isClosingSoon) return false;
            } else if (displayStatus !== status) {
                return false;
            }
        }

        if (searchLower) {
            const thTitle = resolveLocalizedText(f.title, 'th').toLowerCase();
            const enTitle = resolveLocalizedText(f.title, 'en').toLowerCase();
            const thDesc = resolveLocalizedText(f.description, 'th').toLowerCase();
            const enDesc = resolveLocalizedText(f.description, 'en').toLowerCase();
            if (
                !thTitle.includes(searchLower) &&
                !enTitle.includes(searchLower) &&
                !thDesc.includes(searchLower) &&
                !enDesc.includes(searchLower)
            ) {
                return false;
            }
        }

        return true;
    });

    const responsesByForm = new Map();
    (Array.isArray(responses) ? responses : []).forEach((r) => {
        const fid = toIdString(r && r.form);
        if (!fid) return;
        if (!isResponseInRange(r, timeRange, nowDate)) return;
        if (!responsesByForm.has(fid)) responsesByForm.set(fid, []);
        responsesByForm.get(fid).push(r);
    });

    let activeForms = 0;
    let pendingForms = 0;
    let closedForms = 0;
    let closingSoonForms = 0;
    let totalCompleted = 0;
    let totalOngoing = 0;
    let totalTargeted = 0;
    let totalPendingTargets = 0;
    let signedInResponses = 0;
    let guestResponses = 0;
    let overallRatingScore = 0;
    let overallRatingCount = 0;
    const overallRatingDist = createEmptyRatingDist();
    const allFilteredResponses = [];

    const formPayloads = filteredForms.map((f) => {
        const fid = toIdString(f._id);
        const formResponses = responsesByForm.get(fid) || [];
        allFilteredResponses.push(...formResponses);

        const submittedResponses = formResponses.filter((r) => r && r.submit === true);
        const ongoingResponses = formResponses.filter((r) => r && r.submit !== true);

        const singlePayload = buildFormExportPayload({
            form: f,
            responses: submittedResponses,
            users,
            organizations,
            baseUrl: resolvedBaseUrl,
            exportedAt: nowDate
        });

        const { targetUsers } = getFormTargetUsers(f, users, organizations);
        const submittedUserIds = new Set();
        const submittedByUserId = new Map();
        const ongoingByUserId = new Map();
        submittedResponses.forEach((r) => {
            const uid = toIdString(r && r.responder);
            if (uid) {
                submittedUserIds.add(uid);
                const prev = submittedByUserId.get(uid);
                if (!prev) {
                    submittedByUserId.set(uid, r);
                } else {
                    const prevMs = new Date(prev.createdAt || prev.updatedAt || 0).getTime();
                    const curMs = new Date(r.createdAt || r.updatedAt || 0).getTime();
                    if (curMs >= prevMs) submittedByUserId.set(uid, r);
                }
            }
        });
        ongoingResponses.forEach((r) => {
            const uid = toIdString(r && r.responder);
            if (uid && !submittedUserIds.has(uid)) {
                const prev = ongoingByUserId.get(uid);
                if (!prev) {
                    ongoingByUserId.set(uid, r);
                } else {
                    const prevMs = new Date(prev.updatedAt || prev.createdAt || 0).getTime();
                    const curMs = new Date(r.updatedAt || r.createdAt || 0).getTime();
                    if (curMs >= prevMs) ongoingByUserId.set(uid, r);
                }
            }
        });

        const displayStatus = resolveDisplayStatus(f.schedule, nowDate);
        const daysLeft = getDaysLeft(f.schedule, nowDate);
        const isClosingSoon = displayStatus === 'Active' && daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

        const targetCount = targetUsers.length;
        const completedCount = submittedResponses.length;
        const ongoingCount = ongoingResponses.length;
        const pendingCount = Math.max(0, targetCount - targetUsers.filter((u) => submittedUserIds.has(toIdString(u && u._id))).length);
        const responseRate = targetCount > 0 ? Math.round((completedCount / targetCount) * 1000) / 10 : null;
        const attempted = completedCount + ongoingCount;
        const completionRate = attempted > 0 ? Math.round((completedCount / attempted) * 100) : 0;
        const signedInCount = submittedResponses.filter((r) => Boolean(toIdString(r && r.responder))).length;
        const guestCount = completedCount - signedInCount;

        const ratingAndQuestions = computeFormRatingAndStats(f, submittedResponses, singlePayload.questions);
        const breakdown = buildGroupBreakdown({
            targetUsers,
            submittedResponses,
            users,
            organizations,
            roles
        });

        if (displayStatus === 'Active') activeForms += 1;
        else if (displayStatus === 'Closed') closedForms += 1;
        else pendingForms += 1;
        if (isClosingSoon) closingSoonForms += 1;

        totalCompleted += completedCount;
        totalOngoing += ongoingCount;
        totalTargeted += targetCount;
        totalPendingTargets += pendingCount;
        signedInResponses += signedInCount;
        guestResponses += guestCount;
        overallRatingScore += ratingAndQuestions.totalRatingScore;
        overallRatingCount += ratingAndQuestions.ratingCount;
        [1, 2, 3, 4, 5].forEach((star) => {
            overallRatingDist[star] += ratingAndQuestions.ratingDistribution[star];
        });

        const orderedQuestions = getOrderedInputQuestions(f.questions);
        const isFormClosed = displayStatus === 'Closed' || (f.schedule && f.schedule.endAt && new Date(f.schedule.endAt).getTime() < nowDate.getTime());

        const handledUserIds = new Set(
            singlePayload.results.map((entry) => toIdString(entry._id)).filter(Boolean)
        );
        const extraDraftResults = [];
        ongoingResponses.forEach((draft) => {
            const uid = toIdString(draft && draft.responder);
            if (uid) {
                if (!submittedUserIds.has(uid) && !handledUserIds.has(uid)) {
                    handledUserIds.add(uid);
                    const userDoc = (users || []).find((u) => toIdString(u && u._id) === uid) || (typeof draft.responder === 'object' ? draft.responder : { _id: uid });
                    const flatUser = formatFlatUser(userDoc, organizations);
                    extraDraftResults.push({
                        ...flatUser,
                        responseId: toIdString(draft._id) || null,
                        isTarget: false,
                        submitted: false,
                        submittedAt: null,
                        answers: formatResponseAnswers(draft, orderedQuestions, { baseUrl: resolvedBaseUrl }),
                        _draft: draft
                    });
                }
            } else if (draft && !draft.submit) {
                extraDraftResults.push({
                    ...formatFlatUser(null, organizations),
                    responseId: toIdString(draft._id) || null,
                    isTarget: false,
                    submitted: false,
                    submittedAt: null,
                    answers: formatResponseAnswers(draft, orderedQuestions, { baseUrl: resolvedBaseUrl }),
                    _draft: draft
                });
            }
        });

        const anonymousSubmittedDocs = submittedResponses
            .filter((r) => !toIdString(r && r.responder))
            .sort((a, b) => {
                const aMs = new Date(a.createdAt || a.updatedAt || 0).getTime();
                const bMs = new Date(b.createdAt || b.updatedAt || 0).getTime();
                return bMs - aMs;
            });
        let anonSubmittedIdx = 0;

        const combinedResults = [...singlePayload.results, ...extraDraftResults];
        const enrichedResults = combinedResults.map((entry) => {
            const draft = entry._draft || (!entry.submitted && entry._id ? ongoingByUserId.get(entry._id) : null);
            const submittedDoc = entry.submitted
                ? (entry._id ? submittedByUserId.get(entry._id) : (anonymousSubmittedDocs[anonSubmittedIdx++] || null))
                : null;
            let startedAt = null;
            if (entry.submitted) {
                startedAt = (submittedDoc && submittedDoc.createdAt)
                    ? new Date(submittedDoc.createdAt).toISOString()
                    : (entry.submittedAt || null);
            } else if (draft && draft.createdAt) {
                startedAt = new Date(draft.createdAt).toISOString();
            }

            let submissionStatus = 'pending';
            if (entry.submitted) {
                submissionStatus = 'submitted';
            } else if (draft) {
                submissionStatus = isFormClosed ? 'ongoing_closed' : 'ongoing';
            }

            const answers = (!entry.submitted && draft)
                ? formatResponseAnswers(draft, orderedQuestions, { baseUrl: resolvedBaseUrl })
                : (entry.answers || []);

            const cleanEntry = { ...entry };
            const respDoc = submittedDoc || draft;
            const respId = toIdString((respDoc && respDoc._id) || cleanEntry.responseId || cleanEntry.response || '');
            delete cleanEntry._draft;

            return {
                ...cleanEntry,
                responseId: respId || null,
                answers,
                respondentType: entry._id ? 'signed_in' : 'guest',
                submissionStatus,
                startedAt,
                updatedAt: draft
                    ? new Date(draft.updatedAt || draft.createdAt || nowDate).toISOString()
                    : entry.submittedAt
            };
        });

        return {
            form: {
                ...singlePayload.form,
                status: displayStatus,
                isClosingSoon,
                daysLeft
            },
            summary: {
                targetCount,
                completedCount,
                pendingCount,
                ongoingCount,
                responseRate,
                completionRate,
                signedInCount,
                guestCount,
                avgRating: ratingAndQuestions.avgRating,
                ratingCount: ratingAndQuestions.ratingCount,
                ratingDistribution: ratingAndQuestions.ratingDistribution
            },
            breakdown,
            questions: ratingAndQuestions.questions,
            results: enrichedResults
        };
    }).sort((a, b) => (b.summary.completedCount - a.summary.completedCount) || (b.summary.ongoingCount - a.summary.ongoingCount));

    const orgAgg = new Map();
    const roleAgg = new Map();
    const accumulateBreakdown = (targetMap, list = []) => {
        list.forEach((item) => {
            const prev = targetMap.get(item.id) || { id: item.id, label: item.label, target: 0, completed: 0, pending: 0, rate: 0 };
            prev.target += item.target || 0;
            prev.completed += item.completed || 0;
            prev.pending += item.pending || 0;
            targetMap.set(item.id, prev);
        });
    };
    const finalizeAgg = (map) => Array.from(map.values())
        .map((item) => ({
            ...item,
            rate: item.target > 0 ? Math.round((item.completed / item.target) * 1000) / 10 : 0
        }))
        .sort((a, b) => (b.rate - a.rate) || (b.completed - a.completed) || (b.target - a.target));

    formPayloads.forEach((fp) => {
        accumulateBreakdown(orgAgg, fp.breakdown.byOrganization);
        accumulateBreakdown(roleAgg, fp.breakdown.byRole);
    });
    const overallBreakdown = {
        byOrganization: finalizeAgg(orgAgg),
        byRole: finalizeAgg(roleAgg)
    };

    const overallResponseRate = totalTargeted > 0 ? Math.round((totalCompleted / totalTargeted) * 1000) / 10 : 0;
    const totalAttempted = totalCompleted + totalOngoing;
    const overallCompletionRate = totalAttempted > 0 ? Math.round((totalCompleted / totalAttempted) * 100) : 0;
    const overallAvgRating = overallRatingCount > 0 ? Math.round((overallRatingScore / overallRatingCount) * 100) / 100 : null;

    return {
        exportedAt: exportedIso,
        overall: {
            filters: {
                timeRange: timeRange || 'all',
                orgId: orgId || 'all',
                status: status || 'all',
                searchQuery: searchQuery || ''
            },
            summary: {
                totalForms: formPayloads.length,
                activeForms,
                pendingForms,
                closedForms,
                closingSoonForms,
                totalTargeted,
                totalCompleted,
                totalPendingTargets,
                totalOngoing,
                responseRate: overallResponseRate,
                completionRate: overallCompletionRate,
                avgRating: overallAvgRating,
                totalRatingCount: overallRatingCount,
                ratingDistribution: overallRatingDist,
                signedInResponses,
                guestResponses
            },
            trend: buildTrendSeries(allFilteredResponses, timeRange, nowDate),
            breakdown: overallBreakdown
        },
        forms: formPayloads
    };
}

module.exports = {
    GENERAL_ORG_ID,
    resolveDisplayStatus,
    buildAnalyticsExportPayload,
    buildTrendSeries,
    buildGroupBreakdown
};
