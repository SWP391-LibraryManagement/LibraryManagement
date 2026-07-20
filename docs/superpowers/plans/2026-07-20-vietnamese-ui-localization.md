# Vietnamese UI Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all frontend-generated interface copy to Vietnamese and apply a Vietnamese-safe `Be Vietnam Pro` + `Noto Serif` typography system without changing business logic or API contracts.

**Architecture:** Add a small Vietnamese copy catalog and presentation-only label helpers, then migrate each UI surface to use translated labels while retaining raw role/status codes for filtering and workflow decisions. Normalize API fallbacks at the frontend boundary so unknown server failures remain safe and Vietnamese. Typography is controlled through shared CSS variables and Google Fonts with Unicode-capable fallbacks.

**Tech Stack:** React 19, Vite 8, Bootstrap 5, MUI, Node test runner, CSS custom properties, existing Axios API modules.

## Current Implementation Closeout - 2026-07-20

PR #58 is merged as `cce59d0`. Application-baseline CI `29712597463` and staging
workflow `29712612188` pass the frontend localization tests, lint, build,
browser E2E, and six-check staging smoke. The authoritative L1-L4 evidence is
`.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`.

The later H2-approved governance reconciliation repairs five residual
presentation-only label surfaces and strengthens the raw-value regression;
fresh local frontend evidence is 172/172. These follow-up edits remain subject
to H3 before merge.

The granular RED-GREEN task boxes below are retained as the historical execution
plan. The final checklist is the current acceptance snapshot; a dedicated
human responsive browser review remains explicitly pending.

## Global Constraints

- The product language is fixed Vietnamese; do not add a language switcher or an i18n framework.
- Keep `Email`, `OTP`, and `Barcode` unchanged in user-facing copy.
- Keep source identifiers, API paths, payload fields, enum values, and test names in English.
- Do not translate book titles, author names, email addresses, barcode values, or user-entered content.
- Preserve raw values such as `AVAILABLE`, `BORROWED`, `PENDING`, and the existing internal FE07/FE08 view-state tokens for business logic.
- Do not change database schema, API contracts, permissions, authentication semantics, or library business rules.
- Use `Be Vietnam Pro` for controls/body text and `Noto Serif` for headings, with Unicode-capable fallbacks.
- Unknown or unsafe backend messages must resolve to contextual Vietnamese fallbacks rather than raw technical English.
- Follow RED-GREEN-REFACTOR for every production change and keep commits scoped to one task.

---

## File Structure

- Create `frontend/src/i18n/vi.js`: shared Vietnamese copy constants only.
- Create `frontend/src/utils/uiLabels.js`: pure role, status, and boolean display-label helpers.
- Create `frontend/test/vietnameseUi.test.js`: focused unit/source tests added incrementally by Tasks 1-6.
- Modify `frontend/src/api/apiErrorMessages.js`: safe Vietnamese API fallback behavior.
- Modify `frontend/src/api/authApi.js`, `frontend/src/api/profileApi.js`, `frontend/src/api/userManagementApi.js`, and `frontend/src/api/adminApi.js`: module-specific Vietnamese fallback copy.
- Modify `frontend/index.html`, `frontend/src/index.css`, and existing visual styles: global language metadata and font tokens.
- Modify existing pages/components in place: user-facing text only; do not restructure feature ownership.
- Modify affected `.sdd/specs/feat-*/CHANGELOG.md` files: record the cross-feature presentation change.

---

### Task 1: Add Vietnamese Copy and Display-Label Primitives

**Files:**
- Create: `frontend/src/i18n/vi.js`
- Create: `frontend/src/utils/uiLabels.js`
- Create: `frontend/test/vietnameseUi.test.js`
- Test: `frontend/test/reservationFrontend.test.js`

**Interfaces:**
- Consumes: raw role/status strings already returned by APIs and existing view models.
- Produces: `VI_COPY`, `getRoleLabel(value)`, `getStatusLabel(value)`, and `getBooleanLabel(value)` for later tasks.
- Preserves: `statusToUi()` and `isActiveReservationQueueStatus()` internal return values and comparisons.

- [ ] **Step 1: Write the failing label-helper tests**

Create `frontend/test/vietnameseUi.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { VI_COPY } from '../src/i18n/vi.js';
import { getBooleanLabel, getRoleLabel, getStatusLabel } from '../src/utils/uiLabels.js';

test('shared Vietnamese copy keeps the approved common technical terms', () => {
  assert.equal(VI_COPY.fields.email, 'Email');
  assert.equal(VI_COPY.fields.otp, 'OTP');
  assert.equal(VI_COPY.fields.barcode, 'Barcode');
  assert.equal(VI_COPY.common.close, 'Đóng');
});

test('role labels are Vietnamese presentation values', () => {
  assert.equal(getRoleLabel('ADMIN'), 'Quản trị viên');
  assert.equal(getRoleLabel('LIBRARIAN'), 'Thủ thư');
  assert.equal(getRoleLabel('MEMBER'), 'Thành viên');
  assert.equal(getRoleLabel('GUEST'), 'Khách');
  assert.equal(getRoleLabel('UNKNOWN_ROLE'), 'Vai trò chưa xác định');
});

test('status labels accept raw enums and existing semantic view tokens', () => {
  assert.equal(getStatusLabel('AVAILABLE'), 'Có sẵn');
  assert.equal(getStatusLabel('Borrowed'), 'Đang mượn');
  assert.equal(getStatusLabel('Ready to pick up'), 'Sẵn sàng nhận');
  assert.equal(getStatusLabel('CANCELLED'), 'Đã hủy');
  assert.equal(getStatusLabel('UNKNOWN_STATUS'), 'Trạng thái chưa xác định');
  assert.equal(getStatusLabel(), 'Trạng thái chưa xác định');
});

test('boolean values have Vietnamese display labels', () => {
  assert.equal(getBooleanLabel(true), 'Có');
  assert.equal(getBooleanLabel(false), 'Không');
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run from the repository root:

```powershell
node --test frontend/test/vietnameseUi.test.js
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `frontend/src/i18n/vi.js` or `frontend/src/utils/uiLabels.js`.

