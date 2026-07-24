const { test, expect } = require('@playwright/test');

const FRONTEND_URL = process.env.E2E_FRONTEND_URL
  || `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT || 4173}`;

function makeFine(fineId) {
  return {
    fineId,
    userId: fineId,
    borrowDetailId: 100 + fineId,
    overdueDays: fineId,
    ratePerDay: 5000,
    amount: fineId * 5000,
    paidAmount: fineId % 2 === 0 ? fineId * 5000 : 0,
    reason: 'OVERDUE',
    status: fineId % 2 === 0 ? 'PAID' : 'UNPAID',
    calculatedAt: '2026-07-19T01:00:00.000Z',
    paidAt: fineId % 2 === 0 ? '2026-07-19T02:00:00.000Z' : null,
    member: {
      fullName: `Member ${fineId}`,
      username: `member${fineId}`,
      email: `member${fineId}@example.test`,
    },
    bookTitle: `Book ${fineId}`,
    barcode: `BC${String(fineId).padStart(3, '0')}`,
  };
}

function matchesQuery(fine, query) {
  const context = [
    fine.fineId,
    fine.borrowDetailId,
    fine.member.fullName,
    fine.member.username,
    fine.member.email,
    fine.bookTitle,
    fine.barcode,
  ].join(' ').toLowerCase();
  return context.includes(query.toLowerCase());
}

// @spec FR-FE09-011 AC-FE09-011 NFR-FE09-PERF-001 NFR-FE09-UX-001
test('[E2E-FE09-ACC01] Fine Management uses server search, status filtering, and pagination', async ({
  page,
}) => {
  const allFines = Array.from({ length: 17 }, (_, index) => makeFine(index + 1));

  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'fe09-e2e-access-token');
    localStorage.setItem('authUser', JSON.stringify({
      email: 'librarian@example.test',
      roles: ['LIBRARIAN'],
    }));
  });

  await page.route('**/api/profile/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ fullName: 'E2E Librarian', avatarUrl: null }),
  }));

  await page.route('**/api/fines**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== 'GET' || url.pathname !== '/api/fines') {
      await route.continue();
      return;
    }

    const pageNumber = Number(url.searchParams.get('page'));
    const limit = Number(url.searchParams.get('limit'));
    const query = url.searchParams.get('q') || '';
    const status = url.searchParams.get('status');
    const filtered = allFines.filter((fine) => (
      (!status || fine.status === status) && (!query || matchesQuery(fine, query))
    ));
    const totalPages = Math.ceil(filtered.length / limit);
    const start = (pageNumber - 1) * limit;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        fines: filtered.slice(start, start + limit),
        page: pageNumber,
        limit,
        total: filtered.length,
        totalPages,
      }),
    });
  });

  const initialRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/api/fines'
      && url.searchParams.get('page') === '1'
      && url.searchParams.get('limit') === '8';
  });
  await page.goto(`${FRONTEND_URL}/librarian/fines`);
  await initialRequest;

  await expect(page.locator('tbody tr')).toHaveCount(8);
  await expect(page.getByText('Trang 1/3 • 17 phiếu', { exact: true })).toBeVisible();

  const secondPageRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/api/fines'
      && url.searchParams.get('page') === '2'
      && url.searchParams.get('limit') === '8';
  });
  await page.getByRole('button', { name: 'Sau', exact: true }).click();
  await secondPageRequest;
  await expect(page.locator('tbody tr')).toHaveCount(8);
  await expect(page.getByText('#9', { exact: true })).toBeVisible();

  const statusRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/api/fines'
      && url.searchParams.get('page') === '1'
      && url.searchParams.get('limit') === '8'
      && url.searchParams.get('status') === 'UNPAID';
  });
  await page.getByLabel('Lọc trạng thái').selectOption('UNPAID');
  await statusRequest;

  await page.getByLabel('Tìm phiếu phạt').fill('Member 1');
  const searchRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/api/fines'
      && url.searchParams.get('page') === '1'
      && url.searchParams.get('limit') === '8'
      && url.searchParams.get('status') === 'UNPAID'
      && url.searchParams.get('q') === 'Member 1';
  });
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await searchRequest;

  await expect(page.locator('tbody tr')).toHaveCount(5);
  await expect(page.getByText('Trang 1/1 • 5 phiếu', { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(horizontalOverflow).toBe(false);
});
