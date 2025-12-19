var mongo = require("mongoose");
var objSchema = require("../models/form.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    // { path: 'users' },
    // { path: 'questions' },  // questions เป็น embedded document แล้ว
    // { path: 'permissionRole' },
    { path: 'responses' },
    { path: 'originalFormId' }
]

module.exports = createBaseService(objSchema, defaultPopulate);