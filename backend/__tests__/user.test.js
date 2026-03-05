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

jest.mock('../server/Project/User/controller/user', () => ({
  onQuery: jest.fn().mockResolvedValue({ _id: 'user1', name: 'Test User' }),
  onQuerys: jest.fn().mockResolvedValue([{ _id: 'user1' }, { _id: 'user2' }]),
  onUpdate: jest.fn().mockResolvedValue({ _id: 'user1', name: 'Updated User' }),
  onDelete: jest.fn().mockResolvedValue({ deletedCount: 1 })
}));

jest.mock('../server/Project/Role/models/role.model', () => ({
  find: jest.fn().mockResolvedValue([{ _id: 'role1', name: 'ADMIN' }])
}));

describe('User API', () => {
  let app;

  beforeAll(() => {
    const createApp = require('../config/express');
    app = createApp();
  });

  it('GET /api/v1/user/exp returns all users', async () => {
    const res = await request(app).get('/api/v1/user/exp');
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(20041);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/user/get returns user by ID', async () => {
    const res = await request(app).post('/api/v1/user/get').query({ _id: '64e1f9f32a6d1c0013a1b234' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(20042);
    expect(res.body.data._id).toBe('user1');
  });

  it('PUT /api/v1/user updates a user', async () => {
    const res = await request(app).put('/api/v1/user').send({ _id: '64e1f9f32a6d1c0013a1b234', name: 'Test' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(20044);
  });

  it('DELETE /api/v1/user deletes a user', async () => {
    const res = await request(app).delete('/api/v1/user').send({ _id: '64e1f9f32a6d1c0013a1b234' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(20045);
  });

  it('PUT /api/v1/user/assign-roles assigns roles', async () => {
    const res = await request(app).put('/api/v1/user/assign-roles').send({ _id: '64e1f9f32a6d1c0013a1b234', roles: ['role1'] });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(20046);
  });
});
