import {
  Check,
  FilterX,
  Pencil,
  Plus,
  PowerOff,
  Search,
  Shield,
  UserCog,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { reportApi } from '../../../api/libraryFeatureApi';
import {
  assignManagedUserRole,
  createManagedUser,
  deactivateManagedUser,
  fetchManagedUser,
  fetchRoles,
  fetchUsers,
  revokeManagedUserRole,
  updateManagedUser,
} from '../../../api/userManagementApi';
import { normalizeAdminUserStatistics } from '../../../utils/adminStatistics';
import { createLatestRequestGuard } from '../../../utils/latestRequestGuard';
import { isManagedUserNotFound } from '../../../utils/userManagementQuery';
import { readStoredAdminAccess } from '../adminAccess';
import { AdminActionButton } from '../components/AdminActionButton';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminFilterBar } from '../components/AdminFilterBar';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPagination } from '../components/AdminPagination';
import { RoleBadge, StatusBadge } from './UserBadges';
import { UserDetailDrawer } from './UserDetailDrawer';
import { UserEditorModal } from './UserEditorModal';
import { UserRoleModal } from './UserRoleModal';
import {
  buildRoleMutationPlan,
  formatAdminDate,
  getPrimaryRole,
  normalizeEditableRoleCatalog,
  ROLE_CATALOG_ERROR,
} from './userPresentation';

const ADMIN_TABLE_PAGE_SIZE = 8;
const EMPTY_STATS = { total: 0, active: 0, librarians: 0, inactive: 0, usersByRole: {} };

