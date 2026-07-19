process.env.BCRYPT_COST = '4';

const request = require('supertest');
const { createApp } = require('../src/app');

function withProductionHttps(overrides = {}) {
  process.env.NODE_ENV = 'production';
  delete process.env.ENFORCE_HTTPS;
  delete process.env.HTTPS_REDIRECT;
  delete process.env.HTTPS_CANONICAL_HOST;
  delete process.env.TRUST_PROXY;
  Object.assign(process.env, overrides);
}

function restoreEnvironment(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function envSnapshot() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    ENFORCE_HTTPS: process.env.ENFORCE_HTTPS,
    HTTPS_REDIRECT: process.env.HTTPS_REDIRECT,
    HTTPS_CANONICAL_HOST: process.env.HTTPS_CANONICAL_HOST,
    TRUST_PROXY: process.env.TRUST_PROXY,
  };
}

// @spec AC-FE02-024, BR-FE02-017, NFR-FE02-SEC-003
test('deployed plain-HTTP auth requests are rejected before the auth service sees credentials', async () => {
  const snapshot = envSnapshot();
  try {
    withProductionHttps();
    let authCalled = false;
    const app = createApp({
      authService: {
        login: async () => {
          authCalled = true;
          return { ok: true };
        },
      },
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@example.test', password: 'Password1!' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('HTTPS_REQUIRED');
    expect(authCalled).toBe(false);
  } finally {
    restoreEnvironment(snapshot);
  }
});

// @spec AC-FE02-024, BR-FE02-017, NFR-FE02-SEC-003
test('trusted HTTPS termination via X-Forwarded-Proto allows the auth request to continue', async () => {
  const snapshot = envSnapshot();
  try {
    withProductionHttps({ TRUST_PROXY: 'true' });
    let authCalled = false;
    const app = createApp({
      authService: {
        login: async () => {
          authCalled = true;
          return { ok: true };
        },
      },
    });

    const response = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-Proto', 'https')
      .send({ email: 'member@example.test', password: 'Password1!' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(authCalled).toBe(true);
  } finally {
    restoreEnvironment(snapshot);
  }
});

// @spec AC-FE02-024, BR-FE02-017, NFR-FE02-SEC-003
test('deployed HTTP auth requests can use an explicit HTTPS redirect policy', async () => {
  const snapshot = envSnapshot();
  try {
    withProductionHttps({
      HTTPS_REDIRECT: 'true',
      HTTPS_CANONICAL_HOST: 'library.example.test',
    });
    const app = createApp({ authService: { login: async () => ({ ok: true }) } });

    const response = await request(app)
      .post('/api/auth/login')
      .set('Host', 'attacker.example.test')
      .send({ email: 'member@example.test', password: 'Password1!' });

    expect(response.status).toBe(308);
    expect(response.headers.location).toBe('https://library.example.test/api/auth/login');
  } finally {
    restoreEnvironment(snapshot);
  }
});
