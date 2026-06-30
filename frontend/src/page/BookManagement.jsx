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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const DEFAULT_FORM = {
  title: '',
  isbn: '',
  categoryId: '',
  authorId: '',
  publisherId: '',
  publishYear: '',
  pages: '',
  rating: '0',
  status: 'ACTIVE',
  copyStatus: 'AVAILABLE',
  coverUrl: '',
  description: '',
};

function getToken() {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.error?.message || result.message || 'Không thể xử lý yêu cầu.');
  }

  return result;
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
    rating: book.rating === undefined || book.rating === null ? '0' : String(book.rating),
    status: book.status || 'ACTIVE',
    copyStatus: Number(book.availableCopies || 0) > 0 ? 'AVAILABLE' : 'BORROWED',
    coverUrl: book.cover || '',
    description: book.description || '',
  };
}

function validateBookForm(form, currentBooks = [], editingBookId = null, { allowStatus = false } = {}) {
  const errors = {};
  const currentYear = new Date().getFullYear();
  const title = form.title.trim();
  const isbn = form.isbn.trim();
  const publishYear = form.publishYear ? Number(form.publishYear) : null;
  const pages = form.pages ? Number(form.pages) : null;
  const rating = form.rating === '' ? 0 : Number(form.rating);
  const duplicate = isbn && currentBooks.some((book) => (
    String(book.isbn || '').toLowerCase() === isbn.toLowerCase() && Number(book.id) !== Number(editingBookId)
  ));

  if (!title) errors.title = 'Book title is required.';
  if (title.length > 255) errors.title = 'Book title must be 255 characters or fewer.';
  if (isbn.length > 50) errors.isbn = 'ISBN must be 50 characters or fewer.';
  if (duplicate) errors.isbn = 'ISBN already exists.';
  if (!form.categoryId) errors.categoryId = 'Category is required.';
  if (!form.authorId) errors.authorId = 'Author is required.';
  if (publishYear && (!Number.isInteger(publishYear) || publishYear < 1 || publishYear > currentYear)) {
    errors.publishYear = `Publish year must not be greater than ${currentYear}.`;
  }
  if (pages && (!Number.isInteger(pages) || pages < 1)) errors.pages = 'Pages must be a positive number.';
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) errors.rating = 'Rating must be between 0 and 5.';
  if (allowStatus && !['AVAILABLE', 'BORROWED'].includes(form.copyStatus)) {
    errors.copyStatus = 'Tình trạng sách phải là Còn sách hoặc Đã mượn.';
  }
  if (form.coverUrl.trim() && !/^https?:\/\/[^\s]+$/i.test(form.coverUrl.trim()) && !form.coverUrl.trim().startsWith('/')) {
    errors.coverUrl = 'Cover URL must start with http(s) or /.';
  }
  if (form.description.length > 2000) errors.description = 'Description must be 2000 characters or fewer.';

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
    rating: form.rating === '' ? 0 : Number(form.rating),
    status: form.status || 'ACTIVE',
    coverUrl: form.coverUrl.trim(),
    description: form.description.trim(),
  };
}

