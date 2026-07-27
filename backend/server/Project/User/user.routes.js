const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../../middleware/auth');
const { cacheMiddleware } = require('../../../middleware/cacheMiddleware');
const { invalidateUserCache } = require('../../../helpers/cacheInvalidator');

const user = require('./service/user');
const roles = require('./service/roles');

// Get All Users (Cached 5 mins)
router.get("/exp", requireAuth, cacheMiddleware(300), function (req, res, next) {
    req.query.apiId = 21;
    next();
}, user.onQuerys);

// Get One by ID
router.post("/get", requireAuth, function (req, res, next) {
    req.query.apiId = 22;
    next();
}, user.onQuery);

// Create
router.post("", requireAuth, async function (req, res, next) {
    req.query.apiId = 23;
    await invalidateUserCache();
    next();
}, user.onCreate);

// Update
router.put("", requireAuth, async function (req, res, next) {
    req.query.apiId = 24;
    await invalidateUserCache(req.body && req.body._id);
    next();
}, user.onUpdate);

// Delete
router.delete("", requireAuth, async function (req, res, next) {
    req.query.apiId = 25;
    await invalidateUserCache(req.body && req.body._id);
    next();
}, user.onDelete);

// Get All Roles (Cached 5 mins)
router.get("/role/exp", requireAuth, cacheMiddleware(300), function (req, res, next) {
    req.query.apiId = 21;
    next();
}, roles.onQuerys);

// Get One Role by ID
router.post("/role/get", requireAuth, function (req, res, next) {
    req.query.apiId = 22;
    next();
}, roles.onQuery);

// Create Role
router.post("/role", requireAuth, async function (req, res, next) {
    req.query.apiId = 23;
    await invalidateUserCache();
    next();
}, roles.onCreate);

// Update Role
router.put("/role", requireAuth, async function (req, res, next) {
    req.query.apiId = 24;
    await invalidateUserCache();
    next();
}, roles.onUpdate);

// Delete Role
router.delete("/role", requireAuth, async function (req, res, next) {
    req.query.apiId = 25;
    await invalidateUserCache();
    next();
}, roles.onDelete);

module.exports = router;