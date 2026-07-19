import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../src/page/BookManagement.jsx', import.meta.url);
const apiPath = new URL('../src/api/libraryFeatureApi.js', import.meta.url);
const messagesPath = new URL('../src/api/apiErrorMessages.js', import.meta.url);

async function sources() {
  const [page, api, messages] = await Promise.all([
    readFile(pagePath, 'utf8'),
    readFile(apiPath, 'utf8'),
    readFile(messagesPath, 'utf8'),
  ]);
  return { page, api, messages, combined: `${page}\n${api}` };
}

// @spec AC-FE05-004, AC-FE05-015, BR-FE05-017
test('FE05 uses the approved admin endpoint and server-owned pagination', async () => {
  const { page, combined } = await sources();

  assert.match(combined, /\/admin\/books/);
  assert.doesNotMatch(combined, /\/books\/management/);
  assert.match(page, /\btotalItems\b|\btotalPages\b|\bpagination\b/);
  assert.doesNotMatch(page, /const pagedBooks = books\.slice/);
  assert.doesNotMatch(page, /const PAGE_SIZE = 8/);
});

// @spec AC-FE05-011, AC-FE05-012, BR-FE05-011 through BR-FE05-013
test('FE05 renders derived availability and owns no copy-status mutation', async () => {
  const { page, combined } = await sources();

  assert.doesNotMatch(combined, /\/availability|copyStatus|updateBookAvailability/);
  assert.match(page, /availabilityStatus/);
  assert.match(page, /Không khả dụng/);
  assert.doesNotMatch(page, /Đã mượn/);
  assert.doesNotMatch(page, /availableCopies[^\n]*>\s*0/);
});

// @spec AC-FE05-007, AC-FE05-008, AC-FE05-013, AC-FE05-014, BR-FE05-016
test('update, deactivate, and reactivate propagate the last-seen version through If-Match', async () => {
  const { combined } = await sources();
  const ifMatchHeaders = combined.match(/['"]If-Match['"]/g) || [];

  assert.ok(ifMatchHeaders.length >= 3, 'metadata update and both status commands require If-Match');
  assert.match(combined, /\.version/);
  assert.match(combined, /\/books\/\$\{[^}]+\}\/deactivate/);
  assert.match(combined, /\/books\/\$\{[^}]+\}\/reactivate/);
});

// @spec AC-FE05-008, AC-FE05-013, AC-FE05-016, BR-FE05-018, NFR-FE05-UX-002
test('deactivate and reactivate require confirmation plus a trimmed reason up to 500 characters', async () => {
  const { page } = await sources();

  assert.match(page, /deactivat/i);
  assert.match(page, /reactivat/i);
  assert.match(page, /Confirm|xác nhận/i);
  assert.match(page, /textarea|aria-label=['"][^'"]*(?:lý do|reason)/i);
  assert.match(page, /reason\.trim\(\)|trim\(\).*reason/i);
  assert.match(page, /500/);
});

// @spec AC-FE05-010, AC-FE05-014
test('book mutations reload canonical state and stale conflicts instruct staff to reload', async () => {
  const { page, messages } = await sources();

  assert.match(messages, /STALE_BOOK_STATE/);
  assert.match(`${page}\n${messages}`, /tải lại|reload/i);
  assert.ok((page.match(/await loadBooks\(/g) || []).length >= 3);
  assert.doesNotMatch(page, /setBooks\([^\n]*(?:filter|map)[^\n]*status/i);
});

// @spec AC-FE05-017, FR-FE05-026
test('frontend field bounds match ISBN, pages, and rating precision contract', async () => {
  const { page } = await sources();

  assert.match(page, /maxLength=\{20\}|isbn\.length\s*>\s*20/i);
  assert.match(page, /10000/);
  assert.match(page, /step=['"]0\.1['"]|Number\.isInteger\([^)]*rating[^)]*\*\s*10\)|rating[^\n]{0,180}one decimal/i);
});
