/**
 * FE12 - UC59 - Inventory Report (Librarian/Admin)
 * API that: GET /api/reports/inventory.
 */

import { useCallback, useEffect, useState } from 'react';
import { Library, Copy, CheckCircle2, BookMarked, AlertTriangle, Filter, RefreshCw, RotateCcw } from 'lucide-react';

import { authorizedRequest, reportApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { BarChart, DonutChart } from '../../component/shared/Charts';
import { Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DataTable, DataToolbar } from '../../component/shared/OperationalPatterns';
import { objectToChart } from '../../utils/libraryFeatureViewModels';
import { buildInventoryReportParams } from '../../utils/reportFilters';
import { getStatusLabel } from '../../utils/uiLabels';

const fmtNumber = (value) => Number(value || 0).toLocaleString('vi-VN');
const STOCK_BADGE = { ok: { s: 'available', t: 'Đủ' }, low: { s: 'pending', t: 'Sắp hết' }, out: { s: 'overdue', t: 'Hết hàng' } };

export default function InventoryReportPage() {
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('info');

  const loadCategories = useCallback(async () => {
    try {
      const response = await authorizedRequest(
        { method: 'get', url: '/books/metadata' },
        'Không thể tải danh sách thể loại.'
      );
      setCategories(response?.data?.categories || []);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadReport = useCallback(async (selectedCategoryId = '') => {
    setLoading(true);
    try {
      const data = await reportApi.inventory(buildInventoryReportParams(selectedCategoryId));
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
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCategories();
      loadReport('');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCategories, loadReport]);

  function applyCategoryFilter(event) {
    event.preventDefault();
    loadReport(categoryId);
  }

  function clearCategoryFilter() {
    setCategoryId('');
    loadReport('');
  }

  const metrics = report?.metrics || {};
  const rows = report?.rows || [];
  const totalRows = report?.totalRows || 0;
  const statusCounts = metrics.copiesByStatus || {};
  const statusData = objectToChart(metrics.copiesByStatus);
  const availability = [
    { label: 'Khả dụng', value: statusCounts.AVAILABLE || 0, color: '#2f8f5b' },
    { label: 'Đang mượn', value: statusCounts.BORROWED || 0, color: '#a87532' },
    { label: 'Mất/Hỏng', value: (statusCounts.LOST || 0) + (statusCounts.DAMAGED || 0), color: '#c1452f' },
  ];
  const kpis = [
    { label: 'Tổng đầu sách', value: metrics.totalBooks, icon: Library },
    { label: 'Tổng bản sao', value: metrics.totalCopies, icon: Copy },
    { label: 'Khả dụng', value: availability[0].value, icon: CheckCircle2 },
    { label: 'Đang mượn', value: availability[1].value, icon: BookMarked },
    { label: 'Mất / Hỏng', value: availability[2].value, icon: AlertTriangle },
  ];
  const lowBooks = metrics.lowStockBooks || [];

  return (
    <AppLayout
      active="inventory-report"
      title="Báo cáo tồn kho"
      subtitle="Tổng hợp tình trạng bản sao và các đầu sách có tồn kho thấp."
      actions={<button className="btn btn-outline" onClick={() => loadReport(categoryId)} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      {notice && <DataNotice type={noticeType} title={noticeType === 'error' ? 'Không thể tải báo cáo' : 'Đã tải dữ liệu'}>{notice}</DataNotice>}
      <form onSubmit={applyCategoryFilter}>
        <DataToolbar
          filters={(
            <div className="field">
              <label htmlFor="inventory-category">Thể loại</label>
              <select
                id="inventory-category"
                className="select"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">Tất cả thể loại</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          )}
          actions={(
            <>
              <button className="btn btn-primary btn-sm" type="submit" disabled={loading}>
                <Filter size={16} /> Lọc
              </button>
              <button
                className="icon-btn"
                type="button"
                onClick={clearCategoryFilter}
                disabled={loading || !categoryId}
                aria-label="Xóa bộ lọc thể loại"
                title="Xóa bộ lọc thể loại"
              >
                <RotateCcw size={17} />
              </button>
            </>
          )}
        />
      </form>
      {loading ? <LoadingBlock rows={4} /> : !report ? (
        <EmptyState icon={AlertTriangle} title="Không có dữ liệu báo cáo">
          Hãy kiểm tra phiên đăng nhập hoặc kết nối backend rồi thử tải lại.
        </EmptyState>
      ) : (
        <>
          <div className="kpi-grid">
            {kpis.map(({ label, value, icon: Icon }) => (
              <div className="kpi-card" key={label}>
                <div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon"><Icon size={18} /></span></div>
                <span className="kpi-value">{fmtNumber(value)}</span>
              </div>
            ))}
          </div>

          <div className="stat-strip">
            <span className="stat-chip"><strong>{fmtNumber(rows.length)}</strong> dòng trên trang {report?.page || 1}</span>
            <span className="stat-chip"><strong>{fmtNumber(totalRows)}</strong> tổng bản sao khớp bộ lọc</span>
            <span className="stat-chip"><strong>{fmtNumber(report?.limit || 20)}</strong> dòng/trang</span>
          </div>

          <div className="split">
            <div className="lib-card">
              <h3 className="lib-card-title">Bản sao theo trạng thái</h3>
              {statusData.length ? <BarChart data={statusData} format={fmtNumber} /> : <EmptyState title="Chưa có dữ liệu trạng thái" />}
            </div>
            <div className="lib-card">
              <h3 className="lib-card-title">Khả dụng vs Đang mượn</h3>
              <DonutChart data={availability} centerLabel="bản sao" centerValue={fmtNumber(metrics.totalCopies)} />
            </div>
          </div>

          <div className="lib-card">
            <h3 className="lib-card-title">Đầu sách cần theo dõi tồn kho</h3>
            <DataTable
              caption="Danh sách sách sắp hết"
              headers={['Sách', 'Mã sách', 'Khả dụng hiệu lực', 'Trạng thái']}
              isEmpty={!lowBooks.length}
              emptyState={<EmptyState icon={Library} title="Không có đầu sách tồn kho thấp" />}
            >
              {lowBooks.map((book, index) => {
                const available = Number(book.effectiveAvailability || 0);
                const key = available === 0 ? 'out' : available <= 2 ? 'low' : 'ok';
                return (
                  <tr key={`${book.bookId || book.title}-${index}`} className={key !== 'ok' ? 'row-overdue' : ''}>
                    <td data-label="Sách"><strong>{book.title || `Sách #${book.bookId}`}</strong></td>
                    <td data-label="Mã sách">#{book.bookId}</td>
                    <td data-label="Khả dụng hiệu lực"><strong>{fmtNumber(available)}</strong></td>
                    <td data-label="Trạng thái"><Badge status={STOCK_BADGE[key].s}>{STOCK_BADGE[key].t}</Badge></td>
                  </tr>
                );
              })}
            </DataTable>
          </div>

          <div className="lib-card">
            <h3 className="lib-card-title">Chi tiết bản sao ({fmtNumber(totalRows)})</h3>
            <DataTable
              caption="Chi tiết báo cáo tồn kho"
              headers={['Sách', 'Bản sao', 'Barcode', 'Vị trí', 'Trạng thái', 'Khả dụng hiệu lực']}
              isEmpty={!rows.length}
              emptyState={<EmptyState icon={Copy} title="Không có bản sao khớp bộ lọc" />}
            >
              {rows.map((row) => (
                <tr key={row.copyId}>
                  <td data-label="Sách"><strong>{row.title || `Sách #${row.bookId}`}</strong></td>
                  <td data-label="Bản sao">#{row.copyId}</td>
                  <td data-label="Barcode">{row.barcode || '-'}</td>
                  <td data-label="Vị trí">{row.location || '-'}</td>
                  <td data-label="Trạng thái"><Badge status={row.status}>{getStatusLabel(row.status)}</Badge></td>
                  <td data-label="Khả dụng hiệu lực">{fmtNumber(row.effectiveAvailability)}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </>
      )}
    </AppLayout>
  );
}
