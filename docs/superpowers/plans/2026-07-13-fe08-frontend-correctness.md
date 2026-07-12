# FE08 Frontend Correctness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the FE08 reservation frontend with the approved reservation lifecycle and existing backend hold-expiration contract.

**Architecture:** Keep `statusToUi()` as the backend-to-UI status boundary, add small pure FE08 view helpers for queue eligibility and success copy, and isolate reservation errors behind a dedicated resolver used only by `reservationApi`. The librarian page calls the existing backend endpoint and reloads canonical server state instead of simulating fulfillment or deletion locally.

**Tech Stack:** React 19, Vite 8, Axios, Node.js built-in test runner, ESLint, Express/Jest regression suite.

## Global Constraints

- Follow `.sdd/specs/feat-reservation-management/SPEC.md` version 0.3.0 as the behavior source of truth.
- Use only the existing `POST /api/reservations/expire-holds` backend contract.
- Do not add backend endpoints, database changes, status values, dependencies, or automatic scheduled expiration.
- Do not implement FE07 fulfillment, FE10 delivery changes, or server-side pagination.
- Keep reservation-specific Vietnamese messages isolated to `reservationApi`.
- Remove UI actions that claim server-side fulfillment or deletion while changing only local state.
- Preserve unrelated untracked files, especially `backend/coverage/` and `docs/briefing-thuyet-trinh-du-an-vi.docx`.
- Use branch `fix/fe08-frontend-correctness`; do not create a branch containing `codex`.

---

## File Structure

- Create `frontend/src/utils/reservationViewState.js`: pure FE08 queue eligibility and expiration-result message helpers.
- Create `frontend/test/reservationFrontend.test.js`: Node tests for lifecycle mapping, queue eligibility, expiration summary copy, and librarian-page contract.
- Modify `frontend/src/utils/libraryFeatureViewModels.js`: add canonical mappings for `NOTIFIED` and `FULFILLED`.
- Modify `frontend/src/api/apiErrorMessages.js`: add and export the reservation-specific error resolver.
- Modify `frontend/test/apiErrorMessages.test.js`: verify FE08 localization and cross-feature isolation.
- Modify `frontend/src/api/libraryFeatureApi.js`: route all reservation calls through the FE08 resolver and expose `expireHolds()`.
- Modify `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`: wire hold expiration, reload server state, filter active queue rows, and remove fake actions.
- Modify `.sdd/specs/feat-reservation-management/PLAN.md`: describe the completed frontend slice and this correctness pass.
- Modify `.sdd/specs/feat-reservation-management/TASKS.md`: add FE08 correctness tasks, traceability, and fresh verification evidence.
- Modify `.sdd/specs/feat-reservation-management/CHANGELOG.md`: record the 2026-07-13 frontend correctness update.

---

### Task 1: Reservation Lifecycle And View-State Helpers

**Files:**
- Create: `frontend/src/utils/reservationViewState.js`
- Create: `frontend/test/reservationFrontend.test.js`
- Modify: `frontend/src/utils/libraryFeatureViewModels.js:114`

**Interfaces:**
- Consumes: backend reservation states `ACTIVE`, `NOTIFIED`, `FULFILLED`, `CANCELLED`, and `EXPIRED`.
- Produces: `statusToUi(status, metadata)`, `isActiveReservationQueueStatus(status)`, and `getExpireHoldsSuccessMessage(result)`.

- [ ] **Step 1: Write failing lifecycle and view-state tests**

