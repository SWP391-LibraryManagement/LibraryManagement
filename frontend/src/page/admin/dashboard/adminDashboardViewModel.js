export function selectOperationalChartRows(rows = [], limit = 5) {
  return rows
    .map((row) => ({ ...row, value: Number(row?.value) || 0 }))
    .filter((row) => row.value > 0)
    .slice(0, limit);
}
