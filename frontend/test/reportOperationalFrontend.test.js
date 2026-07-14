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

test('FE12 report API and filter contracts remain unchanged', async () => {
  const borrowing = await readFile(new URL(reportPages[0], import.meta.url), 'utf8');
  const inventory = await readFile(new URL(reportPages[1], import.meta.url), 'utf8');
  const users = await readFile(new URL(reportPages[2], import.meta.url), 'utf8');

  assert.match(borrowing, /reportApi\.borrowing\(buildDateRangeReportParams\(from, to\)\)/);
  assert.match(inventory, /reportApi\.inventory\(buildInventoryReportParams\(selectedCategoryId\)\)/);
  assert.match(users, /reportApi\.users\(buildDateRangeReportParams\(from, to\)\)/);
});
