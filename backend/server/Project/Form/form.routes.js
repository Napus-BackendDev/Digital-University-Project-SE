const express = require('express');
const router = express.Router();

const form = require('./service/form');
const { requireAuth, requirePermission } = require('../../../middleware/auth');

router.get("/id", requireAuth, requirePermission('VIEW_FORMS'), form.onQuery);
router.get("", requireAuth, requirePermission('VIEW_FORMS'), form.onQuerys);
router.post("", requireAuth, requirePermission('CREATE_FORM'), form.onCreate);
router.post("/duplicate", requireAuth, requirePermission('DUPLICATE_FORM'), form.onDuplicate)
router.put("", requireAuth, requirePermission('UPDATE_FORM'), form.onUpdate);
router.delete("", requireAuth, requirePermission('DELETE_FORM'), form.onDelete);

module.exports = router;