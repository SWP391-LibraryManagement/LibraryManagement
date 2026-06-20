/**
 * FE07 · UC29 — Create Borrow Request (Member)
 * Tìm sách → chọn bản sao/chi nhánh → chọn ngày mượn/hạn trả → ghi chú → gửi yêu cầu.
 * UI tĩnh + mock data, dùng AppLayout + app-shell.css.
 */

import { useMemo, useState } from 'react';
import { Search, BookOpen, MapPin, Calendar, FileText, CheckCircle2, Star } from 'lucide-react';

import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast } from '../../component/shared/Feedback';

const CATALOG = [
  { id: 'BK-001', title: 'Clean Code', author: 'Robert C. Martin', category: 'Lập trình', rating: 4.7, copies: [
    { id: 'C-01', branch: 'Chi nhánh Trung tâm', shelf: 'A-12' },
    { id: 'C-02', branch: 'Chi nhánh Quận 7', shelf: 'B-04' },
  ] },
  { id: 'BK-002', title: 'The Pragmatic Programmer', author: 'Andrew Hunt, David Thomas', category: 'Lập trình', rating: 4.6, copies: [
    { id: 'C-05', branch: 'Chi nhánh Trung tâm', shelf: 'A-15' },
  ] },
  { id: 'BK-003', title: 'Sapiens: Lược sử loài người', author: 'Yuval Noah Harari', category: 'Lịch sử', rating: 4.8, copies: [
    { id: 'C-09', branch: 'Chi nhánh Trung tâm', shelf: 'D-02' },
    { id: 'C-10', branch: 'Chi nhánh Quận 7', shelf: 'D-03' },
  ] },
  { id: 'BK-004', title: 'Nhà Giả Kim', author: 'Paulo Coelho', category: 'Tiểu thuyết', rating: 4.5, copies: [] },
];

function todayPlus(days) {
  const d = new Date('2026-06-15');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function BorrowRequestPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(CATALOG[0]);
  const [copyId, setCopyId] = useState(CATALOG[0].copies[0]?.id || '');
  const [borrowDate, setBorrowDate] = useState(todayPlus(0));
  const [dueDate, setDueDate] = useState(todayPlus(14));
  const [notes, setNotes] = useState('');
  const [toast, showToast, clearToast] = useToast();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter((b) => `${b.title} ${b.author}`.toLowerCase().includes(q));
  }, [query]);

  function pickBook(book) {
    setSelected(book);
    setCopyId(book.copies[0]?.id || '');
  }

  const available = selected?.copies.length || 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!available) {
      showToast('Sách hiện không còn bản sao khả dụng để mượn.', 'error');
      return;
    }
    showToast(`Đã gửi yêu cầu mượn "${selected.title}". Vui lòng chờ thủ thư duyệt.`, 'success');
  }

  return (
    <AppLayout
      active="borrow-request"
      title="Create Borrow Request"
      subtitle="Tìm sách và gửi yêu cầu mượn tới thủ thư"
    >
      <div className="split">
        {/* Left — search + results */}
        <div>
          <div className="lib-card">
            <div className="search-input" style={{ width: '100%' }}>
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên sách hoặc tác giả..."
                aria-label="Tìm sách"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {results.map((book) => {
                const isActive = book.id === selected?.id;
                const can = book.copies.length > 0;
                return (
                  <button
                    type="button"
                    key={book.id}
                    onClick={() => pickBook(book)}
                    className={`queue-item${isActive ? ' head' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="book-spine" style={{ background: 'linear-gradient(135deg,#c78a3b,#a86f28)' }} />
                    <span className="stack-sm" style={{ flex: 1, textAlign: 'left' }}>
                      <strong>{book.title}</strong>
                      <span className="muted" style={{ fontSize: 13 }}>{book.author}</span>
                    </span>
                    <span className={`badge badge-${can ? 'available' : 'overdue'}`}>
                      {can ? `${book.copies.length} bản` : 'Hết'}
                    </span>
                  </button>
                );
              })}
              {results.length === 0 && (
                <div className="empty"><BookOpen size={34} /><p>Không tìm thấy sách phù hợp.</p></div>
              )}
            </div>
          </div>
        </div>

        {/* Right — selected book + form */}
        <form className="panel" onSubmit={handleSubmit}>
          {selected ? (
            <>
              <div className="row-flex" style={{ alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
                <span className="book-cover"><BookOpen size={30} /></span>
                <div className="stack-sm">
                  <h3 className="lib-card-title" style={{ margin: 0 }}>{selected.title}</h3>
                  <span className="muted">{selected.author}</span>
                  <span className="row-flex" style={{ gap: 6, marginTop: 4 }}>
                    <Star size={14} color="#c78a3b" fill="#c78a3b" />
                    <span style={{ fontSize: 13 }}>{selected.rating.toFixed(1)}</span>
                    <span className="badge badge-default" style={{ marginLeft: 6 }}>{selected.category}</span>
                  </span>
                  <span className={`badge badge-${available ? 'available' : 'overdue'}`} style={{ marginTop: 8, width: 'fit-content' }}>
                    {available ? `${available} bản sao khả dụng` : 'Tất cả bản sao đã được mượn'}
                  </span>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="copy"><MapPin size={14} style={{ verticalAlign: -2 }} /> Bản sao / Chi nhánh</label>
                  <select id="copy" className="select" value={copyId} onChange={(e) => setCopyId(e.target.value)} disabled={!available}>
                    {available ? (
                      selected.copies.map((c) => (
                        <option key={c.id} value={c.id}>{c.branch} — Kệ {c.shelf} ({c.id})</option>
                      ))
                    ) : (
                      <option>Không có bản sao khả dụng</option>
                    )}
                  </select>
                </div>

                <div className="form-grid cols-2">
                  <div className="field">
                    <label htmlFor="bd"><Calendar size={14} style={{ verticalAlign: -2 }} /> Ngày mượn</label>
                    <input id="bd" type="date" className="input" value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="dd"><Calendar size={14} style={{ verticalAlign: -2 }} /> Hạn trả</label>
                    <input id="dd" type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="notes"><FileText size={14} style={{ verticalAlign: -2 }} /> Ghi chú (tuỳ chọn)</label>
                  <textarea id="notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Lý do mượn, yêu cầu đặc biệt..." />
                  <span className="field-hint">Thời hạn mượn tiêu chuẩn là 14 ngày.</span>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!available}>
                  <CheckCircle2 size={18} /> Submit Borrow Request
                </button>
              </div>
            </>
          ) : (
            <div className="empty"><BookOpen size={40} /><p>Chọn một cuốn sách để gửi yêu cầu mượn.</p></div>
          )}
        </form>
      </div>

      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
