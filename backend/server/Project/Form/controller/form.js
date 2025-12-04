var mongo = require("mongoose");
var objSchema = require("../models/form.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    // { path: 'users' , select: '' },
    { path: 'questions' , select: '' },
    // { path: 'permissionRole' , select: '' },
    { path: 'responses' , select: '' },
    { path: 'originalFormId' , select: '' }
]

module.exports = createBaseService(objSchema, defaultPopulate);