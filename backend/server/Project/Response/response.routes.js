const express=require('express');
const router=express.Router();

const response=require('./service/response');

router.get("",response.onQuery);
router.get("/getByFormId",response.onGetByFormId);
router.get("/getById",response.onGetById);
router.get("/exportResponses",response.onExportResponses);
router.post("/submit",response.onCreate);
router.put("",response.onUpdate);
router.delete("",response.onDelete);

module.exports=router;