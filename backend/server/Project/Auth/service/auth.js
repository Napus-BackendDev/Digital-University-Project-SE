const userModel = require("../../User/models/user.model");
const ResMessage = require("../../Settings/service/message");
const role = require("../../Role/controllers/role");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.onLogin = async function (request, response) {
    try {
        const { email, password } = request.body;
        if (!email || !password) {
            return ResMessage.sendResponse(response, 0, 40000, "Field email and password are required");
        }

        const user = await userModel.findOne({ email: email });
        if (!user) {
            return ResMessage.sendResponse(response, 0, 40100, "Invalid email or password");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return ResMessage.sendResponse(response, 0, 40100, "Invalid email or password");
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        response.cookie('token', token, {
            httpsOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 3600000
        });

        return ResMessage.sendResponse(response, 0, 20000, token);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.onRegister = async function (request, response) {
    try {
        const { name, email, password, roleId } = request.body;
        if (!name || !email || !password || !roleId) {
            return ResMessage.sendResponse(response, 0, 40000, "Field name, email, password, and roleId are required");
        }

        const existingUser = await userModel.findOne({ email: email });
        if (existingUser) {
            return ResMessage.sendResponse(response, 0, 40900, "Field email already in use");
        }

        const roleData = await role.onQuery({ _id: roleId });
        if (!roleData) {
            return ResMessage.sendResponse(response, 0, 40400, "Field role not found");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new userModel({
            name: name,
            email: email,
            password: hashedPassword,
            roles: [roleId]
        });
        await newUser.save();

        const populatedUser = await userModel.findById(newUser._id).populate('roles').lean();
        delete populatedUser.password;

        return ResMessage.sendResponse(response, 0, 20100, populatedUser);
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};

exports.onLogout = async function (request, response) {
    try {
        response.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        });

        return ResMessage.sendResponse(response, 0, 20000, "Logged out successfully");
    } catch (err) {
        return ResMessage.sendResponse(response, 0, 40400, err.message);
    }
};