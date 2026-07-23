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

---

## Final Audit Remediation

The post-H2 audit found concurrency and read-model gaps that the first test set did
not exercise. The user approved this remediation pass with “triển khai đi”. Tasks
6-9 supersede the earlier green conclusion; the batch is not complete until these
tasks pass a fresh H2 review.

### Task 6: Make FE07 create, return, and renewal decisions transactional

**Files:**
- Modify: `backend/tests/borrowingRepository.test.js`
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/tests/fineContract.test.js`
- Modify: `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- Modify: `backend/tests/sql/borrowingConcurrency.sqltest.js`
- Modify: `backend/src/services/borrowingService.js`
- Modify: `backend/src/repositories/borrowingRepository.js`
- Modify: `backend/src/utils/libraryBusinessTime.js`

**Interfaces:**
- Consumes: `businessDateUtcBounds(referenceDate)`,
  `createBorrowRequest({ userId, copyIds, requestDate, businessDate, businessDayStartUtc, businessDayEndUtc, auditLogRepository, auditEntry })`,
  `approveBorrowRequest({ requestId, approvedBy, approvalDate, borrowDate, dueDate, businessDayStartUtc, businessDayEndUtc, auditLogRepository, auditEntry })`,
  `returnBorrowDetail(...)`, and
  `renewBorrowDetail({ borrowDetailId, userId, today, newDueDate, auditLogRepository, auditEntry })`.
- Produces: exact UTC `[start, end)` bounds for one `Asia/Ho_Chi_Minh` business
  date, persisted approval `BorrowDate`/`DueDate` values derived from that
  business date, and repository results with explicit `outcome` values derived under locks;
  successful create returns `{ outcome: 'CREATED', borrowRequest }`; successful
  renewal returns `{ outcome: 'RENEWED', borrowDetail }`.

- [x] **Step 1: Write failing transaction and stale-role tests.**

Add source-order assertions proving create acquires the FE07 member application
lock before `Users/UserRoles`, sorted `BookCopies`, borrowing counters, and
`Reservations`; return acquires a request-scoped application lock before any copy
lock; renewal acquires the FE07 member lock and rechecks the current `MEMBER`
role, active account, unpaid fines, overdue loans, current detail, and reservation
priority before its `UPDATE`. Add route tests that remove the member role after
the service preflight and expect `403 MEMBER_ROLE_REQUIRED` from create and
renewal without mutation. Add a boundary test proving the Vietnam business day
maps to `17:00Z` through the next `17:00Z`, plus request/approval regressions
that cross UTC midnight while remaining in one Vietnam business day.

- [x] **Step 2: Run focused tests and verify RED.**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRepository.test.js tests/borrowingRoutes.test.js
```

Expected: the new lock-order/source assertions and stale-role route assertions fail.

- [x] **Step 3: Implement the atomic repository decisions.**

For create, resolve only stable copy keys, acquire
`FE07-BORROW-MEMBER-${userId}`, re-read the current user/role/tier under
`UPDLOCK, HOLDLOCK`, lock sorted copies, and then check fines, overdue/active/daily
borrowing rows and reservation rows before inserting the request/details/audit.
Use application-supplied `requestDate` and the UTC `[businessDayStartUtc,
businessDayEndUtc)` interval for authoritative request counts. For approval,
count detail rows through `BorrowRequests.ApprovedAt` using the same UTC
interval, while persisting `BorrowDate` as the Vietnam business date and
`DueDate` as exactly 14 calendar days later.
For return, acquire `FE07-RETURN-REQUEST-${requestId}` before the copy/detail
locks so two different details of one request cannot hold one detail each and
deadlock on the request-wide scan. For renewal, repeat all member, detail, fine,
overdue, and reservation decisions inside the transaction and return one of:

```js
{ outcome: 'MEMBER_ROLE_REQUIRED' }
{ outcome: 'MEMBER_ACCOUNT_INACTIVE' }
{ outcome: 'BORROW_DETAIL_NOT_BORROWED' }
{ outcome: 'RENEWAL_LIMIT_REACHED' }
{ outcome: 'BORROW_DETAIL_OVERDUE' }
{ outcome: 'UNPAID_FINE_BLOCKS_BORROWING' }
{ outcome: 'OVERDUE_LOAN_BLOCKS_BORROWING' }
{ outcome: 'RESERVATION_BLOCKS_RENEWAL' }
{ outcome: 'RENEWED', borrowDetail }
```

Map those outcomes to the existing safe HTTP errors in the service. Keep the
preflight reads only as fast feedback; the transaction is authoritative.

- [x] **Step 4: Run focused tests and verify GREEN.**

Repeat Step 2. Expected: all FE07 repository and route tests pass.

---

### Task 7: Align FE08 queue locking, derived positions, and staff feedback

**Files:**
- Modify: `backend/tests/reservationRepository.test.js`
- Modify: `backend/tests/helpers/inMemoryReservationRepositories.js`
- Modify: `backend/tests/sql/borrowingConcurrency.sqltest.js`
- Modify: `backend/src/repositories/reservationRepository.js`
- Modify: `frontend/test/reservationFrontend.test.js`
- Modify: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`

