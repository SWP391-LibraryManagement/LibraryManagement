process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');

function makeTestApp() {
  const dependencies = makeInMemoryAuthDependencies();
  const authService = createAuthService(dependencies);
  const app = createApp({ authService });

  return { app, dependencies };
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
});
