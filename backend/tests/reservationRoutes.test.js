process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { createReservationService } = require('../src/services/reservationService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');
const {
  makeInMemoryReservationDependencies,
} = require('./helpers/inMemoryReservationRepositories');

function makeTestApp({ notificationRepository } = {}) {
  const authDependencies = makeInMemoryAuthDependencies();
  const reservationDependencies = makeInMemoryReservationDependencies(authDependencies.state);
  const authService = createAuthService(authDependencies);
  const reservationService = createReservationService({
    reservationRepository: reservationDependencies.reservationRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationRepository: notificationRepository || authDependencies.notificationRepository,
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
    .send({ token: registerResponse.body.debugVerificationToken });

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

describe('FE08 reservation management', () => {
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

  test('librarian views reservations and processes the earliest eligible queue item', async () => {
    const { app, authDependencies, reservationDependencies } = makeTestApp();
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
    expect(authDependencies.state.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: firstMember.userId,
          templateCode: 'RESERVATION_READY',
          sourceFeature: 'FE08',
          sourceEntityType: 'RESERVATION',
        }),
      ])
    );
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

  test('process-queue keeps the hold when notification fails and records the failure (FR-FE08-021)', async () => {
    const failingNotification = {
      createNotification: jest.fn(async () => {
        throw new Error('smtp down');
      }),
    };
    const { app, authDependencies, reservationDependencies } = makeTestApp({
      notificationRepository: failingNotification,
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
    expect(failingNotification.createNotification).toHaveBeenCalled();
    expect(authDependencies.state.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'RESERVATION_NOTIFY_FAILED' }),
      ])
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
});
