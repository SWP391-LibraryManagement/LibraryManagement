/**
 * FE08 - UC38 View Reservation List + UC39 Process Reservation Queue + UC40 Notify.
 * API thật: GET /api/reservations, PATCH /api/reservations/:id/process, POST /api/reservations/process-queue.
 */

import { useEffect, useMemo, useState } from 'react';
import { Search, CalendarClock, Bell, PackageCheck, Trash2, ChevronLeft, ChevronRight, Send, CheckCircle2, RefreshCw } from 'lucide-react';

import { reservationApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, Modal, Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DEMO_ALL_RESERVATIONS, fmtDate, mapReservation } from '../../utils/libraryFeatureViewModels';

const PAGE_SIZE = 5;
const STATUSES = ['ALL', 'Waiting', 'Ready to pick up', 'Expired', 'Cancelled'];

export default function ReservationsLibrarianPage() {
  const [view, setView] = useState('list');
  const [rows, setRows] = useState(DEMO_ALL_RESERVATIONS);
  const [search, setSearch] = useState('');
  const [bookFilter, setBookFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [queueBook, setQueueBook] = useState('Clean Code');
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Đang hiển thị dữ liệu demo để review UI quản lý đặt chỗ.');
  const [isDemo, setIsDemo] = useState(true);
  const [toast, showToast, clearToast] = useToast();

  async function loadReservations() {
    setLoading(true);
    try {
      const data = await reservationApi.listAll();
      const mapped = (data.reservations || []).map((item) => ({ ...mapReservation(item), book: mapReservation(item).title }));
      setRows(mapped);
      setIsDemo(false);
      setNotice('Đã kết nối backend thật qua GET /api/reservations.');
      if (mapped[0]) setQueueBook(mapped[0].book);
    } catch (error) {
      setRows(DEMO_ALL_RESERVATIONS);
      setIsDemo(true);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadReservations(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const books = useMemo(() => ['ALL', ...new Set(rows.map((item) => item.book || item.title))], [rows]);
  const queueBooks = books.filter((book) => book !== 'ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((item) =>
      (bookFilter === 'ALL' || item.book === bookFilter) &&
      (statusFilter === 'ALL' || item.status === statusFilter) &&
      (!q || `${item.member} ${item.book}`.toLowerCase().includes(q))
    );
  }, [rows, search, bookFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const queue = useMemo(() => rows.filter((item) => item.book === queueBook && !['Expired', 'Cancelled'].includes(item.status)).sort((a, b) => a.queue - b.queue), [rows, queueBook]);

  function notifyNext() {
    const head = queue[0];
    if (head) setNotifyTarget(head);
  }

  async function confirmNotify() {
    if (!notifyTarget) return;
    try {
      if (!isDemo) {
        await reservationApi.process(notifyTarget.reservationId, { copyId: notifyTarget.copyId });
      }
      setRows((prev) => prev.map((item) => item.id === notifyTarget.id ? { ...item, status: 'Ready to pick up', deadline: item.deadline || new Date(Date.now() + 2 * 86400000).toISOString() } : item));
      showToast(`Đã gửi thông báo có sách tới ${notifyTarget.member}.`, 'success');
      setNotifyTarget(null);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function fulfill(id) {
    const item = rows.find((row) => row.id === id);
    setRows((prev) => prev.filter((row) => row.id !== id));
    showToast(`Đã giao sách "${item?.book || '-'}" cho ${item?.member || 'thành viên'}.`, 'success');
  }

  function remove(id) {
    setRows((prev) => prev.filter((row) => row.id !== id));
    showToast('Đã xóa đặt chỗ khỏi hàng đợi trên UI demo.', 'info');
  }

  return (
    <AppLayout
      active="reservations-librarian"
      title="Quản lý đặt chỗ"
      subtitle="Quản lý đặt chỗ, xử lý ưu tiên hàng đợi và gửi thông báo có sách."
      actions={<button className="btn btn-outline" onClick={loadReservations} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      <DataNotice type={isDemo ? 'warn' : 'success'} title={isDemo ? 'Demo fallback' : 'Backend connected'}>{notice}</DataNotice>
      <div className="tabs">
        <button className={`tab${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}><CalendarClock size={14} /> Tất cả đặt chỗ</button>
        <button className={`tab${view === 'queue' ? ' active' : ''}`} onClick={() => setView('queue')}><PackageCheck size={14} /> Hàng đợi theo sách</button>
      </div>

      {loading ? <LoadingBlock rows={4} /> : view === 'list' ? (
        <>
          <div className="toolbar">
            <div className="search-input"><Search size={16} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm thành viên / sách..." aria-label="Tìm" /></div>
            <select className="select" style={{ width: 200 }} value={bookFilter} onChange={(e) => { setBookFilter(e.target.value); setPage(1); }} aria-label="Filter by book">{books.map((book) => <option key={book} value={book}>{book === 'ALL' ? 'Tất cả sách' : book}</option>)}</select>
            <select className="select" style={{ width: 190 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Filter by reservation status">{STATUSES.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'Tất cả trạng thái' : status}</option>)}</select>
          </div>
          <div className="lib-table-wrap">
            <table className="lib-table"><caption className="sr-only">Reservations table</caption><thead><tr><th scope="col">Thành viên</th><th scope="col">Sách</th><th scope="col">Ngày đặt</th><th scope="col">Vị trí</th><th scope="col">Trạng thái</th></tr></thead><tbody>{pageRows.map((item) => <tr key={item.id}><td>{item.member}</td><td><strong>{item.book}</strong></td><td>{fmtDate(item.reservedDate)}</td><td>#{item.queue}</td><td><Badge status={item.status} /></td></tr>)}</tbody></table>
            {pageRows.length === 0 && <EmptyState icon={CalendarClock} title="Không có đặt chỗ phù hợp" />}
          </div>
          <div className="pagination"><span className="muted">{filtered.length} đặt chỗ • trang {safePage}/{totalPages}</span><div className="page-controls"><button className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>{Array.from({ length: totalPages }, (_, i) => <button key={i} className={`page-btn${safePage === i + 1 ? ' active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>)}<button className="page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div></div>
        </>
      ) : (
        <div className="lib-card">
          <div className="toolbar">
            <h3 className="lib-card-title" style={{ margin: 0 }}>Hàng đợi chờ</h3>
            <select className="select" style={{ width: 220 }} value={queueBook} onChange={(e) => setQueueBook(e.target.value)} aria-label="Select queue book">{queueBooks.map((book) => <option key={book} value={book}>{book}</option>)}</select>
            <span className="spacer" />
            <button className="btn btn-primary btn-sm" onClick={notifyNext} disabled={!queue.length || queue[0].status === 'Ready to pick up'}><Bell size={14} /> Báo thành viên tiếp theo</button>
          </div>
          <div className="alert-box info" style={{ marginBottom: 16 }}>Backend giữ luật ưu tiên: chỉ staff mới process queue, và service sẽ chọn reservation đủ điều kiện ưu tiên.</div>
          <div className="queue-list">
            {queue.map((item, index) => <div className={`queue-item${index === 0 ? ' head' : ''}`} key={item.id}><span className="queue-pos">{item.queue}</span><div className="stack-sm"><strong>{item.member}</strong><span className="muted" style={{ fontSize: 13 }}>Đặt ngày {fmtDate(item.reservedDate)} • {item.id}</span></div>{item.status === 'Ready to pick up' && <Badge status="Ready to pick up" />}<div className="queue-actions">{index === 0 && item.status !== 'Ready to pick up' && <button className="btn btn-outline btn-sm" onClick={() => setNotifyTarget(item)}><Bell size={13} /> Báo nhận</button>}<button className="btn btn-success btn-sm" onClick={() => fulfill(item.id)}><CheckCircle2 size={13} /> Đã giao</button><button className="icon-btn" title="Xóa" onClick={() => remove(item.id)}><Trash2 size={15} /></button></div></div>)}
            {queue.length === 0 && <EmptyState icon={PackageCheck} title="Hàng đợi trống cho cuốn sách này" />}
          </div>
        </div>
      )}

      {notifyTarget && <Modal eyebrow="UC40 • Notify Member • Book Available" title="Gửi thông báo có sách" onClose={() => setNotifyTarget(null)} actions={<><button className="btn btn-ghost" onClick={() => setNotifyTarget(null)}>Hủy</button><button className="btn btn-primary" onClick={confirmNotify}><Send size={16} /> Gửi thông báo</button></>}><div className="email-card"><div className="email-head"><span className="brand-mark"><Bell size={20} /></span><strong style={{ fontFamily: 'var(--lib-heading)' }}>Sách bạn đặt đã sẵn sàng</strong></div><div className="email-body"><p>Xin chào <strong>{notifyTarget.member}</strong>,</p><p>Cuốn sách <strong>{notifyTarget.book}</strong> bạn đặt này đã có sẵn để nhận.</p><p className="muted">Hạn đến lấy: <strong style={{ color: 'var(--lib-ink)' }}>{fmtDate(notifyTarget.deadline || '2026-06-22')}</strong> tại quầy thủ thư.</p></div></div></Modal>}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
