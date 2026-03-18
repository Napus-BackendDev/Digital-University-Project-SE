var mongo = require("mongodb");
var objSchema = require("../models/form.model");
const createBaseService = require("../../../../helpers/base.service")

// Load referenced models to ensure they're registered
// require("../../Settings/models/respond.model");

const defaultPopulate = [
    { path: 'creator' }
];

module.exports = createBaseService(objSchema, defaultPopulate);