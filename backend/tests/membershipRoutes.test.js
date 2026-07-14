process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { createMembershipService } = require('../src/services/membershipService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');
const { makeInMemoryMembershipDependencies } = require('./helpers/inMemoryMembershipRepositories');

function makeTestApp() {
  const authDependencies = makeInMemoryAuthDependencies();
  const membershipDependencies = makeInMemoryMembershipDependencies(authDependencies.state);
  const authService = createAuthService(authDependencies);
  const membershipService = createMembershipService({
    membershipRepository: membershipDependencies.membershipRepository,
    auditLogRepository: authDependencies.auditLogRepository,
  });
  const app = createApp({ authService, membershipService });

  return { app, authDependencies, membershipDependencies };
}

async function createVerifiedUser({ app, authDependencies, email, role = 'MEMBER' }) {
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

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  expect(loginResponse.status).toBe(200);
  return { userId, accessToken: loginResponse.body.accessToken };
}

function authHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

describe('FE04 membership management', () => {
  test('member applies and sees own pending status', async () => {
    const { app, authDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.member@example.test',
    });

    const applyResponse = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(applyResponse.status).toBe(201);
    expect(applyResponse.body.status).toBe('PENDING');
    expect(applyResponse.body.application.userId).toBe(member.userId);

    const statusResponse = await request(app)
      .get('/api/membership/status/me')
      .set('Authorization', authHeader(member.accessToken));

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBe('PENDING');
    expect(statusResponse.body.userId).toBe(member.userId);
  });

  test('duplicate pending application is rejected', async () => {
    const { app, authDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.duplicate@example.test',
    });

    await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(member.accessToken))
      .send({})
      .expect(201);

    const duplicateResponse = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error.code).toBe('MEMBERSHIP_APPLICATION_PENDING');
  });

  test('staff approves pending application and member becomes approved', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.approve.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.approve.librarian@example.test',
      role: 'LIBRARIAN',
    });

    const application = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(member.accessToken))
      .send({})
      .expect(201);

    const approveResponse = await request(app)
      .patch(`/api/membership/applications/${application.body.applicationId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});

    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.status).toBe('APPROVED');
    expect(membershipDependencies.state.members.find((item) => item.userId === member.userId).status).toBe('APPROVED');
  });

  test('staff rejects with required reason and non-pending review is blocked', async () => {
    const { app, authDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.reject.member@example.test',
    });
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.reject.admin@example.test',
      role: 'ADMIN',
    });

    const application = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(member.accessToken))
      .send({})
      .expect(201);

    const missingReason = await request(app)
      .patch(`/api/membership/applications/${application.body.applicationId}/reject`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({});

    expect(missingReason.status).toBe(400);

    const rejectResponse = await request(app)
      .patch(`/api/membership/applications/${application.body.applicationId}/reject`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({ reason: 'Missing required documents.' });

    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.body.status).toBe('REJECTED');
    expect(rejectResponse.body.rejectionReason).toBe('Missing required documents.');

    const secondReview = await request(app)
      .patch(`/api/membership/applications/${application.body.applicationId}/approve`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({});

    expect(secondReview.status).toBe(409);
    expect(secondReview.body.error.code).toBe('MEMBERSHIP_APPLICATION_NOT_PENDING');
  });

  test('member cannot list or review membership applications', async () => {
    const { app, authDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.forbidden@example.test',
    });

    const listResponse = await request(app)
      .get('/api/membership/applications')
      .set('Authorization', authHeader(member.accessToken));

    expect(listResponse.status).toBe(403);

    const reviewResponse = await request(app)
      .patch('/api/membership/applications/1/approve')
      .set('Authorization', authHeader(member.accessToken))
      .send({});

    expect(reviewResponse.status).toBe(403);
  });
});
