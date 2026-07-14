/** FE07 - UC30 My Borrowing History + UC31 Gia hạn sách. */

import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, History, AlertTriangle, CalendarClock } from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, ConfirmAction, Badge, DataNotice, EmptyState } from '../../component/shared/Feedback';
import { DataTable, DataToolbar } from '../../component/shared/OperationalPatterns';
import { fmtDate, mapBorrowRequestsToHistoryRows } from '../../utils/libraryFeatureViewModels';

const TABS = [{ key: 'all', label: 'Tất cả' }, { key: 'active', label: 'Đang mượn' }, { key: 'overdue', label: 'Quá hạn' }, { key: 'returned', label: 'Đã trả' }];
const PAGE_SIZE = 4;
const canRenew = (row) => row.status === 'Borrowed' && row.renewalsLeft > 0;

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

export default function BorrowingHistoryPage() {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [renewRow, setRenewRow] = useState(null);
  const [renewing, setRenewing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [toast, showToast, clearToast] = useToast();

  async function loadHistory() {
    setLoading(true);
    setNotice(null);
    try {
      const data = await borrowingApi.listMine();
      setRows(mapBorrowRequestsToHistoryRows(data.borrowRequests || []));
    } catch (error) {
      setRows([]);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadHistory(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const byTab = tab === 'all'
        ? true
        : tab === 'active'
          ? row.status === 'Borrowed'
          : tab === 'overdue'
            ? row.status === 'Overdue'
            : row.status === 'Returned';
      return byTab && (!query || `${row.title} ${row.author}`.toLowerCase().includes(query));
    });
  }, [rows, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function confirmRenew() {
    if (!renewRow || renewing) return;
    setRenewing(true);
    try {
      const data = await borrowingApi.renewDetail(renewRow.borrowDetailId);
      const detail = data.borrowDetail;
      setRows((current) => current.map((row) => row.borrowDetailId === renewRow.borrowDetailId
        ? { ...row, dueDate: detail.dueDate, renewalsLeft: Math.max(0, 1 - Number(detail.renewalCount || 0)) }
        : row));
      showToast(`Đã gia hạn "${renewRow.title}".`, 'success');
      setRenewRow(null);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setRenewing(false);
    }
  }

  return (
    <AppLayout
      active="borrowing-history"
      title="Lịch sử mượn sách"
      subtitle="Theo dõi sách đã mượn và gửi yêu cầu gia hạn khi cần."
      actions={<button className="btn btn-outline" onClick={loadHistory} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      {notice && <DataNotice type="error" title="Không thể tải lịch sử">{notice}</DataNotice>}

      <DataToolbar
        primary={(
          <div className="tabs" style={{ marginBottom: 0 }}>
            {TABS.map((item) => (
              <button
                type="button"
                key={item.key}
                className={`tab${tab === item.key ? ' active' : ''}`}
                onClick={() => { setTab(item.key); setPage(1); }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
        filters={(
          <div className="search-input">
            <Search size={16} />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm sách..." aria-label="Tìm" />
          </div>
        )}
      />

      <DataTable
        caption="Borrowing history table"
        headers={['Sách', 'Ngày mượn', 'Hạn trả', 'Ngày trả', 'Trạng thái', { label: 'Thao tác', align: 'right' }]}
        loading={loading}
        isEmpty={pageRows.length === 0}
        emptyState={<EmptyState icon={History} title="Không có bản ghi nào" />}
      >
        {pageRows.map((row) => (
          <tr key={row.id} className={row.status === 'Overdue' ? 'row-overdue' : ''}>
            <td data-label="Sách">
              <div className="row-flex">
                <span className="book-spine" style={{ background: 'linear-gradient(135deg,#a87532,#7b5528)' }} />
                <div className="stack-sm">
                  <strong>{row.title}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>{row.author}</span>
                </div>
              </div>
            </td>
            <td data-label="Ngày mượn">{fmtDate(row.borrowDate)}</td>
            <td data-label="Hạn trả">{fmtDate(row.dueDate)}</td>
            <td data-label="Ngày trả">{fmtDate(row.returnDate)}</td>
            <td data-label="Trạng thái"><Badge status={row.status} /></td>
            <td data-label="Thao tác" style={{ textAlign: 'right' }}>
              {canRenew(row) && (
                <button className="btn btn-outline btn-sm" onClick={() => setRenewRow(row)}>
                  <RefreshCw size={14} /> Gia hạn
                </button>
              )}
            </td>
          </tr>
        ))}
      </DataTable>

      {!loading && (
        <div className="pagination">
          <span className="muted">{filtered.length} bản ghi • trang {safePage}/{totalPages}</span>
          <div className="page-controls">
            <button className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button key={index} className={`page-btn${safePage === index + 1 ? ' active' : ''}`} onClick={() => setPage(index + 1)}>{index + 1}</button>
            ))}
            <button className="page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {renewRow && (
        <RenewConfirmation row={renewRow} pending={renewing} onClose={() => setRenewRow(null)} onConfirm={confirmRenew} />
      )}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}

function RenewConfirmation({ row, pending, onClose, onConfirm }) {
  const eligible = canRenew(row);
  const newDue = row.dueDate ? addDays(row.dueDate, 14) : null;

  return (
    <ConfirmAction
      eyebrow="UC31 • Gia hạn"
      title="Gia hạn sách"
      confirmLabel="Xác nhận gia hạn"
      pending={pending}
      confirmDisabled={!eligible}
      onCancel={onClose}
      onConfirm={onConfirm}
    >
      <div className="info-list">
        <div className="info-row"><span className="muted">Sách:</span> <strong>{row.title}</strong></div>
        <div className="info-row"><CalendarClock size={16} /><span className="muted">Hạn trả hiện tại:</span> <strong>{fmtDate(row.dueDate)}</strong></div>
        <div className="info-row"><CalendarClock size={16} color="#2f8f5b" /><span className="muted">Hạn trả mới:</span> <strong style={{ color: '#2f8f5b' }}>{fmtDate(newDue)}</strong></div>
        <div className="info-row"><span className="muted">Số lần gia hạn còn lại:</span> <strong>{row.renewalsLeft}</strong></div>
      </div>
      {!eligible && (
        <div className="alert-box danger" style={{ marginTop: 16 }}>
          <AlertTriangle size={18} />
          <span>{row.status === 'Overdue' ? 'Không thể gia hạn vì sách đang quá hạn.' : 'Bạn đang hết số lần gia hạn cho phép.'}</span>
        </div>
      )}
    </ConfirmAction>
  );
}
