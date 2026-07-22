const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const BOOK_COVER_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/book-covers');
const PUBLIC_BOOK_COVER_PATH = '/uploads/book-covers';

const EXTENSIONS_BY_MIME_TYPE = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// @spec BR-FE05-019, FR-FE05-027
async function saveBookCoverFile(file) {
  await fs.mkdir(BOOK_COVER_UPLOAD_DIR, { recursive: true });
  const extension = EXTENSIONS_BY_MIME_TYPE[file.mimeType];
  const filename = `${crypto.randomUUID()}${extension}`;
  await fs.writeFile(path.join(BOOK_COVER_UPLOAD_DIR, filename), file.buffer);
  return `${PUBLIC_BOOK_COVER_PATH}/${filename}`;
}

// @spec BR-FE05-020, FR-FE05-028
async function deleteBookCoverFile(coverUrl) {
  const match = String(coverUrl || '').match(/^\/uploads\/book-covers\/([A-Za-z0-9][A-Za-z0-9._-]*)$/);
  if (!match) return false;

  try {
    await fs.unlink(path.join(BOOK_COVER_UPLOAD_DIR, match[1]));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return true;
}

module.exports = {
  saveBookCoverFile,
  deleteBookCoverFile,
  BOOK_COVER_UPLOAD_DIR,
  PUBLIC_BOOK_COVER_PATH,
};
