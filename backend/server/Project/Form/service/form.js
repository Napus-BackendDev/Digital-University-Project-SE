const mongo = require('mongodb');
const Form = require('../controller/form');
const User = require('../../User/controller/user');
const ResMessage = require("../../Settings/service/message");
const { maybeSendCollaborationInvites } = require('../../Email/service/collaboration');
const { maybeSendOrganizationInvites } = require('../../Email/service/inviteOrganization');
const {
    normalizeMaxResponses,
    normalizeAllowedEmails,
    isUserAllowedByIndividualAccess,
    isUserAllowedByOrganizationAndRole,
    isAdminUser,
    canManageForms,
    getCollaboratorAccessRole,
    buildManagedFormsQuery,
    resolveReadScopeUserId,
    resolveScheduleMode,
    validateScheduleForPublish,
    buildPublishedSchedule,
    resolveFormAccessMode,
    isMfuInstitutionalEmail
} = require('../../Response/utils/responsePolicy');

function sanitizeFormSettings(body) {
    if (!body || !body.settings || typeof body.settings !== 'object') return;
    if (Object.prototype.hasOwnProperty.call(body.settings, 'maxResponses')) {
        body.settings.maxResponses = normalizeMaxResponses(body.settings.maxResponses);
    }
    if (Object.prototype.hasOwnProperty.call(body.settings, 'allowedEmails')) {
        body.settings.allowedEmails = normalizeAllowedEmails(body.settings.allowedEmails);
    }
    if (Object.prototype.hasOwnProperty.call(body.settings, 'contactOrganization')) {
        body.settings.contactOrganization = String(body.settings.contactOrganization || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(body.settings, 'contactEmail')) {
        body.settings.contactEmail = String(body.settings.contactEmail || '').trim().toLowerCase();
    }
    if (Object.prototype.hasOwnProperty.call(body.settings, 'accessMode')) {
        const rawMode = String(body.settings.accessMode || '').trim().toLowerCase();
        body.settings.accessMode = (rawMode === 'private' || rawMode === 'public') ? rawMode : null;
    }
    if (Object.prototype.hasOwnProperty.call(body.settings, 'collectEmail')) {
        body.settings.collectEmail = Boolean(body.settings.collectEmail);
    }
    if (Object.prototype.hasOwnProperty.call(body.settings, 'requireLogin')) {
        body.settings.requireLogin = Boolean(body.settings.requireLogin);
    }
    if (body.settings.accessMode === 'private') {
        body.settings.collectEmail = true;
    } else if (body.settings.accessMode === 'public' && Object.prototype.hasOwnProperty.call(body.settings, 'requireLogin')) {
        body.settings.collectEmail = Boolean(body.settings.requireLogin);
    }
    // Enforce that allowedRoles cannot exist independently without a selected Organization
    if (Object.prototype.hasOwnProperty.call(body, 'organization')) {
        const orgList = Array.isArray(body.organization) ? body.organization.filter(Boolean) : [];
        if (orgList.length === 0) {
            body.settings.allowedRoles = [];
        }
    }
}

const COLLABORATOR_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractCollaboratorId(ref) {
    if (!ref) return null;
    if (typeof ref === 'object' && ref._id !== undefined) {
        const nested = String(ref._id);
        return mongo.ObjectId.isValid(nested) ? nested : null;
    }
    const idStr = String(ref);
    return idStr !== '[object Object]' && mongo.ObjectId.isValid(idStr) ? idStr : null;
}

/**
 * Resolves collaborator entries supplied by email into persisted User ObjectIds
 * so invited collaborators who have not yet signed in still receive access & invites.
 */
async function resolveCollaboratorUsers(body) {
    if (!body || !Array.isArray(body.collaborator)) return;

    const resolved = [];
    const seenUserIds = new Set();

    for (const entry of body.collaborator) {
        if (!entry || typeof entry !== 'object') continue;

        const typeId = extractCollaboratorId(entry.type);
        if (!typeId) continue;

        const existingUserId = extractCollaboratorId(entry.user);
        if (existingUserId) {
            if (!seenUserIds.has(existingUserId)) {
                seenUserIds.add(existingUserId);
                resolved.push({
                    user: new mongo.ObjectId(existingUserId),
                    type: new mongo.ObjectId(typeId)
                });
            }
            continue;
        }

        const rawEmail = entry.email || (entry.user && typeof entry.user === 'object' ? entry.user.email : '');
        const cleanEmail = String(rawEmail || '').trim().toLowerCase();
        if (!cleanEmail || !COLLABORATOR_EMAIL_REGEX.test(cleanEmail)) continue;

        const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let userDoc = await User.onQuery({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } }, []);
        if (!userDoc && typeof User.onCreate === 'function') {
            userDoc = await User.onCreate({
                name: cleanEmail.split('@')[0] || cleanEmail,
                email: cleanEmail
            }, []);
        }

        const resolvedUserId = userDoc && userDoc._id ? String(userDoc._id) : null;
        if (resolvedUserId && mongo.ObjectId.isValid(resolvedUserId) && !seenUserIds.has(resolvedUserId)) {
            seenUserIds.add(resolvedUserId);
            resolved.push({
                user: new mongo.ObjectId(resolvedUserId),
                type: new mongo.ObjectId(typeId)
            });
        }
    }

    body.collaborator = resolved;
}

