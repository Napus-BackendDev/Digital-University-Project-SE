const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../../middleware/auth');
const { cacheMiddleware } = require('../../../middleware/cacheMiddleware');
const { invalidateFormCache } = require('../../../helpers/cacheInvalidator');

const form = require('./service/form');

// Get All forms with response trends (Cached 5 mins)
router.get("/exp", requireAuth, cacheMiddleware(300), function (req, res, next) {
    req.query.apiId = 21;
    next();
}, form.onQuerys);

// Get Forms by User ID
router.post("/user", requireAuth, function (req, res, next) {
    req.query.apiId = 26;
    next();
}, form.onQueryByUser);

// Get One by ID
router.post("/get", function (req, res, next) {
    req.query.apiId = 22;
    next();
}, form.onQuery);

// Create
router.post("", requireAuth, async function (req, res, next) {
    req.query.apiId = 23;
    await invalidateFormCache();
    next();
}, form.onCreate);

// Update
router.put("", requireAuth, async function (req, res, next) {
    req.query.apiId = 24;
    await invalidateFormCache(req.body && req.body._id);
    next();
}, form.onUpdate);

// Delete
router.delete("", requireAuth, async function (req, res, next) {
    req.query.apiId = 25;
    await invalidateFormCache(req.body && req.body._id);
    next();
}, form.onDelete);

module.exports = router;