- [ ] **Step 3: Implement the copy catalog**

Create `frontend/src/i18n/vi.js`:

```js
export const VI_COPY = Object.freeze({
  common: Object.freeze({
    home: 'Trang chủ',
    library: 'Thư viện',
    dashboard: 'Tổng quan',
    close: 'Đóng',
    cancel: 'Hủy',
    save: 'Lưu',
    edit: 'Chỉnh sửa',
    create: 'Tạo mới',
    update: 'Cập nhật',
    search: 'Tìm kiếm',
    refresh: 'Làm mới',
    previousPage: 'Trang trước',
    nextPage: 'Trang sau',
    yes: 'Có',
    no: 'Không',
    unknownRole: 'Vai trò chưa xác định',
    unknownStatus: 'Trạng thái chưa xác định',
  }),
  fields: Object.freeze({
    email: 'Email',
    otp: 'OTP',
    barcode: 'Barcode',
  }),
  roles: Object.freeze({
    ADMIN: 'Quản trị viên',
    LIBRARIAN: 'Thủ thư',
    MEMBER: 'Thành viên',
    GUEST: 'Khách',
  }),
  statuses: Object.freeze({
    ALL: 'Tất cả',
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Ngừng hoạt động',
    LOCKED: 'Đã khóa',
    AVAILABLE: 'Có sẵn',
    UNAVAILABLE: 'Không có sẵn',
    RESERVED: 'Đã đặt chỗ',
    WAITING: 'Đang chờ',
    READY_TO_PICK_UP: 'Sẵn sàng nhận',
    NOTIFIED: 'Sẵn sàng nhận',
    PENDING: 'Chờ xử lý',
    REQUESTED: 'Đã gửi yêu cầu',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Đã từ chối',
    BORROWED: 'Đang mượn',
    OVERDUE: 'Quá hạn',
    RETURNED: 'Đã trả',
    COMPLETED: 'Hoàn thành',
    FULFILLED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    EXPIRED: 'Hết hạn',
    DAMAGED: 'Hư hỏng',
    LOST: 'Thất lạc',
    PAID: 'Đã thanh toán',
    UNPAID: 'Chưa thanh toán',
    WAIVED: 'Đã miễn',
  }),
});
```

- [ ] **Step 4: Implement pure display-label helpers**

Create `frontend/src/utils/uiLabels.js`:

```js
import { VI_COPY } from '../i18n/vi.js';

function normalizeDisplayKey(value) {
  return String(value || '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}

export function getRoleLabel(value) {
  return VI_COPY.roles[normalizeDisplayKey(value)] || VI_COPY.common.unknownRole;
}

export function getStatusLabel(value) {
  return VI_COPY.statuses[normalizeDisplayKey(value)] || VI_COPY.common.unknownStatus;
}

export function getBooleanLabel(value) {
  return value ? VI_COPY.common.yes : VI_COPY.common.no;
}
```

- [ ] **Step 5: Run label and FE08 regression tests and verify GREEN**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/reservationFrontend.test.js
```

Expected: all tests PASS; existing FE08 tests still prove that internal `Waiting`/`Ready to pick up` tokens have not changed.

- [ ] **Step 6: Commit Task 1**

```powershell
git add frontend/src/i18n/vi.js frontend/src/utils/uiLabels.js frontend/test/vietnameseUi.test.js
git commit -m "feat: add Vietnamese UI label helpers"
```

---

### Task 2: Apply Vietnamese Document Metadata and Typography Tokens

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/styles/app-shell.css`
- Modify: `frontend/src/styles/UserProfile.css`
- Modify: `frontend/src/page/HomePage.jsx`
- Modify: `frontend/src/page/BookManagement.jsx`
- Modify: `frontend/src/page/UserManagement.jsx`
- Modify: `frontend/src/component/layout/LogoutConfirmModal.jsx`
- Test: `frontend/test/vietnameseUi.test.js`

**Interfaces:**
- Consumes: CSS variables `--sans` and `--heading` from `frontend/src/index.css`.
- Produces: shared `Be Vietnam Pro` and `Noto Serif` typography used by all later page edits.

- [ ] **Step 1: Add failing metadata/font source tests**

Append to `frontend/test/vietnameseUi.test.js`:

```js
import { readFile } from 'node:fs/promises';

test('document metadata declares Vietnamese and loads the approved font pair', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /<title>Quản lý thư viện<\/title>/);
  assert.match(html, /family=Be\+Vietnam\+Pro/);
  assert.match(html, /family=Noto\+Serif/);
});

test('shared styles expose Vietnamese-safe body and heading tokens', async () => {
  const indexCss = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  const shellCss = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');
  assert.match(indexCss, /--sans:\s*'Be Vietnam Pro'/);
  assert.match(indexCss, /--heading:\s*'Noto Serif'/);
  assert.match(indexCss, /button,\s*input,\s*select,\s*textarea[\s\S]*font:\s*inherit/);
  assert.match(shellCss, /--lib-heading:\s*var\(--heading\)/);
  assert.match(shellCss, /font-family:\s*var\(--sans\)/);
});

test('major surfaces no longer hardcode superseded UI fonts', async () => {
  const files = [
    '../src/page/HomePage.jsx',
    '../src/page/BookManagement.jsx',
    '../src/page/UserManagement.jsx',
    '../src/styles/UserProfile.css',
    '../src/component/layout/LogoutConfirmModal.jsx',
  ];
  const source = (await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), 'utf8')))).join('\n');
  assert.doesNotMatch(source, /Playfair Display|Lato, sans-serif|Inter, system-ui|DM Serif Display|Times New Roman/);
});
```

- [ ] **Step 2: Run the font tests and verify RED**

```powershell
node --test frontend/test/vietnameseUi.test.js
```

Expected: FAIL on `lang="en"`, the old title, old CSS tokens, and hardcoded font families.

- [ ] **Step 3: Update document metadata and font loading**

