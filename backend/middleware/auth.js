const jwt = require("jsonwebtoken");
const User = require('../server/Project/User/models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * requireAuth – verifies the JWT cookie set by /auth/google.
 * Looks up the user in the DB to get fresh roles.
 * Attaches to req.user: { id, email, name, picture, roles }
 */
async function requireAuth(req, res, next) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided. Please login." });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized: Invalid token. Please login." });
        }

        // Fetch user from DB with populated roles
        const user = await User.findById(decoded.userId).populate('roles').lean();
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found. Please login." });
        }

        const roleNames = user.roles.map(r => r.name);

        req.user = {
            id: user._id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            roles: roleNames,
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Token verification failed. Please login.", error: error.message });
    }
}

/**
 * requireRole – checks that the logged-in user has at least
 * one of the specified role names (ADMIN, STAFF, USER).
 * Use AFTER requireAuth in the middleware chain.
 *
 * Roles:
 *   ADMIN  – full access to everything
 *   STAFF  – create/view/manage forms & questions (no user management)
 *   USER   – view forms and submit responses (student)
 *
 * Example: router.delete('/user/:id', requireAuth, requireRole('ADMIN'), handler)
 */
function requireRole(...roleNames) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthenticated: No user information found. Please login." });
        }
        const userRoles = req.user.roles || [];
        // ADMIN can do everything — always pass
        if (userRoles.includes('ADMIN')) return next();
        const hasRole = roleNames.some(role => userRoles.includes(role));
        if (!hasRole) {
            return res.status(403).json({ message: `Forbidden: Access requires role(s): ${roleNames.join(", ")}` });
        }
        next();
    };
}

module.exports = {
    requireAuth,
    requireRole
};