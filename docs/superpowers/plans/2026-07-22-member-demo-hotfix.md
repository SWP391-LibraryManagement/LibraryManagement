# Member Demo Hotfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the six approved Member demo paths truthful and reliable without backend, database, or FE11 changes.

**Architecture:** Keep the existing React and API boundaries. Correct two view-model contracts, add one read-only Member fines page over the existing `/api/fines/me` endpoint, and make narrowly scoped HomePage navigation/search/copy fixes. Each product change starts with a focused Node regression test and remains uncommitted for local demo review.

**Tech Stack:** React 19, React Router 7, Axios, Node `node:test`, Vite 8, ESLint 10.

## Global Constraints

- Batch ID is `DEMO-HOTFIX-USER-2026-07-22`.
- Product implementation remains local and uncommitted until the user finishes demo review.
- Do not commit, push, merge, change schema, deploy, or edit backend production code.
- Do not stage or modify any `.sdd/specs/feat-user-role-management/` file.
- Do not redesign multi-copy borrowing or implement full catalog/reservation pagination.
- Reuse the existing authenticated API helpers, `BorrowingRouteGuard`, `AppLayout`, `DataTable`, `DataNotice`, `EmptyState`, and `Badge`.
- Preserve the approved rules: 3 borrow requests per day before approved membership, 5 per day after approval, and at most 5 active borrowed books.

---

## File Map

- Modify `frontend/src/page/dashboard/dashboardViewModel.js`: consume the canonical Member borrowing envelope.
- Modify `frontend/src/utils/libraryFeatureViewModels.js`: preserve reservation raw status and expose terminal/open-state policy.
- Modify `frontend/src/page/reservation/MyReservationsPage.jsx`: use raw reservation lifecycle state for duplicate and cancel actions.
- Modify `frontend/src/api/libraryFeatureApi.js`: expose the existing Member fines read endpoint.
- Create `frontend/src/page/fine/MemberFinesPage.jsx`: render the authenticated Member's own fines read-only.
- Modify `frontend/src/App.jsx`: lazy-load and guard `/fines/mine`.
- Modify `frontend/src/utils/appNavigation.js`: expose “Tiền phạt của tôi” to Members.
- Modify `frontend/src/page/HomePage.jsx`: correct guest routes, blank search reset, and unsupported promotion copy.
- Modify `frontend/test/appShellFrontend.test.js`: dashboard, Member navigation, and Home truthfulness regressions.
- Modify `frontend/test/reservationFrontend.test.js`: FE08 terminal-state regressions.
- Create `frontend/test/memberFineFrontend.test.js`: API, route, navigation, and read-only page regressions.
- Modify `frontend/test/publicBrowseFrontend.test.js`: blank-search default-catalog regression.

### Task 1: Correct the Member dashboard borrowing envelope

**Files:**
- Modify: `frontend/test/appShellFrontend.test.js`
- Modify: `frontend/src/page/dashboard/dashboardViewModel.js`

**Interfaces:**
- Consumes: `borrowingApi.listMine(): Promise<{ borrowings: BorrowRequest[], pagination: object }>`.
- Produces: `buildMemberSummary(borrowing, reservations): { activeBorrows: number, completedBorrows: number, activeReservations: number }`.

- [ ] **Step 1: Write the failing canonical-envelope test**

Replace the Member dashboard fixture with:

```js
test('member dashboard summarizes the canonical personal borrowing envelope', () => {
  assert.deepEqual(
    buildMemberSummary(
      { borrowings: [{ status: 'APPROVED' }, { status: 'COMPLETED' }] },
      { reservations: [{ status: 'WAITING' }, { status: 'CANCELLED' }] },
    ),
    { activeBorrows: 1, completedBorrows: 1, activeReservations: 1 },
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern="member dashboard" test/appShellFrontend.test.js`

Working directory: `frontend`

Expected: FAIL because `activeBorrows` and `completedBorrows` are `0` when the fixture uses `borrowings`.

- [ ] **Step 3: Implement the canonical key with a defensive array check**

Change the first line inside `buildMemberSummary` to:

```js
const borrowRows = Array.isArray(borrowing.borrowings) ? borrowing.borrowings : [];
```

