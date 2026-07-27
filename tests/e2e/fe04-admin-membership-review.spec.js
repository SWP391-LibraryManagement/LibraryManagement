const { randomUUID } = require('crypto');
const { test, expect } = require('@playwright/test');

const FRONTEND_URL = process.env.E2E_FRONTEND_URL
  || `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT || 4173}`;
const BACKEND_URL = process.env.E2E_BACKEND_URL
  || `http://127.0.0.1:${process.env.E2E_BACKEND_PORT || 3100}`;

async function login(page, email, password, expectedPath) {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.getByLabel(/T.i kho.n c.a b.n/).fill(email);
  await page.getByRole('textbox', { name: /M.t kh.u/ }).fill(password);
  await page.getByRole('button', { name: /Đ.ng nh.p/ }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe(expectedPath);
}

async function accessToken(page) {
  return page.evaluate(() => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'));
}

test('[E2E-FE04-ADM04] Admin review supports rejection, re-application, approval, and responsive cards', async ({ page, request }) => {
  const runId = randomUUID();
  const password = `E2e-${runId}!A1`;
  const memberEmail = `fe04-member-${runId}@example.test`;
  const adminEmail = `fe04-admin-${runId}@example.test`;
  const setup = await request.post(`${BACKEND_URL}/__e2e__/setup`, {
    data: { memberEmail, adminEmail, librarianEmail: `fe04-librarian-${runId}@example.test`, password },
  });
  expect(setup.status()).toBe(201);

  await login(page, adminEmail, password, '/admin/users');
  await page.getByRole('button', { name: /Duy.t h.i vi.n/ }).click();
  await expect(page.getByRole('heading', { name: /Duy.t h.i vi.n/ })).toBeVisible();
  await expect(page.locator('.admin-membership-cards')).toBeVisible();
  await page.getByRole('button', { name: /X.t duy.t/ }).click();
  const firstDialog = page.getByRole('dialog');
  await firstDialog.getByRole('button', { name: /T. ch.i/ }).click();
  await firstDialog.locator('textarea').fill('Thiếu thông tin xác nhận trong hồ sơ.');
  await firstDialog.getByRole('button', { name: /X.c nh.n t. ch.i/ }).click();
  await expect(page.getByText(/Đã từ chối đơn/)).toBeVisible();

  await login(page, memberEmail, password, '/home');
  const memberToken = await accessToken(page);
  const reapply = await request.post(`${BACKEND_URL}/api/membership/applications`, {
    headers: { Authorization: `Bearer ${memberToken}` },
    data: {},
  });
  expect(reapply.status()).toBe(201);

  await login(page, adminEmail, password, '/admin/users');
  await page.getByRole('button', { name: /Duy.t h.i vi.n/ }).click();
  await expect(page.getByRole('button', { name: /X.t duy.t/ })).toBeVisible();
  await page.getByRole('button', { name: /X.t duy.t/ }).click();
  const secondDialog = page.getByRole('dialog');

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.admin-membership-table')).toBeHidden();
    await expect(page.locator('.admin-membership-cards')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }

  await secondDialog.getByRole('button', { name: /^Duy.t$/ }).click();
  await secondDialog.getByRole('button', { name: /X.c nh.n duy.t/ }).click();
  await expect(page.getByText(/Đã duyệt đơn/)).toBeVisible();
});
