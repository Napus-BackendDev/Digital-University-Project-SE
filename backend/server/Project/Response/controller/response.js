const objSchema = require("../models/response.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    {
        path: 'responder',
        select: '-password',
        populate: [
            { path: 'organization' }
        ]
    },
    {
        path: 'form',
        populate: [
            { path: 'questions' }
        ]
    },
]

module.exports = createBaseService(objSchema, defaultPopulate);