import { Check, X, XCircle } from 'lucide-react';
import { useState } from 'react';

import { getStatusLabel } from '../../../utils/uiLabels';
import { AdminActionButton } from '../components/AdminActionButton';
import { isPendingMembershipApplication } from './adminMembershipPresentation';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('vi-VN');
}

export function AdminMembershipReviewModal({
  application,
  saving,
  onApprove,
  onReject,
  onClose,
}) {
  const [approvalConfirmOpen, setApprovalConfirmOpen] = useState(false);
  const [rejectionOpen, setRejectionOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  if (!application) return null;
  const pending = isPendingMembershipApplication(application);

  function submitRejection() {
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length > 500) {
      setReasonError(
        !trimmed
          ? 'Lý do từ chối là bắt buộc.'
          : 'Lý do từ chối không được vượt quá 500 ký tự.',
      );
      return;
    }
    onReject(trimmed);
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <section
        className="admin-modal admin-membership-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-membership-review-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="admin-modal__header">
          <div>
            <p>FE04 · Xét duyệt hội viên</p>
            <h2 id="admin-membership-review-title">
              Đơn #{application.applicationId}
            </h2>
          </div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Đóng">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="admin-modal__body admin-membership-modal__body">
          <dl className="admin-membership-detail">
            <div><dt>Họ và tên</dt><dd>{application.applicant.fullName || '-'}</dd></div>
            <div><dt>Email</dt><dd>{application.applicant.email || '-'}</dd></div>
            <div><dt>Tên đăng nhập</dt><dd>{application.applicant.username || '-'}</dd></div>
            <div><dt>Số điện thoại</dt><dd>{application.applicant.phone || '-'}</dd></div>
            <div><dt>Ngày nộp</dt><dd>{formatDate(application.appliedAt)}</dd></div>
            <div><dt>Trạng thái</dt><dd>{getStatusLabel(application.status)}</dd></div>
          </dl>

          {application.rejectionReason ? (
            <div className="admin-membership-rejection-note">
              <strong>Lý do từ chối</strong>
              <p>{application.rejectionReason}</p>
            </div>
          ) : null}

          {pending && approvalConfirmOpen ? (
            <div className="admin-membership-confirmation" role="alert">
              <p>Xác nhận duyệt đơn hội viên này?</p>
              <div>
                <button type="button" disabled={saving} onClick={() => setApprovalConfirmOpen(false)}>
                  Quay lại
                </button>
                <button type="button" disabled={saving} onClick={onApprove}>
                  Xác nhận duyệt
                </button>
              </div>
            </div>
          ) : null}

          {pending && rejectionOpen ? (
            <label className="admin-field admin-field--wide">
              <span>Lý do từ chối</span>
              <textarea
                value={reason}
                maxLength={500}
                disabled={saving}
                onChange={(event) => {
                  setReason(event.target.value);
                  setReasonError('');
                }}
              />
              <small>{reason.length}/500 ký tự</small>
              {reasonError ? <small className="admin-field-error">{reasonError}</small> : null}
            </label>
          ) : null}
        </div>

        <footer className="admin-modal__actions">
          <button type="button" disabled={saving} onClick={onClose}>Đóng</button>
          {pending && !approvalConfirmOpen ? (
            <>
              <AdminActionButton
                icon={XCircle}
                label={rejectionOpen ? 'Xác nhận từ chối' : 'Từ chối'}
                tone="danger"
                disabled={saving}
                onClick={rejectionOpen ? submitRejection : () => setRejectionOpen(true)}
              />
              <AdminActionButton
                icon={Check}
                label="Duyệt"
                tone="primary"
                disabled={saving}
                onClick={() => {
                  setRejectionOpen(false);
                  setApprovalConfirmOpen(true);
                }}
              />
            </>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
