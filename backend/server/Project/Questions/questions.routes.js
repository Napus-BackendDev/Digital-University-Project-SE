const express = require('express');
const router = express.Router();

const question = require('./service/question');

// Get All
router.post("/exp", function (req, res, next) {
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