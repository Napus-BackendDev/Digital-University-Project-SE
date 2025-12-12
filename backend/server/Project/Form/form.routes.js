const express = require('express');
const router = express.Router();

const form = require('./service/form');
const { requireAuth, requirePermission } = require('../../../middleware/auth');

router.get("/id", form.onQuery);
router.get("", form.onQuerys);
router.post("", form.onCreate);
router.post("/duplicate", form.onDuplicate)
router.put("", form.onUpdate);
router.delete("", form.onDelete);

module.exports = router;