Keep the staff summary on `borrowRequests`, because the staff endpoint owns that envelope.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test --test-name-pattern="member dashboard" test/appShellFrontend.test.js`

Working directory: `frontend`

Expected: PASS.

- [ ] **Step 5: Inspect the task diff without committing product code**

Run: `git diff -- frontend/test/appShellFrontend.test.js frontend/src/page/dashboard/dashboardViewModel.js`

Expected: only the Member fixture and the canonical Member response key changed.

### Task 2: Make fulfilled reservations terminal in Member actions

**Files:**
- Modify: `frontend/test/reservationFrontend.test.js`
- Modify: `frontend/src/utils/libraryFeatureViewModels.js`
- Modify: `frontend/src/page/reservation/MyReservationsPage.jsx`

**Interfaces:**
- Produces: `isOpenMemberReservationStatus(status): boolean`, true only for backend states `ACTIVE` and `NOTIFIED`.
- Produces: `mapReservation(reservation).rawStatus: string`, normalized to uppercase.
- Consumes: those two outputs in duplicate-reservation and cancel-button decisions.

- [ ] **Step 1: Write failing raw-state and policy tests**

Add to `reservationFrontend.test.js`:

```js
test('member reservation actions are open only for ACTIVE and NOTIFIED records', async () => {
  const { isOpenMemberReservationStatus } = await loadViewModels();

  assert.equal(typeof isOpenMemberReservationStatus, 'function');
  assert.equal(isOpenMemberReservationStatus('ACTIVE'), true);
  assert.equal(isOpenMemberReservationStatus('NOTIFIED'), true);
  assert.equal(isOpenMemberReservationStatus('FULFILLED'), false);
  assert.equal(isOpenMemberReservationStatus('CANCELLED'), false);
  assert.equal(isOpenMemberReservationStatus('EXPIRED'), false);
});

test('reservation mapping preserves the normalized backend lifecycle state', async () => {
  const { mapReservation } = await loadViewModels();
  assert.equal(mapReservation({ reservationId: 7, copyId: 9, status: 'fulfilled' }).rawStatus, 'FULFILLED');
});
```

Extend the existing Member page source test with:

```js
assert.match(mine, /isOpenMemberReservationStatus/);
assert.match(mine, /item\.rawStatus/);
assert.doesNotMatch(mine, /!\['Cancelled', 'Expired'\]\.includes\(item\.status\)/);
```

- [ ] **Step 2: Run the FE08 file and verify RED**

Run: `node --test test/reservationFrontend.test.js`

Working directory: `frontend`

Expected: FAIL because the helper and `rawStatus` do not exist and the page still permits `Completed` cancellation.

- [ ] **Step 3: Add the lifecycle policy to the view model**

Add before `mapReservation`:

```js
export function isOpenMemberReservationStatus(status) {
  return ['ACTIVE', 'NOTIFIED'].includes(String(status || '').toUpperCase());
}
```

Add this property to `mapReservation`:

```js
rawStatus: String(reservation.status || '').toUpperCase(),
```

- [ ] **Step 4: Use the policy for duplicate and cancel actions**

Import `isOpenMemberReservationStatus`, then make the active-copy set and duplicate check use:

```js
.filter((item) => isOpenMemberReservationStatus(item.rawStatus))
```

```js
if (reservations.some((item) => (
  Number(item.copyId) === Number(candidate.copyId)
  && isOpenMemberReservationStatus(item.rawStatus)
))) {
```

Render the cancel button only when:

```jsx
{isOpenMemberReservationStatus(item.rawStatus) && (
  <button className="btn btn-outline btn-sm" onClick={() => setCancelTarget(item)}>
    <X size={14} /> Hủy
  </button>
)}
```

Also display `-` for the queue position when `rawStatus` is terminal.

- [ ] **Step 5: Run the FE08 file and verify GREEN**

Run: `node --test test/reservationFrontend.test.js`

Working directory: `frontend`

Expected: all FE08 frontend tests pass.

### Task 3: Add a read-only “Tiền phạt của tôi” page

**Files:**
- Create: `frontend/test/memberFineFrontend.test.js`
- Modify: `frontend/test/appShellFrontend.test.js`
- Modify: `frontend/src/api/libraryFeatureApi.js`
- Create: `frontend/src/page/fine/MemberFinesPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/utils/appNavigation.js`

**Interfaces:**
- Produces: `fineApi.listMine(params = {}): Promise<{ fines: Fine[], page: number, limit: number, total: number, totalPages: number }>`.
- Produces: guarded route `/fines/mine` and navigation key `my-fines`.
- Consumes: fine fields `fineId`, `borrowDetailId`, `bookTitle`, `reason`, `overdueDays`, `amount`, `status`.

- [ ] **Step 1: Write failing API, route, navigation, and read-only page tests**

Create `memberFineFrontend.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Member fines use the authenticated own-fines endpoint', async () => {
  const api = await readFile(new URL('../src/api/libraryFeatureApi.js', import.meta.url), 'utf8');
  assert.match(api, /listMine\(params = \{\}\)/);
  assert.match(api, /method: 'get', url: '\/fines\/me', params/);
});

