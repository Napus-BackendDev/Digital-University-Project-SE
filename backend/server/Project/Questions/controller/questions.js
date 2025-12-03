var mongo = require('mongodb');
var objSchema = require('../models/questions.model');
const createBaseService = require('../../../../helpers/base.service');

const defaultPopulate = [
    { path: "subQuestion", select: 'questionText type required order' }
];

module.exports = createBaseService(objSchema.Questions, defaultPopulate);