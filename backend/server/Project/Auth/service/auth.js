const userModel=require("../../User/models/user.model");
const ResMessage=require("../../Settings/service/message");
const role = require("../../Role/controllers/role");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.onLogin=async function(request,response){
    try{
        const {email,password}=request.body;
        if(!email || !password){
            console.log("Invalid email or password");
            return response.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }
        const user=await userModel.findOne({email:email});
        if(!user){
            console.log("User not found or incorrect password");
            return response.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            console.log("User not found or incorrect password");
            return response.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        const token=jwt.sign(
            {userId:user._id,role:user.role},
            process.env.JWT_SECRET,
            {expiresIn:'1h'}
        );
        response.cookie('token',token,{
            httpsOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production'?'none':'strict',
            maxAge:3600000
        });
        return ResMessage.sendResponse(response,0,20000,token);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Login failed",
            error: err.message
        });
    }
};

exports.onRegister=async function(request,response){
    try{
        const {name,email,password,roleId}=request.body;
        if(!name || !email || !password || !roleId){
            console.log("Invalid registration data");
            return response.status(400).json({
                success: false,
                message: "Name, email, password, and roleId are required"
            });
        }
        const existingUser=await userModel.findOne({email:email});
        if(existingUser){
            console.log("Email already in use");
            return response.status(409).json({
                success: false,
                message: "Email already in use"
            });
        }
        const roleData=await role.onQuery({_id:roleId});
        if(!roleData){
            console.log("Role not found");
            return response.status(404).json({
                success: false,
                message: "Role not found"
            });
        }
        const hashedPassword=await bcrypt.hash(password,10);
        const newUser=new userModel({
            name:name,
            email:email,
            password:hashedPassword,
            roles:[roleId]
        });
        await newUser.save();
        
        const populatedUser = await userModel.findById(newUser._id).populate('roles').lean();
        delete populatedUser.password;
        
        return ResMessage.sendResponse(response,0,20100,populatedUser);
    }catch(err){
        console.log(err);
        return response.status(500).json({
            success: false,
            message: "Registration failed",
            error: err.message
        });
    }
};
exports.onLogout=async function(request,response){
    try{
        response.clearCookie('token',{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production'?'none':'strict'
        });
        return response.status(200).json({ 
            success: true,
            message: "Logged out successfully" 
        });
    }catch(err){
        console.log(err);
        return ResMessage.sendResponse(response,0,40400);
    }
};