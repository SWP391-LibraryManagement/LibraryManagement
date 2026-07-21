export function AdminFilterBar({ children, actions, className = '' }) {
  return (
    <section className={`admin-filter-bar ${className}`.trim()} aria-label="Bộ lọc">
      <div className="admin-filter-grid">{children}</div>
      {actions ? <div className="admin-filter-actions">{actions}</div> : null}
    </section>
  );
}
