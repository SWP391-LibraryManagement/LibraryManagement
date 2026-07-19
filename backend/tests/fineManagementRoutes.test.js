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

function makeApp({ borrowDetails = [], fines = [], clock = () => FIXED_NOW, dependencyOptions } = {}) {
  const deps = makeInMemoryFineDependencies({ borrowDetails, fines }, dependencyOptions);
  const authService = {
    authenticateToken: async (raw) => {
      const [userId, role] = String(raw).split(':');
      return { userId: Number(userId), email: `${userId}@example.test`, roles: [role] };
    },
  };
  const fineManagementService = createFineManagementService({
    fineRepository: deps.fineRepository,
    auditLogRepository: deps.auditLogRepository,
    clock,
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

function unpaidFine(overrides = {}) {
  return {
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
    createdBy: 99,
    collectedBy: null,
    paymentMethod: null,
    member: {
      userId: MEMBER_ID,
      username: 'member',
      email: 'member@example.test',
      fullName: 'Test Member',
    },
    bookTitle: 'Clean Code',
    barcode: 'BC1',
    ...overrides,
  };
}

function auth(userId, role) {
  return ['Authorization', `Bearer ${token(userId, role)}`];
}

describe('FE09 fine management (server-side)', () => {
  // @spec AC-FE09-003
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

  // @spec AC-FE09-004 EC-FE09-004
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

  // @spec AC-FE09-005 FR-FE09-006
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

  // @spec AC-FE09-005 FR-FE09-006
  test('recalculation updates one unpaid fine in place while terminal history stays unchanged', async () => {
    const unpaidSetup = makeApp({
      borrowDetails: [overdueDetail()],
      fines: [unpaidFine({ overdueDays: 3, amount: 15000 })],
    });
    const recalculated = await request(unpaidSetup.app)
      .post('/api/fines/calculate')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ borrowDetailId: 7001 });

    expect(recalculated.status).toBe(200);
    expect(recalculated.body.created).toBe(false);
    expect(recalculated.body.fine).toEqual(
      expect.objectContaining({ fineId: 9100, overdueDays: 7, amount: 35000, status: 'UNPAID' })
    );
    expect(unpaidSetup.deps.state.fines).toHaveLength(1);

    const terminal = unpaidFine({
      status: 'PAID',
      paidAmount: 35000,
      paidAt: FIXED_NOW,
      collectedBy: 99,
      paymentMethod: 'CASH',
    });
    const terminalSetup = makeApp({ borrowDetails: [overdueDetail()], fines: [terminal] });
    const terminalResult = await request(terminalSetup.app)
      .post('/api/fines/calculate')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ borrowDetailId: 7001 });

    expect(terminalResult.status).toBe(200);
    expect(terminalResult.body.created).toBe(false);
    expect(terminalResult.body.fine).toEqual(expect.objectContaining({ fineId: 9100, status: 'PAID' }));
    expect(terminalSetup.deps.state.fines).toHaveLength(1);
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

  // @spec AC-FE09-005 NFR-FE09-TXN-001
  test('concurrent calculations create at most one active overdue fine', async () => {
    const { app, deps } = makeApp({
      borrowDetails: [overdueDetail()],
      dependencyOptions: { synchronizeCreateChecks: true },
    });

    const responses = await Promise.all([
      request(app)
        .post('/api/fines/calculate')
        .set(...auth(99, 'LIBRARIAN'))
        .send({ borrowDetailId: 7001 }),
      request(app)
        .post('/api/fines/calculate')
        .set(...auth(99, 'LIBRARIAN'))
        .send({ borrowDetailId: 7001 }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 201]);
    expect(
      deps.state.fines.filter(
        (fine) => fine.borrowDetailId === 7001 && fine.reason === 'OVERDUE' && fine.status === 'UNPAID'
      )
    ).toHaveLength(1);
    expect(deps.state.auditLogs.filter((log) => log.action === 'FINE_CALCULATE')).toHaveLength(1);
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

  // @spec AC-FE09-001 NFR-FE09-SEC-002
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

  // @spec AC-FE09-002 AC-FE09-011
  test('staff fine list filters, searches, paginates, and keeps FineId ascending', async () => {
    const { app } = makeApp({
      fines: [
        unpaidFine({ fineId: 30, userId: MEMBER_ID, bookTitle: 'Clean Code' }),
        unpaidFine({
          fineId: 10,
          userId: OTHER_MEMBER_ID,
          borrowDetailId: 7002,
          bookTitle: 'Domain-Driven Design',
          barcode: 'BC2',
          member: {
            userId: OTHER_MEMBER_ID,
            username: 'other-member',
            email: 'other@example.test',
            fullName: 'Other Member',
          },
        }),
        unpaidFine({ fineId: 20, userId: MEMBER_ID, borrowDetailId: 7003, status: 'PAID' }),
      ],
    });

    const selectedMember = await request(app)
      .get('/api/fines')
      .query({ userId: OTHER_MEMBER_ID, page: 1, limit: 20 })
      .set(...auth(99, 'LIBRARIAN'));
    expect(selectedMember.status).toBe(200);
    expect(selectedMember.body.fines.map((fine) => fine.fineId)).toEqual([10]);

    const searched = await request(app)
      .get('/api/fines')
      .query({ q: 'domain', status: 'UNPAID', page: 1, limit: 1 })
      .set(...auth(99, 'LIBRARIAN'));
    expect(searched.status).toBe(200);
    expect(searched.body).toEqual(
      expect.objectContaining({ page: 1, limit: 1, total: 1, totalPages: 1 })
    );
    expect(searched.body.fines.map((fine) => fine.fineId)).toEqual([10]);

    const ascending = await request(app)
      .get('/api/fines')
      .query({ status: 'UNPAID', page: 1, limit: 20 })
      .set(...auth(99, 'LIBRARIAN'));
    expect(ascending.body.fines.map((fine) => fine.fineId)).toEqual([10, 30]);
  });

  // @spec FR-FE09-016 EC-FE09-013
  test('invalid fine-list filters are rejected before the repository is queried', async () => {
    const invalidQueries = [
      { page: 0 },
      { limit: 101 },
      { status: 'UNKNOWN' },
      { userId: 'not-an-id' },
    ];

    for (const query of invalidQueries) {
      const setup = makeApp({ fines: [unpaidFine()] });
      const response = await request(setup.app)
        .get('/api/fines')
        .query(query)
        .set(...auth(99, 'LIBRARIAN'));

      expect(response.status).toBe(400);
      expect(setup.deps.state.listCalls).toHaveLength(0);
    }
  });

  // @spec AC-FE09-008 FR-FE09-009
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

  // @spec AC-FE09-007 FR-FE09-008
  test('staff marks an unpaid fine paid', async () => {
    const { app, deps } = makeApp({ fines: [unpaidFine()] });

    const response = await request(app)
      .patch('/api/fines/9100/paid')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ paymentMethod: 'CASH', note: 'Paid in full.' });

    expect(response.status).toBe(200);
    expect(response.body.fine).toMatchObject({
      status: 'PAID',
      paidAmount: 35000,
      collectedBy: 99,
      paymentMethod: 'CASH',
    });
    expect(response.body.fine.paidAt).toBeTruthy();
    expect(deps.state.fines.filter((item) => item.status === 'UNPAID' && item.amount > 0)).toHaveLength(
      0
    );
    expect(deps.state.auditLogs).toContainEqual(
      expect.objectContaining({
        action: 'FINE_MARK_PAID',
        targetId: 9100,
        metadata: expect.objectContaining({
          amount: 35000,
          paymentMethod: 'CASH',
          note: 'Paid in full.',
          result: 'PAID',
        }),
      })
    );

    // EC-FE09-009: a second paid action on a PAID fine is rejected.
    const again = await request(app)
      .patch('/api/fines/9100/paid')
      .set(...auth(99, 'LIBRARIAN'))
      .send({});
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('FINE_NOT_PAYABLE');
  });

  // @spec AC-FE09-006 AC-FE09-012 BR-FE09-016 BR-FE09-017
  test('collection rejects client amounts and requires a valid payment method', async () => {
    const partialSetup = makeApp({ fines: [unpaidFine()] });
    const partial = await request(partialSetup.app)
      .post('/api/fines/9100/collections')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ collectedAmount: 20000, paymentMethod: 'CASH' });
    expect(partial.status).toBe(400);
    expect(partialSetup.deps.state.fines[0]).toEqual(
      expect.objectContaining({ status: 'UNPAID', paidAmount: 0, paidAt: null })
    );
    expect(partialSetup.deps.state.auditLogs).toHaveLength(0);

    const missingMethodSetup = makeApp({ fines: [unpaidFine()] });
    const missingMethod = await request(missingMethodSetup.app)
      .post('/api/fines/9100/collections')
      .set(...auth(99, 'LIBRARIAN'))
      .send({});
    expect(missingMethod.status).toBe(400);

    const longMethodSetup = makeApp({ fines: [unpaidFine()] });
    const longMethod = await request(longMethodSetup.app)
      .post('/api/fines/9100/collections')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ paymentMethod: 'x'.repeat(51) });
    expect(longMethod.status).toBe(400);
  });

  // @spec AC-FE09-006 AC-FE09-009 AC-FE09-012
  test('full offline collection records complete payment metadata and stops blocking eligibility', async () => {
    const { app, deps } = makeApp({ fines: [unpaidFine()] });

    const response = await request(app)
      .post('/api/fines/9100/collections')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ paymentMethod: ' CASH ', note: ' Paid at the desk. ' });

    expect(response.status).toBe(200);
    expect(response.body.fine).toEqual(
      expect.objectContaining({
        fineId: 9100,
        status: 'PAID',
        amount: 35000,
        paidAmount: 35000,
        collectedBy: 99,
        paymentMethod: 'CASH',
      })
    );
    expect(response.body.fine.paidAt).toBeTruthy();
    expect(deps.state.fines.filter((fine) => fine.status === 'UNPAID' && fine.amount > 0)).toHaveLength(
      0
    );
    expect(deps.state.auditLogs).toContainEqual(
      expect.objectContaining({
        action: 'FINE_COLLECT',
        targetId: 9100,
        metadata: expect.objectContaining({
          amount: 35000,
          paymentMethod: 'CASH',
          note: 'Paid at the desk.',
          result: 'PAID',
        }),
      })
    );
  });

  // @spec AC-FE09-006 AC-FE09-012 NFR-FE09-TXN-002
  test('concurrent collection attempts allow one payment and one audit record', async () => {
    const { app, deps } = makeApp({
      fines: [unpaidFine()],
      dependencyOptions: { synchronizeCollectionReads: true },
    });

    const responses = await Promise.all([
      request(app)
        .post('/api/fines/9100/collections')
        .set(...auth(99, 'LIBRARIAN'))
        .send({ paymentMethod: 'CASH' }),
      request(app)
        .post('/api/fines/9100/collections')
        .set(...auth(100, 'ADMIN'))
        .send({ paymentMethod: 'TRANSFER' }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(deps.state.fines[0]).toEqual(
      expect.objectContaining({ status: 'PAID', paidAmount: 35000 })
    );
    expect(deps.state.auditLogs.filter((log) => log.action === 'FINE_COLLECT')).toHaveLength(1);
  });

  // @spec AC-FE09-013
  test('admin can waive an unpaid fine but a librarian cannot', async () => {
    const libApp = makeApp({ fines: [unpaidFine()] });
    const libResponse = await request(libApp.app)
      .patch('/api/fines/9100/waive')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ reason: 'goodwill' });
    expect(libResponse.status).toBe(403);
    expect(libResponse.body.error.code).toBe('ADMIN_ROLE_REQUIRED');

    const adminApp = makeApp({ fines: [unpaidFine()] });
    const missingReason = await request(adminApp.app)
      .patch('/api/fines/9100/waive')
      .set(...auth(1, 'ADMIN'))
      .send({});
    expect(missingReason.status).toBe(400);
    expect(missingReason.body.error.code).toBe('REASON_REQUIRED');

    const adminResponse = await request(adminApp.app)
      .patch('/api/fines/9100/waive')
      .set(...auth(1, 'ADMIN'))
      .send({ reason: ' goodwill ' });
    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.fine.status).toBe('WAIVED');
    expect(adminResponse.body.fine.paidAmount).toBe(0);
    expect(adminResponse.body.fine.paidAt).toBeNull();
    expect(adminApp.deps.state.auditLogs).toContainEqual(
      expect.objectContaining({
        action: 'FINE_WAIVE',
        targetId: 9100,
        metadata: expect.objectContaining({ reason: 'goodwill', result: 'WAIVED' }),
      })
    );
  });

  // @spec AC-FE09-013 AC-FE09-014 EC-FE09-012
  test('waive and cancel validate the admin reason without changing fine or audit state', async () => {
    const invalidReasons = [{}, { reason: '   ' }, { reason: 'x'.repeat(501) }];

    for (const [index, payload] of invalidReasons.entries()) {
      const setup = makeApp({ fines: [unpaidFine({ fineId: 9200 + index })] });
      const response = await request(setup.app)
        .patch(`/api/fines/${9200 + index}/${index % 2 === 0 ? 'waive' : 'cancel'}`)
        .set(...auth(1, 'ADMIN'))
        .send(payload);

      expect(response.status).toBe(400);
      expect(setup.deps.state.fines[0].status).toBe('UNPAID');
      expect(setup.deps.state.auditLogs).toHaveLength(0);
    }
  });

  // @spec AC-FE09-014
  test('admin can cancel an unpaid fine atomically while librarian remains forbidden', async () => {
    const librarianSetup = makeApp({ fines: [unpaidFine()] });
    await request(librarianSetup.app)
      .patch('/api/fines/9100/cancel')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ reason: 'Created in error.' })
      .expect(403);

    const adminSetup = makeApp({ fines: [unpaidFine()] });
    const response = await request(adminSetup.app)
      .patch('/api/fines/9100/cancel')
      .set(...auth(1, 'ADMIN'))
      .send({ reason: ' Created in error. ' });

    expect(response.status).toBe(200);
    expect(response.body.fine).toEqual(
      expect.objectContaining({ status: 'CANCELLED', paidAmount: 0, paidAt: null })
    );
    expect(adminSetup.deps.state.auditLogs).toContainEqual(
      expect.objectContaining({
        action: 'FINE_CANCEL',
        targetId: 9100,
        metadata: expect.objectContaining({ reason: 'Created in error.', result: 'CANCELLED' }),
      })
    );
  });

  // @spec FR-FE09-013 EC-FE09-009 EC-FE09-011
  test('resolved fines reject collection, payment, and further resolution without metadata changes', async () => {
    for (const status of ['PAID', 'WAIVED', 'CANCELLED']) {
      const terminalFine = unpaidFine({
        status,
        paidAmount: status === 'PAID' ? 35000 : 0,
        paidAt: status === 'PAID' ? FIXED_NOW : null,
        collectedBy: status === 'PAID' ? 99 : null,
        paymentMethod: status === 'PAID' ? 'CASH' : null,
      });
      const setup = makeApp({ fines: [terminalFine] });
      const before = JSON.stringify(setup.deps.state.fines[0]);

      const collection = await request(setup.app)
        .post('/api/fines/9100/collections')
        .set(...auth(99, 'LIBRARIAN'))
        .send({ paymentMethod: 'CASH' });
      expect(collection.status).toBe(409);
      expect(collection.body.error.code).toBe('FINE_NOT_COLLECTIBLE');

      const paid = await request(setup.app)
        .patch('/api/fines/9100/paid')
        .set(...auth(99, 'LIBRARIAN'))
        .send({ paymentMethod: 'CASH' });
      expect(paid.status).toBe(409);
      expect(paid.body.error.code).toBe('FINE_NOT_PAYABLE');

      const resolve = await request(setup.app)
        .patch('/api/fines/9100/waive')
        .set(...auth(1, 'ADMIN'))
        .send({ reason: 'No further transition.' });
      expect(resolve.status).toBe(409);
      expect(resolve.body.error.code).toBe('FINE_NOT_RESOLVABLE');

      expect(JSON.stringify(setup.deps.state.fines[0])).toBe(before);
      expect(setup.deps.state.auditLogs).toHaveLength(0);
    }
  });

  // @spec AC-FE09-005 AC-FE09-006 AC-FE09-013 NFR-FE09-TXN-001 NFR-FE09-TXN-002
  test('audit failure rolls back calculation, collection, and resolution state', async () => {
    const calculationSetup = makeApp({ borrowDetails: [overdueDetail()] });
    calculationSetup.deps.state.auditControl.failureAction = 'FINE_CALCULATE';
    const calculationFailure = await request(calculationSetup.app)
      .post('/api/fines/calculate')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ borrowDetailId: 7001 });
    expect(calculationFailure.status).toBe(500);
    expect(calculationSetup.deps.state.fines).toHaveLength(0);
    expect(calculationSetup.deps.state.auditLogs).toHaveLength(0);

    const collectionSetup = makeApp({ fines: [unpaidFine()] });
    collectionSetup.deps.state.auditControl.failureAction = 'FINE_COLLECT';
    const collectionFailure = await request(collectionSetup.app)
      .post('/api/fines/9100/collections')
      .set(...auth(99, 'LIBRARIAN'))
      .send({ paymentMethod: 'CASH' });
    expect(collectionFailure.status).toBe(500);
    expect(collectionSetup.deps.state.fines[0]).toEqual(
      expect.objectContaining({ status: 'UNPAID', paidAmount: 0, paidAt: null })
    );
    expect(collectionSetup.deps.state.auditLogs).toHaveLength(0);

    const waiverSetup = makeApp({ fines: [unpaidFine()] });
    waiverSetup.deps.state.auditControl.failureAction = 'FINE_WAIVE';
    const waiverFailure = await request(waiverSetup.app)
      .patch('/api/fines/9100/waive')
      .set(...auth(1, 'ADMIN'))
      .send({ reason: 'Goodwill.' });
    expect(waiverFailure.status).toBe(500);
    expect(waiverSetup.deps.state.fines[0].status).toBe('UNPAID');
    expect(waiverSetup.deps.state.auditLogs).toHaveLength(0);
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
