export default function TablePagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <span className="muted">Trang {page} / {totalPages}</span>
      <div className="page-controls">
        <button type="button" className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Trước</button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
          <button key={item} type="button" className={`page-btn${item === page ? ' active' : ''}`} onClick={() => onPageChange(item)}>
            {item}
          </button>
        ))}
        <button type="button" className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Sau</button>
      </div>
    </div>
  );
}
