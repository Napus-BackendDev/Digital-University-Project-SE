const express = require('express');
const router = express.Router();

const role = require('./service/role');
const { requireAuth, requireRole } = require('../../../middleware/auth');

router.get("/id", role.onQuery);
router.get("", role.onQuerys);
router.post("", requireAuth, requireRole('ADMIN'), role.onCreate);
router.put("", requireAuth, requireRole('ADMIN'), role.onUpdate);
router.delete("", requireAuth, requireRole('ADMIN'), role.onDelete);
router.put('/id/permissions', requireAuth, requireRole('ADMIN'), role.setPermissions);
router.post('/id/permissions/add', requireAuth, requireRole('ADMIN'), role.addPermission);
router.post('/id/permissions/remove', requireAuth, requireRole('ADMIN'), role.removePermission);

module.exports = router;