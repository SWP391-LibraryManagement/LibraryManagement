process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const bcrypt = require('bcrypt');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { hashToken, generateRandomToken } = require('../src/utils/tokenUtils');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');

const FIXED_NOW = new Date('2026-07-15T02:00:00.000Z');

function makeTestApp({ clock, dependencyOptions, debugLogger } = {}) {
  const dependencies = makeInMemoryAuthDependencies(dependencyOptions);
  const authService = createAuthService({ ...dependencies, clock, debugLogger });
  const app = createApp({ authService });
  app.locals.authTestDependencies = dependencies;

  return { app, authService, dependencies };
}

function capturedOtp(app) {
  const generatedOtp = app.locals.authTestDependencies.state.generatedOtps.at(-1);
  expect(generatedOtp).toEqual(expect.any(String));
  return generatedOtp;
}

async function createPendingSetupAccount(dependencies, overrides = {}) {
  const rawToken = overrides.rawToken || generateRandomToken();
  const passwordHash = await bcrypt.hash('DiscardedPlaceholder1!', 4);
  const result = await dependencies.accountSetupRepository.createPendingAccount({
    username: overrides.username || 'setup.account',
    email: overrides.email || 'setup@example.test',
    passwordHash,
    phone: null,
    fullName: 'Setup Account',
    address: null,
    roleName: 'MEMBER',
    tokenHash: hashToken(rawToken),
    expiresAt: overrides.expiresAt || new Date(FIXED_NOW.getTime() + 24 * 60 * 60 * 1000),
    adminUserId: 99,
    ip: '127.0.0.1',
    userAgent: 'jest',
    now: FIXED_NOW,
  });

  return { rawToken, passwordHash, ...result };
}

async function registerAndVerify(app, email = 'member@example.test', password = 'Password1!') {
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      confirmPassword: password,
      fullName: 'Demo Member',
    });

  expect(registerResponse.status).toBe(201);
  const verificationOtp = capturedOtp(app);

  const verifyResponse = await request(app)
    .post('/api/auth/verify-email')
    .send({ token: verificationOtp });

  expect(verifyResponse.status).toBe(200);

  return registerResponse.body;
}

async function login(app, email = 'member@example.test', password = 'Password1!') {
  return request(app)
    .post('/api/auth/login')
    .send({
      email,
      password,
    });
}