function normalizeDraftScheduleForCreate(body) {
    if (!body || typeof body !== 'object') return;
    const rawSched = (body.schedule && typeof body.schedule === 'object') ? body.schedule : {};
    const mode = resolveScheduleMode(rawSched);
    body.schedule = {
        isPublished: false,
        mode,
        startAt: rawSched.startAt || null,
        endAt: rawSched.endAt || null
    };
}

function datesDiffer(a, b) {
    const tA = a ? new Date(a).getTime() : null;
    const tB = b ? new Date(b).getTime() : null;
    if (tA === null && tB === null) return false;
    return tA !== tB;
}

function validateAndPrepareScheduleForUpdate(body, previousDoc, now = new Date()) {
    if (!body || !body.schedule || typeof body.schedule !== 'object') {
        return { valid: true };
    }

    const nextSched = body.schedule;
    const prevSched = (previousDoc && previousDoc.schedule) || {};
    const wasPublished = prevSched.isPublished === true;

    // Forms stay Draft if isPublished is false or unset on an unpublished form
    if (nextSched.isPublished !== true) {
        if (nextSched.isPublished === false || !wasPublished) {
            body.schedule = {
                ...nextSched,
                isPublished: false,
                mode: resolveScheduleMode(nextSched, now)
            };
        }
        return { valid: true };
    }

    const isTransitioningToPublish = !wasPublished;
    const isScheduleModified =
        datesDiffer(nextSched.startAt, prevSched.startAt) ||
        datesDiffer(nextSched.endAt, prevSched.endAt) ||
        (nextSched.mode && prevSched.mode && nextSched.mode !== prevSched.mode);

    // Allow harmless edits (e.g. fixing a typo) on already-published/expired forms when schedule didn't change
    if (!isTransitioningToPublish && !isScheduleModified) {
        return { valid: true };
    }

    if (isTransitioningToPublish) {
        const prepared = buildPublishedSchedule(nextSched, now);
        if (!prepared.valid) {
            return prepared;
        }
        body.schedule = prepared.schedule;
        return { valid: true };
    }

    const validation = validateScheduleForPublish(nextSched, now);
    if (!validation.valid) {
        return validation;
    }
    return { valid: true };
}

