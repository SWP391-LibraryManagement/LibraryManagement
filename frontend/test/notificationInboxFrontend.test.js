import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function loadNotificationInboxViewModel() {
  try {
    return await import('../src/utils/notificationInboxViewModel.js');
  } catch {
    return {};
  }
}

test('notification badge is hidden at zero and capped at 99+', async () => {
  const { formatUnreadBadge } = await loadNotificationInboxViewModel();

  assert.equal(typeof formatUnreadBadge, 'function');
  assert.equal(formatUnreadBadge(0), null);
  assert.equal(formatUnreadBadge(1), '1');
  assert.equal(formatUnreadBadge(99), '99');
  assert.equal(formatUnreadBadge(100), '99+');
});

test('notification actions use an exact internal-route allowlist', async () => {
  const {
    ALLOWED_NOTIFICATION_ACTION_PATHS,
    NOTIFICATION_READ_STATES,
    isAllowedNotificationActionPath,
  } = await loadNotificationInboxViewModel();

  assert.deepEqual(ALLOWED_NOTIFICATION_ACTION_PATHS, [
    '/membership',
    '/reservations/mine',
    '/borrowing/history',
    '/fines/mine',
  ]);
  assert.deepEqual(NOTIFICATION_READ_STATES, {
    ALL: 'all',
    UNREAD: 'unread',
    READ: 'read',
  });
  for (const path of ALLOWED_NOTIFICATION_ACTION_PATHS) {
    assert.equal(isAllowedNotificationActionPath(path), true, path);
  }
  for (const path of [
    'https://evil.test',
    '//evil.test',
    '/login',
    '/membership?redirect=https://evil.test',
    '',
    null,
  ]) {
    assert.equal(isAllowedNotificationActionPath(path), false, String(path));
  }
});

test('opening an inbox item refreshes count after a successful read', async () => {
  const { openNotificationInboxItem } = await loadNotificationInboxViewModel();
  const calls = [];

  const result = await openNotificationInboxItem({
    notification: { notificationId: 41, actionPath: '/borrowing/history' },
    markRead: async (notificationId) => calls.push(['read', notificationId]),
    refreshUnreadCount: async () => calls.push('refresh'),
    navigate: (path) => calls.push(['navigate', path]),
    onWarning: (message) => calls.push(['warning', message]),
  });

  assert.deepEqual(calls, [
    ['read', 41],
    'refresh',
    ['navigate', '/borrowing/history'],
  ]);
  assert.deepEqual(result, { readSucceeded: true, navigated: true });
});

test('a failed read emits a safe warning but still opens an allowlisted action', async () => {
  const { openNotificationInboxItem } = await loadNotificationInboxViewModel();
  const calls = [];

  const result = await openNotificationInboxItem({
    notification: { notificationId: 42, actionPath: '/fines/mine' },
    markRead: async () => {
      calls.push('read');
      throw new Error('provider stack and credential details');
    },
    refreshUnreadCount: async () => calls.push('refresh'),
    navigate: (path) => calls.push(['navigate', path]),
    onWarning: (message) => calls.push(['warning', message]),
  });

  assert.equal(calls[0], 'read');
  assert.equal(calls[1][0], 'warning');
  assert.doesNotMatch(calls[1][1], /provider|stack|credential/i);
  assert.deepEqual(calls[2], ['navigate', '/fines/mine']);
  assert.equal(calls.includes('refresh'), false);
  assert.deepEqual(result, { readSucceeded: false, navigated: true });
});

test('an unsafe action is never navigated even when marking it read succeeds', async () => {
  const { openNotificationInboxItem } = await loadNotificationInboxViewModel();
  const calls = [];

  const result = await openNotificationInboxItem({
    notification: { notificationId: 43, actionPath: 'https://evil.test' },
    markRead: async () => calls.push('read'),
    refreshUnreadCount: async () => calls.push('refresh'),
    navigate: (path) => calls.push(['navigate', path]),
    onWarning: (message) => calls.push(['warning', message]),
  });

  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === 'navigate'), false);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === 'warning'), true);
  assert.deepEqual(result, { readSucceeded: true, navigated: false });
});

