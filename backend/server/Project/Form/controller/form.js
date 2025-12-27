var mongo = require("mongoose");
var objSchema = require("../models/form.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
<<<<<<<<< Temporary merge branch 1
    // { path: 'users' },
    // { path: 'questions' },  // questions เป็น embedded document แล้ว
    // { path: 'permissionRole' },
=========
    { path: 'questions' },
>>>>>>>>> Temporary merge branch 2
    { path: 'responses' },
]

module.exports = createBaseService(objSchema, defaultPopulate);