export function getPermissionDecision(allowed) {
  return allowed
    ? { label: 'Có', symbol: '✓', tone: 'allowed' }
    : { label: 'Không', symbol: '—', tone: 'denied' };
}
