const express = require('express');
const router = express.Router();
const { apivalidation } = require('../../../helpers/utils');

const question = require('./service/question');

// Get All
router.get("/exp", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, question.onQuerys);

// Get One by ID
router.post("/get", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, question.onQuery);

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