const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../../../middleware/auth');

const user=require('./service/user');

router.get("", requireAuth, requirePermission('VIEW_USERS'), user.onQuerys);
router.get("/:id", requireAuth, requirePermission('VIEW_USER'), user.onGetById);
router.post("", requireAuth, requirePermission('CREATE_USER'), user.onCreate);
router.put("/:id", requireAuth, requirePermission('UPDATE_USER'), user.onUpdate);
router.delete("/:id", requireAuth, requirePermission('DELETE_USER'), user.onDelete);

module.exports = router;