const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const AVATAR_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/avatars');
const PUBLIC_AVATAR_PATH = '/uploads/avatars';

const EXTENSIONS_BY_MIME_TYPE = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

async function saveAvatarFile(file) {
  await fs.mkdir(AVATAR_UPLOAD_DIR, { recursive: true });

  const extension = EXTENSIONS_BY_MIME_TYPE[file.mimeType];
  const filename = `${file.userId}-${crypto.randomUUID()}${extension}`;
  const absolutePath = path.join(AVATAR_UPLOAD_DIR, filename);

  await fs.writeFile(absolutePath, file.buffer);

  return `${PUBLIC_AVATAR_PATH}/${filename}`;
}

module.exports = {
  saveAvatarFile,
  AVATAR_UPLOAD_DIR,
  PUBLIC_AVATAR_PATH,
};
