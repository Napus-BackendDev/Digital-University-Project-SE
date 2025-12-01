// Import routes
const questionRoutes = require('../Project/Questions/questions.routes');

module.exports = function (app) {
    // Default route
    app.get('/', (req, res) => {
        res.json({
            message: 'Welcome to Digital University Project API',
            status: 'OK',
            timestamp: new Date()
        });
    });

    app.use('/question', questionRoutes);
    
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            message: 'Route not found',
            path: req.path
        });
    });
};
