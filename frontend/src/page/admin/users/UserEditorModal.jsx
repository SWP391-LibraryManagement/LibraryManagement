import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { validateUserCreateForm } from './userPresentation';

export function UserEditorModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    type: 'member',
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previouslyFocused = document.activeElement;
    const firstField = formRef.current?.querySelector('input,select,textarea');
    firstField?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [onClose]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateUserCreateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={() => { if (!saving) onClose(); }}>
      <form
        ref={formRef}
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="admin-modal__header">
          <div>
            <p>Tạo tài khoản mới</p>
            <h2 id="admin-user-editor-title">Thêm người dùng</h2>
          </div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Đóng">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="admin-modal__body">
          <label className="admin-field">
            <span>Loại tài khoản</span>
            <select value={form.type} onChange={(event) => update('type', event.target.value)}>
              <option value="member">Thành viên</option>
              <option value="librarian">Thủ thư</option>
            </select>
          </label>

          <label className="admin-field">
            <span>Họ và tên</span>
            <input value={form.fullName} maxLength={100} onChange={(event) => update('fullName', event.target.value)} />
            {errors.fullName ? <small className="admin-field-error">{errors.fullName}</small> : null}
          </label>

          <label className="admin-field">
            <span>Email</span>
            <input type="email" value={form.email} maxLength={255} onChange={(event) => update('email', event.target.value)} />
            {errors.email ? <small className="admin-field-error">{errors.email}</small> : null}
          </label>

          <label className="admin-field">
            <span>Số điện thoại</span>
            <input value={form.phone} maxLength={20} onChange={(event) => update('phone', event.target.value)} />
            {errors.phone ? <small className="admin-field-error">{errors.phone}</small> : null}
          </label>

          <label className="admin-field admin-field--wide">
            <span>Địa chỉ</span>
            <textarea value={form.address} maxLength={255} onChange={(event) => update('address', event.target.value)} />
            {errors.address ? <small className="admin-field-error">{errors.address}</small> : null}
          </label>

          <p className="admin-form-note admin-field--wide">
            Tài khoản mới ở trạng thái chưa kích hoạt. Người dùng phải hoàn tất thiết lập mật khẩu qua email trước khi đăng nhập.
          </p>
        </div>

        <footer className="admin-modal__actions">
          <button type="button" disabled={saving} onClick={onClose}>Hủy</button>
          <button className="admin-modal__primary" type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Tạo tài khoản'}
          </button>
        </footer>
      </form>
    </div>
  );
}
