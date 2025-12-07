const express = require("express");
const router = express.Router();

const response = require("./service/response");

router.get("/id", response.onQuery);
router.get("", response.onQuerys);
router.get("/formid", response.onQueryByFormId);
router.get("/export", response.onExport);
router.post("", response.onCreate);
router.put("", response.onUpdate);
router.delete("", response.onDelete);

module.exports = router;
