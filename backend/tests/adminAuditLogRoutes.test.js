process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');

const request = require('supertest');
const { createApp } = require('../src/app');

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
    adminService: adminService || { listAuditLogs: jest.fn() },
    userManagementService: {},
  });
}

describe('FE11 Admin Audit Log route', () => {
  test('requires authentication before validating query details', async () => {
    const response = await request(makeApp()).get('/api/admin/audit-logs?page=0');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('requires Admin role before validating query details', async () => {
    const adminService = { listAuditLogs: jest.fn() };
    const response = await request(makeApp({ roles: ['MEMBER'], adminService }))
      .get('/api/admin/audit-logs?page=0')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ROLE_REQUIRED');
    expect(adminService.listAuditLogs).not.toHaveBeenCalled();
  });

  test('sends the normalized canonical query to the service', async () => {
    const payload = {
      data: [],
      pagination: { page: 2, limit: 50, total: 0, totalPages: 0 },
    };
    const adminService = { listAuditLogs: jest.fn(async () => payload) };
    const response = await request(makeApp({ adminService }))
      .get(
        '/api/admin/audit-logs?page=2&limit=50&q=%20login%20&action=%20AUTH_LOGIN_SUCCESS%20&actorId=7&from=2026-07-01&to=2026-07-18'
      )
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(adminService.listAuditLogs).toHaveBeenCalledWith({
      page: 2,
      limit: 50,
      q: 'login',
      action: 'AUTH_LOGIN_SUCCESS',
      actorId: 7,
      from: '2026-07-01',
      to: '2026-07-18',
    });
    expect(response.body).toEqual(payload);
  });

  test.each([
    ['/api/admin/audit-logs?page=0', 'page'],
    ['/api/admin/audit-logs?page=1.5', 'page'],
    ['/api/admin/audit-logs?limit=0', 'limit'],
    ['/api/admin/audit-logs?limit=101', 'limit'],
    ['/api/admin/audit-logs?q=%20%20', 'q'],
    [`/api/admin/audit-logs?q=${'x'.repeat(101)}`, 'q'],
    ['/api/admin/audit-logs?action=%20%20', 'action'],
    [`/api/admin/audit-logs?action=${'x'.repeat(101)}`, 'action'],
    ['/api/admin/audit-logs?actorId=0', 'actorId'],
    ['/api/admin/audit-logs?actorId=1.5', 'actorId'],
    ['/api/admin/audit-logs?from=2026-02-30', 'from'],
    ['/api/admin/audit-logs?to=18-07-2026', 'to'],
    ['/api/admin/audit-logs?from=2026-07-19&to=2026-07-18', 'to'],
  ])('rejects invalid audit query %s', async (url, field) => {
    const adminService = { listAuditLogs: jest.fn() };
    const response = await request(makeApp({ adminService }))
      .get(url)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })])
    );
    expect(adminService.listAuditLogs).not.toHaveBeenCalled();
  });
});
