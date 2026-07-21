import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function loadReportAccess() {
  try {
    return await import('../src/utils/reportAccess.js');
  } catch {
    return {};
  }
}

test('report routes allow staff and redirect unauthenticated or member users', async () => {
  const { getReportRouteRedirect } = await loadReportAccess();

  assert.equal(typeof getReportRouteRedirect, 'function');
  assert.equal(getReportRouteRedirect({ authenticated: false, roles: [] }), '/login');
  assert.equal(getReportRouteRedirect({ authenticated: true, roles: ['MEMBER'] }), '/forbidden');
  assert.equal(getReportRouteRedirect({ authenticated: true, roles: ['LIBRARIAN'] }), null);
  assert.equal(getReportRouteRedirect({ authenticated: true, roles: ['ADMIN'] }), null);
});

test('all FE12 frontend routes are wrapped by the report route guard', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.match(source, /import ReportRouteGuard from '.\/component\/report\/ReportRouteGuard';/);
  for (const path of ['/reports/borrowing', '/reports/inventory', '/reports/users']) {
    const escapedPath = path.replaceAll('/', '\\/');
    assert.match(
      source,
      new RegExp(`path="${escapedPath}" element=\\{<ReportRouteGuard>`),
      `${path} must use ReportRouteGuard`,
    );
  }
});

test('FE12 report pages do not substitute demo statistics after API failures', async () => {
  const pages = [
    '../src/page/report/BorrowingReportPage.jsx',
    '../src/page/report/InventoryReportPage.jsx',
    '../src/page/report/UserStatisticsPage.jsx',
  ];
  const apiSource = await readFile(
    new URL('../src/api/libraryFeatureApi.js', import.meta.url),
    'utf8',
  );
  const viewModelSource = await readFile(
    new URL('../src/utils/libraryFeatureViewModels.js', import.meta.url),
    'utf8',
  );

  for (const page of pages) {
    const source = await readFile(new URL(page, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /DEMO_REPORTS/);
    assert.doesNotMatch(source, /Demo fallback/);
    assert.match(source, /<DataNotice type="error"/);
    assert.doesNotMatch(source, /noticeType|Đã tải dữ liệu|Dữ liệu báo cáo đã được cập nhật/);
  }

  assert.match(apiSource, /function authorizedReportRequest[\s\S]*getReportErrorMessage/);
  assert.equal((apiSource.match(/return authorizedReportRequest/g) || []).length, 3);
  assert.doesNotMatch(viewModelSource, /DEMO_REPORTS|requestStatusCounts|copyStatusCounts|membersByStatus/);
});

test('inventory report reads category options from the authorized payload', async () => {
  const source = await readFile(
    new URL('../src/page/report/InventoryReportPage.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /setCategories\(response\?\.data\?\.categories \|\| \[\]\)/);
  assert.doesNotMatch(source, /setCategories\(response\?\.categories \|\| \[\]\)/);
  assert.match(source, /Bản sao theo trạng thái/);
  assert.doesNotMatch(source, /categoryCounts|Đầu sách theo thể loại/);
});

test('report layouts can shrink and keep responsive split rules', async () => {
  const shellStyles = await readFile(
    new URL('../src/styles/app-shell.css', import.meta.url),
    'utf8',
  );
  const borrowingPage = await readFile(
    new URL('../src/page/report/BorrowingReportPage.jsx', import.meta.url),
    'utf8',
  );
  const userStatisticsPage = await readFile(
    new URL('../src/page/report/UserStatisticsPage.jsx', import.meta.url),
    'utf8',
  );

  assert.match(shellStyles, /\.app-main\s*\{[^}]*min-width:\s*0;/s);
  assert.doesNotMatch(borrowingPage, /className="split"\s+style=/);
  assert.match(shellStyles, /\.report-date-filter\s*\{[^}]*flex-wrap:\s*wrap;/s);
  assert.match(
    shellStyles,
    /@media \(max-width: 640px\)[\s\S]*\.report-date-filter\s*\{[^}]*grid-template-columns:\s*1fr;/,
  );
  for (const page of [borrowingPage, userStatisticsPage]) {
    assert.match(page, /className="field report-date-filter"/);
    assert.doesNotMatch(page, /className="field"\s+style=/);
  }
});

test('date-filtered report pages start unfiltered and use compact report params', async () => {
  const borrowingPage = await readFile(
    new URL('../src/page/report/BorrowingReportPage.jsx', import.meta.url),
    'utf8',
  );
  const userStatisticsPage = await readFile(
    new URL('../src/page/report/UserStatisticsPage.jsx', import.meta.url),
    'utf8',
  );

  assert.match(borrowingPage, /buildBorrowingReportParams/);
  assert.match(userStatisticsPage, /buildUserReportParams/);
  for (const page of [borrowingPage, userStatisticsPage]) {
    assert.equal((page.match(/useState\(''\)/g) || []).length >= 2, true);
    assert.doesNotMatch(page, /2026-01-01|2026-06-15/);
  }
});
