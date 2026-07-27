/**
 * FE12 - UC60 - User Statistics (Librarian/Admin)
 * API that: GET /api/reports/users. Response chỉ dùng aggregate, không hiển thị PII không cần thiết.
 */

import { useEffect, useState } from 'react';
import { Users, UserPlus, UserCheck, Clock, Calendar, RefreshCw, Search, RotateCcw } from 'lucide-react';

import { reportApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { LineChart, DonutChart } from '../../component/shared/Charts';
import { Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DataTable, DataToolbar } from '../../component/shared/OperationalPatterns';
import { objectToChart } from '../../utils/libraryFeatureViewModels';
import { buildUserReportParams } from '../../utils/reportFilters';
import { getRoleLabel, getStatusLabel } from '../../utils/uiLabels';

const fmtNumber = (value) => Number(value || 0).toLocaleString('vi-VN');
const fmtDate = (value) => value ? String(value).slice(0, 10) : '-';
const REPORT_PAGE_SIZE = 20;
const ACCOUNT_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả tài khoản' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
  { value: 'LOCKED', label: 'Đã khóa' },
];
const MEMBERSHIP_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả hội viên' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
];
// @spec BR-FE12-008 — allowlist approve `roleId` cho user report.
const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'LIBRARIAN', label: 'Thủ thư' },
  { value: 'MEMBER', label: 'Thành viên' },
];

function describeActiveFilterChips(filters) {
  const chips = [];
  if (filters.q) chips.push({ key: 'q', label: `Từ khóa: ${filters.q}` });
  if (filters.fromDate) chips.push({ key: 'fromDate', label: `Từ: ${filters.fromDate}` });
  if (filters.toDate) chips.push({ key: 'toDate', label: `Đến: ${filters.toDate}` });
  if (filters.status) chips.push({ key: 'status', label: `Tài khoản: ${ACCOUNT_STATUS_OPTIONS.find((o) => o.value === filters.status)?.label || filters.status}` });
  if (filters.membershipStatus) chips.push({ key: 'membershipStatus', label: `Hội viên: ${MEMBERSHIP_STATUS_OPTIONS.find((o) => o.value === filters.membershipStatus)?.label || filters.membershipStatus}` });
  if (filters.roleId) chips.push({ key: 'roleId', label: `Vai trò: ${ROLE_OPTIONS.find((o) => o.value === filters.roleId)?.label || filters.roleId}` });
  return chips;
}

