import moment from 'moment';

export const GENERAL_ORG_ID = '6a0b51af2dbf6e77c4df73fe';

export function toIdStr(val) {
    if (!val && val !== 0) return '';
    if (typeof val === 'object') {
        return String(val._id || val.id || val.value || val).trim();
    }
    return String(val).trim();
}

export function isUserAdmin(user) {
    if (!user || !user.role) return false;
    const roleTitle = user.role.title !== undefined ? user.role.title : user.role;
    if (Array.isArray(roleTitle)) {
        return roleTitle.some(t => t && t.value && String(t.value).toLowerCase().includes('admin'));
    }
    return String(roleTitle || '').toLowerCase().includes('admin');
}

export function getUserFormAccessRole(form, user) {
    if (!form || !user) return null;
    const uid = toIdStr(user._id || user.id);
    if (uid) {
        if (toIdStr(form.creator) === uid) {
            return 'creator';
        }
        if (Array.isArray(form.collaborator)) {
            const collab = form.collaborator.find(item => toIdStr(item && item.user) === uid);
            if (collab) {
                const typeVal = collab.type && collab.type.title !== undefined ? collab.type.title : collab.type;
                const typeText = Array.isArray(typeVal)
                    ? typeVal.map(t => String((t && t.value) || '')).join(' ').toLowerCase()
                    : String(typeVal || '').toLowerCase();
                return (typeText.includes('edit') || typeText.includes('แก้ไข')) ? 'editor' : 'viewer';
            }
        }
    }
    if (isUserAdmin(user)) {
        return 'admin';
    }
    return null;
}

export function canUserViewFormAnalytics(form, user) {
    return getUserFormAccessRole(form, user) !== null;
}

export function filterFormsByUserAccess(forms = [], user = null) {
    if (!Array.isArray(forms)) return [];
    if (!user) return [];
    if (isUserAdmin(user)) return forms;
    if (!toIdStr(user._id || user.id)) return [];
    return forms.filter(form => canUserViewFormAnalytics(form, user));
}

export function getLocalizedText(val, locale = 'en') {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) {
        if (val.length === 0) return '';
        const lower = String(locale || 'en').toLowerCase();
        const exact = val.find(t => t && t.key && String(t.key).toLowerCase() === lower && t.value);
        if (exact) return exact.value;
        const nonEmpty = val.find(t => t && t.value);
        return nonEmpty ? nonEmpty.value : '';
    }
    if (typeof val === 'object') {
        return getLocalizedText(val.title || val.name || val.value, locale);
    }
    return String(val);
}

export function isSubmittedResponse(response) {
    if (!response) return false;
    if (response.submit === true || response.submit === 1) return true;
    const normalized = String(response.submit || '').trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
}

export function getResponseTimestamp(response) {
    if (!response) return null;
    return response.updatedAt || response.createdAt || null;
}

export function getActorKey(response) {
    if (!response) return '';
    const responderId = toIdStr(response.responder);
    if (responderId) return `user:${responderId}`;
    if (response.guestSessionId) return `guest:${response.guestSessionId}`;
    return `doc:${toIdStr(response._id)}`;
}

function asMoment(val) {
    return moment.isMoment(val) ? val : moment(val || undefined);
}

export function getRangeStart(timeRange, now = moment()) {
    const mNow = asMoment(now);
    if (timeRange === '1d') {
        return mNow.clone().startOf('day');
    }
    if (timeRange === '30d') {
        return mNow.clone().startOf('day').subtract(29, 'days');
    }
    if (timeRange === '1y') {
        return mNow.clone().startOf('month').subtract(11, 'months');
    }
    return mNow.clone().startOf('day').subtract(6, 'days');
}

export function isInTimeRange(createdAt, timeRange, now = moment()) {
    if (timeRange === 'all') return true;
    if (!createdAt) return false;

    const date = moment(createdAt);
    if (!date.isValid()) return false;

    return date.isSameOrAfter(getRangeStart(timeRange, asMoment(now)), 'day');
}

export function getFilteredResponses(form, timeRange, now = moment()) {
    if (!form || !Array.isArray(form.responses)) return [];

    const submittedResponses = form.responses.filter((response) => isSubmittedResponse(response));
    const hasAnyValidDate = submittedResponses.some((response) => {
        return response && response.createdAt && moment(response.createdAt).isValid();
    });

    if (!hasAnyValidDate) {
        return submittedResponses;
    }

    return submittedResponses.filter((response) => {
        return isInTimeRange(response.createdAt, timeRange, now);
    });
}

export function getFormStatusKey(form, now = moment()) {
    const mNow = asMoment(now);
    const schedule = form && (form.schedule || (form.settings && form.settings.schedule));
    if (!schedule || schedule.isPublished === false) return 'pending';

    const hasStartAt = Boolean(schedule.startAt);
    const hasEndAt = Boolean(schedule.endAt);

    const start = hasStartAt ? moment(schedule.startAt) : null;
    const end = hasEndAt ? moment(schedule.endAt) : null;

    const startValid = start && start.isValid();
    const endValid = end && end.isValid();

    if (!startValid && !endValid) return 'pending';
    if (!startValid && endValid) return 'closed';

    if (startValid && mNow.isBefore(start)) return 'pending';
    if (endValid && mNow.isAfter(end)) return 'closed';

    return 'open';
}

