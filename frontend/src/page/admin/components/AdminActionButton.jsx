export function AdminActionButton({
  icon: Icon,
  label,
  tone = 'neutral',
  disabled = false,
  title,
  onClick,
}) {
  return (
    <button
      className={`admin-action-button admin-action-button--${tone}`}
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {Icon ? <Icon aria-hidden="true" /> : null}
      <span>{label}</span>
    </button>
  );
}
