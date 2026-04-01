const objSchema = require('../models/questions.model');
const createBaseService = require('../../../../helpers/base.service');

const defaultPopulate = [
    { path: "form", select: '_id title' },
    { path: "type" },
    { path: "nextQuestion" },
];

module.exports = createBaseService(objSchema, defaultPopulate);