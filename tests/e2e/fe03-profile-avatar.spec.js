const { test, expect } = require('@playwright/test');

const profile = {
  userId: 7,
  username: 'member',
  email: 'member@example.test',
  phone: '0900000001',
  status: 'ACTIVE',
  profileId: 7,
  fullName: 'Demo Member',
  address: null,
  dateOfBirth: null,
  avatarUrl: null,
};

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

async function openProfileEditor(page) {
  await page.goto('/profile');
  await expect(page.locator('.pa-btn-primary')).toBeVisible();
  await page.locator('.pa-btn-primary').click();
  await expect(page.locator('.ep-dialog')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'e2e-access-token');
    localStorage.setItem('refreshToken', 'e2e-refresh-token');
    localStorage.setItem('authUser', JSON.stringify({ userId: 7, roles: ['MEMBER'] }));
  });

  await page.route('**/api/profile/me', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: profile });
      return;
    }
    await route.fulfill({ json: profile });
  });

  await page.route('**/api/profile/me/avatar', async (route) => {
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: { ...profile, avatarUrl: '/uploads/avatars/7-generated.png' } });
  });
});

test('FE03 uploads a selected avatar when saving the profile form', async ({ page }) => {
  await openProfileEditor(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: png,
  });
  const avatarRequestPromise = page.waitForRequest(
    (request) => request.url().endsWith('/api/profile/me/avatar') && request.method() === 'POST',
    { timeout: 3000 }
  );
  await page.locator('.ep-btn-save').click();
  const avatarRequest = await avatarRequestPromise;

  expect(avatarRequest.headers()['content-type']).toContain('multipart/form-data');
  await expect(page.locator('.ep-dialog')).toBeHidden();
  await expect(page.locator('.ph-avatar img')).toHaveAttribute('src', /\/uploads\/avatars\/7-generated\.png$/);
});

test('FE03 rejects an unsupported avatar type in the profile screen', async ({ page }) => {
  await openProfileEditor(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: 'avatar.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not an image'),
  });

  await expect(page.locator('.ep-error')).toContainText('JPG');
  await expect(page.locator('.ep-btn-upload')).toBeDisabled();
});

test('FE03 rejects an oversized avatar in the profile screen', async ({ page }) => {
  await openProfileEditor(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  });

  await expect(page.locator('.ep-error')).toContainText('2 MB');
  await expect(page.locator('.ep-btn-upload')).toBeDisabled();
});
