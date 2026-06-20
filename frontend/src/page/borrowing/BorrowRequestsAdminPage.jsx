/**
 * FE07 · UC32 — Process Borrow Request (Librarian) + UC35 Approve Borrow Request (modal)
 * Trái: danh sách yêu cầu mượn đang chờ. Phải: chi tiết yêu cầu + tình trạng bản sao.
 * Actions: Approve (mở modal eligibility), Reject (kèm lý do).
 */

import { useState } from 'react';
import { ClipboardList, ThumbsUp, ThumbsDown, CheckCircle2, XCircle, Phone, Mail, Hash } from 'lucide-react';

import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, Modal, Badge } from '../../component/shared/Feedback';

const INITIAL = [
  {
    id: 'REQ-1042', member: 'Nguyễn Văn An', memberId: 'MB-0231', email: 'an.nguyen@example.com', phone: '0905 123 456',
    membershipActive: true, unpaidFines: 0,
    book: 'Clean Code', author: 'Robert C. Martin', copyId: 'C-01', branch: 'Chi nhánh Trung tâm', copyAvailable: true,
    requestDate: '2026-06-14', borrowDate: '2026-06-15', dueDate: '2026-06-29', status: 'Pending',
  },
  {
    id: 'REQ-1043', member: 'Trần Thị Bình', memberId: 'MB-0198', email: 'binh.tran@example.com', phone: '0912 987 654',
    membershipActive: true, unpaidFines: 25000,
    book: 'Sapiens', author: 'Yuval Noah Harari', copyId: 'C-09', branch: 'Chi nhánh Quận 7', copyAvailable: true,
    requestDate: '2026-06-14', borrowDate: '2026-06-15', dueDate: '2026-06-29', status: 'Pending',
  },
  {
    id: 'REQ-1044', member: 'Lê Hoàng Cường', memberId: 'MB-0420', email: 'cuong.le@example.com', phone: '0987 222 333',
    membershipActive: false, unpaidFines: 0,
    book: 'Design Patterns', author: 'Erich Gamma', copyId: 'C-21', branch: 'Chi nhánh Trung tâm', copyAvailable: false,
    requestDate: '2026-06-13', borrowDate: '2026-06-15', dueDate: '2026-06-29', status: 'Pending',
  },
];

const fmt = (d) => new Date(d).toLocaleDateString('vi-VN');
const vnd = (n) => n.toLocaleString('vi-VN') + ' ₫';

