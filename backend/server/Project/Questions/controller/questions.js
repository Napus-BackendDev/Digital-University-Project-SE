var mongo = require('mongodb');
var objSchema = require('../models/questions.model');
const createBaseService = require('../../../../helpers/base.service');

const defaultPopulate = [
    { path: "form", select: 'title' },
    { path: "subQuestion" }
];

module.exports = createBaseService(objSchema, defaultPopulate);