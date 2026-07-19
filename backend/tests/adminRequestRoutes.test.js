process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');

const path = require('path');
const YAML = require('yamljs');
const request = require('supertest');
const { createApp } = require('../src/app');

const openApiDocument = YAML.load(path.resolve(__dirname, '../src/docs/openapi.yaml'));

function makeApp({ roles = ['ADMIN'], adminService } = {}) {
  const authService = {
    authenticateToken: jest.fn(async () => ({
      userId: 99,
      email: 'admin@example.test',
      roles,
    })),
  };

  return createApp({
    authService,
    adminService: adminService || {
      listRequests: jest.fn(),
      getRequestDetail: jest.fn(),
    },
    userManagementService: {},
  });
}

describe('FE11 Admin Request Management routes', () => {
  test('authentication and Admin authorization run before request query validation', async () => {
    const adminService = { listRequests: jest.fn(), getRequestDetail: jest.fn() };
    const unauthenticated = await request(makeApp({ adminService }))
      .get('/api/admin/requests?page=0');
    expect(unauthenticated.status).toBe(401);
    expect(adminService.listRequests).not.toHaveBeenCalled();

    const forbidden = await request(makeApp({ roles: ['MEMBER'], adminService }))
      .get('/api/admin/requests?page=0')
      .set('Authorization', 'Bearer token');
    expect(forbidden.status).toBe(403);
    expect(adminService.listRequests).not.toHaveBeenCalled();
  });

  test('list route passes only the normalized canonical query to the service', async () => {
    const payload = {
      data: [],
      pagination: { page: 2, limit: 50, total: 0, totalPages: 0 },
    };
    const adminService = {
      listRequests: jest.fn(async () => payload),
      getRequestDetail: jest.fn(),
    };

    const response = await request(makeApp({ adminService }))
      .get('/api/admin/requests?page=2&limit=50&q=%20Clean%20&status=PENDING&from=2026-07-01&to=2026-07-19&ignored=value')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(adminService.listRequests).toHaveBeenCalledWith({
      page: 2,
      limit: 50,
      q: 'Clean',
      status: 'PENDING',
      from: '2026-07-01',
      to: '2026-07-19',
    });
    expect(response.body).toEqual(payload);
  });

  test.each([
    ['/api/admin/requests?page=0', 'page'],
    ['/api/admin/requests?page=1.5', 'page'],
    ['/api/admin/requests?limit=0', 'limit'],
    ['/api/admin/requests?limit=101', 'limit'],
    ['/api/admin/requests?q=%20%20', 'q'],
    [`/api/admin/requests?q=${'x'.repeat(101)}`, 'q'],
    ['/api/admin/requests?status=UNKNOWN', 'status'],
    ['/api/admin/requests?from=2026-02-30', 'from'],
    ['/api/admin/requests?to=19-07-2026', 'to'],
    ['/api/admin/requests?from=2026-07-20&to=2026-07-19', 'to'],
  ])('rejects invalid list query %s before service execution', async (url, field) => {
    const adminService = { listRequests: jest.fn(), getRequestDetail: jest.fn() };
    const response = await request(makeApp({ adminService }))
      .get(url)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })])
    );
    expect(adminService.listRequests).not.toHaveBeenCalled();
  });

  test('detail route authorizes before ID validation and passes a numeric ID', async () => {
    const payload = { requestId: 25, status: 'PENDING', items: [] };
    const adminService = {
      listRequests: jest.fn(),
      getRequestDetail: jest.fn(async () => payload),
    };

    const forbidden = await request(makeApp({ roles: ['MEMBER'], adminService }))
      .get('/api/admin/requests/not-an-id')
      .set('Authorization', 'Bearer token');
    expect(forbidden.status).toBe(403);
    expect(adminService.getRequestDetail).not.toHaveBeenCalled();

    const invalid = await request(makeApp({ adminService }))
      .get('/api/admin/requests/0')
      .set('Authorization', 'Bearer token');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    expect(adminService.getRequestDetail).not.toHaveBeenCalled();

    const response = await request(makeApp({ adminService }))
      .get('/api/admin/requests/25')
      .set('Authorization', 'Bearer token');
    expect(response.status).toBe(200);
    expect(adminService.getRequestDetail).toHaveBeenCalledWith(25);
    expect(response.body).toEqual(payload);
  });

  test('OpenAPI documents canonical Admin request list and detail reads', () => {
    const listOperation = openApiDocument.paths['/api/admin/requests'].get;
    const detailOperation = openApiDocument.paths['/api/admin/requests/{requestId}'].get;

    expect(listOperation.parameters.map((parameter) => parameter.name)).toEqual([
      'page', 'limit', 'q', 'status', 'from', 'to',
    ]);
    expect(listOperation.responses['200'].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/AdminRequestListResponse',
    });
    expect(detailOperation.parameters).toEqual([
      expect.objectContaining({ name: 'requestId', in: 'path', required: true }),
    ]);
    expect(detailOperation.responses['200'].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/AdminRequestDetail',
    });
  });
});