export function getTableStatusLabel(form, now = moment()) {
    const key = getFormStatusKey(form, now);
    if (key === 'open') return 'Active';
    if (key === 'closed') return 'Closed';
    return 'Pending';
}

export function getFormResponsesFromPool(form, allResponses = []) {
    const formId = toIdStr(form && form._id);
    if (!formId) return [];

    const byId = new Map();
    const pushDoc = (r, requireFormId = false) => {
        if (!r || typeof r !== 'object') return;
        const rFormId = toIdStr(r.form);
        if (requireFormId) {
            if (rFormId !== formId) return;
        } else if (rFormId && rFormId !== formId) {
            return;
        }
        const key = toIdStr(r._id) || `${getActorKey(r)}-${byId.size}`;
        if (!byId.has(key)) {
            byId.set(key, r);
        } else {
            const prev = byId.get(key);
            if (!isSubmittedResponse(prev) && isSubmittedResponse(r)) {
                byId.set(key, r);
            }
        }
    };

    if (Array.isArray(allResponses)) {
        allResponses.forEach((r) => pushDoc(r, true));
    }
    if (Array.isArray(form && form.responses)) {
        form.responses.forEach((r) => pushDoc(r, false));
    }
    return Array.from(byId.values());
}

export function resolveOrganizationLabel(orgRef, organizations = [], locale = 'en') {
    if (!orgRef) return '';
    if (typeof orgRef === 'object' && !Array.isArray(orgRef)) {
        const direct = getLocalizedText(orgRef.title || orgRef.name || orgRef.value, locale);
        if (direct) return direct;
    }
    const id = toIdStr(orgRef);
    const found = (organizations || []).find(o => toIdStr(o && o._id) === id || toIdStr(o && o.id) === id);
    if (found) {
        return getLocalizedText(found.title || found.name || found.value, locale) || id;
    }
    return id;
}

export function isGeneralOrgRef(orgRef, organizations = []) {
    const id = toIdStr(orgRef);
    if (id === GENERAL_ORG_ID) return true;
    const label = resolveOrganizationLabel(orgRef, organizations, 'en').toLowerCase();
    const labelTh = resolveOrganizationLabel(orgRef, organizations, 'th').toLowerCase();
    return label === 'general' || labelTh === 'ทั่วไป';
}

export function getFormAccessLabels(form, { organizations = [], users = [], roles = [], locale = 'en' } = {}) {
    if (form && form.settings && form.settings.accessMode === 'public') {
        return { access: ['Public'], isGeneral: true };
    }

    const rawOrgs = (form && form.organization) || [];
    const orgList = Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs];
    const isPrivateMode = Boolean(form && form.settings && form.settings.accessMode === 'private');
    const isGeneral = !isPrivateMode && orgList.some(o => isGeneralOrgRef(o, organizations));

    const access = [];
    if (isGeneral) {
        access.push('Public');
    } else {
        const orgNames = orgList
            .map(o => resolveOrganizationLabel(o, organizations, locale))
            .filter(Boolean);
        if (orgNames.length > 0) {
            access.push(...orgNames);
        } else {
            access.push('Private');
        }
    }

    const allowedUsers = (form && form.settings && Array.isArray(form.settings.allowedUser))
        ? form.settings.allowedUser
        : [];
    const seenEmails = new Set();
    allowedUsers.forEach(u => {
        if (!u) return;
        let name = '';
        let email = '';
        if (typeof u === 'object' && (u.name || u.email)) {
            name = u.name || u.email;
            email = u.email ? String(u.email).trim().toLowerCase() : '';
        } else {
            const uid = toIdStr(u);
            const foundUser = (users || []).find(x => toIdStr(x && x._id) === uid);
            name = foundUser ? (foundUser.name || foundUser.email) : uid;
            email = foundUser && foundUser.email ? String(foundUser.email).trim().toLowerCase() : '';
        }
        if (email) seenEmails.add(email);
        if (name) access.push(`Personal: ${name}`);
    });

    const allowedEmails = (form && form.settings && Array.isArray(form.settings.allowedEmails))
        ? form.settings.allowedEmails
        : [];
    allowedEmails.forEach(rawEmail => {
        if (typeof rawEmail !== 'string') return;
        const email = rawEmail.trim().toLowerCase();
        if (!email || seenEmails.has(email)) return;
        seenEmails.add(email);
        access.push(`Personal: ${email}`);
    });

    const allowedRoles = (!isGeneral && form && form.settings && Array.isArray(form.settings.allowedRoles))
        ? form.settings.allowedRoles
        : [];
    allowedRoles.forEach(roleRef => {
        if (!roleRef) return;
        let roleName = '';
        if (typeof roleRef === 'object' && !Array.isArray(roleRef)) {
            roleName = getLocalizedText(roleRef.title || roleRef.name || roleRef.value, locale);
        }
        if (!roleName) {
            const rid = toIdStr(roleRef);
            const foundRole = (roles || []).find(r => toIdStr(r && r._id) === rid || toIdStr(r && r.id) === rid);
            roleName = foundRole ? (getLocalizedText(foundRole.title || foundRole.name, locale) || rid) : rid;
        }
        if (roleName) {
            access.push(`Role: ${roleName}`);
        }
    });

    return { access, isGeneral };
}

