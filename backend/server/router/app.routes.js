// Import routes
const formRoutes = require("../Project/Form/form.routes");
const questionRoutes = require("../Project/Questions/questions.routes");
const responseRoutes = require("../Project/Response/response.routes");
const settingsRoutes = require("../Project/Settings/setting.routes");

module.exports = function (app) {
  path = "/api/v1";

  app.use(path + "/form", formRoutes);
  app.use(path + '/question', questionRoutes);
  app.use(path + '/response', responseRoutes);
  app.use(path + '/settings', settingsRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      message: 'Route not found',
      path: req.path
    });
  });
};