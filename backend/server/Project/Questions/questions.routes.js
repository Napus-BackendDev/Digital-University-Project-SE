const express = require('express');
const router = express.Router();
const { upload } = require('../../../helpers/upload');

const question = require('./service/question');
const {
    validateQuestionCreate,
    validateQuestionGetById,
    validateQuestionUpdate,
    validateQuestionDelete
} = require('../../../middleware/validate');

// Get All
router.get("/exp", function (req, res, next) {
    req.query.apiId = 12;
    next();
}, question.onQuerys);

// Get One by ID
router.post("/get", function (req, res, next) {
    req.query.apiId = 11;
    next();
}, validateQuestionGetById, question.onQuery);

// Create
router.post("", function (req, res, next) {
    req.query.apiId = 13;
    next();
}, upload.single('image'), validateQuestionCreate, question.onCreate);

// Update
router.put("", function (req, res, next) {
    req.query.apiId = 14;
    next();
}, upload.single('image'), validateQuestionUpdate, question.onUpdate);

// Delete
router.delete("", function (req, res, next) {
    req.query.apiId = 15;
    next();
}, validateQuestionDelete, question.onDelete);

module.exports = router;