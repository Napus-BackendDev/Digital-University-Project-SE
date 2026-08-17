const express = require('express');
const router = express.Router();

const message = require("./service/message");
const group = require("./service/group");
const status = require("./service/status");
const verification = require("./service/verification");
const question = require("./service/question_type");
const collaborator = require("./service/controll");
const emailTemplate = require("./service/emailTemplate");
const { authenticate, authorize } = require('../../../middleware/authorization');

router.use(authenticate);
// const auth_message = require("./service/auth_message");
// const Role = require("../Accounts/service/role");
// const Authen_Type = require("../Accounts/service/authen_type");

router.get("/group", authorize('Manage Forms', 'read'), group.onQuerys);
router.post("/group", authorize('Manage Forms', 'create'), group.onCreate);
router.put("/group", authorize('Manage Forms', 'update'), group.onUpdate);
router.delete("/group", authorize('Manage Forms', 'delete'), group.onDelete);

router.get("/message", authorize('Manage Forms', 'read'), message.onQuerys);
router.post("/message", authorize('Manage Forms', 'create'), message.onCreate);
router.put("/message", authorize('Manage Forms', 'update'), message.onUpdate);
router.delete("/message", authorize('Manage Forms', 'delete'), message.onDelete);

router.get("/status", authorize('Manage Forms', 'read'), status.onQuerys);
router.post("/status", authorize('Manage Forms', 'create'), status.onCreate);
router.put("/status", authorize('Manage Forms', 'update'), status.onUpdate);
router.delete("/status", authorize('Manage Forms', 'delete'), status.onDelete);

// router.get("/levels", level.onQuerys);
// router.post("/levels/explorers", level.onCreate);
// router.post("/levels", level.onCreate);
// router.put("/levels", level.onUpdate);
// router.delete("/levels", level.onDelete);

router.get("/verification", authorize('Manage Forms', 'read'), verification.onQuerys);
router.post("/verification/explorers", authorize('Manage Forms', 'create'), verification.onCreate);
router.post("/verification", authorize('Manage Forms', 'create'), verification.onCreate);
router.put("/verification", authorize('Manage Forms', 'update'), verification.onUpdate);
router.delete("/verification", authorize('Manage Forms', 'delete'), verification.onDelete);

// authen service

// router.get("/auth/message", auth_message.onQuerys);
// router.post("/auth/message/explorers", auth_message.onCreate);
// router.post("/auth/message", auth_message.onCreate);
// router.put("/auth/message", auth_message.onUpdate);
// router.delete("/auth/message", auth_message.onDelete);

// router.get("/role", Role.onQuerys);
// router.post("/role", Role.onCreate);
// router.put("/role", Role.onUpdate);
// router.delete("/role", Role.onDelete);

// router.get("/authen/type", Authen_Type.onQuerys);
// router.post("/authen/type", Authen_Type.onCreate);
// router.put("/authen/type", Authen_Type.onUpdate);
// router.delete("/authen/type", Authen_Type.onDelete);

router.get("/question_type", authorize('Manage Forms', 'read'), question.onQuerys);
router.post("/question_type", authorize('Manage Forms', 'create'), question.onCreate);
router.put("/question_type", authorize('Manage Forms', 'update'), question.onUpdate);
router.delete("/question_type", authorize('Manage Forms', 'delete'), question.onDelete);

router.get("/collaborator", authorize('Manage Forms', 'read'), collaborator.onQuerys);
router.post("/collaborator", authorize('Manage Forms', 'create'), collaborator.onCreate);
router.put("/collaborator", authorize('Manage Forms', 'update'), collaborator.onUpdate);
router.delete("/collaborator", authorize('Manage Forms', 'delete'), collaborator.onDelete);

router.get("/emailTemplate", authorize('Email', 'read'), emailTemplate.onQuerys);
router.get("/emailTemplate/:id", authorize('Email', 'read'), emailTemplate.onQuery);
router.post("/emailTemplate", authorize('Email', 'create'), emailTemplate.onCreate);
router.put("/emailTemplate", authorize('Email', 'update'), emailTemplate.onUpdate);
router.delete("/emailTemplate", authorize('Email', 'delete'), emailTemplate.onDelete);

module.exports = router;
