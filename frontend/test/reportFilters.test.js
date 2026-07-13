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
