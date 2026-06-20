/**
 * FE08 · UC38 View Reservation List + UC39 Process Reservation Queue + UC40 Notify (Librarian)
 * Tab "Tất cả đặt chỗ" (bảng filter/search/pagination) và tab "Hàng đợi" theo từng sách
 * với các thao tác Notify next / Fulfill / Remove. UC40: modal preview thông báo.
 */

import { useMemo, useState } from 'react';
import { Search, CalendarClock, Bell, PackageCheck, Trash2, ChevronLeft, ChevronRight, Send, CheckCircle2 } from 'lucide-react';

import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, Modal, Badge } from '../../component/shared/Feedback';

const ALL = [
  { id: 'RS-501', member: 'Nguyễn Văn An', book: 'Clean Code', reservedDate: '2026-06-08', queue: 1, status: 'Waiting' },
  { id: 'RS-510', member: 'Trần Thị Bình', book: 'Clean Code', reservedDate: '2026-06-09', queue: 2, status: 'Waiting' },
  { id: 'RS-511', member: 'Lê Hoàng Cường', book: 'Clean Code', reservedDate: '2026-06-10', queue: 3, status: 'Waiting' },
  { id: 'RS-502', member: 'Phạm Thu Hà', book: 'Sapiens', reservedDate: '2026-06-05', queue: 1, status: 'Ready to pick up' },
  { id: 'RS-520', member: 'Đỗ Minh Khoa', book: 'Sapiens', reservedDate: '2026-06-07', queue: 2, status: 'Waiting' },
  { id: 'RS-530', member: 'Vũ Thanh Mai', book: 'Atomic Habits', reservedDate: '2026-06-11', queue: 1, status: 'Waiting' },
];

const fmt = (d) => new Date(d).toLocaleDateString('vi-VN');
const PAGE_SIZE = 5;
const STATUSES = ['ALL', 'Waiting', 'Ready to pick up', 'Expired'];