Replace the relevant `frontend/index.html` head content with:

```html
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&amp;family=Noto+Serif:wght@500;600;700&amp;display=swap"
      rel="stylesheet"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quản lý thư viện</title>
  </head>
```

- [ ] **Step 4: Replace global font tokens and ensure controls inherit them**

In `frontend/src/index.css`, use:

```css
:root {
  --sans: 'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif;
  --heading: 'Noto Serif', Georgia, serif;
  --mono: ui-monospace, Consolas, monospace;
}

button,
input,
select,
textarea {
  font: inherit;
}
```

In `frontend/src/styles/app-shell.css`, use:

```css
:root {
  --lib-heading: var(--heading);
}

.app-shell {
  font-family: var(--sans);
}
```

- [ ] **Step 5: Normalize page-level font declarations**

Apply these exact replacements without changing sizes, weights, or layout:

```text
'Playfair Display, serif' -> 'var(--heading)'
'Lato, sans-serif' -> 'var(--sans)'
'Inter', 'Segoe UI', system-ui, sans-serif -> var(--sans)
'DM Serif Display', Georgia, serif -> var(--heading)
Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif -> var(--sans)
Georgia, 'Times New Roman', serif -> var(--heading)
'Times New Roman', 'Noto Serif', serif -> var(--heading)
```

For JSX inline styles, the result must use CSS variables as strings:

```jsx
style={{ fontFamily: 'var(--heading)' }}
style={{ fontFamily: 'var(--sans)' }}
```

- [ ] **Step 6: Run the focused test and frontend build**

```powershell
node --test frontend/test/vietnameseUi.test.js
npm --prefix frontend run build
```

Expected: both commands exit `0`; Vite completes the production build.

- [ ] **Step 7: Commit Task 2**

```powershell
git add frontend/index.html frontend/src/index.css frontend/src/styles/app-shell.css frontend/src/styles/UserProfile.css frontend/src/page/HomePage.jsx frontend/src/page/BookManagement.jsx frontend/src/page/UserManagement.jsx frontend/src/component/layout/LogoutConfirmModal.jsx frontend/test/vietnameseUi.test.js
git commit -m "feat: apply Vietnamese-safe typography"
```

---

### Task 3: Localize the Shared Shell, Authentication, and Profile Surfaces

**Files:**
- Modify: `frontend/src/utils/appNavigation.js`
- Modify: `frontend/src/component/layout/AppLayout.jsx`
- Modify: `frontend/src/component/layout/Header.jsx`
- Modify: `frontend/src/component/shared/Feedback.jsx`
- Modify: `frontend/src/component/forgotpassword/BackgroundPanel.jsx`
- Modify: `frontend/src/page/HomePage.jsx`
- Test: `frontend/test/vietnameseUi.test.js`
- Test: `frontend/test/appShellFrontend.test.js`
- Test: `frontend/test/authUxFrontend.test.js`

**Interfaces:**
- Consumes: `VI_COPY`, `getRoleLabel()` from Task 1.
- Produces: a Vietnamese shell and shared dialog/accessibility copy reused by all protected pages.

- [ ] **Step 1: Add failing shared-surface tests**

Append to `frontend/test/vietnameseUi.test.js`:

```js
test('shared shell and recovery surfaces use Vietnamese copy', async () => {
  const navigation = await readFile(new URL('../src/utils/appNavigation.js', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');
  const feedback = await readFile(new URL('../src/component/shared/Feedback.jsx', import.meta.url), 'utf8');
  const recovery = await readFile(new URL('../src/component/forgotpassword/BackgroundPanel.jsx', import.meta.url), 'utf8');

  assert.match(navigation, /label: 'Thư viện'/);
  assert.doesNotMatch(navigation, /label: 'Home'/);
  assert.match(layout, /aria-label="Thư viện"/);
  assert.doesNotMatch(layout, />Home</);
  assert.match(feedback, /aria-label="Đóng"/);
  assert.match(recovery, /Chào mừng trở lại/);
  assert.match(recovery, /Đặt lại mật khẩu để tiếp tục sử dụng tài nguyên thư viện/);
});
```

Update the existing app-shell test that describes/renders `Home` so it expects the visible label `Thư viện` while keeping the route key `library-home` and path `/homepage` unchanged.

- [ ] **Step 2: Run shared UI tests and verify RED**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/appShellFrontend.test.js frontend/test/authUxFrontend.test.js
```

Expected: FAIL on `Home`, `Close`, and `Welcome Back` assertions.

- [ ] **Step 3: Localize shell navigation without changing routes**

In `frontend/src/utils/appNavigation.js`:

```js
const HOME_ITEM = { key: 'home', label: 'Tổng quan', path: '/home' };
const LIBRARY_HOME_ITEM = { key: 'library-home', label: 'Thư viện', path: '/homepage' };
```

In `frontend/src/component/layout/AppLayout.jsx`, keep route keys and navigation behavior, but render:

```jsx
aria-label="Thư viện"
<span>Thư viện</span>
```

- [ ] **Step 4: Reuse shared role labels**

Replace duplicate role-label functions in `Header.jsx` and `HomePage.jsx` with:

```js
import { getRoleLabel } from '../../utils/uiLabels'; // Header.jsx
import { getRoleLabel } from '../utils/uiLabels'; // HomePage.jsx
```

Use `getRoleLabel(storedRoles[0])` only after preserving the existing priority order. The exact priority remains `ADMIN`, then `LIBRARIAN`, then `MEMBER`; implement a small call site such as:

```js
const primaryRole = ['ADMIN', 'LIBRARIAN', 'MEMBER'].find((role) => storedRoles.includes(role));
const roleLabel = getRoleLabel(primaryRole);
```

- [ ] **Step 5: Localize shared close and recovery copy**

Use these exact visible strings:

```jsx
aria-label="Đóng"
<h2>Chào mừng trở lại</h2>
<p>Đặt lại mật khẩu để tiếp tục sử dụng tài nguyên thư viện</p>
```

- [ ] **Step 6: Run shared UI tests and verify GREEN**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/appShellFrontend.test.js frontend/test/authUxFrontend.test.js
```

