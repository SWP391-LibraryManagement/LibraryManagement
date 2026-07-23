import assert from 'node:assert/strict';
import test from 'node:test';

async function loadReportFilters() {
  try {
    return await import('../src/utils/reportFilters.js');
  } catch {
    return {};
  }
}

test('adds the selected category ID to the inventory report query', async () => {
  const { buildInventoryReportParams } = await loadReportFilters();

  assert.equal(typeof buildInventoryReportParams, 'function');
  assert.deepEqual(buildInventoryReportParams('7'), { categoryId: 7 });
});

test('builds complete report filters and omits blank values', async () => {
  const { buildBorrowingReportParams, buildInventoryReportParams, buildUserReportParams } = await loadReportFilters();

  assert.deepEqual(buildBorrowingReportParams({ q: '1984', status: 'BORROWED', userId: '7', bookId: '' }), {
    q: '1984', status: 'BORROWED', userId: 7,
  });
  assert.deepEqual(buildBorrowingReportParams({ page: '2', limit: '20' }), {
    page: 2, limit: 20,
  });
  assert.deepEqual(buildInventoryReportParams({ q: 'BC14', categoryId: '2', status: 'AVAILABLE' }), {
    q: 'BC14', categoryId: 2, status: 'AVAILABLE',
  });
  assert.deepEqual(buildUserReportParams({ q: '10', status: 'ACTIVE', membershipStatus: '' }), {
    q: '10', status: 'ACTIVE',
  });
  assert.deepEqual(buildUserReportParams({ page: '3', limit: '20' }), {
    page: 3, limit: 20,
  });
});

test('omits the category ID when the inventory report filter is blank', async () => {
  const { buildInventoryReportParams } = await loadReportFilters();

  assert.equal(typeof buildInventoryReportParams, 'function');
  assert.deepEqual(buildInventoryReportParams(''), {});
});

test('builds date report params from only non-blank date values', async () => {
  const { buildDateRangeReportParams } = await loadReportFilters();

  assert.equal(typeof buildDateRangeReportParams, 'function');
  assert.deepEqual(buildDateRangeReportParams('2026-06-01', '2026-06-10'), {
    fromDate: '2026-06-01',
    toDate: '2026-06-10',
  });
  assert.deepEqual(buildDateRangeReportParams('2026-06-01', ''), {
    fromDate: '2026-06-01',
  });
  assert.deepEqual(buildDateRangeReportParams(null, undefined), {});
});
