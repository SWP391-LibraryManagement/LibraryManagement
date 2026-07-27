import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { RoleBadge } from './UserBadges';

export function UserRoleModal({ user, roles, savingBlocked, onClose, onSave }) {
  const [selectedRole, setSelectedRole] = useState(() => user.roles?.[0] || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSelectedRole(user.roles?.[0] || '');
      setError('');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  async function handleSave(event) {
    event.preventDefault();
    if (savingBlocked) {
      setError('Không thể lưu cho đến khi trạng thái vai trò được tải lại.');
      return;
    }
    if (!selectedRole) {
      setError('Mỗi tài khoản phải có đúng một vai trò.');
      return;
    }
    if (!roles.some((role) => role.roleName === selectedRole)) {
      setError('Vai trò được chọn không còn hợp lệ. Vui lòng tải lại danh mục vai trò.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(selectedRole);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={() => { if (!saving) onClose(); }}>
      <form
        className="admin-modal admin-modal--compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-role-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSave}
      >
        <header className="admin-modal__header">
          <div><p>Vai trò FE11</p><h2 id="admin-user-role-title">Quản lý vai trò</h2></div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button>
        </header>
        <div className="admin-modal__body admin-modal__body--single">
          <div className="admin-role-user"><strong>{user.fullName || user.email}</strong><span>{user.email}</span></div>
          <p className="admin-form-hint">
            Mỗi tài khoản có đúng một vai trò. Sau khi thay đổi, người dùng phải đăng nhập lại để nhận quyền mới.
          </p>
          <div className="admin-role-options">
            {roles.filter((role) => role.roleName !== 'GUEST').map((role) => (
              <label key={role.roleName}>
                <input
                  type="radio"
                  name="user-role"
                  value={role.roleName}
                  checked={selectedRole === role.roleName}
                  onChange={() => { setSelectedRole(role.roleName); setError(''); }}
                />
                <RoleBadge role={role.roleName} />
              </label>
            ))}
          </div>
          {error ? <p className="admin-form-error">{error}</p> : null}
        </div>
        <footer className="admin-modal__actions">
          <button type="button" disabled={saving} onClick={onClose}>Hủy</button>
          <button className="admin-modal__primary" type="submit" disabled={saving || savingBlocked}>
            {saving ? 'Đang lưu...' : 'Lưu vai trò'}
          </button>
        </footer>
      </form>
    </div>
  );
}
