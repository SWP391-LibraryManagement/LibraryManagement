const { randomUUID } = require('crypto');
const { test, expect } = require('@playwright/test');

const FRONTEND_URL = process.env.E2E_FRONTEND_URL
  || `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT || 4173}`;
const BACKEND_URL = process.env.E2E_BACKEND_URL
  || `http://127.0.0.1:${process.env.E2E_BACKEND_PORT || 3100}`;

async function login(page, email, password) {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.getByLabel('Tài khoản của bạn').fill(email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/home');
}

function isCandidateResponse(response, expected = {}) {
  if (response.request().method() !== 'GET') return false;
  const url = new URL(response.url());
  if (url.pathname !== '/api/reservations/candidates') return false;
  return Object.entries(expected).every(
    ([key, value]) => url.searchParams.get(key) === String(value)
  );
}

// @spec FR-FE08-029, AC-FE08-015, AC-FE08-016, NFR-FE08-SEC-004, NFR-FE08-PERF-003
test('[E2E-FE08-ACC01] member searches safe SQL-shaped candidates and creates a real reservation', async ({
  page,
  request,
}) => {
  const runId = randomUUID();
  const password = `E2e-${runId}!A1`;
  const memberEmail = `fe08-member-${runId}@example.test`;
  const librarianEmail = `fe08-librarian-${runId}@example.test`;

  const setupResponse = await request.post(`${BACKEND_URL}/__e2e__/setup`, {
    data: { memberEmail, librarianEmail, password },
  });
  expect(setupResponse.status()).toBe(201);

  await login(page, memberEmail, password);
  const initialCandidates = page.waitForResponse(
    (response) => isCandidateResponse(response, { page: 1, limit: 20 })
  );
  await page.goto(`${FRONTEND_URL}/reservations/mine`);
  const initialResponse = await initialCandidates;
  expect(initialResponse.status()).toBe(200);
  const initialPayload = await initialResponse.json();
  expect(initialPayload.pagination).toMatchObject({ page: 1, limit: 20 });
  expect(initialPayload.data.length).toBeGreaterThan(0);
  for (const candidate of initialPayload.data) {
    expect(Object.keys(candidate).sort()).toEqual([
      'activeReservationCount',
      'authorName',
      'bookId',
      'copyId',
      'copyStatus',
      'title',
    ]);
    expect(candidate.copyStatus).toMatch(/^(BORROWED|RESERVED)$/);
  }

  await expect(page.getByText('Clean Code', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Đang được mượn|Đang được giữ/).first()).toBeVisible();
  await expect(page.getByText(/BC1|A1/, { exact: true })).toHaveCount(0);

  const searchResponse = page.waitForResponse(
    (response) => isCandidateResponse(response, { q: 'Database', page: 1, limit: 20 })
  );
  await page.getByLabel('Tìm sách').fill('Database');
  expect((await searchResponse).status()).toBe(200);
  await expect(page.getByText('Database System', { exact: true }).first()).toBeVisible();

  const createRequest = page.waitForRequest(
    (candidateRequest) => (
      candidateRequest.method() === 'POST'
      && new URL(candidateRequest.url()).pathname === '/api/reservations'
    )
  );
  const createResponse = page.waitForResponse(
    (response) => (
      response.request().method() === 'POST'
      && new URL(response.url()).pathname === '/api/reservations'
    )
  );
  await page.getByRole('button', { name: 'Đặt chỗ', exact: true }).first().click();
  const reservationRequest = await createRequest;
  expect(reservationRequest.postDataJSON()).toEqual({ copyId: expect.any(Number) });
  expect((await createResponse).status()).toBe(201);
  await expect(page.getByText(/Đã đặt "Database System"/)).toBeVisible();
  await expect(page.locator('.member-reservation-list').getByText('Database System', { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByLabel('Tìm sách')).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(horizontalOverflow).toBe(false);
});
