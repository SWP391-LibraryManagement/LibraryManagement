import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart2,
  BookMarked,
  Bookmark,
  BookOpen,
  ClipboardList,
  History,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { borrowingApi, reservationApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { buildMemberSummary, buildStaffSummary } from './dashboardViewModel';

const MEMBER_ACTIONS = [
  { label: 'Tạo yêu cầu mượn', path: '/borrowing/new', icon: BookOpen },
  { label: 'Xem lịch sử mượn', path: '/borrowing/history', icon: History },
  { label: 'Quản lý đặt chỗ', path: '/reservations/mine', icon: Bookmark },
];

const STAFF_ACTIONS = [
  { label: 'Duyệt yêu cầu mượn', path: '/librarian/borrow-requests', icon: ClipboardList },
  { label: 'Xử lý trả sách', path: '/librarian/returns', icon: PackageCheck },
  { label: 'Xem báo cáo mượn', path: '/reports/borrowing', icon: BarChart2 },
];

export default function RoleDashboardPage({ audience }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setNotice(null);

      const request = audience === 'member'
        ? Promise.all([borrowingApi.listMine(), reservationApi.listMine()])
        : Promise.all([borrowingApi.listAll({ status: 'PENDING' }), reservationApi.listAll()]);

      request
        .then(([borrowing, reservations]) => {
          if (!active) return;
          setSummary(audience === 'member'
            ? buildMemberSummary(borrowing || {}, reservations || {})
            : buildStaffSummary(borrowing || {}, reservations || {}));
        })
        .catch((error) => {
          if (!active) return;
          setSummary(null);
          setNotice(error.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [audience, reloadKey]);

  const isMember = audience === 'member';
  const title = isMember ? 'Tổng quan của bạn' : 'Tổng quan vận hành';

  function reloadDashboard() {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }

  return (
    <AppLayout
      title={title}
      subtitle={isMember ? 'Theo dõi hoạt động mượn và đặt chỗ của bạn.' : 'Theo dõi các hàng đợi vận hành của thư viện.'}
      actions={(
        <button type="button" className="btn btn-outline" onClick={reloadDashboard} disabled={loading}>
          <RefreshCw size={16} /> Tải lại
        </button>
      )}
    >
      {notice && <DataNotice type="error" title="Không thể tải tổng quan">{notice}</DataNotice>}
      {notice && !loading && (
        <div className="dashboard-retry">
          <button type="button" className="btn btn-outline" onClick={reloadDashboard}>
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      )}
      {loading ? <LoadingBlock rows={3} /> : <DashboardContent audience={audience} summary={summary} onNavigate={navigate} />}
    </AppLayout>
  );
}

function DashboardContent({ audience, summary, onNavigate }) {
  if (!summary) {
    return <EmptyState icon={BookMarked} title="Chưa có dữ liệu tổng quan" />;
  }

  const isMember = audience === 'member';
  const cards = isMember
    ? [
      { label: 'Sách đang mượn', value: summary.activeBorrows, icon: BookOpen },
      { label: 'Đặt chỗ đang hoạt động', value: summary.activeReservations, icon: Bookmark },
      { label: 'Lịch sử đã trả', value: summary.completedBorrows, icon: History },
    ]
    : [
      { label: 'Yêu cầu chờ duyệt', value: summary.pendingBorrowRequests, icon: ClipboardList },
      { label: 'Hàng đợi đặt chỗ', value: summary.waitingReservations, icon: Bookmark },
      { label: 'Sẵn sàng giao', value: summary.readyReservations, icon: PackageCheck },
    ];
  const actions = isMember ? MEMBER_ACTIONS : STAFF_ACTIONS;

  return (
    <>
      <div className="kpi-grid" aria-label="Chỉ số tổng quan">
        {cards.map(({ label, value, icon: Icon }) => (
          <section className="kpi-card" key={label}>
            <div className="kpi-top">
              <span className="kpi-icon"><Icon size={19} /></span>
            </div>
            <strong className="kpi-value">{value}</strong>
            <span className="kpi-label">{label}</span>
          </section>
        ))}
      </div>

      <div className="dashboard-actions" aria-label="Tác vụ nhanh">
        {actions.map(({ label, path, icon: Icon }) => (
          <button type="button" className="dashboard-action" key={path} onClick={() => onNavigate(path)}>
            <span className="dashboard-action-icon"><Icon size={18} /></span>
            <span>{label}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        ))}
      </div>
    </>
  );
}
