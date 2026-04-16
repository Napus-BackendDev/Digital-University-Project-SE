var mongo = require("mongodb");
var objSchema = require("../models/form.model");
const createBaseService = require("../../../../helpers/base.service");
const { onQuery, onQuerys, onUpdate } = require("../service/form.service");

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
const formPopulate = [
  { path: 'creator', select: '-password' },
  {
    path: 'controll',
    populate: [
      { path: 'user', select: 'name email' },
      { path: 'type', select: 'title' }
    ]
  },
  { path: 'settings.allowedUser', select: 'name email' },
  { path: 'responsesCount',select: 'responsesCount'}
];

const baseService = createBaseService(objSchema, defaultPopulate);


module.exports = {
    baseService,
    formPopulate,
    onQuerys: baseService.onQuerys,
    onQuery: baseService.onQuery,
    onCreate: baseService.onCreate,
    onUpdate:baseService.onUpdate,
    onDelete:baseService.onDelete
  };