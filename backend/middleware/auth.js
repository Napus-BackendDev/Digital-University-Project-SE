const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || process.env.KEY || 'dev-secret-change-me';

/**
 * requireAuth – verifies the JWT cookie set by /auth/google or Bearer token header.
 * Attaches decoded user info to req.user.
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

        // Attach Google-sourced user info from the JWT payload
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            name: decoded.name,
            picture: decoded.picture,
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
    // requirePermission,
    // requireRole
};