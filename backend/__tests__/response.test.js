const request = require('supertest');

jest.mock('../helpers/initialize', () => ({
  init: (cb) => cb(true)
}));

jest.mock('../middleware/middlewares', () => (app) => {
  const express = require('express');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
});

jest.mock('../server/Project/Settings/service/message', () => ({
  sendResponse: (res, apiId, code, data) => res.status(code === 40000 || code === 40400 ? 400 : 200).json({
    apiId,
    code,
    data
  })
}));

jest.mock('../server/Project/Response/controller/response', () => ({
  onQuerys: jest.fn().mockResolvedValue([{ _id: 'resp1', responder: { name: 'User' } }]),
  onQuery: jest.fn().mockResolvedValue({ _id: 'resp1', responder: { name: 'User' } }),
  onCreate: jest.fn().mockResolvedValue({ _id: 'resp1' }),
  onUpdate: jest.fn().mockResolvedValue({ _id: 'resp1' }),
  onDelete: jest.fn().mockResolvedValue({ deletedCount: 1 })
}));

jest.mock('../middleware/upload', () => ({
  single: () => (req, res, next) => next(),
  any: () => (req, res, next) => next()
}));

jest.mock('../server/Project/Response/models/response.model', () => ({
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([
        {
          _id: 'resp1',
          responder: { name: 'User' },
          submittedAt: new Date().toISOString(),
          getTimestamp: () => new Date().toISOString(),
          form: { title: 'Form Title' },
          answers: [
            {
              question: { _id: 'q1', title: 'Q1', type: 'text', order: 1 },
              response: 'A1'
            }
          ]
        }
      ])
    })
  })
}));

jest.mock('../server/Project/Settings/setting.routes', () => {
  const express = require('express');
  return express.Router();
});

describe('Response API', () => {
  let app;
  const formId = '64e1f9f32a6d1c0013a1b234';
  const responseId = '64e1f9f32a6d1c0013a1b777';

  beforeAll(() => {
    const createApp = require('../config/express');
    app = createApp();
  });

  it('GET /api/v1/response/exp returns code 20001', async () => {
    const res = await request(app)
      .get('/api/v1/response/exp');

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(1);
    expect(res.body.code).toBe(20001);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/response/get returns code 20002 with valid _id', async () => {
    const res = await request(app)
      .post('/api/v1/response/get')
      .send({ _id: responseId });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(2);
    expect(res.body.code).toBe(20002);
    expect(res.body.data._id).toBe('resp1');
  });

  it('POST /api/v1/response returns code 20003', async () => {
    const res = await request(app)
      .post('/api/v1/response')
      .send({ form: formId, answers: [{ question: 'q1', response: 'A1' }] });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(3);
    expect(res.body.code).toBe(20003);
    expect(res.body.data._id).toBe('resp1');
  });

  it('PUT /api/v1/response returns code 20004', async () => {
    const res = await request(app)
      .put('/api/v1/response')
      .send({ _id: responseId, answers: [{ question: 'q1', response: 'A2' }] });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(4);
    expect(res.body.code).toBe(20004);
    expect(res.body.data._id).toBe('resp1');
  });

  it('DELETE /api/v1/response returns code 20005', async () => {
    const res = await request(app)
      .delete('/api/v1/response')
      .send({ _id: responseId });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(5);
    expect(res.body.code).toBe(20005);
    expect(res.body.data.deletedCount).toBe(1);
  });
});
