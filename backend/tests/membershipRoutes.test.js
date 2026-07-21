process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { createMembershipService } = require('../src/services/membershipService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');
const { makeInMemoryMembershipDependencies } = require('./helpers/inMemoryMembershipRepositories');

function makeTestApp({ membershipOptions, auditLogRepository, notificationRequester } = {}) {
  const authDependencies = makeInMemoryAuthDependencies();
  const membershipDependencies = makeInMemoryMembershipDependencies(
    authDependencies.state,
    membershipOptions
  );
  const authService = createAuthService(authDependencies);
  const membershipService = createMembershipService({
    membershipRepository: membershipDependencies.membershipRepository,
    auditLogRepository: auditLogRepository || authDependencies.auditLogRepository,
    notificationRequester,
  });
  const app = createApp({ authService, membershipService });

  return { app, authDependencies, membershipDependencies };
}

async function createVerifiedUser({ app, authDependencies, email, roles = ['MEMBER'], completeProfile = true }) {
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
  if (completeProfile) {
    authDependencies.state.users.find((user) => user.userId === userId).phone = '0900000000';
    authDependencies.state.profiles.push({
      userId,
      fullName: email.split('@')[0],
      address: 'Test address',
      dateOfBirth: '2000-01-01',
    });
  }
  await request(app)
    .post('/api/auth/verify-email')
    .send({ token: authDependencies.state.generatedOtps.at(-1) })
    .expect(200);

  authDependencies.state.rolesByUserId.set(userId, roles);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  expect(loginResponse.status).toBe(200);
  return { userId, accessToken: loginResponse.body.accessToken };
}

function authHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

function getApplicationId(response) {
  return (
    response.body.currentApplication?.applicationId ||
    response.body.application?.applicationId ||
    response.body.applicationId
  );
}

function getMembershipAudits(authDependencies) {
  return authDependencies.state.auditLogs.filter((entry) =>
    String(entry.action || '').startsWith('MEMBERSHIP_APPLICATION_')
  );
}

