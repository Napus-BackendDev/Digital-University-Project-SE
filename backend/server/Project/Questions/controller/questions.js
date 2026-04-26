const objSchema = require('../models/questions.model');
const createBaseService = require('../../../../helpers/base.service');

const defaultPopulate = [
    { path: "form", select: '_id title' },
    { path: "type" },
    { path: "nextQuestion" },
];

const baseService = createBaseService(objSchema, defaultPopulate);

module.exports = {
    baseService,
    onQuerys: baseService.onQuerys,
    onQuery: baseService.onQuery,
    onCreate: baseService.onCreate,
    onUpdate: baseService.onUpdate,
    onDelete: baseService.onDelete
};