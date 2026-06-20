/**
 * FE12 · UC58 — Borrowing Report (Librarian/Admin)
 * KPI cards + biểu đồ mượn theo thời gian (line) + top 10 sách mượn nhiều (bar)
 * + bộ lọc khoảng ngày + bảng dữ liệu.
 */

import { useState } from 'react';
import { BookOpen, BookMarked, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

import AppLayout from '../../component/layout/AppLayout';
import { BarChart, LineChart } from '../../component/shared/Charts';
import { Badge } from '../../component/shared/Feedback';

const KPIS = [
  { label: 'Tổng lượt mượn', value: '1.284', icon: BookOpen, trend: '+8,2%', up: true },
  { label: 'Đang mượn', value: '342', icon: BookMarked, trend: '+3,1%', up: true },
  { label: 'Quá hạn', value: '57', icon: AlertTriangle, trend: '-1,4%', up: false },
  { label: 'Trả trong tháng', value: '498', icon: CheckCircle2, trend: '+12,0%', up: true },
];

const OVER_TIME = [
  { label: 'T1', value: 120 }, { label: 'T2', value: 98 }, { label: 'T3', value: 145 },
  { label: 'T4', value: 132 }, { label: 'T5', value: 167 }, { label: 'T6', value: 189 },
];

const TOP_BOOKS = [
  { title: 'Clean Code', author: 'Robert C. Martin', count: 87, category: 'Lập trình' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', count: 76, category: 'Lịch sử' },
  { title: 'Atomic Habits', author: 'James Clear', count: 71, category: 'Kỹ năng' },
  { title: 'Nhà Giả Kim', author: 'Paulo Coelho', count: 64, category: 'Tiểu thuyết' },
  { title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', count: 59, category: 'Kỹ năng' },
];

export default function BorrowingReportPage() {
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-06-15');

  return (
    <AppLayout
      active="borrowing-report"
      title="Borrowing Report"
      subtitle="Thống kê hoạt động mượn–trả của thư viện"
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

      <div className="split" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        <div className="lib-card">
          <h3 className="lib-card-title">Lượt mượn theo tháng</h3>
          <LineChart data={OVER_TIME} />
        </div>
        <div className="lib-card">
          <h3 className="lib-card-title">Top sách mượn nhiều</h3>
          <BarChart data={TOP_BOOKS.map((b) => ({ label: b.title.split(' ')[0], value: b.count }))} height={200} />
        </div>
      </div>

      <div className="lib-card">
        <h3 className="lib-card-title">Chi tiết top sách</h3>
        <div className="lib-table-wrap">
          <table className="lib-table">
            <thead><tr><th>#</th><th>Sách</th><th>Tác giả</th><th>Thể loại</th><th>Lượt mượn</th></tr></thead>
            <tbody>
              {TOP_BOOKS.map((b, i) => (
                <tr key={b.title}>
                  <td>{i + 1}</td>
                  <td><strong>{b.title}</strong></td>
                  <td>{b.author}</td>
                  <td><Badge status="default">{b.category}</Badge></td>
                  <td><strong>{b.count}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </AppLayout>
  );
}
