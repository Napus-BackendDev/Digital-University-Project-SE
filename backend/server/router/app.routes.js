// Import routes
const formRoutes = require("../Project/Form/form.routes");
const questionRoutes = require("../Project/Questions/questions.routes");
const responseRoutes = require("../Project/Response/response.routes");
const settingsRoutes = require("../Project/Settings/setting.routes");
const authRoutes = require("../Project/Auth/auth.routes");
const userRoutes = require("../Project/User/user.routes");

module.exports = function (app) {
  path = "/api/v1";

  // Auth routes (no prefix needed — mounted at /auth)
  app.use('/auth', authRoutes);

  app.use(path + '/form', formRoutes);
  app.use(path + '/question', questionRoutes);
  app.use(path + '/response', responseRoutes);
  app.use(path + '/user', userRoutes)
  app.use(path + '/settings', settingsRoutes);
  // app.get("/uploads/:filename", authMiddleware, (req, res) => {
  //   const filePath = path.join(__dirname, "../uploads", req.params.filename);
  //   res.sendFile(filePath);
  // });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      message: 'Route not found',
      path: req.path
    });
  });
};