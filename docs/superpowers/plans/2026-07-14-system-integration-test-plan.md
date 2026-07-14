# System Integration Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build repeatable system integration evidence for the completed FE07, FE08, FE09, FE10, and FE12 workflows, with a short deterministic demo path for the project presentation.

**Architecture:** Use two verification layers. Layer A extends the existing Express/Supertest in-memory integration harness for fast deterministic API and role-flow checks in CI. Layer B uses a mutation-gated SQL Server suite to prove that borrowing, reservation, fine, notification, and reporting modules observe the same persisted records without relying on test-only state bridges. A manual demo runbook reuses the same scenario IDs and expected outcomes.

**Tech Stack:** Node.js 22, Express, Jest, Supertest, React/Vite, SQL Server, GitHub Actions, existing in-memory repository helpers.

## Global Constraints

- Treat the approved FE07, FE08, FE09, FE10, and FE12 `SPEC.md` files as the behavior source of truth.
- Keep Phase 1 policy values unchanged: 5 active copies, 14 calendar-day loan, 1 renewal, and 5,000 VND per overdue day.
- FE07 exposes return and overdue data; FE09 alone creates and resolves fine records.
- FE08 reservation priority blocks FE07 renewal and a held copy cannot be borrowed by another member.
- FE10 receives idempotent notification requests; tests use the existing mock email provider and never send real email.
- FE12 remains read-only and must not mutate borrowing, reservation, fine, notification, user, or inventory state.
- Do not add a payment gateway, scheduler, production schema change, new status value, or frontend dependency.
- SQL mutation tests require `SYSTEM_SQL_TEST_ALLOW_MUTATION=true` and an explicit `SYSTEM_SQL_TEST_ENV_FILE`.
- Use only synthetic accounts ending in `@example.test`; never store real credentials or personal data.
- Preserve unrelated untracked files, including `.superpowers/`, `backend/coverage/`, and `docs/briefing-thuyet-trinh-du-an-vi.docx`.
- Use branch `test/system-integration`; do not create a branch containing `codex`.

---

## File Structure

- Create `backend/tests/helpers/systemIntegrationHarness.js`: shared application factory, actors, fixed clock, and in-memory state bridges.
- Create `backend/tests/systemIntegration.test.js`: deterministic API-level SIT cases `SIT-001` through `SIT-009`.
- Create `backend/tests/sql/systemIntegration.sqltest.js`: SQL-backed shared-state case `SIT-SQL-001` with guarded cleanup.
- Create `docs/testing/system-integration-demo-runbook.md`: presentation-ready manual flow, fixture checklist, fallback path, and reset steps.
- Create `.sdd/reviews/system-integration-evidence-2026-07-14.md`: execution evidence populated only with actual results.
- Modify `backend/package.json`: add focused in-memory and SQL SIT scripts.
- Modify `package.json`: add the project-level `test:system` command.
- Modify `.github/workflows/ci.yml`: run the in-memory SIT suite after backend tests.
- Modify `docs/architecture/feature-integration-map.md`: replace current SIT gaps with the new case IDs and evidence paths.

---

## System Test Matrix

| ID | Cross-feature flow | Expected result |
| --- | --- | --- |
| SIT-001 | FE02 auth and RBAC across FE07/08/09/10/12 | Guest receives `401`; Member receives `403` on staff APIs; Librarian/Admin can access staff APIs. |
| SIT-002 | FE07 borrow approval -> FE10 -> FE12 | Approval sets detail/copy to `BORROWED`, due date to +14 days, creates one FE07 notification, and increments borrowing report activity. |
| SIT-003 | FE08 queue -> FE10 -> FE07 held-copy guard | Queue processing sets reservation `NOTIFIED`, copy `RESERVED`, creates one FE08 notification, and another member cannot borrow the copy. |
| SIT-004 | FE08 reservation conflict -> FE07 renewal | Active reservation by another member returns `409 RESERVATION_BLOCKS_RENEWAL`; due date and renewal count remain unchanged. |
| SIT-005 | FE07 overdue return -> FE09 fine | Stored due/return dates produce one server-calculated `UNPAID` fine at 5,000 VND/day; client amount is ignored. |
| SIT-006 | FE09 unpaid/paid lifecycle -> FE07 eligibility | Unpaid fine blocks a new borrow; marking the fine paid removes the blocker and the next valid borrow request succeeds. |
| SIT-007 | FE10 idempotency and processing | Replayed source request returns the same notification; processing creates one attempt and exposes no message body or secret. |
| SIT-008 | FE12 read-only aggregation | Reports reflect actual loans, ignore `REQUESTED` as loan activity, enforce staff access, and leave source state byte-for-byte unchanged. |
| SIT-009 | FE10 request failure isolation | A failed FE10 notification request does not roll back a successfully approved FE07 borrow. |
| SIT-SQL-001 | Real SQL shared-state golden path | FE07 return is visible to FE09 calculation and FE12 borrowing report through the same database; all seeded rows are removed afterward. |

