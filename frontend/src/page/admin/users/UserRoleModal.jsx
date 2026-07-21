import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { RoleBadge } from './UserBadges';

export function UserRoleModal({ user, roles, savingBlocked, onClose, onSave }) {
  const [selectedRoles, setSelectedRoles] = useState(() => new Set(user.roles || []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSelectedRoles(new Set(user.roles || []));
      setError('');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  function toggleRole(roleName) {
    const nextRoles = new Set(selectedRoles);
    if (nextRoles.has(roleName)) nextRoles.delete(roleName);
    else nextRoles.add(roleName);
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
      setError('Mỗi người dùng phải giữ ít nhất một vai trò.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(Array.from(selectedRoles));
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
          <div className="admin-role-options">
            {roles.filter((role) => role.roleName !== 'GUEST').map((role) => (
              <label key={role.roleName}>
                <input type="checkbox" checked={selectedRoles.has(role.roleName)} onChange={() => toggleRole(role.roleName)} />
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
