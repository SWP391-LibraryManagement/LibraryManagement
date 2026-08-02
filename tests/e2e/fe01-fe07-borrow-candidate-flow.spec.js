const { test, expect } = require('@playwright/test');

const books = [
  {
    bookId: 101,
    title: 'E2E Borrow Ready',
    authorName: 'Flow Author',
    categoryName: 'Programming',
    availabilityStatus: 'AVAILABLE',
    circulationAction: 'BORROW',
  },
  {
    bookId: 102,
    title: 'E2E Reservation Ready',
    authorName: 'Flow Author',
    categoryName: 'Programming',
    availabilityStatus: 'UNAVAILABLE',
    circulationAction: 'RESERVE',
  },
  {
    bookId: 103,
    title: 'E2E Processing Wait',
    authorName: 'Flow Author',
    categoryName: 'Programming',
    availabilityStatus: 'UNAVAILABLE',
    circulationAction: 'WAIT',
  },
  {
    bookId: 104,
    title: 'E2E Unavailable',
    authorName: 'Flow Author',
    categoryName: 'Programming',
    availabilityStatus: 'UNAVAILABLE',
    circulationAction: 'UNAVAILABLE',
  },
];

async function installMemberState(page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'borrow-candidate-e2e-access-token');
    localStorage.setItem('authUser', JSON.stringify({
      userId: 701,
      email: 'borrow.candidate@example.test',
      roles: ['MEMBER'],
    }));
  });

  await page.route('**/api/profile/me', (route) => route.fulfill({
    status: 200,
    json: { userId: 701, fullName: 'Borrow Candidate Member', avatarUrl: null },
  }));
  await page.route('**/api/notifications/mine/unread-count', (route) => route.fulfill({
    status: 200,
    json: { unreadCount: 0 },
  }));
}

async function openHomeSearch(page) {
  await page.goto('/homepage');
  const input = page.getByRole('textbox', { name: 'Tìm kiếm sách theo tên hoặc tác giả' });
  await input.fill('E2E');
  await page.getByRole('button', { name: 'Tìm kiếm sách', exact: true }).click();
  await expect(page.getByText('4 sách được tìm thấy', { exact: false })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await installMemberState(page);
});

// @spec FR-FE01-020 AC-FE01-019 AC-FE01-020 AC-FE01-021 AC-FE01-022
test('[E2E-FE01-ACC01] member actions route only BORROW and RESERVE books', async ({ page }) => {
  await page.route('**/api/books**', (route) => route.fulfill({
    status: 200,
    json: {
      data: books,
      pagination: { page: 1, limit: 20, total: books.length, totalPages: 1 },
    },
  }));

  await openHomeSearch(page);

  const borrow = page.getByRole('button', { name: 'Mượn sách này' });
  const reserve = page.getByRole('button', { name: 'Đặt chỗ sách này' });
  const wait = page.getByRole('button', { name: 'Đang chờ thư viện xử lý' });
  const unavailable = page.getByRole('button', { name: 'Tạm chưa khả dụng' });

  await expect(borrow).toBeEnabled();
  await expect(reserve).toBeEnabled();
  await expect(wait).toBeDisabled();
  await expect(unavailable).toBeDisabled();

  const homeUrl = page.url();
  await wait.evaluate((button) => button.click());
  await unavailable.evaluate((button) => button.click());
  await expect(page).toHaveURL(homeUrl);

  await borrow.click();
  await expect(page).toHaveURL(/\/borrowing\/new\?bookId=101$/);

  await openHomeSearch(page);
  await page.getByRole('button', { name: 'Đặt chỗ sách này' }).click();
  await expect(page).toHaveURL(/\/reservations\/mine\?bookId=102$/);
});

// @spec FR-FE07-045 AC-FE07-037
test('[E2E-FE07-ACC01] server-empty candidates explain eligibility', async ({ page }) => {
  await page.route('**/api/borrow-requests/candidates**', (route) => route.fulfill({
    status: 200,
    json: { books: [] },
  }));

  await page.goto('/borrowing/new');
  await expect(page.getByText('Hiện không có bản sao đủ điều kiện mượn', { exact: true })).toBeVisible();
  await expect(page.getByText('Không tìm thấy sách phù hợp', { exact: true })).toHaveCount(0);
});

// @spec FR-FE07-045 AC-FE07-038
test('[E2E-FE07-ACC02] local search-empty stays distinct from server-empty', async ({ page }) => {
  await page.route('**/api/borrow-requests/candidates**', (route) => route.fulfill({
    status: 200,
    json: {
      books: [{
        bookId: 201,
        title: 'Candidate Book',
        author: 'Candidate Author',
        category: 'Programming',
        copies: [{ copyId: 301, barcode: 'E2E-CANDIDATE-301' }],
      }],
    },
  }));

  await page.goto('/borrowing/new');
  await page.getByRole('textbox', { name: 'Tìm sách' }).fill('không-trùng-kết-quả');
  await expect(page.getByText('Không tìm thấy sách phù hợp', { exact: true })).toBeVisible();
  await expect(page.getByText('Hiện không có bản sao đủ điều kiện mượn', { exact: true })).toHaveCount(0);
});

// @spec FR-FE07-045 AC-FE07-039
test('[E2E-FE07-ACC03] candidate API failure renders only the safe error notice', async ({ page }) => {
  await page.route('**/api/borrow-requests/candidates**', (route) => route.fulfill({
    status: 500,
    json: { error: { code: 'INTERNAL_ERROR', message: 'sensitive database detail' } },
  }));

  await page.goto('/borrowing/new');
  await expect(page.getByText('Không thể tải danh sách sách có thể mượn.', { exact: true })).toBeVisible();
  await expect(page.getByText('Hiện không có bản sao đủ điều kiện mượn', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Không tìm thấy sách phù hợp', { exact: true })).toHaveCount(0);
  await expect(page.getByText('sensitive database detail', { exact: false })).toHaveCount(0);
});
