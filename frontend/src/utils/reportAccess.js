const REPORT_ROLES = ['LIBRARIAN', 'ADMIN'];

export function getReportRouteRedirect({ authenticated, roles = [] }) {
  if (!authenticated) {
    return '/login';
  }

  const normalizedRoles = Array.isArray(roles)
    ? roles.map((role) => String(role).toUpperCase())
    : [];

  return normalizedRoles.some((role) => REPORT_ROLES.includes(role)) ? null : '/home';
}