**Interfaces:**
- Consumes: `holdReservation({ reservationId, userId, copyId, notifiedAt, expiresAt })`
  and `reservationApi.processQueue(copyId)`.
- Produces: the shared FE08 order
  `member application lock -> Users/UserRoles -> BookCopies -> Reservations`;
  list/read results derive `queuePosition` from current `ACTIVE` rows ordered by
  `(ReservedAt, ReservationId)`; the page names only the server-selected member.

- [x] **Step 1: Write failing lock, position, and UI response tests.**

Assert `holdReservation` acquires `FE08-RESERVATION-MEMBER-${userId}` and current
member rows before its copy lock. Assert `reservationSelect` uses a correlated
`COUNT(*)` over `Status = 'ACTIVE'` with the `(ReservedAt, ReservationId)`
tie-breaker instead of selecting `r.QueuePosition`. Assert `confirmNotify` stores
the `processQueue` response, branches on `selectedReservation`, and does not use
`notifyTarget.member` in the success message.

- [x] **Step 2: Run focused tests and verify RED.**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRepository.test.js
node --test frontend/test/reservationFrontend.test.js
```

Expected: hold still locks the copy first, queue position is persisted-state
driven, and the page always reports the modal target as successful.

- [x] **Step 3: Implement canonical locks and response-driven feedback.**

Use the supplied `userId` to acquire the same member application lock used by
reservation creation, lock/recheck `Users/UserRoles`, then lock the copy and
reservation. Keep the legacy `QueuePosition` column write only for schema
compatibility, but never expose it as business truth. In the page:

```js
const result = await reservationApi.processQueue(notifyTarget.copyId);
await loadReservations();
if (!result.selectedReservation) {
  showToast('Không có thành viên đủ điều kiện trong hàng chờ.', 'info');
} else {
  const selected = mapReservation(result.selectedReservation);
  showToast(`Đã giữ sách và tạo thông báo cho ${selected.member}.`, 'success');
}
```

- [x] **Step 4: Run focused tests and verify GREEN.**

Repeat Step 2. Expected: FE08 repository and frontend tests pass.

---

### Task 8: Accumulate FE12 normalized unknown groups

**Files:**
- Modify: `backend/tests/reportRepository.test.js`
- Modify: `backend/src/repositories/reportRepository.js`

**Interfaces:**
- Consumes: grouped SQL rows passed to `toCountMap(...)`.
- Produces: normalized keys whose counts are accumulated, including several raw
  values that all normalize to `UNKNOWN`.

- [x] **Step 1: Write the failing aggregation test.**

Return two unsupported user statuses such as `SUSPENDED = 2` and `DELETED = 3`
from the grouped result set and assert:

```js
expect(report.metrics.usersByStatus.UNKNOWN).toBe(5);
```

- [x] **Step 2: Run the focused test and verify RED.**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reportRepository.test.js
```

Expected: `UNKNOWN` equals only the last raw group (`3`).

- [x] **Step 3: Implement additive normalization.**

Replace overwrite semantics with:

```js
counts[key] = (counts[key] || 0) + Number(row[countName] || 0);
```

- [x] **Step 4: Run the focused test and verify GREEN.**

Repeat Step 2. Expected: all report repository tests pass.

---

### Task 9: Re-run gates, obtain fresh H2, and update the draft PR

