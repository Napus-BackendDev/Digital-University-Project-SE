var mongo = require("mongoose");
var objSchema = require("../model/response.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    { path: 'answers.question', select: 'title type config', populate: { path: 'type' } },
    { path: 'form'},
    { 
        path: 'responder', 
        select: 'name email organization',
        populate: { path: 'organization', select: 'title' }
    },
]

module.exports = createBaseService(objSchema, defaultPopulate);