process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');

const request = require('supertest');
const { createApp } = require('../src/app');

function makeApp({ roles = ['ADMIN'], userManagementService } = {}) {
  const authService = {
    authenticateToken: jest.fn(async () => ({
      userId: 99,
      email: 'admin@example.test',
      roles,
    })),
  };

  return createApp({
    authService,
    userManagementService: userManagementService || {
      listUsers: jest.fn(async () => ({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })),
      getUser: jest.fn(),
      createUser: jest.fn(),
      resendSetup: jest.fn(),
      updateUser: jest.fn(),
      updateStatus: jest.fn(),
      assignRole: jest.fn(),
      revokeRole: jest.fn(),
    },
  });
}

describe('FE11 user management routes', () => {
  test('GET /api/users/audit-logs returns paginated audit data for Admin', async () => {
    const userManagementService = {
      listAuditLogs: jest.fn(async () => ({
        data: [{ logId: 11, action: 'USER_UPDATE', targetType: 'USER', targetId: 2 }],
        pagination: { page: 2, limit: 8, total: 12, totalPages: 2 },
      })),
    };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .get('/api/users/audit-logs?page=2&limit=8')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({ page: 2, limit: 8, total: 12, totalPages: 2 });
    expect(userManagementService.listAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ page: '2', limit: '8' })
    );
  });

  test('GET /api/users/audit-logs rejects non-Admin roles', async () => {
    const userManagementService = { listAuditLogs: jest.fn() };
    const app = makeApp({ roles: ['LIBRARIAN'], userManagementService });

    const response = await request(app)
      .get('/api/users/audit-logs')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(userManagementService.listAuditLogs).not.toHaveBeenCalled();
  });

  test('GET /api/users returns paginated users from service', async () => {
    const userManagementService = {
      listUsers: jest.fn(async () => ({
        data: [{ userId: 1, email: 'member@example.test', roles: ['MEMBER'], status: 'INACTIVE' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })),
    };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .get('/api/users?search=member')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(userManagementService.listUsers).toHaveBeenCalledWith(expect.objectContaining({ search: 'member' }));
  });

  test('GET /api/users requires authentication', async () => {
    const app = makeApp();

    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /api/users requires Admin role', async () => {
    const app = makeApp({ roles: ['MEMBER'] });

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_REQUIRED');
  });

  test('GET /api/users/:userId requires Admin role', async () => {
    const app = makeApp({ roles: ['MEMBER'] });

    const response = await request(app)
      .get('/api/users/1')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_REQUIRED');
  });

  test('POST /api/users still requires authentication', async () => {
    const app = makeApp();

    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'new@example.test',
        fullName: 'New Librarian',
        type: 'librarian',
      });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('POST /api/users requires Admin role', async () => {
    const app = makeApp({ roles: ['MEMBER'] });

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer token')
      .send({
        email: 'new@example.test',
        fullName: 'New Librarian',
        type: 'librarian',
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_REQUIRED');
  });

  test('POST /api/users passes admin context and payload to service', async () => {
    const userManagementService = {
      createUser: jest.fn(async () => ({
        userId: 2,
        email: 'new@example.test',
        status: 'INACTIVE',
        roles: ['LIBRARIAN'],
        setupDeliveryStatus: 'SENT',
        message: 'User created. Password setup email sent.',
      })),
    };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer token')
      .send({
        email: 'new@example.test',
        fullName: 'New Librarian',
        type: 'librarian',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      userId: 2,
      status: 'INACTIVE',
      roles: ['LIBRARIAN'],
      setupDeliveryStatus: 'SENT',
    });
    expect(userManagementService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.test' }),
      expect.objectContaining({ adminUserId: 99 })
    );
  });

  test('POST /api/users/:userId/resend-setup passes validated target and Admin context', async () => {
    const userManagementService = {
      resendSetup: jest.fn(async () => ({
        userId: 2,
        status: 'INACTIVE',
        setupDeliveryStatus: 'SENT',
        message: 'Password setup email sent.',
      })),
    };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .post('/api/users/2/resend-setup')
      .set('Authorization', 'Bearer token')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      userId: 2,
      status: 'INACTIVE',
      setupDeliveryStatus: 'SENT',
      message: 'Password setup email sent.',
    });
    expect(userManagementService.resendSetup).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ adminUserId: 99 })
    );
  });

  test('POST /api/users/:userId/resend-setup requires authentication', async () => {
    const userManagementService = { resendSetup: jest.fn() };
    const app = makeApp({ userManagementService });

    const response = await request(app).post('/api/users/2/resend-setup').send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(userManagementService.resendSetup).not.toHaveBeenCalled();
  });

  test('POST /api/users/:userId/resend-setup requires Admin role', async () => {
    const userManagementService = { resendSetup: jest.fn() };
    const app = makeApp({ roles: ['LIBRARIAN'], userManagementService });

    const response = await request(app)
      .post('/api/users/2/resend-setup')
      .set('Authorization', 'Bearer token')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_REQUIRED');
    expect(userManagementService.resendSetup).not.toHaveBeenCalled();
  });

  test.each(['0', '-1', 'not-a-user'])('rejects invalid resend target %s', async (userId) => {
    const userManagementService = { resendSetup: jest.fn() };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .post(`/api/users/${userId}/resend-setup`)
      .set('Authorization', 'Bearer token')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'userId',
          message: 'User ID must be a positive integer.',
        }),
      ])
    );
    expect(userManagementService.resendSetup).not.toHaveBeenCalled();
  });

  test('POST /api/users/:userId/roles passes normalized IDs and Admin context', async () => {
    const updatedUser = { userId: 7, roles: ['LIBRARIAN', 'MEMBER'] };
    const userManagementService = { assignRole: jest.fn(async () => updatedUser) };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .post('/api/users/7/roles')
      .set('Authorization', 'Bearer token')
      .send({ roleId: 3 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatedUser);
    expect(userManagementService.assignRole).toHaveBeenCalledWith(
      7,
      { roleId: 3 },
      expect.objectContaining({ adminUserId: 99 })
    );
  });

  test('DELETE /api/users/:userId/roles/:roleId passes normalized IDs and Admin context', async () => {
    const updatedUser = { userId: 7, roles: ['MEMBER'] };
    const userManagementService = { revokeRole: jest.fn(async () => updatedUser) };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .delete('/api/users/7/roles/3')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatedUser);
    expect(userManagementService.revokeRole).toHaveBeenCalledWith(
      7,
      3,
      expect.objectContaining({ adminUserId: 99 })
    );
  });

  test.each(['0', '-1', 'not-a-user'])(
    'rejects invalid role-assignment target %s',
    async (userId) => {
      const userManagementService = { assignRole: jest.fn() };
      const app = makeApp({ userManagementService });

      const response = await request(app)
        .post(`/api/users/${userId}/roles`)
        .set('Authorization', 'Bearer token')
        .send({ roleId: 3 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'userId',
            message: 'User ID must be a positive integer.',
          }),
        ])
      );
      expect(userManagementService.assignRole).not.toHaveBeenCalled();
    }
  );

  test.each([
    ['zero', { roleId: 0 }, 'Role ID must be a positive integer.'],
    ['negative', { roleId: -1 }, 'Role ID must be a positive integer.'],
    ['missing', {}, 'Role ID is required.'],
  ])('rejects %s assignment role ID', async (_, body, message) => {
    const userManagementService = { assignRole: jest.fn() };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .post('/api/users/7/roles')
      .set('Authorization', 'Bearer token')
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'roleId',
          message,
        }),
      ])
    );
    expect(userManagementService.assignRole).not.toHaveBeenCalled();
  });

  test.each(['0', '-1', 'not-a-role'])(
    'rejects invalid revocation role %s',
    async (roleId) => {
      const userManagementService = { revokeRole: jest.fn() };
      const app = makeApp({ userManagementService });

      const response = await request(app)
        .delete(`/api/users/7/roles/${roleId}`)
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'roleId',
            message: 'Role ID must be a positive integer.',
          }),
        ])
      );
      expect(userManagementService.revokeRole).not.toHaveBeenCalled();
    }
  );

  test('keeps Admin authorization ahead of role body validation', async () => {
    const userManagementService = { assignRole: jest.fn() };
    const app = makeApp({ roles: ['MEMBER'], userManagementService });

    const response = await request(app)
      .post('/api/users/7/roles')
      .set('Authorization', 'Bearer token')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_REQUIRED');
    expect(userManagementService.assignRole).not.toHaveBeenCalled();
  });
});
