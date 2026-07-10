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
