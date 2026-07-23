import { Eye, FileDown, FilterX, RefreshCw, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { adminApi } from '../../../api/adminApi';
import { borrowingApi } from '../../../api/libraryFeatureApi';
import { downloadDocx } from '../../../utils/adminDocxExport';
import {
  buildRequestDocumentRows,
  buildRequestListParams,
  collectAllRequestRows,
  REQUEST_DOCX_COLUMNS,
} from '../../../utils/adminRequestExport';
import { createLatestRequestGuard } from '../../../utils/latestRequestGuard';
import { AdminActionButton } from '../components/AdminActionButton';
import { AdminDateField } from '../components/AdminDateField';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminFilterBar } from '../components/AdminFilterBar';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPagination } from '../components/AdminPagination';

const REQUEST_TABLE_PAGE_SIZE = 20;
const EMPTY_REQUEST_FILTERS = Object.freeze({ q: '', status: 'ALL', from: '', to: '' });
const REQUEST_STATUS_LABELS = Object.freeze({
  ALL: 'Tất cả',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
});

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RequestStatusBadge({ status }) {
  return (
    <span className={`admin-badge admin-badge--request-${String(status || '').toLowerCase()}`}>
      {REQUEST_STATUS_LABELS[status] || status}
    </span>
  );
}

