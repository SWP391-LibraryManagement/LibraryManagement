const request = require('supertest');

const app = require('../src/index');

describe('backend app foundation routes', () => {
  test('GET / returns backend status message', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Library Management backend is running',
      status: 'ok',
    });
  });

  test('GET /health returns health payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.uptime).toBe('number');
  });
});
