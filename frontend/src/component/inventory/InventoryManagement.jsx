import { useMemo, useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import Inventory2Icon from '@mui/icons-material/Inventory2';

import { EmptyState, StatusNotice, Toast, useToast } from '../shared/Feedback';
import { DataTable } from '../shared/OperationalPatterns';
import Filter from './Filter';
import BookCopies from './BookCopies';
import EditBookModal from './EditBookModal';
import { MOCK_BOOKS, MOCK_COPIES } from './mockData';

const copiesCountMap = MOCK_COPIES.reduce((counts, copy) => {
  counts[copy.bookId] = (counts[copy.bookId] ?? 0) + 1;
  return counts;
}, {});

const EMPTY_FILTER = { title: '', author: '', fromYear: '', toYear: '' };

export default function InventoryManagement() {
  const [books, setBooks] = useState(MOCK_BOOKS);
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [editBook, setEditBook] = useState(null);
  const [copiesBook, setCopiesBook] = useState(null);
  const [toast, showToast, clearToast] = useToast();

  const filtered = useMemo(() => books.filter((book) => {
    if (filter.title && !book.title.toLowerCase().includes(filter.title.toLowerCase())) return false;
    if (filter.author && !book.author.toLowerCase().includes(filter.author.toLowerCase())) return false;
    if (filter.fromYear && book.publishYear < Number(filter.fromYear)) return false;
    if (filter.toYear && book.publishYear > Number(filter.toYear)) return false;
    return true;
  }), [books, filter]);

  function handleSave(updated) {
    setBooks((current) => current.map((book) => book.id === updated.id ? updated : book));
    setEditBook(null);
    showToast('Đã cập nhật thông tin đầu sách trong dữ liệu trình diễn.', 'success');
  }

  const copiesForBook = copiesBook
    ? MOCK_COPIES.filter((copy) => copy.bookId === copiesBook.id)
    : [];

  return (
    <>
      <StatusNotice type="warning" title="Dữ liệu trình diễn">
        Màn hình này vẫn dùng dữ liệu mẫu cho đến khi kế hoạch FE06 được phê duyệt.
      </StatusNotice>

      <Filter filters={filter} onChange={setFilter} onReset={() => setFilter(EMPTY_FILTER)} />

      <DataTable
        caption="Inventory books table"
        headers={['ID', 'Tên đầu sách', 'Tác giả', 'Thể loại', 'ISBN', 'NXB', 'Bản sao', { label: 'Thao tác', align: 'right' }]}
        isEmpty={filtered.length === 0}
        emptyState={<EmptyState icon={Inventory2Icon} title="Không tìm thấy đầu sách phù hợp" />}
      >
        {filtered.map((book) => (
          <tr key={book.id} style={{ cursor: 'pointer' }} onClick={() => setCopiesBook(book)}>
            <td data-label="ID">#{book.id}</td>
            <td data-label="Tên đầu sách"><strong>{book.title}</strong></td>
            <td data-label="Tác giả">{book.author}</td>
            <td data-label="Thể loại"><span className="badge badge-default">{book.genre}</span></td>
            <td data-label="ISBN">{book.isbn}</td>
            <td data-label="NXB">{book.publishYear}</td>
            <td data-label="Bản sao"><span className="badge badge-info">{copiesCountMap[book.id] ?? 0}</span></td>
            <td data-label="Thao tác" style={{ textAlign: 'right' }} onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="icon-btn"
                title="Chỉnh sửa đầu sách"
                aria-label={`Chỉnh sửa ${book.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setEditBook(book);
                }}
              >
                <EditIcon fontSize="small" />
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {filtered.length > 0 && <p className="field-hint" style={{ textAlign: 'right', marginTop: 8 }}>Chọn một dòng để xem bản sao.</p>}

      {editBook && <EditBookModal book={editBook} onSave={handleSave} onClose={() => setEditBook(null)} />}
      {copiesBook && (
        <BookCopies
          book={copiesBook}
          copies={copiesForBook}
          onClose={() => setCopiesBook(null)}
          onChanged={async () => {}}
          showToast={showToast}
        />
      )}
      <Toast toast={toast} onClose={clearToast} />
    </>
  );
}
