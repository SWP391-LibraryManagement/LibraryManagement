process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const { makeSystemIntegrationApp } = require('./helpers/systemIntegrationHarness');
const request = require('supertest');
const {
  authHeader,
  createVerifiedActor,
} = require('./helpers/systemIntegrationHarness');

async function createBorrowAndApprove({ setup, member, librarian, copyId }) {
  const created = await request(setup.app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [copyId] })
    .expect(201);
  const approved = await request(setup.app)
    .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
    .set('Authorization', authHeader(librarian.accessToken))
    .send({})
    .expect(200);

  return { created, approved };
}

describe('System integration', () => {
  test('SIT-000 wires every completed service into one Express app', () => {
    const setup = makeSystemIntegrationApp();

    expect(setup.app).toBeTruthy();
    expect(setup.services).toEqual(expect.objectContaining({
      authService: expect.any(Object),
      borrowingService: expect.any(Object),
      reservationService: expect.any(Object),
      fineManagementService: expect.any(Object),
      notificationService: expect.any(Object),
      reportService: expect.any(Object),
    }));
  });

  test('SIT-001 enforces authentication and staff roles across integrated APIs', async () => {
    const setup = makeSystemIntegrationApp();
    const member = await createVerifiedActor({
      setup,
      email: 'sit.rbac.member@example.test',
    });
    const librarian = await createVerifiedActor({
      setup,
      email: 'sit.rbac.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const staffRequests = [
      ['get', '/api/borrow-requests'],
      ['post', '/api/reservations/process-queue', { copyId: 1 }],
      ['post', '/api/fines/calculate', { borrowDetailId: 1 }],
      ['post', '/api/notifications/process-pending', { limit: 10 }],
      ['get', '/api/reports/borrowing'],
    ];

    for (const [method, path, body] of staffRequests) {
      const unauthenticated = request(setup.app)[method](path);
      if (body) unauthenticated.send(body);
      const unauthenticatedResponse = await unauthenticated;
      expect(unauthenticatedResponse.status).toBe(401);

      const forbidden = request(setup.app)[method](path)
        .set('Authorization', authHeader(member.accessToken));
      if (body) forbidden.send(body);
      const forbiddenResponse = await forbidden;
      expect(forbiddenResponse.status).toBe(403);
      expect(forbiddenResponse.body.error.code).toBe('ROLE_REQUIRED');
    }

    await request(setup.app)
      .get('/api/borrow-requests')
      .set('Authorization', authHeader(librarian.accessToken))
      .expect(200);
    await request(setup.app)
      .get('/api/reports/borrowing')
      .set('Authorization', authHeader(librarian.accessToken))
      .expect(200);
  });

  test('SIT-002 FE07 approval creates FE10 data and FE12 activity', async () => {
    const setup = makeSystemIntegrationApp();
    const member = await createVerifiedActor({
      setup,
      email: 'sit.borrower@example.test',
    });
    const librarian = await createVerifiedActor({
      setup,
      email: 'sit.borrow.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const { approved } = await createBorrowAndApprove({
      setup,
      member,
      librarian,
      copyId: 1,
    });

    expect(approved.body.borrowRequest).toMatchObject({
      status: 'APPROVED',
      details: [expect.objectContaining({ status: 'BORROWED', dueDate: '2026-07-28' })],
    });
    expect(setup.dependencies.borrowingDependencies.state.copies.find(
      (copy) => copy.copyId === 1
    ).status).toBe('BORROWED');
    expect(setup.dependencies.notificationDependencies.state.notifications).toEqual(
      expect.arrayContaining([expect.objectContaining({
        userId: member.userId,
        sourceFeature: 'FE07',
        type: 'DUE_DATE_REMINDER',
      })])
    );

    const report = await request(setup.app)
      .get('/api/reports/borrowing?fromDate=2026-07-01&toDate=2026-07-31')
      .set('Authorization', authHeader(librarian.accessToken))
      .expect(200);
    expect(report.body.totals.requests).toBe(1);
    expect(report.body.totals.activeLoans).toBe(1);
    expect(report.body.requestStatusCounts.APPROVED).toBe(1);
  });

  test('SIT-007 keeps notification requests idempotent and response-safe', async () => {
    const setup = makeSystemIntegrationApp();
    const librarian = await createVerifiedActor({
      setup,
      email: 'sit.notification.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const payload = {
      type: 'DUE_DATE_REMINDER',
      channel: 'EMAIL',
      recipientEmail: 'sit.notification.member@example.test',
      templateKey: 'DUE_DATE_REMINDER',
      templateData: { dueDate: '2026-07-28' },
      idempotencyKey: 'sit-fe07-1',
    };

    const created = await request(setup.app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(librarian.accessToken))
      .send(payload)
      .expect(201);
    const replayed = await request(setup.app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(librarian.accessToken))
      .send(payload)
      .expect(200);
    expect(replayed.body).toEqual(created.body);

    const processed = await request(setup.app)
      .post('/api/notifications/process-pending')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ limit: 10 })
      .expect(200);
    expect(processed.body).toEqual({ processed: 1, failed: 0 });
    expect(processed.body).not.toHaveProperty('notifications');
    expect(setup.dependencies.notificationDependencies.state.notifications).toHaveLength(1);
  });

  test('SIT-008 keeps FE12 read-only and excludes requested details from loan activity', async () => {
    const setup = makeSystemIntegrationApp();
    const member = await createVerifiedActor({
      setup,
      email: 'sit.report.member@example.test',
    });
    const librarian = await createVerifiedActor({
      setup,
      email: 'sit.report.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    await createBorrowAndApprove({ setup, member, librarian, copyId: 1 });
    await request(setup.app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [2] })
      .expect(201);

    const snapshot = () => JSON.stringify({
      requests: setup.dependencies.borrowingDependencies.state.borrowRequests,
      details: setup.dependencies.borrowingDependencies.state.borrowDetails,
      copies: setup.dependencies.borrowingDependencies.state.copies,
      fines: setup.dependencies.fineDependencies.state.fines,
      notifications: setup.dependencies.notificationDependencies.state.notifications,
    });
    const before = snapshot();

    const borrowingReport = await request(setup.app)
      .get('/api/reports/borrowing?fromDate=2026-07-01&toDate=2026-07-31')
      .set('Authorization', authHeader(librarian.accessToken))
      .expect(200);
    await request(setup.app)
      .get('/api/reports/inventory')
      .set('Authorization', authHeader(librarian.accessToken))
      .expect(200);
    await request(setup.app)
      .get('/api/reports/users')
      .set('Authorization', authHeader(librarian.accessToken))
      .expect(200);

    expect(borrowingReport.body.totals).toMatchObject({
      requests: 2,
      details: 2,
      activeLoans: 1,
    });
    expect(Object.values(borrowingReport.body.borrowCountByPeriod).reduce(
      (sum, count) => sum + count,
      0
    )).toBe(1);
    expect(snapshot()).toBe(before);
  });

  test('SIT-009 keeps approved borrowing state when FE10 request creation fails', async () => {
    const setup = makeSystemIntegrationApp({
      borrowingNotificationError: new Error('Provider unavailable'),
    });
    const member = await createVerifiedActor({
      setup,
      email: 'sit.failure.member@example.test',
    });
    const librarian = await createVerifiedActor({
      setup,
      email: 'sit.failure.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const { approved } = await createBorrowAndApprove({
      setup,
      member,
      librarian,
      copyId: 1,
    });

    expect(approved.body.borrowRequest.status).toBe('APPROVED');
    expect(setup.dependencies.borrowingDependencies.state.borrowDetails[0].status).toBe('BORROWED');
    expect(setup.dependencies.borrowingDependencies.state.copies.find(
      (copy) => copy.copyId === 1
    ).status).toBe('BORROWED');
    expect(setup.dependencies.notificationDependencies.state.notifications).toHaveLength(0);
  });
});
