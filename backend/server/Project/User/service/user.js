const mongo=require("mongodb");
const userService=require("../controllers/user");
const ResMessage=require("../../Settings/service/message");

exports.onQuerys=async function(request,response){
    try{
        let query={};
        const doc=await userService.onQuerys(query);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: err.message
        });
    }
}

exports.getProfile=async function(request,response){
    try{
        let query={};
        query._id=new mongo.ObjectId(request.user.id);
        const doc=await userService.onQuery(query);
        if(!doc){
            return response.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to fetch profile",
            error: err.message
        });
    }
};

exports.onCreate=async function(request,response){
    try{
        const doc=await userService.onCreate(request.body);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to create user",
            error: err.message
        });
    }
};

exports.onUpdate=async function(request,response){
    try{
        let query={};
        query._id=new mongo.ObjectId(request.user.id);
        const doc=await userService.onUpdate(query,request.body);
        if(!doc){
            return response.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        return ResMessage.sendResponse(response,0 , 20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to update user",
            error: err.message
        });
    }
};

exports.onDelete=async function(request,response){
    try{
        let query={};
        query._id=new mongo.ObjectId(request.body._id);
        const doc=await userService.onDelete(query);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: err.message
        });
    }
};