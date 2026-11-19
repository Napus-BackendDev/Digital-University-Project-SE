const express = require('express');
const router = express.Router();
const response = require('../Response/service/response');

router.get('/export', function (req, res, next) {
    req.query.apiId = 6;
    next();
}, response.onExportAnalytics);

module.exports = router;