export default function BorrowRequestsAdminPage() {
  const [requests, setRequests] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState(INITIAL[0].id);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, showToast, clearToast] = useToast();

  const selected = requests.find((r) => r.id === selectedId) || null;

  function setStatus(id, status, msg, type = 'success') {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    showToast(msg, type);
  }

  function handleApprove() {
    setStatus(approveTarget.id, 'Approved', `Đã duyệt & cấp sách cho yêu cầu ${approveTarget.id}.`);
    setApproveTarget(null);
  }

  function handleReject() {
    if (!rejectReason.trim()) return;
    setStatus(selected.id, 'Rejected', `Đã từ chối yêu cầu ${selected.id}.`, 'info');
    setRejecting(false);
    setRejectReason('');
  }

  return (
    <AppLayout
      active="borrow-requests-admin"
      title="Borrow Requests"
      subtitle="Duyệt và xử lý các yêu cầu mượn sách đang chờ"
    >
      <div className="split">
        {/* Left — request list */}
        <div className="lib-table-wrap">
          <table className="lib-table">
            <thead>
              <tr><th>Thành viên</th><th>Sách</th><th>Ngày YC</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} onClick={() => setSelectedId(r.id)} style={{ cursor: 'pointer', background: r.id === selectedId ? 'var(--lib-accent-bg)' : undefined }}>
                  <td>
                    <div className="stack-sm"><strong>{r.member}</strong><span className="muted" style={{ fontSize: 13 }}>{r.memberId}</span></div>
                  </td>
                  <td>{r.book}</td>
                  <td>{fmt(r.requestDate)}</td>
                  <td><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && <div className="empty"><ClipboardList size={36} /><p>Không có yêu cầu nào.</p></div>}
        </div>

        {/* Right — detail panel */}
        <div className="panel">
          {selected ? (
            <>
              <div className="panel-header">
                <div className="app-avatar">{selected.member.slice(0, 1)}</div>
                <div className="stack-sm">
                  <strong>{selected.member}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>{selected.id} · {fmt(selected.requestDate)}</span>
                </div>
                <span style={{ marginLeft: 'auto' }}><Badge status={selected.status} /></span>
              </div>

              <div className="info-list">
                <div className="info-row"><Hash size={16} /><span className="muted">Mã TV:</span> <strong>{selected.memberId}</strong></div>
                <div className="info-row"><Mail size={16} /> {selected.email}</div>
                <div className="info-row"><Phone size={16} /> {selected.phone}</div>
              </div>

              <h4 className="section-title">Sách yêu cầu</h4>
              <div className="row-flex" style={{ alignItems: 'flex-start', gap: 14 }}>
                <span className="book-spine" style={{ background: 'linear-gradient(135deg,#c78a3b,#a86f28)', width: 36, height: 50 }} />
                <div className="stack-sm">
                  <strong>{selected.book}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>{selected.author}</span>
                  <span className="muted" style={{ fontSize: 13 }}>Bản {selected.copyId} · {selected.branch}</span>
                  <span className={`badge badge-${selected.copyAvailable ? 'available' : 'overdue'}`} style={{ width: 'fit-content', marginTop: 4 }}>
                    {selected.copyAvailable ? 'Bản sao sẵn sàng' : 'Bản sao chưa sẵn sàng'}
                  </span>
                </div>
              </div>

              {selected.status === 'Pending' && (
                <div className="modal-actions" style={{ borderTop: '1px solid var(--lib-line)', marginTop: 20, paddingTop: 16, paddingLeft: 0, paddingRight: 0 }}>
                  <button className="btn btn-danger" onClick={() => setRejecting(true)}><ThumbsDown size={16} /> Reject</button>
                  <button className="btn btn-primary" onClick={() => setApproveTarget(selected)}><ThumbsUp size={16} /> Approve</button>
                </div>
              )}
            </>
          ) : (
            <div className="empty"><ClipboardList size={40} /><p>Chọn một yêu cầu để xem chi tiết.</p></div>
          )}
        </div>
      </div>

      {approveTarget && <ApproveModal req={approveTarget} onClose={() => setApproveTarget(null)} onApprove={handleApprove} />}

      {rejecting && selected && (
        <Modal
          eyebrow="Từ chối yêu cầu"
          title={`Reject ${selected.id}`}
          onClose={() => setRejecting(false)}
          actions={
            <>
              <button className="btn btn-ghost" onClick={() => setRejecting(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={!rejectReason.trim()}>Confirm Reject</button>
            </>
          }
        >
          <div className="field">
            <label htmlFor="reason">Lý do từ chối</label>
            <textarea id="reason" className="textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="VD: thành viên còn phí phạt chưa thanh toán..." />
          </div>
        </Modal>
      )}

      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}

function ApproveModal({ req, onClose, onApprove }) {
  const checks = [
    { label: 'Tư cách thành viên còn hiệu lực', ok: req.membershipActive },
    { label: 'Không còn phí phạt chưa thanh toán', ok: req.unpaidFines === 0, note: req.unpaidFines > 0 ? `Còn nợ ${vnd(req.unpaidFines)}` : null },
    { label: 'Bản sao sẵn sàng để cấp', ok: req.copyAvailable },
  ];
  const allOk = checks.every((c) => c.ok);

  return (
    <Modal
      eyebrow="UC35 · Approve Borrow Request"
      title={`Duyệt yêu cầu ${req.id}`}
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-danger" onClick={onClose}><ThumbsDown size={16} /> Reject</button>
          <button className="btn btn-primary" onClick={onApprove} disabled={!allOk}><ThumbsUp size={16} /> Approve & Issue</button>
        </>
      }
    >
      <div className="info-list" style={{ marginBottom: 18 }}>
        <div className="info-row"><span className="muted">Thành viên:</span> <strong>{req.member}</strong></div>
        <div className="info-row"><span className="muted">Sách:</span> <strong>{req.book}</strong> ({req.copyId})</div>
        <div className="info-row"><span className="muted">Thời gian:</span> <strong>{fmt(req.borrowDate)} → {fmt(req.dueDate)}</strong></div>
      </div>

      <h4 className="section-title">Điều kiện duyệt</h4>
      <div className="checklist">
        {checks.map((c) => (
          <div key={c.label} className={`checklist-item ${c.ok ? 'ok' : 'fail'}`}>
            <span className="ck-icon">{c.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}</span>
            <span>{c.label}{c.note && <span className="muted"> — {c.note}</span>}</span>
          </div>
        ))}
      </div>

      {!allOk && (
        <div className="alert-box warn" style={{ marginTop: 16 }}>
          Cần xử lý các điều kiện chưa đạt trước khi duyệt yêu cầu này.
        </div>
      )}
    </Modal>
  );
}
