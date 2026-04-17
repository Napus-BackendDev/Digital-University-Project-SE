var mongo = require("mongodb");
var objSchema = require("../models/form.model");
const createBaseService = require("../../../../helpers/base.service");


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

//Querys all form
const formsPopulate = [
  { path: 'creator', select: '-password' },
  {
    path: 'collaborator',
    populate: [
      { path: 'user', select: 'name email' },
      { path: 'type', select: 'title' }
    ]
  },
  { path: 'settings.allowedUser', select: 'name email' },
  { path: 'responsesCount' }
];

//Query a form
const formPopulate = [
  { 
    path: "questions",
    populate: { path: "type", select: "type" }
  },
  { path: "status" },
  { path: "creator", select: "-password" },
  { path: "settings.allowedUser", select: "-password" },
  {
    path: "collaborator",
    populate: [
      { path: "user" },
      { path: "type" }
    ]
  },
  {
    path: "responses",
    match: { submit: true },
    options: { sort: { createdAt: -1 } },
    populate: {
      path: "responder",
      select: "-password",
    },
  },
];




const baseService = createBaseService(objSchema, defaultPopulate);


module.exports = {
    baseService,
    formsPopulate,
    formPopulate,
    onQuerys: baseService.onQuerys,
    onQuery: baseService.onQuery,
    onCreate: baseService.onCreate,
    onUpdate:baseService.onUpdate,
    onDelete:baseService.onDelete
  };