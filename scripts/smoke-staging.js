const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_REQUEST_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 5000;
const UNTRUSTED_ORIGIN = 'https://untrusted.example.test';

function normalizeUrl(value, name) {
  if (!value) throw new Error(`${name} is required.`);
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${name} must use HTTP or HTTPS.`);
  }
  return parsed.origin;
}

async function request(fetchImpl, checkName, url, options, timeoutMs, attempts, retryDelayMs) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(url, { ...options, signal: controller.signal });
    } catch (error) {
      const transient = error?.name === 'AbortError' || error instanceof TypeError;
      if (!transient) throw error;
      if (attempt === attempts) {
        const outcome = error?.name === 'AbortError' ? 'timed out' : 'failed';
        throw new Error(
          `${checkName} request ${outcome} after ${attempts} attempts `
          + `(${timeoutMs} ms per attempt): ${new URL(url).pathname}.`,
          { cause: error }
        );
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    } finally {
      clearTimeout(timer);
    }
  }
}

async function runStagingSmoke({
  frontendUrl = process.env.STAGING_FRONTEND_URL,
  apiUrl = process.env.STAGING_API_URL,
  fetchImpl = global.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  requestAttempts = DEFAULT_REQUEST_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
} = {}) {
  const frontend = normalizeUrl(frontendUrl, 'STAGING_FRONTEND_URL');
  const api = normalizeUrl(apiUrl, 'STAGING_API_URL');
  const checks = [];

  const frontendResponse = await request(
    fetchImpl,
    'Frontend',
    `${frontend}/`,
    {},
    timeoutMs,
    requestAttempts,
    retryDelayMs
  );
  const frontendType = String(frontendResponse.headers.get('content-type'));
  if (frontendResponse.status !== 200 || !frontendType.includes('text/html')) {
    throw new Error(`Frontend check failed with HTTP ${frontendResponse.status}.`);
  }
  checks.push('frontend');

  const healthResponse = await request(
    fetchImpl,
    'API health',
    `${api}/health`,
    {},
    timeoutMs,
    requestAttempts,
    retryDelayMs
  );
  const health = await healthResponse.json().catch(() => ({}));
  if (healthResponse.status !== 200 || health.status !== 'ok') {
    throw new Error(`API health check failed with HTTP ${healthResponse.status}.`);
  }
  checks.push('health');

  const readinessResponse = await request(
    fetchImpl,
    'API readiness',
    `${api}/health/ready`,
    {},
    timeoutMs,
    requestAttempts,
    retryDelayMs
  );
  const readiness = await readinessResponse.json().catch(() => ({}));
  if (
    readinessResponse.status !== 200
    || readiness.status !== 'ok'
    || readiness.checks?.catalogMetadata !== 'ok'
  ) {
    throw new Error(
      `API schema readiness check failed with HTTP ${readinessResponse.status}. `
      + 'database/migrations/2026-07-22-library-metadata-compatibility.sql '
      + 'must be applied directly by an authorized database operator through Azure SQL Query Editor '
      + 'or SSMS before running Deploy staging manually.'
    );
  }
  checks.push('schema-readiness');

  const catalogResponse = await request(
    fetchImpl,
    'SQL-backed catalog',
    `${api}/api/books?page=1&limit=1`,
    {},
    timeoutMs,
    requestAttempts,
    retryDelayMs
  );
  const catalog = await catalogResponse.json().catch(() => ({}));
  if (
    catalogResponse.status !== 200 ||
    !Array.isArray(catalog.data) ||
    !catalog.pagination ||
    catalog.pagination.page !== 1
  ) {
    throw new Error(`SQL-backed catalog check failed with HTTP ${catalogResponse.status}.`);
  }
  checks.push('sql-catalog');

  const allowedResponse = await request(
    fetchImpl,
    'Allowed CORS',
    `${api}/health`,
    { headers: { Origin: frontend } },
    timeoutMs,
    requestAttempts,
    retryDelayMs
  );
  if (allowedResponse.headers.get('access-control-allow-origin') !== frontend) {
    throw new Error('Configured staging frontend origin was not allowed by CORS.');
  }
  checks.push('allowed-cors');

  const untrustedResponse = await request(
    fetchImpl,
    'Blocked CORS',
    `${api}/health`,
    { headers: { Origin: UNTRUSTED_ORIGIN } },
    timeoutMs,
    requestAttempts,
    retryDelayMs
  );
  if (untrustedResponse.headers.get('access-control-allow-origin')) {
    throw new Error('API allowed an untrusted origin.');
  }
  checks.push('blocked-cors');

  const protectedResponse = await request(
    fetchImpl,
    'Protected route',
    `${api}/api/auth/me`,
    {},
    timeoutMs,
    requestAttempts,
    retryDelayMs
  );
  if (protectedResponse.status !== 401) {
    throw new Error(`Protected endpoint expected 401 but received ${protectedResponse.status}.`);
  }
  checks.push('protected-route');

  return { status: 'PASS', frontendUrl: frontend, apiUrl: api, checks };
}

if (require.main === module) {
  runStagingSmoke()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(`[staging smoke] ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { runStagingSmoke };
