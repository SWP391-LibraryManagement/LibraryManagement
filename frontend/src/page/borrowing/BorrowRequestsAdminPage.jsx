/** FE07 - UC32/UC35 - Process Borrow Request (Librarian). */

import { useEffect, useState } from 'react';
import { ClipboardList, ThumbsUp, ThumbsDown, Phone, Mail, Hash, RefreshCw, UserRound, MapPin, Search, X, Eye } from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, ConfirmAction, Badge, DataNotice, EmptyState } from '../../component/shared/Feedback';
import { DataTable } from '../../component/shared/OperationalPatterns';
import { fmtDate, mapBorrowRequestsToAdminRows } from '../../utils/libraryFeatureViewModels';
import { getStatusLabel } from '../../utils/uiLabels';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const STATUS_LABELS = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};

const PAGE_SIZE = 8;

function normalizeSearchValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replaceAll('đ', 'd')
    .replaceAll('Đ', 'd')
    .toLocaleLowerCase('vi-VN');
}

function RequestStatus({ row }) {
  return <Badge status={row.status}>{STATUS_LABELS[row.rawStatus] || row.status}</Badge>;
}

function RequestReviewSummary({ request }) {
  // @spec FR-FE07-030 - show canonical request, member, and every requested copy before a staff decision.
  return (
    <section className="borrow-review-summary" aria-label={`Thông tin yêu cầu ${request.id}`}>
      <div className="borrow-review-meta">
        <div><span>Mã yêu cầu</span><strong>{request.id}</strong></div>
        <div><span>Ngày gửi</span><strong>{fmtDate(request.requestDate)}</strong></div>
        <div><span>Thành viên</span><strong>{request.member}</strong></div>
        <div><span>Mã hội viên</span><strong>{request.memberId}</strong></div>
        <div><span>Tài khoản</span><strong>{request.username}</strong></div>
        <div><span>Liên hệ</span><strong>{request.email}<br />{request.phone}</strong></div>
      </div>

      <div className="borrow-review-copy-heading">
        <h3>Danh sách bản sao</h3>
        <span>{request.details.length} bản sao</span>
      </div>
      <div className="borrow-review-copy-list">
        {request.details.map((detail) => (
          <article className="borrow-review-copy" key={detail.copyId}>
            <div>
              <strong>{detail.book}</strong>
              <span>{detail.author}</span>
            </div>
            <div>
              <span>Bản sao #{detail.copyId} · {detail.barcode}</span>
              <span><MapPin size={13} /> {detail.location}</span>
            </div>
            <Badge status={detail.status}>{getStatusLabel(detail.status)}</Badge>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function BorrowRequestsAdminPage() {
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, showToast, clearToast] = useToast();

  async function loadRequests({ announce = false, status = statusFilter } = {}) {
    setLoading(true);
    setNotice(null);
    try {
      const params = status === 'ALL' ? {} : { status };
      const data = await borrowingApi.listAll(params);
      const mapped = mapBorrowRequestsToAdminRows(data.borrowRequests || [])
        .sort((left, right) => Number(left.requestId) - Number(right.requestId));
      setRequests(mapped);
      setSelectedId((currentId) => mapped.some((row) => row.id === currentId) ? currentId : (mapped[0]?.id || null));
      setLastUpdated(new Date());
      if (announce) showToast('Đã tải lại danh sách yêu cầu mượn.', 'success');
      return true;
    } catch (error) {
      setRequests([]);
      setSelectedId(null);
      setNotice(error.message);
      if (announce) showToast(error.message, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadRequests({ status: statusFilter }); }, 0);
    return () => window.clearTimeout(timer);
    // loadRequests intentionally uses the current filter and API client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const normalizedQuery = normalizeSearchValue(searchQuery.trim());
  const filteredRequests = normalizedQuery
    ? requests.filter((row) => [
      row.id,
      row.member,
      row.username,
      row.email,
      row.book,
      ...row.details.flatMap((detail) => [detail.book, detail.author, detail.barcode]),
    ].some((value) => normalizeSearchValue(value).includes(normalizedQuery)))
    : requests;
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRequests = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = filteredRequests.find((row) => row.id === selectedId) || pagedRequests[0] || null;

  function changePage(nextPage) {
    const normalizedPage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(normalizedPage);
    setSelectedId(filteredRequests[(normalizedPage - 1) * PAGE_SIZE]?.id || null);
  }

  function handleSearch(event) {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  }

  function clearSearch() {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  }

  async function handleApprove() {
    if (!approveTarget || actionPending) return;
    const requestId = Number(approveTarget.requestId);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      showToast('Mã yêu cầu mượn không hợp lệ. Vui lòng tải lại danh sách.', 'error');
      return;
    }
    setActionPending(true);
    try {
      await borrowingApi.approve(requestId);
      setApproveTarget(null);
      await loadRequests();
      showToast(`Đã duyệt yêu cầu ${approveTarget.id}.`, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setActionPending(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim() || actionPending) return;
    const requestId = Number(rejectTarget.requestId);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      showToast('Mã yêu cầu mượn không hợp lệ. Vui lòng tải lại danh sách.', 'error');
      return;
    }
    setActionPending(true);
    try {
      const rejectedId = rejectTarget.id;
      await borrowingApi.reject(requestId, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason('');
      await loadRequests();
      showToast(`Đã từ chối yêu cầu ${rejectedId}.`, 'info');
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
      subtitle="Kiểm tra, duyệt hoặc từ chối yêu cầu mượn theo dữ liệu hiện tại của hệ thống."
      actions={<button className="btn btn-outline" onClick={() => loadRequests({ announce: true })} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> {loading ? 'Đang tải...' : 'Tải lại'}</button>}
    >
      {notice && <DataNotice type="error" title="Không thể tải yêu cầu mượn">{notice}</DataNotice>}

      <section className="borrow-request-toolbar" aria-label="Bộ lọc yêu cầu mượn">
        <div className="borrow-request-summary">
          <span className="borrow-request-count"><strong>{filteredRequests.length}</strong><span>yêu cầu</span></span>
          <span className="borrow-request-update">
            {normalizedQuery && <span>Trong {requests.length} bản ghi • </span>}
            {lastUpdated ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}` : 'Đang cập nhật dữ liệu'}
          </span>
        </div>
        <div className="borrow-request-filters">
          <form className="borrow-request-search" role="search" onSubmit={handleSearch}>
            <div className="borrow-request-search-field">
              <label className="sr-only" htmlFor="borrow-request-search-input">Tìm kiếm yêu cầu mượn</label>
              <Search size={17} />
              <input
                id="borrow-request-search-input"
                className="input"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm mã yêu cầu, hội viên, sách, barcode..."
              />
              {searchInput && <button type="button" className="icon-btn" aria-label="Xóa từ khóa tìm kiếm" onClick={clearSearch}><X size={16} /></button>}
            </div>
            <button type="submit" className="btn btn-primary"><Search size={16} /> Tìm kiếm</button>
          </form>
          <label className="borrow-status-filter">
            <span className="sr-only">Trạng thái</span>
            <select className="select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} disabled={loading}>
              {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <div className="split borrow-request-split">
        <div className="borrow-request-list">
          <DataTable
            caption="Danh sách yêu cầu mượn"
            headers={['Yêu cầu', 'Thành viên', 'Sách', 'Ngày gửi', 'Trạng thái', 'Thao tác']}
            loading={loading}
            isEmpty={filteredRequests.length === 0}
            emptyState={<EmptyState icon={ClipboardList} title="Không có yêu cầu phù hợp" />}
          >
            {pagedRequests.map((row) => (
              <tr
                key={row.id}
                tabIndex={0}
                aria-label={`Chọn yêu cầu mượn ${row.id}`}
                aria-selected={row.id === selected?.id}
                className={row.id === selected?.id ? 'is-selected' : ''}
                onClick={() => setSelectedId(row.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedId(row.id);
                  }
                }}
              >
                <td data-label="Yêu cầu"><strong>{row.id}</strong></td>
                <td data-label="Thành viên">{row.member}</td>
                <td data-label="Sách">{row.book}</td>
                <td data-label="Ngày gửi">{fmtDate(row.requestDate)}</td>
                <td data-label="Trạng thái"><RequestStatus row={row} /></td>
                <td data-label="Thao tác">
                  <div className="table-actions" onClick={(event) => event.stopPropagation()}>
                    {row.rawStatus === 'PENDING' ? (
                      <>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => { setSelectedId(row.id); setApproveTarget(row); }}><ThumbsUp size={14} /> Duyệt</button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => { setSelectedId(row.id); setRejectReason(''); setRejectTarget(row); }}><ThumbsDown size={14} /> Từ chối</button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedId(row.id)}><Eye size={14} /> Chi tiết</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
          {!loading && filteredRequests.length > 0 && (
            <nav className="pagination borrow-request-pagination" aria-label="Phân trang yêu cầu mượn">
              <span className="muted">
                Trang {currentPage}/{totalPages} • {filteredRequests.length} yêu cầu
              </span>
              <div className="page-controls">
                <button type="button" className="page-btn" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>Trước</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    type="button"
                    className={`page-btn ${pageNumber === currentPage ? 'active' : ''}`}
                    key={pageNumber}
                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                    onClick={() => changePage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button type="button" className="page-btn" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>Sau</button>
              </div>
            </nav>
          )}
        </div>

        <aside className="panel borrow-request-detail" aria-label="Chi tiết yêu cầu mượn">
          {selected ? (
            <>
              <div className="panel-header">
                <div className="app-avatar">{String(selected.member).slice(0, 1)}</div>
                <div className="stack-sm">
                  <strong>{selected.member}</strong>
                  <span className="muted">{selected.id} • {fmtDate(selected.requestDate)}</span>
                </div>
                <span className="borrow-detail-status"><RequestStatus row={selected} /></span>
              </div>

              <div className="info-list borrow-member-info">
                <div className="info-row"><Hash size={16} /><span className="muted">Mã hội viên:</span> <strong>{selected.memberId}</strong></div>
                <div className="info-row"><UserRound size={16} /><span>{selected.username}</span></div>
                <div className="info-row"><Mail size={16} /><span>{selected.email}</span></div>
                <div className="info-row"><Phone size={16} /><span>{selected.phone}</span></div>
              </div>

              <h4 className="section-title">Sách trong yêu cầu</h4>
              <div className="request-copy-list">
                {selected.details.map((detail) => (
                  <article className="request-copy" key={detail.copyId}>
                    <span className="book-spine" />
                    <div className="stack-sm">
                      <strong>{detail.book}</strong>
                      <span className="muted">{detail.author}</span>
                      <span className="muted">Bản sao #{detail.copyId} • {detail.barcode}</span>
                      <span className="muted"><MapPin size={13} /> {detail.location}</span>
                    </div>
                    <Badge status={detail.status}>{getStatusLabel(detail.status)}</Badge>
                  </article>
                ))}
              </div>

              {selected.rawStatus === 'PENDING' && (
                <div className="borrow-request-actions">
                  <button className="btn btn-danger" onClick={() => { setRejectReason(''); setRejectTarget(selected); }}><ThumbsDown size={16} /> Từ chối</button>
                  <button className="btn btn-primary" onClick={() => setApproveTarget(selected)}><ThumbsUp size={16} /> Duyệt yêu cầu</button>
                </div>
              )}
            </>
          ) : <EmptyState icon={ClipboardList} title="Chọn một yêu cầu để xem chi tiết" />}
        </aside>
      </div>

      {approveTarget && (
        <ConfirmAction
          eyebrow="Duyệt yêu cầu mượn"
          title={`Duyệt yêu cầu ${approveTarget.id}`}
          confirmLabel="Duyệt và cấp sách"
          width={760}
          pending={actionPending}
          onCancel={() => setApproveTarget(null)}
          onConfirm={handleApprove}
        >
          <RequestReviewSummary request={approveTarget} />
        </ConfirmAction>
      )}

      {rejectTarget && (
        <ConfirmAction
          eyebrow="Từ chối yêu cầu"
          title={`Từ chối ${rejectTarget.id}`}
          tone="danger"
          confirmLabel="Xác nhận từ chối"
          width={760}
          pending={actionPending}
          confirmDisabled={!rejectReason.trim()}
          onCancel={() => { setRejectTarget(null); setRejectReason(''); }}
          onConfirm={handleReject}
        >
          <RequestReviewSummary request={rejectTarget} />
          <div className="field">
            <label htmlFor="borrow-request-reject-reason">Lý do từ chối</label>
            <textarea
              id="borrow-request-reject-reason"
              className="textarea"
              maxLength={500}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              aria-describedby="borrow-request-reject-help"
              placeholder="Nhập lý do từ chối yêu cầu..."
            />
            <span id="borrow-request-reject-help" className="muted">Bắt buộc, từ 1 đến 500 ký tự · {rejectReason.length}/500</span>
          </div>
        </ConfirmAction>
      )}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
