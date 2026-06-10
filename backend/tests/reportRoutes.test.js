process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { createBorrowingService } = require('../src/services/borrowingService');
const { createReportService } = require('../src/services/reportService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');
const { makeInMemoryBorrowingDependencies } = require('./helpers/inMemoryBorrowingRepositories');
const { makeInMemoryReportDependencies } = require('./helpers/inMemoryReportRepositories');

function makeTestApp() {
  const authDependencies = makeInMemoryAuthDependencies();
  const borrowingDependencies = makeInMemoryBorrowingDependencies(authDependencies.state);
  const reportDependencies = makeInMemoryReportDependencies(
    authDependencies.state,
    borrowingDependencies.state
  );
  const authService = createAuthService(authDependencies);
  const borrowingService = createBorrowingService({
    borrowingRepository: borrowingDependencies.borrowingRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationRepository: authDependencies.notificationRepository,
    clock: () => new Date('2026-06-10T00:00:00.000Z'),
  });
  const reportService = createReportService({
    reportRepository: reportDependencies.reportRepository,
    auditLogRepository: authDependencies.auditLogRepository,
  });
  const app = createApp({ authService, borrowingService, reportService });

  return { app, authDependencies, borrowingDependencies, reportDependencies };
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
    .send({ token: registerResponse.body.debugVerificationToken })
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

describe('FE12 reporting and statistics', () => {
  test('borrowing and inventory reports return aggregates without mutating source data', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'report.librarian@example.test',
      role: 'LIBRARIAN',
      approveMember: false,
    });
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'report.member@example.test',
    });

    const createResponse = await request(app)
      .post('/api/borrow-requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({ copyIds: [1] })
      .expect(201);

    const requestId = createResponse.body.borrowRequest.requestId;
    await request(app)
      .patch(`/api/borrow-requests/${requestId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({})
      .expect(200);

    const beforeState = JSON.stringify(borrowingDependencies.state.borrowRequests);
    const borrowingReportResponse = await request(app)
      .get('/api/reports/borrowing?status=BORROWED')
      .set('Authorization', authHeader(librarian.accessToken));

    expect(borrowingReportResponse.status).toBe(200);
    expect(borrowingReportResponse.body.totals.activeLoans).toBe(1);
    expect(borrowingReportResponse.body.requestStatusCounts.APPROVED).toBe(1);
    expect(borrowingReportResponse.body.detailStatusCounts.BORROWED).toBe(1);
    expect(borrowingReportResponse.body.topBorrowedBooks[0]).toMatchObject({
      bookId: 1,
      borrowCount: 1,
    });
    expect(JSON.stringify(borrowingDependencies.state.borrowRequests)).toBe(beforeState);

    const inventoryReportResponse = await request(app)
      .get('/api/reports/inventory')
      .set('Authorization', authHeader(librarian.accessToken));

    expect(inventoryReportResponse.status).toBe(200);
    expect(inventoryReportResponse.body.totals.books).toBeGreaterThan(0);
    expect(inventoryReportResponse.body.copyStatusCounts.BORROWED).toBeGreaterThanOrEqual(1);
  });

  test('user statistics hide personal data and support empty filters', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'report.admin@example.test',
      role: 'ADMIN',
      approveMember: false,
    });
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'report.user.member@example.test',
    });

    const userStatsResponse = await request(app)
      .get('/api/reports/users')
      .set('Authorization', authHeader(admin.accessToken));

    expect(userStatsResponse.status).toBe(200);
    expect(userStatsResponse.body.totals.users).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(userStatsResponse.body)).not.toContain('report.user.member@example.test');
    expect(JSON.stringify(userStatsResponse.body)).not.toContain('passwordHash');

    const emptyResponse = await request(app)
      .get('/api/reports/borrowing?fromDate=2030-01-01&toDate=2030-01-02')
      .set('Authorization', authHeader(admin.accessToken));

    expect(emptyResponse.status).toBe(200);
    expect(emptyResponse.body.totals.requests).toBe(0);
    expect(emptyResponse.body.topBorrowedBooks).toEqual([]);
  });

  test('report access is role-protected and invalid ranges are rejected', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'report.admin.range@example.test',
      role: 'ADMIN',
      approveMember: false,
    });
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'report.member.role@example.test',
    });

    await request(app).get('/api/reports/borrowing').expect(401);

    const forbiddenResponse = await request(app)
      .get('/api/reports/inventory')
      .set('Authorization', authHeader(member.accessToken));

    expect(forbiddenResponse.status).toBe(403);

    const invalidRangeResponse = await request(app)
      .get('/api/reports/borrowing?fromDate=2026-06-11&toDate=2026-06-10')
      .set('Authorization', authHeader(admin.accessToken));

    expect(invalidRangeResponse.status).toBe(400);
  });
});
