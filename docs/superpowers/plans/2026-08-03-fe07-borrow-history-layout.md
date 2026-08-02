# FE07 Borrowing History Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giữ timeline Hành trình trong đúng ô của bảng Lịch sử mượn, hiển thị tốt trên mobile và làm badge Hư hỏng/Thất lạc nhìn thấy rõ mà không đổi nghiệp vụ FE07.

**Architecture:** Đây là bản sửa ADD Light ở lớp Shell/CSS. Bảng desktop tiếp tục dùng fixed table layout với bảy tỷ lệ cột tổng bằng 100%; bảng mobile tận dụng layout thẻ dọc sẵn có của `operational-table`, còn timeline đổi thành trục dọc. Node source-contract tests khóa các selector CSS và Playwright đo bounding box thật ở nhiều viewport.

**Tech Stack:** React 19, CSS thuần trong `app-shell.css`, Node.js built-in test runner, Playwright Chromium, Vite, ESLint.

## Global Constraints

- Làm việc chỉ trong `D:\SWP391\library-management-system\.worktrees\fe07-borrow-history-layout` trên nhánh `fix/fe07-borrow-history-layout`.
- Baseline triển khai là `origin/main@de72ba92c37eaf2f0fd2c7e1c60ab3e313391bcc`.
- Không thay đổi API, DTO, query, service, repository, SQL, migration hoặc dependency.
- Không sửa `BorrowingHistoryPage.jsx`, `BorrowingJourneyTimeline.jsx`, `borrowingJourney.js` hoặc `libraryFeatureViewModels.js`.
- Không đổi thứ tự DOM, `aria-label`, `aria-current`, label/timestamp hoặc nghiệp vụ FE07/FE08.
- Không sửa chênh lệch giữa public availability và borrow candidates trong nhánh này.
- Desktop dùng `min-width: 1180px`; tỷ lệ bảy cột lần lượt là `24%, 30%, 9%, 9%, 9%, 10%, 9%`.
- Mobile áp dụng tại `max-width: 640px`, dùng bảng dạng thẻ dọc và timeline dọc; document không được tràn ngang.
- `Damaged` và `Lost` dùng `var(--st-red)` trên `var(--st-red-bg)`; label tiếng Việt không đổi.
- Mọi thay đổi triển khai phải theo RED → GREEN và chỉ stage đúng tệp của từng task.
- Nếu CSS-only không đáp ứng được acceptance criteria, dừng và xin amendment; không tự mở rộng sang JSX/component.

## File Map

- `frontend/src/styles/app-shell.css`: nguồn triển khai duy nhất; phân bổ cột, chặn overflow, responsive timeline và tone badge.
- `frontend/test/borrowingFrontend.test.js`: source-contract test khóa giá trị CSS desktop/mobile và badge terminal.
- `tests/e2e/fe07-fe12-connected-demo-flow.spec.js`: regression thật trong connected story; đo bounding box desktop, overflow owner và layout mobile.
- Không tạo source file, helper runtime, dependency, API hoặc schema mới.

## Spec Traceability

| Acceptance criterion | Task / bằng chứng |
| --- | --- |
| AC-LAYOUT-001 | Task 1 khóa bảy cột; Task 2 đo bounding box tại 1440, 1366, 1280 |
| AC-LAYOUT-002 | Task 2 kiểm tra `.borrow-journey` nằm trong ô Hành trình ở connected story |
| AC-LAYOUT-003 | Task 2 kiểm tra `flex-direction: column` và document overflow tại 390x844 |
| AC-LAYOUT-004 | Task 2 kiểm tra wrapper `overflow-x: auto`, desktop scroll nội bộ và mobile không cần scroll |
| AC-LAYOUT-005 | Task 1 khóa `.badge-damaged`/`.badge-lost` vào tone đỏ |
| AC-LAYOUT-006 | Global Constraints, file map và Task 3 diff audit chứng minh không đổi runtime contract |

---

### Task 1: Khóa và sửa bố cục desktop cùng badge terminal

**Files:**
- Modify: `frontend/test/borrowingFrontend.test.js:447-453`
- Modify: `frontend/src/styles/app-shell.css:486-490`
- Modify: `frontend/src/styles/app-shell.css:1162-1173`

**Interfaces:**
- Consumes: class hiện có `.member-history-table`, `.borrow-journey`, `.badge-damaged`, `.badge-lost` do React render.
- Produces: CSS contract bảy cột `[24, 30, 9, 9, 9, 10, 9]`, `min-width: 1180px`, containment cho cột Hành trình và tone đỏ cho hai trạng thái terminal.
- Runtime API/type changes: không có.

