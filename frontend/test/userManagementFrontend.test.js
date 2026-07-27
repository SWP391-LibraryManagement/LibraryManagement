import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildRoleReplacement,
  normalizeEditableRoleCatalog,
  validateUserCreateForm,
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

test('FE11 modular console guards access and exposes eight approved navigation entries', async () => {
  const [page, access, navigation] = await Promise.all([
    readAdminFile('AdminConsolePage.jsx'),
    readAdminFile('adminAccess.js'),
    readAdminFile('adminNavigation.js'),
  ]);

  assert.match(page, /const \[activeSection, setActiveSection\] = useState\('users'\)/);
  assert.match(page, /<Navigate to="\/login" replace \/>/);
  assert.match(page, /<Navigate to="\/home" replace \/>/);
  for (const section of ['dashboard', 'library', 'circulation', 'requests', 'users', 'membership', 'permissions', 'audit']) {
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
    ['membership', 'Duyệt hội viên'],
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
  assert.doesNotMatch(section, /updateManagedUser|openUserEditor|mode: 'edit'/);
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
    buildRoleReplacement(['MEMBER'], 'ADMIN', catalog),
    { roleName: 'ADMIN', roleId: 1 },
  );
  assert.equal(buildRoleReplacement(['MEMBER'], 'MEMBER', catalog), null);
  assert.throws(
    () => normalizeEditableRoleCatalog([{ roleId: 1, roleName: 'ADMIN' }]),
    /Không thể tải danh mục vai trò/,
  );
});

test('FE11 role save uses one atomic replacement and recovers authoritative detail', async () => {
  const section = await readAdminFile('users/AdminUsersSection.jsx');
  const saveRole = section.match(/async function saveRole\(nextRole\)[^]*?\r?\n {2}}\r?\n\r?\n {2}function resetFilters/)?.[0] || '';

  assert.match(saveRole, /buildRoleReplacement\(roleUser\.roles \|\| \[\], nextRole, roles\)/);
  assert.match(saveRole, /replaceManagedUserRole\(roleUser\.userId, replacement\.roleId\)/);
  assert.doesNotMatch(saveRole, /for \(/);
  assert.match(saveRole, /const refreshedUser = await fetchManagedUser\(roleUser\.userId\)/);
  assert.match(saveRole, /setRoleUser\(refreshedUser\)/);
  assert.match(saveRole, /setRoleSyncBlocked\(true\)/);
});

test('FE11 create-user validation preserves canonical field widths', () => {
  const valid = validateUserCreateForm({
    type: 'librarian',
    email: 'a'.repeat(242) + '@example.test',
    fullName: 'x'.repeat(100),
    phone: '',
    address: '',
  });
  assert.deepEqual(valid, {});

  const invalid = validateUserCreateForm({
    type: 'librarian',
    email: 'librarian@example.test',
    fullName: '',
    phone: 'invalid phone',
    address: 'x'.repeat(256),
  });
  assert.ok(invalid.fullName);
  assert.ok(invalid.phone);
  assert.ok(invalid.address);
});

test('FE11 desktop table and mobile cards expose only role and deactivation actions', async () => {
  const [section, css] = await Promise.all([
    readAdminFile('users/AdminUsersSection.jsx'),
    readAdminFile('admin-console.css'),
  ]);

  assert.match(section, /className="admin-user-table"/);
  assert.match(section, /className="admin-user-cards"/);
  assert.equal(section.match(/users\.map\(/g)?.length, 2);
  for (const label of ['Phân quyền', 'Vô hiệu hóa']) {
    assert.match(section, new RegExp('label="' + label + '"'));
  }
  assert.doesNotMatch(section, /label="Chỉnh sửa"|openUserEditor|updateManagedUser/);
  assert.doesNotMatch(section, /openLibrarianWorkEditor|department|specialization/);
  assert.doesNotMatch(section, /openEditModal/);
  assert.match(section, /<th>Lần đăng nhập<\/th>/);
  assert.match(section, /className="admin-user-username"/);
  assert.match(section, /placeholder="Tìm theo tên, email hoặc ID\.\.\."/);
  assert.match(css, /\.admin-user-cards\s*\{\s*display: none;/s);
  assert.match(css, /@media \(max-width: 1440px\)[^]*?\.admin-user-table \{ display: none; \}[^]*?\.admin-user-cards \{ display: grid;/);
  assert.match(css, /\.admin-shell__main\s*\{[^}]*min-width: 0;/s);
  assert.match(css, /\.admin-user-table\s*\{[^}]*overflow-x: auto;/s);
  assert.match(css, /\.admin-user-table table\s*\{[^}]*min-width: 1240px;[^}]*table-layout: fixed;/s);
  assert.match(css, /\.admin-user-username\s*\{[^}]*overflow-wrap: anywhere;[^}]*white-space: normal;/s);
  assert.match(css, /\.admin-user-identity small\s*\{[^}]*overflow-wrap: anywhere;[^}]*white-space: normal;/s);
});

