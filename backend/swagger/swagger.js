const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const _ = require('lodash');

module.exports = function (app) {
    const swaggerDocs = JSON.parse(fs.readFileSync('./server/swagger/app.json', 'utf8'));
    const responseDocs = JSON.parse(fs.readFileSync('./server/swagger/response.json', 'utf8'));
    const formDocs = JSON.parse(fs.readFileSync('./server/swagger/form.json', 'utf8'));
    const questionDocs = JSON.parse(fs.readFileSync('./server/swagger/question.json', 'utf8'));
    const userDocs = JSON.parse(fs.readFileSync('./server/swagger/user.json', 'utf8'));

    const swaggerDocument = _.merge(swaggerDocs, responseDocs, formDocs, questionDocs, userDocs);

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
