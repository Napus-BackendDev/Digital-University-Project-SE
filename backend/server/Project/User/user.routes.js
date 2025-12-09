const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission, requireRole } = require('../../../middleware/auth');

const user = require('./service/user');

router.get("", user.onQuerys);
router.get("/profile", user.getProfile);
router.post("", user.onCreate);
router.put("/", user.onUpdate);
router.delete("/", user.onDelete);

module.exports = router;