Expected: all tests PASS.

- [ ] **Step 7: Commit Task 3**

```powershell
git add frontend/src/utils/appNavigation.js frontend/src/component/layout/AppLayout.jsx frontend/src/component/layout/Header.jsx frontend/src/component/shared/Feedback.jsx frontend/src/component/forgotpassword/BackgroundPanel.jsx frontend/src/page/HomePage.jsx frontend/test/vietnameseUi.test.js frontend/test/appShellFrontend.test.js
git commit -m "feat: localize shared frontend shell"
```

---

### Task 4: Localize Public Browse and Member Workflows

**Files:**
- Modify: `frontend/src/page/HomePage.jsx`
- Modify: `frontend/src/utils/libraryFeatureViewModels.js`
- Modify: `frontend/src/page/borrowing/BorrowingHistoryPage.jsx`
- Modify: `frontend/src/page/borrowing/MemberBorrowingDetailsPage.jsx`
- Modify: `frontend/src/page/reservation/MyReservationsPage.jsx`
- Test: `frontend/test/vietnameseUi.test.js`
- Test: `frontend/test/borrowingFrontend.test.js`
- Test: `frontend/test/reservationFrontend.test.js`
- Test: `frontend/test/publicBrowseFrontend.test.js`

**Interfaces:**
- Consumes: `getStatusLabel()` and `getRoleLabel()` from Task 1.
- Produces: Vietnamese public/member captions, status badges, pagination labels, and fallback entity labels.
- Preserves: English internal semantic tokens used by `canRenew`, reservation cancellation rules, queue filtering, and CSS status classes.

- [ ] **Step 1: Add failing public/member source tests**

Append to `frontend/test/vietnameseUi.test.js`:

```js
test('public and member pages translate generated copy while preserving source data', async () => {
  const home = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  const history = await readFile(new URL('../src/page/borrowing/BorrowingHistoryPage.jsx', import.meta.url), 'utf8');
  const mine = await readFile(new URL('../src/page/reservation/MyReservationsPage.jsx', import.meta.url), 'utf8');
  const viewModels = await readFile(new URL('../src/utils/libraryFeatureViewModels.js', import.meta.url), 'utf8');

  assert.doesNotMatch(home, /Programming: 'Code'|Novel: 'Novel'|\|\| 'Book'/);
  assert.match(home, /Programming: 'Mã'|Programming: 'Lập trình'/);
  assert.match(history, /caption="Lịch sử mượn sách"/);
  assert.match(history, /aria-label="Trang trước"/);
  assert.match(history, /aria-label="Trang sau"/);
  assert.match(history, /getStatusLabel\(row\.status\)/);
  assert.match(mine, /caption="Danh sách đặt chỗ của tôi"/);
  assert.match(mine, /getStatusLabel\(item\.status\)/);
  assert.doesNotMatch(viewModels, /`Copy #|`Member #/);
  assert.match(viewModels, /`Bản sao #/);
  assert.match(viewModels, /`Thành viên #/);
});
```

- [ ] **Step 2: Run public/member tests and verify RED**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/borrowingFrontend.test.js frontend/test/reservationFrontend.test.js frontend/test/publicBrowseFrontend.test.js
```

Expected: FAIL on English category chips, captions, pagination labels, status rendering, and `Copy`/`Member` fallbacks.

- [ ] **Step 3: Localize generated public labels**

In `HomePage.jsx`, keep category values and database content unchanged, but use Vietnamese presentation chips:

```js
const CATEGORY_ICONS = {
  Programming: 'Mã',
  Database: 'CSDL',
  AI: 'AI',
  Novel: 'Tiểu thuyết',
};

const getCategoryIcon = (category) => CATEGORY_ICONS[category] || 'Sách';
```

- [ ] **Step 4: Localize generated entity fallbacks**

In `libraryFeatureViewModels.js`, replace only generated fallback copy:

```js
item.copy?.title || `Bản sao #${item.copyId}`
request.member?.email || `Thành viên #${request.userId}`
reservation.copy?.title || `Bản sao #${reservation.copyId}`
reservation.member?.email || `Thành viên #${reservation.userId}`
```

Do not translate `DEMO_BORROW_CATALOG` titles/authors because those are catalog data.

- [ ] **Step 5: Render Vietnamese labels without changing internal status comparisons**

Import `getStatusLabel` in the three member workflow pages and render translated badge children:

```jsx
<Badge status={row.status}>{getStatusLabel(row.status)}</Badge>
<Badge status={item.status}>{getStatusLabel(item.status)}</Badge>
```

Keep logic such as these expressions exactly semantic-equivalent:

```js
row.status === 'Borrowed'
row.status === 'Overdue'
item.status === 'Ready to pick up'
['Expired', 'Cancelled'].includes(item.status)
```

- [ ] **Step 6: Localize captions and pagination accessibility labels**

Use these exact values:

```jsx
caption="Lịch sử mượn sách"
caption="Danh sách đặt chỗ của tôi"
aria-label="Trang trước"
aria-label="Trang sau"
```

- [ ] **Step 7: Run public/member tests and verify GREEN**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/borrowingFrontend.test.js frontend/test/reservationFrontend.test.js frontend/test/publicBrowseFrontend.test.js
```

Expected: all tests PASS; FE08 internal state tests still expect `Waiting` and `Ready to pick up`.

- [ ] **Step 8: Commit Task 4**

```powershell
git add frontend/src/page/HomePage.jsx frontend/src/utils/libraryFeatureViewModels.js frontend/src/page/borrowing/BorrowingHistoryPage.jsx frontend/src/page/borrowing/MemberBorrowingDetailsPage.jsx frontend/src/page/reservation/MyReservationsPage.jsx frontend/test/vietnameseUi.test.js
git commit -m "feat: localize public and member workflows"
```

---

### Task 5: Localize Librarian Operations, Inventory, Fines, and Reports

