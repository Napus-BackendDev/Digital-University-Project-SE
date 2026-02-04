var mongo = require("mongodb");
var objSchema = require("../models/form.model");
const createBaseService = require("../../../../helpers/base.service")

// Load referenced models to ensure they're registered
require("../../Settings/models/respond.model");

const defaultPopulate = [
    { path: 'questions' },
    { path: 'responses' },
    { path: 'status', select: 'title', match: { _id: { $type: 'objectId' } } },
    { path: 'settings.whoCanRespond', select: 'title', match: { _id: { $type: 'objectId' } } },
]

module.exports = createBaseService(objSchema, defaultPopulate);