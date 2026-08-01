const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  parseImplementationState,
  requiredCoverage,
  shouldEnforce,
} = require('./traceability-state');

const ROOT = path.join(__dirname, '..');
const TARGET_FEATURE_DIRECTORIES = [
  'feat-borrowing-management',
  'feat-reservation-management',
  'feat-notification-management',
  'feat-reporting-statistics',
];

function walkSourceFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(entryPath, files);
    } else if (/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

function collectProductionRequirementTags() {
  const tags = new Set();
  for (const sourceDirectory of ['backend/src', 'frontend/src']) {
    for (const file of walkSourceFiles(path.join(ROOT, sourceDirectory))) {
      for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        if (!line.includes('@spec')) continue;
        for (const match of line.matchAll(/\bFR-FE\d{2}-\d{3}\b/g)) {
          tags.add(match[0]);
        }
      }
    }
  }
  return tags;
}

test('parses each supported implementation state', () => {
  assert.deepEqual(parseImplementationState('Implementation State: NOT_STARTED\n'), {
    state: 'NOT_STARTED',
    source: 'Implementation State',
  });
  assert.equal(parseImplementationState('Implementation State: PARTIAL\n').state, 'PARTIAL');
  assert.equal(parseImplementationState('Implementation State: COMPLETE\n').state, 'COMPLETE');
  assert.equal(parseImplementationState('Implementation State: DEFERRED\n').state, 'DEFERRED');
});

test('enforces only active implementation states', () => {
  assert.equal(shouldEnforce('NOT_STARTED'), false);
  assert.equal(shouldEnforce('PARTIAL'), true);
  assert.equal(shouldEnforce('COMPLETE'), true);
  assert.equal(shouldEnforce('DEFERRED'), false);
});

test('requires full traceability for COMPLETE features while preserving the PARTIAL floor', () => {
  assert.equal(requiredCoverage('COMPLETE', 70), 100);
  assert.equal(requiredCoverage('PARTIAL', 70), 70);
  assert.equal(requiredCoverage('NOT_STARTED', 70), null);
  assert.equal(requiredCoverage('DEFERRED', 70), null);
});

test('rejects missing or invalid implementation metadata', () => {
  assert.throws(
    () => parseImplementationState('# Status: APPROVED\n'),
    /Implementation State/,
  );
  assert.throws(
    () => parseImplementationState('Implementation State: MAYBE\n'),
    /NOT_STARTED.*PARTIAL.*COMPLETE.*DEFERRED/,
  );
});

test('FE07, FE08, FE10, and FE12 have complete production-source FR traceability', () => {
  const productionTags = collectProductionRequirementTags();

  for (const featureDirectory of TARGET_FEATURE_DIRECTORIES) {
    const spec = fs.readFileSync(
      path.join(ROOT, '.sdd', 'specs', featureDirectory, 'SPEC.md'),
      'utf8',
    );
    const declaredRequirements = [...new Set(spec.match(/\bFR-FE\d{2}-\d{3}\b/g) || [])];
    const missing = declaredRequirements.filter((requirementId) => !productionTags.has(requirementId));

    assert.deepEqual(missing, [], `${featureDirectory} missing production tags`);
  }
});

test('FE07, FE08, FE10, and FE12 release headers preserve the deployed exact-head boundary', () => {
  const featureDirectories = [
    'feat-borrowing-management',
    'feat-reservation-management',
    'feat-notification-management',
    'feat-reporting-statistics',
  ];
  const releaseFiles = ['CONTEXT.md', 'SPEC.md', 'PLAN.md', 'TASKS.md', 'TEST_PLAN.md'];

  for (const featureDirectory of featureDirectories) {
    for (const releaseFile of releaseFiles) {
      const source = fs.readFileSync(
        path.join(__dirname, '..', '.sdd', 'specs', featureDirectory, releaseFile),
        'utf8',
      );
      const releaseHeader = source.split(/\r?\n---/)[0];

      assert.match(
        releaseHeader,
        /Trạng thái: COMPLETE; PR #89 ĐÃ MERGE; CI VÀ AZURE DEPLOY EXACT-HEAD ĐẠT/,
      );
      assert.doesNotMatch(
        releaseHeader,
        /CLOSEOUT CANDIDATE CHƯA DEPLOY|AZURE STAGING BỊ CHẶN DO AZURE SQL PAUSED\/QUOTA/,
      );
    }

    const taskSource = fs.readFileSync(
      path.join(__dirname, '..', '.sdd', 'specs', featureDirectory, 'TASKS.md'),
      'utf8',
    );
    const taskHeader = taskSource.split(/\r?\n---/)[0];

    assert.equal(parseImplementationState(taskHeader).state, 'COMPLETE');
    assert.match(taskHeader, /PR #89\s+thành `main@39092fb`/);
    assert.match(taskHeader, /CI `30675444178` và\s+Azure staging\s+`30675744992`/);
    assert.doesNotMatch(taskHeader, /đang chờ H2 mới và H3 lặp lại|V0\.6\.0 CHƯA KÍCH HOẠT/i);
  }
});
