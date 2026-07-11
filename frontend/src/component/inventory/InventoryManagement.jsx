import { useState, useMemo } from "react";
import EditIcon from "@mui/icons-material/Edit";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import Filter from "./Filter";
import BookCopies from "./BookCopies";
import EditBookModal from "./EditBookModal";
import { MOCK_BOOKS, MOCK_COPIES } from "./mockData";

const copiesCountMap = MOCK_COPIES.reduce((acc, c) => {
  acc[c.bookId] = (acc[c.bookId] ?? 0) + 1;
  return acc;
}, {});

const EMPTY_FILTER = { title: "", author: "", yearFrom: "", yearTo: "" };

export default function InventoryManagement() {
  const [books, setBooks] = useState(MOCK_BOOKS);
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [editBook, setEditBook] = useState(null);
  const [copiesBook, setCopiesBook] = useState(null);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      if (filter.title && !b.title.toLowerCase().includes(filter.title.toLowerCase())) return false;
      if (filter.author && !b.author.toLowerCase().includes(filter.author.toLowerCase())) return false;
      if (filter.yearFrom && b.publishYear < Number(filter.yearFrom)) return false;
      if (filter.yearTo && b.publishYear > Number(filter.yearTo)) return false;
      return true;
    });
  }, [books, filter]);

  const handleSave = (updated) => {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditBook(null);
  };

  const copiesForBook = copiesBook
    ? MOCK_COPIES.filter((c) => c.bookId === copiesBook.id)
    : [];

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Page header */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Inventory2Icon style={{ fontSize: 22, color: "#0d6efd" }} />
        <div>
          <h5 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "#212529" }}>
            Quản lý kho sách
          </h5>
          <p style={{ margin: 0, fontSize: 12, color: "#6c757d" }}>
            Danh sách đầu sách và bản sao trong thư viện
          </p>
        </div>
        <div className="ms-auto">
          <span
            className="badge"
            style={{ background: "#e7f1ff", color: "#0d6efd", fontWeight: 600, fontSize: 12, padding: "5px 10px" }}
          >
            {filtered.length} đầu sách
          </span>
        </div>
      </div>

      {/* Filter */}
      <Filter values={filter} onChange={setFilter} onReset={() => setFilter(EMPTY_FILTER)} />

      {/* Table card */}
      <div
        className="card"
        style={{ border: "1px solid #dee2e6", borderRadius: 8, overflow: "hidden" }}
      >
        <div style={{ overflowX: "auto" }}>
          <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                <th style={{ fontWeight: 600, color: "#495057", width: 56, paddingLeft: 16 }}>ID</th>
                <th style={{ fontWeight: 600, color: "#495057" }}>Tên đầu sách</th>
                <th style={{ fontWeight: 600, color: "#495057" }}>Tác giả</th>
                <th style={{ fontWeight: 600, color: "#495057" }}>Thể loại</th>
                <th style={{ fontWeight: 600, color: "#495057" }}>ISBN</th>
                <th style={{ fontWeight: 600, color: "#495057", width: 56 }}>NXB</th>
                <th style={{ fontWeight: 600, color: "#495057", width: 56, textAlign: "center" }}>
                  Bản sao
                </th>
                <th style={{ fontWeight: 600, color: "#495057", width: 80, textAlign: "center" }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 0", color: "#adb5bd" }}>
                    <Inventory2Icon style={{ fontSize: 36, display: "block", margin: "0 auto 8px" }} />
                    <span>Không tìm thấy đầu sách phù hợp</span>
                  </td>
                </tr>
              ) : (
                filtered.map((book) => (
                  <tr
                    key={book.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setCopiesBook(book)}
                  >
                    <td
                      style={{ paddingLeft: 16, color: "#6c757d", fontFamily: "monospace" }}
                    >
                      #{book.id}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#212529" }}>{book.title}</span>
                    </td>
                    <td style={{ color: "#495057" }}>{book.author}</td>
                    <td>
                      <span
                        style={{
                          background: "#e9ecef",
                          color: "#495057",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {book.genre}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "#6c757d" }}>
                      {book.isbn}
                    </td>
                    <td style={{ fontSize: 12, color: "#6c757d" }}>{book.publishYear}</td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          background: "#d1ecf1",
                          color: "#0c5460",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {copiesCountMap[book.id] ?? 0}
                      </span>
                    </td>
                    <td
                      style={{ textAlign: "center" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="btn btn-sm"
                        title="Chỉnh sửa đầu sách"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditBook(book);
                        }}
                        style={{
                          background: "#fff3cd",
                          border: "1px solid #ffc107",
                          color: "#856404",
                          padding: "3px 8px",
                          borderRadius: 5,
                        }}
                      >
                        <EditIcon style={{ fontSize: 14 }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hint */}
      {filtered.length > 0 && (
        <p style={{ fontSize: 11, color: "#adb5bd", marginTop: 8, textAlign: "right" }}>
          Nhấn vào dòng để xem bản sao &bull; Nhấn icon bút chì để chỉnh sửa
        </p>
      )}

      {/* Edit modal */}
      {editBook && (
        <EditBookModal
          book={editBook}
          onSave={handleSave}
          onClose={() => setEditBook(null)}
        />
      )}

      {/* Book copies modal */}
      {copiesBook && (
        <BookCopies
          book={copiesBook}
          copies={copiesForBook}
          onClose={() => setCopiesBook(null)}
        />
      )}
    </div>
  );
}