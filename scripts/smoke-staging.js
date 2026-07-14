const DEFAULT_TIMEOUT_MS = 15000;
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

async function request(fetchImpl, url, options, timeoutMs, attempts, retryDelayMs) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(url, { ...options, signal: controller.signal });
    } catch (error) {
      const transient = error?.name === 'AbortError' || error instanceof TypeError;
      if (!transient || attempt === attempts) throw error;
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

  const allowedResponse = await request(
    fetchImpl,
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