---

### Task 1: Extract A Shared System Integration Harness

**Files:**
- Create: `backend/tests/helpers/systemIntegrationHarness.js`
- Modify: `backend/tests/integration.test.js`
- Test: `backend/tests/systemIntegration.test.js`

**Interfaces:**
- Consumes: existing `makeInMemory*Dependencies()` helpers and `createApp()` dependency injection.
- Produces: `makeSystemIntegrationApp()`, `createVerifiedActor()`, `authHeader()`, `syncFineSourceFromBorrowing()`, `syncFineBlockersToBorrowing()`, and `syncCopyStatus()`.

- [ ] **Step 1: Write the failing harness contract test**

Create `backend/tests/systemIntegration.test.js`:

```js
process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const { makeSystemIntegrationApp } = require('./helpers/systemIntegrationHarness');

describe('System integration', () => {
  test('SIT-000 wires every completed service into one Express app', () => {
    const setup = makeSystemIntegrationApp();

    expect(setup.app).toBeTruthy();
    expect(setup.services).toEqual(expect.objectContaining({
      authService: expect.any(Object),
      borrowingService: expect.any(Object),
      reservationService: expect.any(Object),
      fineManagementService: expect.any(Object),
      notificationService: expect.any(Object),
      reportService: expect.any(Object),
    }));
  });
});
```

- [ ] **Step 2: Run the contract and verify RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js
```

Expected: FAIL with `Cannot find module './helpers/systemIntegrationHarness'`.

- [ ] **Step 3: Implement the shared application factory**

Create `backend/tests/helpers/systemIntegrationHarness.js` with these imports and factory boundaries:

```js
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createAuthService } = require('../../src/services/authService');
const { createBorrowingService } = require('../../src/services/borrowingService');
const { createReservationService } = require('../../src/services/reservationService');
const { createFineManagementService } = require('../../src/services/fineManagementService');
const { createNotificationService } = require('../../src/services/notificationService');
const { createReportService } = require('../../src/services/reportService');
const { makeInMemoryAuthDependencies } = require('./inMemoryAuthRepositories');
const { makeInMemoryBorrowingDependencies } = require('./inMemoryBorrowingRepositories');
const { makeInMemoryReservationDependencies } = require('./inMemoryReservationRepositories');
const { makeInMemoryFineDependencies } = require('./inMemoryFineRepositories');
const { makeInMemoryNotificationDependencies } = require('./inMemoryNotificationRepositories');
const { makeInMemoryReportDependencies } = require('./inMemoryReportRepositories');

const FIXED_NOW = new Date('2026-07-14T00:00:00.000Z');

function authHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

function syncCopyStatus(sourceState, targetState, copyId) {
  const source = sourceState.copies.find((copy) => copy.copyId === Number(copyId));
  const target = targetState.copies.find((copy) => copy.copyId === Number(copyId));
  if (!source || !target) throw new Error(`Missing shared copy ${copyId}.`);
  target.status = source.status;
}

