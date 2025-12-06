const jwt=require("jsonwebtoken");
const User = require('../server/Project/User/models/user.model');

const JWT_SECRET = process.env.JWT_SECRET;

async function requireAuth(req,res,next) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided. Please login." });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized: Invalid token. Please login." });
        }

        const user = await User.findById(decoded.userId).populate('roles');
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        
        // Extract role names and all permissions from user's roles
        const roleNames = user.roles.map(role => role.name);
        const permissions = user.roles.flatMap(role => role.permissions || []);
        
        req.user={
            id:user._id,
            roles:roleNames,
            permissions
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Token verification failed. Please login.", error: error.message });
    }
}

function requirePermission(...permissions) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: No user information found. Please login." });
        }
        const userPerms = req.user.permissions || [];
        console.log('User permissions:', userPerms);
        console.log('Required permissions:', permissions);
        const hasPermission = permissions.some(perm => userPerms.includes(perm));
        
        if(!hasPermission){
            return res.status(403).json({ 
                message: `Forbidden: Required permissions: ${permissions.join(", ")}`,
                userPermissions: userPerms,
                requiredPermissions: permissions
            });
        }
        next();
    }
}

function requireRole(...roleNames) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthenticated: No user information found. Please login." });
            }
            const userRoles = req.user.roles || [];
            const hasRole = roleNames.some(role => userRoles.includes(role));
            
            if(!hasRole){
                return res.status(403).json({ message: `Forbidden: Access requires role(s): ${roleNames.join(", ")}` });
            }
            next();
        } catch (error) {
            return res.status(500).json({ message: "Error checking role", error: error.message });
        }
    };
}

module.exports = {
    requireAuth,
    requirePermission,
    requireRole
};