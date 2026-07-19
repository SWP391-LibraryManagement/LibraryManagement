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
    ['library-home', 'home', 'membership', 'borrow-request', 'borrowing-history', 'my-reservations'],
  );
  assert.deepEqual(
    getVisibleNavigation(['LIBRARIAN']).map((item) => item.key),
    ['library-home', 'home', 'borrow-requests-admin', 'process-returns', 'reservations-librarian', 'member-details', 'membership-review', 'book-management', 'inventory-management', 'fine-management', 'borrowing-report', 'inventory-report', 'user-statistics'],
  );
});

test('active navigation is derived from the current URL', () => {
  assert.equal(getActiveNavigationKey('/homepage'), 'library-home');
  assert.equal(getActiveNavigationKey('/home'), 'home');
  assert.equal(getActiveNavigationKey('/membership'), 'membership');
  assert.equal(getActiveNavigationKey('/borrowing/history'), 'borrowing-history');
  assert.equal(getActiveNavigationKey('/librarian/inventory'), 'inventory-management');
  assert.equal(getActiveNavigationKey('/librarian/books'), 'book-management');
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
  assert.match(source, /showMemberActions && <MenuItem/);
  assert.doesNotMatch(source, /function BookCopies/);
});

test('authenticated sidebar renders Home above the role dashboard overview', async () => {
  const source = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');

  const homePosition = source.indexOf("onClick={() => navigateFromShell('/homepage')}");
  const overviewPosition = source.indexOf("onClick={() => navigateFromShell('/home')}", homePosition);
  assert.ok(homePosition >= 0);
  assert.ok(overviewPosition > homePosition);
  assert.match(source, /showLibraryHome &&/);
});

