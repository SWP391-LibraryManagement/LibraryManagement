process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { createBorrowingService } = require('../src/services/borrowingService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');
const { makeInMemoryBorrowingDependencies } = require('./helpers/inMemoryBorrowingRepositories');

function makeTestApp() {
  const authDependencies = makeInMemoryAuthDependencies();
  const borrowingDependencies = makeInMemoryBorrowingDependencies(authDependencies.state);
  const authService = createAuthService(authDependencies);
  const borrowingService = createBorrowingService({
    borrowingRepository: borrowingDependencies.borrowingRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationRepository: authDependencies.notificationRepository,
    clock: () => new Date('2026-06-10T00:00:00.000Z'),
  });
  const app = createApp({ authService, borrowingService });

  return { app, authDependencies, borrowingDependencies };
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

describe('FE07 borrowing management', () => {
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

  test('librarian approves request and member sees only own history', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
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
    expect(authDependencies.state.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: member.userId,
          templateCode: 'DUE_DATE_REMINDER',
          sourceFeature: 'FE07',
        }),
      ])
    );

    const ownHistoryResponse = await request(app)
      .get('/api/borrow-requests/me')
      .set('Authorization', authHeader(member.accessToken));

    expect(ownHistoryResponse.status).toBe(200);
    expect(ownHistoryResponse.body.borrowRequests).toHaveLength(1);
    expect(ownHistoryResponse.body.borrowRequests[0].userId).toBe(member.userId);
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

  test('renewal extends due date once and blocks reservation conflict', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
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
});
