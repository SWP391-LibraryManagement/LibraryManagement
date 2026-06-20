/**
 * FE08 · UC36 Reserve Book + UC37 Cancel Reservation (Member) — "My Reservations"
 * Khu đặt sách nhanh (hiển thị vị trí hàng đợi sau khi đặt) + bảng các đặt chỗ của tôi với nút Cancel.
 */

import { useState } from 'react';
import { Bookmark, BookOpen, Search, X, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, Modal, Badge } from '../../component/shared/Feedback';

const RESERVABLE = [
  { id: 'BK-001', title: 'Clean Code', author: 'Robert C. Martin', availableCopies: 0, queue: 2, eta: '≈ 5 ngày' },
  { id: 'BK-010', title: 'You Don\'t Know JS', author: 'Kyle Simpson', availableCopies: 2, queue: 0, eta: 'Sẵn sàng mượn' },
  { id: 'BK-022', title: 'Atomic Habits', author: 'James Clear', availableCopies: 0, queue: 4, eta: '≈ 12 ngày' },
];

const INITIAL = [
  { id: 'RS-501', title: 'Sapiens', author: 'Yuval Noah Harari', reservedDate: '2026-06-08', queue: 1, status: 'Waiting' },
  { id: 'RS-502', title: 'Design Patterns', author: 'Erich Gamma', reservedDate: '2026-06-05', queue: 0, status: 'Ready to pick up', deadline: '2026-06-18' },
  { id: 'RS-503', title: 'Refactoring', author: 'Martin Fowler', reservedDate: '2026-05-20', queue: 0, status: 'Expired' },
];

const fmt = (d) => new Date(d).toLocaleDateString('vi-VN');

export default function MyReservationsPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState(INITIAL);
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [toast, showToast, clearToast] = useToast();

  const matches = RESERVABLE.filter((b) => {
    const q = search.trim().toLowerCase();
    return !q || `${b.title} ${b.author}`.toLowerCase().includes(q);
  });

  function reserve(book) {
    if (book.availableCopies > 0) {
      showToast(`"${book.title}" đang có bản khả dụng. Vui lòng tạo yêu cầu mượn thay vì đặt chỗ.`, 'info');
      return;
    }
    if (reservations.some((r) => r.title === book.title)) {
      showToast(`Bạn đã đặt "${book.title}" rồi.`, 'info');
      return;
    }
    const newRes = {
      id: `RS-${500 + reservations.length + 4}`,
      title: book.title, author: book.author,
      reservedDate: '2026-06-15',
      queue: book.queue + 1,
      status: 'Waiting',
    };
    setReservations((prev) => [newRes, ...prev]);
    showToast(
      `Đã đặt "${book.title}". Bạn đang ở vị trí #${newRes.queue} trong hàng đợi.`,
      'success'
    );
  }

  function confirmCancel() {
    setReservations((prev) => prev.filter((r) => r.id !== cancelTarget.id));
    showToast(`Đã hủy đặt chỗ "${cancelTarget.title}".`, 'info');
    setCancelTarget(null);
  }

  return (
    <AppLayout active="my-reservations" title="My Reservations" subtitle="Đặt sách và theo dõi vị trí trong hàng đợi">
      {/* Reserve a book */}
      <div className="lib-card">
        <h3 className="lib-card-title">Đặt một cuốn sách</h3>
        <div className="search-input" style={{ width: '100%', marginBottom: 14 }}>
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm sách để đặt..." aria-label="Tìm sách" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {matches.map((b) => (
            <div className="queue-item" key={b.id}>
              <span className="book-spine" style={{ background: 'linear-gradient(135deg,#c78a3b,#a86f28)' }} />
              <div className="stack-sm" style={{ flex: 1 }}>
                <strong>{b.title}</strong>
                <span className="muted" style={{ fontSize: 13 }}>{b.author}</span>
              </div>
              <span className={`badge badge-${b.availableCopies > 0 ? 'available' : 'waiting'}`}>
                {b.availableCopies > 0 ? `${b.availableCopies} bản khả dụng · hãy mượn ngay` : `${b.queue} người đang chờ · ${b.eta}`}
              </span>
              {b.availableCopies > 0 ? (
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/borrowing/new')}><BookOpen size={14} /> Borrow now</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => reserve(b)}><Bookmark size={14} /> Reserve</button>
              )}
            </div>
          ))}
          {matches.length === 0 && <div className="empty"><BookOpen size={32} /><p>Không tìm thấy sách.</p></div>}
        </div>
      </div>

      {/* My reservations table */}
      <div className="lib-card">
        <h3 className="lib-card-title">Đặt chỗ của tôi</h3>
        <div className="lib-table-wrap">
          <table className="lib-table">
            <thead>
              <tr><th>Sách</th><th>Ngày đặt</th><th>Vị trí hàng đợi</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="stack-sm"><strong>{r.title}</strong><span className="muted" style={{ fontSize: 13 }}>{r.author}</span></div>
                  </td>
                  <td>{fmt(r.reservedDate)}</td>
                  <td>
                    {r.status === 'Ready to pick up'
                      ? <span className="row-flex" style={{ gap: 6, color: 'var(--st-green)' }}><CheckCircle2 size={15} /> Đến lượt bạn</span>
                      : r.status === 'Expired'
                        ? <span className="muted">—</span>
                        : <span className="row-flex" style={{ gap: 6 }}><Clock size={15} /> #{r.queue}</span>}
                  </td>
                  <td>
                    <Badge status={r.status} />
                    {r.status === 'Ready to pick up' && r.deadline && <div className="field-hint">Lấy trước {fmt(r.deadline)}</div>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {r.status !== 'Expired' && (
                      <button className="btn btn-outline btn-sm" onClick={() => setCancelTarget(r)}><X size={14} /> Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reservations.length === 0 && <div className="empty"><Bookmark size={34} /><p>Bạn chưa đặt chỗ cuốn sách nào.</p></div>}
        </div>
      </div>

      {cancelTarget && (
        <Modal
          eyebrow="UC37 · Hủy đặt chỗ"
          title="Cancel Reservation"
          onClose={() => setCancelTarget(null)}
          actions={
            <>
              <button className="btn btn-ghost" onClick={() => setCancelTarget(null)}>Giữ lại</button>
              <button className="btn btn-danger" onClick={confirmCancel}>Xác nhận hủy</button>
            </>
          }
        >
          <p>Bạn có chắc muốn hủy đặt chỗ cho <strong>{cancelTarget.title}</strong>?</p>
          {cancelTarget.status === 'Waiting' && (
            <div className="alert-box info" style={{ marginTop: 12 }}>Bạn sẽ mất vị trí #{cancelTarget.queue} trong hàng đợi và không thể khôi phục.</div>
          )}
        </Modal>
      )}

      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