test('account menus hide member-only actions from admin and librarian roles', async () => {
  const header = await readFile(new URL('../src/component/layout/Header.jsx', import.meta.url), 'utf8');
  const homepage = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');

  assert.match(header, /storedRoles\.includes\('MEMBER'\)/);
  assert.match(header, /\['ADMIN', 'LIBRARIAN'\]\.includes\(role\)/);
  assert.match(homepage, /showMemberAccountActions = roleLabel === 'Thành viên'/);
  assert.match(homepage, /\.\.\.\(showMemberAccountActions \? \[/);
});

test('admin account menus expose a route back to the admin console', async () => {
  const popup = await readFile(new URL('../src/component/layout/UserMenuPopup.jsx', import.meta.url), 'utf8');
  const header = await readFile(new URL('../src/component/layout/Header.jsx', import.meta.url), 'utf8');
  const homepage = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');

  assert.match(popup, /\{onAdminConsole && <MenuItem/);
  assert.match(popup, /Trang quản trị/);
  assert.match(header, /storedRoles\.includes\('ADMIN'\) \? \(\) => navigate\('\/admin\/users'\)/);
  assert.match(homepage, /showAdminConsoleAction = roleLabel === 'Quản trị viên'/);
  assert.match(homepage, /label: 'Trang quản trị', action: \(\) => navigate\('\/admin\/users'\)/);
});

test('librarian account menus expose a route back to the librarian workspace', async () => {
  const popup = await readFile(new URL('../src/component/layout/UserMenuPopup.jsx', import.meta.url), 'utf8');
  const header = await readFile(new URL('../src/component/layout/Header.jsx', import.meta.url), 'utf8');
  const homepage = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');

  assert.match(popup, /\{onLibrarianConsole && <MenuItem/);
  assert.match(popup, /Khu vực thủ thư/);
  assert.match(header, /storedRoles\.includes\('LIBRARIAN'\).*navigate\('\/home'\)/);
  assert.match(homepage, /showLibrarianConsoleAction = roleLabel === 'Thủ thư'/);
  assert.match(homepage, /label: 'Khu vực thủ thư', action: \(\) => navigate\('\/home'\)/);
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

test('personal profile keeps the account header without rendering the operational sidebar', async () => {
  const profilePage = await readFile(new URL('../src/page/UserProfilePage.jsx', import.meta.url), 'utf8');

  assert.match(profilePage, /import Header from "\.\.\/component\/layout\/Header";/);
  assert.match(profilePage, /<Header \/>/);
  assert.doesNotMatch(profilePage, /AppLayout/);
});

test('profile logout clears the canonical stored user and uses readable Vietnamese copy', async () => {
  const source = await readFile(new URL('../src/component/userProfile/ProfileActions.jsx', import.meta.url), 'utf8');

  assert.match(source, /Xác nhận đăng xuất/);
  assert.match(source, /removeItem\("authUser"\)/);
  assert.doesNotMatch(source, /removeItem\("user"\)/);
});

test('public homepage preserves authenticated profile identity in its header', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');

  assert.match(source, /import \{ fetchHeaderProfile \} from '\.\.\/api\/profileApi';/);
  assert.match(source, /headerProfile\?\.fullName \|\| authUser\?\.email/);
  assert.match(source, /headerProfile\?\.avatarUrl/);
  assert.match(source, /\{displayName\}/);
  assert.match(source, /\{roleLabel\}/);
});

test('homepage membership promotion is visible only to signed-out guests', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');

  assert.match(source, /\{!isLoggedIn && <section id="section-cta"/);
  assert.match(source, /!isLoggedIn \|\| item\.id !== 'section-cta'/);
});

test('admin console keeps its sections while using the warm librarian visual system', async () => {
  const source = await readFile(new URL('../src/page/UserManagement.jsx', import.meta.url), 'utf8');

  for (const label of [
    'Trang chủ',
    'Tổng quan',
    'Thư viện',
    'Quản lý mượn trả',
    'Quản lý yêu cầu',
    'Phân quyền',
    'Quản lý người dùng',
    'Nhật ký hoạt động',
  ]) {
    assert.match(source, new RegExp(`label: '${label}'`));
  }

  assert.doesNotMatch(source, /\{ id: 'membership'[^\n]+label: 'Quản lý hội viên'/);

  assert.match(source, /--um-accent: #a87532/);
  assert.match(source, /--um-canvas: #faf6ef/);
  assert.match(source, /\.um-sidebar \{[\s\S]*background: var\(--um-surface\)/);
  assert.match(source, /loadDashboard\(\{ announce: true \}\)/);
  assert.match(source, /dashboard: dashboardLoading/);
  assert.match(source, /library: libraryLoading/);
  assert.match(source, /circulation: borrowingsLoading/);
  assert.match(source, /activeSectionLoading \? 'Đang tải\.\.\.' : 'Làm mới'/);
  assert.match(source, /setDashboardUpdatedAt\(new Date\(\)\)/);
  assert.doesNotMatch(source, /setDashboardData\(demoDashboard\)/);
  assert.doesNotMatch(source, /demoLibraryRows|demoBookMetadata|demoBorrowings|demoRequests/);
  assert.doesNotMatch(source, /setBorrowingModal|createBorrowing|updateBorrowing/);
  assert.match(source, /setActiveSection\('requests'\)/);
  assert.doesNotMatch(source, />Kiểm tra yêu cầu<|>Kiểm tra hội viên</);
  assert.match(source, /<td><strong>\{row\.memberName\}<\/strong><\/td>/);
  assert.doesNotMatch(source, /<span>\{row\.email\}<\/span>/);
  assert.match(source, /borrowingApi\.returnDetail\(borrowingAction\.id, \{ condition: returnCondition \}\)/);
  assert.match(source, /borrowingApi\.renewDetail\(row\.id\)/);
  assert.match(source, /row\.status === 'REQUESTED'/);
  assert.match(source, /\['BORROWED', 'OVERDUE'\]\.includes\(row\.status\)/);
  assert.match(source, /\['RETURNED', 'DAMAGED', 'LOST'\]\.includes\(row\.status\)/);
  assert.match(source, /borrowingApi\.approve\(viewRequest\.requestId\)/);
  assert.match(source, /borrowingApi\.reject\(viewRequest\.requestId, reason\)/);
  assert.doesNotMatch(source, /adminApi\.updateRequestStatus/);
  assert.match(source, /<td><strong>\{row\.bookTitles\?\.join\('\s*\|\s*'\) \|\| '-'\}<\/strong><\/td>/);
  assert.match(source, /row\.member\?\.fullName \|\| row\.member\?\.email \|\| '-'/);
  assert.match(source, /row\.categories\?\.join\('\s*\|\s*'\) \|\| '-'/);
  assert.doesNotMatch(source, /row\.itemCount \|\| 0/);
  assert.match(source, /requests: requestsLoading/);
  assert.match(source, /row\.status === 'PENDING'/);
  assert.match(source, /\['APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED'\]\.includes\(row\.status\)/);
  assert.match(source, /await loadRequests\(\)/);
  assert.match(source, /setViewRequest\(await adminApi\.requestDetail\(viewRequest\.requestId\)\)/);
  assert.doesNotMatch(source, /navigate\('\/librarian\/(borrow-requests|returns|members)'\)/);
  assert.match(source, /className="um-line-chart"/);
  assert.match(source, /<path d=\{path\}/);
  assert.doesNotMatch(source, /className="um-bar-chart"/);
  assert.match(source, /loadLibrary\(libraryResource, \{ announce: true \}\)/);
  assert.doesNotMatch(source, /Vô hiệu hóa sách/);
  assert.doesNotMatch(source, /adminApi\.(createBook|updateBook|deactivateBook)/);
  assert.match(source, /adminApi\.deactivateResource\(libraryResource, row\.id\)/);
  assert.match(source, /onClick=\{\(\) => deactivateMetadata\(row\)\}/);
  assert.doesNotMatch(source, /deleteLibraryItem/);
  assert.match(source, /new Blob\(\['\\uFEFF', csv\]/);
  assert.match(source, /<td>\{formatDate\(row\.createdAt\)\}<\/td>/);
  assert.doesNotMatch(source, /row\.createdAt \|\| 'Không lưu trong DB'/);
});

test('home route shows the homepage for admins and role dashboards for other authenticated users', async () => {
  const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const routeSource = await readFile(new URL('../src/page/dashboard/HomeRoutePage.jsx', import.meta.url), 'utf8');

  assert.match(appSource, /import HomeRoutePage from '.\/page\/dashboard\/HomeRoutePage';/);
  assert.match(appSource, /<Route path="\/home" element=\{<HomeRoutePage \/>\}/);
  assert.match(routeSource, /hasStoredAuth/);
  assert.match(routeSource, /getDashboardAudience/);
  assert.match(routeSource, /roles\.includes\('ADMIN'\)/);
  assert.match(routeSource, /return <HomePage \/>/);
});