export function buildCompactAccessSummary(
    access,
    {
        formatLabel = (val) => val,
        orgUnit = 'Orgs',
        userUnit = 'Users',
        roleUnit = 'Roles'
    } = {}
) {
    const list = Array.isArray(access) ? access : [];
    const orgAccess = list.filter(acc => acc && !acc.startsWith('Personal: ') && !acc.startsWith('Role: '));
    const rawOrgs = orgAccess.filter(o => o !== 'Private');
    const isPublic = rawOrgs.includes('Public') || rawOrgs.includes('Publicly');
    const realOrgs = rawOrgs.filter(o => o !== 'Public' && o !== 'Publicly');
    const orgs = isPublic ? ['Public'] : realOrgs;
    const users = list.filter(acc => acc && acc.startsWith('Personal: ')).map(acc => acc.replace('Personal: ', ''));
    const roles = list.filter(acc => acc && acc.startsWith('Role: ')).map(acc => acc.replace('Role: ', ''));
    const extraCount = users.length + roles.length;
    const totalTargets = (isPublic ? 1 : realOrgs.length) + extraCount;

    if (totalTargets === 0) {
        const label = formatLabel('Private');
        return { label, tooltip: label, badgeClass: 'visi-private', icon: 'cil-lock-locked', hasDropdown: false, orgs: [], users: [], roles: [] };
    }

    if (totalTargets === 1) {
        if (isPublic) {
            const label = formatLabel('Public');
            return { label, tooltip: label, badgeClass: 'visi-public', icon: 'cil-globe-alt', hasDropdown: false, orgs, users, roles };
        }
        if (realOrgs.length === 1) {
            return { label: realOrgs[0], tooltip: realOrgs[0], badgeClass: 'visi-org', icon: 'cil-bank', hasDropdown: false, orgs, users, roles };
        }
        if (users.length === 1) {
            return { label: users[0], tooltip: users[0], badgeClass: 'visi-personal', icon: 'cil-user', hasDropdown: false, orgs, users, roles };
        }
        return { label: roles[0], tooltip: roles[0], badgeClass: 'visi-role', icon: 'cil-shield-alt', hasDropdown: false, orgs, users, roles };
    }

    let label = '';
    let badgeClass = 'visi-org';
    let icon = 'cil-bank';

    const parts = [];

    if (isPublic) {
        parts.push(formatLabel('Public'));
        badgeClass = 'visi-public';
        icon = 'cil-globe-alt';
    } else if (realOrgs.length > 0) {
        const orgPart = realOrgs.length === 1 ? realOrgs[0] : `${realOrgs[0]} +${realOrgs.length - 1} ${orgUnit}`;
        parts.push(orgPart);
        badgeClass = 'visi-org';
        icon = 'cil-bank';
    }

    if (users.length > 0) {
        parts.push(`${users.length} ${userUnit}`);
    }
    if (roles.length > 0) {
        parts.push(`${roles.length} ${roleUnit}`);
    }

    if (!isPublic && realOrgs.length === 0) {
        if (users.length > 0 && roles.length === 0) {
            badgeClass = 'visi-personal';
            icon = 'cil-user';
        } else if (roles.length > 0 && users.length === 0) {
            badgeClass = 'visi-role';
            icon = 'cil-shield-alt';
        } else {
            badgeClass = 'visi-personal';
            icon = 'cil-user';
        }
    }

    label = parts.join(' · ');

    const tooltipParts = [];
    if (isPublic) tooltipParts.push(formatLabel('Public'));
    else if (realOrgs.length) tooltipParts.push(realOrgs.join(', '));
    if (users.length) tooltipParts.push(`${users.length} ${userUnit}: ${users.join(', ')}`);
    if (roles.length) tooltipParts.push(`${roles.length} ${roleUnit}: ${roles.join(', ')}`);

    return { label, tooltip: tooltipParts.join(' | '), badgeClass, icon, hasDropdown: true, orgs, users, roles };
}