test('FE11 create flow remains separate from role and deactivation actions', async () => {
  const [editor, roleModal, drawer, section] = await Promise.all([
    readAdminFile('users/UserEditorModal.jsx'),
    readAdminFile('users/UserRoleModal.jsx'),
    readAdminFile('users/UserDetailDrawer.jsx'),
    readAdminFile('users/AdminUsersSection.jsx'),
  ]);

  assert.match(editor, /Tài khoản mới ở trạng thái chưa kích hoạt/);
  assert.doesNotMatch(editor, /isEdit|Vai trò hiện tại|RoleBadge|onManageRole|Đổi vai trò|Chỉnh sửa/);
  assert.doesNotMatch(editor, /Phòng ban|Chuyên môn|Thông tin cá nhân do người dùng tự quản lý/);
  assert.match(roleModal, /type="radio"/);
  assert.match(roleModal, /Mỗi tài khoản phải có đúng một vai trò/);
  assert.match(roleModal, /người dùng phải đăng nhập lại để nhận quyền mới/);
  assert.match(roleModal, /roles\.some\(\(role\) => role\.roleName === selectedRole\)/);
  assert.match(drawer, /relatedSummary\?\.activeBorrowingCount/);
  assert.match(drawer, /relatedSummary\?\.unpaidFineTotal/);
  assert.match(drawer, /relatedSummary\?\.openReservationCount/);
  for (const label of ['Đóng chi tiết', 'Chưa có tên', 'Lượt mượn đang hoạt động', 'Tiền phạt chưa thanh toán']) {
    assert.match(drawer, new RegExp(label));
  }
  assert.doesNotMatch(drawer, /label="Chỉnh sửa"|onEdit\(user\)/);
  assert.doesNotMatch(section, /openUserEditor|openRoleFromEditor|onEdit=/);
  for (const label of ['Phân quyền', 'Vô hiệu hóa']) {
    assert.match(drawer + section, new RegExp(label));
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
  assert.match(source, /Mỗi tài khoản có đúng một vai trò/);
  assert.match(source, /permission-decision \$\{decision\.tone\}/);
  assert.doesNotMatch(source, /const permissionRows =|const permissionModules =/);
});

test('FE11 audit renders a paginated read-only list without search or filter controls', async () => {
  const source = await readAdminFile('audit/AdminAuditSection.jsx');

  assert.match(source, /adminApi\.auditLogs\(\{ page, limit: AUDIT_TABLE_PAGE_SIZE \}\)/);
  assert.match(source, /formatAuditAction\(log\.action\)/);
  assert.doesNotMatch(source, /AdminFilterBar|AdminDateField|buildAuditLogParams/);
  assert.doesNotMatch(source, /auditFilters|appliedFilters|admin-audit-action-options/);
  assert.match(source, /log\.actor\?\.fullName/);
  assert.match(source, /log\.actor\?\.email/);
  assert.match(source, /log\.target\?\.label/);
  assert.doesNotMatch(source, /Chi tiết an toàn|admin-audit-column--details|admin-audit-details-disclosure|formatAuditDetailEntries|formatAuditDetailKey/);
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
  assert.match(library, /import BookManagement from '\.\.\/\.\.\/BookManagement'/);
  assert.match(library, /setBookManagementOpen\(true\)/);
  assert.match(library, /<BookManagement \/>/);
  assert.doesNotMatch(library, /navigate\('\/librarian\/books'\)/);
  assert.match(library, /setAppliedFilters\(\{ q: query, status \}\)/);
  assert.match(library, /q: appliedFilters\.q\.trim\(\)/);
  assert.match(library, /status: appliedFilters\.status === 'ALL'/);
  assert.match(circulation, /adminApi\.borrowings/);
  assert.match(circulation, /borrowingApi\.renewDetail/);
  assert.match(circulation, /borrowingApi\.returnDetail/);
  assert.match(page, /onOpenRequests=\{\(\) => openDashboardDestination\(\{ section: 'requests', status: 'PENDING' \}\)\}/);

  const adminSource = library + '\n' + circulation + '\n' + page;
  assert.doesNotMatch(adminSource, /getFineRecords|saveFineRecords/);
  assert.match(adminSource, /activeSection === ['"]membership['"]/);
  assert.doesNotMatch(adminSource, /activeSection === ['"]payments['"]/);
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
  ]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /getStatusLabel/);
  assert.match(source, /toLocaleDateString\('vi-VN'/);
  assert.doesNotMatch(source, /Every user must keep at least one role|Status Report|Role Distribution|Close details|No name|Search library data/);
});
