var mongo = require("mongodb");
var objSchema = require("../models/user.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    { path: 'role' },
    { path: 'organization', select: 'title' },
    { 
        path: 'response',
        select: 'form answers submit updatedAt createdAt',
        populate: {
            path: 'form',
            select: 'questions settings title',
            populate: {
                path: 'questions',
                select: 'type'
            }
        }
    }
];

module.exports = createBaseService(objSchema, defaultPopulate);