export function getFormTargetUsers(form, users = [], organizations = []) {
    const userList = Array.isArray(users) ? users : [];
    const hasAllowedUsers = Boolean(form && form.settings && Array.isArray(form.settings.allowedUser) && form.settings.allowedUser.length > 0);
    const hasAllowedEmails = Boolean(form && form.settings && Array.isArray(form.settings.allowedEmails) && form.settings.allowedEmails.length > 0);
    if (!form || (userList.length === 0 && !hasAllowedUsers && !hasAllowedEmails)) {
        return { targetUsers: [], targetCount: 0 };
    }

    const explicitPublic = Boolean(form.settings && form.settings.accessMode === 'public');
    const isPrivateMode = Boolean(form.settings && form.settings.accessMode === 'private');
    const rawOrgs = form.organization || [];
    const orgList = (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs]).filter(Boolean);
    const formOrgIds = orgList.map(o => toIdStr(o)).filter(Boolean);
    const isPublicForm = explicitPublic || (!isPrivateMode && orgList.some(o => isGeneralOrgRef(o, organizations)));

    const allowedRoles = (!explicitPublic && form.settings && Array.isArray(form.settings.allowedRoles)) ? form.settings.allowedRoles : [];
    const allowedRoleIds = allowedRoles.map(r => toIdStr(r)).filter(Boolean);
    const hasRoleFilter = allowedRoleIds.length > 0;

    const targetMap = new Map();

    userList.forEach(u => {
        if (!u || !u._id) return;
        const uId = toIdStr(u._id);
        const uOrgId = toIdStr(u.organization);
        const uRoleId = toIdStr(u.role);
        const roleMatches = !hasRoleFilter || (uRoleId && allowedRoleIds.includes(uRoleId));

        if (isPublicForm) {
            if (roleMatches) targetMap.set(uId, u);
        } else if (uOrgId && formOrgIds.includes(uOrgId)) {
            if (roleMatches) targetMap.set(uId, u);
        }
    });

    if (!explicitPublic) {
        const allowedUsers = (form.settings && Array.isArray(form.settings.allowedUser)) ? form.settings.allowedUser : [];
        allowedUsers.forEach(u => {
            const uId = toIdStr(u);
            if (!uId || targetMap.has(uId)) return;
            const found = userList.find(x => toIdStr(x && x._id) === uId);
            targetMap.set(uId, found || { _id: uId });
        });

        const allowedEmails = (form.settings && Array.isArray(form.settings.allowedEmails)) ? form.settings.allowedEmails : [];
        if (allowedEmails.length > 0) {
            const presentEmails = new Set(
                Array.from(targetMap.values())
                    .map(u => (u && typeof u.email === 'string' ? u.email.trim().toLowerCase() : ''))
                    .filter(Boolean)
            );
            allowedEmails.forEach(rawEmail => {
                if (typeof rawEmail !== 'string') return;
                const email = rawEmail.trim().toLowerCase();
                if (!email || presentEmails.has(email)) return;
                const found = userList.find(x => x && typeof x.email === 'string' && x.email.trim().toLowerCase() === email);
                if (found && found._id) {
                    const uid = toIdStr(found._id);
                    if (uid && !targetMap.has(uid)) {
                        targetMap.set(uid, found);
                    }
                } else {
                    targetMap.set(`email:${email}`, { _id: `email:${email}`, name: email, email });
                }
                presentEmails.add(email);
            });
        }
    }

    const targetUsers = Array.from(targetMap.values());
    return { targetUsers, targetCount: targetUsers.length };
}

export function getFormRatingSummary(form, submittedResponses = []) {
    const questions = (form && Array.isArray(form.questions)) ? form.questions : [];
    const ratingQuestions = new Map();

    questions.forEach(q => {
        if (!q || !q._id) return;
        const typeStr = String((q.type && q.type.type) || q.type || '').toLowerCase();
        if (typeStr === 'rating') {
            const maxRating = Number(q.config && q.config.maxRating) || 5;
            ratingQuestions.set(toIdStr(q._id), maxRating);
        }
    });

    if (ratingQuestions.size === 0 || !Array.isArray(submittedResponses) || submittedResponses.length === 0) {
        return { avgRating: null, ratingCount: 0, totalScore: 0, distribution: [0, 0, 0, 0, 0] };
    }

    let totalScore = 0;
    let ratingCount = 0;
    const distribution = [0, 0, 0, 0, 0];

    submittedResponses.forEach(resp => {
        if (!resp || !Array.isArray(resp.answers)) return;
        resp.answers.forEach(ans => {
            if (!ans) return;
            const qId = toIdStr(ans.question);
            if (!ratingQuestions.has(qId)) return;
            const val = Number(ans.response);
            const maxRating = ratingQuestions.get(qId) || 5;
            if (!Number.isFinite(val) || val < 1 || val > maxRating) return;

            const normalized5 = maxRating === 5 ? val : (val / maxRating) * 5;
            totalScore += normalized5;
            ratingCount += 1;

            const starIdx = Math.min(5, Math.max(1, Math.round(normalized5))) - 1;
            distribution[starIdx] += 1;
        });
    });

    return {
        avgRating: ratingCount > 0 ? Math.round((totalScore / ratingCount) * 100) / 100 : null,
        ratingCount,
        totalScore,
        distribution
    };
}

