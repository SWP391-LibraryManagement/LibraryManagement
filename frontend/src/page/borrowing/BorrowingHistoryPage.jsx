/**
 * FE07 · UC30 — My Borrowing History (Member) + UC31 Renew Book (modal)
 * Bảng lịch sử mượn với filter tabs, search, pagination; nút Renew trên dòng đang mượn.
 */

import { useMemo, useState } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, History, AlertTriangle, CalendarClock } from 'lucide-react';

import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, Modal, Badge } from '../../component/shared/Feedback';

const ROWS = [
  { id: 1, title: 'Clean Code', author: 'Robert C. Martin', borrowDate: '2026-06-02', dueDate: '2026-06-16', returnDate: null, status: 'Borrowed', renewalsLeft: 1 },
  { id: 2, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', borrowDate: '2026-05-20', dueDate: '2026-06-03', returnDate: null, status: 'Overdue', renewalsLeft: 0 },
  { id: 3, title: 'Sapiens', author: 'Yuval Noah Harari', borrowDate: '2026-05-01', dueDate: '2026-05-15', returnDate: '2026-05-14', status: 'Returned', renewalsLeft: 0 },
  { id: 4, title: 'Nhà Giả Kim', author: 'Paulo Coelho', borrowDate: '2026-06-10', dueDate: '2026-06-24', returnDate: null, status: 'Borrowed', renewalsLeft: 0 },
  { id: 5, title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', borrowDate: '2026-06-12', dueDate: '2026-06-26', returnDate: null, status: 'Pending', renewalsLeft: 0 },
  { id: 6, title: 'Design Patterns', author: 'Erich Gamma', borrowDate: '2026-04-10', dueDate: '2026-04-24', returnDate: '2026-04-22', status: 'Returned', renewalsLeft: 0 },
  { id: 7, title: 'Refactoring', author: 'Martin Fowler', borrowDate: '2026-05-28', dueDate: '2026-06-11', returnDate: null, status: 'Overdue', renewalsLeft: 0 },
];

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'returned', label: 'Returned' },
];

const PAGE_SIZE = 4;
const fmt = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const canRenew = (row) => row.status === 'Borrowed' && row.renewalsLeft > 0;

export default function BorrowingHistoryPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [renewRow, setRenewRow] = useState(null);
  const [toast, showToast, clearToast] = useToast();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ROWS.filter((r) => {
      const byTab =
        tab === 'all' ? true :
        tab === 'active' ? r.status === 'Borrowed' :
        tab === 'overdue' ? r.status === 'Overdue' :
        r.status === 'Returned';
      const bySearch = !q || `${r.title} ${r.author}`.toLowerCase().includes(q);
      return byTab && bySearch;
    });
  }, [tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeTab(t) {
    setTab(t);
    setPage(1);
  }

  function confirmRenew() {
    showToast(`Đã gia hạn "${renewRow.title}" đến ${fmt(addDays(renewRow.dueDate, 14))}.`, 'success');
    setRenewRow(null);
  }

  return (
    <AppLayout
      active="borrowing-history"
      title="My Borrowing History"
      subtitle="Theo dõi các sách bạn đã và đang mượn"
    >
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => changeTab(t.key)}>
            {t.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <div className="search-input">
          <Search size={16} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm sách..." aria-label="Tìm" />
        </div>
      </div>

      <div className="lib-table-wrap">
        <table className="lib-table">
          <thead>
            <tr>
              <th>Sách</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Ngày trả</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className={r.status === 'Overdue' ? 'row-overdue' : ''}>
                <td>
                  <div className="row-flex">
                    <span className="book-spine" style={{ background: 'linear-gradient(135deg,#c78a3b,#a86f28)' }} />
                    <div className="stack-sm">
                      <strong>{r.title}</strong>
                      <span className="muted" style={{ fontSize: 13 }}>{r.author}</span>
                    </div>
                  </div>
                </td>
                <td>{fmt(r.borrowDate)}</td>
                <td>{fmt(r.dueDate)}</td>
                <td>{fmt(r.returnDate)}</td>
                <td><Badge status={r.status} /></td>
                <td style={{ textAlign: 'right' }}>
                  {canRenew(r) && (
                    <button className="btn btn-outline btn-sm" onClick={() => setRenewRow(r)}>
                      <RefreshCw size={14} /> Renew
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageRows.length === 0 && (
          <div className="empty"><History size={36} /><p>Không có bản ghi nào.</p></div>
        )}
      </div>

      <div className="pagination">
        <span className="muted">{filtered.length} bản ghi · trang {safePage}/{totalPages}</span>
        <div className="page-controls">
          <button className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`page-btn${safePage === i + 1 ? ' active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button>
        </div>
      </div>

      {renewRow && (
        <RenewModal row={renewRow} onClose={() => setRenewRow(null)} onConfirm={confirmRenew} />
      )}

      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function RenewModal({ row, onClose, onConfirm }) {
  const eligible = canRenew(row);
  const newDue = addDays(row.dueDate, 14);

  return (
    <Modal
      eyebrow="UC31 · Gia hạn"
      title="Renew Book"
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={!eligible}>
            <RefreshCw size={16} /> Confirm Renewal
          </button>
        </>
      }
    >
      <div className="info-list">
        <div className="info-row"><span className="muted">Sách:</span> <strong>{row.title}</strong></div>
        <div className="info-row"><CalendarClock size={16} /><span className="muted">Hạn trả hiện tại:</span> <strong>{fmt(row.dueDate)}</strong></div>
        <div className="info-row"><CalendarClock size={16} color="#2f8f5b" /><span className="muted">Hạn trả mới (dự kiến):</span> <strong style={{ color: '#2f8f5b' }}>{fmt(newDue)}</strong></div>
        <div className="info-row"><span className="muted">Số lần gia hạn còn lại:</span> <strong>{row.renewalsLeft}</strong></div>
      </div>

      {!eligible && (
        <div className="alert-box danger" style={{ marginTop: 16 }}>
          <AlertTriangle size={18} />
          <span>
            {row.status === 'Overdue'
              ? 'Không thể gia hạn vì sách đang quá hạn. Vui lòng trả sách và thanh toán phí phạt (nếu có).'
              : 'Bạn đã dùng hết số lần gia hạn cho phép cho cuốn sách này.'}
          </span>
        </div>
      )}
    </Modal>
  );
}