Create `frontend/test/reservationFrontend.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

async function loadViewModels() {
  try {
    return await import('../src/utils/libraryFeatureViewModels.js');
  } catch {
    return {};
  }
}

async function loadReservationViewState() {
  try {
    return await import('../src/utils/reservationViewState.js');
  } catch {
    return {};
  }
}

test('maps every FE08 reservation lifecycle state to its canonical UI state', async () => {
  const { statusToUi } = await loadViewModels();

  assert.equal(typeof statusToUi, 'function');
  assert.equal(statusToUi('ACTIVE'), 'Waiting');
  assert.equal(statusToUi('NOTIFIED'), 'Ready to pick up');
  assert.equal(statusToUi('FULFILLED'), 'Completed');
  assert.equal(statusToUi('CANCELLED'), 'Cancelled');
  assert.equal(statusToUi('EXPIRED'), 'Expired');
});

test('keeps only active FE08 states in the librarian queue', async () => {
  const { isActiveReservationQueueStatus } = await loadReservationViewState();

  assert.equal(typeof isActiveReservationQueueStatus, 'function');
  assert.equal(isActiveReservationQueueStatus('Waiting'), true);
  assert.equal(isActiveReservationQueueStatus('Ready to pick up'), true);
  assert.equal(isActiveReservationQueueStatus('Completed'), false);
  assert.equal(isActiveReservationQueueStatus('Cancelled'), false);
  assert.equal(isActiveReservationQueueStatus('Expired'), false);
});

test('formats expired and promoted counts from the backend response', async () => {
  const { getExpireHoldsSuccessMessage } = await loadReservationViewState();

  assert.equal(typeof getExpireHoldsSuccessMessage, 'function');
  assert.equal(
    getExpireHoldsSuccessMessage({ expiredCount: 2, promoted: [{}, {}] }),
    'Đã xử lý 2 lượt giữ chỗ hết hạn và chuyển tiếp 2 lượt đặt chỗ.',
  );
  assert.equal(
    getExpireHoldsSuccessMessage({}),
    'Đã xử lý 0 lượt giữ chỗ hết hạn và chuyển tiếp 0 lượt đặt chỗ.',
  );
});

```

- [ ] **Step 2: Run the new tests and verify they fail**

Run:

```powershell
node --test frontend/test/reservationFrontend.test.js
```

Expected: FAIL because `NOTIFIED` is still unmapped and `reservationViewState.js` does not exist.

- [ ] **Step 3: Implement the canonical status mappings**

In `frontend/src/utils/libraryFeatureViewModels.js`, replace the opening FE08 status block with:

```js
export function statusToUi(status, { notifiedAt, expiresAt } = {}) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACTIVE' && notifiedAt) return 'Ready to pick up';
  if (normalized === 'ACTIVE') return 'Waiting';
  if (normalized === 'NOTIFIED') return 'Ready to pick up';
  if (normalized === 'FULFILLED') return 'Completed';
  if (normalized === 'CANCELLED') return 'Cancelled';
  if (normalized === 'EXPIRED') return 'Expired';
  if (normalized === 'PENDING' || normalized === 'REQUESTED') return 'Pending';
```

Leave the existing mappings after `PENDING` unchanged.

- [ ] **Step 4: Implement focused reservation view helpers**

Create `frontend/src/utils/reservationViewState.js`:

```js
const ACTIVE_QUEUE_STATUSES = new Set(['Waiting', 'Ready to pick up']);

export function isActiveReservationQueueStatus(status) {
  return ACTIVE_QUEUE_STATUSES.has(status);
}

export function getExpireHoldsSuccessMessage({ expiredCount = 0, promoted = [] } = {}) {
  const normalizedExpiredCount = Number(expiredCount) || 0;
  const promotedCount = Array.isArray(promoted) ? promoted.length : 0;
  return `Đã xử lý ${normalizedExpiredCount} lượt giữ chỗ hết hạn và chuyển tiếp ${promotedCount} lượt đặt chỗ.`;
}
```

- [ ] **Step 5: Run only the pure helper tests**

Run:

```powershell
node --test frontend/test/reservationFrontend.test.js
```

Expected: all 3 tests PASS.

- [ ] **Step 6: Commit the state boundary**

```powershell
git add -- frontend/src/utils/libraryFeatureViewModels.js frontend/src/utils/reservationViewState.js frontend/test/reservationFrontend.test.js
git commit -m "fix: align FE08 reservation view states"
```

---

### Task 2: Reservation-Specific Errors And API Contract

**Files:**
- Modify: `frontend/test/apiErrorMessages.test.js`
- Modify: `frontend/src/api/apiErrorMessages.js`
- Modify: `frontend/src/api/libraryFeatureApi.js:82,113`

**Interfaces:**
- Consumes: backend error shape `{ error: { code, message, details } }` and existing `authorizedRequest(config, fallbackMessage, resolver)`.
- Produces: `getReservationErrorMessage(error, fallback)`, `authorizedReservationRequest(config, fallbackMessage)`, and `reservationApi.expireHolds()` returning `{ expiredCount, expired, promoted }`.

- [ ] **Step 1: Add failing FE08 error-mapping and API contract tests**

Append to `frontend/test/apiErrorMessages.test.js`:

