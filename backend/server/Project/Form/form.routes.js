const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../../../middleware/cacheMiddleware');
const { invalidateFormCache } = require('../../../helpers/cacheInvalidator');

const form = require('./service/form');
const { authenticate, authorize } = require('../../../middleware/authorization');

router.get('/public/:id', form.onQueryPublic);

// Get All forms with response trends (Cached 5 mins)
router.get("/exp", authenticate, authorize('Forms', 'read'), cacheMiddleware(300), function (req, res, next) {
    req.query.apiId = 21;
    next();
}, form.onQuerys);

// Get Forms by User ID
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
router.post("", authenticate, authorize('Manage Forms', 'create'), async function (req, res, next) {
    req.query.apiId = 23;
    await invalidateFormCache();
    next();
}, form.onCreate);

// Update
router.put("", authenticate, authorize('Manage Forms', 'update'), async function (req, res, next) {
    req.query.apiId = 24;
    await invalidateFormCache(req.body && req.body._id);
    next();
}, form.onUpdate);

// Delete
router.delete("", authenticate, authorize('Manage Forms', 'delete'), async function (req, res, next) {
    req.query.apiId = 25;
    await invalidateFormCache(req.body && req.body._id);
    next();
}, form.onDelete);

module.exports = router;