- [ ] **Step 1: Viết source-contract test desktop và badge để tạo RED**

Thêm test sau test `member borrowing history keeps toolbar, table and pagination separated` trong `frontend/test/borrowingFrontend.test.js`:

```js
test('FE07 history allocates all seven desktop columns and visible terminal badges', async () => {
  const styles = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');
  const columnSelectors = [
    ':first-child',
    ':nth-child\\(2\\)',
    ':nth-child\\(3\\)',
    ':nth-child\\(4\\)',
    ':nth-child\\(5\\)',
    ':nth-child\\(6\\)',
    ':nth-child\\(7\\)',
  ];
  const columnWidths = columnSelectors.map((selector) => {
    const match = styles.match(new RegExp(
      `\\.member-history-table th${selector}\\s*\\{[^}]*width:\\s*(\\d+)%`,
      's',
    ));
    assert.ok(match, `Missing width for member history column ${selector}`);
    return Number(match[1]);
  });

  assert.match(
    styles,
    /\.member-history-table\s*\{[^}]*min-width:\s*1180px;[^}]*table-layout:\s*fixed;/s,
  );
  assert.deepEqual(columnWidths, [24, 30, 9, 9, 9, 10, 9]);
  assert.equal(columnWidths.reduce((sum, width) => sum + width, 0), 100);
  assert.match(
    styles,
    /\.member-history-table td:nth-child\(2\)\s*\{[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;/s,
  );
  assert.match(
    styles,
    /\.badge-red,[^{]*\.badge-damaged,[^{]*\.badge-lost[^{]*\{[^}]*color:\s*var\(--st-red\);[^}]*background:\s*var\(--st-red-bg\);/s,
  );
});
```

- [ ] **Step 2: Chạy test mới và xác nhận RED đúng nguyên nhân**

Run:

```powershell
node --test --test-name-pattern="allocates all seven desktop columns" frontend/test/borrowingFrontend.test.js
```

Expected: FAIL; thông báo đầu tiên cho thấy width hiện tại không phải `[24, 30, 9, 9, 9, 10, 9]` hoặc thiếu width cho `:nth-child(7)`. Không được sửa assertion để làm test xanh trên baseline.

- [ ] **Step 3: Bổ sung tone badge Damaged/Lost tối thiểu**

Trong `frontend/src/styles/app-shell.css`, thay rule badge đỏ hiện tại bằng đúng rule sau; giữ nguyên các rule badge khác:

```css
.badge-red,    .badge-overdue,  .badge-expired,   .badge-unpaid, .badge-inactive, .badge-rejected, .badge-damaged, .badge-lost { color: var(--st-red);   background: var(--st-red-bg); }
```

- [ ] **Step 4: Phân bổ đủ bảy cột và giữ timeline trong ô Hành trình**

Trong `frontend/src/styles/app-shell.css`, thay block `.member-history-table` hiện tại bằng:

```css
.member-history-table { min-width: 1180px; table-layout: fixed; }
.member-history-table th:first-child { width: 24%; }
.member-history-table th:nth-child(2) { width: 30%; }
.member-history-table th:nth-child(3) { width: 9%; }
.member-history-table th:nth-child(4) { width: 9%; }
.member-history-table th:nth-child(5) { width: 9%; }
.member-history-table th:nth-child(6) { width: 10%; }
.member-history-table th:nth-child(7) { width: 9%; }
.member-history-table td:nth-child(2) { min-width: 0; overflow: hidden; }
.member-history-table td:first-child .row-flex { min-width: 0; }
.member-history-table td:first-child .stack-sm { min-width: 0; overflow-wrap: anywhere; }
```

Không thêm `overflow` vào `.member-history-card`; `.lib-table-wrap` hiện đã là owner với `overflow-x: auto`.

- [ ] **Step 5: Chạy test desktop mới và xác nhận GREEN**

Run:

```powershell
node --test --test-name-pattern="allocates all seven desktop columns" frontend/test/borrowingFrontend.test.js
```

Expected: PASS, không có test fail.

- [ ] **Step 6: Chạy toàn bộ test FE07 tập trung sau thay đổi desktop**

Run:

```powershell
node --test frontend/test/borrowingFrontend.test.js frontend/test/borrowingJourneyFrontend.test.js
```

Expected: `33` tests, `33` pass, `0` fail.

- [ ] **Step 7: Kiểm tra diff và commit Task 1**

Run:

```powershell
git diff --check
git diff -- frontend/src/styles/app-shell.css frontend/test/borrowingFrontend.test.js
git add -- frontend/src/styles/app-shell.css frontend/test/borrowingFrontend.test.js
git diff --cached --check
git commit -m "fix: contain FE07 history timeline"
```

