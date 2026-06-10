process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { hashToken, generateRandomToken } = require('../src/utils/tokenUtils');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');

function makeTestApp() {
  const dependencies = makeInMemoryAuthDependencies();
  const authService = createAuthService(dependencies);
  const app = createApp({ authService });

  return { app, dependencies };
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

  const verifyResponse = await request(app)
    .post('/api/auth/verify-email')
    .send({ token: registerResponse.body.debugVerificationToken });

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
    expect(registerResponse.body.debugVerificationToken).toEqual(expect.any(String));
    expect(dependencies.state.users[0].status).toBe('INACTIVE');

    const verifyResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: registerResponse.body.debugVerificationToken });

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

    await request(app)
      .post('/api/auth/verify-email')
      .send({ token: registerResponse.body.debugVerificationToken });

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

    const resendResponse = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'resend@example.test' });

    expect(resendResponse.status).toBe(200);
    expect(resendResponse.body).toMatchObject({
      message: 'Verification email sent',
      debugVerificationToken: expect.any(String),
    });
    expect(dependencies.state.tokens[0].revokedAt).toEqual(expect.any(Date));

    const oldTokenResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: registerResponse.body.debugVerificationToken });

    expect(oldTokenResponse.status).toBe(400);

    const newTokenResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: resendResponse.body.debugVerificationToken });

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
    });

    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
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
    expect(forgotResponse.body).toMatchObject({
      message: 'Password reset email sent',
      debugResetToken: expect.any(String),
    });
    expect(dependencies.state.notifications.at(-1).templateCode).toBe('PASSWORD_RESET');

    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: forgotResponse.body.debugResetToken,
        newPassword: 'ResetPassword1!',
      });

    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body.message).toBe('Password reset successful');

    const reusedTokenResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: forgotResponse.body.debugResetToken,
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
    const { app } = makeTestApp();
    await registerAndVerify(app, 'locked@example.test');

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login(app, 'locked@example.test', 'WrongPassword1!');
    }

    const lockedResponse = await login(app, 'locked@example.test', 'Password1!');
    expect(lockedResponse.status).toBe(429);
    expect(lockedResponse.body.error.code).toBe('ACCOUNT_LOCKED');
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

    dependencies.state.tokens[0].expiresAt = new Date(Date.now() - 60_000);

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: registerResponse.body.debugVerificationToken });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('EXPIRED_VERIFICATION_TOKEN');
  });

  test('expired reset token is rejected', async () => {
    const { app, dependencies } = makeTestApp();
    await registerAndVerify(app, 'expired-reset@example.test');

    const forgotResponse = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'expired-reset@example.test' });

    dependencies.state.tokens.find((token) => token.tokenType === 'PASSWORD_RESET').expiresAt =
      new Date(Date.now() - 60_000);

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: forgotResponse.body.debugResetToken,
        newPassword: 'ResetPassword1!',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('EXPIRED_RESET_TOKEN');
  });

  test('account setup token activates inactive account when password is set', async () => {
    const { app, dependencies } = makeTestApp();
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'setup@example.test',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });
    const setupToken = generateRandomToken();

    await dependencies.authTokenRepository.createToken({
      userId: 1,
      tokenType: 'ACCOUNT_SETUP',
      tokenHash: hashToken(setupToken),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdByIp: null,
    });

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: setupToken,
        newPassword: 'SetupPassword1!',
      });

    expect(response.status).toBe(200);
    expect(dependencies.state.users[0].status).toBe('ACTIVE');

    const loginResponse = await login(app, 'setup@example.test', 'SetupPassword1!');
    expect(loginResponse.status).toBe(200);
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
