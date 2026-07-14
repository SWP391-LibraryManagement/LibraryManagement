/**
 * FE12 - UC58 - Borrowing Report (Librarian/Admin)
 * API that: GET /api/reports/borrowing.
 */

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, BookMarked, AlertTriangle, ClipboardList, Calendar, RefreshCw } from 'lucide-react';

import { reportApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { BarChart, LineChart } from '../../component/shared/Charts';
import { Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DataTable, DataToolbar } from '../../component/shared/OperationalPatterns';
import { objectToChart } from '../../utils/libraryFeatureViewModels';
import { buildDateRangeReportParams } from '../../utils/reportFilters';

const fmtNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

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

  const periodData = useMemo(
    () => objectToChart(report?.borrowCountByPeriod, (label) => label.length >= 7 ? label.slice(5) : label),
    [report]
  );
  const topBooks = report?.topBorrowedBooks || [];
  const totals = report?.totals || {};
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
            {Object.entries(report?.requestStatusCounts || {}).map(([status, value]) => <span className="stat-chip" key={status}><strong>{fmtNumber(value)}</strong> request {status}</span>)}
            {Object.entries(report?.detailStatusCounts || {}).map(([status, value]) => <span className="stat-chip" key={status}><strong>{fmtNumber(value)}</strong> detail {status}</span>)}
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
            <h3 className="lib-card-title">Chi tiết top sách</h3>
            <DataTable
              caption="Top borrowed books table"
              headers={['#', 'Sách', 'Tác giả', 'Nhóm', 'Lượt mượn']}
              isEmpty={!topBooks.length}
              emptyState={<EmptyState icon={BookOpen} title="Không có dữ liệu top sách" />}
            >
              {topBooks.map((book, index) => (
                <tr key={`${book.bookId || book.title}-${index}`}>
                  <td data-label="#">{index + 1}</td>
                  <td data-label="Sách"><strong>{book.title || `Book #${book.bookId}`}</strong></td>
                  <td data-label="Tác giả">{book.author || '-'}</td>
                  <td data-label="Nhóm"><Badge status="default">{book.category || book.categoryName || 'Nguồn FE07'}</Badge></td>
                  <td data-label="Lượt mượn"><strong>{fmtNumber(book.borrowCount)}</strong></td>
                </tr>
              ))}
            </DataTable>
          </div>
        </>
      )}
    </AppLayout>
  );
}
