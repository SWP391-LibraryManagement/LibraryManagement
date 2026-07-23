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
  test('GET /api/users/audit-logs is retired without invoking a service', async () => {
    const userManagementService = {
      listAuditLogs: jest.fn(),
      getUser: jest.fn(),
    };
    const app = makeApp({ userManagementService });

    const response = await request(app).get('/api/users/audit-logs');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(userManagementService.listAuditLogs).not.toHaveBeenCalled();
    expect(userManagementService.getUser).not.toHaveBeenCalled();
  });

  test('GET /api/users/audit-logs stays retired for non-Admin tokens', async () => {
    const userManagementService = { listAuditLogs: jest.fn(), getUser: jest.fn() };
    const app = makeApp({ roles: ['LIBRARIAN'], userManagementService });

    const response = await request(app)
      .get('/api/users/audit-logs')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(userManagementService.listAuditLogs).not.toHaveBeenCalled();
    expect(userManagementService.getUser).not.toHaveBeenCalled();
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
    expect(Object.keys(response.body).sort()).toEqual(['data', 'pagination']);
    expect(userManagementService.listUsers).toHaveBeenCalledWith(expect.objectContaining({ search: 'member' }));
  });

  test('GET /api/users normalizes the approved list query', async () => {
    const userManagementService = {
      listUsers: jest.fn(async () => ({
        data: [],
        pagination: { page: 2, limit: 50, total: 0, totalPages: 0 },
      })),
    };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .get('/api/users?page=2&limit=50&status=active&role=member&search=%20Alice%20')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(userManagementService.listUsers).toHaveBeenCalledWith({
      page: 2,
      limit: 50,
      status: 'ACTIVE',
      role: 'MEMBER',
      search: 'Alice',
    });
  });

  test.each([
    ['/api/users?page=0', 'page'],
    ['/api/users?page=1.5', 'page'],
    ['/api/users?page=abc', 'page'],
    ['/api/users?limit=0', 'limit'],
    ['/api/users?limit=101', 'limit'],
    ['/api/users?status=DELETED', 'status'],
    ['/api/users?role=GUEST', 'role'],
    [`/api/users?search=${'x'.repeat(201)}`, 'search'],
    ['/api/users?search=%20%20%20', 'search'],
  ])('GET %s rejects invalid %s', async (url, field) => {
    const userManagementService = { listUsers: jest.fn() };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .get(url)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })])
    );
    expect(userManagementService.listUsers).not.toHaveBeenCalled();
  });

  test('GET /api/users authorizes before validating the query', async () => {
    const userManagementService = { listUsers: jest.fn() };
    const app = makeApp({ roles: ['MEMBER'], userManagementService });

    const response = await request(app)
      .get('/api/users?page=0')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_REQUIRED');
    expect(userManagementService.listUsers).not.toHaveBeenCalled();
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

  test('GET /api/users/:userId passes a normalized positive ID', async () => {
    const detail = {
      userId: 7,
      email: 'detail@example.test',
      relatedSummary: {
        activeBorrowingCount: 1,
        unpaidFineTotal: 5000,
        openReservationCount: 2,
      },
    };
    const userManagementService = { getUser: jest.fn(async () => detail) };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .get('/api/users/7')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(detail);
    expect(userManagementService.getUser).toHaveBeenCalledWith(7);
  });

  test.each(['0', '-1', '1.5', 'not-a-user'])(
    'GET /api/users/%s rejects an invalid user ID',
    async (userId) => {
      const userManagementService = { getUser: jest.fn() };
      const app = makeApp({ userManagementService });

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(userManagementService.getUser).not.toHaveBeenCalled();
    }
  );

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
        email: '  NEW@example.test  ',
        username: '  new.librarian  ',
        fullName: '  New Librarian  ',
        type: ' LIBRARIAN ',
        phone: ' 0900000000 ',
        address: '  Main Library  ',
        department: '  Reference  ',
        specialization: '  Research Support  ',
        ignored: 'must not reach the service',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      userId: 2,
      status: 'INACTIVE',
      roles: ['LIBRARIAN'],
      setupDeliveryStatus: 'SENT',
    });
    expect(userManagementService.createUser).toHaveBeenCalledWith(
      {
        email: 'new@example.test',
        username: 'new.librarian',
        fullName: 'New Librarian',
        type: 'librarian',
        phone: '0900000000',
        address: 'Main Library',
        department: 'Reference',
        specialization: 'Research Support',
      },
      expect.objectContaining({ adminUserId: 99 })
    );
  });

  test.each([
    [{ type: 'guest', email: 'new@example.test', fullName: 'New User' }, 'type'],
    [{ type: 'member', email: 'invalid-email', fullName: 'New User' }, 'email'],
    [{ type: 'member', email: `${'a'.repeat(243)}@example.test`, fullName: 'New User' }, 'email'],
    [{ type: 'member', email: 'new@example.test', fullName: '' }, 'fullName'],
    [{ type: 'member', email: 'new@example.test', fullName: 'x'.repeat(101) }, 'fullName'],
    [{ type: 'member', email: 'new@example.test', fullName: 'New User', username: 'bad user' }, 'username'],
    [{ type: 'member', email: 'new@example.test', fullName: 'New User', phone: 'abc' }, 'phone'],
    [{ type: 'member', email: 'new@example.test', fullName: 'New User', address: 'x'.repeat(256) }, 'address'],
    [{ type: 'librarian', email: 'new@example.test', fullName: 'New User', department: 'x'.repeat(101) }, 'department'],
    [{ type: 'librarian', email: 'new@example.test', fullName: 'New User', specialization: 'x'.repeat(101) }, 'specialization'],
    [{ type: 'member', email: 'new@example.test', fullName: 'New User', department: 'Reference' }, 'department'],
    [{ type: 'member', email: 'new@example.test', fullName: 'New User', specialization: 'Research' }, 'specialization'],
  ])('POST /api/users rejects invalid create field %s', async (payload, field) => {
    const userManagementService = { createUser: jest.fn() };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer token')
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })])
    );
    expect(userManagementService.createUser).not.toHaveBeenCalled();
  });

  test('POST /api/users authorizes before validating an invalid body', async () => {
    const userManagementService = { createUser: jest.fn() };
    const app = makeApp({ roles: ['MEMBER'], userManagementService });

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', 'Bearer token')
      .send({ type: 'guest', email: 'invalid', fullName: '' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_REQUIRED');
    expect(userManagementService.createUser).not.toHaveBeenCalled();
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

  test('PUT /api/users/:userId passes normalized optimistic update data', async () => {
    const updatedUser = { userId: 7, roles: ['LIBRARIAN'], department: 'Reference' };
    const userManagementService = { updateUser: jest.fn(async () => updatedUser) };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .put('/api/users/7')
      .set('Authorization', 'Bearer token')
      .send({
        expectedUpdatedAt: '2026-07-19T08:00:00.000Z',
        department: ' Reference ',
        specialization: ' Research Support ',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatedUser);
    expect(userManagementService.updateUser).toHaveBeenCalledWith(
      7,
      {
        expectedUpdatedAt: new Date('2026-07-19T08:00:00.000Z'),
        department: 'Reference',
        specialization: 'Research Support',
      },
      expect.objectContaining({ adminUserId: 99 })
    );
  });

  test.each([
    ['0', { expectedUpdatedAt: '2026-07-19T08:00:00.000Z', department: 'Reference' }, 'userId'],
    ['7', { department: 'Reference' }, 'expectedUpdatedAt'],
    ['7', { expectedUpdatedAt: 'not-a-date', department: 'Reference' }, 'expectedUpdatedAt'],
    ['7', { expectedUpdatedAt: '2026-07-19T08:00:00.000Z' }, '_error'],
    ['7', { expectedUpdatedAt: '2026-07-19T08:00:00.000Z', department: 'x'.repeat(101) }, 'department'],
    ['7', { expectedUpdatedAt: '2026-07-19T08:00:00.000Z', specialization: 'x'.repeat(101) }, 'specialization'],
  ])('PUT /api/users/%s rejects invalid update payload', async (userId, payload, field) => {
    const userManagementService = { updateUser: jest.fn() };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', 'Bearer token')
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })])
    );
    expect(userManagementService.updateUser).not.toHaveBeenCalled();
  });

  test.each(['fullName', 'phone', 'address', 'email', 'unknownField'])(
    'PUT /api/users/:userId rejects forbidden existing-user field %s atomically',
    async (field) => {
      const userManagementService = { updateUser: jest.fn() };
      const app = makeApp({ userManagementService });

      const response = await request(app)
        .put('/api/users/7')
        .set('Authorization', 'Bearer token')
        .send({
          expectedUpdatedAt: '2026-07-19T08:00:00.000Z',
          department: 'Reference',
          [field]: field === 'email' ? 'unchanged@example.test' : 'forbidden',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('PERSONAL_PROFILE_ADMIN_FORBIDDEN');
      expect(userManagementService.updateUser).not.toHaveBeenCalled();
    }
  );

  test('PUT /api/users/:userId authorizes before validating the body', async () => {
    const userManagementService = { updateUser: jest.fn() };
    const app = makeApp({ roles: ['MEMBER'], userManagementService });

    const response = await request(app)
      .put('/api/users/0')
      .set('Authorization', 'Bearer token')
      .send({ expectedUpdatedAt: 'not-a-date' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_REQUIRED');
    expect(userManagementService.updateUser).not.toHaveBeenCalled();
  });

  test('PATCH /api/users/:userId/status passes normalized optimistic deactivation data', async () => {
    const deactivatedUser = { userId: 7, status: 'INACTIVE', roles: ['MEMBER'] };
    const userManagementService = { updateStatus: jest.fn(async () => deactivatedUser) };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .patch('/api/users/7/status')
      .set('Authorization', 'Bearer token')
      .send({
        status: ' inactive ',
        expectedUpdatedAt: '2026-07-19T08:00:00.000Z',
        ignored: 'must not reach service',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(deactivatedUser);
    expect(userManagementService.updateStatus).toHaveBeenCalledWith(
      7,
      {
        status: 'INACTIVE',
        expectedUpdatedAt: new Date('2026-07-19T08:00:00.000Z'),
      },
      expect.objectContaining({ adminUserId: 99 })
    );
  });

  test.each([
    ['0', { status: 'INACTIVE', expectedUpdatedAt: '2026-07-19T08:00:00.000Z' }, 'userId'],
    ['7', { status: 'ACTIVE', expectedUpdatedAt: '2026-07-19T08:00:00.000Z' }, 'status'],
    ['7', { status: 'INACTIVE' }, 'expectedUpdatedAt'],
    ['7', { status: 'INACTIVE', expectedUpdatedAt: 'not-a-date' }, 'expectedUpdatedAt'],
  ])('PATCH /api/users/%s/status rejects invalid deactivation payload', async (userId, payload, field) => {
    const userManagementService = { updateStatus: jest.fn() };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .patch(`/api/users/${userId}/status`)
      .set('Authorization', 'Bearer token')
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })])
    );
    expect(userManagementService.updateStatus).not.toHaveBeenCalled();
  });

  test('PATCH /api/users/:userId/status authorizes before validation', async () => {
    const userManagementService = { updateStatus: jest.fn() };
    const app = makeApp({ roles: ['MEMBER'], userManagementService });

    const response = await request(app)
      .patch('/api/users/0/status')
      .set('Authorization', 'Bearer token')
      .send({ status: 'ACTIVE', expectedUpdatedAt: 'not-a-date' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_REQUIRED');
    expect(userManagementService.updateStatus).not.toHaveBeenCalled();
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
