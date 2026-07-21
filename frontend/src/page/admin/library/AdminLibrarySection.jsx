import { BookOpen, Building2, Edit2, ExternalLink, FileDown, Plus, PowerOff, RefreshCw, Search, Tags, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminApi } from '../../../api/adminApi';
import { downloadDocx } from '../../../utils/adminDocxExport';
import { createLatestRequestGuard } from '../../../utils/latestRequestGuard';
import { getStatusLabel } from '../../../utils/uiLabels';
import { AdminActionButton } from '../components/AdminActionButton';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminFilterBar } from '../components/AdminFilterBar';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPagination } from '../components/AdminPagination';

const PAGE_SIZE = 8;
const RESOURCES = Object.freeze([
  { id: 'books', label: 'Kho sách', icon: BookOpen },
  { id: 'authors', label: 'Tác giả', icon: Users },
  { id: 'publishers', label: 'Nhà xuất bản', icon: Building2 },
  { id: 'categories', label: 'Danh mục', icon: Tags },
]);
const LIBRARY_DOCX_COLUMNS = [
  { key: 'id', label: 'ID' }, { key: 'title', label: 'Tên sách' }, { key: 'name', label: 'Tên' },
  { key: 'isbn', label: 'ISBN' }, { key: 'category', label: 'Danh mục' },
  { key: 'author', label: 'Tác giả' }, { key: 'publisher', label: 'Nhà xuất bản' },
  { key: 'status', label: 'Trạng thái' },
];

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function MetadataModal({ item, onClose, onSubmit }) {
  const [name, setName] = useState(item?.name || '');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ name: name.trim() });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <form className="admin-modal admin-modal--compact" role="dialog" aria-modal="true" aria-labelledby="admin-metadata-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}>
        <header className="admin-modal__header"><div><p>{item ? 'Cập nhật' : 'Tạo mới'}</p><h2 id="admin-metadata-title">Dữ liệu thư viện</h2></div><button type="button" disabled={saving} onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button></header>
        <div className="admin-modal__body admin-modal__body--single"><label className="admin-field"><span>Tên</span><input value={name} maxLength={100} required onChange={(event) => setName(event.target.value)} /></label></div>
        <footer className="admin-modal__actions"><button type="button" disabled={saving} onClick={onClose}>Hủy</button><button className="admin-modal__primary" type="submit" disabled={saving || !name.trim()}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></footer>
      </form>
    </div>
  );
}

