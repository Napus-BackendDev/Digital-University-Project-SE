var mongo = require('mongodb');
var objSchema = require('../models/questions.model');
const createBaseService = require('../../../../helpers/base.service');

const defaultPopulate = [
    { path: "form", select: '_id title' },
    { path: "type"},
    { path: "followUp"},
];

module.exports = createBaseService(objSchema, defaultPopulate);