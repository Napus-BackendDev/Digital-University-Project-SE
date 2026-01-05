const express=require('express');
const router=express.Router();

const response=require('./service/response');
const { requireAuth, requirePermission } = require('../../../middleware/auth');

// Mock user middleware for anonymous submissions
const mockUserForAnonymous = (req, res, next) => {
    if (!req.user) {
        req.user = {
            id: '507f1f77bcf86cd799439011' // Mock user ID for anonymous submissions
        };
    }
    next();
};

//export .csv file
// router.get("/exportResponsesByFormId",response.onExportResponses);
router.get("/getByFormId",response.onGetByFormId);
router.get("/getByUserId",response.onGetByUserId);
router.get("/getById",response.onGetById);
router.get("",response.onQuerys);
router.get("/download/:form_id/user/:user_id",response.downloadUserJSON);
router.get("/download/:form_id",response.publicDownloadUsersJSON);
router.post("/submit", mockUserForAnonymous, response.onCreate);
router.patch("/update",response.onUpdate);
router.delete("/delete",response.onDelete);
router.delete("/deleteByFormId",response.onDeleteByFormId);

//Updated API
router.post("/export/:formId/user/:userId",response.generateExportLinkByFormAndUser);
router.post("/export/link",response.generateExportLinkFormId);
    
module.exports=router;
