jest.mock('fs/promises', () => ({
  mkdir: jest.fn(async () => undefined),
  writeFile: jest.fn(async () => undefined),
  unlink: jest.fn(async () => undefined),
}));

const fs = require('fs/promises');
const path = require('path');
const {
  BOOK_COVER_UPLOAD_DIR,
  PUBLIC_BOOK_COVER_PATH,
  deleteBookCoverFile,
  saveBookCoverFile,
} = require('../src/utils/bookCoverStorage');

beforeEach(() => {
  fs.mkdir.mockClear();
  fs.writeFile.mockClear();
  fs.unlink.mockClear();
});

// @spec BR-FE05-019, FR-FE05-027
test('book cover storage generates a managed filename and ignores the client path', async () => {
  const buffer = Buffer.from('cover-bytes');
  const coverUrl = await saveBookCoverFile({
    mimeType: 'image/webp',
    buffer,
    originalName: 'C:\\fakepath\\unsafe.exe',
  });

  expect(coverUrl).toMatch(new RegExp(`^${PUBLIC_BOOK_COVER_PATH}/[0-9a-f-]+\\.webp$`));
  expect(coverUrl).not.toContain('unsafe');
  expect(fs.mkdir).toHaveBeenCalledWith(BOOK_COVER_UPLOAD_DIR, { recursive: true });
  expect(fs.writeFile).toHaveBeenCalledWith(
    path.join(BOOK_COVER_UPLOAD_DIR, path.basename(coverUrl)),
    buffer
  );
});

// @spec BR-FE05-020, FR-FE05-028
test.each([
  'https://example.test/cover.png',
  '/uploads/book-covers/../private.txt',
  '/uploads/book-covers/nested/cover.png',
  'C:\\temp\\cover.png',
])('book cover deletion refuses unmanaged path %s', async (coverUrl) => {
  await expect(deleteBookCoverFile(coverUrl)).resolves.toBe(false);
  expect(fs.unlink).not.toHaveBeenCalled();
});

test('book cover deletion removes only a file inside the managed directory', async () => {
  await expect(deleteBookCoverFile('/uploads/book-covers/generated.png')).resolves.toBe(true);
  expect(fs.unlink).toHaveBeenCalledWith(path.join(BOOK_COVER_UPLOAD_DIR, 'generated.png'));
});