describe('FE04 membership management', () => {
  // @spec BR-FE04-001 BR-FE04-002 BR-FE04-011 AC-FE04-005 AC-FE04-008
  test('non-member roles cannot apply or view membership status', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.non-member-role@example.test',
      roles: ['LIBRARIAN'],
    });

    const statusResponse = await request(app)
      .get('/api/membership/status/me')
      .set('Authorization', authHeader(librarian.accessToken));
    const applyResponse = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});

    expect(statusResponse.status).toBe(403);
    expect(applyResponse.status).toBe(403);
    expect(membershipDependencies.state.applications).toHaveLength(0);
    expect(membershipDependencies.state.members).toHaveLength(0);
  });

  // @spec AC-FE04-001 AC-FE04-007 AC-FE04-008
  test('active MEMBER applicant can access own status and apply without a pre-existing membership projection', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp();
    const applicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.registered-applicant@example.test',
      roles: ['MEMBER'],
    });

    const initialStatus = await request(app)
      .get('/api/membership/status/me')
      .query({ userId: 999999 })
      .set('Authorization', authHeader(applicant.accessToken));

    expect(initialStatus.status).toBe(200);
    expect(initialStatus.body.membershipStatusView).toBe('NONE');
    expect(initialStatus.body.memberStatus).toBeNull();
    expect(initialStatus.body.currentApplication).toBeNull();

    const applyResponse = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(applicant.accessToken))
      .send({});

    expect(applyResponse.status).toBe(201);
    expect(applyResponse.body.membershipStatusView).toBe('PENDING');
    expect(applyResponse.body.memberStatus).toBe('PENDING');
    expect(applyResponse.body.currentApplication.userId).toBe(applicant.userId);

    const member = membershipDependencies.state.members.find(
      (item) => item.userId === applicant.userId
    );
    expect(member).toEqual(expect.objectContaining({ userId: applicant.userId, status: 'PENDING' }));
  });

  // @spec BR-FE04-019 FR-FE04-013 AC-FE04-012
  test('member must complete required personal profile fields before applying', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp();
    const applicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.incomplete-profile@example.test',
      completeProfile: false,
    });
    authDependencies.state.users.find((user) => user.userId === applicant.userId).fullName = null;

    const response = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(applicant.accessToken))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(expect.objectContaining({
      code: 'MEMBERSHIP_PROFILE_INCOMPLETE',
      details: { missingFields: ['fullName', 'phone', 'dateOfBirth', 'address'] },
    }));
    expect(membershipDependencies.state.applications).toHaveLength(0);
  });

  // @spec BR-FE04-013 BR-FE04-015 AC-FE04-001
  test('application submission audit contains complete canonical metadata', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp();
    const applicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.submit-audit@example.test',
      roles: ['MEMBER'],
    });
    const applyResponse = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(applicant.accessToken))
      .send({});
    expect(applyResponse.status).toBe(201);

    const applicationId = getApplicationId(applyResponse);
    const member = membershipDependencies.state.members.find(
      (item) => item.userId === applicant.userId
    );
    const audit = getMembershipAudits(authDependencies).find(
      (entry) => entry.action === 'MEMBERSHIP_APPLICATION_SUBMITTED'
    );
    expect(audit).toEqual(
      expect.objectContaining({
        userId: applicant.userId,
        targetType: 'MEMBERSHIP_APPLICATION',
        targetId: applicationId,
      })
    );
    expect(audit.metadata).toEqual(
      expect.objectContaining({
        userId: applicant.userId,
        memberId: member.memberId,
        status: 'PENDING',
        result: 'PENDING',
      })
    );
    expect(audit.metadata.timestamp).toBeTruthy();
  });

  // @spec AC-FE04-008
  test('guest cannot apply or view membership status', async () => {
    await request(makeTestApp().app).post('/api/membership/applications').send({}).expect(401);
    await request(makeTestApp().app).get('/api/membership/status/me').expect(401);
  });

  // @spec AC-FE04-001 AC-FE04-007
  test('own status returns only canonical fields and no protected reviewer data', async () => {
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
    expect(applyResponse.body.membershipStatusView).toBe('PENDING');
    expect(applyResponse.body.memberStatus).toBe('PENDING');

    const statusResponse = await request(app)
      .get('/api/membership/status/me')
      .set('Authorization', authHeader(member.accessToken));

    expect(statusResponse.status).toBe(200);
    expect(Object.keys(statusResponse.body).sort()).toEqual([
      'currentApplication',
      'memberStatus',
      'membershipStatusView',
    ]);
    expect(statusResponse.body.membershipStatusView).toBe('PENDING');
    expect(statusResponse.body.memberStatus).toBe('PENDING');
    expect(statusResponse.body.currentApplication).toEqual(
      expect.objectContaining({ userId: member.userId, status: 'PENDING' })
    );
    expect(statusResponse.body.currentApplication.reviewedBy).toBeUndefined();
  });

  // @spec AC-FE04-002
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

  // @spec AC-FE04-003 AC-FE04-011
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
      roles: ['LIBRARIAN'],
    });

    const application = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(member.accessToken))
      .send({})
      .expect(201);
    const applicationId = getApplicationId(application);

    const approveResponse = await request(app)
      .patch(`/api/membership/applications/${applicationId}/approve`)
      .set('Authorization', authHeader(librarian.accessToken))
      .send({});

    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.membershipStatusView).toBe('APPROVED');
    const approvedMember = membershipDependencies.state.members.find(
      (item) => item.userId === member.userId
    );
    const approvedApplication = membershipDependencies.state.applications.find(
      (item) => item.userId === member.userId
    );
    expect(approvedMember.status).toBe('APPROVED');
    expect(approvedMember.approvedAt).toEqual(approvedApplication.approvedAt);
    expect(approvedMember.approvedBy).toBe(librarian.userId);
    expect(approvedApplication.reviewedBy).toBe(librarian.userId);

    const audit = getMembershipAudits(authDependencies).find(
      (entry) => entry.action === 'MEMBERSHIP_APPLICATION_APPROVED'
    );
    expect(audit).toEqual(
      expect.objectContaining({
        userId: librarian.userId,
        targetId: applicationId,
      })
    );
    expect(audit.metadata).toEqual(
      expect.objectContaining({
        userId: member.userId,
        memberId: approvedMember.memberId,
        status: 'APPROVED',
        result: 'APPROVED',
        decisionAt: approvedApplication.approvedAt.toISOString(),
      })
    );

    const approvedReapply = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(member.accessToken))
      .send({});
    expect(approvedReapply.status).toBe(409);
    expect(approvedReapply.body.error.code).toBe('MEMBERSHIP_ALREADY_APPROVED');
  });

  // @spec AC-FE04-003 AC-FE04-011
  test('canonical approved membership blocks reapply even when latest history is rejected', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp();
    const applicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.canonical-approved@example.test',
    });
    membershipDependencies.seedMember({
      userId: applicant.userId,
      status: 'APPROVED',
      approvedAt: '2026-06-10T01:00:00.000Z',
      approvedBy: 99,
    });
    membershipDependencies.seedApplication({
      userId: applicant.userId,
      status: 'REJECTED',
      appliedAt: '2026-06-11T00:00:00.000Z',
      reviewedBy: 98,
      reviewNote: 'Historical rejection.',
    });

    const statusResponse = await request(app)
      .get('/api/membership/status/me')
      .set('Authorization', authHeader(applicant.accessToken))
      .expect(200);
    expect(statusResponse.body.membershipStatusView).toBe('APPROVED');
    expect(statusResponse.body.memberStatus).toBe('APPROVED');
    expect(statusResponse.body.currentApplication.status).toBe('REJECTED');

    const reapplyResponse = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(applicant.accessToken))
      .send({});
    expect(reapplyResponse.status).toBe(409);
    expect(reapplyResponse.body.error.code).toBe('MEMBERSHIP_ALREADY_APPROVED');
  });

  // @spec AC-FE04-004 AC-FE04-006
  test('staff rejects with required reason and non-pending review is blocked', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.reject.member@example.test',
    });
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.reject.admin@example.test',
      roles: ['ADMIN'],
    });

    const application = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(member.accessToken))
      .send({})
      .expect(201);
    const applicationId = getApplicationId(application);

    const missingReason = await request(app)
      .patch(`/api/membership/applications/${applicationId}/reject`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({});

    expect(missingReason.status).toBe(400);

    const blankReason = await request(app)
      .patch(`/api/membership/applications/${applicationId}/reject`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({ reason: '   ' });
    expect(blankReason.status).toBe(400);

    const nonStringReason = await request(app)
      .patch(`/api/membership/applications/${applicationId}/reject`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({ reason: 123 });
    expect(nonStringReason.status).toBe(400);

    const longReason = await request(app)
      .patch(`/api/membership/applications/${applicationId}/reject`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({ reason: 'x'.repeat(501) });
    expect(longReason.status).toBe(400);

    expect(membershipDependencies.state.applications[0].status).toBe('PENDING');
    expect(membershipDependencies.state.members[0].status).toBe('PENDING');
    expect(
      getMembershipAudits(authDependencies).filter(
        (entry) => entry.action === 'MEMBERSHIP_APPLICATION_REJECTED'
      )
    ).toHaveLength(0);

    const acceptedReason = 'x'.repeat(500);
    const rejectResponse = await request(app)
      .patch(`/api/membership/applications/${applicationId}/reject`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({ reason: ` ${acceptedReason} ` });

    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.body.membershipStatusView).toBe('REJECTED');
    expect(rejectResponse.body.currentApplication.rejectionReason).toBe(acceptedReason);
    const rejectedApplication = membershipDependencies.state.applications[0];
    const rejectedMember = membershipDependencies.state.members[0];
    expect(rejectedApplication.status).toBe('REJECTED');
    expect(rejectedApplication.reviewNote).toBe(acceptedReason);
    expect(rejectedApplication.reviewedBy).toBe(admin.userId);
    expect(rejectedMember.status).toBe('REJECTED');
    expect(rejectedMember.approvedAt).toBeNull();
    expect(rejectedMember.approvedBy).toBeNull();

    const audit = getMembershipAudits(authDependencies).find(
      (entry) => entry.action === 'MEMBERSHIP_APPLICATION_REJECTED'
    );
    expect(audit.metadata).toEqual(
      expect.objectContaining({
        memberId: rejectedMember.memberId,
        result: 'REJECTED',
        decisionAt: expect.anything(),
        reason: acceptedReason,
      })
    );

    const secondReview = await request(app)
      .patch(`/api/membership/applications/${applicationId}/approve`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({});

    expect(secondReview.status).toBe(409);
    expect(secondReview.body.error.code).toBe('MEMBERSHIP_APPLICATION_NOT_PENDING');
  });

  // @spec AC-FE04-005
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

  // @spec AC-FE04-005 AC-FE04-006
  test('review endpoints validate identifiers and return safe not-found responses', async () => {
    const { app, authDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.review-boundary.admin@example.test',
      roles: ['ADMIN'],
    });

    const malformed = await request(app)
      .patch('/api/membership/applications/not-an-id/approve')
      .set('Authorization', authHeader(admin.accessToken))
      .send({});
    expect(malformed.status).toBe(400);
    expect(JSON.stringify(malformed.body)).not.toContain('stack');

    const outsideSqlInt = await request(app)
      .patch('/api/membership/applications/2147483648/approve')
      .set('Authorization', authHeader(admin.accessToken))
      .send({});
    expect(outsideSqlInt.status).toBe(400);

    const missing = await request(app)
      .patch('/api/membership/applications/999999/approve')
      .set('Authorization', authHeader(admin.accessToken))
      .send({});
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('MEMBERSHIP_APPLICATION_NOT_FOUND');
    expect(JSON.stringify(missing.body)).not.toContain('stack');
  });

  // @spec NFR-FE04-PERF-001
  test('staff list filters and paginates applications in deterministic latest-first order', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.list.admin@example.test',
      roles: ['ADMIN'],
    });
    const firstApplicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.list.first@example.test',
    });
    const secondApplicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.list.second@example.test',
    });
    const rejectedApplicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.list.rejected@example.test',
    });
    membershipDependencies.seedApplication({
      applicationId: 40,
      userId: firstApplicant.userId,
      status: 'PENDING',
      appliedAt: '2026-06-10T00:00:00.000Z',
    });
    membershipDependencies.seedApplication({
      applicationId: 20,
      userId: secondApplicant.userId,
      status: 'PENDING',
      appliedAt: '2026-06-11T00:00:00.000Z',
    });
    membershipDependencies.seedApplication({
      applicationId: 60,
      userId: rejectedApplicant.userId,
      status: 'REJECTED',
      appliedAt: '2026-06-12T00:00:00.000Z',
      reviewNote: 'Rejected.',
    });

    const firstPage = await request(app)
      .get('/api/membership/applications')
      .query({ status: 'pending', page: 1, limit: 1 })
      .set('Authorization', authHeader(admin.accessToken))
      .expect(200);
    expect(firstPage.body).toEqual(
      expect.objectContaining({ page: 1, limit: 1, total: 2, totalPages: 2 })
    );
    expect(firstPage.body.applications.map((item) => item.applicationId)).toEqual([20]);

    const secondPage = await request(app)
      .get('/api/membership/applications')
      .query({ status: 'PENDING', page: 2, limit: 1 })
      .set('Authorization', authHeader(admin.accessToken))
      .expect(200);
    expect(secondPage.body.applications.map((item) => item.applicationId)).toEqual([40]);
  });

  // @spec AC-FE04-001 AC-FE04-011
  test('inactive account cannot submit a membership application', async () => {
    const { app, authDependencies } = makeTestApp();
    const applicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.inactive@example.test',
    });
    const user = authDependencies.state.users.find((item) => item.userId === applicant.userId);
    user.status = 'INACTIVE';

    const response = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(applicant.accessToken))
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('USER_ACCOUNT_INACTIVE');
  });

  // @spec AC-FE04-007 AC-FE04-011
  test('own status uses canonical member state and deterministic latest application ordering', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp();
    const applicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.latest-status@example.test',
    });
    membershipDependencies.seedMember({
      userId: applicant.userId,
      status: 'REJECTED',
    });
    membershipDependencies.seedApplication({
      applicationId: 90,
      userId: applicant.userId,
      status: 'APPROVED',
      appliedAt: '2026-06-09T00:00:00.000Z',
      approvedAt: '2026-06-09T01:00:00.000Z',
      reviewedBy: 7,
    });
    membershipDependencies.seedApplication({
      applicationId: 10,
      userId: applicant.userId,
      status: 'REJECTED',
      appliedAt: '2026-06-11T00:00:00.000Z',
      reviewedBy: 8,
      reviewNote: 'Latest by timestamp.',
    });
    membershipDependencies.seedApplication({
      applicationId: 11,
      userId: applicant.userId,
      status: 'PENDING',
      appliedAt: '2026-06-11T00:00:00.000Z',
    });

    const response = await request(app)
      .get('/api/membership/status/me')
      .set('Authorization', authHeader(applicant.accessToken))
      .expect(200);

    expect(response.body.membershipStatusView).toBe('REJECTED');
    expect(response.body.memberStatus).toBe('REJECTED');
    expect(response.body.currentApplication.applicationId).toBe(11);
    expect(response.body.currentApplication.status).toBe('PENDING');
  });

  // @spec AC-FE04-002
  test('concurrent applications create at most one pending application and canonical member row', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp({
      membershipOptions: { synchronizeBlockingChecks: true },
    });
    const applicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.concurrent-apply@example.test',
    });

    const responses = await Promise.all([
      request(app)
        .post('/api/membership/applications')
        .set('Authorization', authHeader(applicant.accessToken))
        .send({}),
      request(app)
        .post('/api/membership/applications')
        .set('Authorization', authHeader(applicant.accessToken))
        .send({}),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(
      membershipDependencies.state.applications.filter(
        (application) => application.userId === applicant.userId && application.status === 'PENDING'
      )
    ).toHaveLength(1);
    expect(
      membershipDependencies.state.members.filter((member) => member.userId === applicant.userId)
    ).toHaveLength(1);
    expect(
      getMembershipAudits(authDependencies).filter(
        (entry) => entry.action === 'MEMBERSHIP_APPLICATION_SUBMITTED'
      )
    ).toHaveLength(1);
  });

  // @spec AC-FE04-006
  test('concurrent final reviews allow exactly one result and preserve a single final state', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp({
      membershipOptions: { synchronizeReviewReads: true },
    });
    const applicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.review-race.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.review-race.librarian@example.test',
      roles: ['LIBRARIAN'],
    });
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.review-race.admin@example.test',
      roles: ['ADMIN'],
    });
    const application = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(applicant.accessToken))
      .send({})
      .expect(201);
    const applicationId = getApplicationId(application);

    const responses = await Promise.all([
      request(app)
        .patch(`/api/membership/applications/${applicationId}/approve`)
        .set('Authorization', authHeader(librarian.accessToken))
        .send({}),
      request(app)
        .patch(`/api/membership/applications/${applicationId}/reject`)
        .set('Authorization', authHeader(admin.accessToken))
        .send({ reason: 'Concurrent rejection.' }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const finalApplication = membershipDependencies.state.applications.find(
      (item) => item.applicationId === applicationId
    );
    const finalMember = membershipDependencies.state.members.find(
      (item) => item.userId === applicant.userId
    );
    expect(['APPROVED', 'REJECTED']).toContain(finalApplication.status);
    expect(finalMember.status).toBe(finalApplication.status);
    expect(
      getMembershipAudits(authDependencies).filter((entry) =>
        ['MEMBERSHIP_APPLICATION_APPROVED', 'MEMBERSHIP_APPLICATION_REJECTED'].includes(
          entry.action
        )
      )
    ).toHaveLength(1);
  });

  // @spec AC-FE04-009
  test('rejected applicant can reapply while immutable history is preserved', async () => {
    const { app, authDependencies, membershipDependencies } = makeTestApp();
    const applicant = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.reapply.member@example.test',
    });
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'membership.reapply.admin@example.test',
      roles: ['ADMIN'],
    });
    const first = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(applicant.accessToken))
      .send({})
      .expect(201);
    const firstApplicationId = getApplicationId(first);
    await request(app)
      .patch(`/api/membership/applications/${firstApplicationId}/reject`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({ reason: 'Please correct the application.' })
      .expect(200);
    const rejectedApplication = membershipDependencies.state.applications.find(
      (item) => item.applicationId === firstApplicationId
    );
    const rejectedSnapshot = {
      status: rejectedApplication.status,
      reviewedBy: rejectedApplication.reviewedBy,
      reviewNote: rejectedApplication.reviewNote,
      appliedAt: rejectedApplication.appliedAt.getTime(),
    };

    const second = await request(app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(applicant.accessToken))
      .send({});

    expect(second.status).toBe(201);
    expect(getApplicationId(second)).not.toBe(firstApplicationId);
    expect(membershipDependencies.state.applications).toHaveLength(2);
    expect(membershipDependencies.state.applications[0]).toEqual(
      expect.objectContaining({
        status: rejectedSnapshot.status,
        reviewedBy: rejectedSnapshot.reviewedBy,
        reviewNote: rejectedSnapshot.reviewNote,
      })
    );
    expect(membershipDependencies.state.applications[0].appliedAt.getTime()).toBe(
      rejectedSnapshot.appliedAt
    );
    expect(membershipDependencies.state.applications[1].status).toBe('PENDING');
    expect(membershipDependencies.state.members[0].status).toBe('PENDING');
    expect(membershipDependencies.state.members[0].approvedAt).toBeNull();
    expect(membershipDependencies.state.members[0].approvedBy).toBeNull();
  });

  // @spec AC-FE04-001 AC-FE04-003 AC-FE04-004
  test('audit failure rolls back apply and review state instead of leaving partial membership data', async () => {
    let auditCalls = 0;
    const auditLogRepository = {
      async create() {
        auditCalls += 1;
        throw new Error('injected membership audit failure');
      },
    };
    const applySetup = makeTestApp({ auditLogRepository });
    const applicant = await createVerifiedUser({
      app: applySetup.app,
      authDependencies: applySetup.authDependencies,
      email: 'membership.apply-rollback@example.test',
    });

    const applyFailure = await request(applySetup.app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(applicant.accessToken))
      .send({});

    expect(applyFailure.status).toBe(500);
    expect(JSON.stringify(applyFailure.body)).not.toContain('injected membership audit failure');
    expect(auditCalls).toBe(1);
    expect(applySetup.membershipDependencies.state.applications).toHaveLength(0);
    expect(applySetup.membershipDependencies.state.members).toHaveLength(0);

    let reviewAuditCalls = 0;
    const reviewSetup = makeTestApp({
      auditLogRepository: {
        async create() {
          reviewAuditCalls += 1;
          if (reviewAuditCalls === 2) {
            throw new Error('injected membership review audit failure');
          }
        },
      },
    });
    const reviewApplicant = await createVerifiedUser({
      app: reviewSetup.app,
      authDependencies: reviewSetup.authDependencies,
      email: 'membership.review-rollback@example.test',
    });
    const reviewer = await createVerifiedUser({
      app: reviewSetup.app,
      authDependencies: reviewSetup.authDependencies,
      email: 'membership.review-rollback.admin@example.test',
      roles: ['ADMIN'],
    });
    const pending = await request(reviewSetup.app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(reviewApplicant.accessToken))
      .send({})
      .expect(201);
    const pendingApplicationId = getApplicationId(pending);

    const reviewFailure = await request(reviewSetup.app)
      .patch(`/api/membership/applications/${pendingApplicationId}/approve`)
      .set('Authorization', authHeader(reviewer.accessToken))
      .send({});

    expect(reviewFailure.status).toBe(500);
    expect(JSON.stringify(reviewFailure.body)).not.toContain(
      'injected membership review audit failure'
    );
    expect(reviewSetup.membershipDependencies.state.applications[0].status).toBe('PENDING');
    expect(reviewSetup.membershipDependencies.state.members[0].status).toBe('PENDING');
  });

  // @spec AC-FE04-003 AC-FE04-004 AC-FE04-010
  test('review requests one idempotent FE04 delivery and requester failure is non-blocking', async () => {
    const requests = [];
    const committedSnapshots = [];
    let successfulSetup;
    successfulSetup = makeTestApp({
      notificationRequester: {
        async createNotificationRequest(input) {
          requests.push(input);
          committedSnapshots.push({
            applicationStatus: successfulSetup.membershipDependencies.state.applications[0].status,
            memberStatus: successfulSetup.membershipDependencies.state.members[0].status,
            decisionAuditCount: getMembershipAudits(successfulSetup.authDependencies).filter(
              (entry) => entry.action === 'MEMBERSHIP_APPLICATION_APPROVED'
            ).length,
          });
          return { notificationId: 700, status: 'PENDING' };
        },
      },
    });
    const applicant = await createVerifiedUser({
      app: successfulSetup.app,
      authDependencies: successfulSetup.authDependencies,
      email: 'membership.delivery.member@example.test',
    });
    const admin = await createVerifiedUser({
      app: successfulSetup.app,
      authDependencies: successfulSetup.authDependencies,
      email: 'membership.delivery.admin@example.test',
      roles: ['ADMIN'],
    });
    const pending = await request(successfulSetup.app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(applicant.accessToken))
      .send({})
      .expect(201);
    const pendingApplicationId = getApplicationId(pending);

    const approved = await request(successfulSetup.app)
      .patch(`/api/membership/applications/${pendingApplicationId}/approve`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({});

    expect(approved.status).toBe(200);
    expect(approved.body.notificationStatus).toBe('PENDING');
    expect(requests).toHaveLength(1);
    expect(requests[0]).toEqual({
      type: 'GENERAL_SYSTEM',
      channel: 'EMAIL',
      templateKey: 'MEMBERSHIP_RESULT',
      userId: applicant.userId,
      recipientEmail: 'membership.delivery.member@example.test',
      templateData: {
        applicationId: pendingApplicationId,
        membershipStatus: 'APPROVED',
        rejectionReason: null,
      },
      sourceEntityType: 'MEMBERSHIP_APPLICATION',
      sourceEntityId: pendingApplicationId,
      idempotencyKey: `FE04:MEMBERSHIP_RESULT:${pendingApplicationId}:APPROVED`,
    });
    expect(committedSnapshots).toEqual([
      { applicationStatus: 'APPROVED', memberStatus: 'APPROVED', decisionAuditCount: 1 },
    ]);

    await request(successfulSetup.app)
      .patch(`/api/membership/applications/${pendingApplicationId}/approve`)
      .set('Authorization', authHeader(admin.accessToken))
      .send({})
      .expect(409);
    expect(requests).toHaveLength(1);

    const failingSetup = makeTestApp({
      notificationRequester: {
        async createNotificationRequest() {
          throw new Error('provider unavailable');
        },
      },
    });
    const failingApplicant = await createVerifiedUser({
      app: failingSetup.app,
      authDependencies: failingSetup.authDependencies,
      email: 'membership.delivery-failure.member@example.test',
    });
    const failingAdmin = await createVerifiedUser({
      app: failingSetup.app,
      authDependencies: failingSetup.authDependencies,
      email: 'membership.delivery-failure.admin@example.test',
      roles: ['ADMIN'],
    });
    const failingPending = await request(failingSetup.app)
      .post('/api/membership/applications')
      .set('Authorization', authHeader(failingApplicant.accessToken))
      .send({})
      .expect(201);
    const failingApplicationId = getApplicationId(failingPending);

    const rejected = await request(failingSetup.app)
      .patch(`/api/membership/applications/${failingApplicationId}/reject`)
      .set('Authorization', authHeader(failingAdmin.accessToken))
      .send({ reason: 'Missing document.' });

    expect(rejected.status).toBe(200);
    expect(rejected.body.notificationStatus).toBe('FAILED');
    expect(JSON.stringify(rejected.body)).not.toContain('provider unavailable');
    expect(failingSetup.membershipDependencies.state.applications[0].status).toBe('REJECTED');
    expect(failingSetup.membershipDependencies.state.members[0].status).toBe('REJECTED');
  });
});
