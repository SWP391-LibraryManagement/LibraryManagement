import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../src/page/UserManagement.jsx', import.meta.url);

test('FE11 row selection fetches detail before opening the drawer', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /async function openUserDetail\(userId\)/);
  assert.match(source, /const detail = await fetchManagedUser\(userId\)/);
  assert.match(source, /setSelectedUser\(detail\)/);
  assert.match(source, /onClick=\{\(\) => openUserDetail\(user\.userId\)\}/);
  assert.doesNotMatch(source, /onClick=\{\(\) => setSelectedUser\(user\)\}/);
});

test('FE11 drawer renders all approved related summaries', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /selectedUser\.relatedSummary\?\.activeBorrowingCount/);
  assert.match(source, /selectedUser\.relatedSummary\?\.unpaidFineTotal/);
  assert.match(source, /selectedUser\.relatedSummary\?\.openReservationCount/);
  assert.match(source, /isManagedUserNotFound\(error\)[\s\S]*?await loadUsers\(pagination\.page\)/);
});

test('FE11 role editing requires a complete numeric role catalog', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /function normalizeEditableRoleCatalog\(roleCatalog = \[\]\)/);
  assert.match(source, /Number\.isInteger\(roleId\) && roleId > 0/);
  assert.match(source, /seenIds\.has\(roleId\)/);
  assert.match(source, /normalized\.length !== editableRoles\.length/);
  assert.match(source, /async function loadRoles\(\)/);
  assert.match(source, /async function openRoleModal\(user\)[\s\S]*?await loadRoles\(\)/);
  assert.doesNotMatch(source, /editableRoles\.map\(\(roleName\) => \(\{ roleName \}\)\)/);
});

test('FE11 role mutation plan preserves names for UI and emits catalog IDs', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /function buildRoleMutationPlan\(currentRoleNames, selectedRoleNames, roleCatalog\)/);
  assert.match(source, /assignments\.push\(\{ roleName, roleId \}\)/);
  assert.match(source, /revocations\.push\(\{ roleName, roleId \}\)/);
});

test('FE11 role saves validate the full plan and assign before revoking', async () => {
  const source = await readFile(pagePath, 'utf8');
  const saveRoles = source.match(/async function saveRoles\(nextRoles\)[\s\S]*?\r?\n {2}}\r?\n\r?\n {2}if \(!access\.authenticated\)/)?.[0] || '';

  assert.match(
    saveRoles,
    /buildRoleMutationPlan\(\s*roleUser\.roles \|\| \[\],\s*nextRoles,\s*roles,\s*\)/,
  );
  assert.match(saveRoles, /for \(const \{ roleId \} of assignments\)/);
  assert.match(saveRoles, /assignManagedUserRole\(roleUser\.userId, roleId\)/);
  assert.match(saveRoles, /for \(const \{ roleId \} of revocations\)/);
  assert.match(saveRoles, /revokeManagedUserRole\(roleUser\.userId, roleId\)/);
  assert.ok(saveRoles.indexOf('of assignments') < saveRoles.indexOf('of revocations'));
  assert.match(saveRoles, /assignments\.length === 0 && revocations\.length === 0/);
});

test('FE11 partial role failure reloads the target and keeps the modal authoritative', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /catch \(error\) \{[\s\S]*?await fetchManagedUser\(roleUser\.userId\)/);
  assert.match(source, /setRoleUser\(refreshedUser\)/);
  assert.match(source, /setRoleSyncBlocked\(true\)/);
  assert.match(source, /useEffect\(\(\) => \{[\s\S]*?setSelectedRoles\(new Set\(user\.roles \|\| \[\]\)\)/);
  assert.match(source, /\}, \[user\]\);/);
  assert.match(source, /savingBlocked=\{rolesLoading \|\| roleSyncBlocked\}/);
  assert.match(source, /catch \(error\) \{\s*setError\(error\.message\)/);
});

test('FE11 user cards use independent FE12 statistics instead of list summaries', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /import \{ borrowingApi, membershipApi, reportApi \} from '\.\.\/api\/libraryFeatureApi';/);
  assert.match(source, /async function loadUserStatistics\(\)/);
  assert.match(source, /const result = await reportApi\.users\(\)/);
  assert.match(source, /totals\.users/);
  assert.match(source, /usersByStatus\.ACTIVE/);
  assert.match(source, /usersByStatus\.INACTIVE/);
  assert.match(source, /usersByRole\.LIBRARIAN/);
  assert.doesNotMatch(source, /result\.summary/);
  assert.doesNotMatch(source, /users\.filter\(\(user\) => user\.roles/);
});

