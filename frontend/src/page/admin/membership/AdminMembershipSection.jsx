import { Eye, FilterX, Search, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { membershipApi } from '../../../api/libraryFeatureApi';
import { createLatestRequestGuard } from '../../../utils/latestRequestGuard';
import { getStatusLabel } from '../../../utils/uiLabels';
import { AdminActionButton } from '../components/AdminActionButton';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminFilterBar } from '../components/AdminFilterBar';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPagination } from '../components/AdminPagination';
import {
  ADMIN_MEMBERSHIP_PAGE_SIZE,
  EMPTY_ADMIN_MEMBERSHIP_FILTERS,
  getMembershipDecisionFeedback,
  isPendingMembershipApplication,
  normalizeAdminMembershipList,
} from './adminMembershipPresentation';
import { AdminMembershipReviewModal } from './AdminMembershipReviewModal';

const EMPTY_PAGE = {
  page: 1,
  limit: ADMIN_MEMBERSHIP_PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN');
}

function readErrorCode(error) {
  return error?.cause?.response?.data?.code || error?.code || '';
}

export function AdminMembershipSection({ onToast }) {
  // @spec FR-FE04-014
  const requestGuard = useRef(createLatestRequestGuard());
  const lastTrigger = useRef(null);
  const [draftFilters, setDraftFilters] = useState(EMPTY_ADMIN_MEMBERSHIP_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_ADMIN_MEMBERSHIP_FILTERS);
  const [membershipPage, setMembershipPage] = useState(1);
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGE);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const notify = useCallback((type, message) => onToast?.({ type, message }), [onToast]);

  const loadApplications = useCallback(async ({ announce = false } = {}) => {
    const token = requestGuard.current.begin();
    setLoading(true);
    setError('');
    try {
      const response = await membershipApi.listApplications({
        q: appliedFilters.q || undefined,
        status: appliedFilters.status === 'ALL' ? undefined : appliedFilters.status,
        page: membershipPage,
        limit: ADMIN_MEMBERSHIP_PAGE_SIZE,
      });
      if (!requestGuard.current.isLatest(token)) return;
      const normalized = normalizeAdminMembershipList(response, {
        page: membershipPage,
        limit: ADMIN_MEMBERSHIP_PAGE_SIZE,
      });
      setApplications(normalized.applications);
      setPagination(normalized.pagination);
      if (announce) notify('success', 'Danh sách đơn hội viên đã được làm mới.');
    } catch (loadError) {
      if (!requestGuard.current.isLatest(token)) return;
      setApplications([]);
      setPagination({ ...EMPTY_PAGE, page: membershipPage });
      setError(loadError.message);
      notify('error', loadError.message);
    } finally {
      if (requestGuard.current.isLatest(token)) setLoading(false);
    }
  }, [appliedFilters.q, appliedFilters.status, membershipPage, notify]);

  useEffect(() => {
    const timer = window.setTimeout(loadApplications, 0);
    return () => window.clearTimeout(timer);
  }, [loadApplications]);

  function applyFilters(event) {
    event?.preventDefault();
    setMembershipPage(1);
    setAppliedFilters({
      q: draftFilters.q.trim(),
      status: draftFilters.status,
    });
  }

  function resetFilters() {
    setDraftFilters(EMPTY_ADMIN_MEMBERSHIP_FILTERS);
    setAppliedFilters(EMPTY_ADMIN_MEMBERSHIP_FILTERS);
    setMembershipPage(1);
  }

  function openReview(application, trigger) {
    lastTrigger.current = trigger;
    setSelected(application);
  }

  function closeReview() {
    setSelected(null);
    window.setTimeout(() => lastTrigger.current?.focus(), 0);
  }

  async function decide(action, reason) {
    if (!selected || saving || !isPendingMembershipApplication(selected)) return;
    setSaving(true);
    try {
      const result = action === 'approve'
        ? await membershipApi.approve(selected.applicationId)
        : await membershipApi.reject(selected.applicationId, reason);
      const feedback = getMembershipDecisionFeedback(action, result?.notificationStatus);
      notify(feedback.type, feedback.message);
      closeReview();
    } catch (decisionError) {
      const conflict = readErrorCode(decisionError) === 'MEMBERSHIP_APPLICATION_NOT_PENDING';
      notify(
        'error',
        conflict
          ? 'Đơn đã được xử lý bởi người khác. Danh sách đã được cập nhật.'
          : decisionError.message,
      );
      if (conflict) closeReview();
    } finally {
      await loadApplications();
      setSaving(false);
    }
  }

  const hasFilters = Boolean(appliedFilters.q) || appliedFilters.status !== 'PENDING';

  return (
    <section className="admin-membership">
      <AdminPageHeader
        eyebrow="FE04 · Hội viên"
        title="Duyệt hội viên"
        refreshing={loading}
        onRefresh={() => loadApplications({ announce: true })}
      />

      <form onSubmit={applyFilters}>
        <AdminFilterBar
          actions={(
            <>
              <AdminActionButton icon={Search} label="Tìm kiếm" tone="primary" disabled={loading} onClick={applyFilters} />
              {hasFilters ? <AdminActionButton icon={FilterX} label="Xóa lọc" onClick={resetFilters} /> : null}
            </>
          )}
        >
          <label className="admin-field admin-field--search">
            <span>Tìm đơn hội viên</span>
            <input
              value={draftFilters.q}
              maxLength={100}
              placeholder="Mã đơn, họ tên, username hoặc email"
              onChange={(event) => setDraftFilters((current) => ({ ...current, q: event.target.value }))}
            />
          </label>
          <label className="admin-field">
            <span>Trạng thái</span>
            <select
              value={draftFilters.status}
              onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="PENDING">Đang chờ</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="ALL">Tất cả</option>
            </select>
          </label>
        </AdminFilterBar>
      </form>

      {error && applications.length === 0 ? (
        <AdminEmptyState
          icon={UserCheck}
          title="Không thể tải đơn hội viên"
          description={error}
          action={<AdminActionButton label="Thử lại" tone="primary" onClick={() => loadApplications()} />}
        />
      ) : null}

      {!error ? (
        <section className="admin-membership-directory">
          <div className="admin-table-scroll admin-membership-table">
            <table className="admin-data-table">
              <thead>
                <tr><th>Mã đơn</th><th>Người nộp</th><th>Liên hệ</th><th>Ngày nộp</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.applicationId}>
                    <td>#{application.applicationId}</td>
                    <td><strong>{application.applicant.fullName || '-'}</strong><small>{application.applicant.username || ''}</small></td>
                    <td>{application.applicant.email || application.applicant.phone || '-'}</td>
                    <td>{formatDate(application.appliedAt)}</td>
                    <td><span className={`admin-badge admin-badge--status-${application.status.toLowerCase()}`}>{getStatusLabel(application.status)}</span></td>
                    <td>
                      <AdminActionButton
                        icon={Eye}
                        label={isPendingMembershipApplication(application) ? 'Xét duyệt' : 'Chi tiết'}
                        tone={isPendingMembershipApplication(application) ? 'primary' : 'neutral'}
                        disabled={saving}
                        onClick={(event) => openReview(application, event.currentTarget)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-membership-cards">
            {applications.map((application) => (
              <article key={application.applicationId}>
                <header><strong>Đơn #{application.applicationId}</strong><span>{getStatusLabel(application.status)}</span></header>
                <h2>{application.applicant.fullName || 'Chưa cập nhật tên'}</h2>
                <p>{application.applicant.email || '-'}</p>
                <p>Nộp ngày {formatDate(application.appliedAt)}</p>
                <AdminActionButton
                  icon={Eye}
                  label={isPendingMembershipApplication(application) ? 'Xét duyệt' : 'Chi tiết'}
                  tone={isPendingMembershipApplication(application) ? 'primary' : 'neutral'}
                  disabled={saving}
                  onClick={(event) => openReview(application, event.currentTarget)}
                />
              </article>
            ))}
          </div>

          {!loading && applications.length === 0 ? (
            <AdminEmptyState icon={UserCheck} title="Không có đơn hội viên phù hợp" description="Hãy điều chỉnh bộ lọc hoặc làm mới dữ liệu." />
          ) : null}
          {loading && applications.length === 0 ? (
            <AdminEmptyState icon={UserCheck} title="Đang tải đơn hội viên" description="Dữ liệu đang được đồng bộ." />
          ) : null}
          <AdminPagination
            page={pagination.page}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={setMembershipPage}
          />
        </section>
      ) : null}

      <AdminMembershipReviewModal
        key={selected?.applicationId || 'closed'}
        application={selected}
        saving={saving}
        onApprove={() => decide('approve')}
        onReject={(reason) => decide('reject', reason)}
        onClose={closeReview}
      />
    </section>
  );
}