function getBookAvailability(book) {
  if (book.status === 'INACTIVE') {
    return { key: 'inactive', label: 'INACTIVE' };
  }

  return Number(book.availableCopies || 0) > 0
    ? { key: 'available', label: 'Còn sách' }
    : { key: 'borrowed', label: 'Đã mượn' };
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

function BookForm({ form, setForm, metadata, errors, submitLabel, onSubmit, disabled, showAvailabilityStatus = false }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <form className="bm-form" onSubmit={onSubmit}>
      <label>
        <span>Book Title</span>
        <input value={form.title} onChange={(event) => update('title', event.target.value)} maxLength={255} />
        <FieldError message={errors.title} />
      </label>

      <label>
        <span>ISBN</span>
        <input value={form.isbn} onChange={(event) => update('isbn', event.target.value)} maxLength={50} />
        <FieldError message={errors.isbn} />
      </label>

      <label>
        <span>Category</span>
        <select value={form.categoryId} onChange={(event) => update('categoryId', event.target.value)}>
          <option value="">Select category</option>
          {metadata.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <FieldError message={errors.categoryId} />
      </label>

      <label>
        <span>Author</span>
        <select value={form.authorId} onChange={(event) => update('authorId', event.target.value)}>
          <option value="">Select author</option>
          {metadata.authors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <FieldError message={errors.authorId} />
      </label>

      <label>
        <span>Publisher</span>
        <select value={form.publisherId} onChange={(event) => update('publisherId', event.target.value)}>
          <option value="">No publisher</option>
          {metadata.publishers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>

      <label>
        <span>Publish Year</span>
        <input type="number" value={form.publishYear} onChange={(event) => update('publishYear', event.target.value)} />
        <FieldError message={errors.publishYear} />
      </label>

      <label>
        <span>Pages</span>
        <input type="number" value={form.pages} onChange={(event) => update('pages', event.target.value)} />
        <FieldError message={errors.pages} />
      </label>

      {showAvailabilityStatus && (
        <label>
          <span>Tình trạng</span>
          <select value={form.copyStatus} onChange={(event) => update('copyStatus', event.target.value)}>
            <option value="AVAILABLE">Còn sách</option>
            <option value="BORROWED">Đã mượn</option>
          </select>
          <FieldError message={errors.copyStatus} />
        </label>
      )}

      <label className="bm-wide">
        <span>Cover URL</span>
        <input value={form.coverUrl} onChange={(event) => update('coverUrl', event.target.value)} maxLength={255} />
        <FieldError message={errors.coverUrl} />
      </label>

      <label className="bm-wide">
        <span>Description</span>
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
  const [searchResults, setSearchResults] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [addForm, setAddForm] = useState(DEFAULT_FORM);
  const [updateForm, setUpdateForm] = useState(DEFAULT_FORM);
  const [addErrors, setAddErrors] = useState({});
  const [updateErrors, setUpdateErrors] = useState({});
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
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

  const loadBooks = useCallback(async () => {
    const params = new URLSearchParams({ limit: '100' });
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('categoryId', categoryFilter);
    const result = await apiRequest(`/books/management?${params.toString()}`);
    const nextBooks = result.data || [];
    setBooks(nextBooks);
    setSelectedBookId((currentSelectedBookId) => {
      if (nextBooks.length && !nextBooks.some((book) => Number(book.id) === Number(currentSelectedBookId))) {
        return String(nextBooks[0].id);
      }

      return nextBooks.length ? currentSelectedBookId : '';
    });
  }, [categoryFilter, statusFilter]);

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
  }, [loadBooks]);

  useEffect(() => {
    if (selectedBook) {
      const timer = window.setTimeout(() => {
        setUpdateForm(toForm(selectedBook));
        setDetailBook(selectedBook);
        setDeleteConfirmed(false);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [selectedBook]);

  const handleRefreshList = async () => {
    try {
      setLoading(true);
      await loadBooks();
      showToast('Book list refreshed.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const keyword = searchQuery.trim();

    if (!keyword) {
      showToast('Please enter a search keyword.', 'error');
      return;
    }

    if (keyword.length > 100) {
      showToast('Search keyword must be 100 characters or fewer.', 'error');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({ q: keyword });
      const result = await apiRequest(`/books?${params.toString()}`);
      setSearchResults(result.data || []);
      showToast(`Found ${result.data?.length || 0} active book(s).`);
    } catch (error) {
      showToast(error.message, 'error');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (bookId = selectedBookId) => {
    if (!bookId) {
      showToast('Please select a book first.', 'error');
      return;
    }

    try {
      setLoading(true);
      const result = await apiRequest(`/books/${bookId}`);
      setDetailBook(result.data);
      setSelectedBookId(String(result.data.id));
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
      showToast('Please fix the highlighted Add Book fields before submitting.', 'error');
      return;
    }

    try {
      setSaving(true);
      const result = await apiRequest('/books', {
        method: 'POST',
        body: JSON.stringify(makePayload(addForm)),
      });
      setAddForm(DEFAULT_FORM);
      await loadBooks();
      setSelectedBookId(String(result.data.id));
      setDetailBook(result.data);
      showToast('Add book successfully. Refresh homepage to see the newest active book first.');
    } catch (error) {
      if (/isbn/i.test(error.message)) {
        setAddErrors((current) => ({ ...current, isbn: 'ISBN already exists. Please use a unique ISBN or leave it blank.' }));
      }
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBook = async (event) => {
    event.preventDefault();
    if (!selectedBookId) {
      showToast('Please select a book to update.', 'error');
      return;
    }

    const errors = validateBookForm(updateForm, books, selectedBookId, { allowStatus: true });
    setUpdateErrors(errors);

    if (Object.keys(errors).length) return;

    try {
      setSaving(true);
      const result = await apiRequest(`/books/${selectedBookId}`, {
        method: 'PUT',
        body: JSON.stringify(makePayload(updateForm)),
      });
      const availabilityResult = await apiRequest(`/books/${selectedBookId}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ copyStatus: updateForm.copyStatus }),
      });
      await loadBooks();
      setDetailBook(availabilityResult.data || result.data);
      showToast('Book information and availability updated. Homepage will show the new status.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) {
      showToast('Please select a book to delete.', 'error');
      return;
    }

    if (!deleteConfirmed) {
      showToast('Please confirm that this book should be removed from the public catalog.', 'error');
      return;
    }

    try {
      setSaving(true);
      const result = await apiRequest(`/books/${selectedBook.id}/deactivate`, { method: 'PATCH', body: JSON.stringify({}) });
      await loadBooks();
      setDetailBook(result.data);
      setDeleteConfirmed(false);
      showToast('Book deleted from the public catalog. It is now hidden from homepage search.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderBookTable = (items) => (
    <div className="bm-table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>ISBN</th>
            <th>Category</th>
            <th>Author</th>
            <th>Publisher</th>
            <th>Year</th>
            <th>Pages</th>
            <th>Rating</th>
            <th>Status</th>
            <th>Copies</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((book) => (
            <tr key={book.id} className={Number(selectedBookId) === Number(book.id) ? 'selected' : ''}>
              <td>#{book.id}</td>
              <td>{book.title}</td>
              <td>{book.isbn || '-'}</td>
              <td>{book.category}</td>
              <td>{book.author}</td>
              <td>{book.publisher || '-'}</td>
              <td>{book.year || '-'}</td>
              <td>{book.pages || '-'}</td>
              <td>{book.rating || 0}</td>
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
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!items.length && <div className="bm-empty">No books found.</div>}
    </div>
  );

  const renderDetails = () => (
    <section className="bm-panel">
      <div className="bm-panel-head">
        <div>
          <p>Book Detail</p>
          <h2>{detailBook?.title || 'Select a book'}</h2>
        </div>
        <button className="bm-soft" onClick={() => handleViewDetails()}>
          <RefreshCw size={16} />
          Reload
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
              <dt>Author</dt><dd>{detailBook.author}</dd>
              <dt>Category</dt><dd>{detailBook.category}</dd>
              <dt>Publisher</dt><dd>{detailBook.publisher}</dd>
              <dt>Publish Year</dt><dd>{detailBook.year || '-'}</dd>
              <dt>Pages</dt><dd>{detailBook.pages || '-'}</dd>
              <dt>Rating</dt><dd>{detailBook.rating}/5</dd>
              <dt>Copies</dt><dd>{detailBook.availableCopies || 0} available / {detailBook.totalCopies || 0} total</dd>
            </dl>
            <p>{detailBook.description || 'No description.'}</p>
          </div>
        </div>
      ) : (
        <div className="bm-empty">Choose a book from the list to view details.</div>
      )}
    </section>
  );

  return (
    <div className="bm-module">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <main className="bm-main">
        <header className="bm-header">
          <div>
            <p>FE05 Book Management</p>
            <h1>Book Management</h1>
            <span>Manage catalog records and keep ACTIVE books visible on the public homepage.</span>
          </div>
          <button className="bm-soft" onClick={handleRefreshList} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <section className="bm-summary">
          <div><span>Total</span><strong>{books.length}</strong></div>
          <div><span>Active</span><strong>{books.filter((book) => book.status === 'ACTIVE').length}</strong></div>
          <div><span>Inactive</span><strong>{books.filter((book) => book.status === 'INACTIVE').length}</strong></div>
        </section>

        <section className="bm-panel">
          <div className="bm-panel-head">
            <div><p>Public search</p><h2>Search Books</h2></div>
          </div>
          <form className="bm-search-row" onSubmit={handleSearch}>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} maxLength={100} placeholder="Search by title, ISBN, author, category..." />
            <button className="bm-primary" type="submit"><Search size={17} />Search</button>
          </form>
          {searchResults.length > 0 && renderBookTable(searchResults)}
        </section>

        <section className="bm-panel">
          <div className="bm-panel-head">
            <div><p>Management list</p><h2>View Book List</h2></div>
            <div className="bm-filters">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="">All categories</option>
                {metadata.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <button className="bm-soft" onClick={handleRefreshList}>Apply</button>
            </div>
          </div>
          {renderBookTable(books)}
        </section>

        {renderDetails()}

        <section className="bm-two-column">
          <section className="bm-panel">
            <div className="bm-panel-head">
              <div><p>Create catalog record</p><h2>Add Book</h2></div>
            </div>
            <BookForm
              form={addForm}
              setForm={setAddForm}
              metadata={metadata}
              errors={addErrors}
              submitLabel="Add Book"
              onSubmit={handleAddBook}
              disabled={saving}
            />
          </section>

          <section className="bm-panel">
            <div className="bm-panel-head">
              <div><p>Edit selected record</p><h2>Update Book Information</h2></div>
            </div>
            {selectedBook ? (
              <BookForm
                form={updateForm}
                setForm={setUpdateForm}
                metadata={metadata}
                errors={updateErrors}
                submitLabel="Save Changes"
                onSubmit={handleUpdateBook}
                disabled={saving}
                showAvailabilityStatus
              />
            ) : (
              <div className="bm-empty">Select a book before updating.</div>
            )}
          </section>
        </section>

        <section className="bm-panel">
          <div className="bm-panel-head">
            <div><p>Catalog removal</p><h2>Delete Book</h2></div>
          </div>
          {selectedBook ? (
            <div className="bm-danger-box">
              <AlertTriangle size={22} />
              <div>
                <h3>{selectedBook.title}</h3>
                <p>Deleting a book removes it from homepage search and public book lists. The staff catalog keeps the record for audit history.</p>
                <label className="bm-confirm-line">
                  <input
                    type="checkbox"
                    checked={deleteConfirmed}
                    onChange={(event) => setDeleteConfirmed(event.target.checked)}
                  />
                  <span>I understand this book will be hidden from members and guests.</span>
                </label>
                <button className="bm-danger" onClick={handleDeleteBook} disabled={saving || selectedBook.status === 'INACTIVE'}>
                  <Trash2 size={17} />
                  {selectedBook.status === 'INACTIVE' ? 'Already Deleted' : 'Delete Book'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bm-empty">Select a book before deleting.</div>
          )}
        </section>
      </main>

      <style>{`
        .bm-module { color: #172033; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .bm-shell { min-height: 100vh; background: #f6f7fb; color: #172033; display: flex; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
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
        .bm-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 18px; }
        .bm-header p, .bm-panel-head p { margin: 0 0 6px; color: #2aa198; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .bm-header h1, .bm-panel-head h2 { margin: 0; color: #172033; }
        .bm-header span { display: block; color: #607087; margin-top: 7px; font-size: 14px; }
        .bm-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .bm-summary div, .bm-panel { background: #fff; border: 1px solid #dde5ef; border-radius: 8px; box-shadow: 0 12px 28px rgba(20,32,46,0.06); }
        .bm-summary div { padding: 16px; }
        .bm-summary span { display: block; color: #607087; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .bm-summary strong { display: block; font-size: 28px; margin-top: 5px; }
        .bm-form label > span { color: #42526a; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .bm-panel { padding: 18px; }
        .bm-panel-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 18px; }
        .bm-soft, .bm-primary, .bm-danger, .bm-table-wrap button { min-height: 38px; border-radius: 8px; border: 1px solid #c9d5e4; background: #fff; color: #26354a; padding: 0 13px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-weight: 700; }
        .bm-primary { background: #2aa198; border-color: #2aa198; color: #fff; }
        .bm-danger { background: #dc2626; border-color: #dc2626; color: #fff; margin-top: 12px; }
        .bm-danger:disabled, .bm-primary:disabled, .bm-soft:disabled { opacity: .6; cursor: not-allowed; }
        input, select, textarea { border: 1px solid #cbd6e2; border-radius: 8px; min-height: 40px; padding: 0 11px; font: inherit; color: #172033; background: #fff; }
        textarea { padding-top: 10px; resize: vertical; }
        .bm-search-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-bottom: 16px; }
        .bm-filters { display: flex; flex-wrap: wrap; gap: 8px; }
        .bm-table-wrap { overflow-x: auto; border: 1px solid #e4ebf3; border-radius: 8px; }
        .bm-table-wrap table { width: 100%; border-collapse: collapse; min-width: 1120px; background: #fff; }
        .bm-table-wrap th, .bm-table-wrap td { padding: 12px 13px; text-align: left; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        .bm-table-wrap th { color: #607087; font-size: 12px; text-transform: uppercase; background: #f8fafc; }
        .bm-table-wrap tr.selected td { background: #ecfdf9; }
        .bm-status { display: inline-flex; min-width: 78px; justify-content: center; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 800; }
        .bm-status.active { background: #dcfce7; color: #166534; }
        .bm-status.inactive { background: #fee2e2; color: #991b1b; }
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
        .bm-confirm-line { display: flex; align-items: center; gap: 10px; margin: 10px 0 2px; color: #7f1d1d; font-weight: 700; }
        .bm-confirm-line input { width: 18px; min-height: 18px; padding: 0; accent-color: #dc2626; }
        .bm-empty { padding: 26px; text-align: center; color: #607087; }
        .bm-toast { position: fixed; right: 22px; top: 18px; z-index: 20; border: 0; border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; gap: 9px; box-shadow: 0 16px 36px rgba(20,32,46,0.18); color: #fff; cursor: pointer; }
        .bm-toast.success { background: #0f766e; }
        .bm-toast.error { background: #b91c1c; }
        @media (max-width: 900px) {
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
