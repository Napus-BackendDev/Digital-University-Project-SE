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
  sendResponse: (res, apiId, code, data) => res.status(200).json({
    apiId,
    code,
    data
  })
}));

jest.mock('../server/Project/Settings/setting.routes', () => {
  const express = require('express');
  return express.Router();
});

jest.mock('../server/Project/Form/controller/form', () => ({
  onAggregate: jest.fn().mockResolvedValue([{ _id: 'form1', title: 'Form 1' }]),
  onQuerys: jest.fn().mockResolvedValue([{ _id: 'form1' }, { _id: 'form2' }]),
  onCreate: jest.fn().mockResolvedValue({ _id: 'form1' }),
  onUpdate: jest.fn().mockResolvedValue({ _id: 'form1' }),
  onDelete: jest.fn().mockResolvedValue({ deletedCount: 1 })
}));

describe('Form API', () => {
  let app;
  const formId = '64e1f9f32a6d1c0013a1b234';

  beforeAll(() => {
    const createApp = require('../config/express');
    app = createApp();
  });

  it('GET /api/v1/form/exp returns code 20021', async () => {
    const res = await request(app)
      .get('/api/v1/form/exp');

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(21);
    expect(res.body.code).toBe(20021);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/form/get returns code 20022', async () => {
    const res = await request(app)
      .post('/api/v1/form/get')
      .query({ _id: formId });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(22);
    expect(res.body.code).toBe(20022);
    expect(res.body.data._id).toBe('form1');
  });

  it('POST /api/v1/form returns code 20023', async () => {
    const res = await request(app)
      .post('/api/v1/form')
      .send({ title: [{ key: 'en', value: 'Form' }] });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(23);
    expect(res.body.code).toBe(20023);
    expect(res.body.data._id).toBe('form1');
  });

  it('PUT /api/v1/form returns code 20024', async () => {
    const res = await request(app)
      .put('/api/v1/form')
      .send({ _id: formId, title: [{ key: 'en', value: 'Updated' }] });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(24);
    expect(res.body.code).toBe(20024);
    expect(res.body.data._id).toBe('form1');
  });

  it('DELETE /api/v1/form returns code 20025', async () => {
    const res = await request(app)
      .delete('/api/v1/form')
      .send({ _id: formId });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(25);
    expect(res.body.code).toBe(20025);
    expect(res.body.data.deletedCount).toBe(1);
  });
});