export function AdminLibrarySection({ onToast }) {
  const navigate = useNavigate();
  const requestGuard = useRef(createLatestRequestGuard());
  const [resource, setResource] = useState('books');
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [appliedFilters, setAppliedFilters] = useState({ q: '', status: 'ALL' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [modal, setModal] = useState(null);

  const notify = useCallback((type, message) => onToast?.({ type, message }), [onToast]);

  const loadLibrary = useCallback(async ({ announce = false } = {}) => {
    const token = requestGuard.current.begin();
    setLoading(true);
    setError('');
    try {
      const params = {
        q: appliedFilters.q.trim(),
        status: appliedFilters.status === 'ALL' ? '' : appliedFilters.status,
      };
      const result = resource === 'books'
        ? await adminApi.libraryBooks(params)
        : await adminApi.libraryResource(resource, params);
      if (!requestGuard.current.isLatest(token)) return;
      setRows(result.data || []);
      setPage(1);
      setUpdatedAt(new Date());
      if (announce) notify('success', 'Dữ liệu thư viện đã được làm mới.');
    } catch (loadError) {
      if (!requestGuard.current.isLatest(token)) return;
      setRows([]);
      setError(loadError.message);
      notify('error', loadError.message);
    } finally {
      if (requestGuard.current.isLatest(token)) setLoading(false);
    }
  }, [appliedFilters.q, appliedFilters.status, notify, resource]);

  useEffect(() => {
    const timer = window.setTimeout(loadLibrary, 0);
    return () => window.clearTimeout(timer);
  }, [loadLibrary]);

  function changeResource(nextResource) {
    setResource(nextResource);
    setQuery('');
    setStatus('ALL');
    setAppliedFilters({ q: '', status: 'ALL' });
    setPage(1);
    setModal(null);
  }

  async function saveMetadata(form) {
    if (resource === 'books') {
      notify('error', 'Sách chỉ xem tại đây; hãy dùng màn hình Quản lý sách để chỉnh sửa.');
      return;
    }
    try {
      if (modal?.item) await adminApi.updateResource(resource, modal.item.id, form);
      else await adminApi.createResource(resource, form);
      setModal(null);
      await loadLibrary();
      notify('success', 'Dữ liệu thư viện đã được lưu.');
    } catch (saveError) {
      notify('error', saveError.message);
      throw saveError;
    }
  }

  async function deactivateMetadata(row) {
    if (row.status === 'INACTIVE') return;
    if (!window.confirm(`Vô hiệu hóa “${row.name}”? Mục này sẽ không còn được dùng cho sách mới.`)) return;
    try {
      await adminApi.deactivateResource(resource, row.id);
      await loadLibrary();
      notify('success', 'Dữ liệu đã được vô hiệu hóa.');
    } catch (deactivateError) {
      notify('error', deactivateError.message);
    }
  }

  async function exportLibrary() {
    const columns = LIBRARY_DOCX_COLUMNS.filter(({ key }) => rows.some((row) => row[key] !== undefined));
    await downloadDocx(`${resource}.docx`, 'Dữ liệu thư viện', rows, columns);
  }

  const pageRows = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [page, rows]);

  return (
    <section className="admin-library">
      <AdminPageHeader
        eyebrow="Kho dữ liệu thư viện"
        title="Thư viện"
        refreshing={loading}
        onRefresh={() => loadLibrary({ announce: true })}
        primaryAction={resource === 'books'
          ? <AdminActionButton icon={ExternalLink} label="Mở Quản lý sách" tone="primary" onClick={() => navigate('/librarian/books')} />
          : <AdminActionButton icon={Plus} label="Thêm mới" tone="primary" onClick={() => setModal({ item: null })} />}
      />

      <nav className="admin-section-tabs" aria-label="Loại dữ liệu thư viện">
        {RESOURCES.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={resource === id ? 'page' : undefined} onClick={() => changeResource(id)}><Icon aria-hidden="true" /><span>{label}</span></button>)}
      </nav>

      <div className="admin-section-status" aria-live="polite"><span>{updatedAt ? `Cập nhật lần cuối lúc ${updatedAt.toLocaleTimeString('vi-VN')}` : 'Chưa tải dữ liệu thư viện.'}</span>{error ? <strong className="admin-text-error">{error}</strong> : null}</div>

      <AdminFilterBar actions={<><AdminActionButton icon={Search} label="Tìm kiếm" tone="primary" disabled={loading} onClick={() => setAppliedFilters({ q: query, status })} /><AdminActionButton icon={FileDown} label="Xuất DOCX" disabled={loading || rows.length === 0} onClick={exportLibrary} /></>}>
        <label className="admin-field admin-field--search"><span>Tìm dữ liệu thư viện</span><input value={query} placeholder="Tên, ISBN hoặc mã dữ liệu" onChange={(event) => setQuery(event.target.value)} /></label>
        {resource === 'books' ? <label className="admin-field"><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Mọi trạng thái</option><option value="ACTIVE">{getStatusLabel('ACTIVE')}</option><option value="INACTIVE">{getStatusLabel('INACTIVE')}</option></select></label> : null}
      </AdminFilterBar>

      <section className="admin-library-directory">
        <div className="admin-table-scroll">
          <table className="admin-data-table">
            {resource === 'books' ? (
              <><thead><tr><th>ID</th><th>Tên sách</th><th>ISBN</th><th>Danh mục</th><th>Tác giả</th><th>NXB</th><th>Năm</th><th>Bản sao</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{pageRows.map((row) => <tr key={row.id}><td>#{row.id}</td><td><strong>{row.title}</strong></td><td>{row.isbn || '-'}</td><td>{row.category || '-'}</td><td>{row.author || '-'}</td><td>{row.publisher || '-'}</td><td>{row.publishYear || row.year || '-'}</td><td>{row.availableCopies || 0}/{row.totalCopies || 0}</td><td><span className={`admin-badge admin-badge--status-${String(row.status || 'ACTIVE').toLowerCase()}`}>{getStatusLabel(row.status || 'ACTIVE')}</span></td><td><AdminActionButton icon={ExternalLink} label="Quản lý sách" onClick={() => navigate('/librarian/books')} /></td></tr>)}</tbody></>
            ) : (
              <><thead><tr><th>STT</th><th>Tên</th><th>Ngày tạo</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{pageRows.map((row, index) => <tr key={row.id}><td>{(page - 1) * PAGE_SIZE + index + 1}</td><td><strong>{row.name}</strong></td><td>{formatDate(row.createdAt)}</td><td><span className={`admin-badge admin-badge--status-${String(row.status || 'ACTIVE').toLowerCase()}`}>{getStatusLabel(row.status || 'ACTIVE')}</span></td><td><div className="admin-user-actions"><AdminActionButton icon={Edit2} label="Chỉnh sửa" onClick={() => setModal({ item: row })} /><AdminActionButton icon={PowerOff} label="Vô hiệu hóa" tone="danger" disabled={row.status === 'INACTIVE'} onClick={() => deactivateMetadata(row)} /></div></td></tr>)}</tbody></>
            )}
          </table>
        </div>
        {!loading && rows.length === 0 ? <AdminEmptyState icon={BookOpen} title="Không tìm thấy dữ liệu thư viện" description={error || 'Hãy điều chỉnh bộ lọc hoặc tạo dữ liệu mới.'} /> : null}
        {loading && rows.length === 0 ? <AdminEmptyState icon={RefreshCw} title="Đang tải dữ liệu thư viện" description="Dữ liệu đang được đồng bộ." /> : null}
        <AdminPagination page={page} totalItems={rows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </section>

      {modal ? <MetadataModal item={modal.item} onClose={() => setModal(null)} onSubmit={saveMetadata} /> : null}
    </section>
  );
}
