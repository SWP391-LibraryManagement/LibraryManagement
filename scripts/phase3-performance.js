const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const DEFAULT_LOGIN_SAMPLES = 30;
const DEFAULT_SESSION_SAMPLES = 50;

function roundMs(value) {
  return Number(value.toFixed(2));
}

function percentile(samples, percent) {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error('At least one timing sample is required.');
  }
  if (percent <= 0 || percent > 100) {
    throw new Error('Percentile must be greater than 0 and at most 100.');
  }
  const sorted = [...samples].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil((percent / 100) * sorted.length) - 1);
  return roundMs(sorted[index]);
}

function summarizeBundle(distDirectory) {
  const assetsDirectory = path.join(distDirectory, 'assets');
  const jsAssets = readdirSync(assetsDirectory)
    .filter((name) => name.endsWith('.js'))
    .map((name) => ({ name, bytes: statSync(path.join(assetsDirectory, name)).size }))
    .sort((left, right) => right.bytes - left.bytes);

  if (jsAssets.length === 0) {
    throw new Error('No JavaScript assets were found. Build the frontend first.');
  }

  const indexHtml = readFileSync(path.join(distDirectory, 'index.html'), 'utf8');
  const entryMatch = indexHtml.match(/<script[^>]+src="\/assets\/([^"]+\.js)"/i);
  const entryAsset = jsAssets.find((asset) => asset.name === entryMatch?.[1]);

  return {
    entryJsAsset: entryAsset?.name || null,
    entryJsBytes: entryAsset?.bytes || null,
    largestJsAsset: jsAssets[0].name,
    largestJsBytes: jsAssets[0].bytes,
    totalJsBytes: jsAssets.reduce((total, asset) => total + asset.bytes, 0),
    jsAssetCount: jsAssets.length,
  };
}

function createPerformanceResult({ loginSamples, sessionSamples, bundle }) {
  return {
    environment: 'local deterministic in-memory E2E server; Node.js built-in fetch; bcrypt cost 10',
    sampleCount: {
      login: loginSamples.length,
      sessionValidation: sessionSamples.length,
    },
    login: {
      targetP95Ms: 1000,
      p50Ms: percentile(loginSamples, 50),
      p95Ms: percentile(loginSamples, 95),
    },
    sessionValidation: {
      targetP95Ms: 50,
      p50Ms: percentile(sessionSamples, 50),
      p95Ms: percentile(sessionSamples, 95),
    },
    bundleBytes: {
      entry: bundle.entryJsBytes ?? null,
      largest: bundle.largestJsBytes,
      total: bundle.totalJsBytes,
      count: bundle.jsAssetCount,
      entryAsset: bundle.entryJsAsset ?? null,
      largestAsset: bundle.largestJsAsset,
    },
    limitations: [
      'API timings use the deterministic in-memory E2E repositories and exclude Azure SQL and public-network latency.',
      'SMTP/provider latency and real inbox delivery were not measured.',
      'Bundle sizes are raw minified JavaScript bytes from the local Vite production build.',
    ],
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${new URL(url).pathname} returned HTTP ${response.status}.`);
  }
  return response.json();
}

async function waitForServer(healthUrl, child, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Performance server exited with code ${child.exitCode}.`);
    }
    try {
      const response = await fetch(healthUrl);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Performance server did not become healthy within 30 seconds.');
}

async function measure(count, operation) {
  const samples = [];
  for (let index = 0; index < count; index += 1) {
    const started = performance.now();
    await operation();
    samples.push(performance.now() - started);
  }
  return samples;
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);
}

async function runPhase3Performance({
  port = Number(process.env.PHASE3_PERFORMANCE_PORT || 3210),
  loginSampleCount = DEFAULT_LOGIN_SAMPLES,
  sessionSampleCount = DEFAULT_SESSION_SAMPLES,
} = {}) {
  const serverPath = path.resolve(__dirname, '../tests/e2e/support/systemTestServer.js');
  const frontendDist = path.resolve(__dirname, '../frontend/dist');
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, BCRYPT_COST: '10', E2E_BACKEND_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServer(`${origin}/health`, child);

    const runId = randomUUID();
    const memberEmail = `phase3-member-${runId}@example.test`;
    const librarianEmail = `phase3-librarian-${runId}@example.test`;
    const password = `Phase3-${runId}!A1`;

    await fetchJson(`${origin}/__e2e__/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberEmail, librarianEmail, password }),
    });

    const loginOperation = () =>
      fetchJson(`${origin}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail, password }),
      });

    const initialLogin = await loginOperation();
    const sessionOperation = () =>
      fetchJson(`${origin}/api/auth/me`, {
        headers: { Authorization: `Bearer ${initialLogin.accessToken}` },
      });

    await loginOperation();
    await sessionOperation();

    const loginSamples = await measure(loginSampleCount, loginOperation);
    const sessionSamples = await measure(sessionSampleCount, sessionOperation);
    const bundle = summarizeBundle(frontendDist);

    return createPerformanceResult({ loginSamples, sessionSamples, bundle });
  } finally {
    await stopServer(child);
  }
}

if (require.main === module) {
  runPhase3Performance()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(`[phase3 performance] ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  percentile,
  summarizeBundle,
  createPerformanceResult,
  runPhase3Performance,
};
