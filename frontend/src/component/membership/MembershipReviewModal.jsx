import { Check, X } from 'lucide-react';
import { useState } from 'react';

import { Modal } from '../shared/Feedback';
import MembershipStatusBadge from './MembershipStatusBadge';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function MembershipReviewModal({ application, saving, onApprove, onReject, onClose }) {
  const [reason, setReason] = useState('');

  if (!application) return null;

  return (
    <Modal
      title={`Don membership #${application.applicationId || application.id}`}
      eyebrow={application.fullName || application.email}
      onClose={onClose}
      width={640}
      actions={(
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Dong</button>
          <button type="button" className="btn btn-danger" onClick={() => onReject(reason)} disabled={saving}>
            <X size={16} /> Tu choi
          </button>
          <button type="button" className="btn btn-success" onClick={onApprove} disabled={saving}>
            <Check size={16} /> Duyet
          </button>
        </>
      )}
    >
      <div className="info-list">
        <div className="info-row">Nguoi nop: <strong>{application.fullName || application.name || application.userName || '-'}</strong></div>
        <div className="info-row">Email: <strong>{application.email || '-'}</strong></div>
        <div className="info-row">Ngay nop: <strong>{formatDate(application.appliedAt || application.createdAt)}</strong></div>
        <div className="info-row">Trang thai: <MembershipStatusBadge status={application.status} /></div>
      </div>
      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="membershipRejectReason">Ly do tu choi</label>
        <textarea
          id="membershipRejectReason"
          className="textarea"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Bat buoc khi tu choi don."
        />
      </div>
    </Modal>
  );
}
