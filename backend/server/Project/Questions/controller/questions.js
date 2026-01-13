var mongo = require('mongodb');
var objSchema = require('../models/questions.model');
const createBaseService = require('../../../../helpers/base.service');

const defaultPopulate = [
    // { path: "form", select: 'title' },
    { path: "type", select: 'title config' },
];

module.exports = createBaseService(objSchema, defaultPopulate);