**Files:**
- Review: every file changed by Tasks 6-8
- Update checkboxes: this plan

**Interfaces:**
- Consumes: completed FE07/FE08/FE12 remediation.
- Produces: current L1-L4 evidence, an H2-reviewed commit, and a pushed update to
  the existing draft PR; merge/deploy remains blocked until H3.

- [x] **Step 1: Run focused and full verification.**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

Run the mutable SQL concurrency suite only with an explicitly disposable SQL
Server database and `FE07_SQL_TEST_ALLOW_MUTATION=true`; never point it at shared
Azure staging.

- [x] **Step 2: Perform security and diff review.**

Confirm all new SQL remains parameterized, lock resources derive only from
validated integer IDs, role/account checks occur server-side, error messages do
not expose internals, no schema/dependency/secret/PII changes exist, and the
untracked `output/audit-librarian-2026-07-22/` directory remains untouched.

- [x] **Step 3: Obtain a fresh H2 review.**

Run independent Standards and Spec reviews over the complete uncommitted diff and
the new evidence. Fix any valid finding and rerun the affected checks. H2 must
pass before staging or committing.

- [x] **Step 4: Commit and push the reviewed scope.**

Stage only the plan, production files, and regression tests from Tasks 6-8,
commit with a scoped `fix:` message, push the current branch, and verify the
existing draft PR checks. Do not merge or deploy; H3 is still required.

---

### Task 10: Keep the FE11 pagination E2E fixture compatible with FE07 limits

**Files:**
- Modify: `tests/e2e/fe11-admin-request-management.spec.js`
- Modify: `tests/e2e/support/systemTestServer.js`

**Interfaces:**
- Consumes: test-only
  `POST /__e2e__/seed-pending-borrow-requests { userId, copyId, count }`.
- Produces: bounded in-memory PENDING request/detail rows for FE11 pagination
  coverage without sending 21 invalid same-day requests through the public FE07
  command.

- [x] **Step 1: Reproduce the CI failure locally.**

Run the FE11 browser scenario and confirm its repeated public
`POST /api/borrow-requests` setup now correctly receives
`409 BORROW_DAILY_LIMIT_EXCEEDED`.

- [x] **Step 2: Move pagination volume into test-only setup.**

Add a bounded E2E control endpoint that validates an existing user and copy,
then seeds only the request/detail fields consumed by the FE11 admin read model.
Keep all production routes and the FE07 daily invariant unchanged.

- [x] **Step 3: Verify the focused and full browser suites.**

The focused FE11 scenario must pass 1/1 and the complete Chromium suite must
pass 4/4.

- [x] **Step 4: Obtain fresh H2, commit, push, and recheck CI.**

Review the three-file follow-up diff independently for Standards and Spec,
commit only after H2 passes, push the same Draft PR branch, and wait for the
replacement `foundation-checks` run. Do not merge or deploy without H3.

---

## Final Verification Remediation

The user approved the durable FE10 `PROCESSING` design on 2026-07-23. Tasks
11-15 implement the findings recorded in
`docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md`.

### Task 11: Make FE10 source binding and delivery transitions deterministic

**Files:**
- Modify: `.sdd/specs/feat-notification-management/{SPEC,PLAN,TASKS,CHANGELOG}.md`
- Modify: `.sdd/rfcs/ADR-002-database-design.md`
- Modify: `database/Librarymanagement.sql`
- Create: `database/migrations/2026-07-23-fe10-processing-status.sql`
- Modify: `backend/src/models/Notification.js`
- Modify: `backend/src/services/notificationService.js`
- Modify: `backend/src/repositories/notificationRepository.js`
- Modify: `backend/tests/notificationRoutes.test.js`
- Modify: `backend/tests/notificationRepository.test.js`

- [x] Write RED tests for missing internal source references, sensitive
  transition failure, duplicate replay while `PROCESSING`, and two-worker
  claim/finalization failure.
- [x] Add `PROCESSING` to the reviewed spec/schema lifecycle.
- [x] Commit claims before provider I/O and guard terminal transitions from
  `PROCESSING`.
- [x] Keep uncertain rows `PROCESSING`, exclude them from automatic retry, and
  return safe `DELIVERY_STATE_UNCERTAIN` for manual retry.
