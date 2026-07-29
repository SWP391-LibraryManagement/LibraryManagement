# FE07-FE08-FE10-FE12 Clean-Code Review-Safe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve reviewability of FE07, FE08, FE10, and FE12 without changing business behavior, API contracts, SQL schema, UI routes, or Azure runtime configuration.

**Architecture:** Extract only pure access, mapping, sanitization, and report-projection logic from large services/repositories. Keep SQL, transactions, orchestration, state transitions, and public exports in their current owners. Stabilize the FE08 loader with a callback/ref boundary that removes the existing hook warning without adding a reload loop.

**Tech Stack:** Node.js 22, CommonJS backend, Express, Jest, React 19, Vite, ESLint, Node built-in frontend tests.

## Global Constraints

- Baseline is `origin/main@7dc563a95ff178239a90e47fe1899e21c24a49ef`.
- Preserve all FE07/FE08/FE10/FE12 API request/response shapes and error codes.
- Preserve SQL query text, locks, transaction ordering, audit ordering, schema, and Azure configuration.
- Preserve `Asia/Ho_Chi_Minh` business-date semantics.
- Preserve FE10 post-commit notification behavior and FE08 stale-handoff behavior.
- Add no dependency and perform no unrelated formatting or shared-shell refactor.
- Follow RED-GREEN for every production extraction.
- Do not commit generated production changes until the complete diff passes H2.

---

### Task 1: Extract the shared feature-access boundary

**Files:**

- Create: `backend/src/utils/featureAccess.js`
- Create: `backend/tests/featureAccess.test.js`
- Modify: `backend/src/services/borrowingService.js`
- Modify: `backend/src/services/reservationService.js`
- Modify: `backend/src/services/notificationService.js`
- Modify: `backend/src/services/reportService.js`

**Interfaces:**

- Produces: `normalizeRole(role)`, `hasAnyRole(user, allowedRoles)`, and `toPositiveInteger(value, fieldName)`.
- Consumers keep their current role lists and error handling.
- `toPositiveInteger` keeps error code `INVALID_ID` and the existing English message.

- [ ] **Step 1: Write the failing utility test**

```js
const {
  normalizeRole,
  hasAnyRole,
  toPositiveInteger,
} = require('../src/utils/featureAccess');

describe('featureAccess', () => {
  test('normalizes roles without changing the caller role policy', () => {
    expect(normalizeRole(' librarian ')).toBe(' LIBRARIAN ');
    expect(hasAnyRole({ roles: ['member', 'LIBRARIAN'] }, ['admin', 'librarian'])).toBe(true);
    expect(hasAnyRole({ roles: ['MEMBER'] }, ['ADMIN', 'LIBRARIAN'])).toBe(false);
  });

  test('keeps the canonical positive ID validation error', () => {
    expect(toPositiveInteger('12', 'copyId')).toBe(12);
    try {
      toPositiveInteger(0, 'copyId');
      throw new Error('Expected invalid ID rejection.');
    } catch (error) {
      expect(error).toMatchObject({ statusCode: 400, code: 'INVALID_ID' });
      expect(error.message).toBe('copyId must be a positive integer.');
    }
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `npm --prefix backend test -- --runInBand tests/featureAccess.test.js`

Expected: FAIL because `backend/src/utils/featureAccess.js` does not exist.

- [ ] **Step 3: Add the minimal utility**

```js
const errors = require('./safeErrors');

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function hasAnyRole(user, allowedRoles) {
  const currentRoles = Array.isArray(user?.roles) ? user.roles.map(normalizeRole) : [];
  return allowedRoles.map(normalizeRole).some((role) => currentRoles.includes(role));
}

function toPositiveInteger(value, fieldName) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw errors.badRequest('INVALID_ID', `${fieldName} must be a positive integer.`);
  }
  return numberValue;
}