export function filterForms(forms = [], {
    selectedOrgId = 'all',
    selectedStatus = 'all',
    searchQuery = '',
    organizations = [],
    locale = 'en',
    now = moment()
} = {}) {
    if (!Array.isArray(forms)) return [];

    return forms.filter(form => {
        if (!form) return false;

        if (selectedOrgId && selectedOrgId !== 'all') {
            const rawOrgs = form.organization || [];
            const orgIds = (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs]).map(o => toIdStr(o)).filter(Boolean);
            const includesTargetOrg = orgIds.includes(String(selectedOrgId));
            const isGeneralSelected = String(selectedOrgId) === GENERAL_ORG_ID ||
                isGeneralOrgRef(selectedOrgId, organizations);
            if (!includesTargetOrg && !(isGeneralSelected && orgIds.some(id => isGeneralOrgRef(id, organizations)))) {
                return false;
            }
        }

        if (selectedStatus && selectedStatus !== 'all') {
            const mNow = asMoment(now);
            const status = getTableStatusLabel(form, mNow);
            if (String(selectedStatus).toLowerCase() === 'closingsoon') {
                const schedule = (form && (form.schedule || (form.settings && form.settings.schedule))) || {};
                const hasEnd = Boolean(schedule.endAt && moment(schedule.endAt).isValid());
                const daysLeft = (status === 'Active' && hasEnd)
                    ? Math.max(0, Math.ceil(moment(schedule.endAt).diff(mNow, 'hours') / 24))
                    : null;
                if (!(status === 'Active' && daysLeft !== null && daysLeft >= 0 && daysLeft <= 7)) {
                    return false;
                }
            } else if (status.toLowerCase() !== String(selectedStatus).toLowerCase()) {
                return false;
            }
        }

        if (searchQuery && String(searchQuery).trim() !== '') {
            const q = String(searchQuery).trim().toLowerCase();
            const titleEn = getLocalizedText(form.title, 'en').toLowerCase();
            const titleTh = getLocalizedText(form.title, 'th').toLowerCase();
            const descLocal = getLocalizedText(form.description, locale).toLowerCase();
            if (!titleEn.includes(q) && !titleTh.includes(q) && !descLocal.includes(q)) {
                return false;
            }
        }

        return true;
    });
}

export function getFormMetrics(form, {
    allResponses = [],
    users = [],
    organizations = [],
    timeRange = 'all',
    locale = 'en',
    now = moment()
} = {}) {
    const mNow = asMoment(now);
    const mergedResponses = getFormResponsesFromPool(form, allResponses);
    const inRangeResponses = mergedResponses.filter(r => {
        if (timeRange === 'all') return true;
        const ts = getResponseTimestamp(r);
        return isInTimeRange(ts, timeRange, mNow);
    });

    const submittedInRange = inRangeResponses.filter(isSubmittedResponse);
    const draftInRange = inRangeResponses.filter(r => !isSubmittedResponse(r));

    const completedActors = new Set();
    let signedInCount = 0;
    let guestCount = 0;

    submittedInRange.forEach(r => {
        completedActors.add(getActorKey(r));
        if (toIdStr(r.responder)) signedInCount += 1;
        else guestCount += 1;
    });

    const ongoingActors = new Set();
    draftInRange.forEach(r => {
        const actor = getActorKey(r);
        if (!completedActors.has(actor)) {
            ongoingActors.add(actor);
        }
    });

    const completedCount = completedActors.size;
    const ongoingCount = ongoingActors.size;
    const { targetUsers, targetCount } = getFormTargetUsers(form, users, organizations);
    const responseRate = targetCount > 0 ? Math.round((completedCount / targetCount) * 1000) / 10 : null;
    const totalActiveResponses = completedCount + ongoingCount;
    const completionRate = totalActiveResponses > 0
        ? Math.round((completedCount / totalActiveResponses) * 100)
        : 0;

    const status = getTableStatusLabel(form, mNow);
    const schedule = (form && (form.schedule || (form.settings && form.settings.schedule))) || {};
    let scheduleRange = '-';
    let daysLeft = null;

    const hasStart = Boolean(schedule.startAt && moment(schedule.startAt).isValid());
    const hasEnd = Boolean(schedule.endAt && moment(schedule.endAt).isValid());

    if (hasStart && hasEnd) {
        scheduleRange = `${moment(schedule.startAt).format('DD/MM/YYYY')} - ${moment(schedule.endAt).format('DD/MM/YYYY')}`;
    } else if (hasStart) {
        scheduleRange = `${moment(schedule.startAt).format('DD/MM/YYYY')} - Open`;
    } else if (hasEnd) {
        scheduleRange = `Until ${moment(schedule.endAt).format('DD/MM/YYYY')}`;
    }

    if (status === 'Active' && hasEnd) {
        daysLeft = Math.max(0, Math.ceil(moment(schedule.endAt).diff(mNow, 'hours') / 24));
    }

    const isClosingSoon = Boolean(status === 'Active' && daysLeft !== null && daysLeft >= 0 && daysLeft <= 7);
    const ratingSummary = getFormRatingSummary(form, submittedInRange);
    const { access } = getFormAccessLabels(form, { organizations, users, locale });

    return {
        id: toIdStr(form._id),
        formName: getLocalizedText(form.title, locale) || 'Untitled Form',
        description: getLocalizedText(form.description, locale),
        access,
        status,
        scheduleRange,
        scheduleStartAt: hasStart ? schedule.startAt : null,
        scheduleEndAt: hasEnd ? schedule.endAt : null,
        daysLeft,
        isClosingSoon,
        completedCount,
        rawSubmittedCount: submittedInRange.length,
        ongoingCount,
        targetCount,
        targetUsers,
        responseRate,
        completionRate,
        avgRating: ratingSummary.avgRating,
        ratingCount: ratingSummary.ratingCount,
        totalRatingScore: ratingSummary.totalScore,
        ratingDistribution: ratingSummary.distribution,
        signedInCount,
        guestCount,
        submittedResponses: submittedInRange,
        allFormResponses: inRangeResponses
    };
}

