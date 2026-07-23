import { Banknote, BookCopy, Calendar, ClipboardList, Mail, Pencil, Phone, PowerOff, Shield, X } from 'lucide-react';

import { AdminActionButton } from '../components/AdminActionButton';
import { RoleBadge, StatusBadge } from './UserBadges';
import { formatAdminDate, getPrimaryRole } from './userPresentation';

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function UserDetailDrawer({ user, onClose, onEditWork, onManageRoles, onDeactivate }) {
  return (
    <aside className="admin-user-drawer" aria-label="Chi tiết người dùng">
      <button className="admin-user-drawer__close" type="button" onClick={onClose} aria-label="Đóng chi tiết">
        <X aria-hidden="true" />
      </button>
      <div className={`admin-user-avatar admin-user-avatar--large admin-user-avatar--${getPrimaryRole(user).toLowerCase()}`}>
        {(user.fullName || user.email || '?').slice(0, 1).toUpperCase()}
      </div>
      <h2>{user.fullName || 'Chưa có tên'}</h2>
      <div className="admin-badge-row">
        {(user.roles || []).map((role) => <RoleBadge key={role} role={role} />)}
        <StatusBadge status={user.status} />
      </div>

      <div className="admin-user-detail-list">
        <p><Mail aria-hidden="true" /><span>{user.email}</span></p>
        <p><Shield aria-hidden="true" /><span>{user.username || '-'}</span></p>
        <p><Phone aria-hidden="true" /><span>{user.phoneNumber || '-'}</span></p>
        <p><span>{user.address || '-'}</span></p>
        {user.roles?.includes('LIBRARIAN') ? (
          <><p><span>{user.department || '-'}</span></p><p><span>{user.specialization || '-'}</span></p></>
        ) : null}
        <p><Calendar aria-hidden="true" /><span>Ngày tạo {formatAdminDate(user.createdAt)}</span></p>
      </div>

      <div className="admin-user-related">
        <div><BookCopy aria-hidden="true" /><span>Lượt mượn đang hoạt động</span><strong>{user.relatedSummary?.activeBorrowingCount ?? 0}</strong></div>
        <div><Banknote aria-hidden="true" /><span>Tiền phạt chưa thanh toán</span><strong>{formatCurrency(user.relatedSummary?.unpaidFineTotal ?? 0)}</strong></div>
        <div><ClipboardList aria-hidden="true" /><span>Lượt đặt chỗ đang mở</span><strong>{user.relatedSummary?.openReservationCount ?? 0}</strong></div>
      </div>

      <div className="admin-user-drawer__actions">
        {user.roles?.includes('LIBRARIAN') ? (
          <AdminActionButton icon={Pencil} label="Cập nhật công việc" onClick={() => onEditWork(user)} />
        ) : null}
        <AdminActionButton icon={Shield} label="Phân quyền" onClick={() => onManageRoles(user)} />
        <AdminActionButton
          icon={PowerOff}
          label="Vô hiệu hóa"
          tone="danger"
          disabled={!['ACTIVE', 'LOCKED'].includes(user.status)}
          title={!['ACTIVE', 'LOCKED'].includes(user.status) ? 'Tài khoản này đã ngừng hoạt động.' : undefined}
          onClick={() => onDeactivate(user)}
        />
      </div>
    </aside>
  );
}
