process.env.JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');

const request = require('supertest');
const { createApp } = require('../src/app');

function makeApp({ roles = ['LIBRARIAN'] } = {}) {
  const authService = {
    authenticateToken: jest.fn(async () => ({
      userId: 99,
      email: 'staff@example.test',
      roles,
    })),
  };

  const fineManagementService = {
    listFines: jest.fn(async () => ({ fines: [{ fineId: 1, status: 'UNPAID' }] })),
  };

  return createApp({ authService, fineManagementService });
}

function staffPayload(overrides = {}) {
  return {
    userId: 777,
    memberName: 'Test Member',
    memberCode: 'USR-7777',
    email: 'test.member@example.test',
    borrowDetailId: 7777,
    bookTitle: 'Testing Library',
    barcode: 'BC-TST-777',
    dueDate: '2026-06-01',
    returnDate: '2026-06-04',
    overdueDays: 3,
    ratePerDay: 5000,
    amount: 15000,
    status: 'UNPAID',
    ...overrides,
  };
}

describe('fine routes', () => {
  test('GET /api/fines requires authentication', async () => {
    const app = makeApp();
    const response = await request(app).get('/api/fines');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /api/fines rejects non-staff roles', async () => {
    const app = makeApp({ roles: ['MEMBER'] });
    const response = await request(app)
      .get('/api/fines')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ROLE_REQUIRED');
  });

  test('GET /api/fines returns fine list for staff', async () => {
    const app = makeApp();
    const response = await request(app)
      .get('/api/fines')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.fines.length).toBeGreaterThan(0);
  });

  test('creates, updates, and deletes a fine with validation', async () => {
    const app = makeApp();
    const payload = staffPayload({ borrowDetailId: 7790 });

    const createResponse = await request(app)
      .post('/api/fines')
      .set('Authorization', 'Bearer token')
      .send(payload);
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.fineId).toBeGreaterThan(0);
    expect(createResponse.body.data.status).toBe('UNPAID');

    const duplicateResponse = await request(app)
      .post('/api/fines')
      .set('Authorization', 'Bearer token')
      .send(payload);
    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.error.code).toBe('DUPLICATE_FINE');

    const fineId = createResponse.body.data.fineId;
    const updateResponse = await request(app)
      .put(`/api/fines/${fineId}`)
      .set('Authorization', 'Bearer token')
      .send({ status: 'PAID' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.status).toBe('PAID');
    expect(updateResponse.body.data.paidAmount).toBe(15000);

    const deleteResponse = await request(app)
      .delete(`/api/fines/${fineId}`)
      .set('Authorization', 'Bearer token');
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.fineId).toBe(fineId);
  });

  test('rejects changing the amount after creation (amount immutable)', async () => {
    const app = makeApp();
    const createResponse = await request(app)
      .post('/api/fines')
      .set('Authorization', 'Bearer token')
      .send(staffPayload({ borrowDetailId: 7791 }));
    const fineId = createResponse.body.data.fineId;

    const response = await request(app)
      .put(`/api/fines/${fineId}`)
      .set('Authorization', 'Bearer token')
      .send({ amount: 99000 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('FINE_AMOUNT_IMMUTABLE');
  });

  test('rejects modifying a fine already in a terminal state (no double collection)', async () => {
    const app = makeApp();
    const createResponse = await request(app)
      .post('/api/fines')
      .set('Authorization', 'Bearer token')
      .send(staffPayload({ borrowDetailId: 7792 }));
    const fineId = createResponse.body.data.fineId;

    const paid = await request(app)
      .put(`/api/fines/${fineId}`)
      .set('Authorization', 'Bearer token')
      .send({ status: 'PAID' });
    expect(paid.status).toBe(200);

    const reCollect = await request(app)
      .put(`/api/fines/${fineId}`)
      .set('Authorization', 'Bearer token')
      .send({ status: 'PAID' });
    expect(reCollect.status).toBe(409);
    expect(reCollect.body.error.code).toBe('FINE_NOT_EDITABLE');
  });

  test('rejects zero and negative numeric fine fields', async () => {
    const app = makeApp();
    const base = staffPayload({ borrowDetailId: 7793 });

    const zeroDaysResponse = await request(app)
      .post('/api/fines')
      .set('Authorization', 'Bearer token')
      .send({ ...base, overdueDays: 0 });
    expect(zeroDaysResponse.status).toBe(400);
    expect(zeroDaysResponse.body.error.code).toBe('INVALID_FINE_FIELD');

    const negativeAmountResponse = await request(app)
      .post('/api/fines')
      .set('Authorization', 'Bearer token')
      .send({ ...base, amount: -1 });
    expect(negativeAmountResponse.status).toBe(400);
    expect(negativeAmountResponse.body.error.code).toBe('INVALID_FINE_FIELD');

    const zeroUserResponse = await request(app)
      .post('/api/fines')
      .set('Authorization', 'Bearer token')
      .send({ ...base, userId: 0 });
    expect(zeroUserResponse.status).toBe(400);
    expect(zeroUserResponse.body.error.code).toBe('INVALID_FINE_FIELD');
  });
});