```js
const expectedReservationMessages = {
  MEMBER_ROLE_REQUIRED: 'Chỉ tài khoản thành viên mới được đặt chỗ sách.',
  STAFF_ROLE_REQUIRED: 'Chỉ thủ thư hoặc admin mới được quản lý hàng đợi đặt chỗ.',
  ROLE_REQUIRED: 'Tài khoản hiện tại không có quyền thực hiện thao tác đặt chỗ này.',
  MEMBER_NOT_FOUND: 'Tài khoản hiện tại chưa có hồ sơ thành viên. Vui lòng liên hệ thủ thư/admin.',
  MEMBER_ACCOUNT_INACTIVE: 'Tài khoản của bạn chưa được kích hoạt nên chưa thể đặt chỗ sách.',
  MEMBERSHIP_NOT_APPROVED: 'Membership của bạn chưa được duyệt nên chưa thể đặt chỗ sách.',
  COPY_NOT_FOUND: 'Không tìm thấy bản sao sách này. Vui lòng tải lại dữ liệu và thử lại.',
  COPY_AVAILABLE: 'Bản sao này đang sẵn có. Vui lòng mượn sách thay vì đặt chỗ.',
  RESERVATION_NOT_ALLOWED: 'Không thể đặt chỗ bản sao ở trạng thái hiện tại.',
  DUPLICATE_ACTIVE_RESERVATION: 'Bạn đã có một lượt đặt chỗ đang hoạt động cho bản sao này.',
  ACTIVE_RESERVATION_LIMIT: 'Bạn đã đạt giới hạn 3 lượt đặt chỗ đang hoạt động.',
  RESERVATION_NOT_FOUND: 'Không tìm thấy lượt đặt chỗ này. Vui lòng tải lại dữ liệu.',
  RESERVATION_OWNER_REQUIRED: 'Bạn chỉ có thể hủy lượt đặt chỗ của chính mình.',
  RESERVATION_NOT_ACTIVE: 'Lượt đặt chỗ này không còn ở trạng thái cho phép thực hiện thao tác.',
  COPY_NOT_AVAILABLE: 'Bản sao chưa sẵn sàng để xử lý hàng đợi đặt chỗ.',
  COPY_MISMATCH: 'Bản sao được chọn không khớp với lượt đặt chỗ.',
  INVALID_ID: 'Mã đặt chỗ hoặc bản sao không hợp lệ.',
};

test('maps FE08 API error codes to actionable Vietnamese messages', async () => {
  const { getReservationErrorMessage } = await loadApiErrorMessages();

  assert.equal(typeof getReservationErrorMessage, 'function');
  for (const [code, message] of Object.entries(expectedReservationMessages)) {
    assert.equal(
      getReservationErrorMessage({ response: { status: 400, data: { error: { code } } } }),
      message,
      code,
    );
  }
});

test('keeps FE08 messages isolated from borrowing and generic feature APIs', async () => {
  const { getBorrowingErrorMessage, getLibraryFeatureErrorMessage } = await loadApiErrorMessages();
  const error = {
    response: {
      status: 409,
      data: { error: { code: 'ACTIVE_RESERVATION_LIMIT', message: 'Backend reservation message.' } },
    },
  };

  assert.equal(getBorrowingErrorMessage(error, 'Fallback'), 'Backend reservation message.');
  assert.equal(getLibraryFeatureErrorMessage(error, 'Fallback'), 'Backend reservation message.');
});
```

Add this import beside the existing imports in `frontend/test/reservationFrontend.test.js`:

```js
import { readFile } from 'node:fs/promises';
```

Append this API contract test:

```js
test('reservation API exposes the existing hold-expiration endpoint', async () => {
  const source = await readFile(
    new URL('../src/api/libraryFeatureApi.js', import.meta.url),
    'utf8',
  );

  assert.match(
    source,
    /expireHolds\(\)\s*{[\s\S]*?method: 'post', url: '\/reservations\/expire-holds'/,
  );
});
```

- [ ] **Step 2: Run the error tests and verify the new test fails**

Run:

```powershell
node --test frontend/test/apiErrorMessages.test.js frontend/test/reservationFrontend.test.js
```

Expected: FAIL because `getReservationErrorMessage` is not exported and `reservationApi.expireHolds()` does not exist.

- [ ] **Step 3: Implement the FE08 resolver**

In `frontend/src/api/apiErrorMessages.js`, add:

