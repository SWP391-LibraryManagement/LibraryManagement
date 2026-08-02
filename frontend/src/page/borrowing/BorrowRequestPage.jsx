/**
 * FE07 - UC29 - Create Borrow Request (Member)
 * API thật: GET /api/borrow-requests/candidates và POST /api/borrow-requests.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, BookOpen, CheckCircle2, X } from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, DataNotice, EmptyState } from '../../component/shared/Feedback';
import { DataToolbar } from '../../component/shared/OperationalPatterns';

export default function BorrowRequestPage() {
  const [searchParams] = useSearchParams();
  const requestedBookId = Number(searchParams.get('bookId'));
  const requestedCopyId = Number(searchParams.get('copyId'));
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [copyId, setCopyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('info');
  const [toast, showToast, clearToast] = useToast();

  // @spec FR-FE07-033
  useEffect(() => {
    let active = true;
    borrowingApi.listCandidates()
      .then((data) => {
        if (!active) return;
        setLoadFailed(false);
        const nextBooks = data.books || [];
        const requestedBook = Number.isInteger(requestedBookId) && requestedBookId > 0
          ? nextBooks.find((book) => Number(book.bookId) === requestedBookId)
          : null;
        const requestedCopy = requestedBook && Number.isInteger(requestedCopyId) && requestedCopyId > 0
          ? requestedBook.copies.find((copy) => Number(copy.copyId) === requestedCopyId)
          : null;
        const nextSelected = requestedBook || nextBooks[0] || null;
        setBooks(nextBooks);
        setSelected(nextSelected);
        setCopyId(requestedCopy?.copyId || nextSelected?.copies[0]?.copyId || '');
        if (requestedBookId > 0 && !requestedBook) {
          setNotice('Sách bạn chọn hiện không còn bản sao có thể mượn. Vui lòng chọn sách khác.');
          setNoticeType('error');
        } else if (requestedCopyId > 0 && !requestedCopy) {
          setNotice('Bản sách được giữ cho bạn không còn đủ điều kiện tạo yêu cầu mượn. Vui lòng tải lại phần đặt chỗ.');
          setNoticeType('error');
        }
      })
      .catch((error) => {
        if (!active) return;
        setBooks([]);
        setSelected(null);
        setCopyId('');
        setNotice(error.message);
        setNoticeType('error');
        setLoadFailed(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestedBookId, requestedCopyId]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return books.filter((book) => !normalizedQuery || `${book.title} ${book.author}`.toLowerCase().includes(normalizedQuery));
  }, [books, query]);

  function pickBook(book) {
    setSelected(book);
    setCopyId(book.copies[0]?.copyId || '');
    setNotice('');
    setNoticeType('info');
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
      setNotice(`Yêu cầu #${data.borrowRequest?.requestId || 'mới'} đã được tạo và đang chờ thủ thư duyệt.`);
      setNoticeType('success');
      showToast(`Đã gửi yêu cầu mượn "${selected.title}". Vui lòng chờ thủ thư duyệt.`, 'success');
    } catch (error) {
      setNotice(error.message);
      setNoticeType('error');
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout active="borrow-request" title="Tạo yêu cầu mượn" subtitle="Tìm sách và gửi yêu cầu mượn tới thủ thư.">
      {notice && <DataNotice type={noticeType} title={noticeType === 'error' ? 'Không thể gửi yêu cầu' : 'Kết quả gửi yêu cầu'}>{notice}</DataNotice>}
      <div className="split member-borrow-grid">
        <div className="lib-card member-catalog-card">
          <DataToolbar primary={(
            <div className="search-input" style={{ width: '100%' }}>
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên sách hoặc tác giả..." aria-label="Tìm sách" />
              {query && (
                <button type="button" className="icon-btn" aria-label="Xóa từ khóa tìm sách" onClick={() => setQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>
          )} />
          <div className="queue-list" style={{ marginTop: 16 }}>
            {results.map((book) => (
              <button
                type="button"
                key={book.bookId}
                onClick={() => pickBook(book)}
                className={`queue-item${book.bookId === selected?.bookId ? ' head' : ''}`}
                style={{ cursor: 'pointer' }}
                aria-pressed={book.bookId === selected?.bookId}
              >
                <span className="book-spine" style={{ background: 'linear-gradient(135deg,#a87532,#7b5528)' }} />
                <span className="stack-sm" style={{ flex: 1, textAlign: 'left' }}>
                  <strong>{book.title}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>{book.author}</span>
                </span>
                <span className="badge badge-available">{book.copies.length} bản</span>
              </button>
            ))}
            {/* @spec FR-FE07-045 */}
            {!loading && !loadFailed && books.length === 0 && (
              <EmptyState icon={BookOpen} title="Hiện không có bản sao đủ điều kiện mượn">
                Sách đang được mượn, giữ chỗ hoặc chờ xử lý sẽ không xuất hiện tại đây.
              </EmptyState>
            )}
            {!loading && !loadFailed && books.length > 0 && results.length === 0 && (
              <EmptyState icon={BookOpen} title="Không tìm thấy sách phù hợp">
                Hãy thử tên sách hoặc tác giả khác.
              </EmptyState>
            )}
            {loading && <EmptyState icon={BookOpen} title="Đang tải danh sách sách..." />}
          </div>
        </div>

        <form className="panel member-selection-panel" onSubmit={handleSubmit}>
          {selected ? <>
            <div className="row-flex" style={{ alignItems: 'flex-start', gap: 16, marginBottom: 18 }}><span className="book-cover"><BookOpen size={30} /></span><div className="stack-sm"><h3 className="lib-card-title" style={{ margin: 0 }}>{selected.title}</h3><span className="muted">{selected.author}</span><span className="badge badge-default" style={{ marginTop: 4, width: 'fit-content' }}>{selected.category}</span><span className="badge badge-available" style={{ marginTop: 8, width: 'fit-content' }}>{available} bản sao khả dụng</span></div></div>
            <div style={{ marginTop: 20 }}><button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!available || submitting}><CheckCircle2 size={18} /> {submitting ? 'Đang gửi...' : 'Gửi yêu cầu mượn'}</button></div>
          </> : <EmptyState icon={BookOpen} title={loading ? 'Đang tải sách...' : 'Chọn một cuốn sách để gửi yêu cầu mượn'} />}
        </form>
      </div>
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