describe('FE02 auth vertical slice', () => {
  // @spec BR-FE02-020 BR-FE02-021 FR-FE02-002 FR-FE02-022 AC-FE02-001
  test('registration requests one FE10 verification OTP delivery using the persisted token ID', async () => {
    const { app, dependencies } = makeTestApp();

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'requester-register@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });

    expect(response.status).toBe(201);
    const token = dependencies.state.tokens.find((item) => item.tokenType === 'EMAIL_VERIFY');
    expect(dependencies.state.notificationRequests).toEqual([
      {
        type: 'ACCOUNT_VERIFICATION',
        channel: 'EMAIL',
        userId: 1,
        recipientEmail: 'requester-register@example.test',
        templateKey: 'ACCOUNT_VERIFICATION',
        templateData: { otp: '123456', expiresInMinutes: 15 },
        sourceEntityType: 'AuthToken',
        sourceEntityId: token.tokenId,
        idempotencyKey: `FE02:ACCOUNT_VERIFICATION:${token.tokenId}`,
      },
    ]);
    expect(dependencies.state.notifications).toHaveLength(0);
    expect(dependencies.state.directEmails).toHaveLength(0);
    expect(response.body.debugOtp).toBeUndefined();
    expect(response.body.debugVerificationToken).toBeUndefined();
  });

  // @spec BR-FE02-020 BR-FE02-021 FR-FE02-002 FR-FE02-022 AC-FE02-001
  test('verification resend creates a new token-ID requester event without direct delivery', async () => {
    const { app, dependencies } = makeTestApp();
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'requester-resend@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      })
      .expect(201);

    dependencies.state.notificationRequests.length = 0;
    dependencies.state.notifications.length = 0;
    dependencies.state.directEmails.length = 0;

    const response = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'requester-resend@example.test' });

    expect(response.status).toBe(200);
    const token = dependencies.state.tokens.at(-1);
    expect(token.tokenId).toBe(2);
    expect(dependencies.state.notificationRequests).toEqual([
      {
        type: 'ACCOUNT_VERIFICATION',
        channel: 'EMAIL',
        userId: 1,
        recipientEmail: 'requester-resend@example.test',
        templateKey: 'ACCOUNT_VERIFICATION',
        templateData: { otp: '234567', expiresInMinutes: 15 },
        sourceEntityType: 'AuthToken',
        sourceEntityId: token.tokenId,
        idempotencyKey: `FE02:ACCOUNT_VERIFICATION:${token.tokenId}`,
      },
    ]);
    expect(dependencies.state.notifications).toHaveLength(0);
    expect(dependencies.state.directEmails).toHaveLength(0);
    expect(response.body.debugOtp).toBeUndefined();
    expect(response.body.debugVerificationToken).toBeUndefined();
  });

  // @spec BR-FE02-020 BR-FE02-021 FR-FE02-011 FR-FE02-022 AC-FE02-014
  test('forgot password requests one FE10 reset OTP delivery using the persisted token ID', async () => {
    const { app, dependencies } = makeTestApp();
    const user = await dependencies.userRepository.createRegisteredUser({
      username: 'requester-reset',
      email: 'requester-reset@example.test',
      passwordHash: await bcrypt.hash('Password1!', 4),
      phoneNumber: null,
      fullName: 'Requester Reset',
    });
    await dependencies.userRepository.markEmailVerified(user.userId);

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'requester-reset@example.test' });

    expect(response.status).toBe(200);
    const token = dependencies.state.tokens.find((item) => item.tokenType === 'PASSWORD_RESET');
    expect(dependencies.state.notificationRequests).toEqual([
      {
        type: 'PASSWORD_RESET',
        channel: 'EMAIL',
        userId: user.userId,
        recipientEmail: 'requester-reset@example.test',
        templateKey: 'PASSWORD_RESET',
        templateData: { otp: '123456', expiresInMinutes: 15 },
        sourceEntityType: 'AuthToken',
        sourceEntityId: token.tokenId,
        idempotencyKey: `FE02:PASSWORD_RESET:${token.tokenId}`,
      },
    ]);
    expect(dependencies.state.notifications).toHaveLength(0);
    expect(dependencies.state.directEmails).toHaveLength(0);
    expect(response.body.debugOtp).toBeUndefined();
    expect(response.body.debugResetToken).toBeUndefined();
  });

  // @spec BR-FE02-020 BR-FE02-021 FR-FE02-011 FR-FE02-022 AC-FE02-014
  test('repeated forgot-password creates a new token event and requester key without direct delivery', async () => {
    const { app, dependencies } = makeTestApp();
    const user = await dependencies.userRepository.createRegisteredUser({
      username: 'requester-reset-repeat',
      email: 'requester-reset-repeat@example.test',
      passwordHash: await bcrypt.hash('Password1!', 4),
      phoneNumber: null,
      fullName: 'Requester Reset Repeat',
    });
    await dependencies.userRepository.markEmailVerified(user.userId);

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: user.email })
      .expect(200);
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: user.email })
      .expect(200);

    const resetTokens = dependencies.state.tokens.filter(
      (item) => item.tokenType === 'PASSWORD_RESET'
    );
    expect(resetTokens).toHaveLength(2);
    expect(resetTokens[0].revokedAt).toEqual(expect.any(Date));
    expect(resetTokens[1].tokenId).not.toBe(resetTokens[0].tokenId);
    expect(dependencies.state.notificationRequests).toEqual([
      expect.objectContaining({
        type: 'PASSWORD_RESET',
        sourceEntityId: resetTokens[0].tokenId,
        idempotencyKey: `FE02:PASSWORD_RESET:${resetTokens[0].tokenId}`,
      }),
      expect.objectContaining({
        type: 'PASSWORD_RESET',
        sourceEntityId: resetTokens[1].tokenId,
        idempotencyKey: `FE02:PASSWORD_RESET:${resetTokens[1].tokenId}`,
      }),
    ]);
    expect(dependencies.state.directEmails).toHaveLength(0);
  });

  // @spec BR-FE02-022 FR-FE02-023 AC-FE02-019
  test('verification requester exception does not roll back registration or expose the OTP', async () => {
    const { app, dependencies } = makeTestApp();
    dependencies.state.notificationRequesterControl.error = new Error(
      'provider failure containing otp 123456'
    );

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'requester-failure-register@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      userId: 1,
      email: 'requester-failure-register@example.test',
      message: 'Verification email sent',
    });
    expect(dependencies.state.users).toHaveLength(1);
    expect(dependencies.state.users[0].status).toBe('INACTIVE');
    expect(dependencies.state.tokens).toEqual([
      expect.objectContaining({ tokenId: 1, tokenType: 'EMAIL_VERIFY' }),
    ]);
    expect(dependencies.state.notificationRequests).toHaveLength(1);
    expect(JSON.stringify({ body: response.body, audits: dependencies.state.auditLogs })).not.toContain(
      '123456'
    );
  });

  // @spec BR-FE02-022 FR-FE02-023 AC-FE02-019
  test('password-reset requester exception keeps the generic response and persisted reset token', async () => {
    const { app, dependencies } = makeTestApp();
    const user = await dependencies.userRepository.createRegisteredUser({
      username: 'requester-failure-reset',
      email: 'requester-failure-reset@example.test',
      passwordHash: await bcrypt.hash('Password1!', 4),
      phoneNumber: null,
      fullName: 'Requester Failure Reset',
    });
    await dependencies.userRepository.markEmailVerified(user.userId);
    dependencies.state.notificationRequesterControl.error = new Error(
      'provider failure containing otp 123456'
    );

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'requester-failure-reset@example.test' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Password reset email sent' });
    expect(dependencies.state.tokens).toEqual([
      expect.objectContaining({ tokenId: 1, tokenType: 'PASSWORD_RESET' }),
    ]);
    expect(dependencies.state.notificationRequests).toHaveLength(1);
    expect(JSON.stringify({ body: response.body, audits: dependencies.state.auditLogs })).not.toContain(
      '123456'
    );
  });

  // @spec BR-FE02-022 FR-FE02-023 AC-FE02-019
  test('safe FE10 FAILED status preserves public verification and reset semantics', async () => {
    const registerSetup = makeTestApp({ dependencyOptions: { notificationStatus: 'FAILED' } });
    const registered = await request(registerSetup.app)
      .post('/api/auth/register')
      .send({
        email: 'requester-failed-status@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });
    expect(registered.status).toBe(201);
    expect(registered.body).toEqual(
      expect.objectContaining({ message: 'Verification email sent' })
    );

    const user = registerSetup.dependencies.state.users[0];
    await registerSetup.dependencies.userRepository.markEmailVerified(user.userId);
    const forgot = await request(registerSetup.app)
      .post('/api/auth/forgot-password')
      .send({ email: user.email });
    expect(forgot.status).toBe(200);
    expect(forgot.body).toEqual({ message: 'Password reset email sent' });
    expect(registerSetup.dependencies.state.tokens.at(-1)).toEqual(
      expect.objectContaining({ tokenType: 'PASSWORD_RESET' })
    );
  });

  test('register -> verify email -> login -> me succeeds', async () => {
    const { app, dependencies } = makeTestApp();

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'member@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
        fullName: 'Demo Member',
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body).toMatchObject({
      userId: 1,
      email: 'member@example.test',
      message: 'Verification email sent',
    });
    expect(dependencies.state.users[0].status).toBe('INACTIVE');
    const verificationOtp = capturedOtp(app);

    const verifyResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verificationOtp });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.message).toBe('Account verified. You can now login.');
    expect(dependencies.state.users[0].status).toBe('ACTIVE');

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'member@example.test',
        password: 'Password1!',
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toMatchObject({
      userId: 1,
      email: 'member@example.test',
      roles: ['MEMBER'],
      expiresIn: 900,
    });
    expect(loginResponse.body.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body.refreshToken).toEqual(expect.any(String));

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toMatchObject({
      userId: 1,
      email: 'member@example.test',
      status: 'ACTIVE',
      roles: ['MEMBER'],
    });
    expect(meResponse.body.passwordHash).toBeUndefined();
  });

  // @spec FR-FE02-015 AC-FE02-001
  test('duplicate registration is rejected without creating another user, token, or notification', async () => {
    const { app, dependencies } = makeTestApp();
    const registration = {
      email: 'duplicate@example.test',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      fullName: 'First Member',
    };

    const firstResponse = await request(app).post('/api/auth/register').send(registration);
    expect(firstResponse.status).toBe(201);

    const stateBeforeDuplicate = {
      users: dependencies.state.users.length,
      tokens: dependencies.state.tokens.length,
      notificationRequests: dependencies.state.notificationRequests.length,
      notifications: dependencies.state.notifications.length,
      directEmails: dependencies.state.directEmails.length,
    };

    const duplicateResponse = await request(app)
      .post('/api/auth/register')
      .send({ ...registration, fullName: 'Duplicate Member' });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error).toMatchObject({
      code: 'EMAIL_ALREADY_REGISTERED',
      message: 'Email is already registered. Please login or use forgot password.',
    });
    expect({
      users: dependencies.state.users.length,
      tokens: dependencies.state.tokens.length,
      notificationRequests: dependencies.state.notificationRequests.length,
      notifications: dependencies.state.notifications.length,
      directEmails: dependencies.state.directEmails.length,
    }).toEqual(stateBeforeDuplicate);
  });

  test('duplicate username is rejected before creating a user, token, or notification', async () => {
    const { app, dependencies } = makeTestApp();
    const firstResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'duplicate-user',
        email: 'first-username@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });
    expect(firstResponse.status).toBe(201);
    const stateBeforeDuplicate = {
      users: dependencies.state.users.length,
      tokens: dependencies.state.tokens.length,
      notificationRequests: dependencies.state.notificationRequests.length,
    };

    const duplicateResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'duplicate-user',
        email: 'second-username@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error.code).toBe('USERNAME_ALREADY_REGISTERED');
    expect({
      users: dependencies.state.users.length,
      tokens: dependencies.state.tokens.length,
      notificationRequests: dependencies.state.notificationRequests.length,
    }).toEqual(stateBeforeDuplicate);
  });

  test('concurrent duplicate registration maps the SQL email conflict to 409', async () => {
    const { app, dependencies } = makeTestApp();
    const conflict = Object.assign(new Error("Violation of UNIQUE INDEX 'UX_Users_Email'."), {
      number: 2601,
    });
    jest.spyOn(dependencies.userRepository, 'createRegisteredUser').mockRejectedValueOnce(conflict);

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'concurrent-duplicate@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatchObject({
      code: 'EMAIL_ALREADY_REGISTERED',
      message: 'Email is already registered. Please login or use forgot password.',
    });
    expect(dependencies.state.users).toHaveLength(0);
    expect(dependencies.state.tokens).toHaveLength(0);
  });

  test('concurrent duplicate registration maps the SQL username conflict to 409', async () => {
    const { app, dependencies } = makeTestApp();
    const conflict = Object.assign(new Error("Violation of UNIQUE KEY constraint 'UQ__Users__Username'."), {
      number: 2627,
    });
    jest.spyOn(dependencies.userRepository, 'createRegisteredUser').mockRejectedValueOnce(conflict);

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'concurrent-user',
        email: 'concurrent-username@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('USERNAME_ALREADY_REGISTERED');
    expect(dependencies.state.users).toHaveLength(0);
    expect(dependencies.state.tokens).toHaveLength(0);
    expect(dependencies.state.notificationRequests).toHaveLength(0);
  });

  // @spec FR-FE02-019 AC-FE02-001
  test('weak registration password is rejected without persisting auth state', async () => {
    const { app, dependencies } = makeTestApp();

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'weak-registration@example.test',
        password: 'password1!',
        confirmPassword: 'password1!',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('WEAK_PASSWORD');
    expect(dependencies.state.users).toHaveLength(0);
    expect(dependencies.state.tokens).toHaveLength(0);
    expect(dependencies.state.notificationRequests).toHaveLength(0);
    expect(dependencies.state.notifications).toHaveLength(0);
    expect(dependencies.state.directEmails).toHaveLength(0);
  });

  // @spec FR-FE02-003 AC-FE02-002
  test('canonical email and OTP verification activates the account and consumes the OTP', async () => {
    const { app, dependencies } = makeTestApp();

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'canonical-verify@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });
    expect(registerResponse.status).toBe(201);
    const verificationOtp = capturedOtp(app);
    const verificationToken = dependencies.state.tokens.find(
      (token) => token.tokenType === 'EMAIL_VERIFY'
    );

    const verifyResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'canonical-verify@example.test', otp: verificationOtp });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body).toEqual({ message: 'Account verified. You can now login.' });
    expect(dependencies.state.users[0]).toMatchObject({
      status: 'ACTIVE',
      emailVerifiedAt: expect.any(Date),
    });
    expect(
      dependencies.state.tokens.find((token) => token.tokenId === verificationToken.tokenId)
        .usedAt
    ).toEqual(expect.any(Date));
  });

  // @spec FR-FE02-003 AC-FE02-002 INV-FE02-004 INV-FE02-006
  test('email verification cannot reactivate a deactivated account', async () => {
    const { app, dependencies } = makeTestApp();

    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'deactivated-verification@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      })
      .expect(201);
    const verificationOtp = capturedOtp(app);
    const verificationToken = dependencies.state.tokens[0];
    dependencies.state.users[0].deactivatedAt = new Date();

    await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'deactivated-verification@example.test', otp: verificationOtp })
      .expect(400);
    await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verificationOtp })
      .expect(400);

    expect(dependencies.state.users[0]).toMatchObject({
      status: 'INACTIVE',
      emailVerifiedAt: null,
      deactivatedAt: expect.any(Date),
    });
    expect(verificationToken.usedAt).toBeNull();
    expect(dependencies.state.auditLogs).not.toContainEqual(
      expect.objectContaining({ action: 'AUTH_VERIFY_EMAIL' })
    );
  });

  test('email verification rolls back activation and token use when required audit fails', async () => {
    const { app, dependencies } = makeTestApp();

    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'verification-audit-failure@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      })
      .expect(201);
    const verificationOtp = capturedOtp(app);
    const originalCreateAudit = dependencies.auditLogRepository.create;
    dependencies.auditLogRepository.create = async (entry) => {
      if (entry.action === 'AUTH_VERIFY_EMAIL') throw new Error('verification audit failed');
      return originalCreateAudit(entry);
    };

    await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'verification-audit-failure@example.test', otp: verificationOtp })
      .expect(500);

    expect(dependencies.state.users[0]).toMatchObject({ status: 'INACTIVE', emailVerifiedAt: null });
    expect(dependencies.state.tokens[0].usedAt).toBeNull();
  });

  test('login rejects invalid password and increments failed counter', async () => {
    const { app, dependencies } = makeTestApp();

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'wrong-password@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });

    const verificationOtp = capturedOtp(app);
    await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verificationOtp });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong-password@example.test',
        password: 'WrongPassword1!',
      });

    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body.error).toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });
    expect(dependencies.state.users[0].failedLoginCount).toBe(1);
  });

  test('login accepts a registered email longer than 100 characters within the 255-character contract', async () => {
    const { app } = makeTestApp();
    const email = `${'a'.repeat(64)}@${'b'.repeat(30)}.${'c'.repeat(30)}.com`;

    expect(email.length).toBeGreaterThan(100);
    expect(email.length).toBeLessThanOrEqual(255);
    await registerAndVerify(app, email);

    const response = await login(app, email);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(email);
  });

  test('protected me endpoint rejects missing token', async () => {
    const { app } = makeTestApp();

    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('resend verification invalidates previous verification token', async () => {
    const { app, dependencies } = makeTestApp();

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'resend@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });
    const oldVerificationOtp = capturedOtp(app);

    const resendResponse = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'resend@example.test' });

    expect(resendResponse.status).toBe(200);
    expect(resendResponse.body.message).toBe('Verification email sent');
    expect(dependencies.state.tokens[0].revokedAt).toEqual(expect.any(Date));
    const newVerificationOtp = capturedOtp(app);

    const oldTokenResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: oldVerificationOtp });

    expect(oldTokenResponse.status).toBe(400);

    const newTokenResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: newVerificationOtp });

    expect(newTokenResponse.status).toBe(200);
  });

  test('refresh token issues new access token and logout revokes refresh token', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'refresh@example.test');
    const loginResponse = await login(app, 'refresh@example.test');

    expect(loginResponse.status).toBe(200);

    const refreshResponse = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: loginResponse.body.refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body).toMatchObject({
      accessToken: expect.any(String),
      expiresIn: 900,
      refreshToken: loginResponse.body.refreshToken,
    });

    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: loginResponse.body.refreshToken });

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.message).toBe('Logged out');
    expect(dependencies.state.tokens.find((token) => token.tokenType === 'REFRESH').revokedAt).toEqual(expect.any(Date));

    const meAfterLogout = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

    expect(meAfterLogout.status).toBe(401);

    const refreshAfterLogout = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: loginResponse.body.refreshToken });

    expect(refreshAfterLogout.status).toBe(401);
  });

  test('change password rejects wrong current password and accepts new password', async () => {
    const { app } = makeTestApp();
    await registerAndVerify(app, 'change@example.test');
    const loginResponse = await login(app, 'change@example.test');

    const wrongCurrentResponse = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({
        currentPassword: 'WrongPassword1!',
        newPassword: 'NewPassword1!',
      });

    expect(wrongCurrentResponse.status).toBe(401);
    expect(wrongCurrentResponse.body.error.code).toBe('INVALID_CURRENT_PASSWORD');

    const changeResponse = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({
        currentPassword: 'Password1!',
        newPassword: 'NewPassword1!',
      });

    expect(changeResponse.status).toBe(200);
    expect(changeResponse.body.message).toBe('Password changed');

    const oldPasswordLogin = await login(app, 'change@example.test', 'Password1!');
    expect(oldPasswordLogin.status).toBe(401);

    const newPasswordLogin = await login(app, 'change@example.test', 'NewPassword1!');
    expect(newPasswordLogin.status).toBe(200);
  });

  test('change-password OTP does not claim delivery when SMTP is unavailable', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'otp-delivery@example.test');
    const loginResponse = await login(app, 'otp-delivery@example.test');
    dependencies.emailService.sendChangePasswordOtpEmail = jest.fn(async () => ({
      sent: false,
      reason: 'SMTP_NOT_CONFIGURED',
    }));

    const response = await request(app)
      .post('/api/auth/change-password/request-otp')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({
        currentPassword: 'Password1!',
        newPassword: 'NewPassword1!',
        confirmNewPassword: 'NewPassword1!',
      });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('EMAIL_DELIVERY_FAILED');
    expect(dependencies.state.auditLogs).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ action: 'AUTH_CHANGE_PASSWORD_OTP_REQUESTED' }),
    ]));
  });

  test('change-password OTP rejects invalid ownership/state and changes the password once', async () => {
    const { app, dependencies } = makeTestApp({ clock: () => FIXED_NOW });
    await registerAndVerify(app, 'otp-change@example.test');
    const loginResponse = await login(app, 'otp-change@example.test');
    const authorization = `Bearer ${loginResponse.body.accessToken}`;
    const originalPasswordHash = dependencies.state.users[0].passwordHash;

    await request(app)
      .post('/api/auth/change-password/request-otp')
      .set('Authorization', authorization)
      .send({
        currentPassword: 'WrongPassword1!',
        newPassword: 'NewPassword1!',
        confirmNewPassword: 'NewPassword1!',
      })
      .expect(401);
    expect(dependencies.state.users[0].passwordHash).toBe(originalPasswordHash);

    await request(app)
      .post('/api/auth/change-password/request-otp')
      .set('Authorization', authorization)
      .send({
        currentPassword: 'Password1!',
        newPassword: 'NewPassword1!',
        confirmNewPassword: 'NewPassword1!',
      })
      .expect(200);
    const validOtp = capturedOtp(app);
    const otpToken = dependencies.state.tokens.at(-1);

    await request(app)
      .post('/api/auth/change-password/confirm')
      .set('Authorization', authorization)
      .send({ otp: '999999', newPassword: 'NewPassword1!' })
      .expect(400);
    expect(dependencies.state.users[0].passwordHash).toBe(originalPasswordHash);

    otpToken.expiresAt = new Date(FIXED_NOW.getTime() - 1);
    const expiredResponse = await request(app)
      .post('/api/auth/change-password/confirm')
      .set('Authorization', authorization)
      .send({ otp: validOtp, newPassword: 'NewPassword1!' });
    expect(expiredResponse.body.error.code).toBe('EXPIRED_OTP');
    expect(dependencies.state.users[0].passwordHash).toBe(originalPasswordHash);

    otpToken.expiresAt = new Date(FIXED_NOW.getTime() + 60_000);
    otpToken.usedAt = FIXED_NOW;
    await request(app)
      .post('/api/auth/change-password/confirm')
      .set('Authorization', authorization)
      .send({ otp: validOtp, newPassword: 'NewPassword1!' })
      .expect(400);
    expect(dependencies.state.users[0].passwordHash).toBe(originalPasswordHash);

    await request(app)
      .post('/api/auth/change-password/request-otp')
      .set('Authorization', authorization)
      .send({
        currentPassword: 'Password1!',
        newPassword: 'NewPassword1!',
        confirmNewPassword: 'NewPassword1!',
      })
      .expect(200);
    const freshOtp = capturedOtp(app);

    await registerAndVerify(app, 'other-otp-user@example.test');
    const otherLogin = await login(app, 'other-otp-user@example.test');
    const otherPasswordHash = dependencies.state.users[1].passwordHash;
    await request(app)
      .post('/api/auth/change-password/confirm')
      .set('Authorization', `Bearer ${otherLogin.body.accessToken}`)
      .send({ otp: freshOtp, newPassword: 'NewPassword1!' })
      .expect(400);
    expect(dependencies.state.users[1].passwordHash).toBe(otherPasswordHash);

    await request(app)
      .post('/api/auth/change-password/confirm')
      .set('Authorization', authorization)
      .send({ otp: freshOtp, newPassword: 'NewPassword1!' })
      .expect(200);

    expect(await login(app, 'otp-change@example.test', 'Password1!')).toHaveProperty('status', 401);
    expect(await login(app, 'otp-change@example.test', 'NewPassword1!')).toHaveProperty('status', 200);
  });

  test('protected authentication uses current roles instead of access-token role claims', async () => {
    const { app, authService, dependencies } = makeTestApp();
    await registerAndVerify(app, 'current-role@example.test');
    const loginResponse = await login(app, 'current-role@example.test');

    dependencies.state.rolesByUserId.set(1, ['LIBRARIAN']);

    await expect(authService.authenticateToken(loginResponse.body.accessToken)).resolves.toMatchObject({
      roles: ['LIBRARIAN'],
    });
  });

  test.each(['INACTIVE', 'LOCKED'])(
    'protected authentication rejects a user changed to %s after token issuance',
    async (status) => {
      const { app, authService, dependencies } = makeTestApp();
      await registerAndVerify(app, `protected-${status.toLowerCase()}@example.test`);
      const loginResponse = await login(app, `protected-${status.toLowerCase()}@example.test`);
      dependencies.state.users[0].status = status;

      await expect(authService.authenticateToken(loginResponse.body.accessToken)).rejects.toMatchObject({
        code: 'INVALID_TOKEN',
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    }
  );

  test('failed token validation emits only a safe code through the debug logger', async () => {
    const debugLogger = jest.fn();
    const { authService } = makeTestApp({ debugLogger });

    await expect(authService.authenticateToken('not-a-token')).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    });
    expect(debugLogger).toHaveBeenCalledWith('[auth token validation failed]', {
      code: 'INVALID_TOKEN',
    });
    expect(JSON.stringify(debugLogger.mock.calls)).not.toContain('not-a-token');
  });

  test('forgot password is generic and reset token works once', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'reset@example.test');

    const unknownResponse = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@example.test' });

    expect(unknownResponse.status).toBe(200);
    expect(unknownResponse.body).toEqual({
      message: 'Password reset email sent',
    });

    const forgotResponse = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@example.test' });

    expect(forgotResponse.status).toBe(200);
    expect(forgotResponse.body.message).toBe('Password reset email sent');
    const resetOtp = capturedOtp(app);

    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetOtp,
        newPassword: 'ResetPassword1!',
      });

    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body.message).toBe('Password reset successful');

    const reusedTokenResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetOtp,
        newPassword: 'AnotherPassword1!',
      });

    expect(reusedTokenResponse.status).toBe(400);

    const loginResponse = await login(app, 'reset@example.test', 'ResetPassword1!');
    expect(loginResponse.status).toBe(200);
  });

  // @spec FR-FE02-012 AC-FE02-016 AC-FE02-018
  test('canonical email and OTP reset updates the password and consumes the OTP', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'canonical-reset@example.test');
    const originalPasswordHash = dependencies.state.users[0].passwordHash;

    const forgotResponse = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'canonical-reset@example.test' });
    expect(forgotResponse.status).toBe(200);
    const resetOtp = capturedOtp(app);
    const resetToken = dependencies.state.tokens.find(
      (token) => token.tokenType === 'PASSWORD_RESET'
    );

    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'canonical-reset@example.test',
        otp: resetOtp,
        newPassword: 'ResetPassword1!',
      });

    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body).toEqual({ message: 'Password reset successful' });
    expect(dependencies.state.users[0].passwordHash).not.toBe(originalPasswordHash);
    expect(
      dependencies.state.tokens.find((token) => token.tokenId === resetToken.tokenId).usedAt
    ).toEqual(expect.any(Date));

    const loginResponse = await login(
      app,
      'canonical-reset@example.test',
      'ResetPassword1!'
    );
    expect(loginResponse.status).toBe(200);
  });

  // @spec FR-FE02-019 AC-FE02-016
  test('weak canonical OTP reset leaves the password and reset credential unchanged', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'weak-reset@example.test');
    const originalPasswordHash = dependencies.state.users[0].passwordHash;

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'weak-reset@example.test' });
    const resetOtp = capturedOtp(app);
    const resetToken = dependencies.state.tokens.find(
      (token) => token.tokenType === 'PASSWORD_RESET'
    );

    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'weak-reset@example.test',
        otp: resetOtp,
        newPassword: 'password1!',
      });

    expect(resetResponse.status).toBe(400);
    expect(resetResponse.body.error.code).toBe('WEAK_PASSWORD');
    expect(dependencies.state.users[0].passwordHash).toBe(originalPasswordHash);
    expect(
      dependencies.state.tokens.find((token) => token.tokenId === resetToken.tokenId)
    ).toMatchObject({ usedAt: null, revokedAt: null });

    const loginResponse = await login(app, 'weak-reset@example.test', 'Password1!');
    expect(loginResponse.status).toBe(200);
  });

  // @spec BR-FE02-004 BR-FE02-007 BR-FE02-025 AC-FE02-007
  test('verified credentials resume only an interrupted self-registration', async () => {
    const { app, dependencies } = makeTestApp();

    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'inactive@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });

    const inactiveResponse = await login(app, 'inactive@example.test');
    const wrongPasswordResponse = await login(app, 'inactive@example.test', 'WrongPassword1!');
    const unknownResponse = await login(app, 'unknown@example.test');

    expect(inactiveResponse.status).toBe(403);
    expect(inactiveResponse.body.error).toEqual({
      code: 'EMAIL_VERIFICATION_REQUIRED',
      message: 'Email verification is required before login.',
      details: { email: 'inactive@example.test' },
    });
    expect(wrongPasswordResponse.status).toBe(401);
    expect(unknownResponse.status).toBe(401);
    expect(wrongPasswordResponse.body).toEqual(unknownResponse.body);
    expect(unknownResponse.body.error).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });
    expect(dependencies.state.tokens.filter((token) => token.tokenType === 'REFRESH')).toHaveLength(0);
    expect(dependencies.state.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'AUTH_LOGIN_INACTIVE', userId: 1, targetId: 1 }),
        expect.objectContaining({
          action: 'AUTH_LOGIN_FAILURE',
          userId: null,
          metadata: { identifier: 'unknown@example.test', reason: 'INVALID_CREDENTIALS' },
        }),
      ])
    );
  });

  test('admin-created setup and deactivated accounts do not enter self-registration verification', async () => {
    const setupCase = makeTestApp({ clock: () => FIXED_NOW });
    await createPendingSetupAccount(setupCase.dependencies, {
      email: 'pending-setup@example.test',
      username: 'pending.setup',
    });

    const setupLogin = await login(
      setupCase.app,
      'pending-setup@example.test',
      'DiscardedPlaceholder1!'
    );
    expect(setupLogin.status).toBe(401);
    expect(setupLogin.body.error.code).toBe('INVALID_CREDENTIALS');

    const tokenCount = setupCase.dependencies.state.tokens.length;
    await request(setupCase.app)
      .post('/api/auth/resend-verification')
      .send({ email: 'pending-setup@example.test' })
      .expect(200);
    expect(setupCase.dependencies.state.tokens).toHaveLength(tokenCount);

    const deactivatedCase = makeTestApp();
    await registerAndVerify(deactivatedCase.app, 'deactivated@example.test');
    deactivatedCase.dependencies.state.users[0].status = 'INACTIVE';

    const deactivatedLogin = await login(deactivatedCase.app, 'deactivated@example.test');
    expect(deactivatedLogin.status).toBe(401);
    expect(deactivatedLogin.body.error.code).toBe('INVALID_CREDENTIALS');

    const pendingDeactivatedCase = makeTestApp();
    await request(pendingDeactivatedCase.app)
      .post('/api/auth/register')
      .send({
        email: 'pending-deactivated@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      })
      .expect(201);
    pendingDeactivatedCase.dependencies.state.users[0].deactivatedAt = new Date();

    const pendingTokenCount = pendingDeactivatedCase.dependencies.state.tokens.length;
    const pendingLogin = await login(
      pendingDeactivatedCase.app,
      'pending-deactivated@example.test'
    );
    expect(pendingLogin.status).toBe(401);
    expect(pendingLogin.body.error.code).toBe('INVALID_CREDENTIALS');
    await request(pendingDeactivatedCase.app)
      .post('/api/auth/resend-verification')
      .send({ email: 'pending-deactivated@example.test' })
      .expect(200);
    expect(pendingDeactivatedCase.dependencies.state.tokens).toHaveLength(pendingTokenCount);
  });

  test('locked account is rejected after too many failed attempts', async () => {
    const { app, dependencies } = makeTestApp({ clock: () => FIXED_NOW });
    await registerAndVerify(app, 'locked@example.test');

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await login(app, 'locked@example.test', 'WrongPassword1!');
      expect(response.status).toBe(401);
    }
    const thresholdResponse = await login(app, 'locked@example.test', 'WrongPassword1!');

    expect(dependencies.state.users[0].status).toBe('LOCKED');
    expect(dependencies.state.users[0].lockedUntil).toEqual(
      new Date(FIXED_NOW.getTime() + 30 * 60 * 1000)
    );
    expect(dependencies.state.auditLogs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        action: 'AUTH_ACCOUNT_LOCKED',
        metadata: { identifier: 'locked@example.test', reason: 'FAILED_ATTEMPT_THRESHOLD' },
      }),
    ]));
    expect(thresholdResponse.status).toBe(429);
    expect(thresholdResponse.body.error).toMatchObject({
      code: 'ACCOUNT_LOCKED',
      details: { retryAfterSeconds: 30 * 60 },
    });

    const lockedResponse = await login(app, 'locked@example.test', 'Password1!');
    expect(lockedResponse.status).toBe(429);
    expect(lockedResponse.body.error.code).toBe('ACCOUNT_LOCKED');
    expect(lockedResponse.body.error.details.retryAfterSeconds).toBe(30 * 60);
  });

  test('only failures in the rolling 15-minute window count toward account lock', async () => {
    let now = new Date(FIXED_NOW);
    const { app, dependencies } = makeTestApp({ clock: () => now });
    await registerAndVerify(app, 'rolling-lock@example.test');

    for (const minute of [0, 4, 8, 12, 16]) {
      now = new Date(FIXED_NOW.getTime() + minute * 60 * 1000);
      await login(app, 'rolling-lock@example.test', 'WrongPassword1!');
    }

    expect(dependencies.state.users[0]).toMatchObject({
      status: 'ACTIVE',
      failedLoginCount: 4,
      lockedUntil: null,
    });

    now = new Date(FIXED_NOW.getTime() + 17 * 60 * 1000);
    await login(app, 'rolling-lock@example.test', 'WrongPassword1!');

    expect(dependencies.state.users[0]).toMatchObject({
      status: 'LOCKED',
      failedLoginCount: 5,
      lockedUntil: new Date(FIXED_NOW.getTime() + 47 * 60 * 1000),
    });
  });

  test('locked account auto-unlocks after the lock window expires (AF-FE02-003)', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'autounlock@example.test');

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login(app, 'autounlock@example.test', 'WrongPassword1!');
    }
    expect(dependencies.state.users[0].status).toBe('LOCKED');

    // Giả lập cửa sổ khóa do đăng nhập sai đã hết hạn
    dependencies.state.users[0].lockedUntil = new Date(Date.now() - 60 * 1000);

    const response = await login(app, 'autounlock@example.test', 'Password1!');
    expect(response.status).toBe(200);
    expect(dependencies.state.users[0].status).toBe('ACTIVE');
    expect(dependencies.state.users[0].failedLoginCount).toBe(0);
  });

  test('change password rejects reusing the current password (FR-FE02-020)', async () => {
    const { app } = makeTestApp();
    await registerAndVerify(app, 'reuse@example.test');
    const loginResponse = await login(app, 'reuse@example.test');

    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({
        currentPassword: 'Password1!',
        newPassword: 'Password1!',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('PASSWORD_REUSED');
  });

  test('expired verification token is rejected', async () => {
    const { app, dependencies } = makeTestApp();
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'expired-verify@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });
    const verificationOtp = capturedOtp(app);

    dependencies.state.tokens[0].expiresAt = new Date(Date.now() - 60_000);

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verificationOtp });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('EXPIRED_VERIFICATION_TOKEN');
  });

  test('expired reset token is rejected', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'expired-reset@example.test');

    const forgotResponse = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'expired-reset@example.test' });
    const resetOtp = capturedOtp(app);

    dependencies.state.tokens.find((token) => token.tokenType === 'PASSWORD_RESET').expiresAt =
      new Date(Date.now() - 60_000);

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetOtp,
        newPassword: 'ResetPassword1!',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('EXPIRED_RESET_TOKEN');
  });

  test('account setup completion atomically activates, consumes one token, revokes siblings, and audits', async () => {
    const { app, dependencies } = makeTestApp({ clock: () => FIXED_NOW });
    const setup = await createPendingSetupAccount(dependencies);
    dependencies.state.users[0].failedLoginCount = 4;
    dependencies.state.users[0].lockedUntil = new Date('2026-07-15T03:00:00.000Z');
    const siblingToken = generateRandomToken();
    await dependencies.authTokenRepository.createToken({
      userId: setup.user.userId,
      tokenType: 'ACCOUNT_SETUP',
      tokenHash: hashToken(siblingToken),
      expiresAt: new Date(FIXED_NOW.getTime() + 24 * 60 * 60 * 1000),
      createdByIp: null,
    });

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: setup.rawToken,
        newPassword: 'SetupPassword1!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Password reset successful' });
    expect(dependencies.state.users[0]).toMatchObject({
      status: 'ACTIVE',
      emailVerifiedAt: FIXED_NOW,
      failedLoginCount: 0,
      lockedUntil: null,
      updatedAt: FIXED_NOW,
    });
    expect(await bcrypt.compare('SetupPassword1!', dependencies.state.users[0].passwordHash)).toBe(true);
    expect(dependencies.state.tokens[0].usedAt).toEqual(FIXED_NOW);
    expect(dependencies.state.tokens[1].revokedAt).toEqual(FIXED_NOW);
    expect(dependencies.state.auditLogs.at(-1)).toMatchObject({
      userId: setup.user.userId,
      action: 'AUTH_ACCOUNT_SETUP_COMPLETE',
      targetId: setup.user.userId,
    });
    expect(
      JSON.stringify({
        user: dependencies.state.users[0],
        tokens: dependencies.state.tokens,
        audits: dependencies.state.auditLogs,
        response: response.body,
      })
    ).not.toContain(setup.rawToken);

    const loginResponse = await login(app, 'setup@example.test', 'SetupPassword1!');
    expect(loginResponse.status).toBe(200);
  });

  test('rejects expired, used, revoked, active-account, and wrong-purpose setup credentials', async () => {
    const cases = [
      {
        name: 'expired',
        mutate({ dependencies }) {
          dependencies.state.tokens[0].expiresAt = new Date(FIXED_NOW.getTime() - 1);
        },
        code: 'EXPIRED_RESET_TOKEN',
      },
      {
        name: 'used',
        mutate({ dependencies }) {
          dependencies.state.tokens[0].usedAt = FIXED_NOW;
        },
        code: 'INVALID_RESET_TOKEN',
      },
      {
        name: 'revoked',
        mutate({ dependencies }) {
          dependencies.state.tokens[0].revokedAt = FIXED_NOW;
        },
        code: 'INVALID_RESET_TOKEN',
      },
      {
        name: 'active-account',
        mutate({ dependencies }) {
          dependencies.state.users[0].status = 'ACTIVE';
        },
        code: 'INVALID_RESET_TOKEN',
      },
      {
        name: 'wrong-purpose',
        mutate({ dependencies }) {
          dependencies.state.tokens[0].tokenType = 'PASSWORD_RESET';
        },
        code: 'INVALID_RESET_TOKEN',
      },
    ];

    for (const testCase of cases) {
      const { app, dependencies } = makeTestApp({ clock: () => FIXED_NOW });
      const setup = await createPendingSetupAccount(dependencies, {
        email: `${testCase.name}@example.test`,
        username: `${testCase.name}.setup`,
      });
      const originalPasswordHash = dependencies.state.users[0].passwordHash;
      testCase.mutate({ dependencies });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: setup.rawToken, newPassword: 'SetupPassword1!' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe(testCase.code);
      expect(dependencies.state.users[0].status).toBe(
        testCase.name === 'active-account' ? 'ACTIVE' : 'INACTIVE'
      );
      expect(dependencies.state.users[0].passwordHash).toBe(originalPasswordHash);
      expect(
        dependencies.state.auditLogs.filter(
          (entry) => entry.action === 'AUTH_ACCOUNT_SETUP_COMPLETE'
        )
      ).toHaveLength(0);
    }
  });

  test('allows exactly one concurrent setup completion for the same token', async () => {
    const { app, dependencies } = makeTestApp({ clock: () => FIXED_NOW });
    const setup = await createPendingSetupAccount(dependencies, {
      email: 'concurrent-setup@example.test',
      username: 'concurrent.setup',
    });

    const responses = await Promise.all([
      request(app)
        .post('/api/auth/reset-password')
        .send({ token: setup.rawToken, newPassword: 'SetupPassword1!' }),
      request(app)
        .post('/api/auth/reset-password')
        .send({ token: setup.rawToken, newPassword: 'OtherPassword1!' }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);
    expect(dependencies.state.users[0].status).toBe('ACTIVE');
    expect(
      dependencies.state.auditLogs.filter((entry) => entry.action === 'AUTH_ACCOUNT_SETUP_COMPLETE')
    ).toHaveLength(1);
  });

  test('rolls back every setup-completion change when the transaction fails', async () => {
    const { app, dependencies } = makeTestApp({ clock: () => FIXED_NOW });
    const setup = await createPendingSetupAccount(dependencies, {
      email: 'atomic-failure@example.test',
      username: 'atomic.failure',
    });
    const originalPasswordHash = dependencies.state.users[0].passwordHash;
    dependencies.state.accountSetupControl.completionFailureStage = 'audit';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let response;

    try {
      response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: setup.rawToken, newPassword: 'SetupPassword1!' });
    } finally {
      consoleErrorSpy.mockRestore();
    }

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' },
    });
    expect(dependencies.state.users[0]).toMatchObject({
      status: 'INACTIVE',
      passwordHash: originalPasswordHash,
      emailVerifiedAt: null,
    });
    expect(dependencies.state.tokens[0]).toMatchObject({ usedAt: null, revokedAt: null });
    expect(
      dependencies.state.auditLogs.filter((entry) => entry.action === 'AUTH_ACCOUNT_SETUP_COMPLETE')
    ).toHaveLength(0);
  });

  test('password-reset credentials cannot activate an inactive account', async () => {
    const { app, dependencies } = makeTestApp({ clock: () => FIXED_NOW });
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'inactive-reset@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });
    const resetToken = generateRandomToken();
    await dependencies.authTokenRepository.createToken({
      userId: 1,
      tokenType: 'PASSWORD_RESET',
      tokenHash: hashToken(resetToken),
      expiresAt: new Date(FIXED_NOW.getTime() + 15 * 60 * 1000),
      createdByIp: null,
    });
    const originalPasswordHash = dependencies.state.users[0].passwordHash;

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword: 'ResetPassword1!' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_RESET_TOKEN');
    expect(dependencies.state.users[0].status).toBe('INACTIVE');
    expect(dependencies.state.users[0].passwordHash).toBe(originalPasswordHash);
  });

  test('registration rolls back the user when verification-token creation fails', async () => {
    const { app, dependencies } = makeTestApp();
    jest.spyOn(dependencies.authTokenRepository, 'createToken').mockRejectedValueOnce(
      new Error('token insert failed')
    );

    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'atomic-register@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      })
      .expect(500);

    expect(dependencies.state.users).toHaveLength(0);
    expect(dependencies.state.tokens).toHaveLength(0);
  });

  test('login rolls back user state when refresh-session creation fails', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'atomic-login@example.test');
    jest.spyOn(dependencies.authTokenRepository, 'createToken').mockRejectedValueOnce(
      new Error('session insert failed')
    );

    await login(app, 'atomic-login@example.test').then((response) => expect(response.status).toBe(500));

    expect(dependencies.state.users[0]).toMatchObject({
      failedLoginCount: 0,
      lastLoginAt: null,
    });
    expect(dependencies.state.tokens.filter((token) => token.tokenType === 'REFRESH')).toHaveLength(0);
  });

  test('concurrent deactivation cannot accrue a failed login or create a session', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'concurrent-deactivation@example.test');
    const originalRecordFailure = dependencies.userRepository.recordFailedLogin;
    dependencies.userRepository.recordFailedLogin = (...args) => {
      dependencies.state.users[0].status = 'INACTIVE';
      dependencies.state.users[0].deactivatedAt = new Date();
      return originalRecordFailure(...args);
    };

    await login(app, 'concurrent-deactivation@example.test', 'WrongPassword1!').then((response) => {
      expect(response.status).toBe(401);
    });
    expect(dependencies.state.users[0]).toMatchObject({
      status: 'INACTIVE',
      failedLoginCount: 0,
      lockedUntil: null,
    });
    expect(dependencies.state.loginFailureAttempts).toHaveLength(0);

    const originalPrepareLogin = dependencies.userRepository.resetFailedLoginsAndSetLastLogin;
    dependencies.userRepository.resetFailedLoginsAndSetLastLogin = (...args) => {
      dependencies.state.users[0].status = 'INACTIVE';
      dependencies.state.users[0].deactivatedAt = new Date();
      return originalPrepareLogin(...args);
    };
    const successRace = await login(app, 'concurrent-deactivation@example.test');

    expect(successRace.status).toBe(401);
    expect(dependencies.state.tokens.filter((token) => token.tokenType === 'REFRESH')).toHaveLength(0);
  });

  test('stale auto-unlock cannot clear a newer lock', async () => {
    const now = new Date(FIXED_NOW);
    const { app, dependencies } = makeTestApp({ clock: () => now });
    await registerAndVerify(app, 'concurrent-relock@example.test');
    dependencies.state.users[0].status = 'LOCKED';
    dependencies.state.users[0].lockedUntil = new Date(now.getTime() - 1000);
    dependencies.userRepository.unlockExpiredAccount = async () => {
      dependencies.state.users[0].lockedUntil = new Date(now.getTime() + 30 * 60 * 1000);
      return false;
    };

    const response = await login(app, 'concurrent-relock@example.test');

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('ACCOUNT_LOCKED');
    expect(dependencies.state.tokens.filter((token) => token.tokenType === 'REFRESH')).toHaveLength(0);
  });

  test('OTP password change rolls back password and OTP use when required audit fails', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'atomic-change@example.test');
    const loginResponse = await login(app, 'atomic-change@example.test');
    const authorization = `Bearer ${loginResponse.body.accessToken}`;
    const originalPasswordHash = dependencies.state.users[0].passwordHash;

    await request(app)
      .post('/api/auth/change-password/request-otp')
      .set('Authorization', authorization)
      .send({
        currentPassword: 'Password1!',
        newPassword: 'NewPassword1!',
        confirmNewPassword: 'NewPassword1!',
      })
      .expect(200);
    const otp = capturedOtp(app);
    const otpToken = dependencies.state.tokens.at(-1);
    jest.spyOn(dependencies.auditLogRepository, 'create').mockRejectedValueOnce(
      new Error('audit insert failed')
    );

    await request(app)
      .post('/api/auth/change-password/confirm')
      .set('Authorization', authorization)
      .send({ otp, newPassword: 'NewPassword1!' })
      .expect(500);

    expect(dependencies.state.users[0].passwordHash).toBe(originalPasswordHash);
    expect(dependencies.state.tokens.find((token) => token.tokenId === otpToken.tokenId).usedAt).toBeNull();
  });

  test('password reset rolls back password when token invalidation fails', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'atomic-reset@example.test');
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'atomic-reset@example.test' })
      .expect(200);
    const resetOtp = capturedOtp(app);
    const resetToken = dependencies.state.tokens.at(-1);
    const originalPasswordHash = dependencies.state.users[0].passwordHash;
    jest.spyOn(dependencies.authTokenRepository, 'markTokenUsed').mockRejectedValueOnce(
      new Error('token update failed')
    );

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'atomic-reset@example.test',
        otp: resetOtp,
        newPassword: 'ResetPassword1!',
      })
      .expect(500);

    expect(dependencies.state.users[0].passwordHash).toBe(originalPasswordHash);
    expect(dependencies.state.tokens.find((token) => token.tokenId === resetToken.tokenId).usedAt).toBeNull();
  });

  test('malformed access token is rejected on protected route', async () => {
    const { app } = makeTestApp();

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-valid-jwt');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  test('bearer headers with extra segments are rejected before token verification', async () => {
    const { app, dependencies } = makeTestApp();
    const sessionLookup = jest.spyOn(dependencies.authTokenRepository, 'findActiveTokenById');

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid-token trailing-data');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(sessionLookup).not.toHaveBeenCalled();
  });
});