- [x] Run focused FE10 tests and the idempotent migration twice on a disposable
  database.

### Task 12: Make FE08 lifecycle audits atomic and staff feedback truthful

**Files:**
- Modify: `.sdd/specs/feat-reservation-management/{SPEC,PLAN,TASKS,CHANGELOG}.md`
- Modify: `backend/src/services/reservationService.js`
- Modify: `backend/src/repositories/reservationRepository.js`
- Modify: `backend/tests/reservationRoutes.test.js`
- Modify: `backend/tests/reservationService.test.js`
- Modify: `backend/tests/reservationRepository.test.js`
- Modify: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Modify: `frontend/test/reservationFrontend.test.js`

- [x] Write RED rollback tests for create/cancel/hold/expire audit failures and
  a post-commit notification-audit warning test.
- [x] Insert lifecycle audit entries inside their mutation transactions.
- [x] Preserve a committed hold on notification failure while surfacing a safe
  warning if its required failure audit cannot be persisted.
- [x] Remove the cached member name from the pre-confirmation dialog.
- [x] Run focused FE08 backend/frontend tests.

### Task 13: Correct FE07 business time, doubles, and SQL expectations

**Files:**
- Modify: `.sdd/specs/feat-borrowing-management/{SPEC,TASKS,CHANGELOG}.md`
- Modify: `backend/src/services/borrowingService.js`
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- Modify: `backend/tests/sql/borrowingConcurrency.sqltest.js`

- [x] Write RED Vietnam-midnight and in-memory copy-conflict tests.
- [x] Use the shared FE07 business-time helpers for return and renewal.
- [x] Align the in-memory repository with production copy-state checks.
- [x] Replace stale SQL expectations with role-based eligibility and explicit
  conflict outcomes.
- [x] Run focused FE07 unit and disposable SQL tests.

### Task 14: Restore FE12 parity and traceability

**Files:**
- Modify: `.sdd/specs/feat-reporting-statistics/{SPEC,TASKS,CHANGELOG}.md`
- Modify: `backend/tests/helpers/inMemoryReportRepositories.js`
- Modify: `backend/tests/reportInMemoryParity.test.js`

- [x] Write RED parity tests for `q`, inactive historical approvals, and stable
  user ordering.
- [x] Match the production SQL report semantics in the in-memory repository.
- [x] Add BR-FE12-016, FR-FE12-011, and AC-FE12-011 to traceability and update
  totals to `16/11/11`.
- [x] Run focused FE12 tests and traceability enforcement.

### Task 15: Complete L1-L4 verification and H2

- [x] Run all focused tests from Tasks 11-14.
- [x] Run full backend/frontend tests, lint, build, E2E, deployment utility,
  traceability, and diff hygiene.
- [x] Run mutable SQL suites only on named disposable local databases and
  remove them afterward.
- [x] Perform final security, standards, and spec review over the complete diff.
- [x] H2 and the H2 addendum approved the reviewed commits; PR #62 CI passed,
  Azure staging received the reviewed FE10 migration and product deployment, and
  the first H3 review returned the bounded findings covered below.

---

## H3 Remediation

The user approved the H3 remediation addendum in
`docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md`
on 2026-07-23. Tasks 16-19 correct only the first H3 findings. Generated
implementation and evidence changes remain uncommitted until a fresh H2 review.

### Task 16: Preserve FE08 expiration-promotion warnings

**Files:**
- Modify: `.sdd/specs/feat-reservation-management/SPEC.md`
- Modify: `.sdd/specs/feat-reservation-management/PLAN.md`
- Modify: `.sdd/specs/feat-reservation-management/TASKS.md`
- Modify: `.sdd/specs/feat-reservation-management/CHANGELOG.md`
- Modify: `backend/src/docs/openapi.yaml`
- Modify: `backend/src/services/reservationService.js`
- Modify: `backend/tests/reservationService.test.js`
- Modify: `backend/tests/reservationRoutes.test.js`

**Interfaces:**
- Consumes: the non-enumerable internal
  `processedReservation.notificationWarning` produced by `holdReservation`.
- Preserves: `processQueue` response
  `{ selectedReservation, notificationWarning? }`.
- Produces: `expireHolds` response
  `{ expiredCount, expired, promoted, notificationWarnings? }`.
