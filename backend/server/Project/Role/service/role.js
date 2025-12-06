const mongo=require("mongodb");
const roleService=require("../controllers/role");
const ResMessage=require("../../Settings/service/message");

exports.onQuerys=async function(request,response){
    try{
        let query={};
        const doc=await roleService.onQuerys(query);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        return ResMessage.sendResponse(response,0,40400);
    }
}

exports.onGetById=async function(request,response){
    try{
        let query={};
        query._id=new mongo.ObjectId(request.query._id);
        const doc=await roleService.onQuery(query);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        return ResMessage.sendResponse(response,0,40400);
    }
};

exports.onCreate=async function(request,response){
    try{
        const doc=await roleService.onCreate(request.body);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return ResMessage.sendResponse(response,0,40400);
    }
};

exports.onUpdate=async function(request,response){
    try{
        let query={}
        query._id=new mongo.ObjectId(request.params.id);
        const doc=await roleService.onUpdate(query,request.body);
        return ResMessage.sendResponse(response,0 , 20000,doc);
    }catch(err){
        console.log(err);
        return ResMessage.sendResponse(response,0,40400);
    }
};

exports.onDelete=async function(request,response){
    try{
        let query={}
        query._id=new mongo.ObjectId(request.body._id);
        const doc=await roleService.onDelete(query);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return ResMessage.sendResponse(response,0,40400);
    }
};

exports.setPermissions=async function(request,response){
    try{
        const roleId=new mongo.ObjectId(request.params.id);
        const permissions=request.body.permissions;
        const doc=await roleService.setPermissions(roleId,permissions);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return ResMessage.sendResponse(response,0,40400);
    }
};

exports.addPermission=async function(request,response){
    try{
        const roleId=new mongo.ObjectId(request.params.id);
        const permission=request.body.permission;
        const doc=await roleService.addPermission(roleId,permission);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return ResMessage.sendResponse(response,0,40400);
    }
};

exports.removePermission=async function(request,response){
    try{
        const roleId=new mongo.ObjectId(request.params.id);
        const permission=request.body.permission;
        const doc=await roleService.removePermission(roleId,permission);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return ResMessage.sendResponse(response,0,40400);
    }
};