process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { createBorrowingService } = require('../src/services/borrowingService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');
const { makeInMemoryBorrowingDependencies } = require('./helpers/inMemoryBorrowingRepositories');

function makeNotificationRequesterStub({ error } = {}) {
  const requester = {
    createNotificationRequest: jest.fn(async () => {
      if (error) {
        throw error;
      }

      return { notificationId: 1, status: 'PENDING' };
    }),
  };

  return {
    requester,
    service: {
      createSourceNotificationRequester: jest.fn(() => requester),
    },
  };
}

function makeTestApp({
  notificationStub = makeNotificationRequesterStub(),
  auditLogRepository,
  authDependencies = makeInMemoryAuthDependencies(),
  borrowingDependencies = makeInMemoryBorrowingDependencies(authDependencies.state),
} = {}) {
  const authService = createAuthService(authDependencies);
  const borrowingService = createBorrowingService({
    borrowingRepository: borrowingDependencies.borrowingRepository,
    auditLogRepository: auditLogRepository || authDependencies.auditLogRepository,
    notificationService: notificationStub.service,
    clock: () => new Date('2026-06-10T00:00:00.000Z'),
  });
  const app = createApp({ authService, borrowingService });

  return { app, authDependencies, borrowingDependencies, notificationStub };
}

async function createVerifiedUser({
  app,
  authDependencies,
  borrowingDependencies,
  email,
  role = 'MEMBER',
  approveMember = true,
}) {
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

  if (role === 'MEMBER' && approveMember) {
    borrowingDependencies.approveMember(userId);
  }


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

function makeAfterWriteFailingAuditLogRepository(auditLogRepository) {
  return {
    create: jest.fn(async (entry) => {
      await auditLogRepository.create(entry);
      throw new Error('Audit log write failed.');
    }),
  };
}

function makeReservationAuditFailingRepository(auditLogRepository) {
  return {
    create: jest.fn(async (entry) => {
      await auditLogRepository.create(entry);
      if (entry.action === 'RESERVATION_FULFILL') {
        throw new Error('Reservation audit write failed.');
      }
    }),
  };
}

function installTwoPartyBorrowDetailReadBarrier(
  borrowingRepository,
  description = 'Borrow-detail race'
) {
  const originalFindBorrowDetailById = borrowingRepository.findBorrowDetailById;
  let readCount = 0;
  let released = false;
  let restored = false;
  let barrierError;
  let releaseBarrier;
  const barrier = new Promise((resolve) => {
    releaseBarrier = resolve;
  });

  function release(error) {
    if (released) {
      return;
    }

    released = true;
    barrierError = error;
    clearTimeout(timeout);
    releaseBarrier();
  }

  const timeout = setTimeout(
    () => release(new Error(`${description} barrier expected two borrow-detail reads.`)),
    5000
  );

  borrowingRepository.findBorrowDetailById = async (...args) => {
    const detail = await originalFindBorrowDetailById.call(borrowingRepository, ...args);
    readCount += 1;
    if (readCount === 2) {
      release();
    }

    await barrier;
    if (barrierError) {
      throw barrierError;
    }

    return detail;

  };

  return {
    getReadCount: () => readCount,
    restore: () => {
      if (restored) {
        return;
      }

      restored = true;
      borrowingRepository.findBorrowDetailById = originalFindBorrowDetailById;
      if (!released) {
        release(new Error(`${description} barrier restored before both reads arrived.`));
      }
    },
  };
}

describe('FE07 borrowing management', () => {
  test('member lists real borrow candidates and can filter the selected book', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({ app, authDependencies, borrowingDependencies, email: 'borrow.candidates@example.test' });

    const response = await request(app)
      .get('/api/borrow-requests/candidates?bookId=1')
      .set('Authorization', authHeader(member.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.books).toHaveLength(1);
    expect(response.body.books[0]).toMatchObject({ bookId: 1, title: 'Clean Code' });
    expect(response.body.books[0].copies.map((copy) => copy.copyId)).toEqual([1, 2, 4, 5, 6, 7]);
  });

  test('member creates a pending request only for available unique copies', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'borrow.member@example.test',
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1, 2] });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.borrowRequest).toMatchObject({
      userId: member.userId,
      status: 'PENDING',
      details: [
        { copyId: 1, status: 'REQUESTED' },
        { copyId: 2, status: 'REQUESTED' },
      ],
    });

    const duplicateResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [4, 4] });

    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.error.code).toBe('DUPLICATE_COPY_IN_REQUEST');

    const unavailableResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [3] });

    expect(unavailableResponse.status).toBe(409);
    expect(unavailableResponse.body.error.code).toBe('COPY_NOT_AVAILABLE');
  });

  test('active reservation queue blocks ordinary borrow request creation', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'queue-blocked@example.test',
    });
    const queueOwner = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'queue-owner@example.test',
    });

    borrowingDependencies.state.reservations.push({
      reservationId: 901,
      userId: queueOwner.userId,
      copyId: 1,
      status: 'ACTIVE',

      reservedAt: new Date('2026-06-09T00:00:00.000Z'),
    });

    const response = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('RESERVATION_QUEUE_PRIORITY');
    expect(borrowingDependencies.state.borrowRequests).toHaveLength(0);
  });

  test('notified owner can request their reserved copy', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'held-owner@example.test',
    });
    borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'RESERVED';
    borrowingDependencies.state.reservations.push({
      reservationId: 902,
      userId: member.userId,
      copyId: 1,
      status: 'NOTIFIED',
      notifiedAt: new Date('2026-06-09T00:00:00.000Z'),
      expiresAt: new Date('2026-06-11T00:00:00.000Z'),
    });

    const response = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });

    expect(response.status).toBe(201);
    expect(response.body.borrowRequest.details[0]).toMatchObject({
      copyId: 1,
      status: 'REQUESTED',
    });
    expect(borrowingDependencies.state.reservations[0].status).toBe('NOTIFIED');
  });

  test('another member cannot request a reserved copy without owner disclosure', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const holdOwnerEmail = 'held-private-owner@example.test';
    const holdOwner = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: holdOwnerEmail,
    });
    const otherMember = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'held-other-member@example.test',
    });
    borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'RESERVED';
    borrowingDependencies.state.reservations.push({
      reservationId: 903,
      userId: holdOwner.userId,
      copyId: 1,
      status: 'NOTIFIED',
      notifiedAt: new Date('2026-06-09T00:00:00.000Z'),
      expiresAt: new Date('2026-06-11T00:00:00.000Z'),
    });

    const response = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(otherMember.accessToken))
      .send({ copyIds: [1] });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('COPY_NOT_AVAILABLE');
    expect(response.body.error).not.toHaveProperty('userId');
    expect(response.body.error).not.toHaveProperty('reservationOwnerId');
    expect(JSON.stringify(response.body)).not.toContain(holdOwnerEmail);
    expect(borrowingDependencies.state.borrowRequests).toHaveLength(0);

  });

  test('borrow approval fulfills reservation held for the requesting member', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'fulfills-reservation.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'fulfills-reservation.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const heldCopy = borrowingDependencies.state.copies.find((copy) => copy.copyId === 1);
    heldCopy.status = 'RESERVED';
    const heldReservation = {
      reservationId: 904,
      userId: member.userId,
      copyId: 1,
      status: 'NOTIFIED',
      notifiedAt: new Date('2026-06-09T00:00:00.000Z'),
      expiresAt: new Date('2026-06-11T00:00:00.000Z'),
    };
    borrowingDependencies.state.reservations.push(heldReservation);

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);

    const approveResponse = await request(app)
      .patch(`/api/borrow-requests/${createResponse.body.borrowRequest.requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});

    expect(approveResponse.status).toBe(200);
    expect(heldReservation.status).toBe('FULFILLED');
    expect(heldCopy.status).toBe('BORROWED');
    expect(authDependencies.state.auditLogs.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(['BORROW_REQUEST_APPROVE', 'RESERVATION_FULFILL'])
    );
  });

  test('reservation audit failure rolls back borrow approval and fulfillment', async () => {
    const setup = makeTestApp();
    const member = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'reservation-audit.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'reservation-audit.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const heldCopy = setup.borrowingDependencies.state.copies.find((copy) => copy.copyId === 1);
    heldCopy.status = 'RESERVED';
    setup.borrowingDependencies.state.reservations.push({
      reservationId: 905,
      userId: member.userId,
      copyId: 1,
      status: 'NOTIFIED',
      notifiedAt: new Date('2026-06-09T00:00:00.000Z'),
      expiresAt: new Date('2026-06-11T00:00:00.000Z'),
    });

    const createResponse = await request(setup.app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })

      .expect(201);
    const requestId = createResponse.body.borrowRequest.requestId;
    const reservationAuditFailingRepository = makeReservationAuditFailingRepository(
      setup.authDependencies.auditLogRepository
    );
    const { app } = makeTestApp({
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      auditLogRepository: reservationAuditFailingRepository,
    });
    const auditLogsBefore = setup.authDependencies.state.auditLogs.map((entry) => ({ ...entry }));

    const response = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});

    expect(response.status).toBe(500);
    expect(reservationAuditFailingRepository.create).toHaveBeenCalledTimes(2);
    expect(setup.borrowingDependencies.state.borrowRequests[0].status).toBe('PENDING');
    expect(setup.borrowingDependencies.state.borrowDetails[0]).toMatchObject({
      status: 'REQUESTED',
      borrowDate: null,
      dueDate: null,
    });
    expect(
      setup.borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status
    ).toBe('RESERVED');
    expect(setup.borrowingDependencies.state.reservations[0].status).toBe('NOTIFIED');
    expect(setup.authDependencies.state.auditLogs).toEqual(auditLogsBefore);
  });

  test('librarian approval uses the FE07-bound requester with the canonical due-date request', async () => {
    const { app, authDependencies, borrowingDependencies, notificationStub } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'approve.member@example.test',
    });
    const otherMember = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'approve.other@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'approve.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });
    const requestId = createResponse.body.borrowRequest.requestId;

    await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(otherMember.accessToken))
      .send({ copyIds: [2] })
      .expect(201);

    const approveResponse = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ notes: 'ok' });

    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.borrowRequest).toMatchObject({
      requestId,
      status: 'APPROVED',
      details: [{ copyId: 1, status: 'BORROWED', renewalCount: 0 }],
    });
    expect(approveResponse.body.borrowRequest.details[0].dueDate).toBeTruthy();
    expect(borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(

      'BORROWED'
    );
    expect(notificationStub.service.createSourceNotificationRequester).toHaveBeenCalledTimes(1);
    expect(notificationStub.service.createSourceNotificationRequester).toHaveBeenCalledWith('FE07');
    expect(notificationStub.requester.createNotificationRequest).toHaveBeenCalledTimes(1);
    const notificationRequest = notificationStub.requester.createNotificationRequest.mock.calls[0][0];
    expect(notificationRequest).toEqual({
      type: 'DUE_DATE_REMINDER',
      channel: 'EMAIL',
      templateKey: 'DUE_DATE_REMINDER',
      userId: member.userId,
      recipientEmail: 'approve.member@example.test',
      templateData: {
        purpose: 'BORROW_APPROVED',
        requestId,
        dueDate: expect.any(Date),
      },
      sourceEntityType: 'BORROWING',
      sourceEntityId: requestId,
    });
    expect(notificationRequest).not.toHaveProperty('sourceFeature');

    const ownHistoryResponse = await request(app)
      .get('/api/borrow-requests/me')
      .set('Authorization', authHeader(member.accessToken));

    expect(ownHistoryResponse.status).toBe(200);
    expect(ownHistoryResponse.body.borrowings).toHaveLength(1);
    expect(ownHistoryResponse.body.borrowings[0].userId).toBe(member.userId);
  });

  test('return processing updates detail, copy, completion, and fine candidate data', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'return.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'return.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });
    const requestId = createResponse.body.borrowRequest.requestId;

    const approveResponse = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});
    const borrowDetailId = approveResponse.body.borrowRequest.details[0].borrowDetailId;
    borrowingDependencies.state.borrowDetails.find(
      (detail) => detail.borrowDetailId === borrowDetailId
    ).dueDate = new Date('2026-06-01T00:00:00.000Z');

    const returnResponse = await request(app)
      .patch(`/api/borrow-details/${borrowDetailId}/return`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ condition: 'DAMAGED', returnDate: '2026-06-10' });

    expect(returnResponse.status).toBe(200);
    expect(returnResponse.body.borrowDetail).toMatchObject({
      borrowDetailId,
      status: 'DAMAGED',
    });
    expect(returnResponse.body.fineCandidate).toMatchObject({
      borrowDetailId,
      condition: 'DAMAGED',
      needsFineReview: true,
    });
    expect(returnResponse.body.fineCandidate.overdueDays).toBe(9);
    expect(borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(

      'DAMAGED'
    );
    expect(
      borrowingDependencies.state.borrowRequests.find((requestItem) => requestItem.requestId === requestId)
        .status
    ).toBe('COMPLETED');
    expect(borrowingDependencies.state.fines).toHaveLength(0);
  });

  test('HTTP borrow detail calendar dates use YYYY-MM-DD and retain null values', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'borrow-detail-dates.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'borrow-detail-dates.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const created = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    expect(created.body.borrowRequest.details[0]).toMatchObject({
      borrowDate: null,
      dueDate: null,
      returnDate: null,
      createdAt: expect.stringMatching(/T/),
    });

    const approved = await request(app)
      .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(200);
    const approvedDetail = approved.body.borrowRequest.details[0];
    expect(approvedDetail).toMatchObject({
      borrowDate: '2026-06-10',
      dueDate: '2026-06-24',
      returnDate: null,
      createdAt: expect.stringMatching(/T/),
      updatedAt: expect.stringMatching(/T/),
    });

    const returned = await request(app)
      .patch(`/api/borrow-details/${approvedDetail.borrowDetailId}/return`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ condition: 'NORMAL', returnDate: '2026-06-10' })
      .expect(200);
    expect(returned.body.borrowDetail).toMatchObject({
      borrowDate: '2026-06-10',
      dueDate: '2026-06-24',
      returnDate: '2026-06-10',
      createdAt: expect.stringMatching(/T/),
      updatedAt: expect.stringMatching(/T/),
    });
  });

  test('renewal uses the FE07-bound requester with the canonical due-date request', async () => {
    const { app, authDependencies, borrowingDependencies, notificationStub } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'renew.member@example.test',
    });
    const otherMember = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'renew.other@example.test',
    });

    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'renew.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1, 2] });
    const requestId = createResponse.body.borrowRequest.requestId;

    const approveResponse = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});
    const firstDetail = approveResponse.body.borrowRequest.details[0];
    const secondDetail = approveResponse.body.borrowRequest.details[1];

    const renewResponse = await request(app)
      .patch(`/api/borrow-details/${firstDetail.borrowDetailId}/renew`)
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(renewResponse.status).toBe(200);
    expect(renewResponse.body.borrowDetail.renewalCount).toBe(1);
    expect(notificationStub.requester.createNotificationRequest).toHaveBeenCalledTimes(2);
    const notificationRequest = notificationStub.requester.createNotificationRequest.mock.calls[1][0];
    expect(notificationRequest).toEqual({
      type: 'DUE_DATE_REMINDER',
      channel: 'EMAIL',
      templateKey: 'DUE_DATE_REMINDER',
      userId: member.userId,
      recipientEmail: 'renew.member@example.test',
      templateData: {
        purpose: 'BORROW_RENEWED',
        requestId,
        borrowDetailId: firstDetail.borrowDetailId,
        dueDate: expect.any(Date),
      },
      sourceEntityType: 'BORROWING',
      sourceEntityId: requestId,
    });
    expect(notificationRequest).not.toHaveProperty('sourceFeature');

    const repeatRenewResponse = await request(app)
      .patch(`/api/borrow-details/${firstDetail.borrowDetailId}/renew`)
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(repeatRenewResponse.status).toBe(409);
    expect(repeatRenewResponse.body.error.code).toBe('RENEWAL_LIMIT_REACHED');

    borrowingDependencies.state.reservations.push({
      reservationId: 1,
      userId: otherMember.userId,
      copyId: secondDetail.copyId,
      status: 'ACTIVE',
    });

    const reservationConflictResponse = await request(app)
      .patch(`/api/borrow-details/${secondDetail.borrowDetailId}/renew`)
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(reservationConflictResponse.status).toBe(409);
    expect(reservationConflictResponse.body.error.code).toBe('RESERVATION_BLOCKS_RENEWAL');
  });

  // BR-FE07-015, BR-FE07-016, FR-FE07-009: the repository conditional write must choose one
  // winner after both requests read the same pre-renewal state, so only it records side effects.
  test('concurrent renewals allow one winner and one renewal side effect', async () => {
    const { app, authDependencies, borrowingDependencies, notificationStub } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,

      email: 'renewal-race.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'renewal-race.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    const requestId = createResponse.body.borrowRequest.requestId;
    const approveResponse = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(200);
    const borrowDetailId = approveResponse.body.borrowRequest.details[0].borrowDetailId;
    const originalDueDate = new Date(approveResponse.body.borrowRequest.details[0].dueDate);

    const readBarrier = installTwoPartyBorrowDetailReadBarrier(
      borrowingDependencies.borrowingRepository
    );
    const renewalRequests = [
      Promise.resolve(
        request(app)
          .patch(`/api/borrow-details/${borrowDetailId}/renew`)
          .set('Authorization', authHeader(member.accessToken))
          .send({})
      ),
      Promise.resolve(
        request(app)
          .patch(`/api/borrow-details/${borrowDetailId}/renew`)
          .set('Authorization', authHeader(member.accessToken))
          .send({})
      ),
    ];
    let settlements;

    try {
      settlements = await Promise.allSettled(renewalRequests);
    } finally {
      readBarrier.restore();
      settlements = await Promise.allSettled(renewalRequests);
    }

    expect(readBarrier.getReadCount()).toBe(2);
    expect(settlements.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);
    const responses = settlements.map((result) => result.value);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(responses.find((response) => response.status === 409).body.error.code).toBe(
      'RENEWAL_LIMIT_REACHED'
    );

    const storedDetail = borrowingDependencies.state.borrowDetails.find(
      (detail) => detail.borrowDetailId === borrowDetailId
    );
    expect(storedDetail.renewalCount).toBe(1);
    expect(new Date(storedDetail.dueDate).toISOString()).toBe(
      new Date(originalDueDate.setDate(originalDueDate.getDate() + 14)).toISOString()
    );
    expect(
      authDependencies.state.auditLogs.filter(
        (entry) => entry.action === 'BORROW_DETAIL_RENEW' && entry.targetId === borrowDetailId
      )
    ).toHaveLength(1);
    expect(
      notificationStub.requester.createNotificationRequest.mock.calls.filter(
        ([notification]) => notification.templateData.purpose === 'BORROW_RENEWED'
      )
    ).toHaveLength(1);
  });

  test('requester failures do not block completed approval or renewal state changes', async () => {
    const notificationStub = makeNotificationRequesterStub({ error: new Error('provider failure') });

    const { app, authDependencies, borrowingDependencies } = makeTestApp({ notificationStub });
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'non-blocking.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'non-blocking.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });
    const requestId = createResponse.body.borrowRequest.requestId;

    const approveResponse = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});

    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.borrowRequest.status).toBe('APPROVED');
    const borrowDetailId = approveResponse.body.borrowRequest.details[0].borrowDetailId;
    expect(borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(
      'BORROWED'
    );

    const renewResponse = await request(app)
      .patch(`/api/borrow-details/${borrowDetailId}/renew`)
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(renewResponse.status).toBe(200);
    expect(renewResponse.body.borrowDetail.renewalCount).toBe(1);
    expect(notificationStub.requester.createNotificationRequest).toHaveBeenCalledTimes(2);
  });

  test('borrowing endpoints enforce authentication and staff/member roles', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'borrow.role.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'borrow.role.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    await request(app).post('/api/borrow-requests').send({ copyIds: [1] }).expect(401);

    const memberListAllResponse = await request(app)
      .get('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken));

    expect(memberListAllResponse.status).toBe(403);
    expect(memberListAllResponse.body.error.code).toBe('ROLE_REQUIRED');

    const staffCreateResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyIds: [1] });

    expect(staffCreateResponse.status).toBe(403);
    expect(staffCreateResponse.body.error.code).toBe('ROLE_REQUIRED');
  });

  // AC-FE07-012, FR-FE07-011: every selected-member and supported filter predicate is required.

  test('librarian retrieves only the matching selected-member borrowing with status and date filters', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'member-history.selected@example.test',
    });
    const otherMember = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'member-history.other@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'member-history.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const selectedIncluded = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });
    const selectedWrongStatus = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [2] });
    const selectedBeforeRange = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [4] });
    const selectedAfterRange = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [5] });
    const otherMatching = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(otherMember.accessToken))
      .send({ copyIds: [6] });

    for (const requestId of [
      selectedIncluded.body.borrowRequest.requestId,
      selectedBeforeRange.body.borrowRequest.requestId,
      selectedAfterRange.body.borrowRequest.requestId,
      otherMatching.body.borrowRequest.requestId,
    ]) {
      await request(app)
        .patch(`/api/borrow-requests/${requestId}/approve`)
        .set('Authorization', authHeader(librarian.accessToken))
        .send({})
        .expect(200);
    }

    borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === selectedIncluded.body.borrowRequest.requestId
    ).requestDate = new Date('2026-06-11T18:00:00.000Z');
    borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === selectedWrongStatus.body.borrowRequest.requestId
    ).requestDate = new Date('2026-06-11T18:00:00.000Z');
    borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === selectedBeforeRange.body.borrowRequest.requestId
    ).requestDate = new Date('2026-06-08T00:00:00.000Z');
    borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === selectedAfterRange.body.borrowRequest.requestId
    ).requestDate = new Date('2026-06-12T00:00:00.000Z');
    borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === otherMatching.body.borrowRequest.requestId
    ).requestDate = new Date('2026-06-10T00:00:00.000Z');
    for (const [created, borrowDate] of [
      [selectedIncluded, '2026-06-11T18:00:00.000Z'],
      [selectedWrongStatus, '2026-06-11T18:00:00.000Z'],
      [selectedBeforeRange, '2026-06-08T00:00:00.000Z'],
      [selectedAfterRange, '2026-06-12T00:00:00.000Z'],
      [otherMatching, '2026-06-10T00:00:00.000Z'],
    ]) {
      const detail = borrowingDependencies.state.borrowDetails.find(

        (item) => item.requestId === created.body.borrowRequest.requestId
      );
      if (detail) detail.borrowDate = new Date(borrowDate);
    }

    const response = await request(app)
      .get(`/api/members/${member.userId}/borrowings`)
      .query({ status: 'BORROWED', fromDate: '2026-06-09', toDate: '2026-06-11' })
      .set('Authorization', authHeader(librarian.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.borrowings).toHaveLength(1);
    expect(response.body.borrowings[0]).toMatchObject({
      copyId: 1,
      status: 'BORROWED',
      member: { userId: member.userId },
    });
  });

  // EC-FE07-001: distinguish a missing member from a valid member with no loans.
  test('selected-member borrowing lookup returns not found for an unknown member ID', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'member-history.not-found.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const response = await request(app)
      .get('/api/members/999999/borrowings')
      .set('Authorization', authHeader(librarian.accessToken));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('MEMBER_NOT_FOUND');
  });

  test('member history includes a request later on toDate and excludes the following date', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'history-inclusive-date.member@example.test',
    });
    const included = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    const excluded = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [2] })
      .expect(201);

    borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === included.body.borrowRequest.requestId
    ).requestDate = new Date('2026-06-11T18:00:00.000Z');
    borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === excluded.body.borrowRequest.requestId
    ).requestDate = new Date('2026-06-12T00:00:00.000Z');

    const response = await request(app)
      .get('/api/borrow-requests/me')
      .query({ fromDate: '2026-06-09', toDate: '2026-06-11' })
      .set('Authorization', authHeader(member.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.borrowings).toHaveLength(1);
    expect(response.body.borrowings[0].requestId).toBe(
      included.body.borrowRequest.requestId
    );
  });

  // AC-FE07-012, FR-FE07-011: OVERDUE is derived from a past-due BORROWED detail.
  test('librarian filters selected-member borrowings by derived OVERDUE status', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();

    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'overdue-history.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'overdue-history.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const created = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    const approved = await request(app)
      .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(200);
    const borrowDetailId = approved.body.borrowRequest.details[0].borrowDetailId;
    borrowingDependencies.state.borrowDetails.find(
      (detail) => detail.borrowDetailId === borrowDetailId
    ).dueDate = new Date('2000-01-01T00:00:00.000Z');

    const response = await request(app)
      .get(`/api/members/${member.userId}/borrowings`)
      .query({ status: 'OVERDUE' })
      .set('Authorization', authHeader(librarian.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.borrowings).toHaveLength(1);
    expect(response.body.borrowings[0]).toMatchObject({
      borrowDetailId,
      status: 'OVERDUE',
      dueDate: '2000-01-01',
    });
  });

  // AC-FE07-011: a member's history is scoped to their own requests.
  test('member history excludes another member request', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'history-owner.member@example.test',
    });
    const otherMember = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'history-other.member@example.test',
    });

    const ownRequest = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(otherMember.accessToken))
      .send({ copyIds: [2] })
      .expect(201);

    const response = await request(app)
      .get('/api/borrow-requests/me')
      .set('Authorization', authHeader(member.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.borrowings).toHaveLength(1);
    expect(response.body.borrowings[0]).toMatchObject({
      requestId: ownRequest.body.borrowRequest.requestId,
      userId: member.userId,

    });
  });

  // @spec FR-FE07-029, AC-FE07-023
  test('member history exposes a rejected owning request without changing detail status', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'rejected-history.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'rejected-history.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const created = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);

    await request(app)
      .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/reject`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ reason: 'Không thể xử lý yêu cầu này.' })
      .expect(200);

    const history = await request(app)
      .get('/api/borrow-requests/me')
      .set('Authorization', authHeader(member.accessToken))
      .expect(200);

    expect(history.body.borrowings).toEqual([
      expect.objectContaining({
        requestId: created.body.borrowRequest.requestId,
        status: 'REQUESTED',
        requestStatus: 'REJECTED',
      }),
    ]);
  });

  // AC-FE07-002, FR-FE07-015: inactive accounts are rejected; active MEMBER accounts need no FE04 approval.
  test('inactive account is rejected while an active MEMBER can create a borrow request', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();

    const inactiveMember = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'inactive.member@example.test',
    });

    const inactiveUserRecord = authDependencies.state.users.find(
      (user) => user.userId === inactiveMember.userId
    );
    inactiveUserRecord.status = 'INACTIVE';

    const inactiveResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(inactiveMember.accessToken))
      .send({ copyIds: [1] });

    expect(inactiveResponse.status).toBe(403);
    expect(inactiveResponse.body.error.code).toBe('MEMBER_ACCOUNT_INACTIVE');
    expect(borrowingDependencies.state.borrowRequests).toHaveLength(0);

    const unapprovedMember = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'unapproved.member@example.test',
      approveMember: false,
    });

    const unapprovedResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(unapprovedMember.accessToken))
      .send({ copyIds: [1] });

    expect(unapprovedResponse.status).toBe(201);
    expect(unapprovedResponse.body.borrowRequest).toMatchObject({ userId: unapprovedMember.userId, status: 'PENDING' });
    expect(borrowingDependencies.state.borrowRequests).toHaveLength(1);
  });

  test('inactive parent book cannot create a borrow request and changes no state', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'inactive-parent-book.member@example.test',
    });

    borrowingDependencies.state.books[0].status = 'INACTIVE';
    const response = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('BOOK_INACTIVE');
    expect(borrowingDependencies.state.borrowRequests).toHaveLength(0);
    expect(borrowingDependencies.state.borrowDetails).toHaveLength(0);
  });

  test('approval rechecks an inactive parent book and preserves pending state', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'approval-inactive-parent-book.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'approval-inactive-parent-book.librarian@example.test',

      role: 'LIBRARIAN',
      approveMember: false,
    });

    const created = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    borrowingDependencies.state.books[0].status = 'INACTIVE';

    const response = await request(app)
      .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(409);

    expect(response.body.error.code).toBe('BOOK_INACTIVE');
    expect(borrowingDependencies.state.borrowRequests[0].status).toBe('PENDING');
    expect(borrowingDependencies.state.borrowDetails[0].status).toBe('REQUESTED');
    expect(borrowingDependencies.state.copies[0].status).toBe('AVAILABLE');
  });

  test('future return date is rejected against the server business date', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'future-return.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'future-return.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const created = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    const approved = await request(app)
      .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(200);

    const response = await request(app)
      .patch(`/api/borrow-details/${approved.body.borrowRequest.details[0].borrowDetailId}/return`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ condition: 'NORMAL', returnDate: '2026-06-11' })
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_RETURN_DATE');
    expect(borrowingDependencies.state.borrowDetails[0].status).toBe('BORROWED');
    expect(borrowingDependencies.state.copies[0].status).toBe('BORROWED');
  });

  test('history returns deterministic pagination metadata and borrow-date ordering', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'history-pagination.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'history-pagination.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const first = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))

      .send({ copyIds: [1] })
      .expect(201);
    const second = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [2] })
      .expect(201);
    for (const created of [first, second]) {
      await request(app)
        .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
        .set('Authorization', authHeader(librarian.accessToken))
        .send({})
        .expect(200);
    }

    borrowingDependencies.state.borrowDetails[0].borrowDate = new Date('2026-06-08T00:00:00.000Z');
    borrowingDependencies.state.borrowDetails[1].borrowDate = new Date('2026-06-09T00:00:00.000Z');
    const response = await request(app)
      .get('/api/members/' + member.userId + '/borrowings')
      .query({ page: 1, limit: 1, fromDate: '2026-06-08', toDate: '2026-06-09' })
      .set('Authorization', authHeader(librarian.accessToken))
      .expect(200);

    expect(response.body.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(response.body.borrowings).toHaveLength(1);
    expect(response.body.borrowings[0].borrowDate).toBe('2026-06-09');

    const memberResponse = await request(app)
      .get('/api/borrow-requests/me')
      .query({ status: 'BORROWED', page: 1, limit: 1, fromDate: '2026-06-08', toDate: '2026-06-09' })
      .set('Authorization', authHeader(member.accessToken))
      .expect(200);

    expect(memberResponse.body.pagination).toEqual({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
    expect(memberResponse.body.borrowings).toHaveLength(1);
    expect(memberResponse.body.borrowings[0].borrowDate).toBe('2026-06-09');
  });

  // AC-FE07-003, FR-FE07-014: exceeding 5 active borrowed copies is rejected.
  test('member exceeding the borrow limit of 5 active copies is rejected', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'limit.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'limit.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1, 2, 4, 5, 6] });

    expect(createResponse.status).toBe(201);
    const requestId = createResponse.body.borrowRequest.requestId;

    await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(200);

    const overLimitResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [7] });

    expect(overLimitResponse.status).toBe(409);
    expect(overLimitResponse.body.error.code).toBe('BORROW_LIMIT_EXCEEDED');
    // No extra request was created beyond the first (still-active) one.
    expect(borrowingDependencies.state.borrowRequests).toHaveLength(1);
  });

  test('member without approved membership is limited to 3 requested copies per day', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'daily-limit.standard@example.test',
      approveMember: false,
    });

    await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1, 2, 4] })
      .expect(201);

    borrowingDependencies.state.borrowRequests[0].requestDate = new Date('2026-06-10T00:00:00.000Z');

    const response = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [5] })
      .expect(409);

    expect(response.body.error.code).toBe('BORROW_DAILY_LIMIT_EXCEEDED');
    expect(borrowingDependencies.state.borrowRequests).toHaveLength(1);
  });

  // AC-FE07-005, FR-FE07-018: a copy that is no longer AVAILABLE at approval time is rejected
  // and the request/details/copy data stay unchanged.
  test('approval is rejected when a copy is no longer available and leaves data unchanged', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'unavailable.member@example.test',

    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'unavailable.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });
    const requestId = createResponse.body.borrowRequest.requestId;

    // Another process makes the copy unavailable before the librarian approves.
    borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'BORROWED';

    const approveResponse = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});

    expect(approveResponse.status).toBe(409);
    expect(approveResponse.body.error.code).toBe('COPY_NOT_AVAILABLE');

    // Request stays PENDING, detail stays REQUESTED, copy status was not flipped by approval.
    const storedRequest = borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === requestId
    );
    expect(storedRequest.status).toBe('PENDING');
    const storedDetail = borrowingDependencies.state.borrowDetails.find(
      (item) => item.requestId === requestId
    );
    expect(storedDetail.status).toBe('REQUESTED');
    expect(storedDetail.dueDate).toBeNull();
  });

  // AC-FE07-006, BR-FE07-011, BR-FE07-012: a normal return stores a return date and frees the copy.
  test('normal return marks the copy AVAILABLE and stores the return date', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'normal.return.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'normal.return.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });
    const requestId = createResponse.body.borrowRequest.requestId;

    const approveResponse = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});
    const borrowDetailId = approveResponse.body.borrowRequest.details[0].borrowDetailId;

    const returnResponse = await request(app)
      .patch(`/api/borrow-details/${borrowDetailId}/return`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ condition: 'NORMAL', returnDate: '2026-06-10' });

    expect(returnResponse.status).toBe(200);
    expect(returnResponse.body.borrowDetail).toMatchObject({
      borrowDetailId,
      status: 'RETURNED',
    });
    expect(returnResponse.body.borrowDetail.returnDate).toBeTruthy();

    expect(returnResponse.body.fineCandidate).toMatchObject({
      borrowDetailId,
      condition: 'NORMAL',
      overdueDays: 0,
      needsFineReview: false,
    });
    expect(borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(
      'AVAILABLE'
    );
    expect(
      borrowingDependencies.state.borrowRequests.find((item) => item.requestId === requestId).status
    ).toBe('COMPLETED');
    expect(borrowingDependencies.state.fines).toHaveLength(0);
  });

  // FR-FE07-021: returning a detail that is not BORROWED (e.g. a second return) is rejected,
  // and a return date earlier than the borrow date is rejected as an invalid transition.
  test('invalid return transitions are rejected (second return and return date before borrow date)', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'invalid.return.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'invalid.return.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });
    const requestId = createResponse.body.borrowRequest.requestId;

    const approveResponse = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});
    const borrowDetailId = approveResponse.body.borrowRequest.details[0].borrowDetailId;

    // Return date before borrow date (borrow date is the approval clock 2026-06-10).
    const earlyReturnResponse = await request(app)
      .patch(`/api/borrow-details/${borrowDetailId}/return`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ condition: 'NORMAL', returnDate: '2026-06-09' });

    expect(earlyReturnResponse.status).toBe(400);
    expect(earlyReturnResponse.body.error.code).toBe('INVALID_RETURN_DATE');
    expect(
      borrowingDependencies.state.borrowDetails.find(
        (item) => item.borrowDetailId === borrowDetailId
      ).status
    ).toBe('BORROWED');

    // First valid return succeeds.
    await request(app)
      .patch(`/api/borrow-details/${borrowDetailId}/return`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ condition: 'NORMAL', returnDate: '2026-06-10' })
      .expect(200);

    // Second return on an already-returned detail is rejected as invalid state.
    const secondReturnResponse = await request(app)
      .patch(`/api/borrow-details/${borrowDetailId}/return`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ condition: 'NORMAL', returnDate: '2026-06-10' });

    expect(secondReturnResponse.status).toBe(409);
    expect(secondReturnResponse.body.error.code).toBe('BORROW_DETAIL_NOT_BORROWED');
  });

  // FR-FE07-021, FR-FE07-022: a conditional repository return chooses one winner after both
  // handlers read BORROWED, so the loser returns a conflict with no success-shaped data or audit.
  test('concurrent returns allow one winner and one return audit', async () => {

    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'return-race.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'return-race.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    const requestId = createResponse.body.borrowRequest.requestId;
    const approveResponse = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(200);
    const borrowDetailId = approveResponse.body.borrowRequest.details[0].borrowDetailId;

    const readBarrier = installTwoPartyBorrowDetailReadBarrier(
      borrowingDependencies.borrowingRepository,
      'Return race'
    );
    const returnRequests = [
      Promise.resolve(
        request(app)
          .patch(`/api/borrow-details/${borrowDetailId}/return`)
          .set('Authorization', authHeader(librarian.accessToken))
          .send({ condition: 'NORMAL', returnDate: '2026-06-10' })
      ),
      Promise.resolve(
        request(app)
          .patch(`/api/borrow-details/${borrowDetailId}/return`)
          .set('Authorization', authHeader(librarian.accessToken))
          .send({ condition: 'NORMAL', returnDate: '2026-06-10' })
      ),
    ];
    let settlements;

    try {
      settlements = await Promise.allSettled(returnRequests);
    } finally {
      readBarrier.restore();
      settlements = await Promise.allSettled(returnRequests);
    }

    expect(readBarrier.getReadCount()).toBe(2);
    expect(settlements.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);
    const responses = settlements.map((result) => result.value);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);

    const winner = responses.find((response) => response.status === 200);
    const loser = responses.find((response) => response.status === 409);
    expect(winner.body.borrowDetail).toMatchObject({ borrowDetailId, status: 'RETURNED' });
    expect(winner.body.borrowDetail.returnDate).toBeTruthy();
    expect(winner.body.fineCandidate).toMatchObject({
      userId: member.userId,
      borrowDetailId,
      copyId: 1,
      condition: 'NORMAL',
      overdueDays: 0,
      needsFineReview: false,
    });
    expect(loser.body.error.code).toBe('BORROW_DETAIL_NOT_BORROWED');
    expect(loser.body).not.toHaveProperty('borrowDetail');
    expect(loser.body).not.toHaveProperty('fineCandidate');

    const storedDetail = borrowingDependencies.state.borrowDetails.find(
      (detail) => detail.borrowDetailId === borrowDetailId
    );

    expect(storedDetail).toMatchObject({ status: 'RETURNED' });
    expect(storedDetail.returnDate).toBeTruthy();
    expect(borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(
      'AVAILABLE'
    );
    expect(
      borrowingDependencies.state.borrowRequests.find((item) => item.requestId === requestId).status
    ).toBe('COMPLETED');
    expect(
      authDependencies.state.auditLogs.filter(
        (entry) => entry.action === 'BORROW_DETAIL_RETURN' && entry.targetId === borrowDetailId
      )
    ).toHaveLength(1);
  });

  // FR-FE07-019: two requests target the same copy; only one approval may win and the copy must not
  // be double-borrowed. The later approval is rejected and its request stays PENDING.
  test('concurrent approvals of the same copy do not double-borrow it', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const firstMember = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'race.first@example.test',
    });
    const secondMember = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'race.second@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'race.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    // Both members request the same available copy while it is still AVAILABLE.
    const firstRequest = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(firstMember.accessToken))
      .send({ copyIds: [1] });
    const secondRequest = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(secondMember.accessToken))
      .send({ copyIds: [1] });

    expect(firstRequest.status).toBe(201);
    expect(secondRequest.status).toBe(201);

    // First approval wins.
    await request(app)
      .patch(`/api/borrow-requests/${firstRequest.body.borrowRequest.requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(200);

    // Second approval on the now-unavailable copy is rejected; no double-borrow.
    const secondApproval = await request(app)
      .patch(`/api/borrow-requests/${secondRequest.body.borrowRequest.requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});

    expect(secondApproval.status).toBe(409);
    expect(secondApproval.body.error.code).toBe('COPY_NOT_AVAILABLE');

    const secondStored = borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === secondRequest.body.borrowRequest.requestId
    );
    expect(secondStored.status).toBe('PENDING');
    // The copy is borrowed exactly once.
    const borrowedForCopyOne = borrowingDependencies.state.borrowDetails.filter(
      (detail) => detail.copyId === 1 && detail.status === 'BORROWED'
    );
    expect(borrowedForCopyOne).toHaveLength(1);
  });


  // BR-FE07-005, FR-FE07-022: approval must re-check the member limit atomically so two
  // different available copies cannot both be approved after separate prechecks at four loans.
  test('concurrent approvals for different copies by the same member allow only one at the five-copy limit', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'member-limit-race@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'member-limit-race.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const seededAt = new Date('2026-06-01T00:00:00.000Z');

    // Seed exactly four already-active loans before the two pending one-copy requests are created.
    [1, 2, 3, 4].forEach((copyId, index) => {
      const requestId = 100 + index;
      borrowingDependencies.state.copies.find((copy) => copy.copyId === copyId).status = 'BORROWED';
      borrowingDependencies.state.borrowRequests.push({
        requestId,
        userId: member.userId,
        requestDate: seededAt,
        status: 'APPROVED',
        createdBy: member.userId,
        approvedBy: librarian.userId,
        approvedAt: seededAt,
        rejectedAt: null,
        processedAt: seededAt,
        createdAt: seededAt,
        updatedAt: seededAt,
      });
      borrowingDependencies.state.borrowDetails.push({
        borrowDetailId: 100 + index,
        requestId,
        userId: member.userId,
        copyId,
        borrowDate: seededAt,
        dueDate: new Date('2026-06-15T00:00:00.000Z'),
        returnDate: null,
        renewalCount: 0,
        status: 'BORROWED',
        createdAt: seededAt,
        updatedAt: seededAt,
      });
    });

    const firstRequest = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [5] })
      .expect(201);
    const secondRequest = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [6] })
      .expect(201);
    const raceRequestIds = [
      firstRequest.body.borrowRequest.requestId,
      secondRequest.body.borrowRequest.requestId,
    ];
    const countActiveBorrowedCopies =
      borrowingDependencies.borrowingRepository.countActiveBorrowedCopies.bind(
        borrowingDependencies.borrowingRepository
      );
    let waitingApprovals = 0;
    let releaseBothApprovals;
    const bothApprovalPrechecksReached = new Promise((resolve) => {
      releaseBothApprovals = resolve;
    });

    // Make both service prechecks observe the same four active loans before either repository
    // approval runs. This exposes whether the repository itself closes the race.
    borrowingDependencies.borrowingRepository.countActiveBorrowedCopies = async (userId) => {
      const activeCount = await countActiveBorrowedCopies(userId);

      waitingApprovals += 1;
      if (waitingApprovals === 2) {
        releaseBothApprovals();
      }
      await bothApprovalPrechecksReached;
      return activeCount;
    };

    const approvals = await Promise.all(
      raceRequestIds.map((requestId) =>
        request(app)
          .patch(`/api/borrow-requests/${requestId}/approve`)
          .set('Authorization', authHeader(librarian.accessToken))
          .send({})
      )
    );

    expect(approvals.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(approvals.find((response) => response.status === 409).body.error.code).toBe(
      'BORROW_LIMIT_EXCEEDED'
    );
    expect(
      borrowingDependencies.state.borrowDetails.filter(
        (detail) => detail.userId === member.userId && detail.status === 'BORROWED'
      )
    ).toHaveLength(5);

    const racedRequests = borrowingDependencies.state.borrowRequests.filter((item) =>
      raceRequestIds.includes(item.requestId)
    );
    expect(racedRequests.map((item) => item.status).sort()).toEqual(['APPROVED', 'PENDING']);

    const winningRequest = racedRequests.find((item) => item.status === 'APPROVED');
    const losingRequest = racedRequests.find((item) => item.status === 'PENDING');
    const winningDetail = borrowingDependencies.state.borrowDetails.find(
      (detail) => detail.requestId === winningRequest.requestId
    );
    const losingDetail = borrowingDependencies.state.borrowDetails.find(
      (detail) => detail.requestId === losingRequest.requestId
    );
    expect(
      borrowingDependencies.state.copies.find((copy) => copy.copyId === winningDetail.copyId).status
    ).toBe('BORROWED');
    expect(
      borrowingDependencies.state.copies.find((copy) => copy.copyId === losingDetail.copyId).status
    ).toBe('AVAILABLE');
    expect(
      authDependencies.state.auditLogs.filter(
        (entry) =>
          entry.action === 'BORROW_REQUEST_APPROVE' && raceRequestIds.includes(entry.targetId)
      )
    ).toHaveLength(1);
  });

  // FR-FE07-016, BR-FE07-006: an unpaid fine (> 0) blocks creating a new borrow request.
  test('member with an unpaid fine cannot create a borrow request', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'fined.member@example.test',
    });

    borrowingDependencies.state.fines.push({
      fineId: 1,
      userId: member.userId,
      status: 'UNPAID',
      amount: 5000,
    });

    const response = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('UNPAID_FINE_BLOCKS_BORROWING');
    expect(borrowingDependencies.state.borrowRequests).toHaveLength(0);
  });


  // AC-FE07-010, FR-FE07-020: each blocker rejects renewal without changing the due date.
  test.each([
    ['overdue', 'BORROW_DETAIL_OVERDUE'],
    ['renewal limit', 'RENEWAL_LIMIT_REACHED'],
    ['unpaid fine', 'UNPAID_FINE_BLOCKS_BORROWING'],
    ['reservation conflict', 'RESERVATION_BLOCKS_RENEWAL'],
  ])('renewal blockers reject and preserve due date: %s', async (blocker, expectedCode) => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: `renewal-blocker-${blocker.replace(' ', '-')}@example.test`,
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: `renewal-blocker-${blocker.replace(' ', '-')}.librarian@example.test`,
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] });
    const requestId = createResponse.body.borrowRequest.requestId;

    const approveResponse = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});
    const borrowDetailId = approveResponse.body.borrowRequest.details[0].borrowDetailId;

    const storedDetail = borrowingDependencies.state.borrowDetails.find(
      (detail) => detail.borrowDetailId === borrowDetailId
    );
    if (blocker === 'overdue') {
      storedDetail.dueDate = new Date('2026-06-01T00:00:00.000Z');
    }
    if (blocker === 'renewal limit') {
      storedDetail.renewalCount = 1;
    }
    if (blocker === 'unpaid fine') {
      borrowingDependencies.state.fines.push({
        fineId: 1,
        userId: member.userId,
        status: 'UNPAID',
        amount: 1,
      });
    }
    if (blocker === 'reservation conflict') {
      borrowingDependencies.state.reservations.push({
        reservationId: 1,
        userId: librarian.userId,
        copyId: storedDetail.copyId,
        status: 'ACTIVE',
      });
    }
    const originalDueDate = new Date(storedDetail.dueDate).toISOString();

    const renewResponse = await request(app)
      .patch(`/api/borrow-details/${borrowDetailId}/renew`)
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(renewResponse.status).toBe(409);
    expect(renewResponse.body.error).toMatchObject({ code: expectedCode });
    expect(renewResponse.body.error.message).toBeTruthy();
    const finalDetail = borrowingDependencies.state.borrowDetails.find(
      (detail) => detail.borrowDetailId === borrowDetailId
    );
    expect(new Date(finalDetail.dueDate).toISOString()).toBe(originalDueDate);
  });

  // FR-FE07-022, NFR-FE07-TXN-001: an audit failure rolls back request and detail creation.
  test('audit failure rolls back borrow request creation without adding an audit row', async () => {
    const setup = makeTestApp();

    const member = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'audit-create.member@example.test',
    });
    const failingAuditLogRepository = makeAfterWriteFailingAuditLogRepository(
      setup.authDependencies.auditLogRepository
    );
    const auditCountBefore = setup.authDependencies.state.auditLogs.length;
    const { app } = makeTestApp({
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      auditLogRepository: failingAuditLogRepository,
    });
    const auditLogsBefore = setup.authDependencies.state.auditLogs.map((entry) => ({ ...entry }));

    const response = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .set('User-Agent', 'fe07-create-audit-test')
      .send({ copyIds: [1] });

    expect(response.status).toBe(500);
    expect(failingAuditLogRepository.create).toHaveBeenCalledTimes(1);
    expect(failingAuditLogRepository.create).toHaveBeenCalledWith({
      userId: member.userId,
      action: 'BORROW_REQUEST_CREATE',
      targetType: 'BORROWING',
      targetId: 1,
      metadata: { copyIds: [1] },
      ipAddress: expect.any(String),
      userAgent: 'fe07-create-audit-test',
    });
    expect(setup.borrowingDependencies.state.borrowRequests).toHaveLength(0);
    expect(setup.borrowingDependencies.state.borrowDetails).toHaveLength(0);
    expect(setup.authDependencies.state.auditLogs).toEqual(auditLogsBefore);
  });

  // FR-FE07-022, NFR-FE07-TXN-001: an audit failure restores the pending request and available copy.
  test('audit failure rolls back borrow request approval without adding an audit row', async () => {
    const setup = makeTestApp();
    const member = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'audit-approve.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'audit-approve.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const createResponse = await request(setup.app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    const requestId = createResponse.body.borrowRequest.requestId;
    const failingAuditLogRepository = makeAfterWriteFailingAuditLogRepository(
      setup.authDependencies.auditLogRepository
    );
    const auditCountBefore = setup.authDependencies.state.auditLogs.length;
    const { app } = makeTestApp({
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      auditLogRepository: failingAuditLogRepository,
    });
    const auditLogsBefore = setup.authDependencies.state.auditLogs.map((entry) => ({ ...entry }));

    const response = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .set('User-Agent', 'fe07-approve-audit-test')
      .send({ notes: 'reviewed' });

    expect(response.status).toBe(500);

    expect(failingAuditLogRepository.create).toHaveBeenCalledTimes(1);
    expect(failingAuditLogRepository.create).toHaveBeenCalledWith({
      userId: librarian.userId,
      action: 'BORROW_REQUEST_APPROVE',
      targetType: 'BORROWING',
      targetId: requestId,
      metadata: { approvedMemberId: member.userId, copyIds: [1], notes: 'reviewed' },
      ipAddress: expect.any(String),
      userAgent: 'fe07-approve-audit-test',
    });
    expect(setup.borrowingDependencies.state.borrowRequests[0].status).toBe('PENDING');
    expect(setup.borrowingDependencies.state.borrowDetails[0]).toMatchObject({
      status: 'REQUESTED',
      dueDate: null,
      borrowDate: null,
    });
    expect(setup.borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(
      'AVAILABLE'
    );
    expect(setup.authDependencies.state.auditLogs).toEqual(auditLogsBefore);
  });

  // FR-FE07-022, NFR-FE07-TXN-002: an audit failure restores the borrowed detail and copy.
  test('audit failure rolls back a return without adding an audit row', async () => {
    const setup = makeTestApp();
    const member = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'audit-return.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'audit-return.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const createResponse = await request(setup.app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    const approveResponse = await request(setup.app)
      .patch(`/api/borrow-requests/${createResponse.body.borrowRequest.requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(200);
    const borrowDetailId = approveResponse.body.borrowRequest.details[0].borrowDetailId;
    const requestId = createResponse.body.borrowRequest.requestId;
    const failingAuditLogRepository = makeAfterWriteFailingAuditLogRepository(
      setup.authDependencies.auditLogRepository
    );
    const { app } = makeTestApp({
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      auditLogRepository: failingAuditLogRepository,
    });
    const auditLogsBefore = setup.authDependencies.state.auditLogs.map((entry) => ({ ...entry }));

    const response = await request(app)
      .patch(`/api/borrow-details/${borrowDetailId}/return`)
      .set('Authorization', authHeader(librarian.accessToken))
      .set('User-Agent', 'fe07-return-audit-test')
      .send({ condition: 'NORMAL', returnDate: '2026-06-10', notes: 'intact' });

    expect(response.status).toBe(500);
    expect(failingAuditLogRepository.create).toHaveBeenCalledTimes(1);
    expect(failingAuditLogRepository.create).toHaveBeenCalledWith({
      userId: librarian.userId,
      action: 'BORROW_DETAIL_RETURN',
      targetType: 'BORROW_DETAIL',
      targetId: borrowDetailId,
      metadata: {
        requestId,
        memberId: member.userId,
        copyId: 1,
        condition: 'NORMAL',
        overdueDays: 0,

        notes: 'intact',
      },
      ipAddress: expect.any(String),
      userAgent: 'fe07-return-audit-test',
    });
    expect(setup.borrowingDependencies.state.borrowRequests[0].status).toBe('APPROVED');
    expect(setup.borrowingDependencies.state.borrowDetails[0]).toMatchObject({
      status: 'BORROWED',
      returnDate: null,
    });
    expect(setup.borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(
      'BORROWED'
    );
    expect(setup.authDependencies.state.auditLogs).toEqual(auditLogsBefore);
  });

  test.each([
    ['MEMBER_ACCOUNT_INACTIVE', 403, 'MEMBER_ACCOUNT_INACTIVE'],
    ['UNPAID_FINE_BLOCKS_BORROWING', 409, 'UNPAID_FINE_BLOCKS_BORROWING'],
    ['OVERDUE_LOAN_BLOCKS_BORROWING', 409, 'OVERDUE_LOAN_BLOCKS_BORROWING'],
    ['REQUEST_NOT_APPROVABLE', 409, 'BORROW_REQUEST_NOT_PENDING'],
    ['RESERVATION_QUEUE_PRIORITY', 409, 'RESERVATION_QUEUE_PRIORITY'],
    ['RESERVATION_STATE_CONFLICT', 409, 'RESERVATION_STATE_CONFLICT'],
  ])('approval maps the transaction eligibility outcome %s to its safe error', async (outcome, status, code) => {
    const setup = makeTestApp();
    const member = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: `approval-outcome-${outcome.toLowerCase()}@example.test`,
    });
    const librarian = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: `approval-outcome-${outcome.toLowerCase()}.librarian@example.test`,
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const created = await request(setup.app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    const requestId = created.body.borrowRequest.requestId;

    setup.borrowingDependencies.borrowingRepository.approveBorrowRequest = jest.fn(async () => ({ outcome }));
    const { app } = makeTestApp({
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
    });

    const response = await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});

    expect(response.status).toBe(status);
    expect(response.body.error).toMatchObject({ code });
    expect(response.body.error.message).toBeTruthy();
  });

  test('concurrent rejection returns conflict when the pending update loses the race', async () => {
    const setup = makeTestApp();
    const member = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'reject-race.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'reject-race.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const created = await request(setup.app)

      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);

    setup.borrowingDependencies.borrowingRepository.rejectBorrowRequest = jest.fn(async () => null);
    const { app } = makeTestApp({
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
    });
    const response = await request(app)
      .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/reject`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ reason: 'Request is no longer pending.' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('BORROW_REQUEST_NOT_PENDING');
  });

  // @spec BR-FE11-019, FR-FE11-035, AC-FE11-019
  test('terminal requests reject FE07 approve and reject without state or success-audit changes', async () => {
    const setup = makeTestApp();
    const member = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'terminal-request.member@example.test',
    });
    const admin = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'terminal-request.admin@example.test',
      role: 'ADMIN',
      approveMember: false,
    });
    const created = await request(setup.app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    const requestId = created.body.borrowRequest.requestId;

    setup.borrowingDependencies.state.borrowRequests[0].status = 'COMPLETED';
    const snapshot = () => JSON.parse(JSON.stringify({
      requests: setup.borrowingDependencies.state.borrowRequests,
      details: setup.borrowingDependencies.state.borrowDetails,
      copies: setup.borrowingDependencies.state.copies,
      reservations: setup.borrowingDependencies.state.reservations,
      audits: setup.authDependencies.state.auditLogs,
    }));
    const before = snapshot();

    const approveResponse = await request(setup.app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({});
    expect(approveResponse.status).toBe(409);
    expect(approveResponse.body.error.code).toBe('BORROW_REQUEST_NOT_PENDING');
    expect(snapshot()).toEqual(before);

    const rejectResponse = await request(setup.app)
      .patch(`/api/borrow-requests/${requestId}/reject`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({ reason: 'Must remain terminal.' });
    expect(rejectResponse.status).toBe(409);
    expect(rejectResponse.body.error.code).toBe('BORROW_REQUEST_NOT_PENDING');
    expect(snapshot()).toEqual(before);
  });

  test('audit failure rolls back a rejection without changing the pending request', async () => {
    const setup = makeTestApp();
    const member = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'audit-reject.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'audit-reject.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const created = await request(setup.app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    const failingAuditLogRepository = makeAfterWriteFailingAuditLogRepository(
      setup.authDependencies.auditLogRepository
    );
    const { app } = makeTestApp({
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      auditLogRepository: failingAuditLogRepository,
    });

    const auditCountBefore = setup.authDependencies.state.auditLogs.length;
    const response = await request(app)
      .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/reject`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ reason: 'Not eligible today.' });

    expect(response.status).toBe(500);
    expect(setup.borrowingDependencies.state.borrowRequests[0].status).toBe('PENDING');
    expect(setup.authDependencies.state.auditLogs).toHaveLength(auditCountBefore);
  });

  test('audit failure rolls back a renewal without changing the due date or renewal count', async () => {
    const setup = makeTestApp();
    const member = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'audit-renew.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app: setup.app,
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      email: 'audit-renew.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const created = await request(setup.app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })

      .expect(201);
    const approved = await request(setup.app)
      .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(200);
    const detail = setup.borrowingDependencies.state.borrowDetails[0];
    const originalDueDate = new Date(detail.dueDate).toISOString();
    const failingAuditLogRepository = makeAfterWriteFailingAuditLogRepository(
      setup.authDependencies.auditLogRepository
    );
    const auditCountBefore = setup.authDependencies.state.auditLogs.length;
    const { app } = makeTestApp({
      authDependencies: setup.authDependencies,
      borrowingDependencies: setup.borrowingDependencies,
      auditLogRepository: failingAuditLogRepository,
    });

    const response = await request(app)
      .patch(`/api/borrow-details/${approved.body.borrowRequest.details[0].borrowDetailId}/renew`)
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(response.status).toBe(500);
    const storedDetail = setup.borrowingDependencies.state.borrowDetails[0];
    expect(new Date(storedDetail.dueDate).toISOString()).toBe(originalDueDate);
    expect(storedDetail.renewalCount).toBe(0);
    expect(setup.authDependencies.state.auditLogs).toHaveLength(auditCountBefore);
  });

  test.each(['2026-02-30', '2026-07-13T00:00:00.000Z'])('date filters reject %s as a non-calendar date', async (invalidDate) => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: `invalid-filter-${invalidDate.length}@example.test`,
    });

    for (const field of ['fromDate', 'toDate']) {
      const response = await request(app)
        .get('/api/borrow-requests/me')
        .query({ [field]: invalidDate })
        .set('Authorization', authHeader(member.accessToken));
      expect(response.status).toBe(400);
      expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    }
  });

  test.each(['2026-02-30', '2026-07-13T00:00:00.000Z'])('invalid return date %s returns 400 without mutating borrowing state', async (invalidDate) => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: `invalid-return-${invalidDate.length}@example.test`,
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: `invalid-return-${invalidDate.length}.librarian@example.test`,
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const created = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);
    const approved = await request(app)
      .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(200);
    const detail = borrowingDependencies.state.borrowDetails[0];

    const response = await request(app)
      .patch(`/api/borrow-details/${approved.body.borrowRequest.details[0].borrowDetailId}/return`)
      .set('Authorization', authHeader(librarian.accessToken))

      .send({ condition: 'NORMAL', returnDate: invalidDate });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(detail).toMatchObject({ status: 'BORROWED', returnDate: null });
  });
});
