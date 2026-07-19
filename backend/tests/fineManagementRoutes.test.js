process.env.JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');

const request = require('supertest');
const { createApp } = require('../src/app');
const { createFineManagementService } = require('../src/services/fineManagementService');
const { makeInMemoryFineDependencies } = require('./helpers/inMemoryFineRepositories');

const FIXED_NOW = new Date('2026-06-15T00:00:00.000Z');
const MEMBER_ID = 101;
const OTHER_MEMBER_ID = 102;

// Token format understood by the stub auth service below: "<userId>:<ROLE>".
function token(userId, role) {
  return `${userId}:${role}`;
}

function makeApp({ borrowDetails = [], fines = [] } = {}) {
  const deps = makeInMemoryFineDependencies({ borrowDetails, fines });
  const authService = {
    authenticateToken: async (raw) => {
      const [userId, role] = String(raw).split(':');
      return { userId: Number(userId), email: `${userId}@example.test`, roles: [role] };
    },
  };
  const fineManagementService = createFineManagementService({
    fineRepository: deps.fineRepository,
    auditLogRepository: deps.auditLogRepository,
    clock: () => FIXED_NOW,
  });
  const app = createApp({ authService, fineManagementService });
  return { app, deps };
}

function overdueDetail(overrides = {}) {
  return {
    borrowDetailId: 7001,
    userId: MEMBER_ID,
    copyId: 1,
    dueDate: '2026-06-01',
    returnDate: '2026-06-08', // 7 days overdue
    detailStatus: 'RETURNED',
    barcode: 'BC1',
    bookTitle: 'Clean Code',
    email: 'member@example.test',
    username: 'member',
    ...overrides,
  };
}

function auth(userId, role) {
  return ['Authorization', `Bearer ${token(userId, role)}`];
}

