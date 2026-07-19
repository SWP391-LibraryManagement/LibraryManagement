process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { createBorrowingService } = require('../src/services/borrowingService');
const { createReservationService } = require('../src/services/reservationService');
const { createNotificationService } = require('../src/services/notificationService');
const { createReportService } = require('../src/services/reportService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');
const { makeInMemoryBorrowingDependencies } = require('./helpers/inMemoryBorrowingRepositories');
const { makeInMemoryReservationDependencies } = require('./helpers/inMemoryReservationRepositories');
const { makeInMemoryNotificationDependencies } = require('./helpers/inMemoryNotificationRepositories');
const { makeInMemoryReportDependencies } = require('./helpers/inMemoryReportRepositories');
const {
  syncCopyStatus,
  syncReservationClaims,
} = require('./helpers/systemIntegrationHarness');

function makeTestApp() {
  const authDependencies = makeInMemoryAuthDependencies();
  const borrowingDependencies = makeInMemoryBorrowingDependencies(authDependencies.state);
  const reservationDependencies = makeInMemoryReservationDependencies(authDependencies.state);
  const notificationRepositories = makeInMemoryNotificationDependencies(authDependencies.state);
  const reportDependencies = makeInMemoryReportDependencies(authDependencies.state, borrowingDependencies.state);

  const authService = createAuthService(authDependencies);
  const notificationService = createNotificationService({
    notificationRepository: notificationRepositories.notificationRepository,
    templateRepository: notificationRepositories.templateRepository,
    userRepository: authDependencies.userRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    emailProvider: { send: async () => ({ success: true }) },
    clock: () => new Date('2026-06-10T00:00:00.000Z'),
  });
  const borrowingService = createBorrowingService({
    borrowingRepository: borrowingDependencies.borrowingRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationService,
    clock: () => new Date('2026-06-10T00:00:00.000Z'),
  });
  const reservationService = createReservationService({
    reservationRepository: reservationDependencies.reservationRepository,
    bookCopyRepository: reservationDependencies.bookCopyRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationService,
    clock: () => new Date('2026-06-10T00:00:00.000Z'),
  });
  const reportService = createReportService({
    reportRepository: reportDependencies.reportRepository,
    auditLogRepository: authDependencies.auditLogRepository,
  });

  const app = createApp({
    authService,
    borrowingService,
    reservationService,
    notificationService,
    reportService,
  });

  return {
    app,
    authDependencies,
    borrowingDependencies,
    reservationDependencies,
    notificationRepositories,
  };
}

async function createVerifiedUser({
  app,
  authDependencies,
  borrowingDependencies,
  reservationDependencies,
  email,
  role = 'MEMBER',
  approveMember = true,
}) {
  const password = 'Password1!';
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({ email, password, confirmPassword: password, fullName: email.split('@')[0] });
  expect(registerResponse.status).toBe(201);

  const userId = registerResponse.body.userId;
  await request(app)
    .post('/api/auth/verify-email')
    .send({ token: authDependencies.state.generatedOtps.at(-1) })
    .expect(200);

  authDependencies.state.rolesByUserId.set(userId, [role]);

  if (role === 'MEMBER' && approveMember && borrowingDependencies) {
    borrowingDependencies.approveMember(userId);
  }

  if (role === 'MEMBER' && approveMember && reservationDependencies) {
    reservationDependencies.approveMember(userId);
  }

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  expect(loginResponse.status).toBe(200);

  return { userId, accessToken: loginResponse.body.accessToken };
}

