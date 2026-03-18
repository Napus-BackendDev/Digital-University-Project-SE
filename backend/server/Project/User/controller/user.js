var mongo = require("mongodb");
var objSchema = require("../models/user.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    { path: 'role' },
    { 
        path: 'response',
        populate: { path: 'form' }
    },
]

module.exports = createBaseService(objSchema, defaultPopulate);