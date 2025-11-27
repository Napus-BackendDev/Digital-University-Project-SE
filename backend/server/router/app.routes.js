module.exports = function (app) {
    // Import routes here
    // const formRoutes = require('../Project/Form/form.routes');
    
    // Register routes
    // formRoutes(app);
    
    // Default route
    app.get('/', (req, res) => {
        res.json({
            message: 'Welcome to Digital University Project API',
            status: 'OK',
            timestamp: new Date()
        });
    });
    
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            message: 'Route not found',
            path: req.path
        });
    });
};
