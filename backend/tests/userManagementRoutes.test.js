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
      updateUser: jest.fn(),
      updateStatus: jest.fn(),
      assignRole: jest.fn(),
      revokeRole: jest.fn(),
    },
  });
}

describe('FE11 user management routes', () => {
  test('GET /api/users returns paginated users from service', async () => {
    const userManagementService = {
      listUsers: jest.fn(async () => ({
        data: [{ userId: 1, email: 'member@example.test', roles: ['MEMBER'], status: 'INACTIVE' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })),
    };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .get('/api/users?search=member');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(userManagementService.listUsers).toHaveBeenCalledWith(expect.objectContaining({ search: 'member' }));
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
    });
    expect(userManagementService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.test' }),
      expect.objectContaining({ adminUserId: 99 })
    );
  });
});