test('FE11 list and statistics failures are stored independently', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /async function loadUsers\([^]*?setUsersError\(error\.message\)/);
  assert.match(source, /async function loadUserStatistics\(\)[^]*?setUserStatsError\(error\.message\)/);
  const statisticsBlock = source.match(/async function loadUserStatistics\(\)[\s\S]*?\n {2}\}/)?.[0] || '';
  assert.doesNotMatch(statisticsBlock, /setUsers\(/);
});

test('FE11 Audit query builder omits blanks and preserves nonblank server validation input', async () => {
  const source = await readFile(pagePath, 'utf8');
  const functionMatch = source.match(/function buildAuditLogParams\([^]*?\n}\r?\n/);
  assert.ok(functionMatch, 'buildAuditLogParams must exist');
  const buildAuditLogParams = new Function(
    `const AUDIT_TABLE_PAGE_SIZE = 20; ${functionMatch[0]}; return buildAuditLogParams;`,
  )();

  assert.deepEqual(buildAuditLogParams({
    page: 2,
    q: '  login  ',
    action: '  AUTH_LOGIN_SUCCESS  ',
    actorId: '7',
    from: '2026-07-01',
    to: '2026-07-18',
  }), {
    page: 2,
    limit: 20,
    q: 'login',
    action: 'AUTH_LOGIN_SUCCESS',
    actorId: 7,
    from: '2026-07-01',
    to: '2026-07-18',
  });
  assert.deepEqual(buildAuditLogParams({ q: ' ', action: '', actorId: '' }), {
    page: 1,
    limit: 20,
  });
  assert.equal(buildAuditLogParams({ actorId: 'invalid' }).actorId, 'invalid');
});

test('FE11 Audit exposes the approved action and actor filters', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /aria-label="Lọc hành động"[\s\S]*?value=\{auditFilters\.action\}/);
  assert.match(source, /setAuditFilters\(\(current\) => \(\{[\s\S]*?action: event\.target\.value/);
  assert.match(source, /aria-label="Actor ID"[\s\S]*?type="number"[\s\S]*?value=\{auditFilters\.actorId\}/);
  assert.match(source, /setAuditFilters\(\(current\) => \(\{[\s\S]*?actorId: event\.target\.value/);
});

test('FE11 Audit controls reset pagination and refresh with applied filters', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /loadAuditLogs\(1, \{ filters: auditFilters \}\)/);
  assert.match(source, /setAuditFilters\(EMPTY_AUDIT_FILTERS\)[\s\S]*?loadAuditLogs\(1, \{ filters: EMPTY_AUDIT_FILTERS \}\)/);
  assert.match(source, /loadAuditLogs\(auditPagination\.page, \{ announce: true, filters: auditFilters \}\)/);
});

test('FE11 Audit renders only the nested safe DTO as React text', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /log\.actor\?\.fullName/);
  assert.match(source, /log\.actor\?\.email/);
  assert.match(source, /log\.target\?\.label/);
  assert.match(source, /log\.target\?\.type/);
  assert.match(source, /log\.target\?\.id/);
  assert.match(source, /formatAuditDetailEntries\(log\.details\)/);
  assert.match(source, /pageSize=\{auditPagination\.limit \|\| AUDIT_TABLE_PAGE_SIZE\}/);
  assert.doesNotMatch(source, /log\.metadata/);
  assert.doesNotMatch(source, /JSON\.stringify\(log\.details/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(source, /log\.(?:actorName|actorEmail|targetName|targetEmail|targetType|targetId)/);
});

test('FE11 Admin sidebar exposes exactly the approved eight entries in order', async () => {
  const source = await readFile(pagePath, 'utf8');
  const sidebar = source.match(/function Sidebar\([^]*?\n}\r?\n\r?\nfunction AdminLineChart/)?.[0] || '';
  const entries = [...sidebar.matchAll(/\{ id: '([^']+)'[^\n]+label: '([^']+)'/g)]
    .map((match) => [match[1], match[2]]);

  assert.deepEqual(entries, [
    ['home', 'Trang chủ'],
    ['dashboard', 'Tổng quan'],
    ['library', 'Thư viện'],
    ['circulation', 'Quản lý mượn trả'],
    ['requests', 'Quản lý yêu cầu'],
    ['users', 'Quản lý người dùng'],
    ['permissions', 'Phân quyền'],
    ['audit', 'Nhật ký hoạt động'],
  ]);
  assert.doesNotMatch(sidebar, /membership|Confirm Payment|Confirm Borrow/);
});

test('FE11 Permissions loads FE11 matrix and FE12 counts independently', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /async function loadPermissions\(\{ announce = false \} = \{\}\)/);
  assert.match(source, /const result = await adminApi\.permissions\(\)/);
  assert.match(source, /if \(activeSection !== 'permissions'\) return/);
  assert.match(source, /loadPermissions\(\)/);
  assert.match(source, /loadUserStatistics\(\)/);
  assert.match(source, /setPermissionsError\(error\.message\)/);
  assert.match(source, /setUserStatsError\(error\.message\)/);

  const permissionsBlock = source.match(/async function loadPermissions\([^]*?\n {2}\}/)?.[0] || '';
  assert.doesNotMatch(permissionsBlock, /catch \(error\)[^]*?setPermissionPolicy\(/);
  const statisticsBlock = source.match(/async function loadUserStatistics\([^]*?\n {2}\}/)?.[0] || '';
  assert.doesNotMatch(statisticsBlock, /catch \(error\)[^]*?setUserStats\(/);
});

test('FE11 Permissions derives the view from server data without a hardcoded matrix fallback', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /buildPermissionRoleSummary\(permissionPolicy\.roles, userStats\.usersByRole\)/);
  assert.match(source, /buildPermissionModuleCoverage\(permissionPolicy\.roles, permissionPolicy\.permissions\)/);
  assert.match(source, /roleAllowsPermission\(permission, role\.roleName\)/);
  assert.match(source, /permissionPolicy\.permissions\.map/);
  assert.doesNotMatch(source, /const permissionRows =/);
  assert.doesNotMatch(source, /const permissionModules =/);
});

test('FE11 Admin access never uses an implicit development bypass', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.doesNotMatch(source, /allowDevUserManagementWithoutLogin|MODE !== 'production'/);
  assert.match(source, /import \{ Navigate, useNavigate \} from 'react-router-dom';/);
  assert.match(source, /function readStoredAdminAccess\(\)/);
  assert.match(source, /<Navigate to="\/login" replace/);
  assert.match(source, /<Navigate to="\/home" replace/);
});