function makeSystemIntegrationApp({ borrowingNotificationError = null } = {}) {
  const authDependencies = makeInMemoryAuthDependencies();
  const borrowingDependencies = makeInMemoryBorrowingDependencies(authDependencies.state);
  const reservationDependencies = makeInMemoryReservationDependencies(authDependencies.state);
  const fineDependencies = makeInMemoryFineDependencies();
  const notificationDependencies = makeInMemoryNotificationDependencies(authDependencies.state);
  const reportDependencies = makeInMemoryReportDependencies(
    authDependencies.state,
    borrowingDependencies.state,
  );

  const authService = createAuthService(authDependencies);
  const notificationService = createNotificationService({
    notificationRepository: notificationDependencies.notificationRepository,
    templateRepository: notificationDependencies.templateRepository,
    userRepository: authDependencies.userRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    emailProvider: { send: async () => ({ success: true }) },
    clock: () => FIXED_NOW,
  });
  const borrowingNotificationService = borrowingNotificationError
    ? {
        createSourceNotificationRequester: () => ({
          createNotificationRequest: async () => {
            throw borrowingNotificationError;
          },
        }),
      }
    : notificationService;
  const borrowingService = createBorrowingService({
    borrowingRepository: borrowingDependencies.borrowingRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationService: borrowingNotificationService,
    clock: () => FIXED_NOW,
  });
  const reservationService = createReservationService({
    reservationRepository: reservationDependencies.reservationRepository,
    bookCopyRepository: reservationDependencies.bookCopyRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    notificationService,
    clock: () => FIXED_NOW,
  });
  const fineManagementService = createFineManagementService({
    fineRepository: fineDependencies.fineRepository,
    auditLogRepository: fineDependencies.auditLogRepository,
    clock: () => FIXED_NOW,
  });
  const reportService = createReportService({
    reportRepository: reportDependencies.reportRepository,
    auditLogRepository: authDependencies.auditLogRepository,
  });
  const services = {
    authService,
    borrowingService,
    reservationService,
    fineManagementService,
    notificationService,
    reportService,
  };

  return {
    app: createApp(services),
    services,
    dependencies: {
      authDependencies,
      borrowingDependencies,
      reservationDependencies,
      fineDependencies,
      notificationDependencies,
      reportDependencies,
    },
  };
}

module.exports = { FIXED_NOW, authHeader, makeSystemIntegrationApp, syncCopyStatus };
```

- [ ] **Step 4: Add the actor and fine-state bridge functions**

Append and export these functions from the same helper:

```js
async function createVerifiedActor({ setup, email, role = 'MEMBER', approveMember = true }) {
  const password = 'Password1!';
  const registered = await request(setup.app).post('/api/auth/register').send({
    email,
    password,
    confirmPassword: password,
    fullName: email.split('@')[0],
  });
  if (registered.status !== 201) throw new Error(`Registration failed for ${email}.`);

  const userId = registered.body.userId;
  await request(setup.app)
    .post('/api/auth/verify-email')
    .send({ token: registered.body.debugVerificationToken })
    .expect(200);
  setup.dependencies.authDependencies.state.rolesByUserId.set(userId, [role]);

  if (role === 'MEMBER' && approveMember) {
    setup.dependencies.borrowingDependencies.approveMember(userId);
    setup.dependencies.reservationDependencies.approveMember(userId);
  }

  const login = await request(setup.app).post('/api/auth/login').send({ email, password });
  if (login.status !== 200) throw new Error(`Login failed for ${email}.`);
  return { userId, accessToken: login.body.accessToken };
}

function syncFineSourceFromBorrowing(setup) {
  const { borrowingDependencies, fineDependencies, authDependencies } = setup.dependencies;
  const mapped = borrowingDependencies.state.borrowDetails.map((detail) => {
    const requestRow = borrowingDependencies.state.borrowRequests.find(
      (item) => item.requestId === detail.requestId,
    );
    const copy = borrowingDependencies.state.copies.find((item) => item.copyId === detail.copyId);
    const book = borrowingDependencies.state.books.find((item) => item.bookId === copy?.bookId);
    const user = authDependencies.state.users.find((item) => item.userId === requestRow?.userId);
    return {
      borrowDetailId: detail.borrowDetailId,
      userId: requestRow.userId,
      copyId: detail.copyId,
      dueDate: detail.dueDate,
      returnDate: detail.returnDate,
      detailStatus: detail.status,
      barcode: copy?.barcode || null,
      bookTitle: book?.title || null,
      email: user?.email || null,
      username: user?.username || null,
    };
  });
  fineDependencies.state.borrowDetails.splice(0, fineDependencies.state.borrowDetails.length, ...mapped);
}

function syncFineBlockersToBorrowing(setup) {
  const { borrowingDependencies, fineDependencies } = setup.dependencies;
  borrowingDependencies.state.fines.splice(
    0,
    borrowingDependencies.state.fines.length,
    ...fineDependencies.state.fines.map((fine) => ({
      fineId: fine.fineId,
      userId: fine.userId,
      amount: fine.amount,
      status: fine.status,
    })),
  );
}

