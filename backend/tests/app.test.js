const request = require('supertest');
const fs = require('fs/promises');
const path = require('path');

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

  test('uploaded avatars can render from the frontend origin', async () => {
    const uploadDir = path.resolve(__dirname, '../uploads/avatars');
    const filename = 'app-static-avatar.test.png';
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), Buffer.from('avatar'));

    try {
      const response = await request(createApp()).get(`/uploads/avatars/${filename}`);

      expect(response.status).toBe(200);
      expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
    } finally {
      await fs.unlink(path.join(uploadDir, filename)).catch(() => undefined);
    }
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