// @spec AC-FE05-012, FR-FE05-021, FR-FE05-025
test('FE11 Library view is read-only for FE05 books and directs mutations to canonical BookManagement', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.doesNotMatch(source, /adminApi\.(createBook|updateBook|deactivateBook)/);
  assert.doesNotMatch(source, /function deactivateBook\(/);
  assert.match(source, /libraryResource === 'books'/);
  assert.match(source, /Chỉ xem|read-only/i);
});

test('FE11 lifecycle payloads include effective version and Librarian fields', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /expectedUpdatedAt: modal\.user\.updatedAt/);
  assert.match(source, /deactivateManagedUser\(user\.userId, user\.updatedAt\)/);
  assert.match(source, /department: form\.department\.trim\(\) \|\| null/);
  assert.match(source, /specialization: form\.specialization\.trim\(\) \|\| null/);
  assert.match(source, /form\.type === 'librarian' && \(/);
  assert.match(source, /\['ACTIVE', 'LOCKED'\]\.includes\(user\.status\)/);
});

test('FE11 form validation accepts canonical widths and rejects overlength Librarian fields', async () => {
  const source = await readFile(pagePath, 'utf8');
  const functionMatch = source.match(/function validateUserForm\(form\) \{[^]*?\n\}/);
  assert.ok(functionMatch, 'validateUserForm must exist');
  const validateUserForm = new Function(`${functionMatch[0]}; return validateUserForm;`)();
  const email255 = `${'a'.repeat(242)}@example.test`;
  const valid = validateUserForm({
    type: 'librarian',
    email: email255,
    fullName: 'x'.repeat(100),
    phone: '',
    address: '',
    department: 'x'.repeat(100),
    specialization: 'x'.repeat(100),
  });
  assert.deepEqual(valid, {});

  const invalid = validateUserForm({
    type: 'librarian',
    email: 'librarian@example.test',
    fullName: 'Librarian',
    phone: '',
    address: '',
    department: 'x'.repeat(101),
    specialization: 'x'.repeat(101),
  });
  assert.ok(invalid.department);
  assert.ok(invalid.specialization);
});
