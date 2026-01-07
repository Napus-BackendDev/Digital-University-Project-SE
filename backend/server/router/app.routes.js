// Import routes
const questionRoutes = require('../Project/Questions/questions.routes');
const settingRoutes = require('../Project/Settings/setting.routes');
module.exports = function (app) {
  var path = "/api/v1";

  app.use(path + '/question', questionRoutes);
  app.use(path + '/setting', settingRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      message: 'Route not found',
      path: req.path
    });
  });
};