module.exports = { normalizeRole, hasAnyRole, toPositiveInteger };
```

Remove only the identical local definitions. Import
`hasAnyRole`/`toPositiveInteger` in FE07 and FE08; import `hasAnyRole` in FE10
and FE12.

- [ ] **Step 4: Verify GREEN and feature authorization**

Run:

```powershell
npm --prefix backend test -- --runInBand tests/featureAccess.test.js tests/borrowingRoutes.test.js tests/reservationRoutes.test.js tests/notificationRoutes.test.js tests/reportRoutes.test.js
```

Expected: all selected suites PASS with unchanged role/error assertions.

- [ ] **Step 5: Review checkpoint**

Run: `git diff --check`

Expected: no whitespace error. Leave the product diff uncommitted.

### Task 2: Extract FE07 borrowing projections

**Files:**

- Create: `backend/src/utils/borrowingProjection.js`
- Create: `backend/tests/borrowingProjection.test.js`
- Modify: `backend/src/repositories/borrowingRepository.js`

**Interfaces:**

- Produces: `mapCopy`, `mapBorrowability`, `mapMember`, `toDateOnly`,
  `toExclusiveNextDay`, `mapBorrowDetail`, and `mapBorrowRequests`.
- FE07 repository exports, SQL, transaction methods, and returned JSON fields
  remain unchanged.

- [ ] **Step 1: Write failing projection tests**

```js
const {
  mapBorrowability,
  mapBorrowDetail,
  mapBorrowRequests,
  toExclusiveNextDay,
} = require('../src/utils/borrowingProjection');

const row = {
  RequestId: 10,
  UserId: 3,
  RequestStatus: 'APPROVED',
  BorrowDetailId: 20,
  CopyId: 30,
  BookId: 40,
  Barcode: 'BC-30',
  CopyStatus: 'BORROWED',
  BookStatus: 'ACTIVE',
  DetailStatus: 'BORROWED',
  BorrowDate: '2026-07-01T00:00:00.000Z',
  DueDate: '2026-07-15T00:00:00.000Z',
  HasMemberRole: 1,
  ActiveReservationId: 50,
};

test('maps FE07 rows without inventing fields', () => {
  expect(mapBorrowability(row)).toMatchObject({
    copyId: 30,
    bookId: 40,
    hasActiveReservation: true,
  });
  expect(mapBorrowDetail(row)).toMatchObject({
    borrowDetailId: 20,
    borrowDate: '2026-07-01',
    dueDate: '2026-07-15',
    status: 'BORROWED',
  });
  expect(mapBorrowRequests([row])).toHaveLength(1);
});

test('keeps FE07 exclusive end-date calculation in UTC', () => {
  expect(toExclusiveNextDay('2026-07-15T00:00:00.000Z').toISOString())
    .toBe('2026-07-16T00:00:00.000Z');
});
```

- [ ] **Step 2: Verify RED**

Run: `npm --prefix backend test -- --runInBand tests/borrowingProjection.test.js`

Expected: FAIL because the projection module does not exist.

- [ ] **Step 3: Move the existing pure functions verbatim**

Move the seven existing functions from `borrowingRepository.js` into
`borrowingProjection.js`. Keep the current `// @spec FR-FE07-029` annotation
on `mapBorrowDetail`. Export the seven names and import them at the repository
top:

