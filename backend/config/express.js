//app.js
const express = require("express");
const initialize = require("../helpers/initialize");
const middlewares = require('../middleware/middlewares');
const swagger = require("../swagger/swagger");
const routes = require("../server/router/app.routes");

let isReady = false;

module.exports = function () {
  const app = express();

  // Swagger setup
  swagger(app);

  initialize.init(function (status) {
    if (status) {
      middlewares(app);
      app.use(function (req, res, next) {
        const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:8080';
        if (req.method === "OPTIONS") {
          const headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
              "X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Headers, X-Access-Token",
          };
          res.writeHead(200, headers);
          res.end();
        } else {
          res.header("Access-Control-Allow-Origin", origin);
          res.header("Access-Control-Allow-Credentials", "true");
          next();
        }
      });

      // Load routes
      routes(app);

      app.get("/healthz", (req, res) => {
        if (isReady) {
          res.status(200).send("OK");
        } else {
          res.status(503).send("Service Unavailable");
        }
      });

      // Global JSON error handling middleware registered AFTER routes
      app.use((err, req, res, next) => {
        console.error('[Express Global Error]:', err.message);

        // Catch Multer errors and custom file validation errors
        const isMulterError = err.name === 'MulterError';
        const isInvalidFileType = err.code === 'INVALID_FILE_TYPE' ||
          (err.message && (
            err.message.includes('File type') ||
            err.message.includes('not allowed') ||
            err.message.includes('image files are allowed') ||
            err.message.includes('MIME type')
          ));

        if (isMulterError || isInvalidFileType) {
          const reason = err.code || (isMulterError ? 'MULTER_ERROR' : 'INVALID_FILE_TYPE');
          return res.status(400).json({
            code: 40000,
            httpcode: 400,
            message: [
              { value: 'ไฟล์ไม่ถูกต้อง หรือขนาดไฟล์เกินกำหนด (สูงสุด 3MB)', key: 'th' },
              { value: err.message || 'Invalid file uploaded', key: 'en' }
            ],
            data: { reason: reason, message: err.message }
          });
        }

        // Catch SyntaxError from body-parser / express.json (status 400)
        if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400)) {
          return res.status(400).json({
            code: 40000,
            httpcode: 400,
            message: [
              { value: 'ข้อมูล JSON ไม่ถูกต้อง (SyntaxError)', key: 'th' },
              { value: err.message || 'Malformed JSON payload', key: 'en' }
            ],
            data: { reason: 'SYNTAX_ERROR', message: err.message }
          });
        }

        // Unhandled errors: return standard JSON 500 (or other status), never HTML
        const status = err.status || err.statusCode || (err.name === 'SyntaxError' ? 400 : 500);
        const code = status === 400 ? 40000 : 50000;
        return res.status(status).json({
          code: code,
          httpcode: status,
          message: [
            { value: status === 400 ? 'คำขอไม่ถูกต้อง' : 'เกิดข้อผิดพลาดภายในระบบ', key: 'th' },
            { value: err.message || (status === 400 ? 'Bad Request' : 'Internal Server Error'), key: 'en' }
          ],
          data: { message: err.message }
        });
      });

      setTimeout(() => {
        isReady = true;
      }, 10000);
    }
  });

  return app;
};
