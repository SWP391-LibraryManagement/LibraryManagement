/**
 * FE08 - UC36 Reserve Book + UC37 Cancel Reservation (Member)
 * API thật: /api/reservations, /api/reservations/me, /api/reservations/:id/cancel.
 */

import { useCallback, useEffect, useState } from 'react';
import { Bookmark, BookOpen, Search, X, Clock, CheckCircle2, RefreshCw } from 'lucide-react';

import { reservationApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, ConfirmAction, Badge, DataNotice, EmptyState } from '../../component/shared/Feedback';
import { DataTable, DataToolbar } from '../../component/shared/OperationalPatterns';
import { fmtDate, isOpenMemberReservationStatus, mapReservation } from '../../utils/libraryFeatureViewModels';
import { getStatusLabel } from '../../utils/uiLabels';

const CANDIDATE_PAGE_SIZE = 20;
const RESERVATION_API_PAGE_SIZE = 100;
const EMPTY_CANDIDATE_PAGINATION = {
  page: 1,
  limit: CANDIDATE_PAGE_SIZE,
  total: 0,
  totalPages: 0,
};

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [candidatePagination, setCandidatePagination] = useState(EMPTY_CANDIDATE_PAGINATION);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState(null);
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [toast, showToast, clearToast] = useToast();
  const activeReservedCopyIds = new Set(
    reservations
      .filter((item) => isOpenMemberReservationStatus(item.rawStatus))
      .map((item) => Number(item.copyId))
  );

  async function loadReservations() {
    setLoading(true);
    try {
      const allReservations = [];
      let page = 1;
      let totalApiPages = 1;

      do {
        const data = await reservationApi.listMine({ page, limit: RESERVATION_API_PAGE_SIZE });
        allReservations.push(...(data.reservations || []));
        totalApiPages = Number(data.pagination?.totalPages || 0);
        page += 1;
      } while (page <= totalApiPages);

      setReservations(allReservations.map(mapReservation));
      setNotice(null);
    } catch (error) {
      setReservations([]);
      setNotice({ type: 'error', title: 'Không thể tải đặt chỗ', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  const loadCandidates = useCallback(async (query = '', page = 1) => {
    setCandidateLoading(true);
    setCandidateError(null);
    try {
      const data = await reservationApi.listCandidates({
        q: query.trim(),
        page,
        limit: CANDIDATE_PAGE_SIZE,
      });
      setCandidates(data.data || []);
      setCandidatePagination(data.pagination || {
        ...EMPTY_CANDIDATE_PAGINATION,
        page,
      });
    } catch (error) {
      setCandidates([]);
      setCandidatePagination({ ...EMPTY_CANDIDATE_PAGINATION, page: 1 });
      setCandidateError(error.message);
    } finally {
      setCandidateLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { loadReservations(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { loadCandidates(search, 1); }, 250);
    return () => window.clearTimeout(timer);
  }, [loadCandidates, search]);

  async function reserve(candidate) {
    if (reservations.some((item) => (
      Number(item.copyId) === Number(candidate.copyId)
      && isOpenMemberReservationStatus(item.rawStatus)
    ))) {
      showToast(`Bạn đã có đặt chỗ đang hoạt động cho "${candidate.title}".`, 'info');
      return;
    }

    try {
      const data = await reservationApi.create(candidate.copyId);
      const next = mapReservation(data.reservation);
      setCandidates((current) => current.map((item) => (
        item.copyId === candidate.copyId ? { ...item, hasActiveReservation: true } : item
      )));
      await Promise.all([
        loadReservations(),
        loadCandidates(search, candidatePagination.page),
      ]);
      showToast(`Đã đặt "${next.title}". Vị trí hiện tại: #${next.queue}.`, 'success');
    } catch (error) {
      showToast(error.message, 'error');
      await loadCandidates(search, candidatePagination.page);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    try {
      await reservationApi.cancel(cancelTarget.reservationId, 'Cancelled by member from UI');
      await Promise.all([
        loadReservations(),
        loadCandidates(search, candidatePagination.page),
      ]);
      showToast(`Đã hủy đặt chỗ "${cancelTarget.title}".`, 'info');
      setCancelTarget(null);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <AppLayout
      active="my-reservations"
      title="Đặt chỗ của tôi"
      subtitle="Đặt sách và theo dõi hàng đợi. Thủ thư hoặc quản trị viên sẽ xử lý khi sách sẵn sàng."
      actions={<button className="btn btn-outline" onClick={() => Promise.all([loadReservations(), loadCandidates(search, candidatePagination.page)])} disabled={loading || candidateLoading}><RefreshCw size={16} /> Tải lại</button>}
    >
      {notice && <DataNotice type={notice.type} title={notice.title}>{notice.message}</DataNotice>}

      <div className="lib-card member-reservation-catalog">
        <h3 className="lib-card-title">Đặt một cuốn sách</h3>
        <DataToolbar
          primary={(
            <div className="search-input" style={{ width: '100%' }}>
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sách để đặt..." aria-label="Tìm sách" />
            </div>
          )}
        />
        {candidateError && <DataNotice type="error" title="Không thể tải sách có thể đặt chỗ">{candidateError}</DataNotice>}
        <div className="queue-list">
          {!candidateLoading && candidates.map((candidate) => {
            const alreadyReserved = candidate.hasActiveReservation
              || activeReservedCopyIds.has(Number(candidate.copyId));
            return (
            <div className="queue-item" key={candidate.copyId}>
              <span className="book-spine" style={{ background: 'linear-gradient(135deg,#a87532,#7b5528)' }} />
              <div className="stack-sm" style={{ flex: 1 }}><strong>{candidate.title}</strong><span className="muted" style={{ fontSize: 13 }}>{candidate.authorName || 'Chưa rõ tác giả'}</span></div>
              <span className="badge badge-waiting">
                {candidate.activeReservationCount} người đang chờ • {candidate.copyStatus === 'RESERVED' ? 'Đang được giữ' : 'Đang được mượn'}
              </span>
              <button className="btn btn-primary btn-sm" disabled={alreadyReserved} onClick={() => reserve(candidate)}><Bookmark size={14} /> {alreadyReserved ? 'Đã đặt chỗ' : 'Đặt chỗ'}</button>
            </div>
            );
          })}
          {!candidateLoading && candidates.length === 0 && <EmptyState icon={BookOpen} title="Không tìm thấy sách có thể đặt chỗ" />}
        </div>
        {candidatePagination.totalPages > 1 && (
          <div className="pagination" aria-label="Phân trang danh sách sách có thể đặt chỗ">
            <button className="btn btn-outline btn-sm" disabled={candidatePagination.page <= 1 || candidateLoading} onClick={() => loadCandidates(search, candidatePagination.page - 1)}>Trang trước</button>
            <span>Trang {candidatePagination.page}/{candidatePagination.totalPages} • {candidatePagination.total} bản sao</span>
            <button className="btn btn-outline btn-sm" disabled={candidatePagination.page >= candidatePagination.totalPages || candidateLoading} onClick={() => loadCandidates(search, candidatePagination.page + 1)}>Trang sau</button>
          </div>
        )}
      </div>

      <div className="lib-card member-reservation-list">
        <h3 className="lib-card-title">Đặt chỗ của tôi</h3>
        <DataTable
          caption="Danh sách đặt chỗ của tôi"
          headers={['Sách', 'Ngày đặt', 'Vị trí hàng đợi', 'Trạng thái', { label: 'Thao tác', align: 'right' }]}
          loading={loading}
          loadingRows={3}
          isEmpty={reservations.length === 0}
          emptyState={<EmptyState icon={Bookmark} title="Bạn chưa có đặt chỗ" />}
        >
          {reservations.map((item) => (
            <tr key={item.id}>
              <td data-label="Sách"><div className="stack-sm"><strong>{item.title}</strong><span className="muted" style={{ fontSize: 13 }}>{item.author}</span></div></td>
              <td data-label="Ngày đặt">{fmtDate(item.reservedDate)}</td>
              <td data-label="Vị trí hàng đợi">
                {item.status === 'Ready to pick up'
                  ? <span className="row-flex" style={{ gap: 6, color: 'var(--st-green)' }}><CheckCircle2 size={15} /> Đến lượt bạn</span>
                  : !isOpenMemberReservationStatus(item.rawStatus)
                    ? <span className="muted">-</span>
                    : <span className="row-flex" style={{ gap: 6 }}><Clock size={15} /> #{item.queue}</span>}
              </td>
              <td data-label="Trạng thái"><Badge status={item.status}>{getStatusLabel(item.status)}</Badge>{item.status === 'Ready to pick up' && item.deadline && <div className="field-hint">Lấy trước {fmtDate(item.deadline)}</div>}</td>
              <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                {isOpenMemberReservationStatus(item.rawStatus) && <button className="btn btn-outline btn-sm" onClick={() => setCancelTarget(item)}><X size={14} /> Hủy</button>}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {cancelTarget && (
        <ConfirmAction
          eyebrow="UC37 • Hủy đặt chỗ"
          title="Hủy đặt chỗ"
          tone="danger"
          confirmLabel="Xác nhận hủy"
          pending={cancelling}
          onCancel={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
        >
          <p>Bạn có chắc muốn hủy đặt chỗ cho <strong>{cancelTarget.title}</strong>?</p>
          {cancelTarget.status === 'Waiting' && <div className="alert-box info" style={{ marginTop: 12 }}>Bạn sẽ mất vị trí #{cancelTarget.queue} trong hàng đợi và không thể khôi phục.</div>}
        </ConfirmAction>
      )}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
