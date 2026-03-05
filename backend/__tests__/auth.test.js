const request = require('supertest');

jest.mock('../helpers/initialize', () => ({
  init: (cb) => cb(true)
}));

jest.mock('../middleware/middlewares', () => (app) => {
  const express = require('express');
  const cookieParser = require('cookie-parser');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
});

jest.mock('../server/Project/Settings/setting.routes', () => {
  const express = require('express');
  return express.Router();
});

describe('Auth API', () => {
  let app;

  beforeAll(() => {
    const createApp = require('../config/express');
    app = createApp();
  });

  it('POST /auth/google with missing credential returns 400', async () => {
    const res = await request(app).post('/auth/google').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Missing credential/);
  });

  it('POST /auth/logout returns 200', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Logged out/);
  });

  it('GET /auth/me without cookie returns 401', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Not authenticated/);
  });
});
