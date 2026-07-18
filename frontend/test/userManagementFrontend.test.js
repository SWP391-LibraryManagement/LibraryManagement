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
  const saveRoles = source.match(/async function saveRoles\(nextRoles\)[\s\S]*?\r?\n {2}}\r?\n\r?\n {2}return \(/)?.[0] || '';

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