export function buildTrendSeries(forms = [], { allResponses = [], timeRange = 'all', now = moment() } = {}) {
    const mNow = asMoment(now);
    const formMap = new Map();
    (forms || []).forEach(f => {
        if (f && f._id) formMap.set(toIdStr(f._id), f);
    });

    const combined = [];
    formMap.forEach(form => {
        getFormResponsesFromPool(form, allResponses).forEach(r => combined.push(r));
    });

    const dated = combined
        .map(r => ({ r, ts: moment(getResponseTimestamp(r)) }))
        .filter(item => item.ts.isValid());

    let mode = 'daily';
    let labels = [];
    let formatStr = 'MMM DD';
    const completedMap = {};
    const ongoingMap = {};

    if (timeRange === '1d') {
        mode = 'hourly';
        formatStr = 'HH:00';
        for (let i = 23; i >= 0; i--) {
            const key = mNow.clone().subtract(i, 'hours').format(formatStr);
            labels.push(key);
            completedMap[key] = 0;
            ongoingMap[key] = 0;
        }
        dated.forEach(({ r, ts }) => {
            if (!ts.isSame(mNow, 'day')) return;
            const key = ts.format(formatStr);
            if (completedMap[key] === undefined) return;
            if (isSubmittedResponse(r)) completedMap[key] += 1;
            else ongoingMap[key] += 1;
        });
    } else if (timeRange === '7d' || timeRange === '30d') {
        const daysCount = timeRange === '30d' ? 30 : 7;
        const startDay = mNow.clone().startOf('day').subtract(daysCount - 1, 'days');
        for (let i = daysCount - 1; i >= 0; i--) {
            const key = mNow.clone().subtract(i, 'days').format(formatStr);
            labels.push(key);
            completedMap[key] = 0;
            ongoingMap[key] = 0;
        }
        dated.forEach(({ r, ts }) => {
            if (ts.isBefore(startDay, 'day') || ts.isAfter(mNow, 'day')) return;
            const key = ts.format(formatStr);
            if (completedMap[key] === undefined) return;
            if (isSubmittedResponse(r)) completedMap[key] += 1;
            else ongoingMap[key] += 1;
        });
    } else {
        // Real 'all' range: monthly buckets if span > 31 days, daily buckets across full span if <= 31 days
        if (dated.length === 0) {
            mode = 'monthly';
            formatStr = 'MMM YYYY';
            for (let i = 5; i >= 0; i--) {
                const key = mNow.clone().startOf('month').subtract(i, 'months').format(formatStr);
                labels.push(key);
                completedMap[key] = 0;
                ongoingMap[key] = 0;
            }
        } else {
            let minDate = dated[0].ts.clone();
            let maxDate = mNow.clone();
            dated.forEach(({ ts }) => {
                if (ts.isBefore(minDate)) minDate = ts.clone();
                if (ts.isAfter(maxDate)) maxDate = ts.clone();
            });

            const spanDays = Math.max(1, maxDate.clone().startOf('day').diff(minDate.clone().startOf('day'), 'days') + 1);
            if (spanDays > 31) {
                mode = 'monthly';
                formatStr = 'MMM YYYY';
                const cursor = minDate.clone().startOf('month');
                const endMonth = maxDate.clone().startOf('month');
                while (!cursor.isAfter(endMonth, 'month')) {
                    const key = cursor.format(formatStr);
                    labels.push(key);
                    completedMap[key] = 0;
                    ongoingMap[key] = 0;
                    cursor.add(1, 'month');
                }
            } else {
                mode = 'daily';
                formatStr = 'MMM DD';
                const totalDays = Math.max(7, spanDays);
                const startDay = maxDate.clone().startOf('day').subtract(totalDays - 1, 'days');
                const cursor = startDay.clone();
                const endDay = maxDate.clone().startOf('day');
                while (!cursor.isAfter(endDay, 'day')) {
                    const key = cursor.format(formatStr);
                    labels.push(key);
                    completedMap[key] = 0;
                    ongoingMap[key] = 0;
                    cursor.add(1, 'day');
                }
            }

            dated.forEach(({ r, ts }) => {
                const key = ts.format(formatStr);
                if (completedMap[key] === undefined) return;
                if (isSubmittedResponse(r)) completedMap[key] += 1;
                else ongoingMap[key] += 1;
            });
        }
    }

    return {
        mode,
        labels,
        completedData: labels.map(l => completedMap[l] || 0),
        ongoingData: labels.map(l => ongoingMap[l] || 0)
    };
}

