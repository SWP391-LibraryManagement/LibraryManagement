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
    adminService,
    userManagementService: {},
  });
}

const payload = {
  roles: [
    { roleName: 'ADMIN', label: 'Admin' },
    { roleName: 'LIBRARIAN', label: 'Librarian' },
    { roleName: 'MEMBER', label: 'Member' },
  ],
  permissions: [
    {
      permissionKey: 'USER_VIEW',
      label: 'View users',
      moduleKey: 'USER_ROLE',
      moduleLabel: 'User & Role',
      allowedRoles: ['ADMIN'],
    },
  ],
};

test('GET /api/admin/permissions requires authentication before the controller', async () => {
  const adminService = { getPermissions: jest.fn(() => payload) };
  const response = await request(makeApp({ adminService }))
    .get('/api/admin/permissions');

  expect(response.status).toBe(401);
  expect(response.body.error.code).toBe('UNAUTHORIZED');
  expect(adminService.getPermissions).not.toHaveBeenCalled();
});

test.each([['MEMBER'], ['LIBRARIAN']])(
  'GET /api/admin/permissions rejects %s before the controller',
  async (roleName) => {
    const adminService = { getPermissions: jest.fn(() => payload) };
    const response = await request(makeApp({ roles: [roleName], adminService }))
      .get('/api/admin/permissions')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ROLE_REQUIRED');
    expect(adminService.getPermissions).not.toHaveBeenCalled();
  }
);

test('GET /api/admin/permissions returns the exact service payload to Admin', async () => {
  const adminService = { getPermissions: jest.fn(() => payload) };
  const response = await request(makeApp({ adminService }))
    .get('/api/admin/permissions')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(200);
  expect(adminService.getPermissions).toHaveBeenCalledWith();
  expect(response.body).toEqual(payload);
});
