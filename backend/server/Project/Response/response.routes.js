const express = require('express');
const router = express.Router();
const response = require('./service/response');
const { upload } = require('../../../helpers/upload');
const { requireAuth } = require('../../../middleware/auth');

// Get All
router.get("/exp", requireAuth, function (req, res, next) {
    req.query.apiId = 1;
    next();
}, response.onQuerys);

// Get by filter (single or list)
router.post("/get", requireAuth, function (req, res, next) {
    req.query.apiId = 2;
    next();
}, response.onQuery);

// Create
router.post("", function (req, res, next) {
    req.query.apiId = 3;
    next();
}, upload.any(), response.onCreate);

// Update
router.put("", requireAuth, function (req, res, next) {
    req.query.apiId = 4;
    next();
}, upload.any(), response.onUpdate);

// Delete (query/body version)
router.delete("", requireAuth, function (req, res, next) {
    req.query.apiId = 5;
    next();
}, response.onDelete);

// Delete (path parameter version)
router.delete("/:id", requireAuth, function (req, res, next) {
    req.query.apiId = 5;
    next();
},response.onDelete);

module.exports = router;
