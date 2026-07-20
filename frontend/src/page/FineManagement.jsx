import { useCallback, useEffect, useState } from 'react';
import {
  Calculator,
  Check,
  CreditCard,
  Filter,
  RefreshCw,
  ReceiptText,
  Search,
  ShieldCheck,
  WalletCards,
  XCircle,
} from 'lucide-react';

import { fineApi } from '../api/libraryFeatureApi';
import AppLayout from '../component/layout/AppLayout';
import { Badge, DataNotice, EmptyState, Toast, useToast } from '../component/shared/Feedback';
import { DataTable, DataToolbar } from '../component/shared/OperationalPatterns';
import { FINE_LIST_PAGE_SIZE, buildFineListParams } from '../utils/fineListQuery';
import { getStatusLabel } from '../utils/uiLabels';
import '../styles/fine-management.css';

const STATUS_OPTIONS = [
  ['ALL', 'Tất cả phiếu phạt'],
  ['UNPAID', 'Chưa thanh toán'],
  ['PAID', 'Đã thanh toán'],
  ['WAIVED', 'Đã miễn'],
  ['CANCELLED', 'Đã hủy'],
];

const SECTIONS = [
  { key: 'list', label: 'Danh sách phiếu phạt', icon: ReceiptText },
  { key: 'calculate', label: 'Tính tiền phạt', icon: Calculator },
  { key: 'collect', label: 'Ghi nhận thu tiền', icon: CreditCard },
  { key: 'paid', label: 'Đánh dấu đã thanh toán', icon: Check },
];

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function getRoles() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return raw ? (JSON.parse(raw).roles || []).map((role) => String(role).toUpperCase()) : [];
  } catch {
    return [];
  }
}

