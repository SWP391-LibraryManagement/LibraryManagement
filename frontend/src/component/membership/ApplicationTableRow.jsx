import { Check, X } from 'lucide-react';

import MembershipStatusBadge from './MembershipStatusBadge';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function ApplicationTableRow({ application, onApprove, onReject }) {
  const status = String(application.status || '').toUpperCase();
  const fullName = application.fullName || application.name || application.userName || application.applicant?.fullName || application.applicant?.username || '-';
  const email = application.email || application.applicant?.email || '-';
  const canReview = status === 'PENDING';

  return (
    <tr>
      <td><strong>#{application.applicationId || application.id}</strong></td>
      <td>{fullName}</td>
      <td>{email}</td>
      <td>{formatDate(application.appliedAt || application.createdAt)}</td>
      <td><MembershipStatusBadge status={status} /></td>
      <td style={{ textAlign: 'right' }}>
        <div className="row-flex" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-success btn-sm" onClick={() => onApprove(application)} disabled={!canReview}>
            <Check size={15} /> Duyệt
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onReject(application)} disabled={!canReview}>
            <X size={15} /> Từ chối
          </button>
        </div>
      </td>
    </tr>
  );
}
