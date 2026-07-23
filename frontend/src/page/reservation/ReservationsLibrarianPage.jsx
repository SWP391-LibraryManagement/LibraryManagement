 /**
 * FE08 - UC38 View Reservation List + UC39 Process Reservation Queue + UC40 Notify.
 * Dữ liệu thật: GET /api/reservations, POST /api/reservations/process-queue,
 * POST /api/reservations/expire-holds.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  RefreshCw,
  Search,
} from 'lucide-react';

import { reservationApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Badge, ConfirmAction, DataNotice, EmptyState, Toast, useToast } from '../../component/shared/Feedback';
import { DataTable } from '../../component/shared/OperationalPatterns';
import { fmtDate, mapReservation } from '../../utils/libraryFeatureViewModels';
import {
  getExpireHoldsSuccessMessage,
  isActiveReservationQueueStatus,
  runHoldExpirationWorkflow,
} from '../../utils/reservationViewState';

const PAGE_SIZE = 8;
const RESERVATION_API_PAGE_SIZE = 100;
const STATUSES = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'Waiting', label: 'Đang chờ' },
  { value: 'Ready to pick up', label: 'Sẵn sàng nhận' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Expired', label: 'Hết hạn' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

const STATUS_LABELS = Object.fromEntries(STATUSES.map(({ value, label }) => [value, label]));

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getQueueSortValue(item) {
  const reservedAt = new Date(item.reservedDate).getTime();
  return Number.isNaN(reservedAt) ? Number.MAX_SAFE_INTEGER : reservedAt;
}

export default function ReservationsLibrarianPage() {
  const [view, setView] = useState('list');
  const [rows, setRows] = useState([]);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [bookFilter, setBookFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [queueCopyId, setQueueCopyId] = useState(null);
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [notifying, setNotifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expiringHolds, setExpiringHolds] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [toast, showToast, clearToast] = useToast();

  async function loadReservations() {
    setLoading(true);
    setLoadError('');
    try {
      const allReservations = [];
      let page = 1;
      let totalApiPages = 1;

      do {
        const data = await reservationApi.listAll({ page, limit: RESERVATION_API_PAGE_SIZE });
        allReservations.push(...(data.reservations || []));
        totalApiPages = Number(data.pagination?.totalPages || 0);
        page += 1;
      } while (page <= totalApiPages);

      const mapped = allReservations.map(mapReservation);
      setRows(mapped);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
      setQueueCopyId((current) => {
        if (current && mapped.some((item) => (
          item.copyId === current && isActiveReservationQueueStatus(item.status)
        ))) return current;
        return mapped.find((item) => isActiveReservationQueueStatus(item.status))?.copyId || null;
      });
    } catch (error) {
      setRows([]);
      setLoadError(error.message || 'Không thể tải dữ liệu đặt chỗ.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadReservations, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const books = useMemo(
    () => ['ALL', ...new Set(rows.map((item) => item.title).filter(Boolean))],
    [rows],
  );
  const queueCopies = useMemo(
    () => Array.from(
      new Map(
        rows
          .filter((item) => isActiveReservationQueueStatus(item.status))
          .map((item) => [item.copyId, item])
      ).values()
    ),
    [rows],
  );
  const filtered = useMemo(() => {
    const query = normalizeSearch(search);
    return rows.filter((item) => {
      const searchable = normalizeSearch([
        item.id,
        item.member,
        item.username,
        item.email,
        item.title,
        item.author,
        item.barcode,
        item.location,
      ].filter(Boolean).join(' '));

      return (bookFilter === 'ALL' || item.title === bookFilter)
        && (statusFilter === 'ALL' || item.status === statusFilter)
        && (!query || searchable.includes(query));
    });
  }, [rows, search, bookFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const queue = useMemo(
    () => rows
      .filter((item) => item.copyId === queueCopyId && isActiveReservationQueueStatus(item.status))
      .sort((left, right) => getQueueSortValue(left) - getQueueSortValue(right)
        || left.reservationId - right.reservationId),
    [rows, queueCopyId],
  );

  function submitSearch(event) {
    event?.preventDefault();
    setSearch(searchDraft);
    setPage(1);
  }

  async function confirmNotify() {
    if (!notifyTarget || notifying) return;
    setNotifying(true);
    try {
      await reservationApi.processQueue(notifyTarget.copyId);
      await loadReservations();
      showToast(`Đã giữ sách và tạo thông báo cho ${notifyTarget.member}.`, 'success');
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
      subtitle="Theo dõi danh sách đặt chỗ, xử lý hàng đợi và các lượt giữ sách hết hạn."
      actions={(
        <div className="row-flex reservation-header-actions">
          <button className="btn btn-outline" onClick={expireHolds} disabled={loading || expiringHolds}>
            <CalendarClock size={16} /> {expiringHolds ? 'Đang xử lý...' : 'Xử lý giữ chỗ hết hạn'}
          </button>
          <button className="btn btn-outline" onClick={loadReservations} disabled={loading || expiringHolds}>
            <RefreshCw size={16} /> {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
      )}
    >
      {loadError && (
        <DataNotice type="error" title="Không thể tải dữ liệu">
          {loadError}
        </DataNotice>
      )}

      <section className="reservation-workspace">
        <div className="reservation-tabs" role="tablist" aria-label="Chế độ xem đặt chỗ">
          <button className={`tab${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')} role="tab" aria-selected={view === 'list'}>
            <CalendarClock size={15} /> Tất cả đặt chỗ
          </button>
          <button className={`tab${view === 'queue' ? ' active' : ''}`} onClick={() => setView('queue')} role="tab" aria-selected={view === 'queue'}>
            <PackageCheck size={15} /> Hàng đợi theo sách
          </button>
          <span className="reservation-updated muted">
            {lastUpdated ? `Cập nhật lúc ${lastUpdated}` : 'Chưa tải dữ liệu'}
          </span>
        </div>

        {view === 'list' ? (
          <>
            <form className="reservation-toolbar" onSubmit={submitSearch}>
              <div className="reservation-search">
                <Search size={17} />
                <input
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Tìm mã đặt chỗ, thành viên, sách, barcode..."
                  aria-label="Tìm kiếm đặt chỗ"
                />
              </div>
              <button className="btn btn-primary" type="submit"><Search size={16} /> Tìm kiếm</button>
              <select value={bookFilter} onChange={(event) => { setBookFilter(event.target.value); setPage(1); }} aria-label="Lọc theo sách">
                {books.map((book) => <option key={book} value={book}>{book === 'ALL' ? 'Tất cả sách' : book}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Lọc theo trạng thái">
                {STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </form>

            <div className="reservation-table-card">
              <div className="reservation-table-summary">
                <strong>{filtered.length}</strong> lượt đặt chỗ
              </div>
              <DataTable
                caption="Danh sách đặt chỗ"
                headers={['Mã', 'Thành viên', 'Sách / bản sao', 'Ngày đặt', 'Vị trí hàng đợi', 'Trạng thái', 'Thao tác']}
                loading={loading}
                isEmpty={!loading && pageRows.length === 0}
                emptyState={<EmptyState icon={CalendarClock} title="Không có đặt chỗ phù hợp" />}
              >
                {pageRows.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Mã"><strong>{item.id}</strong></td>
                    <td data-label="Thành viên">
                      <div className="stack-sm"><strong>{item.member}</strong>{item.email && <span className="muted">{item.email}</span>}</div>
                    </td>
                    <td data-label="Sách / bản sao">
                      <div className="stack-sm"><strong>{item.title}</strong><span className="muted">{item.barcode} • {item.location}</span></div>
                    </td>
                    <td data-label="Ngày đặt">{fmtDate(item.reservedDate)}</td>
                    <td data-label="Vị trí hàng đợi">#{item.queue}</td>
                    <td data-label="Trạng thái"><Badge status={item.status}>{STATUS_LABELS[item.status] || item.status}</Badge></td>
                    <td data-label="Thao tác">
                      {item.status === 'Waiting' ? (
                         <button type="button" className="btn btn-outline btn-sm" onClick={() => { setQueueCopyId(item.copyId); setView('queue'); }}>
                          <PackageCheck size={14} /> Xem hàng đợi
                        </button>
                      ) : <span className="muted">—</span>}
                    </td>
                  </tr>
                ))}
              </DataTable>
              {!loading && (
                <div className="pagination reservation-pagination">
                  <span className="muted">Trang {safePage}/{totalPages} • {filtered.length} kết quả</span>
                  <div className="page-controls">
                    <button className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Trang trước"><ChevronLeft size={16} /></button>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <button key={index} className={`page-btn${safePage === index + 1 ? ' active' : ''}`} onClick={() => setPage(index + 1)}>{index + 1}</button>
                    ))}
                    <button className="page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Trang sau"><ChevronRight size={16} /></button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="reservation-queue-card">
            <div className="reservation-queue-header">
              <div>
                <p className="reservation-eyebrow">HÀNG ĐỢI ƯU TIÊN</p>
                <h2>Hàng đợi theo bản sao</h2>
                <p>Hệ thống xử lý theo thời gian đặt tăng dần; không cho phép thay đổi thứ tự thủ công.</p>
              </div>
              <select value={queueCopyId ?? ''} onChange={(event) => setQueueCopyId(Number(event.target.value))} aria-label="Chọn bản sao xem hàng đợi" disabled={!queueCopies.length}>
                {!queueCopies.length && <option value="">Chưa có bản sao được đặt chỗ</option>}
                {queueCopies.map((item) => <option key={item.copyId} value={item.copyId}>{item.title} • {item.barcode}</option>)}
              </select>
            </div>
            <div className="queue-list">
              {queue.map((item, index) => (
                <div className={`queue-item${index === 0 ? ' head' : ''}`} key={item.id}>
                  <span className="queue-pos">{index + 1}</span>
                  <div className="stack-sm reservation-queue-member">
                    <strong>{item.member}</strong>
                    <span className="muted">{item.id} • {item.barcode} • đặt ngày {fmtDate(item.reservedDate)}</span>
                  </div>
                  <div className="queue-actions">
                    {index === 0 && (
                      <button className="btn btn-primary btn-sm" onClick={() => setNotifyTarget(item)} disabled={item.copyStatus !== 'AVAILABLE'} title={item.copyStatus !== 'AVAILABLE' ? 'Chỉ có thể giữ chỗ sau khi bản sao được trả' : undefined}>
                        <Bell size={14} /> {item.copyStatus === 'AVAILABLE' ? 'Giữ sách & thông báo' : 'Chờ sách được trả'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!loading && queue.length === 0 && <EmptyState icon={PackageCheck} title="Sách này chưa có thành viên đang chờ" />}
            </div>
          </div>
        )}
      </section>

      {notifyTarget && (
        <ConfirmAction
          eyebrow="Xử lý hàng đợi"
          title="Giữ sách cho thành viên tiếp theo?"
          confirmLabel="Xác nhận giữ sách"
          pending={notifying}
          onCancel={() => setNotifyTarget(null)}
          onConfirm={confirmNotify}
        >
          <div className="reservation-confirm-copy">
            <strong>{notifyTarget.member}</strong>
            <span>{notifyTarget.title} • {notifyTarget.barcode}</span>
            <span className="muted">Sau khi xác nhận, bản sao sẽ chuyển sang trạng thái giữ chỗ trong 2 ngày.</span>
          </div>
        </ConfirmAction>
      )}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
