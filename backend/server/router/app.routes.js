// Import routes
const questionRoutes = require('../Project/Questions/questions.routes');
<<<<<<< HEAD
const formRoutes = require("../Project/Form/form.routes");
const responseRoutes = require("../Project/Response/response.routes");

=======
>>>>>>> 1323ecf7565e31d908c5310182fa1b0e09496dd5
module.exports = function (app) {
  var path = "/api/v1";

  app.use(path + '/question', questionRoutes);
<<<<<<< HEAD
  
=======
>>>>>>> 1323ecf7565e31d908c5310182fa1b0e09496dd5

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      message: 'Route not found',
      path: req.path
    });
  });
};
