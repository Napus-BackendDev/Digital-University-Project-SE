const express = require('express');
const router = express.Router();
const { upload } = require('../../../helpers/upload');
const question = require('./service/question.service');
// Get All Question might not need.
router.get("/exp", function (req, res, next) {
    req.query.apiId = 12;
    next();
}, question.onQuerys);

// Get One by ID
router.post("/get", function (req, res, next) {
    req.query.apiId = 11;
    next();
}, question.onQuery);

// Create
router.post("", function (req, res, next) {
    req.query.apiId = 13;
    next();
}, upload.single('image'), question.onCreate);

// Update
router.put("", function (req, res, next) {
    req.query.apiId = 14;
    next();
}, upload.single('image'), question.onUpdate);

// Delete
router.delete("", function (req, res, next) {
    req.query.apiId = 15;
    next();
}, question.onDelete);

module.exports = router;