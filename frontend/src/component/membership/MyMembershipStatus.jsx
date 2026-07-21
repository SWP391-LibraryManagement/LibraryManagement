import { CalendarClock, UserCheck } from 'lucide-react';

import MembershipStatusBadge from './MembershipStatusBadge';
import { membershipStatusLabel } from './membershipStatus';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function MyMembershipStatus({ status }) {
  const current = status || {};
  const statusKey = String(current.membershipStatusView || 'NONE').toUpperCase();
  const currentApplication = current.currentApplication || {};
  const dailyBorrowLimit = statusKey === 'APPROVED' ? 5 : 3;

  return (
    <section className="lib-card">
      <div className="panel-header">
        <span className="kpi-icon"><UserCheck size={18} /></span>
        <div>
          <h2 className="lib-card-title" style={{ margin: 0 }}>Trạng thái hội viên</h2>
          <p className="ph-sub">Trạng thái hiện tại: {membershipStatusLabel(statusKey)}</p>
        </div>
        <span style={{ marginLeft: 'auto' }}><MembershipStatusBadge status={statusKey} /></span>
      </div>

      <div className="info-list">
        <div className="info-row"><UserCheck size={16} /> Hạn mức mượn: <strong>{dailyBorrowLimit} sách/ngày</strong></div>
        <div className="info-row"><CalendarClock size={16} /> Ngày nộp: <strong>{formatDate(currentApplication.appliedAt)}</strong></div>
        <div className="info-row"><CalendarClock size={16} /> Ngày duyệt: <strong>{formatDate(currentApplication.approvedAt)}</strong></div>
        {currentApplication.rejectionReason && <div className="alert-box danger">{currentApplication.rejectionReason}</div>}
      </div>
    </section>
  );
}
