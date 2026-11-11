const mongo = require('mongodb');
const Form = require('../controller/form');
const User = require('../../User/controller/user');
const ResMessage = require("../../Settings/service/message");
const { maybeSendCollaborationInvites } = require('../../Email/service/collaboration');
const { maybeSendOrganizationInvites } = require('../../Email/service/inviteOrganization');

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

        // 3. Check Allowed Users
        const isAllowed = (doc.settings?.allowedUser || []).some(u => String(u._id || u) === String(user_id));
        if (isAllowed) {
            return ResMessage.sendResponse(response, 0, 20000, { role: 'viewer' });
        }

        // 4. Check Allowed Roles
        if (doc.settings?.allowedRoles && doc.settings.allowedRoles.length > 0) {
            const userObj = await User.onQuery({ _id: new mongo.ObjectId(user_id) });
            const userRoleId = String(userObj?.role?._id || userObj?.role);
            const isRoleAllowed = doc.settings.allowedRoles.some(r => String(r._id || r) === userRoleId);
            if (isRoleAllowed) {
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
        const query = {};
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
        const _id = new mongo.ObjectId(request.body._id);


        // Fetch user with role details to check for Admin privilege
        const user = await User.onQuery({ _id: _id }, [{ path: 'role' }], "_id organization role");
        if (!user) {
            console.warn("[form.service.js] User not found in DB:", _id);
            return ResMessage.onMessage_Response(0, 40400).then(resData => {
                response.status(404).json(resData);
            });
        }

        // Check if user is Admin (looking at role title)
        let isAdmin = false;
        if (user.role && user.role.title) {
            const roleTitle = user.role.title;
            if (Array.isArray(roleTitle)) {
                isAdmin = roleTitle.some(t => t && t.value && t.value.toLowerCase().includes('admin'));
            } else if (typeof roleTitle === 'string') {
                isAdmin = roleTitle.toLowerCase().includes('admin');
            }
        }



        const mode = request.body.mode;
        let query = {};
        if (mode === 'manage') {
            if (isAdmin) {
                query = {};
            } else {
                // In manage mode, non-admins only see forms they created or collaborate on
                query = {
                    $or: [
                        { creator: _id },
                        { collaborator: { $elemMatch: { user: _id } } }
                    ]
                };
            }
        } else {
            // mode !== 'manage' (Respondent view: /forms)
            // Even if user is Admin or Creator, /forms is ONLY for surveys where the user is a TARGET respondent!
            const userRoleId = user.role?._id || user.role;
            const generalOrgId = '6a0b51af2dbf6e77c4df73fe';
            const userOrgId = user.organization ? (user.organization._id || user.organization).toString() : null;

            const targetOrgs = [generalOrgId, new mongo.ObjectId(generalOrgId)];
            if (userOrgId) {
                targetOrgs.push(userOrgId);
                try {
                    targetOrgs.push(new mongo.ObjectId(userOrgId));
                } catch (e) {}
            }

            const orConditions = [
                { organization: { $in: targetOrgs } },
                { "settings.allowedUser": _id },
                { "settings.allowedUser": _id.toString() }
            ];

            if (userRoleId) {
                const roleIdStr = (userRoleId._id || userRoleId).toString();
                orConditions.push({ "settings.allowedRoles": roleIdStr });
                try {
                    orConditions.push({ "settings.allowedRoles": new mongo.ObjectId(roleIdStr) });
                } catch (e) {}
            }

            query = { $or: orConditions };
        }



        const doc = await Form.onQuerys(query, Form.formPopulate);

        
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

        const doc = await Form.onCreate(request.body);

        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {

        return ResMessage.sendResponse(response, 0, 40400);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        const formId = request.body && (request.body._id || request.body.id);
        if (!formId) {
            return ResMessage.sendResponse(response, 0, 40000, null, "Missing _id");
        }
        let query = { _id: new mongo.ObjectId(formId) };

        // Fetch previous document to calculate "Newly Added" collaborators
        const previousDoc = await Form.onQuery(query);

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
        let query = {};
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Form.onDelete(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400);
    }
};
