import { useEffect, useState } from 'react';
import {
  AlertTriangle,
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

import { borrowingApi, reportApi, reservationApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { buildMemberSummary, buildStaffSummary } from './dashboardViewModel';

const MEMBER_ACTIONS = [
  { label: 'Tạo yêu cầu mượn', path: '/borrowing/new', icon: BookOpen },
  { label: 'Xem lịch sử mượn', path: '/borrowing/history', icon: History },
  { label: 'Quản lý đặt chỗ', path: '/reservations/mine', icon: Bookmark },
  { label: 'Đăng ký hội viên', path: '/membership', icon: ClipboardList },
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
          .then(([borrowing, reservations]) =>
            buildMemberSummary(borrowing || {}, reservations || {}))
        : reportApi.operationsSummary().then(buildStaffSummary);

      request
        .then((nextSummary) => {
          if (!active) return;
          setSummary(nextSummary);
        })
        .catch((error) => {
          if (!active) return;
          setSummary(audience === 'member' ? null : buildStaffSummary());
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
      {
        label: 'Yêu cầu chờ duyệt',
        value: summary.pendingBorrowRequests,
        icon: ClipboardList,
        path: '/librarian/borrow-requests',
      },
      {
        label: 'Sách đang mượn',
        value: summary.activeLoans,
        icon: BookMarked,
        path: '/reports/borrowing',
      },
      {
        label: 'Sách mượn quá hạn',
        value: summary.overdueLoans,
        icon: AlertTriangle,
        path: '/reports/borrowing',
      },
      {
        label: 'Đặt chỗ đang mở',
        value: summary.openReservations,
        icon: Bookmark,
        path: '/librarian/reservations',
      },
      {
        label: 'Bản sao sẵn có',
        value: summary.availableCopies,
        icon: BookOpen,
        path: '/reports/inventory',
      },
      {
        label: 'Đầu sách sắp hết',
        value: summary.lowStockBooks,
        icon: PackageCheck,
        path: '/reports/inventory',
      },
    ];
  const actions = isMember ? MEMBER_ACTIONS : STAFF_ACTIONS;

  return (
    <>
      <div className="kpi-grid" aria-label="Chỉ số tổng quan">
        {cards.map(({ label, value, icon: Icon, path }) => {
          const unavailable = value === null;
          const content = (
            <>
            <div className="kpi-top">
              <span className="kpi-icon"><Icon size={19} /></span>
              {path ? <ArrowRight size={16} aria-hidden="true" /> : null}
            </div>
            <strong className={`kpi-value${unavailable ? ' kpi-value-unavailable' : ''}`}>
              {unavailable ? 'Không tải được' : value}
            </strong>
            <span className="kpi-label">{label}</span>
            </>
          );

          return path ? (
            <button
              type="button"
              className="kpi-card kpi-card-action"
              key={label}
              aria-label={`${label}: ${unavailable ? 'Không tải được' : value}. Mở màn liên quan`}
              onClick={() => onNavigate(path)}
            >
              {content}
            </button>
          ) : (
            <section className="kpi-card" key={label}>
              {content}
            </section>
          );
        })}
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