test('Member fines route is guarded and present in Member navigation', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const navigation = await readFile(new URL('../src/utils/appNavigation.js', import.meta.url), 'utf8');
  assert.match(app, /path="\/fines\/mine"[^\n]+BorrowingRouteGuard audience="member"/);
  assert.match(navigation, /key: 'my-fines', label: 'Tiền phạt của tôi', path: '\/fines\/mine'/);
});

test('Member fines page is server-backed, paginated, and read-only', async () => {
  const page = await readFile(new URL('../src/page/fine/MemberFinesPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /fineApi\.listMine\(\{ page, limit: MEMBER_FINE_PAGE_SIZE \}\)/);
  assert.match(page, /onClick=\{loadFines\}/);
  assert.match(page, /result\.totalPages/);
  assert.match(page, /fine\.bookTitle/);
  assert.match(page, /fine\.reason/);
  assert.match(page, /fine\.borrowDetailId/);
  assert.doesNotMatch(page, /fineApi\.(calculate|collect|markPaid|waive|cancel)/);
});
```

Update the Member navigation expectation in `appShellFrontend.test.js` to include `my-fines`, and add:

```js
assert.equal(getActiveNavigationKey('/fines/mine'), 'my-fines');
```

- [ ] **Step 2: Run the two focused test files and verify RED**

Run: `node --test test/memberFineFrontend.test.js test/appShellFrontend.test.js`

Working directory: `frontend`

Expected: FAIL because the page, API method, route, and navigation item do not exist.

- [ ] **Step 3: Add the API method, guarded route, and navigation item**

Add first inside `fineApi`:

```js
listMine(params = {}) {
  return authorizedRequest(
    { method: 'get', url: '/fines/me', params },
    'Không thể tải tiền phạt của bạn.',
  );
},
```

Add the lazy import and route in `App.jsx`:

```js
const MemberFinesPage = lazy(() => import('./page/fine/MemberFinesPage'));
```

```jsx
<Route path="/fines/mine" element={<BorrowingRouteGuard audience="member"><MemberFinesPage /></BorrowingRouteGuard>} />
```

Add to the Member navigation group:

```js
{ key: 'my-fines', label: 'Tiền phạt của tôi', path: '/fines/mine' },
```

- [ ] **Step 4: Create the read-only page**

Implement `MemberFinesPage.jsx` with `MEMBER_FINE_PAGE_SIZE = 8`, `page`, `fines`, `pagination`, `loading`, and `notice` state. Load with:

```js
const result = await fineApi.listMine({ page, limit: MEMBER_FINE_PAGE_SIZE });
setFines(result.fines || []);
setPagination({
  page: Number(result.page || page),
  limit: Number(result.limit || MEMBER_FINE_PAGE_SIZE),
  total: Number(result.total || 0),
  totalPages: Number(result.totalPages || 0),
});
```

Render `AppLayout active="my-fines"` with a reload button whose `onClick` is `loadFines`, an error `DataNotice`, and a `DataTable` with these exact headers:

```js
['Sách', 'Lý do', 'Quá hạn', 'Số tiền', 'Trạng thái', 'Mã mượn']
```

Use `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })`, `Badge`, and previous/next buttons that only call `setPage`. Do not render mutation buttons.

- [ ] **Step 5: Run the two focused files and verify GREEN**

Run: `node --test test/memberFineFrontend.test.js test/appShellFrontend.test.js`

Working directory: `frontend`

Expected: both files pass.

### Task 4: Correct all guest authentication entry points

**Files:**
- Modify: `frontend/test/appShellFrontend.test.js`
- Modify: `frontend/src/page/HomePage.jsx`

**Interfaces:**
- Consumes: existing `goToLogin()` and `goToRegister()` helpers.
- Produces: desktop, mobile, CTA, and footer guest controls that consistently route to `/login` or `/register`.

- [ ] **Step 1: Write the failing source contract**

Add to `appShellFrontend.test.js`:

```js
test('homepage guest authentication controls route to their matching screens', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  assert.match(source, />Đăng ký<\/button>/);
  assert.doesNotMatch(source, /onClick=\{goToMembership\}/);
  assert.match(source, /label: 'Đăng nhập', action: goToLogin/);
  assert.match(source, /label: 'Đăng ký', action: goToRegister/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern="guest authentication controls" test/appShellFrontend.test.js`

Working directory: `frontend`

Expected: FAIL because desktop/mobile registration uses `goToMembership` and footer actions are empty functions.

- [ ] **Step 3: Wire each control to the existing helper**

Delete `goToMembership`. Use `goToRegister` for the desktop and mobile “Đăng ký” buttons. Replace footer links with:

```js
{ label: 'Đăng nhập', action: goToLogin },
{ label: 'Đăng ký', action: goToRegister },
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test --test-name-pattern="guest authentication controls" test/appShellFrontend.test.js`

Working directory: `frontend`

Expected: PASS.

### Task 5: Make blank public search return to the default catalog

**Files:**
- Modify: `frontend/test/publicBrowseFrontend.test.js`
- Modify: `frontend/src/page/HomePage.jsx`

**Interfaces:**
- Consumes: `publicBrowseApi.list()` and existing `scrollTo('section-books')`.
- Produces: blank search reloads the canonical default list, resets search state, selects all categories, expands the catalog, and shows no validation toast.

- [ ] **Step 1: Write the failing blank-search contract**

Add to `publicBrowseFrontend.test.js`:

```js
test('FE01 blank search returns to the loaded default catalog without an error toast', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  const blankBranch = source.match(/if \(!keyword\) \{([\s\S]*?)\n    \}/)?.[1] || '';
  assert.match(blankBranch, /await publicBrowseApi\.list\(\)/);
  assert.match(blankBranch, /setBooks\(result\.data \|\| \[\]\)/);
  assert.match(blankBranch, /setActiveSearch\(''\)/);
  assert.match(blankBranch, /setActiveCategory\('Tất cả'\)/);
  assert.match(blankBranch, /setShowAll\(true\)/);
  assert.match(blankBranch, /scrollTo\('section-books'\)/);
  assert.doesNotMatch(blankBranch, /Vui lòng nhập từ khóa tìm kiếm/);
});
```

- [ ] **Step 2: Run the FE01 test file and verify RED**

Run: `node --test test/publicBrowseFrontend.test.js`

Working directory: `frontend`

Expected: FAIL because blank input displays a validation toast and does not reload or render the canonical default list.

- [ ] **Step 3: Replace the blank-search branch**

Use:

```js
if (!keyword) {
  setActiveSearch('');
  setSearchResults([]);
  setSearchError('');
  try {
    setSearchingBooks(true);
    setBookError('');
    const result = await publicBrowseApi.list();
    if (!Array.isArray(result.data)) {
      throw new Error(result.error?.message || 'Không thể tải danh sách sách.');
    }
    setBooks(result.data || []);
    setActiveCategory('Tất cả');
    setShowAll(true);
    scrollTo('section-books');
  } catch (error) {
    setBookError(error.message || 'Không thể tải danh sách sách.');
  } finally {
    setSearchingBooks(false);
  }
  return;
}
```

- [ ] **Step 4: Run the FE01 file and verify GREEN**

Run: `node --test test/publicBrowseFrontend.test.js`

Working directory: `frontend`

Expected: all FE01 public browse tests pass.

### Task 6: Remove unsupported membership claims from the public home page

**Files:**
- Modify: `frontend/test/appShellFrontend.test.js`
- Modify: `frontend/src/page/HomePage.jsx`

**Interfaces:**
- Consumes: approved membership and borrowing rules from the SDD feature specs.
- Produces: public copy that claims only registration, application review, 3/5 daily requests, and 5 active books.

- [ ] **Step 1: Write the failing truthful-copy contract**

Add to `appShellFrontend.test.js`:

```js
test('homepage membership copy stays within approved library rules', async () => {
  const source = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  for (const unsupported of [
    '99.000 VND/tháng',
    'Mượn sách không giới hạn',
    'Sách điện tử và sách nói',
    'Thông báo sách mới',
    'Danh sách đọc',
    'Sự kiện riêng',
  ]) assert.doesNotMatch(source, new RegExp(unsupported));
  assert.doesNotMatch(source, /MembershipModal|showMembership/);
  assert.match(source, /Tối đa 5 sách đang mượn/);
  assert.match(source, /3 yêu cầu mỗi ngày/);
  assert.match(source, /5 yêu cầu mỗi ngày sau khi được duyệt hội viên/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern="membership copy stays" test/appShellFrontend.test.js`

Working directory: `frontend`

Expected: FAIL because the dormant paid-tier modal and unsupported benefit cards remain in source.

- [ ] **Step 3: Remove the dormant modal and replace four benefit cards**

Delete the `MembershipModal` component, `showMembership` state, and its render branch. Replace the benefit card data with:

```js
[
  { icon: '01', title: 'Đăng ký trực tuyến', desc: 'Tạo tài khoản và xác thực email để sử dụng hệ thống.' },
  { icon: '02', title: 'Mượn sách có kiểm soát', desc: 'Tối đa 5 sách đang mượn tại cùng một thời điểm.' },
  { icon: '03', title: 'Hạn mức rõ ràng', desc: 'Gửi tối đa 3 yêu cầu mỗi ngày khi chưa được duyệt hội viên.' },
  { icon: '04', title: 'Quyền lợi hội viên', desc: 'Gửi tối đa 5 yêu cầu mỗi ngày sau khi được duyệt hội viên.' },
]
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test --test-name-pattern="membership copy stays" test/appShellFrontend.test.js`

Working directory: `frontend`

Expected: PASS.

### Task 7: Run full verification and prepare the demo handoff

**Files:**
- Verify only: all files changed by Tasks 1–6.

**Interfaces:**
- Consumes: all six independently green hotfixes.
- Produces: fresh test/lint/build evidence and a diff limited to the approved batch.

- [ ] **Step 1: Run all frontend tests**

Run: `npm test`

Working directory: `frontend`

Expected: every Node test passes with zero failures.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Working directory: `frontend`

Expected: exit code `0` with no ESLint errors.

- [ ] **Step 3: Build the production frontend**

Run: `npm run build`

Working directory: `frontend`

Expected: Vite completes the production build with exit code `0`.

- [ ] **Step 4: Re-run relevant backend contracts without backend edits**

Run: `npm test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingContract.test.js tests/reservationRoutes.test.js tests/reservationService.test.js tests/fineRoutes.test.js tests/fineContract.test.js`

Working directory: `backend`

Expected: borrowing, reservation, and fine service tests pass.

- [ ] **Step 5: Check whitespace, scope, and FE11 isolation**

Run: `git diff --check`

Expected: no whitespace errors in hotfix files.

Run: `git status --short`

Expected: the six pre-existing FE11 files remain unstaged, hotfix product files are unstaged, and no backend/schema file appears.

Run: `git diff --name-only -- frontend`

Expected: only the frontend files listed in the File Map appear.

- [ ] **Step 6: Perform the five-minute smoke path**

Run the app with the repository's normal local startup. Verify in order:

1. Guest desktop/mobile/footer “Đăng ký” opens `/register`; “Đăng nhập” opens `/login`.
2. Blank search returns to the complete default catalog without an error toast.
3. Member dashboard shows counts from actual `/borrow-requests/me` data.
4. A fulfilled reservation has no cancel action and does not block reserving that copy again.
5. “Tiền phạt của tôi” opens `/fines/mine`, paginates, and exposes no mutation action.
6. Public membership copy contains no paid tier, unlimited borrowing, digital-media, private-event, notification, or reading-list claim.
