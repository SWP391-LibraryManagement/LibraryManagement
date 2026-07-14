const http = require('node:http');
const test = require('node:test');
const assert = require('node:assert/strict');

const { runStagingSmoke } = require('../../scripts/smoke-staging');

async function startFixture({ permissiveCors = false, protectedStatus = 401 } = {}) {
  let allowedOrigin = '';
  const server = http.createServer((req, res) => {
    const origin = req.headers.origin;
    const allowOrigin = origin === allowedOrigin ? origin : permissiveCors && origin ? '*' : null;
    if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin);

    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><title>Library</title>');
      return;
    }
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    if (req.url === '/api/auth/me') {
      res.writeHead(protectedStatus, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }));
      return;
    }
    res.writeHead(404).end();
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  allowedOrigin = baseUrl;
  return { baseUrl, close: () => new Promise((resolve) => server.close(resolve)) };
}

test('passes for healthy frontend, API, strict CORS, and protected auth route', async () => {
  const fixture = await startFixture();
  try {
    const result = await runStagingSmoke({
      frontendUrl: fixture.baseUrl,
      apiUrl: fixture.baseUrl,
    });
    assert.equal(result.status, 'PASS');
    assert.equal(result.checks.length, 5);
  } finally {
    await fixture.close();
  }
});

test('fails when the API allows an untrusted origin', async () => {
  const fixture = await startFixture({ permissiveCors: true });
  try {
    await assert.rejects(
      runStagingSmoke({ frontendUrl: fixture.baseUrl, apiUrl: fixture.baseUrl }),
      /untrusted origin/i
    );
  } finally {
    await fixture.close();
  }
});

test('fails when a protected endpoint accepts an anonymous request', async () => {
  const fixture = await startFixture({ protectedStatus: 200 });
  try {
    await assert.rejects(
      runStagingSmoke({ frontendUrl: fixture.baseUrl, apiUrl: fixture.baseUrl }),
      /expected 401/i
    );
  } finally {
    await fixture.close();
  }
});
