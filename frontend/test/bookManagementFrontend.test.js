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
test('deactivate and reactivate hide the reason input while retaining an audit reason', async () => {
  const { page } = await sources();

  assert.match(page, /deactivat/i);
  assert.match(page, /reactivat/i);
  assert.match(page, /const reason = selectedBook\.status/);
  assert.match(page, /Ngừng hoạt động từ giao diện quản lý sách/);
  assert.doesNotMatch(page, /statusReason|Lý do \(bắt buộc|aria-label="Lý do thay đổi trạng thái"/);
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
test('frontend field bounds match ISBN and pages while rating remains outside staff forms', async () => {
  const { page } = await sources();

  assert.match(page, /maxLength=\{20\}|isbn\.length\s*>\s*20/i);
  assert.match(page, /10000/);
  assert.doesNotMatch(page, /Điểm đánh giá|form\.rating|detailBook\.rating/);
});

test('staff search and filters share the canonical paginated admin list', async () => {
  const { page } = await sources();

  assert.match(page, /if \(q\) params\.set\('q', q\)/);
  assert.match(page, /if \(status\) params\.set\('status', status\)/);
  assert.match(page, /if \(categoryId\) params\.set\('categoryId', categoryId\)/);
  assert.match(page, /handleSearch[\s\S]*loadBooks\(\{ q: keyword, pageNumber: 1 \}\)/);
  assert.match(page, /handleApplyFilters[\s\S]*status: statusFilter[\s\S]*categoryId: categoryFilter/);
  assert.doesNotMatch(page, /setSearchResults|searchResults|apiRequest\(`\/books\?\$\{params/);
});

test('book update exposes catalog status without sending status through metadata PUT', async () => {
  const { page } = await sources();

  assert.match(page, /<span>Trạng thái sách<\/span>/);
  assert.match(page, /<option value="ACTIVE">Còn sách<\/option>/);
  assert.match(page, /<option value="INACTIVE">Không khả dụng<\/option>/);
  assert.doesNotMatch(page, /Trạng thái này điều khiển việc hiển thị sách trong danh mục/);
  assert.match(page, /updateForm\.status !== selectedBook\.status/);
  assert.match(page, /activating \? 'reactivate' : 'deactivate'/);
  assert.doesNotMatch(page, /function makePayload[\s\S]*?status:\s*form\.status[\s\S]*?\n\s*}/);
});

// @spec FR-FE05-029, AC-FE05-020
test('status update reloads the list with the new status so the edited book stays visible', async () => {
  const { page } = await sources();

  assert.match(page, /const statusChanged = updateForm\.status !== selectedBook\.status/);
  assert.match(page, /setAppliedStatusFilter\(updateForm\.status\)/);
  assert.match(page, /loadBooks\(statusChanged[\s\S]*status: updateForm\.status[\s\S]*pageNumber: 1/);
});

// @spec BR-FE05-019, FR-FE05-027, AC-FE05-018, NFR-FE05-UX-003
test('create and update select a local cover image instead of asking staff for a URL', async () => {
  const { page, api } = await sources();

  assert.doesNotMatch(page, />URL ảnh bìa</);
  assert.match(page, /type="file"/);
  assert.match(page, /accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(page, /formData\.append\('metadata'/);
  assert.match(page, /formData\.append\('cover', form\.coverFile\)/);
  assert.ok((page.match(/'Content-Type': 'multipart\/form-data'/g) || []).length >= 2);
  assert.match(page, /reader\.readAsDataURL\(form\.coverFile\)/);
  assert.match(page, /2 \* 1024 \* 1024/);
  assert.match(api, /export function resolveLibraryAssetUrl/);
});
