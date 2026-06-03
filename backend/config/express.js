//app.js
const express = require("express");
const initialize = require("../helpers/initialize");
const middlewares = require('../middleware/middlewares');
const swagger = require("../swagger/swagger");
const routes = require("../server/router/app.routes");

let isReady = false;

module.exports = function () {
  const app = express();

  // Trust proxy for rate limiting behind Nginx
  app.set('trust proxy', 1);

  // Swagger setup
  swagger(app);

  initialize.init(function (status) {
    if (status) {
      // Handle double slashes or missing /api prefix if Nginx mangles it
      app.use((req, res, next) => {
        if (req.url.startsWith('//')) {
          req.url = req.url.replace(/^\/+/, '/');
        }
        // If the request is /v1/... but should be /api/v1/...
        if (req.url.startsWith('/v1') && !req.url.startsWith('/api/v1')) {
          req.url = '/api' + req.url;
        }
        next();
      });

      // Middlewares must be added before routes
      middlewares(app);
      
      // Load routes
      routes(app);

      console.log("🚀 API Routes loaded");

      app.all('*', (req, res, next) => {
        console.log(`[Backend Debug] Request received: ${req.method} ${req.originalUrl}`);
        next();
      });

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
    } else {
      console.error("❌ Failed to initialize database connection. API routes not loaded.");
    }
  });

  return app;
};
