const request = require('supertest');
const app = require('../src/index');

describe('fine routes', () => {
  test('GET /api/fines returns fine list', async () => {
    const response = await request(app).get('/api/fines');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('creates, updates, and deletes a fine with validation', async () => {
    const payload = {
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
    };

    const createResponse = await request(app).post('/api/fines').send(payload);
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.fineId).toBeGreaterThan(0);

    const duplicateResponse = await request(app).post('/api/fines').send(payload);
    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.error.code).toBe('DUPLICATE_FINE');

    const fineId = createResponse.body.data.fineId;
    const updateResponse = await request(app)
      .put(`/api/fines/${fineId}`)
      .send({ ...payload, status: 'PAID' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.status).toBe('PAID');
    expect(updateResponse.body.data.paidAmount).toBe(15000);

    const deleteResponse = await request(app).delete(`/api/fines/${fineId}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.fineId).toBe(fineId);
  });

  test('rejects zero and negative numeric fine fields', async () => {
    const payload = {
      userId: 778,
      memberName: 'Invalid Number Member',
      memberCode: 'USR-7788',
      email: 'invalid.number@example.test',
      borrowDetailId: 7788,
      bookTitle: 'Invalid Numbers',
      barcode: 'BC-INV-778',
      dueDate: '2026-06-01',
      returnDate: '2026-06-04',
      overdueDays: 0,
      ratePerDay: 5000,
      amount: 15000,
      status: 'UNPAID',
    };

    const zeroDaysResponse = await request(app).post('/api/fines').send(payload);
    expect(zeroDaysResponse.status).toBe(400);
    expect(zeroDaysResponse.body.error.code).toBe('INVALID_FINE_FIELD');

    const negativeAmountResponse = await request(app)
      .post('/api/fines')
      .send({ ...payload, overdueDays: 3, amount: -1 });
    expect(negativeAmountResponse.status).toBe(400);
    expect(negativeAmountResponse.body.error.code).toBe('INVALID_FINE_FIELD');

    const zeroUserResponse = await request(app)
      .post('/api/fines')
      .send({ ...payload, userId: 0, overdueDays: 3, amount: 15000 });
    expect(zeroUserResponse.status).toBe(400);
    expect(zeroUserResponse.body.error.code).toBe('INVALID_FINE_FIELD');
  });
});
