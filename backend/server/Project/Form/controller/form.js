var mongo = require("mongodb");
var objSchema = require("../models/form.model");
const createBaseService = require("../../../../helpers/base.service")

const defaultPopulate = [
    { path: 'creator', select: '-password' },
    { path: 'organization', select: 'title' },
    { path: 'responses', select: 'submit createdAt' },
    { path: 'questions', select: 'type nextQuestion' },
    {
        path: 'collaborator',
        populate: [
            { path: 'user', select: 'name email' },
            { path: 'type', select: 'title' }
        ]
    },
    { path: 'settings.allowedUser', select: 'name email' }
];

module.exports = createBaseService(objSchema, defaultPopulate);