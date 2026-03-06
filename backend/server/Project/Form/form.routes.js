const express = require('express');
const router = express.Router();

const form = require('./service/form');

// Get All
router.get("/exp", function (req, res, next) {
    req.query.apiId = 21;
    next();
}, form.onQuerys);

// Get One by ID
router.post("/id", function (req, res, next) {
    req.query.apiId = 22;
    next();
}, form.onQuery);

// Create
router.post("", function (req, res, next) {
    req.query.apiId = 23;
    next();
}, form.onCreate);

// Update
router.put("", function (req, res, next) {
    req.query.apiId = 24;
    next();
}, form.onUpdate);

// Delete
router.delete("", function (req, res, next) {
    req.query.apiId = 25;
    next();
}, form.onDelete);

module.exports = router;