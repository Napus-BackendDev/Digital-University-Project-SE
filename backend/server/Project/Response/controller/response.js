var mongo = require("mongoose");
var objSchema = require("../models/response.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    { path: 'answers.question' , select: 'questionText type' }
]
module.exports = createBaseService(objSchema, defaultPopulate);