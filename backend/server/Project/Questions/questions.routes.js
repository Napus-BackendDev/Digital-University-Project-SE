const express = require('express');
const router = express.Router();
const { apivalidation } = require('../../../helpers/utils');

const question = require('./service/question');

// Get One by ID
router.get("/id", function (req, res, next) {
    req.body.apiId = 11;
    next();
}, question.onQuery);

// Get All
router.get("", function (req, res, next) {
    req.body.apiId = 12;
    next();
}, question.onQuerys);

// Create
router.post("", function (req, res, next) {
    req.body.apiId = 13;
    next();
}, question.onCreate);

// Update
router.put("", function (req, res, next) {
    req.body.apiId = 14;
    next();
}, question.onUpdate);

// Delete
router.delete("", function (req, res, next) {
    req.body.apiId = 15;
    next();
}, question.onDelete);

module.exports = router;