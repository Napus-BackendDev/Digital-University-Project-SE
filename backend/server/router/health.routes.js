const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * @api {get} /api/v1/health Monitor System Health
 * @apiName GetHealth
 * @apiGroup Utility
 * @apiSuccess {String} status 'UP' if the system is running.
 * @apiSuccess {Number} uptime Process uptime in seconds.
 * @apiSuccess {Object} database Connection status of MongoDB.
 */
router.get('/', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    
    // Status mapping: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const isHealthy = dbStatus === 1;

    const healthInfo = {
        status: isHealthy ? 'UP' : 'DOWN',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
            status: isHealthy ? 'connected' : 'troubled',
            readyState: dbStatus
        },
        memory: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
        }
    };

    if (isHealthy) {
        res.status(200).json(healthInfo);
    } else {
        res.status(503).json(healthInfo);
    }
});

module.exports = router;
