const express = require('express');
const router = express.Router();

const role = require('./service/role');

router.get("", role.onQuerys);
router.get("/getById", role.onGetById);
router.post("", role.onCreate);
router.put("", role.onUpdate);
router.delete("", role.onDelete);

module.exports = router;