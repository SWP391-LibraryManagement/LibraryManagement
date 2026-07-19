import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readFrontend = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

// @spec AC-FE06-001, AC-FE06-009, AC-FE06-014, NFR-FE06-UX-001
test('FE06 inventory is server-backed and consumes the exact list envelope', async () => {
  const management = await readFrontend('../src/component/inventory/InventoryManagement.jsx');

  assert.doesNotMatch(management, /MOCK_BOOKS|MOCK_COPIES|\.\/mockData/);
  assert.match(management, /inventoryApi\.list\s*\(/);
  assert.match(management, /\bitems\b/);
  assert.match(management, /\bcountsByStatus\b/);
  assert.match(management, /\btotalItems\b/);
  assert.match(management, /\btotalPages\b/);
  assert.doesNotMatch(management, /EditBookModal|setEditBook/);
  assert.doesNotMatch(management, /onChanged=\{async \(\) => \{\}\}/);
});

// @spec AC-FE06-004, BR-FE06-013, FR-FE06-004
test('copy create leaves status server-controlled and keeps book metadata outside FE06', async () => {
  const copies = await readFrontend('../src/component/inventory/BookCopies.jsx');

  assert.match(copies, /inventoryApi\.createCopy/);
  assert.doesNotMatch(copies, /newCopy[^\n]*status|setNewCopy\([^\n]*status/);
  assert.doesNotMatch(copies, /Trạng thái bản sao mới/);
  assert.doesNotMatch(copies, /EditBookModal|updateBook|saveBookMetadata/i);
});

// @spec AC-FE06-006, AC-FE06-012, AC-FE06-013, BR-FE06-016, BR-FE06-017
test('existing-copy API mutations send If-Match and required reason data', async () => {
  const api = await readFrontend('../src/api/libraryFeatureApi.js');
  const ifMatchHeaders = api.match(/['"]If-Match['"]/g) || [];

  assert.ok(ifMatchHeaders.length >= 3, 'PUT, PATCH status, and DELETE must each send If-Match');
  assert.match(api, /updateCopy\s*\([^)]*version[^)]*\)/i);
  assert.match(api, /updateStatus\s*\([^)]*version[^)]*\)/i);
  assert.match(api, /deactivate\s*\([^)]*reason[^)]*version[^)]*\)|deactivate\s*\([^)]*version[^)]*reason[^)]*\)/i);
  assert.match(api, /method:\s*['"]delete['"][\s\S]{0,180}\bdata\b/i);
});

// @spec AC-FE06-006, AC-FE06-013, NFR-FE06-UX-002
test('copy commands preserve version, require a reason, and reload canonical state after success', async () => {
  const copies = await readFrontend('../src/component/inventory/BookCopies.jsx');

  assert.match(copies, /copy\.version/);
  assert.match(copies, /\breason\b/i);
  assert.match(copies, /inventoryApi\.updateStatus\([^;]*copy\.version|inventoryApi\.updateStatus\([^;]*version/);
  assert.match(copies, /inventoryApi\.updateCopy\([^;]*copy\.version|inventoryApi\.updateCopy\([^;]*version/);
  assert.match(copies, /inventoryApi\.deactivate\([^;]*copy\.version|inventoryApi\.deactivate\([^;]*version/);
  assert.ok((copies.match(/await onChanged\(\)/g) || []).length >= 3);
});

// @spec AC-FE06-007, AC-FE06-008, AC-FE06-012, NFR-FE06-UX-002
test('stale, borrow, reservation, and parent conflicts guide reload or owning workflow without override', async () => {
  const messages = await readFrontend('../src/api/apiErrorMessages.js');
  const copies = await readFrontend('../src/component/inventory/BookCopies.jsx');
  const combined = `${messages}\n${copies}`;

  assert.match(combined, /STALE_COPY_STATE/);
  assert.match(combined, /RESERVATION_STATE_CONFLICT/);
  assert.match(combined, /ACTIVE_BORROW_CONFLICT|BORROW_STATE_CONFLICT/);
  assert.match(combined, /tải lại|reload/i);
  assert.match(combined, /FE07|trả sách|mượn\/trả/i);
  assert.match(combined, /FE08|giữ chỗ|đặt chỗ/i);
  assert.doesNotMatch(combined, /force|override|bỏ qua xung đột/i);
});

// @spec AC-FE06-011, AC-FE06-013
test('manual transition and deactivation UI require a reason before confirmation', async () => {
  const copies = await readFrontend('../src/component/inventory/BookCopies.jsx');

  assert.match(copies, /ConfirmAction/);
  assert.match(copies, /textarea|aria-label=['"][^'"]*(?:lý do|reason)/i);
  assert.match(copies, /reason\.trim\(\)|trim\(\).*reason/i);
  assert.match(copies, /500/);
});
