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

jest.mock('../server/Project/Questions/controller/questions', () => ({
  onQuery: jest.fn().mockResolvedValue({ _id: 'q1', title: 'Question 1' }),
  onQuerys: jest.fn().mockResolvedValue([{ _id: 'q1' }, { _id: 'q2' }]),
  onCreate: jest.fn().mockResolvedValue({ _id: 'q1', title: 'Question 1' }),
  onUpdate: jest.fn().mockResolvedValue({ _id: 'q1', title: 'Question 1 updated' }),
  onDelete: jest.fn().mockResolvedValue({ deletedCount: 1 })
}));

describe('Question API', () => {
  let app;
  const questionId = '64e1f9f32a6d1c0013a1b111';

  beforeAll(() => {
    const createApp = require('../config/express');
    app = createApp();
  });

  it('GET /api/v1/question/id returns code 20011', async () => {
    const res = await request(app)
      .get('/api/v1/question/id')
      .query({ _id: questionId });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(11);
    expect(res.body.code).toBe(20011);
    expect(res.body.data._id).toBe('q1');
  });

  it('GET /api/v1/question returns code 20012', async () => {
    const res = await request(app)
      .get('/api/v1/question');

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(12);
    expect(res.body.code).toBe(20012);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/question returns code 20013', async () => {
    const res = await request(app)
      .post('/api/v1/question')
      .send({ form: 'form1', type: 'text' });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(13);
    expect(res.body.code).toBe(20013);
    expect(res.body.data._id).toBe('q1');
  });

  it('PUT /api/v1/question returns code 20014', async () => {
    const res = await request(app)
      .put('/api/v1/question')
      .send({ _id: questionId, title: 'Question 1 updated' });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(14);
    expect(res.body.code).toBe(20014);
    expect(res.body.data._id).toBe('q1');
  });

  it('DELETE /api/v1/question returns code 20015', async () => {
    const res = await request(app)
      .delete('/api/v1/question')
      .send({ _id: questionId });

    expect(res.status).toBe(200);
    expect(res.body.apiId).toBe(15);
    expect(res.body.code).toBe(20015);
    expect(res.body.data.deletedCount).toBe(1);
  });
});
