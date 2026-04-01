const express = require('express');
const router = express.Router();

const form = require('./service/form');
const {
    validateFormCreate,
    validateFormGetById,
    validateFormUpdate,
    validateFormDelete
} = require('../../../middleware/validate');

// Get All
router.get("/exp", function (req, res, next) {
    req.query.apiId = 21;
    next();
}, form.onQuerys);

// Get One by ID
router.post("/get", function (req, res, next) {
    req.query.apiId = 22;
    next();
}, validateFormGetById, form.onQuery);

// Create
router.post("", function (req, res, next) {
    req.query.apiId = 23;
    next();
}, validateFormCreate, form.onCreate);

// Update
router.put("", function (req, res, next) {
    req.query.apiId = 24;
    next();
}, validateFormUpdate, form.onUpdate);

// Delete
router.delete("", function (req, res, next) {
    req.query.apiId = 25;
    next();
}, validateFormDelete, form.onDelete);

module.exports = router;