const express = require('express');
const router = express.Router();

const response = require('./service/response');
const { upload } = require('../../../helpers/upload');
const {
    validateResponseCreate,
    validateResponseGetById,
    validateResponseUpdate,
    validateResponseDelete,
    validateResponseDeleteById
} = require('../../../middleware/validate');

// Get All
router.get("/exp", function (req, res, next) {
    req.query.apiId = 1;
    next();
}, response.onQuerys);

// Get by filter (single or list)
router.post("/get", function (req, res, next) {
    req.query.apiId = 2;
    next();
}, validateResponseGetById, response.onQuery);

// Create
router.post("", function (req, res, next) {
    req.query.apiId = 3;
    next();
}, upload.any(), validateResponseCreate, response.onCreate);

// Update
router.put("", function (req, res, next) {
    req.query.apiId = 4;
    next();
}, upload.any(), validateResponseUpdate, response.onUpdate);

// Delete (query/body version)
router.delete("", function (req, res, next) {
    req.query.apiId = 5;
    next();
}, validateResponseDelete, response.onDelete);

// Delete (path parameter version)
router.delete("/:id", function (req, res, next) {
    req.query.apiId = 5;
    next();
}, validateResponseDeleteById, response.onDelete);

module.exports = router;
