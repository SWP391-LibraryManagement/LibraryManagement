import { FileText, Mail, MapPin, Phone, Send, User } from 'lucide-react';
import { useState } from 'react';

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  note: '',
};

export default function MembershipApplicationForm({ applicant, disabled, saving, onSubmit }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    fullName: applicant?.fullName || applicant?.name || '',
    email: applicant?.email || '',
  }));
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  function submit(event) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Vui long nhap day du ho ten, email, so dien thoai va dia chi.');
      return;
    }
    onSubmit({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      note: form.note.trim(),
    });
  }

  return (
    <form className="lib-card" onSubmit={submit}>
      <h2 className="lib-card-title">Nop don dang ky</h2>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="membershipFullName"><User size={14} /> Ho ten</label>
          <input id="membershipFullName" className="input" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} disabled={disabled || saving} required />
        </div>
        <div className="field">
          <label htmlFor="membershipEmail"><Mail size={14} /> Email</label>
          <input id="membershipEmail" className="input" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} disabled={disabled || saving} required />
        </div>
        <div className="field">
          <label htmlFor="membershipPhone"><Phone size={14} /> So dien thoai</label>
          <input id="membershipPhone" className="input" value={form.phone} onChange={(event) => update('phone', event.target.value)} disabled={disabled || saving} required />
        </div>
        <div className="field">
          <label htmlFor="membershipAddress"><MapPin size={14} /> Dia chi</label>
          <input id="membershipAddress" className="input" value={form.address} onChange={(event) => update('address', event.target.value)} disabled={disabled || saving} required />
        </div>
        <div className="field">
          <label htmlFor="membershipNote"><FileText size={14} /> Ghi chu</label>
          <textarea id="membershipNote" className="textarea" value={form.note} onChange={(event) => update('note', event.target.value)} disabled={disabled || saving} placeholder="Ly do dang ky hoac thong tin bo sung." />
        </div>
      </div>
      {error && <p className="field-error" style={{ marginTop: 10 }}>{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={disabled || saving} style={{ marginTop: 14 }}>
        <Send size={16} /> Gui don dang ky
      </button>
      {disabled && <p className="field-hint" style={{ marginTop: 8 }}>Chi gui duoc khi chua co don pending/approved.</p>}
    </form>
  );
}