describe('Integration: End-to-End Flows', () => {
  describe('FE02 -> FE07: Auth then Borrow', () => {
    test('Member registers, verifies, creates borrow request', async () => {
      const { app, authDependencies, borrowingDependencies } = makeTestApp();
      const { accessToken } = await createVerifiedUser({
        app,
        authDependencies,
        borrowingDependencies,
        email: 'member@example.com',
      });

      const response = await request(app)
        .post('/api/borrow-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ copyIds: [1] });

      expect(response.status).toBe(201);
      expect(response.body.borrowRequest).toMatchObject({
        status: 'PENDING',
        details: [{ copyId: 1, status: 'REQUESTED' }],
      });
    });
  });

  describe('FE02 -> FE08: Auth then Reserve', () => {
    test('Member registers, verifies, creates reservation', async () => {
      const { app, authDependencies, borrowingDependencies, reservationDependencies } = makeTestApp();
      const { accessToken } = await createVerifiedUser({
        app,
        authDependencies,
        borrowingDependencies,
        reservationDependencies,
        email: 'reserver@example.com',
      });

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ copyId: 1 });

      expect(response.status).toBe(201);
      expect(response.body.reservation).toMatchObject({
        copyId: 1,
        status: 'ACTIVE',
        queuePosition: 1,
      });
    });
  });

  describe('FE02 -> FE10: Auth then Notification', () => {
    test('Librarian receives the exact retry not-found response through the application route', async () => {
      const { app, authDependencies, borrowingDependencies } = makeTestApp();
      const { accessToken } = await createVerifiedUser({
        app,
        authDependencies,
        borrowingDependencies,
        email: 'librarian.retry.not-found@example.com',
        role: 'LIBRARIAN',
        approveMember: false,
      });

      const response = await request(app)
        .post('/api/notifications/999999/retry')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification was not found.',
        },
      });
    });

    test('Librarian receives exact H04 create, replay, process, and validation responses', async () => {
      const { app, authDependencies, borrowingDependencies } = makeTestApp();
      const { accessToken } = await createVerifiedUser({
        app,
        authDependencies,
        borrowingDependencies,
        email: 'librarian@example.com',
        role: 'LIBRARIAN',
        approveMember: false,
      });

      const payload = {
        type: 'DUE_DATE_REMINDER',
        channel: 'EMAIL',
        recipientEmail: 'member@example.com',
        templateKey: 'DUE_DATE_REMINDER',
        templateData: { dueDate: '2026-06-24' },
        idempotencyKey: 'test-1',
      };

      const createResponse = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toEqual({
        notificationId: expect.any(Number),
        status: 'PENDING',
      });

      const replayResponse = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(replayResponse.status).toBe(200);
      expect(replayResponse.body).toEqual(createResponse.body);

      const processResponse = await request(app)
        .post('/api/notifications/process-pending')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ limit: 10 });

      expect(processResponse.status).toBe(200);
      expect(processResponse.body).toEqual({ processed: 1, failed: 0 });
      expect(processResponse.body).not.toHaveProperty('notifications');

      const invalidResponse = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'DUE_DATE_REMINDER',
          recipientEmail: 'member@example.com',
          templateKey: 'DUE_DATE_REMINDER',
          templateData: { dueDate: '2026-06-24' },
          sourceEntityId: null,
        });

      expect(invalidResponse.status).toBe(400);
      expect(invalidResponse.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request.',
          details: [
            {
              field: 'sourceEntityId',
              message: 'Source entity ID must be a positive integer.',
            },
          ],
        },
      });
    });
  });

  describe('FE02 -> FE12: Auth then Report', () => {
    test('Librarian views borrowing report after auth', async () => {
      const { app, authDependencies, borrowingDependencies } = makeTestApp();
      const { accessToken } = await createVerifiedUser({
        app,
        authDependencies,
        borrowingDependencies,
        email: 'admin@example.com',
        role: 'ADMIN',
        approveMember: false,
      });

      const response = await request(app)
        .get('/api/reports/borrowing?fromDate=2026-06-01&toDate=2026-06-30')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        metrics: expect.objectContaining({ activeLoans: 0, overdueLoans: 0 }),
        rows: [],
        page: 1,
        limit: 20,
        totalRows: 0,
      }));
    });
  });

  describe('Cross-Feature: FE07 -> FE09 -> FE10', () => {
    test('Borrow approval creates notification and overdue return exposes fine candidate data', async () => {
      const { app, authDependencies, borrowingDependencies, notificationRepositories } = makeTestApp();
      const member = await createVerifiedUser({
        app,
        authDependencies,
        borrowingDependencies,
        email: 'borrower@example.com',
      });
      const librarian = await createVerifiedUser({
        app,
        authDependencies,
        borrowingDependencies,
        email: 'cross.librarian@example.com',
        role: 'LIBRARIAN',
        approveMember: false,
      });

      const borrowResponse = await request(app)
        .post('/api/borrow-requests')
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ copyIds: [1] });

      expect(borrowResponse.status).toBe(201);
      const requestId = borrowResponse.body.borrowRequest.requestId;

      const approveResponse = await request(app)
        .patch(`/api/borrow-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${librarian.accessToken}`)
        .send({});

      expect(approveResponse.status).toBe(200);
      expect(notificationRepositories.state.notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: member.userId,
            type: 'DUE_DATE_REMINDER',
            templateKey: 'DUE_DATE_REMINDER',
            sourceFeature: 'FE07',
          }),
        ])
      );

      const borrowDetailId = approveResponse.body.borrowRequest.details[0].borrowDetailId;
      borrowingDependencies.state.borrowDetails.find(
        (detail) => detail.borrowDetailId === borrowDetailId
      ).dueDate = new Date('2026-06-01T00:00:00.000Z');

      const returnResponse = await request(app)
        .patch(`/api/borrow-details/${borrowDetailId}/return`)
        .set('Authorization', `Bearer ${librarian.accessToken}`)
        .send({ condition: 'DAMAGED', returnDate: '2026-06-10' });

      expect(returnResponse.status).toBe(200);
      expect(returnResponse.body.fineCandidate).toMatchObject({
        borrowDetailId,
        overdueDays: 9,
        needsFineReview: true,
      });
    });
  });

  describe('Cross-Feature: FE08 held copy blocks FE07 (TD-011, FR-FE08-023/024)', () => {
    test('a copy held for one member cannot be borrowed by another member', async () => {
      const { app, authDependencies, borrowingDependencies, reservationDependencies } = makeTestApp();
      const memberA = await createVerifiedUser({
        app, authDependencies, borrowingDependencies, reservationDependencies,
        email: 'held.a@example.com',
      });
      const memberB = await createVerifiedUser({
        app, authDependencies, borrowingDependencies, reservationDependencies,
        email: 'held.b@example.com',
      });
      const librarian = await createVerifiedUser({
        app, authDependencies, borrowingDependencies, reservationDependencies,
        email: 'held.lib@example.com', role: 'LIBRARIAN', approveMember: false,
      });

      // FE08: member A reserves copy 1 (reservation store seeds copy 1 as BORROWED, so it is reservable).
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${memberA.accessToken}`)
        .send({ copyId: 1 })
        .expect(201);

      // The copy becomes available and the librarian processes the queue → copy is HELD for member A.
      reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'AVAILABLE';
      const processResponse = await request(app)
        .post('/api/reservations/process-queue')
        .set('Authorization', `Bearer ${librarian.accessToken}`)
        .send({ copyId: 1 });

      expect(processResponse.status).toBe(200);
      expect(processResponse.body.selectedReservation).toMatchObject({
        userId: memberA.userId,
        status: 'NOTIFIED',
      });
      // FE08 set the physical copy to RESERVED (held).
      expect(reservationDependencies.state.copies.find((copy) => copy.copyId === 1).status).toBe(
        'RESERVED'
      );

      // The in-memory feature stores model one database; sync the held copy and its owner claim.
      syncCopyStatus(reservationDependencies.state, borrowingDependencies.state, 1);
      syncReservationClaims(reservationDependencies.state, borrowingDependencies.state, 1);

      // FE07: member B cannot borrow the held copy (FR-FE08-023, BR-FE08-011).
      const borrowBlocked = await request(app)
        .post('/api/borrow-requests')
        .set('Authorization', `Bearer ${memberB.accessToken}`)
        .send({ copyIds: [1] });

      expect(borrowBlocked.status).toBe(409);
      expect(borrowBlocked.body.error.code).toBe('COPY_NOT_AVAILABLE');
      expect(borrowingDependencies.state.borrowRequests).toHaveLength(0);
    });

    test('an active reservation by another member blocks FE07 renewal of the same copy', async () => {
      const { app, authDependencies, borrowingDependencies, reservationDependencies } = makeTestApp();
      const owner = await createVerifiedUser({
        app, authDependencies, borrowingDependencies, reservationDependencies,
        email: 'renew.owner@example.com',
      });
      const otherMember = await createVerifiedUser({
        app, authDependencies, borrowingDependencies, reservationDependencies,
        email: 'renew.other@example.com',
      });
      const librarian = await createVerifiedUser({
        app, authDependencies, borrowingDependencies, reservationDependencies,
        email: 'renew.held.lib@example.com', role: 'LIBRARIAN', approveMember: false,
      });

      // Owner borrows copy 2 and the librarian approves it.
      const borrowResponse = await request(app)
        .post('/api/borrow-requests')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ copyIds: [2] });
      const requestId = borrowResponse.body.borrowRequest.requestId;
      const approveResponse = await request(app)
        .patch(`/api/borrow-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${librarian.accessToken}`)
        .send({});
      const borrowDetailId = approveResponse.body.borrowRequest.details[0].borrowDetailId;

      // Another member holds an active reservation on the same copy (FE08 queue priority).
      borrowingDependencies.state.reservations.push({
        reservationId: 1,
        userId: otherMember.userId,
        copyId: 2,
        status: 'ACTIVE',
      });

      // FE07 renewal is blocked by the reservation conflict (FR-FE08-024, BR-FE08-014).
      const renewResponse = await request(app)
        .patch(`/api/borrow-details/${borrowDetailId}/renew`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({});

      expect(renewResponse.status).toBe(409);
      expect(renewResponse.body.error.code).toBe('RESERVATION_BLOCKS_RENEWAL');
    });
  });

  describe('Cross-Feature: FE08 -> FE10 reservation-ready notification (FR-FE08-008)', () => {
    test('processing the queue holds the copy and creates a RESERVATION_READY notification', async () => {
      const {
        app,
        authDependencies,
        borrowingDependencies,
        reservationDependencies,
        notificationRepositories,
      } = makeTestApp();
      const member = await createVerifiedUser({
        app, authDependencies, borrowingDependencies, reservationDependencies,
        email: 'rr.member@example.com',
      });
      const librarian = await createVerifiedUser({
        app, authDependencies, borrowingDependencies, reservationDependencies,
        email: 'rr.lib@example.com', role: 'LIBRARIAN', approveMember: false,
      });

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ copyId: 1 })
        .expect(201);

      // Another member returns the copy -> it becomes available for the queue.
      reservationDependencies.state.copies.find((c) => c.copyId === 1).status = 'AVAILABLE';

      const processResponse = await request(app)
        .post('/api/reservations/process-queue')
        .set('Authorization', `Bearer ${librarian.accessToken}`)
        .send({ copyId: 1 });

      expect(processResponse.status).toBe(200);
      expect(processResponse.body.selectedReservation).toMatchObject({
        userId: member.userId,
        copyId: 1,
        status: 'NOTIFIED',
      });
      expect(reservationDependencies.state.copies.find((c) => c.copyId === 1).status).toBe('RESERVED');
      expect(notificationRepositories.state.notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: member.userId,
            type: 'RESERVATION_AVAILABLE',
            templateKey: 'RESERVATION_READY',
            sourceFeature: 'FE08',
          }),
        ])
      );
    });
  });

  describe('Cross-Feature: FE08 expire-holds promotes the next member + notifies (FR-FE08-019)', () => {
    test('an expired hold frees the copy, expires the reservation, and notifies the next member', async () => {
      const {
        app,
        authDependencies,
        borrowingDependencies,
        reservationDependencies,
        notificationRepositories,
      } = makeTestApp();
      const first = await createVerifiedUser({
        app, authDependencies, borrowingDependencies, reservationDependencies, email: 'exp.first@example.com',
      });
      const second = await createVerifiedUser({
        app, authDependencies, borrowingDependencies, reservationDependencies, email: 'exp.second@example.com',
      });
      const librarian = await createVerifiedUser({
        app, authDependencies, borrowingDependencies, reservationDependencies,
        email: 'exp.lib@example.com', role: 'LIBRARIAN', approveMember: false,
      });

      await request(app).post('/api/reservations')
        .set('Authorization', `Bearer ${first.accessToken}`).send({ copyId: 1 }).expect(201);
      await request(app).post('/api/reservations')
        .set('Authorization', `Bearer ${second.accessToken}`).send({ copyId: 1 }).expect(201);

      reservationDependencies.state.copies.find((c) => c.copyId === 1).status = 'AVAILABLE';
      await request(app).post('/api/reservations/process-queue')
        .set('Authorization', `Bearer ${librarian.accessToken}`).send({ copyId: 1 }).expect(200);

      // Simulate the first member's hold window having passed (clock is fixed at 2026-06-10).
      reservationDependencies.state.reservations.find(
        (r) => r.userId === first.userId && r.copyId === 1
      ).expiresAt = new Date('2026-06-01T00:00:00.000Z');

      const expireResponse = await request(app)
        .post('/api/reservations/expire-holds')
        .set('Authorization', `Bearer ${librarian.accessToken}`);

      expect(expireResponse.status).toBe(200);
      expect(expireResponse.body.expiredCount).toBe(1);
      expect(
        reservationDependencies.state.reservations.find((r) => r.userId === first.userId && r.copyId === 1).status
      ).toBe('EXPIRED');
      expect(
        reservationDependencies.state.reservations.find((r) => r.userId === second.userId && r.copyId === 1).status
      ).toBe('NOTIFIED');
      expect(reservationDependencies.state.copies.find((c) => c.copyId === 1).status).toBe('RESERVED');
      const readyForSecond = notificationRepositories.state.notifications.filter(
        (n) =>
          n.userId === second.userId &&
          n.type === 'RESERVATION_AVAILABLE' &&
          n.templateKey === 'RESERVATION_READY' &&
          n.sourceFeature === 'FE08'
      );
      expect(readyForSecond.length).toBeGreaterThan(0);
    });
  });

  describe('Health and Foundation', () => {
    test('GET /health returns ok', async () => {
      const { app } = makeTestApp();
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    test('GET / returns status message', async () => {
      const { app } = makeTestApp();
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});
