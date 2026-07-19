import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Activity,
  BarChart2,
  Banknote,
  BookOpen,
  Calendar,
  Clock3,
  Check,
  ClipboardList,
  Eye,
  FileDown,
  Edit2,
  FilterX,
  BookCopy,
  Building2,
  Home,
  Library,
  LayoutDashboard,
  LogOut,
  Mail,
  Phone,
  Plus,
  PowerOff,
  RefreshCw,
  Search,
  Shield,
  Tags,
  UserCog,
  Users,
  X,
} from 'lucide-react';

import { getFineRecords, saveFineRecords } from '../utils/libraryWorkflow';
import { adminApi } from '../api/adminApi';
import { borrowingApi, membershipApi, reportApi } from '../api/libraryFeatureApi';
import LogoutConfirmModal from '../component/layout/LogoutConfirmModal';
import MembershipApplicationsTable from '../component/membership/MembershipApplicationsTable';
import MembershipFilter from '../component/membership/MembershipFilter';
import MembershipReviewModal from '../component/membership/MembershipReviewModal';
import {
  createManagedUser,
  deactivateManagedUser,
  assignManagedUserRole,
  fetchManagedUser,
  fetchRoles,
  fetchUsers,
  revokeManagedUserRole,
  updateManagedUser,
} from '../api/userManagementApi';
import {
  buildPermissionModuleCoverage,
  buildPermissionRoleSummary,
  roleAllowsPermission,
} from '../utils/adminPermissions';
import {
  buildRequestCsv,
  buildRequestListParams,
  collectAllRequestRows,
} from '../utils/adminRequestExport';
import { isManagedUserNotFound } from '../utils/userManagementQuery';

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
const ROLE_CATALOG_ERROR = 'Không thể tải danh mục vai trò. Vui lòng thử lại.';

function normalizeEditableRoleCatalog(roleCatalog = []) {
  const seenNames = new Set();
  const seenIds = new Set();
  const normalized = [];

  for (const role of roleCatalog) {
    const roleName = String(role?.roleName || '').trim().toUpperCase();
    if (!editableRoles.includes(roleName)) continue;

    const roleId = Number(role?.roleId);
    const hasValidRoleId = Number.isInteger(roleId) && roleId > 0;
    if (!hasValidRoleId || seenNames.has(roleName) || seenIds.has(roleId)) {
      throw new Error(ROLE_CATALOG_ERROR);
    }

    seenNames.add(roleName);
    seenIds.add(roleId);
    normalized.push({ roleId, roleName });
  }

  if (normalized.length !== editableRoles.length) {
    throw new Error(ROLE_CATALOG_ERROR);
  }

  return normalized;
}

function buildRoleMutationPlan(currentRoleNames, selectedRoleNames, roleCatalog) {
  const editableCatalog = normalizeEditableRoleCatalog(roleCatalog);
  const currentRoles = new Set(currentRoleNames || []);
  const selectedRoles = new Set(selectedRoleNames || []);
  const assignments = [];
  const revocations = [];

  for (const { roleId, roleName } of editableCatalog) {
    if (selectedRoles.has(roleName) && !currentRoles.has(roleName)) {
      assignments.push({ roleName, roleId });
    }
    if (currentRoles.has(roleName) && !selectedRoles.has(roleName)) {
      revocations.push({ roleName, roleId });
    }
  }

  return { assignments, revocations };
}

const libraryResources = [
  { id: 'books', label: 'Kho sách', icon: BookOpen },
  { id: 'authors', label: 'Tác giả', icon: Users },
  { id: 'publishers', label: 'Nhà xuất bản', icon: Building2 },
  { id: 'categories', label: 'Quản lý danh mục', icon: Tags },
];
const borrowingStatuses = ['ALL', 'REQUESTED', 'BORROWED', 'RETURNED', 'OVERDUE', 'LOST', 'DAMAGED'];
const requestStatuses = ['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED'];
const requestStatusLabels = {
  ALL: 'Tất cả',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};
function normalizeMembershipApplication(application) {
  const applicant = application?.applicant || {};
  return {
    ...application,
    fullName: application.fullName || application.name || application.userName || applicant.fullName || applicant.username,
    email: application.email || applicant.email,
    phone: application.phone || applicant.phone,
  };
}

function normalizeMembershipList(response) {
  const rows = Array.isArray(response)
    ? response
    : response?.items || response?.applications || response?.data || [];

  return {
    items: rows.map(normalizeMembershipApplication),
    totalPages: response?.totalPages || response?.pagination?.totalPages || 1,
    total: response?.total || response?.pagination?.total || rows.length,
  };
}

function validateUserForm(form) {
  const errors = {};
  const email = form.email.trim();
  const fullName = form.fullName.trim();
  const phone = form.phone.trim();
  const address = form.address.trim();
  const department = String(form.department || '').trim();
  const specialization = String(form.specialization || '').trim();

  if (!fullName) {
    errors.fullName = 'Họ và tên là bắt buộc.';
  } else if (fullName.length > 100) {
    errors.fullName = 'Họ và tên không được vượt quá 100 ký tự.';
  }

  if (!email) {
    errors.email = 'Email là bắt buộc.';
  } else if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Vui lòng nhập email hợp lệ.';
  }

  if (phone && (phone.length > 20 || !/^[0-9+\-\s()]+$/.test(phone))) {
    errors.phone = 'Số điện thoại không hợp lệ.';
  }

  if (address.length > 255) {
    errors.address = 'Địa chỉ không được vượt quá 255 ký tự.';
  }

  if (form.type === 'librarian' && department.length > 100) {
    errors.department = 'Phòng ban không được vượt quá 100 ký tự.';
  }

  if (form.type === 'librarian' && specialization.length > 100) {
    errors.specialization = 'Chuyên môn không được vượt quá 100 ký tự.';
  }

  return errors;
}

