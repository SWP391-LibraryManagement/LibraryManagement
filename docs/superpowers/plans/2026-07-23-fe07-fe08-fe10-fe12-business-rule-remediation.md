# FE07/FE08/FE10/FE12 Business Rule Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Repository H2 rules prohibit committing generated implementation changes before human review.

**Goal:** Reconcile borrowing, reservation, notification, and reporting behavior with the approved FE07, FE08, FE10, and FE12 contracts.

**Architecture:** Keep the existing Express service/repository boundaries. Move concurrency-sensitive decisions into SQL transactions with stable lock order, make FE10 workers claim rows before delivery, expose only the canonical FE08 queue command, and make FE12 pagination database-backed end to end.

**Tech Stack:** Node.js, Express.js, Jest, React, SQL Server, parameterized T-SQL, Node test runner.

## Global Constraints

- Preserve the approved Node.js + Express.js, React, SQL Server, and REST architecture.
- An active `MEMBER` with `Users.Status = ACTIVE` may use FE07/FE08 without FE04 approval; FE04 status only selects the FE07 daily tier.
- FE07 shared copy lock order is `member lock -> BookCopies -> BorrowRequests/BorrowDetails -> Reservations`.
- FE08 queue identity and processing target are physical `CopyId`; the only Phase 1 processing endpoint is `POST /api/reservations/process-queue`.
- Every in-process FE10 request carries bound source metadata and an idempotency key; only FE04 owns `MEMBERSHIP_RESULT`.
- FE12 filters, aggregation inputs, stable ordering, and detailed-row pagination execute in SQL before rows are returned.
- Do not add dependencies, expose secrets/PII, commit, push, or deploy before the repository's H2/H3 gates.

---

### Task 1: Make FE10 delivery and source ownership deterministic

**Files:**
- Modify: `backend/tests/notificationRoutes.test.js`
- Create: `backend/tests/notificationRepository.test.js`
- Modify: `backend/src/services/notificationService.js`
- Modify: `backend/src/repositories/notificationRepository.js`
- Modify: `backend/src/services/borrowingService.js`
- Modify: `backend/src/services/reservationService.js`

**Interfaces:**
- Consumes: `createSourceNotificationRequester(sourceFeature)` and `processPendingNotifications({ limit }, actor)`.
- Produces: `claimNextPending()` returning an exclusively claimed row; guarded `markClaimSent`/`markClaimFailed`; deterministic source ownership and idempotent FE07/FE08 requests.

- [x] **Step 1: Write failing ownership and worker-concurrency tests.**

Add tests proving:

```js
await expect(
  service.createSourceNotificationRequester('FE07').createNotificationRequest(
    membershipResultInput
  )
).rejects.toMatchObject({ code: 'NOTIFICATION_SOURCE_OWNER_MISMATCH' });

await Promise.all([
  service.processPendingNotifications({ limit: 20 }, ADMIN),
  service.processPendingNotifications({ limit: 20 }, ADMIN),
]);
expect(emailProvider.send).toHaveBeenCalledTimes(1);
```

Also assert FE07 due-date and FE08 reservation-ready requests include stable source-event idempotency keys.

