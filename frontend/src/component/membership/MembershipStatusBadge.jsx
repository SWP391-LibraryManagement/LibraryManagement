import { Badge } from '../shared/Feedback';
import { membershipStatusLabel } from './membershipStatus';

const BADGE_STATUS = {
  NONE: 'default',
  PENDING: 'pending',
  APPROVED: 'active',
  REJECTED: 'inactive',
  EXPIRED: 'expired',
};

export default function MembershipStatusBadge({ status }) {
  const key = String(status || 'NONE').toUpperCase();
  return <Badge status={BADGE_STATUS[key] || 'default'}>{membershipStatusLabel(key)}</Badge>;
}