function UserAvatar({ user }) {
  return (
    <span className={`admin-user-avatar admin-user-avatar--${getPrimaryRole(user).toLowerCase()}`} aria-hidden="true">
      {(user.fullName || user.email || '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

export function AdminUsersSection({ onToast }) {
  const requestGuards = useRef(new Map());
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(EMPTY_STATS);
  const [pagination, setPagination] = useState({ page: 1, limit: ADMIN_TABLE_PAGE_SIZE, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [roleUser, setRoleUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [rolesError, setRolesError] = useState('');
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleSyncBlocked, setRoleSyncBlocked] = useState(false);

  const notify = useCallback((type, message) => {
    onToast?.({ type, message });
  }, [onToast]);

  const beginLatestRequest = useCallback((name) => {
    let guard = requestGuards.current.get(name);
    if (!guard) {
      guard = createLatestRequestGuard();
      requestGuards.current.set(name, guard);
    }
    return { guard, token: guard.begin() };
  }, []);

  const loadUserStatistics = useCallback(async () => {
    const { guard, token } = beginLatestRequest('user-statistics');
    setStatisticsLoading(true);
    setStatisticsError('');
    try {
      const result = await reportApi.users();
      if (!guard.isLatest(token)) return;
      setStatistics(normalizeAdminUserStatistics(result));
    } catch (error) {
      if (!guard.isLatest(token)) return;
      setStatisticsError(error.message);
    } finally {
      if (guard.isLatest(token)) setStatisticsLoading(false);
    }
  }, [beginLatestRequest]);

  const loadUsers = useCallback(async (page = 1, overrides = {}) => {
    const { guard, token } = beginLatestRequest('users');
    const nextRole = overrides.role ?? roleFilter;
    const nextStatus = overrides.status ?? statusFilter;
    const nextSearch = overrides.search ?? search;

    setLoading(true);
    setUsersError('');
    try {
      const result = await fetchUsers({
        page,
        limit: ADMIN_TABLE_PAGE_SIZE,
        role: nextRole,
        status: nextStatus,
        search: nextSearch.trim(),
      });
      if (!guard.isLatest(token)) return;
      setUsers(result.data || []);
      setPagination(result.pagination || { page, limit: ADMIN_TABLE_PAGE_SIZE, total: 0, totalPages: 1 });
      setUpdatedAt(new Date());
      if (overrides.announce) notify('success', 'Đã làm mới danh sách người dùng.');
    } catch (error) {
      if (!guard.isLatest(token)) return;
      setUsersError(error.message);
      if (overrides.announce) notify('error', error.message);
    } finally {
      if (guard.isLatest(token)) setLoading(false);
    }
  }, [beginLatestRequest, notify, roleFilter, search, statusFilter]);

  const refreshUserDirectory = useCallback(async (page = pagination.page, overrides = {}) => {
    await Promise.all([loadUsers(page, overrides), loadUserStatistics()]);
  }, [loadUserStatistics, loadUsers, pagination.page]);

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError('');
    try {
      const result = await fetchRoles();
      const catalog = normalizeEditableRoleCatalog(result.data || []);
      setRoles(catalog);
      return catalog;
    } catch (error) {
      setRoles([]);
      setRolesError(ROLE_CATALOG_ERROR);
      throw new Error(ROLE_CATALOG_ERROR, { cause: error });
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadUsers(1), 350);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    const timer = window.setTimeout(loadUserStatistics, 0);
    return () => window.clearTimeout(timer);
  }, [loadUserStatistics]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadRoles().catch(() => {}), 0);
    return () => window.clearTimeout(timer);
  }, [loadRoles]);

  function requireAdminSession() {
    const access = readStoredAdminAccess();
    if (access.authenticated && access.isAdmin) return true;
    notify('error', 'Bạn cần đăng nhập bằng tài khoản quản trị viên để tạo, cập nhật hoặc quản lý người dùng.');
    return false;
  }

  function openCreateModal() {
    if (requireAdminSession()) setModal({ mode: 'create' });
  }

  async function openRoleModal(user) {
    if (!requireAdminSession()) return;
    try {
      const catalog = rolesError || roles.length === 0
        ? await loadRoles()
        : normalizeEditableRoleCatalog(roles);
      buildRoleMutationPlan(user.roles || [], user.roles || [], catalog);
      setRoleSyncBlocked(false);
      setRoleUser(user);
    } catch (error) {
      notify('error', error.message);
    }
  }

  async function openUserDetail(userId) {
    setSelectedUser(null);
    setDetailLoading(true);
    try {
      const detail = await fetchManagedUser(userId);
      setSelectedUser(detail);
    } catch (error) {
      notify('error', error.message);
      if (isManagedUserNotFound(error)) await loadUsers(pagination.page);
    } finally {
      setDetailLoading(false);
    }
  }

  async function openLibrarianWorkEditor(user) {
    if (!requireAdminSession() || !user?.roles?.includes('LIBRARIAN')) return;
    try {
      const detail = await fetchManagedUser(user.userId);
      if (!detail.roles?.includes('LIBRARIAN')) {
        notify('error', 'Chỉ có thể cập nhật thông tin công việc của tài khoản Thủ thư.');
        await loadUsers(pagination.page);
        return;
      }
      setSelectedUser(null);
      setModal({ mode: 'edit', user: detail });
    } catch (error) {
      notify('error', error.message);
      if (isManagedUserNotFound(error)) await loadUsers(pagination.page);
    }
  }

  async function submitModal(form) {
    if (!requireAdminSession()) throw new Error('Cần đăng nhập bằng tài khoản quản trị viên.');
    try {
      if (modal?.mode === 'edit') {
        await updateManagedUser(modal.user.userId, {
          expectedUpdatedAt: modal.user.updatedAt,
          department: form.department.trim() || null,
          specialization: form.specialization.trim() || null,
        });
        notify('success', 'Đã cập nhật thông tin công việc của Thủ thư.');
      } else {
        await createManagedUser({
          type: form.type,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          ...(form.type === 'librarian' ? {
            department: form.department.trim() || null,
            specialization: form.specialization.trim() || null,
          } : {}),
        });
        notify('success', 'Đã tạo tài khoản chưa kích hoạt và gửi email thiết lập mật khẩu.');
      }
      const targetPage = modal?.mode === 'edit' ? pagination.page : 1;
      setModal(null);
      setSelectedUser(null);
      await refreshUserDirectory(targetPage);
    } catch (error) {
      notify('error', error.message);
      throw error;
    }
  }

  async function deactivateUser(user) {
    if (!requireAdminSession()) return;
    if (!window.confirm(`Vô hiệu hóa tài khoản ${user.fullName || user.email}? Người dùng sẽ không thể đăng nhập.`)) return;
    try {
      await deactivateManagedUser(user.userId, user.updatedAt);
      notify('success', 'Đã vô hiệu hóa tài khoản người dùng.');
      setSelectedUser(null);
      await refreshUserDirectory(pagination.page);
    } catch (error) {
      notify('error', error.message);
    }
  }

  async function saveRoles(nextRoles) {
    if (!roleUser) return;
    if (!requireAdminSession()) throw new Error('Cần đăng nhập bằng tài khoản quản trị viên.');

    const { assignments, revocations } = buildRoleMutationPlan(roleUser.roles || [], nextRoles, roles);
    if (assignments.length === 0 && revocations.length === 0) {
      setRoleUser(null);
      setRoleSyncBlocked(false);
      return;
    }

    try {
      for (const { roleId } of assignments) {
        await assignManagedUserRole(roleUser.userId, roleId);
      }
      for (const { roleId } of revocations) {
        await revokeManagedUserRole(roleUser.userId, roleId);
      }
      notify('success', 'Đã cập nhật vai trò người dùng.');
      setRoleUser(null);
      setRoleSyncBlocked(false);
      setSelectedUser(null);
      await refreshUserDirectory();
    } catch (error) {
      try {
        const refreshedUser = await fetchManagedUser(roleUser.userId);
        setRoleUser(refreshedUser);
        setRoleSyncBlocked(false);
        if (selectedUser?.userId === refreshedUser.userId) setSelectedUser(refreshedUser);
      } catch {
        setRoleSyncBlocked(true);
      }
      notify('error', error.message);
      throw error;
    }
  }

  function resetFilters() {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    loadUsers(1, { search: '', role: 'ALL', status: 'ALL' });
  }

  const hasFilters = Boolean(search.trim()) || roleFilter !== 'ALL' || statusFilter !== 'ALL';
  const statCards = [
    { label: 'Tổng người dùng', value: statistics.total, icon: Users },
    { label: 'Hoạt động', value: statistics.active, icon: Check },
    { label: 'Thủ thư', value: statistics.librarians, icon: UserCog },
    { label: 'Chưa kích hoạt / Vô hiệu', value: statistics.inactive, icon: PowerOff },
  ];

  function renderActions(user) {
    const canDeactivate = ['ACTIVE', 'LOCKED'].includes(user.status);
    return (
      <div className="admin-user-actions" onClick={(event) => event.stopPropagation()}>
        {user.roles?.includes('LIBRARIAN') ? (
          <AdminActionButton icon={Pencil} label="Cập nhật công việc" onClick={() => openLibrarianWorkEditor(user)} />
        ) : null}
        <AdminActionButton icon={Shield} label="Phân quyền" onClick={() => openRoleModal(user)} />
        <AdminActionButton
          icon={PowerOff}
          label="Vô hiệu hóa"
          tone="danger"
          disabled={!canDeactivate}
          title={!canDeactivate ? 'Tài khoản này đã ngừng hoạt động.' : undefined}
          onClick={() => deactivateUser(user)}
        />
      </div>
    );
  }

  return (
    <section className="admin-users">
      <AdminPageHeader
        eyebrow="FE11 · Tài khoản và vai trò"
        title="Quản lý người dùng"
        refreshing={loading}
        onRefresh={() => refreshUserDirectory(pagination.page, { announce: true })}
        primaryAction={<AdminActionButton icon={Plus} label="Thêm người dùng" tone="primary" onClick={openCreateModal} />}
      />

      <section className="admin-user-stats" aria-label="Thống kê người dùng">
        {statCards.map(({ label, value, icon: Icon }) => (
          <article key={label}><Icon aria-hidden="true" /><div><span>{label}</span><strong>{value}</strong></div></article>
        ))}
      </section>

      <div className="admin-section-status" aria-live="polite">
        <span>{updatedAt ? `Cập nhật lần cuối lúc ${updatedAt.toLocaleTimeString('vi-VN')}` : 'Chưa tải danh sách người dùng.'}</span>
        <div className="admin-user-status-errors">
          {usersError ? <strong>Danh sách: {usersError}</strong> : null}
          {statisticsError ? <strong>Thống kê: {statisticsError}</strong> : null}
          {statisticsLoading ? <span>Đang cập nhật thống kê...</span> : null}
        </div>
      </div>

      <AdminFilterBar
        actions={(
          <>
            <AdminActionButton icon={Search} label="Tìm kiếm" tone="primary" disabled={loading} onClick={() => loadUsers(1)} />
            {hasFilters ? <AdminActionButton icon={FilterX} label="Xóa lọc" onClick={resetFilters} /> : null}
          </>
        )}
      >
        <label className="admin-field admin-field--search">
          <span>Tìm người dùng</span>
          <input value={search} placeholder="Tìm theo tên, email hoặc ID..." onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className="admin-field">
          <span>Vai trò</span>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="ALL">Tất cả vai trò</option><option value="ADMIN">Quản trị viên</option>
            <option value="LIBRARIAN">Thủ thư</option><option value="MEMBER">Thành viên</option>
          </select>
        </label>
        <label className="admin-field">
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Chưa kích hoạt / Vô hiệu</option><option value="LOCKED">Bị khóa</option>
          </select>
        </label>
      </AdminFilterBar>

      <section className="admin-user-directory">
        <div className="admin-user-table" aria-label="Danh sách người dùng dạng bảng">
          <table aria-label="Danh sách người dùng">
            <thead><tr>
              <th>Người dùng</th><th>Username</th><th>Số điện thoại</th><th>Vai trò</th>
              <th>Trạng thái</th><th>Ngày tạo</th><th>Lần đăng nhập</th><th>Thao tác</th>
            </tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.userId} onClick={() => openUserDetail(user.userId)}>
                <td><button className="admin-user-identity" type="button" onClick={(event) => { event.stopPropagation(); openUserDetail(user.userId); }}><UserAvatar user={user} /><span><strong>{user.fullName || 'Chưa cập nhật tên'}</strong><small>#{user.userId} · {user.email}</small></span></button></td>
                <td className="admin-user-cell--truncate" title={user.username || '-'}>{user.username || '-'}</td>
                <td>{user.phoneNumber || '-'}</td>
                <td><div className="admin-badge-row">{(user.roles || []).map((role) => <RoleBadge key={role} role={role} />)}</div></td>
                <td><StatusBadge status={user.status} /></td>
                <td>{formatAdminDate(user.createdAt)}</td>
                <td>{formatAdminDate(user.lastLoginAt)}</td>
                <td>{renderActions(user)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="admin-user-cards" aria-label="Danh sách người dùng dạng thẻ">
          {users.map((user) => (
            <article key={user.userId} className="admin-user-card">
              <button type="button" className="admin-user-card-summary" onClick={() => openUserDetail(user.userId)}>
                <UserAvatar user={user} />
                <span><strong>{user.fullName || 'Chưa cập nhật tên'}</strong><small>{user.email}</small></span>
                <StatusBadge status={user.status} />
              </button>
              <dl>
                <div><dt>Vai trò</dt><dd><div className="admin-badge-row">{(user.roles || []).map((role) => <RoleBadge key={role} role={role} />)}</div></dd></div>
                <div><dt>Lần đăng nhập</dt><dd>{formatAdminDate(user.lastLoginAt)}</dd></div>
              </dl>
              {renderActions(user)}
            </article>
          ))}
        </div>

        {!loading && users.length === 0 ? (
          <AdminEmptyState icon={Users} title="Không tìm thấy người dùng" description="Hãy điều chỉnh bộ lọc hoặc tạo tài khoản mới." />
        ) : null}
        {loading && users.length === 0 ? (
          <AdminEmptyState icon={Users} title="Đang tải danh sách người dùng" description="Dữ liệu sẽ xuất hiện sau khi đồng bộ hoàn tất." />
        ) : null}
        <AdminPagination page={pagination.page} totalItems={pagination.total} pageSize={pagination.limit || ADMIN_TABLE_PAGE_SIZE} onPageChange={loadUsers} />
      </section>

      {detailLoading ? <div className="admin-detail-loading" role="status">Đang tải chi tiết người dùng...</div> : null}
      {selectedUser ? <UserDetailDrawer user={selectedUser} onClose={() => setSelectedUser(null)} onEditWork={openLibrarianWorkEditor} onManageRoles={openRoleModal} onDeactivate={deactivateUser} /> : null}
      {modal ? <UserEditorModal mode={modal.mode} user={modal.user} onClose={() => setModal(null)} onSubmit={submitModal} /> : null}
      {roleUser ? <UserRoleModal user={roleUser} roles={roles} savingBlocked={rolesLoading || roleSyncBlocked} onClose={() => { setRoleUser(null); setRoleSyncBlocked(false); }} onSave={saveRoles} /> : null}
    </section>
  );
}
