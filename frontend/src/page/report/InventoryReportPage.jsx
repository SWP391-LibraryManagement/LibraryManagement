/**
 * FE12 - UC59 - Inventory Report (Librarian/Admin)
 * API that: GET /api/reports/inventory. Có fallback demo khi chưa đăng nhập/chưa chạy backend.
 */

import { useEffect, useMemo, useState } from 'react';
import { Library, Copy, CheckCircle2, BookMarked, AlertTriangle, RefreshCw } from 'lucide-react';

import { reportApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { BarChart, DonutChart } from '../../component/shared/Charts';
import { Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DEMO_REPORTS, objectToChart } from '../../utils/libraryFeatureViewModels';

const fmtNumber = (value) => Number(value || 0).toLocaleString('vi-VN');
const STOCK_BADGE = { ok: { s: 'available', t: 'Đủ' }, low: { s: 'pending', t: 'Sắp hết' }, out: { s: 'overdue', t: 'Hết hàng' } };

export default function InventoryReportPage() {
  const [report, setReport] = useState(DEMO_REPORTS.inventory);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Đang hiển thị dữ liệu demo để review giao diện.');
  const [isDemo, setIsDemo] = useState(true);

  async function loadReport() {
    setLoading(true);
    try {
      const data = await reportApi.inventory();
      setReport({ ...DEMO_REPORTS.inventory, ...data });
      setIsDemo(false);
      setNotice('Đã kết nối backend thật qua GET /api/reports/inventory.');
    } catch (error) {
      setReport(DEMO_REPORTS.inventory);
      setIsDemo(true);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadReport(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const totals = report.totals || {};
  const statusCounts = report.copyStatusCounts || {};
  const categoryData = useMemo(() => objectToChart(report.categoryCounts), [report]);
  const availability = [
    { label: 'Khả dụng', value: statusCounts.AVAILABLE || statusCounts.Available || 0, color: '#2f8f5b' },
    { label: 'Đang mượn', value: statusCounts.BORROWED || statusCounts.Borrowed || 0, color: '#a87532' },
    { label: 'Mất/Hỏng', value: (statusCounts.LOST || 0) + (statusCounts.DAMAGED || 0), color: '#c1452f' },
  ];
  const kpis = [
    { label: 'Tổng đầu sách', value: totals.books, icon: Library },
    { label: 'Tổng bản sao', value: totals.copies, icon: Copy },
    { label: 'Khả dụng', value: availability[0].value, icon: CheckCircle2 },
    { label: 'Đang mượn', value: availability[1].value, icon: BookMarked },
    { label: 'Mất / Hỏng', value: availability[2].value, icon: AlertTriangle },
  ];
  const lowBooks = report.lowAvailabilityBooks || [];

  return (
    <AppLayout
      active="inventory-report"
      title="Báo cáo tồn kho"
      subtitle="Tổng hợp tình trạng bản sao, tồn kho thấp và phân bổ theo nhóm sách."
      actions={<button className="btn btn-outline" onClick={loadReport} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      <DataNotice type={isDemo ? 'warn' : 'success'} title={isDemo ? 'Demo fallback' : 'Backend connected'}>{notice}</DataNotice>
      {loading ? <LoadingBlock rows={4} /> : (
        <>
          <div className="kpi-grid">
            {kpis.map(({ label, value, icon: Icon }) => (
              <div className="kpi-card" key={label}>
                <div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon"><Icon size={18} /></span></div>
                <span className="kpi-value">{fmtNumber(value)}</span>
              </div>
            ))}
          </div>

          <div className="split">
            <div className="lib-card">
              <h3 className="lib-card-title">Bản sao theo thể loại</h3>
              {categoryData.length ? <BarChart data={categoryData} format={fmtNumber} /> : <EmptyState title="Chưa có dữ liệu thể loại" />}
            </div>
            <div className="lib-card">
              <h3 className="lib-card-title">Khả dụng vs Đang mượn</h3>
              <DonutChart data={availability} centerLabel="ban sao" centerValue={fmtNumber(totals.copies)} />
            </div>
          </div>

          <div className="lib-card">
            <h3 className="lib-card-title">Đầu sách cần theo dõi tồn kho</h3>
            <div className="lib-table-wrap">
              <table className="lib-table"><caption className="sr-only">Low inventory books table</caption>
                <thead><tr><th scope="col">Sách</th><th scope="col">Thể loại</th><th scope="col">Tổng bản</th><th scope="col">Khả dụng</th><th scope="col">Trạng thái</th></tr></thead>
                <tbody>
                  {lowBooks.map((book, index) => {
                    const available = Number(book.availableCopies ?? book.availableCount ?? 0);
                    const total = Number(book.totalCopies ?? book.copyCount ?? 0);
                    const key = available === 0 ? 'out' : available <= 2 ? 'low' : 'ok';
                    return (
                      <tr key={`${book.bookId || book.title}-${index}`} className={key !== 'ok' ? 'row-overdue' : ''}>
                        <td><strong>{book.title || `Book #${book.bookId}`}</strong></td>
                        <td>{book.categoryName || book.category || '-'}</td>
                        <td>{fmtNumber(total)}</td>
                        <td><strong>{fmtNumber(available)}</strong></td>
                        <td><Badge status={STOCK_BADGE[key].s}>{STOCK_BADGE[key].t}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!lowBooks.length && <EmptyState icon={Library} title="Không có đầu sách tồn kho thấp" />}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
