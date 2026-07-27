import { Banknote, BookCopy, Calendar, ClipboardList, Mail, Phone, PowerOff, Send, Shield, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

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

export function UserDetailDrawer({ user, onClose, onManageRoles, onDeactivate, onResendSetup, resending = false, detailLoading = false, canDeactivate = false, deactivateHint = '' }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previouslyFocused = document.activeElement;
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [onClose]);

  const canResendSetup = user.status === 'INACTIVE';

  return (
    <aside className="admin-user-drawer" role="dialog" aria-modal="true" aria-label="Chi tiết người dùng" tabIndex={-1}>
      <button ref={closeBtnRef} className="admin-user-drawer__close" type="button" onClick={onClose} aria-label="Đóng chi tiết">
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
        <p><Calendar aria-hidden="true" /><span>Ngày tạo {formatAdminDate(user.createdAt)}</span></p>
        <p><Calendar aria-hidden="true" /><span>Cập nhật lần cuối {formatAdminDate(user.updatedAt)}</span></p>
        <p><Calendar aria-hidden="true" /><span>Đăng nhập lần cuối {formatAdminDate(user.lastLoginAt)}</span></p>
        <p className="muted"><span>Mã người dùng #{user.userId}</span></p>
      </div>

      <div className="admin-user-related">
        <div><BookCopy aria-hidden="true" /><span>Lượt mượn đang hoạt động</span><strong>{user.relatedSummary?.activeBorrowingCount ?? 0}</strong></div>
        <div><Banknote aria-hidden="true" /><span>Tiền phạt chưa thanh toán</span><strong>{formatCurrency(user.relatedSummary?.unpaidFineTotal ?? 0)}</strong></div>
        <div><ClipboardList aria-hidden="true" /><span>Lượt đặt chỗ đang mở</span><strong>{user.relatedSummary?.openReservationCount ?? 0}</strong></div>
      </div>

      <div className="admin-user-drawer__actions">
        <AdminActionButton icon={Shield} label="Phân quyền" onClick={() => onManageRoles(user)} />
        {canResendSetup ? (
          <AdminActionButton
            icon={Send}
            label={resending ? 'Đang gửi...' : 'Gửi lại email thiết lập'}
            tone="primary"
            disabled={resending || detailLoading}
            title="Gửi lại email thiết lập mật khẩu cho tài khoản chưa hoàn tất bước thiết lập."
            onClick={() => onResendSetup(user)}
          />
        ) : null}
        <AdminActionButton
          icon={PowerOff}
          label="Vô hiệu hóa"
          tone="danger"
          disabled={!canDeactivate}
          title={deactivateHint || undefined}
          onClick={() => onDeactivate(user)}
        />
      </div>
    </aside>
  );
}
