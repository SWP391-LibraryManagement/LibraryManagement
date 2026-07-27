const BORROWING_AUDIENCE_ROLES = {
  member: ['MEMBER'],
  staff: ['LIBRARIAN', 'ADMIN'],
};

// @spec BR-FE07-001 BR-FE07-002 BR-FE07-003 FR-FE07-032 FR-FE08-030
export function getBorrowingRouteRedirect({ authenticated, roles = [] }, audience) {
  if (!authenticated) {
    return '/login';
  }

  const allowedRoles = BORROWING_AUDIENCE_ROLES[audience] || [];
  const normalizedRoles = Array.isArray(roles)
    ? roles.map((role) => String(role).toUpperCase())
    : [];
  const isStaff = normalizedRoles.some((role) => ['LIBRARIAN', 'ADMIN'].includes(role));

  if (audience === 'member' && isStaff) {
    return '/home';
  }

  return normalizedRoles.some((role) => allowedRoles.includes(role)) ? null : '/home';
}