module.exports = {
  FIXED_NOW,
  authHeader,
  createVerifiedActor,
  makeSystemIntegrationApp,
  syncCopyStatus,
  syncFineBlockersToBorrowing,
  syncFineSourceFromBorrowing,
};
```

- [ ] **Step 5: Run the harness contract and existing integration suite**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js tests/integration.test.js
```

Expected: both suites PASS and the existing integration behavior remains unchanged.

- [ ] **Step 6: Commit the harness boundary**

```powershell
git add backend/tests/helpers/systemIntegrationHarness.js backend/tests/systemIntegration.test.js
git commit -m "test: add shared system integration harness"
```

---

### Task 2: Add Authentication, Borrowing, Notification, And Report Flow

**Files:**
- Modify: `backend/tests/systemIntegration.test.js`

**Interfaces:**
- Consumes: `makeSystemIntegrationApp()`, `createVerifiedActor()`, and `authHeader()` from Task 1.
- Produces: automated evidence for `SIT-001`, `SIT-002`, `SIT-007`, and `SIT-008`.

- [ ] **Step 1: Add the failing golden-path test**

Replace the opening test imports with:

```js
const request = require('supertest');
const {
  authHeader,
  createVerifiedActor,
  makeSystemIntegrationApp,
} = require('./helpers/systemIntegrationHarness');
```

Then add a test that performs these exact API steps:

```js
test('SIT-002 FE07 approval creates FE10 data and FE12 activity', async () => {
  const setup = makeSystemIntegrationApp();
  const member = await createVerifiedActor({
    setup,
    email: 'sit.borrower@example.test',
  });
  const librarian = await createVerifiedActor({
    setup,
    email: 'sit.librarian@example.test',
    role: 'LIBRARIAN',
    approveMember: false,
  });

  const created = await request(setup.app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] })
    .expect(201);
  const approved = await request(setup.app)
    .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
    .set('Authorization', authHeader(librarian.accessToken))
    .send({})
    .expect(200);

  expect(approved.body.borrowRequest).toMatchObject({
    status: 'APPROVED',
    details: [expect.objectContaining({ status: 'BORROWED', dueDate: '2026-07-28' })],
  });
  expect(setup.dependencies.notificationDependencies.state.notifications).toEqual(
    expect.arrayContaining([expect.objectContaining({
      userId: member.userId,
      sourceFeature: 'FE07',
      type: 'DUE_DATE_REMINDER',
    })]),
  );

  const report = await request(setup.app)
    .get('/api/reports/borrowing?fromDate=2026-07-01&toDate=2026-07-31')
    .set('Authorization', authHeader(librarian.accessToken))
    .expect(200);
  expect(report.body.totals.requests).toBe(1);
  expect(report.body.totals.activeLoans).toBe(1);
  expect(report.body.requestStatusCounts.APPROVED).toBe(1);
});
```

- [ ] **Step 2: Add RBAC assertions before the golden path**

Add `SIT-001` assertions for unauthenticated and Member access to:

```text
GET /api/borrow-requests
POST /api/reservations/process-queue
POST /api/fines/calculate
POST /api/notifications/process-pending
GET /api/reports/borrowing
```

Expected: no token returns `401`; a Member token returns `403`; a Librarian token reaches validation or success instead of an authorization error.

- [ ] **Step 3: Add notification replay and report immutability assertions**

For `SIT-007`, submit the same notification request twice with idempotency key `sit-fe07-1`; assert the second response returns the same `notificationId`. Process pending notifications and assert `{ processed: 1, failed: 0 }` without a `notifications` property.

For `SIT-008`, snapshot these arrays before and after all three report endpoints:

```js
const before = JSON.stringify({
  requests: setup.dependencies.borrowingDependencies.state.borrowRequests,
  details: setup.dependencies.borrowingDependencies.state.borrowDetails,
  copies: setup.dependencies.borrowingDependencies.state.copies,
  fines: setup.dependencies.fineDependencies.state.fines,
  notifications: setup.dependencies.notificationDependencies.state.notifications,
});
```

Expected: the serialized snapshot is identical after report calls, while `REQUESTED` details do not increase actual-loan metrics.