- Each `notificationWarnings` item is exactly
  `{ reservationId, copyId, code, message }`; `promoted` DTOs do not change.

- [x] **Step 1: Add a failing service regression for the lost warning.**

Extend the existing `FR-FE08-019`/`FR-FE08-021` expiration coverage in
`backend/tests/reservationService.test.js`. Arrange one expired hold, one next
eligible reservation, a failed FE10 requester, and a failed
`RESERVATION_NOTIFY_FAILED` audit write. Assert the committed promotion remains
present and the warning is returned separately:

```js
await expect(service.expireHolds(LIBRARIAN, {})).resolves.toEqual({
  expiredCount: 1,
  expired,
  promoted: [heldReservation],
  notificationWarnings: [{
    reservationId: heldReservation.reservationId,
    copyId: heldReservation.copyId,
    code: 'RESERVATION_NOTIFY_AUDIT_FAILED',
    message: 'The reservation hold was created, but notification failure auditing was unavailable.',
  }],
});
expect(Object.keys(heldReservation)).not.toContain('notificationWarning');
```

Run:

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationService.test.js
```

Expected: the new assertion fails because `expireHolds` currently returns only
`expiredCount`, `expired`, and `promoted`.

- [x] **Step 2: Add a failing route serialization regression.**

In `backend/tests/reservationRoutes.test.js`, create two reservations for one
copy. Let the first queue notification succeed, then make the second requester
call fail when expiration promotes the next member. Make only the matching
failure-audit write fail. Assert:

```js
expect(expireResponse.status).toBe(200);
expect(expireResponse.body.promoted).toHaveLength(1);
expect(expireResponse.body.notificationWarnings).toEqual([{
  reservationId: expireResponse.body.promoted[0].reservationId,
  copyId: 1,
  code: 'RESERVATION_NOTIFY_AUDIT_FAILED',
  message: 'The reservation hold was created, but notification failure auditing was unavailable.',
}]);
expect(JSON.stringify(expireResponse.body)).not.toContain('provider unavailable');
expect(JSON.stringify(expireResponse.body)).not.toContain('audit unavailable');
expect(JSON.stringify(expireResponse.body)).not.toContain('hold.second@example.test');
```

Run:

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationRoutes.test.js
```

Expected: the route body has no `notificationWarnings` field before the service
fix.

- [x] **Step 3: Collect safe warnings without changing promoted DTOs.**

In `expireHolds`, accumulate warning metadata while the internal non-enumerable
property is still accessible:

```js
const promoted = [];
const notificationWarnings = [];

for (const item of expired) {
  const held = await processNextEligibleReservation(item.copyId, actor, context);
  if (held) {
    promoted.push(held);
    if (held.notificationWarning) {
      notificationWarnings.push({
        reservationId: held.reservationId,
        copyId: held.copyId,
        code: held.notificationWarning.code,
        message: held.notificationWarning.message,
      });
    }
  }
}

const result = { expiredCount: expired.length, expired, promoted };
if (notificationWarnings.length > 0) {
  result.notificationWarnings = notificationWarnings;
}
return result;
```

Do not make `notificationWarning` enumerable and do not add recipient, member,
provider, rendered-content, or stack data.

- [x] **Step 4: Update the approved FE08 contract and traceability.**

Update `FR-FE08-021`, the expire-holds API table row, the implementation plan,
task `FE08-T040`, and the changelog to distinguish the singular
`processQueue.notificationWarning` from the optional
`expireHolds.notificationWarnings[]`. In `backend/src/docs/openapi.yaml`,
document the `200` response with required `expiredCount`, `expired`, and
`promoted`, plus optional warning items that have:

```yaml
type: object
additionalProperties: false
required: [reservationId, copyId, code, message]
properties:
  reservationId: { type: integer }
  copyId: { type: integer }
  code:
    type: string
    enum: [RESERVATION_NOTIFY_AUDIT_FAILED]
  message: { type: string }
```

