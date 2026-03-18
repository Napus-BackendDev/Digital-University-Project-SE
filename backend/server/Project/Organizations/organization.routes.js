const express = require('express');
const router = express.Router();
const org = require('./service/organization');

router.get("/exp", function (req, res, next) {
    req.query.apiId = 31;
    next();
}, org.onQuerys);

router.post("/get", function (req, res, next) {
    req.body.apiId = 32;
    next();
}, org.onQuery);

router.post("", function (req, res, next) {
    req.body.apiId = 33;
    next();
}, org.onCreate);

router.put("", function (req, res, next) {
    req.body.apiId = 34;
    next();
}, org.onUpdate);

router.delete("", function (req, res, next) {
    req.body.apiId = 35;
    next();
}, org.onDelete);

module.exports = router;
