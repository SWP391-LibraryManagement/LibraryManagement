const { readFileSync } = require('fs');
const { randomUUID } = require('crypto');
const { test, expect } = require('@playwright/test');

const FRONTEND_URL = process.env.E2E_FRONTEND_URL
  || `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT || 4173}`;
const BACKEND_URL = process.env.E2E_BACKEND_URL
  || `http://127.0.0.1:${process.env.E2E_BACKEND_PORT || 3100}`;

async function login(page, email, password, expectedPath) {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.getByLabel('Tài khoản của bạn').fill(email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe(expectedPath);
}

async function storedAccessToken(page) {
  return page.evaluate(
    () => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  );
}

function isRequestListResponse(response, expected = {}) {
  if (response.request().method() !== 'GET') return false;
  const url = new URL(response.url());
  if (url.pathname !== '/api/admin/requests') return false;
  return Object.entries(expected).every(
    ([key, value]) => url.searchParams.get(key) === String(value)
  );
}

// @spec FR-FE11-031, FR-FE11-034, FR-FE11-035, AC-FE11-019
test('[E2E-FE11-ACC01] Admin Request Management preserves pagination, detail, export, and terminal controls', async ({
  page,
  request,
}) => {
  const runId = randomUUID();
  const password = `E2e-${runId}!A1`;
  const memberEmail = `fe11-member-${runId}@example.test`;
  const librarianEmail = `fe11-librarian-${runId}@example.test`;
  const adminEmail = `fe11-admin-${runId}@example.test`;

  const setupResponse = await request.post(`${BACKEND_URL}/__e2e__/setup`, {
    data: { memberEmail, librarianEmail, adminEmail, password },
  });
  expect(setupResponse.status()).toBe(201);
  await expect(setupResponse.json()).resolves.toEqual(
    expect.objectContaining({ adminUserId: expect.any(Number) })
  );

  await login(page, memberEmail, password, '/home');
  const memberToken = await storedAccessToken(page);
  expect(memberToken).toBeTruthy();
  const memberHeaders = { Authorization: `Bearer ${memberToken}` };

  const completedSeed = await request.post(`${BACKEND_URL}/api/borrow-requests`, {
    headers: memberHeaders,
    data: { copyIds: [1] },
  });
  expect(completedSeed.status()).toBe(201);
  const completedRequestId = (await completedSeed.json()).borrowRequest.requestId;

  const pendingRequestIds = [];
  for (let index = 0; index < 21; index += 1) {
    const response = await request.post(`${BACKEND_URL}/api/borrow-requests`, {
      headers: memberHeaders,
      data: { copyIds: [2] },
    });
    expect(response.status()).toBe(201);
    pendingRequestIds.push((await response.json()).borrowRequest.requestId);
  }

  await login(page, adminEmail, password, '/admin/users');
  const adminToken = await storedAccessToken(page);
  expect(adminToken).toBeTruthy();
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const bookSummary = page.locator('.um-stat.dashboard-card').filter({ hasText: 'Tổng số sách' });
  await expect(bookSummary.getByText('1', { exact: true })).toBeVisible();

  const approved = await request.patch(
    `${BACKEND_URL}/api/borrow-requests/${completedRequestId}/approve`,
    { headers: adminHeaders, data: {} }
  );
  expect(approved.status()).toBe(200);
  const completedDetailId = (await approved.json()).borrowRequest.details[0].borrowDetailId;

  const returned = await request.patch(
    `${BACKEND_URL}/api/borrow-details/${completedDetailId}/return`,
    { headers: adminHeaders, data: { condition: 'NORMAL', returnDate: '2026-07-14' } }
  );
  expect(returned.status()).toBe(200);

  const firstPageResponse = page.waitForResponse(
    (response) => isRequestListResponse(response, { page: 1, limit: 20 })
  );
  await page.getByRole('button', { name: 'Quản lý yêu cầu', exact: true }).click();
  const firstPage = await firstPageResponse;
  expect(firstPage.status()).toBe(200);
  expect((await firstPage.json()).pagination).toMatchObject({
    page: 1,
    limit: 20,
    total: 22,
    totalPages: 2,
  });
  await expect(page.locator('table.request-table tbody tr')).toHaveCount(20);
  await expect(page.getByText('Trang 1/2 · 22 bản ghi', { exact: true })).toBeVisible();

  const secondPageResponse = page.waitForResponse(
    (response) => isRequestListResponse(response, { page: 2, limit: 20 })
  );
  await page.locator('[aria-label="Phân trang"]').getByRole('button', { name: '2', exact: true }).click();
  expect((await secondPageResponse).status()).toBe(200);
  await expect(page.locator('table.request-table tbody tr')).toHaveCount(2);

  await page.getByLabel('Lọc trạng thái').selectOption('PENDING');
  const pendingResponse = page.waitForResponse(
    (response) => isRequestListResponse(response, { page: 1, limit: 20, status: 'PENDING' })
  );
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  const pendingPage = await pendingResponse;
  expect(pendingPage.status()).toBe(200);
  expect((await pendingPage.json()).pagination.total).toBe(21);

  await page.getByRole('button', { name: 'Xử lý', exact: true }).first().click();
  const pendingDialog = page.getByRole('dialog');
  await expect(pendingDialog).toContainText(`Yêu cầu #${pendingRequestIds.at(-1)}`);
  await expect(pendingDialog).toContainText('BC2');
  await expect(pendingDialog.getByRole('button', { name: 'Duyệt yêu cầu' })).toBeVisible();
  await expect(pendingDialog.getByRole('button', { name: 'Từ chối' })).toBeVisible();
  await pendingDialog.getByRole('button', { name: 'Đóng' }).click();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Xuất CSV', exact: true }).click(),
  ]);
  const csv = readFileSync(await download.path(), 'utf8');
  const csvLines = csv.split(/\r?\n/).filter(Boolean);
  expect(csvLines).toHaveLength(22);
  expect(csv).toContain(String(pendingRequestIds[0]));
  expect(csv).toContain(String(pendingRequestIds.at(-1)));
  expect(csv).not.toContain(`\"${completedRequestId}\"`);

  await page.getByLabel('Lọc trạng thái').selectOption('COMPLETED');
  const completedResponse = page.waitForResponse(
    (response) => isRequestListResponse(response, { page: 1, limit: 20, status: 'COMPLETED' })
  );
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  const completedPage = await completedResponse;
  expect(completedPage.status()).toBe(200);
  expect((await completedPage.json()).pagination.total).toBe(1);

  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  const completedDialog = page.getByRole('dialog');
  await expect(completedDialog).toContainText(`Yêu cầu #${completedRequestId}`);
  await expect(completedDialog).toContainText('BC1');
  await expect(completedDialog).toContainText('Hoàn thành');
  await expect(completedDialog.getByRole('button', { name: 'Duyệt yêu cầu' })).toHaveCount(0);
  await expect(completedDialog.getByRole('button', { name: 'Từ chối' })).toHaveCount(0);

  for (const action of ['approve', 'reject']) {
    const response = await request.patch(
      `${BACKEND_URL}/api/borrow-requests/${completedRequestId}/${action}`,
      {
        headers: adminHeaders,
        data: action === 'reject' ? { reason: 'Terminal request must remain immutable.' } : {},
      }
    );
    expect(response.status()).toBe(409);
    expect((await response.json()).error.code).toBe('BORROW_REQUEST_NOT_PENDING');
  }
});
