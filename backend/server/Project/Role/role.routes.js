const express = require('express');
const router = express.Router();

const role = require('./service/role');

// Get All
router.get("/exp", function (req, res, next) {
    req.body.apiId = 31;
    next();
}, role.onQuerys);

// Get One by ID
router.post("/get", function (req, res, next) {
    req.body.apiId = 32;
    next();
}, role.onQuery);

// Create
router.post("", function (req, res, next) {
    req.body.apiId = 33;
    next();
}, role.onCreate);

// Update
router.put("", function (req, res, next) {
    req.body.apiId = 34;
    next();
}, role.onUpdate);

// Delete
router.delete("", function (req, res, next) {
    req.body.apiId = 35;
    next();
}, role.onDelete);

module.exports = router;
