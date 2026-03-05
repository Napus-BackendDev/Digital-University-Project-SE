const express = require('express');
const router = express.Router();

const response = require('./service/response');
const upload = require('../../../server/middleware/upload');

router.post("/getByFormId", function (req, res, next) {
    req.body.apiId = 1;
    next();
}, response.onGetByFormId);

router.post("/getById", function (req, res, next) {
    req.body.apiId = 2;
    next();
}, response.onGetById);

router.post("", function (req, res, next) {
    req.body.apiId = 3;
    next();
}, upload.single('file'), response.onCreate);

router.put("", function (req, res, next) {
    req.body.apiId = 4;
    next();
}, response.onUpdate);

router.delete("", function (req, res, next) {
    req.body.apiId = 5;
    next();
}, response.onDelete);

router.delete("/deleteByFormId", function (req, res, next) {
    req.body.apiId = 6;
    next();
}, response.onDeleteByFormId);

router.get("/download/:form_id/response/:_id", function (req, res, next) {
    req.body.apiId = 7;
    next();
}, response.downloadResponseJSON);

router.get("/download/:form_id", function (req, res, next) {
    req.body.apiId = 8;
    next();
}, response.downloadFormJSON);

module.exports = router;
