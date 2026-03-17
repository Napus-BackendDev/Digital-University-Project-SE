var mongo = require("mongoose");
var objSchema = require("../model/response.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    { path: 'answers.question', select: 'title type', populate: { path: 'type' } },
    { path: 'form'},
    { path: 'responder'},
]

module.exports = createBaseService(objSchema, defaultPopulate);