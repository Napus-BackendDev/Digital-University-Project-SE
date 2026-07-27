const formRoutes = require("../Project/Form/form.routes");
const questionRoutes = require("../Project/Questions/questions.routes");
const responseRoutes = require("../Project/Response/response.routes");
const settingsRoutes = require("../Project/Settings/setting.routes");
const authRoutes = require("../Project/Auth/auth.routes");
const userRoutes = require("../Project/User/user.routes");
const organizationRoutes = require("../Project/Organizations/organization.routes");
const healthRoutes = require("./health.routes");

module.exports = function (app) {

  const path = "/api/v1";

  app.use(path + '/form', formRoutes);
  app.use(path + '/question', questionRoutes);
  app.use(path + '/response', responseRoutes);
  app.use(path + '/auth', authRoutes);
  app.use(path + '/user', userRoutes)
  app.use(path + '/settings', settingsRoutes);
  app.use(path + '/organization', organizationRoutes);
  app.use("/", healthRoutes);

};