- [x] **Step 2: Run the focused tests and verify RED.**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js tests/notificationRepository.test.js
```

Expected: ownership accepts FE07 incorrectly, concurrent workers send twice, and FE07/FE08 source requests omit idempotency keys.

- [x] **Step 3: Implement minimal FE10 ownership, claim, and replay behavior.**

Use an explicit owner map for all source-owned canonical pairs:

```js
const notificationTypeOwners = {
  ACCOUNT_VERIFICATION: 'FE02',
  PASSWORD_RESET: 'FE02',
  ACCOUNT_SETUP: 'FE11',
  GENERAL_SYSTEM: 'FE04',
};
```

Claim queued records transactionally before provider delivery, using parameterized SQL and a state transition that prevents a second worker from receiving the same row. Make `markSent` and `markFailed` update only the claimed processing state. If a unique idempotency insert loses a race, load and replay the existing row rather than returning an internal error.

- [x] **Step 4: Run the focused tests and verify GREEN.**

Repeat Step 2. Expected: all FE10 tests pass with one provider send under concurrent worker calls.

---

### Task 2: Enforce FE08 copy-level FIFO and atomic reservation creation

**Files:**
- Modify: `backend/tests/reservationRoutes.test.js`
- Modify: `backend/tests/reservationService.test.js`
- Create: `backend/tests/reservationRepository.test.js`
- Modify: `backend/src/routes/reservationRoutes.js`
- Modify: `backend/src/controllers/reservationController.js`
- Modify: `backend/src/services/reservationService.js`
- Modify: `backend/src/repositories/reservationRepository.js`
- Modify: `backend/src/validators/reservationValidators.js`
- Modify: `backend/src/docs/openapi.yaml`
- Modify: `frontend/src/api/libraryFeatureApi.js`
- Modify: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Modify: `frontend/src/page/reservation/MyReservationsPage.jsx`
- Modify: `frontend/test/reservationFrontend.test.js`

**Interfaces:**
- Consumes: `POST /api/reservations/process-queue { copyId }`.
- Produces: one atomic `createReservation({ userId, copyId })` outcome and copy-specific UI queues.

- [x] **Step 1: Write failing FIFO, concurrency, and frontend contract tests.**

Add tests proving:

```js
expect(routeSource).not.toContain('/:reservationId/process');
expect(librarianPageSource).toContain('reservationApi.processQueue(notifyTarget.copyId)');
expect(librarianPageSource).not.toContain('reservationApi.process(notifyTarget.reservationId');
```

Add repository/service tests where two concurrent create attempts start from two open reservations; only one succeeds and the committed total remains three. Add UI assertions that grouping keys use `copyId`, not `title`, and list calls include server pagination.

- [x] **Step 2: Run focused tests and verify RED.**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRoutes.test.js tests/reservationService.test.js tests/reservationRepository.test.js
node --test frontend/test/reservationFrontend.test.js
```

Expected: direct processing route remains, UI invokes it, and create checks are outside the repository transaction.

- [x] **Step 3: Implement the canonical queue and transactional create path.**

Remove the direct process route/controller/API method. In one SQL transaction:

```text
lock member scope -> lock Users/UserRoles -> lock open reservations for user
-> lock target BookCopies/Books -> reject duplicate/limit/state conflicts
-> lock target reservation queue -> insert ACTIVE reservation
```

Return explicit repository outcomes for inactive/non-member, duplicate, limit, and copy-state conflicts; map them to the existing safe 4xx codes in the service. Group the librarian queue by `copyId` and call `processQueue(copyId)`.

- [x] **Step 4: Run focused tests and verify GREEN.**

Repeat Step 2. Expected: all FE08 backend/frontend tests pass.

---

### Task 3: Reconcile FE07 eligibility and transaction lock order

**Files:**
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/tests/borrowingRepository.test.js`
- Modify: `backend/tests/sql/borrowingConcurrency.sqltest.js`
- Modify: `backend/src/services/borrowingService.js`
- Modify: `backend/src/repositories/borrowingRepository.js`

**Interfaces:**
- Consumes: borrow create/approve/return/renew service commands.
- Produces: repository outcomes calculated only after role, tier, count, copy, detail, and reservation state are locked in canonical order.

- [x] **Step 1: Write failing role, tier, and lock-order tests.**

Add tests proving approval rejects a user whose `MEMBER` role was removed, recalculates the 3/5 daily tier from locked `Members.Status`, and repository source acquires copy locks before request/detail/reservation locks. Add a return test proving the transaction locks `BookCopies -> BorrowDetails -> Reservations`.

- [x] **Step 2: Run focused tests and verify RED.**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
```

Expected: role removal and stale-tier cases are accepted, and source-order assertions fail.

- [x] **Step 3: Implement locked eligibility and canonical ordering.**

Resolve the request's member key, acquire the member application lock, then lock requested copies before request/details and reservations. Join `UserRoles/Roles` while validating the locked user and derive `dailyLimit` inside the transaction. Return uses the shared suffix `BookCopies -> BorrowDetails -> Reservations` before state updates. Preserve parameterized SQL and existing safe service error mapping.

