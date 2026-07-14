import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../src/page/BookManagement.jsx', import.meta.url);

test('FE05 maps copy counts to canonical availability values in the update form', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /copyStatus: Number\(book\.availableCopies \|\| 0\) > 0 \? 'AVAILABLE' : 'BORROWED'/);
  assert.match(source, /body: JSON\.stringify\(\{ copyStatus: updateForm\.copyStatus \}\)/);
});

test('FE05 keeps the management UI limited to available and borrowed states', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.doesNotMatch(source, /Chưa có bản sao/);
  assert.doesNotMatch(source, /return \{ key: 'inactive', label: 'INACTIVE' \}/);
  assert.match(source, /\? \{ key: 'available', label: 'Còn sách' \}[\s\S]*?: \{ key: 'borrowed', label: 'Đã mượn' \}/);
  assert.doesNotMatch(source, /availabilityDisabled|Hãy thêm bản sao và barcode/);
  assert.match(source, /const availabilityResult = await apiRequest/);
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
