const express = require('express');
const router = express.Router();
const { apivalidation } = require('../../../../helpers/utils');

const question = require('./service/question');

// Get One by ID
router.get("/id", apivalidation(0), question.onQuery);

// Get All
router.get("", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, question.onQuerys);

// Create
router.post("", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, question.onCreate);

// Update
router.put("", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, question.onUpdate);

// Delete
router.delete("", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, question.onDelete);

module.exports = router;