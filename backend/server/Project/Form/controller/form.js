var mongo = require("mongodb");
var objSchema = require("../models/form.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    { path: 'questions' },
    { path: 'responses' },
    { path: 'status' , select: 'title' },
]

module.exports = createBaseService(objSchema, defaultPopulate);