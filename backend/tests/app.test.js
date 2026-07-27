const request = require('supertest');

const app = require('../src/index');
const { createApp } = require('../src/app');

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

  test('GET /health/ready reports canonical catalog metadata readiness', async () => {
    const readyApp = createApp({
      schemaReadinessService: {
        checkCatalogMetadataSchema: jest.fn(async () => true),
      },
    });
    const response = await request(readyApp).get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      checks: { catalogMetadata: 'ok' },
    });
  });

  test('GET /health/ready fails closed for an outdated catalog metadata schema', async () => {
    const outdatedApp = createApp({
      schemaReadinessService: {
        checkCatalogMetadataSchema: jest.fn(async () => false),
      },
    });
    const response = await request(outdatedApp).get('/health/ready');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 'not_ready',
      checks: { catalogMetadata: 'not_ready' },
    });
  });
});
