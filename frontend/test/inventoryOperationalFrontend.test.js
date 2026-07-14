import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('FE06 inventory keeps mock ownership while adopting shared patterns', async () => {
  const management = await readFile(new URL('../src/component/inventory/InventoryManagement.jsx', import.meta.url), 'utf8');
  const filter = await readFile(new URL('../src/component/inventory/Filter.jsx', import.meta.url), 'utf8');

  assert.match(management, /MOCK_BOOKS/);
  assert.match(management, /MOCK_COPIES/);
  assert.doesNotMatch(management, /inventoryApi\.list/);
  assert.match(management, /StatusNotice/);
  assert.match(management, /DataTable/);
  assert.match(management, /Toast/);
  assert.doesNotMatch(management, /<h5/);
  assert.match(filter, /DataToolbar/);
});

test('FE06 dialogs and badges use shared presentation without changing API methods', async () => {
  const edit = await readFile(new URL('../src/component/inventory/EditBookModal.jsx', import.meta.url), 'utf8');
  const copies = await readFile(new URL('../src/component/inventory/BookCopies.jsx', import.meta.url), 'utf8');
  const badge = await readFile(new URL('../src/component/inventory/StatusBadge.jsx', import.meta.url), 'utf8');

  assert.match(edit, /import \{ Modal \}/);
  assert.match(copies, /DataTable/);
  assert.match(copies, /ConfirmAction/);
  assert.match(copies, /inventoryApi\.createCopy/);
  assert.match(copies, /inventoryApi\.updateStatus/);
  assert.match(copies, /inventoryApi\.deactivate/);
  assert.match(badge, /import \{ Badge \}/);
});
