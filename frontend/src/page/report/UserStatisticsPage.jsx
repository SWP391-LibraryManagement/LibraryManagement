/**
 * FE12 · UC60 — User Statistics (Librarian/Admin)
 * KPI thành viên + line (tăng trưởng thành viên) + donut (thành viên theo trạng thái)
 * + bảng tổng hợp theo nhóm + bộ lọc ngày.
 */

import { useState } from 'react';
import { Users, UserPlus, UserCheck, Clock, Calendar } from 'lucide-react';

import AppLayout from '../../component/layout/AppLayout';
import { LineChart, DonutChart } from '../../component/shared/Charts';
import { Badge } from '../../component/shared/Feedback';

const KPIS = [
  { label: 'Tổng thành viên', value: '3.420', icon: Users, trend: '+5,4%', up: true },
  { label: 'Mới trong tháng', value: '128', icon: UserPlus, trend: '+18,0%', up: true },
  { label: 'Đang hoạt động', value: '2.910', icon: UserCheck, trend: '+2,1%', up: true },
  { label: 'Đơn chờ duyệt', value: '34', icon: Clock, trend: '-9,0%', up: false },
];

const GROWTH = [
  { label: 'T1', value: 3010 }, { label: 'T2', value: 3095 }, { label: 'T3', value: 3180 },
  { label: 'T4', value: 3250 }, { label: 'T5', value: 3340 }, { label: 'T6', value: 3420 },
];

const BY_STATUS = [
  { label: 'Hoạt động', value: 2910, color: '#2f8f5b' },
  { label: 'Không hoạt động', value: 476, color: '#6b6153' },
  { label: 'Bị khóa', value: 34, color: '#c1452f' },
];

const USER_SEGMENTS = [
  { segment: 'Members - Active', users: 2910, borrowShare: '78%', status: 'Active' },
  { segment: 'Members - Inactive', users: 476, borrowShare: '12%', status: 'Inactive' },
  { segment: 'Librarians', users: 18, borrowShare: 'N/A', status: 'Active' },
  { segment: 'Pending membership applications', users: 34, borrowShare: 'N/A', status: 'Pending' },
];

export default function UserStatisticsPage() {
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-06-15');

  return (
    <AppLayout
      active="user-statistics"
      title="User Statistics"
      subtitle="Tăng trưởng và mức độ hoạt động của thành viên"
    >
      <div className="toolbar">
        <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} className="muted" />
          <input type="date" className="input" style={{ width: 160 }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="muted">→</span>
          <input type="date" className="input" style={{ width: 160 }} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="kpi-grid">
        {KPIS.map(({ label, value, icon: Icon, trend, up }) => (
          <div className="kpi-card" key={label}>
            <div className="kpi-top">
              <span className="kpi-label">{label}</span>
              <span className="kpi-icon"><Icon size={18} /></span>
            </div>
            <span className="kpi-value">{value}</span>
            <span className={`kpi-trend ${up ? 'up' : 'down'}`}>{trend} so với kỳ trước</span>
          </div>
        ))}
      </div>

      <div className="split">
        <div className="lib-card">
          <h3 className="lib-card-title">Tăng trưởng thành viên</h3>
          <LineChart data={GROWTH} format={(v) => v.toLocaleString('vi-VN')} />
        </div>
        <div className="lib-card">
          <h3 className="lib-card-title">Thành viên theo trạng thái</h3>
          <DonutChart data={BY_STATUS} centerLabel="thành viên" centerValue="3.420" />
        </div>
      </div>

      <div className="lib-card">
        <h3 className="lib-card-title">Tổng hợp người dùng theo nhóm</h3>
        <div className="lib-table-wrap">
          <table className="lib-table">
            <thead><tr><th>Nhóm</th><th>Số lượng</th><th>Tỷ trọng mượn</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {USER_SEGMENTS.map((u) => (
                <tr key={u.segment}>
                  <td>
                    <div className="row-flex">
                      <span className="app-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{u.segment.slice(0, 1)}</span>
                      <strong>{u.segment}</strong>
                    </div>
                  </td>
                  <td><strong>{u.users.toLocaleString('vi-VN')}</strong></td>
                  <td>{u.borrowShare}</td>
                  <td><Badge status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
