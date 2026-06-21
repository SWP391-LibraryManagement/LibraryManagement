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

function makeTestApp() {
  const authDependencies = makeInMemoryAuthDependencies();
  const borrowingDependencies = makeInMemoryBorrowingDependencies(authDependencies.state);
  const reservationDependencies = makeInMemoryReservationDependencies(authDependencies.state);
  const notificationRepositories = makeInMemoryNotificationDependencies(authDependencies.state);
  const reportDependencies = makeInMemoryReportDependencies(authDependencies.state, borrowingDependencies.state);

  const authService = createAuthService(authDependencies);
  const borrowingService = createBorrowingService({
    borrowingRepository: borrowingDependencies.borrowingRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationRepository: authDependencies.notificationRepository,
    clock: () => new Date('2026-06-10T00:00:00.000Z'),
  });
  const reservationService = createReservationService({
    reservationRepository: reservationDependencies.reservationRepository,
    bookCopyRepository: reservationDependencies.bookCopyRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationRepository: authDependencies.notificationRepository,
    clock: () => new Date('2026-06-10T00:00:00.000Z'),
  });
  const notificationService = createNotificationService({
    notificationRepository: notificationRepositories.notificationRepository,
    templateRepository: notificationRepositories.templateRepository,
    userRepository: authDependencies.userRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    emailProvider: { send: async () => ({ success: true }) },
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

  return { app, authDependencies, borrowingDependencies, reservationDependencies };
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
    .send({ token: registerResponse.body.debugVerificationToken })
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
    test('Librarian creates notification request after auth', async () => {
      const { app, authDependencies, borrowingDependencies } = makeTestApp();
      const { accessToken } = await createVerifiedUser({
        app,
        authDependencies,
        borrowingDependencies,
        email: 'librarian@example.com',
        role: 'LIBRARIAN',
        approveMember: false,
      });

      const response = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'DUE_DATE_REMINDER',
          channel: 'EMAIL',
          recipientEmail: 'member@example.com',
          templateKey: 'DUE_DATE_REMINDER',
          templateData: { dueDate: '2026-06-24' },
          idempotencyKey: 'test-1',
        });

      expect(response.status).toBe(201);
      expect(response.body.notification).toMatchObject({
        type: 'DUE_DATE_REMINDER',
        status: 'PENDING',
        idempotencyKey: 'test-1',
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
      expect(response.body).toHaveProperty('totals');
      expect(response.body.totals).toHaveProperty('requests');
    });
  });

  describe('Cross-Feature: FE07 -> FE09 -> FE10', () => {
    test('Borrow approval creates notification and overdue return exposes fine candidate data', async () => {
      const { app, authDependencies, borrowingDependencies } = makeTestApp();
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
      expect(authDependencies.state.notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: member.userId,
            templateCode: 'DUE_DATE_REMINDER',
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