test('notification client declares the four exact authorized endpoints', async () => {
  const source = await readFile(new URL('../src/api/libraryFeatureApi.js', import.meta.url), 'utf8');

  assert.match(source, /export const notificationInboxApi = \{/);
  assert.match(source, /listMine\(params = \{\}\)[\s\S]*?method: 'get', url: '\/notifications\/mine', params/);
  assert.match(source, /unreadCount\(\)[\s\S]*?method: 'get', url: '\/notifications\/mine\/unread-count'/);
  assert.match(source, /markRead\(notificationId\)[\s\S]*?method: 'patch', url: `\/notifications\/\$\{notificationId\}\/read`/);
  assert.match(source, /markAllRead\(\)[\s\S]*?method: 'patch', url: '\/notifications\/mine\/read-all'/);
  assert.match(source, /getNotificationInboxErrorMessage/);
});

test('notification errors have safe Vietnamese mappings', async () => {
  const source = await readFile(new URL('../src/api/apiErrorMessages.js', import.meta.url), 'utf8');

  for (const code of ['VALIDATION_ERROR', 'ROLE_REQUIRED', 'NOTIFICATION_NOT_FOUND']) {
    assert.match(source, new RegExp(`${code}:\\s*'[^']+'`));
  }
  assert.match(source, /export function getNotificationInboxErrorMessage/);
  assert.doesNotMatch(source, /NOTIFICATION_INBOX_ERROR_MESSAGES[\s\S]*?(?:stack trace|provider credential)/i);
});

test('shared inbox provider owns guarded non-overlapping refresh and polling lifecycle', async () => {
  const [contextSource, appSource] = await Promise.all([
    readFile(new URL('../src/context/NotificationInboxContext.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
  ]);

  assert.match(contextSource, /const INBOX_POLL_INTERVAL_MS = 60000/);
  assert.match(contextSource, /countRequestRef\.current/);
  assert.match(contextSource, /if \(countRequestRef\.current\) return countRequestRef\.current/);
  assert.match(contextSource, /const refreshSafely = \(\) => refreshUnreadCount\(\)\.catch\(\(\) => \{\}\)/);
  assert.match(contextSource, /window\.addEventListener\('focus', refreshSafely\)/);
  assert.match(contextSource, /window\.setInterval\(refreshSafely, INBOX_POLL_INTERVAL_MS\)/);
  assert.match(contextSource, /\['MEMBER', 'LIBRARIAN', 'ADMIN'\]/);
  assert.match(contextSource, /hasStoredAuth\(\)/);
  assert.match(contextSource, /setUnreadCount\(0\)/);
  assert.match(contextSource, /openNotificationInboxItem/);
  assert.match(contextSource, /<Toast toast=\{warningToast\}/);

  const providerStart = appSource.indexOf('<NotificationInboxProvider>');
  const routesStart = appSource.indexOf('<Routes>');
  const routesEnd = appSource.indexOf('</Routes>');
  const providerEnd = appSource.indexOf('</NotificationInboxProvider>');
  assert.ok(providerStart >= 0);
  assert.ok(providerStart < routesStart);
  assert.ok(routesEnd < providerEnd);
});

test('authenticated header renders the notification bell before the account trigger', async () => {
  const source = await readFile(new URL('../src/component/layout/Header.jsx', import.meta.url), 'utf8');
  const bellPosition = source.indexOf('<NotificationBell />');
  const accountPosition = source.indexOf('className="app-user-trigger"');

  assert.match(source, /import NotificationBell from '..\/notification\/NotificationBell';/);
  assert.ok(bellPosition >= 0);
  assert.ok(accountPosition > bellPosition);
});

test('notification bell fetches a five-item unread preview only when opened', async () => {
  const source = await readFile(
    new URL('../src/component/notification/NotificationBell.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /useNotificationInbox\(\)/);
  assert.match(source, /formatUnreadBadge\(unreadCount\)/);
  assert.match(source, /notificationInboxApi\.listMine\(\{ readState: 'unread', page: 1, limit: 5 \}\)/);
  assert.match(source, /if \(!open\)[\s\S]*?loadPreview\(\)/);
  assert.doesNotMatch(source, /useEffect\([\s\S]*?notificationInboxApi\.listMine/);
  assert.match(source, /\.slice\(0, 5\)/);
  assert.match(source, /Đang tải thông báo/);
  assert.match(source, /Chưa có thông báo mới/);
  assert.match(source, /Không thể tải thông báo/);
  assert.match(source, /Xem tất cả/);
  assert.match(source, /navigate\('\/notifications'\)/);
});

test('notification preview is accessible and never exposes destructive controls', async () => {
  const source = await readFile(
    new URL('../src/component/notification/NotificationBell.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /aria-label="Mở thông báo"/);
  assert.match(source, /aria-expanded=\{open\}/);
  assert.match(source, /role="region"/);
  assert.match(source, /aria-labelledby=\{titleId\}/);
  assert.match(source, /className="notification-preview-item"/);
  assert.match(source, /<button[\s\S]*?notification-preview-item/);
  assert.doesNotMatch(source, /<a\b/);
  assert.doesNotMatch(source, /delete|archive|global log|nhật ký toàn cục|xóa thông báo|lưu trữ/i);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /bellRef\.current\?\.focus\(\)/);
  assert.match(source, /rootRef\.current\?\.contains\(event\.target\)/);
});

test('notification preview styles fit mobile and keep unread emphasis and focus visible', async () => {
  const styles = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');

  assert.match(styles, /\.app-topbar\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*40;/);
  assert.match(styles, /\.app-topbar:has\(\.notification-popover\)\s*\{\s*z-index:\s*100;\s*\}/);
  assert.match(styles, /\.notification-popover\s*\{[\s\S]*?width:\s*min\(380px, calc\(100vw - 28px\)\)/);
  assert.match(styles, /\.notification-preview-item::before/);
  assert.match(styles, /\.notification-badge[\s\S]*?min-width/);
  assert.match(styles, /\.notification-(?:bell|preview-item|view-all):focus-visible/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*?\.notification-popover/);
});

test('notifications route is lazy, authenticated, and open to every signed-in role', async () => {
  const [appSource, guardSource] = await Promise.all([
    readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/component/auth/AuthenticatedRouteGuard.jsx', import.meta.url), 'utf8'),
  ]);

  assert.match(appSource, /const NotificationsPage = lazy\(\(\) => import\('.\/page\/notification\/NotificationsPage'\)\);/);
  assert.match(appSource, /<Route path="\/notifications" element=\{<AuthenticatedRouteGuard><NotificationsPage \/><\/AuthenticatedRouteGuard>\} \/>/);
  assert.match(guardSource, /hasStoredAuth\(\)/);
  assert.match(guardSource, /<Navigate to="\/login" replace \/>/);
  assert.doesNotMatch(guardSource, /MEMBER|LIBRARIAN|ADMIN|audience/);
});

test('notifications page maps filters to canonical read states and server pagination', async () => {
  const source = await readFile(
    new URL('../src/page/notification/NotificationsPage.jsx', import.meta.url),
    'utf8',
  );

  for (const [key, label] of [['all', 'Tất cả'], ['unread', 'Chưa đọc'], ['read', 'Đã đọc']]) {
    assert.match(source, new RegExp(`key: '${key}', label: '${label}'`));
  }
  assert.match(source, /const PAGE_SIZE = 20/);
  assert.match(source, /notificationInboxApi\.listMine\(\{ page: requestedPage, limit: PAGE_SIZE, readState \}\)/);
  assert.match(source, /onClick=\{\(\) => \{ setReadState\(item\.key\); setPage\(1\); \}\}/);
  assert.doesNotMatch(source, /\.sort\(/);
});

test('notifications page exposes real loading, error, empty, unread, and read states', async () => {
  const source = await readFile(
    new URL('../src/page/notification/NotificationsPage.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /<LoadingBlock/);
  assert.match(source, /<DataNotice\s+type="error"/);
  assert.match(source, /<EmptyState/);
  assert.match(source, /notification-item\$\{item\.readAt \? ' read' : ' unread'\}/);
  assert.match(source, /item\.readAt \? 'Đã đọc' : 'Chưa đọc'/);
  assert.match(source, /<Pagination/);
});

test('notifications page marks all through context, refreshes server state, and opens items safely', async () => {
  const source = await readFile(
    new URL('../src/page/notification/NotificationsPage.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /useNotificationInbox\(\)/);
  assert.match(source, /await markAllRead\(\)/);
  assert.match(source, /await loadNotifications\(page\)/);
  assert.match(source, /disabled=\{loading \|\| markingAll\}/);
  assert.doesNotMatch(source, /disabled=\{[^}]*items\.length === 0/);
  assert.match(source, /const result = await openNotification\(item\)/);
  assert.match(source, /if \(result\?\.readSucceeded && !result\.navigated\)[\s\S]*?await loadNotifications\(page\)/);
  assert.match(source, /onClick=\{\(\) => handleOpenNotification\(item\)\}/);
  assert.match(source, /requestedPage > lastValidPage[\s\S]*?notificationInboxApi\.listMine/);
  assert.doesNotMatch(source, /delete|archive|global log|nhật ký toàn cục|xóa thông báo|lưu trữ/i);
});
