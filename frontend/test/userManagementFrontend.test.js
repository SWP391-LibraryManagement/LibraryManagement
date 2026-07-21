import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildRoleMutationPlan,
  normalizeEditableRoleCatalog,
  validateUserForm,
} from '../src/page/admin/users/userPresentation.js';

const root = new URL('../src/page/admin/', import.meta.url);
const pagePath = new URL('../src/page/UserManagement.jsx', import.meta.url);

async function readAdminFile(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('FE11 legacy admin entry delegates exactly to the modular console', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.equal(source.trim(), "export { default } from './admin/AdminConsolePage';");
});

test('FE11 modular console guards access and exposes seven approved navigation entries', async () => {
  const [page, access, navigation] = await Promise.all([
    readAdminFile('AdminConsolePage.jsx'),
    readAdminFile('adminAccess.js'),
    readAdminFile('adminNavigation.js'),
  ]);

  assert.match(page, /const \[activeSection, setActiveSection\] = useState\('users'\)/);
  assert.match(page, /<Navigate to="\/login" replace \/>/);
  assert.match(page, /<Navigate to="\/home" replace \/>/);
  for (const section of ['dashboard', 'library', 'circulation', 'requests', 'users', 'permissions', 'audit']) {
    assert.match(page, new RegExp("activeSection === '" + section + "'"));
  }
  assert.match(access, /roles\.includes\('ADMIN'\)/);
  assert.doesNotMatch(access + page, /allowDevUserManagementWithoutLogin|MODE !== 'production'/);

  const entries = [...navigation.matchAll(/\{ id: '([^']+)'[^}]+label: '([^']+)'/g)]
    .map((match) => [match[1], match[2]]);
  assert.deepEqual(entries, [
    ['home', 'Trang chủ'],
    ['dashboard', 'Tổng quan'],
    ['library', 'Thư viện'],
    ['circulation', 'Quản lý mượn trả'],
    ['requests', 'Quản lý yêu cầu'],
    ['users', 'Quản lý người dùng'],
    ['audit', 'Nhật ký hoạt động'],
  ]);
  assert.doesNotMatch(navigation, /id: 'permissions'/);
});

test('FE11 user module keeps detail, lifecycle and independent loading contracts', async () => {
  const section = await readAdminFile('users/AdminUsersSection.jsx');

  assert.match(section, /async function openUserDetail\(userId\)/);
  assert.match(section, /const detail = await fetchManagedUser\(userId\)/);
  assert.match(section, /setSelectedUser\(detail\)/);
  assert.match(section, /isManagedUserNotFound\(error\)[^]*?await loadUsers\(pagination\.page\)/);
  assert.match(section, /deactivateManagedUser\(user\.userId, user\.updatedAt\)/);
  assert.match(section, /expectedUpdatedAt: modal\.user\.updatedAt/);
  assert.match(section, /department: form\.department\.trim\(\) \|\| null/);
  assert.match(section, /specialization: form\.specialization\.trim\(\) \|\| null/);
  assert.match(section, /createLatestRequestGuard/);
  assert.match(section, /beginLatestRequest\('users'\)/);
  assert.match(section, /beginLatestRequest\('user-statistics'\)/);
  assert.match(section, /setUsersError\(error\.message\)/);
  assert.match(section, /setStatisticsError\(error\.message\)/);
  assert.match(section, /const result = await reportApi\.users\(\)/);
  assert.match(section, /setStatistics\(normalizeAdminUserStatistics\(result\)\)/);
});

test('FE11 role catalog and mutation plan use canonical numeric IDs', () => {
  const catalog = normalizeEditableRoleCatalog([
    { roleId: 1, roleName: 'ADMIN' },
    { roleId: 2, roleName: 'LIBRARIAN' },
    { roleId: 3, roleName: 'MEMBER' },
  ]);
  assert.deepEqual(catalog.map((role) => role.roleId), [1, 2, 3]);
  assert.deepEqual(
    buildRoleMutationPlan(['MEMBER'], ['ADMIN', 'MEMBER'], catalog),
    { assignments: [{ roleName: 'ADMIN', roleId: 1 }], revocations: [] },
  );
  assert.throws(
    () => normalizeEditableRoleCatalog([{ roleId: 1, roleName: 'ADMIN' }]),
    /Không thể tải danh mục vai trò/,
  );
});

test('FE11 role saves assign before revoking and recover authoritative detail', async () => {
  const section = await readAdminFile('users/AdminUsersSection.jsx');
  const saveRoles = section.match(/async function saveRoles\(nextRoles\)[^]*?\n {2}}\n\n {2}function resetFilters/)?.[0] || '';

  assert.match(saveRoles, /for \(const \{ roleId \} of assignments\)/);
  assert.match(saveRoles, /assignManagedUserRole\(roleUser\.userId, roleId\)/);
  assert.match(saveRoles, /for \(const \{ roleId \} of revocations\)/);
  assert.match(saveRoles, /revokeManagedUserRole\(roleUser\.userId, roleId\)/);
  assert.ok(saveRoles.indexOf('of assignments') < saveRoles.indexOf('of revocations'));
  assert.match(saveRoles, /const refreshedUser = await fetchManagedUser\(roleUser\.userId\)/);
  assert.match(saveRoles, /setRoleUser\(refreshedUser\)/);
  assert.match(saveRoles, /setRoleSyncBlocked\(true\)/);
});

