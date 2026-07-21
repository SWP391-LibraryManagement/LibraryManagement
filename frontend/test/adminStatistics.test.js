import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeAdminUserStatistics } from '../src/utils/adminStatistics.js';

test('normalizes FE12 metrics into admin user cards', () => {
  assert.deepEqual(
    normalizeAdminUserStatistics({
      metrics: {
        usersByStatus: { ACTIVE: 5, INACTIVE: 2 },
        usersByRole: { ADMIN: 1, LIBRARIAN: 2, MEMBER: 4 },
      },
    }),
    {
      total: 7,
      active: 5,
      inactive: 2,
      librarians: 2,
      usersByRole: { ADMIN: 1, LIBRARIAN: 2, MEMBER: 4 },
    },
  );
});

test('keeps compatibility with the legacy totals envelope', () => {
  assert.deepEqual(
    normalizeAdminUserStatistics({
      totals: { users: 9, active: 8, inactive: 1 },
      usersByStatus: { ACTIVE: 8, INACTIVE: 1 },
      usersByRole: { LIBRARIAN: 3 },
    }),
    {
      total: 9,
      active: 8,
      inactive: 1,
      librarians: 3,
      usersByRole: { LIBRARIAN: 3 },
    },
  );
});
