import { BookCopy, FileDown, RefreshCw, RotateCcw, Search, Undo2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminApi } from '../../../api/adminApi';
import { borrowingApi } from '../../../api/libraryFeatureApi';
import { downloadDocx } from '../../../utils/adminDocxExport';
import { createLatestRequestGuard } from '../../../utils/latestRequestGuard';
import { getStatusLabel } from '../../../utils/uiLabels';
import { AdminActionButton } from '../components/AdminActionButton';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminFilterBar } from '../components/AdminFilterBar';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPagination } from '../components/AdminPagination';

const PAGE_SIZE = 8;
const BORROWING_STATUSES = ['ALL', 'REQUESTED', 'BORROWED', 'RETURNED', 'OVERDUE', 'LOST', 'DAMAGED'];
const BORROWING_DOCX_COLUMNS = [
  { key: 'id', label: 'Mã lượt' }, { key: 'requestId', label: 'Mã yêu cầu' },
  { key: 'memberName', label: 'Thành viên' }, { key: 'bookTitle', label: 'Sách' },
  { key: 'barcode', label: 'Barcode' }, { key: 'borrowDate', label: 'Ngày mượn' },
  { key: 'dueDate', label: 'Ngày hạn' }, { key: 'returnDate', label: 'Ngày trả' },
  { key: 'renewalCount', label: 'Số lần gia hạn' }, { key: 'status', label: 'Trạng thái' },
];

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ReturnModal({ borrowing, saving, condition, onConditionChange, onClose, onSubmit }) {
  return (
    <div className="admin-modal-backdrop" onMouseDown={() => { if (!saving) onClose(); }}>
      <div className="admin-modal admin-modal--compact" role="dialog" aria-modal="true" aria-labelledby="admin-return-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal__header"><div><p>FE07 · Trả sách</p><h2 id="admin-return-title">Xác nhận trả sách</h2></div><button type="button" disabled={saving} onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button></header>
        <div className="admin-modal__body admin-modal__body--single admin-request-detail"><p><strong>Thành viên</strong><span>{borrowing.memberName}</span></p><p><strong>Sách</strong><span>{borrowing.bookTitle} ({borrowing.barcode})</span></p><label className="admin-field"><span>Tình trạng sách</span><select value={condition} onChange={(event) => onConditionChange(event.target.value)}><option value="NORMAL">Bình thường</option><option value="DAMAGED">Hư hỏng</option><option value="LOST">Mất sách</option></select></label></div>
        <footer className="admin-modal__actions"><button type="button" disabled={saving} onClick={onClose}>Hủy</button><button className="admin-modal__primary" type="button" disabled={saving} onClick={onSubmit}>{saving ? 'Đang xử lý...' : 'Ghi nhận trả sách'}</button></footer>
      </div>
    </div>
  );
}

