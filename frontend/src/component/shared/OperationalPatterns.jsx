import { LoadingBlock } from './Feedback';

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ');
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