```js
function mapCopy(row) {
  if (!row || !row.CopyId) return null;
  return {
    copyId: row.CopyId,
    bookId: row.BookId,
    barcode: row.Barcode,
    status: row.CopyStatus,
    bookStatus: row.BookStatus,
    location: row.Location,
    title: row.Title,
    author: row.AuthorName,
  };
}

function mapBorrowability(row) {
  const copy = mapCopy(row);
  if (!copy) return null;
  return {
    ...copy,
    hasActiveReservation: Boolean(row.ActiveReservationId),
    notifiedReservationId: row.NotifiedReservationId || null,
    notifiedReservationUserId: row.NotifiedReservationUserId || null,
  };
}

function mapMember(row) {
  return {
    userId: row.UserId,
    username: row.Username,
    fullName: row.FullName,
    email: row.Email,
    phone: row.Phone,
    memberId: row.MemberId,
    status: row.UserStatus,
    hasMemberRole: Boolean(row.HasMemberRole),
  };
}

function toDateOnly(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : null;
}

function toExclusiveNextDay(value) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

// @spec FR-FE07-029
function mapBorrowDetail(row) {
  if (!row || !row.BorrowDetailId) return null;
  return {
    borrowDetailId: row.BorrowDetailId,
    requestId: row.RequestId,
    userId: row.UserId,
    copyId: row.CopyId,
    borrowDate: toDateOnly(row.BorrowDate),
    dueDate: toDateOnly(row.DueDate),
    returnDate: toDateOnly(row.ReturnDate),
    renewalCount: row.RenewalCount,
    requestStatus: row.RequestStatus,
    status: row.DetailStatus,
    requestDate: row.RequestDate,
    approvedAt: row.ApprovedAt,
    rejectedAt: row.RejectedAt,
    processedAt: row.ProcessedAt,
    requestCreatedAt: row.RequestCreatedAt,
    requestUpdatedAt: row.RequestUpdatedAt,
    createdAt: row.DetailCreatedAt,
    updatedAt: row.DetailUpdatedAt,
    member: mapMember(row),
    copy: mapCopy(row),
  };
}

function mapBorrowRequests(rows) {
  const requestsById = new Map();
  for (const row of rows) {
    if (!requestsById.has(row.RequestId)) {
      requestsById.set(row.RequestId, {
        requestId: row.RequestId,
        userId: row.UserId,
        requestDate: row.RequestDate,
        status: row.RequestStatus,
        createdBy: row.CreatedBy,
        approvedBy: row.ApprovedBy,
        approvedAt: row.ApprovedAt,
        rejectedAt: row.RejectedAt,
        processedAt: row.ProcessedAt,
        createdAt: row.RequestCreatedAt,
        updatedAt: row.RequestUpdatedAt,
        member: mapMember(row),
        details: [],
      });
    }
    const detail = mapBorrowDetail(row);
    if (detail) requestsById.get(row.RequestId).details.push(detail);
  }
  return Array.from(requestsById.values());
}

module.exports = {
  mapCopy,
  mapBorrowability,
  mapMember,
  toDateOnly,
  toExclusiveNextDay,
  mapBorrowDetail,
  mapBorrowRequests,
};
```

Then import the repository consumers:

```js
const {
  mapBorrowability,
  mapBorrowDetail,
  mapBorrowRequests,
  toExclusiveNextDay,
} = require('../utils/borrowingProjection');
```

Import only functions used directly by the repository; internal projection
functions remain private to the new utility where possible.

- [ ] **Step 4: Verify GREEN and repository behavior**

Run:

```powershell
npm --prefix backend test -- --runInBand tests/borrowingProjection.test.js tests/borrowingRepository.test.js tests/borrowingRoutes.test.js
```

Expected: all selected suites PASS.

- [ ] **Step 5: Review checkpoint**

Run: `git diff --check`

Expected: no whitespace error. Leave the product diff uncommitted.

### Task 3: Extract FE10 notification policy

**Files:**

- Create: `backend/src/utils/notificationPolicy.js`
- Create: `backend/tests/notificationPolicy.test.js`
- Modify: `backend/src/services/notificationService.js`

**Interfaces:**

- Produces: `normalizePayloadKey`, `containsSensitivePayloadKey`,
  `sanitizePayload`, `normalizeSourceFeature`, `isValidRecipientEmail`,
  `isSensitiveQueueNotification`, `extractVariables`,
  `validateStoredTemplateDefinition`, and `renderTemplate`.
- `notificationService.js` continues to export `sanitizePayload`.
- Delivery, persistence, retry, audit, and service factory interfaces remain
  unchanged.

