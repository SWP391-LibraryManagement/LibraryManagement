import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Member fines use the authenticated own-fines endpoint', async () => {
  const api = await readFile(new URL('../src/api/libraryFeatureApi.js', import.meta.url), 'utf8');

  assert.match(api, /listMine\(params = \{\}\)/);
  assert.match(api, /method: 'get', url: '\/fines\/me', params/);
});

test('Member fines route is guarded and present in Member navigation', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const navigation = await readFile(new URL('../src/utils/appNavigation.js', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');

  assert.match(app, /path="\/fines\/mine"[^\n]+BorrowingRouteGuard audience="member"/);
  assert.match(navigation, /key: 'my-fines', label: 'Tiền phạt của tôi', path: '\/fines\/mine'/);
  assert.match(layout, /'my-fines': ReceiptText/);
});

test('Member fines page is server-backed, paginated, retryable, and read-only', async () => {
  const page = await readFile(new URL('../src/page/fine/MemberFinesPage.jsx', import.meta.url), 'utf8');

  assert.match(page, /fineApi\.listMine\(\{ page, limit: MEMBER_FINE_PAGE_SIZE \}\)/);
  assert.match(page, /onClick=\{loadFines\}/);
  assert.match(page, /result\.totalPages/);
  assert.match(page, /fine\.bookTitle/);
  assert.match(page, /fine\.reason/);
  assert.match(page, /fine\.borrowDetailId/);
  assert.doesNotMatch(page, /fineApi\.(calculate|collect|markPaid|waive|cancel)/);
});
