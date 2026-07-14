/** FE07 - UC32/UC35 - Process Borrow Request (Librarian). */

import { useEffect, useState } from 'react';
import { ClipboardList, ThumbsUp, ThumbsDown, Phone, Mail, Hash, RefreshCw } from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, ConfirmAction, Badge, DataNotice, EmptyState } from '../../component/shared/Feedback';
import { DataTable } from '../../component/shared/OperationalPatterns';
import { fmtDate, mapBorrowRequestsToAdminRows } from '../../utils/libraryFeatureViewModels';

export default function BorrowRequestsAdminPage() {
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [toast, showToast, clearToast] = useToast();

  async function loadRequests() {
    setLoading(true);
    setNotice(null);
    try {
      const data = await borrowingApi.listAll();
      const mapped = mapBorrowRequestsToAdminRows(data.borrowRequests || []);
      setRequests(mapped);
      setSelectedId(mapped[0]?.id || null);
    } catch (error) {
      setRequests([]);
      setSelectedId(null);
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
    setRequests((current) => current.map((row) => row.id === id ? { ...row, status } : row));
    showToast(message, type);
  }

  async function handleApprove() {
    if (!approveTarget || actionPending) return;
    setActionPending(true);
    try {
      await borrowingApi.approve(approveTarget.requestId);
      updateStatus(approveTarget.id, 'Approved', `Đã duyệt yêu cầu ${approveTarget.id}.`);
      setApproveTarget(null);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setActionPending(false);
    }
  }

  async function handleReject() {
    if (!selected || !rejectReason.trim() || actionPending) return;
    setActionPending(true);
    try {
      await borrowingApi.reject(selected.requestId, rejectReason.trim());
      updateStatus(selected.id, 'Rejected', `Đã từ chối yêu cầu ${selected.id}.`, 'info');
      setRejecting(false);
      setRejectReason('');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setActionPending(false);
    }
  }

  return (
    <AppLayout
      active="borrow-requests-admin"
      title="Yêu cầu mượn sách"
      subtitle="Thủ thư duyệt hoặc từ chối yêu cầu; hệ thống kiểm tra lại điều kiện mượn trước khi xác nhận."
      actions={<button className="btn btn-outline" onClick={loadRequests} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      {notice && <DataNotice type="error" title="Không thể tải yêu cầu mượn">{notice}</DataNotice>}

      <div className="split borrow-request-split">
        <DataTable
          caption="Borrow requests table"
          headers={['Yêu cầu', 'Thành viên', 'Sách', 'Ngày gửi', 'Trạng thái']}
          loading={loading}
          isEmpty={requests.length === 0}
          emptyState={<EmptyState icon={ClipboardList} title="Không có yêu cầu nào" />}
        >
          {requests.map((row) => (
            <tr
              key={row.id}
              tabIndex={0}
              aria-label={`Select borrow request ${row.id}`}
              onClick={() => setSelectedId(row.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedId(row.id);
                }
              }}
              style={{ cursor: 'pointer', background: row.id === selectedId ? 'var(--lib-accent-bg)' : undefined }}
            >
              <td data-label="Yêu cầu"><strong>{row.id}</strong></td>
              <td data-label="Thành viên">{row.member}</td>
              <td data-label="Sách">{row.book}</td>
              <td data-label="Ngày gửi">{fmtDate(row.requestDate)}</td>
              <td data-label="Trạng thái"><Badge status={row.status} /></td>
            </tr>
          ))}
        </DataTable>

        <div className="panel">
          {selected ? (
            <>
              <div className="panel-header">
                <div className="app-avatar">{String(selected.member).slice(0, 1)}</div>
                <div className="stack-sm">
                  <strong>{selected.member}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>{selected.id} • {fmtDate(selected.requestDate)}</span>
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
                <span className="book-spine" style={{ background: 'linear-gradient(135deg,#a87532,#7b5528)', width: 36, height: 50 }} />
                <div className="stack-sm">
                  <strong>{selected.book}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>{selected.author}</span>
                  <span className="muted" style={{ fontSize: 13 }}>Copy #{selected.copyId} • {selected.branch}</span>
                  <span className={`badge badge-${selected.copyAvailable ? 'available' : 'overdue'}`} style={{ width: 'fit-content', marginTop: 4 }}>
                    {selected.copyAvailable ? 'Bản sao sẵn sàng' : 'Cần kiểm tra lại tình trạng bản sao'}
                  </span>
                </div>
              </div>
              {selected.status === 'Pending' && (
                <div className="modal-actions" style={{ borderTop: '1px solid var(--lib-line)', marginTop: 20, paddingTop: 16, paddingLeft: 0, paddingRight: 0 }}>
                  <button className="btn btn-danger" onClick={() => setRejecting(true)}><ThumbsDown size={16} /> Từ chối</button>
                  <button className="btn btn-primary" onClick={() => setApproveTarget(selected)}><ThumbsUp size={16} /> Duyệt</button>
                </div>
              )}
            </>
          ) : <EmptyState icon={ClipboardList} title="Chọn một yêu cầu để xem chi tiết" />}
        </div>
      </div>

      {approveTarget && (
        <ConfirmAction
          eyebrow="UC35 • Duyệt yêu cầu mượn"
          title={`Duyệt yêu cầu ${approveTarget.id}`}
          confirmLabel="Duyệt và cấp sách"
          pending={actionPending}
          onCancel={() => setApproveTarget(null)}
          onConfirm={handleApprove}
        >
          <div className="info-list" style={{ marginBottom: 18 }}>
            <div className="info-row"><span className="muted">Thành viên:</span> <strong>{approveTarget.member}</strong></div>
            <div className="info-row"><span className="muted">Sách:</span> <strong>{approveTarget.book}</strong> (Copy #{approveTarget.copyId})</div>
            <div className="info-row"><span className="muted">Thời gian:</span> <strong>{fmtDate(approveTarget.borrowDate)} → {fmtDate(approveTarget.dueDate)}</strong></div>
          </div>
          <div className={`alert-box ${approveTarget.copyAvailable ? 'info' : 'warn'}`}>
            {approveTarget.copyAvailable
              ? 'Bản sao đang được ghi nhận là sẵn sàng. Hệ thống sẽ kiểm tra lại toàn bộ điều kiện khi duyệt.'
              : 'Bản sao chưa được ghi nhận là sẵn sàng. Có thể thử duyệt để nhận trạng thái mới nhất từ hệ thống.'}
          </div>
        </ConfirmAction>
      )}

      {rejecting && selected && (
        <ConfirmAction
          eyebrow="Từ chối yêu cầu"
          title={`Từ chối ${selected.id}`}
          tone="danger"
          confirmLabel="Xác nhận từ chối"
          pending={actionPending}
          confirmDisabled={!rejectReason.trim()}
          onCancel={() => setRejecting(false)}
          onConfirm={handleReject}
        >
          <div className="field">
            <label htmlFor="reason">Lý do từ chối</label>
            <textarea id="reason" className="textarea" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="VD: thành viên còn phí phạt chưa thanh toán..." />
          </div>
        </ConfirmAction>
      )}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
