import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ClipboardList, RefreshCw, UserCheck } from 'lucide-react';

import { membershipApi } from '../api/libraryFeatureApi';
import AppLayout from '../component/layout/AppLayout';
import MembershipApplicationForm from '../component/membership/MembershipApplicationForm';
import MembershipApplicationsTable from '../component/membership/MembershipApplicationsTable';
import MembershipFilter from '../component/membership/MembershipFilter';
import MembershipReviewModal from '../component/membership/MembershipReviewModal';
import MyMembershipStatus from '../component/membership/MyMembershipStatus';
import { LoadingBlock, Toast, useToast } from '../component/shared/Feedback';

const DEMO_STATUS = { status: 'NONE', appliedAt: null, approvedAt: null };
const DEMO_APPLICATIONS = [
  { applicationId: 1001, fullName: 'Nguyen Van An', email: 'an.nguyen@example.com', status: 'PENDING', appliedAt: '2026-06-12T09:00:00Z' },
  { applicationId: 1002, fullName: 'Tran Thi Binh', email: 'binh.tran@example.com', status: 'APPROVED', appliedAt: '2026-06-10T08:30:00Z', approvedAt: '2026-06-11T10:15:00Z' },
  { applicationId: 1003, fullName: 'Le Hoang Cuong', email: 'cuong.le@example.com', status: 'REJECTED', appliedAt: '2026-06-09T14:20:00Z', rejectionReason: 'Thieu thong tin xac minh.' },
];

function getStoredUser() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeList(response) {
  if (Array.isArray(response)) return { items: response, totalPages: 1 };
  return {
    items: response?.items || response?.applications || response?.data || [],
    totalPages: response?.totalPages || response?.pagination?.totalPages || 1,
  };
}

export default function MembershipPage() {
  const authUser = getStoredUser();
  const roles = Array.isArray(authUser?.roles) ? authUser.roles.map((role) => String(role).toUpperCase()) : null;
  const canReview = roles?.some((role) => ['ADMIN', 'LIBRARIAN'].includes(role));
  const [myStatus, setMyStatus] = useState(DEMO_STATUS);
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, showToast, clearToast] = useToast();

  async function loadData() {
    setLoading(true);
    try {
      const status = await membershipApi.getMyStatus();
      setMyStatus(status || DEMO_STATUS);

      if (canReview) {
        const list = normalizeList(await membershipApi.listApplications({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          limit: 10,
        }));
        setApplications(list.items);
        setTotalPages(list.totalPages);
      }

    } catch {
      setMyStatus(DEMO_STATUS);
      setApplications(canReview ? DEMO_APPLICATIONS : []);
      setTotalPages(1);
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
      setMyStatus(result || { status: 'PENDING', appliedAt: new Date().toISOString() });
      showToast('Da nop don membership.', 'success');
      await loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function approveSelected() {
    setSaving(true);
    try {
      await membershipApi.approve(selected.applicationId || selected.id);
      showToast('Da duyet don membership.', 'success');
      setSelected(null);
      await loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function rejectSelected(reason) {
    if (!reason.trim()) {
      showToast('Ly do tu choi la bat buoc.', 'error');
      return;
    }

    setSaving(true);
    try {
      await membershipApi.reject(selected.applicationId || selected.id, reason.trim());
      showToast('Da tu choi don membership.', 'success');
      setSelected(null);
      await loadData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const filteredApplications = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return applications;
    return applications.filter((item) => `${item.applicationId || item.id || ''} ${item.fullName || item.name || item.userName || ''} ${item.email || ''}`.toLowerCase().includes(keyword));
  }, [applications, search]);

  if (!roles) return <Navigate to="/login" replace />;

  return (
    <AppLayout
      active={canReview ? 'membership-review' : 'membership'}
      title="Membership"
      subtitle="Dang ky, xem trang thai va duyet membership theo FE04."
      actions={<span className="stat-chip"><UserCheck size={16} /> FE04</span>}
    >
      <Toast toast={toast} onClose={clearToast} />

      {loading ? <LoadingBlock rows={4} /> : (
        <>
          <div className="split">
            <MyMembershipStatus status={myStatus} />
            <MembershipApplicationForm
              applicant={authUser}
              disabled={!['NONE', 'REJECTED'].includes(String(myStatus.status || 'NONE').toUpperCase())}
              saving={saving}
              onSubmit={applyForMembership}
            />
          </div>

          {canReview && (
            <section className="lib-card" style={{ marginTop: 18 }}>
              <div className="panel-header">
                <span className="kpi-icon"><ClipboardList size={18} /></span>
                <div>
                  <h2 className="lib-card-title" style={{ margin: 0 }}>Duyet don membership</h2>
                  <p className="ph-sub">Chi don PENDING moi duoc approve/reject.</p>
                </div>
                <button type="button" className="btn btn-outline" style={{ marginLeft: 'auto' }} onClick={loadData} disabled={loading}>
                  <RefreshCw size={16} /> Tai lai
                </button>
              </div>

              <MembershipFilter
                status={statusFilter}
                search={search}
                loading={loading}
                onStatusChange={(value) => { setStatusFilter(value); setPage(1); }}
                onSearchChange={setSearch}
                onReload={loadData}
              />
              <MembershipApplicationsTable applications={filteredApplications} page={page} totalPages={totalPages} onPageChange={setPage} onReview={setSelected} />
            </section>
          )}
        </>
      )}

      <MembershipReviewModal
        application={selected}
        saving={saving}
        onApprove={approveSelected}
        onReject={rejectSelected}
        onClose={() => setSelected(null)}
      />
    </AppLayout>
  );
}