- [x] **Step 5: Run the complete focused FE08 slice.**

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationService.test.js tests/reservationRoutes.test.js tests/reservationRepository.test.js
npm.cmd --prefix frontend test -- --runInBand test/reservationFrontend.test.js
```

Expected: all focused FE08 service, route, repository, and frontend tests pass.

### Task 17: Match FE12 in-memory search to SQL `LIKE`

**Files:**
- Modify: `.sdd/specs/feat-reporting-statistics/SPEC.md`
- Modify: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Modify: `.sdd/specs/feat-reporting-statistics/CHANGELOG.md`
- Modify: `backend/tests/helpers/inMemoryReportRepositories.js`
- Modify: `backend/tests/reportInMemoryParity.test.js`

**Interfaces:**
- Preserves: production `reportRepository` parameter binding
  `Search = %${filters.q}%` and all public FE12 request/response DTOs.
- Produces: test-only matching parity for `%`, `_`, `[x-y]`, `[^x-y]`, and
  ordinary literal characters over user ID, account status, membership status,
  and role name only.

- [x] **Step 1: Add RED wildcard parity cases.**

Extend `backend/tests/reportInMemoryParity.test.js` with cases that differ from
literal `String.includes`:

```js
test.each([
  ['%MEMBER%', [3, 4]],
  ['L_BRARIAN', [2, 4]],
  ['[1-2]', [1, 2]],
  ['[^A-Z0-9]', []],
])('user q preserves SQL LIKE semantics for %s', async (q, expectedUserIds) => {
  const report = await makeReportRepository().getUserStatistics({ q });
  expect(report.rows.map((row) => row.userId)).toEqual(expectedUserIds);
});
```

Retain the existing `inactive` case and add a mixed-case literal assertion so
case-insensitive ordinary search remains covered.

Run:

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reportInMemoryParity.test.js
```

Expected: `%MEMBER%`, `L_BRARIAN`, and `[1-2]` fail against the current literal
`includes` implementation.

- [x] **Step 2: Add a small SQL-LIKE-to-RegExp compiler in the test helper.**

Add private helpers near the existing normalization functions in
`backend/tests/helpers/inMemoryReportRepositories.js`:

```js
function escapeRegexLiteral(character) {
  return character.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function sqlLikePatternToRegExp(pattern) {
  let source = '^';

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '%') {
      source += '.*';
    } else if (character === '_') {
      source += '.';
    } else if (character === '[') {
      const closingIndex = pattern.indexOf(']', index + 1);
      const negated = pattern[index + 1] === '^';
      const contentStart = index + (negated ? 2 : 1);
      if (closingIndex > contentStart) {
        const classBody = pattern
          .slice(contentStart, closingIndex)
          .replace(/\\/g, '\\\\')
          .replace(/\^/g, '\\^');
        source += `[${negated ? '^' : ''}${classBody}]`;
        index = closingIndex;
      } else {
        source += '\\[';
      }
    } else {
      source += escapeRegexLiteral(character);
    }
  }

  return new RegExp(`${source}$`, 'iu');
}

function matchesSqlLike(value, query) {
  const pattern = `%${String(query).trim()}%`;
  return sqlLikePatternToRegExp(pattern).test(String(value ?? ''));
}
```

Keep `-` unescaped inside a valid bracket class so ranges work. Treat an
unclosed/empty `[` as a literal. Do not change production SQL or introduce a
dependency.

- [x] **Step 3: Replace only the user-report literal comparison.**

Use the helper on the existing approved value list:

```js
if (filters.q) {
  const searchableValues = [
    user.userId,
    user.status,
    memberStatus,
    ...roles,
  ];
  if (!searchableValues.some((value) => matchesSqlLike(value, filters.q))) {
    return [];
  }
}
```

Do not add username, email, or other fields to the FE12 user-report search.

- [x] **Step 4: Record the exact parity rule in FE12 documentation.**

Amend `BR-FE12-016` and task `FE12-N10` to state that production keeps
parameterized SQL `LIKE` semantics and the in-memory repository emulates the
same wildcard behavior for approved fields. Add a changelog bullet describing
the test-parity correction without claiming a production API change.

