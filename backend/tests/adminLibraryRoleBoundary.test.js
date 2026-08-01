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

test('Admin metadata mutations pass trusted request audit context', async () => {
  const adminService = {
    createResource: jest.fn(async () => ({ data: { id: 1, name: 'Author' } })),
    updateResource: jest.fn(async () => ({ data: { id: 1, name: 'Updated' } })),
    deactivateResource: jest.fn(async () => ({ deactivated: true, data: { id: 1, status: 'INACTIVE' } })),
  };
  const app = makeApp('ADMIN', adminService);

  await request(app)
    .post('/api/admin/library/authors')
    .set('Authorization', 'Bearer admin-token')
    .set('User-Agent', 'catalog-audit-test')
    .send({ name: 'Author' })
    .expect(201);
  await request(app)
    .put('/api/admin/library/authors/1')
    .set('Authorization', 'Bearer admin-token')
    .set('User-Agent', 'catalog-audit-test')
    .send({ name: 'Updated' })
    .expect(200);
  await request(app)
    .patch('/api/admin/library/authors/1/deactivate')
    .set('Authorization', 'Bearer admin-token')
    .set('User-Agent', 'catalog-audit-test')
    .expect(200);

  const context = { actorId: 7, ip: expect.any(String), userAgent: 'catalog-audit-test' };
  expect(adminService.createResource).toHaveBeenCalledWith('authors', { name: 'Author' }, context);
  expect(adminService.updateResource).toHaveBeenCalledWith('authors', '1', { name: 'Updated' }, context);
  expect(adminService.deactivateResource).toHaveBeenCalledWith('authors', '1', context);
});
