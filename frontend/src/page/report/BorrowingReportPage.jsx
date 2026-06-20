/**
 * FE12 - UC58 - Borrowing Report (Librarian/Admin)
 * API that: GET /api/reports/borrowing. Có fallback demo khi chưa đăng nhập/chưa chạy backend.
 */

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, BookMarked, AlertTriangle, ClipboardList, Calendar, RefreshCw } from 'lucide-react';

import { reportApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { BarChart, LineChart } from '../../component/shared/Charts';
import { Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DEMO_REPORTS, objectToChart } from '../../utils/libraryFeatureViewModels';

const fmtNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

export default function BorrowingReportPage() {
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-06-15');
  const [report, setReport] = useState(DEMO_REPORTS.borrowing);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Đang hiển thị dữ liệu demo để review giao diện.');
  const [isDemo, setIsDemo] = useState(true);

  async function loadReport() {
    setLoading(true);
    try {
      const data = await reportApi.borrowing({ fromDate: from, toDate: to });
      setReport({ ...DEMO_REPORTS.borrowing, ...data });
      setIsDemo(false);
      setNotice('Đã kết nối backend thật qua GET /api/reports/borrowing.');
    } catch (error) {
      setReport(DEMO_REPORTS.borrowing);
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

  const periodData = useMemo(
    () => objectToChart(report.borrowCountByPeriod, (label) => label.length >= 7 ? label.slice(5) : label),
    [report]
  );
  const topBooks = report.topBorrowedBooks || [];
  const totals = report.totals || {};
  const kpis = [
    { label: 'Tổng yêu cầu', value: totals.requests, icon: ClipboardList, hint: 'BorrowRequests' },
    { label: 'Tổng bản ghi', value: totals.details, icon: BookOpen, hint: 'BorrowDetails' },
    { label: 'Đang mượn', value: totals.activeLoans, icon: BookMarked, hint: 'BORROWED' },
    { label: 'Quá hạn', value: totals.overdueLoans, icon: AlertTriangle, hint: 'OVERDUE' },
  ];

  return (
    <AppLayout
      active="borrowing-report"
      title="Báo cáo mượn/trả"
      subtitle="Báo cáo mượn/trả được lấy trực tiếp từ FE07, không chỉnh sửa dữ liệu nguồn."
      actions={<button className="btn btn-outline" onClick={loadReport} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      <DataNotice type={isDemo ? 'warn' : 'success'} title={isDemo ? 'Demo fallback' : 'Backend connected'}>{notice}</DataNotice>

      <div className="toolbar">
        <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} className="muted" />
          <input type="date" className="input" style={{ width: 160 }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="muted">-</span>
          <input type="date" className="input" style={{ width: 160 }} value={to} onChange={(e) => setTo(e.target.value)} />
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

          <div className="stat-strip">
            {Object.entries(report.requestStatusCounts || {}).map(([status, value]) => <span className="stat-chip" key={status}><strong>{fmtNumber(value)}</strong> request {status}</span>)}
            {Object.entries(report.detailStatusCounts || {}).map(([status, value]) => <span className="stat-chip" key={status}><strong>{fmtNumber(value)}</strong> detail {status}</span>)}
          </div>

          <div className="split" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
            <div className="lib-card">
              <h3 className="lib-card-title">Lượt mượn theo kỳ</h3>
              {periodData.length ? <LineChart data={periodData} format={fmtNumber} /> : <EmptyState title="Chưa có dữ liệu theo kỳ" />}
            </div>
            <div className="lib-card">
              <h3 className="lib-card-title">Top sách mượn nhiều</h3>
              {topBooks.length ? <BarChart data={topBooks.map((book) => ({ label: (book.title || `Book ${book.bookId}`).split(' ')[0], value: book.borrowCount || 0 }))} height={200} /> : <EmptyState title="Chưa có sách trong báo cáo" />}
            </div>
          </div>

          <div className="lib-card">
            <h3 className="lib-card-title">Chi tiết top sách</h3>
            <div className="lib-table-wrap">
              <table className="lib-table">
                <thead><tr><th>#</th><th>Sách</th><th>Tác giả</th><th>Nhóm</th><th>Lượt mượn</th></tr></thead>
                <tbody>
                  {topBooks.map((book, index) => (
                    <tr key={`${book.bookId || book.title}-${index}`}>
                      <td>{index + 1}</td>
                      <td><strong>{book.title || `Book #${book.bookId}`}</strong></td>
                      <td>{book.author || '-'}</td>
                      <td><Badge status="default">{book.category || book.categoryName || 'Nguồn FE07'}</Badge></td>
                      <td><strong>{fmtNumber(book.borrowCount)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!topBooks.length && <EmptyState icon={BookOpen} title="Không có dữ liệu top sách" />}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
