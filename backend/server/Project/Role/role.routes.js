const express = require('express');
const router = express.Router();

const role = require('./service/role');
const { requireAuth, requireRole } = require('../../../middleware/auth');

router.get("/id", role.onQuery);
router.get("", role.onQuerys);
router.post("", role.onCreate);
router.put("", role.onUpdate);
router.delete("", role.onDelete);
router.put('/id/permissions', role.setPermissions);
router.post('/id/permissions/add', role.addPermission);
router.post('/id/permissions/remove', role.removePermission);

module.exports = router;