**Files:**
- Modify: `frontend/src/page/BookManagement.jsx`
- Modify: `frontend/src/component/inventory/BookCopies.jsx`
- Modify: `frontend/src/component/inventory/InventoryManagement.jsx`
- Modify: `frontend/src/page/borrowing/ProcessReturnsPage.jsx`
- Modify: `frontend/src/page/FineManagement.jsx`
- Modify: `frontend/src/page/report/BorrowingReportPage.jsx`
- Modify: `frontend/src/page/report/InventoryReportPage.jsx`
- Modify: `frontend/src/page/report/UserStatisticsPage.jsx`
- Test: `frontend/test/vietnameseUi.test.js`
- Test: `frontend/test/bookManagementFrontend.test.js`
- Test: `frontend/test/inventoryOperationalFrontend.test.js`
- Test: `frontend/test/fineOperationalFrontend.test.js`
- Test: `frontend/test/reportOperationalFrontend.test.js`

**Interfaces:**
- Consumes: `getStatusLabel()`, `getRoleLabel()`, `getBooleanLabel()` from Task 1.
- Produces: Vietnamese operational validation, table captions, headers, state labels, and generated fallbacks.
- Preserves: raw status props passed to `Badge` for CSS tone and all mutation payloads.

- [ ] **Step 1: Add failing librarian/report source tests**

Append to `frontend/test/vietnameseUi.test.js`:

```js
test('librarian and report surfaces remove known English interface copy', async () => {
  const files = {
    books: await readFile(new URL('../src/page/BookManagement.jsx', import.meta.url), 'utf8'),
    copies: await readFile(new URL('../src/component/inventory/BookCopies.jsx', import.meta.url), 'utf8'),
    inventory: await readFile(new URL('../src/component/inventory/InventoryManagement.jsx', import.meta.url), 'utf8'),
    borrowingReport: await readFile(new URL('../src/page/report/BorrowingReportPage.jsx', import.meta.url), 'utf8'),
    inventoryReport: await readFile(new URL('../src/page/report/InventoryReportPage.jsx', import.meta.url), 'utf8'),
    userReport: await readFile(new URL('../src/page/report/UserStatisticsPage.jsx', import.meta.url), 'utf8'),
  };

  assert.doesNotMatch(files.books, /Book title is required|Add Book|Save Changes|Select a book|No description/);
  assert.match(files.books, /Tên sách là bắt buộc|Thêm sách|Lưu thay đổi|Chọn một cuốn sách|Chưa có mô tả/);
  assert.match(files.copies, /caption="Danh sách bản sao"/);
  assert.match(files.inventory, /caption="Danh sách bản sao trong kho"/);
  assert.match(files.borrowingReport, /caption="Chi tiết báo cáo mượn trả"/);
  assert.match(files.inventoryReport, /caption="Danh sách sách sắp hết"/);
  assert.match(files.userReport, /caption="Tổng hợp thống kê người dùng"/);
  assert.doesNotMatch(files.userReport, /User ID|Membership|User statistics/);
});
```

- [ ] **Step 2: Run librarian/report tests and verify RED**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/bookManagementFrontend.test.js frontend/test/inventoryOperationalFrontend.test.js frontend/test/fineOperationalFrontend.test.js frontend/test/reportOperationalFrontend.test.js
```

Expected: FAIL on the known English validation messages, captions, headers, and report labels.

- [ ] **Step 3: Translate Book Management validation and action copy**

Apply this exact mapping in `BookManagement.jsx`:

```text
Book title is required. -> Tên sách là bắt buộc.
Book title must be 255 characters or fewer. -> Tên sách không được vượt quá 255 ký tự.
ISBN must be 20 characters or fewer. -> ISBN không được vượt quá 20 ký tự.
ISBN already exists. -> ISBN đã tồn tại.
Category is required. -> Thể loại là bắt buộc.
Author is required. -> Tác giả là bắt buộc.
Publish year must not be greater than ${currentYear}. -> Năm xuất bản không được lớn hơn ${currentYear}.
Pages must be from 1 to 10000. -> Số trang phải từ 1 đến 10000.
Rating must be between 0 and 5 with at most one decimal place. -> Điểm đánh giá phải từ 0 đến 5 và có tối đa một chữ số thập phân.
Cover URL must start with http(s) or /. -> URL ảnh bìa phải bắt đầu bằng http(s) hoặc /.
Description must be 2000 characters or fewer. -> Mô tả không được vượt quá 2000 ký tự.
Please enter a search keyword. -> Vui lòng nhập từ khóa tìm kiếm.
Search keyword must be 200 characters or fewer. -> Từ khóa tìm kiếm không được vượt quá 200 ký tự.
Please select a book first. -> Vui lòng chọn một cuốn sách trước.
Please fix the highlighted Add Book fields before submitting. -> Vui lòng sửa các trường được đánh dấu trước khi thêm sách.
ISBN already exists. Please use a unique ISBN or leave it blank. -> ISBN đã tồn tại. Vui lòng dùng ISBN khác hoặc để trống.
Please select a book to update. -> Vui lòng chọn sách cần cập nhật.
Please select a book before changing status. -> Vui lòng chọn sách trước khi đổi trạng thái.
Please confirm the status change before submitting. -> Vui lòng xác nhận thay đổi trạng thái trước khi gửi.
Select a book -> Chọn một cuốn sách
No description. -> Chưa có mô tả.
Add Book -> Thêm sách
Save Changes -> Lưu thay đổi
Update Book Information -> Cập nhật thông tin sách
Status -> Trạng thái
```

- [ ] **Step 4: Localize inventory captions and generated fallbacks**

Use:

```jsx
caption="Danh sách bản sao"
caption="Danh sách bản sao trong kho"
```

Replace generated `Book #${copy.bookId}` with `Sách #${copy.bookId}`. Keep `Barcode` unchanged.

- [ ] **Step 5: Localize return/fine status rendering**

Keep status props for styling and provide Vietnamese children:

