import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  ClipboardList,
  Edit2,
  FilterX,
  LayoutDashboard,
  LogOut,
  Mail,
  Phone,
  Plus,
  PowerOff,
  RefreshCw,
  Search,
  Shield,
  UserCog,
  Users,
  X,
} from 'lucide-react';

import {
  createManagedUser,
  deactivateManagedUser,
  assignManagedUserRole,
  ensureManagedUserAccess,
  fetchAuditLogs,
  fetchRoles,
  fetchUsers,
  revokeManagedUserRole,
  updateManagedUser,
} from '../api/userManagementApi';

const roleLabels = {
  ADMIN: 'Admin',
  LIBRARIAN: 'Librarian',
  MEMBER: 'Member',
  GUEST: 'Guest',
};

const statusLabels = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  LOCKED: 'Locked',
};
const editableRoles = ['ADMIN', 'LIBRARIAN', 'MEMBER'];
const allowDevUserManagementWithoutLogin = import.meta.env.MODE !== 'production';
const permissionRows = [
  { name: 'View users', admin: true, librarian: false, member: false },
  { name: 'Create accounts', admin: true, librarian: false, member: false },
  { name: 'Update accounts', admin: true, librarian: false, member: false },
  { name: 'Deactivate accounts', admin: true, librarian: false, member: false },
  { name: 'Manage roles', admin: true, librarian: false, member: false },
  { name: 'View audit logs', admin: true, librarian: false, member: false },
];

function validateUserForm(form) {
  const errors = {};
  const email = form.email.trim();
  const fullName = form.fullName.trim();
  const phone = form.phone.trim();
  const address = form.address.trim();

  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.length > 100) {
    errors.fullName = 'Full name must be at most 100 characters.';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (phone && (phone.length > 20 || !/^[0-9+\-\s()]+$/.test(phone))) {
    errors.phone = 'Phone number is invalid.';
  }

  if (address.length > 255) {
    errors.address = 'Address must be at most 255 characters.';
  }

  return errors;
}

function getStoredAdminUser() {
  const rawUser = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');

  if (!rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser);
    const roles = Array.isArray(user.roles) ? user.roles.map((role) => String(role || '').toUpperCase()) : [];
    return roles.includes('ADMIN') ? user : null;
  } catch {
    return null;
  }
}

function getPrimaryRole(user) {
  return user.roles?.includes('ADMIN')
    ? 'ADMIN'
    : user.roles?.includes('LIBRARIAN')
      ? 'LIBRARIAN'
      : 'MEMBER';
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function RoleBadge({ role }) {
  return <span className={`um-badge role-${role.toLowerCase()}`}>{roleLabels[role] || role}</span>;
}

function StatusBadge({ status }) {
  return <span className={`um-badge status-${status.toLowerCase()}`}>{statusLabels[status] || status}</span>;
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`um-toast ${toast.type}`}>
      {toast.type === 'error' ? <AlertTriangle size={17} /> : <Check size={17} />}
      <span>{toast.message}</span>
    </div>
  );
}

