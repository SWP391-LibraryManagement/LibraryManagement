import { useCallback, useEffect, useState } from 'react';
import Inventory2Icon from '@mui/icons-material/Inventory2';

import { inventoryApi } from '../../api/libraryFeatureApi';
import { EmptyState, StatusNotice, Toast, useToast } from '../shared/Feedback';
import { DataTable, DataToolbar } from '../shared/OperationalPatterns';
import Filter from './Filter';
import BookCopies from './BookCopies';
import StatusBadge from './StatusBadge';

const EMPTY_FILTER = { q: '', barcode: '', location: '', status: '' };

export default function InventoryManagement() {
  const [items, setItems] = useState([]);
  const [countsByStatus, setCountsByStatus] = useState({});
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState(EMPTY_FILTER);
  const [copiesBook, setCopiesBook] = useState(null);
  const [bookCopies, setBookCopies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, showToast, clearToast] = useToast();

  const loadInventory = useCallback(async ({ pageNumber = page, nextFilter = appliedFilter } = {}) => {
    setLoading(true);
    setLoadError('');
    try {
      const params = { page: pageNumber, limit: 20 };
      if (nextFilter.q.trim()) params.q = nextFilter.q.trim();
      if (nextFilter.barcode.trim()) params.barcode = nextFilter.barcode.trim();
      if (nextFilter.location.trim()) params.location = nextFilter.location.trim();
      if (nextFilter.status) params.status = nextFilter.status;
      const result = await inventoryApi.list(params);
      setItems(result.items || []);
      setCountsByStatus(result.countsByStatus || {});
      setTotalItems(result.totalItems || 0);
      setTotalPages(result.totalPages || 0);
      setPage(result.page || pageNumber);
    } catch (error) {
      showToast(error.message, 'error');
      setLoadError(error.message);
      setItems([]);
      setCountsByStatus({});
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [appliedFilter, page, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadInventory(), 0);
    return () => window.clearTimeout(timer);
  }, [loadInventory, reloadKey]);

  async function openBook(book) {
    setCopiesBook(book);
    try {
      const result = await inventoryApi.list({ bookId: book.bookId, page: 1, limit: 100 });
      setBookCopies(result.items || []);
    } catch (error) {
      showToast(error.message, 'error');
      setBookCopies([]);
    }
  }

  async function reloadAfterMutation() {
    await loadInventory();
    if (copiesBook) {
      const result = await inventoryApi.list({ bookId: copiesBook.bookId, page: 1, limit: 100 });
      setBookCopies(result.items || []);
    }
  }

  function resetFilters() {
    setFilter(EMPTY_FILTER);
    setAppliedFilter(EMPTY_FILTER);
    setPage(1);
    setReloadKey((current) => current + 1);
  }

  function applyFilters(event) {
    event.preventDefault();
    setAppliedFilter(filter);
    setPage(1);
    setReloadKey((current) => current + 1);
  }

  const statusCards = ['AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE'];

  return (
    <>
      <Filter filters={filter} onChange={setFilter} onApply={applyFilters} onReset={resetFilters} loading={loading} />
      <div className="lib-card" style={{ marginBottom: 18 }}>
        <DataToolbar
          primary={<strong>Kho bản sao: {totalItems}</strong>}
          filters={statusCards.map((status) => <span className="stat-chip" key={status}>{status}: {countsByStatus[status] || 0}</span>)}
          actions={<button type="button" className="btn btn-outline" onClick={() => loadInventory()} disabled={loading}>{loading ? 'Đang tải...' : 'Tải lại'}</button>}
        />
      </div>
      <DataTable
        caption="Danh sách bản sao trong kho"
        headers={['ID', 'Đầu sách', 'Barcode', 'Vị trí', 'Trạng thái']}
        isEmpty={!items.length}
        emptyState={<EmptyState icon={Inventory2Icon} title="Chưa có bản sao phù hợp" />}
      >
        {items.map((copy) => (
          <tr key={copy.copyId} onClick={() => openBook(copy.book)} style={{ cursor: 'pointer' }}>
            <td data-label="ID">#{copy.copyId}</td>
            <td data-label="Đầu sách">{copy.book?.title || `Sách #${copy.bookId}`}</td>
            <td data-label="Barcode"><strong>{copy.barcode}</strong></td>
            <td data-label="Vị trí">{copy.location || '-'}</td>
            <td data-label="Trạng thái"><StatusBadge status={copy.status} /></td>
          </tr>
        ))}
      </DataTable>
      <div className="lib-card" style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Trang {page}/{totalPages || 1}</span>
        <div className="row-flex">
          <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Trước</button>
          <button type="button" className="btn btn-outline" disabled={!totalPages || page >= totalPages} onClick={() => setPage((current) => current + 1)}>Sau</button>
        </div>
      </div>
      {copiesBook && <BookCopies book={copiesBook} copies={bookCopies} onClose={() => setCopiesBook(null)} onChanged={reloadAfterMutation} showToast={showToast} />}
      {loadError && !loading && <StatusNotice type="error" title="Không thể tải dữ liệu kho">{loadError}</StatusNotice>}
      {!loadError && !items.length && !loading && <StatusNotice type="info" title="Không có dữ liệu">Thử điều chỉnh bộ lọc hoặc tải lại từ backend.</StatusNotice>}
      <Toast toast={toast} onClose={clearToast} />
    </>
  );
}
