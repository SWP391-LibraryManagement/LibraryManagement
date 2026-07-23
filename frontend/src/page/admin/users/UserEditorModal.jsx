import { X } from 'lucide-react';
import { useState } from 'react';

import { validateUserForm } from './userPresentation';

export function UserEditorModal({ mode, user, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const isCurrentLibrarian = user?.roles?.includes('LIBRARIAN') === true;
  const expectedUpdatedAt = user?.updatedAt || '';
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

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateUserForm(form, { mode });
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
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <form
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-editor-title"
        data-expected-updated-at={expectedUpdatedAt}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="admin-modal__header">
          <div>
            <p>{isEdit ? 'Cập nhật thông tin' : 'Tạo tài khoản FE11'}</p>
            <h2 id="admin-user-editor-title">{isEdit ? 'Cập nhật người dùng' : 'Thêm người dùng'}</h2>
          </div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Đóng">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="admin-modal__body">
          {!isEdit ? (
            <label className="admin-field">
              <span>Loại tài khoản</span>
              <select value={form.type} onChange={(event) => update('type', event.target.value)}>
                <option value="member">Thành viên</option>
                <option value="librarian">Thủ thư</option>
              </select>
            </label>
          ) : null}

          <label className="admin-field">
            <span>Họ và tên</span>
            <input value={form.fullName} maxLength={100} readOnly={isEdit} aria-readonly={isEdit} onChange={isEdit ? undefined : (event) => update('fullName', event.target.value)} />
            {errors.fullName ? <small className="admin-field-error">{errors.fullName}</small> : null}
          </label>

          <label className="admin-field">
            <span>Email</span>
            <input type="email" value={form.email} maxLength={255} readOnly={isEdit} aria-readonly={isEdit} onChange={isEdit ? undefined : (event) => update('email', event.target.value)} />
            {errors.email ? <small className="admin-field-error">{errors.email}</small> : null}
          </label>

          <label className="admin-field">
            <span>Số điện thoại</span>
            <input value={form.phone} maxLength={20} readOnly={isEdit} aria-readonly={isEdit} onChange={isEdit ? undefined : (event) => update('phone', event.target.value)} />
            {errors.phone ? <small className="admin-field-error">{errors.phone}</small> : null}
          </label>

          <label className="admin-field admin-field--wide">
            <span>Địa chỉ</span>
            <textarea value={form.address} maxLength={255} readOnly={isEdit} aria-readonly={isEdit} onChange={isEdit ? undefined : (event) => update('address', event.target.value)} />
            {errors.address ? <small className="admin-field-error">{errors.address}</small> : null}
          </label>

          {(!isEdit && form.type === 'librarian') || (isEdit && isCurrentLibrarian) ? (
            <>
              <label className="admin-field">
                <span>Phòng ban</span>
                <input value={form.department} maxLength={100} onChange={(event) => update('department', event.target.value)} />
                {errors.department ? <small className="admin-field-error">{errors.department}</small> : null}
              </label>
              <label className="admin-field">
                <span>Chuyên môn</span>
                <input value={form.specialization} maxLength={100} onChange={(event) => update('specialization', event.target.value)} />
                {errors.specialization ? <small className="admin-field-error">{errors.specialization}</small> : null}
              </label>
            </>
          ) : null}

          <p className="admin-form-note admin-field--wide">
            {isEdit
              ? 'Thông tin cá nhân do người dùng tự quản lý. Quản trị viên chỉ cập nhật phòng ban và chuyên môn của Thủ thư.'
              : 'Tài khoản mới ở trạng thái chưa kích hoạt. Người dùng phải hoàn tất thiết lập mật khẩu qua email trước khi đăng nhập.'}
          </p>
        </div>

        <footer className="admin-modal__actions">
          <button type="button" disabled={saving} onClick={onClose}>Hủy</button>
          <button className="admin-modal__primary" type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </button>
        </footer>
      </form>
    </div>
  );
}
