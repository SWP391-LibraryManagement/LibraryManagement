const { mkdirSync } = require('fs');
const { randomUUID } = require('crypto');
const { test, expect } = require('@playwright/test');

const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:4173';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://127.0.0.1:3100';
const FIXED_NOW = new Date('2026-07-14T00:00:00.000Z');

async function login(page, email, password, expectedPath) {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.getByLabel('Tài khoản của bạn').fill(email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe(expectedPath);
}

async function clearSession(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

test('[E2E-SYS-001] login, borrow, approve, return, fine, and report golden path', async ({
  page,
  request,
}) => {
  const runId = randomUUID();
  const password = `E2e-${runId}!A1`;
  const memberEmail = `e2e-member-${runId}@example.test`;
  const librarianEmail = `e2e-librarian-${runId}@example.test`;
  mkdirSync('output/playwright', { recursive: true });
  await page.clock.setFixedTime(FIXED_NOW);

  const setupResponse = await request.post(`${BACKEND_URL}/__e2e__/setup`, {
    data: { memberEmail, librarianEmail, password },
  });
  expect(setupResponse.ok()).toBeTruthy();

  await page.goto(`${FRONTEND_URL}/login`);
  await expect(page.getByLabel('Tài khoản của bạn')).toBeVisible();
  await page.screenshot({ path: 'output/playwright/manual-login.png', fullPage: true });

  await login(page, memberEmail, password, '/home');
  await page.goto(`${FRONTEND_URL}/borrowing/new`);
  await page.getByRole('button', { name: /Gửi yêu cầu mượn/i }).click();
  await expect(page.getByText(/Yêu cầu #\d+ đã được tạo/i)).toBeVisible();
  await page.screenshot({
    path: 'output/playwright/manual-member-borrow-request.png',
    fullPage: true,
  });

  await clearSession(page);
  await login(page, librarianEmail, password, '/home');
  await page.goto(`${FRONTEND_URL}/librarian/borrow-requests`);
  await expect(page.locator('tbody .badge-pending').first()).toBeVisible();
  await page.getByRole('button', { name: /^Duyệt$/i }).click();
  await page.getByRole('button', { name: /^Duyệt và cấp sách$/i }).click();
  await expect(page.getByText(/Đã duyệt yêu cầu/i)).toBeVisible();
  await page.screenshot({
    path: 'output/playwright/manual-librarian-approval.png',
    fullPage: true,
  });

  const stateResponse = await request.get(`${BACKEND_URL}/__e2e__/state`);
  expect(stateResponse.ok()).toBeTruthy();
  const state = await stateResponse.json();
  expect(state.latestBorrowDetailId).toBeGreaterThan(0);

  const overdueResponse = await request.post(`${BACKEND_URL}/__e2e__/make-overdue`, {
    data: { borrowDetailId: state.latestBorrowDetailId, dueDate: '2026-06-30' },
  });
  expect(overdueResponse.ok()).toBeTruthy();

  await page.goto(`${FRONTEND_URL}/librarian/returns`);
  await expect(page.locator('.panel').getByText('14 ngày', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Xác nhận trả/i }).click();
  await page.getByRole('button', { name: /^Ghi nhận trả sách$/i }).click();
  await expect(
    page.getByText(/Giao dịch có dữ liệu cần xem xét tiền phạt/i)
  ).toBeVisible();

  const syncResponse = await request.post(`${BACKEND_URL}/__e2e__/sync-fines`);
  expect(syncResponse.ok()).toBeTruthy();
  const accessToken = await page.evaluate(
    () => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  );
  expect(accessToken).toBeTruthy();

  const fineResponse = await request.post(`${BACKEND_URL}/api/fines/calculate`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { borrowDetailId: state.latestBorrowDetailId },
  });
  expect(fineResponse.status()).toBe(201);
  const fineResult = await fineResponse.json();
  expect(fineResult).toMatchObject({ created: true, overdueDays: 14, amount: 70000 });
  expect(fineResult.fine).toMatchObject({ status: 'UNPAID', amount: 70000 });

  const paidResponse = await request.patch(
    `${BACKEND_URL}/api/fines/${fineResult.fine.fineId}/paid`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { paymentMethod: 'CASH', note: 'E2E system golden path' },
    }
  );
  expect(paidResponse.ok()).toBeTruthy();
  expect((await paidResponse.json()).fine.status).toBe('PAID');

  await page.goto(`${FRONTEND_URL}/reports/borrowing`);
  const requestKpi = page.locator('.kpi-card').filter({ hasText: 'Tổng bản ghi' });
  await expect(requestKpi.getByText('1', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'output/playwright/system-golden-path-desktop.png' });
  await page.screenshot({
    path: 'output/playwright/manual-borrowing-report.png',
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(requestKpi.getByText('1', { exact: true })).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(horizontalOverflow).toBe(false);
  await page.screenshot({ path: 'output/playwright/system-golden-path-mobile.png' });
});
