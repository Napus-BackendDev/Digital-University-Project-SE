var mongo = require("mongodb");
var objSchema = require("../models/form.model");
const createBaseService = require("../../../../helpers/base.service");

const defaultPopulate = [
  {
    path: 'creator',
    select: '-password',
    populate: [
      { path: 'role', select: 'title' },
      { path: 'organization', select: 'title' }
    ]
  },
  {
    path: 'collaborator',
    populate: [
      { path: 'user', select: 'name email' },
      { path: 'type', select: 'title' }
    ]
  },
  { path: 'settings.allowedUser', select: 'name email' },
  { path: 'settings.allowedRoles', select: 'title' },
  { path: 'responsesCount' }
];

//Query a form
const formPopulate = [
  {
    path: "questions",
    populate: { path: "type", select: "type" }
  },
  { path: "status" },
  {
    path: "creator",
    select: "-password",
    populate: [
      { path: "role", select: "title" },
      { path: "organization", select: "title" }
    ]
  },
  { path: "settings.allowedUser", select: "-password" },
  { path: "settings.allowedRoles", select: "title" },
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
      populate: [
        { path: "organization", select: "title" },
        { path: "role", select: "title" }
      ]
    },
  },
];




const baseService = createBaseService(objSchema, defaultPopulate);


module.exports = {
  baseService,
  formPopulate,
  onQuerys: baseService.onQuerys,
  onQuery: baseService.onQuery,
  onCreate: baseService.onCreate,
  onUpdate: baseService.onUpdate,
  onDelete: baseService.onDelete
};