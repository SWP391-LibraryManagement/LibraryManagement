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

  const fullName = application.fullName || application.name || application.userName || application.applicant?.fullName || application.applicant?.username || '-';
  const email = application.email || application.applicant?.email || '-';

  return (
    <Modal
      title={`Từ chối đơn membership #${application.applicationId || application.id}`}
      eyebrow={fullName || email}
      onClose={onClose}
      width={640}
      actions={(
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Đóng</button>
          <button type="button" className="btn btn-danger" onClick={() => onReject(reason)} disabled={saving}>
            <X size={16} /> Từ chối
          </button>
          <button type="button" className="btn btn-success" onClick={onApprove} disabled={saving}>
            <Check size={16} /> Xác thực
          </button>
        </>
      )}
    >
      <div className="info-list">
        <div className="info-row">Người nộp: <strong>{fullName}</strong></div>
        <div className="info-row">Email: <strong>{email}</strong></div>
        <div className="info-row">Ngày nộp: <strong>{formatDate(application.appliedAt || application.createdAt)}</strong></div>
        <div className="info-row">Trạng thái: <MembershipStatusBadge status={application.status} /></div>
      </div>
      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="membershipRejectReason">Lý do từ chối</label>
        <textarea
          id="membershipRejectReason"
          className="textarea"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Bắt buộc khi từ chối đơn."
        />
      </div>
    </Modal>
  );
}