- [ ] **Step 1: Write failing policy tests**

```js
const {
  containsSensitivePayloadKey,
  sanitizePayload,
  validateStoredTemplateDefinition,
  renderTemplate,
} = require('../src/utils/notificationPolicy');

test('detects and redacts nested sensitive notification data', () => {
  const payload = { profile: { reset_token: 'secret', name: '<b>Nhat</b>' } };
  expect(containsSensitivePayloadKey(payload)).toBe(true);
  expect(sanitizePayload(payload)).toEqual({
    profile: { reset_token: '[REDACTED]', name: 'bNhat/b' },
  });
});

test('rejects unsafe stored templates and renders safe text', () => {
  try {
    validateStoredTemplateDefinition({
      subject: 'Hello',
      body: '<script>alert(1)</script>',
    });
    throw new Error('Expected unsafe template rejection.');
  } catch (error) {
    expect(error).toMatchObject({
      statusCode: 400,
      code: 'UNSAFE_TEMPLATE_DEFINITION',
    });
  }
  expect(renderTemplate('Hello {{ name }}', { name: '<Nhat>' })).toBe('Hello Nhat');
});
```

- [ ] **Step 2: Verify RED**

Run: `npm --prefix backend test -- --runInBand tests/notificationPolicy.test.js`

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Move the pure policy verbatim**

Move `sensitiveQueueIdentifiers`, `sensitiveKeyFragments`, and the nine
interface functions from `notificationService.js` into
`notificationPolicy.js`. Keep `safeInternalError` and
`isUniqueConstraintViolation` in the service because they belong to service
orchestration.

Create the policy with the exact existing behavior:

```js
const errors = require('./safeErrors');

const sensitiveQueueIdentifiers = new Set([
  'ACCOUNT_VERIFICATION',
  'PASSWORD_RESET',
  'ACCOUNT_SETUP',
  'EMAIL_VERIFY',
]);
const sensitiveKeyFragments = [
  'token',
  'otp',
  'password',
  'verificationlink',
  'resetlink',
  'setuplink',
];

function sanitizeString(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/[<>]/g, '');
}

function normalizePayloadKey(key) {
  return String(key || '').toLowerCase().replace(/[_\-\s]/g, '');
}

function isSensitivePayloadKey(key) {
  const normalizedKey = normalizePayloadKey(key);
  return sensitiveKeyFragments.some((fragment) => normalizedKey.includes(fragment));
}

function containsSensitivePayloadKey(payload) {
  if (Array.isArray(payload)) return payload.some(containsSensitivePayloadKey);
  if (!payload || typeof payload !== 'object') return false;
  return Object.entries(payload).some(
    ([key, value]) => isSensitivePayloadKey(key) || containsSensitivePayloadKey(value)
  );
}

function sanitizePayload(payload) {
  if (Array.isArray(payload)) return payload.map(sanitizePayload);
  if (!payload || typeof payload !== 'object') {
    return typeof payload === 'string' ? sanitizeString(payload) : payload;
  }
  const result = {};
  for (const [key, value] of Object.entries(payload)) {
    result[key] = isSensitivePayloadKey(key) ? '[REDACTED]' : sanitizePayload(value);
  }
  return result;
}

function normalizeSourceFeature(sourceFeature) {
  return String(sourceFeature || '').trim().toUpperCase();
}

function isValidRecipientEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function isSensitiveQueueNotification(notification) {
  return [notification?.type, notification?.templateKey].some((identifier) =>
    sensitiveQueueIdentifiers.has(String(identifier || '').toUpperCase())
  );
}

function extractVariables(templateText) {
  const variables = new Set();
  const pattern = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  let match = pattern.exec(templateText || '');
  while (match) {
    variables.add(match[1]);
    match = pattern.exec(templateText || '');
  }
  return Array.from(variables);
}

function containsUnsafeTemplateDefinition(value) {
  const definition = String(value ?? '');
  return /<\/?[a-z][^>]*>/i.test(definition)
    || /\bon[a-z]+\s*=/i.test(definition)
    || /\bjavascript\s*:/i.test(definition);
}

// @spec BR-FE10-010, FR-FE10-005, FR-FE10-009
function validateStoredTemplateDefinition(template) {
  if (
    containsUnsafeTemplateDefinition(template?.subject)
    || containsUnsafeTemplateDefinition(template?.body)
  ) {
    throw errors.badRequest(
      'UNSAFE_TEMPLATE_DEFINITION',
      'Notification template definition is unsafe.'
    );
  }
}

function renderTemplate(templateText, templateData) {
  return sanitizeString(
    String(templateText || '').replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) =>
      templateData[key] === undefined || templateData[key] === null ? '' : templateData[key]
    )
  );
}

module.exports = {
  normalizePayloadKey,
  containsSensitivePayloadKey,
  sanitizePayload,
  normalizeSourceFeature,
  isValidRecipientEmail,
  isSensitiveQueueNotification,
  extractVariables,
  validateStoredTemplateDefinition,
  renderTemplate,
};
```