exports.checkAccess = async function (request, response) {
    try {
        const form_id = request.body.form_id;
        const user_id = request.body.user_id;

        if (!form_id || !user_id) {
            return ResMessage.sendResponse(response, 0, 40400, "form_id and user_id are required");
        }

        const doc = await Form.onQuery({ _id: new mongo.ObjectId(form_id) }, Form.formPopulate);
        if (!doc) {
            return ResMessage.sendResponse(response, 0, 40400, "Form not found");
        }

        // 1. Check if Creator
        if (String(doc.creator?._id || doc.creator) === String(user_id)) {
            return ResMessage.sendResponse(response, 0, 20000, { role: 'editor' });
        }

        // 2. Check Collaborators
        const collaborator = (doc.collaborator || []).find(c => String(c.user?._id || c.user) === String(user_id));
        if (collaborator) {
            const typeTitle = collaborator.type?.title || [];
            const fullTitle = (Array.isArray(typeTitle) ? typeTitle.map(t => t.value).join('') : String(typeTitle)).toLowerCase();
            const role = fullTitle.includes('view') ? 'viewer' : 'editor';
            return ResMessage.sendResponse(response, 0, 20000, { role });
        }

        // 3. Public forms allow viewing regardless of preserved hidden org/user fields
        if (resolveFormAccessMode(doc) === 'public') {
            return ResMessage.sendResponse(response, 0, 20000, { role: 'viewer' });
        }

        // 4. Check Allowed Users / Allowed Emails (Private)
        const allowedEmailsList = normalizeAllowedEmails(doc.settings?.allowedEmails);
        let userObjForAccess = null;
        if (allowedEmailsList.length > 0 || (doc.settings?.allowedRoles && doc.settings.allowedRoles.length > 0) || (Array.isArray(doc.organization) && doc.organization.length > 0)) {
            userObjForAccess = await User.onQuery({ _id: new mongo.ObjectId(user_id) });
        }
        if (isUserAllowedByIndividualAccess(doc.settings, user_id, userObjForAccess?.email)) {
            const hasIndividualRules = (Array.isArray(doc.settings?.allowedUser) && doc.settings.allowedUser.length > 0) || allowedEmailsList.length > 0;
            if (hasIndividualRules) {
                return ResMessage.sendResponse(response, 0, 20000, { role: 'viewer' });
            }
        }

        // 5. Check Organization & Allowed Roles bound together (Private institutional access)
        const hasOrgOrRoleScope = (Array.isArray(doc.organization) && doc.organization.length > 0)
            || (doc.settings?.allowedRoles && doc.settings.allowedRoles.length > 0);
        if (hasOrgOrRoleScope) {
            const userObj = userObjForAccess || await User.onQuery({ _id: new mongo.ObjectId(user_id) });
            if (userObj && typeof userObj.email === 'string' && userObj.email.trim() && !isMfuInstitutionalEmail(userObj.email)) {
                return ResMessage.sendResponse(response, 0, 40300, "Access Denied");
            }
            if (isUserAllowedByOrganizationAndRole(doc, userObj).allowed) {
                return ResMessage.sendResponse(response, 0, 20000, { role: 'viewer' });
            }
        }

        return ResMessage.sendResponse(response, 0, 40300, "Access Denied");
    } catch (err) {
        console.error("[form.service.js] checkAccess Error:", err);
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.onQuerys = async function (request, response) {
    try {
        const fallbackId = (request.query && (request.query.userId || request.query._id)) ||
            (request.body && (request.body.userId || request.body._id));
        const { userId: callerId } = resolveReadScopeUserId({ request, fallbackId });
        if (!callerId) {
            return ResMessage.sendResponse(response, 0, 40100);
        }

        const user = await User.onQuery({ _id: new mongo.ObjectId(callerId) }, [{ path: 'role' }], "_id organization role");
        if (!user) {
            return ResMessage.sendResponse(response, 0, 40400);
        }

        const query = buildManagedFormsQuery(user);
        if (!query) {
            return ResMessage.sendResponse(response, 0, 40100);
        }

        const doc = await Form.onQuerys(query, Form.formPopulate);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onQuery = async function (request, response) {
    try {
        const query = {};
        if (request.body && request.body._id) {
            if (!mongo.ObjectId.isValid(request.body._id)) {
                return ResMessage.sendResponse(response, 0, 40000, null, "Invalid ID format");
            }
            query._id = new mongo.ObjectId(request.body._id);
        }
        const doc = await Form.onQuery(query, Form.formPopulate);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onQueryByUser = async (request, response, next) => {
    try {
        const fallbackId = request.body && (request.body._id || request.body.userId);
        const { userId: callerId } = resolveReadScopeUserId({ request, fallbackId });
        if (!callerId || !mongo.ObjectId.isValid(callerId)) {
            return ResMessage.sendResponse(response, 0, 40100);
        }
        const _id = new mongo.ObjectId(callerId);

        const mode = request.body && request.body.mode;
        const userSelectFields = mode === 'manage' ? "_id organization role" : "_id organization role email";

        // Fetch user with role details to check for Admin privilege
        const user = await User.onQuery({ _id: _id }, [{ path: 'role' }], userSelectFields);
        if (!user) {
            console.warn("[form.service.js] User not found in DB:", _id);
            return ResMessage.onMessage_Response(0, 40400).then(resData => {
                response.status(404).json(resData);
            });
        }

        const userEmail = (user && typeof user.email === 'string') ? user.email.trim().toLowerCase() : '';
        let query = {};
        if (mode === 'manage') {
            query = buildManagedFormsQuery(user) || { creator: _id };
        } else {
            // mode !== 'manage' (Respondent view: /forms)
            // Even if user is Admin or Creator, /forms is ONLY for surveys where the user is a TARGET respondent!
            const userRoleId = user.role?._id || user.role;
            const generalOrgId = '6a0b51af2dbf6e77c4df73fe';
            const userOrgId = user.organization ? (user.organization._id || user.organization).toString() : null;

            const targetOrgs = [generalOrgId];
            if (mongo.ObjectId.isValid(generalOrgId)) {
                targetOrgs.push(new mongo.ObjectId(generalOrgId));
            }
            if (userOrgId) {
                targetOrgs.push(userOrgId);
                if (mongo.ObjectId.isValid(userOrgId)) {
                    targetOrgs.push(new mongo.ObjectId(userOrgId));
                }
            }

            const userMatches = [_id, _id.toString()];
            if (mongo.ObjectId.isValid(_id)) {
                userMatches.push(new mongo.ObjectId(_id));
            }

            const noAllowedRolesCond = {
                $or: [
                    { "settings.allowedRoles": { $exists: false } },
                    { "settings.allowedRoles": null },
                    { "settings.allowedRoles": { $size: 0 } }
                ]
            };

            const orgOrRoleConditions = [
                {
                    $and: [
                        { organization: { $in: targetOrgs } },
                        noAllowedRolesCond
                    ]
                }
            ];

            if (userRoleId) {
                const roleIdStr = (userRoleId._id || userRoleId).toString();
                const roleMatches = [roleIdStr];
                if (mongo.ObjectId.isValid(roleIdStr)) {
                    roleMatches.push(new mongo.ObjectId(roleIdStr));
                }
                orgOrRoleConditions.push({
                    $and: [
                        { organization: { $in: targetOrgs } },
                        { "settings.allowedRoles": { $in: roleMatches } }
                    ]
                });
            }

            // Audience union: user matches if they are an allowed individual (allowedUser / allowedEmails)
            // OR match the selected organizations (and bound allowedRoles when configured).
            if (userEmail) {
                query = {
                    $or: [
                        { "settings.accessMode": "public" },
                        { "settings.allowedUser": { $in: userMatches } },
                        { "settings.allowedEmails": userEmail },
                        ...orgOrRoleConditions
                    ]
                };
            } else {
                query = {
                    $or: [
                        { "settings.accessMode": "public" },
                        { "settings.allowedUser": { $in: userMatches } },
                        ...orgOrRoleConditions
                    ]
                };
            }
        }



        let doc = await Form.onQuerys(query, Form.formPopulate);
        if (mode !== 'manage' && Array.isArray(doc)) {
            doc = doc.filter((item) => {
                if (resolveFormAccessMode(item) === 'public') {
                    return true;
                }
                const s = (item && item.settings) || {};
                const hasUsers = Array.isArray(s.allowedUser) && s.allowedUser.length > 0;
                const hasEmails = normalizeAllowedEmails(s.allowedEmails).length > 0;
                if ((hasUsers || hasEmails) && isUserAllowedByIndividualAccess(s, callerId, userEmail)) {
                    return true;
                }
                if (userEmail && !isMfuInstitutionalEmail(userEmail)) {
                    return false;
                }
                return isUserAllowedByOrganizationAndRole(item, user).allowed;
            });
        }

        
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.error("[form.service.js] Error in onQueryByUser:", err);
        return ResMessage.onMessage_Response(0, 40400).then(resData => {
            response.status(404).json(resData);
        });
    }
};



exports.onCreate = async function (request, response) {
    try {
        const fallbackUserId = request.body && (request.body.creator || request.body.user || request.body.userId || request.body._user);
        const { userId: callerId } = resolveReadScopeUserId({ request, fallbackId: fallbackUserId });
        if (!callerId || !mongo.ObjectId.isValid(callerId)) {
            return ResMessage.sendResponse(response, 0, 40100);
        }

        const callerDoc = await User.onQuery({ _id: new mongo.ObjectId(callerId) }, [{ path: 'role' }], "_id organization role");
        if (!callerDoc) {
            return ResMessage.sendResponse(response, 0, 40400);
        }

        if (!canManageForms(callerDoc)) {
            return ResMessage.sendResponse(response, 0, 40300);
        }

        sanitizeFormSettings(request.body);
        normalizeDraftScheduleForCreate(request.body);
        await resolveCollaboratorUsers(request.body);
        const doc = await Form.onCreate(request.body);

        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {

        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        sanitizeFormSettings(request.body);
        const formId = request.body && (request.body._id || request.body.id);
        if (!formId || !mongo.ObjectId.isValid(formId)) {
            return ResMessage.sendResponse(response, 0, 40000, null, "Invalid or missing _id");
        }
        let query = { _id: new mongo.ObjectId(formId) };

        // Fetch previous document to verify write authorization and calculate "Newly Added" collaborators
        const previousDoc = await Form.onQuery(query);
        if (!previousDoc) {
            return ResMessage.sendResponse(response, 0, 40400, null, "Form not found");
        }

        const fallbackUserId = request.body && (request.body.user || request.body.userId || request.body._user);
        const { userId: callerId } = resolveReadScopeUserId({ request, fallbackId: fallbackUserId });
        if (!callerId || !mongo.ObjectId.isValid(callerId)) {
            return ResMessage.sendResponse(response, 0, 40100);
        }

        const callerDoc = await User.onQuery({ _id: new mongo.ObjectId(callerId) }, [{ path: 'role' }], "_id organization role");
        if (!callerDoc) {
            return ResMessage.sendResponse(response, 0, 40400);
        }

        if (!isAdminUser(callerDoc)) {
            const accessRole = getCollaboratorAccessRole(previousDoc, callerId);
            if (accessRole !== 'creator' && accessRole !== 'editor') {
                return ResMessage.sendResponse(response, 0, 40300);
            }
        }

        const scheduleCheck = validateAndPrepareScheduleForUpdate(request.body, previousDoc);
        if (!scheduleCheck.valid) {
            return ResMessage.sendResponse(
                response,
                0,
                40000,
                { reason: scheduleCheck.reason, field: scheduleCheck.field },
                scheduleCheck.message
            );
        }

        await resolveCollaboratorUsers(request.body);

        const doc = await Form.onUpdate(query, request.body);
        if (!doc) {
            return ResMessage.sendResponse(response, 0, 40400, null, "Form not found");
        }

        // Trigger invitation service to diff and send emails to NEW members
        if (previousDoc && doc) {
            maybeSendCollaborationInvites({ previousDoc, currentDoc: doc });
            maybeSendOrganizationInvites({ previousDoc, currentDoc: doc });
        }

        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        console.error(err);
        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onDelete = async function (request, response) {
    try {
        if (!request.body || !request.body._id || !mongo.ObjectId.isValid(request.body._id)) {
            return ResMessage.sendResponse(response, 0, 40000, null, "Invalid or missing _id");
        }
        let query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Form.onDelete(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};
