export const REQUEST_DOCX_COLUMNS = [
  { key: 'requestId', label: 'Mã yêu cầu' },
  { key: 'requestDate', label: 'Ngày yêu cầu' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'memberUserId', label: 'Mã thành viên' },
  { key: 'memberName', label: 'Tên thành viên' },
  { key: 'memberEmail', label: 'Email' },
  { key: 'memberPhoneNumber', label: 'Số điện thoại' },
  { key: 'itemCount', label: 'Số lượng sách' },
  { key: 'bookTitles', label: 'Tên sách' },
  { key: 'categories', label: 'Thể loại' },
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

function requestDocumentRow(request) {
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

export function buildRequestDocumentRows(requests = []) {
  return requests.map(requestDocumentRow);
}