function RequestDetailModal({ request, rejectionReason, saving, onReasonChange, onClose, onApprove, onReject }) {
  // @spec FR-FE11-035
  const pending = request.status === 'PENDING';
  return (
    <div className="admin-modal-backdrop" onMouseDown={() => { if (!saving) onClose(); }}>
      <div className="admin-modal admin-modal--compact" role="dialog" aria-modal="true" aria-labelledby="admin-request-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal__header">
          <div><p>Chi tiết yêu cầu</p><h2 id="admin-request-detail-title">Yêu cầu #{request.requestId}</h2></div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button>
        </header>
        <div className="admin-modal__body admin-modal__body--single admin-request-detail">
          <p><strong>Tài khoản</strong><span>{request.member?.fullName || '-'} · {request.member?.email || '-'}</span></p>
          <p><strong>Số điện thoại</strong><span>{request.member?.phoneNumber || '-'}</span></p>
          <p><strong>Sách</strong><span>{request.items?.map((item) => item.title).filter(Boolean).join(' | ') || '-'}</span></p>
          <p><strong>Mã bản sao</strong><span>{request.items?.map((item) => item.barcode).filter(Boolean).join(' | ') || '-'}</span></p>
          <p><strong>Thời gian đặt</strong><span>{formatDate(request.requestDate)}</span></p>
          <p><strong>Trạng thái</strong><RequestStatusBadge status={request.status} /></p>
          {pending ? (
            <label className="admin-field">
              <span>Lý do từ chối</span>
              <textarea maxLength={500} value={rejectionReason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Bắt buộc khi từ chối yêu cầu" />
            </label>
          ) : (
            <p className="admin-form-note">Yêu cầu đã ở trạng thái kết thúc và chỉ có thể xem.</p>
          )}
        </div>
        {pending ? (
          <footer className="admin-modal__actions">
            <button type="button" disabled={saving} onClick={onReject}>Từ chối</button>
            <button className="admin-modal__primary" type="button" disabled={saving} onClick={onApprove}>
              {saving ? 'Đang xử lý...' : 'Duyệt yêu cầu'}
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export function AdminRequestsSection({ onToast }) {
  const requestGuard = useRef(createLatestRequestGuard());
  const [requests, setRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState({ ...EMPTY_REQUEST_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_REQUEST_FILTERS });
  const [requestPage, setRequestPage] = useState(1);
  const [requestPagination, setRequestPagination] = useState({ page: 1, limit: REQUEST_TABLE_PAGE_SIZE, total: 0, totalPages: 0 });
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [requestsUpdatedAt, setRequestsUpdatedAt] = useState(null);
  const [viewRequest, setViewRequest] = useState(null);
  const [requestDetailLoading, setRequestDetailLoading] = useState(false);
  const [requestRejectionReason, setRequestRejectionReason] = useState('');
  const [requestActionSaving, setRequestActionSaving] = useState(false);
  const [requestExporting, setRequestExporting] = useState(false);

  const notify = useCallback((type, message) => onToast?.({ type, message }), [onToast]);

  const loadRequests = useCallback(async ({
    announce = false,
    filters = appliedFilters,
    page = requestPage,
  } = {}) => {
    if (filters.from && filters.to && filters.from > filters.to) {
      notify('error', 'Ngày bắt đầu không được sau ngày kết thúc.');
      return;
    }

    const token = requestGuard.current.begin();
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const result = await adminApi.requests(
        buildRequestListParams(filters, page, REQUEST_TABLE_PAGE_SIZE),
      );
      if (!requestGuard.current.isLatest(token)) return;
      setRequests(result.data || []);
      setRequestPagination(result.pagination || { page, limit: REQUEST_TABLE_PAGE_SIZE, total: 0, totalPages: 0 });
      setRequestsUpdatedAt(new Date());
      if (announce) notify('success', 'Đã làm mới danh sách yêu cầu.');
    } catch (error) {
      if (!requestGuard.current.isLatest(token)) return;
      setRequests([]);
      setRequestPagination({ page, limit: REQUEST_TABLE_PAGE_SIZE, total: 0, totalPages: 0 });
      setRequestsError(error.message);
      notify('error', error.message);
    } finally {
      if (requestGuard.current.isLatest(token)) setRequestsLoading(false);
    }
  }, [appliedFilters, notify, requestPage]);

  useEffect(() => {
    const timer = window.setTimeout(loadRequests, 0);
    return () => window.clearTimeout(timer);
  }, [loadRequests]);

  function applyRequestFilters() {
    if (requestFilter.from && requestFilter.to && requestFilter.from > requestFilter.to) {
      notify('error', 'Ngày bắt đầu không được sau ngày kết thúc.');
      return;
    }
    setRequestPage(1);
    setAppliedFilters({ ...requestFilter });
  }

  function resetRequestFilters() {
    setRequestFilter({ ...EMPTY_REQUEST_FILTERS });
    setRequestPage(1);
    setAppliedFilters({ ...EMPTY_REQUEST_FILTERS });
  }

  async function openRequestDetail(row) {
    setRequestDetailLoading(true);
    setRequestRejectionReason('');
    try {
      setViewRequest(await adminApi.requestDetail(row.requestId));
    } catch (error) {
      notify('error', error.message);
    } finally {
      setRequestDetailLoading(false);
    }
  }

  async function exportRequests() {
    if (requestExporting) return;
    setRequestExporting(true);
    try {
      const filters = buildRequestListParams(appliedFilters, 1, 100);
      delete filters.page;
      delete filters.limit;
      const rows = await collectAllRequestRows(adminApi.requests, filters);
      if (rows.length === 0) {
        notify('error', 'Không có yêu cầu phù hợp để xuất.');
        return;
      }
      await downloadDocx('requests.docx', 'Danh sách yêu cầu', buildRequestDocumentRows(rows), REQUEST_DOCX_COLUMNS);
      notify('success', 'Đã xuất toàn bộ yêu cầu phù hợp thành file DOCX.');
    } catch (error) {
      notify('error', error.message);
    } finally {
      setRequestExporting(false);
    }
  }

  async function approveBorrowRequest() {
    if (!viewRequest || requestActionSaving) return;
    setRequestActionSaving(true);
    try {
      await borrowingApi.approve(viewRequest.requestId);
      await loadRequests();
      setViewRequest(await adminApi.requestDetail(viewRequest.requestId));
      notify('success', 'Đã duyệt yêu cầu mượn.');
    } catch (error) {
      notify('error', error.message);
    } finally {
      setRequestActionSaving(false);
    }
  }

  async function rejectBorrowRequest() {
    if (!viewRequest || requestActionSaving) return;
    const reason = requestRejectionReason.trim();
    if (!reason) {
      notify('error', 'Vui lòng nhập lý do từ chối.');
      return;
    }
    setRequestActionSaving(true);
    try {
      await borrowingApi.reject(viewRequest.requestId, reason);
      setRequestRejectionReason('');
      await loadRequests();
      setViewRequest(await adminApi.requestDetail(viewRequest.requestId));
      notify('success', 'Đã từ chối yêu cầu mượn.');
    } catch (error) {
      notify('error', error.message);
    } finally {
      setRequestActionSaving(false);
    }
  }

  const hasFilters = Object.entries(EMPTY_REQUEST_FILTERS).some(([key, value]) => requestFilter[key] !== value);

  return (
    <section className="admin-requests">
      <AdminPageHeader
        eyebrow="FE11 đọc · FE07 xử lý"
        title="Quản lý yêu cầu"
        refreshing={requestsLoading}
        onRefresh={() => loadRequests({ announce: true })}
      />

      <div className="admin-section-status" aria-live="polite">
        <span>{requestsUpdatedAt ? `Cập nhật lần cuối lúc ${requestsUpdatedAt.toLocaleTimeString('vi-VN')}` : 'Chưa tải danh sách yêu cầu.'}</span>
        {requestsError ? <strong className="admin-text-error">{requestsError}</strong> : null}
      </div>

      <AdminFilterBar
        actions={(
          <>
            <AdminActionButton icon={Search} label="Áp dụng" tone="primary" disabled={requestsLoading} onClick={applyRequestFilters} />
            {hasFilters ? <AdminActionButton icon={FilterX} label="Xóa lọc" onClick={resetRequestFilters} /> : null}
            <AdminActionButton icon={FileDown} label={requestExporting ? 'Đang xuất...' : 'Xuất DOCX'} disabled={requestsLoading || requestExporting} onClick={exportRequests} />
          </>
        )}
      >
        <label className="admin-field admin-field--search">
          <span>Tìm yêu cầu</span>
          <input value={requestFilter.q} placeholder="Tên sách, tên hoặc email thành viên" onChange={(event) => setRequestFilter((current) => ({ ...current, q: event.target.value }))} />
        </label>
        <label className="admin-field">
          <span>Trạng thái</span>
          <select aria-label="Lọc trạng thái" value={requestFilter.status} onChange={(event) => setRequestFilter((current) => ({ ...current, status: event.target.value }))}>
            {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <AdminDateField id="request-from" label="Từ ngày" value={requestFilter.from} onChange={(event) => setRequestFilter((current) => ({ ...current, from: event.target.value }))} max={requestFilter.to || undefined} />
        <AdminDateField id="request-to" label="Đến ngày" value={requestFilter.to} onChange={(event) => setRequestFilter((current) => ({ ...current, to: event.target.value }))} min={requestFilter.from || undefined} />
      </AdminFilterBar>

      <section className="admin-request-directory">
        <div className="admin-table-scroll">
          <table className="admin-data-table" aria-label="Danh sách yêu cầu mượn">
            <thead><tr><th>STT</th><th>Tên sách</th><th>Tài khoản</th><th>Số điện thoại</th><th>Thể loại</th><th>Thời gian đặt</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>{requests.map((row, index) => (
              <tr key={row.requestId}>
                <td>{(requestPage - 1) * (requestPagination.limit || REQUEST_TABLE_PAGE_SIZE) + index + 1}</td>
                <td><strong>{row.bookTitles?.join(' | ') || '-'}</strong></td>
                <td>{row.member?.fullName || row.member?.email || '-'}</td>
                <td>{row.member?.phoneNumber || '-'}</td>
                <td>{row.categories?.join(' | ') || '-'}</td>
                <td>{formatDate(row.requestDate)}</td>
                <td><RequestStatusBadge status={row.status} /></td>
                <td><AdminActionButton icon={Eye} label={row.status === 'PENDING' ? 'Xử lý' : 'Chi tiết'} tone={row.status === 'PENDING' ? 'primary' : 'neutral'} disabled={requestDetailLoading} onClick={() => openRequestDetail(row)} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {!requestsLoading && requests.length === 0 ? <AdminEmptyState icon={Search} title="Không tìm thấy yêu cầu mượn sách" description="Hãy điều chỉnh bộ lọc hoặc làm mới dữ liệu." /> : null}
        {requestsLoading && requests.length === 0 ? <AdminEmptyState icon={RefreshCw} title="Đang tải danh sách yêu cầu" description="Dữ liệu đang được đồng bộ từ hệ thống." /> : null}
        <AdminPagination page={requestPage} totalItems={requestPagination.total} pageSize={requestPagination.limit || REQUEST_TABLE_PAGE_SIZE} onPageChange={setRequestPage} />
      </section>

      {viewRequest ? (
        <RequestDetailModal
          request={viewRequest}
          rejectionReason={requestRejectionReason}
          saving={requestActionSaving}
          onReasonChange={setRequestRejectionReason}
          onClose={() => setViewRequest(null)}
          onApprove={approveBorrowRequest}
          onReject={rejectBorrowRequest}
        />
      ) : null}
    </section>
  );
}
