// Import routes
const questionRoutes = require('../Project/Questions/questions.routes');
module.exports = function (app) {
  var path = "/api/v1";

  app.use(path + '/question', questionRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      message: 'Route not found',
      path: req.path
    });
  });
};
