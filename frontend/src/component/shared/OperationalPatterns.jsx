import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LoadingBlock } from './Feedback';

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ');
}

// @spec NFR-FE08-UX-002, AC-FE12-010 — phân trang cửa sổ với aria-current, tránh tràn mobile.
function buildPageWindow(currentPage, totalPages, windowSize = 2) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const safeCurrent = Math.min(Math.max(currentPage, 1), totalPages);
  const halfWindow = Math.max(1, windowSize);
  const start = Math.max(2, safeCurrent - halfWindow);
  const end = Math.min(totalPages - 1, safeCurrent + halfWindow);
  const pages = [1];

  if (start > 2) pages.push('...');
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  if (end < totalPages - 1) pages.push('...');
  pages.push(totalPages);
  return pages;
}

export function Pagination({ currentPage, totalPages, onPageChange, summary, ariaLabel }) {
  if (totalPages <= 1) return null;
  const pages = buildPageWindow(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label={ariaLabel || 'Phân trang'}>
      {summary && <span className="muted">{summary}</span>}
      <div className="page-controls">
        <button
          type="button"
          className="page-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((page, index) => {
          if (page === '...') {
            return <span key={`ellipsis-${index}`} className="page-ellipsis" aria-hidden="true">…</span>;
          }
          const isActive = page === currentPage;
          return (
            <button
              type="button"
              key={page}
              className={`page-btn${isActive ? ' active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Trang ${page}`}
            >
              {page}
            </button>
          );
        })}
        <button
          type="button"
          className="page-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  if (!title && !actions) return null;

  return (
    <div className="ph">
      <div>
        {title && <h1 className="ph-title">{title}</h1>}
        {subtitle && <p className="ph-sub">{subtitle}</p>}
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}

export function DataToolbar({ primary, filters, summary, actions, className = '' }) {
  return (
    <div className={joinClassNames('toolbar', 'data-toolbar', className)}>
      {primary && <div className="data-toolbar-primary">{primary}</div>}
      {filters && <div className="data-toolbar-filters">{filters}</div>}
      {(primary || filters) && (summary || actions) && <span className="spacer" />}
      {summary && <div className="data-toolbar-summary">{summary}</div>}
      {actions && <div className="data-toolbar-actions">{actions}</div>}
    </div>
  );
}

export function DataTable({
  caption,
  headers,
  loading = false,
  loadingRows = 4,
  isEmpty = false,
  emptyState,
  children,
  className = '',
}) {
  if (loading) return <LoadingBlock rows={loadingRows} />;

  const normalizedHeaders = headers.map((header) => (
    typeof header === 'string' ? { label: header } : header
  ));

  return (
    <div className="lib-table-wrap">
      <table className={`lib-table operational-table ${className}`.trim()}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {normalizedHeaders.map(({ label, align }) => (
              <th key={label} scope="col" style={align ? { textAlign: align } : undefined}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {isEmpty && emptyState}
    </div>
  );
}
