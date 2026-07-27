/**
 * FE08 - UC36 Reserve Book + UC37 Cancel Reservation (Member)
 * API thật: /api/reservations, /api/reservations/me, /api/reservations/:id/cancel.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bookmark, BookOpen, Search, X, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { publicBrowseApi, reservationApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, ConfirmAction, Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DataTable, DataToolbar, Pagination } from '../../component/shared/OperationalPatterns';
import {
  fmtDate,
  formatReservationQueuePosition,
  isOpenMemberReservationStatus,
  mapReservation,
  memberReservationBadgeStatus,
  splitMemberReservations,
} from '../../utils/libraryFeatureViewModels';
import { getStatusLabel } from '../../utils/uiLabels';

const CANDIDATE_PAGE_SIZE = 20;
const RESERVATION_API_PAGE_SIZE = 100;
const EMPTY_CANDIDATE_PAGINATION = {
  page: 1,
  limit: CANDIDATE_PAGE_SIZE,
  total: 0,
  totalPages: 0,
};

// @spec FR-FE08-035, AC-FE08-022
export default function MyReservationsPage() {
  const [searchParams] = useSearchParams();
  const requestedBookId = Number(searchParams.get('bookId'));
  const [reservations, setReservations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [candidatePagination, setCandidatePagination] = useState(EMPTY_CANDIDATE_PAGINATION);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState(null);
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [toast, showToast, clearToast] = useToast();
  // @spec NFR-FE08-UX-002 — chống double-submit nút "Đặt chỗ".
  const [reservingCopyId, setReservingCopyId] = useState(null);
  // @spec NFR-FE08-PERF-001 — sequence number cho loadCandidates để tránh race khi user gõ nhanh.
  const candidatesSequenceRef = useRef(0);
  const activeReservedCopyIds = new Set(
    reservations
      .filter((item) => isOpenMemberReservationStatus(item.rawStatus))
      .map((item) => Number(item.copyId))
  );
  // @spec FR-FE08-032
  const { current: currentReservations, history: reservationHistory } =
    splitMemberReservations(reservations);
  const readyReservations = currentReservations.filter(
    (item) => item.rawStatus === 'NOTIFIED'
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
    // @spec NFR-FE08-PERF-001 — chỉ giữ kết quả của lần gọi mới nhất để tránh ghi đè ngược.
    const sequence = Date.now();
    candidatesSequenceRef.current = sequence;

    setCandidateLoading(true);
    setCandidateError(null);
    try {
      const data = await reservationApi.listCandidates({
        q: query.trim(),
        page,
        limit: CANDIDATE_PAGE_SIZE,
      });
      if (candidatesSequenceRef.current !== sequence) return;
      setCandidates(data.data || []);
      setCandidatePagination(data.pagination || {
        ...EMPTY_CANDIDATE_PAGINATION,
        page,
      });
    } catch (error) {
      if (candidatesSequenceRef.current !== sequence) return;
      setCandidates([]);
      setCandidatePagination({ ...EMPTY_CANDIDATE_PAGINATION, page: 1 });
      setCandidateError(error.message);
    } finally {
      if (candidatesSequenceRef.current === sequence) setCandidateLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { loadReservations(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // @spec FR-FE08-031
  useEffect(() => {
    if (!Number.isInteger(requestedBookId) || requestedBookId <= 0) return undefined;

    let active = true;
    publicBrowseApi.detail(requestedBookId)
      .then((data) => {
        const selectedTitle = data?.book?.title?.trim();
        if (active && selectedTitle) setSearch(selectedTitle);
      })
      .catch(() => {
        if (active) {
          setCandidateError('Không thể xác định sách đã chọn. Bạn vẫn có thể tìm sách để đặt chỗ.');
        }
      });

    return () => { active = false; };
  }, [requestedBookId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { loadCandidates(search, 1); }, 250);
    return () => window.clearTimeout(timer);
  }, [loadCandidates, search]);

  async function reserve(candidate) {
    if (reservingCopyId) return;
    if (reservations.some((item) => (
      Number(item.copyId) === Number(candidate.copyId)
      && isOpenMemberReservationStatus(item.rawStatus)
    ))) {
      showToast(`Bạn đã có đặt chỗ đang hoạt động cho "${candidate.title}".`, 'info');
      return;
    }

    setReservingCopyId(candidate.copyId);
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
      showToast(
        `Đã đặt "${next.title}". Vị trí hiện tại: ${formatReservationQueuePosition(next.queue)}.`,
        'success',
      );
    } catch (error) {
      showToast(error.message, 'error');
      await loadCandidates(search, candidatePagination.page);
    } finally {
      setReservingCopyId(null);
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
      {/* @spec FR-FE08-033 */}
      {readyReservations.map((item) => (
        <DataNotice key={`pickup-${item.reservationId}`} type="success" title={`Sách "${item.title}" đã sẵn sàng nhận`}>
          Vui lòng đến quầy thư viện từ ngày {fmtDate(item.pickupStart)} đến hết ngày {fmtDate(item.deadline)}.
          Trước khi nhận sách, hãy tạo yêu cầu mượn để thủ thư hoặc quản trị viên duyệt. Quá thời hạn này, lượt giữ chỗ có thể hết hiệu lực.
        </DataNotice>
      ))}

      <div className="lib-card member-reservation-catalog">
        <h3 className="lib-card-title">Đặt một cuốn sách</h3>
        <DataToolbar
          primary={(
            <div className="search-input" style={{ width: '100%' }}>
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sách để đặt..." aria-label="Tìm sách" />
              {search && (
                <button type="button" className="icon-btn" aria-label="Xóa từ khóa tìm sách" onClick={() => setSearch('')} disabled={loading || candidateLoading}>
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        />
        {candidateError && <DataNotice type="error" title="Không thể tải sách có thể đặt chỗ">{candidateError}</DataNotice>}
        <div className="queue-list">
          {candidateLoading && <LoadingBlock rows={3} label="Đang tải sách có thể đặt chỗ..." />}
          {!candidateLoading && candidates.map((candidate) => {
            const currentReservation = currentReservations.find(
              (item) => Number(item.copyId) === Number(candidate.copyId)
            );
            const alreadyReserved = candidate.hasActiveReservation || Boolean(currentReservation)
              || activeReservedCopyIds.has(Number(candidate.copyId));
            const reservationActionLabel = currentReservation?.rawStatus === 'NOTIFIED'
              ? 'Đến lượt bạn'
              : alreadyReserved ? 'Đang đặt chỗ' : 'Đặt chỗ';
            const isReservingThisCopy = reservingCopyId === candidate.copyId;
            return (
            <div className="queue-item" key={candidate.copyId}>
              <span className="book-spine" style={{ background: 'linear-gradient(135deg,#a87532,#7b5528)' }} />
              <div className="stack-sm" style={{ flex: 1 }}><strong>{candidate.title}</strong><span className="muted" style={{ fontSize: 13 }}>{candidate.authorName || 'Chưa rõ tác giả'}</span></div>
              <span className="badge badge-waiting">
                {candidate.activeReservationCount} người đang chờ • {candidate.copyStatus === 'RESERVED' ? 'Đang được giữ' : 'Đang được mượn'}
              </span>
              <button
                className="btn btn-primary btn-sm"
                disabled={alreadyReserved || Boolean(reservingCopyId)}
                onClick={() => reserve(candidate)}
                aria-busy={isReservingThisCopy}
              >
                <Bookmark size={14} /> {isReservingThisCopy ? 'Đang đặt…' : reservationActionLabel}
              </button>
            </div>
            );
          })}
          {!candidateLoading && candidates.length === 0 && !candidateError && <EmptyState icon={BookOpen} title="Không tìm thấy sách có thể đặt chỗ" />}
        </div>
        {candidatePagination.totalPages > 1 && (
          <Pagination
            currentPage={candidatePagination.page}
            totalPages={candidatePagination.totalPages}
            onPageChange={(nextPage) => loadCandidates(search, nextPage)}
            summary={`Trang ${candidatePagination.page}/${candidatePagination.totalPages} • ${candidatePagination.total} bản sao`}
            ariaLabel="Phân trang danh sách sách có thể đặt chỗ"
          />
        )}
      </div>

      <div className="lib-card member-reservation-list">
        <h3 className="lib-card-title">Đặt chỗ đang hoạt động</h3>
        <DataTable
          caption="Danh sách đặt chỗ đang hoạt động của tôi"
          headers={['Sách', 'Ngày đặt', 'Vị trí của bản sách', 'Trạng thái', { label: 'Thao tác', align: 'right' }]}
          loading={loading}
          loadingRows={3}
          isEmpty={currentReservations.length === 0}
          emptyState={<EmptyState icon={Bookmark} title="Bạn không có đặt chỗ đang hoạt động" />}
        >
          {currentReservations.map((item) => (
            <tr key={item.id}>
              <td data-label="Sách"><div className="stack-sm"><strong>{item.title}</strong><span className="muted" style={{ fontSize: 13 }}>{item.author}</span></div></td>
              <td data-label="Ngày đặt">{fmtDate(item.reservedDate)}</td>
              <td data-label="Vị trí của bản sách">
                {item.status === 'Ready to pick up'
                  ? <span className="row-flex" style={{ gap: 6, color: 'var(--st-green)' }}><CheckCircle2 size={15} /> Đến lượt bạn</span>
                  : !isOpenMemberReservationStatus(item.rawStatus)
                    ? <span className="muted">-</span>
                    : <span className="row-flex" style={{ gap: 6 }}><Clock size={15} /> {formatReservationQueuePosition(item.queue, 'cuốn này')}</span>}
              </td>
              <td data-label="Trạng thái"><Badge status={memberReservationBadgeStatus(item.rawStatus)}>{getStatusLabel(item.status)}</Badge>{item.status === 'Ready to pick up' && item.deadline && <div className="field-hint">Lấy trước {fmtDate(item.deadline)}</div>}</td>
              <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                <div className="row-flex" style={{ justifyContent: 'flex-end', gap: 8 }}>
                  {item.rawStatus === 'NOTIFIED' && item.bookId && (
                    <Link className="btn btn-primary btn-sm" to={`/borrowing/new?bookId=${item.bookId}&copyId=${item.copyId}`}>
                      <BookOpen size={14} /> Tạo yêu cầu mượn
                    </Link>
                  )}
                  {isOpenMemberReservationStatus(item.rawStatus) && <button className="btn btn-outline btn-sm" onClick={() => setCancelTarget(item)}><X size={14} /> Hủy</button>}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="lib-card member-reservation-list">
        <h3 className="lib-card-title">Lịch sử đặt chỗ</h3>
        <DataTable
          caption="Lịch sử đặt chỗ của tôi"
          headers={['Sách', 'Ngày đặt', 'Vị trí của bản sách', 'Trạng thái', { label: 'Thao tác', align: 'right' }]}
          loading={loading}
          loadingRows={3}
          isEmpty={reservationHistory.length === 0}
          emptyState={<EmptyState icon={Clock} title="Bạn chưa có lịch sử đặt chỗ" />}
        >
          {reservationHistory.map((item) => (
            <tr key={item.id}>
              <td data-label="Sách"><div className="stack-sm"><strong>{item.title}</strong><span className="muted" style={{ fontSize: 13 }}>{item.author}</span></div></td>
              <td data-label="Ngày đặt">{fmtDate(item.reservedDate)}</td>
              <td data-label="Vị trí của bản sách"><span className="muted">-</span></td>
              <td data-label="Trạng thái"><Badge status={memberReservationBadgeStatus(item.rawStatus)}>{getStatusLabel(item.status)}</Badge></td>
              <td data-label="Thao tác" style={{ textAlign: 'right' }}><span className="muted">-</span></td>
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
          {cancelTarget.status === 'Waiting' && (
            <div className="alert-box info" style={{ marginTop: 12 }}>
              Vị trí hiện tại: {formatReservationQueuePosition(cancelTarget.queue)}. Sau khi hủy,
              vị trí này không thể khôi phục.
            </div>
          )}
        </ConfirmAction>
      )}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