At the service top import the exact policy names:

```js
const {
  normalizePayloadKey,
  containsSensitivePayloadKey,
  sanitizePayload,
  normalizeSourceFeature,
  isValidRecipientEmail,
  isSensitiveQueueNotification,
  extractVariables,
  validateStoredTemplateDefinition,
  renderTemplate,
} = require('../utils/notificationPolicy');
```

- [ ] **Step 4: Verify GREEN and FE10 behavior**

Run:

```powershell
npm --prefix backend test -- --runInBand tests/notificationPolicy.test.js tests/notificationRoutes.test.js tests/notificationInboxRepository.test.js
```

Expected: all selected suites PASS with unchanged FE10 error and redaction
contracts.

- [ ] **Step 5: Review checkpoint**

Run: `git diff --check`

Expected: no whitespace error. Leave the product diff uncommitted.

### Task 4: Extract FE12 report projections

**Files:**

- Create: `backend/src/utils/reportProjection.js`
- Create: `backend/tests/reportProjection.test.js`
- Modify: `backend/src/repositories/reportRepository.js`
- Modify: `backend/src/services/reportService.js`

**Interfaces:**

- Produces: `toDateKey`, `normalizeStatus`, `pagination`, `buildReport`,
  `getResultset`, `toCountMap`, and `toExclusiveNextDay`.
- FE12 report envelopes remain `{ metrics, rows, page, limit, totalRows }`.
- The duplicate `requireAdminOrApprovedStaff` wrapper is removed; all four
  report reads continue to call the same `requireStaff` role policy.

- [ ] **Step 1: Write failing projection tests**

```js
const {
  pagination,
  buildReport,
  getResultset,
  toCountMap,
  toExclusiveNextDay,
} = require('../src/utils/reportProjection');

test('keeps FE12 pagination and report envelopes stable', () => {
  expect(pagination({ page: 2, limit: 25 })).toEqual({ page: 2, limit: 25, offset: 25 });
  expect(buildReport({ total: 1 }, [{ id: 1 }], { page: 2, limit: 25 }, 51))
    .toEqual({
      metrics: { total: 1 },
      rows: [{ id: 1 }],
      page: 2,
      limit: 25,
      totalRows: 51,
    });
});

test('keeps FE12 resultset, count, and UTC date projections stable', () => {
  expect(getResultset({ recordsets: [[{ id: 1 }]] }, 0, 0)).toEqual([{ id: 1 }]);
  expect(toCountMap([{ Status: 'active', Count: 2 }], 'Status', 'Count', new Set(['ACTIVE'])))
    .toEqual({ ACTIVE: 2 });
  expect(toExclusiveNextDay('2026-07-15T00:00:00.000Z').toISOString())
    .toBe('2026-07-16T00:00:00.000Z');
});
```