```js
const RESERVATION_ERROR_MESSAGES = {
  MEMBER_ROLE_REQUIRED: 'Chỉ tài khoản thành viên mới được đặt chỗ sách.',
  STAFF_ROLE_REQUIRED: 'Chỉ thủ thư hoặc admin mới được quản lý hàng đợi đặt chỗ.',
  ROLE_REQUIRED: 'Tài khoản hiện tại không có quyền thực hiện thao tác đặt chỗ này.',
  MEMBER_NOT_FOUND: 'Tài khoản hiện tại chưa có hồ sơ thành viên. Vui lòng liên hệ thủ thư/admin.',
  MEMBER_ACCOUNT_INACTIVE: 'Tài khoản của bạn chưa được kích hoạt nên chưa thể đặt chỗ sách.',
  MEMBERSHIP_NOT_APPROVED: 'Membership của bạn chưa được duyệt nên chưa thể đặt chỗ sách.',
  COPY_NOT_FOUND: 'Không tìm thấy bản sao sách này. Vui lòng tải lại dữ liệu và thử lại.',
  COPY_AVAILABLE: 'Bản sao này đang sẵn có. Vui lòng mượn sách thay vì đặt chỗ.',
  RESERVATION_NOT_ALLOWED: 'Không thể đặt chỗ bản sao ở trạng thái hiện tại.',
  DUPLICATE_ACTIVE_RESERVATION: 'Bạn đã có một lượt đặt chỗ đang hoạt động cho bản sao này.',
  ACTIVE_RESERVATION_LIMIT: 'Bạn đã đạt giới hạn 3 lượt đặt chỗ đang hoạt động.',
  RESERVATION_NOT_FOUND: 'Không tìm thấy lượt đặt chỗ này. Vui lòng tải lại dữ liệu.',
  RESERVATION_OWNER_REQUIRED: 'Bạn chỉ có thể hủy lượt đặt chỗ của chính mình.',
  RESERVATION_NOT_ACTIVE: 'Lượt đặt chỗ này không còn ở trạng thái cho phép thực hiện thao tác.',
  COPY_NOT_AVAILABLE: 'Bản sao chưa sẵn sàng để xử lý hàng đợi đặt chỗ.',
  COPY_MISMATCH: 'Bản sao được chọn không khớp với lượt đặt chỗ.',
  INVALID_ID: 'Mã đặt chỗ hoặc bản sao không hợp lệ.',
};

export function getReservationErrorMessage(error, fallback) {
  const code = error.response?.data?.error?.code;
  const shouldUseGenericMessage = !error.response || code === 'UNAUTHORIZED' || error.response?.status === 401;

  if (!shouldUseGenericMessage && RESERVATION_ERROR_MESSAGES[code]) {
    return RESERVATION_ERROR_MESSAGES[code];
  }

  return getLibraryFeatureErrorMessage(error, fallback);
}
```

Keep `BORROWING_ERROR_MESSAGES`, `getBorrowingErrorMessage()`, and the generic resolver behavior unchanged.

- [ ] **Step 4: Route only reservation requests through the FE08 resolver**

Update the import and add a wrapper in `frontend/src/api/libraryFeatureApi.js`:

```js
import {
  getBorrowingErrorMessage,
  getLibraryFeatureErrorMessage,
  getReservationErrorMessage,
} from './apiErrorMessages';

function authorizedReservationRequest(config, fallbackMessage) {
  return authorizedRequest(config, fallbackMessage, getReservationErrorMessage);
}
```

Replace the existing `reservationApi` object with:

```js
export const reservationApi = {
  create(copyId) {
    return authorizedReservationRequest({ method: 'post', url: '/reservations', data: { copyId } }, 'Không thể đặt chỗ sách.');
  },
  listMine(params = {}) {
    return authorizedReservationRequest({ method: 'get', url: '/reservations/me', params }, 'Không thể tải đặt chỗ của bạn.');
  },
  cancel(reservationId, reason = 'Cancelled by member') {
    return authorizedReservationRequest({ method: 'patch', url: `/reservations/${reservationId}/cancel`, data: { reason } }, 'Không thể hủy đặt chỗ.');
  },
  listAll(params = {}) {
    return authorizedReservationRequest({ method: 'get', url: '/reservations', params }, 'Không thể tải danh sách đặt chỗ.');
  },
  processQueue(copyId) {
    return authorizedReservationRequest({ method: 'post', url: '/reservations/process-queue', data: { copyId } }, 'Không thể xử lý hàng đợi đặt chỗ.');
  },
  process(reservationId, data = {}) {
    return authorizedReservationRequest({ method: 'patch', url: `/reservations/${reservationId}/process`, data }, 'Không thể xử lý đặt chỗ.');
  },
  expireHolds() {
    return authorizedReservationRequest(
      { method: 'post', url: '/reservations/expire-holds' },
      'Không thể xử lý các lượt giữ chỗ hết hạn.',
    );
  },
};
```

