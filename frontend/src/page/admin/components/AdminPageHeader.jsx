import { RefreshCw } from 'lucide-react';

export function AdminPageHeader({
  eyebrow,
  title,
  refreshing = false,
  onRefresh,
  primaryAction,
}) {
  return (
    <header className="admin-page-header">
      <div>
        {eyebrow ? <p className="admin-page-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
      </div>
      <div className="admin-page-header__actions">
        {onRefresh ? (
          <button
            className="admin-button admin-button--quiet"
            type="button"
            disabled={refreshing}
            onClick={onRefresh}
          >
            <RefreshCw className={refreshing ? 'is-spinning' : ''} aria-hidden="true" />
            <span>{refreshing ? 'Đang làm mới' : 'Làm mới'}</span>
          </button>
        ) : null}
        {primaryAction}
      </div>
    </header>
  );
}
