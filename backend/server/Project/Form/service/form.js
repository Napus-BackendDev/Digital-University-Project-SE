const mongo = require('mongodb');
const Form = require('../controller/form');
const User = require('../../User/controller/user');
const ResMessage = require("../../Settings/service/message");
const { maybeSendCollaborationInvites } = require('../../Email/service/collaboration');
const { maybeSendOrganizationInvites } = require('../../Email/service/inviteOrganization');
const FormModel = require('../models/form.model');
const { isAdminUser } = require('../../../../middleware/auth');

exports.onQueryPublic = async function (request, response) {
    try {
        const id = String(request.params.id || '');
        if (!/^[a-f\d]{24}$/i.test(id)) return response.status(404).json({ success: false, message: 'Public form not found' });
        const doc = await FormModel.findOne({ _id: id, 'settings.allowPublicResponses': true })
            .select('title description questions schedule settings organization')
            .populate({ path: 'questions', populate: { path: 'type', select: 'type' } })
            .lean();
        if (!doc) return response.status(404).json({ success: false, message: 'This form is not open to the public' });
        response.set('Cache-Control', 'no-store');
        return response.status(200).json({ success: true, data: doc });
    } catch (err) {
        return response.status(500).json({ success: false, message: 'Could not load public form' });
    }
};

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
        const reqUserId = request.authUser && request.authUser._id;
        if (!reqUserId) {
            return ResMessage.sendResponse(response, 0, 40100, "Unauthorized: No user session found");
        }

        const requesterIsAdmin = isAdminUser(request.authUser);

        if (String(reqUserId) !== String(request.body._id) && !requesterIsAdmin) {
            return ResMessage.sendResponse(response, 0, 40300, "Forbidden: You can only query your own forms unless you are an admin.");
        }

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



        let query = {};
        if (isAdmin) {
            // Admins can see ALL forms globally in this system
            query = {}; 

        } else {
            // Regular user: Limited to what they own, collab on, or their organization
            query = {
                $or: [
                    { creator: _id },
                    { collaborator: { $elemMatch: { user: _id } } },
                    { "settings.allowedUser": _id },
                    { organization: user.organization }
                ]
            };
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
        let query = {}
        query._id = new mongo.ObjectId(request.body._id);

        // Fetch previous document to calculate "Newly Added" collaborators
        const previousDoc = await Form.onQuery(query);

        const doc = await Form.onUpdate(query, request.body);

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
