/**
 * FE08 - UC38 View Reservation List + UC39 Process Reservation Queue + UC40 Notify.
 * API thật: GET /api/reservations, PATCH /api/reservations/:id/process, POST /api/reservations/process-queue, POST /api/reservations/expire-holds.
 */

import { useEffect, useMemo, useState } from 'react';
import { Search, CalendarClock, Bell, PackageCheck, ChevronLeft, ChevronRight, Send, RefreshCw } from 'lucide-react';

import { reservationApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, ConfirmAction, Badge, DataNotice, EmptyState } from '../../component/shared/Feedback';
import { DataTable, DataToolbar } from '../../component/shared/OperationalPatterns';
import { DEMO_ALL_RESERVATIONS, fmtDate, mapReservation } from '../../utils/libraryFeatureViewModels';
import {
  getExpireHoldsSuccessMessage,
  isActiveReservationQueueStatus,
  runHoldExpirationWorkflow,
} from '../../utils/reservationViewState';

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
  const [notifying, setNotifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expiringHolds, setExpiringHolds] = useState(false);
  const [notice, setNotice] = useState('Đang hiển thị dữ liệu demo để review UI quản lý đặt chỗ.');
  const [isDemo, setIsDemo] = useState(true);
  const [toast, showToast, clearToast] = useToast();

  async function loadReservations({ fallbackToDemo = true } = {}) {
    setLoading(true);
    try {
      const data = await reservationApi.listAll();
      const mapped = (data.reservations || []).map((item) => ({ ...mapReservation(item), book: mapReservation(item).title }));
      setRows(mapped);
      setIsDemo(false);
      setNotice('Dữ liệu đặt chỗ đã được cập nhật.');
      if (mapped[0]) setQueueBook(mapped[0].book);
    } catch (error) {
      if (!fallbackToDemo) {
        throw error;
      }
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
    const query = search.trim().toLowerCase();
    return rows.filter((item) =>
      (bookFilter === 'ALL' || item.book === bookFilter) &&
      (statusFilter === 'ALL' || item.status === statusFilter) &&
      (!query || `${item.member} ${item.book}`.toLowerCase().includes(query))
    );
  }, [rows, search, bookFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const queue = useMemo(
    () => rows
      .filter((item) => item.book === queueBook && isActiveReservationQueueStatus(item.status))
      .sort((a, b) => a.queue - b.queue),
    [rows, queueBook],
  );

  function notifyNext() {
    const head = queue[0];
    if (head) setNotifyTarget(head);
  }

  async function confirmNotify() {
    if (!notifyTarget || notifying) return;
    setNotifying(true);
    try {
      if (!isDemo) {
        await reservationApi.process(notifyTarget.reservationId, { copyId: notifyTarget.copyId });
      }
      setRows((current) => current.map((item) => item.id === notifyTarget.id
        ? { ...item, status: 'Ready to pick up', deadline: item.deadline || new Date(Date.now() + 2 * 86400000).toISOString() }
        : item));
      showToast(`Đã gửi thông báo có sách tới ${notifyTarget.member}.`, 'success');
      setNotifyTarget(null);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setNotifying(false);
    }
  }

  async function expireHolds() {
    setExpiringHolds(true);
    try {
      await runHoldExpirationWorkflow({
        expireHolds: reservationApi.expireHolds,
        reloadReservations: loadReservations,
        onSuccess: (result) => showToast(getExpireHoldsSuccessMessage(result), 'success'),
      });
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setExpiringHolds(false);
    }
  }

  return (
    <AppLayout
      active="reservations-librarian"
      title="Quản lý đặt chỗ"
      subtitle="Quản lý đặt chỗ, xử lý ưu tiên hàng đợi và gửi thông báo có sách."
      actions={(
        <div className="row-flex" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={expireHolds} disabled={loading || expiringHolds || isDemo}>
            <CalendarClock size={16} /> {expiringHolds ? 'Đang xử lý...' : 'Xử lý giữ chỗ hết hạn'}
          </button>
          <button className="btn btn-outline" onClick={loadReservations} disabled={loading || expiringHolds}>
            <RefreshCw size={16} /> Tải lại
          </button>
        </div>
      )}
    >
      <DataNotice type={isDemo ? 'warning' : 'success'} title={isDemo ? 'Dữ liệu demo' : 'Đã cập nhật dữ liệu'}>{notice}</DataNotice>
      <div className="tabs">
        <button className={`tab${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}><CalendarClock size={14} /> Tất cả đặt chỗ</button>
        <button className={`tab${view === 'queue' ? ' active' : ''}`} onClick={() => setView('queue')}><PackageCheck size={14} /> Hàng đợi theo sách</button>
      </div>

      {view === 'list' ? (
        <>
          <DataToolbar
            primary={(
              <div className="search-input"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm thành viên / sách..." aria-label="Tìm" /></div>
            )}
            filters={(
              <>
                <select className="select" style={{ width: 200 }} value={bookFilter} onChange={(event) => { setBookFilter(event.target.value); setPage(1); }} aria-label="Filter by book">
                  {books.map((book) => <option key={book} value={book}>{book === 'ALL' ? 'Tất cả sách' : book}</option>)}
                </select>
                <select className="select" style={{ width: 190 }} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter by reservation status">
                  {STATUSES.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'Tất cả trạng thái' : status}</option>)}
                </select>
              </>
            )}
            summary={<span className="muted">{filtered.length} đặt chỗ • trang {safePage}/{totalPages}</span>}
          />
          <DataTable
            caption="Reservations table"
            headers={['Thành viên', 'Sách', 'Ngày đặt', 'Vị trí', 'Trạng thái']}
            loading={loading}
            isEmpty={pageRows.length === 0}
            emptyState={<EmptyState icon={CalendarClock} title="Không có đặt chỗ phù hợp" />}
          >
            {pageRows.map((item) => (
              <tr key={item.id}>
                <td data-label="Thành viên">{item.member}</td>
                <td data-label="Sách"><strong>{item.book}</strong></td>
                <td data-label="Ngày đặt">{fmtDate(item.reservedDate)}</td>
                <td data-label="Vị trí">#{item.queue}</td>
                <td data-label="Trạng thái"><Badge status={item.status} /></td>
              </tr>
            ))}
          </DataTable>
          {!loading && (
            <div className="pagination">
              <span className="muted">{filtered.length} đặt chỗ • trang {safePage}/{totalPages}</span>
              <div className="page-controls">
                <button className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
                {Array.from({ length: totalPages }, (_, index) => <button key={index} className={`page-btn${safePage === index + 1 ? ' active' : ''}`} onClick={() => setPage(index + 1)}>{index + 1}</button>)}
                <button className="page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="lib-card">
          <DataToolbar
            primary={<h3 className="lib-card-title" style={{ margin: 0 }}>Hàng đợi chờ</h3>}
            filters={(
              <select className="select" style={{ width: 220 }} value={queueBook} onChange={(event) => setQueueBook(event.target.value)} aria-label="Select queue book">
                {queueBooks.map((book) => <option key={book} value={book}>{book}</option>)}
              </select>
            )}
            actions={<button className="btn btn-primary btn-sm" onClick={notifyNext} disabled={!queue.length || queue[0].status === 'Ready to pick up'}><Bell size={14} /> Báo thành viên tiếp theo</button>}
          />
          <div className="alert-box info" style={{ marginBottom: 16 }}>Máy chủ giữ luật ưu tiên và chọn lượt đặt chỗ đủ điều kiện tiếp theo.</div>
          <div className="queue-list">
            {queue.map((item, index) => (
              <div className={`queue-item${index === 0 ? ' head' : ''}`} key={item.id}>
                <span className="queue-pos">{item.queue}</span>
                <div className="stack-sm"><strong>{item.member}</strong><span className="muted" style={{ fontSize: 13 }}>Đặt ngày {fmtDate(item.reservedDate)} • {item.id}</span></div>
                <div className="queue-actions">{index === 0 && <button className="btn btn-outline btn-sm" onClick={() => setNotifyTarget(item)}><Bell size={13} /> Báo nhận</button>}</div>
              </div>
            ))}
            {queue.length === 0 && <EmptyState icon={PackageCheck} title="Hàng đợi trống cho cuốn sách này" />}
          </div>
        </div>
      )}

      {notifyTarget && (
        <ConfirmAction
          eyebrow="UC40 • Thông báo có sách"
          title="Gửi thông báo có sách"
          confirmLabel="Gửi thông báo"
          pending={notifying}
          onCancel={() => setNotifyTarget(null)}
          onConfirm={confirmNotify}
        >
          <div className="email-card">
            <div className="email-head"><span className="brand-mark"><Bell size={20} /></span><strong style={{ fontFamily: 'var(--lib-heading)' }}>Sách bạn đặt đã sẵn sàng</strong></div>
            <div className="email-body">
              <p>Xin chào <strong>{notifyTarget.member}</strong>,</p>
              <p>Cuốn sách <strong>{notifyTarget.book}</strong> bạn đặt đã có sẵn để nhận.</p>
              <p className="muted">Hạn đến lấy: <strong style={{ color: 'var(--lib-ink)' }}>{fmtDate(notifyTarget.deadline || '2026-06-22')}</strong> tại quầy thủ thư.</p>
            </div>
          </div>
        </ConfirmAction>
      )}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
