/** FE07 - UC32/UC35 - Process Borrow Request (Librarian). */

import { useEffect, useState } from 'react';
import { ClipboardList, ThumbsUp, ThumbsDown, CheckCircle2, XCircle, Phone, Mail, Hash, RefreshCw } from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, Modal, Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DEMO_ADMIN_REQUESTS, fmtDate, mapBorrowRequestsToAdminRows, vnd } from '../../utils/libraryFeatureViewModels';

export default function BorrowRequestsAdminPage() {
  const [requests, setRequests] = useState(DEMO_ADMIN_REQUESTS);
  const [selectedId, setSelectedId] = useState(DEMO_ADMIN_REQUESTS[0].id);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Đang hiển thị dữ liệu demo để review UI duyệt yêu cầu mượn.');
  const [isDemo, setIsDemo] = useState(true);
  const [toast, showToast, clearToast] = useToast();

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await borrowingApi.listAll();
      const mapped = mapBorrowRequestsToAdminRows(data.borrowRequests || []);
      setRequests(mapped);
      setSelectedId(mapped[0]?.id || null);
      setIsDemo(false);
      setNotice('Đã kết nối backend thật qua GET /api/borrow-requests.');
    } catch (error) {
      setRequests(DEMO_ADMIN_REQUESTS);
      setSelectedId(DEMO_ADMIN_REQUESTS[0].id);
      setIsDemo(true);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadRequests(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const selected = requests.find((row) => row.id === selectedId) || null;

  function updateStatus(id, status, message, type = 'success') {
    setRequests((prev) => prev.map((row) => row.id === id ? { ...row, status } : row));
    showToast(message, type);
  }

  async function handleApprove() {
    if (!approveTarget) return;
    try {
      if (!isDemo) await borrowingApi.approve(approveTarget.requestId, { notes: 'Approved from FE07 UI' });
      updateStatus(approveTarget.id, 'Approved', `Đã duyệt yêu cầu ${approveTarget.id}.`);
      setApproveTarget(null);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleReject() {
    if (!selected || !rejectReason.trim()) return;
    try {
      if (!isDemo) await borrowingApi.reject(selected.requestId, rejectReason.trim());
      updateStatus(selected.id, 'Rejected', `Đã từ chối yêu cầu ${selected.id}.`, 'info');
      setRejecting(false);
      setRejectReason('');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  return (
    <AppLayout active="borrow-requests-admin" title="Yêu cầu mượn sách" subtitle="Thủ thư duyệt hoặc từ chối yêu cầu; backend re-check eligibility và availability." actions={<button className="btn btn-outline" onClick={loadRequests} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}>
      <DataNotice type={isDemo ? 'warn' : 'success'} title={isDemo ? 'Demo fallback' : 'Backend connected'}>{notice}</DataNotice>
      {loading ? <LoadingBlock rows={4} /> : <div className="split" style={{ gridTemplateColumns: '1.15fr .85fr' }}>
        <div className="lib-table-wrap"><table className="lib-table"><caption className="sr-only">Borrow requests table</caption><thead><tr><th scope="col">Yêu cầu</th><th scope="col">Thành viên</th><th scope="col">Sách</th><th scope="col">Ngày gửi</th><th scope="col">Trạng thái</th></tr></thead><tbody>{requests.map((row) => <tr key={row.id} onClick={() => setSelectedId(row.id)} style={{ cursor: 'pointer', background: row.id === selectedId ? 'var(--lib-accent-bg)' : undefined }}><td><strong>{row.id}</strong></td><td>{row.member}</td><td>{row.book}</td><td>{fmtDate(row.requestDate)}</td><td><Badge status={row.status} /></td></tr>)}</tbody></table>{requests.length === 0 && <EmptyState icon={ClipboardList} title="Không có yêu cầu nào" />}</div>
        <div className="panel">{selected ? <><div className="panel-header"><div className="app-avatar">{String(selected.member).slice(0, 1)}</div><div className="stack-sm"><strong>{selected.member}</strong><span className="muted" style={{ fontSize: 13 }}>{selected.id} • {fmtDate(selected.requestDate)}</span></div><span style={{ marginLeft: 'auto' }}><Badge status={selected.status} /></span></div><div className="info-list"><div className="info-row"><Hash size={16} /><span className="muted">Mã TV:</span> <strong>{selected.memberId}</strong></div><div className="info-row"><Mail size={16} /> {selected.email}</div><div className="info-row"><Phone size={16} /> {selected.phone}</div></div><h4 className="section-title">Sách yêu cầu</h4><div className="row-flex" style={{ alignItems: 'flex-start', gap: 14 }}><span className="book-spine" style={{ background: 'linear-gradient(135deg,#a87532,#7b5528)', width: 36, height: 50 }} /><div className="stack-sm"><strong>{selected.book}</strong><span className="muted" style={{ fontSize: 13 }}>{selected.author}</span><span className="muted" style={{ fontSize: 13 }}>Copy #{selected.copyId} • {selected.branch}</span><span className={`badge badge-${selected.copyAvailable ? 'available' : 'overdue'}`} style={{ width: 'fit-content', marginTop: 4 }}>{selected.copyAvailable ? 'Bản sao sẵn sàng' : 'Cần backend re-check'}</span></div></div>{selected.status === 'Pending' && <div className="modal-actions" style={{ borderTop: '1px solid var(--lib-line)', marginTop: 20, paddingTop: 16, paddingLeft: 0, paddingRight: 0 }}><button className="btn btn-danger" onClick={() => setRejecting(true)}><ThumbsDown size={16} /> Từ chối</button><button className="btn btn-primary" onClick={() => setApproveTarget(selected)}><ThumbsUp size={16} /> Duyệt</button></div>}</> : <EmptyState icon={ClipboardList} title="Chọn một yêu cầu để xem chi tiết" />}</div>
      </div>}
      {approveTarget && <ApproveModal req={approveTarget} onClose={() => setApproveTarget(null)} onApprove={handleApprove} />}
      {rejecting && selected && <Modal eyebrow="Từ chối yêu cầu" title={`Từ chối ${selected.id}`} onClose={() => setRejecting(false)} actions={<><button className="btn btn-ghost" onClick={() => setRejecting(false)}>Hủy</button><button className="btn btn-danger" onClick={handleReject} disabled={!rejectReason.trim()}>Xác nhận từ chối</button></>}><div className="field"><label htmlFor="reason">Lý do từ chối</label><textarea id="reason" className="textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="VD: thành viên còn phí phạt chưa thanh toán..." /></div></Modal>}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}

function ApproveModal({ req, onClose, onApprove }) {
  const checks = [
    { label: 'Backend sẽ re-check tư cách thành viên', ok: true },
    { label: 'Không còn phí phạt chưa thanh toán', ok: req.unpaidFines === 0, note: req.unpaidFines > 0 ? `Còn nợ ${vnd(req.unpaidFines)}` : null },
    { label: 'Bản sao sẵn sàng để cấp hoặc sẽ được backend từ chối an toàn', ok: req.copyAvailable },
  ];
  const allOk = checks.every((item) => item.ok);
  return <Modal eyebrow="UC35 • Duyệt yêu cầu mượn" title={`Duyệt yêu cầu ${req.id}`} onClose={onClose} actions={<><button className="btn btn-ghost" onClick={onClose}>Hủy</button><button className="btn btn-primary" onClick={onApprove} disabled={!allOk}><ThumbsUp size={16} /> Duyệt & cấp sách</button></>}><div className="info-list" style={{ marginBottom: 18 }}><div className="info-row"><span className="muted">Thành viên:</span> <strong>{req.member}</strong></div><div className="info-row"><span className="muted">Sách:</span> <strong>{req.book}</strong> (Copy #{req.copyId})</div><div className="info-row"><span className="muted">Thời gian:</span> <strong>{fmtDate(req.borrowDate)} → {fmtDate(req.dueDate)}</strong></div></div><h4 className="section-title">Điều kiện duyệt</h4><div className="checklist">{checks.map((check) => <div key={check.label} className={`checklist-item ${check.ok ? 'ok' : 'fail'}`}><span className="ck-icon">{check.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}</span><span>{check.label}{check.note && <span className="muted"> • {check.note}</span>}</span></div>)}</div>{!allOk && <div className="alert-box warn" style={{ marginTop: 16 }}>Cần xử lý các điều kiện chưa đạt trước khi duyệt yêu cầu này.</div>}</Modal>;
}
