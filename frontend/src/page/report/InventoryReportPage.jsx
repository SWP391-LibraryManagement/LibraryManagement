/**
 * FE12 · UC59 — Inventory Report (Librarian/Admin)
 * KPI kho sách + donut (available vs borrowed) + bar (copies theo thể loại)
 * + bảng sách kèm trạng thái tồn, tô đậm sách sắp hết.
 */

import { Library, Copy, CheckCircle2, BookMarked, AlertTriangle } from 'lucide-react';

import AppLayout from '../../component/layout/AppLayout';
import { BarChart, DonutChart } from '../../component/shared/Charts';
import { Badge } from '../../component/shared/Feedback';

const KPIS = [
  { label: 'Tổng đầu sách', value: '2.140', icon: Library },
  { label: 'Tổng bản sao', value: '6.580', icon: Copy },
  { label: 'Khả dụng', value: '4.230', icon: CheckCircle2 },
  { label: 'Đang mượn', value: '2.180', icon: BookMarked },
  { label: 'Mất / Hỏng', value: '170', icon: AlertTriangle },
];

const AVAIL_VS_BORROWED = [
  { label: 'Khả dụng', value: 4230, color: '#2f8f5b' },
  { label: 'Đang mượn', value: 2180, color: '#c78a3b' },
  { label: 'Mất/Hỏng', value: 170, color: '#c1452f' },
];

const BY_CATEGORY = [
  { label: 'Lập trình', value: 1820 }, { label: 'Lịch sử', value: 940 },
  { label: 'Tiểu thuyết', value: 1560 }, { label: 'Kỹ năng', value: 1280 }, { label: 'Khác', value: 980 },
];

const BOOKS = [
  { title: 'Clean Code', category: 'Lập trình', total: 12, available: 2, status: 'low' },
  { title: 'Sapiens', category: 'Lịch sử', total: 8, available: 5, status: 'ok' },
  { title: 'Atomic Habits', category: 'Kỹ năng', total: 10, available: 0, status: 'out' },
  { title: 'Nhà Giả Kim', category: 'Tiểu thuyết', total: 15, available: 9, status: 'ok' },
  { title: 'Design Patterns', category: 'Lập trình', total: 6, available: 1, status: 'low' },
];

const STOCK_BADGE = { ok: { s: 'available', t: 'Đủ' }, low: { s: 'pending', t: 'Sắp hết' }, out: { s: 'overdue', t: 'Hết hàng' } };

export default function InventoryReportPage() {
  return (
    <AppLayout
      active="inventory-report"
      title="Inventory Report"
      subtitle="Tình trạng kho sách và tồn kho theo thể loại"
    >
      <div className="kpi-grid">
        {KPIS.map(({ label, value, icon: Icon }) => (
          <div className="kpi-card" key={label}>
            <div className="kpi-top">
              <span className="kpi-label">{label}</span>
              <span className="kpi-icon"><Icon size={18} /></span>
            </div>
            <span className="kpi-value">{value}</span>
          </div>
        ))}
      </div>

      <div className="split">
        <div className="lib-card">
          <h3 className="lib-card-title">Bản sao theo thể loại</h3>
          <BarChart data={BY_CATEGORY} format={(v) => v.toLocaleString('vi-VN')} />
        </div>
        <div className="lib-card">
          <h3 className="lib-card-title">Khả dụng vs Đang mượn</h3>
          <DonutChart data={AVAIL_VS_BORROWED} centerLabel="bản sao" centerValue="6.580" />
        </div>
      </div>

      <div className="lib-card">
        <h3 className="lib-card-title">Tồn kho theo đầu sách</h3>
        <div className="lib-table-wrap">
          <table className="lib-table">
            <thead><tr><th>Sách</th><th>Thể loại</th><th>Tổng bản</th><th>Khả dụng</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {BOOKS.map((b) => (
                <tr key={b.title} className={b.status !== 'ok' ? 'row-overdue' : ''}>
                  <td><strong>{b.title}</strong></td>
                  <td>{b.category}</td>
                  <td>{b.total}</td>
                  <td><strong>{b.available}</strong></td>
                  <td><Badge status={STOCK_BADGE[b.status].s}>{STOCK_BADGE[b.status].t}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </AppLayout>
  );
}
