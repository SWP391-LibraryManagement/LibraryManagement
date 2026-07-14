/** FE07 - UC33 - Process Returns (Librarian). */

import { useEffect, useMemo, useState } from 'react';
import { PackageCheck, AlertTriangle, CheckCircle2, Search, RefreshCw } from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, ConfirmAction, Badge, DataNotice, EmptyState } from '../../component/shared/Feedback';
import { DataTable, DataToolbar } from '../../component/shared/OperationalPatterns';
import { fmtDate, mapBorrowRequestsToReturnRows } from '../../utils/libraryFeatureViewModels';

const CONDITION_LABELS = { NORMAL: 'Tốt • không hư hỏng', DAMAGED: 'Hư hỏng', LOST: 'Mất sách' };

function daysOverdue(due) {
  if (!due) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(due);
  date.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - date) / 86400000);
  return diff > 0 ? diff : 0;
}

export default function ProcessReturnsPage() {
  const [loans, setLoans] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returning, setReturning] = useState(false);
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('NORMAL');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [toast, showToast, clearToast] = useToast();

  async function loadLoans() {
    setLoading(true);
    setNotice(null);
    try {
      const data = await borrowingApi.listAll();
      const mapped = mapBorrowRequestsToReturnRows(data.borrowRequests || []);
      setLoans(mapped);
      setSelectedId(mapped[0]?.id || null);
    } catch (error) {
      setLoans([]);
      setSelectedId(null);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadLoans(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return loans.filter((loan) => !query || `${loan.member} ${loan.book}`.toLowerCase().includes(query));
  }, [loans, search]);
  const selected = loans.find((loan) => loan.id === selectedId) || null;
  const overdueDays = selected ? daysOverdue(selected.dueDate) : 0;
  const needsFineReview = overdueDays > 0 || condition !== 'NORMAL';

  async function confirmReturn() {
    if (!returnTarget || returning) return;
    setReturning(true);
    try {
      const result = await borrowingApi.returnDetail(returnTarget.borrowDetailId, { condition });
      const remainingLoans = loans.filter((loan) => loan.id !== returnTarget.id);
      setLoans(remainingLoans);
      setSelectedId(remainingLoans[0]?.id || null);
      setCondition('NORMAL');
      setReturnTarget(null);
      showToast(
        result.fineCandidate?.needsFineReview
          ? `Đã ghi nhận trả "${returnTarget.book}". Có dữ liệu cần FE09 xem xét phí phạt.`
          : `Đã ghi nhận trả "${returnTarget.book}".`,
        'success',
      );
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setReturning(false);
    }
  }

  return (
    <AppLayout
      active="process-returns"
      title="Xử lý trả sách"
      subtitle="Xác nhận tình trạng bản sao khi thành viên trả sách."
      actions={<button className="btn btn-outline" onClick={loadLoans} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      {notice && <DataNotice type="error" title="Không thể tải sách đang mượn">{notice}</DataNotice>}
      <DataToolbar
        primary={(
          <div className="search-input">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm thành viên hoặc sách..." aria-label="Tìm" />
          </div>
        )}
        summary={<span className="badge badge-overdue"><AlertTriangle size={13} /> {loans.filter((loan) => daysOverdue(loan.dueDate) > 0).length} đang quá hạn</span>}
      />

      <div className="split">
        <DataTable
          caption="Return processing table"
          headers={['Thành viên', 'Sách', 'Hạn trả', 'Quá hạn']}
          loading={loading}
          isEmpty={rows.length === 0}
          emptyState={<EmptyState icon={PackageCheck} title="Không có sách đang được mượn" />}
        >
          {rows.map((loan) => {
            const overdue = daysOverdue(loan.dueDate);
            return (
              <tr
                key={loan.id}
                className={overdue > 0 ? 'row-overdue' : ''}
                tabIndex={0}
                aria-label={`Select return loan ${loan.id}`}
                onClick={() => { setSelectedId(loan.id); setCondition('NORMAL'); }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedId(loan.id);
                    setCondition('NORMAL');
                  }
                }}
                style={{ cursor: 'pointer', background: loan.id === selectedId ? 'var(--lib-accent-bg)' : undefined }}
              >
                <td data-label="Thành viên">{loan.member}</td>
                <td data-label="Sách"><div className="stack-sm"><strong>{loan.book}</strong><span className="muted" style={{ fontSize: 13 }}>Copy {loan.copyId}</span></div></td>
                <td data-label="Hạn trả">{fmtDate(loan.dueDate)}</td>
                <td data-label="Quá hạn">{overdue > 0 ? <Badge status="Overdue">{overdue} ngày</Badge> : <span className="muted">-</span>}</td>
              </tr>
            );
          })}
        </DataTable>

        <div className="panel">
          {selected ? (
            <>
              <h3 className="lib-card-title">Xác nhận trả sách</h3>
              <div className="info-list">
                <div className="info-row"><span className="muted">Thành viên:</span> <strong>{selected.member}</strong></div>
                <div className="info-row"><span className="muted">Sách:</span> <strong>{selected.book}</strong> ({selected.copyId})</div>
                <div className="info-row"><span className="muted">Hạn trả:</span> <strong>{fmtDate(selected.dueDate)}</strong></div>
                <div className="info-row"><span className="muted">Quá hạn:</span> {overdueDays > 0 ? <strong style={{ color: 'var(--st-red)' }}>{overdueDays} ngày</strong> : <strong style={{ color: 'var(--st-green)' }}>Đúng hạn</strong>}</div>
              </div>
              <h4 className="section-title">Tình trạng sách</h4>
              <div className="field">
                <select className="select" value={condition} onChange={(event) => setCondition(event.target.value)} aria-label="Return condition">
                  <option value="NORMAL">Tốt • không hư hỏng</option>
                  <option value="DAMAGED">Hư hỏng</option>
                  <option value="LOST">Mất sách</option>
                </select>
              </div>
              <div className={`alert-box ${needsFineReview ? 'warn' : 'info'}`} style={{ marginTop: 16 }}>
                <span>{needsFineReview ? `Cần xem xét phí phạt: ${overdueDays} ngày quá hạn, tình trạng ${CONDITION_LABELS[condition]}.` : 'Không có dấu hiệu quá hạn, hư hỏng hoặc mất sách.'}</span>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} onClick={() => setReturnTarget(selected)}>
                <CheckCircle2 size={18} /> Xác nhận trả
              </button>
            </>
          ) : <EmptyState icon={PackageCheck} title="Chọn một sách để xác nhận trả" />}
        </div>
      </div>

      {returnTarget && (
        <ConfirmAction
          eyebrow="UC33 • Trả sách"
          title="Xác nhận trả sách"
          confirmLabel="Ghi nhận trả sách"
          pending={returning}
          onCancel={() => setReturnTarget(null)}
          onConfirm={confirmReturn}
        >
          <div className="info-list">
            <div className="info-row"><span className="muted">Thành viên:</span> <strong>{returnTarget.member}</strong></div>
            <div className="info-row"><span className="muted">Sách:</span> <strong>{returnTarget.book}</strong></div>
            <div className="info-row"><span className="muted">Tình trạng:</span> <strong>{CONDITION_LABELS[condition]}</strong></div>
          </div>
          {(daysOverdue(returnTarget.dueDate) > 0 || condition !== 'NORMAL') && (
            <div className="alert-box warn" style={{ marginTop: 16 }}>Thông tin trả sách này cần FE09 xem xét phí phạt sau khi máy chủ ghi nhận thành công.</div>
          )}
        </ConfirmAction>
      )}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