- [ ] **Step 4: Add the notification-failure isolation case**

Create the setup with `makeSystemIntegrationApp({ borrowingNotificationError: new Error('Provider unavailable') })`, then create and approve a valid borrow request.

Expected:

```text
approval response = 200
BorrowRequest.Status = APPROVED
BorrowDetail.Status = BORROWED
BookCopy.Status = BORROWED
no FE07 notification row is claimed as delivered
```

Keep the existing FE07 SQL audit-rollback tests as separate feature-level transaction evidence; `SIT-009` covers only the cross-feature FE07/FE10 failure boundary.

- [ ] **Step 5: Run the focused SIT cases**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js
```

Expected: `SIT-001`, `SIT-002`, `SIT-007`, `SIT-008`, and the notification-failure part of `SIT-009` PASS.

- [ ] **Step 6: Commit the first system slice**

```powershell
git add backend/tests/systemIntegration.test.js
git commit -m "test: cover auth borrow notification report flow"
```

---

### Task 3: Add Reservation Priority And Renewal Conflict Flow

**Files:**
- Modify: `backend/tests/systemIntegration.test.js`

**Interfaces:**
- Consumes: shared actors and copy-state bridge from Task 1.
- Produces: automated evidence for `SIT-003` and `SIT-004`.

- [ ] **Step 1: Add a held-copy integration test**

Use Member A to reserve borrowed copy `1`, set the FE08 copy to `AVAILABLE`, and call:

```http
POST /api/reservations/process-queue
{ "copyId": 1 }
```

Assert the selected reservation is `NOTIFIED`, FE08 copy status is `RESERVED`, and exactly one notification has `sourceFeature: FE08` plus `templateKey: RESERVATION_READY`. Call `syncCopyStatus(reservationState, borrowingState, 1)`, then assert Member B receives `409 COPY_NOT_AVAILABLE` from `POST /api/borrow-requests`.

- [ ] **Step 2: Add a renewal-conflict integration test**

Borrow and approve copy `2` for Member A. Insert one active reservation owned by Member B into the FE07 reservation-conflict state, then call:

```http
PATCH /api/borrow-details/{borrowDetailId}/renew
```

Expected: `409 RESERVATION_BLOCKS_RENEWAL`; `dueDate` and `renewalCount` equal their pre-call values.

- [ ] **Step 3: Run the reservation cases with existing integration coverage**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js tests/integration.test.js tests/reservationRoutes.test.js
```

Expected: all suites PASS without duplicate queue notifications or copy-status divergence.

- [ ] **Step 4: Commit the reservation boundary**

```powershell
git add backend/tests/systemIntegration.test.js
git commit -m "test: cover reservation borrowing integration"
```

---

### Task 4: Add Overdue Fine And Borrowing-Blocker Lifecycle

**Files:**
- Modify: `backend/tests/systemIntegration.test.js`

**Interfaces:**
- Consumes: `syncFineSourceFromBorrowing()` and `syncFineBlockersToBorrowing()` from Task 1.
- Produces: automated evidence for `SIT-005` and `SIT-006`.

- [ ] **Step 1: Write the overdue return and fine calculation test**

Borrow and approve copy `1`, then set its stored due date to `2026-06-30`. Return it on `2026-07-14`, call `syncFineSourceFromBorrowing(setup)`, and submit:

```http
POST /api/fines/calculate
{ "borrowDetailId": 1, "amount": 999999 }
```

Use the actual returned `borrowDetailId`, not the literal example ID. Expected: one `UNPAID` fine, `overdueDays: 14`, and `amount: 70000`; the client amount is ignored.

- [ ] **Step 2: Prove the fine blocks and then unblocks FE07**

Call `syncFineBlockersToBorrowing(setup)`, then request another available copy as the same member. Expected: `409 UNPAID_FINE_BLOCKS_BORROWING` and no new request row.

Mark the fine paid through:

```http
PATCH /api/fines/{fineId}/paid
{ "paymentMethod": "CASH" }
```

Call `syncFineBlockersToBorrowing(setup)` again and repeat the borrow request with copy `2`. Expected: `201 PENDING`.

- [ ] **Step 3: Verify fine ownership and duplicate calculation**

Expected:

