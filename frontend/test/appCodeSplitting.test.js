import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

const lazyPages = [
  ['LoginPage', './page/LoginPage'],
  ['RegisterPage', './page/RegisterPage'],
  ['ForgotPasswordPage', './page/ForgotPasswordPage'],
  ['HomeRoutePage', './page/dashboard/HomeRoutePage'],
  ['UserManagement', './page/UserManagement'],
  ['FineManagement', './page/FineManagement'],
  ['UserProfilePage', './page/UserProfilePage'],
  ['InventoryPage', './page/InventoryPage'],
  ['BookManagementPage', './page/BookManagementPage'],
  ['MembershipPage', './page/MembershipPage'],
  ['HomePage', './page/HomePage'],
  ['ForbiddenPage', './page/error/ForbiddenPage'],
  ['BorrowRequestPage', './page/borrowing/BorrowRequestPage'],
  ['BorrowingHistoryPage', './page/borrowing/BorrowingHistoryPage'],
  ['BorrowRequestsAdminPage', './page/borrowing/BorrowRequestsAdminPage'],
  ['ProcessReturnsPage', './page/borrowing/ProcessReturnsPage'],
  ['MemberBorrowingDetailsPage', './page/borrowing/MemberBorrowingDetailsPage'],
  ['MyReservationsPage', './page/reservation/MyReservationsPage'],
  ['ReservationsLibrarianPage', './page/reservation/ReservationsLibrarianPage'],
  ['BorrowingReportPage', './page/report/BorrowingReportPage'],
  ['InventoryReportPage', './page/report/InventoryReportPage'],
  ['UserStatisticsPage', './page/report/UserStatisticsPage'],
];

test('top-level pages are lazy-loaded without moving route guards', () => {
  assert.match(appSource, /import \{ lazy, Suspense \} from 'react';/);
  assert.match(appSource, /import BorrowingRouteGuard from '.\/component\/borrowing\/BorrowingRouteGuard';/);
  assert.match(appSource, /import ReportRouteGuard from '.\/component\/report\/ReportRouteGuard';/);

  for (const [component, modulePath] of lazyPages) {
    const escapedPath = modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(
      appSource,
      new RegExp(`const ${component} = lazy\\(\\(\\) => import\\('${escapedPath}'\\)\\);`),
      `${component} must preserve its module boundary through React.lazy`
    );
  }
});

test('route loading fallback is accessible and wraps the route table', () => {
  assert.match(appSource, /function RouteLoadingFallback\(\)/);
  assert.match(appSource, /role="status"/);
  assert.match(appSource, /aria-live="polite"/);
  assert.match(appSource, /<Suspense fallback=\{<RouteLoadingFallback \/>\}>[\s\S]*<Routes>/);
});