- [ ] **Step 5: Run FE07 and FE08 error tests together**

Run:

```powershell
node --test frontend/test/apiErrorMessages.test.js frontend/test/reservationFrontend.test.js
```

Expected: all matching FE07, FE08, fallback, and isolation tests PASS.

- [ ] **Step 6: Run lint on the changed API files**

Run:

```powershell
npm.cmd --prefix frontend exec -- eslint src/api/apiErrorMessages.js src/api/libraryFeatureApi.js test/apiErrorMessages.test.js
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 7: Commit the FE08 API boundary**

```powershell
git add -- frontend/src/api/apiErrorMessages.js frontend/src/api/libraryFeatureApi.js frontend/test/apiErrorMessages.test.js frontend/test/reservationFrontend.test.js
git commit -m "fix: localize FE08 reservation API errors"
```

---

### Task 3: Librarian Hold-Expiration Workflow

**Files:**
- Modify: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx:7-143`
- Test: `frontend/test/reservationFrontend.test.js`

**Interfaces:**
- Consumes: `reservationApi.expireHolds()`, `isActiveReservationQueueStatus(status)`, and `getExpireHoldsSuccessMessage(result)` from Tasks 1-2.
- Produces: a staff action that reports expired/promoted counts and then calls `loadReservations()` to restore canonical server state.

- [ ] **Step 1: Add and run the failing page contract test**

Append this test to `frontend/test/reservationFrontend.test.js`:

```js
test('librarian page uses the server expiration flow and omits local-only actions', async () => {
  const source = await readFile(
    new URL('../src/page/reservation/ReservationsLibrarianPage.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /reservationApi\.expireHolds\(\)/);
  assert.match(source, /isActiveReservationQueueStatus\(item\.status\)/);
  assert.match(source, /getExpireHoldsSuccessMessage\(result\)/);
  assert.doesNotMatch(source, /function fulfill\(/);
  assert.doesNotMatch(source, /function remove\(/);
  assert.doesNotMatch(source, /> Đã giao</);
  assert.doesNotMatch(source, /title="Xóa"/);
});
```

Run:

```powershell
node --test --test-name-pattern="librarian page" frontend/test/reservationFrontend.test.js
```

Expected: FAIL because the page does not call `expireHolds()`, still defines `fulfill()`/`remove()`, and still renders `Đã giao`/`Xóa` controls.

- [ ] **Step 2: Replace imports and add expiration state**

In `ReservationsLibrarianPage.jsx`:

```js
import { Search, CalendarClock, Bell, PackageCheck, ChevronLeft, ChevronRight, Send, RefreshCw } from 'lucide-react';

import {
  getExpireHoldsSuccessMessage,
  isActiveReservationQueueStatus,
} from '../../utils/reservationViewState';
```

Add beside the existing loading state:

```js
const [expiringHolds, setExpiringHolds] = useState(false);
```

- [ ] **Step 3: Restrict the active queue to active FE08 states**

Replace the queue calculation with:

```js
const queue = useMemo(
  () => rows
    .filter((item) => item.book === queueBook && isActiveReservationQueueStatus(item.status))
    .sort((a, b) => a.queue - b.queue),
  [rows, queueBook],
);
```

- [ ] **Step 4: Add the server-backed expiration handler**

Add after `confirmNotify()` and remove the existing `fulfill()` and `remove()` functions:

```js
async function expireHolds() {
  setExpiringHolds(true);
  try {
    const result = await reservationApi.expireHolds();
    showToast(getExpireHoldsSuccessMessage(result), 'success');
    await loadReservations();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setExpiringHolds(false);
  }
}
```

- [ ] **Step 5: Expose the command and remove unsupported controls**

Replace the `AppLayout` actions prop with:

```jsx
actions={(
  <div className="row-flex" style={{ flexWrap: 'wrap' }}>
    <button
      className="btn btn-outline"
      onClick={expireHolds}
      disabled={loading || expiringHolds || isDemo}
    >
      <CalendarClock size={16} />
      {expiringHolds ? 'Đang xử lý...' : 'Xử lý giữ chỗ hết hạn'}
    </button>
    <button className="btn btn-outline" onClick={loadReservations} disabled={loading || expiringHolds}>
      <RefreshCw size={16} /> Tải lại
    </button>
  </div>
)}
```

In each queue row, keep only the supported notify action:

```jsx
<div className="queue-actions">
  {index === 0 && item.status !== 'Ready to pick up' && (
    <button className="btn btn-outline btn-sm" onClick={() => setNotifyTarget(item)}>
      <Bell size={13} /> Báo nhận
    </button>
  )}
</div>
```

- [ ] **Step 6: Run the page contract and helper tests**

Run:

```powershell
node --test frontend/test/reservationFrontend.test.js
```

Expected: all 4 matching tests PASS.

- [ ] **Step 7: Run focused lint and production build**

Run:

```powershell
npm.cmd --prefix frontend exec -- eslint src/page/reservation/ReservationsLibrarianPage.jsx src/utils/reservationViewState.js test/reservationFrontend.test.js
npm.cmd --prefix frontend run build
```

Expected: ESLint exits 0 and Vite production build completes successfully.

- [ ] **Step 8: Commit the librarian workflow**

```powershell
git add -- frontend/src/page/reservation/ReservationsLibrarianPage.jsx frontend/test/reservationFrontend.test.js
git commit -m "fix: connect FE08 hold expiration workflow"
```

---

### Task 4: FE08 Planning And Traceability Documents

**Files:**
- Modify: `.sdd/specs/feat-reservation-management/PLAN.md`
- Modify: `.sdd/specs/feat-reservation-management/TASKS.md`
- Modify: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Interfaces:**
- Consumes: approved design and verification evidence from Tasks 1-3.
- Produces: current FE08 scope, task-to-requirement mapping, and a dated change record.

- [ ] **Step 1: Correct the FE08 plan scope**

Update `PLAN.md` metadata to `Updated: 2026-07-13`. Replace the backend-only framing with:

```markdown
## 1. Scope

Maintain the approved Phase 1 FE08 backend and frontend reservation slice from `SPEC.md`.

Included:

- Existing member and staff reservation APIs and frontend screens.
- Canonical rendering of the approved FE08 reservation lifecycle.
- Reservation-specific Vietnamese API errors.
- Manual staff queue processing and manual hold-expiration processing.
- Server-backed refresh after hold expiration.

Not included:

- FE07 borrow/return or fulfillment implementation.
- FE10 email delivery worker changes.
- Server-side reservation pagination.
- Automatic queue processing or hold-expiration jobs.
```

Add a `3.6 Frontend Correctness` subsection:

```markdown
### 3.6 Frontend Correctness

- Map `NOTIFIED` to ready for pickup and `FULFILLED` to completed.
- Keep terminal reservations out of active librarian queues.
- Use a reservation-only Vietnamese error resolver.
- Expose the existing hold-expiration endpoint to staff and reload server state after success.
- Do not expose local-only fulfillment or deletion controls.
```

Update Review Notes so they no longer claim frontend screens are excluded.

- [ ] **Step 2: Add correctness tasks and traceability**

In `TASKS.md`, update `Updated: 2026-07-13` and add:

```markdown
## 4. Frontend Correctness Tasks

- [x] FE08-T22 Map `NOTIFIED` and `FULFILLED` to canonical UI states.
- [x] FE08-T23 Exclude terminal reservations from active librarian queues.
- [x] FE08-T24 Add reservation-specific Vietnamese API errors without affecting other APIs.
- [x] FE08-T25 Connect staff hold-expiration processing to `POST /api/reservations/expire-holds`.
- [x] FE08-T26 Remove local-only fulfillment and deletion controls.
- [x] FE08-T27 Add focused frontend regression tests for lifecycle, error isolation, and page contract.
```

Renumber the following sections, and add these traceability rows:

```markdown
| FR-FE08-005 | FE08-T17, FE08-T19, FE08-T23 |
| FR-FE08-007 | FE08-T18, FE08-T22, FE08-T23 |
| FR-FE08-009 | FE08-T22, FE08-T23, FE08-T27 |
| FR-FE08-017 | FE08-T24, FE08-T27 |
| FR-FE08-019 | FE08-T25, FE08-T27 |
| NFR-FE08-UX-001 | FE08-T21, FE08-T24, FE08-T27 |
```

