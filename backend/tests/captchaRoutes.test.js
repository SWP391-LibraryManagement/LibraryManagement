process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'captcha-route-test-secret';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createCaptchaService } = require('../src/services/captchaService');

// @spec FR-FE02-029, FR-FE02-030, AC-FE02-027

function makeAuthService() {
  return {
    register: jest.fn(async () => ({ ok: true })),
    login: jest.fn(async () => ({ ok: true })),
  };
}

test.each([
  ['/api/auth/register', 'register'],
  ['/api/auth/login', 'login'],
])('%s rejects missing CAPTCHA before auth dispatch even in NODE_ENV=test', async (path, method) => {
  const authService = makeAuthService();
  const app = createApp({ authService });
  const response = await request(app).post(path).send({
    email: 'member@example.test',
    password: 'Password1!',
    confirmPassword: 'Password1!',
    fullName: 'Member',
  });

  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('CAPTCHA_INVALID');
  expect(authService[method]).not.toHaveBeenCalled();
});

test('a valid login CAPTCHA dispatches once and replay is rejected', async () => {
  let issued;
  const captchaService = createCaptchaService({
    randomInt: () => 0,
    randomBytes: () => Buffer.alloc(32, 7),
    onChallengeIssued: (value) => { issued = value; },
  });
  const authService = makeAuthService();
  const app = createApp({ authService, captchaService });
  const challenge = await request(app).get('/api/auth/captcha');
  const payload = {
    email: 'member@example.test',
    password: 'Password1!',
    captchaToken: challenge.body.captchaToken,
    captchaAnswer: issued?.answer || 'ABCD',
  };

  const accepted = await request(app).post('/api/auth/login').send(payload);
  const replayed = await request(app).post('/api/auth/login').send(payload);

  expect(accepted.status).toBe(200);
  expect(replayed.status).toBe(400);
  expect(replayed.body.error.code).toBe('CAPTCHA_INVALID');
  expect(authService.login).toHaveBeenCalledTimes(1);
});
