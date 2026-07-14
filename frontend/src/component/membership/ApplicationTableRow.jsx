import { ClipboardList } from 'lucide-react';

import MembershipStatusBadge from './MembershipStatusBadge';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function ApplicationTableRow({ application, onReview }) {
  const status = String(application.status || '').toUpperCase();

  return (
    <tr>
      <td><strong>#{application.applicationId || application.id}</strong></td>
      <td>{application.fullName || application.name || application.userName || '-'}</td>
      <td>{application.email || '-'}</td>
      <td>{formatDate(application.appliedAt || application.createdAt)}</td>
      <td><MembershipStatusBadge status={status} /></td>
      <td style={{ textAlign: 'right' }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onReview(application)} disabled={status !== 'PENDING'}>
          <ClipboardList size={15} /> Xu ly
        </button>
      </td>
    </tr>
  );
}
