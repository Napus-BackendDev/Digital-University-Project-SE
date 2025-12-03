const express = require('express');
const router = express.Router();

const form = require('./service/form');

router.get("", form.onQuery);
router.post("", form.onCreate);
router.post("/duplicate", form.onDuplicate)
router.put("", form.onUpdate);
router.delete("", form.onDelete);

module.exports = router;