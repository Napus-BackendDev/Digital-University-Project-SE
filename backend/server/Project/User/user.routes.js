const express = require('express');
const router = express.Router();

const user = require('./service/user');

// Get All
router.get("/exp", function (req, res, next) {
    req.body.apiId = 41;
    next();
}, user.onQuerys);

// Get One by ID
router.post("/get", function (req, res, next) {
    req.body.apiId = 42;
    next();
}, user.onQuery);

// Update
router.put("", function (req, res, next) {
    req.body.apiId = 44;
    next();
}, user.onUpdate);

// Delete
router.delete("", function (req, res, next) {
    req.body.apiId = 45;
    next();
}, user.onDelete);

// Assign roles to a user
router.put("/assign-roles", function (req, res, next) {
    req.body.apiId = 46;
    next();
}, user.onAssignRoles);

module.exports = router;
