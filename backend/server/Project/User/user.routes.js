const express = require('express');
const router = express.Router();

const user=require('./service/user');

router.get("", user.onQuerys);
router.get("/getById", user.onGetById);
router.post("", user.onCreate);
router.put("", user.onUpdate);
router.delete("", user.onDelete);

module.exports = router;