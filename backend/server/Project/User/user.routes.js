const express = require('express');
const router = express.Router();

const user = require('./service/user');
const roles = require('./service/roles');

// Get All
router.get("/exp", function (req, res, next) {
    req.query.apiId = 21;
    next();
}, user.onQuerys);

// Get One by ID
router.post("/get", function (req, res, next) {
    req.query.apiId = 22;
    next();
}, user.onQuery);

// Create
router.post("", function (req, res, next) {
    req.query.apiId = 23;
    next();
}, user.onCreate);

// Update
router.put("", function (req, res, next) {
    req.query.apiId = 24;
    next();
}, user.onUpdate);

// Delete
router.delete("", function (req, res, next) {
    req.query.apiId = 25;
    next();
}, user.onDelete);

// Get All
router.get("/role/exp", function (req, res, next) {
    req.query.apiId = 21;
    next();
}, roles.onQuerys);

// Get One by ID
router.post("/role/get", function (req, res, next) {
    req.query.apiId = 22;
    next();
}, roles.onQuery);

// Create
router.post("/role", function (req, res, next) {
    req.query.apiId = 23;
    next();
}, roles.onCreate);

// Update
router.put("/role", function (req, res, next) {
    req.query.apiId = 24;
    next();
}, roles.onUpdate);

// Delete
router.delete("/role", function (req, res, next) {
    req.query.apiId = 25;
    next();
}, roles.onDelete);

module.exports = router;