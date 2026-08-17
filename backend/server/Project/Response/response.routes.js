const express = require('express');
const router = express.Router();
const response = require('./service/response');
const { upload } = require('../../../helpers/upload');
const { authenticate, authorize } = require('../../../middleware/authorization');

// Public read-only export. The unguessable path token is the credential.
router.get('/export-api/:token', response.onExportApiRead);

// Replaces the only active export token for a form. The previous URL stops working immediately.
router.post('/export-api/:formId/rotate', authenticate, authorize('Analytics', 'update'), response.onExportApiRotate);
// Get All
router.get("/exp", authenticate, authorize('Analytics', 'read'), function (req, res, next) {
    req.query.apiId = 1;
    next();
}, response.onQuerys);

// Get by filter (single or list)
router.post("/get", authenticate, authorize('Analytics', 'read'), function (req, res, next) {
    req.query.apiId = 2;
    next();
}, response.onQuery);

// Create
router.post("", function (req, res, next) {
    req.query.apiId = 3;
    next();
}, upload.any(), response.onCreate);

// Update
router.put("", authenticate, authorize('Analytics', 'update'), function (req, res, next) {
    req.query.apiId = 4;
    next();
}, upload.any(), response.onUpdate);

// Delete (query/body version)
router.delete("", authenticate, authorize('Analytics', 'delete'), function (req, res, next) {
    req.query.apiId = 5;
    next();
}, response.onDelete);

// Delete (path parameter version)
router.delete("/:id", authenticate, authorize('Analytics', 'delete'), function (req, res, next) {
    req.query.apiId = 5;
    next();
},response.onDelete);

module.exports = router;