test('FE11 user validation preserves canonical field widths', () => {
  const valid = validateUserForm({
    type: 'librarian',
    email: 'a'.repeat(242) + '@example.test',
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

test('FE11 desktop table and mobile cards expose the same visible actions', async () => {
  const [section, css] = await Promise.all([
    readAdminFile('users/AdminUsersSection.jsx'),
    readAdminFile('admin-console.css'),
  ]);

  assert.match(section, /className="admin-user-table"/);
  assert.match(section, /className="admin-user-cards"/);
  assert.equal(section.match(/users\.map\(/g)?.length, 2);
  for (const label of ['Chỉnh sửa', 'Phân quyền', 'Vô hiệu hóa']) {
    assert.match(section, new RegExp('label="' + label + '"'));
  }
  assert.match(section, /<th>Lần đăng nhập<\/th>/);
  assert.match(section, /placeholder="Tìm theo tên, email hoặc ID\.\.\."/);
  assert.match(css, /\.admin-user-cards\s*\{\s*display: none;/s);
  assert.match(css, /@media \(max-width: 1440px\)[^]*?\.admin-user-table \{ display: none; \}[^]*?\.admin-user-cards \{ display: grid;/);
});

test('FE11 editor and drawer explain account setup and safe related summaries', async () => {
  const [editor, roleModal, drawer] = await Promise.all([
    readAdminFile('users/UserEditorModal.jsx'),
    readAdminFile('users/UserRoleModal.jsx'),
    readAdminFile('users/UserDetailDrawer.jsx'),
  ]);

  assert.match(editor, /Tài khoản mới ở trạng thái chưa kích hoạt/);
  assert.match(editor, /Tài khoản hiện tại giữ nguyên trạng thái đăng nhập/);
  assert.match(roleModal, /Mỗi người dùng phải giữ ít nhất một vai trò/);
  assert.match(drawer, /relatedSummary\?\.activeBorrowingCount/);
  assert.match(drawer, /relatedSummary\?\.unpaidFineTotal/);
  assert.match(drawer, /relatedSummary\?\.openReservationCount/);
  for (const label of ['Đóng chi tiết', 'Chưa có tên', 'Lượt mượn đang hoạt động', 'Tiền phạt chưa thanh toán']) {
    assert.match(drawer, new RegExp(label));
  }
});

test('FE11 permissions keep policy and statistics independent with explicit decisions', async () => {
  const source = await readAdminFile('permissions/AdminPermissionsSection.jsx');

  assert.match(source, /adminApi\.permissions\(\)/);
  assert.match(source, /reportApi\.users\(\)/);
  assert.match(source, /buildPermissionRoleSummary/);
  assert.match(source, /buildPermissionModuleCoverage/);
  assert.match(source, /roleAllowsPermission/);
  assert.match(source, /getPermissionDecision/);
  assert.match(source, /Dữ liệu phân quyền/);
  assert.match(source, /Thống kê tài khoản theo vai trò/);
  assert.match(source, /Một tài khoản có thể có nhiều vai trò/);
  assert.match(source, /permission-decision \$\{decision\.tone\}/);
  assert.doesNotMatch(source, /const permissionRows =|const permissionModules =/);
});

test('FE11 audit keeps canonical filters and renders only safe nested DTO fields', async () => {
  const source = await readAdminFile('audit/AdminAuditSection.jsx');

  assert.match(source, /function buildAuditLogParams/);
  assert.match(source, /adminApi\.auditLogs/);
  assert.match(source, /formatAuditAction\(log\.action\)/);
  assert.match(source, /formatAuditDetailKey\(key\)/);
  for (const label of ['Hành động', 'Mã người thực hiện', 'Từ ngày', 'Đến ngày']) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /className="admin-audit-filter-bar"/);
  assert.match(source, /list="admin-audit-action-options"/);
  assert.match(source, /<datalist id="admin-audit-action-options">/);
  assert.match(source, /placeholder="Nhập hoặc chọn hành động"/);
  assert.doesNotMatch(source, /placeholder="AUTH_LOGIN_SUCCESS"/);
  assert.match(source, /<details className="admin-audit-details-disclosure">/);
  assert.match(source, /<summary>Xem chi tiết \(\{details\.length\}\)<\/summary>/);
  assert.match(source, /log\.actor\?\.fullName/);
  assert.match(source, /log\.actor\?\.email/);
  assert.match(source, /log\.target\?\.label/);
  assert.match(source, /formatAuditDetailEntries\(log\.details\)/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|log\.metadata|JSON\.stringify\(log\.details/);
});

test('FE11 library and circulation preserve canonical ownership boundaries', async () => {
  const [library, circulation, page] = await Promise.all([
    readAdminFile('library/AdminLibrarySection.jsx'),
    readAdminFile('circulation/AdminCirculationSection.jsx'),
    readAdminFile('AdminConsolePage.jsx'),
  ]);

  assert.match(library, /adminApi\.libraryBooks/);
  assert.doesNotMatch(library, /adminApi\.(?:createBook|updateBook|deactivateBook)/);
  assert.match(library, /navigate\('\/librarian\/books'\)/);
  assert.match(circulation, /adminApi\.borrowings/);
  assert.match(circulation, /borrowingApi\.renewDetail/);
  assert.match(circulation, /borrowingApi\.returnDetail/);
  assert.match(page, /onOpenRequests=\{\(\) => setActiveSection\('requests'\)\}/);

  const adminSource = library + '\n' + circulation + '\n' + page;
  assert.doesNotMatch(adminSource, /getFineRecords|saveFineRecords|MembershipApplicationsTable|MembershipReviewModal/);
  assert.doesNotMatch(adminSource, /activeSection === ['"](?:membership|payments)['"]/);
});

test('FE11 Admin copy is Vietnamese while raw enum values remain unchanged', async () => {
  const sources = await Promise.all([
    readAdminFile('users/AdminUsersSection.jsx'),
    readAdminFile('users/UserBadges.jsx'),
    readAdminFile('library/AdminLibrarySection.jsx'),
    readAdminFile('circulation/AdminCirculationSection.jsx'),
    readAdminFile('permissions/AdminPermissionsSection.jsx'),
    readAdminFile('audit/AdminAuditSection.jsx'),
  ]);
  const source = sources.join('\n');

  for (const label of [
    'Quản lý người dùng',
    'Tìm dữ liệu thư viện',
    'Quản lý mượn trả',
    'Dữ liệu phân quyền',
    'Nhật ký hoạt động',
    'Chỉnh sửa',
  ]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /getStatusLabel/);
  assert.match(source, /toLocaleDateString\('vi-VN'/);
  assert.doesNotMatch(source, /Every user must keep at least one role|Status Report|Role Distribution|Close details|No name|Search library data/);
});
