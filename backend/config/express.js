//app.js
const express = require("express");
const initialize = require("../helpers/initialize");
const middlewares = require('../middleware/middlewares');
const swagger = require("../swagger/swagger");
const routes = require("../server/router/app.routes");
const cors = require('cors');
const { corsOptions } = require('./corsAndIP');

let isReady = false;

module.exports = function () {
  const app = express();

  // CORS must be applied before any routes/middleware that handle requests
  app.use(cors(corsOptions));

  // Swagger setup
  swagger(app);

  initialize.init(function (status) {
    if (status) {
      middlewares(app);

      // Load routes
      routes(app);

      app.get("/healthz", (req, res) => {
        if (isReady) {
          res.status(200).send("OK");
        } else {
          res.status(503).send("Service Unavailable");
        }
      });

      setTimeout(() => {
        isReady = true;
      }, 10000);
    }
  });

  return app;
};
