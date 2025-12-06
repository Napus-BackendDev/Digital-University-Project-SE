const express=require('express');
const router=express.Router();

const response=require('./service/response');
const { requireAuth, requirePermission } = require('../../../middleware/auth');

router.get("/exportResponsesByFormId",requireAuth,requirePermission('EXPORT_RESPONSES'),response.onExportResponses);
router.get("/getByFormId",requireAuth,requirePermission('VIEW_RESPONSES'),response.onGetByFormId);
router.get("/getByUserId",requireAuth,requirePermission('VIEW_OWN_RESPONSES'),response.onGetByUserId);
router.get("/getById",requireAuth,requirePermission('VIEW_RESPONSES'),response.onGetById);
router.get("",requireAuth,requirePermission('VIEW_RESPONSES'),response.onQuerys);
router.post("/submit",requireAuth,requirePermission('SUBMIT_RESPONSES'),response.onCreate);
router.patch("/update",requireAuth,requirePermission('EDIT_RESPONSES'),response.onUpdate);
router.delete("/delete",requireAuth,requirePermission('DELETE_RESPONSES'),response.onDelete);
router.delete("/deleteByFormId",requireAuth,requirePermission('DELETE_RESPONSES'),response.onDeleteByFormId);

module.exports=router;