function readStoredAdminAccess() {
  for (const storage of [localStorage, sessionStorage]) {
    const rawUser = storage.getItem('authUser');
    const hasToken = Boolean(storage.getItem('accessToken') || storage.getItem('refreshToken'));
    if (!rawUser || !hasToken) continue;

    try {
      const user = JSON.parse(rawUser);
      const roles = Array.isArray(user.roles)
        ? user.roles.map((role) => String(role || '').toUpperCase())
        : [];
      return { authenticated: true, isAdmin: roles.includes('ADMIN'), user };
    } catch {
      // Continue in case the other storage contains a valid session.
    }
  }

  return { authenticated: false, isAdmin: false, user: null };
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

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function downloadCsv(filename, rows) {
  const dataRows = Array.isArray(rows) ? rows : [];
  if (!dataRows.length) return false;
  const columns = Object.keys(dataRows[0]);
  const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [columns.join(','), ...dataRows.map((row) => columns.map((column) => escapeCell(row[column])).join(','))].join('\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

function downloadCsvText(filename, csv) {
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
    phone: user?.phoneNumber || '',
    address: user?.address || '',
    department: user?.department || '',
    specialization: user?.specialization || '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const title = isEdit ? 'Cập nhật người dùng' : 'Thêm người dùng';

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
            <p>{isEdit ? 'Cập nhật thông tin' : 'Tạo tài khoản FE11'}</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="um-icon-button" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="um-modal-body">
          {!isEdit && (
            <label>
              Loại tài khoản
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                <option value="member">Thành viên</option>
                <option value="librarian">Thủ thư</option>
              </select>
            </label>
          )}

          <label>
            Họ và tên
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
            Số điện thoại
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            {errors.phone && <span className="um-field-error">{errors.phone}</span>}
          </label>

          <label>
            Địa chỉ
            <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            {errors.address && <span className="um-field-error">{errors.address}</span>}
          </label>

          {form.type === 'librarian' && (
            <>
              <label>
                Phòng ban
                <input
                  value={form.department}
                  onChange={(event) => setForm({ ...form, department: event.target.value })}
                />
                {errors.department && <span className="um-field-error">{errors.department}</span>}
              </label>
              <label>
                Chuyên môn
                <input
                  value={form.specialization}
                  onChange={(event) => setForm({ ...form, specialization: event.target.value })}
                />
                {errors.specialization && <span className="um-field-error">{errors.specialization}</span>}
              </label>
            </>
          )}

          <div className="um-note">
            Tài khoản mới ở trạng thái chưa kích hoạt. Người dùng phải hoàn tất thiết lập mật khẩu qua email trước khi đăng nhập.
          </div>
        </div>

        <div className="um-modal-actions">
          <button type="button" className="um-secondary-button" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="um-primary-button" disabled={saving}>
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </div>
  );
}

function RoleModal({ user, roles, savingBlocked, onClose, onSave }) {
  const [selectedRoles, setSelectedRoles] = useState(() => new Set(user.roles || []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const availableRoles = roles;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedRoles(new Set(user.roles || []));
      setError('');
    }, 0);

    return () => clearTimeout(timer);
  }, [user]);

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

    if (savingBlocked) {
      setError('Không thể lưu cho đến khi trạng thái vai trò được tải lại.');
      return;
    }

    if (selectedRoles.size === 0) {
      setError('Every user must keep at least one role.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(Array.from(selectedRoles));
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="um-modal-backdrop" onMouseDown={() => { if (!saving) onClose(); }}>
      <form className="um-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSave}>
        <div className="um-modal-header">
          <div>
            <p>FE11 roles</p>
            <h2>Quản lý vai trò</h2>
          </div>
          <button type="button" className="um-icon-button" disabled={saving} onClick={onClose} aria-label="Close">
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
          <button type="button" className="um-secondary-button" disabled={saving} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="um-primary-button" disabled={saving || savingBlocked}>
            {saving ? 'Đang lưu...' : 'Lưu vai trò'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Sidebar({ activeSection, currentUser, onSectionChange, onLogout, onNavigate }) {
  // @spec FR-FE11-030, BR-FE11-016, AC-FE11-016
  const items = [
    { id: 'home', icon: Home, label: 'Trang chủ', path: '/home' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { id: 'library', icon: Library, label: 'Thư viện' },
    { id: 'circulation', icon: BookCopy, label: 'Quản lý mượn trả' },
    { id: 'requests', icon: ClipboardList, label: 'Quản lý yêu cầu' },
    { id: 'users', icon: Users, label: 'Quản lý người dùng' },
    { id: 'permissions', icon: Shield, label: 'Phân quyền' },
    { id: 'audit', icon: ClipboardList, label: 'Nhật ký hoạt động' },
  ];

  return (
    <aside className="um-sidebar">
      <div className="um-brand">
        <div className="um-brand-mark">
          <BookOpen size={22} />
        </div>
        <div>
          <strong>Quản lý thư viện</strong>
          <span>Khu vực quản trị</span>
        </div>
      </div>

      <nav className="um-nav">
        {items.map(({ id, icon: Icon, label, path }) => (
          <button
            key={id}
            type="button"
            className={activeSection === id ? 'active' : ''}
            onClick={() => (path ? onNavigate(path) : onSectionChange(id))}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="um-sidebar-footer">
        <div className="um-session">
          <span>Đang đăng nhập với</span>
          <strong>{currentUser?.email || 'Tài khoản quản trị'}</strong>
        </div>
        <button type="button" onClick={onLogout}>
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

function AdminLineChart({ title, rows }) {
  const data = rows || [];
  if (data.length === 0) {
    return (
      <div className="um-panel chart is-empty">
        <div className="um-chart-head">
          <h2>{title}</h2>
          <span>0 lượt</span>
        </div>
        <div className="um-chart-empty">
          <BarChart2 size={28} />
          <strong>Chưa có dữ liệu</strong>
          <span>Dữ liệu sẽ xuất hiện khi có giao dịch phù hợp.</span>
        </div>
      </div>
    );
  }
  const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 1);
  const width = 720;
  const height = 230;
  const pad = 34;
  const points = data.map((item, index) => {
    const x = pad + (index * (width - pad * 2)) / Math.max(data.length - 1, 1);
    const y = height - pad - ((Number(item.value) || 0) / maxValue) * (height - pad * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="um-panel chart">
      <div className="um-chart-head">
        <h2>{title}</h2>
        <span>{data.reduce((sum, item) => sum + (Number(item.value) || 0), 0)} lượt</span>
      </div>
      <svg className="um-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {[0, 1, 2, 3, 4].map((line) => {
          const y = pad + (line * (height - pad * 2)) / 4;
          const tickValue = Number((maxValue * (1 - line / 4)).toFixed(maxValue < 4 ? 2 : 0));
          return (
            <g key={line}>
              <line x1={pad} x2={width - pad} y1={y} y2={y} />
              <text className="axis-label" x={pad - 9} y={y + 3}>{tickValue}</text>
            </g>
          );
        })}
        {points.map((point) => <line className="vertical-grid" key={`v-${point.label}`} x1={point.x} x2={point.x} y1={pad} y2={height - pad} />)}
        <path d={path} />
        {points.map((point) => (
          <g key={point.label}>
            <title>{`${point.label}: ${point.value} lượt`}</title>
            <circle cx={point.x} cy={point.y} r="4" />
            <text className="value" x={point.x} y={Math.max(point.y - 9, 14)}>{point.value}</text>
            <text x={point.x} y={height - 9}>{String(point.label).slice(0, 12)}</text>
          </g>
        ))}
      </svg>
      <div className="um-chart-list">
        {data.slice(0, 8).map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <span>{index + 1}. {item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function LibraryModal({ item, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({ name: item?.name || '' }));

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="um-modal-backdrop" onMouseDown={onClose}>
      <form className="um-modal wide" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
        <div className="um-modal-header">
          <div>
            <p>{item ? 'Update' : 'Create'}</p>
            <h2>Danh mục thư viện</h2>
          </div>
          <button type="button" className="um-icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="um-modal-body">
          <label>Tên<input value={form.name} onChange={(e) => update('name', e.target.value)} required maxLength={100} /></label>
        </div>
        <div className="um-modal-actions">
          <button type="button" className="um-secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="um-primary-button">Save</button>
        </div>
      </form>
    </div>
  );
}

const ADMIN_TABLE_PAGE_SIZE = 8;
const AUDIT_TABLE_PAGE_SIZE = 20;
const REQUEST_TABLE_PAGE_SIZE = 20;
const EMPTY_AUDIT_FILTERS = { q: '', action: '', actorId: '', from: '', to: '' };

function buildAuditLogParams({ page = 1, limit = AUDIT_TABLE_PAGE_SIZE, ...filters } = {}) {
  const params = { page, limit };
  const q = String(filters.q || '').trim();
  const action = String(filters.action || '').trim();
  const actorIdText = String(filters.actorId ?? '').trim();
  if (q) params.q = q;
  if (action) params.action = action;
  if (actorIdText) {
    params.actorId = /^\d+$/.test(actorIdText) ? Number(actorIdText) : actorIdText;
  }
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  return params;
}

function formatAuditDetailEntries(details) {
  return Object.entries(details || {}).filter(([, value]) => (
    ['string', 'number', 'boolean'].includes(typeof value)
    || (Array.isArray(value) && value.every((item) => (
      item === null || ['string', 'number', 'boolean'].includes(typeof item)
    )))
  ));
}

function getAuditTarget(log) {
  const targetType = log.target?.type || '';
  const reportType = targetType.toUpperCase() === 'REPORT' ? log.details?.reportType : null;
  return {
    label: reportType || log.target?.label || (log.target?.id ? `#${log.target.id}` : '-'),
    type: targetType,
  };
}

function getAuditDetailEntries(log) {
  if (log.target?.type?.toUpperCase() !== 'REPORT') return formatAuditDetailEntries(log.details);
  return formatAuditDetailEntries(log.details).filter(([key]) => key !== 'reportType');
}

function formatAuditDetailValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  return String(value);
}

function AdminTablePagination({
  page,
  totalItems,
  onPageChange,
  pageSize = ADMIN_TABLE_PAGE_SIZE,
}) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  if (totalPages <= 1) return null;

  return (
    <div className="um-table-pagination" aria-label="Phân trang">
      <span>Trang {page}/{totalPages} · {totalItems} bản ghi</span>
      <div>
        <button type="button" className="um-secondary-button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Trước</button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
          <button type="button" key={item} className={item === page ? 'active' : ''} onClick={() => onPageChange(item)} aria-current={item === page ? 'page' : undefined}>{item}</button>
        ))}
        <button type="button" className="um-secondary-button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Sau</button>
      </div>
    </div>
  );
}

function UserManagement() {
  const navigate = useNavigate();
  const access = readStoredAdminAccess();
  const currentAdmin = access.user;
  const [activeSection, setActiveSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    librarians: 0,
    inactive: 0,
    usersByRole: {},
  });
  const [pagination, setPagination] = useState({ page: 1, limit: ADMIN_TABLE_PAGE_SIZE, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersUpdatedAt, setUsersUpdatedAt] = useState(null);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const [userStatsError, setUserStatsError] = useState('');
  const [permissionPolicy, setPermissionPolicy] = useState({ roles: [], permissions: [] });
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState('');
  const [permissionsUpdatedAt, setPermissionsUpdatedAt] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modal, setModal] = useState(null);
  const [roleUser, setRoleUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [rolesError, setRolesError] = useState('');
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleSyncBlocked, setRoleSyncBlocked] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditUpdatedAt, setAuditUpdatedAt] = useState(null);
  const [auditFilters, setAuditFilters] = useState(EMPTY_AUDIT_FILTERS);
  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    limit: AUDIT_TABLE_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [paymentFines, setPaymentFines] = useState(() => getFineRecords());
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardUpdatedAt, setDashboardUpdatedAt] = useState(null);
  const [libraryResource, setLibraryResource] = useState('books');
  const [libraryRows, setLibraryRows] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [libraryUpdatedAt, setLibraryUpdatedAt] = useState(null);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryStatus, setLibraryStatus] = useState('ALL');
  const [libraryModal, setLibraryModal] = useState(null);
  const [libraryPage, setLibraryPage] = useState(1);
  const [borrowings, setBorrowings] = useState([]);
  const [borrowingsLoading, setBorrowingsLoading] = useState(false);
  const [borrowingsError, setBorrowingsError] = useState('');
  const [borrowingsUpdatedAt, setBorrowingsUpdatedAt] = useState(null);
  const [borrowingFilter, setBorrowingFilter] = useState({ q: '', status: 'ALL' });
  const [borrowingAction, setBorrowingAction] = useState(null);
  const [returnCondition, setReturnCondition] = useState('NORMAL');
  const [borrowingActionSaving, setBorrowingActionSaving] = useState(false);
  const [borrowingPage, setBorrowingPage] = useState(1);
  const [requests, setRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState({ q: '', status: 'ALL', from: '', to: '' });
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [requestsUpdatedAt, setRequestsUpdatedAt] = useState(null);
  const [viewRequest, setViewRequest] = useState(null);
  const [requestDetailLoading, setRequestDetailLoading] = useState(false);
  const [requestRejectionReason, setRequestRejectionReason] = useState('');
  const [requestActionSaving, setRequestActionSaving] = useState(false);
  const [requestExporting, setRequestExporting] = useState(false);
  const [requestPage, setRequestPage] = useState(1);
  const [requestPagination, setRequestPagination] = useState({
    page: 1,
    limit: REQUEST_TABLE_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [membershipApplications, setMembershipApplications] = useState([]);
  const [membershipFilter, setMembershipFilter] = useState({ status: 'ALL', search: '', page: 1, totalPages: 1 });
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipError, setMembershipError] = useState('');
  const [membershipUpdatedAt, setMembershipUpdatedAt] = useState(null);
  const [membershipReview, setMembershipReview] = useState(null);
  const [membershipSaving, setMembershipSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const hasActiveFilters = search.trim() || roleFilter !== 'ALL' || statusFilter !== 'ALL';
  const isUserDirectorySection = activeSection === 'users';
  const pagedLibraryRows = libraryRows.slice((libraryPage - 1) * ADMIN_TABLE_PAGE_SIZE, libraryPage * ADMIN_TABLE_PAGE_SIZE);
  const pagedBorrowings = borrowings.slice((borrowingPage - 1) * ADMIN_TABLE_PAGE_SIZE, borrowingPage * ADMIN_TABLE_PAGE_SIZE);
  const sectionMeta = {
    dashboard: { eyebrow: 'Tổng quan quản trị', title: 'Dashboard' },
    users: { eyebrow: 'Danh sách tài khoản', title: 'Quản lý người dùng' },
    permissions: { eyebrow: 'Kiểm soát truy cập', title: 'Phân quyền' },
    audit: { eyebrow: 'Theo dõi hệ thống', title: 'Nhật ký hoạt động' },
    library: { eyebrow: 'Dữ liệu thư viện', title: 'Thư viện' },
    circulation: { eyebrow: 'Nghiệp vụ mượn trả', title: 'Quản lý mượn trả' },
    requests: { eyebrow: 'Xử lý yêu cầu', title: 'Quản lý yêu cầu' },
    membership: { eyebrow: 'Xét duyệt hội viên', title: 'Quản lý hội viên' },
    payments: { eyebrow: 'Xét duyệt thanh toán', title: 'Xác nhận thanh toán' },
  }[activeSection];
  const pendingPayments = paymentFines.filter((fine) => fine.paymentReviewStatus === 'PENDING');
  const userDirectoryLoading = loading || userStatsLoading;
  const activeSectionLoading = {
    users: userDirectoryLoading,
    dashboard: dashboardLoading,
    library: libraryLoading,
    circulation: borrowingsLoading,
    requests: requestsLoading,
    membership: membershipLoading,
    permissions: permissionsLoading || userStatsLoading,
    audit: auditLoading,
  }[activeSection] || false;

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
    const currentAccess = readStoredAdminAccess();
    if (currentAccess.authenticated && currentAccess.isAdmin) return true;

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

  async function loadRoles() {
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
  }

  async function openRoleModal(user) {
    if (!(await requireAdminSession())) return;

    try {
      let catalog;
      if (rolesError || roles.length === 0) {
        catalog = await loadRoles();
      } else {
        catalog = normalizeEditableRoleCatalog(roles);
      }
      buildRoleMutationPlan(user.roles || [], user.roles || [], catalog);
      setRoleSyncBlocked(false);
      setRoleUser(user);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  }

  async function openUserDetail(userId) {
    setSelectedUser(null);

    try {
      const detail = await fetchManagedUser(userId);
      setSelectedUser(detail);
    } catch (error) {
      setToast({ type: 'error', message: error.message });

      if (isManagedUserNotFound(error)) {
        await loadUsers(pagination.page);
      }
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

    if (section === 'payments') {
      setPaymentFines(getFineRecords());
    }
  }

  const stats = useMemo(
    () => [
      { label: 'Tổng người dùng', value: userStats.total, icon: Users },
      { label: 'Hoạt động', value: userStats.active, icon: Check },
      { label: 'Thủ thư', value: userStats.librarians, icon: UserCog },
      { label: 'Chưa kích hoạt / Vô hiệu', value: userStats.inactive, icon: PowerOff },
    ],
    [userStats]
  );
  const roleSummary = useMemo(
    () =>
      roles
        .filter((role) => role.roleName !== 'GUEST')
        .map((role) => ({
          ...role,
          count: Number(userStats.usersByRole?.[role.roleName]) || 0,
        })),
    [roles, userStats.usersByRole]
  );
  const permissionRoleSummary = useMemo(
    () => buildPermissionRoleSummary(permissionPolicy.roles, userStats.usersByRole),
    [permissionPolicy.roles, userStats.usersByRole]
  );
  const permissionModuleCoverage = useMemo(
    () => buildPermissionModuleCoverage(permissionPolicy.roles, permissionPolicy.permissions),
    [permissionPolicy.roles, permissionPolicy.permissions]
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

  async function loadPermissions({ announce = false } = {}) {
    setPermissionsLoading(true);
    setPermissionsError('');

    try {
      const result = await adminApi.permissions();
      setPermissionPolicy({
        roles: result.roles || [],
        permissions: result.permissions || [],
      });
      setPermissionsUpdatedAt(new Date());
      if (announce) {
        setToast({ type: 'success', message: 'Đã làm mới ma trận phân quyền.' });
      }
    } catch (error) {
      setPermissionsError(error.message);
      if (announce) setToast({ type: 'error', message: error.message });
    } finally {
      setPermissionsLoading(false);
    }
  }

  async function loadUserStatistics() {
    setUserStatsLoading(true);
    setUserStatsError('');

    try {
      const result = await reportApi.users();
      const toCount = (value) => {
        const count = Number(value);
        return Number.isFinite(count) && count >= 0 ? count : 0;
      };
      const totals = result?.totals || {};
      const usersByStatus = result?.usersByStatus || {};
      const usersByRole = Object.fromEntries(
        Object.entries(result?.usersByRole || {}).map(([roleName, count]) => [roleName, toCount(count)])
      );

      setUserStats({
        total: toCount(totals.users),
        active: toCount(usersByStatus.ACTIVE),
        inactive: toCount(usersByStatus.INACTIVE),
        librarians: toCount(usersByRole.LIBRARIAN),
        usersByRole,
      });
    } catch (error) {
      setUserStatsError(error.message);
      setToast({ type: 'error', message: error.message });
    } finally {
      setUserStatsLoading(false);
    }
  }

  async function loadUsers(page = pagination.page, overrides = {}) {
    const nextRole = overrides.role ?? roleFilter;
    const nextStatus = overrides.status ?? statusFilter;
    const nextSearch = overrides.search ?? search;

    setLoading(true);
    setUsersError('');
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
      setUsersUpdatedAt(new Date());
      if (overrides.announce) setToast({ type: 'success', message: 'Đã làm mới danh sách người dùng.' });
    } catch (error) {
      setUsersError(error.message);
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function refreshUserDirectory(page = pagination.page, overrides = {}) {
    await Promise.all([
      loadUsers(page, overrides),
      loadUserStatistics(),
    ]);
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
    const timer = setTimeout(() => {
      loadUserStatistics();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRoles().catch(() => {});
    }, 0);

    return () => clearTimeout(timer);
  // The timer keeps state-setting catalog work outside the synchronous effect body.
  }, []);

  useEffect(() => {
    if (activeSection === 'dashboard') {
      loadDashboard();
    }
    if (activeSection === 'library') {
      loadLibrary(libraryResource);
    }
    if (activeSection === 'circulation') {
      loadBorrowings();
    }
    if (activeSection === 'requests') {
      loadRequests();
    }
    if (activeSection === 'membership') {
      loadMembershipApplications();
    }
  // The loaders intentionally read current filters when the active admin section changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, libraryResource, membershipFilter.page, membershipFilter.status, requestPage]);

  useEffect(() => {
    if (activeSection !== 'permissions') return;
    const timer = setTimeout(() => {
      loadPermissions();
      loadUserStatistics();
    }, 0);

    return () => clearTimeout(timer);
  // Each loader owns its own state and retry lifecycle.
  }, [activeSection]);

  async function loadAuditLogs(
    page = auditPagination.page,
    { announce = false, filters = auditFilters } = {}
  ) {
    const auditAccess = readStoredAdminAccess();
    if (!auditAccess.authenticated || !auditAccess.isAdmin) {
      setAuditLogs([]);
      setAuditError('Vui lòng đăng nhập bằng tài khoản quản trị viên để xem nhật ký hoạt động.');
      return;
    }

    setAuditLoading(true);
    setAuditError('');
    try {
      const result = await adminApi.auditLogs(buildAuditLogParams({
        ...filters,
        page,
        limit: AUDIT_TABLE_PAGE_SIZE,
      }));
      setAuditLogs(result.data || []);
      setAuditPagination(result.pagination || {
        page,
        limit: AUDIT_TABLE_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
      setAuditUpdatedAt(new Date());
      if (announce) setToast({ type: 'success', message: 'Đã làm mới nhật ký hoạt động.' });
    } catch (error) {
      setAuditError(error.message);
      if (announce) setToast({ type: 'error', message: error.message });
    } finally {
      setAuditLoading(false);
    }
  }

  useEffect(() => {
    if (activeSection !== 'audit') return;
    const timer = setTimeout(() => loadAuditLogs(1), 0);

    return () => clearTimeout(timer);
  // The loader intentionally reads the current pagination state only when invoked.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  useEffect(() => {
    function refreshPayments() {
      setPaymentFines(getFineRecords());
    }

    window.addEventListener('storage', refreshPayments);
    return () => window.removeEventListener('storage', refreshPayments);
  }, []);

  function clearFilters() {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    loadUsers(1, { search: '', role: 'ALL', status: 'ALL' });
  }

  async function loadDashboard({ announce = false } = {}) {
    setDashboardLoading(true);
    setDashboardError('');
    try {
      const result = await adminApi.dashboard();
      setDashboardData(result);
      setDashboardUpdatedAt(new Date());
      if (announce) setToast({ type: 'success', message: 'Dashboard đã được cập nhật.' });
    } catch (error) {
      setDashboardError(error.message);
      setToast({ type: 'error', message: error.message });
    } finally {
      setDashboardLoading(false);
    }
  }

  async function loadLibrary(resource = libraryResource, { announce = false } = {}) {
    setLibraryLoading(true);
    setLibraryError('');
    try {
      const params = {
        q: libraryQuery.trim(),
        status: libraryStatus === 'ALL' ? '' : libraryStatus,
      };
      const result = resource === 'books'
        ? await adminApi.libraryBooks(params)
        : await adminApi.libraryResource(resource, params);
      setLibraryRows(result.data || []);
      setLibraryPage(1);
      setLibraryUpdatedAt(new Date());
      if (announce) setToast({ type: 'success', message: 'Dữ liệu thư viện đã được làm mới.' });
    } catch (error) {
      setLibraryRows([]);
      setLibraryError(error.message);
      setToast({ type: 'error', message: error.message });
    } finally {
      setLibraryLoading(false);
    }
  }

  async function saveLibrary(form) {
    if (libraryResource === 'books') {
      setToast({ type: 'error', message: 'Sách chỉ xem tại đây; hãy dùng màn hình Quản lý sách để chỉnh sửa.' });
      return;
    }

    try {
      if (libraryModal?.item) {
        await adminApi.updateResource(libraryResource, libraryModal.item.id, form);
      } else {
        await adminApi.createResource(libraryResource, form);
      }
      setLibraryModal(null);
      await loadLibrary();
      setToast({ type: 'success', message: 'Library data saved.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  }

  async function deactivateMetadata(row) {
    if (row.status === 'INACTIVE') return;
    if (!window.confirm(`Vô hiệu hóa “${row.name}”? Mục này sẽ không còn được dùng cho sách mới.`)) return;
    try {
      await adminApi.deactivateResource(libraryResource, row.id);
      await loadLibrary();
      setToast({ type: 'success', message: 'Dữ liệu đã được vô hiệu hóa.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  }

  async function loadBorrowings({ announce = false } = {}) {
    setBorrowingsLoading(true);
    setBorrowingsError('');
    try {
      const result = await adminApi.borrowings({
        q: borrowingFilter.q.trim(),
        status: borrowingFilter.status === 'ALL' ? '' : borrowingFilter.status,
      });
      setBorrowings(result.data || []);
      setBorrowingPage(1);
      setBorrowingsUpdatedAt(new Date());
      if (announce) setToast({ type: 'success', message: 'Đã làm mới dữ liệu mượn trả.' });
    } catch (error) {
      setBorrowings([]);
      setBorrowingsError(error.message);
      setToast({ type: 'error', message: error.message });
    } finally {
      setBorrowingsLoading(false);
    }
  }

  async function renewBorrowing(row) {
    if (!row || row.status !== 'BORROWED' || Number(row.renewalCount) >= 1) return;
    if (!window.confirm(`Gia hạn sách “${row.bookTitle}” thêm 14 ngày?`)) return;
    setBorrowingActionSaving(true);
    try {
      await borrowingApi.renewDetail(row.id);
      await loadBorrowings();
      setToast({ type: 'success', message: 'Đã gia hạn lượt mượn.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setBorrowingActionSaving(false);
    }
  }

  async function returnBorrowing() {
    if (!borrowingAction || borrowingActionSaving) return;
    setBorrowingActionSaving(true);
    try {
      const result = await borrowingApi.returnDetail(borrowingAction.id, { condition: returnCondition });
      setBorrowingAction(null);
      setReturnCondition('NORMAL');
      await loadBorrowings();
      setToast({
        type: 'success',
        message: result.fineCandidate?.needsFineReview
          ? 'Đã ghi nhận trả sách; dữ liệu đã được chuyển cho phần xem xét tiền phạt.'
          : 'Đã ghi nhận trả sách.',
      });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setBorrowingActionSaving(false);
    }
  }

  async function loadRequests({ announce = false } = {}) {
    if (requestFilter.from && requestFilter.to && requestFilter.from > requestFilter.to) {
      setToast({ type: 'error', message: 'Ngày bắt đầu không được sau ngày kết thúc.' });
      return;
    }
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const result = await adminApi.requests(
        buildRequestListParams(requestFilter, requestPage, REQUEST_TABLE_PAGE_SIZE)
      );
      setRequests(result.data || []);
      setRequestPagination(result.pagination || {
        page: requestPage,
        limit: REQUEST_TABLE_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
      setRequestsUpdatedAt(new Date());
      if (announce) setToast({ type: 'success', message: 'Đã làm mới danh sách yêu cầu.' });
    } catch (error) {
      setRequests([]);
      setRequestPagination({
        page: requestPage,
        limit: REQUEST_TABLE_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
      setRequestsError(error.message);
      setToast({ type: 'error', message: error.message });
    } finally {
      setRequestsLoading(false);
    }
  }

  function applyRequestFilters() {
    if (requestPage === 1) loadRequests();
    else setRequestPage(1);
  }

  async function openRequestDetail(row) {
    setRequestDetailLoading(true);
    setRequestRejectionReason('');
    try {
      setViewRequest(await adminApi.requestDetail(row.requestId));
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setRequestDetailLoading(false);
    }
  }

  async function exportRequests() {
    if (requestExporting) return;
    setRequestExporting(true);
    try {
      const filters = buildRequestListParams(
        requestFilter,
        1,
        100
      );
      delete filters.page;
      delete filters.limit;
      const rows = await collectAllRequestRows(adminApi.requests, filters);
      if (rows.length === 0) {
        setToast({ type: 'error', message: 'Không có yêu cầu phù hợp để xuất.' });
        return;
      }
      downloadCsvText('requests.csv', buildRequestCsv(rows));
      setToast({ type: 'success', message: 'Đã xuất toàn bộ yêu cầu phù hợp.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setRequestExporting(false);
    }
  }

  async function loadMembershipApplications({ announce = false, page = membershipFilter.page } = {}) {
    setMembershipLoading(true);
    setMembershipError('');
    try {
      const result = normalizeMembershipList(await membershipApi.listApplications({
        q: membershipFilter.search.trim() || undefined,
        status: membershipFilter.status === 'ALL' ? undefined : membershipFilter.status,
        page,
        limit: 10,
      }));
      setMembershipApplications(result.items);
      setMembershipFilter((current) => ({ ...current, page, totalPages: result.totalPages }));
      setMembershipUpdatedAt(new Date());
      if (announce) setToast({ type: 'success', message: 'Đã làm mới danh sách đơn đăng ký hội viên.' });
    } catch (error) {
      setMembershipApplications([]);
      setMembershipError(error.message);
      setToast({ type: 'error', message: error.message });
    } finally {
      setMembershipLoading(false);
    }
  }

  async function approveMembershipApplication(application) {
    if (!application) return;

    setMembershipSaving(true);
    try {
      await membershipApi.approve(application.applicationId || application.id);
      setMembershipReview(null);
      await loadMembershipApplications();
      setToast({ type: 'success', message: 'Đã duyệt đơn đăng ký hội viên.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setMembershipSaving(false);
    }
  }

  async function rejectMembershipApplication(reason) {
    if (!membershipReview) return;

    if (!reason.trim()) {
      setToast({ type: 'error', message: 'Lý do từ chối là bắt buộc.' });
      return;
    }

    setMembershipSaving(true);
    try {
      await membershipApi.reject(membershipReview.applicationId || membershipReview.id, reason.trim());
      setMembershipReview(null);
      await loadMembershipApplications();
      setToast({ type: 'success', message: 'Đã từ chối đơn đăng ký hội viên.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setMembershipSaving(false);
    }
  }

  // @spec FR-FE11-035
  async function approveBorrowRequest() {
    if (!viewRequest || requestActionSaving) return;
    setRequestActionSaving(true);
    try {
      await borrowingApi.approve(viewRequest.requestId);
      await loadRequests();
      await loadBorrowings();
      setViewRequest(await adminApi.requestDetail(viewRequest.requestId));
      setToast({ type: 'success', message: 'Đã duyệt yêu cầu mượn.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setRequestActionSaving(false);
    }
  }

  async function rejectBorrowRequest() {
    if (!viewRequest || requestActionSaving) return;
    const reason = requestRejectionReason.trim();
    if (!reason) {
      setToast({ type: 'error', message: 'Vui lòng nhập lý do từ chối.' });
      return;
    }
    setRequestActionSaving(true);
    try {
      await borrowingApi.reject(viewRequest.requestId, reason);
      setRequestRejectionReason('');
      await loadRequests();
      setViewRequest(await adminApi.requestDetail(viewRequest.requestId));
      setToast({ type: 'success', message: 'Đã từ chối yêu cầu mượn.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setRequestActionSaving(false);
    }
  }

  function savePaymentRows(nextRows, message) {
    saveFineRecords(nextRows);
    setPaymentFines(nextRows);
    setToast({ type: 'success', message });
  }

  function confirmPayment(fineId) {
    const now = new Date().toISOString();
    const nextRows = paymentFines.map((fine) =>
      fine.fineId === fineId
        ? {
            ...fine,
            status: 'PAID',
            paidAmount: fine.amount,
            paidAt: now,
            paymentReviewStatus: 'CONFIRMED',
            paymentReviewedAt: now,
            paymentReviewedBy: currentAdmin?.email || null,
          }
        : fine
    );

    savePaymentRows(nextRows, 'Payment confirmed and fine marked as paid.');
  }

  function refusePayment(fineId) {
    const now = new Date().toISOString();
    const nextRows = paymentFines.map((fine) =>
      fine.fineId === fineId
        ? {
            ...fine,
            paidAmount: 0,
            paidAt: '',
            collectedAt: '',
            paymentReviewStatus: 'REFUSED',
            paymentReviewedAt: now,
            paymentReviewedBy: currentAdmin?.email || null,
          }
        : fine
    );

    savePaymentRows(nextRows, 'Payment refused. Fine is returned to unpaid follow-up.');
  }

  async function submitModal(form) {
    if (!(await requireAdminSession())) {
      throw new Error('Admin login required.');
    }

    try {
      if (modal?.mode === 'edit') {
        await updateManagedUser(modal.user.userId, {
          expectedUpdatedAt: modal.user.updatedAt,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          ...(form.type === 'librarian' ? {
            department: form.department.trim() || null,
            specialization: form.specialization.trim() || null,
          } : {}),
        });
        setToast({ type: 'success', message: 'Đã cập nhật thông tin người dùng.' });
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
        setToast({ type: 'success', message: 'Đã tạo tài khoản chưa kích hoạt và gửi email thiết lập mật khẩu.' });
      }

      setModal(null);
      setSelectedUser(null);
      await refreshUserDirectory(modal?.mode === 'edit' ? pagination.page : 1);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
      throw error;
    }
  }

  async function deactivateUser(user) {
    if (!(await requireAdminSession())) {
      return;
    }

    if (!window.confirm(`Vô hiệu hóa tài khoản ${user.fullName || user.email}? Người dùng sẽ không thể đăng nhập.`)) {
      return;
    }

    try {
      await deactivateManagedUser(user.userId, user.updatedAt);
      setToast({ type: 'success', message: 'Đã vô hiệu hóa tài khoản người dùng.' });
      setSelectedUser(null);
      await refreshUserDirectory(pagination.page);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  }

  async function saveRoles(nextRoles) {
    if (!roleUser) return;

    if (!(await requireAdminSession())) {
      throw new Error('Admin login required.');
    }

    const { assignments, revocations } = buildRoleMutationPlan(
      roleUser.roles || [],
      nextRoles,
      roles,
    );

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

      setToast({ type: 'success', message: 'Đã cập nhật vai trò người dùng.' });
      setRoleUser(null);
      setRoleSyncBlocked(false);
      setSelectedUser(null);
      await refreshUserDirectory();
    } catch (error) {
      try {
        const refreshedUser = await fetchManagedUser(roleUser.userId);
        setRoleUser(refreshedUser);
        setRoleSyncBlocked(false);
        if (selectedUser?.userId === refreshedUser.userId) {
          setSelectedUser(refreshedUser);
        }
      } catch {
        setRoleSyncBlocked(true);
      }
      throw error;
    }
  }

  if (!access.authenticated) return <Navigate to="/login" replace />;
  if (!access.isAdmin) return <Navigate to="/home" replace />;

  const showAuditDetails = activeSection === 'audit'
    && auditLogs.some((log) => getAuditDetailEntries(log).length > 0);

  return (
    <div className="um-shell">
      <Sidebar
        activeSection={activeSection}
        currentUser={currentAdmin}
        onSectionChange={handleSectionChange}
        onLogout={() => setShowLogoutConfirm(true)}
        onNavigate={(path) => navigate(path)}
      />

      <main className="um-main">
        <header className="um-topbar">
          <div>
            <p>{sectionMeta.eyebrow}</p>
            <h1>{sectionMeta.title}</h1>
          </div>
          <div className="um-actions">
            <button
              className="um-secondary-button"
              disabled={activeSectionLoading}
              onClick={() => {
                if (activeSection === 'payments') setPaymentFines(getFineRecords());
                else if (activeSection === 'dashboard') loadDashboard({ announce: true });
                else if (activeSection === 'library') loadLibrary(libraryResource, { announce: true });
                else if (activeSection === 'circulation') loadBorrowings({ announce: true });
                else if (activeSection === 'requests') loadRequests({ announce: true });
                else if (activeSection === 'membership') loadMembershipApplications({ announce: true });
                else if (activeSection === 'permissions') {
                  loadPermissions({ announce: true });
                  loadUserStatistics();
                }
                else if (activeSection === 'audit') {
                  loadAuditLogs(auditPagination.page, { announce: true, filters: auditFilters });
                }
                else refreshUserDirectory(pagination.page, { announce: true });
              }}
            >
              <RefreshCw size={16} className={activeSectionLoading ? 'is-spinning' : ''} />
              {activeSectionLoading ? 'Đang tải...' : 'Làm mới'}
            </button>
            {isUserDirectorySection && (
              <button className="um-primary-button" onClick={openCreateModal}>
                <Plus size={16} />
                Thêm người dùng
              </button>
            )}
          </div>
        </header>

        {isUserDirectorySection && <section className="um-stats">
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
          <>
            <div className="um-dashboard-status" aria-live="polite">
              <span>
                {dashboardUpdatedAt
                  ? `Cập nhật lần cuối lúc ${dashboardUpdatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : dashboardLoading ? 'Đang tải dữ liệu dashboard...' : 'Chưa tải dữ liệu dashboard.'}
              </span>
              {dashboardError && <strong>Không thể làm mới: {dashboardError}</strong>}
            </div>
            {!dashboardData && dashboardLoading && <div className="um-dashboard-loading">Đang đồng bộ dữ liệu từ hệ thống...</div>}
            {dashboardData && <>
            <section className="um-stats dashboard">
              {[
                { label: 'Tổng số sách', value: dashboardData.summary?.totalBooks || 0, icon: BookOpen },
                { label: 'Tổng số thành viên', value: dashboardData.summary?.totalMembers || 0, icon: Users },
                { label: 'Tác giả', value: dashboardData.summary?.totalAuthors || 0, icon: UserCog },
                { label: 'Tổng số sách mượn', value: dashboardData.summary?.totalBorrowed || 0, icon: BookCopy },
                { label: 'Sách mượn quá hạn', value: dashboardData.summary?.overdueBorrowed || 0, icon: AlertTriangle },
              ].map(({ label, value, icon: Icon }) => (
                <div className="um-stat dashboard-card" key={label}>
                  <Icon size={24} />
                  <div>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                </div>
              ))}
            </section>
            <section className="um-chart-grid">
              <AdminLineChart title="Top sách được mượn" rows={dashboardData.charts?.mostBorrowed} />
              <div className="um-chart-grid-secondary">
                <AdminLineChart title="Sách đang mượn quá hạn" rows={dashboardData.charts?.overdue} />
                <AdminLineChart title="Sách trả trong hôm nay" rows={dashboardData.charts?.returnedToday} />
              </div>
            </section>
            </>}
          </>
        )}

        {activeSection === 'library' && (
          <section className="um-admin-section">
            <div className="um-dashboard-status" aria-live="polite">
              <span>{libraryUpdatedAt ? `Cập nhật lần cuối lúc ${libraryUpdatedAt.toLocaleTimeString('vi-VN')}` : 'Chưa tải dữ liệu thư viện.'}</span>
              {libraryError && <strong>Không thể tải dữ liệu: {libraryError}</strong>}
            </div>
            <div className="um-tabs">
              {libraryResources.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={libraryResource === id ? 'active' : ''}
                  onClick={() => {
                    setLibraryResource(id);
                    setLibraryQuery('');
                    setLibraryStatus('ALL');
                    setLibraryPage(1);
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
            <div className="um-toolbar">
              <div className="um-search">
                <Search size={18} />
                <input value={libraryQuery} placeholder="Search library data..." onChange={(event) => setLibraryQuery(event.target.value)} />
              </div>
              {libraryResource === 'books' && (
                <select value={libraryStatus} onChange={(event) => setLibraryStatus(event.target.value)}>
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              )}
              <button className="um-secondary-button" disabled={libraryLoading} onClick={() => loadLibrary()}>Tìm kiếm</button>
              <button className="um-secondary-button" disabled={libraryLoading || libraryRows.length === 0} onClick={() => downloadCsv(`${libraryResource}.csv`, libraryRows)}><FileDown size={16} /> Xuất CSV</button>
              {libraryResource !== 'books' && <button className="um-primary-button" onClick={() => setLibraryModal({ item: null })}><Plus size={16} /> Thêm mới</button>}
            </div>
            <section className="um-content">
              <table className="um-table">
                <thead>
                  {libraryResource === 'books' ? (
                    <tr><th>ID</th><th>Tên sách</th><th>ISBN</th><th>Danh mục</th><th>Tác giả</th><th>NXB</th><th>Năm</th><th>Bản sao</th><th>Trạng thái</th><th>Thao tác</th></tr>
                  ) : (
                    <tr><th>STT</th><th>Tên</th><th>Ngày tạo</th><th>Trạng thái</th><th>Thao tác</th></tr>
                  )}
                </thead>
                <tbody>
                  {pagedLibraryRows.map((row, index) => libraryResource === 'books' ? (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td><strong>{row.title}</strong></td>
                      <td>{row.isbn || '-'}</td>
                      <td>{row.category || '-'}</td>
                      <td>{row.author || '-'}</td>
                      <td>{row.publisher || '-'}</td>
                      <td>{row.publishYear || row.year || '-'}</td>
                      <td>{row.availableCopies || 0}/{row.totalCopies || 0}</td>
                      <td><span className={`um-badge status-${String(row.status || 'active').toLowerCase()}`}>{row.status || 'ACTIVE'}</span></td>
                      <td><span className="um-readonly-note">Chỉ xem; chỉnh sửa tại Quản lý sách.</span></td>
                    </tr>
                  ) : (
                    <tr key={row.id}>
                      <td>{(libraryPage - 1) * ADMIN_TABLE_PAGE_SIZE + index + 1}</td>
                      <td><strong>{row.name}</strong></td>
                      <td>{formatDate(row.createdAt)}</td>
                      <td><span className={`um-badge status-${String(row.status || 'active').toLowerCase()}`}>{row.status || 'ACTIVE'}</span></td>
                      <td><div className="um-row-actions"><button className="um-icon-button" title="Chỉnh sửa" onClick={() => setLibraryModal({ item: row })}><Edit2 size={16} /></button><button className="um-icon-button danger" title="Vô hiệu hóa" disabled={row.status === 'INACTIVE'} onClick={() => deactivateMetadata(row)}><PowerOff size={16} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {libraryRows.length === 0 && <div className="um-empty">No library data found.</div>}
              <AdminTablePagination page={libraryPage} totalItems={libraryRows.length} onPageChange={setLibraryPage} />
            </section>
          </section>
        )}

        {activeSection === 'circulation' && (
          <section className="um-admin-section">
            <div className="um-dashboard-status" aria-live="polite">
              <span>{borrowingsUpdatedAt ? `Cập nhật lần cuối lúc ${borrowingsUpdatedAt.toLocaleTimeString('vi-VN')}` : 'Chưa tải dữ liệu mượn trả.'}</span>
              {borrowingsError && <strong>Không thể tải dữ liệu: {borrowingsError}</strong>}
            </div>
            <div className="um-toolbar">
              <div className="um-search"><Search size={18} /><input value={borrowingFilter.q} placeholder="Tìm thành viên, sách hoặc barcode..." onKeyDown={(event) => { if (event.key === 'Enter') loadBorrowings(); }} onChange={(event) => setBorrowingFilter((current) => ({ ...current, q: event.target.value }))} /></div>
              <select value={borrowingFilter.status} onChange={(event) => setBorrowingFilter((current) => ({ ...current, status: event.target.value }))}>
                {borrowingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button className="um-secondary-button" disabled={borrowingsLoading} onClick={() => loadBorrowings()}>Tìm kiếm</button>
              <button className="um-secondary-button" disabled={borrowingsLoading || borrowings.length === 0} onClick={() => downloadCsv('borrowings.csv', borrowings)}><FileDown size={16} /> Xuất CSV</button>
              <button className="um-primary-button" onClick={() => setActiveSection('requests')}>Xử lý yêu cầu</button>
            </div>
            <section className="um-content">
              <table className="um-table">
                <thead><tr><th>Mã lượt</th><th>Mã yêu cầu</th><th>Thành viên</th><th>Sách</th><th>Barcode</th><th>Ngày mượn</th><th>Ngày hạn</th><th>Ngày trả</th><th>Gia hạn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {pagedBorrowings.map((row) => (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td>#{row.requestId}</td>
                      <td><strong>{row.memberName}</strong></td>
                      <td>{row.bookTitle}</td>
                      <td>{row.barcode || `Copy #${row.copyId}`}</td>
                      <td>{formatDate(row.borrowDate)}</td>
                      <td>{formatDate(row.dueDate)}</td>
                      <td>{formatDate(row.returnDate)}</td>
                      <td>{row.renewalCount || 0}/1</td>
                      <td><span className={`um-badge status-${String(row.status || 'active').toLowerCase()}`}>{row.status}</span></td>
                      <td>
                        <div className="um-row-actions">
                          {row.status === 'REQUESTED' && <button className="um-secondary-button" onClick={() => setActiveSection('requests')}>Xử lý yêu cầu</button>}
                          {['BORROWED', 'OVERDUE'].includes(row.status) && <button className="um-primary-button" disabled={borrowingActionSaving} onClick={() => { setReturnCondition('NORMAL'); setBorrowingAction(row); }}>Trả sách</button>}
                          {row.status === 'BORROWED' && Number(row.renewalCount) < 1 && <button className="um-secondary-button" disabled={borrowingActionSaving} onClick={() => renewBorrowing(row)}>Gia hạn</button>}
                          {['RETURNED', 'DAMAGED', 'LOST'].includes(row.status) && <span className="um-muted">Đã hoàn tất</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {borrowings.length === 0 && !borrowingsLoading && (
                <div className="um-empty">
                  <strong>Chưa có giao dịch mượn trả trong database.</strong>
                  <span>Giao dịch sẽ xuất hiện sau khi Member gửi yêu cầu và Admin/Librarian duyệt theo đúng quy trình.</span>
                </div>
              )}
              {borrowingsLoading && <div className="um-empty">Đang tải dữ liệu...</div>}
              <AdminTablePagination page={borrowingPage} totalItems={borrowings.length} onPageChange={setBorrowingPage} />
            </section>
          </section>
        )}

        {activeSection === 'requests' && (
          <section className="um-admin-section">
            <div className="um-dashboard-status" aria-live="polite">
              <span>{requestsUpdatedAt ? `Cập nhật lần cuối lúc ${requestsUpdatedAt.toLocaleTimeString('vi-VN')}` : 'Chưa tải danh sách yêu cầu.'}</span>
              {requestsError && <strong>Không thể tải dữ liệu: {requestsError}</strong>}
            </div>
            <div className="um-toolbar requests">
              <div className="um-search"><Search size={18} /><input value={requestFilter.q} placeholder="Tìm theo tên sách, tên hoặc email thành viên..." onKeyDown={(event) => { if (event.key === 'Enter') applyRequestFilters(); }} onChange={(event) => setRequestFilter((current) => ({ ...current, q: event.target.value }))} /></div>
              <select aria-label="Lọc trạng thái" value={requestFilter.status} onChange={(event) => setRequestFilter((current) => ({ ...current, status: event.target.value }))}>{requestStatuses.map((status) => <option key={status} value={status}>{requestStatusLabels[status]}</option>)}</select>
              <input aria-label="Từ ngày" type="date" value={requestFilter.from} onChange={(event) => setRequestFilter((current) => ({ ...current, from: event.target.value }))} />
              <input aria-label="Đến ngày" type="date" value={requestFilter.to} onChange={(event) => setRequestFilter((current) => ({ ...current, to: event.target.value }))} />
              <button className="um-secondary-button" disabled={requestsLoading} onClick={applyRequestFilters}>Tìm kiếm</button>
              <button className="um-primary-button" disabled={requestsLoading || requestExporting} onClick={exportRequests}><FileDown size={16} /> {requestExporting ? 'Đang xuất...' : 'Xuất CSV'}</button>
            </div>
            <section className="um-content">
              <table className="um-table request-table">
                <thead><tr><th>STT</th><th>Tên sách</th><th>Tài khoản</th><th>Số điện thoại</th><th>Thể loại</th><th>Thời gian đặt</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {requests.map((row, index) => (
                    <tr key={row.requestId}>
                      <td>{(requestPage - 1) * requestPagination.limit + index + 1}</td>
                      <td><strong>{row.bookTitles?.join(' | ') || '-'}</strong></td>
                      <td>{row.member?.fullName || row.member?.email || '-'}</td>
                      <td>{row.member?.phoneNumber || '-'}</td>
                      <td>{row.categories?.join(' | ') || '-'}</td>
                      <td>{formatDate(row.requestDate)}</td>
                      <td><span className={`um-badge status-${String(row.status || '').toLowerCase()}`}>{requestStatusLabels[row.status] || row.status}</span></td>
                      <td>
                        <div className="um-row-actions">
                          {row.status === 'PENDING' && (
                            <button className="um-primary-button" disabled={requestDetailLoading} onClick={() => openRequestDetail(row)}><Eye size={16} /> Xử lý</button>
                          )}
                          {['APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(row.status) && (
                            <button className="um-secondary-button" disabled={requestDetailLoading} onClick={() => openRequestDetail(row)}><Eye size={16} /> Chi tiết</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length === 0 && !requestsLoading && <div className="um-empty">Không tìm thấy yêu cầu mượn sách.</div>}
              {requestsLoading && <div className="um-empty">Đang tải danh sách yêu cầu...</div>}
              <AdminTablePagination page={requestPage} totalItems={requestPagination.total} pageSize={requestPagination.limit} onPageChange={setRequestPage} />
            </section>
          </section>
        )}

        {activeSection === 'membership' && (
          <section className="um-admin-section">
            <div className="um-dashboard-status" aria-live="polite">
              <span>{membershipUpdatedAt ? `Cập nhật lần cuối lúc ${membershipUpdatedAt.toLocaleTimeString('vi-VN')}` : 'Chưa tải danh sách đơn đăng ký hội viên.'}</span>
              {membershipError && <strong>Không thể tải dữ liệu: {membershipError}</strong>}
            </div>
            <div className="um-content" style={{ padding: 18 }}>
              <div className="um-panel-title">
                <div>
                  <h2>Đơn đăng ký hội viên</h2>
                  <p>Admin hoặc thủ thư xét duyệt các đơn đăng ký theo trạng thái.</p>
                </div>
              </div>
              <MembershipFilter
                status={membershipFilter.status}
                search={membershipFilter.search}
                loading={membershipLoading}
                onStatusChange={(status) => setMembershipFilter((current) => ({ ...current, status, page: 1 }))}
                onSearchChange={(searchValue) => setMembershipFilter((current) => ({ ...current, search: searchValue }))}
                onSearch={() => loadMembershipApplications({ page: 1 })}
                onReload={() => loadMembershipApplications({ announce: true })}
              />
              <MembershipApplicationsTable
                applications={membershipApplications}
                page={membershipFilter.page}
                totalPages={membershipFilter.totalPages}
                onPageChange={(nextPage) => setMembershipFilter((current) => ({ ...current, page: nextPage }))}
                onApprove={approveMembershipApplication}
                onReject={setMembershipReview}
              />
            </div>
          </section>
        )}

        {isUserDirectorySection && <div className="um-dashboard-status" aria-live="polite">
          <span>{usersUpdatedAt ? `Cập nhật lần cuối lúc ${usersUpdatedAt.toLocaleTimeString('vi-VN')}` : 'Chưa tải danh sách người dùng.'}</span>
          {usersError && <strong>Không thể tải dữ liệu: {usersError}</strong>}
          {userStatsError && <strong>Không thể tải thống kê người dùng: {userStatsError}</strong>}
        </div>}

        {isUserDirectorySection && <section className="um-toolbar">
          <div className="um-search">
            <Search size={18} />
            <input
              value={search}
              placeholder="Tìm theo tên, email, username, số điện thoại hoặc ID..."
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  loadUsers(1);
                }
              }}
            />
          </div>

          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Admin</option>
            <option value="LIBRARIAN">Librarian</option>
            <option value="MEMBER">Member</option>
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Chưa kích hoạt / Vô hiệu</option>
            <option value="LOCKED">Bị khóa</option>
          </select>

          <button className="um-secondary-button" onClick={() => loadUsers(1)}>
            Tìm kiếm
          </button>
          {hasActiveFilters && (
            <button className="um-secondary-button" onClick={clearFilters}>
              <FilterX size={16} />
              Xóa lọc
            </button>
          )}
        </section>}

        {isUserDirectorySection && <section className="um-content">
          <table className="um-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Username</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId} onClick={() => openUserDetail(user.userId)}>
                  <td>
                    <div className="um-user-cell">
                      <div className={`um-avatar ${getPrimaryRole(user).toLowerCase()}`}>
                        {(user.fullName || user.email || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <strong>{user.fullName || 'Chưa cập nhật tên'}</strong>
                        <span>#{user.userId} - {user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.username || '-'}</td>
                  <td>{user.phoneNumber || '-'}</td>
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
                      <button className="um-icon-button" title="Chỉnh sửa" onClick={() => openEditModal(user)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="um-icon-button" title="Quản lý vai trò" onClick={() => openRoleModal(user)}>
                        <Shield size={16} />
                      </button>
                      <button
                        className="um-icon-button danger"
                        title="Vô hiệu hóa"
                        disabled={!['ACTIVE', 'LOCKED'].includes(user.status)}
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

          {!loading && users.length === 0 && <div className="um-empty">Không tìm thấy người dùng phù hợp.</div>}
          {loading && <div className="um-empty">Đang tải danh sách người dùng...</div>}
          <AdminTablePagination page={pagination.page} totalItems={pagination.total} onPageChange={(page) => loadUsers(page)} />
        </section>}

        {activeSection === 'payments' && (
          <section className="um-content">
            <table className="um-table">
              <thead>
                <tr>
                  <th>Fine</th>
                  <th>Member</th>
                  <th>Book</th>
                  <th>Amount</th>
                  <th>Collected by</th>
                  <th>Method</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((fine) => (
                  <tr key={fine.fineId}>
                    <td>
                      <strong>#{fine.fineId}</strong>
                      <span>{formatDate(fine.paymentReviewRequestedAt || fine.collectedAt)}</span>
                    </td>
                    <td>
                      <strong>{fine.memberName || '-'}</strong>
                      <span>{fine.email || fine.memberCode || '-'}</span>
                    </td>
                    <td>
                      <strong>{fine.bookTitle || '-'}</strong>
                      <span>Borrow detail #{fine.borrowDetailId || '-'}</span>
                    </td>
                    <td>{formatCurrency(fine.amount)}</td>
                    <td>{fine.collectedBy || '-'}</td>
                    <td>{fine.paymentMethod || '-'}</td>
                    <td>
                      <div className="um-row-actions">
                        <button className="um-primary-button" onClick={() => confirmPayment(fine.fineId)}>
                          <Check size={16} />
                          Confirm
                        </button>
                        <button className="um-danger-button" onClick={() => refusePayment(fine.fineId)}>
                          <X size={16} />
                          Refuse
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingPayments.length === 0 && (
              <div className="um-empty">
                <Banknote size={28} />
                <strong>No payment waiting for admin review</strong>
                <span>Librarian payment records will appear here after collection is recorded.</span>
              </div>
            )}
          </section>
        )}

        {activeSection === 'permissions' && (
          <section className="um-admin-section">
            <div className="um-permission-status-grid" aria-live="polite">
              <article>
                <strong>Ma trận FE11</strong>
                <span>
                  {permissionsLoading
                    ? 'Đang tải...'
                    : permissionsError || (permissionsUpdatedAt
                      ? `Cập nhật lúc ${permissionsUpdatedAt.toLocaleTimeString('vi-VN')}`
                      : 'Chưa tải dữ liệu.')}
                </span>
                {permissionsError && (
                  <button type="button" className="um-secondary-button" onClick={() => loadPermissions()}>
                    Thử lại ma trận
                  </button>
                )}
              </article>
              <article>
                <strong>Thống kê FE12</strong>
                <span>{userStatsLoading ? 'Đang tải...' : userStatsError || 'Đã tải số lượng vai trò.'}</span>
                {userStatsError && (
                  <button type="button" className="um-secondary-button" onClick={() => loadUserStatistics()}>
                    Thử lại thống kê
                  </button>
                )}
              </article>
            </div>
            <div className="um-permission-cards">
              {permissionRoleSummary.map((role) => (
                <article key={role.roleName}>
                  <RoleBadge role={role.roleName} />
                  <strong>{role.count}</strong>
                  <span>{role.label} accounts</span>
                </article>
              ))}
            </div>
            <section className="um-panel-grid permissions">
              <div className="um-panel">
                <h2>Module Coverage</h2>
                <table className="um-permission-table compact">
                  <thead>
                    <tr>
                      <th>Module</th>
                      {permissionPolicy.roles.map((role) => <th key={role.roleName}>{role.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {permissionModuleCoverage.map((module) => (
                      <tr key={module.moduleKey}>
                        <td>{module.moduleLabel}</td>
                        {permissionPolicy.roles.map((role) => (
                          <td key={role.roleName}>{module.counts[role.roleName] || 0} rules</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="um-panel">
                <h2>Permission Matrix</h2>
                <table className="um-permission-table">
                  <thead>
                    <tr>
                      <th>Permission</th>
                      {permissionPolicy.roles.map((role) => <th key={role.roleName}>{role.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {permissionPolicy.permissions.map((permission) => (
                      <tr key={permission.permissionKey}>
                        <td>{permission.label}</td>
                        {permissionPolicy.roles.map((role) => (
                          <td key={role.roleName}>
                            {roleAllowsPermission(permission, role.roleName) ? 'Yes' : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        )}

        {activeSection === 'audit' && (
          <section className="um-content um-audit-content">
            <div className="um-audit-summary">
              <article>
                <span className="um-audit-summary-icon"><Activity size={20} /></span>
                <div>
                  <small>Tổng sự kiện</small>
                  <strong>{auditPagination.total}</strong>
                  <span>Hoạt động đã ghi nhận</span>
                </div>
              </article>
              <article>
                <span className="um-audit-summary-icon"><ClipboardList size={20} /></span>
                <div>
                  <small>Trang hiện tại</small>
                  <strong>{auditPagination.page}<em>/{auditPagination.totalPages}</em></strong>
                  <span>{auditLogs.length} bản ghi đang hiển thị</span>
                </div>
              </article>
              <article>
                <span className="um-audit-summary-icon"><Clock3 size={20} /></span>
                <div>
                  <small>Cập nhật gần nhất</small>
                  <strong className="time">{auditUpdatedAt ? auditUpdatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</strong>
                  <span>{auditUpdatedAt ? auditUpdatedAt.toLocaleDateString('vi-VN') : 'Chưa có dữ liệu'}</span>
                </div>
              </article>
            </div>
            <div className="um-toolbar audit">
              <div className="um-search">
                <Search size={18} />
                <input
                  aria-label="Tìm nhật ký"
                  value={auditFilters.q}
                  maxLength={100}
                  placeholder="Tìm hành động, actor hoặc đối tượng..."
                  onChange={(event) => setAuditFilters((current) => ({
                    ...current,
                    q: event.target.value,
                  }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') loadAuditLogs(1, { filters: auditFilters });
                  }}
                />
              </div>
              <input
                aria-label="Lọc hành động"
                value={auditFilters.action}
                maxLength={100}
                placeholder="AUTH_LOGIN_SUCCESS"
                onChange={(event) => setAuditFilters((current) => ({
                  ...current,
                  action: event.target.value,
                }))}
              />
              <input
                aria-label="Actor ID"
                type="number"
                min="1"
                step="1"
                value={auditFilters.actorId}
                onChange={(event) => setAuditFilters((current) => ({
                  ...current,
                  actorId: event.target.value,
                }))}
              />
              <input
                aria-label="Từ ngày"
                type="date"
                value={auditFilters.from}
                onChange={(event) => setAuditFilters((current) => ({
                  ...current,
                  from: event.target.value,
                }))}
              />
              <input
                aria-label="Đến ngày"
                type="date"
                value={auditFilters.to}
                onChange={(event) => setAuditFilters((current) => ({
                  ...current,
                  to: event.target.value,
                }))}
              />
              <button
                type="button"
                className="um-secondary-button"
                disabled={auditLoading}
                onClick={() => loadAuditLogs(1, { filters: auditFilters })}
              >
                Áp dụng
              </button>
              <button
                type="button"
                className="um-secondary-button"
                disabled={auditLoading}
                onClick={() => {
                  setAuditFilters(EMPTY_AUDIT_FILTERS);
                  loadAuditLogs(1, { filters: EMPTY_AUDIT_FILTERS });
                }}
              >
                <FilterX size={16} /> Xóa lọc
              </button>
            </div>
            <div className="um-audit-table-heading">
              <div>
                <h2>Danh sách hoạt động</h2>
                <p>Theo dõi các thao tác quan trọng trong hệ thống</p>
              </div>
              <span>Chỉ đọc</span>
            </div>
            <div className="um-table-wrap">
            <table className="um-table um-audit-table">
              <thead>
                <tr>
                  <th>Hành động</th>
                  <th>Người thực hiện</th>
                  <th>Đối tượng</th>
                  {showAuditDetails && <th>Chi tiết an toàn</th>}
                  <th>IP</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.logId}>
                    <td><span className="um-audit-action">{log.action}</span></td>
                    <td>
                      <strong>{log.actor?.fullName || log.actor?.email || 'Hệ thống'}</strong>
                      {log.actor?.fullName && log.actor?.email && <small>{log.actor.email}</small>}
                    </td>
                    <td>
                      <strong>{getAuditTarget(log).label}</strong>
                      {getAuditTarget(log).type && <small>{getAuditTarget(log).type}</small>}
                    </td>
                    {showAuditDetails && <td>
                      {getAuditDetailEntries(log).length === 0 ? '-' : (
                        <dl className="um-audit-details">
                          {getAuditDetailEntries(log).map(([key, value]) => (
                            <div key={key}>
                              <dt>{key}</dt>
                              <dd>{formatAuditDetailValue(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </td>}
                    <td><code>{log.ipAddress || '-'}</code></td>
                    <td>{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLoading && <div className="um-empty">Đang tải nhật ký hoạt động...</div>}
            {!auditLoading && auditError && (
              <div className="um-empty">
                <strong>Không thể tải nhật ký hoạt động</strong>
                <span>{auditError}</span>
              </div>
            )}
            {!auditLoading && !auditError && auditLogs.length === 0 && (
              <div className="um-empty">Chưa có sự kiện nào được ghi nhận.</div>
            )}
            {!auditLoading && !auditError && (
              <AdminTablePagination
                page={auditPagination.page}
                totalItems={auditPagination.total}
                pageSize={auditPagination.limit || AUDIT_TABLE_PAGE_SIZE}
                onPageChange={(page) => loadAuditLogs(page, { filters: auditFilters })}
              />
            )}
            </div>
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
              {selectedUser.phoneNumber || '-'}
            </p>
            <p>{selectedUser.address || '-'}</p>
            {selectedUser.roles?.includes('LIBRARIAN') && (
              <>
                <p>{selectedUser.department || '-'}</p>
                <p>{selectedUser.specialization || '-'}</p>
              </>
            )}
            <p>
              <Calendar size={16} />
              Ngày tạo {formatDate(selectedUser.createdAt)}
            </p>
          </div>
          <div className="um-related-summary">
            <div>
              <BookCopy size={17} />
              <span>Active borrowings</span>
              <strong>{selectedUser.relatedSummary?.activeBorrowingCount ?? 0}</strong>
            </div>
            <div>
              <Banknote size={17} />
              <span>Unpaid fines</span>
              <strong>{formatCurrency(selectedUser.relatedSummary?.unpaidFineTotal ?? 0)}</strong>
            </div>
            <div>
              <ClipboardList size={17} />
              <span>Open reservations</span>
              <strong>{selectedUser.relatedSummary?.openReservationCount ?? 0}</strong>
            </div>
          </div>
          <div className="um-drawer-actions">
            <button className="um-primary-button" onClick={() => openEditModal(selectedUser)}>
              <Edit2 size={16} />
              Edit
            </button>
            <button className="um-secondary-button" onClick={() => openRoleModal(selectedUser)}>
              <Shield size={16} />
              Vai trò
            </button>
            <button
              className="um-danger-button"
              disabled={!['ACTIVE', 'LOCKED'].includes(selectedUser.status)}
              onClick={() => deactivateUser(selectedUser)}
            >
              <PowerOff size={16} />
              Vô hiệu hóa
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
          savingBlocked={rolesLoading || roleSyncBlocked}
          onClose={() => {
            setRoleUser(null);
            setRoleSyncBlocked(false);
          }}
          onSave={saveRoles}
        />
      )}

      {libraryModal && (
        <LibraryModal
          item={libraryModal.item}
          onClose={() => setLibraryModal(null)}
          onSubmit={saveLibrary}
        />
      )}


      {viewRequest && (
        <div className="um-modal-backdrop" onMouseDown={() => { if (!requestActionSaving) setViewRequest(null); }}>
          <div className="um-modal" role="dialog" aria-modal="true" aria-labelledby="request-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="um-modal-header">
              <div><p>Chi tiết yêu cầu</p><h2 id="request-detail-title">Yêu cầu #{viewRequest.requestId}</h2></div>
              <button type="button" className="um-icon-button" disabled={requestActionSaving} onClick={() => setViewRequest(null)} aria-label="Đóng"><X size={18} /></button>
            </div>
            <div className="um-modal-body detail">
              <p><strong>Tài khoản:</strong> {viewRequest.member?.fullName || '-'} - {viewRequest.member?.email || '-'}</p>
              <p><strong>Số điện thoại:</strong> {viewRequest.member?.phoneNumber || '-'}</p>
              <p><strong>Sách:</strong> {viewRequest.items?.map((item) => item.title).filter(Boolean).join(' | ') || '-'}</p>
              <p><strong>Mã bản sao:</strong> {viewRequest.items?.map((item) => item.barcode).filter(Boolean).join(' | ') || '-'}</p>
              <p><strong>Thời gian đặt:</strong> {formatDate(viewRequest.requestDate)}</p>
              <p><strong>Trạng thái:</strong> {requestStatusLabels[viewRequest.status] || viewRequest.status}</p>
              {viewRequest.status === 'PENDING' && (
                <label>Lý do từ chối
                  <textarea maxLength={500} value={requestRejectionReason} onChange={(event) => setRequestRejectionReason(event.target.value)} placeholder="Chỉ cần nhập khi từ chối yêu cầu" />
                </label>
              )}
            </div>
            {viewRequest.status === 'PENDING' && (
              <div className="um-modal-actions">
                <button className="um-secondary-button" disabled={requestActionSaving} onClick={rejectBorrowRequest}>Từ chối</button>
                <button className="um-primary-button" disabled={requestActionSaving} onClick={approveBorrowRequest}>{requestActionSaving ? 'Đang xử lý...' : 'Duyệt yêu cầu'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {borrowingAction && (
        <div className="um-modal-backdrop" onMouseDown={() => { if (!borrowingActionSaving) setBorrowingAction(null); }}>
          <div className="um-modal" role="dialog" aria-modal="true" aria-labelledby="return-borrowing-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="um-modal-header">
              <div><p>FE07 • Trả sách</p><h2 id="return-borrowing-title">Xác nhận trả sách</h2></div>
              <button type="button" className="um-icon-button" disabled={borrowingActionSaving} onClick={() => setBorrowingAction(null)} aria-label="Đóng"><X size={18} /></button>
            </div>
            <div className="um-modal-body">
              <p><strong>Thành viên:</strong> {borrowingAction.memberName}</p>
              <p><strong>Sách:</strong> {borrowingAction.bookTitle} ({borrowingAction.barcode})</p>
              <label>Tình trạng sách
                <select value={returnCondition} onChange={(event) => setReturnCondition(event.target.value)}>
                  <option value="NORMAL">Bình thường</option>
                  <option value="DAMAGED">Hư hỏng</option>
                  <option value="LOST">Mất sách</option>
                </select>
              </label>
            </div>
            <div className="um-modal-actions">
              <button type="button" className="um-secondary-button" disabled={borrowingActionSaving} onClick={() => setBorrowingAction(null)}>Hủy</button>
              <button type="button" className="um-primary-button" disabled={borrowingActionSaving} onClick={returnBorrowing}>{borrowingActionSaving ? 'Đang xử lý...' : 'Ghi nhận trả sách'}</button>
            </div>
          </div>
        </div>
      )}

      <MembershipReviewModal
        key={membershipReview?.applicationId || membershipReview?.id || 'membership-review'}
        application={membershipReview}
        saving={membershipSaving}
        onApprove={() => approveMembershipApplication(membershipReview)}
        onReject={rejectMembershipApplication}
        onClose={() => setMembershipReview(null)}
      />

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}

      <style>{`
        .um-shell { min-height: 100vh; background: #f5f7fb; color: #1f2937; display: flex; font-family: var(--sans); }
        .um-sidebar { width: 248px; background: #17202a; color: #edf2f7; padding: 22px 16px; display: flex; flex-direction: column; gap: 28px; position: sticky; top: 0; height: 100vh; }
        .um-brand { display: flex; gap: 12px; align-items: center; padding: 4px 6px 18px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .um-brand-mark { width: 42px; height: 42px; border-radius: 8px; display: grid; place-items: center; background: #2f80ed; color: #fff; }
        .um-brand strong, .um-brand span { display: block; }
        .um-brand span { color: #9fb0c3; font-size: 12px; margin-top: 2px; }
        .um-nav, .um-sidebar-footer { display: flex; flex-direction: column; gap: 8px; }
        .um-nav { flex: 1; overflow-y: auto; }
        .um-nav button { min-height: 42px; border-radius: 8px; color: #cbd5e1; display: flex; align-items: center; gap: 10px; padding: 0 12px; border: 0; background: transparent; cursor: pointer; font-size: 16px; text-align: left; }
        .um-nav button.active, .um-nav button:hover { background: #243244; color: #fff; }
        .um-sidebar-footer { margin-top: auto; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px; }
        .um-session { display: grid; gap: 7px; padding: 0 0 10px; color: #cbd5e1; }
        .um-session span { color: #9fb0c3; font-size: 12px; }
        .um-session strong { color: #fff; font-size: 13px; overflow-wrap: anywhere; }
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
        .um-stats.dashboard { grid-template-columns: repeat(5, minmax(180px, 1fr)); }
        .um-stat { padding: 16px; display: flex; gap: 12px; align-items: center; }
        .um-stat svg { color: #2f80ed; flex-shrink: 0; }
        .um-stat.dashboard-card svg { width: 52px; height: 52px; padding: 13px; border-radius: 6px; background: #edf5ff; }
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
        .um-chart-grid { display: grid; gap: 18px; }
        .um-chart-grid-secondary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .um-panel.chart { overflow: hidden; }
        .um-chart-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
        .um-chart-head h2 { margin: 0; }
        .um-chart-head span { color: #64748b; font-size: 13px; font-weight: 800; }
        .um-line-chart { width: 100%; height: 260px; overflow: visible; }
        .um-line-chart line { stroke: #d8dee8; stroke-width: 1; }
        .um-line-chart line.vertical-grid { stroke: #e4e8ee; }
        .um-line-chart path { fill: none; stroke: #9ca3af; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
        .um-line-chart circle { fill: #dc2626; stroke: #fff; stroke-width: 1.5; }
        .um-line-chart text { fill: #475569; font-size: 10px; text-anchor: middle; }
        .um-line-chart text.axis-label { fill: #7a7165; font-size: 9px; text-anchor: end; }
        .um-line-chart text.value { fill: #2a2118; font-size: 11px; font-weight: 800; }
        .um-chart-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; border-top: 1px solid #eef2f7; padding-top: 12px; }
        .um-chart-list div { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #f8fafc; border: 1px solid #eef2f7; border-radius: 8px; padding: 8px 10px; }
        .um-chart-list span { color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .um-chart-list strong { color: #1d4ed8; }
        .um-chart-empty { min-height: 180px; display: grid; place-items: center; align-content: center; gap: 7px; color: #6b6153; text-align: center; }
        .um-chart-empty svg { color: #a87532; }
        .um-chart-empty strong { color: #2a2118; }
        .um-chart-empty span { font-size: 13px; }
        .um-dashboard-status { min-height: 32px; margin: -4px 0 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #6b6153; font-size: 12px; }
        .um-dashboard-status strong { color: #c1452f; font-weight: 600; }
        .um-dashboard-loading { min-height: 240px; display: grid; place-items: center; color: #6b6153; background: #fffdf8; border: 1px solid #e7ddca; border-radius: 16px; }
        .is-spinning { animation: um-spin .8s linear infinite; }
        @keyframes um-spin { to { transform: rotate(360deg); } }
        .um-admin-section { display: grid; gap: 16px; }
        .um-permission-status-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .um-permission-status-grid article { padding: 14px; display: grid; gap: 8px; border: 1px solid var(--um-line); border-radius: 12px; background: var(--um-surface); }
        .um-permission-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }
        .um-permission-cards article { min-height: 96px; border: 1px solid #d7dee8; border-radius: 8px; background: #fff; color: #1f2937; padding: 14px; display: grid; gap: 8px; align-content: center; justify-items: start; }
        .um-permission-cards strong { font-size: 28px; }
        .um-permission-cards span:last-child { color: #64748b; }
        .um-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .um-tabs button { min-height: 38px; border-radius: 8px; border: 1px solid #d7dee8; background: #fff; color: #334155; display: inline-flex; align-items: center; gap: 8px; padding: 0 13px; cursor: pointer; font-weight: 800; }
        .um-tabs button.active { background: #2f80ed; color: #fff; border-color: #2f80ed; }
        .um-toolbar.requests { grid-template-columns: minmax(260px, 1fr) 170px 150px 150px auto auto; }
        .um-toolbar.audit { display: grid; grid-template-columns: minmax(260px, 1fr) 190px 100px 150px 150px auto auto; margin-bottom: 0; }
        .um-toolbar.audit > input { min-width: 0; min-height: 40px; border: 1px solid #d7dee8; border-radius: 8px; padding: 0 12px; }
        .um-toolbar input[type="date"] { min-height: 40px; border: 1px solid #d7dee8; border-radius: 8px; padding: 0 12px; }
        .um-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .um-form-grid .span-2 { grid-column: span 2; }
        .um-modal.wide { width: min(760px, 100%); }
        .um-modal-body.detail p { margin: 0; color: #334155; }
        .um-mini-list, .um-shortcuts, .um-role-summary { display: grid; gap: 10px; }
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
        .status-pending { background: #dbeafe; color: #1d4ed8; }
        .status-approved, .status-completed, .status-returned { background: #dcfce7; color: #15803d; }
        .status-borrowed, .status-overdue { background: #fef3c7; color: #b45309; }
        .status-rejected, .status-cancelled, .status-lost, .status-damaged { background: #fee2e2; color: #b91c1c; }
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
        .um-related-summary { display: grid; gap: 8px; margin: 0 0 24px; }
        .um-related-summary > div { display: grid; grid-template-columns: 20px 1fr auto; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc; color: #475569; }
        .um-related-summary strong { color: #0f172a; }
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

        /* Admin console visual alignment with the shared librarian shell.
           Content, navigation entries, permissions, and data flows stay unchanged. */
        .um-shell {
          --um-accent: #a87532;
          --um-accent-dark: #7b5528;
          --um-accent-soft: rgba(168, 117, 50, 0.12);
          --um-canvas: #faf6ef;
          --um-surface: #fffdf8;
          --um-line: #e7ddca;
          --um-ink: #2a2118;
          --um-muted: #6b6153;
          background: var(--um-canvas);
          color: var(--um-ink);
          font-family: system-ui, 'Segoe UI', Roboto, Arial, sans-serif;
        }
        .um-sidebar {
          background: var(--um-surface);
          color: var(--um-ink);
          border-right: 1px solid var(--um-line);
          padding: 18px 14px;
          gap: 18px;
        }
        .um-brand {
          border-bottom: 0;
          padding: 6px 8px 16px;
        }
        .um-brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: var(--um-accent);
        }
        .um-brand strong {
          color: var(--um-ink);
          font-family: var(--heading);
          font-size: 17px;
        }
        .um-brand span,
        .um-session span { color: var(--um-muted); }
        .um-nav { gap: 6px; }
        .um-nav button,
        .um-sidebar-footer button {
          min-height: 42px;
          border-radius: 10px;
          color: var(--um-muted);
          font-size: 14px;
        }
        .um-nav button.active,
        .um-nav button:hover,
        .um-sidebar-footer button:hover {
          background: var(--um-accent-soft);
          color: var(--um-accent-dark);
        }
        .um-sidebar-footer {
          border-top-color: var(--um-line);
        }
        .um-session { color: var(--um-muted); }
        .um-session strong { color: var(--um-ink); }
        .um-main { padding: 28px 32px 60px; }
        .um-topbar,
        .um-toolbar,
        .um-content,
        .um-stat,
        .um-panel {
          background: var(--um-surface);
          border-color: var(--um-line);
          border-radius: 16px;
          box-shadow: 0 6px 20px -8px rgba(80, 60, 20, 0.18);
        }
        .um-topbar {
          padding: 18px 20px;
          margin-bottom: 20px;
        }
        .um-topbar p,
        .um-modal-header p { color: var(--um-accent-dark); }
        .um-topbar h1,
        .um-panel h2,
        .um-modal-header h2,
        .um-drawer h2 {
          color: var(--um-ink);
          /* Use the shared Unicode-capable heading font for Vietnamese diacritics. */
          font-family: var(--heading);
        }
        .um-primary-button {
          background: var(--um-accent);
        }
        .um-primary-button:hover { background: var(--um-accent-dark); }
        .um-secondary-button,
        .um-icon-button,
        .um-search,
        .um-toolbar select,
        .um-toolbar input[type="date"],
        .um-modal input,
        .um-modal textarea,
        .um-modal select {
          border-color: var(--um-line);
          color: var(--um-ink);
        }
        .um-stat svg,
        .um-chart-list strong { color: var(--um-accent-dark); }
        .um-stat.dashboard-card svg {
          background: var(--um-accent-soft);
          border-radius: 11px;
        }
        .um-stat span,
        .um-chart-head span,
        .um-user-cell span { color: var(--um-muted); }
        .um-tabs button.active {
          background: var(--um-accent);
          border-color: var(--um-accent);
        }
        .um-table th { background: #f4ecdd; color: var(--um-muted); border-color: var(--um-line); }
        .um-table td { color: var(--um-ink); border-color: var(--um-line); }
        .um-table tr:hover { background: #faf6ef; }
        .um-audit-content { display: grid; gap: 18px; overflow: visible; background: transparent; border: 0; border-radius: 0; box-shadow: none; }
        .um-audit-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .um-audit-summary article { min-height: 112px; padding: 18px; display: flex; align-items: center; gap: 14px; border: 1px solid var(--um-line); border-radius: 16px; background: var(--um-surface); box-shadow: 0 6px 18px rgba(77, 52, 31, 0.06); }
        .um-audit-summary-icon { width: 46px; height: 46px; flex: 0 0 46px; display: grid; place-items: center; border-radius: 13px; color: var(--um-accent-dark); background: var(--um-accent-soft); }
        .um-audit-summary article div { min-width: 0; display: grid; gap: 2px; }
        .um-audit-summary small { color: var(--um-muted); font-size: 12px; font-weight: 700; }
        .um-audit-summary strong { color: var(--um-ink); font-size: 25px; line-height: 1.2; }
        .um-audit-summary strong.time { font-size: 22px; }
        .um-audit-summary strong em { margin-left: 3px; color: var(--um-muted); font-size: 14px; font-style: normal; font-weight: 600; }
        .um-audit-summary article div > span { overflow: hidden; color: var(--um-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
        .um-audit-table-heading { margin-bottom: -18px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border: 1px solid var(--um-line); border-bottom: 0; border-radius: 16px 16px 0 0; background: var(--um-surface); }
        .um-audit-table-heading h2 { margin: 0 0 4px; color: var(--um-ink); font-family: var(--heading); font-size: 21px; }
        .um-audit-table-heading p { margin: 0; color: var(--um-muted); font-size: 13px; }
        .um-audit-table-heading > span { padding: 6px 10px; border-radius: 999px; color: var(--um-accent-dark); background: var(--um-accent-soft); font-size: 12px; font-weight: 700; white-space: nowrap; }
        .um-table-wrap { overflow: hidden; border: 1px solid var(--um-line); border-radius: 0 0 16px 16px; background: var(--um-surface); box-shadow: 0 8px 20px rgba(77, 52, 31, 0.06); }
        .um-audit-table { min-width: 1180px; }
        .um-audit-table th:nth-child(1) { width: 17%; }
        .um-audit-table th:nth-child(2) { width: 19%; }
        .um-audit-table th:nth-child(3) { width: 16%; }
        .um-audit-table th:nth-child(4) { width: 25%; }
        .um-audit-table th:nth-child(5) { width: 8%; }
        .um-audit-table th:nth-child(6) { width: 15%; }
        .um-audit-table td { vertical-align: middle; }
        .um-audit-table td strong, .um-audit-table td small { display: block; }
        .um-audit-table td small { margin-top: 4px; color: var(--um-muted); font-size: 12px; }
        .um-audit-table code { color: var(--um-muted); font-family: inherit; }
        .um-audit-action { display: inline-flex; padding: 6px 10px; border-radius: 999px; background: var(--um-accent-soft); color: var(--um-accent-dark); font-size: 12px; font-weight: 700; }
        .um-audit-details { margin: 0; display: grid; gap: 4px; }
        .um-audit-details div { display: grid; grid-template-columns: minmax(90px, auto) 1fr; gap: 8px; }
        .um-audit-details dt { color: var(--um-muted); font-size: 11px; font-weight: 800; }
        .um-audit-details dd { margin: 0; overflow-wrap: anywhere; font-size: 12px; }
        .um-table-pagination {
          padding: 14px 16px;
          border-top: 1px solid var(--um-line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: var(--um-muted);
          font-size: 14px;
        }
        .um-table-pagination > div { display: flex; align-items: center; gap: 6px; }
        .um-table-pagination button {
          min-width: 36px;
          min-height: 36px;
          padding: 0 10px;
          border: 1px solid var(--um-line);
          border-radius: 8px;
          background: var(--um-surface);
          color: var(--um-ink);
          cursor: pointer;
        }
        .um-table-pagination button.active { background: var(--um-accent); border-color: var(--um-accent); color: #fff; }
        .um-table-pagination button:disabled { opacity: 0.45; cursor: not-allowed; }
        .um-panel,
        .um-permission-cards article,
        .um-mini-list button,
        .um-shortcuts button,
        .um-role-summary button,
        .um-role-summary.compact div { border-color: var(--um-line); }
        .um-modal,
        .um-drawer { background: var(--um-surface); }
        .um-modal-header,
        .um-modal-actions { border-color: var(--um-line); }
        .um-note { background: var(--um-accent-soft); border-color: var(--um-line); color: var(--um-accent-dark); }
        .um-admin-section .membership-toolbar {
          margin: 18px 0 16px;
          padding: 14px;
          border: 1px solid var(--um-line);
          border-radius: 12px;
          background: #fffaf2;
          gap: 10px;
        }
        .um-admin-section .membership-toolbar .search-input {
          min-width: 280px;
          flex: 1 1 420px;
        }
        .um-admin-section .membership-toolbar .btn { white-space: nowrap; }
        @media (max-width: 900px) {
          .um-shell { display: block; }
          .um-sidebar { width: 100%; height: auto; position: static; }
          .um-nav, .um-sidebar-footer { flex-direction: row; flex-wrap: wrap; }
          .um-topbar, .um-toolbar { align-items: stretch; flex-direction: column; }
          .um-stats, .um-stats.dashboard { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .um-permission-status-grid { grid-template-columns: 1fr; }
          .um-panel-grid, .um-role-summary { grid-template-columns: 1fr; }
          .um-chart-grid-secondary { grid-template-columns: 1fr; }
          .um-audit-summary { grid-template-columns: 1fr; }
          .um-audit-table-heading { align-items: flex-start; }
          .um-chart-card { grid-template-columns: 1fr; justify-items: center; }
          .um-toolbar.requests, .um-toolbar.audit, .um-form-grid { grid-template-columns: 1fr; }
          .um-admin-section .membership-toolbar { align-items: stretch; }
          .um-admin-section .membership-toolbar .search-input { min-width: 0; }
          .um-table-pagination { align-items: flex-start; flex-direction: column; }
          .um-table-pagination > div { max-width: 100%; flex-wrap: wrap; }
          .um-form-grid .span-2 { grid-column: auto; }
        }
      `}</style>
    </div>
  );
}

export default UserManagement;