export default function UserStatisticsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [membershipStatus, setMembershipStatus] = useState('');
  const [roleId, setRoleId] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [page, setPage] = useState(1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [dateRangeError, setDateRangeError] = useState('');

  async function loadReport(page, filters = activeFilters) {
    setLoading(true);
    setNotice('');
    try {
      const data = await reportApi.users(buildUserReportParams({
        ...filters,
        page,
        limit: REPORT_PAGE_SIZE,
      }));
      setReport(data);
      setPage(data.page || page);
    } catch (error) {
      setReport(null);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(event) {
    event.preventDefault();
    if (from && to && from > to) {
      setDateRangeError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      return;
    }
    setDateRangeError('');
    const filters = { q: query, fromDate: from, toDate: to, status, membershipStatus, roleId };
    setActiveFilters(filters);
    setPage(1);
    loadReport(1, filters);
  }

  function clearFilters() {
    setFrom('');
    setTo('');
    setQuery('');
    setStatus('');
    setMembershipStatus('');
    setRoleId('');
    setDateRangeError('');
    setActiveFilters({});
    setPage(1);
    loadReport(1, {});
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadReport(1, {}); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = report?.metrics || {};
  const rows = report?.rows || [];
  const totalRows = report?.totalRows || 0;
  const pageLimit = report?.limit || REPORT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageLimit));
  const statusData = objectToChart(metrics.usersByStatus, getStatusLabel);
  const growthData = objectToChart(
    metrics.newMembersByPeriod,
    (label) => label.length >= 7 ? label.slice(5) : label
  );
  const membershipRows = objectToChart(metrics.membershipByStatus);
  const pendingMembers = metrics.membershipByStatus?.PENDING || 0;
  const newMembers = Object.values(metrics.newMembersByPeriod || {})
    .reduce((total, value) => total + Number(value || 0), 0);
  const kpis = [
    { label: 'Tổng người dùng', value: totalRows, icon: Users, hint: 'Chỉ dữ liệu tổng hợp' },
    { label: 'Thành viên', value: metrics.totalMembers, icon: UserCheck, hint: 'Theo vai trò thành viên' },
    { label: 'Mới theo kỳ', value: newMembers, icon: UserPlus, hint: 'Thành viên mới trong kỳ' },
    { label: 'Đang chờ duyệt', value: pendingMembers, icon: Clock, hint: 'Hội viên chờ duyệt' },
  ];
  const roleRows = objectToChart(metrics.usersByRole);
  const filterChips = describeActiveFilterChips(activeFilters);
  const hasActiveFilters = filterChips.length > 0;

  return (
    <AppLayout
      contentClassName="report-content"
      active="user-statistics"
      title="Thống kê người dùng"
      subtitle="Thống kê người dùng dạng aggregate, tránh lộ thông tin cá nhân không cần thiết."
      actions={<button className="btn btn-outline" onClick={() => loadReport(page, activeFilters)} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> Tải lại</button>}
    >
      {notice && <DataNotice type="error" title="Không thể tải báo cáo">{notice}</DataNotice>}
      {loading && !notice && report && <DataNotice type="info" title="Đang làm mới báo cáo">Vui lòng chờ trong giây lát.</DataNotice>}
      <form onSubmit={applyFilters}><DataToolbar
        search={<><Search size={16} /><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã người dùng, vai trò, trạng thái..." aria-label="Tìm trong thống kê người dùng" /></>}
        filters={(
          <div className="field report-date-filter">
            <Calendar size={16} className="muted" />
            <label htmlFor="user-from-date" className="sr-only">Từ ngày</label>
            <input id="user-from-date" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Từ ngày" />
            <span className="muted" aria-hidden="true">-</span>
            <label htmlFor="user-to-date" className="sr-only">Đến ngày</label>
            <input id="user-to-date" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Đến ngày" />
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Trạng thái tài khoản">
              {ACCOUNT_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select className="select" value={membershipStatus} onChange={(event) => setMembershipStatus(event.target.value)} aria-label="Trạng thái hội viên">
              {MEMBERSHIP_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select className="select" value={roleId} onChange={(event) => setRoleId(event.target.value)} aria-label="Vai trò">
              {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>Áp dụng</button>
            {hasActiveFilters && (
              <button type="button" className="icon-btn" onClick={clearFilters} aria-label="Xóa bộ lọc thống kê" title="Xóa bộ lọc" disabled={loading}>
                <RotateCcw size={17} />
              </button>
            )}
            {dateRangeError && <span className="field-hint" role="alert">{dateRangeError}</span>}
          </div>
        )}
      /></form>

      {hasActiveFilters && (
        <div className="filter-chips" aria-label="Bộ lọc đang áp dụng">
          {filterChips.map((chip) => (
            <span key={chip.key} className="filter-chip">{chip.label}</span>
          ))}
        </div>
      )}

      {loading && !report ? <LoadingBlock rows={4} /> : !report || notice ? (
        <EmptyState icon={Users} title="Không có dữ liệu báo cáo">
          Hãy kiểm tra phiên đăng nhập, kết nối backend hoặc bộ lọc rồi thử tải lại.
        </EmptyState>
      ) : (
        <>
          <div className="kpi-grid">
            {kpis.map(({ label, value, icon: Icon, hint }) => (
              <div className="kpi-card" key={label}>
                <div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon"><Icon size={18} /></span></div>
                <span className="kpi-value">{fmtNumber(value)}</span>
                <span className="kpi-hint">{hint}</span>
              </div>
            ))}
          </div>

          <div className="stat-strip">
            <span className="stat-chip"><strong>{fmtNumber(rows.length)}</strong> dòng trên trang {report?.page || 1}</span>
            <span className="stat-chip"><strong>{fmtNumber(totalRows)}</strong> tổng người dùng</span>
            <span className="stat-chip"><strong>{fmtNumber(report?.limit || 20)}</strong> dòng/trang</span>
          </div>

          <div className="split">
            <div className="lib-card">
              <h3 className="lib-card-title">Tăng trưởng thành viên theo kỳ</h3>
              {growthData.length ? <LineChart data={growthData} format={fmtNumber} ariaLabel="Biểu đồ đường tăng trưởng thành viên" /> : <EmptyState title="Chưa có dữ liệu tăng trưởng" />}
            </div>
            <div className="lib-card">
              <h3 className="lib-card-title">Người dùng theo trạng thái</h3>
              {statusData.length ? <DonutChart data={statusData} centerLabel="người dùng" centerValue={fmtNumber(totalRows)} ariaLabel="Biểu đồ donut phân bổ người dùng theo trạng thái" /> : <EmptyState title="Chưa có dữ liệu trạng thái" />}
            </div>
          </div>

          <div className="lib-card">
            <h3 className="lib-card-title">Tổng hợp theo vai trò và hội viên</h3>
            <DataTable
              caption="Tổng hợp thống kê người dùng"
              headers={['Nhóm', 'Số lượng', 'Nguồn']}
              isEmpty={!roleRows.length && !membershipRows.length}
              emptyState={<EmptyState icon={Users} title="Không có dữ liệu vai trò" />}
            >
              {roleRows.map((row) => (
                <tr key={row.label}>
                  <td data-label="Nhóm"><strong>{getRoleLabel(row.label)}</strong></td>
                  <td data-label="Số lượng"><strong>{fmtNumber(row.value)}</strong></td>
                  <td data-label="Nguồn">Theo vai trò người dùng</td>
                </tr>
              ))}
              {membershipRows.map((row) => (
                <tr key={`member-${row.label}`}>
                  <td data-label="Nhóm"><strong>Hội viên: {getStatusLabel(row.label)}</strong></td>
                  <td data-label="Số lượng"><strong>{fmtNumber(row.value)}</strong></td>
                  <td data-label="Nguồn">Theo trạng thái hội viên</td>
                </tr>
              ))}
            </DataTable>
          </div>

          <div className="lib-card">
            <h3 className="lib-card-title">Chi tiết người dùng ({fmtNumber(totalRows)})</h3>
            <DataTable
              caption="Chi tiết thống kê người dùng"
              headers={['Mã người dùng', 'Trạng thái', 'Vai trò', 'Hội viên', 'Ngày tạo', 'Ngày duyệt']}
              isEmpty={!rows.length}
              emptyState={<EmptyState icon={Users} title="Không có người dùng khớp bộ lọc" />}
            >
              {rows.map((row) => (
                <tr key={row.userId}>
                  <td data-label="Mã người dùng"><strong>#{row.userId}</strong></td>
                  <td data-label="Trạng thái"><Badge status={row.status}>{getStatusLabel(row.status)}</Badge></td>
                  <td data-label="Vai trò">{row.roles?.map(getRoleLabel).join(', ') || '-'}</td>
                  <td data-label="Hội viên">{row.membershipStatus ? <Badge status={row.membershipStatus}>{getStatusLabel(row.membershipStatus)}</Badge> : '-'}</td>
                  <td data-label="Ngày tạo">{fmtDate(row.createdAt)}</td>
                  <td data-label="Ngày duyệt">{fmtDate(row.approvedAt)}</td>
                </tr>
              ))}
            </DataTable>
            <div className="pagination report-pagination">
              <button className="btn btn-outline btn-sm" type="button" onClick={() => loadReport(page - 1, activeFilters)} disabled={loading || page <= 1}>Trang trước</button>
              <span className="muted">Trang {page}/{totalPages}</span>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => loadReport(page + 1, activeFilters)} disabled={loading || page >= totalPages}>Trang sau</button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
