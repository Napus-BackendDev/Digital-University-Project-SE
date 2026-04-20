const express = require('express');
const router = express.Router();
const response = require('./service/response');
const { upload } = require('../../../helpers/upload');
// Get All
router.get("/exp", function (req, res, next) {
    req.query.apiId = 1;
    next();
}, response.onQuerys);

// Get by filter (single or list)
router.post("/get", function (req, res, next) {
    req.query.apiId = 2;
    next();
}, response.onQuery);

// Create
router.post("", function (req, res, next) {
    req.query.apiId = 3;
    next();
}, upload.any(), response.onCreate);

// Update
router.put("", function (req, res, next) {
    req.query.apiId = 4;
    next();
}, upload.any(), response.onUpdate);

// Delete (query/body version)
router.delete("", function (req, res, next) {
    req.query.apiId = 5;
    next();
}, response.onDelete);

// Delete (path parameter version)
router.delete("/:id", function (req, res, next) {
    req.query.apiId = 5;
    next();
},response.onDelete);

module.exports = router;
