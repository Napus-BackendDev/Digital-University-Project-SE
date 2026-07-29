const jwt = require("jsonwebtoken");
const User = require("../server/Project/User/models/user.model");

const JWT_SECRET = process.env.JWT_SECRET || process.env.KEY || 'dev-secret-change-me';

function getRoleTitle(role) {
    if (!role || !role.title) return '';
    if (typeof role.title === 'string') return role.title;
    if (Array.isArray(role.title)) {
        const enTitle = role.title.find(item => item && String(item.key).toLowerCase() === 'en');
        const title = enTitle || role.title[0];
        return title && title.value ? String(title.value) : '';
    }
    return '';
}

function isAdminUser(user) {
    return getRoleTitle(user && user.role).toLowerCase() === 'admin';
}

/**
 * requireAuth – verifies the JWT cookie set by /auth/google or Bearer token header.
 * Attaches the current database user, role, and organization to req.user.
 */
async function requireAuth(req, res, next) {
    try {
        const token = (req.cookies && req.cookies.token) ||
            (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided. Please login." });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized: Invalid token. Please login." });
        }

        const dbUser = await User.findById(decoded.userId)
            .populate('role')
            .populate('organization', 'title');

        if (!dbUser) {
            return res.status(401).json({ message: "Unauthorized: User no longer exists. Please login again." });
        }

        req.user = {
            id: String(dbUser._id),
            _id: dbUser._id,
            googleId: dbUser.googleId,
            email: dbUser.email,
            name: dbUser.name,
            picture: dbUser.picture,
            role: dbUser.role || null,
            organization: dbUser.organization || null,
            roleTitle: getRoleTitle(dbUser.role),
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Token verification failed. Please login.", error: error.message });
    }
}

// --- Role / Permission helpers (enable when User model is ready) ---

// function requirePermission(...permissions) {
//     return (req, res, next) => {
//         if (!req.user) {
//             return res.status(401).json({ message: "Unauthorized: No user information found. Please login." });
//         }
//         const userPerms = req.user.permissions || [];
//         const hasPermission = permissions.some(perm => userPerms.includes(perm));
//         if(!hasPermission){
//             return res.status(403).json({ 
//                 message: `Forbidden: Required permissions: ${permissions.join(", ")}`,
//                 userPermissions: userPerms,
//                 requiredPermissions: permissions
//             });
//         }
//         next();
//     }
// }

// function requireRole(...roleNames) {
//     return async (req, res, next) => {
//         try {
//             if (!req.user) {
//                 return res.status(401).json({ message: "Unauthenticated: No user information found. Please login." });
//             }
//             const userRoles = req.user.roles || [];
//             const hasRole = roleNames.some(role => userRoles.includes(role));
//             if(!hasRole){
//                 return res.status(403).json({ message: `Forbidden: Access requires role(s): ${roleNames.join(", ")}` });
//             }
//             next();
//         } catch (error) {
//             return res.status(500).json({ message: "Error checking role", error: error.message });
//         }
//     };
// }

module.exports = {
    requireAuth,
    getRoleTitle,
    isAdminUser,
    // requirePermission,
    // requireRole
};
