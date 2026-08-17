const express = require('express');
const router = express.Router();
const { upload } = require('../../../helpers/upload');
const question = require('./service/question');
const { authenticate, authorize } = require('../../../middleware/authorization');
// Get All Question might not need.
router.get("/exp", authenticate, authorize('Manage Forms', 'read'), function (req, res, next) {
    req.query.apiId = 12;
    next();
}, question.onQuerys);

// Get One by ID
router.post("/get", authenticate, authorize('Manage Forms', 'read'), function (req, res, next) {
    req.query.apiId = 11;
    next();
}, question.onQuery);

// Create
router.post("", authenticate, authorize('Manage Forms', 'create'), function (req, res, next) {
    req.query.apiId = 13;
    next();
}, upload.single('image'), question.onCreate);

// Update
router.put("", authenticate, authorize('Manage Forms', 'update'), function (req, res, next) {
    req.query.apiId = 14;
    next();
}, upload.single('image'), question.onUpdate);

// Delete
router.delete("", authenticate, authorize('Manage Forms', 'delete'), function (req, res, next) {
    req.query.apiId = 15;
    next();
}, question.onDelete);

module.exports = router;