- [ ] **Step 2: Verify RED**

Run: `npm --prefix backend test -- --runInBand tests/reportProjection.test.js`

Expected: FAIL because the projection module does not exist.

- [ ] **Step 3: Move existing pure functions verbatim**

Move the seven existing projection functions from `reportRepository.js` into
`reportProjection.js`, retaining `// @spec FR-FE12-010` on `buildReport`.
Import all seven at the repository top. Remove only
`requireAdminOrApprovedStaff` from `reportService.js` and call `requireStaff`
from `getUserStatistics`.

Create the projection module:

```js
function toDateKey(value) {
  if (value == null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function normalizeStatus(value, allowedStatuses) {
  if (value == null) return null;
  const normalized = String(value).toUpperCase();
  return allowedStatuses.has(normalized) ? normalized : 'UNKNOWN';
}

function pagination(filters = {}) {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  return { page, limit, offset: (page - 1) * limit };
}

// @spec FR-FE12-010
function buildReport(metrics, rows, filters = {}, totalRows = rows.length) {
  const { page, limit } = pagination(filters);
  return { metrics, rows, page, limit, totalRows };
}

function getResultset(result, index, pageIndex) {
  if (Array.isArray(result.recordsets)) return result.recordsets[index] || [];
  return index === pageIndex ? result.recordset || [] : [];
}

function toCountMap(rows, keyName, countName, allowedStatuses) {
  const counts = {};
  for (const row of rows) {
    const key = allowedStatuses
      ? normalizeStatus(row[keyName], allowedStatuses)
      : toDateKey(row[keyName]);
    if (key) counts[key] = (counts[key] || 0) + Number(row[countName] || 0);
  }
  return counts;
}

function toExclusiveNextDay(value) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

module.exports = {
  toDateKey,
  normalizeStatus,
  pagination,
  buildReport,
  getResultset,
  toCountMap,
  toExclusiveNextDay,
};
```

- [ ] **Step 4: Verify GREEN and FE12 behavior**

Run:

```powershell
npm --prefix backend test -- --runInBand tests/reportProjection.test.js tests/reportRepository.test.js tests/reportInMemoryParity.test.js tests/reportRoutes.test.js
```

Expected: all selected suites PASS with unchanged FE12 envelopes and role
errors.

- [ ] **Step 5: Review checkpoint**

Run: `git diff --check`

Expected: no whitespace error. Leave the product diff uncommitted.

### Task 5: Stabilize the FE08 reservation loader

**Files:**

- Modify: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Modify: `frontend/test/reservationFrontend.test.js`

**Interfaces:**

- `loadReservations()` remains the handler for initial load, manual refresh,
  conflict reload, notification reload, and hold-expiration workflow.
- The loader reads the latest selected queue copy through
  `queueCopyIdRef.current`.
- The initial load effect depends on the stable callback and does not run for
  ordinary queue selection changes.

- [ ] **Step 1: Add the failing source contract**

```js
test('FE08 loader has a stable hook boundary without queue-selection reloads', () => {
  const source = read('src/page/reservation/ReservationsLibrarianPage.jsx');
  const loaderStart = source.indexOf('const loadReservations = useCallback');
  const loaderEnd = source.indexOf('\n\n  useEffect(() => {', loaderStart);
  const loaderSource = source.slice(loaderStart, loaderEnd);

  assert.match(source, /useCallback/);
  assert.match(source, /const queueCopyIdRef = useRef\(initialQueueCopyId\)/);
  assert.match(loaderSource, /const loadReservations = useCallback\(async \(\) =>/);
  assert.match(loaderSource, /currentCopyId: queueCopyIdRef\.current/);
  assert.match(loaderSource, /\}, \[\]\);/);
  assert.match(source, /\}, \[loadReservations\]\);/);
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm --prefix frontend test -- --test-name-pattern "stable hook boundary"
```

