import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  BookOpen,
  Calendar,
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
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react';

import { getFineRecords, saveFineRecords } from '../utils/libraryWorkflow';
import { adminApi } from '../api/adminApi';
import { membershipApi } from '../api/libraryFeatureApi';
import LogoutConfirmModal from '../component/layout/LogoutConfirmModal';
import MembershipApplicationsTable from '../component/membership/MembershipApplicationsTable';
import MembershipFilter from '../component/membership/MembershipFilter';
import MembershipReviewModal from '../component/membership/MembershipReviewModal';
import {
  createManagedUser,
  deactivateManagedUser,
  assignManagedUserRole,
  ensureManagedUserAccess,
  fetchAuditLogs,
  fetchManagedUser,
  fetchRoles,
  fetchUsers,
  revokeManagedUserRole,
  updateManagedUser,
} from '../api/userManagementApi';
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
const allowDevUserManagementWithoutLogin = import.meta.env.MODE !== 'production';
const permissionRows = [
  { name: 'View users', admin: true, librarian: false, member: false },
  { name: 'Create accounts', admin: true, librarian: false, member: false },
  { name: 'Update accounts', admin: true, librarian: false, member: false },
  { name: 'Deactivate accounts', admin: true, librarian: false, member: false },
  { name: 'Manage roles', admin: true, librarian: false, member: false },
  { name: 'View audit logs', admin: true, librarian: false, member: false },
  { name: 'Manage library catalog', admin: true, librarian: true, member: false },
  { name: 'Manage authors/publishers/categories', admin: true, librarian: false, member: false },
  { name: 'Approve/reject borrow requests', admin: true, librarian: true, member: false },
  { name: 'Process returns and renewals', admin: true, librarian: true, member: false },
  { name: 'Calculate and collect fines', admin: true, librarian: true, member: false },
  { name: 'Waive or cancel fines', admin: true, librarian: false, member: false },
  { name: 'View reports', admin: true, librarian: true, member: false },
  { name: 'Create borrow request', admin: false, librarian: false, member: true },
  { name: 'View own borrowing history', admin: false, librarian: false, member: true },
];
const permissionModules = [
  { module: 'User & Role', admin: 6, librarian: 0, member: 0 },
  { module: 'Library', admin: 4, librarian: 2, member: 1 },
  { module: 'Borrow/Return', admin: 5, librarian: 5, member: 2 },
  { module: 'Fine', admin: 4, librarian: 3, member: 1 },
  { module: 'Reports', admin: 3, librarian: 2, member: 0 },
];
const libraryResources = [
  { id: 'books', label: 'Kho sách', icon: BookOpen },
  { id: 'authors', label: 'Tác giả', icon: Users },
  { id: 'publishers', label: 'Nhà xuất bản', icon: Building2 },
  { id: 'categories', label: 'Quản lý danh mục', icon: Tags },
];
const borrowingStatuses = ['ALL', 'BORROWED', 'RETURNED', 'OVERDUE', 'LOST', 'DAMAGED'];
const requestStatuses = ['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED'];
const demoDashboard = {
  summary: { totalBooks: 67, totalMembers: 23, totalAuthors: 26, totalBorrowed: 0, overdueBorrowed: 62 },
  charts: {
    mostBorrowed: [
      { label: 'Clean Code', value: 11 }, { label: 'Java', value: 8 }, { label: 'CSDL', value: 6 },
      { label: 'React', value: 5 }, { label: 'Node', value: 4 }, { label: 'SQL', value: 4 },
      { label: 'Design', value: 4 }, { label: 'Testing', value: 3 }, { label: 'UX', value: 3 }, { label: 'API', value: 3 },
    ],
    overdue: [
      { label: 'Java', value: 9 }, { label: 'C#', value: 7 }, { label: 'JS', value: 5 }, { label: 'SQL', value: 4 },
    ],
    returnedToday: [
      { label: 'Clean Code', value: 4 }, { label: 'DDD', value: 3 }, { label: 'React', value: 2 }, { label: 'Node', value: 1 },
    ],
  },
};
const demoLibraryRows = {
  books: [
    { id: 1, title: 'Clean Code', isbn: '9780132350884', category: 'Programming', author: 'Robert C. Martin', publisher: 'Prentice Hall', publishYear: 2008, totalCopies: 5, availableCopies: 3, status: 'ACTIVE' },
    { id: 2, title: 'Javaa', isbn: 'JAVA-001', category: 'Technology', author: 'James Gosling', publisher: 'Demo Press', publishYear: 2020, totalCopies: 2, availableCopies: 1, status: 'ACTIVE' },
  ],
  authors: [{ id: 1, name: 'Robert C. Martin', status: 'ACTIVE' }, { id: 2, name: 'James Gosling', status: 'ACTIVE' }],
  publishers: [{ id: 1, name: 'Prentice Hall', status: 'ACTIVE' }, { id: 2, name: 'Demo Press', status: 'ACTIVE' }],
  categories: [{ id: 1, name: 'Programming', status: 'ACTIVE' }, { id: 2, name: 'Technology', status: 'ACTIVE' }],
};
const demoBookMetadata = {
  categories: demoLibraryRows.categories,
  authors: demoLibraryRows.authors,
  publishers: demoLibraryRows.publishers,
};
const demoBorrowings = [
  { id: 332, requestId: 101, userId: 6, memberName: 'dat', email: '3eesfcs@gmail.com', bookTitle: 'Javaa', copyId: 233, barcode: 'BC-233', borrowDate: '2026-06-01', dueDate: '2026-06-02', returnDate: '', status: 'BORROWED' },
  { id: 333, requestId: 102, userId: 7, memberName: 'Nguyen Lan An', email: 'lan@example.test', bookTitle: 'Clean Code', copyId: 12, barcode: 'BC-012', borrowDate: '2026-06-16', dueDate: '2026-06-30', returnDate: '2026-06-30', status: 'RETURNED' },
];
const demoRequests = [
  { id: 1, requestDate: '2026-06-30T15:18:00', status: 'PENDING', memberName: 'Bích Hằng update', phone: '0912789876', email: 'bich@example.test', bookTitles: 'Gia đình, Bạn bè, Đất nước', categories: 'Chính trị 2', itemCount: 1 },
  { id: 2, requestDate: '2026-06-30T14:47:00', status: 'COMPLETED', memberName: 'Nguyen Lan An', phone: '84946789559', email: 'lan@example.test', bookTitles: 'Kết nối tri thức', categories: 'Test 6', itemCount: 1 },
];

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
  };
}

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

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function toDateInput(value) {
  return value ? String(value).slice(0, 10) : '';
}

