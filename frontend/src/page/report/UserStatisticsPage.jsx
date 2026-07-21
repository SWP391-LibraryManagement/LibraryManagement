/**
 * FE12 - UC60 - User Statistics (Librarian/Admin)
 * API that: GET /api/reports/users. Response chỉ dùng aggregate, không hiển thị PII không cần thiết.
 */

import { useEffect, useState } from 'react';
import { Users, UserPlus, UserCheck, Clock, Calendar, RefreshCw, Search } from 'lucide-react';

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

export default function UserStatisticsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [membershipStatus, setMembershipStatus] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  async function loadReport(event) {
    event?.preventDefault();
    setLoading(true);
    setNotice('');
    try {
      const data = await reportApi.users(buildUserReportParams({ q: query, fromDate: from, toDate: to, status, membershipStatus }));
      setReport(data);
    } catch (error) {
      setReport(null);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadReport(); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = report?.metrics || {};
  const rows = report?.rows || [];
  const totalRows = report?.totalRows || 0;
  const statusData = objectToChart(metrics.usersByStatus);
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
    { label: 'Thành viên', value: metrics.totalMembers, icon: UserCheck, hint: 'usersByRole.MEMBER' },
    { label: 'Mới theo kỳ', value: newMembers, icon: UserPlus, hint: 'newMembersByPeriod' },
    { label: 'Đang chờ duyệt', value: pendingMembers, icon: Clock, hint: 'Hội viên chờ duyệt' },
  ];
  const roleRows = objectToChart(metrics.usersByRole);

  return (
    <AppLayout
      contentClassName="report-content"
      active="user-statistics"
      title="Thống kê người dùng"
      subtitle="Thống kê người dùng dạng aggregate, tránh lộ thông tin cá nhân không cần thiết."
      actions={<button className="btn btn-outline" onClick={loadReport} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      {notice && <DataNotice type="error" title="Không thể tải báo cáo">{notice}</DataNotice>}
      <form onSubmit={loadReport}><DataToolbar
        search={<><Search size={16} /><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã người dùng, vai trò, trạng thái..." aria-label="Tìm trong thống kê người dùng" /></>}
        filters={(
          <div className="field report-date-filter">
            <Calendar size={16} className="muted" />
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Từ ngày" />
            <span className="muted">-</span>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Đến ngày" />
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Trạng thái tài khoản"><option value="">Tất cả tài khoản</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option><option value="LOCKED">Đã khóa</option></select>
            <select className="select" value={membershipStatus} onChange={(event) => setMembershipStatus(event.target.value)} aria-label="Trạng thái hội viên"><option value="">Tất cả hội viên</option><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Từ chối</option><option value="INACTIVE">Ngừng hoạt động</option></select>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>Áp dụng</button>
          </div>
        )}
      /></form>

      {loading ? <LoadingBlock rows={4} /> : !report ? (
        <EmptyState icon={Users} title="Không có dữ liệu báo cáo">
          Hãy kiểm tra phiên đăng nhập hoặc kết nối backend rồi thử tải lại.
        </EmptyState>
      ) : (
        <>
          <div className="kpi-grid">
            {kpis.map(({ label, value, icon: Icon, hint }) => (
              <div className="kpi-card" key={label}>
                <div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon"><Icon size={18} /></span></div>
                <span className="kpi-value">{fmtNumber(value)}</span>
                <span className="kpi-trend up">{hint}</span>
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
              {growthData.length ? <LineChart data={growthData} format={fmtNumber} /> : <EmptyState title="Chưa có dữ liệu tăng trưởng" />}
            </div>
            <div className="lib-card">
              <h3 className="lib-card-title">Người dùng theo trạng thái</h3>
              {statusData.length ? <DonutChart data={statusData} centerLabel="người dùng" centerValue={fmtNumber(totalRows)} /> : <EmptyState title="Chưa có dữ liệu trạng thái" />}
            </div>
          </div>

          <div className="lib-card">
            <h3 className="lib-card-title">Tổng hợp theo vai trò và hội viên</h3>
            <DataTable
              caption="Tổng hợp thống kê người dùng"
              headers={['Nhóm', 'Số lượng', 'Nguồn', 'Trạng thái']}
              isEmpty={!roleRows.length && !membershipRows.length}
              emptyState={<EmptyState icon={Users} title="Không có dữ liệu vai trò" />}
            >
              {roleRows.map((row) => (
                <tr key={row.label}>
                  <td data-label="Nhóm"><strong>{getRoleLabel(row.label)}</strong></td>
                  <td data-label="Số lượng"><strong>{fmtNumber(row.value)}</strong></td>
                  <td data-label="Nguồn">Theo vai trò người dùng</td>
                  <td data-label="Trạng thái"><Badge status="Active">{getStatusLabel('Active')}</Badge></td>
                </tr>
              ))}
              {membershipRows.map((row) => (
                <tr key={`member-${row.label}`}>
                  <td data-label="Nhóm"><strong>Hội viên: {getStatusLabel(row.label)}</strong></td>
                  <td data-label="Số lượng"><strong>{fmtNumber(row.value)}</strong></td>
                  <td data-label="Nguồn">Theo trạng thái hội viên</td>
                  <td data-label="Trạng thái"><Badge status={row.label}>{getStatusLabel(row.label)}</Badge></td>
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
          </div>
        </>
      )}
    </AppLayout>
  );
}
