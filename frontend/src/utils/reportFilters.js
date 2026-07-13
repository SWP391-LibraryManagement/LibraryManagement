export function buildInventoryReportParams(categoryId) {
  const normalizedCategoryId = String(categoryId ?? '').trim();

  return normalizedCategoryId ? { categoryId: Number(normalizedCategoryId) } : {};
}

export function buildDateRangeReportParams(fromDate, toDate) {
  const params = {};
  const normalizedFromDate = String(fromDate ?? '').trim();
  const normalizedToDate = String(toDate ?? '').trim();

  if (normalizedFromDate) {
    params.fromDate = normalizedFromDate;
  }

  if (normalizedToDate) {
    params.toDate = normalizedToDate;
  }

  return params;
}