function downloadCsv(filename, rows) {
  const dataRows = Array.isArray(rows) ? rows : [];
  if (!dataRows.length) return;
  const columns = Object.keys(dataRows[0]);
  const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [columns.join(','), ...dataRows.map((row) => columns.map((column) => escapeCell(row[column])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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

function Sidebar({ activeSection, currentUser, onSectionChange, onLogout, onNavigate }) {
  const items = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'library', icon: Library, label: 'Thư viện' },
    { id: 'circulation', icon: BookCopy, label: 'Quản lý mượn trả' },
    { id: 'requests', icon: ClipboardList, label: 'Quản lý yêu cầu' },
    { id: 'membership', icon: UserCog, label: 'Quản lý membership' },
    { id: 'users', icon: Users, label: 'All Users' },
    { id: 'roles', icon: Shield, label: 'Permissions' },
    { id: 'audit', icon: ClipboardList, label: 'Audit Logs' },
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
          <span>Dang dang nhap voi</span>
          <strong>{currentUser?.email || 'admin.demo@library.test'}</strong>
        </div>
        <button type="button" onClick={onLogout}>
          <LogOut size={18} />
          <span>Dang xuat</span>
        </button>
      </div>
    </aside>
  );
}

function AdminLineChart({ title, rows }) {
  const data = rows?.length ? rows : [{ label: 'No data', value: 0 }];
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
          return <line key={line} x1={pad} x2={width - pad} y1={y} y2={y} />;
        })}
        {points.map((point) => <line key={`v-${point.label}`} x1={point.x} x2={point.x} y1={pad} y2={height - pad} />)}
        <path d={path} />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" />
            <text className="value" x={point.x} y={Math.max(point.y - 10, 14)}>{point.value}</text>
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