- [x] **Step 4: Run focused tests and verify GREEN.**

Repeat Step 2. Run the live SQL suite only when an explicitly disposable test database and `FE07_SQL_TEST_ALLOW_MUTATION=true` are available; otherwise report it as a residual gate.

---

### Task 4: Move FE12 report paging into SQL and expose navigation

**Files:**
- Modify: `backend/tests/reportRepository.test.js`
- Modify: `backend/tests/reportRoutes.test.js`
- Modify: `backend/tests/reportDeterministicPolicy.test.js`
- Modify: `backend/tests/reportInMemoryParity.test.js`
- Modify: `backend/src/repositories/reportRepository.js`
- Modify: `frontend/src/page/report/BorrowingReportPage.jsx`
- Modify: `frontend/src/page/report/InventoryReportPage.jsx`
- Modify: `frontend/src/page/report/UserStatisticsPage.jsx`
- Modify: `frontend/test/reportOperationalFrontend.test.js`
- Modify: `frontend/test/reportFilters.test.js`

**Interfaces:**
- Consumes: existing report query filters plus `page` and `limit`.
- Produces: `{ metrics, rows, page, limit, totalRows }` where SQL returns stable paged rows and metrics use the complete filtered source set.

- [x] **Step 1: Write failing SQL paging, historical-growth, and UI navigation tests.**

Assert generated SQL contains `OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`, metrics come from unpaged filtered aggregates, and an `INACTIVE` member with non-null `ApprovedAt` remains in `newMembersByPeriod`. Assert all three pages submit `page/limit` and render previous/next controls.

- [x] **Step 2: Run focused tests and verify RED.**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reportRepository.test.js tests/reportRoutes.test.js tests/reportDeterministicPolicy.test.js tests/reportInMemoryParity.test.js
node --test frontend/test/reportOperationalFrontend.test.js frontend/test/reportFilters.test.js
```

Expected: repository still slices rows in memory, historical inactive approvals are omitted, and pages have no navigation state.

- [x] **Step 3: Implement SQL aggregation/paging and frontend page state.**

Use parameterized filtered CTEs or equivalent queries. Calculate metrics/`totalRows` from the full filtered set and fetch detailed rows using the approved stable order plus:

```sql
OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
```

Count `newMembersByPeriod` from non-null `Members.ApprovedAt` in range regardless of current membership status. Add controlled `page` state to each report page and reset to page 1 when filters change.

- [x] **Step 4: Run focused tests and verify GREEN.**

Repeat Step 2. Expected: all FE12 backend/frontend tests pass and pages can reach rows after the first 20.

---

### Task 5: Reconcile contracts and run the L1-L4 gate

**Files:**
- Modify as needed: `.sdd/specs/feat-borrowing-management/{SPEC,PLAN,TASKS}.md`
- Modify as needed: `.sdd/specs/feat-reservation-management/{SPEC,PLAN,TASKS}.md`
- Modify as needed: `.sdd/specs/feat-notification-management/{SPEC,PLAN,TASKS}.md`
- Modify as needed: `.sdd/specs/feat-reporting-statistics/{SPEC,PLAN,TASKS}.md`
- Review: all files changed by Tasks 1-4

- [x] **Step 1: Remove only confirmed contract contradictions.**

Align stale FE07/FE08 edge-case wording with the approved active-`MEMBER`/active-account rule, update API/trace rows for removed FE08 direct processing, and record new regression evidence without changing unrelated scope.

- [x] **Step 2: Run automated verification.**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

Expected: every command exits `0`; no test is skipped to conceal a deterministic failure.

- [x] **Step 3: Review security and spec compliance.**

Confirm role/source ownership, safe errors, parameterized SQL, no secret/PII changes, one-send worker behavior, canonical endpoints, stable pagination, and direct traceability to FE07/08/10/12 requirements.

- [x] **Step 4: Stop at H2.**

Present the complete local diff, exact L1-L4 evidence, SQL-test limitation if applicable, and residual decisions. Do not commit, push, deploy, or merge without the required human gate.
