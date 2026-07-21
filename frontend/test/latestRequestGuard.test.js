import assert from 'node:assert/strict';
import test from 'node:test';

import { createLatestRequestGuard } from '../src/utils/latestRequestGuard.js';

test('only the newest request token remains current', () => {
  const guard = createLatestRequestGuard();
  const first = guard.begin();
  const second = guard.begin();

  assert.equal(guard.isLatest(first), false);
  assert.equal(guard.isLatest(second), true);
});
