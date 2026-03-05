const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const _ = require('lodash');

module.exports = function (app) {
    const swaggerDocs = JSON.parse(fs.readFileSync('./server/swagger/app.json', 'utf8'));
    const responseDocs= JSON.parse(fs.readFileSync('./server/swagger/response.json', 'utf8'));
    const formDocs = JSON.parse(fs.readFileSync('./server/swagger/form.json', 'utf8'));
    const questionDocs = JSON.parse(fs.readFileSync('./server/swagger/question.json', 'utf8'));
    const roleDocs = JSON.parse(fs.readFileSync('./server/swagger/role.json', 'utf8'));
    const userDocs = JSON.parse(fs.readFileSync('./server/swagger/user.json', 'utf8'));

    const mergeDocs = (base, extra) => {
        base.paths = { ...(base.paths || {}), ...(extra.paths || {}) };
        const baseTags = base.tags || [];
        const extraTags = extra.tags || [];
        const mergedTags = [...baseTags, ...extraTags].reduce((acc, tag) => {
            if (!tag || !tag.name) return acc;
            if (acc.some(existing => existing.name === tag.name)) return acc;
            acc.push(tag);
            return acc;
        }, []);
        base.tags = mergedTags;
        return base;
    };

    mergeDocs(swaggerDocs, responseDocs);
    mergeDocs(swaggerDocs, formDocs);
    mergeDocs(swaggerDocs, questionDocs);
    mergeDocs(swaggerDocs, roleDocs);
    mergeDocs(swaggerDocs, userDocs);


    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
