import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../src/page/admin/', import.meta.url);

test('Admin shared components are presentation only', async () => {
  for (const file of [
    'AdminPageHeader.jsx',
    'AdminFilterBar.jsx',
    'AdminDateField.jsx',
    'AdminActionButton.jsx',
    'AdminEmptyState.jsx',
    'AdminPagination.jsx',
  ]) {
    const source = await readFile(new URL(`components/${file}`, root), 'utf8');
    assert.doesNotMatch(source, /api\//);
  }
});

test('Admin date and action controls expose visible labels', async () => {
  const date = await readFile(new URL('components/AdminDateField.jsx', root), 'utf8');
  const action = await readFile(new URL('components/AdminActionButton.jsx', root), 'utf8');
  assert.match(date, /<span>\{label\}<\/span>/);
  assert.match(date, /type="date"/);
  assert.match(action, /<span>\{label\}<\/span>/);
});

test('Admin CSS defines mobile cards, focus and reduced motion', async () => {
  const css = await readFile(new URL('admin-console.css', root), 'utf8');
  assert.match(css, /\.admin-user-cards/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 900px\)/);
});
