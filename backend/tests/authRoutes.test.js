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

function makeTestApp({ clock, dependencyOptions } = {}) {
  const dependencies = makeInMemoryAuthDependencies(dependencyOptions);
  const authService = createAuthService({ ...dependencies, clock });
  const app = createApp({ authService });
  app.locals.authTestDependencies = dependencies;

  return { app, dependencies };
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
        templateData: { otp: '123456', expiresInMinutes: 1440 },
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
        templateData: { otp: '234567', expiresInMinutes: 1440 },
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

  test('inactive account login is rejected', async () => {
    const { app } = makeTestApp();

    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'inactive@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });

    const response = await login(app, 'inactive@example.test');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  test('locked account is rejected after too many failed attempts', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'locked@example.test');

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login(app, 'locked@example.test', 'WrongPassword1!');
    }

    expect(dependencies.state.users[0].status).toBe('LOCKED');

    const lockedResponse = await login(app, 'locked@example.test', 'Password1!');
    expect(lockedResponse.status).toBe(429);
    expect(lockedResponse.body.error.code).toBe('ACCOUNT_LOCKED');
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

  test('malformed access token is rejected on protected route', async () => {
    const { app } = makeTestApp();

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-valid-jwt');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });
});
