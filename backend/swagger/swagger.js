const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const _ = require('lodash');

module.exports = function (app) {
    const swaggerDocs = JSON.parse(fs.readFileSync('./server/swagger/app.json', 'utf8'));
    const responseSwaggerDoc = JSON.parse(fs.readFileSync('./server/swagger/response.json', 'utf8'));
    const roleSwaggerDoc = JSON.parse(fs.readFileSync('./server/swagger/role.json', 'utf8'));
    const userSwaggerDoc = JSON.parse(fs.readFileSync('./server/swagger/user.json', 'utf8'));
    const authSwaggerDoc = JSON.parse(fs.readFileSync('./server/swagger/auth.json', 'utf8'));

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
    app.use('/api-response-docs', swaggerUi.serveFiles(responseSwaggerDoc), swaggerUi.setup(responseSwaggerDoc));
    app.use('/api-role-docs', swaggerUi.serveFiles(roleSwaggerDoc), swaggerUi.setup(roleSwaggerDoc));
    app.use('/api-user-docs', swaggerUi.serveFiles(userSwaggerDoc), swaggerUi.setup(userSwaggerDoc));
    app.use('/api-auth-docs', swaggerUi.serveFiles(authSwaggerDoc), swaggerUi.setup(authSwaggerDoc));
};
