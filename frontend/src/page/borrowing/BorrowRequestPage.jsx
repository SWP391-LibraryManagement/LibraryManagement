/**
 * FE07 - UC29 - Create Borrow Request (Member)
 * API thật: POST /api/borrow-requests với copyIds.
 */

import { useMemo, useState } from 'react';
import { Search, BookOpen, MapPin, Calendar, FileText, CheckCircle2, Star } from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, DataNotice } from '../../component/shared/Feedback';
import { DEMO_BORROW_CATALOG } from '../../utils/libraryFeatureViewModels';

function todayPlus(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function BorrowRequestPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(DEMO_BORROW_CATALOG[0]);
  const [copyId, setCopyId] = useState(DEMO_BORROW_CATALOG[0].copies[0]?.id || '');
  const [borrowDate, setBorrowDate] = useState(todayPlus(0));
  const [dueDate, setDueDate] = useState(todayPlus(14));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('Catalog tạm dùng dữ liệu demo vì FE01/FE06 chưa có API browse copy công khai trong scope này. Khi submit sẽ gửi POST /api/borrow-requests bằng copyId thật nếu có đăng nhập member.');
  const [toast, showToast, clearToast] = useToast();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEMO_BORROW_CATALOG.filter((book) => !q || `${book.title} ${book.author}`.toLowerCase().includes(q));
  }, [query]);

  function pickBook(book) {
    setSelected(book);
    setCopyId(book.copies[0]?.id || '');
  }

  const available = selected?.copies.length || 0;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!available || !copyId) {
      showToast('Sách hiện không còn bản sao khả dụng để mượn.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const data = await borrowingApi.createRequest([Number(copyId)]);
      setNotice(`Backend đã tạo yêu cầu #${data.borrowRequest?.requestId || 'mới'} với trạng thái PENDING.`);
      showToast(`Đã gửi yêu cầu mượn "${selected.title}". Vui lòng chờ thủ thư duyệt.`, 'success');
      setNotes('');
    } catch (error) {
      setNotice(error.message);
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout active="borrow-request" title="Tạo yêu cầu mượn" subtitle="Tìm sách và gửi yêu cầu mượn tới thủ thư.">
      <DataNotice type="info" title="API integration">{notice}</DataNotice>
      <div className="split">
        <div>
          <div className="lib-card">
            <div className="search-input" style={{ width: '100%' }}><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên sách hoặc tác giả..." aria-label="Tìm sách" /></div>
            <div className="queue-list" style={{ marginTop: 16 }}>
              {results.map((book) => {
                const isActive = book.id === selected?.id;
                const canBorrow = book.copies.length > 0;
                return <button type="button" key={book.id} onClick={() => pickBook(book)} className={`queue-item${isActive ? ' head' : ''}`} style={{ cursor: 'pointer' }}><span className="book-spine" style={{ background: 'linear-gradient(135deg,#a87532,#7b5528)' }} /><span className="stack-sm" style={{ flex: 1, textAlign: 'left' }}><strong>{book.title}</strong><span className="muted" style={{ fontSize: 13 }}>{book.author}</span></span><span className={`badge badge-${canBorrow ? 'available' : 'overdue'}`}>{canBorrow ? `${book.copies.length} bản` : 'Hết'}</span></button>;
              })}
              {results.length === 0 && <div className="empty"><BookOpen size={34} /><p>Không tìm thấy sách phù hợp.</p></div>}
            </div>
          </div>
        </div>

        <form className="panel" onSubmit={handleSubmit}>
          {selected ? <>
            <div className="row-flex" style={{ alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
              <span className="book-cover"><BookOpen size={30} /></span>
              <div className="stack-sm"><h3 className="lib-card-title" style={{ margin: 0 }}>{selected.title}</h3><span className="muted">{selected.author}</span><span className="row-flex" style={{ gap: 6, marginTop: 4 }}><Star size={14} color="#a87532" fill="#a87532" /><span style={{ fontSize: 13 }}>{selected.rating.toFixed(1)}</span><span className="badge badge-default" style={{ marginLeft: 6 }}>{selected.category}</span></span><span className={`badge badge-${available ? 'available' : 'overdue'}`} style={{ marginTop: 8, width: 'fit-content' }}>{available ? `${available} bản sao khả dụng` : 'Tất cả bản sao đã được mượn'}</span></div>
            </div>
            <div className="form-grid">
              <div className="field"><label htmlFor="copy"><MapPin size={14} style={{ verticalAlign: -2 }} /> Bản sao / Chi nhánh</label><select id="copy" className="select" value={copyId} onChange={(e) => setCopyId(e.target.value)} disabled={!available}>{available ? selected.copies.map((copy) => <option key={copy.id} value={copy.id}>{copy.branch} • Kệ {copy.shelf} (Copy #{copy.id})</option>) : <option>Không có bản sao khả dụng</option>}</select></div>
              <div className="form-grid cols-2"><div className="field"><label htmlFor="bd"><Calendar size={14} style={{ verticalAlign: -2 }} /> Ngày mượn dự kiến</label><input id="bd" type="date" className="input" value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)} /></div><div className="field"><label htmlFor="dd"><Calendar size={14} style={{ verticalAlign: -2 }} /> Hạn trả dự kiến</label><input id="dd" type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div></div>
              <div className="field"><label htmlFor="notes"><FileText size={14} style={{ verticalAlign: -2 }} /> Ghi chú (tùy chọn)</label><textarea id="notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Lý do mượn, yêu cầu đặc biệt..." /><span className="field-hint">Backend mới l- noi kiem tra membership, gioi han 5 sach, overdue/fine va availability.</span></div>
            </div>
            <div style={{ marginTop: 20 }}><button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!available || submitting}><CheckCircle2 size={18} /> {submitting ? 'Đang gửi...' : 'Gửi yêu cầu mượn'}</button></div>
          </> : <div className="empty"><BookOpen size={40} /><p>Chon mot cu-n sach Đã gửi yêu cầu mượn.</p></div>}
        </form>
      </div>
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
