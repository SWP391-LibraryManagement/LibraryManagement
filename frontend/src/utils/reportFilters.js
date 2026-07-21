function compactParams(values = {}, numericKeys = []) {
  return Object.fromEntries(Object.entries(values).flatMap(([key, value]) => {
    const normalized = String(value ?? '').trim();
    if (!normalized) return [];
    return [[key, numericKeys.includes(key) ? Number(normalized) : normalized]];
  }));
}

export function buildBorrowingReportParams(filters = {}) {
  return compactParams(filters, ['bookId', 'userId', 'page', 'limit']);
}

export function buildInventoryReportParams(filters = {}) {
  if (typeof filters !== 'object' || filters === null) {
    return compactParams({ categoryId: filters }, ['categoryId']);
  }
  return compactParams(filters, ['categoryId', 'bookId', 'page', 'limit']);
}

export function buildUserReportParams(filters = {}) {
  return compactParams(filters, ['roleId', 'page', 'limit']);
}

export function buildDateRangeReportParams(fromDate, toDate) {
  return compactParams({ fromDate, toDate });
}
