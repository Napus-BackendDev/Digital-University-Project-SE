const mongo = require("mongodb");
const roleService = require("../controllers/role");
const ResMessage = require("../../Settings/service/message");

exports.onQuery = async function (request, response) {
    try {
        let query = {};
        query._id = new mongo.ObjectId(request.query._id);
        const doc = await roleService.onQuery(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.onQuerys = async function (request, response) {
    try {
        let query = {};
        const doc = await roleService.onQuerys(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
}

exports.onCreate = async function (request, response) {
    try {
        const doc = await roleService.onCreate(request.body);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        let query = {}
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await roleService.onUpdate(query, request.body);
        if (!doc) {
            return response.status(404).json({
                success: false,
                message: "Role not found"
            });
        }
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.onDelete = async function (request, response) {
    try {
        let query = {}
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await roleService.onDelete(query);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.setPermissions = async function (request, response) {
    try {
        const roleId = new mongo.ObjectId(request.body._id);
        const permissions = request.body.permissions;
        const doc = await roleService.setPermissions(roleId, permissions);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.addPermission = async function (request, response) {
    try {
        const roleId = new mongo.ObjectId(request.body._id);
        const permission = request.body.permission;
        const doc = await roleService.addPermission(roleId, permission);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.removePermission = async function (request, response) {
    try {
        const roleId = new mongo.ObjectId(request.body._id);
        const permission = request.body.permission;
        const doc = await roleService.removePermission(roleId, permission);
        return ResMessage.sendResponse(response, 0, 20000, doc);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};