```text
GET /api/fines/me as owner -> one fine
GET /api/fines/me as another member -> zero fines
second POST /api/fines/calculate -> created=false and same fineId
Member PATCH /api/fines/{fineId}/paid -> 403
```

- [ ] **Step 4: Run FE07 and FE09 regression together**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js tests/borrowingRoutes.test.js tests/fineManagementRoutes.test.js
```

Expected: all suites PASS.

- [ ] **Step 5: Commit the fine lifecycle**

```powershell
git add backend/tests/systemIntegration.test.js
git commit -m "test: cover fine borrowing blocker lifecycle"
```

---

### Task 5: Add SQL-Backed Shared-State Proof

**Files:**
- Create: `backend/tests/sql/systemIntegration.sqltest.js`
- Modify: `backend/package.json`

**Interfaces:**
- Consumes: production SQL repositories and services through the database configured by `SYSTEM_SQL_TEST_ENV_FILE`.
- Produces: `SIT-SQL-001` proving FE07 -> FE09 -> FE12 state visibility without in-memory bridges.

- [ ] **Step 1: Add the mutation guard and deterministic seed registry**

Start the SQL suite with:

```js
const dotenv = require('dotenv');
if (process.env.SYSTEM_SQL_TEST_ENV_FILE) {
  dotenv.config({ path: process.env.SYSTEM_SQL_TEST_ENV_FILE, quiet: true });
}
if (process.env.SYSTEM_SQL_TEST_ALLOW_MUTATION !== 'true') {
  throw new Error('System SQL test requires SYSTEM_SQL_TEST_ALLOW_MUTATION=true.');
}

const seed = {
  key: `sit${Date.now()}${process.pid}`,
  userIds: [],
  copyIds: [],
  requestIds: [],
  detailIds: [],
  fineIds: [],
  notificationIds: [],
};
```

- [ ] **Step 2: Implement one real database golden path**

The test must perform these operations through production service/repository APIs:

```text
1. Insert synthetic Member and Librarian users and an approved Members row.
2. Insert one AVAILABLE copy using an existing BookId.
3. FE07 creates and approves a request; assert detail BORROWED and copy BORROWED.
4. Set due date to 2026-06-30 and return on 2026-07-14; assert FE07 fineCandidate has 14 overdue days.
5. FE09 calculates from the persisted BorrowDetail; assert one UNPAID fine for 70,000 VND.
6. FE12 borrowing report for July includes the request and actual loan activity.
7. Query AuditLogs and Notifications for FE07 source records without exposing payload secrets.
```

- [ ] **Step 3: Implement cleanup in reverse dependency order**

Use `afterEach` and `afterAll` to delete only IDs recorded in `seed`, in this order:

```text
NotificationAttempts -> Notifications -> AuditLogs -> Fines -> BorrowDetails -> BorrowRequests
-> Reservations -> BookCopies -> Members -> UserRoles -> Users
```

After cleanup, assert:

```sql
SELECT
  (SELECT COUNT(*) FROM Users WHERE Username LIKE @SeedPrefix) AS TestUsers,
  (SELECT COUNT(*) FROM BookCopies WHERE Barcode LIKE @SeedPrefix) AS TestCopies;
```

Expected: `TestUsers = 0` and `TestCopies = 0`.

- [ ] **Step 4: Add the focused SQL script**

Add to `backend/package.json`:

```json
"test:sql:system": "jest --runInBand --runTestsByPath tests/sql/systemIntegration.sqltest.js"
```

- [ ] **Step 5: Run the SQL suite against an explicit environment**

```powershell
$env:SYSTEM_SQL_TEST_ALLOW_MUTATION = 'true'
$env:SYSTEM_SQL_TEST_ENV_FILE = 'D:\SWP391\library-management-system\backend\.env'
npm.cmd --prefix backend run test:sql:system
```

Expected: `SIT-SQL-001` PASS and cleanup counts are both zero.

- [ ] **Step 6: Commit the SQL evidence layer**

```powershell
git add backend/tests/sql/systemIntegration.sqltest.js backend/package.json backend/package-lock.json
git commit -m "test: add SQL system integration proof"
```

---

### Task 6: Add Demo Runbook, CI Command, And Evidence Record

**Files:**
- Create: `docs/testing/system-integration-demo-runbook.md`
- Create: `.sdd/reviews/system-integration-evidence-2026-07-14.md`
- Modify: `package.json`
- Modify: `backend/package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/architecture/feature-integration-map.md`

**Interfaces:**
- Consumes: SIT case IDs and passing output from Tasks 1-5.
- Produces: one CI command, one presentation checklist, and one durable evidence record.

- [ ] **Step 1: Add focused scripts**

Add to `backend/package.json`:

```json
"test:integration:system": "jest --runInBand --runTestsByPath tests/systemIntegration.test.js"
```

Add to root `package.json`:

```json
"test:system": "npm --prefix backend run test:integration:system"
```

- [ ] **Step 2: Add the in-memory SIT suite to CI**

After `Backend tests` in `.github/workflows/ci.yml`, add:

```yaml
      - name: System integration tests
        run: npm run test:integration:system
        working-directory: backend