Expected: FAIL because `loadReservations` is currently an unstable local
function and the effect dependency is empty.

- [ ] **Step 3: Implement the stable callback/ref boundary**

Use the following complete loader shape:

```jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const [queueCopyId, setQueueCopyId] = useState(initialQueueCopyId);
const queueCopyIdRef = useRef(initialQueueCopyId);

useEffect(() => {
  queueCopyIdRef.current = queueCopyId;
}, [queueCopyId]);

const loadReservations = useCallback(async () => {
  setLoading(true);
  setLoadError('');
  try {
    const allReservations = [];
    let page = 1;
    let totalApiPages = 1;

    do {
      const data = await reservationApi.listAll({
        page,
        limit: RESERVATION_API_PAGE_SIZE,
      });
      allReservations.push(...(data.reservations || []));
      totalApiPages = Number(data.pagination?.totalPages || 0);
      page += 1;
    } while (page <= totalApiPages);

    const mapped = allReservations.map(mapReservation);
    setRows(mapped);
    setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
    const handoffState = resolveReservationQueueHandoff({
      pendingCopyId: pendingHandoffCopyId.current,
      currentCopyId: queueCopyIdRef.current,
      reservations: mapped,
    });
    setQueueCopyId(handoffState.queueCopyId);
    setQueueNotice(handoffState.notice);
    if (handoffState.consumePendingHandoff) {
      pendingHandoffCopyId.current = null;
    }
  } catch (error) {
    setRows([]);
    setLoadError(error.message || 'Không thể tải dữ liệu đặt chỗ.');
    setLastUpdated('');
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  const timer = window.setTimeout(loadReservations, 0);
  return () => window.clearTimeout(timer);
}, [loadReservations]);
```

- [ ] **Step 4: Verify GREEN, lint, and FE08 behavior**

Run:

```powershell
npm --prefix frontend test -- --test-name-pattern "stable hook boundary|handoff|reservation"
npm --prefix frontend run lint
```

Expected: focused tests PASS and ESLint reports zero warnings.

- [ ] **Step 5: Review checkpoint**

Run: `git diff --check`

Expected: no whitespace error. Leave the product diff uncommitted.

### Task 6: Full verification and H2 handoff

**Files:** Verify only; update this plan's checkboxes/evidence only if the
repository governance requires it before H2.

**Interfaces:** No new runtime interface.

- [ ] **Step 1: Run focused target-feature tests**

```powershell
npm --prefix backend test -- --runInBand tests/featureAccess.test.js tests/borrowingProjection.test.js tests/borrowingRepository.test.js tests/borrowingRoutes.test.js tests/reservationRoutes.test.js tests/notificationPolicy.test.js tests/notificationRoutes.test.js tests/notificationInboxRepository.test.js tests/reportProjection.test.js tests/reportRepository.test.js tests/reportInMemoryParity.test.js tests/reportRoutes.test.js
npm --prefix frontend test -- --test-name-pattern "FE07|FE08|FE10|FE12|borrowing|reservation|notification|report"
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run full repository gates**

```powershell
npm --prefix backend test -- --runInBand
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm run test:secrets
npm run test:deployment
npm run trace:enforce
git diff --check
```

Expected: all commands exit `0`, backend remains at least 1,127 tests,
frontend remains at least 271 tests, and lint has zero warnings.

- [ ] **Step 3: Verify scope and contracts**

Run:

```powershell
git status --short
git diff --stat
git diff --name-only
```

Expected: only the approved FE07/FE08/FE10/FE12 utilities, services,
repositories, FE08 page/tests, and design/plan evidence are present. No
controller, route, API adapter, SQL, migration, `.env`, workflow, or Azure file
changes.

- [ ] **Step 4: Prepare H2 evidence**

Compute the staged diff fingerprint only after the complete uncommitted diff
has been reviewed. Do not commit, push, publish a PR, merge, or deploy before
the required H2/H3 gates.
