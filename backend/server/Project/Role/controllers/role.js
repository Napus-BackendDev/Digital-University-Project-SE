var mongo=require("mongoose");
var objSchema=require("../models/role.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = []
const baseService = createBaseService(objSchema, defaultPopulate);

// Permission management methods
baseService.setPermissions = async (roleId, permissions) => {
    return objSchema.findByIdAndUpdate(
        roleId,
        { permissions: permissions },
        { new: true }
    ).lean();
};

baseService.addPermission = async (roleId, permission) => {
    return objSchema.findByIdAndUpdate(
        roleId,
        { $addToSet: { permissions: permission } },
        { new: true }
    ).lean();
};

baseService.removePermission = async (roleId, permission) => {
    return objSchema.findByIdAndUpdate(
        roleId,
        { $pull: { permissions: permission } },
        { new: true }
    ).lean();
};

module.exports = baseService;