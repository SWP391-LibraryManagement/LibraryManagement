import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildRequestDocumentRows,
  buildRequestListParams,
  collectAllRequestRows,
  REQUEST_DOCX_COLUMNS,
} from '../src/utils/adminRequestExport.js';

test('request query builder uses canonical names and omits UI sentinels', () => {
  assert.deepEqual(
    buildRequestListParams({
      q: '  Clean  ',
      status: 'ALL',
      from: '2026-07-01',
      to: '2026-07-19',
    }, 2, 50),
    { page: 2, limit: 50, q: 'Clean', from: '2026-07-01', to: '2026-07-19' },
  );
});

test('DOCX export traverses every server page with frozen filters', async () => {
  const calls = [];
  const loader = async (params) => {
    calls.push(params);
    if (params.page === 1) {
      return {
        data: [{ requestId: 1 }],
        pagination: { page: 1, limit: 100, total: 2, totalPages: 2 },
      };
    }
    return {
      data: [{ requestId: 2 }],
      pagination: { page: 2, limit: 100, total: 2, totalPages: 2 },
    };
  };

  const rows = await collectAllRequestRows(loader, { q: 'Clean', status: 'PENDING' });

  assert.deepEqual(rows.map((row) => row.requestId), [1, 2]);
  assert.deepEqual(calls, [
    { page: 1, limit: 100, q: 'Clean', status: 'PENDING' },
    { page: 2, limit: 100, q: 'Clean', status: 'PENDING' },
  ]);
});

test('request DOCX rows use only approved columns', () => {
  const [row] = buildRequestDocumentRows([{
    requestId: 25,
    requestDate: '2026-07-19T08:00:00.000Z',
    status: 'PENDING',
    member: {
      userId: 10,
      fullName: '=HYPERLINK("bad")',
      email: '+cmd@example.test',
      phoneNumber: '0900000000',
    },
    itemCount: 2,
    bookTitles: ['Book A', 'Book, B'],
    categories: ['Category A'],
    passwordHash: 'must-not-leak',
  }]);

  assert.deepEqual(Object.keys(row), REQUEST_DOCX_COLUMNS.map(({ key }) => key));
  assert.equal(row.memberName, '=HYPERLINK("bad")');
  assert.equal(row.memberEmail, '+cmd@example.test');
  assert.equal(row.bookTitles, 'Book A | Book, B');
  assert.equal(row.passwordHash, undefined);
});

test('Admin Request Management consumes server pagination and authoritative detail', async () => {
  const page = await readFile(new URL('../src/page/admin/requests/AdminRequestsSection.jsx', import.meta.url), 'utf8');
  const api = await readFile(new URL('../src/api/adminApi.js', import.meta.url), 'utf8');
  const exportUtility = await readFile(new URL('../src/utils/adminRequestExport.js', import.meta.url), 'utf8');

  assert.match(api, /requestDetail\(requestId\)/);
  assert.match(api, /url: `\/admin\/requests\/\$\{requestId\}`/);
  assert.match(page, /buildRequestListParams\(filters, page, REQUEST_TABLE_PAGE_SIZE\)/);
  assert.match(page, /setRequestPagination\(result\.pagination/);
  assert.match(page, /await adminApi\.requestDetail\(row\.requestId\)/);
  assert.match(page, /collectAllRequestRows\(adminApi\.requests/);
  assert.doesNotMatch(page, /fromDate|toDate/);
  assert.doesNotMatch(exportUtility, /filters\.fromDate|filters\.toDate/);
  assert.match(page, /downloadDocx\(/);
  assert.match(page, /<AdminDateField id="request-from" label="Từ ngày"/);
  assert.match(page, /<AdminDateField id="request-to" label="Đến ngày"/);
  assert.match(page, /aria-label="Lọc trạng thái"/);
  assert.match(page, /const REQUEST_TABLE_PAGE_SIZE = 20/);
  assert.doesNotMatch(page, /Xuất CSV|\.csv'/);
  assert.match(exportUtility, /REQUEST_DOCX_COLUMNS/);
});

test('Admin DOCX utility uses a readable fixed landscape table', async () => {
  const source = await readFile(new URL('../src/utils/adminDocxExport.js', import.meta.url), 'utf8');

  assert.match(source, /PageOrientation\.LANDSCAPE/);
  assert.match(source, /TableLayoutType\.FIXED/);
  assert.match(source, /columnWidths/);
  assert.match(source, /toLocaleDateString\('vi-VN'\)/);
  assert.match(source, /STATUS_LABELS/);
});
