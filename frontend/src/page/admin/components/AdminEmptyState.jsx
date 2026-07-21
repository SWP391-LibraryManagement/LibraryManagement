export function AdminEmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="admin-empty-state" role="status">
      {Icon ? <Icon aria-hidden="true" /> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="admin-empty-state__action">{action}</div> : null}
    </div>
  );
}
