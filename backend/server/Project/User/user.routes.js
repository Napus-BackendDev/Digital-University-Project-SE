const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission, requireRole } = require('../../../middleware/auth');

const user = require('./service/user');

router.get("", requireAuth, requirePermission('VIEW_USERS'), user.onQuerys);
router.get("/profile", requireAuth, user.getProfile);
router.post("", requireAuth, requireRole('ADMIN'), user.onCreate);
router.put("/", requireAuth, requireRole('ADMIN'), user.onUpdate);
router.delete("/", requireAuth, requireRole('ADMIN'), user.onDelete);

module.exports = router;