```jsx
<Badge status="Overdue">Quá hạn</Badge>
<Badge status="Available">Đúng hạn</Badge>
<Badge status={fine.status}>{getStatusLabel(fine.status)}</Badge>
```

Replace `User #${fine.userId}` with `Người dùng #${fine.userId}`.

- [ ] **Step 6: Localize report captions, headers, roles, and statuses**

Use these exact captions and headers:

```jsx
caption="Chi tiết báo cáo mượn trả"
caption="Danh sách sách sắp hết"
caption="Chi tiết báo cáo tồn kho"
caption="Tổng hợp thống kê người dùng"
caption="Chi tiết thống kê người dùng"
headers={['Mã người dùng', 'Trạng thái', 'Vai trò', 'Hội viên', 'Ngày tạo', 'Ngày duyệt']}
```

Render role and status values through helpers:

```jsx
<Badge status={row.status}>{getStatusLabel(row.status)}</Badge>
{row.roles?.map(getRoleLabel).join(', ') || '-'}
{row.membershipStatus ? <Badge status={row.membershipStatus}>{getStatusLabel(row.membershipStatus)}</Badge> : '-'}
```

Use `Từ ngày` and `Đến ngày` for visible report date labels. Keep technical data-source keys such as `membershipByStatus` only if they are required diagnostic identifiers; otherwise replace visible source labels with `Theo trạng thái hội viên`.