Expected: chỉ hai tệp Task 1 được stage; commit thành công và không có whitespace error.

---

### Task 2: Khóa responsive browser behavior và triển khai timeline dọc mobile

**Files:**
- Modify: `frontend/test/borrowingFrontend.test.js:447-490` (sau Task 1)
- Modify: `tests/e2e/fe07-fe12-connected-demo-flow.spec.js:38-42`
- Modify: `tests/e2e/fe07-fe12-connected-demo-flow.spec.js:95-105`
- Modify: `frontend/src/styles/app-shell.css:1186-1300`

**Interfaces:**
- Consumes: desktop CSS và badge contract từ Task 1; markup hiện có `td[data-label="Hành trình"]`, `td[data-label="Ngày mượn"]`, `.borrow-journey`, `.lib-table-wrap`.
- Produces: `expectBorrowingJourneyFits(page, width, height)` chỉ dùng trong Playwright; mobile CSS không thêm runtime JavaScript.
- Runtime API/type changes: không có.

- [ ] **Step 1: Viết source-contract test mobile để tạo RED**

Thêm test ngay sau test desktop của Task 1:

```js
test('FE07 history timeline becomes vertical inside the stacked mobile table', async () => {
  const styles = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');
  const mobileStart = styles.indexOf('@media (max-width: 640px)');

  assert.notEqual(mobileStart, -1, 'Missing max-width: 640px breakpoint');
  const mobileStyles = styles.slice(mobileStart);
  assert.match(mobileStyles, /\.member-history-table\s*\{[^}]*min-width:\s*0;/s);
  assert.match(
    mobileStyles,
    /\.borrow-journey\s*\{[^}]*flex-direction:\s*column;[^}]*min-width:\s*0;[^}]*width:\s*100%;/s,
  );
  assert.match(
    mobileStyles,
    /\.borrow-journey__step\s*\{[^}]*flex:\s*none;[^}]*width:\s*100%;[^}]*padding:\s*0 0 18px 26px;/s,
  );
  assert.match(
    mobileStyles,
    /\.borrow-journey__step:not\(:last-child\)::after\s*\{[^}]*bottom:\s*0;[^}]*left:\s*7px;[^}]*width:\s*2px;[^}]*height:\s*auto;/s,
  );
  assert.match(
    mobileStyles,
    /\.borrow-journey__marker\s*\{[^}]*top:\s*0;[^}]*left:\s*0;[^}]*transform:\s*none;/s,
  );
});
```

- [ ] **Step 2: Chạy source-contract mobile và xác nhận RED**

Run:

```powershell
node --test --test-name-pattern="vertical inside the stacked mobile table" frontend/test/borrowingFrontend.test.js
```

Expected: FAIL tại assertion `.member-history-table { min-width: 0; }` hoặc `.borrow-journey { flex-direction: column; ... }` vì baseline chưa có responsive override.

- [ ] **Step 3: Thêm helper Playwright đo timeline trong ô**

Trong `tests/e2e/fe07-fe12-connected-demo-flow.spec.js`, thêm sau `expectNoHorizontalOverflow`:

```js
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
```

- [ ] **Step 4: Mở rộng connected story bằng lịch sử bốn bước ở ba desktop viewport và mobile**

Sau khi Librarian đã kiểm tra dashboard cuối cùng và ngay trước `expect(browserErrors).toEqual([])`, chèn block sau. Tại thời điểm này dữ liệu Member A đã đi qua đủ bốn bước Gửi yêu cầu → Duyệt → Đang mượn → Đã trả:

```js
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
```

Không chuyển helper vào production code và không thay setup dữ liệu connected story.

- [ ] **Step 5: Chạy connected story và xác nhận RED ở mobile**

Run:

```powershell
npx playwright test tests/e2e/fe07-fe12-connected-demo-flow.spec.js --project=chromium --reporter=list
```

Expected: connected story dựng được timeline đủ `4` bước; test FAIL tại `toHaveCSS('flex-direction', 'column')` hoặc mobile table overflow. Các desktop bounding-box assertions phải qua sau Task 1. Lưu exact failure trước khi sửa CSS.

- [ ] **Step 6: Triển khai mobile override tối thiểu trong breakpoint hiện có**

Trong block `@media (max-width: 640px)` của `frontend/src/styles/app-shell.css`, thêm trước `.app-content`:

```css
  .member-history-table { min-width: 0; }
  .borrow-journey {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    min-width: 0;
    width: 100%;
  }
  .borrow-journey__step {
    flex: none;
    width: 100%;
    padding: 0 0 18px 26px;
  }
  .borrow-journey__step:last-child { padding-bottom: 0; }
  .borrow-journey__step:not(:last-child)::after {
    top: 14px;
    right: auto;
    bottom: 0;
    left: 7px;
    width: 2px;
    height: auto;
  }
  .borrow-journey__marker { top: 0; left: 0; transform: none; }
```

Không đổi generic `.operational-table` responsive rules; chỉ override lịch sử mượn và timeline FE07.

- [ ] **Step 7: Chạy source-contract mobile và connected story để xác nhận GREEN**

Run:

```powershell
node --test --test-name-pattern="vertical inside the stacked mobile table" frontend/test/borrowingFrontend.test.js
npx playwright test tests/e2e/fe07-fe12-connected-demo-flow.spec.js --project=chromium --reporter=list
```

Expected: source test PASS; Playwright `1 passed`; không có console/page errors.

- [ ] **Step 8: Chạy toàn bộ test FE07 tập trung**

Run:

```powershell
node --test frontend/test/borrowingFrontend.test.js frontend/test/borrowingJourneyFrontend.test.js
```

Expected: `34` tests, `34` pass, `0` fail.

- [ ] **Step 9: Kiểm tra diff và commit Task 2**

Run:

```powershell
git diff --check
git diff -- frontend/src/styles/app-shell.css frontend/test/borrowingFrontend.test.js tests/e2e/fe07-fe12-connected-demo-flow.spec.js
git add -- frontend/src/styles/app-shell.css frontend/test/borrowingFrontend.test.js tests/e2e/fe07-fe12-connected-demo-flow.spec.js
git diff --cached --check
git commit -m "test: cover FE07 responsive history layout"
```

Expected: chỉ ba tệp triển khai/test được stage; commit thành công.

---

### Task 3: Xác minh đầy đủ và chuẩn bị cổng review H3

**Files:**
- Verify only: toàn bộ diff `origin/main...HEAD`
- Generated evidence only: `output/playwright/connected-flow/01-fe07-fe10-approved-timeline.png` và `01b-fe07-mobile-timeline.png` (không stage)

**Interfaces:**
- Consumes: hai commit implementation từ Task 1 và Task 2.
- Produces: bằng chứng test/lint/build/traceability và danh sách diff sạch để người dùng review H3.
- Runtime API/type changes: không có.

- [ ] **Step 1: Chạy test tập trung và Playwright lần cuối từ trạng thái commit**

Run:

```powershell
node --test frontend/test/borrowingFrontend.test.js frontend/test/borrowingJourneyFrontend.test.js
npx playwright test tests/e2e/fe07-fe12-connected-demo-flow.spec.js --project=chromium --reporter=list
```

Expected: Node `34/34` PASS; Playwright `1/1` PASS.

- [ ] **Step 2: Chạy lint, build và traceability gate**

Run:

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
npm run trace:enforce
```

Expected: cả ba command exit code `0`; Vite build thành công; traceability đạt ngưỡng enforce `70`.

- [ ] **Step 3: Chạy secret scan và diff integrity checks**

Run:

```powershell
npm run test:secrets
git diff origin/main...HEAD --check
git status --short --branch
git diff --name-status origin/main...HEAD
```

Expected:

- secret scan `5/5` test PASS và không phát hiện secret;
- không có whitespace error;
- worktree không có source change chưa commit; chỉ output Playwright bị ignore;
- implementation diff không có backend, API, SQL, dependency hoặc JSX/component.

- [ ] **Step 4: Review acceptance evidence trước H3**

Run:

```powershell
git log --oneline --decorate origin/main..HEAD
Get-Item -LiteralPath 'output/playwright/connected-flow/01-fe07-fe10-approved-timeline.png','output/playwright/connected-flow/01b-fe07-mobile-timeline.png' | Select-Object FullName,Length,LastWriteTime
```

Expected: log chứa design/plan cùng hai commit triển khai; cả hai ảnh bằng chứng tồn tại và có kích thước lớn hơn `0` byte.

- [ ] **Step 5: Dừng tại cổng H3 và báo cáo cho người dùng**

Báo cáo phải nêu:

- nhánh `fix/fe07-borrow-history-layout` và commit HEAD chính xác;
- danh sách tệp thay đổi;
- kết quả RED đã quan sát trước GREEN;
- Node/Playwright/lint/build/traceability/secret scan;
- xác nhận không sửa availability/candidates, backend hoặc dữ liệu;
- đường dẫn hai screenshot desktop/mobile;
- yêu cầu người dùng duyệt H3 trước push/merge/deploy.

Không push, merge hoặc triển khai staging trước cổng H3.
