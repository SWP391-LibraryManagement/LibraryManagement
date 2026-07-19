import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildRequestCsv,
  buildRequestListParams,
  collectAllRequestRows,
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

test('CSV export traverses every server page with frozen filters', async () => {
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

test('request CSV uses only approved columns and neutralizes spreadsheet formulas', () => {
  const csv = buildRequestCsv([{
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

  assert.match(csv, /^requestId,requestDate,status,memberUserId,memberName,memberEmail,memberPhoneNumber,itemCount,bookTitles,categories/m);
  assert.match(csv, /'=HYPERLINK/);
  assert.match(csv, /'\+cmd@example\.test/);
  assert.match(csv, /Book A \| Book, B/);
  assert.doesNotMatch(csv, /passwordHash|must-not-leak/);
});

test('Admin Request Management consumes server pagination and authoritative detail', async () => {
  const page = await readFile(new URL('../src/page/UserManagement.jsx', import.meta.url), 'utf8');
  const api = await readFile(new URL('../src/api/adminApi.js', import.meta.url), 'utf8');
  const exportUtility = await readFile(new URL('../src/utils/adminRequestExport.js', import.meta.url), 'utf8');

  assert.match(api, /requestDetail\(requestId\)/);
  assert.match(api, /url: `\/admin\/requests\/\$\{requestId\}`/);
  assert.match(page, /buildRequestListParams\(requestFilter, requestPage, REQUEST_TABLE_PAGE_SIZE\)/);
  assert.match(page, /setRequestPagination\(result\.pagination/);
  assert.match(page, /await adminApi\.requestDetail\(row\.requestId\)/);
  assert.match(page, /collectAllRequestRows\(adminApi\.requests/);
  assert.doesNotMatch(page, /fromDate|toDate/);
  assert.doesNotMatch(exportUtility, /filters\.fromDate|filters\.toDate/);
  assert.doesNotMatch(page, /downloadCsv\('requests\.csv', requests\)/);
});
