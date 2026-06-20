/** FE07 - UC33 - Process Returns (Librarian). */

import { useEffect, useMemo, useState } from 'react';
import { PackageCheck, AlertTriangle, CheckCircle2, Search, RefreshCw } from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DEMO_BORROW_ROWS, fmtDate, mapBorrowRequestsToReturnRows } from '../../utils/libraryFeatureViewModels';

const CONDITION_LABELS = { NORMAL: 'Tốt • không hư hỏng', DAMAGED: 'Hư hỏng', LOST: 'Mất sách' };
const DEMO_RETURN_ROWS = DEMO_BORROW_ROWS.filter((row) => ['Borrowed', 'Overdue'].includes(row.status)).map((row) => ({ id: `L-${row.borrowDetailId}`, borrowDetailId: row.borrowDetailId, member: 'Nguyen Van An', book: row.title, copyId: row.borrowDetailId, dueDate: row.dueDate }));

function daysOverdue(due) {
  if (!due) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date = new Date(due); date.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - date) / 86400000);
  return diff > 0 ? diff : 0;
}

export default function ProcessReturnsPage() {
  const [loans, setLoans] = useState(DEMO_RETURN_ROWS);
  const [selectedId, setSelectedId] = useState(DEMO_RETURN_ROWS[0]?.id || null);
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('NORMAL');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Đang hiển thị dữ liệu demo để review UI xử lý trả sách.');
  const [isDemo, setIsDemo] = useState(true);
  const [toast, showToast, clearToast] = useToast();

  async function loadLoans() {
    setLoading(true);
    try {
      const data = await borrowingApi.listAll();
      const mapped = mapBorrowRequestsToReturnRows(data.borrowRequests || []);
      setLoans(mapped);
      setSelectedId(mapped[0]?.id || null);
      setIsDemo(false);
      setNotice('Đã kết nối backend thật qua GET /api/borrow-requests và PATCH /api/borrow-details/:id/return.');
    } catch (error) {
      setLoans(DEMO_RETURN_ROWS);
      setSelectedId(DEMO_RETURN_ROWS[0]?.id || null);
      setIsDemo(true);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadLoans(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const rows = useMemo(() => { const q = search.trim().toLowerCase(); return loans.filter((loan) => !q || `${loan.member} ${loan.book}`.toLowerCase().includes(q)); }, [loans, search]);
  const selected = loans.find((loan) => loan.id === selectedId) || null;
  const overdueDays = selected ? daysOverdue(selected.dueDate) : 0;
  const needsFineReview = overdueDays > 0 || condition !== 'NORMAL';

  async function confirmReturn() {
    if (!selected) return;
    try {
      if (!isDemo) await borrowingApi.returnDetail(selected.borrowDetailId, { condition, returnDate: new Date().toISOString().slice(0, 10) });
      setLoans((prev) => prev.filter((loan) => loan.id !== selected.id));
      setSelectedId((prev) => loans.find((loan) => loan.id !== prev)?.id || null);
      setCondition('NORMAL');
      showToast(`Đã ghi nhận trả "${selected.book}". Dữ liệu fine candidate chuyển cho FE09 nếu cần.`, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  return <AppLayout active="process-returns" title="Xử lý trả sách" subtitle="Xác nhận trả sách; FE07 expose dữ liệu để FE09 tính fine." actions={<button className="btn btn-outline" onClick={loadLoans} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}><DataNotice type={isDemo ? 'warn' : 'success'} title={isDemo ? 'Demo fallback' : 'Backend connected'}>{notice}</DataNotice><div className="toolbar"><div className="search-input"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm thành viên hoặc sách..." aria-label="Tìm" /></div><span className="spacer" /><span className="badge badge-overdue"><AlertTriangle size={13} /> {loans.filter((loan) => daysOverdue(loan.dueDate) > 0).length} đang quá hạn</span></div>{loading ? <LoadingBlock rows={4} /> : <div className="split"><div className="lib-table-wrap"><table className="lib-table"><caption className="sr-only">Return processing table</caption><thead><tr><th scope="col">Thành viên</th><th scope="col">Sách</th><th scope="col">Hạn trả</th><th scope="col">Quá hạn</th></tr></thead><tbody>{rows.map((loan) => { const od = daysOverdue(loan.dueDate); return <tr key={loan.id} className={od > 0 ? 'row-overdue' : ''} onClick={() => { setSelectedId(loan.id); setCondition('NORMAL'); }} style={{ cursor: 'pointer', background: loan.id === selectedId ? 'var(--lib-accent-bg)' : undefined }}><td>{loan.member}</td><td><div className="stack-sm"><strong>{loan.book}</strong><span className="muted" style={{ fontSize: 13 }}>Copy {loan.copyId}</span></div></td><td>{fmtDate(loan.dueDate)}</td><td>{od > 0 ? <Badge status="Overdue">{od} ngày</Badge> : <span className="muted">-</span>}</td></tr>; })}</tbody></table>{rows.length === 0 && <EmptyState icon={PackageCheck} title="Không có sách đang được mượn" />}</div><div className="panel">{selected ? <><h3 className="lib-card-title">Xác nhận trả sách</h3><div className="info-list"><div className="info-row"><span className="muted">Thành viên:</span> <strong>{selected.member}</strong></div><div className="info-row"><span className="muted">Sách:</span> <strong>{selected.book}</strong> ({selected.copyId})</div><div className="info-row"><span className="muted">Hạn trả:</span> <strong>{fmtDate(selected.dueDate)}</strong></div><div className="info-row"><span className="muted">Quá hạn:</span> {overdueDays > 0 ? <strong style={{ color: 'var(--st-red)' }}>{overdueDays} ngày</strong> : <strong style={{ color: 'var(--st-green)' }}>Đúng hạn</strong>}</div></div><h4 className="section-title">Tình trạng sách</h4><div className="field"><select className="select" value={condition} onChange={(e) => setCondition(e.target.value)} aria-label="Return condition"><option value="NORMAL">Tốt • không hư hỏng</option><option value="DAMAGED">Hư hỏng</option><option value="LOST">Mất sách</option></select></div><div className={`alert-box ${needsFineReview ? 'warn' : 'info'}`} style={{ marginTop: 16 }}><span>{needsFineReview ? `Cần chuyển FE09 review: ${overdueDays} ngày quá hạn, tình trạng ${CONDITION_LABELS[condition]}.` : 'Không có dấu hiệu quá hạn/hư/mất cần FE09 review.'}</span></div><button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} onClick={confirmReturn}><CheckCircle2 size={18} /> Xác nhận trả</button></> : <EmptyState icon={PackageCheck} title="Chọn một sách để xác nhận trả" />}</div></div>}<Toast toast={toast} onClose={clearToast} /></AppLayout>;
}
