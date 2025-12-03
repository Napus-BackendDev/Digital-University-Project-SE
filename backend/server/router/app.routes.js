const formRoutes = require("../Project/Form/form.routes");
const responseRoutes = require("../Project/Response/response.routes");

module.exports = function (app) {
  var path = "/api/v1";

  app.use(path + "/form", formRoutes);
  app.use(path + "/response", responseRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      message: "Route not found",
      path: req.path,
    });
  });
};
