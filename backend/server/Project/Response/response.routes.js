const express=require('express');
const router=express.Router();

const response=require('./service/response');
const { requireAuth, requirePermission } = require('../../../middleware/auth');
//export .csv file
// router.get("/exportResponsesByFormId",function(req,res,next){
//     req.query.apiId=0;
//     next();
// },response.onExportResponses);
router.get("/getByFormId",function(req,res,next){
    req.query.apiId=0;
    next();
},response.onGetByFormId);
router.get("/getByUserId",function(req,res,next){
    req.query.apiId=0;
    next();
},response.onGetByUserId);
router.get("/getById",function(req,res,next){
    req.query.apiId=0;
    next();
},response.onGetById);
router.get("",function(req,res,next){
    req.query.apiId=0;
    next();
},response.onQuerys);
router.get("/download/:form_id/user/:user_id",function(req,res,next){
    req.query.apiId=0;
    next();
},response.downloadUserJSON);
router.get("/download/:form_id",function(req,res,next){
    req.query.apiId=0;
    next();
},response.publicDownloadUsersJSON);
router.post("/submit",function(req,res,next){
    req.query.apiId=0;
    next();
},response.onCreate);
router.patch("/update",function(req,res,next){
    req.query.apiId=0;
    next();
},response.onUpdate);
router.delete("/delete",function(req,res,next){
    req.query.apiId=0;
    next();
},response.onDelete);
router.delete("/deleteByFormId",function(req,res,next){
    req.query.apiId=0;
    next();
},response.onDeleteByFormId);

//Updated API
router.post("/export/:formId/user/:userId",function(req,res,next){
    req.query.apiId=0;
    next();
},response.generateExportLinkByFormAndUser);
router.post("/export/link",function(req,res,next){
    req.query.apiId=0;
    next();
},response.generateExportLinkFormId);
    
module.exports=router;
