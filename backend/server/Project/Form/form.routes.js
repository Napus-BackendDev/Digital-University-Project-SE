const express = require('express');
const router = express.Router();

const form = require('./service/form');

router.get("", form.onQuerys);
router.post("", form.onCreate);
router.put("", form.onUpdate);
router.delete("", form.onDelete);

module.exports = router;