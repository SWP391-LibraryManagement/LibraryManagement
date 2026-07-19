process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { createReservationService } = require('../src/services/reservationService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');
const {
  makeInMemoryReservationDependencies,
} = require('./helpers/inMemoryReservationRepositories');

const reservationRepositorySource = fs.readFileSync(
  path.join(__dirname, '../src/repositories/reservationRepository.js'),
  'utf8'
);

function getRepositoryFunctionSource(functionName, nextFunctionName) {
  const start = reservationRepositorySource.indexOf(`async function ${functionName}`);
  const endMarker = nextFunctionName ? `async function ${nextFunctionName}` : 'module.exports';
  const end = reservationRepositorySource.indexOf(endMarker, start);
  return reservationRepositorySource.slice(start, end);
}

function makeTestApp({ notificationService, auditLogRepository, reservationState } = {}) {
  const authDependencies = makeInMemoryAuthDependencies();
  const reservationDependencies = makeInMemoryReservationDependencies(
    authDependencies.state,
    reservationState
  );
  const authService = createAuthService(authDependencies);
  const reservationService = createReservationService({
    reservationRepository: reservationDependencies.reservationRepository,
    auditLogRepository: auditLogRepository || authDependencies.auditLogRepository,
    notificationService,
  });
  const app = createApp({ authService, reservationService });

  return { app, authDependencies, reservationDependencies };
}

async function createVerifiedUser({
  app,
  authDependencies,
  reservationDependencies,
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

  const verifyResponse = await request(app)
    .post('/api/auth/verify-email')
    .send({ token: authDependencies.state.generatedOtps.at(-1) });

  expect(verifyResponse.status).toBe(200);

  authDependencies.state.rolesByUserId.set(userId, [role]);

  if (role === 'MEMBER' && approveMember) {
    reservationDependencies.approveMember(userId);
  }

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password,
    });

  expect(loginResponse.status).toBe(200);

  return {
    userId,
    accessToken: loginResponse.body.accessToken,
  };
}

function authHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

function makeNotificationServiceDouble(createNotificationRequest = jest.fn()) {
  const requester = { createNotificationRequest };
  const notificationService = {
    createSourceNotificationRequester: jest.fn(() => requester),
  };

  return { notificationService, requester };
}

