const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../../../middleware/cacheMiddleware');
const { invalidateUserCache } = require('../../../helpers/cacheInvalidator');

const user = require('./service/user');
const roles = require('./service/roles');
const { authenticate, authorize } = require('../../../middleware/authorization');

// Get All Users (Cached 5 mins)
router.get("/exp", authenticate, authorize('Permissions', 'read'), cacheMiddleware(300), function (req, res, next) {
    req.query.apiId = 21;
    next();
}, user.onQuerys);

// Get One by ID
router.post("/get", authenticate, authorize('Permissions', 'read'), function (req, res, next) {
    req.query.apiId = 22;
    next();
}, user.onQuery);

// Create
router.post("", authenticate, authorize('Permissions', 'create'), async function (req, res, next) {
    req.query.apiId = 23;
    await invalidateUserCache();
    next();
}, user.onCreate);

// Update
router.put("", authenticate, authorize('Permissions', 'update'), async function (req, res, next) {
    req.query.apiId = 24;
    await invalidateUserCache(req.body && req.body._id);
    next();
}, user.onUpdate);

// Delete
router.delete("", authenticate, authorize('Permissions', 'delete'), async function (req, res, next) {
    req.query.apiId = 25;
    await invalidateUserCache(req.body && req.body._id);
    next();
}, user.onDelete);

// Get All Roles (Cached 5 mins)
router.get("/role/exp", authenticate, authorize('Permissions', 'read'), cacheMiddleware(300), function (req, res, next) {
    req.query.apiId = 21;
    next();
}, roles.onQuerys);

// Get One Role by ID
router.post("/role/get", authenticate, authorize('Permissions', 'read'), function (req, res, next) {
    req.query.apiId = 22;
    next();
}, roles.onQuery);

// Create Role
router.post("/role", authenticate, authorize('Permissions', 'create'), async function (req, res, next) {
    req.query.apiId = 23;
    await invalidateUserCache();
    next();
}, roles.onCreate);

// Update Role
router.put("/role", authenticate, authorize('Permissions', 'update'), async function (req, res, next) {
    req.query.apiId = 24;
    await invalidateUserCache();
    next();
}, roles.onUpdate);

// Delete Role
router.delete("/role", authenticate, authorize('Permissions', 'delete'), async function (req, res, next) {
    req.query.apiId = 25;
    await invalidateUserCache();
    next();
}, roles.onDelete);

module.exports = router;
