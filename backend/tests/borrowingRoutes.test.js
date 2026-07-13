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

function makeTestApp({ notificationStub = makeNotificationRequesterStub() } = {}) {
  const authDependencies = makeInMemoryAuthDependencies();
  const borrowingDependencies = makeInMemoryBorrowingDependencies(authDependencies.state);
  const authService = createAuthService(authDependencies);
  const borrowingService = createBorrowingService({
    borrowingRepository: borrowingDependencies.borrowingRepository,
    auditLogRepository: authDependencies.auditLogRepository,
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

  // AC-FE07-002, FR-FE07-015: inactive account or unapproved membership is rejected.
  test('inactive account or unapproved membership cannot create a borrow request', async () => {
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

    expect(unapprovedResponse.status).toBe(403);
    expect(unapprovedResponse.body.error.code).toBe('MEMBERSHIP_NOT_APPROVED');
    expect(borrowingDependencies.state.borrowRequests).toHaveLength(0);
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

  // FR-FE07-020, BR-FE07-018: an overdue borrowed item cannot be renewed and the due date is unchanged.
  test('renewal is rejected for an overdue borrowed item and keeps the due date', async () => {
    const { app, authDependencies, borrowingDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'overdue.renew.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      borrowingDependencies,
      email: 'overdue.renew.librarian@example.test',
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

    // Force the due date into the past relative to the fixed clock (2026-06-10).
    const overdueDueDate = new Date('2026-06-01T00:00:00.000Z');
    borrowingDependencies.state.borrowDetails.find(
      (detail) => detail.borrowDetailId === borrowDetailId
    ).dueDate = overdueDueDate;

    const renewResponse = await request(app)
      .patch(`/api/borrow-details/${borrowDetailId}/renew`)
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(renewResponse.status).toBe(409);
    expect(renewResponse.body.error.code).toBe('BORROW_DETAIL_OVERDUE');
    const storedDetail = borrowingDependencies.state.borrowDetails.find(
      (detail) => detail.borrowDetailId === borrowDetailId
    );
    expect(new Date(storedDetail.dueDate).toISOString()).toBe(overdueDueDate.toISOString());
    expect(storedDetail.renewalCount).toBe(0);
  });
});
