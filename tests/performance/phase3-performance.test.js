const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const {
  percentile,
  createPerformanceResult,
} = require('../../scripts/phase3-performance');

test('percentile returns the nearest-rank sample from sorted timing data', () => {
  assert.equal(percentile([5, 1, 3, 2, 4], 50), 3);
  assert.equal(percentile([5, 1, 3, 2, 4], 95), 5);
});

test('performance result exposes repeatable Phase 3 metrics and limitations', () => {
  const result = createPerformanceResult({
    loginSamples: [120, 140, 160],
    sessionSamples: [8, 9, 12],
    bundle: {
      largestJsAsset: 'index-example.js',
      largestJsBytes: 250000,
      totalJsBytes: 400000,
      jsAssetCount: 4,
    },
  });

  assert.equal(result.sampleCount.login, 3);
  assert.equal(result.sampleCount.sessionValidation, 3);
  assert.equal(result.login.p50Ms, 140);
  assert.equal(result.login.p95Ms, 160);
  assert.equal(result.sessionValidation.p95Ms, 12);
  assert.equal(result.bundleBytes.largest, 250000);
  assert.equal(result.bundleBytes.total, 400000);
  assert.ok(result.limitations.some((item) => /in-memory/i.test(item)));
  assert.ok(result.limitations.some((item) => /SMTP/i.test(item)));
});

test('the E2E server declares its test environment before loading the backend harness', () => {
  const serverSource = readFileSync(
    path.resolve(__dirname, '../e2e/support/systemTestServer.js'),
    'utf8'
  );

  const nodeEnvAssignment = serverSource.indexOf("process.env.NODE_ENV = 'test';");
  const harnessImport = serverSource.indexOf(
    "require('../../../backend/tests/helpers/systemIntegrationHarness')"
  );

  assert.ok(nodeEnvAssignment >= 0);
  assert.ok(nodeEnvAssignment < harnessImport);
  assert.match(serverSource, /process\.env\.BCRYPT_COST = process\.env\.BCRYPT_COST \|\| '4';/);
  assert.doesNotMatch(serverSource, /AUTH_EXPOSE_TEST_TOKENS/);
});
