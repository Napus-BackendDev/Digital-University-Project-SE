const express = require('express');
const router = express.Router();

const form = require('./service/form');

// Get One by ID
router.get("/id", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, form.onQuery);

// Get All
router.get("", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, form.onQuerys);

// Create
router.post("", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, form.onCreate);

// Update
router.put("", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, form.onUpdate);

// Delete
router.delete("", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, form.onDelete);

module.exports = router;