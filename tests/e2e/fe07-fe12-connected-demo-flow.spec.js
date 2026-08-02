const { mkdirSync } = require('fs');
const { randomUUID } = require('crypto');
const { test, expect } = require('@playwright/test');

const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:4173';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://127.0.0.1:3100';

async function login(page, email, password) {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.getByLabel('Tài khoản của bạn').fill(email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/home');
}

async function clearSession(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function syncConnectedState(request, from, copyId) {
  const response = await request.post(`${BACKEND_URL}/__e2e__/sync-connected-state`, {
    data: { from, copyId },
  });
  expect(response.status()).toBe(200);
  return response.json();
}

async function openNotification(page, title) {
  await page.getByRole('button', { name: 'Mở thông báo' }).click();
  const preview = page.getByRole('region', { name: 'Thông báo mới' });
  await expect(preview).toBeVisible();
  await preview.getByRole('button', { name: new RegExp(title, 'i') }).click();
}

function expectNoHorizontalOverflow(page) {
  return expect(page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )).resolves.toBe(true);
}

async function expectBorrowingJourneyFits(page, width, height) {
  await page.setViewportSize({ width, height });
  const historyRow = page.locator('.member-history-table tbody tr')
    .filter({ hasText: 'Clean Code' })
    .first();
  const journeyCell = historyRow.locator('td[data-label="Hành trình"]');
  const journey = journeyCell.locator('.borrow-journey');
  const borrowDateCell = historyRow.locator('td[data-label="Ngày mượn"]');

  await expect(journey).toBeVisible();
  const [journeyBox, journeyCellBox, borrowDateBox] = await Promise.all([
    journey.boundingBox(),
    journeyCell.boundingBox(),
    borrowDateCell.boundingBox(),
  ]);
  expect(journeyBox).not.toBeNull();
  expect(journeyCellBox).not.toBeNull();
  expect(borrowDateBox).not.toBeNull();
  expect(journeyBox.x).toBeGreaterThanOrEqual(journeyCellBox.x - 1);
  expect(journeyBox.x + journeyBox.width)
    .toBeLessThanOrEqual(journeyCellBox.x + journeyCellBox.width + 1);
  expect(journeyCellBox.x + journeyCellBox.width)
    .toBeLessThanOrEqual(borrowDateBox.x + 1);
  await expectNoHorizontalOverflow(page);
}

// @spec SL-006, FR-FE07-042, FR-FE08-038, BR-FE10-023, FR-FE12-012
test('[E2E-CONNECTED-001] FE07 FE08 FE10 FE12 complete one truthful circulation story', async ({
  page,
  request,
}) => {
  const runId = randomUUID();
  const password = `E2e-${runId}!A1`;
  const memberAEmail = `connected-a-${runId}@example.test`;
  const memberBEmail = `connected-b-${runId}@example.test`;
  const librarianEmail = `connected-lib-${runId}@example.test`;
  const browserErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`));

  mkdirSync('output/playwright/connected-flow', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });

  const setupResponse = await request.post(`${BACKEND_URL}/__e2e__/setup`, {
    data: {
      memberEmail: memberAEmail,
      memberBEmail,
      librarianEmail,
      password,
    },
  });
  expect(setupResponse.status()).toBe(201);
  const actors = await setupResponse.json();
  expect(actors).toMatchObject({
    memberAUserId: expect.any(Number),
    memberBUserId: expect.any(Number),
    librarianUserId: expect.any(Number),
    copyId: 1,
    bookId: 1,
  });

  await login(page, memberAEmail, password);
  await page.goto(`${FRONTEND_URL}/borrowing/new`);
  await page.getByRole('button', { name: /Gửi yêu cầu mượn/i }).click();
  await expect(page.getByText(/Yêu cầu #\d+ đã được tạo/i)).toBeVisible();

  await clearSession(page);
  await login(page, librarianEmail, password);
  await page.goto(`${FRONTEND_URL}/librarian/borrow-requests`);
  await page.getByRole('button', { name: /^Duyệt$/i }).click();
  await page.getByRole('button', { name: /^Duyệt và cấp sách$/i }).click();
  await expect(page.getByText(/Đã duyệt yêu cầu/i)).toBeVisible();
  await syncConnectedState(request, 'borrowing', actors.copyId);

  await clearSession(page);
  await login(page, memberAEmail, password);
  await expect(page.locator('.notification-badge')).toHaveText('1');
  await openNotification(page, 'Yêu cầu mượn đã được duyệt');
  await expect.poll(() => new URL(page.url()).pathname).toBe('/borrowing/history');
  await expect(page.getByRole('list', { name: /Hành trình Clean Code/i })).toBeVisible();
  await page.screenshot({
    path: 'output/playwright/connected-flow/01-fe07-fe10-approved-timeline.png',
    fullPage: true,
  });

  await clearSession(page);
  await login(page, memberBEmail, password);
  await page.goto(`${FRONTEND_URL}/reservations/mine`);
  const candidate = page.locator('.member-reservation-catalog .queue-item')
    .filter({ hasText: 'Clean Code' })
    .first();
  await expect(candidate).toBeVisible();
  const createReservationRequest = page.waitForRequest((candidateRequest) => (
    candidateRequest.method() === 'POST'
    && new URL(candidateRequest.url()).pathname === '/api/reservations'
  ));
  await candidate.getByRole('button', { name: 'Đặt chỗ', exact: true }).click();
  expect((await createReservationRequest).postDataJSON()).toEqual({ copyId: actors.copyId });
  await expect(page.getByText(/Đã đặt "Clean Code"/)).toBeVisible();
  await syncConnectedState(request, 'reservation', actors.copyId);

  await clearSession(page);
  await login(page, librarianEmail, password);
  await page.goto(`${FRONTEND_URL}/librarian/returns`);
  await page.getByRole('button', { name: /Xác nhận trả sách/i }).click();
  await page.getByRole('button', { name: /^Ghi nhận trả sách$/i }).click();
  const handoff = page.locator('.return-queue-handoff');
  await expect(handoff).toContainText(`Bản sao #${actors.copyId} đang có hàng đợi đặt chỗ`);
  await syncConnectedState(request, 'borrowing', actors.copyId);
  await handoff.getByRole('button', { name: 'Xử lý hàng đợi đặt chỗ' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/librarian/reservations');
  await expect(page.getByRole('tab', { name: /Hàng đợi theo sách/i })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const processQueueButton = page.getByRole('button', { name: 'Giữ sách & thông báo' });
  await expect(processQueueButton).toBeEnabled();
  await page.screenshot({
    path: 'output/playwright/connected-flow/02-fe07-return-fe08-handoff.png',
    fullPage: true,
  });
  await processQueueButton.click();
  await page.getByRole('button', { name: 'Xác nhận giữ sách' }).click();
  await expect(page.getByText(/Đã giữ "Clean Code"/)).toBeVisible();
  await syncConnectedState(request, 'reservation', actors.copyId);

  await clearSession(page);
  await login(page, memberBEmail, password);
  await expect(page.locator('.notification-badge')).toHaveText('1');
  await openNotification(page, 'Reservation ready');
  await expect.poll(() => new URL(page.url()).pathname).toBe('/reservations/mine');
  await expect(page.getByText(/Sách "Clean Code" đã sẵn sàng nhận/)).toBeVisible();
  const pickupRow = page.locator('.member-reservation-list tbody tr')
    .filter({ hasText: 'Clean Code' })
    .first();
  await expect(pickupRow).toContainText('Sẵn sàng nhận');
  await pickupRow.getByRole('link', { name: 'Tạo yêu cầu mượn' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/borrowing/new');
  expect(new URL(page.url()).searchParams.get('copyId')).toBe(String(actors.copyId));
  await page.getByRole('button', { name: /Gửi yêu cầu mượn/i }).click();
  await expect(page.getByText(/Yêu cầu #\d+ đã được tạo/i)).toBeVisible();

  await clearSession(page);
  await login(page, librarianEmail, password);
  await page.goto(`${FRONTEND_URL}/librarian/borrow-requests`);
  await page.getByRole('button', { name: /^Duyệt$/i }).click();
  await page.getByRole('button', { name: /^Duyệt và cấp sách$/i }).click();
  await expect(page.getByText(/Đã duyệt yêu cầu/i)).toBeVisible();
  const finalState = await syncConnectedState(request, 'borrowing', actors.copyId);
  expect(finalState.notifications).toHaveLength(4);
  expect(finalState.reservations).toEqual([
    expect.objectContaining({
      userId: actors.memberBUserId,
      copyId: actors.copyId,
      status: 'FULFILLED',
    }),
  ]);

  await page.goto(`${FRONTEND_URL}/librarian/reservations`);
  await expect(page.locator('tbody tr').filter({ hasText: 'Clean Code' })).toContainText(
    'Hoàn thành',
  );

  const accessToken = await page.evaluate(
    () => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'),
  );
  const summaryResponse = await request.get(`${BACKEND_URL}/api/reports/operations-summary`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(summaryResponse.status()).toBe(200);
  const summary = await summaryResponse.json();
  expect(summary).toMatchObject({
    pendingBorrowRequests: 0,
    activeLoans: 1,
    overdueLoans: 0,
    openReservations: 0,
  });

  await page.goto(`${FRONTEND_URL}/home`);
  const expectedCards = [
    ['Yêu cầu chờ duyệt', summary.pendingBorrowRequests],
    ['Sách đang mượn', summary.activeLoans],
    ['Sách mượn quá hạn', summary.overdueLoans],
    ['Đặt chỗ đang mở', summary.openReservations],
    ['Bản sao sẵn có', summary.availableCopies],
    ['Đầu sách sắp hết', summary.lowStockBooks],
  ];
  for (const [label, value] of expectedCards) {
    await expect(page.getByRole('button', {
      name: `${label}: ${value}. Mở màn liên quan`,
    })).toBeVisible();
  }
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: 'output/playwright/connected-flow/03-fe12-final-operations-summary.png',
    fullPage: true,
  });

  await clearSession(page);
  await login(page, memberAEmail, password);
  await page.goto(`${FRONTEND_URL}/borrowing/history`);
  const completedJourney = page.getByRole('list', { name: /Hành trình Clean Code/i }).first();
  await expect(completedJourney.locator('.borrow-journey__step')).toHaveCount(4);

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
  ]) {
    await expectBorrowingJourneyFits(page, viewport.width, viewport.height);
  }

  await page.setViewportSize({ width: 1024, height: 768 });
  await expectNoHorizontalOverflow(page);
  const desktopTableOverflow = await page.locator('.member-history-card .lib-table-wrap').evaluate(
    (element) => ({
      overflowX: getComputedStyle(element).overflowX,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }),
  );
  expect(desktopTableOverflow.overflowX).toBe('auto');
  expect(desktopTableOverflow.scrollWidth).toBeGreaterThan(desktopTableOverflow.clientWidth);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileJourney = page.getByRole('list', { name: /Hành trình Clean Code/i }).first();
  await expect(mobileJourney).toHaveCSS('flex-direction', 'column');
  await expectNoHorizontalOverflow(page);
  const mobileTableOverflow = await page.locator('.member-history-card .lib-table-wrap').evaluate(
    (element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }),
  );
  expect(mobileTableOverflow.scrollWidth).toBeLessThanOrEqual(mobileTableOverflow.clientWidth);
  await page.screenshot({
    path: 'output/playwright/connected-flow/01b-fe07-mobile-timeline.png',
    fullPage: true,
  });

  expect(browserErrors).toEqual([]);
});
