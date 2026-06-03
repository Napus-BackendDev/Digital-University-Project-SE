//app.js
const express = require("express");
const initialize = require("../helpers/initialize");
const middlewares = require('../middleware/middlewares');
const swagger = require("../swagger/swagger");
const routes = require("../server/router/app.routes");
module.exports = function () {
  const app = express();

  // Trust proxy for rate limiting behind Nginx
  app.set('trust proxy', 1);

  // 1. Move global CORS to the very top, before any other logic
  const cors = require('cors');
  const { corsOptions } = require('./corsAndIP');
  app.use(cors(corsOptions));

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
        res.status(200).send("OK");
      });
    } else {
      console.error("❌ Failed to initialize database connection. API routes not loaded.");
    }
  });

  return app;
};
