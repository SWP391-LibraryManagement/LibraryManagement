const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { parseImplementationState, shouldEnforce } = require('./traceability-state');

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

test('FE07, FE08, FE10, and FE12 release headers do not retain stale H3-pending state', () => {
  const taskFiles = [
    'feat-borrowing-management',
    'feat-reservation-management',
    'feat-notification-management',
    'feat-reporting-statistics',
  ];

  for (const featureDirectory of taskFiles) {
    const source = fs.readFileSync(
      path.join(__dirname, '..', '.sdd', 'specs', featureDirectory, 'TASKS.md'),
      'utf8',
    );
    const releaseHeader = source.split(/\r?\n---/)[0];

    assert.match(releaseHeader, /Trạng thái: ĐÃ MERGE VÀO MAIN; CI HẬU MERGE ĐẠT; AZURE STAGING BỊ CHẶN DO AZURE SQL PAUSED\/QUOTA/);
    assert.doesNotMatch(
      releaseHeader,
      /đang chờ H2 mới và H3 lặp lại|H3\/merge|V0\.6\.0 CHƯA KÍCH HOẠT/i,
    );
  }
});
