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
  const userHeading = page.getByRole('heading', { name: 'Quản lý người dùng', exact: true });
  await expect(userHeading).toBeVisible();

  await page.setViewportSize({ width: 1600, height: 900 });
  await expect(page.locator('.admin-user-table')).toBeVisible();
  await expect(page.locator('.admin-user-cards')).toBeHidden();

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.admin-user-table')).toBeHidden();
    await expect(page.locator('.admin-user-cards')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Phân quyền', exact: true }).first()).toBeVisible();
    expect(await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )).toBe(false);
    await page.screenshot({
      path: `output/playwright/admin-user-management-${viewport.width}.png`,
      fullPage: true,
    });
  }

  await expect(page.locator('.app-sidebar .app-nav-item')).toHaveCount(7);
  await expect(page.locator('.app-sidebar').getByRole('button', { name: 'Phân quyền', exact: true })).toHaveCount(0);

  await page.route('**/api/admin/audit-logs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{
          logId: 9001,
          action: 'AUTH_LOGIN_SUCCESS',
          actor: { userId: 1, fullName: 'Quản trị viên', email: adminEmail },
          target: { type: 'USER', id: 1, label: adminEmail },
          details: { status: 'ACTIVE', changedFields: ['status'] },
          ipAddress: '127.0.0.1',
          createdAt: '2026-07-22T08:00:00.000Z',
        }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    });
  });

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole('button', { name: 'Nhật ký hoạt động', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nhật ký hoạt động', exact: true })).toBeVisible();
  await expect(page.getByLabel('Tìm nhật ký')).toHaveCount(0);
  await expect(page.getByLabel('Hành động')).toHaveCount(0);
  await expect(page.getByLabel('Mã người thực hiện')).toHaveCount(0);
  await expect(page.getByLabel('Từ ngày')).toHaveCount(0);
  await expect(page.getByLabel('Đến ngày')).toHaveCount(0);
  await expect(page.locator('.admin-audit-table thead th')).toHaveText([
    'Hành động',
    'Người thực hiện',
    'Đối tượng',
    'IP',
    'Thời gian',
  ]);
  await expect(page.getByText('Xem chi tiết (2)', { exact: true })).toHaveCount(0);
  const auditCellWidths = await page.locator('.admin-audit-table tbody tr').first().locator('td').evaluateAll(
    (cells) => cells.map((cell) => Math.round(cell.getBoundingClientRect().width)),
  );
  expect(auditCellWidths[0]).toBeGreaterThanOrEqual(120);
  expect(auditCellWidths).toHaveLength(5);
  expect(auditCellWidths[3]).toBeGreaterThanOrEqual(90);
  expect(auditCellWidths[4]).toBeGreaterThanOrEqual(120);
  const auditRowBox = await page.locator('.admin-audit-table tbody tr').first().boundingBox();
  expect(auditRowBox).toBeTruthy();
  expect(auditRowBox.height).toBeLessThan(220);
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )).toBe(false);
  await page.screenshot({ path: 'output/playwright/admin-audit-1366.png', fullPage: true });

  await page.getByRole('button', { name: 'Tổng quan', exact: true }).click();
  const bookSummary = page.locator('.admin-dashboard__stat').filter({ hasText: 'Tổng số sách' });
  await expect(bookSummary.getByText('1', { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Mở điều hướng', exact: true }).click();
  await page.getByRole('button', { name: 'Quản lý người dùng', exact: true }).click();
  await expect(userHeading).toBeVisible();
  await expect(page.locator('.admin-user-table')).toBeHidden();
  await expect(page.locator('.admin-user-cards')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Phân quyền', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vô hiệu hóa', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chỉnh sửa', exact: true })).toHaveCount(0);
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )).toBe(false);
  await page.screenshot({ path: 'output/playwright/admin-user-management-390.png', fullPage: true });
  await page.setViewportSize({ width: 1366, height: 768 });

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
  await expect(page.getByRole('table', { name: 'Danh sách yêu cầu mượn' }).locator('tbody tr')).toHaveCount(20);
  await expect(page.getByText('Trang 1/2 · 22 mục', { exact: true })).toBeVisible();

  const secondPageResponse = page.waitForResponse(
    (response) => isRequestListResponse(response, { page: 2, limit: 20 })
  );
  await page.locator('[aria-label="Phân trang"]').getByRole('button', { name: '2', exact: true }).click();
  expect((await secondPageResponse).status()).toBe(200);
  await expect(page.getByRole('table', { name: 'Danh sách yêu cầu mượn' }).locator('tbody tr')).toHaveCount(2);

  await page.getByLabel('Lọc trạng thái').selectOption('PENDING');
  const pendingResponse = page.waitForResponse(
    (response) => isRequestListResponse(response, { page: 1, limit: 20, status: 'PENDING' })
  );
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
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

  const exportResponse = page.waitForResponse(
    (response) => isRequestListResponse(response, { page: 1, limit: 100, status: 'PENDING' })
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /DOCX/, exact: true }).click(),
  ]);
  expect((await exportResponse).status()).toBe(200);
  expect(download.suggestedFilename()).toBe('requests.docx');
  const docx = readFileSync(await download.path());
  expect(docx.subarray(0, 2).toString()).toBe('PK');
  expect(docx.length).toBeGreaterThan(1000);

  await page.getByLabel('Lọc trạng thái').selectOption('COMPLETED');
  const completedResponse = page.waitForResponse(
    (response) => isRequestListResponse(response, { page: 1, limit: 20, status: 'COMPLETED' })
  );
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
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
