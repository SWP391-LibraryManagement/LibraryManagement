export function buildInventoryReportParams(categoryId) {
  const normalizedCategoryId = String(categoryId ?? '').trim();

  return normalizedCategoryId ? { categoryId: Number(normalizedCategoryId) } : {};
}
