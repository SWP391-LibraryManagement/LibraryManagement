export const MEMBERSHIP_STATUS_LABELS = {
  NONE: 'Chua nop don',
  PENDING: 'Dang cho duyet',
  APPROVED: 'Da duyet',
  REJECTED: 'Da tu choi',
  EXPIRED: 'Het han',
};

export function membershipStatusLabel(status) {
  return MEMBERSHIP_STATUS_LABELS[String(status || 'NONE').toUpperCase()] || status || 'Chua ro';
}
