const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const _ = require('lodash');

module.exports = function (app) {
    const swaggerDocs = JSON.parse(fs.readFileSync('./server/swagger/app.json', 'utf8'));
    const responseSwaggerDoc = JSON.parse(fs.readFileSync('./server/swagger/response.json', 'utf8'));
    // const productSwaggerDocument = JSON.parse(fs.readFileSync('./server/swagger/app1.json', 'utf8'));
    

    // const swaggerDocument = _.merge(swaggerDocs, productSwaggerDocument);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
    app.use('/api-response-docs', swaggerUi.serve, swaggerUi.setup(responseSwaggerDoc));
};
