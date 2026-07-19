/**
 * FE12 - UC58 - Borrowing Report (Librarian/Admin)
 * API that: GET /api/reports/borrowing.
 */

import { useEffect, useState } from 'react';
import { BookOpen, BookMarked, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';

import { reportApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { BarChart, LineChart } from '../../component/shared/Charts';
import { Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DataTable, DataToolbar } from '../../component/shared/OperationalPatterns';
import { objectToChart } from '../../utils/libraryFeatureViewModels';
import { buildDateRangeReportParams } from '../../utils/reportFilters';

const fmtNumber = (value) => Number(value || 0).toLocaleString('vi-VN');
const fmtDate = (value) => value ? String(value).slice(0, 10) : '-';

export default function BorrowingReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('info');

  async function loadReport() {
    setLoading(true);
    try {
      const data = await reportApi.borrowing(buildDateRangeReportParams(from, to));
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

  const metrics = report?.metrics || {};
  const rows = report?.rows || [];
  const totalRows = report?.totalRows || 0;
  const periodData = objectToChart(
    metrics.borrowCountByPeriod,
    (label) => label.length >= 7 ? label.slice(5) : label
  );
  const topBooks = metrics.topBorrowedBooks || [];
  const kpis = [
    { label: 'Tổng bản ghi', value: totalRows, icon: BookOpen, hint: 'BorrowDetails' },
    { label: 'Đang mượn', value: metrics.activeLoans, icon: BookMarked, hint: 'BORROWED' },
    { label: 'Quá hạn', value: metrics.overdueLoans, icon: AlertTriangle, hint: 'OVERDUE' },
  ];

  return (
    <AppLayout
      active="borrowing-report"
      title="Báo cáo mượn/trả"
      subtitle="Báo cáo mượn/trả được lấy trực tiếp từ FE07, không chỉnh sửa dữ liệu nguồn."
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
        <EmptyState icon={AlertTriangle} title="Không có dữ liệu báo cáo">
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
            <span className="stat-chip"><strong>{fmtNumber(totalRows)}</strong> tổng bản ghi</span>
            <span className="stat-chip"><strong>{fmtNumber(report?.limit || 20)}</strong> dòng/trang</span>
          </div>

          <div className="split">
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
            <h3 className="lib-card-title">Chi tiết mượn/trả ({fmtNumber(totalRows)})</h3>
            <DataTable
              caption="Borrowing report detail rows"
              headers={['Mã', 'Người dùng', 'Sách / Bản sao', 'Trạng thái', 'Ngày mượn', 'Hạn trả', 'Ngày trả']}
              isEmpty={!rows.length}
              emptyState={<EmptyState icon={BookOpen} title="Không có chi tiết mượn/trả" />}
            >
              {rows.map((row) => (
                <tr key={row.borrowDetailId}>
                  <td data-label="Mã"><strong>#{row.borrowDetailId}</strong></td>
                  <td data-label="Người dùng">#{row.userId}</td>
                  <td data-label="Sách / Bản sao">Book #{row.bookId || '-'} / Copy #{row.copyId}</td>
                  <td data-label="Trạng thái"><Badge status={row.status}>{row.status}</Badge></td>
                  <td data-label="Ngày mượn">{fmtDate(row.borrowDate)}</td>
                  <td data-label="Hạn trả">{fmtDate(row.dueDate)}</td>
                  <td data-label="Ngày trả">{fmtDate(row.returnDate)}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </>
      )}
    </AppLayout>
  );
}
