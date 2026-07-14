process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const { makeSystemIntegrationApp } = require('./helpers/systemIntegrationHarness');
const request = require('supertest');
const {
  authHeader,
  createVerifiedActor,
  syncCopyStatus,
  syncFineBlockersToBorrowing,
  syncFineSourceFromBorrowing,
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

  test('SIT-003 FE08 queue holds a copy, notifies the member, and blocks another borrower', async () => {
    const setup = makeSystemIntegrationApp();
    const reservedFor = await createVerifiedActor({
      setup,
      email: 'sit.reservation.owner@example.test',
    });
    const otherMember = await createVerifiedActor({
      setup,
      email: 'sit.reservation.other@example.test',
    });
    const librarian = await createVerifiedActor({
      setup,
      email: 'sit.reservation.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    await request(setup.app)
      .post('/api/reservations')
      .set('Authorization', authHeader(reservedFor.accessToken))
      .send({ copyId: 1 })
      .expect(201);
    setup.dependencies.reservationDependencies.state.copies.find(
      (copy) => copy.copyId === 1
    ).status = 'AVAILABLE';

    const processed = await request(setup.app)
      .post('/api/reservations/process-queue')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyId: 1 })
      .expect(200);
    expect(processed.body.selectedReservation).toMatchObject({
      userId: reservedFor.userId,
      copyId: 1,
      status: 'NOTIFIED',
    });
    expect(setup.dependencies.reservationDependencies.state.copies.find(
      (copy) => copy.copyId === 1
    ).status).toBe('RESERVED');
    expect(setup.dependencies.notificationDependencies.state.notifications).toEqual(
      expect.arrayContaining([expect.objectContaining({
        userId: reservedFor.userId,
        sourceFeature: 'FE08',
        templateKey: 'RESERVATION_READY',
      })])
    );

    syncCopyStatus(
      setup.dependencies.reservationDependencies.state,
      setup.dependencies.borrowingDependencies.state,
      1
    );
    const blocked = await request(setup.app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(otherMember.accessToken))
      .send({ copyIds: [1] });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe('COPY_NOT_AVAILABLE');
    expect(setup.dependencies.borrowingDependencies.state.borrowRequests).toHaveLength(0);
  });

  test('SIT-004 FE08 reservation priority blocks FE07 renewal without changing the loan', async () => {
    const setup = makeSystemIntegrationApp();
    const owner = await createVerifiedActor({
      setup,
      email: 'sit.renew.owner@example.test',
    });
    const otherMember = await createVerifiedActor({
      setup,
      email: 'sit.renew.other@example.test',
    });
    const librarian = await createVerifiedActor({
      setup,
      email: 'sit.renew.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const { approved } = await createBorrowAndApprove({
      setup,
      member: owner,
      librarian,
      copyId: 2,
    });
    const borrowDetailId = approved.body.borrowRequest.details[0].borrowDetailId;
    const detail = setup.dependencies.borrowingDependencies.state.borrowDetails.find(
      (item) => item.borrowDetailId === borrowDetailId
    );
    const dueDateBefore = new Date(detail.dueDate).toISOString();
    const renewalCountBefore = detail.renewalCount;
    setup.dependencies.borrowingDependencies.state.reservations.push({
      reservationId: 1,
      userId: otherMember.userId,
      copyId: 2,
      status: 'ACTIVE',
    });

    const response = await request(setup.app)
      .patch(`/api/borrow-details/${borrowDetailId}/renew`)
      .set('Authorization', authHeader(owner.accessToken))
      .send({});
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('RESERVATION_BLOCKS_RENEWAL');
    expect(new Date(detail.dueDate).toISOString()).toBe(dueDateBefore);
    expect(detail.renewalCount).toBe(renewalCountBefore);
  });

  test('SIT-005 and SIT-006 calculate an overdue fine that blocks borrowing until paid', async () => {
    const setup = makeSystemIntegrationApp();
    const member = await createVerifiedActor({
      setup,
      email: 'sit.fine.member@example.test',
    });
    const otherMember = await createVerifiedActor({
      setup,
      email: 'sit.fine.other@example.test',
    });
    const librarian = await createVerifiedActor({
      setup,
      email: 'sit.fine.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const { approved } = await createBorrowAndApprove({
      setup,
      member,
      librarian,
      copyId: 1,
    });
    const borrowDetailId = approved.body.borrowRequest.details[0].borrowDetailId;
    const storedDetail = setup.dependencies.borrowingDependencies.state.borrowDetails.find(
      (detail) => detail.borrowDetailId === borrowDetailId
    );
    storedDetail.dueDate = new Date('2026-06-30T00:00:00.000Z');

    const returned = await request(setup.app)
      .patch(`/api/borrow-details/${borrowDetailId}/return`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ condition: 'NORMAL', returnDate: '2026-07-14' })
      .expect(200);
    expect(returned.body.fineCandidate).toMatchObject({
      borrowDetailId,
      overdueDays: 14,
      needsFineReview: true,
    });

    syncFineSourceFromBorrowing(setup);
    const calculated = await request(setup.app)
      .post('/api/fines/calculate')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ borrowDetailId, amount: 999999, overdueDays: 999 })
      .expect(201);
    expect(calculated.body).toMatchObject({
      created: true,
      overdueDays: 14,
      fine: {
        userId: member.userId,
        borrowDetailId,
        amount: 70000,
        status: 'UNPAID',
      },
    });
    const fineId = calculated.body.fine.fineId;

    const duplicate = await request(setup.app)
      .post('/api/fines/calculate')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ borrowDetailId })
      .expect(200);
    expect(duplicate.body).toMatchObject({ created: false, fine: { fineId } });

    const mine = await request(setup.app)
      .get('/api/fines/me')
      .set('Authorization', authHeader(member.accessToken))
      .expect(200);
    expect(mine.body.fines).toHaveLength(1);
    expect(mine.body.fines[0].fineId).toBe(fineId);
    const notMine = await request(setup.app)
      .get('/api/fines/me')
      .set('Authorization', authHeader(otherMember.accessToken))
      .expect(200);
    expect(notMine.body.fines).toHaveLength(0);

    syncFineBlockersToBorrowing(setup);
    const blocked = await request(setup.app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [2] });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe('UNPAID_FINE_BLOCKS_BORROWING');

    await request(setup.app)
      .patch(`/api/fines/${fineId}/paid`)
      .set('Authorization', authHeader(member.accessToken))
      .send({ paymentMethod: 'CASH' })
      .expect(403);
    await request(setup.app)
      .patch(`/api/fines/${fineId}/paid`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ paymentMethod: 'CASH' })
      .expect(200);
    syncFineBlockersToBorrowing(setup);

    const allowed = await request(setup.app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [2] })
      .expect(201);
    expect(allowed.body.borrowRequest.status).toBe('PENDING');
  });
});
