/** FE07 - UC34 - Member Borrowing Details (Librarian). */

import { useMemo, useState } from 'react';
import { Search, Mail, Phone, Hash, BookOpen, DollarSign, CalendarClock, BookMarked, RefreshCw } from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Badge, DataNotice, EmptyState, LoadingBlock } from '../../component/shared/Feedback';
import { DEMO_MEMBERS, fmtDate, mapBorrowDetailsToMember, vnd } from '../../utils/libraryFeatureViewModels';

export default function MemberBorrowingDetailsPage() {
  const [members] = useState(DEMO_MEMBERS);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(DEMO_MEMBERS[0].id);
  const [memberView, setMemberView] = useState(DEMO_MEMBERS[0]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Đang hiển thị dữ liệu demo. Chọn memberId và bấm tải lại để gửi GET /api/members/:memberId/borrowings.');
  const [isDemo, setIsDemo] = useState(true);

  const selectedMember = members.find((member) => member.id === selectedId) || members[0];
  const matches = useMemo(() => { const q = search.trim().toLowerCase(); return members.filter((member) => !q || `${member.name} ${member.id} ${member.email}`.toLowerCase().includes(q)); }, [members, search]);

  async function loadMemberBorrowings() {
    setLoading(true);
    try {
      const data = await borrowingApi.listMemberBorrowings(selectedId);
      setMemberView(mapBorrowDetailsToMember(data.borrowings || [], selectedMember));
      setIsDemo(false);
      setNotice(`Đã kết nối backend thật qua GET /api/members/${selectedId}/borrowings.`);
    } catch (error) {
      setMemberView(selectedMember);
      setIsDemo(true);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }


  const kpis = [
    { label: 'Đang mượn', value: memberView.current.length, icon: BookOpen },
    { label: 'Tổng phí phạt', value: vnd(memberView.totalFines), icon: DollarSign },
    { label: 'Đặt chỗ hoạt động', value: memberView.activeReservations, icon: BookMarked },
    { label: 'Lượt mượn (lịch sử)', value: memberView.history.length, icon: CalendarClock },
  ];

  return <AppLayout active="member-details" title="Chi tiết mượn sách của thành viên" subtitle="Tra cứu thông tin mượn/trả của một thành viên." actions={<button className="btn btn-outline" onClick={loadMemberBorrowings} disabled={loading}><RefreshCw size={16} /> Tải từ API</button>}><DataNotice type={isDemo ? 'warn' : 'success'} title={isDemo ? 'Demo fallback' : 'Backend connected'}>{notice}</DataNotice><div className="toolbar"><div className="search-input" style={{ minWidth: 320 }}><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm thành viên theo tên / mã / email..." aria-label="Tìm thành viên" /></div><span className="spacer" /><select className="select" style={{ width: 260 }} value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setMemberView(members.find((member) => member.id === e.target.value) || members[0]); setIsDemo(true); }} aria-label="Select member">{matches.map((member) => <option key={member.id} value={member.id}>{member.name} (memberId {member.id})</option>)}</select></div>{loading ? <LoadingBlock rows={4} /> : <><div className="panel" style={{ marginBottom: 18 }}><div className="panel-header" style={{ marginBottom: 0 }}><div className="app-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>{memberView.name.slice(0, 1)}</div><div className="stack-sm"><h3 className="lib-card-title" style={{ margin: 0 }}>{memberView.name}</h3><span className="row-flex" style={{ gap: 14, flexWrap: 'wrap' }}><span className="muted"><Hash size={14} style={{ verticalAlign: -2 }} /> {memberView.id}</span><span className="muted"><Mail size={14} style={{ verticalAlign: -2 }} /> {memberView.email}</span><span className="muted"><Phone size={14} style={{ verticalAlign: -2 }} /> {memberView.phone}</span></span></div><span style={{ marginLeft: 'auto' }}><Badge status={memberView.membership === 'Active' ? 'Active' : 'Inactive'} /></span></div></div><div className="kpi-grid">{kpis.map(({ label, value, icon: Icon }) => <div className="kpi-card" key={label}><div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon"><Icon size={18} /></span></div><span className="kpi-value">{value}</span></div>)}</div><LoanTable title="Sách đang mượn" rows={memberView.current} emptyIcon={BookOpen} empty="Không có sách đang mượn" /><LoanTable title="Lịch sử mượn" rows={memberView.history} emptyIcon={CalendarClock} empty="Chưa có lịch sử mượn" history /></>}</AppLayout>;
}

function LoanTable({ title, rows, emptyIcon, empty, history = false }) {
  return <div className="lib-card"><h3 className="lib-card-title">{title}</h3><div className="lib-table-wrap"><table className="lib-table"><caption className="sr-only">{title}</caption><thead><tr><th scope="col">Sách</th><th scope="col">Ngày mượn</th><th scope="col">{history ? 'Ngày trả' : 'Hạn trả'}</th><th scope="col">Trạng thái</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.book}-${index}`} className={row.status === 'Overdue' ? 'row-overdue' : ''}><td><strong>{row.book}</strong></td><td>{fmtDate(row.borrowDate)}</td><td>{fmtDate(history ? row.returnDate : row.dueDate)}</td><td><Badge status={row.status} /></td></tr>)}</tbody></table>{rows.length === 0 && <EmptyState icon={emptyIcon} title={empty} />}</div></div>;
}
