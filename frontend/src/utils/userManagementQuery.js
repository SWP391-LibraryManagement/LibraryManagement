export function buildManagedUserListParams({ page, limit, role, status, search } = {}) {
  const params = {};

  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;

  const normalizedRole = String(role || '').trim().toUpperCase();
  const normalizedStatus = String(status || '').trim().toUpperCase();
  const normalizedSearch = String(search || '').trim();

  if (normalizedRole && normalizedRole !== 'ALL') params.role = normalizedRole;
  if (normalizedStatus && normalizedStatus !== 'ALL') params.status = normalizedStatus;
  if (normalizedSearch) params.search = normalizedSearch;

  return params;
}

export function isManagedUserNotFound(error) {
  const response = error?.cause?.response;
  return response?.status === 404 || response?.data?.error?.code === 'USER_NOT_FOUND';
}
