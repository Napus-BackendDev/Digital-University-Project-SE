var mongo = require("mongodb");
var objSchema = require("../models/user.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    { path: 'role' },
    {
        path: 'response',
        populate: {
            path: 'form',
            populate: {
                path: 'questions',
                populate: {
                    path: 'type'
                }
            }
        }
    },
    { path: 'organization', select: 'title' }
];

module.exports = createBaseService(objSchema, defaultPopulate);