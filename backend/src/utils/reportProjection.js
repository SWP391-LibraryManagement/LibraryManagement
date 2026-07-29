function toDateKey(value) {
  if (value == null) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function normalizeStatus(value, allowedStatuses) {
  if (value == null) return null;
  const normalized = String(value).toUpperCase();
  return allowedStatuses.has(normalized) ? normalized : 'UNKNOWN';
}

function pagination(filters = {}) {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  return { page, limit, offset: (page - 1) * limit };
}

// @spec FR-FE12-010
function buildReport(metrics, rows, filters = {}, totalRows = rows.length) {
  const { page, limit } = pagination(filters);
  return {
    metrics,
    rows,
    page,
    limit,
    totalRows,
  };
}

function getResultset(result, index, pageIndex) {
  if (Array.isArray(result.recordsets)) {
    return result.recordsets[index] || [];
  }

  return index === pageIndex ? result.recordset || [] : [];
}

function toCountMap(rows, keyName, countName, allowedStatuses) {
  const counts = {};

  for (const row of rows) {
    const key = allowedStatuses
      ? normalizeStatus(row[keyName], allowedStatuses)
      : toDateKey(row[keyName]);
    if (key) {
      counts[key] = (counts[key] || 0) + Number(row[countName] || 0);
    }
  }

  return counts;
}

function toExclusiveNextDay(value) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

module.exports = {
  buildReport,
  getResultset,
  normalizeStatus,
  pagination,
  toCountMap,
  toDateKey,
  toExclusiveNextDay,
};
