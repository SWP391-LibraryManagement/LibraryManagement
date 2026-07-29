const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const scannerPath = path.join(__dirname, 'check-tracked-secrets.js');

function runScannerWithFixture(content, filename = 'fixture.txt') {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lms-secret-scan-'));

  try {
    execFileSync('git', ['init', '--quiet'], { cwd: fixtureRoot });
    fs.writeFileSync(path.join(fixtureRoot, filename), content, 'utf8');
    execFileSync('git', ['add', filename], { cwd: fixtureRoot });

    return spawnSync(process.execPath, [scannerPath], {
      cwd: fixtureRoot,
      encoding: 'utf8'
    });
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

test('fails on an AWS access key without printing its value', () => {
  const syntheticKey = 'AKIAIOSFODNN7EXAMPLE';
  const result = runScannerWithFixture(`AWS_ACCESS_KEY_ID=${syntheticKey}`);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /AWS access key/);
  assert.doesNotMatch(result.stderr, new RegExp(syntheticKey));
});

test('fails on a database URL password without printing its value', () => {
  const syntheticPassword = 'phase3-test-password';
  const result = runScannerWithFixture(
    `DATABASE_URL=postgresql://library:${syntheticPassword}@localhost/library`
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /database URL password/);
  assert.doesNotMatch(result.stderr, new RegExp(syntheticPassword));
});

test('allows a marked synthetic test password', () => {
  const result = runScannerWithFixture(
    '// secret-scan: allow-synthetic\nDATABASE_URL=postgresql://library:Phase3-test-only@localhost/library'
  );

  assert.equal(result.status, 0);
});
