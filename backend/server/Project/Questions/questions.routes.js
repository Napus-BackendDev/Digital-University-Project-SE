const express = require('express');
const router = express.Router();

const question = require('./service/question');
const { requireAuth, requirePermission } = require('../../../middleware/auth');

router.get("/id", question.onQuery);
router.get("", question.onQuerys);
router.post("", question.onCreate);
router.put("", question.onUpdate);
router.delete("", question.onDelete);

module.exports = router;