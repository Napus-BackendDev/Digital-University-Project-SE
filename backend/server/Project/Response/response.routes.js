const express=require('express');
const router=express.Router();

const response=require('./service/response');

router.get("",response.onQuerys);
router.get("/getByFormId",response.onGetByFormId);
router.get("/getByUserId",response.onGetByUserId);
router.get("/getById",response.onGetById);
router.get("/exportResponsesByFormId",response.onExportResponses);
router.post("/submit",response.onCreate);
router.put("/update",response.onUpdate);
router.delete("/delete",response.onDelete);
router.delete("/deleteByFormId",response.onDeleteByFormId);

module.exports=router;