describe('FE09 fine management (server-side)', () => {
  // AC-FE09-003: amount = overdue days * 5,000 VND, computed server-side.
  test('staff calculate creates an UNPAID fine equal to overdue days * 5000', async () => {
    const { app, deps } = makeApp({ borrowDetails: [overdueDetail()] });

    const response = await request(app)
      .post('/api/fines/calculate')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ borrowDetailId: 7001 });

    expect(response.status).toBe(201);
    expect(response.body.created).toBe(true);
    expect(response.body.overdueDays).toBe(7);
    expect(response.body.fine).toMatchObject({
      userId: MEMBER_ID,
      borrowDetailId: 7001,
      amount: 35000,
      status: 'UNPAID',
    });
    expect(deps.state.auditLogs.some((log) => log.action === 'FINE_CALCULATE')).toBe(true);
  });

  // AC-FE09-004 / EC-FE09-004: returned on or before due date → no overdue fine created.
  test('calculate creates no fine when the item is not overdue', async () => {
    const { app, deps } = makeApp({
      borrowDetails: [overdueDetail({ returnDate: '2026-06-01' })],
    });

    const response = await request(app)
      .post('/api/fines/calculate')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ borrowDetailId: 7001 });

    expect(response.status).toBe(200);
    expect(response.body.created).toBe(false);
    expect(response.body.fine).toBeNull();
    expect(deps.state.fines).toHaveLength(0);
  });

  // AC-FE09-005 / FR-FE09-006: a second calculation must not create a duplicate active fine.
  test('calculate is idempotent for the same borrow detail (no duplicate fine)', async () => {
    const { app, deps } = makeApp({ borrowDetails: [overdueDetail()] });

    const first = await request(app)
      .post('/api/fines/calculate')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ borrowDetailId: 7001 });
    const second = await request(app)
      .post('/api/fines/calculate')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ borrowDetailId: 7001 });

    expect(first.body.created).toBe(true);
    expect(second.status).toBe(200);
    expect(second.body.created).toBe(false);
    expect(second.body.fine.fineId).toBe(first.body.fine.fineId);
    expect(deps.state.fines).toHaveLength(1);
  });

  // FR-FE09-003 server-side: a client-supplied amount is ignored; amount comes from stored dates.
  test('calculate ignores a client-supplied amount and uses server-side data', async () => {
    const { app } = makeApp({ borrowDetails: [overdueDetail()] });

    const response = await request(app)
      .post('/api/fines/calculate')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ borrowDetailId: 7001, amount: 999999, overdueDays: 999 });

    expect(response.status).toBe(201);
    expect(response.body.fine.amount).toBe(35000);
    expect(response.body.overdueDays).toBe(7);
  });

  // EC-FE09-002: borrow detail does not exist → reject calculation.
  test('calculate rejects a non-existent borrow detail', async () => {
    const { app } = makeApp({ borrowDetails: [] });

    const response = await request(app)
      .post('/api/fines/calculate')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ borrowDetailId: 7001 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('BORROW_DETAIL_NOT_FOUND');
  });

  // AC-FE09-001 / NFR-FE09-SEC-002: a member sees only their own fines.
  test('member sees only their own fines via /fines/me', async () => {
    const { app } = makeApp({
      borrowDetails: [
        overdueDetail({ borrowDetailId: 7001, userId: MEMBER_ID }),
        overdueDetail({ borrowDetailId: 7002, userId: OTHER_MEMBER_ID, copyId: 2 }),
      ],
    });

    await request(app)
      .post('/api/fines/calculate')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ borrowDetailId: 7001 })
      .expect(201);
    await request(app)
      .post('/api/fines/calculate')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ borrowDetailId: 7002 })
      .expect(201);

    const mine = await request(app).get('/api/fines/me').set(...auth(MEMBER_ID, 'MEMBER'));

    expect(mine.status).toBe(200);
    expect(mine.body.fines).toHaveLength(1);
    expect(mine.body.fines[0].userId).toBe(MEMBER_ID);
  });

  // AC-FE09-008 / FR-FE09-009: a member cannot mark a fine paid.
  test('member cannot mark a fine paid', async () => {
    const fine = {
      fineId: 9100,
      userId: MEMBER_ID,
      borrowDetailId: 7001,
      overdueDays: 7,
      ratePerDay: 5000,
      amount: 35000,
      paidAmount: 0,
      reason: 'OVERDUE',
      status: 'UNPAID',
      calculatedAt: FIXED_NOW,
      paidAt: null,
    };
    const { app } = makeApp({ fines: [fine] });

    const response = await request(app)
      .patch('/api/fines/9100/paid')
      .set(...auth(MEMBER_ID, 'MEMBER'))
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ROLE_REQUIRED');
  });

  // AC-FE09-007 / FR-FE09-008: staff marks an UNPAID fine paid; status PAID + PaidAt set.
  test('staff marks an unpaid fine paid', async () => {
    const fine = {
      fineId: 9100,
      userId: MEMBER_ID,
      borrowDetailId: 7001,
      overdueDays: 7,
      ratePerDay: 5000,
      amount: 35000,
      paidAmount: 0,
      reason: 'OVERDUE',
      status: 'UNPAID',
      calculatedAt: FIXED_NOW,
      paidAt: null,
    };
    const { app, deps } = makeApp({ fines: [fine] });

    const response = await request(app)
      .patch('/api/fines/9100/paid')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ paymentMethod: 'CASH' });

    expect(response.status).toBe(200);
    expect(response.body.fine).toMatchObject({ status: 'PAID', paidAmount: 35000 });
    expect(response.body.fine.paidAt).toBeTruthy();
    expect(deps.state.auditLogs.some((log) => log.action === 'FINE_MARK_PAID')).toBe(true);

    // EC-FE09-009: a second paid action on a PAID fine is rejected.
    const again = await request(app)
      .patch('/api/fines/9100/paid')
      .set(...auth(99, 'LIBRARIAN'))
      .send({});
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('FINE_NOT_PAYABLE');
  });

  // AC-FE09-006 / FR-FE09-007 / INV-5: full collection marks PAID; partial keeps UNPAID.
  test('collection marks PAID only when fully collected', async () => {
    const baseFine = {
      fineId: 9100,
      userId: MEMBER_ID,
      borrowDetailId: 7001,
      overdueDays: 7,
      ratePerDay: 5000,
      amount: 35000,
      paidAmount: 0,
      reason: 'OVERDUE',
      status: 'UNPAID',
      calculatedAt: FIXED_NOW,
      paidAt: null,
    };

    const partialApp = makeApp({ fines: [{ ...baseFine }] });
    const partial = await request(partialApp.app)
      .post('/api/fines/9100/collections')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ collectedAmount: 20000 });
    expect(partial.status).toBe(400);
    expect(partial.body.error.code).toBe('COLLECTED_AMOUNT_NOT_ALLOWED');

    const fullApp = makeApp({ fines: [{ ...baseFine }] });
    const full = await request(fullApp.app)
      .post('/api/fines/9100/collections')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ paymentMethod: 'CASH' });
    expect(full.status).toBe(200);
    expect(full.body.fine).toMatchObject({ status: 'PAID', paidAmount: 35000 });

    // Phase 1 rejects every client-supplied amount, including over-collection.
    const overApp = makeApp({ fines: [{ ...baseFine }] });
    const over = await request(overApp.app)
      .post('/api/fines/9100/collections')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ collectedAmount: 99999 });
    expect(over.status).toBe(400);
    expect(over.body.error.code).toBe('COLLECTED_AMOUNT_NOT_ALLOWED');
  });

  // Q-FE09-005: only an admin can waive a fine; a librarian is rejected.
  test('admin can waive an unpaid fine but a librarian cannot', async () => {
    const fine = {
      fineId: 9100,
      userId: MEMBER_ID,
      borrowDetailId: 7001,
      overdueDays: 7,
      ratePerDay: 5000,
      amount: 35000,
      paidAmount: 0,
      reason: 'OVERDUE',
      status: 'UNPAID',
      calculatedAt: FIXED_NOW,
      paidAt: null,
    };

    const libApp = makeApp({ fines: [{ ...fine }] });
    const libResponse = await request(libApp.app)
      .patch('/api/fines/9100/waive')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ reason: 'goodwill' });
    expect(libResponse.status).toBe(403);
    expect(libResponse.body.error.code).toBe('ADMIN_ROLE_REQUIRED');

    const adminApp = makeApp({ fines: [{ ...fine }] });
    const missingReason = await request(adminApp.app)
      .patch('/api/fines/9100/waive')
      .set(...auth(1, 'ADMIN'))
      .send({});
    expect(missingReason.status).toBe(400);
    expect(missingReason.body.error.code).toBe('REASON_REQUIRED');

    const adminResponse = await request(adminApp.app)
      .patch('/api/fines/9100/waive')
      .set(...auth(1, 'ADMIN'))
      .send({ reason: 'goodwill' });
    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.fine.status).toBe('WAIVED');
    expect(adminApp.deps.state.auditLogs.some((log) => log.action === 'FINE_WAIVE')).toBe(true);
  });

  // NFR-FE09-SEC-002: a member cannot read another member's fine by id.
  test('member cannot read another member fine by id', async () => {
    const fine = {
      fineId: 9100,
      userId: OTHER_MEMBER_ID,
      borrowDetailId: 7002,
      overdueDays: 3,
      ratePerDay: 5000,
      amount: 15000,
      paidAmount: 0,
      reason: 'OVERDUE',
      status: 'UNPAID',
      calculatedAt: FIXED_NOW,
      paidAt: null,
    };
    const { app } = makeApp({ fines: [fine] });

    const response = await request(app).get('/api/fines/9100').set(...auth(MEMBER_ID, 'MEMBER'));

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FINE_OWNER_REQUIRED');
  });
});