- [x] **Step 5: Run focused FE12 and repository contract tests.**

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reportInMemoryParity.test.js tests/reportRoutes.test.js tests/reportRepository.test.js
```

Expected: all FE12 parity, route, and SQL-source contract tests pass.

### Task 18: Correct Azure and governance evidence

**Files:**
- Modify: `docs/deployment/azure-staging-guide.md`
- Modify: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Modify: `.sdd/specs/feat-reservation-management/TASKS.md`
- Modify: `.sdd/specs/feat-notification-management/TASKS.md`
- Modify: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Modify: `docs/superpowers/plans/2026-07-23-fe07-fe08-fe10-fe12-business-rule-remediation.md`
- Create: `.sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md`

**Interfaces:**
- Preserves: the already reviewed Azure migration and deployment.
- Produces: an operator-safe local-idempotence/staging-once procedure, read-only
  constraint proof, and truthful H2/H3 state.

- [x] **Step 1: Move idempotence proof off shared staging.**

Replace the current instruction to execute the migration sequence twice on
staging with this boundary:

1. Run each candidate migration twice on a named disposable local SQL Server
   database and remove that database after proof.
2. Review the exact SQL and target database.
3. Execute the approved sequence once on `LibraryManagementStaging`.
4. Run read-only target/schema/constraint queries.
5. Remove the exact temporary firewall rule immediately.

Do not instruct operators to use staging for mutable idempotence tests.

- [x] **Step 2: Add a read-only FE10 constraint check.**

Extend the guide's existing verification query:

```sql
CASE WHEN EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE parent_object_id = OBJECT_ID(N'dbo.Notifications')
    AND name = N'CK_Notifications_Status'
    AND definition LIKE N'%PROCESSING%'
) THEN 1 ELSE 0 END AS NotificationProcessingAllowed
```

Expected: `DatabaseName = LibraryManagementStaging`, `TableCount = 20`, each
listed row-version/reconciliation column length is `8`, and
`NotificationProcessingAllowed = 1`.

- [x] **Step 3: Correct stale task-gate statements.**

For `FE07-T046`, `FE08-T040`, `FE10-S10`, and `FE12-N10`, record:

- initial H2 and the H2 addendum passed;
- implementation commit `97aca62` and PR CI run `30014066260` passed;
- the first H3 review found the bounded addendum items;
- this remediation requires fresh H2, updated PR CI, and repeated H3;
- no feature may claim merge/post-merge completion yet.

Do not rewrite historical Phase 2 completion records.

- [x] **Step 4: Create the remediation validation record.**

Record the exact branch/PR/SHA evidence, RED and GREEN commands/results, changed
contract boundaries, current Azure evidence, latest `origin/main`, security and
diff review, and remaining H2/H3 gates. State that:

- the FE10 migration had already been proven twice locally and applied once to
  staging;
- staging product SHA `9b02c7e` was deployed by run `30012925318`;
- this remediation does not require replaying the migration;
- post-merge staging acceptance is read-only schema plus application smoke.

Use no credentials, connection strings, member data, or firewall IP values.

- [x] **Step 5: Verify deployment documentation and diff hygiene.**

```powershell
npm.cmd run test:deployment
rg -n "second time|twice|H2 review remains pending|H2 remains before" docs/deployment/azure-staging-guide.md .sdd/specs/feat-borrowing-management/TASKS.md .sdd/specs/feat-reservation-management/TASKS.md .sdd/specs/feat-notification-management/TASKS.md .sdd/specs/feat-reporting-statistics/TASKS.md
git diff --check
```

Expected: deployment utility tests pass; any remaining `twice` reference points
only to a named disposable local database; stale current-batch H2-pending
phrases are absent; diff check is clean.

### Task 19: Re-verify, obtain H2, and prepare repeated H3

**Files:**
- Modify: `.sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md`
- Inspect only: all files changed relative to `97aca62`

**Interfaces:**
- Consumes: Tasks 16-18 and the latest `origin/main`.
- Produces: a fresh H2-reviewed commit and updated PR #62 with passing current
  merge-ref checks. Merge and post-merge deployment remain blocked on repeated
  H3.

- [x] **Step 1: Run focused checks and traceability.**

```powershell
$env:TZ = 'UTC'
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationService.test.js tests/reservationRoutes.test.js tests/reservationRepository.test.js
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reportInMemoryParity.test.js tests/reportRoutes.test.js tests/reportRepository.test.js
npm.cmd --prefix frontend test -- --runInBand test/reservationFrontend.test.js
npm.cmd run test:deployment
npm.cmd run trace:enforce
git diff --check
```

Expected: every command exits `0`.

- [x] **Step 2: Run the repository-equivalent L1-L4 suite.**

```powershell
$env:TZ = 'UTC'
npm.cmd audit --audit-level=high
npm.cmd --prefix backend audit --audit-level=high
npm.cmd --prefix frontend audit --audit-level=high
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run test:deployment
node -e "const app = require('./backend/src/index'); if (!app || typeof app.listen !== 'function') throw new Error('Express app export is invalid');"
```

Expected: all audits and automated checks exit `0`; backend coverage remains at
or above the repository threshold; Chromium E2E passes in full.

- [x] **Step 3: Review security, scope, and latest-main compatibility.**

```powershell
git fetch origin main
git status --short
git diff --stat 97aca62
git diff --check 97aca62
git diff --name-only 97aca62
git merge-tree --write-tree origin/main 97aca62
git diff -- backend/src/services/reservationService.js backend/tests/helpers/inMemoryReportRepositories.js backend/src/docs/openapi.yaml docs/deployment/azure-staging-guide.md
```

Confirm the virtual merge is clean, all SQL remains parameterized, warnings are
PII/provider-safe, no permission/schema/dependency expansion exists, and the
user-owned `output/audit-librarian-2026-07-22/` directory remains untracked and
untouched. Re-check any `backend/src/docs/openapi.yaml` hunk against the latest
FE11 change on `origin/main`.

- [x] **Step 4: Stop for fresh H2 before staging or commit.**

Present the complete uncommitted diff and the validation record for independent
Standards and Spec review. Fix every valid finding and rerun affected checks.
Do not stage, commit, push, run mutable Azure SQL, redeploy, or merge before
explicit H2 approval.

- [ ] **Step 5: After H2, stage only the reviewed scope and push PR #62.**

```powershell
git add -- `
  .sdd/specs/feat-borrowing-management/TASKS.md `
  .sdd/specs/feat-reservation-management/SPEC.md `
  .sdd/specs/feat-reservation-management/PLAN.md `
  .sdd/specs/feat-reservation-management/TASKS.md `
  .sdd/specs/feat-reservation-management/CHANGELOG.md `
  .sdd/specs/feat-notification-management/TASKS.md `
  .sdd/specs/feat-reporting-statistics/SPEC.md `
  .sdd/specs/feat-reporting-statistics/TASKS.md `
  .sdd/specs/feat-reporting-statistics/CHANGELOG.md `
  .sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md `
  backend/src/docs/openapi.yaml `
  backend/src/services/reservationService.js `
  backend/tests/reservationService.test.js `
  backend/tests/reservationRoutes.test.js `
  backend/tests/helpers/inMemoryReportRepositories.js `
  backend/tests/reportInMemoryParity.test.js `
  docs/deployment/azure-staging-guide.md `
  docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md `
  docs/superpowers/plans/2026-07-23-fe07-fe08-fe10-fe12-business-rule-remediation.md
git diff --cached --check
git status --short
git commit -m "fix: close FE08 and FE12 H3 findings"
git push origin HEAD
```

Expected: only the reviewed files are staged; `output/` is absent from the
index; the commit and push succeed on
`codex/fe07-fe08-fe10-fe12-business-rules`.

- [ ] **Step 6: Require current PR checks and stop for repeated H3.**

```powershell
gh pr checks 62 --watch
gh pr ready 62
gh pr view 62 --json headRefOid,baseRefOid,isDraft,mergeable,mergeStateStatus,statusCheckRollup,url
```

Expected: required checks pass for the new head and current `main` merge ref,
the PR is ready, and GitHub reports it mergeable. Repeat Standards and Spec H3
over the exact PR diff. Stop for explicit H3 approval; do not merge on an old
CI result or if `main` moves incompatibly.

- [ ] **Step 7: Merge and verify Azure staging only after repeated H3 approval.**

After explicit H3 approval, merge PR #62 using the repository's normal merge
method, wait for the exact post-merge `main` CI and automatic Azure staging
deployment, then run the existing read-only staging smoke suite and the
read-only schema/constraint query from Task 18. Do not replay the FE10 migration
unless the read-only check proves the reviewed constraint is absent and a new
operator review explicitly authorizes that separate correction.
