const mongo=require("mongodb");
const userService=require("../controllers/user");
const ResMessage=require("../../Settings/service/message");

exports.onQuerys=async function(request,response){
    try{
        let query={};
        const doc=await userService.onQuerys(query);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        return ResMessage.sendResponse(response,0,40400);
    }
}

exports.onGetById=async function(request,response){
    try{
        let query={};
        query._id=new mongo.ObjectId(request.query._id);
        const doc=await userService.onQuery(query);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        return ResMessage.sendResponse(response,0,40400);
    }
};

exports.onCreate=async function(request,response){
    try{
        const doc=await userService.onCreate(request.body);
        return ResMessage.sendResponse(response,0,20000,doc);
    }catch(err){
        console.log(err);
        return ResMessage.sendResponse(response,0,40400);
    }
};

exports.onUpdate=async function(request,response){
    try{
        let query={}
        query.id=new mongo.ObjectId(request.body.id);
        const doc=await userService.onUpdate(query,request.body);
        return ResMessage.sendResponse(response,0 , 20000,doc);
    }catch(err){
        console.log(err);
        return ResMessage.sendResponse(response,0,40400);
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
        return ResMessage.sendResponse(response,0,40400);
    }
};