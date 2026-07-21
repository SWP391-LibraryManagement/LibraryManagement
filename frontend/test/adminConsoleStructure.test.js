import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../src/page/admin/', import.meta.url);

test('Admin shared components are presentation only', async () => {
  for (const file of [
    'AdminPageHeader.jsx',
    'AdminFilterBar.jsx',
    'AdminDateField.jsx',
    'AdminActionButton.jsx',
    'AdminEmptyState.jsx',
    'AdminPagination.jsx',
  ]) {
    const source = await readFile(new URL(`components/${file}`, root), 'utf8');
    assert.doesNotMatch(source, /api\//);
  }
});

test('Admin date and action controls expose visible labels', async () => {
  const date = await readFile(new URL('components/AdminDateField.jsx', root), 'utf8');
  const action = await readFile(new URL('components/AdminActionButton.jsx', root), 'utf8');
  assert.match(date, /<span>\{label\}<\/span>/);
  assert.match(date, /type="date"/);
  assert.match(action, /<span>\{label\}<\/span>/);
});

test('Admin CSS defines mobile cards, focus and reduced motion', async () => {
  const css = await readFile(new URL('admin-console.css', root), 'utf8');
  assert.match(css, /\.admin-user-cards/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 1440px\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
});

test('Admin Audit table stays contained with readable action, IP, and time columns', async () => {
  const css = await readFile(new URL('admin-console.css', root), 'utf8');
  assert.match(css, /\.admin-shell__main\s*\{[^}]*min-width: 0;/s);
  assert.match(css, /\.admin-table-scroll\s*\{[^}]*overflow-x: auto;/s);
  assert.match(css, /\.admin-audit-table\s*\{[^}]*min-width: 980px;[^}]*table-layout: fixed;/s);
  assert.match(css, /\.admin-audit-column--action\s*\{ width: 15%; \}/);
  assert.match(css, /\.admin-audit-column--ip\s*\{ width: 11%; \}/);
  assert.match(css, /\.admin-audit-column--time\s*\{ width: 17%; \}/);
  assert.match(css, /\.admin-audit-ip,\s*\.admin-audit-time\s*\{[^}]*white-space: nowrap;/s);
});

test('Admin shell derives accessible desktop and mobile navigation from one contract', async () => {
  const shell = await readFile(new URL('components/AdminShell.jsx', root), 'utf8');
  assert.match(shell, /ADMIN_NAVIGATION/);
  assert.match(shell, /aria-current=/);
  assert.match(shell, /aria-expanded=/);
  assert.match(shell, /aria-controls=/);
  assert.match(shell, /event\.key === 'Escape'/);
  assert.doesNotMatch(shell, /api\//);
});

test('Admin page resolves stored access before protected section composition', async () => {
  const access = await readFile(new URL('adminAccess.js', root), 'utf8');
  const page = await readFile(new URL('AdminConsolePage.jsx', root), 'utf8');
  assert.match(access, /localStorage/);
  assert.match(access, /sessionStorage/);
  assert.match(access, /roles\.includes\('ADMIN'\)/);
  assert.match(page, /useState\('users'\)/);
  assert.match(page, /<Navigate to="\/login" replace \/>/);
  assert.match(page, /<Navigate to="\/home" replace \/>/);
  assert.ok(page.indexOf('!access.authenticated') < page.indexOf('<AdminShell'));
});

test('Admin dashboard keeps API ownership, stale-response guard and operational chart rules', async () => {
  const dashboard = await readFile(new URL('dashboard/AdminDashboardSection.jsx', root), 'utf8');
  const page = await readFile(new URL('AdminConsolePage.jsx', root), 'utf8');
  assert.match(dashboard, /adminApi\.dashboard\(\)/);
  assert.match(dashboard, /createLatestRequestGuard/);
  assert.equal(dashboard.match(/selectOperationalChartRows\(/g)?.length, 3);
  assert.match(dashboard, /Dữ liệu sẽ xuất hiện khi có giao dịch phù hợp\./);
  assert.match(page, /activeSection === 'dashboard'/);
  assert.match(page, /<AdminDashboardSection \/>/);
});

test('Admin users render one directory as a desktop table and mobile cards with visible actions', async () => {
  const users = await readFile(new URL('users/AdminUsersSection.jsx', root), 'utf8');
  const page = await readFile(new URL('AdminConsolePage.jsx', root), 'utf8');
  assert.match(users, /className="admin-user-table"/);
  assert.match(users, /className="admin-user-cards"/);
  assert.equal(users.match(/users\.map\(/g)?.length, 2);
  for (const label of ['Phân quyền', 'Vô hiệu hóa']) {
    assert.match(users, new RegExp(`label="${label}"`));
  }
  assert.doesNotMatch(users, /label="Chỉnh sửa"|openEditModal/);
  assert.match(users, /Tài khoản này đã ngừng hoạt động\./);
  assert.match(page, /activeSection === 'users'/);
  assert.match(page, /<AdminUsersSection/);
});

test('Admin requests preserve server pagination, FE07 actions and labeled date filters', async () => {
  const requests = await readFile(new URL('requests/AdminRequestsSection.jsx', root), 'utf8');
  const page = await readFile(new URL('AdminConsolePage.jsx', root), 'utf8');
  assert.match(requests, /adminApi\.requests/);
  assert.match(requests, /borrowingApi\.approve\(/);
  assert.match(requests, /borrowingApi\.reject\(/);
  assert.match(requests, /AdminFilterBar/);
  assert.match(requests, /AdminDateField/);
  assert.match(page, /activeSection === 'requests'/);
  assert.match(page, /<AdminRequestsSection/);
});
