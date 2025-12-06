// Import routes
const questionRoutes = require('../Project/Questions/questions.routes');
const formRoutes = require("../Project/Form/form.routes");
const responseRoutes = require("../Project/Response/response.routes");
const userRoutes = require("../Project/User/user.routes");
const roleRoutes = require("../Project/Role/role.routes");
module.exports = function (app) {
  var path = "/api/v1";

  app.use(path + "/form", formRoutes);
  app.use(path + "/response", responseRoutes);
  app.use(path + '/question', questionRoutes);
  app.use(path + '/user', userRoutes);
  app.use(path + '/role', roleRoutes);
  

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      message: 'Route not found',
      path: req.path
    });
  });
};
