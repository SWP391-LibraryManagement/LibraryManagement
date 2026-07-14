import { useState } from 'react';
import SaveIcon from '@mui/icons-material/Save';

import { Modal } from '../shared/Feedback';

export default function EditBookModal({ book, onSave, onClose }) {
  const [form, setForm] = useState({ ...book });
  const [errors, setErrors] = useState({});

  const handle = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  function validate() {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Tên đầu sách không được để trống';
    if (!form.author.trim()) nextErrors.author = 'Tác giả không được để trống';
    if (!form.isbn.trim()) nextErrors.isbn = 'ISBN không được để trống';
    if (!form.genre.trim()) nextErrors.genre = 'Thể loại không được để trống';
    return nextErrors;
  }

  function handleSave() {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSave({ ...form, publishYear: Number(form.publishYear) });
  }

  return (
    <Modal
      title="Chỉnh sửa thông tin đầu sách"
      onClose={onClose}
      width={580}
      actions={(
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}><SaveIcon fontSize="small" /> Lưu thay đổi</button>
        </>
      )}
    >
      <div className="form-grid cols-2">
        {[
          ['title', 'Tên đầu sách', 'text'],
          ['author', 'Tác giả', 'text'],
          ['genre', 'Thể loại', 'text'],
          ['isbn', 'ISBN', 'text'],
          ['publishYear', 'Năm xuất bản', 'number'],
          ['publisher', 'Nhà xuất bản', 'text'],
        ].map(([field, label, type]) => (
          <div className="field" key={field}>
            <label htmlFor={`inventory-${field}`}>{label}</label>
            <input id={`inventory-${field}`} className="input" type={type} value={form[field]} onChange={handle(field)} />
            {errors[field] && <span className="field-error">{errors[field]}</span>}
          </div>
        ))}
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="inventory-description">Mô tả</label>
          <textarea id="inventory-description" className="textarea" value={form.description} onChange={handle('description')} rows={3} />
        </div>
      </div>
    </Modal>
  );
}
