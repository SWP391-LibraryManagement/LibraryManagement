import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('FE01 HomePage reads the canonical public envelope without category endpoint', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  assert.match(source, /publicBrowseApi\.list\(\)/);
  assert.match(source, /Array\.isArray\(booksResult\.data\)/);
  assert.doesNotMatch(source, /\/books\/categories/);
  assert.doesNotMatch(source, /booksResult\.success/);
  assert.doesNotMatch(source, /API_BASE_URL/);
});

test('FE01 search uses the canonical public envelope and approved query', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  assert.match(source, /publicBrowseApi\.list\(\{ q: keyword \}\)/);
  assert.match(source, /Array\.isArray\(result\.data\)/);
  assert.match(source, /keyword\.length > 200/);
});

test('FE01 blank search reloads the default catalog without an error toast', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  const blankBranch = source.match(/if \(!keyword\) \{([\s\S]*?)\n[ ]{4}\}/)?.[1] || '';

  assert.match(blankBranch, /await publicBrowseApi\.list\(\)/);
  assert.match(blankBranch, /setBooks\(result\.data \|\| \[\]\)/);
  assert.match(blankBranch, /setActiveSearch\(''\)/);
  assert.match(blankBranch, /setActiveCategory\('Tất cả'\)/);
  assert.match(blankBranch, /setShowAll\(true\)/);
  assert.match(blankBranch, /scrollTo\('section-books'\)/);
  assert.doesNotMatch(blankBranch, /Vui lòng nhập từ khóa tìm kiếm/);
});

test('FE01 API adapter owns canonical unauthenticated list and detail reads', async () => {
  const source = await readFile(new URL('../src/api/libraryFeatureApi.js', import.meta.url), 'utf8');
  assert.match(source, /export const publicBrowseApi =/);
  assert.match(source, /api\.get\('\/books', \{ params \}\)/);
  assert.match(source, /api\.get\(`\/books\/\$\{bookId\}`\)/);
});

test('FE01 renders canonical public fields and removes fake local borrowing', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  assert.match(source, /book\.bookId/);
  assert.match(source, /book\.authorName \|\| 'Không rõ tác giả'/);
  assert.match(source, /book\.categoryName \|\| 'Chưa phân loại'/);
  assert.match(source, /book\.availabilityStatus === 'AVAILABLE'/);
  assert.match(source, /Không khả dụng/);
  assert.doesNotMatch(source, /ĐÃ MƯỢN/);
  assert.doesNotMatch(source, /BorrowModal/);
  assert.doesNotMatch(source, /addBorrowRecord/);
  assert.doesNotMatch(source, /Mượn "\$\{selectedBook\.title\}" thành công/);
});
