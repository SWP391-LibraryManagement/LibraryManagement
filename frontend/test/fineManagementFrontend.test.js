import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  FINE_LIST_PAGE_SIZE,
  buildFineListParams,
} from '../src/utils/fineListQuery.js';

const pagePath = new URL('../src/page/FineManagement.jsx', import.meta.url);
const apiPath = new URL('../src/api/libraryFeatureApi.js', import.meta.url);

test('FE09 fine management uses canonical server APIs without demo storage', async () => {
  const page = await readFile(pagePath, 'utf8');
  const api = await readFile(apiPath, 'utf8');

  assert.match(page, /fineApi\.list\(buildFineListParams\(\{/);
  assert.match(page, /fineApi\.calculate/);
  assert.match(page, /fineApi\.collect/);
  assert.match(page, /fineApi\.markPaid/);
  assert.doesNotMatch(page, /localStorage\.setItem|initialFines|Dữ liệu trình diễn/);
  assert.match(api, /url: '\/fines\/calculate'/);
  assert.match(api, /url: `\/fines\/\$\{fineId\}\/collections`/);
});

test('FE09 fine list builds the canonical server query without blank filters', () => {
  assert.equal(FINE_LIST_PAGE_SIZE, 8);
  assert.deepEqual(
    buildFineListParams({ page: 2, query: '  Member 1  ', status: 'UNPAID' }),
    { page: 2, limit: 8, q: 'Member 1', status: 'UNPAID' }
  );
  assert.deepEqual(
    buildFineListParams({ page: 1, query: '   ', status: 'ALL' }),
    { page: 1, limit: 8 }
  );
});

test('FE09 fine list consumes server filtering and pagination metadata', async () => {
  const page = await readFile(pagePath, 'utf8');

  assert.match(page, /fineApi\.list\(buildFineListParams\(\{/);
  assert.match(page, /setPagination\(/);
  assert.match(page, /pagination\.totalPages/);
  assert.match(page, /pagination\.total/);
  assert.match(page, /setQuery\(queryInput\.trim\(\)\)/);
  assert.doesNotMatch(page, /useMemo|filteredFines|filteredFines\.slice|function normalize/);
  assert.match(page, /data-label="Thành viên"><strong>/);
  assert.doesNotMatch(page, /data-label="Thành viên"><strong>[^<]*<\/strong><span/);
});

test('FE09 terminal records are not exposed to arbitrary edit or delete actions', async () => {
  const page = await readFile(pagePath, 'utf8');

  assert.doesNotMatch(page, /fineApi\.(?:update|delete)/);
  assert.match(page, /fine\.status === 'UNPAID'/);
  assert.match(page, /fineApi\.waive/);
  assert.match(page, /fineApi\.cancel/);
  assert.match(page, /isAdmin/);
});

test('FE09 connects calculation, list selection, and payment workflows', async () => {
  const page = await readFile(pagePath, 'utf8');

  assert.doesNotMatch(page, /Quy trình FE09/);
  assert.match(page, /setWorkflowFine\(result\.fine\)/);
  assert.match(page, /setActiveSection\(result\.fine\?\.status === 'UNPAID' \? 'collect' : 'list'\)/);
  assert.match(page, /onCollect=\{\(\) => changeSection\('collect'\)\}/);
  assert.match(page, /onMarkPaid=\{\(\) => changeSection\('paid'\)\}/);
  assert.match(page, /Hãy chọn một phiếu chưa thanh toán/);
  assert.match(page, /paymentOptions\.map/);
});
