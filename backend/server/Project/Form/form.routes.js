const express = require('express');
const router = express.Router();

const form = require('./service/form');

router.get("/exp",form.onQuerys);
router.post("/get",form.onQuery);
router.post("",form.onCreate);
router.put("",form.onUpdate);
router.delete("",form.onDelete);

module.exports = router;