function toCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function readRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function normalizeAdminUserStatistics(result = {}) {
  const response = readRecord(result);
  const metrics = readRecord(response.metrics);
  const totals = readRecord(response.totals);
  const statusSource = Object.keys(response.usersByStatus || {}).length > 0
    ? response.usersByStatus
    : metrics.usersByStatus;
  const roleSource = Object.keys(response.usersByRole || {}).length > 0
    ? response.usersByRole
    : metrics.usersByRole;
  const usersByStatus = readRecord(statusSource);
  const usersByRole = Object.fromEntries(
    Object.entries(readRecord(roleSource)).map(([roleName, count]) => [
      String(roleName).trim().toUpperCase(),
      toCount(count),
    ]),
  );
  const statusTotal = Object.values(usersByStatus).reduce((sum, count) => sum + toCount(count), 0);
  const total = totals.users ?? metrics.totalUsers ?? statusTotal;

  return {
    total: toCount(total),
    active: toCount(totals.active ?? usersByStatus.ACTIVE),
    inactive: toCount(totals.inactive ?? usersByStatus.INACTIVE),
    librarians: toCount(usersByRole.LIBRARIAN),
    usersByRole,
  };
}
