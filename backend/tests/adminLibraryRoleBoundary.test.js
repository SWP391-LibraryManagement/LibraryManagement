const express = require('express');
const request = require('supertest');

const { createAdminRoutes } = require('../src/routes/adminRoutes');
const errorHandler = require('../src/middleware/errorHandler');

function makeApp(roleName, adminService) {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', createAdminRoutes({
    authService: {
      authenticateToken: jest.fn(async () => ({
        userId: 7,
        roles: [roleName],
      })),
    },
    adminService,
  }));
  app.use(errorHandler);
  return app;
}

test('Admin may manage author, publisher, and category reference data', async () => {
  const adminService = {
    listResource: jest.fn(async (resource) => ({ data: [{ id: 1, name: resource }] })),
  };

  for (const resource of ['authors', 'publishers', 'categories']) {
    const response = await request(makeApp('ADMIN', adminService))
      .get(`/api/admin/library/${resource}`)
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 1, name: resource }]);
  }
});

test.each(['LIBRARIAN', 'MEMBER'])(
  '%s cannot access Admin-only metadata management',
  async (roleName) => {
    const adminService = {
      listResource: jest.fn(async () => ({ data: [] })),
    };
    const response = await request(makeApp(roleName, adminService))
      .get('/api/admin/library/authors')
      .set('Authorization', `Bearer ${roleName.toLowerCase()}-token`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ROLE_REQUIRED');
    expect(adminService.listResource).not.toHaveBeenCalled();
  }
);
