process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { createInventoryService } = require('../src/services/inventoryService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');
const {
  makeInMemoryInventoryDependencies,
} = require('./helpers/inMemoryInventoryRepositories');

function makeTestApp(initialState = {}) {
  const authDependencies = makeInMemoryAuthDependencies();
  const inventoryDependencies = makeInMemoryInventoryDependencies(authDependencies, initialState);
  const authService = createAuthService(authDependencies);
  const inventoryService = createInventoryService({
    inventoryRepository: inventoryDependencies.inventoryRepository,
    auditLogRepository: inventoryDependencies.auditLogRepository,
  });
  const app = createApp({ authService, inventoryService });

  return { app, authDependencies, inventoryDependencies };
}

async function createVerifiedUser({ app, authDependencies, email, role = 'MEMBER' }) {
  const password = 'Password1!';
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      confirmPassword: password,
      fullName: email.split('@')[0],
    });

  expect(registerResponse.status).toBe(201);

  const userId = registerResponse.body.userId;

  await request(app)
    .post('/api/auth/verify-email')
    .send({ token: authDependencies.state.generatedOtps.at(-1) })
    .expect(200);

  authDependencies.state.rolesByUserId.set(userId, [role]);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  expect(loginResponse.status).toBe(200);

  return {
    userId,
    accessToken: loginResponse.body.accessToken,
  };
}

function authHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

async function makeStaffSetup(role = 'LIBRARIAN', initialState = {}) {
  const setup = makeTestApp(initialState);
  const staff = await createVerifiedUser({
    app: setup.app,
    authDependencies: setup.authDependencies,
    email: `inventory.${role.toLowerCase()}.${Date.now()}@example.test`,
    role,
  });
  return { ...setup, staff };
}

function expectStateUnchanged(inventoryDependencies, before) {
  expect(inventoryDependencies.snapshot()).toEqual(before);
}