function LibraryModal({ resource, metadata, item, onClose, onSubmit }) {
  const isBook = resource === 'books';
  const [form, setForm] = useState(() => isBook ? {
    title: item?.title || '',
    isbn: item?.isbn || '',
    categoryId: item?.categoryId || metadata.categories?.[0]?.id || '',
    authorId: item?.authorId || metadata.authors?.[0]?.id || '',
    publisherId: item?.publisherId || metadata.publishers?.[0]?.id || '',
    publishYear: item?.publishYear || item?.year || '',
    pages: item?.pages || '',
    status: item?.status || 'ACTIVE',
    description: item?.description || '',
  } : { name: item?.name || '' });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="um-modal-backdrop" onMouseDown={onClose}>
      <form className="um-modal wide" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
        <div className="um-modal-header">
          <div>
            <p>{item ? 'Update' : 'Create'}</p>
            <h2>{isBook ? 'Kho sách' : 'Danh mục thư viện'}</h2>
          </div>
          <button type="button" className="um-icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="um-modal-body">
          {isBook ? (
            <div className="um-form-grid">
              <label>Tên sách<input value={form.title} onChange={(e) => update('title', e.target.value)} required /></label>
              <label>ISBN<input value={form.isbn} onChange={(e) => update('isbn', e.target.value)} /></label>
              <label>Danh mục<select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} required>{metadata.categories.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
              <label>Tác giả<select value={form.authorId} onChange={(e) => update('authorId', e.target.value)} required>{metadata.authors.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
              <label>Nhà xuất bản<select value={form.publisherId} onChange={(e) => update('publisherId', e.target.value)}>{metadata.publishers.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
              <label>Năm xuất bản<input type="number" value={form.publishYear} onChange={(e) => update('publishYear', e.target.value)} /></label>
              <label>Số trang<input type="number" value={form.pages} onChange={(e) => update('pages', e.target.value)} /></label>
              <label>Trạng thái<select value={form.status} onChange={(e) => update('status', e.target.value)}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></label>
              <label className="span-2">Mô tả<textarea value={form.description} onChange={(e) => update('description', e.target.value)} /></label>
            </div>
          ) : (
            <label>Tên<input value={form.name} onChange={(e) => update('name', e.target.value)} required maxLength={100} /></label>
          )}
        </div>
        <div className="um-modal-actions">
          <button type="button" className="um-secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="um-primary-button">Save</button>
        </div>
      </form>
    </div>
  );
}

function BorrowingModal({ item, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    userId: item?.userId || '',
    copyId: item?.copyId || '',
    borrowDate: toDateInput(item?.borrowDate),
    dueDate: toDateInput(item?.dueDate),
    returnDate: toDateInput(item?.returnDate),
    status: item?.status || 'BORROWED',
  }));
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="um-modal-backdrop" onMouseDown={onClose}>
      <form className="um-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
        <div className="um-modal-header">
          <div><p>{item ? 'Update' : 'Create'}</p><h2>Quản lý mượn trả</h2></div>
          <button type="button" className="um-icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="um-modal-body">
          {!item && <label>User ID<input value={form.userId} onChange={(e) => update('userId', e.target.value)} required /></label>}
          {!item && <label>Copy ID<input value={form.copyId} onChange={(e) => update('copyId', e.target.value)} required /></label>}
          <label>Ngày mượn<input type="date" value={form.borrowDate} onChange={(e) => update('borrowDate', e.target.value)} /></label>
          <label>Ngày hạn<input type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} required /></label>
          <label>Ngày trả<input type="date" value={form.returnDate} onChange={(e) => update('returnDate', e.target.value)} /></label>
          <label>Trạng thái<select value={form.status} onChange={(e) => update('status', e.target.value)}>{borrowingStatuses.filter((status) => status !== 'ALL').map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        </div>
        <div className="um-modal-actions">
          <button type="button" className="um-secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="um-primary-button">Save</button>
        </div>
      </form>
    </div>
  );
}