Replace the validation checklist with the exact commands actually run during Task 5 and mark only passing commands as complete.

- [ ] **Step 3: Add the changelog entry**

Add at the top of `CHANGELOG.md` after the title:

```markdown
## 2026-07-13 - Frontend Correctness Aligned With Approved Lifecycle

- Mapped `NOTIFIED` to ready for pickup and `FULFILLED` to completed in the shared frontend view model.
- Added reservation-specific Vietnamese API errors without changing FE07 or generic API behavior.
- Connected the librarian UI to the existing `POST /api/reservations/expire-holds` endpoint and reloads canonical server state after success.
- Removed local-only fulfillment and deletion controls that did not persist backend state.
- Added focused frontend tests and refreshed FE08 plan/task traceability.
- No backend contract, database schema, FE07 fulfillment, FE10 delivery, or pagination changes.
```

- [ ] **Step 4: Validate documentation consistency**

Run:

```powershell
rg -n "backend-only|Frontend reservation screens|FE08-T2[2-7]|FR-FE08-019|Frontend Correctness Aligned" .sdd/specs/feat-reservation-management/PLAN.md .sdd/specs/feat-reservation-management/TASKS.md .sdd/specs/feat-reservation-management/CHANGELOG.md
```

Expected: no stale backend-only/excluded-frontend statement; task IDs `FE08-T22` through `FE08-T27`, `FR-FE08-019`, and the dated changelog heading are present.

- [ ] **Step 5: Commit FE08 documentation**

```powershell
git add -- .sdd/specs/feat-reservation-management/PLAN.md .sdd/specs/feat-reservation-management/TASKS.md .sdd/specs/feat-reservation-management/CHANGELOG.md
git commit -m "docs: refresh FE08 frontend traceability"
```

---

### Task 5: Full Verification And Review

**Files:**
- Verify only; modify files only if a discovered defect is directly within the approved FE08 scope.

**Interfaces:**
- Consumes: all changes from Tasks 1-4.
- Produces: test, lint, build, backend regression, scope, and review evidence suitable for a pull request.

- [ ] **Step 1: Run the complete frontend test suite**

```powershell
npm.cmd --prefix frontend test
```

Expected: all frontend Node tests PASS.

- [ ] **Step 2: Run the complete frontend lint suite**

```powershell
npm.cmd --prefix frontend run lint
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: Run the frontend production build**

```powershell
npm.cmd --prefix frontend run build
```

Expected: Vite completes successfully and writes `frontend/dist/`.

- [ ] **Step 4: Run backend regression tests**

```powershell
npm.cmd --prefix backend test
```

Expected: all Jest suites PASS, including reservation expiration and promotion tests.

- [ ] **Step 5: Inspect scope and whitespace**

```powershell
git diff main...HEAD --check
git diff main...HEAD --stat
git status --short
```

Expected: only FE08 frontend, tests, approved design/plan docs, and FE08 spec docs are tracked changes; `backend/coverage/` and `docs/briefing-thuyet-trinh-du-an-vi.docx` remain untracked and untouched.

- [ ] **Step 6: Review against the approved design**

Invoke `superpowers:requesting-code-review`. Review specifically for:

```text
- NOTIFIED and FULFILLED lifecycle correctness
- reservation error isolation
- POST /api/reservations/expire-holds request shape
- reload-after-success behavior
- absence of local-only fulfill/delete actions
- no FE07, pagination, schema, or backend contract expansion
```

Expected: no unresolved high- or medium-severity findings. Fix any in-scope finding with a focused test and commit before continuing.

- [ ] **Step 7: Record final verification evidence in TASKS.md if counts changed**

Update only the validation lines in `.sdd/specs/feat-reservation-management/TASKS.md` with the actual passing frontend/backend test counts, then run:

```powershell
git add -- .sdd/specs/feat-reservation-management/TASKS.md
git commit -m "docs: record FE08 verification evidence"
```

Expected: either one verification-evidence commit is created, or no commit is needed because Task 4 already recorded the final exact counts.

- [ ] **Step 8: Prepare the branch for user review**

```powershell
git status --short --branch
git log --oneline main..HEAD
```

Expected: branch is `fix/fe08-frontend-correctness`, tracked worktree is clean, unrelated untracked files remain, and the commit list contains small FE08-only commits.
