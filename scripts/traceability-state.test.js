const test = require('node:test');
const assert = require('node:assert/strict');

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
