const request = require('supertest');

jest.mock('../helpers/initialize', () => ({
  init: (cb) => cb(true)
}));

jest.mock('../middleware/middlewares', () => (app) => {
  const express = require('express');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
});

jest.mock('../middleware/auth', () => ({
  requireAuth: (req, res, next) => next(),
  requireRole: () => (req, res, next) => next()
}));

jest.mock('../server/Project/Settings/service/message', () => ({
  sendResponse: (res, apiId, code, data) => res.status(code >= 40000 ? 404 : 200).json({
    apiId,
    code,
    data
  })
}));

jest.mock('../server/Project/Settings/setting.routes', () => {
  const express = require('express');
  return express.Router();
});

jest.mock('../server/Project/Role/controller/role', () => ({
  onQuery: jest.fn().mockResolvedValue({ _id: 'role1', name: 'ADMIN' }),
  onQuerys: jest.fn().mockResolvedValue([{ _id: 'role1', name: 'ADMIN' }, { _id: 'role2', name: 'STAFF' }]),
  onCreate: jest.fn().mockResolvedValue({ _id: 'role1', name: 'ADMIN' }),
  onUpdate: jest.fn().mockResolvedValue({ _id: 'role1', name: 'ADMIN' }),
  onDelete: jest.fn().mockResolvedValue({ deletedCount: 1 })
}));

describe('Role API', () => {
  let app;

  beforeAll(() => {
    const createApp = require('../config/express');
    app = createApp();
  });

  it('GET /api/v1/role/exp returns all roles', async () => {
    const res = await request(app).get('/api/v1/role/exp');
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(20031);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/role/get returns role by ID', async () => {
    const res = await request(app).post('/api/v1/role/get').query({ _id: '64e1f9f32a6d1c0013a1b234' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(20032);
    expect(res.body.data._id).toBe('role1');
  });

  it('POST /api/v1/role creates a new role', async () => {
    const res = await request(app).post('/api/v1/role').send({ name: 'ADMIN', description: 'Full access' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(20033);
  });

  it('PUT /api/v1/role updates a role', async () => {
    const res = await request(app).put('/api/v1/role').send({ _id: '64e1f9f32a6d1c0013a1b234', name: 'ADMIN' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(20034);
  });

  it('DELETE /api/v1/role deletes a role', async () => {
    const res = await request(app).delete('/api/v1/role').send({ _id: '64e1f9f32a6d1c0013a1b234' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(20035);
  });
});