describe('FE06 inventory book copy management v0.4.0 RED contract', () => {
  // @spec AC-FE06-010, BR-FE06-001, FR-FE06-020
  test('all direct inventory operations require authentication and Librarian/Admin role', async () => {
    const { app, authDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'inventory.member@example.test',
    });

    await request(app).get('/api/inventory').expect(401);

    await request(app)
      .post('/api/books/1/copies')
      .set('Authorization', authHeader(member.accessToken))
      .send({ barcode: 'MEMBER-COPY' })
      .expect(403);
  });

  // @spec AC-FE06-001, AC-FE06-009, BR-FE06-005, BR-FE06-006, FR-FE06-001, FR-FE06-008
  test('inventory list uses the exact filtered page and counts envelope', async () => {
    const { app, staff } = await makeStaffSetup();

    const response = await request(app)
      .get('/api/inventory?bookId=1')
      .set('Authorization', authHeader(staff.accessToken));

    expect(response.status).toBe(200);
    expect(Object.keys(response.body).sort()).toEqual(
      ['countsByStatus', 'items', 'limit', 'page', 'totalItems', 'totalPages'].sort()
    );
    expect(response.body).toMatchObject({
      page: 1,
      limit: 20,
      totalItems: 3,
      totalPages: 1,
      countsByStatus: {
        AVAILABLE: 1,
        BORROWED: 1,
        INACTIVE: 1,
      },
    });
    expect(response.body.items.map((copy) => copy.bookId)).toEqual([1, 1, 1]);
    expect(response.body.countsByStatus.RESERVED ?? 0).toBe(0);
  });

  // @spec AC-FE06-014, BR-FE06-018, FR-FE06-024
  test('inventory pagination defaults are exact and invalid supplied values never query inventory', async () => {
    const { app, staff, inventoryDependencies } = await makeStaffSetup();

    const defaultResponse = await request(app)
      .get('/api/inventory')
      .set('Authorization', authHeader(staff.accessToken));

    expect(defaultResponse.status).toBe(200);
    expect(defaultResponse.body).toMatchObject({ page: 1, limit: 20 });

    const callsAfterDefault = inventoryDependencies.control.listCalls.length;
    const invalidQueries = [
      'page=',
      'page=0',
      'page=1.5',
      'limit=',
      'limit=0',
      'limit=100.5',
      'limit=101',
    ];

    for (const query of invalidQueries) {
      const response = await request(app)
        .get(`/api/inventory?${query}`)
        .set('Authorization', authHeader(staff.accessToken));
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }

    expect(inventoryDependencies.control.listCalls).toHaveLength(callsAfterDefault);
  });

  // @spec AC-FE06-002, AC-FE06-003, FR-FE06-002, FR-FE06-003, FR-FE06-009
  test('copy lookup returns only the approved copy and book summary fields', async () => {
    const { app, staff } = await makeStaffSetup();

    const response = await request(app)
      .get('/api/book-copies/barcode/BC-001')
      .set('Authorization', authHeader(staff.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.copy).toMatchObject({
      copyId: 1,
      bookId: 1,
      barcode: 'BC-001',
      status: 'AVAILABLE',
      location: 'A1',
      version: 'copy-v1',
      book: {
        bookId: 1,
        title: 'Clean Code',
        isbn: '9780132350884',
        status: 'ACTIVE',
      },
    });
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('private.member@example.test');
    expect(serialized).not.toContain('fineAmount');
    expect(serialized).not.toContain('protected-audit-metadata');

    await request(app)
      .get('/api/book-copies/barcode/UNKNOWN')
      .set('Authorization', authHeader(staff.accessToken))
      .expect(404);
  });

  // @spec AC-FE06-004, BR-FE06-002, BR-FE06-003, BR-FE06-009, FR-FE06-004
  test('create is server-controlled AVAILABLE and writes its audit', async () => {
    const { app, staff, authDependencies } = await makeStaffSetup();

    const response = await request(app)
      .post('/api/books/1/copies')
      .set('Authorization', authHeader(staff.accessToken))
      .send({ barcode: 'BC-NEW', location: 'A9' });

    expect(response.status).toBe(201);
    expect(response.body.copy).toMatchObject({
      bookId: 1,
      barcode: 'BC-NEW',
      location: 'A9',
      status: 'AVAILABLE',
    });
    expect(authDependencies.state.auditLogs).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: 'BOOK_COPY_CREATE' })])
    );
  });

  // @spec BR-FE06-004, BR-FE06-014, FR-FE06-004, FR-FE06-014
  test('client input cannot control the initial copy status', async () => {
    const { app, staff, inventoryDependencies } = await makeStaffSetup();

    await request(app)
      .post('/api/books/1/copies')
      .set('Authorization', authHeader(staff.accessToken))
      .send({ barcode: 'BC-CLIENT-STATUS', status: 'LOST' });

    expect(inventoryDependencies.state.copies).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ barcode: 'BC-CLIENT-STATUS', status: 'LOST' }),
      ])
    );
  });

  // @spec AC-FE06-004, AC-FE06-005, BR-FE06-002, BR-FE06-003, BR-FE06-011, FR-FE06-005, FR-FE06-011, FR-FE06-012, FR-FE06-021
  test.each([
    ['missing parent book', '/api/books/999/copies', { barcode: 'BC-MISSING-BOOK' }, 404],
    ['empty barcode', '/api/books/1/copies', { barcode: '   ' }, 400],
    ['duplicate barcode', '/api/books/1/copies', { barcode: 'BC-001' }, 409],
    ['blank location', '/api/books/1/copies', { barcode: 'BC-BLANK-LOCATION', location: '   ' }, 400],
    ['control character in location', '/api/books/1/copies', { barcode: 'BC-CONTROL', location: 'A1\nB2' }, 400],
    ['overlength location', '/api/books/1/copies', { barcode: 'BC-LONG', location: 'L'.repeat(101) }, 400],
  ])('create rejects %s without mutation', async (_label, endpoint, body, status) => {
    const { app, staff, inventoryDependencies } = await makeStaffSetup();
    const before = inventoryDependencies.snapshot();

    await request(app)
      .post(endpoint)
      .set('Authorization', authHeader(staff.accessToken))
      .send(body)
      .expect(status);

    expectStateUnchanged(inventoryDependencies, before);
  });

  // @spec AC-FE06-011, BR-FE06-015, FR-FE06-022
  test('inactive parent rejects create and reactivation into AVAILABLE', async () => {
    const { app, staff, inventoryDependencies } = await makeStaffSetup();
    const beforeCreate = inventoryDependencies.snapshot();

    const createResponse = await request(app)
      .post('/api/books/3/copies')
      .set('Authorization', authHeader(staff.accessToken))
      .send({ barcode: 'BC-INACTIVE-PARENT' });

    expect(createResponse.status).toBe(409);
    expectStateUnchanged(inventoryDependencies, beforeCreate);

    const beforeReactivate = inventoryDependencies.snapshot();
    const reactivateResponse = await request(app)
      .patch('/api/book-copies/4/status')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'copy-v4')
      .send({ status: 'AVAILABLE', reason: 'Repair completed' });

    expect(reactivateResponse.status).toBe(409);
    expectStateUnchanged(inventoryDependencies, beforeReactivate);
  });

  // @spec AC-FE06-005, BR-FE06-003, BR-FE06-013, FR-FE06-005
  test('metadata update rejects duplicate barcode and status ownership', async () => {
    const { app, staff, inventoryDependencies } = await makeStaffSetup();
    const before = inventoryDependencies.snapshot();

    const duplicate = await request(app)
      .put('/api/book-copies/1')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'copy-v1')
      .send({ barcode: 'BC-002' });
    expect(duplicate.status).toBe(409);

    const statusMutation = await request(app)
      .put('/api/book-copies/1')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'copy-v1')
      .send({ status: 'DAMAGED' });
    expect(statusMutation.status).toBe(400);

    expectStateUnchanged(inventoryDependencies, before);
  });

  // @spec AC-FE06-006, BR-FE06-004, BR-FE06-012, BR-FE06-017, FR-FE06-006, FR-FE06-010
  test('valid FE06 status transition advances version and audits the trimmed reason', async () => {
    const { app, staff, authDependencies } = await makeStaffSetup();

    const response = await request(app)
      .patch('/api/book-copies/1/status')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'copy-v1')
      .send({ status: 'DAMAGED', reason: '  Torn cover  ' });

    expect(response.status).toBe(200);
    expect(response.body.copy).toMatchObject({ copyId: 1, status: 'DAMAGED' });
    expect(response.body.copy.version).not.toBe('copy-v1');
    expect(authDependencies.state.auditLogs.at(-1)).toMatchObject({
      action: 'BOOK_COPY_STATUS_UPDATE',
      metadata: expect.objectContaining({
        oldStatus: 'AVAILABLE',
        newStatus: 'DAMAGED',
        reason: 'Torn cover',
      }),
    });
  });

  // @spec AC-FE06-006, BR-FE06-014, FR-FE06-013, FR-FE06-014
  test.each(['BORROWED', 'RESERVED', 'UNKNOWN'])('manual status rejects %s', async (status) => {
    const { app, staff, inventoryDependencies } = await makeStaffSetup();
    const before = inventoryDependencies.snapshot();

    await request(app)
      .patch('/api/book-copies/1/status')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'copy-v1')
      .send({ status, reason: 'Manual transition attempt' })
      .expect(400);

    expectStateUnchanged(inventoryDependencies, before);
  });

  // @spec AC-FE06-007, AC-FE06-008, BR-FE06-007, BR-FE06-008, FR-FE06-015, FR-FE06-016
  test('borrow and reservation conflicts preserve copy, workflow, and audit state', async () => {
    const { app, staff, inventoryDependencies } = await makeStaffSetup();
    const beforeBorrow = inventoryDependencies.snapshot();

    const borrowedResponse = await request(app)
      .patch('/api/book-copies/2/status')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'copy-v2')
      .send({ status: 'AVAILABLE', reason: 'Manual release' });

    expect(borrowedResponse.status).toBe(409);
    expectStateUnchanged(inventoryDependencies, beforeBorrow);

    const beforeReservation = inventoryDependencies.snapshot();
    const reservedResponse = await request(app)
      .patch('/api/book-copies/3/status')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'copy-v3')
      .send({ status: 'AVAILABLE', reason: 'Manual release' });

    expect(reservedResponse.status).toBe(409);
    expect(reservedResponse.body.error.code).toBe('RESERVATION_STATE_CONFLICT');
    expectStateUnchanged(inventoryDependencies, beforeReservation);
  });

  // @spec AC-FE06-012, BR-FE06-016, FR-FE06-018
  test.each([
    ['PUT', '/api/book-copies/1', { location: 'A10' }],
    ['PATCH', '/api/book-copies/1/status', { status: 'DAMAGED', reason: 'Torn cover' }],
    ['DELETE', '/api/book-copies/1', { reason: 'Retired copy' }],
  ])('%s %s rejects missing If-Match without mutation', async (method, endpoint, body) => {
    const { app, staff, inventoryDependencies } = await makeStaffSetup();
    const before = inventoryDependencies.snapshot();

    const response = await request(app)
      [method.toLowerCase()](endpoint)
      .set('Authorization', authHeader(staff.accessToken))
      .send(body);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('STALE_COPY_STATE');
    expectStateUnchanged(inventoryDependencies, before);
  });

  // @spec AC-FE06-012, BR-FE06-016, FR-FE06-018
  test.each([
    ['PUT', '/api/book-copies/1', { location: 'A10' }],
    ['PATCH', '/api/book-copies/1/status', { status: 'DAMAGED', reason: 'Torn cover' }],
    ['DELETE', '/api/book-copies/1', { reason: 'Retired copy' }],
  ])('%s %s rejects stale If-Match without mutation', async (method, endpoint, body) => {
    const { app, staff, inventoryDependencies } = await makeStaffSetup();
    const before = inventoryDependencies.snapshot();

    const response = await request(app)
      [method.toLowerCase()](endpoint)
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'stale-copy-version')
      .send(body);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('STALE_COPY_STATE');
    expectStateUnchanged(inventoryDependencies, before);
  });

  // @spec AC-FE06-013, BR-FE06-017, FR-FE06-023
  test.each([
    ['missing', undefined, 400],
    ['blank', '   ', 400],
    ['overlength', 'R'.repeat(501), 400],
    ['maximum length', 'R'.repeat(500), 200],
  ])('manual transition handles %s reason deterministically', async (_label, reason, expectedStatus) => {
    const { app, staff, inventoryDependencies } = await makeStaffSetup();
    const before = inventoryDependencies.snapshot();
    const body = { status: 'DAMAGED' };
    if (reason !== undefined) body.reason = reason;

    const response = await request(app)
      .patch('/api/book-copies/1/status')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'copy-v1')
      .send(body);

    expect(response.status).toBe(expectedStatus);
    if (expectedStatus !== 200) {
      expectStateUnchanged(inventoryDependencies, before);
    }
  });

  // @spec AC-FE06-009, BR-FE06-010, FR-FE06-017
  test('duplicate current-version deactivation is idempotent and writes no second transition audit', async () => {
    const { app, staff, authDependencies } = await makeStaffSetup();
    const auditCount = authDependencies.state.auditLogs.length;

    const response = await request(app)
      .delete('/api/book-copies/5')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'copy-v5')
      .send({ reason: 'Already retired' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      changed: false,
      copy: { copyId: 5, status: 'INACTIVE', version: 'copy-v5' },
    });
    expect(authDependencies.state.auditLogs).toHaveLength(auditCount);
  });

  // @spec AC-FE06-006, BR-FE06-012, FR-FE06-019, NFR-FE06-TXN-001
  test('audit failure rolls back copy, workflow, and audit state together', async () => {
    const { app, staff, inventoryDependencies } = await makeStaffSetup();
    const before = inventoryDependencies.snapshot();
    inventoryDependencies.control.failAudit = true;

    const response = await request(app)
      .patch('/api/book-copies/1/status')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'copy-v1')
      .send({ status: 'DAMAGED', reason: 'Torn cover' });

    expect(response.status).toBe(500);
    expectStateUnchanged(inventoryDependencies, before);
  });
});
