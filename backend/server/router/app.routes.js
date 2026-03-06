// Import routes
const formRoutes = require("../Project/Form/form.routes");
const questionRoutes = require("../Project/Questions/questions.routes");
const responseRoutes = require("../Project/Response/response.routes");
const settingsRoutes = require("../Project/Settings/setting.routes");
const authRoutes = require("../Project/Auth/auth.routes");
const roleRoutes = require("../Project/Role/role.routes");
const userRoutes = require("../Project/User/user.routes");

// Auth middleware
const { requireAuth, requireRole } = require("../../middleware/auth");

module.exports = function (app) {
  const path = "/api/v1";

  // Auth routes — public (login, logout, /me)
  app.use('/auth', authRoutes);

  // Forms & Questions — ADMIN and STAFF can manage
  app.use(path + '/form', requireAuth, requireRole('ADMIN', 'STAFF'), formRoutes);
  app.use(path + '/question', requireAuth, requireRole('ADMIN', 'STAFF'), questionRoutes);

  // Responses — any authenticated user (students submit, staff/admins review)
  app.use(path + '/response', requireAuth, requireRole('ADMIN', 'STAFF', 'USER'), responseRoutes);

  // Settings, Roles, Users — ADMIN only
  app.use(path + '/settings', requireAuth, requireRole('ADMIN'), settingsRoutes);
  app.use(path + '/role', requireAuth, requireRole('ADMIN'), roleRoutes);
  app.use(path + '/user', requireAuth, requireRole('ADMIN'), userRoutes);

  // 404 handler
  app.use((req, res) => {
    console.warn(`[404] ${req.method} ${req.path}`);
    res.status(404).json({
      message: 'Route not found',
      path: req.path
    });
  });
};