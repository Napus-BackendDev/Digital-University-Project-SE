const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

module.exports = function (app) {
    const swaggerDocument = JSON.parse(fs.readFileSync('./server/swagger/app.json', 'utf8'));

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
