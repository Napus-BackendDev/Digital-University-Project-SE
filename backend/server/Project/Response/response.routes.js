const express = require("express");
const router = express.Router();

const response = require('./service/response');
const { requireAuth, requirePermission } = require('../../../middleware/auth');

router.get("/id", requireAuth, requirePermission('VIEW_RESPONSES'), response.onQuery);
router.get("/user", requireAuth, requirePermission('VIEW_RESPONSES'), response.onQueryByUserId);
router.get("/form", requireAuth, requirePermission('VIEW_OWN_RESPONSES'), response.onQueryByFormId);
router.get("", requireAuth, requirePermission('VIEW_RESPONSES'), response.onQuerys);
router.get("/export", requireAuth, requirePermission('EXPORT_RESPONSES'), response.onExport);
router.post("", requireAuth, requirePermission('SUBMIT_RESPONSES'), response.onCreate);
router.patch("", requireAuth, requirePermission('EDIT_RESPONSES'), response.onUpdate);
router.delete("", requireAuth, requirePermission('DELETE_RESPONSES'), response.onDelete);

module.exports = router;
