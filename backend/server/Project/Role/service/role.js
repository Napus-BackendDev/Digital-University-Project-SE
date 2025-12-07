const mongo=require("mongodb");
const roleService=require("../controllers/role");
const ResMessage=require("../../Settings/service/message");

exports.onQuerys=async function(request,response){
    try{
        let query={};
        const doc=await roleService.onQuerys(query);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to fetch roles",
            error: err.message
        });
    }
}

exports.onGetById=async function(request,response){
    try{
        let query={};
        query._id=new mongo.ObjectId(request.query._id);
        const doc=await roleService.onQuery(query);
        if(!doc){
            return response.status(404).json({
                success: false,
                message: "Role not found"
            });
        }
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to fetch role",
            error: err.message
        });
    }
};

exports.onCreate=async function(request,response){
    try{
        const doc=await roleService.onCreate(request.body);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to create role",
            error: err.message
        });
    }
};

exports.onUpdate=async function(request,response){
    try{
        let query={}
        query._id=new mongo.ObjectId(request.params.id);
        const doc=await roleService.onUpdate(query,request.body);
        if(!doc){
            return response.status(404).json({
                success: false,
                message: "Role not found"
            });
        }
        return ResMessage.sendResponse(response,0 , 20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to update role",
            error: err.message
        });
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
        return response.status(500).json({
            success: false,
            message: "Failed to delete role",
            error: err.message
        });
    }
};

exports.setPermissions=async function(request,response){
    try{
        const roleId=new mongo.ObjectId(request.params.id);
        const permissions=request.body.permissions;
        if(!permissions || !Array.isArray(permissions)){
            return response.status(400).json({
                success: false,
                message: "Permissions must be an array"
            });
        }
        const doc=await roleService.setPermissions(roleId,permissions);
        if(!doc){
            return response.status(404).json({
                success: false,
                message: "Role not found"
            });
        }
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to set permissions",
            error: err.message
        });
    }
};

exports.addPermission=async function(request,response){
    try{
        const roleId=new mongo.ObjectId(request.params.id);
        const permission=request.body.permission;
        if(!permission){
            return response.status(400).json({
                success: false,
                message: "Permission is required"
            });
        }
        const doc=await roleService.addPermission(roleId,permission);
        if(!doc){
            return response.status(404).json({
                success: false,
                message: "Role not found"
            });
        }
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to add permission",
            error: err.message
        });
    }
};

exports.removePermission=async function(request,response){
    try{
        const roleId=new mongo.ObjectId(request.params.id);
        const permission=request.body.permission;
        if(!permission){
            return response.status(400).json({
                success: false,
                message: "Permission is required"
            });
        }
        const doc=await roleService.removePermission(roleId,permission);
        if(!doc){
            return response.status(404).json({
                success: false,
                message: "Role not found"
            });
        }
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to remove permission",
            error: err.message
        });
    }
};