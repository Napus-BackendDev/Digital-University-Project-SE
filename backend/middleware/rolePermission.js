const userModel = require("../server/Project/User/models/user.model");

const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get user with populated roles
      const user = await userModel.findById(req.user.userId).populate('roles');
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has any of the allowed roles
      const userRoleNames = user.roles.map(role => role.name);
      const hasPermission = allowedRoles.some(role => userRoleNames.includes(role));

      if (!hasPermission) {
        return res.status(403).json({ 
          message: "Access denied. Required roles: " + allowedRoles.join(", "),
          userRoles: userRoleNames
        });
      }

      req.user.roles = user.roles; // Attach full role data to request
      next();
    } catch (error) {
      return res.status(500).json({ message: "Error checking permissions", error: error.message });
    }
  };
};

module.exports = authorizeRoles;