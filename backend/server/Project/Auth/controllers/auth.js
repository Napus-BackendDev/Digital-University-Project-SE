var mongo=require("mongoose");
var objSchema=require("../../User/models/user.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = []
module.exports = createBaseService(objSchema, defaultPopulate);