function UserModal({ mode, user, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    type: user?.roles?.includes('LIBRARIAN') ? 'librarian' : 'member',
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const title = isEdit ? 'Update User' : 'Create User';

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateUserForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="um-modal-backdrop" onMouseDown={onClose}>
      <form className="um-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <div className="um-modal-header">
          <div>
            <p>{isEdit ? 'FE11 update' : 'FE11 create'}</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="um-icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="um-modal-body">
          {!isEdit && (
            <label>
              Account type
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                <option value="member">Member</option>
                <option value="librarian">Librarian</option>
              </select>
            </label>
          )}

          <label>
            Full name
            <input
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            />
            {errors.fullName && <span className="um-field-error">{errors.fullName}</span>}
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            {errors.email && <span className="um-field-error">{errors.email}</span>}
          </label>

          <label>
            Phone
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            {errors.phone && <span className="um-field-error">{errors.phone}</span>}
          </label>

          <label>
            Address
            <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            {errors.address && <span className="um-field-error">{errors.address}</span>}
          </label>

          <div className="um-note">
            Admin-created accounts are active immediately. Password setup can be completed later.
          </div>
        </div>

        <div className="um-modal-actions">
          <button type="button" className="um-secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="um-primary-button" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
}

function RoleModal({ user, roles, onClose, onSave }) {
  const [selectedRoles, setSelectedRoles] = useState(() => new Set(user.roles || []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const availableRoles = roles.length > 0 ? roles : editableRoles.map((roleName) => ({ roleName }));

  function toggleRole(roleName) {
    const nextRoles = new Set(selectedRoles);

    if (nextRoles.has(roleName)) {
      nextRoles.delete(roleName);
    } else {
      nextRoles.add(roleName);
    }

    setSelectedRoles(nextRoles);
    setError('');
  }

  async function handleSave(event) {
    event.preventDefault();

    if (selectedRoles.size === 0) {
      setError('Every user must keep at least one role.');
      return;
    }

    setSaving(true);
    try {
      await onSave(Array.from(selectedRoles));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="um-modal-backdrop" onMouseDown={onClose}>
      <form className="um-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSave}>
        <div className="um-modal-header">
          <div>
            <p>FE11 roles</p>
            <h2>Manage Roles</h2>
          </div>
          <button type="button" className="um-icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="um-modal-body">
          <div className="um-role-user">
            <strong>{user.fullName || user.email}</strong>
            <span>{user.email}</span>
          </div>

          <div className="um-role-list">
            {availableRoles
              .filter((role) => role.roleName !== 'GUEST')
              .map((role) => (
                <label className="um-role-option" key={role.roleName}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.has(role.roleName)}
                    onChange={() => toggleRole(role.roleName)}
                  />
                  <RoleBadge role={role.roleName} />
                </label>
              ))}
          </div>

          {error && <div className="um-form-error">{error}</div>}
        </div>

        <div className="um-modal-actions">
          <button type="button" className="um-secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="um-primary-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save roles'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Sidebar({ activeSection, onSectionChange, onLogout }) {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'users', icon: Users, label: 'All Users' },
    { id: 'roles', icon: Shield, label: 'Permissions' },
    { id: 'audit', icon: ClipboardList, label: 'Audit Logs' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
  ];

  return (
    <aside className="um-sidebar">
      <div className="um-brand">
        <div className="um-brand-mark">
          <BookOpen size={22} />
        </div>
        <div>
          <strong>LibraryMS</strong>
          <span>Admin Console</span>
        </div>
      </div>

      <nav className="um-nav">
        {items.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            className={activeSection === id ? 'active' : ''}
            onClick={() => onSectionChange(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="um-sidebar-footer">
        <button type="button" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function UserManagement() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modal, setModal] = useState(null);
  const [roleUser, setRoleUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [toast, setToast] = useState(null);
  const hasActiveFilters = search.trim() || roleFilter !== 'ALL' || statusFilter !== 'ALL';
  const isUserDirectorySection = activeSection === 'users';
  const sectionMeta = {
    dashboard: { eyebrow: 'Admin Overview', title: 'Dashboard' },
    users: { eyebrow: 'User Directory', title: 'All Users' },
    roles: { eyebrow: 'Access Control', title: 'Permissions' },
    audit: { eyebrow: 'System Trace', title: 'Audit Logs' },
    reports: { eyebrow: 'Admin Insights', title: 'Reports' },
  }[activeSection];

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('authUser');
    navigate('/login', { replace: true });
  }

  async function requireAdminSession() {
    if (allowDevUserManagementWithoutLogin) {
      return true;
    }

    try {
      if (getStoredAdminUser() || (await ensureManagedUserAccess())) {
        return true;
      }
    } catch {
      // Fall through to the shared login prompt below.
    }

    setToast({ type: 'error', message: 'You need to login with an Admin account to create, update, or manage users.' });
    return false;
  }

  async function openCreateModal() {
    if (await requireAdminSession()) {
      setModal({ mode: 'create' });
    }
  }

  async function openEditModal(user) {
    if (await requireAdminSession()) {
      setModal({ mode: 'edit', user });
    }
  }

  async function openRoleModal(user) {
    if (await requireAdminSession()) {
      setRoleUser(user);
    }
  }

  function handleSectionChange(section) {
    setActiveSection(section);
    setSelectedUser(null);

    if (section === 'users') {
      setRoleFilter('ALL');
      setStatusFilter('ALL');
      setSearch('');
    }
  }

  const stats = useMemo(
    () => [
      { label: 'Total', value: pagination.total, icon: Users },
      { label: 'Active', value: users.filter((user) => user.status === 'ACTIVE').length, icon: Check },
      { label: 'Librarians', value: users.filter((user) => user.roles?.includes('LIBRARIAN')).length, icon: UserCog },
      { label: 'Inactive', value: users.filter((user) => user.status === 'INACTIVE').length, icon: PowerOff },
    ],
    [pagination.total, users]
  );
  const roleSummary = useMemo(
    () =>
      roles
        .filter((role) => role.roleName !== 'GUEST')
        .map((role) => ({
          ...role,
          count: users.filter((user) => user.roles?.includes(role.roleName)).length,
        })),
    [roles, users]
  );
  const roleChart = useMemo(() => {
    const colors = ['#7c3aed', '#0f766e', '#2f80ed'];
    const total = Math.max(roleSummary.reduce((sum, role) => sum + role.count, 0), 1);
    const chart = roleSummary.reduce(
      (acc, role, index) => {
        const start = acc.cursor;
        const end = start + (role.count / total) * 360;
        return {
          cursor: end,
          segments: [...acc.segments, `${colors[index % colors.length]} ${start}deg ${end}deg`],
        };
      },
      { cursor: 0, segments: [] }
    );

    return {
      total: total === 1 && roleSummary.every((role) => role.count === 0) ? 0 : total,
      background: chart.segments.length ? `conic-gradient(${chart.segments.join(', ')})` : '#e5e7eb',
    };
  }, [roleSummary]);
  const recentUsers = users.slice(0, 5);
  async function loadUsers(page = pagination.page, overrides = {}) {
    const nextRole = overrides.role ?? roleFilter;
    const nextStatus = overrides.status ?? statusFilter;
    const nextSearch = overrides.search ?? search;

    setLoading(true);
    try {
      const result = await fetchUsers({
        page,
        limit: pagination.limit,
        role: nextRole,
        status: nextStatus,
        search: nextSearch.trim(),
      });
      setUsers(result.data || []);
      setPagination(result.pagination || { page, limit: pagination.limit, total: 0, totalPages: 1 });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1);
    }, 350);

    return () => clearTimeout(timer);
  // loadUsers reads the latest filter state through this effect's dependency list.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchRoles()
      .then((result) => setRoles(result.data || []))
      .catch(() => setRoles(editableRoles.map((roleName) => ({ roleName }))));
  }, []);

  useEffect(() => {
    if (activeSection !== 'audit') {
      return;
    }

    if (!getStoredAdminUser()) {
      const timer = setTimeout(() => {
        setAuditLogs([]);
        setAuditError('Login with an Admin account to view audit logs.');
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setAuditLoading(true);
      setAuditError('');
    }, 0);

    fetchAuditLogs(30)
      .then((result) => {
        setAuditLogs(result.data || []);
        setAuditError('');
      })
      .catch((error) => setAuditError(error.message))
      .finally(() => setAuditLoading(false));

    return () => clearTimeout(timer);
  }, [activeSection]);

  function clearFilters() {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    loadUsers(1, { search: '', role: 'ALL', status: 'ALL' });
  }

  async function submitModal(form) {
    if (!(await requireAdminSession())) {
      throw new Error('Admin login required.');
    }

    try {
      if (modal?.mode === 'edit') {
        await updateManagedUser(modal.user.userId, {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        });
        setToast({ type: 'success', message: 'User information updated.' });
      } else {
        await createManagedUser({
          type: form.type,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        });
        setToast({ type: 'success', message: 'Active account created and setup email queued.' });
      }

      setModal(null);
      setSelectedUser(null);
      await loadUsers(1);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
      throw error;
    }
  }

  async function deactivateUser(user) {
    if (!(await requireAdminSession())) {
      return;
    }

    if (!window.confirm(`Deactivate ${user.fullName || user.email}?`)) {
      return;
    }

    try {
      await deactivateManagedUser(user.userId);
      setToast({ type: 'success', message: 'User account deactivated.' });
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  }

  async function saveRoles(nextRoles) {
    if (!roleUser) {
      return;
    }

    if (!(await requireAdminSession())) {
      throw new Error('Admin login required.');
    }

    try {
      const currentRoles = new Set(roleUser.roles || []);
      const desiredRoles = new Set(nextRoles);

      for (const roleName of desiredRoles) {
        if (!currentRoles.has(roleName)) {
          await assignManagedUserRole(roleUser.userId, roleName);
        }
      }

      for (const roleName of currentRoles) {
        if (!desiredRoles.has(roleName)) {
          await revokeManagedUserRole(roleUser.userId, roleName);
        }
      }

      setToast({ type: 'success', message: 'Roles updated.' });
      setRoleUser(null);
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      setToast({ type: 'error', message: error.message });
      throw error;
    }
  }

  return (
    <div className="um-shell">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
      />

      <main className="um-main">
        <header className="um-topbar">
          <div>
            <p>{sectionMeta.eyebrow}</p>
            <h1>{sectionMeta.title}</h1>
          </div>
          <div className="um-actions">
            <button className="um-secondary-button" onClick={() => loadUsers()}>
              <RefreshCw size={16} />
              Refresh
            </button>
            {isUserDirectorySection && (
              <button className="um-primary-button" onClick={openCreateModal}>
                <Plus size={16} />
                Add user
              </button>
            )}
          </div>
        </header>

        {(activeSection === 'dashboard' || isUserDirectorySection) && <section className="um-stats">
          {stats.map(({ label, value, icon: Icon }) => (
            <div className="um-stat" key={label}>
              <Icon size={20} />
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            </div>
          ))}
        </section>}

        {activeSection === 'dashboard' && (
          <section className="um-panel-grid">
            <div className="um-panel">
              <h2>Recent Accounts</h2>
              <div className="um-mini-list">
                {recentUsers.map((user) => (
                  <button key={user.userId} type="button" onClick={() => setSelectedUser(user)}>
                    <span>{user.fullName || user.email}</span>
                    <RoleBadge role={getPrimaryRole(user)} />
                  </button>
                ))}
              </div>
            </div>
            <div className="um-panel">
              <h2>Admin Shortcuts</h2>
              <div className="um-shortcuts">
                <button type="button" onClick={() => handleSectionChange('users')}>Review all users</button>
                <button type="button" onClick={() => handleSectionChange('roles')}>Manage role assignments</button>
                <button type="button" onClick={() => handleSectionChange('audit')}>Check audit trail</button>
              </div>
            </div>
          </section>
        )}

        {isUserDirectorySection && <section className="um-toolbar">
          <div className="um-search">
            <Search size={18} />
            <input
              value={search}
              placeholder="Search name, email, username, ID"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  loadUsers(1);
                }
              }}
            />
          </div>

          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="ALL">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="LIBRARIAN">Librarian</option>
            <option value="MEMBER">Member</option>
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOCKED">Locked</option>
          </select>

          <button className="um-secondary-button" onClick={() => loadUsers(1)}>
            Search
          </button>
          {hasActiveFilters && (
            <button className="um-secondary-button" onClick={clearFilters}>
              <FilterX size={16} />
              Clear
            </button>
          )}
        </section>}

        {isUserDirectorySection && <section className="um-content">
          <table className="um-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId} onClick={() => setSelectedUser(user)}>
                  <td>
                    <div className="um-user-cell">
                      <div className={`um-avatar ${getPrimaryRole(user).toLowerCase()}`}>
                        {(user.fullName || user.email || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <strong>{user.fullName || 'No name'}</strong>
                        <span>#{user.userId} - {user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.username || '-'}</td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    <div className="um-badge-row">
                      {(user.roles || []).map((role) => (
                        <RoleBadge key={role} role={role} />
                      ))}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="um-row-actions" onClick={(event) => event.stopPropagation()}>
                      <button className="um-icon-button" title="Edit" onClick={() => openEditModal(user)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="um-icon-button" title="Manage roles" onClick={() => openRoleModal(user)}>
                        <Shield size={16} />
                      </button>
                      <button
                        className="um-icon-button danger"
                        title="Deactivate"
                        disabled={user.status !== 'ACTIVE'}
                        onClick={() => deactivateUser(user)}
                      >
                        <PowerOff size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && users.length === 0 && <div className="um-empty">No users match your filters.</div>}
          {loading && <div className="um-empty">Loading users...</div>}
        </section>}

        {isUserDirectorySection && <footer className="um-pagination">
          <button
            className="um-secondary-button"
            disabled={pagination.page <= 1}
            onClick={() => loadUsers(pagination.page - 1)}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
          <button
            className="um-secondary-button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadUsers(pagination.page + 1)}
          >
            Next
          </button>
        </footer>}

        {activeSection === 'roles' && (
          <section className="um-panel-grid permissions">
            <div className="um-panel">
              <h2>Role Summary</h2>
              <div className="um-role-summary">
                {roleSummary.map((role) => (
                  <button
                    type="button"
                    key={role.roleName}
                    onClick={() => {
                      setActiveSection('users');
                      setRoleFilter(role.roleName);
                      setStatusFilter('ALL');
                      setSearch('');
                    }}
                  >
                    <RoleBadge role={role.roleName} />
                    <strong>{role.count}</strong>
                    <span>assigned account{role.count === 1 ? '' : 's'}</span>
                  </button>
                ))}
              </div>
              <div className="um-note">
                Assign and revoke roles from the shield action on any user row or detail drawer.
              </div>
            </div>

            <div className="um-panel">
              <h2>Permission Matrix</h2>
              <table className="um-permission-table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Admin</th>
                    <th>Librarian</th>
                    <th>Member</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionRows.map((permission) => (
                    <tr key={permission.name}>
                      <td>{permission.name}</td>
                      <td>{permission.admin ? 'Yes' : '-'}</td>
                      <td>{permission.librarian ? 'Yes' : '-'}</td>
                      <td>{permission.member ? 'Yes' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === 'audit' && (
          <section className="um-content">
            <table className="um-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>IP</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.logId}>
                    <td>{log.action}</td>
                    <td>{log.actorName || log.actorEmail || '-'}</td>
                    <td>{log.targetName || log.targetEmail || log.targetId || '-'}</td>
                    <td>{log.ipAddress || '-'}</td>
                    <td>{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLoading && <div className="um-empty">Loading audit logs...</div>}
            {!auditLoading && auditError && (
              <div className="um-empty">
                <strong>Audit logs unavailable</strong>
                <span>{auditError}</span>
              </div>
            )}
            {!auditLoading && !auditError && auditLogs.length === 0 && (
              <div className="um-empty">No audit log entries yet.</div>
            )}
          </section>
        )}

        {activeSection === 'reports' && (
          <section className="um-panel-grid">
            <div className="um-panel">
              <h2>Status Report</h2>
              <div className="um-report-bars">
                {['ACTIVE', 'INACTIVE', 'LOCKED'].map((status) => {
                  const count = users.filter((user) => user.status === status).length;
                  const pct = users.length ? Math.round((count / users.length) * 100) : 0;
                  return (
                    <div key={status}>
                      <span>{statusLabels[status]}</span>
                      <strong>{count}</strong>
                      <div><i style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="um-panel">
              <h2>Role Distribution</h2>
              <div className="um-chart-card">
                <div className="um-donut" style={{ background: roleChart.background }}>
                  <span>{roleChart.total}</span>
                </div>
                <div className="um-role-summary compact">
                  {roleSummary.map((role) => (
                    <div key={role.roleName}>
                      <RoleBadge role={role.roleName} />
                      <strong>{role.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {selectedUser && (
        <aside className="um-drawer">
          <button className="um-icon-button" onClick={() => setSelectedUser(null)} aria-label="Close details">
            <X size={18} />
          </button>
          <div className={`um-large-avatar ${getPrimaryRole(selectedUser).toLowerCase()}`}>
            {(selectedUser.fullName || selectedUser.email || '?').slice(0, 1).toUpperCase()}
          </div>
          <h2>{selectedUser.fullName || 'No name'}</h2>
          <div className="um-badge-row">
            {(selectedUser.roles || []).map((role) => (
              <RoleBadge key={role} role={role} />
            ))}
            <StatusBadge status={selectedUser.status} />
          </div>
          <div className="um-detail-list">
            <p>
              <Mail size={16} />
              {selectedUser.email}
            </p>
            <p>
              <Shield size={16} />
              {selectedUser.username || '-'}
            </p>
            <p>
              <Phone size={16} />
              {selectedUser.phone || '-'}
            </p>
            <p>{selectedUser.address || '-'}</p>
            <p>
              <Calendar size={16} />
              Created {formatDate(selectedUser.createdAt)}
            </p>
          </div>
          <div className="um-drawer-actions">
            <button className="um-primary-button" onClick={() => openEditModal(selectedUser)}>
              <Edit2 size={16} />
              Edit
            </button>
            <button className="um-secondary-button" onClick={() => openRoleModal(selectedUser)}>
              <Shield size={16} />
              Roles
            </button>
            <button
              className="um-danger-button"
              disabled={selectedUser.status !== 'ACTIVE'}
              onClick={() => deactivateUser(selectedUser)}
            >
              <PowerOff size={16} />
              Deactivate
            </button>
          </div>
        </aside>
      )}

      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          onClose={() => setModal(null)}
          onSubmit={submitModal}
        />
      )}

      {roleUser && (
        <RoleModal
          user={roleUser}
          roles={roles}
          onClose={() => setRoleUser(null)}
          onSave={saveRoles}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <style>{`
        .um-shell { min-height: 100vh; background: #f5f7fb; color: #1f2937; display: flex; font-family: Inter, system-ui, sans-serif; }
        .um-sidebar { width: 248px; background: #17202a; color: #edf2f7; padding: 22px 16px; display: flex; flex-direction: column; gap: 28px; position: sticky; top: 0; height: 100vh; }
        .um-brand { display: flex; gap: 12px; align-items: center; padding: 4px 6px 18px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .um-brand-mark { width: 42px; height: 42px; border-radius: 8px; display: grid; place-items: center; background: #2f80ed; color: #fff; }
        .um-brand strong, .um-brand span { display: block; }
        .um-brand span { color: #9fb0c3; font-size: 12px; margin-top: 2px; }
        .um-nav, .um-sidebar-footer { display: flex; flex-direction: column; gap: 8px; }
        .um-nav button { min-height: 42px; border-radius: 8px; color: #cbd5e1; display: flex; align-items: center; gap: 10px; padding: 0 12px; border: 0; background: transparent; cursor: pointer; font-size: 16px; text-align: left; }
        .um-nav button.active, .um-nav button:hover { background: #243244; color: #fff; }
        .um-sidebar-footer { margin-top: auto; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px; }
        .um-sidebar-footer button { min-height: 42px; border-radius: 8px; color: #cbd5e1; display: flex; align-items: center; gap: 10px; padding: 0 12px; border: 0; background: transparent; cursor: pointer; font-size: 16px; text-align: left; }
        .um-sidebar-footer button:hover { background: #243244; color: #fff; }
        .um-main { flex: 1; min-width: 0; padding: 26px 30px; }
        .um-topbar, .um-toolbar, .um-content, .um-stat { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
        .um-topbar { padding: 20px 22px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .um-topbar p { margin: 0 0 4px; color: #2f80ed; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .um-topbar h1 { margin: 0; font-size: 26px; letter-spacing: 0; }
        .um-actions, .um-row-actions, .um-badge-row, .um-drawer-actions, .um-modal-actions { display: flex; align-items: center; gap: 8px; }
        .um-primary-button, .um-secondary-button, .um-danger-button { min-height: 38px; border-radius: 8px; border: 1px solid transparent; padding: 0 14px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
        .um-primary-button { background: #2f80ed; color: #fff; }
        .um-secondary-button { background: #fff; color: #334155; border-color: #d7dee8; }
        .um-danger-button { background: #dc2626; color: #fff; }
        button:disabled { opacity: 0.48; cursor: not-allowed; }
        .um-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
        .um-stat { padding: 16px; display: flex; gap: 12px; align-items: center; }
        .um-stat svg { color: #2f80ed; }
        .um-stat span { display: block; color: #64748b; font-size: 12px; font-weight: 700; }
        .um-stat strong { display: block; font-size: 24px; margin-top: 2px; }
        .um-toolbar { padding: 14px; display: flex; gap: 10px; align-items: center; margin-bottom: 16px; }
        .um-search { flex: 1; min-width: 260px; min-height: 40px; border: 1px solid #d7dee8; border-radius: 8px; padding: 0 12px; display: flex; gap: 8px; align-items: center; color: #64748b; }
        .um-search input, .um-toolbar select, .um-modal input, .um-modal textarea, .um-modal select { border: 1px solid #d7dee8; border-radius: 8px; background: #fff; color: #1f2937; outline: none; }
        .um-search input { border: 0; flex: 1; min-width: 0; }
        .um-toolbar select { min-height: 40px; padding: 0 12px; }
        .um-content { overflow: auto; }
        .um-panel-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .um-panel-grid.permissions { align-items: start; }
        .um-panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; }
        .um-panel h2 { font-size: 18px; margin: 0 0 14px; letter-spacing: 0; }
        .um-mini-list, .um-shortcuts, .um-role-summary, .um-report-bars { display: grid; gap: 10px; }
        .um-mini-list button, .um-shortcuts button, .um-role-summary button { min-height: 44px; border: 1px solid #d7dee8; border-radius: 8px; background: #fff; color: #1f2937; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; cursor: pointer; }
        .um-shortcuts button { justify-content: flex-start; font-weight: 700; }
        .um-role-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 14px; }
        .um-role-summary button { min-height: 76px; flex-direction: column; align-items: flex-start; justify-content: center; }
        .um-role-summary strong { font-size: 24px; }
        .um-role-summary.compact div { border: 1px solid #d7dee8; border-radius: 8px; min-height: 70px; padding: 12px; display: grid; gap: 8px; }
        .um-chart-card { display: grid; grid-template-columns: 180px 1fr; gap: 18px; align-items: center; }
        .um-donut { width: 170px; height: 170px; border-radius: 50%; display: grid; place-items: center; position: relative; }
        .um-donut::after { content: ''; position: absolute; inset: 34px; background: #fff; border-radius: 50%; }
        .um-donut span { position: relative; z-index: 1; font-size: 28px; font-weight: 900; color: #1f2937; }
        .um-report-bars > div { display: grid; grid-template-columns: 90px 36px 1fr; gap: 10px; align-items: center; }
        .um-report-bars span { color: #64748b; font-weight: 800; font-size: 12px; }
        .um-report-bars div div { height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
        .um-report-bars i { display: block; height: 100%; background: #2f80ed; border-radius: inherit; }
        .um-table { width: 100%; border-collapse: collapse; min-width: 850px; }
        .um-permission-table { width: 100%; border-collapse: collapse; }
        .um-permission-table th, .um-permission-table td { border-bottom: 1px solid #eef2f7; padding: 12px 10px; text-align: left; }
        .um-permission-table th { color: #64748b; font-size: 12px; text-transform: uppercase; }
        .um-permission-table td:not(:first-child) { font-weight: 800; color: #15803d; }
        .um-table th { text-align: left; background: #f8fafc; color: #64748b; font-size: 12px; text-transform: uppercase; padding: 13px 16px; border-bottom: 1px solid #e5e7eb; }
        .um-table td { padding: 14px 16px; border-bottom: 1px solid #eef2f7; color: #334155; }
        .um-table tr { cursor: pointer; }
        .um-table tr:hover { background: #f8fbff; }
        .um-user-cell { display: flex; align-items: center; gap: 12px; }
        .um-user-cell strong, .um-user-cell span { display: block; }
        .um-user-cell span { color: #64748b; font-size: 13px; margin-top: 2px; }
        .um-avatar, .um-large-avatar { border-radius: 8px; display: grid; place-items: center; color: #fff; font-weight: 800; background: #64748b; }
        .um-avatar { width: 38px; height: 38px; }
        .um-large-avatar { width: 72px; height: 72px; font-size: 28px; margin-bottom: 14px; }
        .um-avatar.admin, .um-large-avatar.admin { background: #7c3aed; }
        .um-avatar.librarian, .um-large-avatar.librarian { background: #0f766e; }
        .um-avatar.member, .um-large-avatar.member { background: #2f80ed; }
        .um-badge { border-radius: 999px; padding: 4px 9px; font-size: 12px; font-weight: 800; white-space: nowrap; }
        .role-admin { background: #f3e8ff; color: #6d28d9; }
        .role-librarian { background: #ccfbf1; color: #0f766e; }
        .role-member { background: #dbeafe; color: #1d4ed8; }
        .role-guest { background: #f1f5f9; color: #475569; }
        .status-active { background: #dcfce7; color: #15803d; }
        .status-inactive { background: #f1f5f9; color: #475569; }
        .status-locked { background: #fee2e2; color: #b91c1c; }
        .um-icon-button { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #d7dee8; background: #fff; color: #334155; display: grid; place-items: center; cursor: pointer; }
        .um-icon-button.danger { color: #dc2626; }
        .um-empty { padding: 44px; text-align: center; color: #64748b; display: grid; place-items: center; gap: 10px; }
        .um-empty strong { color: #1f2937; font-size: 18px; }
        .um-empty span { max-width: 420px; }
        .um-pagination { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 16px; }
        .um-drawer { width: 330px; background: #fff; border-left: 1px solid #e5e7eb; padding: 24px; position: fixed; right: 0; top: 0; bottom: 0; box-shadow: -20px 0 50px rgba(15,23,42,0.12); z-index: 40; }
        .um-drawer > .um-icon-button { margin-left: auto; }
        .um-drawer h2 { font-size: 22px; margin: 0 0 12px; letter-spacing: 0; }
        .um-detail-list { margin: 24px 0; display: grid; gap: 12px; }
        .um-detail-list p { margin: 0; display: flex; gap: 10px; align-items: center; color: #475569; }
        .um-modal-backdrop { position: fixed; inset: 0; z-index: 60; background: rgba(15,23,42,0.45); display: grid; place-items: center; padding: 20px; }
        .um-modal { width: min(560px, 100%); background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 24px 80px rgba(15,23,42,0.24); }
        .um-modal-header { padding: 18px 22px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .um-modal-header p { margin: 0 0 3px; color: #2f80ed; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .um-modal-header h2 { margin: 0; font-size: 21px; letter-spacing: 0; }
        .um-modal-body { padding: 20px 22px; display: grid; gap: 14px; }
        .um-modal label { display: grid; gap: 6px; font-size: 13px; font-weight: 800; color: #475569; }
        .um-modal input, .um-modal textarea, .um-modal select { min-height: 40px; padding: 9px 11px; font-size: 14px; }
        .um-modal textarea { min-height: 78px; resize: vertical; }
        .um-field-error { color: #dc2626; font-size: 12px; font-weight: 700; }
        .um-form-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 8px; padding: 10px 12px; font-size: 13px; font-weight: 700; }
        .um-note { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; border-radius: 8px; padding: 10px 12px; font-size: 13px; }
        .um-role-user { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc; display: grid; gap: 3px; }
        .um-role-user span { color: #64748b; font-size: 13px; }
        .um-role-list { display: grid; gap: 10px; }
        .um-role-option { min-height: 44px; border: 1px solid #d7dee8; border-radius: 8px; padding: 0 12px; display: flex !important; grid-template-columns: none !important; align-items: center; gap: 10px !important; cursor: pointer; }
        .um-role-option input { width: 16px; min-height: 16px; }
        .um-modal-actions { padding: 16px 22px 20px; justify-content: flex-end; border-top: 1px solid #e5e7eb; }
        .um-toast { position: fixed; right: 24px; bottom: 24px; z-index: 80; min-height: 44px; padding: 0 16px; border-radius: 8px; color: #fff; display: flex; align-items: center; gap: 10px; box-shadow: 0 14px 36px rgba(15,23,42,0.24); }
        .um-toast.success { background: #15803d; }
        .um-toast.error { background: #dc2626; }
        @media (max-width: 900px) {
          .um-shell { display: block; }
          .um-sidebar { width: 100%; height: auto; position: static; }
          .um-nav, .um-sidebar-footer { flex-direction: row; flex-wrap: wrap; }
          .um-topbar, .um-toolbar { align-items: stretch; flex-direction: column; }
          .um-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .um-panel-grid, .um-role-summary { grid-template-columns: 1fr; }
          .um-chart-card { grid-template-columns: 1fr; justify-items: center; }
        }
      `}</style>
    </div>
  );
}

export default UserManagement;