describe('FE08 reservation management', () => {
  // @spec FR-FE08-029, AC-FE08-015, NFR-FE08-SEC-004, NFR-FE08-PERF-003
  test('member reads a paginated redacted candidate catalog without mutation', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const firstMember = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'candidate.first@example.test',
    });
    const secondMember = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'candidate.second@example.test',
    });
    const reader = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'candidate.reader@example.test',
    });

    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(firstMember.accessToken))
      .send({ copyId: 1 })
      .expect(201);
    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(secondMember.accessToken))
      .send({ copyId: 1 })
      .expect(201);

    const reservationsBefore = JSON.stringify(reservationDependencies.state.reservations);
    const auditCountBefore = authDependencies.state.auditLogs.length;
    const response = await request(app)
      .get('/api/reservations/candidates')
      .query({ q: 'clean', page: 1, limit: 1 })
      .set('Authorization', authHeader(reader.accessToken))
      .expect(200);

    expect(response.body.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toEqual({
      copyId: 1,
      bookId: 1,
      title: 'Clean Code',
      authorName: 'Robert C. Martin',
      copyStatus: 'BORROWED',
      activeReservationCount: 2,
    });
    expect(Object.keys(response.body.data[0]).sort()).toEqual([
      'activeReservationCount',
      'authorName',
      'bookId',
      'copyId',
      'copyStatus',
      'title',
    ]);
    expect(JSON.stringify(response.body)).not.toMatch(/barcode|location|owner|email|reservedAt|version/i);
    expect(JSON.stringify(reservationDependencies.state.reservations)).toBe(reservationsBefore);
    expect(authDependencies.state.auditLogs.length).toBe(auditCountBefore);
  });

  // @spec FR-FE08-029, AC-FE08-015, NFR-FE08-PERF-003
  test('candidate catalog filters active books and eligible copy statuses in stable order', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp({
      reservationState: {
        books: [
          { bookId: 10, title: 'Zeta', authorName: 'Author Z', status: 'ACTIVE' },
          { bookId: 11, title: 'Alpha', authorName: 'Author A', status: 'ACTIVE' },
          { bookId: 12, title: 'Hidden', authorName: 'Author H', status: 'INACTIVE' },
        ],
        copies: [
          { copyId: 20, bookId: 10, barcode: 'C20', status: 'BORROWED', location: 'A1' },
          { copyId: 21, bookId: 11, barcode: 'C21', status: 'RESERVED', location: 'A2' },
          { copyId: 22, bookId: 11, barcode: 'C22', status: 'AVAILABLE', location: 'A3' },
          { copyId: 23, bookId: 12, barcode: 'C23', status: 'BORROWED', location: 'A4' },
          { copyId: 24, bookId: 10, barcode: 'C24', status: 'DAMAGED', location: 'A5' },
        ],
      },
    });
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'candidate-filter.member@example.test',
    });

    const response = await request(app)
      .get('/api/reservations/candidates')
      .set('Authorization', authHeader(member.accessToken))
      .expect(200);

    expect(response.body.data.map((item) => item.copyId)).toEqual([21, 20]);
    expect(response.body.pagination).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
  });

  // @spec NFR-FE08-SEC-004
  test('candidate catalog enforces member role and query bounds', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'candidate-role.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'candidate-role.member@example.test',
    });

    await request(app)
      .get('/api/reservations/candidates')
      .expect(401);
    await request(app)
      .get('/api/reservations/candidates')
      .set('Authorization', authHeader(librarian.accessToken))
      .expect(403);
    const invalid = await request(app)
      .get('/api/reservations/candidates')
      .query({ page: 0, limit: 101, q: 'x'.repeat(201) })
      .set('Authorization', authHeader(member.accessToken));
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('member creates reservations only for unavailable copies within the active limit', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'nhat.member@example.test',
    });

    const createResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.reservation).toMatchObject({
      userId: member.userId,
      copyId: 1,
      status: 'ACTIVE',
      queuePosition: 1,
    });

    const duplicateResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error.code).toBe('DUPLICATE_ACTIVE_RESERVATION');

    const availableCopyResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 2 });

    expect(availableCopyResponse.status).toBe(409);
    expect(availableCopyResponse.body.error.code).toBe('COPY_AVAILABLE');

    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 3 })
      .expect(201);
    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 4 })
      .expect(201);

    const limitResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 5 });

    expect(limitResponse.status).toBe(409);
    expect(limitResponse.body.error.code).toBe('ACTIVE_RESERVATION_LIMIT');
  });

  // @spec BR-FE08-006 FR-FE08-015 Q-FE08-003
  test('NOTIFIED reservations remain open for duplicate and three-open limit checks', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'open-reservation-limit.member@example.test',
    });
    const now = new Date();

    reservationDependencies.state.reservations.push(
      {
        reservationId: 90,
        userId: member.userId,
        copyId: 1,
        reservedAt: now,
        status: 'NOTIFIED',
        notifiedAt: now,
        expiresAt: new Date(now.getTime() + 86400000),
      },
      {
        reservationId: 91,
        userId: member.userId,
        copyId: 3,
        reservedAt: now,
        status: 'NOTIFIED',
        notifiedAt: now,
        expiresAt: new Date(now.getTime() + 86400000),
      },
      {
        reservationId: 92,
        userId: member.userId,
        copyId: 4,
        reservedAt: now,
        status: 'ACTIVE',
      }
    );

    const duplicateResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 });
    const limitResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 5 });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error.code).toBe('DUPLICATE_ACTIVE_RESERVATION');
    expect(limitResponse.status).toBe(409);
    expect(limitResponse.body.error.code).toBe('ACTIVE_RESERVATION_LIMIT');
    expect(reservationDependencies.state.reservations).toHaveLength(3);
  });

  test('member cancels only their own active reservation', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'owner@example.test',
    });
    const otherMember = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'other@example.test',
    });

    const createResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 });
    const reservationId = createResponse.body.reservation.reservationId;

    const forbiddenResponse = await request(app)
      .patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', authHeader(otherMember.accessToken))
      .send({ reason: 'wrong user' });

    expect(forbiddenResponse.status).toBe(403);
    expect(forbiddenResponse.body.error.code).toBe('RESERVATION_OWNER_REQUIRED');

    const cancelResponse = await request(app)
      .patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', authHeader(member.accessToken))
      .send({ reason: 'no longer needed' });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.reservation).toMatchObject({
      reservationId,
      status: 'CANCELLED',
    });

    const repeatCancelResponse = await request(app)
      .patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(repeatCancelResponse.status).toBe(409);
    expect(repeatCancelResponse.body.error.code).toBe('RESERVATION_NOT_ACTIVE');
  });

  test('cancelling a notified reservation releases only its reserved copy', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'notified.cancel@example.test',
    });
    const createResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 })
      .expect(201);
    const reservation = reservationDependencies.state.reservations.find(
      (item) => item.reservationId === createResponse.body.reservation.reservationId
    );
    reservation.status = 'NOTIFIED';
    reservation.notifiedAt = new Date();
    reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'RESERVED';
    reservationDependencies.state.copies.find((copy) => copy.copyId === 2).status = 'RESERVED';

    const cancelResponse = await request(app)
      .patch(`/api/reservations/${reservation.reservationId}/cancel`)
      .set('Authorization', authHeader(member.accessToken))
      .send({ reason: 'cannot pick up' });

    expect(cancelResponse.status).toBe(200);
    expect(reservation.status).toBe('CANCELLED');
    expect(reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(
      'AVAILABLE'
    );
    expect(reservationDependencies.state.copies.find((copy) => copy.copyId === 2).status).toBe(
      'RESERVED'
    );
  });

  test('fulfilled reservation cannot be cancelled', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'fulfilled.cancel@example.test',
    });
    const createResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 })
      .expect(201);
    const reservationId = createResponse.body.reservation.reservationId;
    reservationDependencies.state.reservations.find(
      (item) => item.reservationId === reservationId
    ).status = 'FULFILLED';

    const cancelResponse = await request(app)
      .patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(cancelResponse.status).toBe(409);
    expect(cancelResponse.body.error.code).toBe('RESERVATION_NOT_ACTIVE');
    expect(
      reservationDependencies.state.reservations.find(
        (item) => item.reservationId === reservationId
      ).status
    ).toBe('FULFILLED');
  });

  test('copy-reservation mutations lock copies before reservations', () => {
    const cancelSource = getRepositoryFunctionSource(
      'cancelReservation',
      'findNextActiveReservationForCopy'
    );
    const expireSource = getRepositoryFunctionSource('expireOverdueHolds');

    for (const source of [cancelSource, expireSource]) {
      const copyLockIndex = source.indexOf('FROM BookCopies WITH (UPDLOCK, HOLDLOCK)');
      const reservationLockIndex = source.indexOf('FROM Reservations WITH (UPDLOCK, HOLDLOCK)');
      expect(copyLockIndex).toBeGreaterThanOrEqual(0);
      expect(reservationLockIndex).toBeGreaterThanOrEqual(0);
      expect(copyLockIndex).toBeLessThan(reservationLockIndex);
    }
  });

  test('binds FE08 and submits the canonical reservation-ready notification request', async () => {
    const createNotificationRequest = jest.fn(async () => ({
      notificationId: 1,
      status: 'PENDING',
    }));
    const { notificationService, requester } = makeNotificationServiceDouble(
      createNotificationRequest
    );
    const { app, authDependencies, reservationDependencies } = makeTestApp({
      notificationService,
    });
    const firstMember = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'first.member@example.test',
    });
    const secondMember = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'second.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(firstMember.accessToken))
      .send({ copyId: 1 })
      .expect(201);
    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(secondMember.accessToken))
      .send({ copyId: 1 })
      .expect(201);

    const listResponse = await request(app)
      .get('/api/reservations?status=ACTIVE')
      .set('Authorization', authHeader(librarian.accessToken));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.reservations).toHaveLength(2);

    reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'AVAILABLE';

    const processResponse = await request(app)
      .post('/api/reservations/process-queue')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyId: 1 });

    expect(processResponse.status).toBe(200);
    expect(processResponse.body.selectedReservation).toMatchObject({
      userId: firstMember.userId,
      copyId: 1,
      status: 'NOTIFIED',
    });
    expect(processResponse.body.selectedReservation.notifiedAt).toBeTruthy();
    expect(processResponse.body.selectedReservation.expiresAt).toBeTruthy();
    expect(reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(
      'RESERVED'
    );
    expect(notificationService.createSourceNotificationRequester).toHaveBeenCalledTimes(1);
    expect(notificationService.createSourceNotificationRequester).toHaveBeenCalledWith('FE08');
    expect(requester.createNotificationRequest).toHaveBeenCalledTimes(1);

    const notificationRequest = requester.createNotificationRequest.mock.calls[0][0];
    expect(Object.keys(notificationRequest).sort()).toEqual([
      'channel',
      'recipientEmail',
      'sourceEntityId',
      'sourceEntityType',
      'templateData',
      'templateKey',
      'type',
      'userId',
    ]);
    expect(notificationRequest).toEqual({
      type: 'RESERVATION_AVAILABLE',
      channel: 'EMAIL',
      templateKey: 'RESERVATION_READY',
      userId: firstMember.userId,
      recipientEmail: 'first.member@example.test',
      templateData: {
        reservationId: processResponse.body.selectedReservation.reservationId,
        copyId: 1,
        bookId: 1,
        expiresAt: processResponse.body.selectedReservation.expiresAt,
      },
      sourceEntityType: 'RESERVATION',
      sourceEntityId: processResponse.body.selectedReservation.reservationId,
    });
    expect(Object.keys(notificationRequest.templateData).sort()).toEqual([
      'bookId',
      'copyId',
      'expiresAt',
      'reservationId',
    ]);
    expect(notificationRequest).not.toHaveProperty('sourceFeature');
  });

  test('expire-holds expires an overdue hold and promotes the next reservation (FR-FE08-019)', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const firstMember = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'hold.first@example.test',
    });
    const secondMember = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'hold.second@example.test',
    });
    const librarian = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'hold.lib@example.test',
      role: 'LIBRARIAN', approveMember: false,
    });

    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(firstMember.accessToken))
      .send({ copyId: 1 })
      .expect(201);
    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(secondMember.accessToken))
      .send({ copyId: 1 })
      .expect(201);

    reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'AVAILABLE';

    await request(app)
      .post('/api/reservations/process-queue')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyId: 1 })
      .expect(200);

    // Giả lập hold của member đầu đã quá hạn giữ chỗ
    const firstReservation = reservationDependencies.state.reservations.find(
      (r) => r.userId === firstMember.userId && r.copyId === 1
    );
    firstReservation.expiresAt = new Date(Date.now() - 60 * 1000);

    const expireResponse = await request(app)
      .post('/api/reservations/expire-holds')
      .set('Authorization', authHeader(librarian.accessToken));

    expect(expireResponse.status).toBe(200);
    expect(expireResponse.body.expiredCount).toBe(1);

    expect(
      reservationDependencies.state.reservations.find(
        (r) => r.userId === firstMember.userId && r.copyId === 1
      ).status
    ).toBe('EXPIRED');
    expect(
      reservationDependencies.state.reservations.find(
        (r) => r.userId === secondMember.userId && r.copyId === 1
      ).status
    ).toBe('NOTIFIED');
    expect(reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(
      'RESERVED'
    );
  });

  test('process-queue keeps the hold when the FE10 requester fails and records only a safe audit', async () => {
    const createNotificationRequest = jest.fn(async () => {
        throw new Error('smtp down');
    });
    const { notificationService, requester } = makeNotificationServiceDouble(
      createNotificationRequest
    );
    const { app, authDependencies, reservationDependencies } = makeTestApp({
      notificationService,
    });
    const member = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'notify.fail@example.test',
    });
    const librarian = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'notify.lib@example.test',
      role: 'LIBRARIAN', approveMember: false,
    });

    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 })
      .expect(201);

    reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'AVAILABLE';

    const processResponse = await request(app)
      .post('/api/reservations/process-queue')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyId: 1 });

    expect(processResponse.status).toBe(200);
    expect(processResponse.body.selectedReservation.status).toBe('NOTIFIED');
    expect(requester.createNotificationRequest).toHaveBeenCalled();
    expect(authDependencies.state.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'RESERVATION_NOTIFY_FAILED',
          metadata: {
            code: 'NOTIFICATION_REQUEST_FAILED',
            message: 'Reservation notification request failed.',
          },
        }),
      ])
    );
    expect(JSON.stringify(authDependencies.state.auditLogs)).not.toContain('smtp down');
  });

  test('process-queue keeps the hold when the requester and its failure audit both fail', async () => {
    const createNotificationRequest = jest.fn(async () => {
      throw new Error('provider unavailable');
    });
    const { notificationService, requester } = makeNotificationServiceDouble(
      createNotificationRequest
    );
    const auditLogRepository = {
      create: jest.fn(async (entry) => {
        if (entry.action === 'RESERVATION_NOTIFY_FAILED') {
          throw new Error('audit unavailable');
        }
      }),
    };
    const { app, authDependencies, reservationDependencies } = makeTestApp({
      notificationService,
      auditLogRepository,
    });
    const member = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'notify.audit.fail@example.test',
    });
    const librarian = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'notify.audit.lib@example.test',
      role: 'LIBRARIAN', approveMember: false,
    });

    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 })
      .expect(201);

    reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'AVAILABLE';

    const processResponse = await request(app)
      .post('/api/reservations/process-queue')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyId: 1 });

    expect(processResponse.status).toBe(200);
    expect(processResponse.body.selectedReservation.status).toBe('NOTIFIED');
    expect(requester.createNotificationRequest).toHaveBeenCalledTimes(1);
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'RESERVATION_NOTIFY_FAILED' })
    );
  });

  test('rejects reservation when member account is inactive (FR-FE08-012)', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'inactive.member@example.test',
    });

    // Tài khoản member bị vô hiệu hoá sau khi đăng nhập.
    authDependencies.state.users.find((user) => user.userId === member.userId).status = 'INACTIVE';

    const response = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('MEMBER_ACCOUNT_INACTIVE');
  });

  test('rejects reservation when membership is not approved (FR-FE08-013)', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'unapproved.member@example.test',
      approveMember: false,
    });

    const response = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('MEMBERSHIP_NOT_APPROVED');
  });

  test('rejects reservation when the copy does not exist (FR-FE08-014)', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'missing.copy@example.test',
    });

    const response = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 999 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('COPY_NOT_FOUND');
  });

  test('rejects cancelling a reservation that is already expired (FR-FE08-017)', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'expired.cancel@example.test',
    });

    const createResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 });
    const reservationId = createResponse.body.reservation.reservationId;

    // Đẩy reservation về trạng thái EXPIRED trực tiếp trong state.
    reservationDependencies.state.reservations.find(
      (r) => r.reservationId === reservationId
    ).status = 'EXPIRED';

    const response = await request(app)
      .patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', authHeader(member.accessToken))
      .send({ reason: 'too late' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('RESERVATION_NOT_ACTIVE');
    // TD-010: the current reservation state is returned alongside the 409.
    expect(response.body.error.details).toMatchObject({ reservationId, status: 'EXPIRED' });
  });

  test('process-queue skips an ineligible member instead of holding (FR-FE08-018)', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'queue.ineligible@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'queue.skip.lib@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 })
      .expect(201);

    // Member trở nên không đủ điều kiện trước khi xử lý hàng đợi và copy đã sẵn sàng.
    authDependencies.state.users.find((user) => user.userId === member.userId).status = 'INACTIVE';
    reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'AVAILABLE';

    const response = await request(app)
      .post('/api/reservations/process-queue')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyId: 1 });

    expect(response.status).toBe(200);
    expect(response.body.selectedReservation).toBeNull();
    // Reservation vẫn ACTIVE (không bị hold) và copy không bị chuyển sang RESERVED.
    expect(
      reservationDependencies.state.reservations.find(
        (r) => r.userId === member.userId && r.copyId === 1
      ).status
    ).toBe('ACTIVE');
    expect(reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(
      'AVAILABLE'
    );
  });

  test('process-queue selects nothing when no eligible reservation exists (FR-FE08-020)', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'queue.empty.lib@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    // Copy tồn tại và sẵn sàng nhưng không có reservation nào trong hàng đợi.
    reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'AVAILABLE';

    const response = await request(app)
      .post('/api/reservations/process-queue')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyId: 1 });

    expect(response.status).toBe(200);
    expect(response.body.selectedReservation).toBeNull();
  });

  test('concurrent queue processing holds the copy only once (FR-FE08-022)', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const firstMember = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'race.queue.first@example.test',
    });
    const secondMember = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'race.queue.second@example.test',
    });
    const librarian = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'race.queue.lib@example.test',
      role: 'LIBRARIAN', approveMember: false,
    });

    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(firstMember.accessToken))
      .send({ copyId: 1 })
      .expect(201);
    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(secondMember.accessToken))
      .send({ copyId: 1 })
      .expect(201);

    reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'AVAILABLE';

    // First processing wins and holds the copy for the earliest reservation.
    const firstProcess = await request(app)
      .post('/api/reservations/process-queue')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyId: 1 });

    expect(firstProcess.status).toBe(200);
    expect(firstProcess.body.selectedReservation).toMatchObject({
      userId: firstMember.userId,
      status: 'NOTIFIED',
    });

    // A second processing attempt re-reads the now-RESERVED copy and selects nothing.
    const secondProcess = await request(app)
      .post('/api/reservations/process-queue')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyId: 1 });

    expect(secondProcess.status).toBe(200);
    expect(secondProcess.body.selectedReservation).toBeNull();

    // INV-FE08-004: at most one reservation may be NOTIFIED for the same copy.
    const notifiedForCopyOne = reservationDependencies.state.reservations.filter(
      (reservation) => reservation.copyId === 1 && reservation.status === 'NOTIFIED'
    );
    expect(notifiedForCopyOne).toHaveLength(1);
    expect(
      reservationDependencies.state.reservations.find(
        (reservation) => reservation.userId === secondMember.userId && reservation.copyId === 1
      ).status
    ).toBe('ACTIVE');
  });

  test('reservation endpoints enforce authentication and staff/member roles', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'role.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'role.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const unauthenticatedResponse = await request(app)
      .post('/api/reservations')
      .send({ copyId: 1 });

    expect(unauthenticatedResponse.status).toBe(401);

    const memberListAllResponse = await request(app)
      .get('/api/reservations')
      .set('Authorization', authHeader(member.accessToken));

    expect(memberListAllResponse.status).toBe(403);
    expect(memberListAllResponse.body.error.code).toBe('ROLE_REQUIRED');

    const staffCreateResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyId: 1 });

    expect(staffCreateResponse.status).toBe(403);
    expect(staffCreateResponse.body.error.code).toBe('ROLE_REQUIRED');
  });

  test('process-queue accepts only copyId and rejects bookId without mutating state', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      reservationDependencies,
      email: 'queue-copy-only.lib@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });

    const response = await request(app)
      .post('/api/reservations/process-queue')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ copyId: 1, bookId: 1 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(reservationDependencies.state.reservations).toHaveLength(0);
  });

  test('reservation list uses bounded pagination and ReservedAt ascending stable order', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const firstMember = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'list-pagination.first@example.test',
    });
    const secondMember = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'list-pagination.second@example.test',
    });
    const librarian = await createVerifiedUser({
      app, authDependencies, reservationDependencies,
      email: 'list-pagination.lib@example.test', role: 'LIBRARIAN', approveMember: false,
    });

    const first = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(firstMember.accessToken))
      .send({ copyId: 1 })
      .expect(201);
    await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(secondMember.accessToken))
      .send({ copyId: 1 })
      .expect(201);

    const response = await request(app)
      .get('/api/reservations')
      .query({ page: 1, limit: 1 })
      .set('Authorization', authHeader(librarian.accessToken))
      .expect(200);

    expect(response.body.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(response.body.reservations).toHaveLength(1);
    expect(response.body.reservations[0].reservationId).toBe(first.body.reservation.reservationId);

    const invalid = await request(app)
      .get('/api/reservations')
      .query({ page: 0 })
      .set('Authorization', authHeader(librarian.accessToken));
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('notified cancellation retains notification history', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app, authDependencies, reservationDependencies, email: 'timestamp-retention.member@example.test',
    });
    const created = await request(app)
      .post('/api/reservations')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyId: 1 })
      .expect(201);
    const reservation = reservationDependencies.state.reservations[0];
    reservation.status = 'NOTIFIED';
    reservation.notifiedAt = new Date('2026-07-18T00:00:00.000Z');
    reservation.expiresAt = new Date('2026-07-20T00:00:00.000Z');
    reservationDependencies.state.copies[0].status = 'RESERVED';

    await request(app)
      .patch(`/api/reservations/${created.body.reservation.reservationId}/cancel`)
      .set('Authorization', authHeader(member.accessToken))
      .send({})
      .expect(200);

    expect(reservation.notifiedAt.toISOString()).toBe('2026-07-18T00:00:00.000Z');
    expect(reservation.expiresAt.toISOString()).toBe('2026-07-20T00:00:00.000Z');
    expect(reservation.cancelledAt).toBeTruthy();
  });
});
