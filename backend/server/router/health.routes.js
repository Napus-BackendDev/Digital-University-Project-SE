const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

let isReady = false;

// Warming up for 10 seconds
setTimeout(() => {
    isReady = true;
}, 10000);

// GET /healthz - readiness probe
router.get("/healthz", (req, res) => {
    if (isReady) {
        res.status(200).send("OK");
    } else {
        res.status(503).send("Service Unavailable");
    }
});

// GET /api/v1/health - detailed health status
router.get("/api/v1/health", (req, res) => {
    const dbStateNum = mongoose.connection.readyState;
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };

    const healthReport = {
        status: isReady && dbStateNum === 1 ? "healthy" : "unhealthy",
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        mongodb: {
            state: states[dbStateNum] || "unknown",
            connected: dbStateNum === 1
        }
    };

    res.status(200).json(healthReport);
});

module.exports = router;
