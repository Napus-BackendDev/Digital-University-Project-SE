var objSchema = require("../models/user.model");
const createBaseService = require("../../../../helpers/base.service");

const defaultPopulate = [
    { path: 'roles' },
];

module.exports = createBaseService(objSchema, defaultPopulate);
