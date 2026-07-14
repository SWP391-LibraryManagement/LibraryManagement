/**
 * FE12 - UC60 - User Statistics (Librarian/Admin)
 * API that: GET /api/reports/users. Response chỉ dùng aggregate, không hiển thị PII không cần thiết.
 */

import { useEffect, useMemo, useState } from 'react';
import { Users, UserPlus, UserCheck, Clock, Calendar, RefreshCw } from 'lucide-react';

import { reportApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { LineChart, DonutChart } from '../../component/shared/Charts';
import { Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DataTable, DataToolbar } from '../../component/shared/OperationalPatterns';
import { objectToChart } from '../../utils/libraryFeatureViewModels';
import { buildDateRangeReportParams } from '../../utils/reportFilters';

const fmtNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

export default function UserStatisticsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('info');

  async function loadReport() {
    setLoading(true);
    try {
      const data = await reportApi.users(buildDateRangeReportParams(from, to));
      setReport(data);
      setNoticeType('success');
      setNotice('Dữ liệu báo cáo đã được cập nhật.');
    } catch (error) {
      setReport(null);
      setNoticeType('error');
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

  const totals = report?.totals || {};
  const statusData = useMemo(() => objectToChart(report?.usersByStatus), [report]);
  const growthData = useMemo(() => objectToChart(report?.newMembersByPeriod, (label) => label.length >= 7 ? label.slice(5) : label), [report]);
  const pendingMembers = report?.membersByStatus?.PENDING || report?.membersByStatus?.Pending || 0;
  const kpis = [
    { label: 'Tổng người dùng', value: totals.users, icon: Users, hint: 'aggregate only' },
    { label: 'Thành viên', value: totals.members, icon: UserCheck, hint: 'approved members' },
    { label: 'Mới theo kỳ', value: growthData.at(-1)?.value || 0, icon: UserPlus, hint: 'newMembersByPeriod' },
    { label: 'Đang chờ duyệt', value: pendingMembers, icon: Clock, hint: 'membership pending' },
  ];
  const roleRows = objectToChart(report?.usersByRole);

  return (
    <AppLayout
      active="user-statistics"
      title="Thống kê người dùng"
      subtitle="Thống kê người dùng dạng aggregate, tránh lộ thông tin cá nhân không cần thiết."
      actions={<button className="btn btn-outline" onClick={loadReport} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      {notice && <DataNotice type={noticeType} title={noticeType === 'error' ? 'Không thể tải báo cáo' : 'Đã tải dữ liệu'}>{notice}</DataNotice>}
      <DataToolbar
        filters={(
          <div className="field report-date-filter">
            <Calendar size={16} className="muted" />
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <span className="muted">-</span>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
            <button className="btn btn-primary btn-sm" onClick={loadReport} disabled={loading}>Áp dụng</button>
          </div>
        )}
      />

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

          <div className="split">
            <div className="lib-card">
              <h3 className="lib-card-title">Tăng trưởng thành viên theo kỳ</h3>
              {growthData.length ? <LineChart data={growthData} format={fmtNumber} /> : <EmptyState title="Chưa có dữ liệu tăng trưởng" />}
            </div>
            <div className="lib-card">
              <h3 className="lib-card-title">Người dùng theo trạng thái</h3>
              {statusData.length ? <DonutChart data={statusData} centerLabel="người dùng" centerValue={fmtNumber(totals.users)} /> : <EmptyState title="Chưa có dữ liệu trạng thái" />}
            </div>
          </div>

          <div className="lib-card">
            <h3 className="lib-card-title">Tổng hợp theo vai trò và membership</h3>
            <DataTable
              caption="User statistics summary table"
              headers={['Nhóm', 'Số lượng', 'Nguồn', 'Trạng thái']}
              isEmpty={!roleRows.length}
              emptyState={<EmptyState icon={Users} title="Không có dữ liệu vai trò" />}
            >
              {roleRows.map((row) => (
                <tr key={row.label}>
                  <td data-label="Nhóm"><strong>{row.label}</strong></td>
                  <td data-label="Số lượng"><strong>{fmtNumber(row.value)}</strong></td>
                  <td data-label="Nguồn">usersByRole</td>
                  <td data-label="Trạng thái"><Badge status="Active" /></td>
                </tr>
              ))}
              {Object.entries(report?.membersByStatus || {}).map(([status, value]) => (
                <tr key={`member-${status}`}>
                  <td data-label="Nhóm"><strong>Membership {status}</strong></td>
                  <td data-label="Số lượng"><strong>{fmtNumber(value)}</strong></td>
                  <td data-label="Nguồn">membersByStatus</td>
                  <td data-label="Trạng thái"><Badge status={status} /></td>
                </tr>
              ))}
            </DataTable>
          </div>
        </>
      )}
    </AppLayout>
  );
}
