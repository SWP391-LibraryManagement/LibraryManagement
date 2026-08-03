const { randomUUID } = require('crypto');
const { test, expect } = require('@playwright/test');
const { solveCaptcha } = require('./support/solveCaptcha');

const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:4173';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://127.0.0.1:3100';

async function setupActors(request) {
  const runId = randomUUID();
  const password = `E2e-${runId}!A1`;
  const memberEmail = `fe10-member-${runId}@example.test`;
  const librarianEmail = `fe10-librarian-${runId}@example.test`;
  const adminEmail = `fe10-admin-${runId}@example.test`;
  const response = await request.post(`${BACKEND_URL}/__e2e__/setup`, {
    data: { memberEmail, librarianEmail, adminEmail, password },
  });
  expect(response.status()).toBe(201);
  return {
    ...(await response.json()),
    password,
    memberEmail,
    librarianEmail,
    adminEmail,
  };
}

async function seedNotifications(request, data) {
  const response = await request.post(`${BACKEND_URL}/__e2e__/seed-notifications`, { data });
  expect(response.status()).toBe(201);
  return response.json();
}

async function login(page, email, password, expectedPath) {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.getByLabel('Tài khoản của bạn').fill(email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await solveCaptcha(page);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe(expectedPath);
}

async function clearSession(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function storedAccessToken(page) {
  return page.evaluate(
    () => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'),
  );
}

test('[E2E-FE10-001] member inbox enforces privacy, read filters, mark-all replay, and mobile fit', async ({
  page,
  request,
}) => {
  const actors = await setupActors(request);
  const seeded = await seedNotifications(request, {
    ownerUserId: actors.memberUserId,
    crossUserId: actors.librarianUserId,
    eligibleCount: 5,
  });

  await login(page, actors.memberEmail, actors.password, '/home');
  await expect(page.locator('.notification-badge')).toHaveText('5');
  await page.getByRole('button', { name: 'Mở thông báo' }).click();
  const preview = page.getByRole('region', { name: 'Thông báo mới' });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveCSS('width', '380px');
  const previewStack = await page.evaluate(() => {
    const popover = document.querySelector('.notification-popover');
    const topbar = document.querySelector('.app-topbar');
    const rect = popover.getBoundingClientRect();
    const topElement = document.elementFromPoint(rect.left + 24, rect.top + 200);
    return {
      topbarZIndex: getComputedStyle(topbar).zIndex,
      pointInsidePopover: Boolean(topElement?.closest('.notification-popover')),
    };
  });
  expect(previewStack).toEqual({ topbarZIndex: '100', pointInsidePopover: true });
  await expect(preview.locator('.notification-preview-item')).toHaveCount(5);
  await expect(page.getByText(seeded.sensitiveTitle, { exact: true })).toHaveCount(0);
  await expect(page.getByText(seeded.userlessTitle, { exact: true })).toHaveCount(0);
  await expect(page.getByText(seeded.crossUserTitle, { exact: true })).toHaveCount(0);

  await preview.getByRole('button', { name: new RegExp(seeded.ownedTitles[4]) }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/fines/mine');
  await expect(page.locator('.notification-badge')).toHaveText('4');

  await page.goto(`${FRONTEND_URL}/notifications`);
  await expect(page.getByRole('heading', { name: 'Thông báo của bạn' })).toBeVisible();
  await page.getByRole('tab', { name: 'Đã đọc' }).click();
  await expect(page.getByText(seeded.ownedTitles[4], { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Chưa đọc' }).click();
  await expect(page.getByText(seeded.ownedTitles[4], { exact: true })).toHaveCount(0);
  await expect(page.locator('.notification-item.unread')).toHaveCount(4);

  const accessToken = await storedAccessToken(page);
  const crossRead = await request.patch(
    `${BACKEND_URL}/api/notifications/${seeded.crossUserNotificationId}/read`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const missingRead = await request.patch(`${BACKEND_URL}/api/notifications/999999/read`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(crossRead.status()).toBe(404);
  expect(await crossRead.json()).toEqual(await missingRead.json());

  await page.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }).click();
  await expect(page.getByText('Chưa có thông báo', { exact: true })).toBeVisible();
  await expect(page.locator('.notification-badge')).toHaveCount(0);
  const replay = await request.patch(`${BACKEND_URL}/api/notifications/mine/read-all`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(await replay.json()).toEqual({ updated: 0 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Thông báo của bạn' })).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBe(false);
});

test('[E2E-FE10-002] read failure warns but still opens the allowlisted business page', async ({
  page,
  request,
}) => {
  const actors = await setupActors(request);
  const seeded = await seedNotifications(request, {
    ownerUserId: actors.memberUserId,
    crossUserId: actors.librarianUserId,
    eligibleCount: 1,
  });
  await login(page, actors.memberEmail, actors.password, '/home');
  const failControl = await request.post(`${BACKEND_URL}/__e2e__/fail-next-notification-read`);
  expect(failControl.status()).toBe(200);

  await page.getByRole('button', { name: 'Mở thông báo' }).click();
  await page.getByRole('region', { name: 'Thông báo mới' })
    .getByRole('button', { name: new RegExp(seeded.ownedTitles[0]) })
    .click();

  await expect.poll(() => new URL(page.url()).pathname).toBe('/membership');
  await expect(page.getByText(/Không thể đồng bộ trạng thái đã đọc/)).toBeVisible();
  await expect(page.locator('.notification-badge')).toHaveText('1');
});

test('[E2E-FE10-003] librarian and admin can open the inbox and large counts cap at 99+', async ({
  page,
  request,
}) => {
  const actors = await setupActors(request);
  const seeded = await seedNotifications(request, {
    ownerUserId: actors.librarianUserId,
    crossUserId: actors.adminUserId,
    eligibleCount: 100,
  });

  await login(page, actors.librarianEmail, actors.password, '/home');
  await expect(page.locator('.notification-badge')).toHaveText('99+');
  await page.goto(`${FRONTEND_URL}/notifications`);
  await expect(page.getByRole('heading', { name: 'Thông báo của bạn' })).toBeVisible();
  await expect(page.locator('.notification-item')).toHaveCount(20);
  await expect(page.getByText(seeded.ownedTitles[99], { exact: true })).toBeVisible();

  await clearSession(page);
  await login(page, actors.adminEmail, actors.password, '/admin/users');
  await page.goto(`${FRONTEND_URL}/notifications`);
  await expect(page.getByRole('heading', { name: 'Thông báo của bạn' })).toBeVisible();
  await expect(page.locator('.notification-badge')).toHaveText('1');
  await expect(page.getByText(seeded.crossUserTitle, { exact: true })).toBeVisible();
});
