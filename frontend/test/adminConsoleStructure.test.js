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

test('Admin shell derives accessible desktop and mobile navigation from one contract', async () => {
  const shell = await readFile(new URL('components/AdminShell.jsx', root), 'utf8');
  assert.match(shell, /ADMIN_NAVIGATION/);
  assert.match(shell, /aria-current=/);
  assert.match(shell, /aria-expanded=/);
  assert.match(shell, /aria-controls=/);
  assert.match(shell, /event\.key === 'Escape'/);
  assert.doesNotMatch(shell, /api\//);
});

test('Admin page resolves stored access before protected section composition', async () => {
  const access = await readFile(new URL('adminAccess.js', root), 'utf8');
  const page = await readFile(new URL('AdminConsolePage.jsx', root), 'utf8');
  assert.match(access, /localStorage/);
  assert.match(access, /sessionStorage/);
  assert.match(access, /roles\.includes\('ADMIN'\)/);
  assert.match(page, /useState\('users'\)/);
  assert.match(page, /<Navigate to="\/login" replace \/>/);
  assert.match(page, /<Navigate to="\/home" replace \/>/);
  assert.ok(page.indexOf('!access.authenticated') < page.indexOf('<AdminShell'));
});