function UserManagement() {
  const navigate = useNavigate();
  const currentAdmin = getStoredAdminUser();
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
  const [paymentFines, setPaymentFines] = useState(() => getFineRecords());
  const [dashboardData, setDashboardData] = useState(demoDashboard);
  const [libraryResource, setLibraryResource] = useState('books');
  const [libraryRows, setLibraryRows] = useState(demoLibraryRows.books);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryStatus, setLibraryStatus] = useState('ALL');
  const [libraryModal, setLibraryModal] = useState(null);
  const [bookMetadata, setBookMetadata] = useState(demoBookMetadata);
  const [borrowings, setBorrowings] = useState(demoBorrowings);
  const [borrowingFilter, setBorrowingFilter] = useState({ q: '', status: 'ALL' });
  const [borrowingModal, setBorrowingModal] = useState(null);
  const [requests, setRequests] = useState(demoRequests);
  const [requestFilter, setRequestFilter] = useState({ q: '', status: 'ALL', fromDate: '', toDate: '' });
  const [viewRequest, setViewRequest] = useState(null);
  const [membershipApplications, setMembershipApplications] = useState([]);
  const [membershipFilter, setMembershipFilter] = useState({ status: 'PENDING', search: '', page: 1, totalPages: 1 });
  const [membershipReview, setMembershipReview] = useState(null);
  const [membershipSaving, setMembershipSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const hasActiveFilters = search.trim() || roleFilter !== 'ALL' || statusFilter !== 'ALL';
  const isUserDirectorySection = activeSection === 'users';
  const sectionMeta = {
    dashboard: { eyebrow: 'Admin Overview', title: 'Dashboard' },
    users: { eyebrow: 'User Directory', title: 'All Users' },
    roles: { eyebrow: 'Access Control', title: 'Permissions' },
    audit: { eyebrow: 'System Trace', title: 'Audit Logs' },
    library: { eyebrow: 'Library', title: 'Thư viện' },
    circulation: { eyebrow: 'Borrow Return', title: 'Quản lý mượn trả' },
    requests: { eyebrow: 'Request Management', title: 'Quản lý yêu cầu' },
    membership: { eyebrow: 'Membership Review', title: 'Quản lý membership' },
    payments: { eyebrow: 'Payment Review', title: 'Confirm / Refuse Payment' },
  }[activeSection];
  const pendingPayments = paymentFines.filter((fine) => fine.paymentReviewStatus === 'PENDING');

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
  const filteredMembershipApplications = useMemo(() => {
    const keyword = membershipFilter.search.trim().toLowerCase();
    if (!keyword) return membershipApplications;

    return membershipApplications.filter((application) =>
      `${application.applicationId || application.id || ''} ${application.fullName || ''} ${application.email || ''}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [membershipApplications, membershipFilter.search]);

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
  }, [activeSection, libraryResource, membershipFilter.page, membershipFilter.status]);

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

  async function loadDashboard() {
    try {
      setDashboardData(await adminApi.dashboard());
    } catch (error) {
      setDashboardData(demoDashboard);
      setToast({ type: 'error', message: error.message });
    }
  }

  async function loadLibrary(resource = libraryResource) {
    try {
      const params = {
        q: libraryQuery.trim(),
        status: libraryStatus === 'ALL' ? '' : libraryStatus,
      };
      const result = resource === 'books'
        ? await adminApi.libraryBooks(params)
        : await adminApi.libraryResource(resource, params);
      setLibraryRows(result.data || []);
      if (resource === 'books') {
        const metadata = await adminApi.bookMetadata();
        setBookMetadata(metadata.data || { categories: [], authors: [], publishers: [] });
      }
    } catch (error) {
      setLibraryRows(demoLibraryRows[resource] || []);
      if (resource === 'books') {
        setBookMetadata(demoBookMetadata);
      }
      setToast({ type: 'error', message: error.message });
    }
  }

  async function saveLibrary(form) {
    try {
      if (libraryResource === 'books') {
        if (libraryModal?.item) {
          await adminApi.updateBook(libraryModal.item.id, form);
        } else {
          await adminApi.createBook(form);
        }
      } else if (libraryModal?.item) {
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

  async function deleteLibraryItem(row) {
    if (!window.confirm(`Delete ${row.title || row.name}?`)) return;
    try {
      if (libraryResource === 'books') {
        await adminApi.deactivateBook(row.id);
      } else {
        await adminApi.deleteResource(libraryResource, row.id);
      }
      await loadLibrary();
      setToast({ type: 'success', message: 'Item deleted.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  }

  async function loadBorrowings() {
    try {
      const result = await adminApi.borrowings({
        q: borrowingFilter.q.trim(),
        status: borrowingFilter.status === 'ALL' ? '' : borrowingFilter.status,
      });
      setBorrowings(result.data || []);
    } catch (error) {
      setBorrowings(demoBorrowings);
      setToast({ type: 'error', message: error.message });
    }
  }

  async function saveBorrowing(form) {
    try {
      if (borrowingModal?.item) {
        await adminApi.updateBorrowing(borrowingModal.item.id, form);
      } else {
        await adminApi.createBorrowing(form);
      }
      setBorrowingModal(null);
      await loadBorrowings();
      setToast({ type: 'success', message: 'Borrowing saved.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  }

  async function loadRequests() {
    try {
      const result = await adminApi.requests({
        q: requestFilter.q.trim(),
        status: requestFilter.status === 'ALL' ? '' : requestFilter.status,
        fromDate: requestFilter.fromDate,
        toDate: requestFilter.toDate,
      });
      setRequests(result.data || []);
    } catch (error) {
      setRequests(demoRequests);
      setToast({ type: 'error', message: error.message });
    }
  }

  async function loadMembershipApplications() {
    try {
      const result = normalizeMembershipList(await membershipApi.listApplications({
        status: membershipFilter.status === 'ALL' ? undefined : membershipFilter.status,
        page: membershipFilter.page,
        limit: 10,
      }));
      setMembershipApplications(result.items);
      setMembershipFilter((current) => ({ ...current, totalPages: result.totalPages }));
    } catch (error) {
      setMembershipApplications([]);
      setToast({ type: 'error', message: error.message });
    }
  }

  async function approveMembershipApplication(application) {
    if (!application) return;

    setMembershipSaving(true);
    try {
      await membershipApi.approve(application.applicationId || application.id);
      setMembershipReview(null);
      await loadMembershipApplications();
      setToast({ type: 'success', message: 'Đã xác thực đơn membership.' });
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
      setToast({ type: 'success', message: 'Đã từ chối đơn membership.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setMembershipSaving(false);
    }
  }

  async function updateRequestStatus(requestId, status) {
    try {
      await adminApi.updateRequestStatus(requestId, status);
      setViewRequest(null);
      await loadRequests();
      setToast({ type: 'success', message: 'Request status updated.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
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
            paymentReviewedBy: currentAdmin?.email || 'admin.demo@library.test',
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
            paymentReviewedBy: currentAdmin?.email || 'admin.demo@library.test',
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
              onClick={() => {
                if (activeSection === 'payments') setPaymentFines(getFineRecords());
                else if (activeSection === 'dashboard') loadDashboard();
                else if (activeSection === 'library') loadLibrary();
                else if (activeSection === 'circulation') loadBorrowings();
                else if (activeSection === 'requests') loadRequests();
                else if (activeSection === 'membership') loadMembershipApplications();
                else loadUsers();
              }}
            >
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
              <AdminLineChart title="Sách được mượn nhiều nhất" rows={dashboardData.charts?.mostBorrowed} />
              <AdminLineChart title="Danh sách mượn quá hạn" rows={dashboardData.charts?.overdue} />
              <AdminLineChart title="Danh sách trả lại hôm nay" rows={dashboardData.charts?.returnedToday} />
            </section>
          </>
        )}

        {activeSection === 'library' && (
          <section className="um-admin-section">
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
              <button className="um-secondary-button" onClick={() => loadLibrary()}>Search</button>
              <button className="um-secondary-button" onClick={() => downloadCsv(`${libraryResource}.csv`, libraryRows)}><FileDown size={16} /> Export</button>
              <button className="um-primary-button" onClick={() => setLibraryModal({ item: null })}><Plus size={16} /> Add</button>
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
                  {libraryRows.map((row, index) => libraryResource === 'books' ? (
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
                      <td><div className="um-row-actions"><button className="um-icon-button" onClick={() => setLibraryModal({ item: row })}><Edit2 size={16} /></button><button className="um-icon-button danger" onClick={() => deleteLibraryItem(row)}><Trash2 size={16} /></button></div></td>
                    </tr>
                  ) : (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      <td><strong>{row.name}</strong></td>
                      <td>{row.createdAt || 'Không lưu trong DB'}</td>
                      <td><span className="um-badge status-active">{row.status || 'ACTIVE'}</span></td>
                      <td><div className="um-row-actions"><button className="um-icon-button" onClick={() => setLibraryModal({ item: row })}><Edit2 size={16} /></button><button className="um-icon-button danger" onClick={() => deleteLibraryItem(row)}><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {libraryRows.length === 0 && <div className="um-empty">No library data found.</div>}
            </section>
          </section>
        )}

        {activeSection === 'circulation' && (
          <section className="um-admin-section">
            <div className="um-toolbar">
              <div className="um-search"><Search size={18} /><input value={borrowingFilter.q} placeholder="Search member, book, barcode..." onChange={(event) => setBorrowingFilter((current) => ({ ...current, q: event.target.value }))} /></div>
              <select value={borrowingFilter.status} onChange={(event) => setBorrowingFilter((current) => ({ ...current, status: event.target.value }))}>
                {borrowingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button className="um-secondary-button" onClick={loadBorrowings}>Search</button>
              <button className="um-secondary-button" onClick={() => downloadCsv('borrowings.csv', borrowings)}><FileDown size={16} /> Export</button>
              <button className="um-primary-button" onClick={() => setBorrowingModal({ item: null })}><Plus size={16} /> Add</button>
            </div>
            <section className="um-content">
              <table className="um-table">
                <thead><tr><th>ID</th><th>Thành viên</th><th>Sách</th><th>Barcode</th><th>Ngày mượn</th><th>Ngày hạn</th><th>Ngày trả</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {borrowings.map((row) => (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td><strong>{row.memberName}</strong><span>{row.email}</span></td>
                      <td>{row.bookTitle}</td>
                      <td>{row.barcode || `Copy #${row.copyId}`}</td>
                      <td>{formatDate(row.borrowDate)}</td>
                      <td>{formatDate(row.dueDate)}</td>
                      <td>{formatDate(row.returnDate)}</td>
                      <td><span className={`um-badge status-${String(row.status || 'active').toLowerCase()}`}>{row.status}</span></td>
                      <td><div className="um-row-actions"><button className="um-icon-button" onClick={() => setBorrowingModal({ item: row })}><Edit2 size={16} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {borrowings.length === 0 && <div className="um-empty">No borrowing records found.</div>}
            </section>
          </section>
        )}

        {activeSection === 'requests' && (
          <section className="um-admin-section">
            <div className="um-toolbar requests">
              <div className="um-search"><Search size={18} /><input value={requestFilter.q} placeholder="Tìm theo tên sách hoặc tài khoản..." onChange={(event) => setRequestFilter((current) => ({ ...current, q: event.target.value }))} /></div>
              <select value={requestFilter.status} onChange={(event) => setRequestFilter((current) => ({ ...current, status: event.target.value }))}>{requestStatuses.map((status) => <option key={status} value={status}>{status === 'PENDING' ? 'Chờ xác nhận' : status === 'COMPLETED' ? 'Hoàn thành' : status}</option>)}</select>
              <input type="date" value={requestFilter.fromDate} onChange={(event) => setRequestFilter((current) => ({ ...current, fromDate: event.target.value }))} />
              <input type="date" value={requestFilter.toDate} onChange={(event) => setRequestFilter((current) => ({ ...current, toDate: event.target.value }))} />
              <button className="um-secondary-button" onClick={loadRequests}>Search</button>
              <button className="um-primary-button" onClick={() => downloadCsv('requests.csv', requests)}><FileDown size={16} /> Xuất dữ liệu</button>
            </div>
            <section className="um-content">
              <table className="um-table request-table">
                <thead><tr><th>STT</th><th>Tên sách</th><th>Tài khoản</th><th>Số điện thoại</th><th>Thể loại</th><th>Thời gian đặt</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {requests.map((row, index) => (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      <td><strong>{row.bookTitles || '-'}</strong><span>{row.itemCount || 0} sách</span></td>
                      <td>{row.memberName}</td>
                      <td>{row.phone || '-'}</td>
                      <td>{row.categories || '-'}</td>
                      <td>{formatDate(row.requestDate)}</td>
                      <td><span className={`um-badge status-${String(row.status || '').toLowerCase()}`}>{row.status === 'PENDING' ? 'Chờ xác nhận' : row.status === 'COMPLETED' ? 'Hoàn thành' : row.status}</span></td>
                      <td>
                        <button
                          className="um-icon-button"
                          disabled={row.status !== 'PENDING'}
                          title={row.status === 'PENDING' ? 'Cập nhật yêu cầu' : 'Yêu cầu đã hoàn thành, không thể sửa'}
                          onClick={() => setViewRequest(row)}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length === 0 && <div className="um-empty">No requests found.</div>}
            </section>
          </section>
        )}

        {activeSection === 'membership' && (
          <section className="um-admin-section">
            <div className="um-content" style={{ padding: 18 }}>
              <div className="um-panel-title">
                <div>
                  <h2>Đơn đăng ký membership</h2>
                  <p>Admin xác thực hoặc từ chối các đơn đang chờ duyệt.</p>
                </div>
              </div>
              <MembershipFilter
                status={membershipFilter.status}
                search={membershipFilter.search}
                loading={loading}
                onStatusChange={(status) => setMembershipFilter((current) => ({ ...current, status, page: 1 }))}
                onSearchChange={(searchValue) => setMembershipFilter((current) => ({ ...current, search: searchValue }))}
                onReload={loadMembershipApplications}
              />
              <MembershipApplicationsTable
                applications={filteredMembershipApplications}
                page={membershipFilter.page}
                totalPages={membershipFilter.totalPages}
                onPageChange={(nextPage) => setMembershipFilter((current) => ({ ...current, page: nextPage }))}
                onApprove={approveMembershipApplication}
                onReject={setMembershipReview}
              />
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
                <tr key={user.userId} onClick={() => openUserDetail(user.userId)}>
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

        {activeSection === 'roles' && (
          <section className="um-admin-section">
            <div className="um-permission-cards">
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
                  <span>assigned accounts</span>
                </button>
              ))}
            </div>
            <section className="um-panel-grid permissions">
              <div className="um-panel">
                <h2>Module Coverage</h2>
                <table className="um-permission-table compact">
                  <thead><tr><th>Module</th><th>Admin</th><th>Librarian</th><th>Member</th></tr></thead>
                  <tbody>
                    {permissionModules.map((row) => (
                      <tr key={row.module}>
                        <td>{row.module}</td>
                        <td>{row.admin} rules</td>
                        <td>{row.librarian} rules</td>
                        <td>{row.member} rules</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="um-panel">
                <h2>Permission Matrix</h2>
                <table className="um-permission-table">
                  <thead><tr><th>Permission</th><th>Admin</th><th>Librarian</th><th>Member</th></tr></thead>
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
              {selectedUser.phoneNumber || '-'}
            </p>
            <p>{selectedUser.address || '-'}</p>
            <p>
              <Calendar size={16} />
              Created {formatDate(selectedUser.createdAt)}
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

      {libraryModal && (
        <LibraryModal
          resource={libraryResource}
          metadata={bookMetadata}
          item={libraryModal.item}
          onClose={() => setLibraryModal(null)}
          onSubmit={saveLibrary}
        />
      )}

      {borrowingModal && (
        <BorrowingModal
          item={borrowingModal.item}
          onClose={() => setBorrowingModal(null)}
          onSubmit={saveBorrowing}
        />
      )}

      {viewRequest && (
        <div className="um-modal-backdrop" onMouseDown={() => setViewRequest(null)}>
          <div className="um-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="um-modal-header">
              <div><p>Request detail</p><h2>Yêu cầu #{viewRequest.id}</h2></div>
              <button type="button" className="um-icon-button" onClick={() => setViewRequest(null)}><X size={18} /></button>
            </div>
            <div className="um-modal-body detail">
              <p><strong>Tài khoản:</strong> {viewRequest.memberName} - {viewRequest.email}</p>
              <p><strong>Số điện thoại:</strong> {viewRequest.phone || '-'}</p>
              <p><strong>Sách:</strong> {viewRequest.bookTitles || '-'}</p>
              <p><strong>Thể loại:</strong> {viewRequest.categories || '-'}</p>
              <p><strong>Thời gian đặt:</strong> {formatDate(viewRequest.requestDate)}</p>
              <p><strong>Trạng thái:</strong> {viewRequest.status}</p>
            </div>
            {viewRequest.status === 'PENDING' && (
              <div className="um-modal-actions">
                <button className="um-secondary-button" onClick={() => updateRequestStatus(viewRequest.id, 'REJECTED')}>Từ chối</button>
                <button className="um-primary-button" onClick={() => updateRequestStatus(viewRequest.id, 'COMPLETED')}>Hoàn thành</button>
              </div>
            )}
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
        .um-shell { min-height: 100vh; background: #f5f7fb; color: #1f2937; display: flex; font-family: Inter, system-ui, sans-serif; }
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
        .um-panel.chart { overflow: hidden; }
        .um-chart-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
        .um-chart-head h2 { margin: 0; }
        .um-chart-head span { color: #64748b; font-size: 13px; font-weight: 800; }
        .um-line-chart { width: 100%; height: 260px; }
        .um-line-chart line { stroke: #d8dee8; stroke-width: 1; }
        .um-line-chart path { fill: none; stroke: #9ca3af; stroke-width: 2.2; }
        .um-line-chart circle { fill: #dc2626; stroke: #fff; stroke-width: 1.5; }
        .um-line-chart text { fill: #475569; font-size: 10px; text-anchor: middle; }
        .um-line-chart text.value { fill: #111827; font-size: 11px; font-weight: 800; }
        .um-chart-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; border-top: 1px solid #eef2f7; padding-top: 12px; }
        .um-chart-list div { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #f8fafc; border: 1px solid #eef2f7; border-radius: 8px; padding: 8px 10px; }
        .um-chart-list span { color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .um-chart-list strong { color: #1d4ed8; }
        .um-admin-section { display: grid; gap: 16px; }
        .um-permission-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }
        .um-permission-cards button { min-height: 96px; border: 1px solid #d7dee8; border-radius: 8px; background: #fff; color: #1f2937; padding: 14px; display: grid; gap: 8px; align-content: center; justify-items: start; cursor: pointer; }
        .um-permission-cards strong { font-size: 28px; }
        .um-permission-cards span:last-child { color: #64748b; }
        .um-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .um-tabs button { min-height: 38px; border-radius: 8px; border: 1px solid #d7dee8; background: #fff; color: #334155; display: inline-flex; align-items: center; gap: 8px; padding: 0 13px; cursor: pointer; font-weight: 800; }
        .um-tabs button.active { background: #2f80ed; color: #fff; border-color: #2f80ed; }
        .um-toolbar.requests { grid-template-columns: minmax(260px, 1fr) 170px 150px 150px auto auto; }
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
        @media (max-width: 900px) {
          .um-shell { display: block; }
          .um-sidebar { width: 100%; height: auto; position: static; }
          .um-nav, .um-sidebar-footer { flex-direction: row; flex-wrap: wrap; }
          .um-topbar, .um-toolbar { align-items: stretch; flex-direction: column; }
          .um-stats, .um-stats.dashboard { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .um-panel-grid, .um-role-summary { grid-template-columns: 1fr; }
          .um-chart-card { grid-template-columns: 1fr; justify-items: center; }
          .um-toolbar.requests, .um-form-grid { grid-template-columns: 1fr; }
          .um-form-grid .span-2 { grid-column: auto; }
        }
      `}</style>
    </div>
  );
}

export default UserManagement;
