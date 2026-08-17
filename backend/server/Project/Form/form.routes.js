const express = require('express');
const router = express.Router();

const form = require('./service/form');
const { authenticate, authorize } = require('../../../middleware/authorization');

router.get('/public/:id', form.onQueryPublic);


// Get All form might don't need.
// Get All forms with response trends
router.get("/exp", authenticate, authorize('Forms', 'read'), function (req, res, next) {
    req.query.apiId = 21;
    next();
}, form.onQuerys);

// // Get Forms by User ID
router.post("/user", authenticate, authorize('Forms', 'read'), function (req, res, next) {
    req.query.apiId = 26;
    next();
}, form.onQueryByUser);

// Get One by ID
router.post("/get", authenticate, authorize('Forms', 'read'), function (req, res, next) {
    req.query.apiId = 22;
    next();
}, form.onQuery);

// Create
router.post("", authenticate, authorize('Manage Forms', 'create'), function (req, res, next) {
    req.query.apiId = 23;
    next();
}, form.onCreate);

// Update
router.put("", authenticate, authorize('Manage Forms', 'update'), function (req, res, next) {
    req.query.apiId = 24;
    next();
}, form.onUpdate);

// Delete
router.delete("", authenticate, authorize('Manage Forms', 'delete'), function (req, res, next) {
    req.query.apiId = 25;
    next();
}, form.onDelete);

module.exports = router;
