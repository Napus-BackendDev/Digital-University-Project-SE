var mongo = require("mongoose");
var objSchema = require("../model/response.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    { path: 'responder' },
    { path: 'form', populate: { path: 'questions' } },
]

module.exports = createBaseService(objSchema, defaultPopulate);