export default function ReservationsLibrarianPage() {
  const [view, setView] = useState('list'); // 'list' | 'queue'
  const [rows, setRows] = useState(ALL);
  const [search, setSearch] = useState('');
  const [bookFilter, setBookFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [queueBook, setQueueBook] = useState('Clean Code');
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [toast, showToast, clearToast] = useToast();

  const books = useMemo(() => ['ALL', ...new Set(ALL.map((r) => r.book))], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      (bookFilter === 'ALL' || r.book === bookFilter) &&
      (statusFilter === 'ALL' || r.status === statusFilter) &&
      (!q || `${r.member} ${r.book}`.toLowerCase().includes(q))
    );
  }, [rows, search, bookFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const queue = useMemo(
    () => rows.filter((r) => r.book === queueBook && r.status !== 'Expired').sort((a, b) => a.queue - b.queue),
    [rows, queueBook]
  );

  function notifyNext() {
    const head = queue[0];
    if (head) setNotifyTarget(head);
  }
  function confirmNotify() {
    setRows((prev) => prev.map((r) => (r.id === notifyTarget.id ? { ...r, status: 'Ready to pick up' } : r)));
    showToast(`Đã gửi thông báo có sách tới ${notifyTarget.member}.`, 'success');
    setNotifyTarget(null);
  }
  function fulfill(id) {
    const r = rows.find((x) => x.id === id);
    setRows((prev) => prev.filter((x) => x.id !== id));
    showToast(`Đã giao sách "${r.book}" cho ${r.member}.`, 'success');
  }
  function remove(id) {
    setRows((prev) => prev.filter((x) => x.id !== id));
    showToast('Đã xóa đặt chỗ khỏi hàng đợi.', 'info');
  }

  return (
    <AppLayout active="reservations-librarian" title="Reservations" subtitle="Quản lý đặt chỗ và xử lý hàng đợi theo từng sách">
      <div className="tabs">
        <button className={`tab${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}><CalendarClock size={14} /> Tất cả đặt chỗ</button>
        <button className={`tab${view === 'queue' ? ' active' : ''}`} onClick={() => setView('queue')}><PackageCheck size={14} /> Hàng đợi theo sách</button>
      </div>

      {view === 'list' ? (
        <>
          <div className="toolbar">
            <div className="search-input">
              <Search size={16} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm thành viên / sách..." aria-label="Tìm" />
            </div>
            <select className="select" style={{ width: 200 }} value={bookFilter} onChange={(e) => { setBookFilter(e.target.value); setPage(1); }}>
              {books.map((b) => <option key={b} value={b}>{b === 'ALL' ? 'Tất cả sách' : b}</option>)}
            </select>
            <select className="select" style={{ width: 190 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              {STATUSES.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'Tất cả trạng thái' : s}</option>)}
            </select>
          </div>

          <div className="lib-table-wrap">
            <table className="lib-table">
              <thead>
                <tr><th>Thành viên</th><th>Sách</th><th>Ngày đặt</th><th>Vị trí</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.member}</td>
                    <td><strong>{r.book}</strong></td>
                    <td>{fmt(r.reservedDate)}</td>
                    <td>#{r.queue}</td>
                    <td><Badge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageRows.length === 0 && <div className="empty"><CalendarClock size={34} /><p>Không có đặt chỗ phù hợp.</p></div>}
          </div>

          <div className="pagination">
            <span className="muted">{filtered.length} đặt chỗ · trang {safePage}/{totalPages}</span>
            <div className="page-controls">
              <button className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={`page-btn${safePage === i + 1 ? ' active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button>
            </div>
          </div>
        </>
      ) : (
        <div className="lib-card">
          <div className="toolbar">
            <h3 className="lib-card-title" style={{ margin: 0 }}>Hàng đợi cho</h3>
            <select className="select" style={{ width: 220 }} value={queueBook} onChange={(e) => setQueueBook(e.target.value)}>
              {books.filter((b) => b !== 'ALL').map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <span className="spacer" />
            <button className="btn btn-primary btn-sm" onClick={notifyNext} disabled={!queue.length || queue[0].status === 'Ready to pick up'}>
              <Bell size={14} /> Notify next member
            </button>
          </div>

          <div className="alert-box info" style={{ marginBottom: 16 }}>
            Bản sao đang được gán: <strong style={{ marginLeft: 6 }}>{queueBook} · C-NEXT</strong>
          </div>

          <div className="queue-list">
            {queue.map((r, i) => (
              <div className={`queue-item${i === 0 ? ' head' : ''}`} key={r.id}>
                <span className="queue-pos">{r.queue}</span>
                <div className="stack-sm">
                  <strong>{r.member}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>Đặt ngày {fmt(r.reservedDate)} · {r.id}</span>
                </div>
                {r.status === 'Ready to pick up' && <Badge status="Ready to pick up" />}
                <div className="queue-actions">
                  {i === 0 && r.status !== 'Ready to pick up' && (
                    <button className="btn btn-outline btn-sm" onClick={() => setNotifyTarget(r)}><Bell size={13} /> Notify</button>
                  )}
                  <button className="btn btn-success btn-sm" onClick={() => fulfill(r.id)}><CheckCircle2 size={13} /> Fulfill</button>
                  <button className="icon-btn" title="Remove" onClick={() => remove(r.id)}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
            {queue.length === 0 && <div className="empty"><PackageCheck size={34} /><p>Hàng đợi trống cho cuốn sách này.</p></div>}
          </div>
        </div>
      )}

      {notifyTarget && (
        <Modal
          eyebrow="UC40 · Notify Member — Book Available"
          title="Gửi thông báo có sách"
          onClose={() => setNotifyTarget(null)}
          actions={
            <>
              <button className="btn btn-ghost" onClick={() => setNotifyTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmNotify}><Send size={16} /> Send Notification</button>
            </>
          }
        >
          <div className="email-card">
            <div className="email-head"><span className="brand-mark"><Bell size={20} /></span><strong style={{ fontFamily: 'var(--lib-heading)' }}>Sách bạn đặt đã sẵn sàng</strong></div>
            <div className="email-body">
              <p>Xin chào <strong>{notifyTarget.member}</strong>,</p>
              <p>Cuốn sách <strong>{notifyTarget.book}</strong> bạn đặt nay đã có sẵn để nhận.</p>
              <p className="muted">Hạn đến lấy: <strong style={{ color: 'var(--lib-ink)' }}>22/06/2026</strong> tại quầy thủ thư.</p>
            </div>
          </div>
        </Modal>
      )}

      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