export default function FineManagement() {
  const [activeSection, setActiveSection] = useState('list');
  const [fines, setFines] = useState([]);
  const [selectedFineId, setSelectedFineId] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: FINE_LIST_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [borrowDetailId, setBorrowDetailId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [collectionNote, setCollectionNote] = useState('');
  const [resolutionReason, setResolutionReason] = useState('');
  const [toast, showToast, clearToast] = useToast();
  const isAdmin = getRoles().includes('ADMIN');

  const loadFines = useCallback(async ({
    pageNumber = page,
    nextQuery = query,
    nextStatus = statusFilter,
  } = {}) => {
    setLoading(true);
    setNotice('');
    try {
      const result = await fineApi.list(buildFineListParams({
        page: pageNumber,
        query: nextQuery,
        status: nextStatus,
      }));
      const next = result.fines || [];
      const nextPagination = {
        page: Number(result.page || pageNumber),
        limit: Number(result.limit || FINE_LIST_PAGE_SIZE),
        total: Number(result.total || 0),
        totalPages: Number(result.totalPages || 0),
      };

      if (nextPagination.totalPages > 0 && pageNumber > nextPagination.totalPages) {
        setPage(nextPagination.totalPages);
        return;
      }

      setFines(next);
      setPagination(nextPagination);
      setSelectedFineId((current) => next.some((fine) => String(fine.fineId) === String(current)) ? current : String(next[0]?.fineId || ''));
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
    } catch (error) {
      setFines([]);
      setPagination({
        page: pageNumber,
        limit: FINE_LIST_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
      setSelectedFineId('');
      setNotice(error.message || 'Không thể tải danh sách phiếu phạt.');
    } finally {
      setLoading(false);
    }
  }, [page, query, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(loadFines, 0);
    return () => window.clearTimeout(timer);
  }, [loadFines]);

  const totalPages = Math.max(1, pagination.totalPages || 0);
  const safePage = Math.min(pagination.page || page, totalPages);
  const pageRows = fines;
  const selectedFine = fines.find((fine) => String(fine.fineId) === String(selectedFineId)) || null;
  const unpaidFines = fines.filter((fine) => fine.status === 'UNPAID');
  const paidFines = fines.filter((fine) => fine.status === 'PAID');

  async function runMutation(action, successMessage) {
    setLoading(true);
    setNotice('');
    try {
      const result = await action();
      await loadFines();
      if (result?.fine?.fineId) setSelectedFineId(String(result.fine.fineId));
      showToast(successMessage, 'success');
      return true;
    } catch (error) {
      setNotice(error.message || 'Không thể xử lý phiếu phạt.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleCalculate(event) {
    event.preventDefault();
    if (!Number.isInteger(Number(borrowDetailId)) || Number(borrowDetailId) <= 0) {
      setNotice('Mã chi tiết mượn phải là số nguyên dương.');
      return;
    }
    const ok = await runMutation(() => fineApi.calculate(Number(borrowDetailId)), 'Đã tính tiền phạt từ dữ liệu mượn trả.');
    if (ok) setActiveSection('list');
  }

  async function handlePayment(event, mode) {
    event.preventDefault();
    if (!selectedFine || selectedFine.status !== 'UNPAID') {
      setNotice('Vui lòng chọn một phiếu chưa thanh toán.');
      return;
    }
    if (!paymentMethod.trim()) {
      setNotice('Phương thức thanh toán là bắt buộc.');
      return;
    }
    const apiCall = mode === 'collect'
      ? () => fineApi.collect(selectedFine.fineId, { paymentMethod: paymentMethod.trim(), note: collectionNote.trim() })
      : () => fineApi.markPaid(selectedFine.fineId, { paymentMethod: paymentMethod.trim(), note: collectionNote.trim() });
    const message = mode === 'collect' ? 'Đã ghi nhận thu đủ tiền và cập nhật phiếu.' : 'Đã đánh dấu phiếu phạt là đã thanh toán.';
    if (await runMutation(apiCall, message)) setActiveSection('list');
  }

  async function handleResolve(type) {
    if (!selectedFine || selectedFine.status !== 'UNPAID') return;
    const reason = resolutionReason.trim();
    if (!reason || reason.length > 500) {
      setNotice('Lý do phải có từ 1 đến 500 ký tự.');
      return;
    }
    const action = type === 'waive'
      ? () => fineApi.waive(selectedFine.fineId, reason)
      : () => fineApi.cancel(selectedFine.fineId, reason);
    if (await runMutation(action, type === 'waive' ? 'Đã miễn phiếu phạt.' : 'Đã hủy phiếu phạt.')) setResolutionReason('');
  }

  return (
    <AppLayout
      active="fine-management"
      title="Quản lí tiền phạt"
      subtitle="Tính phạt, ghi nhận thu tiền và theo dõi trạng thái theo dữ liệu mượn trả."
      actions={<button type="button" className="btn btn-outline" onClick={loadFines} disabled={loading}><RefreshCw size={16} /> {loading ? 'Đang tải...' : 'Tải lại'}</button>}
    >
      {notice && <DataNotice type="error" title="Không thể xử lý">{notice}</DataNotice>}

      <div className="tabs fine-workflow-tabs" aria-label="Quy trình quản lý tiền phạt">
        {SECTIONS.map((item, index) => {
          const Icon = item.icon;
          return <button type="button" key={item.key} className={`tab${activeSection === item.key ? ' active' : ''}`} onClick={() => setActiveSection(item.key)}><span>{index + 1}</span><Icon size={15} /> {item.label}</button>;
        })}
      </div>

      <div className="fine-policy">
        <ShieldCheck size={21} />
        <div><strong>Quy trình FE09</strong><span>Tiền phạt được máy chủ tính từ hạn trả và ngày trả. Phiếu đã thanh toán, miễn hoặc hủy không được sửa hay xóa.</span></div>
      </div>

      <section className="fine-stats">
        <div className="fine-stat danger"><div><WalletCards size={20} /></div><span>Chưa thu trên trang</span><strong>{formatCurrency(unpaidFines.reduce((sum, fine) => sum + fine.amount, 0))}</strong></div>
        <div className="fine-stat warning"><div><ReceiptText size={20} /></div><span>Chưa thanh toán trên trang</span><strong>{unpaidFines.length}</strong></div>
        <div className="fine-stat success"><div><Check size={20} /></div><span>Đã thanh toán trên trang</span><strong>{paidFines.length}</strong></div>
        <div className="fine-stat neutral"><div><Calculator size={20} /></div><span>Mức phạt</span><strong>5.000 đ/ngày</strong></div>
      </section>

      {activeSection === 'list' && (
        <section className="fine-grid">
          <div className="fine-panel fine-list-panel">
            <div className="fine-panel-head"><div><p>Theo dõi phiếu phạt</p><h2>Danh sách phiếu phạt</h2></div><span className="muted">{lastUpdated && `Cập nhật lúc ${lastUpdated}`}</span></div>
            <form onSubmit={(event) => { event.preventDefault(); setQuery(queryInput.trim()); setPage(1); }}>
              <DataToolbar
                primary={<div className="search-input"><Search size={18} /><input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Tìm mã phiếu, thành viên, sách, barcode..." aria-label="Tìm phiếu phạt" /></div>}
                filters={<div className="row-flex"><Filter size={17} /><select className="select" aria-label="Lọc trạng thái" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>}
                actions={<button type="submit" className="btn btn-primary"><Search size={16} /> Tìm kiếm</button>}
              />
            </form>
            <DataTable
              caption="Danh sách phiếu phạt"
              headers={['Mã phiếu', 'Thành viên', 'Sách / barcode', 'Quá hạn', 'Số tiền', 'Trạng thái']}
              isEmpty={!pageRows.length}
              emptyState={<EmptyState icon={ReceiptText} title="Không có phiếu phạt phù hợp" />}
            >
              {pageRows.map((fine) => (
                <tr key={fine.fineId} className={String(fine.fineId) === String(selectedFineId) ? 'selected' : ''} onClick={() => setSelectedFineId(String(fine.fineId))}>
                  <td data-label="Mã phiếu">#{fine.fineId}</td>
                  <td data-label="Thành viên"><strong>{fine.member?.fullName || fine.member?.username || `Người dùng #${fine.userId}`}</strong></td>
                  <td data-label="Sách / barcode"><strong>{fine.bookTitle || `Chi tiết mượn #${fine.borrowDetailId}`}</strong><span className="field-hint">{fine.barcode || '—'}</span></td>
                  <td data-label="Quá hạn">{fine.overdueDays} ngày</td>
                  <td data-label="Số tiền">{formatCurrency(fine.amount)}</td>
                  <td data-label="Trạng thái"><Badge status={fine.status}>{getStatusLabel(fine.status)}</Badge></td>
                </tr>
              ))}
            </DataTable>
            <div className="pagination" aria-label="Phân trang phiếu phạt"><span>Trang {safePage}/{totalPages} • {pagination.total} phiếu</span><div className="page-controls"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1}>Trước</button><span className="active">{safePage}</span><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={safePage === totalPages}>Sau</button></div></div>
          </div>
          <FineDetail fine={selectedFine} isAdmin={isAdmin} reason={resolutionReason} setReason={setResolutionReason} onResolve={handleResolve} loading={loading} />
        </section>
      )}

      {activeSection === 'calculate' && (
        <section className="fine-section-layout">
          <form className="fine-panel fine-form-panel" onSubmit={handleCalculate}>
            <div className="fine-panel-head"><div><p>Bước 2</p><h2>Tính tiền phạt</h2></div><Calculator size={24} /></div>
            <p className="muted">Nhập mã chi tiết mượn. Máy chủ sẽ lấy ngày đến hạn, ngày trả và tự tính số ngày quá hạn.</p>
            <label>Mã chi tiết mượn<input type="number" min="1" value={borrowDetailId} onChange={(event) => setBorrowDetailId(event.target.value)} placeholder="Ví dụ: 5" /></label>
            <button type="submit" disabled={loading}><Calculator size={17} /> Tính từ dữ liệu mượn trả</button>
          </form>
          <div className="fine-panel fine-guide-panel"><h2>Nguyên tắc tính</h2><ol><li>Chỉ Librarian/Admin được thực hiện.</li><li>Mức phạt là 5.000 đ cho mỗi ngày quá hạn.</li><li>Không tạo phiếu nếu sách không quá hạn.</li><li>Không tạo trùng phiếu đang chưa thanh toán.</li></ol></div>
        </section>
      )}

      {(activeSection === 'collect' || activeSection === 'paid') && (
        <section className="fine-section-layout">
          <form className="fine-panel fine-form-panel" onSubmit={(event) => handlePayment(event, activeSection)}>
            <div className="fine-panel-head"><div><p>{activeSection === 'collect' ? 'Bước 3' : 'Bước 4'}</p><h2>{activeSection === 'collect' ? 'Ghi nhận thu tiền' : 'Đánh dấu đã thanh toán'}</h2></div><CreditCard size={24} /></div>
            <label>Phiếu chưa thanh toán<select value={selectedFine?.status === 'UNPAID' ? selectedFineId : ''} onChange={(event) => setSelectedFineId(event.target.value)}><option value="">Chọn phiếu phạt</option>{unpaidFines.map((fine) => <option key={fine.fineId} value={fine.fineId}>#{fine.fineId} — {fine.member?.fullName || fine.member?.username} — {formatCurrency(fine.amount)}</option>)}</select></label>
            <label>Phương thức thanh toán<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="CASH">Tiền mặt</option><option value="BANK_TRANSFER">Chuyển khoản</option><option value="CARD">Thẻ</option></select></label>
            <label>Ghi chú<textarea rows="3" maxLength="500" value={collectionNote} onChange={(event) => setCollectionNote(event.target.value)} placeholder="Ghi chú nghiệp vụ (không bắt buộc)" /></label>
            <button type="submit" disabled={loading || !selectedFine || selectedFine.status !== 'UNPAID'}><Check size={17} /> Xác nhận thu đủ {selectedFine?.status === 'UNPAID' ? formatCurrency(selectedFine.amount) : ''}</button>
          </form>
          <FineDetail fine={selectedFine} compact />
        </section>
      )}

      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}

function FineDetail({ fine, compact = false, isAdmin = false, reason = '', setReason, onResolve, loading = false }) {
  return (
    <aside className={`fine-panel fine-detail-panel ${compact ? 'compact' : ''}`}>
      <div className="fine-panel-head"><div><p>Phiếu đang chọn</p><h2>{fine ? `Phiếu phạt #${fine.fineId}` : 'Chưa chọn phiếu'}</h2></div>{fine && <Badge status={fine.status}>{getStatusLabel(fine.status)}</Badge>}</div>
      {fine ? <><div className="fine-detail-card"><div><span>Thành viên</span><strong>{fine.member?.fullName || fine.member?.username}</strong><small>{fine.member?.email}</small></div><div><span>Sách</span><strong>{fine.bookTitle || '—'}</strong><small>{fine.barcode || '—'}</small></div></div><dl className="fine-details"><div><dt>Chi tiết mượn</dt><dd>#{fine.borrowDetailId}</dd></div><div><dt>Quá hạn</dt><dd>{fine.overdueDays} ngày</dd></div><div><dt>Mức/ngày</dt><dd>{formatCurrency(fine.ratePerDay)}</dd></div><div><dt>Tổng tiền</dt><dd><strong>{formatCurrency(fine.amount)}</strong></dd></div><div><dt>Đã thu</dt><dd>{formatCurrency(fine.paidAmount)}</dd></div><div><dt>Ngày tính</dt><dd>{formatDate(fine.calculatedAt)}</dd></div><div><dt>Ngày thanh toán</dt><dd>{formatDate(fine.paidAt)}</dd></div></dl>{isAdmin && fine.status === 'UNPAID' && setReason && <div className="fine-admin-resolution"><label>Lý do miễn/hủy<textarea value={reason} maxLength="500" onChange={(event) => setReason(event.target.value)} /></label><div><button type="button" className="btn btn-outline" disabled={loading} onClick={() => onResolve('waive')}><ShieldCheck size={15} /> Miễn phạt</button><button type="button" className="btn btn-danger" disabled={loading} onClick={() => onResolve('cancel')}><XCircle size={15} /> Hủy phiếu</button></div></div>}</> : <EmptyState icon={ReceiptText} title="Chọn một phiếu để xem chi tiết" />}
    </aside>
  );
}
