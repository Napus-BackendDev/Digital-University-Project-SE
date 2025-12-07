const express = require('express');
const router = express.Router();

const question = require('./service/question');
const { requireAuth,requirePermission } = require('../../../middleware/auth');

router.get("/id",requireAuth,requirePermission('VIEW_QUESTIONS'), question.onQuery);
router.get("",requireAuth,requirePermission('VIEW_QUESTIONS'), question.onQuerys);
router.post("", requireAuth,requirePermission('CREATE_QUESTION'), question.onCreate);
router.put("", requireAuth,requirePermission('UPDATE_QUESTION'), question.onUpdate);
router.delete("", requireAuth,requirePermission('DELETE_QUESTION'), question.onDelete);

module.exports = router;