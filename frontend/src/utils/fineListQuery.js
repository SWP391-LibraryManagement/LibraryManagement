export const FINE_LIST_PAGE_SIZE = 8;

export function buildFineListParams({
  page = 1,
  limit = FINE_LIST_PAGE_SIZE,
  query = '',
  status = 'ALL',
} = {}) {
  const params = { page, limit };
  const normalizedQuery = String(query || '').trim();
  const normalizedStatus = String(status || 'ALL').trim().toUpperCase();

  if (normalizedQuery) params.q = normalizedQuery;
  if (normalizedStatus && normalizedStatus !== 'ALL') params.status = normalizedStatus;

  return params;
}
