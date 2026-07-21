import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Eye,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { getBookErrorMessage } from '../api/apiErrorMessages';
import { authorizedRequest } from '../api/libraryFeatureApi';
import { getStatusLabel } from '../utils/uiLabels';

const DEFAULT_FORM = {
  title: '',
  isbn: '',
  categoryId: '',
  authorId: '',
  publisherId: '',
  publishYear: '',
  pages: '',
  coverUrl: '',
  description: '',
};

async function apiRequest(path, options = {}) {
  const body = options.body ? JSON.parse(options.body) : undefined;

  return authorizedRequest({
    method: options.method || 'GET',
    url: path,
    data: body,
    headers: options.headers,
  }, 'Không thể xử lý yêu cầu.', getBookErrorMessage);
}

function toForm(book) {
  if (!book) return DEFAULT_FORM;

  return {
    title: book.title || '',
    isbn: book.isbn || '',
    categoryId: book.categoryId ? String(book.categoryId) : '',
    authorId: book.authorId ? String(book.authorId) : '',
    publisherId: book.publisherId ? String(book.publisherId) : '',
    publishYear: book.year ? String(book.year) : '',
    pages: book.pages ? String(book.pages) : '',
    coverUrl: book.cover || '',
    description: book.description || '',
  };
}

function validateBookForm(form, currentBooks = [], editingBookId = null) {
  const errors = {};
  const currentYear = new Date().getFullYear();
  const title = form.title.trim();
  const isbn = form.isbn.trim();
  const publishYear = form.publishYear ? Number(form.publishYear) : null;
  const pages = form.pages ? Number(form.pages) : null;
  const duplicate = isbn && currentBooks.some((book) => (
    String(book.isbn || '').toLowerCase() === isbn.toLowerCase() && Number(book.id) !== Number(editingBookId)
  ));

  if (!title) errors.title = 'Tên sách là bắt buộc.';
  if (title.length > 255) errors.title = 'Tên sách không được vượt quá 255 ký tự.';
  if (isbn.length > 20) errors.isbn = 'ISBN không được vượt quá 20 ký tự.';
  if (duplicate) errors.isbn = 'ISBN đã tồn tại.';
  if (!form.categoryId) errors.categoryId = 'Thể loại là bắt buộc.';
  if (!form.authorId) errors.authorId = 'Tác giả là bắt buộc.';
  if (publishYear && (!Number.isInteger(publishYear) || publishYear < 1 || publishYear > currentYear)) {
    errors.publishYear = `Năm xuất bản không được lớn hơn ${currentYear}.`;
  }
  if (pages && (!Number.isInteger(pages) || pages < 1 || pages > 10000)) errors.pages = 'Số trang phải từ 1 đến 10000.';
  if (form.coverUrl.trim() && !/^https?:\/\/[^\s]+$/i.test(form.coverUrl.trim()) && !form.coverUrl.trim().startsWith('/')) {
    errors.coverUrl = 'URL ảnh bìa phải bắt đầu bằng http(s) hoặc /.';
  }
  if (form.description.length > 2000) errors.description = 'Mô tả không được vượt quá 2000 ký tự.';

  return errors;
}

function makePayload(form) {
  return {
    title: form.title.trim(),
    isbn: form.isbn.trim(),
    categoryId: Number(form.categoryId),
    authorId: Number(form.authorId),
    publisherId: form.publisherId ? Number(form.publisherId) : null,
    publishYear: form.publishYear ? Number(form.publishYear) : null,
    pages: form.pages ? Number(form.pages) : null,
    coverUrl: form.coverUrl.trim(),
    description: form.description.trim(),
  };
}

function getBookAvailability(book) {
  return book.availabilityStatus === 'AVAILABLE'
    ? { key: 'available', label: 'Còn sách' }
    : { key: 'unavailable', label: 'Không khả dụng' };
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <button className={`bm-toast ${toast.type}`} onClick={onClose}>
      {toast.type === 'error' ? <AlertTriangle size={17} /> : <Check size={17} />}
      <span>{toast.message}</span>
    </button>
  );
}

function FieldError({ message }) {
  return message ? <span className="bm-field-error">{message}</span> : null;
}

