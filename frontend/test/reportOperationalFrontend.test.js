import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const reportPages = [
  '../src/page/report/BorrowingReportPage.jsx',
  '../src/page/report/InventoryReportPage.jsx',
  '../src/page/report/UserStatisticsPage.jsx',
];

test('FE12 reports use shared toolbar and table patterns', async () => {
  for (const path of reportPages) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /DataToolbar/);
    assert.match(source, /DataTable/);
    assert.doesNotMatch(source, /<table className="lib-table"/);
    assert.doesNotMatch(source, /Đã kết nối backend thật qua GET/);
  }
});

test('FE12 report pages submit complete canonical search and filter contracts', async () => {
  const borrowing = await readFile(new URL(reportPages[0], import.meta.url), 'utf8');
  const inventory = await readFile(new URL(reportPages[1], import.meta.url), 'utf8');
  const users = await readFile(new URL(reportPages[2], import.meta.url), 'utf8');

  assert.match(borrowing, /buildBorrowingReportParams/);
  assert.match(inventory, /buildInventoryReportParams/);
  assert.match(users, /buildUserReportParams/);
  for (const source of [borrowing, inventory, users]) {
    assert.doesNotMatch(source, /Đã tải dữ liệu|Dữ liệu báo cáo đã được cập nhật/);
  }
});

test('FE12 report pages consume the deterministic metrics and rows envelope', async () => {
  const borrowing = await readFile(new URL(reportPages[0], import.meta.url), 'utf8');
  const inventory = await readFile(new URL(reportPages[1], import.meta.url), 'utf8');
  const users = await readFile(new URL(reportPages[2], import.meta.url), 'utf8');

  for (const source of [borrowing, inventory, users]) {
    assert.match(source, /report\?\.metrics/);
    assert.match(source, /report\?\.rows/);
    assert.match(source, /report\?\.totalRows/);
    assert.doesNotMatch(source, /report\?\.totals/);
  }

  assert.match(borrowing, /metrics\.activeLoans/);
  assert.match(borrowing, /metrics\.overdueLoans/);
  assert.match(borrowing, /metrics\.borrowCountByPeriod/);
  assert.match(borrowing, /metrics\.topBorrowedBooks/);
  assert.doesNotMatch(borrowing, /requestStatusCounts|detailStatusCounts/);

  assert.match(inventory, /metrics\.totalBooks/);
  assert.match(inventory, /metrics\.totalCopies/);
  assert.match(inventory, /metrics\.copiesByStatus/);
  assert.match(inventory, /metrics\.lowStockBooks/);
  assert.doesNotMatch(inventory, /copyStatusCounts|lowAvailabilityBooks|categoryCounts/);

  assert.match(users, /metrics\.totalMembers/);
  assert.match(users, /metrics\.usersByStatus/);
  assert.match(users, /metrics\.usersByRole/);
  assert.match(users, /metrics\.membershipByStatus/);
  assert.match(users, /metrics\.newMembersByPeriod/);
  assert.doesNotMatch(users, /membersByStatus/);
});

test('FE12 report pages send server pagination and expose previous/next navigation', async () => {
  for (const path of reportPages) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');

    assert.match(source, /const \[page, setPage\] = useState\(1\)/);
    assert.match(source, /page,\s*limit: REPORT_PAGE_SIZE/);
    assert.match(source, /const totalPages = Math\.max\(1, Math\.ceil\(totalRows \/ pageLimit\)\)/);
    assert.match(source, />Trang trước</);
    assert.match(source, />Trang sau</);
  }
});

test('FE12 exposes the operations summary API and both staff dashboards consume it', async () => {
  const [api, librarianDashboard, adminDashboard] = await Promise.all([
    readFile(new URL('../src/api/libraryFeatureApi.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/page/dashboard/RoleDashboardPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/page/admin/dashboard/AdminDashboardSection.jsx', import.meta.url), 'utf8'),
  ]);

  assert.match(api, /operationsSummary\(\)[\s\S]*url: '\/reports\/operations-summary'/);
  assert.match(librarianDashboard, /reportApi\.operationsSummary\(\)/);
  assert.match(adminDashboard, /reportApi\.operationsSummary\(\)/);
  assert.doesNotMatch(librarianDashboard, /Promise\.all\(\[borrowingApi\.listAll/);
  assert.match(adminDashboard, /Không tải được/);
});
