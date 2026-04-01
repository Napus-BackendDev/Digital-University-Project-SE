const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const healthRoutes = require('../server/router/health.routes');

const app = express();
app.use('/api/v1/health', healthRoutes);

describe('GET /api/v1/health', () => {
    it('should return 200 OK and valid health info when DB is connected', async () => {
        // Mock mongoose connection state (1 = connected)
        const originalReadyState = mongoose.connection.readyState;
        Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

        const res = await request(app).get('/api/v1/health');
        
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('UP');
        expect(res.body.database.status).toBe('connected');
        expect(res.body).toHaveProperty('uptime');

        // Restore original readyState
        Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    });

    it('should return 503 and DOWN when DB is disconnected', async () => {
        // Mock mongoose connection state (0 = disconnected)
        const originalReadyState = mongoose.connection.readyState;
        Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });

        const res = await request(app).get('/api/v1/health');
        
        expect(res.status).toBe(503);
        expect(res.body.status).toBe('DOWN');
        expect(res.body.database.status).toBe('troubled');

        // Restore original readyState
        Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    });
});
