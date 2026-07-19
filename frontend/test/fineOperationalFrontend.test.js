import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('FE09 uses AppLayout with canonical API data ownership', async () => {
  const source = await readFile(
    new URL('../src/page/FineManagement.jsx', import.meta.url),
    'utf8'
  );

  const bookPage = await readFile(
    new URL('../src/page/BookManagementPage.jsx', import.meta.url),
    'utf8'
  );

  assert.match(
    source,
    /import AppLayout from '\.\.\/component\/layout\/AppLayout';/
  );

  assert.match(
    source,
    /import '\.\.\/styles\/fine-management\.css';/
  );

  assert.match(
    source,
    /import \{ fineApi \} from '\.\.\/api\/libraryFeatureApi';/
  );

  assert.match(source, /fineApi\.list\(\)/);

  assert.doesNotMatch(source, /getFineRecords/);
  assert.doesNotMatch(source, /saveFineRecords/);
  assert.doesNotMatch(source, /FINE_RECORDS_KEY/);

  assert.doesNotMatch(source, /<BookManagement \/>/);
  assert.match(bookPage, /<BookManagement \/>/);
  assert.match(source, /<AppLayout/);

  assert.doesNotMatch(source, /className="fine-shell"/);
  assert.doesNotMatch(source, /className="fine-sidebar"/);
  assert.doesNotMatch(source, /<style>\{`/);
  assert.doesNotMatch(source, /function handleLogout\(/);
});

test('FE09 reuses shared operational components with canonical API alignment', async () => {
  const source = await readFile(
    new URL('../src/page/FineManagement.jsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /DataToolbar/);
  assert.match(source, /DataTable/);
  assert.match(source, /DataNotice/);
  assert.match(source, /EmptyState/);
  assert.match(source, /Toast/);

  assert.doesNotMatch(source, /function Toast\(/);
  assert.doesNotMatch(source, /function EmptyState\(/);
  assert.doesNotMatch(source, /<table className="fine-table"/);
  assert.match(source, /fineApi\.list\(\)/);
  assert.match(source, /fineApi\.calculate/);
  assert.match(source, /fineApi\.collect/);
  assert.match(source, /fineApi\.markPaid/);
  assert.match(source, /fineApi\.waive/);
  assert.match(source, /fineApi\.cancel/);

  assert.doesNotMatch(source, /ConfirmAction/);
  assert.doesNotMatch(source, /DAILY_FINE_RATE/);
  assert.doesNotMatch(source, /saveFineRecords/);
});