function BookForm({
  form,
  setForm,
  metadata,
  errors,
  submitLabel,
  onSubmit,
  disabled,
}) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <form className="bm-form" onSubmit={onSubmit}>
      <label>
        <span>Tên sách</span>
        <input value={form.title} onChange={(event) => update('title', event.target.value)} maxLength={255} />
        <FieldError message={errors.title} />
      </label>

      <label>
        <span>ISBN</span>
        <input value={form.isbn} onChange={(event) => update('isbn', event.target.value)} maxLength={20} />
        <FieldError message={errors.isbn} />
      </label>

      <label>
        <span>Thể loại</span>
        <select value={form.categoryId} onChange={(event) => update('categoryId', event.target.value)}>
          <option value="">Chọn thể loại</option>
          {metadata.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <FieldError message={errors.categoryId} />
      </label>

      <label>
        <span>Tác giả</span>
        <select value={form.authorId} onChange={(event) => update('authorId', event.target.value)}>
          <option value="">Chọn tác giả</option>
          {metadata.authors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <FieldError message={errors.authorId} />
      </label>

      <label>
        <span>Nhà xuất bản</span>
        <select value={form.publisherId} onChange={(event) => update('publisherId', event.target.value)}>
          <option value="">Không có nhà xuất bản</option>
          {metadata.publishers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>

      <label>
        <span>Năm xuất bản</span>
        <input type="number" value={form.publishYear} onChange={(event) => update('publishYear', event.target.value)} />
        <FieldError message={errors.publishYear} />
      </label>

      <label>
        <span>Số trang</span>
        <input type="number" min="1" max="10000" value={form.pages} onChange={(event) => update('pages', event.target.value)} />
        <FieldError message={errors.pages} />
      </label>

      <label className="bm-wide">
        <span>URL ảnh bìa</span>
        <input value={form.coverUrl} onChange={(event) => update('coverUrl', event.target.value)} maxLength={255} />
        <FieldError message={errors.coverUrl} />
      </label>

      <label className="bm-wide">
        <span>Mô tả</span>
        <textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={4} maxLength={2000} />
        <FieldError message={errors.description} />
      </label>

      <button className="bm-primary" type="submit" disabled={disabled}>
        <Save size={17} />
        {submitLabel}
      </button>
    </form>
  );
}

export default function BookManagement() {
  const [books, setBooks] = useState([]);
  const [metadata, setMetadata] = useState({ categories: [], authors: [], publishers: [] });
  const [selectedBookId, setSelectedBookId] = useState('');
  const [detailBook, setDetailBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('ACTIVE');
  const [appliedCategoryFilter, setAppliedCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [addForm, setAddForm] = useState(DEFAULT_FORM);
  const [updateForm, setUpdateForm] = useState(DEFAULT_FORM);
  const [addErrors, setAddErrors] = useState({});
  const [updateErrors, setUpdateErrors] = useState({});
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const selectedBook = useMemo(
    () => books.find((book) => Number(book.id) === Number(selectedBookId)) || null,
    [books, selectedBookId]
  );

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadMetadata = async () => {
    const result = await apiRequest('/books/metadata');
    setMetadata({
      categories: result.data?.categories || [],
      authors: result.data?.authors || [],
      publishers: result.data?.publishers || [],
    });
  };

  const loadBooks = useCallback(async ({
    q = appliedSearchQuery,
    status = appliedStatusFilter,
    categoryId = appliedCategoryFilter,
    pageNumber = page,
  } = {}) => {
    const requestedPage = Number(pageNumber) || 1;
    const params = new URLSearchParams({
      page: String(requestedPage),
      limit: '20',
      sort: 'title',
      order: 'asc',
    });
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (categoryId) params.set('categoryId', categoryId);
    const result = await apiRequest(`/admin/books?${params.toString()}`);
    const nextBooks = result.items || [];
    const pagination = result.pagination || {};
    setTotalItems(Number(pagination.total) || nextBooks.length);
    setTotalPages(Math.max(1, Number(pagination.totalPages) || 1));
    setPage(Number(pagination.page) || requestedPage);
    setBooks(nextBooks);
    setSelectedBookId((currentSelectedBookId) => {
      if (nextBooks.length && !nextBooks.some((book) => Number(book.id) === Number(currentSelectedBookId))) {
        return String(nextBooks[0].id);
      }

      return nextBooks.length ? currentSelectedBookId : '';
    });
    return nextBooks;
  }, [appliedCategoryFilter, appliedSearchQuery, appliedStatusFilter, page]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([loadMetadata(), loadBooks()]);
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    // Initial load only; later search, filter, pagination, and refresh actions load explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedBook) {
      const timer = window.setTimeout(() => {
        setUpdateForm(toForm(selectedBook));
        setDetailBook(selectedBook);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [selectedBook]);

  const handleRefreshList = async () => {
    try {
      setLoading(true);
      setPage(1);
      await Promise.all([loadMetadata(), loadBooks({ pageNumber: 1 })]);
      showToast('Đã tải lại dữ liệu sách.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const keyword = searchQuery.trim();

    if (keyword.length > 200) {
      showToast('Từ khóa tìm kiếm không được vượt quá 200 ký tự.', 'error');
      return;
    }

    try {
      setLoading(true);
      setAppliedSearchQuery(keyword);
      setPage(1);
      const items = await loadBooks({ q: keyword, pageNumber: 1 });
      showToast(keyword
        ? `Tìm thấy ${items.length} sách trên trang hiện tại.`
        : 'Đã xóa từ khóa tìm kiếm và tải lại danh sách sách.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = async () => {
    try {
      setLoading(true);
      setAppliedStatusFilter(statusFilter);
      setAppliedCategoryFilter(categoryFilter);
      setPage(1);
      await loadBooks({
        q: appliedSearchQuery,
        status: statusFilter,
        categoryId: categoryFilter,
        pageNumber: 1,
      });
      showToast('Đã áp dụng bộ lọc danh sách sách.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (nextPage) => {
    try {
      setLoading(true);
      await loadBooks({ pageNumber: nextPage });
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (bookId = selectedBookId) => {
    if (!bookId) {
      showToast('Vui lòng chọn một cuốn sách trước.', 'error');
      return;
    }

    try {
      setLoading(true);
      const result = await apiRequest(`/books/${bookId}`);
      setDetailBook(result.book);
      setSelectedBookId(String(result.book.id));
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (event) => {
    event.preventDefault();
    const errors = validateBookForm(addForm, books);
    setAddErrors(errors);

    if (Object.keys(errors).length) {
      showToast('Vui lòng sửa các trường được đánh dấu trước khi thêm sách.', 'error');
      return;
    }

    try {
      setSaving(true);
      const result = await apiRequest('/books', {
        method: 'POST',
        body: JSON.stringify(makePayload(addForm)),
      });
      setAddForm(DEFAULT_FORM);
      setStatusFilter('ACTIVE');
      setCategoryFilter('');
      setAppliedStatusFilter('ACTIVE');
      setAppliedCategoryFilter('');
      setSearchQuery('');
      setAppliedSearchQuery('');
      await loadBooks({ q: '', status: 'ACTIVE', categoryId: '', pageNumber: 1 });
      setSelectedBookId(String(result.book.id));
      setDetailBook(result.book);
      showToast('Đã thêm sách và tải lại danh sách theo trạng thái chuẩn.');
    } catch (error) {
      if (/isbn/i.test(error.message)) {
        setAddErrors((current) => ({ ...current, isbn: 'ISBN đã tồn tại. Vui lòng dùng ISBN khác hoặc để trống.' }));
      }
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBook = async (event) => {
    event.preventDefault();
    if (!selectedBookId) {
      showToast('Vui lòng chọn sách cần cập nhật.', 'error');
      return;
    }

    const errors = validateBookForm(updateForm, books, selectedBookId);
    setUpdateErrors(errors);

    if (Object.keys(errors).length) return;

    try {
      setSaving(true);
      const result = await apiRequest(`/books/${selectedBookId}`, {
        method: 'PUT',
        headers: { 'If-Match': selectedBook.version },
        body: JSON.stringify(makePayload(updateForm)),
      });
      const nextBooks = await loadBooks();
      setDetailBook(nextBooks.find((book) => Number(book.id) === Number(selectedBookId)) || result.book);
      showToast('Đã cập nhật thông tin sách và tải lại trạng thái chuẩn.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedBook) {
      showToast('Vui lòng chọn sách trước khi đổi trạng thái.', 'error');
      return;
    }

    const reason = selectedBook.status === 'INACTIVE'
      ? 'Kích hoạt lại từ giao diện quản lý sách.'
      : 'Ngừng hoạt động từ giao diện quản lý sách.';

    try {
      setSaving(true);
      const body = JSON.stringify({ reason });
      if (selectedBook.status === 'INACTIVE') {
        await apiRequest(`/books/${selectedBook.id}/reactivate`, {
          method: 'PATCH',
          headers: { 'If-Match': selectedBook.version },
          body,
        });
      } else {
        await apiRequest(`/books/${selectedBook.id}/deactivate`, {
          method: 'PATCH',
          headers: { 'If-Match': selectedBook.version },
          body,
        });
      }
      const nextBooks = await loadBooks();
      const refreshedBook = nextBooks.find((book) => Number(book.id) === Number(selectedBook.id));
      if (!refreshedBook) {
        setSelectedBookId('');
        setDetailBook(null);
      } else {
        setDetailBook(refreshedBook);
      }
      showToast(selectedBook.status === 'INACTIVE'
        ? 'Đã kích hoạt lại sách và tải lại trạng thái chuẩn.'
        : 'Đã ngừng hoạt động sách. Sách không còn hiển thị trong tra cứu công khai.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderBookTable = (items, startIndex = 0) => (
    <div className="bm-table-wrap">
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên sách</th>
            <th>ISBN</th>
            <th>Thể loại</th>
            <th>Tác giả</th>
            <th>Nhà xuất bản</th>
            <th>Năm xuất bản</th>
            <th>Số trang</th>
            <th>Trạng thái</th>
            <th>Bản sao</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((book, index) => (
            <tr key={book.id} className={Number(selectedBookId) === Number(book.id) ? 'selected' : ''}>
              <td title={`ID dữ liệu: #${book.id}`}>#{startIndex + index + 1}</td>
              <td>{book.title}</td>
              <td>{book.isbn || '-'}</td>
              <td>{book.category}</td>
              <td>{book.author}</td>
              <td>{book.publisher || '-'}</td>
              <td>{book.year || '-'}</td>
              <td>{book.pages || '-'}</td>
              <td>
                {(() => {
                  const availability = getBookAvailability(book);
                  return <span className={`bm-status ${availability.key}`}>{availability.label}</span>;
                })()}
              </td>
              <td>{book.availableCopies || 0}/{book.totalCopies || 0}</td>
              <td>
                <button type="button" onClick={() => { setSelectedBookId(String(book.id)); handleViewDetails(book.id); }}>
                  <Eye size={15} />
                  Xem
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!items.length && <div className="bm-empty">Không tìm thấy sách phù hợp.</div>}
    </div>
  );

  const renderPagination = () => (
    <div className="bm-pagination" aria-label="Phân trang danh sách sách">
      <span>Trang {page}/{totalPages} • {totalItems} sách</span>
      <div>
        <button type="button" className="bm-soft" onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={loading || page === 1}>Trước</button>
        <span className="bm-page-current">{page}</span>
        <button type="button" className="bm-soft" onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={loading || page >= totalPages}>Sau</button>
      </div>
    </div>
  );

  const renderDetails = () => (
    <section className="bm-panel">
      <div className="bm-panel-head">
        <div>
          <p>Chi tiết sách</p>
          <h2>{detailBook?.title || 'Chọn một cuốn sách'}</h2>
        </div>
        <button className="bm-soft" onClick={() => handleViewDetails()}>
          <RefreshCw size={16} />
          Tải lại
        </button>
      </div>
      {detailBook ? (
        <div className="bm-detail-grid">
          <img src={detailBook.cover} alt={detailBook.title} />
          <div className="bm-detail-card">
            {(() => {
              const availability = getBookAvailability(detailBook);
              return <span className={`bm-status ${availability.key}`}>{availability.label}</span>;
            })()}
            <h3>{detailBook.title}</h3>
            <dl>
              <dt>ISBN</dt><dd>{detailBook.isbn || '-'}</dd>
              <dt>Tác giả</dt><dd>{detailBook.author}</dd>
              <dt>Thể loại</dt><dd>{detailBook.category}</dd>
              <dt>Nhà xuất bản</dt><dd>{detailBook.publisher}</dd>
              <dt>Năm xuất bản</dt><dd>{detailBook.year || '-'}</dd>
              <dt>Số trang</dt><dd>{detailBook.pages || '-'}</dd>
              <dt>Bản sao</dt><dd>{detailBook.availableCopies || 0} có sẵn / {detailBook.totalCopies || 0} tổng cộng</dd>
            </dl>
            <p>{detailBook.description || 'Chưa có mô tả.'}</p>
          </div>
        </div>
      ) : (
        <div className="bm-empty">Chọn một cuốn sách trong danh sách để xem chi tiết.</div>
      )}
    </section>
  );

  return (
    <div className="bm-module">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <main className="bm-main">
        <div className="bm-top-actions">
          <button className="bm-soft" onClick={handleRefreshList} disabled={loading}>
            <RefreshCw size={16} />
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>

        <section className="bm-summary">
           <div><span>Tổng số sách</span><strong>{totalItems}</strong></div>
           <div><span>Đang hoạt động</span><strong>{books.filter((book) => book.status === 'ACTIVE').length}</strong></div>
           <div><span>Ngừng hoạt động</span><strong>{books.filter((book) => book.status === 'INACTIVE').length}</strong></div>
        </section>

        <section className="bm-panel">
          <div className="bm-panel-head">
            <div><p>Tra cứu nhanh</p><h2>Tìm kiếm sách</h2></div>
          </div>
          <form className="bm-search-row" onSubmit={handleSearch}>
             <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} maxLength={200} placeholder="Tìm theo tên sách, ISBN, tác giả hoặc danh mục..." />
            <button className="bm-primary" type="submit"><Search size={17} />Tìm kiếm</button>
          </form>
          {appliedSearchQuery && <p className="bm-applied-filter">Đang tìm: <strong>{appliedSearchQuery}</strong></p>}
        </section>

        <section className="bm-panel">
          <div className="bm-panel-head">
            <div><p>Danh mục quản lý</p><h2>Danh sách sách</h2></div>
            <div className="bm-filters">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">{getStatusLabel('ACTIVE')}</option>
                <option value="INACTIVE">{getStatusLabel('INACTIVE')}</option>
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="">Tất cả danh mục</option>
                {metadata.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <button type="button" className="bm-soft" onClick={handleApplyFilters} disabled={loading}>Áp dụng</button>
            </div>
          </div>
           {renderBookTable(books, (page - 1) * 20)}
          {renderPagination()}
        </section>

        {renderDetails()}

        <section className="bm-two-column">
          <section className="bm-panel">
            <div className="bm-panel-head">
              <div><p>Tạo bản ghi danh mục</p><h2>Thêm sách</h2></div>
            </div>
            <BookForm
              form={addForm}
              setForm={setAddForm}
              metadata={metadata}
              errors={addErrors}
              submitLabel="Thêm sách"
              onSubmit={handleAddBook}
              disabled={saving}
            />
          </section>

          <section className="bm-panel">
            <div className="bm-panel-head">
              <div><p>Chỉnh sửa bản ghi đã chọn</p><h2>Cập nhật thông tin sách</h2></div>
            </div>
            {selectedBook ? (
              <BookForm
                form={updateForm}
                setForm={setUpdateForm}
                metadata={metadata}
                errors={updateErrors}
                submitLabel="Lưu thay đổi"
                onSubmit={handleUpdateBook}
                disabled={saving}
              />
            ) : (
              <div className="bm-empty">Chọn sách trước khi cập nhật.</div>
            )}
          </section>
        </section>

        <section className="bm-panel">
          <div className="bm-panel-head">
            <div><p>Quản lý trạng thái</p><h2>{selectedBook?.status === 'INACTIVE' ? 'Kích hoạt lại sách' : 'Ngừng hoạt động sách'}</h2></div>
          </div>
          {selectedBook ? (
            <div className="bm-danger-box">
              <AlertTriangle size={22} />
              <div>
                <h3>{selectedBook.title}</h3>
                <p>{selectedBook.status === 'INACTIVE'
                  ? 'Kích hoạt lại chỉ đổi trạng thái catalog; bản sao và lịch sử vẫn giữ nguyên.'
                  : 'Ngừng hoạt động sẽ ẩn sách khỏi trang chủ và danh sách công khai nhưng vẫn giữ bản ghi phục vụ lịch sử và kiểm toán.'}</p>
                <button className="bm-danger" onClick={handleStatusChange} disabled={saving}>
                  <Trash2 size={17} />
                  {selectedBook.status === 'INACTIVE' ? 'Kích hoạt lại' : 'Ngừng hoạt động'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bm-empty">Chọn sách trước khi thay đổi trạng thái.</div>
          )}
        </section>
      </main>

      <style>{`
        .bm-module { --bm-accent: #b67a2a; --bm-accent-dark: #8a581d; --bm-border: #e6d5bb; --bm-soft-bg: #f7efe2; color: #2b2118; font-family: var(--sans); }
        .bm-shell { min-height: 100vh; background: #f6f7fb; color: #172033; display: flex; font-family: var(--sans); }
        .bm-sidebar { width: 286px; min-height: 100vh; position: sticky; top: 0; align-self: flex-start; background: #14202e; color: #e5edf7; padding: 22px 16px; display: flex; flex-direction: column; gap: 20px; }
        .bm-brand { display: flex; gap: 12px; align-items: center; padding: 6px 8px 12px; }
        .bm-brand > div { width: 42px; height: 42px; display: grid; place-items: center; background: #2aa198; color: #fff; border-radius: 8px; }
        .bm-brand strong, .bm-brand span { display: block; }
        .bm-brand strong { font-size: 17px; }
        .bm-brand span { color: #9fb0c5; font-size: 12px; margin-top: 3px; }
        .bm-main-nav, .bm-other-nav, .bm-session { display: flex; flex-direction: column; gap: 8px; }
        .bm-main-nav > span { color: #9fb0c5; font-size: 12px; font-weight: 800; text-transform: uppercase; padding: 0 12px 2px; }
        .bm-main-nav button, .bm-other-nav button, .bm-session button { min-height: 44px; border-radius: 8px; border: 0; background: transparent; color: #d7e1ee; display: flex; align-items: center; gap: 10px; padding: 0 12px; cursor: pointer; font-size: 14px; text-align: left; }
        .bm-main-nav button span { flex: 1; }
        .bm-main-nav button:hover, .bm-other-nav button:hover, .bm-session button:hover, .bm-main-nav button.active { background: #243244; color: #fff; }
        .bm-main-nav button.active { box-shadow: inset 3px 0 0 #2aa198; }
        .bm-other-nav, .bm-session { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
        .bm-session { margin-top: auto; }
        .bm-session span { color: #9fb0c5; font-size: 12px; }
        .bm-session strong { color: #fff; font-size: 13px; overflow-wrap: anywhere; }
        .bm-main { flex: 1; padding: 0; min-width: 0; display: grid; gap: 18px; }
        .bm-top-actions { display: flex; justify-content: flex-end; margin-top: -66px; margin-bottom: 22px; min-height: 44px; align-items: center; }
        .bm-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 18px; }
        .bm-header p, .bm-panel-head p { margin: 0 0 6px; color: var(--bm-accent-dark); font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .bm-header h1, .bm-panel-head h2 { margin: 0; color: #24170d; font-family: var(--lib-heading, Georgia, serif); }
        .bm-header span { display: block; color: #765f49; margin-top: 7px; font-size: 14px; }
        .bm-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .bm-summary div, .bm-panel { background: #fffdfa; border: 1px solid var(--bm-border); border-radius: 16px; box-shadow: 0 12px 28px rgba(84,56,27,0.07); }
        .bm-summary div { padding: 18px 20px; border-top: 3px solid var(--bm-accent); }
        .bm-summary span { display: block; color: #765f49; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .bm-summary strong { display: block; font-size: 28px; margin-top: 5px; }
        .bm-form label > span { color: #42526a; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .bm-panel { padding: 20px; }
        .bm-panel-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 18px; }
        .bm-soft, .bm-primary, .bm-danger, .bm-table-wrap button { min-height: 42px; border-radius: 11px; border: 1px solid var(--bm-border); background: #fffdfa; color: #3d2b1c; padding: 0 15px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-weight: 700; }
        .bm-primary { background: var(--bm-accent); border-color: var(--bm-accent); color: #fff; }
        .bm-primary:hover { background: var(--bm-accent-dark); border-color: var(--bm-accent-dark); }
        .bm-danger { background: #dc2626; border-color: #dc2626; color: #fff; margin-top: 12px; }
        .bm-danger:disabled, .bm-primary:disabled, .bm-soft:disabled { opacity: .6; cursor: not-allowed; }
        input, select, textarea { border: 1px solid #cbd6e2; border-radius: 8px; min-height: 40px; padding: 0 11px; font: inherit; color: #172033; background: #fff; }
        textarea { padding-top: 10px; resize: vertical; }
        .bm-search-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-bottom: 16px; }
        .bm-applied-filter { margin: -4px 0 0; color: #765f49; font-size: 13px; }
        .bm-filters { display: flex; flex-wrap: wrap; gap: 8px; }
        .bm-table-wrap { overflow-x: auto; border: 1px solid var(--bm-border); border-radius: 12px; }
        .bm-table-wrap table { width: 100%; border-collapse: collapse; min-width: 1120px; background: #fff; }
        .bm-table-wrap th, .bm-table-wrap td { padding: 12px 13px; text-align: left; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        .bm-table-wrap th { color: #705536; font-size: 12px; text-transform: uppercase; background: #f2e7d5; }
        .bm-table-wrap tr.selected td { background: var(--bm-soft-bg); }
        .bm-status { display: inline-flex; min-width: 78px; justify-content: center; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 800; }
        .bm-status.active { background: #dcfce7; color: #166534; }
        .bm-status.available { background: #dcfce7; color: #166534; }
        .bm-status.borrowed { background: #fee2e2; color: #991b1b; }
        .bm-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .bm-form label { display: grid; gap: 6px; align-content: start; }
        .bm-form .bm-wide, .bm-form button { grid-column: 1 / -1; }
        .bm-form button { justify-self: start; }
        .bm-two-column { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; align-items: start; }
        .bm-field-error { color: #dc2626; font-size: 12px; }
        .bm-detail-grid { display: grid; grid-template-columns: 240px 1fr; gap: 18px; align-items: start; }
        .bm-detail-grid img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 8px; background: #e5e7eb; }
        .bm-detail-card { border: 1px solid #e4ebf3; border-radius: 8px; padding: 16px; }
        .bm-detail-card h3 { margin: 12px 0; font-size: 24px; }
        .bm-detail-card dl { display: grid; grid-template-columns: 140px 1fr; gap: 8px 12px; margin: 0 0 14px; }
        .bm-detail-card dt { color: #607087; font-weight: 800; }
        .bm-detail-card dd { margin: 0; }
        .bm-detail-card p { color: #42526a; line-height: 1.6; margin: 0; }
        .bm-danger-box { display: grid; grid-template-columns: auto 1fr; gap: 14px; border: 1px solid #fecaca; background: #fff7f7; color: #7f1d1d; border-radius: 8px; padding: 16px; max-width: 760px; }
        .bm-danger-box h3 { margin: 0 0 6px; }
        .bm-danger-box p { margin: 0 0 12px; color: #991b1b; }
        .bm-danger-box input { width: 100%; max-width: 480px; border-color: #fca5a5; }
        .bm-empty { padding: 26px; text-align: center; color: #607087; }
        .bm-pagination { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 16px; color: #765f49; }
        .bm-pagination > div { display: flex; align-items: center; gap: 8px; }
        .bm-page-current { min-width: 40px; min-height: 40px; display: grid; place-items: center; border-radius: 10px; background: var(--bm-accent); color: #fff; font-weight: 800; }
        .bm-toast { position: fixed; right: 22px; top: 18px; z-index: 20; border: 0; border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; gap: 9px; box-shadow: 0 16px 36px rgba(20,32,46,0.18); color: #fff; cursor: pointer; }
        .bm-toast.success { background: #0f766e; }
        .bm-toast.error { background: #b91c1c; }
        @media (max-width: 900px) {
          .bm-top-actions { margin-top: 0; margin-bottom: 0; }
          .bm-shell { flex-direction: column; }
          .bm-sidebar { width: 100%; min-height: auto; position: static; }
          .bm-main-nav, .bm-other-nav, .bm-session { flex-direction: row; flex-wrap: wrap; }
          .bm-main-nav > span { width: 100%; }
          .bm-main { padding: 0; }
          .bm-header, .bm-panel-head { flex-direction: column; }
          .bm-summary, .bm-form, .bm-detail-grid, .bm-search-row, .bm-two-column { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
