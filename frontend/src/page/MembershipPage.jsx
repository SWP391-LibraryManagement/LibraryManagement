import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ClipboardList, RefreshCw } from 'lucide-react';

import { membershipApi } from '../api/libraryFeatureApi';
import AppLayout from '../component/layout/AppLayout';
import MembershipApplicationForm from '../component/membership/MembershipApplicationForm';
import MembershipApplicationsTable from '../component/membership/MembershipApplicationsTable';
import MembershipFilter from '../component/membership/MembershipFilter';
import MembershipReviewModal from '../component/membership/MembershipReviewModal';
import MyMembershipStatus from '../component/membership/MyMembershipStatus';
import { DataNotice, LoadingBlock, Toast, useToast } from '../component/shared/Feedback';

const EMPTY_STATUS = {
  membershipStatusView: 'NONE',
  memberStatus: null,
  currentApplication: null,
};

function getStoredUser() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeList(response) {
  if (Array.isArray(response)) return { items: response.map(normalizeApplication), totalPages: 1 };
  return {
    items: (response?.items || response?.applications || response?.data || []).map(normalizeApplication),
    totalPages: response?.totalPages || response?.pagination?.totalPages || 1,
  };
}

function normalizeApplication(application) {
  const applicant = application?.applicant || {};
  return {
    ...application,
    fullName: application.fullName || application.name || application.userName || applicant.fullName || applicant.username,
    email: application.email || applicant.email,
    phone: application.phone || applicant.phone,
  };
}

function normalizeMyStatus(response) {
  if (!response) return EMPTY_STATUS;
  return {
    membershipStatusView: String(
      response.membershipStatusView || response.memberStatus || 'NONE'
    ).toUpperCase(),
    memberStatus: response.memberStatus || null,
    currentApplication: response.currentApplication || null,
  };
}

// @spec FR-FE04-007 FR-FE04-009
export default function MembershipPage() {
  const authUser = getStoredUser();
  const roles = Array.isArray(authUser?.roles) ? authUser.roles.map((role) => String(role).toUpperCase()) : null;
  const canReview = roles?.some((role) => ['ADMIN', 'LIBRARIAN'].includes(role));
  const [myStatus, setMyStatus] = useState(null);
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [toast, showToast, clearToast] = useToast();

  async function loadData() {
    setLoading(true);
    setLoadError('');
    try {
      if (canReview) {
        const list = normalizeList(await membershipApi.listApplications({
          q: search.trim() || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          limit: 10,
        }));
        setApplications(list.items);
        setTotalPages(list.totalPages);
      } else {
        const status = await membershipApi.getMyStatus();
        setMyStatus(normalizeMyStatus(status));
      }
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadData(); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReview, page, statusFilter]);

  async function applyForMembership(formData) {
    setSaving(true);
    try {
      const result = await membershipApi.apply(formData);
      setMyStatus(normalizeMyStatus(result));
      showToast('Đã nộp đơn đăng ký hội viên.', 'success');
      await loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function approveSelected() {
    if (!selected) return;
    await approveApplication(selected);
  }

  async function approveApplication(application) {
    setSaving(true);
    try {
      await membershipApi.approve(application.applicationId || application.id);
      showToast('Đã duyệt đơn đăng ký hội viên.', 'success');
      setSelected(null);
      await loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function rejectSelected(reason) {
    const cleanReason = reason.trim();
    if (!cleanReason) {
      showToast('Lý do từ chối là bắt buộc.', 'error');
      return;
    }
    if (cleanReason.length > 500) {
      showToast('Lý do từ chối không được vượt quá 500 ký tự.', 'error');
      return;
    }

    setSaving(true);
    try {
      await membershipApi.reject(selected.applicationId || selected.id, cleanReason);
      showToast('Đã từ chối đơn đăng ký hội viên.', 'success');
      setSelected(null);
      await loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!roles) return <Navigate to="/login" replace />;

  return (
    <AppLayout
      title={canReview ? 'Duyệt đăng ký hội viên' : 'Đăng ký hội viên'}
      subtitle={canReview ? 'Xem và xử lý các đơn đăng ký đang chờ duyệt.' : 'Theo dõi trạng thái và gửi đơn để sử dụng dịch vụ mượn, gia hạn và đặt chỗ.'}
      actions={<button type="button" className="btn btn-outline" onClick={loadData} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      <Toast toast={toast} onClose={clearToast} />
      {loadError && <DataNotice type="error" title="Không thể tải dữ liệu hội viên">{loadError}</DataNotice>}

      {loading ? <LoadingBlock rows={4} /> : (
        <>
          {!canReview && myStatus && (
            <div className="split member-membership-grid">
              <MyMembershipStatus status={myStatus} />
              <MembershipApplicationForm
                applicant={authUser}
                disabled={!['NONE', 'REJECTED'].includes(myStatus.membershipStatusView)}
                saving={saving}
                onSubmit={applyForMembership}
              />
            </div>
          )}

          {canReview && (
            <section className="lib-card">
              <div className="panel-header">
                <span className="kpi-icon"><ClipboardList size={18} /></span>
                <div>
                  <h2 className="lib-card-title" style={{ margin: 0 }}>Danh sách đơn đăng ký</h2>
                  <p className="ph-sub">Chỉ đơn đang chờ mới có thể được duyệt hoặc từ chối.</p>
                </div>
              </div>

              <MembershipFilter
                status={statusFilter}
                search={search}
                loading={loading}
                onStatusChange={(value) => { setStatusFilter(value); setPage(1); }}
                onSearchChange={setSearch}
              />
              <MembershipApplicationsTable
                applications={applications}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                onApprove={approveApplication}
                onReject={setSelected}
              />
            </section>
          )}
        </>
      )}

      <MembershipReviewModal
        key={selected?.applicationId || selected?.id || 'membership-review'}
        application={selected}
        saving={saving}
        onApprove={approveSelected}
        onReject={rejectSelected}
        onClose={() => setSelected(null)}
      />
    </AppLayout>
  );
}
