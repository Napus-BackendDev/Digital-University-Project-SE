const mongo = require('mongodb');
const Form = require('../controller/form');
const User = require('../../User/controller/user');
const ResMessage = require("../../Settings/service/message");

exports.onQuerys = async function (request, response) {
    try {
        const query = {};
        const doc = await Form.onQuerys(query);
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



        const doc = await Form.onQuerys(query);

        
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

        const doc = await Form.onUpdate(query, request.body);
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
