import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  getActiveNavigationKey,
  getDashboardAudience,
  getVisibleNavigation,
} from '../src/utils/appNavigation.js';
import { buildMemberSummary, buildStaffSummary } from '../src/page/dashboard/dashboardViewModel.js';

test('navigation visibility follows stored roles', () => {
  assert.deepEqual(
    getVisibleNavigation(['MEMBER']).map((item) => item.key),
    ['home', 'membership', 'borrow-request', 'borrowing-history', 'my-reservations'],
  );
  assert.deepEqual(
    getVisibleNavigation(['LIBRARIAN']).map((item) => item.key),
    ['home', 'borrow-requests-admin', 'process-returns', 'reservations-librarian', 'member-details', 'inventory-management', 'fine-management', 'borrowing-report', 'inventory-report', 'user-statistics'],
  );
});

test('active navigation is derived from the current URL', () => {
  assert.equal(getActiveNavigationKey('/home'), 'home');
  assert.equal(getActiveNavigationKey('/membership'), 'membership');
  assert.equal(getActiveNavigationKey('/borrowing/history'), 'borrowing-history');
  assert.equal(getActiveNavigationKey('/librarian/inventory'), 'inventory-management');
  assert.equal(getActiveNavigationKey('/librarian/fines'), 'fine-management');
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

test('app layout exposes an accessible mobile navigation drawer', async () => {
  const source = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');
  const header = await readFile(new URL('../src/component/layout/Header.jsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');

  assert.match(source, /useLocation\(\)/);
  assert.match(header, /aria-label="Mở điều hướng"/);
  assert.match(header, /aria-expanded=\{navigationOpen\}/);
  assert.match(source, /className=\{`app-sidebar\$\{navigationOpen \? ' app-sidebar-open' : ''\}`\}/);
  assert.match(source, /className="app-sidebar-backdrop"/);
  assert.match(styles, /@media \(max-width: 860px\)[\s\S]*\.app-sidebar-open/);
});

test('app layout composes the shared profile header', async () => {
  const source = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');
  assert.match(source, /import Header from '.\/Header';/);
  assert.match(source, /<Header/);
  assert.doesNotMatch(source, /<div className="app-avatar">N<\/div>/);
});

test('shared profile menu remains compatible with the header contract', async () => {
  const source = await readFile(new URL('../src/component/layout/UserMenuPopup.jsx', import.meta.url), 'utf8');
  assert.match(source, /export default function UserMenuPopup/);
  assert.match(source, /onAccountInfo/);
  assert.match(source, /onLogout/);
  assert.doesNotMatch(source, /function BookCopies/);
});

test('member dashboard summarizes personal activity', () => {
  assert.deepEqual(
    buildMemberSummary(
      { borrowRequests: [{ status: 'APPROVED' }, { status: 'COMPLETED' }] },
      { reservations: [{ status: 'WAITING' }, { status: 'CANCELLED' }] },
    ),
    { activeBorrows: 1, completedBorrows: 1, activeReservations: 1 },
  );
});

test('staff dashboard summarizes operational queues', () => {
  assert.deepEqual(
    buildStaffSummary(
      { borrowRequests: [{ status: 'PENDING' }, { status: 'APPROVED' }] },
      { reservations: [{ status: 'WAITING' }, { status: 'READY' }] },
    ),
    { pendingBorrowRequests: 1, waitingReservations: 1, readyReservations: 1 },
  );
});

test('home route delegates authenticated users to the role-aware wrapper', async () => {
  const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const routeSource = await readFile(new URL('../src/page/dashboard/HomeRoutePage.jsx', import.meta.url), 'utf8');

  assert.match(appSource, /import HomeRoutePage from '.\/page\/dashboard\/HomeRoutePage';/);
  assert.match(appSource, /<Route path="\/home" element=\{<HomeRoutePage \/>\}/);
  assert.match(routeSource, /hasStoredAuth/);
  assert.match(routeSource, /getDashboardAudience/);
});
