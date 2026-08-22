const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../../../middleware/cacheMiddleware');
const { invalidateOrgCache } = require('../../../helpers/cacheInvalidator');
const org = require('./service/organization');

// Get All Organizations (Cached 10 mins)
router.get("/exp", cacheMiddleware(600), function (req, res, next) {
    req.query.apiId = 31;
    next();
}, org.onQuerys);

router.post("/get", function (req, res, next) {
    req.body.apiId = 32;
    next();
}, org.onQuery);

router.post("", async function (req, res, next) {
    req.body.apiId = 33;
    await invalidateOrgCache();
    next();
}, org.onCreate);

router.put("", async function (req, res, next) {
    req.body.apiId = 34;
    await invalidateOrgCache(req.body && req.body._id);
    next();
}, org.onUpdate);

router.delete("", async function (req, res, next) {
    req.body.apiId = 35;
    await invalidateOrgCache(req.body && req.body._id);
    next();
}, org.onDelete);

module.exports = router;