```

Do not run the SQL mutation suite in shared CI until the repository has an isolated SQL Server service and disposable credentials.

- [ ] **Step 3: Create the presentation demo runbook**

The runbook must use this five-minute flow:

```text
Preflight: backend /health -> frontend login -> copy AVAILABLE -> no unpaid fine.
1. Member creates borrow request.
2. Librarian approves; show BORROWED status and due date +14 days.
3. Show FE10 due-date notification record or API response.
4. Return an overdue/damaged fixture; show fineCandidate, then FE09-calculated fine.
5. Show unpaid fine blocking the next borrow; mark paid and retry successfully.
6. Open FE12 borrowing report and show the integrated activity.
```

Include a fallback path using API responses and screenshots if email, SQL Server, or frontend startup is unavailable. Include reset checks for copy status, pending notifications, fines, and synthetic users.

- [ ] **Step 4: Record only observed evidence**

Create `.sdd/reviews/system-integration-evidence-2026-07-14.md` with a row for every SIT ID and these columns:

```markdown
| ID | Status | Command / action | Observed result | Cleanup |
| --- | --- | --- | --- | --- |
```

Use `NOT RUN` until the corresponding command has actually completed. Never pre-fill `PASS`.

- [ ] **Step 5: Update the integration map**

In `docs/architecture/feature-integration-map.md` Section 7, map each completed flow to `backend/tests/systemIntegration.test.js` or `backend/tests/sql/systemIntegration.sqltest.js`. Keep FE01/FE05 availability and FE11 admin-console gaps open because they are outside this plan.

- [ ] **Step 6: Run the complete verification gate**

```powershell
npm.cmd run test:system
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

Expected: all commands exit `0`. Record exact suite/test counts and the existing Vite advisory separately from failures.

- [ ] **Step 7: Run the manual demo rehearsal**

Run the demo flow twice:

```text
Rehearsal 1: normal pace, verify every state and reset.
Rehearsal 2: timed five-minute presentation pace using the fallback screenshots/API evidence.
```

Expected: no page-level overflow, no fabricated demo success, no stale authenticated role, and all test fixtures are removed or restored.

- [ ] **Step 8: Commit the integration gate**

```powershell
git add package.json backend/package.json backend/package-lock.json .github/workflows/ci.yml docs/testing/system-integration-demo-runbook.md docs/architecture/feature-integration-map.md .sdd/reviews/system-integration-evidence-2026-07-14.md
git commit -m "test: establish system integration gate"
```

---

## Exit Criteria

- [ ] `SIT-001` through `SIT-009` pass in the deterministic Supertest suite.
- [ ] `SIT-SQL-001` passes against the configured SQL Server and cleanup returns zero rows.
- [ ] CI runs the in-memory SIT suite on pull requests and `main`.
- [ ] The manual runbook completes twice and has a working fallback path.
- [ ] No production requirement, schema, status, dependency, or authorization boundary changes.
- [ ] Evidence maps each flow from feature specs and integration map to code, command, observed result, and cleanup.

## Execution Order For Tomorrow's Presentation

1. Execute Task 1 and Task 2 first; they provide the safest borrow/notification/report demo evidence.
2. Execute Task 4 next; it provides the clearest business-rule story: overdue fine blocks borrowing until paid.
3. Create the Task 6 demo runbook immediately after the first green automated flow.
4. Execute Task 3 reservation cases if time remains before rehearsal.
5. Execute Task 5 SQL proof only with a reachable disposable database and enough time to verify cleanup.
