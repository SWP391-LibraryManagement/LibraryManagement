/**
 * FE07 · UC34 — Member Borrowing Details (Librarian)
 * Header hồ sơ thành viên + các mục: sách đang mượn, lịch sử mượn, tổng phí phạt, số đặt chỗ đang hoạt động.
 */

import { useState } from 'react';
import { Search, Mail, Phone, Hash, BookOpen, DollarSign, CalendarClock, BookMarked } from 'lucide-react';

import AppLayout from '../../component/layout/AppLayout';
import { Badge } from '../../component/shared/Feedback';

const MEMBERS = [
  {
    id: 'MB-0231', name: 'Nguyễn Văn An', email: 'an.nguyen@example.com', phone: '0905 123 456',
    membership: 'Active', joinDate: '2024-09-01', totalFines: 0, activeReservations: 1,
    current: [
      { book: 'Clean Code', borrowDate: '2026-06-02', dueDate: '2026-06-16', status: 'Borrowed' },
      { book: 'Nhà Giả Kim', borrowDate: '2026-06-10', dueDate: '2026-06-24', status: 'Borrowed' },
    ],
    history: [
      { book: 'Sapiens', borrowDate: '2026-05-01', returnDate: '2026-05-14', status: 'Returned' },
      { book: 'Design Patterns', borrowDate: '2026-04-10', returnDate: '2026-04-22', status: 'Returned' },
      { book: 'Refactoring', borrowDate: '2026-05-28', returnDate: null, status: 'Overdue' },
    ],
  },
  {
    id: 'MB-0198', name: 'Trần Thị Bình', email: 'binh.tran@example.com', phone: '0912 987 654',
    membership: 'Active', joinDate: '2025-01-15', totalFines: 25000, activeReservations: 0,
    current: [{ book: 'The Pragmatic Programmer', borrowDate: '2026-05-20', dueDate: '2026-06-03', status: 'Overdue' }],
    history: [{ book: 'Đắc Nhân Tâm', borrowDate: '2026-03-02', returnDate: '2026-03-16', status: 'Returned' }],
  },
];

const fmt = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const vnd = (n) => n.toLocaleString('vi-VN') + ' ₫';

export default function MemberBorrowingDetailsPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(MEMBERS[0].id);
  const m = MEMBERS.find((x) => x.id === selectedId);

  const matches = MEMBERS.filter((x) => {
    const q = search.trim().toLowerCase();
    return !q || `${x.name} ${x.id} ${x.email}`.toLowerCase().includes(q);
  });

  const kpis = [
    { label: 'Đang mượn', value: m.current.length, icon: BookOpen },
    { label: 'Tổng phí phạt', value: vnd(m.totalFines), icon: DollarSign },
    { label: 'Đặt chỗ hoạt động', value: m.activeReservations, icon: BookMarked },
    { label: 'Lượt mượn (lịch sử)', value: m.history.length, icon: CalendarClock },
  ];

  return (
    <AppLayout
      active="member-details"
      title="Member Borrowing Details"
      subtitle="Tra cứu thông tin mượn–trả của một thành viên"
    >
      <div className="toolbar">
        <div className="search-input" style={{ minWidth: 320 }}>
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm thành viên theo tên / mã / email..." aria-label="Tìm thành viên" />
        </div>
        <span className="spacer" />
        <select className="select" style={{ width: 240 }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {matches.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.id})</option>)}
        </select>
      </div>

      {/* Profile header */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-header" style={{ marginBottom: 0 }}>
          <div className="app-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>{m.name.slice(0, 1)}</div>
          <div className="stack-sm">
            <h3 className="lib-card-title" style={{ margin: 0 }}>{m.name}</h3>
            <span className="row-flex" style={{ gap: 14, flexWrap: 'wrap' }}>
              <span className="muted"><Hash size={14} style={{ verticalAlign: -2 }} /> {m.id}</span>
              <span className="muted"><Mail size={14} style={{ verticalAlign: -2 }} /> {m.email}</span>
              <span className="muted"><Phone size={14} style={{ verticalAlign: -2 }} /> {m.phone}</span>
            </span>
          </div>
          <span style={{ marginLeft: 'auto' }}><Badge status={m.membership === 'Active' ? 'Active' : 'Inactive'} /></span>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div className="kpi-card" key={label}>
            <div className="kpi-top">
              <span className="kpi-label">{label}</span>
              <span className="kpi-icon"><Icon size={18} /></span>
            </div>
            <span className="kpi-value">{value}</span>
          </div>
        ))}
      </div>

      {/* Currently borrowed */}
      <div className="lib-card">
        <h3 className="lib-card-title">Sách đang mượn</h3>
        <div className="lib-table-wrap">
          <table className="lib-table">
            <thead><tr><th>Sách</th><th>Ngày mượn</th><th>Hạn trả</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {m.current.map((r, i) => (
                <tr key={i} className={r.status === 'Overdue' ? 'row-overdue' : ''}>
                  <td><strong>{r.book}</strong></td>
                  <td>{fmt(r.borrowDate)}</td>
                  <td>{fmt(r.dueDate)}</td>
                  <td><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {m.current.length === 0 && <div className="empty"><BookOpen size={32} /><p>Không có sách đang mượn.</p></div>}
        </div>
      </div>

      {/* History */}
      <div className="lib-card">
        <h3 className="lib-card-title">Lịch sử mượn</h3>
        <div className="lib-table-wrap">
          <table className="lib-table">
            <thead><tr><th>Sách</th><th>Ngày mượn</th><th>Ngày trả</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {m.history.map((r, i) => (
                <tr key={i} className={r.status === 'Overdue' ? 'row-overdue' : ''}>
                  <td><strong>{r.book}</strong></td>
                  <td>{fmt(r.borrowDate)}</td>
                  <td>{fmt(r.returnDate)}</td>
                  <td><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {m.history.length === 0 && <div className="empty"><CalendarClock size={32} /><p>Chưa có lịch sử mượn.</p></div>}
        </div>
      </div>
    </AppLayout>
  );
}
