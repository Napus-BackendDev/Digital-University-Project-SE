// Import routes
const questionRoutes = require('../Project/Questions/questions.routes');
const formRoutes = require("../Project/Form/form.routes");

module.exports = function (app) {

  app.use(path + '/question', questionRoutes);
  app.use(path + "/form", formRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      message: 'Route not found',
      path: req.path
    });
  });
};
