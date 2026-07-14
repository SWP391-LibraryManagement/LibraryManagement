import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  getActiveNavigationKey,
  getDashboardAudience,
  getVisibleNavigation,
} from '../src/utils/appNavigation.js';

test('navigation visibility follows stored roles', () => {
  assert.deepEqual(
    getVisibleNavigation(['MEMBER']).map((item) => item.key),
    ['home', 'borrow-request', 'borrowing-history', 'my-reservations'],
  );
  assert.deepEqual(
    getVisibleNavigation(['LIBRARIAN']).map((item) => item.key),
    ['home', 'borrow-requests-admin', 'process-returns', 'reservations-librarian', 'member-details', 'borrowing-report', 'inventory-report', 'user-statistics'],
  );
});

test('active navigation is derived from the current URL', () => {
  assert.equal(getActiveNavigationKey('/home'), 'home');
  assert.equal(getActiveNavigationKey('/borrowing/history'), 'borrowing-history');
  assert.equal(getActiveNavigationKey('/reports/inventory'), 'inventory-report');
  assert.equal(getActiveNavigationKey('/unknown'), null);
});

test('dashboard audience is role aware', () => {
  assert.equal(getDashboardAudience([]), 'guest');
  assert.equal(getDashboardAudience(['MEMBER']), 'member');
  assert.equal(getDashboardAudience(['LIBRARIAN']), 'staff');
  assert.equal(getDashboardAudience(['ADMIN']), 'staff');
});

test('shared header has no decorative global search', async () => {
  const source = await readFile(new URL('../src/component/layout/Header.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /placeholder="Search books, members, loans/);
  assert.doesNotMatch(source, /className="app-search"/);
});
