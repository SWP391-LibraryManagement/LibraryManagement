import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('FE09 uses AppLayout while retaining prototype data ownership', async () => {
  const source = await readFile(new URL('../src/page/FineManagement.jsx', import.meta.url), 'utf8');

  assert.match(source, /import AppLayout from '\.\.\/component\/layout\/AppLayout';/);
  assert.match(source, /import '\.\.\/styles\/fine-management\.css';/);
  assert.match(source, /getFineRecords/);
  assert.match(source, /saveFineRecords/);
  assert.match(source, /FINE_RECORDS_KEY/);
  assert.match(source, /<BookManagement \/>/);
  assert.match(source, /<AppLayout/);
  assert.doesNotMatch(source, /className="fine-shell"/);
  assert.doesNotMatch(source, /className="fine-sidebar"/);
  assert.doesNotMatch(source, /<style>\{`/);
  assert.doesNotMatch(source, /function handleLogout\(/);
});
