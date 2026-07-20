/** FE07 - UC33 - Process Returns (Librarian). */

import { useEffect, useState } from 'react';
import { PackageCheck, AlertTriangle, CheckCircle2, Search, RefreshCw, X, UserRound, Mail, Phone, Hash, MapPin, CalendarDays, Barcode, ClipboardCheck } from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, ConfirmAction, Badge, DataNotice, EmptyState } from '../../component/shared/Feedback';
import { DataTable } from '../../component/shared/OperationalPatterns';
import { fmtDate, mapBorrowRequestsToReturnRows } from '../../utils/libraryFeatureViewModels';

const CONDITION_LABELS = { NORMAL: 'Tốt • không hư hỏng', DAMAGED: 'Hư hỏng', LOST: 'Mất sách' };
const PAGE_SIZE = 8;

function daysOverdue(due) {
  if (!due) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(due);
  date.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - date) / 86400000);
  return diff > 0 ? diff : 0;
}

function normalizeSearchValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replaceAll('đ', 'd')
    .replaceAll('Đ', 'd')
    .toLocaleLowerCase('vi-VN');
}

export default function ProcessReturnsPage() {
  const [loans, setLoans] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returning, setReturning] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [condition, setCondition] = useState('NORMAL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, showToast, clearToast] = useToast();

  async function loadLoans({ announce = false } = {}) {
    setLoading(true);
    setNotice(null);
    try {
      const data = await borrowingApi.listAll({ status: 'APPROVED' });
      const mapped = mapBorrowRequestsToReturnRows(data.borrowRequests || [])
        .sort((left, right) => Number(left.borrowDetailId) - Number(right.borrowDetailId));
      setLoans(mapped);
      setSelectedId((currentId) => mapped.some((loan) => loan.id === currentId) ? currentId : (mapped[0]?.id || null));
      setLastUpdated(new Date());
      if (announce) showToast('Đã tải lại danh sách sách đang mượn.', 'success');
      return true;
    } catch (error) {
      setLoans([]);
      setSelectedId(null);
      setNotice(error.message);
      if (announce) showToast(error.message, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadLoans(); }, 0);
    return () => window.clearTimeout(timer);
    // Initial load intentionally uses the stable API client and default loader options.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedQuery = normalizeSearchValue(searchQuery);
  const filteredLoans = normalizedQuery
    ? loans.filter((loan) => [loan.id, loan.requestId, loan.member, loan.memberId, loan.username, loan.email, loan.phone, loan.book, loan.author, loan.copyId, loan.barcode, loan.location]
      .some((value) => normalizeSearchValue(value).includes(normalizedQuery)))
    : loans;
  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedLoans = filteredLoans.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = filteredLoans.find((loan) => loan.id === selectedId) || pagedLoans[0] || null;
  const overdueDays = selected ? daysOverdue(selected.dueDate) : 0;
  const needsFineReview = overdueDays > 0 || condition !== 'NORMAL';
  const overdueCount = loans.filter((loan) => daysOverdue(loan.dueDate) > 0).length;

  function handleSearch(event) {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  }

  function clearSearch() {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  }

  function changePage(nextPage) {
    const normalizedPage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(normalizedPage);
    setSelectedId(filteredLoans[(normalizedPage - 1) * PAGE_SIZE]?.id || null);
    setCondition('NORMAL');
  }

  async function confirmReturn() {
    if (!returnTarget || returning) return;
    setReturning(true);
    try {
      const returnedBook = returnTarget.book;
      const result = await borrowingApi.returnDetail(returnTarget.borrowDetailId, { condition });
      setCondition('NORMAL');
      setReturnTarget(null);
      await loadLoans();
      showToast(
        result.fineCandidate?.needsFineReview
          ? `Đã ghi nhận trả "${returnedBook}". Giao dịch có dữ liệu cần xem xét tiền phạt.`
          : `Đã ghi nhận trả "${returnedBook}".`,
        'success',
      );
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setReturning(false);
    }
  }

  return (
    <AppLayout
      active="process-returns"
      title="Xử lý trả sách"
      subtitle="Kiểm tra giao dịch, tình trạng bản sao và ghi nhận sách được trả."
      actions={<button className="btn btn-outline" onClick={() => loadLoans({ announce: true })} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> {loading ? 'Đang tải...' : 'Tải lại'}</button>}
    >
      {notice && <DataNotice type="error" title="Không thể tải sách đang mượn">{notice}</DataNotice>}

      <section className="return-toolbar" aria-label="Tìm kiếm sách đang mượn">
        <div className="return-summary">
          <span><strong>{filteredLoans.length}</strong> đang mượn</span>
          <span className="muted">{lastUpdated ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}` : 'Đang cập nhật dữ liệu'}</span>
        </div>
        <form className="return-search" role="search" onSubmit={handleSearch}>
          <div className="return-search-field">
            <label className="sr-only" htmlFor="return-search-input">Tìm giao dịch trả sách</label>
            <Search size={17} />
            <input id="return-search-input" className="input" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm thành viên, sách, barcode..." />
            {searchInput && <button type="button" className="icon-btn" aria-label="Xóa từ khóa" onClick={clearSearch}><X size={16} /></button>}
          </div>
          <button type="submit" className="btn btn-primary"><Search size={16} /> Tìm kiếm</button>
        </form>
        <Badge status={overdueCount > 0 ? 'Overdue' : 'Available'}><AlertTriangle size={13} /> {overdueCount} quá hạn</Badge>
      </section>

      <div className="split return-workspace">
        <div className="return-list-card">
          <DataTable
            caption="Danh sách sách đang mượn cần xử lý trả"
            headers={['Mã lượt', 'Thành viên', 'Sách / Bản sao', 'Ngày mượn', 'Hạn trả', 'Quá hạn', 'Thao tác']}
            loading={loading}
            isEmpty={filteredLoans.length === 0}
            emptyState={<EmptyState icon={PackageCheck} title={normalizedQuery ? 'Không tìm thấy giao dịch phù hợp' : 'Không có sách đang được mượn'} />}
          >
            {pagedLoans.map((loan) => {
              const overdue = daysOverdue(loan.dueDate);
              return (
                <tr
                  key={loan.id}
                  className={`${overdue > 0 ? 'row-overdue' : ''} ${loan.id === selected?.id ? 'is-selected' : ''}`.trim()}
                  tabIndex={0}
                  aria-label={`Chọn giao dịch ${loan.id}`}
                  aria-selected={loan.id === selected?.id}
                  onClick={() => { setSelectedId(loan.id); setCondition('NORMAL'); }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedId(loan.id);
                      setCondition('NORMAL');
                    }
                  }}
                >
                  <td data-label="Mã lượt"><strong>#{loan.borrowDetailId}</strong></td>
                  <td data-label="Thành viên"><div className="stack-sm"><strong>{loan.member}</strong><span className="muted">{loan.username}</span></div></td>
                  <td data-label="Sách / Bản sao"><div className="stack-sm"><strong>{loan.book}</strong><span className="muted">{loan.barcode} • Bản sao #{loan.copyId}</span></div></td>
                  <td data-label="Ngày mượn">{fmtDate(loan.borrowDate)}</td>
                  <td data-label="Hạn trả">{fmtDate(loan.dueDate)}</td>
                  <td data-label="Quá hạn">{overdue > 0 ? <Badge status="Overdue">{overdue} ngày</Badge> : <Badge status="Available">Đúng hạn</Badge>}</td>
                  <td data-label="Thao tác">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={(event) => { event.stopPropagation(); setSelectedId(loan.id); setCondition('NORMAL'); }}
                    >
                      <ClipboardCheck size={14} /> Xử lý trả
                    </button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
          {!loading && filteredLoans.length > 0 && (
            <nav className="pagination return-pagination" aria-label="Phân trang sách đang mượn">
              <span className="muted">Trang {currentPage}/{totalPages} • {filteredLoans.length} giao dịch</span>
              <div className="page-controls">
                <button type="button" className="page-btn" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>Trước</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" className={`page-btn ${pageNumber === currentPage ? 'active' : ''}`} key={pageNumber} aria-current={pageNumber === currentPage ? 'page' : undefined} onClick={() => changePage(pageNumber)}>{pageNumber}</button>)}
                <button type="button" className="page-btn" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>Sau</button>
              </div>
            </nav>
          )}
        </div>

        <aside className="panel return-detail" aria-label="Chi tiết giao dịch trả sách">
          {selected ? (
            <>
              <div className="return-detail-heading">
                <div className="app-avatar">{String(selected.member).slice(0, 1)}</div>
                <div><h3>{selected.member}</h3><span className="muted">Lượt #{selected.borrowDetailId} • Yêu cầu #{selected.requestId}</span></div>
                {overdueDays > 0 ? <Badge status="Overdue">Quá hạn</Badge> : <Badge status="Available">Đúng hạn</Badge>}
              </div>
              <div className="info-list return-member-info">
                <div className="info-row"><Hash size={16} /><span className="muted">Mã hội viên:</span> <strong>{selected.memberId}</strong></div>
                <div className="info-row"><UserRound size={16} /><span>{selected.username}</span></div>
                <div className="info-row"><Mail size={16} /><span>{selected.email}</span></div>
                <div className="info-row"><Phone size={16} /><span>{selected.phone}</span></div>
              </div>
              <article className="return-book-card">
                <span className="book-spine" />
                <div className="stack-sm"><strong>{selected.book}</strong><span className="muted">{selected.author}</span><span className="muted"><Barcode size={13} /> {selected.barcode} • Bản sao #{selected.copyId}</span><span className="muted"><MapPin size={13} /> {selected.location}</span></div>
              </article>
              <div className="return-dates">
                <span><CalendarDays size={16} /><small>Ngày mượn</small><strong>{fmtDate(selected.borrowDate)}</strong></span>
                <span><CalendarDays size={16} /><small>Hạn trả</small><strong>{fmtDate(selected.dueDate)}</strong></span>
                <span className={overdueDays > 0 ? 'is-overdue' : ''}><AlertTriangle size={16} /><small>Quá hạn</small><strong>{overdueDays > 0 ? `${overdueDays} ngày` : 'Đúng hạn'}</strong></span>
              </div>
              <div className="field return-condition"><label htmlFor="return-condition">Tình trạng sách khi trả</label><select id="return-condition" className="select" value={condition} onChange={(event) => setCondition(event.target.value)}><option value="NORMAL">Tốt • không hư hỏng</option><option value="DAMAGED">Hư hỏng</option><option value="LOST">Mất sách</option></select></div>
              <div className={`alert-box ${needsFineReview ? 'warn' : 'info'}`}><span>{needsFineReview ? `Cần xem xét tiền phạt: ${overdueDays} ngày quá hạn, tình trạng ${CONDITION_LABELS[condition]}.` : 'Không có dấu hiệu quá hạn, hư hỏng hoặc mất sách.'}</span></div>
              <button className="btn btn-primary return-submit" onClick={() => setReturnTarget(selected)}><CheckCircle2 size={18} /> Xác nhận trả sách</button>
            </>
          ) : <EmptyState icon={PackageCheck} title="Chọn một sách để xác nhận trả" />}
        </aside>
      </div>

      {returnTarget && (
        <ConfirmAction eyebrow="Trả sách" title="Xác nhận trả sách" confirmLabel="Ghi nhận trả sách" pending={returning} onCancel={() => setReturnTarget(null)} onConfirm={confirmReturn}>
          <div className="info-list"><div className="info-row"><span className="muted">Thành viên:</span> <strong>{returnTarget.member}</strong></div><div className="info-row"><span className="muted">Sách:</span> <strong>{returnTarget.book}</strong></div><div className="info-row"><span className="muted">Bản sao:</span> <strong>#{returnTarget.copyId} • {returnTarget.barcode}</strong></div><div className="info-row"><span className="muted">Tình trạng:</span> <strong>{CONDITION_LABELS[condition]}</strong></div></div>
          {(daysOverdue(returnTarget.dueDate) > 0 || condition !== 'NORMAL') && <div className="alert-box warn" style={{ marginTop: 16 }}>Giao dịch này sẽ trả về dữ liệu để phân hệ tiền phạt xem xét sau khi ghi nhận trả thành công.</div>}
        </ConfirmAction>
      )}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
