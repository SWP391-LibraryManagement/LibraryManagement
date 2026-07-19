process.env.JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');

const request = require('supertest');
const { createApp } = require('../src/app');

function makeApp({ roles = ['LIBRARIAN'] } = {}) {
  const authService = {
    authenticateToken: jest.fn(async () => ({ userId: 99, email: 'staff@example.test', roles })),
  };
  const fineManagementService = {
    listFines: jest.fn(async () => ({ fines: [{ fineId: 1, status: 'UNPAID' }] })),
  };
  return createApp({ authService, fineManagementService });
}

describe('FE09 canonical fine routes', () => {
  test('GET /api/fines requires staff authentication', async () => {
    expect((await request(makeApp()).get('/api/fines')).status).toBe(401);

    const member = await request(makeApp({ roles: ['MEMBER'] }))
      .get('/api/fines')
      .set('Authorization', 'Bearer token');
    expect(member.status).toBe(403);

    const staff = await request(makeApp())
      .get('/api/fines')
      .set('Authorization', 'Bearer token');
    expect(staff.status).toBe(200);
  });

  test.each([
    ['post', '/api/fines'],
    ['put', '/api/fines/10'],
    ['delete', '/api/fines/10'],
  ])('legacy %s %s mutation route is not registered', async (method, path) => {
    const response = await request(makeApp())[method](path)
      .set('Authorization', 'Bearer token')
      .send({ amount: 15000, status: 'PAID' });
    expect(response.status).toBe(404);
  });
});
