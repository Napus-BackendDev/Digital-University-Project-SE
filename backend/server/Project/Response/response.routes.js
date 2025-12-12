const express = require("express");
const router = express.Router();

const response = require('./service/response');
const { requireAuth, requirePermission } = require('../../../middleware/auth');

router.get("/id", response.onQuery);
router.get("/user", response.onQueryByUserId);
router.get("/form", response.onQueryByFormId);
router.get("", response.onQuerys);
router.get("/export", response.onExport);
router.post("", response.onCreate);
router.patch("", response.onUpdate);
router.delete("", response.onDelete);

module.exports = router;
