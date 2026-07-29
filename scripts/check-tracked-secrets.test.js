const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const scannerPath = path.join(__dirname, 'check-tracked-secrets.js');

function runScannerWithFixture(content, filename = 'fixture.txt', { removeWorkingCopy = false } = {}) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lms-secret-scan-'));

  try {
    execFileSync('git', ['init', '--quiet'], { cwd: fixtureRoot });
    fs.writeFileSync(path.join(fixtureRoot, filename), content, 'utf8');
    execFileSync('git', ['add', filename], { cwd: fixtureRoot });

    if (removeWorkingCopy) {
      fs.rmSync(path.join(fixtureRoot, filename));
    }

    return spawnSync(process.execPath, [scannerPath], {
      cwd: fixtureRoot,
      encoding: 'utf8'
    });
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

test('fails on an AWS access key without printing its value', () => {
  const syntheticKey = ['AKIA', 'IOSFODNN7EXAMPLE'].join('');
  const result = runScannerWithFixture(`AWS_ACCESS_KEY_ID=${syntheticKey}`);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /AWS access key/);
  assert.doesNotMatch(result.stderr, new RegExp(syntheticKey));
});

test('fails on a database URL password without printing its value', () => {
  const syntheticPassword = 'phase3-test-password';
  const databaseUrl = [
    'DATABASE_URL=postgresql://library',
    `${syntheticPassword}@localhost/library`,
  ].join(':');
  const result = runScannerWithFixture(
    databaseUrl
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /database URL password/);
  assert.doesNotMatch(result.stderr, new RegExp(syntheticPassword));
});

test('allows a marked synthetic test password', () => {
  const syntheticPassword = ['Phase3', 'test-only'].join('-');
  const markedDatabaseUrl = [
    'DATABASE_URL=postgresql://library',
    `${syntheticPassword}@localhost/library // secret-scan: allow-synthetic`,
  ].join(':');
  const result = runScannerWithFixture(
    markedDatabaseUrl
  );

  assert.equal(result.status, 0);
});

test('allows only the marked synthetic fixture line', () => {
  const syntheticPassword = ['Phase3', 'test-only'].join('-');
  const syntheticKey = ['AKIA', 'IOSFODNN7EXAMPLE'].join('');
  const markedDatabaseUrl = [
    'DATABASE_URL=postgresql://library',
    `${syntheticPassword}@localhost/library // secret-scan: allow-synthetic`,
  ].join(':');
  const result = runScannerWithFixture(
    `${markedDatabaseUrl}\nAWS_ACCESS_KEY_ID=${syntheticKey}`
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /AWS access key/);
  assert.doesNotMatch(result.stderr, /database URL password/);
  assert.doesNotMatch(result.stderr, new RegExp(syntheticKey));
});

test('ignores a tracked file removed from the working tree', () => {
  const result = runScannerWithFixture('temporary source', 'removed-file.js', {
    removeWorkingCopy: true,
  });

  assert.equal(result.status, 0);
});
