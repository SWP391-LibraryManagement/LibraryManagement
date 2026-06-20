/**
 * FE07 · UC33 — Process Returns (Librarian)
 * Bảng sách đang được mượn (member, sách, hạn trả, số ngày quá hạn).
 * Chọn dòng → panel xác nhận trả: kiểm tra tình trạng, dữ liệu quá hạn/hư/mất chuyển FE09 xử lý.
 * Dòng quá hạn được tô màu cảnh báo.
 */

import { useMemo, useState } from 'react';
import { PackageCheck, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, Badge } from '../../component/shared/Feedback';

const TODAY = new Date('2026-06-15');
const CONDITION_LABELS = {
  NORMAL: 'Tốt - không hư hỏng',
  DAMAGED: 'Hư hỏng',
  LOST: 'Mất sách',
};

const INITIAL = [
  { id: 'L-2001', member: 'Nguyễn Văn An', book: 'Clean Code', copyId: 'C-01', dueDate: '2026-06-16' },
  { id: 'L-2002', member: 'Trần Thị Bình', book: 'The Pragmatic Programmer', copyId: 'C-05', dueDate: '2026-06-03' },
  { id: 'L-2003', member: 'Lê Hoàng Cường', book: 'Refactoring', copyId: 'C-12', dueDate: '2026-06-10' },
  { id: 'L-2004', member: 'Phạm Thu Hà', book: 'Nhà Giả Kim', copyId: 'C-30', dueDate: '2026-06-24' },
];

const fmt = (d) => new Date(d).toLocaleDateString('vi-VN');
function daysOverdue(due) {
  const diff = Math.floor((TODAY - new Date(due)) / 86400000);
  return diff > 0 ? diff : 0;
}

export default function ProcessReturnsPage() {
  const [loans, setLoans] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState(INITIAL[0].id);
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('NORMAL');
  const [toast, showToast, clearToast] = useToast();

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return loans.filter((l) => !q || `${l.member} ${l.book}`.toLowerCase().includes(q));
  }, [loans, search]);

  const selected = loans.find((l) => l.id === selectedId) || null;
  const overdueDays = selected ? daysOverdue(selected.dueDate) : 0;
  const needsFineReview = overdueDays > 0 || condition !== 'NORMAL';

  function confirmReturn() {
    setLoans((prev) => prev.filter((l) => l.id !== selected.id));
    setSelectedId((prev) => {
      const remaining = loans.filter((l) => l.id !== prev);
      return remaining[0]?.id || null;
    });
    setCondition('NORMAL');
    showToast(`Đã ghi nhận trả "${selected.book}". Dữ liệu cần review fine sẽ chuyển cho FE09.`, 'success');
  }

  return (
    <AppLayout
      active="process-returns"
      title="Process Returns"
      subtitle="Xác nhận trả sách và ghi nhận dữ liệu chuyển FE09 nếu cần"
    >
      <div className="toolbar">
        <div className="search-input">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm thành viên hoặc sách..." aria-label="Tìm" />
        </div>
        <span className="spacer" />
        <span className="badge badge-overdue"><AlertTriangle size={13} /> {loans.filter((l) => daysOverdue(l.dueDate) > 0).length} đang quá hạn</span>
      </div>

      <div className="split">
        <div className="lib-table-wrap">
          <table className="lib-table">
            <thead>
              <tr><th>Thành viên</th><th>Sách</th><th>Hạn trả</th><th>Quá hạn</th></tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const od = daysOverdue(l.dueDate);
                return (
                  <tr key={l.id} className={od > 0 ? 'row-overdue' : ''} onClick={() => { setSelectedId(l.id); setCondition('NORMAL'); }} style={{ cursor: 'pointer', background: l.id === selectedId ? 'var(--lib-accent-bg)' : undefined }}>
                    <td>{l.member}</td>
                    <td>
                      <div className="stack-sm"><strong>{l.book}</strong><span className="muted" style={{ fontSize: 13 }}>{l.copyId}</span></div>
                    </td>
                    <td>{fmt(l.dueDate)}</td>
                    <td>{od > 0 ? <Badge status="Overdue">{od} ngày</Badge> : <span className="muted">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty"><PackageCheck size={36} /><p>Không có sách nào đang được mượn.</p></div>}
        </div>

        <div className="panel">
          {selected ? (
            <>
              <h3 className="lib-card-title">Xác nhận trả sách</h3>
              <div className="info-list">
                <div className="info-row"><span className="muted">Thành viên:</span> <strong>{selected.member}</strong></div>
                <div className="info-row"><span className="muted">Sách:</span> <strong>{selected.book}</strong> ({selected.copyId})</div>
                <div className="info-row"><span className="muted">Hạn trả:</span> <strong>{fmt(selected.dueDate)}</strong></div>
                <div className="info-row">
                  <span className="muted">Quá hạn:</span>{' '}
                  {overdueDays > 0 ? <strong style={{ color: 'var(--st-red)' }}>{overdueDays} ngày</strong> : <strong style={{ color: 'var(--st-green)' }}>Đúng hạn</strong>}
                </div>
              </div>

              <h4 className="section-title">Tình trạng sách</h4>
              <div className="field">
                <select className="select" value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="NORMAL">Tốt - không hư hỏng</option>
                  <option value="DAMAGED">Hư hỏng</option>
                  <option value="LOST">Mất sách</option>
                </select>
              </div>

              <div className={`alert-box ${needsFineReview ? 'warn' : 'info'}`} style={{ marginTop: 16 }}>
                <span>
                  {needsFineReview
                    ? `Cần chuyển FE09 review: ${overdueDays} ngày quá hạn, tình trạng ${CONDITION_LABELS[condition]}.`
                    : 'Không có dấu hiệu quá hạn/hư/mất cần FE09 review.'}
                </span>
              </div>
              <p className="field-hint" style={{ marginTop: 8 }}>FE07 chỉ ghi nhận return date và tình trạng sách; FE09 mới tính hoặc tạo fine record.</p>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} onClick={confirmReturn}>
                <CheckCircle2 size={18} /> Confirm Return
              </button>
            </>
          ) : (
            <div className="empty"><PackageCheck size={40} /><p>Chọn một sách để xác nhận trả.</p></div>
          )}
        </div>
      </div>

      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
