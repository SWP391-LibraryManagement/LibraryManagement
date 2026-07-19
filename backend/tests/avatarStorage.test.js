jest.mock('fs/promises', () => ({
  mkdir: jest.fn(async () => undefined),
  writeFile: jest.fn(async () => undefined),
  unlink: jest.fn(async () => undefined),
}));

const fs = require('fs/promises');
const path = require('path');
const {
  AVATAR_UPLOAD_DIR,
  PUBLIC_AVATAR_PATH,
  deleteAvatarFile,
  saveAvatarFile,
} = require('../src/utils/avatarStorage');

beforeEach(() => {
  fs.mkdir.mockClear();
  fs.writeFile.mockClear();
  fs.unlink.mockClear();
});

test('saveAvatarFile uses a generated managed filename and ignores client path data', async () => {
  const buffer = Buffer.from('avatar-bytes');

  const avatarUrl = await saveAvatarFile({
    userId: 7,
    mimeType: 'image/png',
    buffer,
    originalName: 'C:\\fakepath\\client-name.exe',
  });

  expect(avatarUrl).toMatch(new RegExp(`^${PUBLIC_AVATAR_PATH}/7-[0-9a-f-]+\\.png$`));
  expect(avatarUrl).not.toContain('client-name');
  expect(fs.mkdir).toHaveBeenCalledWith(AVATAR_UPLOAD_DIR, { recursive: true });
  expect(fs.writeFile).toHaveBeenCalledWith(
    path.join(AVATAR_UPLOAD_DIR, path.basename(avatarUrl)),
    buffer
  );
});

test.each([
  'https://example.test/avatar.png',
  '/uploads/avatars/../private.txt',
  '/uploads/avatars/..',
  '/uploads/avatars/.',
  '/uploads/avatars/nested/avatar.png',
  'C:\\temp\\avatar.png',
])('deleteAvatarFile refuses unmanaged or unsafe path %s', async (avatarUrl) => {
  await expect(deleteAvatarFile(avatarUrl)).resolves.toBe(false);
  expect(fs.unlink).not.toHaveBeenCalled();
});

test('deleteAvatarFile removes only a generated file inside the managed avatar directory', async () => {
  await expect(deleteAvatarFile('/uploads/avatars/7-generated.png')).resolves.toBe(true);

  expect(fs.unlink).toHaveBeenCalledWith(path.join(AVATAR_UPLOAD_DIR, '7-generated.png'));
});

test('deleteAvatarFile treats an already-missing managed file as cleaned', async () => {
  const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
  fs.unlink.mockRejectedValueOnce(missing);

  await expect(deleteAvatarFile('/uploads/avatars/7-missing.png')).resolves.toBe(true);
});