export function buildOrgAndRoleBreakdown(formMetricsList = [], {
    organizations = [],
    roles = [],
    users = [],
    locale = 'en'
} = {}) {
    const orgStats = new Map();
    const roleStats = new Map();

    const ensureEntry = (map, id, label) => {
        if (!map.has(id)) {
            map.set(id, { id, label, completed: 0, target: 0, rate: 0 });
        }
        return map.get(id);
    };

    const resolveRoleLabel = (roleRef) => {
        if (!roleRef) return '';
        if (typeof roleRef === 'object') {
            const direct = getLocalizedText(roleRef.title || roleRef.name, locale);
            if (direct) return direct;
        }
        const rid = toIdStr(roleRef);
        const found = (roles || []).find(r => toIdStr(r && r._id) === rid);
        return found ? (getLocalizedText(found.title || found.name, locale) || rid) : rid;
    };

    formMetricsList.forEach(fm => {
        const submittedUserIds = new Set();
        (fm.submittedResponses || []).forEach(r => {
            const uid = toIdStr(r && r.responder);
            if (uid) submittedUserIds.add(uid);
        });

        const countedOrgUsers = new Set();
        const countedRoleUsers = new Set();

        (fm.targetUsers || []).forEach(u => {
            const uid = toIdStr(u && u._id);
            const hasSubmitted = Boolean(uid && submittedUserIds.has(uid));

            const uOrgId = toIdStr(u && u.organization);
            if (uOrgId && !isGeneralOrgRef(uOrgId, organizations)) {
                const orgLabel = resolveOrganizationLabel(uOrgId, organizations, locale) || uOrgId;
                const entry = ensureEntry(orgStats, uOrgId, orgLabel);
                entry.target += 1;
                if (hasSubmitted) entry.completed += 1;
                if (uid) countedOrgUsers.add(`${uOrgId}:${uid}`);
            }

            const uRoleId = toIdStr(u && u.role);
            if (uRoleId) {
                const roleLabel = resolveRoleLabel(u.role) || uRoleId;
                const entry = ensureEntry(roleStats, uRoleId, roleLabel);
                entry.target += 1;
                if (hasSubmitted) entry.completed += 1;
                if (uid) countedRoleUsers.add(`${uRoleId}:${uid}`);
            }
        });

        // Include actual signed-in respondents even if the form had no explicit organization/role targets
        const seenFormResponders = new Set();
        (fm.submittedResponses || []).forEach(r => {
            if (!r || !r.responder) return;
            const uid = toIdStr(r.responder);
            if (!uid || seenFormResponders.has(uid)) return;
            seenFormResponders.add(uid);

            const responderObj = typeof r.responder === 'object' ? r.responder : null;
            const userMatch = (users || []).find(u => toIdStr(u && u._id) === uid) || {};
            const orgRef = (responderObj && responderObj.organization) || userMatch.organization;
            const roleRef = (responderObj && responderObj.role) || userMatch.role;

            const rOrgId = toIdStr(orgRef);
            if (rOrgId && !isGeneralOrgRef(rOrgId, organizations) && !countedOrgUsers.has(`${rOrgId}:${uid}`)) {
                const orgLabel = resolveOrganizationLabel(orgRef, organizations, locale) || rOrgId;
                const entry = ensureEntry(orgStats, rOrgId, orgLabel);
                entry.completed += 1;
                countedOrgUsers.add(`${rOrgId}:${uid}`);
            }

            const rRoleId = toIdStr(roleRef);
            if (rRoleId && !countedRoleUsers.has(`${rRoleId}:${uid}`)) {
                const roleLabel = resolveRoleLabel(roleRef) || rRoleId;
                const entry = ensureEntry(roleStats, rRoleId, roleLabel);
                entry.completed += 1;
                countedRoleUsers.add(`${rRoleId}:${uid}`);
            }
        });
    });

    const finalizeList = (map) => Array.from(map.values())
        .map(item => ({
            ...item,
            rate: item.target > 0 ? Math.round((item.completed / item.target) * 1000) / 10 : 0
        }))
        .sort((a, b) => (b.rate - a.rate) || (b.completed - a.completed) || (b.target - a.target));

    return {
        byOrganization: finalizeList(orgStats),
        byRole: finalizeList(roleStats)
    };
}

