var mongo = require("mongoose");
var objSchema = require("../models/form.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    { path: 'questions' },
    { path: 'responses' },
    { path: 'originalFormId' }
]

module.exports = createBaseService(objSchema, defaultPopulate);