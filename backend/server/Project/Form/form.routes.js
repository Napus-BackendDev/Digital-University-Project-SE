const express = require('express');
const router = express.Router();

const form = require('./service/form');

// Get All
router.get("/exp", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, form.onQuerys);

// Get One by ID
router.post("/get", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, form.onQuery);

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