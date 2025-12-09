// Import routes
const questionRoutes = require('../Project/Questions/questions.routes');
const formRoutes = require("../Project/Form/form.routes");
const responseRoutes = require("../Project/Response/response.routes");
const userRoutes = require("../Project/User/user.routes");
const roleRoutes = require("../Project/Role/role.routes");
const authRoutes = require("../Project/Auth/auth.routes");
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
