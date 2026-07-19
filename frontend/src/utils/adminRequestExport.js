const REQUEST_CSV_COLUMNS = [
  'requestId',
  'requestDate',
  'status',
  'memberUserId',
  'memberName',
  'memberEmail',
  'memberPhoneNumber',
  'itemCount',
  'bookTitles',
  'categories',
];

export function buildRequestListParams(filters = {}, page = 1, limit = 20) {
  const q = String(filters.q || '').trim();
  const status = String(filters.status || '').trim();
  const from = String(filters.from || '').trim();
  const to = String(filters.to || '').trim();

  return {
    page,
    limit,
    ...(q ? { q } : {}),
    ...(status && status !== 'ALL' ? { status } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

export async function collectAllRequestRows(requestLoader, filters = {}) {
  const frozenFilters = { ...filters };
  const rows = [];

  for (let page = 1; page <= 10000; page += 1) {
    const result = await requestLoader({ page, limit: 100, ...frozenFilters });
    const pageRows = Array.isArray(result?.data) ? result.data : [];
    rows.push(...pageRows);

    const totalPages = Number(result?.pagination?.totalPages || 0);
    if (pageRows.length === 0 || page >= totalPages) break;
  }

  return rows;
}

function requestCsvRow(request) {
  return {
    requestId: request.requestId,
    requestDate: request.requestDate,
    status: request.status,
    memberUserId: request.member?.userId,
    memberName: request.member?.fullName,
    memberEmail: request.member?.email,
    memberPhoneNumber: request.member?.phoneNumber,
    itemCount: request.itemCount,
    bookTitles: (request.bookTitles || []).join(' | '),
    categories: (request.categories || []).join(' | '),
  };
}

function escapeCsvCell(value) {
  let text = value === undefined || value === null ? '' : String(value);
  text = text.replace(/^(\s*)([=+\-@])/, "$1'$2");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildRequestCsv(requests = []) {
  const header = REQUEST_CSV_COLUMNS.join(',');
  const rows = requests.map((request) => {
    const row = requestCsvRow(request);
    return REQUEST_CSV_COLUMNS.map((column) => escapeCsvCell(row[column])).join(',');
  });
  return [header, ...rows].join('\n');
}
