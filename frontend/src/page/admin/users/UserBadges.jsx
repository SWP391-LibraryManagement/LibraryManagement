import { getRoleLabel, getStatusLabel } from '../../../utils/uiLabels';

export function RoleBadge({ role }) {
  const normalized = String(role || 'MEMBER').toLowerCase();
  return <span className={`admin-badge admin-badge--role-${normalized}`}>{getRoleLabel(role)}</span>;
}

export function StatusBadge({ status }) {
  const normalized = String(status || 'INACTIVE').toLowerCase();
  return <span className={`admin-badge admin-badge--status-${normalized}`}>{getStatusLabel(status)}</span>;
}
