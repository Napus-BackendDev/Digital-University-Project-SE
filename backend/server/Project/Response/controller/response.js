const objSchema = require("../models/response.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    {
        path: 'responder',
        select: '-password',
        populate: [
            { path: 'organization' },
            { path: 'role', select: 'title' }
        ]
    },
    {
        path: 'form',
        populate: [
            { path: 'questions' },
            { path: 'creator', select: '-password' }
        ]
    },
]

module.exports = createBaseService(objSchema, defaultPopulate);