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
import { DEMO_REPORTS, objectToChart } from '../../utils/libraryFeatureViewModels';

const fmtNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

export default function UserStatisticsPage() {
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-06-15');
  const [report, setReport] = useState(DEMO_REPORTS.users);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Đang hiển thị dữ liệu demo để review giao diện.');
  const [isDemo, setIsDemo] = useState(true);

  async function loadReport() {
    setLoading(true);
    try {
      const data = await reportApi.users({ fromDate: from, toDate: to });
      setReport({ ...DEMO_REPORTS.users, ...data });
      setIsDemo(false);
      setNotice('Đã kết nối backend thật qua GET /api/reports/users.');
    } catch (error) {
      setReport(DEMO_REPORTS.users);
      setIsDemo(true);
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

  const totals = report.totals || {};
  const statusData = useMemo(() => objectToChart(report.usersByStatus), [report]);
  const growthData = useMemo(() => objectToChart(report.newMembersByPeriod, (label) => label.length >= 7 ? label.slice(5) : label), [report]);
  const pendingMembers = report.membersByStatus?.PENDING || report.membersByStatus?.Pending || 0;
  const kpis = [
    { label: 'Tổng người dùng', value: totals.users, icon: Users, hint: 'aggregate only' },
    { label: 'Thành viên', value: totals.members, icon: UserCheck, hint: 'approved members' },
    { label: 'Mới theo kỳ', value: growthData.at(-1)?.value || 0, icon: UserPlus, hint: 'newMembersByPeriod' },
    { label: 'Đang chờ duyệt', value: pendingMembers, icon: Clock, hint: 'membership pending' },
  ];
  const roleRows = objectToChart(report.usersByRole);

  return (
    <AppLayout
      active="user-statistics"
      title="Thống kê người dùng"
      subtitle="Thống kê người dùng dạng aggregate, tránh lộ thông tin cá nhân không cần thiết."
      actions={<button className="btn btn-outline" onClick={loadReport} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      <DataNotice type={isDemo ? 'warn' : 'success'} title={isDemo ? 'Demo fallback' : 'Backend connected'}>{notice}</DataNotice>
      <div className="toolbar">
        <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} className="muted" />
          <input type="date" className="input" style={{ width: 160 }} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
          <span className="muted">-</span>
          <input type="date" className="input" style={{ width: 160 }} value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          <button className="btn btn-primary btn-sm" onClick={loadReport} disabled={loading}>Áp dụng</button>
        </div>
      </div>

      {loading ? <LoadingBlock rows={4} /> : (
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
            <div className="lib-table-wrap">
              <table className="lib-table"><caption className="sr-only">User statistics summary table</caption>
                <thead><tr><th scope="col">Nhóm</th><th scope="col">Số lượng</th><th scope="col">Nguồn</th><th scope="col">Trạng thái</th></tr></thead>
                <tbody>
                  {roleRows.map((row) => (
                    <tr key={row.label}>
                      <td><strong>{row.label}</strong></td>
                      <td><strong>{fmtNumber(row.value)}</strong></td>
                      <td>usersByRole</td>
                      <td><Badge status="Active" /></td>
                    </tr>
                  ))}
                  {Object.entries(report.membersByStatus || {}).map(([status, value]) => (
                    <tr key={`member-${status}`}>
                      <td><strong>Membership {status}</strong></td>
                      <td><strong>{fmtNumber(value)}</strong></td>
                      <td>membersByStatus</td>
                      <td><Badge status={status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!roleRows.length && <EmptyState icon={Users} title="Không có dữ liệu vai trò" />}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