- [ ] **Step 7: Run librarian/report tests and verify GREEN**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/bookManagementFrontend.test.js frontend/test/inventoryOperationalFrontend.test.js frontend/test/fineOperationalFrontend.test.js frontend/test/reportOperationalFrontend.test.js
```

Expected: all tests PASS.

- [ ] **Step 8: Commit Task 5**

```powershell
git add frontend/src/page/BookManagement.jsx frontend/src/component/inventory/BookCopies.jsx frontend/src/component/inventory/InventoryManagement.jsx frontend/src/page/borrowing/ProcessReturnsPage.jsx frontend/src/page/FineManagement.jsx frontend/src/page/report/BorrowingReportPage.jsx frontend/src/page/report/InventoryReportPage.jsx frontend/src/page/report/UserStatisticsPage.jsx frontend/test/vietnameseUi.test.js
git commit -m "feat: localize librarian operations and reports"
```

---

### Task 6: Localize Admin Console and Safe API Error Fallbacks

**Files:**
- Modify: `frontend/src/api/apiErrorMessages.js`
- Modify: `frontend/src/api/authApi.js`
- Modify: `frontend/src/api/profileApi.js`
- Modify: `frontend/src/api/userManagementApi.js`
- Modify: `frontend/src/api/adminApi.js`
- Modify: `frontend/src/page/UserManagement.jsx`
- Test: `frontend/test/apiErrorMessages.test.js`
- Test: `frontend/test/userManagementApi.test.js`
- Test: `frontend/test/userManagementFrontend.test.js`
- Test: `frontend/test/vietnameseUi.test.js`

**Interfaces:**
- Consumes: role/status/boolean label helpers from Task 1.
- Produces: Vietnamese admin copy and contextual Vietnamese error messages for every frontend API module.
- Preserves: error codes in `error.cause`, HTTP behavior, token refresh, role mutation ordering, and raw audit identifiers.

- [ ] **Step 1: Change API tests to require Vietnamese safe fallbacks**

Update `frontend/test/apiErrorMessages.test.js` expectations:

```js
assert.equal(
  getBorrowingErrorMessage({ response: { status: 422, data: { error: { details: [{ message: 'copyIds must be an array.' }] } } } }, 'Không thể gửi yêu cầu mượn.'),
  'Không thể gửi yêu cầu mượn.',
);
assert.equal(
  getBorrowingErrorMessage({ response: { status: 500, data: { error: { message: 'Backend error' } } } }, 'Không thể tải dữ liệu mượn sách.'),
  'Không thể tải dữ liệu mượn sách.',
);
assert.equal(
  getLibraryFeatureErrorMessage({ response: { status: 404, data: { error: { code: 'COPY_NOT_FOUND', message: 'Book copy was not found.' } } } }),
  'Không thể tải dữ liệu từ backend.',
);
assert.equal(
  getReportErrorMessage({ response: { status: 500, data: { error: { message: 'Backend error' } } } }, 'Không thể tải báo cáo.'),
  'Không thể tải báo cáo.',
);
assert.equal(
  getReservationErrorMessage({ response: { status: 409, data: { error: { code: 'UNKNOWN_RESERVATION_ERROR', message: 'Backend reservation message.' } } } }, 'Không thể xử lý đặt chỗ.'),
  'Không thể xử lý đặt chỗ.',
);
```

Update the known FE07/FE08 message fixtures to use `thành viên`, `thủ thư hoặc quản trị viên`, and `đơn hội viên` instead of visible `Member`, `admin`, or `Membership`.

Add source assertions to `vietnameseUi.test.js` for accented `adminApi` fallbacks and absence of `Could not`, `Please login`, `Request failed`, and `Admin login required` in user-facing API/page strings.

- [ ] **Step 2: Run API/admin tests and verify RED**

```powershell
node --test frontend/test/apiErrorMessages.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js frontend/test/vietnameseUi.test.js
```

Expected: FAIL because raw backend English and English admin copy are still returned/rendered.

- [ ] **Step 3: Make feature API resolvers use safe contextual fallbacks**

In `apiErrorMessages.js`, keep network, 401, 403, and known-code branches. Replace the final raw-message/detail returns with the supplied fallback:

```js
return fallback;
```

Apply this to generic, borrowing, reservation, book, inventory, membership, and report resolvers. Do not expose `error.response.data.error.message` or `details[].message` unless a local Vietnamese code mapping explicitly owns that message.

- [ ] **Step 4: Localize auth, profile, user-management, and admin API fallbacks**

Use contextual fallbacks and return them instead of raw server messages. Required visible strings include:

```text
Request failed. Please try again. -> Yêu cầu thất bại. Vui lòng thử lại.
Please login with an Admin account before doing this action. -> Vui lòng đăng nhập bằng tài khoản quản trị viên để thực hiện thao tác này.
Your account does not have Admin permission for this action. -> Tài khoản của bạn không có quyền quản trị viên cho thao tác này.
Could not load users. -> Không thể tải danh sách người dùng.
Could not load user details. -> Không thể tải chi tiết người dùng.
Could not load roles. -> Không thể tải danh sách vai trò.
Could not create user. -> Không thể tạo người dùng.
Could not update user. -> Không thể cập nhật người dùng.
Could not deactivate user. -> Không thể vô hiệu hóa người dùng.
Could not assign role. -> Không thể gán vai trò.
Could not revoke role. -> Không thể gỡ vai trò.
Could not load profile. -> Không thể tải hồ sơ cá nhân.
Could not update profile. -> Không thể cập nhật hồ sơ cá nhân.
Could not upload avatar. -> Không thể tải ảnh đại diện lên.
```

For `authApi.js`, `profileApi.js`, and `userManagementApi.js`, preserve network/401/403
and known-code branches, then end the resolver with the caller-owned fallback:

```js
return fallback;
```

Do not return `apiError.message` or concatenate `details[].message`; the original Axios
error remains available through `Error.cause` for programmatic handling.

Replace the unaccented `adminApi.js` fallbacks with:

```js
'Không thể tải tổng quan quản trị.'
'Không thể tải kho sách.'
'Không thể tải dữ liệu thư viện.'
'Không thể thêm dữ liệu.'
'Không thể cập nhật dữ liệu.'
'Không thể vô hiệu hóa dữ liệu.'
'Không thể tải dữ liệu mượn trả.'
'Không thể tải danh sách yêu cầu.'
'Không thể tải chi tiết yêu cầu.'
'Không thể tải ma trận phân quyền.'
'Không thể tải nhật ký hoạt động.'
```

- [ ] **Step 5: Localize admin roles, statuses, dates, actions, and feedback**

In `UserManagement.jsx`:

```js
import { getBooleanLabel, getRoleLabel, getStatusLabel } from '../utils/uiLabels';
```

Replace local English label maps with helper calls, and format dates with:

```js
return new Date(value).toLocaleDateString('vi-VN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
```

Apply this exact visible-copy mapping:

```text
Every user must keep at least one role. -> Mỗi người dùng phải giữ ít nhất một vai trò.
Close -> Đóng
Update -> Cập nhật
Create -> Tạo mới
Dashboard -> Tổng quan
You need to login with an Admin account to create, update, or manage users. -> Bạn cần đăng nhập bằng tài khoản quản trị viên để tạo, cập nhật hoặc quản lý người dùng.
Library data saved. -> Dữ liệu thư viện đã được lưu.
Payment confirmed and fine marked as paid. -> Đã xác nhận thanh toán và đánh dấu khoản phạt là đã thanh toán.
Payment refused. Fine is returned to unpaid follow-up. -> Đã từ chối thanh toán; khoản phạt được chuyển về trạng thái chưa thanh toán.
Admin login required. -> Cần đăng nhập bằng tài khoản quản trị viên.
Search library data... -> Tìm dữ liệu thư viện...
Fine -> Tiền phạt
Member -> Thành viên
Book -> Sách
Amount -> Số tiền
Collected by -> Người thu
Method -> Phương thức
Actions -> Thao tác
Borrow detail # -> Chi tiết mượn #
Status Report -> Báo cáo trạng thái
Role Distribution -> Phân bố vai trò
Close details -> Đóng chi tiết
No name -> Chưa có tên
Active borrowings -> Lượt mượn đang hoạt động
Unpaid fines -> Tiền phạt chưa thanh toán
Actor ID -> Mã người thực hiện
Yes -> Có
Edit -> Chỉnh sửa
```

Keep audit action codes such as `AUTH_LOGIN_SUCCESS` unchanged because they are technical identifiers.

- [ ] **Step 6: Run API/admin tests and verify GREEN**

```powershell
node --test frontend/test/apiErrorMessages.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js frontend/test/vietnameseUi.test.js
```

Expected: all tests PASS.

- [ ] **Step 7: Commit Task 6**

```powershell
git add frontend/src/api/apiErrorMessages.js frontend/src/api/authApi.js frontend/src/api/profileApi.js frontend/src/api/userManagementApi.js frontend/src/api/adminApi.js frontend/src/page/UserManagement.jsx frontend/test/apiErrorMessages.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js frontend/test/vietnameseUi.test.js
git commit -m "feat: localize admin and API feedback"
```

---

### Task 7: Add the Localization Audit, Update Traceability, and Run Full Verification

**Files:**
- Modify: `frontend/test/vietnameseUi.test.js`
- Modify: `.sdd/specs/feat-public-browse/CHANGELOG.md`
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`
- Modify: `.sdd/specs/feat-user-profile/CHANGELOG.md`
- Modify: `.sdd/specs/feat-membership-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-book-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-inventory-book-copy/CHANGELOG.md`
- Modify: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-reservation-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-fine-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-notification-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-reporting-statistics/CHANGELOG.md`
- Test: all `frontend/test/*.test.js`

**Interfaces:**
- Consumes: all localized pages and helpers from Tasks 1-6.
- Produces: a regression guard against reintroducing the audited English interface strings and traceability records for affected features.

- [ ] **Step 1: Add a failing final audit test before the last cleanup pass**

Append this structure to `frontend/test/vietnameseUi.test.js`:

```js
const forbiddenCopyByFile = new Map([
  ['../src/component/forgotpassword/BackgroundPanel.jsx', [/Welcome Back/, /Reset your password/]],
  ['../src/component/layout/AppLayout.jsx', [/aria-label="Home"/, />Home</]],
  ['../src/component/shared/Feedback.jsx', [/aria-label="Close"/]],
  ['../src/page/BookManagement.jsx', [/Book title is required/, /Add Book/, /Save Changes/, /Select a book/, /No description/]],
  ['../src/page/borrowing/BorrowingHistoryPage.jsx', [/Borrowing history table/, /Previous page/, /Next page/]],
  ['../src/page/reservation/MyReservationsPage.jsx', [/My reservations table/]],
  ['../src/component/inventory/BookCopies.jsx', [/Book copies table/]],
  ['../src/component/inventory/InventoryManagement.jsx', [/Inventory copies table/]],
  ['../src/page/report/BorrowingReportPage.jsx', [/Borrowing report detail rows/, /From date/, /To date/]],
  ['../src/page/report/InventoryReportPage.jsx', [/Low inventory books table/, /Inventory report detail rows/, /Book ID/]],
  ['../src/page/report/UserStatisticsPage.jsx', [/User statistics summary table/, /User statistics detail rows/, /User ID/, /Membership/]],
  ['../src/page/UserManagement.jsx', [/Every user must keep at least one role/, /Status Report/, /Role Distribution/, /Close details/, /No name/, /Active borrowings/, /Unpaid fines/, /Search library data/]],
  ['../src/api/userManagementApi.js', [/Request failed\. Please try again/, /Could not /, /Please login with an Admin account/]],
  ['../src/api/profileApi.js', [/Could not load profile/, /Could not update profile/, /Could not upload avatar/]],
]);

test('audited frontend surfaces do not contain known English interface copy', async () => {
  for (const [file, patterns] of forbiddenCopyByFile) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    for (const pattern of patterns) {
      assert.doesNotMatch(source, pattern, `${file}: ${pattern}`);
    }
  }
});
```

Run it before cleanup to confirm any remaining audited phrase causes RED.

- [ ] **Step 2: Run the audit test and remove every reported user-facing occurrence**

```powershell
node --test frontend/test/vietnameseUi.test.js
```

Expected before cleanup: FAIL if any known interface phrase remains. Replace only visible copy; do not rename components, variables, imports, API fields, raw enum constants, or technical audit codes.

- [ ] **Step 3: Update feature changelogs**

Add this exact dated entry to FE01-FE09, FE11, and FE12 changelogs:

```markdown
## 2026-07-20 - Vietnamese UI localization and typography

- Localized frontend-generated labels, states, accessibility names, and safe error feedback for this feature.
- Preserved API contracts, raw enum values, permissions, business rules, and user-owned catalog/profile data.
- Applied the shared `Be Vietnam Pro` body and `Noto Serif` heading typography contract with Unicode-capable fallbacks.
```

Add this exact FE10 entry:

```markdown
## 2026-07-20 - Vietnamese UI localization and typography

- Localized shared frontend labels, accessibility names, and safe error feedback used around notification-related surfaces.
- Preserved notification-template payloads, delivery behavior, API contracts, raw enum values, permissions, and business rules.
- Applied the shared `Be Vietnam Pro` body and `Noto Serif` heading typography contract with Unicode-capable fallbacks.
```

- [ ] **Step 4: Run the complete frontend test suite**

```powershell
npm --prefix frontend test
```

Expected: exit `0`, all frontend tests PASS, zero failures.

- [ ] **Step 5: Run lint and production build**

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
```

Expected: both commands exit `0`; ESLint reports no errors and Vite produces `frontend/dist`.

- [ ] **Step 6: Run repository-level checks**

```powershell
npm run trace:enforce
git diff --check
```

Expected: traceability enforcement passes and `git diff --check` prints no whitespace errors.

- [ ] **Step 7: Perform responsive browser verification**

Start the frontend:

```powershell
npm --prefix frontend run dev -- --host 127.0.0.1
```

Verify at 1440px and 390px widths:

```text
/login       - headings, fields, password controls, and Vietnamese diacritics render correctly.
/homepage    - public navigation, search, book cards, detail panel, and footer contain no generated English copy.
/home        - shared shell navigation shows “Thư viện” and “Tổng quan”; menus remain reachable.
/admin/users - admin headings, filters, tables, dialogs, statuses, and error states are Vietnamese.
```

Expected: no missing glyph boxes, detached combining marks, text overlap, clipped primary actions, or horizontal page overflow. `Email`, `OTP`, and `Barcode` remain unchanged; book titles/authors remain source data.

- [ ] **Step 8: Review final diff against the design**

```powershell
git status --short
git diff --stat
git diff -- frontend docs/superpowers/specs/2026-07-20-vietnamese-ui-localization-design.md .sdd/specs
```

Expected: only localization, typography, tests, and related changelog files are changed; no backend, database, API contract, or permission files are modified.

- [ ] **Step 9: Commit Task 7**

```powershell
git add frontend/test/vietnameseUi.test.js .sdd/specs/feat-public-browse/CHANGELOG.md .sdd/specs/feat-auth/CHANGELOG.md .sdd/specs/feat-user-profile/CHANGELOG.md .sdd/specs/feat-membership-management/CHANGELOG.md .sdd/specs/feat-book-management/CHANGELOG.md .sdd/specs/feat-inventory-book-copy/CHANGELOG.md .sdd/specs/feat-borrowing-management/CHANGELOG.md .sdd/specs/feat-reservation-management/CHANGELOG.md .sdd/specs/feat-fine-management/CHANGELOG.md .sdd/specs/feat-notification-management/CHANGELOG.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/specs/feat-reporting-statistics/CHANGELOG.md
git commit -m "docs: record Vietnamese UI localization"
```

---

## Final Verification Checklist

- [x] All frontend-generated interface text is Vietnamese except approved technical terms and technical identifiers.
- [x] Book titles, author names, email addresses, barcode values, and user-entered content remain unchanged.
- [x] Raw role/status/API values remain unchanged in logic and requests.
- [x] Known API errors are Vietnamese and unknown failures use Vietnamese fallbacks.
- [x] `lang="vi"`, page title, `Be Vietnam Pro`, and `Noto Serif` are wired correctly.
- [ ] Desktop and mobile checks show correct Vietnamese glyph rendering and no overflow.
- [x] `npm --prefix frontend test`, lint, build, traceability, and `git diff --check` all pass.
