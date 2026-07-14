/** FE07 - UC34 - Member Borrowing Details (Librarian). */

import { useState } from 'react';
import { Hash, BookOpen, DollarSign, CalendarClock, BookMarked, RefreshCw } from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { fmtDate, mapBorrowDetailsToMember, vnd } from '../../utils/libraryFeatureViewModels';

export default function MemberBorrowingDetailsPage() {
  const [memberId, setMemberId] = useState('');
  const [memberView, setMemberView] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  async function loadMemberBorrowings() {
    const normalizedMemberId = memberId.trim();
    if (!/^\d+$/.test(normalizedMemberId) || Number(normalizedMemberId) < 1) {
      setMemberView(null);
      setNotice('Vui lòng nhập mã thành viên là một số nguyên dương.');
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const data = await borrowingApi.listMemberBorrowings(normalizedMemberId);
      setMemberView(mapBorrowDetailsToMember(data.borrowings || [], {
        id: normalizedMemberId,
        name: `Thành viên #${normalizedMemberId}`,
      }));
    } catch (error) {
      setMemberView(null);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  const kpis = memberView ? [
    { label: 'Đang mượn', value: memberView.current.length, icon: BookOpen },
    { label: 'Tổng phí phạt', value: memberView.totalFines == null ? '—' : vnd(memberView.totalFines), icon: DollarSign },
    { label: 'Đặt chỗ hoạt động', value: memberView.activeReservations ?? '—', icon: BookMarked },
    { label: 'Lượt mượn (lịch sử)', value: memberView.history.length, icon: CalendarClock },
  ] : [];

  return (
    <AppLayout active="member-details" title="Chi tiết mượn sách của thành viên" subtitle="Tra cứu thông tin mượn/trả của một thành viên.">
      {notice && <DataNotice type="error" title="Không thể tải thông tin thành viên">{notice}</DataNotice>}
      <div className="toolbar">
        <div className="field" style={{ minWidth: 280 }}>
          <label htmlFor="member-id">Mã thành viên</label>
          <div className="search-input" style={{ width: '100%' }}>
            <Hash size={16} />
            <input
              id="member-id"
              inputMode="numeric"
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') loadMemberBorrowings(); }}
              placeholder="Nhập mã thành viên..."
              aria-label="Tìm thành viên"
            />
          </div>
        </div>
        <span className="spacer" />
        <button className="btn btn-outline" onClick={loadMemberBorrowings} disabled={loading || !memberId.trim()}>
          <RefreshCw size={16} /> Tải thông tin
        </button>
      </div>

      {loading ? <LoadingBlock rows={4} /> : memberView ? <>
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-header" style={{ marginBottom: 0 }}>
            <div className="app-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>{memberView.name.slice(0, 1)}</div>
            <div className="stack-sm">
              <h3 className="lib-card-title" style={{ margin: 0 }}>{memberView.name}</h3>
              <span className="muted"><Hash size={14} style={{ verticalAlign: -2 }} /> {memberView.id}</span>
            </div>
          </div>
        </div>
        <div className="kpi-grid">{kpis.map(({ label, value, icon: Icon }) => <div className="kpi-card" key={label}><div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon"><Icon size={18} /></span></div><span className="kpi-value">{value}</span></div>)}</div>
        <PendingTable rows={memberView.pending} />
        <LoanTable title="Sách đang mượn" rows={memberView.current} emptyIcon={BookOpen} empty="Không có sách đang mượn" />
        <LoanTable title="Lịch sử mượn" rows={memberView.history} emptyIcon={CalendarClock} empty="Chưa có lịch sử mượn" history />
      </> : <EmptyState icon={BookOpen} title="Chưa tải thông tin mượn" />}
    </AppLayout>
  );
}

function PendingTable({ rows }) {
  return <div className="lib-card"><h3 className="lib-card-title">Yêu cầu đang chờ</h3><div className="lib-table-wrap"><table className="lib-table"><caption className="sr-only">Yêu cầu đang chờ</caption><thead><tr><th scope="col">Sách</th><th scope="col">Ngày yêu cầu</th><th scope="col">Trạng thái</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.book}-${index}`}><td><strong>{row.book}</strong></td><td>{fmtDate(row.borrowDate)}</td><td><Badge status={row.status} /></td></tr>)}</tbody></table>{rows.length === 0 && <EmptyState icon={BookOpen} title="Không có yêu cầu đang chờ" />}</div></div>;
}

function LoanTable({ title, rows, emptyIcon, empty, history = false }) {
  return <div className="lib-card"><h3 className="lib-card-title">{title}</h3><div className="lib-table-wrap"><table className="lib-table"><caption className="sr-only">{title}</caption><thead><tr><th scope="col">Sách</th><th scope="col">Ngày mượn</th><th scope="col">{history ? 'Ngày trả' : 'Hạn trả'}</th><th scope="col">Trạng thái</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.book}-${index}`} className={row.status === 'Overdue' ? 'row-overdue' : ''}><td><strong>{row.book}</strong></td><td>{fmtDate(row.borrowDate)}</td><td>{fmtDate(history ? row.returnDate : row.dueDate)}</td><td><Badge status={row.status} /></td></tr>)}</tbody></table>{rows.length === 0 && <EmptyState icon={emptyIcon} title={empty} />}</div></div>;
}
