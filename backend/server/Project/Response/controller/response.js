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
            { path: 'questions' },
            { path: 'creator', select: '-password' },
            {
                path: 'responses',
                select: 'submit createdAt answers',
                populate: { path: 'responder', select: '-password' }
            }
        ]
    },
]

module.exports = createBaseService(objSchema, defaultPopulate);