export function AdminCirculationSection({ onToast, onOpenRequests }) {
  const requestGuard = useRef(createLatestRequestGuard());
  const [borrowings, setBorrowings] = useState([]);
  const [filters, setFilters] = useState({ q: '', status: 'ALL' });
  const [appliedFilters, setAppliedFilters] = useState({ q: '', status: 'ALL' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [page, setPage] = useState(1);
  const [borrowingAction, setBorrowingAction] = useState(null);
  const [returnCondition, setReturnCondition] = useState('NORMAL');
  const [actionSaving, setActionSaving] = useState(false);

  const notify = useCallback((type, message) => onToast?.({ type, message }), [onToast]);

  const loadBorrowings = useCallback(async ({ announce = false } = {}) => {
    const token = requestGuard.current.begin();
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.borrowings({
        q: appliedFilters.q.trim(),
        status: appliedFilters.status === 'ALL' ? '' : appliedFilters.status,
      });
      if (!requestGuard.current.isLatest(token)) return;
      setBorrowings(result.data || []);
      setPage(1);
      setUpdatedAt(new Date());
      if (announce) notify('success', 'Đã làm mới dữ liệu mượn trả.');
    } catch (loadError) {
      if (!requestGuard.current.isLatest(token)) return;
      setBorrowings([]);
      setError(loadError.message);
      notify('error', loadError.message);
    } finally {
      if (requestGuard.current.isLatest(token)) setLoading(false);
    }
  }, [appliedFilters.q, appliedFilters.status, notify]);

  useEffect(() => {
    const timer = window.setTimeout(loadBorrowings, 0);
    return () => window.clearTimeout(timer);
  }, [loadBorrowings]);

  async function renewBorrowing(row) {
    if (!row || row.status !== 'BORROWED' || Number(row.renewalCount) >= 1) return;
    if (!window.confirm(`Gia hạn sách “${row.bookTitle}” thêm 14 ngày?`)) return;
    setActionSaving(true);
    try {
      await borrowingApi.renewDetail(row.id);
      await loadBorrowings();
      notify('success', 'Đã gia hạn lượt mượn.');
    } catch (renewError) {
      notify('error', renewError.message);
    } finally {
      setActionSaving(false);
    }
  }

  async function returnBorrowing() {
    if (!borrowingAction || actionSaving) return;
    setActionSaving(true);
    try {
      const result = await borrowingApi.returnDetail(borrowingAction.id, { condition: returnCondition });
      setBorrowingAction(null);
      setReturnCondition('NORMAL');
      await loadBorrowings();
      notify('success', result.fineCandidate?.needsFineReview
        ? 'Đã ghi nhận trả sách; dữ liệu đã được chuyển cho phần xem xét tiền phạt.'
        : 'Đã ghi nhận trả sách.');
    } catch (returnError) {
      notify('error', returnError.message);
    } finally {
      setActionSaving(false);
    }
  }

  const pageRows = useMemo(() => borrowings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [borrowings, page]);

  return (
    <section className="admin-circulation">
      <AdminPageHeader eyebrow="FE07 · Vận hành mượn trả" title="Quản lý mượn trả" refreshing={loading} onRefresh={() => loadBorrowings({ announce: true })} primaryAction={<AdminActionButton icon={BookCopy} label="Xử lý yêu cầu" tone="primary" onClick={onOpenRequests} />} />
      <div className="admin-section-status" aria-live="polite"><span>{updatedAt ? `Cập nhật lần cuối lúc ${updatedAt.toLocaleTimeString('vi-VN')}` : 'Chưa tải dữ liệu mượn trả.'}</span>{error ? <strong className="admin-text-error">{error}</strong> : null}</div>
      <AdminFilterBar actions={<><AdminActionButton icon={Search} label="Tìm kiếm" tone="primary" disabled={loading} onClick={() => setAppliedFilters({ ...filters })} /><AdminActionButton icon={FileDown} label="Xuất DOCX" disabled={loading || borrowings.length === 0} onClick={() => downloadDocx('borrowings.docx', 'Danh sách mượn trả', borrowings, BORROWING_DOCX_COLUMNS)} /></>}>
        <label className="admin-field admin-field--search"><span>Tìm giao dịch</span><input value={filters.q} placeholder="Thành viên, sách hoặc barcode" onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} /></label>
        <label className="admin-field"><span>Trạng thái</span><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>{BORROWING_STATUSES.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'Mọi trạng thái' : getStatusLabel(status)}</option>)}</select></label>
      </AdminFilterBar>

      <section className="admin-circulation-directory">
        <div className="admin-table-scroll"><table className="admin-data-table admin-circulation-table"><thead><tr><th>Mã lượt</th><th>Mã yêu cầu</th><th>Thành viên</th><th>Sách</th><th>Barcode</th><th>Ngày mượn</th><th>Ngày hạn</th><th>Ngày trả</th><th>Gia hạn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{pageRows.map((row) => <tr key={row.id}><td>#{row.id}</td><td>#{row.requestId}</td><td><strong>{row.memberName}</strong></td><td>{row.bookTitle}</td><td>{row.barcode || `Bản sao #${row.copyId}`}</td><td>{formatDate(row.borrowDate)}</td><td>{formatDate(row.dueDate)}</td><td>{formatDate(row.returnDate)}</td><td>{row.renewalCount || 0}/1</td><td><span className={`admin-badge admin-badge--borrowing-${String(row.status || '').toLowerCase()}`}>{getStatusLabel(row.status)}</span></td><td><div className="admin-user-actions">{row.status === 'REQUESTED' ? <AdminActionButton icon={BookCopy} label="Xử lý yêu cầu" onClick={onOpenRequests} /> : null}{['BORROWED', 'OVERDUE'].includes(row.status) ? <AdminActionButton icon={Undo2} label="Trả sách" tone="primary" disabled={actionSaving} onClick={() => { setReturnCondition('NORMAL'); setBorrowingAction(row); }} /> : null}{row.status === 'BORROWED' && Number(row.renewalCount) < 1 ? <AdminActionButton icon={RotateCcw} label="Gia hạn" disabled={actionSaving} onClick={() => renewBorrowing(row)} /> : null}{['RETURNED', 'DAMAGED', 'LOST'].includes(row.status) ? <span className="admin-muted-text">Đã hoàn tất</span> : null}</div></td></tr>)}</tbody></table></div>
        {!loading && borrowings.length === 0 ? <AdminEmptyState icon={BookCopy} title="Chưa có giao dịch mượn trả" description="Giao dịch sẽ xuất hiện sau khi thành viên gửi yêu cầu và nhân sự thư viện duyệt đúng quy trình." /> : null}
        {loading && borrowings.length === 0 ? <AdminEmptyState icon={RefreshCw} title="Đang tải dữ liệu mượn trả" description="Dữ liệu đang được đồng bộ." /> : null}
        <AdminPagination page={page} totalItems={borrowings.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </section>

      {borrowingAction ? <ReturnModal borrowing={borrowingAction} saving={actionSaving} condition={returnCondition} onConditionChange={setReturnCondition} onClose={() => setBorrowingAction(null)} onSubmit={returnBorrowing} /> : null}
    </section>
  );
}