export function buildAnalyticsDashboard(forms = [], {
    allResponses = [],
    users = [],
    organizations = [],
    roles = [],
    currentUser = undefined,
    timeRange = 'all',
    selectedOrgId = 'all',
    selectedStatus = 'all',
    searchQuery = '',
    locale = 'en',
    now = moment()
} = {}) {
    const scopedForms = currentUser !== undefined
        ? filterFormsByUserAccess(forms, currentUser)
        : (Array.isArray(forms) ? forms : []);
    const filteredForms = filterForms(scopedForms, {
        selectedOrgId,
        selectedStatus,
        searchQuery: '', // keep KPI/charts responsive to Org & Status & TimeRange consistently; table applies searchQuery too
        organizations,
        locale,
        now
    });

    const metricsList = filteredForms.map(f => getFormMetrics(f, {
        allResponses,
        users,
        organizations,
        timeRange,
        locale,
        now
    }));

    let activeForms = 0;
    let pendingForms = 0;
    let closedForms = 0;
    let closingSoonForms = 0;
    let totalCompleted = 0;
    let totalOngoing = 0;
    let totalTarget = 0;
    let totalRatingScore = 0;
    let totalRatingCount = 0;
    let signedInResponses = 0;
    let guestResponses = 0;
    const ratingDistribution = [0, 0, 0, 0, 0];

    metricsList.forEach(m => {
        if (m.status === 'Active') activeForms += 1;
        else if (m.status === 'Closed') closedForms += 1;
        else pendingForms += 1;

        if (m.isClosingSoon) closingSoonForms += 1;
        totalCompleted += m.completedCount;
        totalOngoing += m.ongoingCount;
        totalTarget += m.targetCount;
        totalRatingScore += m.totalRatingScore;
        totalRatingCount += m.ratingCount;
        signedInResponses += m.signedInCount;
        guestResponses += m.guestCount;

        for (let i = 0; i < 5; i++) {
            ratingDistribution[i] += (m.ratingDistribution[i] || 0);
        }
    });

    const overallResponseRate = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 1000) / 10 : 0;
    const totalAttempted = totalCompleted + totalOngoing;
    const overallCompletionRate = totalAttempted > 0 ? Math.round((totalCompleted / totalAttempted) * 100) : 0;
    const avgRating = totalRatingCount > 0 ? Math.round((totalRatingScore / totalRatingCount) * 100) / 100 : null;

    const sortedRows = [...metricsList].sort((a, b) =>
        (b.completedCount - a.completedCount) || (b.ongoingCount - a.ongoingCount)
    );

    const searchLower = String(searchQuery || '').trim().toLowerCase();
    const tableRows = searchLower
        ? sortedRows.filter(row =>
            row.formName.toLowerCase().includes(searchLower) ||
            (row.description && row.description.toLowerCase().includes(searchLower))
        )
        : sortedRows;

    const trend = buildTrendSeries(filteredForms, { allResponses, timeRange, now });
    const breakdown = buildOrgAndRoleBreakdown(metricsList, { organizations, roles, users, locale });

    return {
        summary: {
            totalForms: filteredForms.length,
            activeForms,
            pendingForms,
            closedForms,
            closingSoonForms,
            totalCompleted,
            totalOngoing,
            totalTarget,
            totalUsers: Array.isArray(users) ? users.length : 0,
            overallResponseRate,
            overallCompletionRate,
            avgRating,
            totalRatingCount,
            ratingDistribution,
            signedInResponses,
            guestResponses
        },
        trend,
        breakdown,
        formRows: tableRows
    };
}

export function buildAnalyticsExportRows(formRows = []) {
    return (formRows || []).map((row, idx) => ({
        '#': idx + 1,
        'Form Title': row.formName,
        'Status': row.status,
        'Access / Organization': (row.access || []).join(', '),
        'Completed': row.completedCount || 0,
        'Target': row.targetCount || 0,
        'Response Rate (%)': row.responseRate !== null && row.responseRate !== undefined ? row.responseRate : '-',
        'Ongoing Drafts': row.ongoingCount || 0,
        'Completion Rate (%)': row.completionRate || 0,
        'Avg Rating (5)': row.avgRating !== null && row.avgRating !== undefined ? row.avgRating : '-',
        'Rating Responses': row.ratingCount || 0,
        'Schedule': row.scheduleRange || '-',
        'Days Left': row.daysLeft !== null && row.daysLeft !== undefined ? row.daysLeft : '-'
    }));
}

export function resolveQuickDateRange(type, now = moment()) {
    const base = moment(now);
    if (type === 'today') {
        const d = base.format('YYYY-MM-DD');
        return { startDate: d, endDate: d };
    }
    if (type === 'last7Days') {
        return {
            startDate: base.clone().subtract(6, 'days').format('YYYY-MM-DD'),
            endDate: base.format('YYYY-MM-DD')
        };
    }
    if (type === 'last30Days') {
        return {
            startDate: base.clone().subtract(30, 'days').format('YYYY-MM-DD'),
            endDate: base.format('YYYY-MM-DD')
        };
    }
    return { startDate: '', endDate: '' };
}

export function formHasRatingQuestions(form) {
    const questions = Array.isArray(form && form.questions) ? form.questions : [];
    return questions.some((q) => {
        const rawType = (q && typeof q.type === 'object') ? q.type.type : (q && q.type);
        return String(rawType || '').trim().toLowerCase() === 'rating';
    });
}

export async function loadAnalyticsWorkspaceData(store, user) {
    if (!store || !(user && user._id)) {
        if (store) store.commit('Forms/clearForms');
        return;
    }

    store.commit('Forms/clearForms');
    let orgId = null;
    if (user.organization) {
        orgId = user.organization._id || user.organization;
        if (typeof orgId === 'object' && orgId !== null) {
            orgId = orgId._id;
        }
    }
    const isAdmin = isUserAdmin(user);
    const safeDispatch = async (action, payload) => {
        const run = () => (payload !== undefined
            ? store.dispatch(action, payload)
            : store.dispatch(action));
        try {
            return await run();
        } catch (err) {
            try {
                return await run();
            } catch (e) {
                return null;
            }
        }
    };

    await Promise.all([
        safeDispatch('Forms/getByUser', {
            userId: user._id,
            organizationId: orgId,
            isAdmin,
            mode: 'manage'
        }),
        safeDispatch('Responses/exp', {
            params: { userId: user._id }
        })
    ]);
    await Promise.all([
        safeDispatch('User/getAll'),
        safeDispatch('Organizations/getAll'),
        safeDispatch('Roles/getAll')
    ]);
}
