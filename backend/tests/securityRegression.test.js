process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');

jest.mock('../src/controllers/bookController', () => {
  const ok = (req, res) => res.status(200).json({ ok: true });

  return {
    getHomeBooks: ok,
    getCategories: ok,
    getMetadata: ok,
    getManagementBooks: ok,
    getBookById: ok,
    createBook: (req, res) => res.status(201).json({ ok: true }),
    updateBook: ok,
    deactivateBook: ok,
    updateBookAvailability: ok,
  };
});

const request = require('supertest');
const { createApp } = require('../src/app');

const originalNodeEnv = process.env.NODE_ENV;
const originalCorsOrigins = process.env.CORS_ORIGINS;

function makeApp({ adminService } = {}) {
  return createApp({
    authService: {
      authenticateToken: jest.fn(async () => ({ userId: 1, roles: ['ADMIN'] })),
    },
    adminService: adminService || {
      getDashboard: jest.fn(async () => ({ ok: true })),
    },
    userManagementService: {
      listUsers: jest.fn(async () => ({ data: [], pagination: {} })),
    },
  });
}

describe('security regressions', () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (originalCorsOrigins === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = originalCorsOrigins;
    }
    jest.restoreAllMocks();
  });

  test('admin routes require authentication when NODE_ENV is unset', async () => {
    const response = await request(makeApp()).get('/api/admin/dashboard');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('user management routes require authentication when NODE_ENV is unset', async () => {
    const response = await request(makeApp()).get('/api/users');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('book management routes require authentication when NODE_ENV is unset', async () => {
    const response = await request(makeApp()).post('/api/books').send({ title: 'Protected book' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('5xx responses do not expose internal error details', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const internalError = Object.assign(new Error('Sensitive internal failure'), {
      details: { diagnostic: 'Sensitive backend detail' },
    });
    const app = makeApp({
      adminService: {
        getDashboard: jest.fn(async () => {
          throw internalError;
        }),
      },
    });

    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      },
    });
  });

  test('5xx server logs omit raw errors, stacks, and query-string personal data', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const app = makeApp({
      adminService: {
        getDashboard: jest.fn(async () => {
          throw new Error('sensitive-internal-marker C:\\private\\database.sql');
        }),
      },
    });

    const response = await request(app)
      .get('/api/admin/dashboard?email=member@example.test')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(500);
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).toContain('/api/admin/dashboard');
    expect(logged).not.toContain('sensitive-internal-marker');
    expect(logged).not.toContain('database.sql');
    expect(logged).not.toContain('member@example.test');
    expect(logged).not.toContain('stack');
  });

  test('production CORS does not allow an unconfigured origin', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://library.example.test';

    const response = await request(makeApp())
      .get('/health')
      .set('Origin', 'https://untrusted.example.test');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('production CORS allows an explicitly configured origin', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://library.example.test, https://admin.example.test';

    const response = await request(makeApp())
      .get('/health')
      .set('Origin', 'https://admin.example.test');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('https://admin.example.test');
  });
});
