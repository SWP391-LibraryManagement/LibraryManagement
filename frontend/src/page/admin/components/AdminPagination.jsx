function getPageWindow(page, totalPages) {
  const windowSize = Math.min(5, totalPages);
  const halfWindow = Math.floor(windowSize / 2);
  const start = Math.max(1, Math.min(page - halfWindow, totalPages - windowSize + 1));
  return Array.from({ length: windowSize }, (_, index) => start + index);
}

export function AdminPagination({ page, totalItems, pageSize = 8, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pages = getPageWindow(currentPage, totalPages);

  return (
    <nav className="admin-pagination" aria-label="Phân trang">
      <p>
        Trang {currentPage}/{totalPages} · {totalItems} mục
      </p>
      <div className="admin-pagination__controls">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Trước
        </button>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            aria-current={pageNumber === currentPage ? 'page' : undefined}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau
        </button>
      </div>
    </nav>
  );
}
