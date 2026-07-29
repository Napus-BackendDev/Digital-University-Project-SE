const express = require('express');
const router = express.Router();
const { upload } = require('../../../helpers/upload');
const question = require('./service/question');
const { requireAuth } = require('../../../middleware/auth');

// Get All Question might not need.
router.get("/exp", requireAuth, function (req, res, next) {
    req.query.apiId = 12;
    next();
}, question.onQuerys);

// Get One by ID
router.post("/get", function (req, res, next) {
    req.query.apiId = 11;
    next();
}, question.onQuery);

// Create
router.post("", requireAuth, function (req, res, next) {
    req.query.apiId = 13;
    next();
}, upload.single('image'), question.onCreate);

// Update
router.put("", requireAuth, function (req, res, next) {
    req.query.apiId = 14;
    next();
}, upload.single('image'), question.onUpdate);

// Delete
router.delete("", requireAuth, function (req, res, next) {
    req.query.apiId = 15;
    next();
}, question.onDelete);

module.exports = router;