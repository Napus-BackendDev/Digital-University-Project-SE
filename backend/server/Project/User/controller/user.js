var mongo = require("mongodb");
var objSchema = require("../models/user.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    { path: 'role' },
]

module.exports = createBaseService(objSchema, defaultPopulate);