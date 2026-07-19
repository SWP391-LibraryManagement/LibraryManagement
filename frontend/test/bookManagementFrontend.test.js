import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../src/page/BookManagement.jsx', import.meta.url);

test('FE05 treats copy availability as read-only derived data', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.doesNotMatch(source, /\/availability/);
  assert.doesNotMatch(source, /copyStatus:/);
  assert.match(source, /Number\(book\.availableCopies \|\| 0\) > 0/);
});

test('FE05 shows only the public-safe derived availability label', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.doesNotMatch(source, /Chưa có bản sao/);
  assert.doesNotMatch(source, /return \{ key: 'inactive', label: 'INACTIVE' \}/);
  assert.match(source, /\? \{ key: 'available', label: 'Còn sách' \}[\s\S]*?: \{ key: 'borrowed', label: 'Không khả dụng' \}/);
  assert.doesNotMatch(source, /availabilityDisabled|Hãy thêm bản sao và barcode/);
  assert.doesNotMatch(source, /const availabilityResult = await apiRequest/);
});

test('FE05 removes a deactivated book from the active management list', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /const \[statusFilter, setStatusFilter\] = useState\('ACTIVE'\)/);
  assert.match(source, /setStatusFilter\('ACTIVE'\);\s*await loadBooks\(\{ status: 'ACTIVE' \}\);/);
  assert.match(source, /setSelectedBookId\(''\);\s*setDetailBook\(null\);/);
});

test('FE05 book management requests use the shared token refresh flow', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /import \{ authorizedRequest \} from '\.\.\/api\/libraryFeatureApi';/);
  assert.match(source, /return authorizedRequest\(\{/);
  assert.doesNotMatch(source, /const token = getToken\(\)/);
});

test('FE05 librarian list refreshes canonical data and paginates management rows', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /const PAGE_SIZE = 8/);
  assert.match(source, /const pagedBooks = books\.slice/);
  assert.match(source, /renderBookTable\(pagedBooks, \(safePage - 1\) \* PAGE_SIZE\)/);
  assert.match(source, /aria-label="Phân trang danh sách sách"/);
  assert.match(source, /await Promise\.all\(\[loadMetadata\(\), loadBooks\(\)\]\)/);
  assert.doesNotMatch(source, /<h1>Kho dữ liệu sách<\/h1>/);
  assert.match(source, /\/books\/\$\{selectedBook\.id\}\/deactivate/);
});

test('FE05 reveals a newly created book and renders continuous display numbers', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /const createdIndex = nextBooks\.findIndex/);
  assert.match(source, /setPage\(createdIndex >= 0 \? Math\.floor\(createdIndex \/ PAGE_SIZE\) \+ 1 : 1\)/);
  assert.match(source, /loadBooks\(\{ status: 'ACTIVE', categoryId: '' \}\)/);
  assert.match(source, /renderBookTable\(pagedBooks, \(safePage - 1\) \* PAGE_SIZE\)/);
  assert.match(source, /#\{startIndex \+ index \+ 1\}/);
  assert.match(source, /title=\{`ID dữ liệu: #\$\{book\.id\}`\}/);
});
