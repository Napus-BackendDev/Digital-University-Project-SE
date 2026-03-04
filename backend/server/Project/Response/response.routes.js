const express = require('express');
const router = express.Router();

const response = require('./service/response');
const upload = require('../../../server/middleware/upload');

// export .csv file
// router.get("/exportResponsesByFormId",function(req,res,next){
//     req.query.apiId=0;
//     next();
// },response.onExportResponses);

router.post("/getByFormId", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, response.onGetByFormId);

router.post("/getById", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, response.onGetById);

router.get("/download/:form_id/user/:user_id", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, response.downloadUserJSON);
router.get("/download/:form_id", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, response.publicDownloadUsersJSON);

router.post("", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, upload.single('file'), response.onCreate);

router.put("", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, response.onUpdate);
router.delete("", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, response.onDelete);

//Updated API
router.post("/export/:formId/user/:userId", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, response.generateExportLinkByFormAndUser);
router.post("/export/link", function (req, res, next) {
    req.query.apiId = 0;
    next();
}, response.generateExportLinkFormId);

module.exports = router;
