# FE08 Borrowing-Reservation Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not use subagents for this plan.

**Goal:** Close the FE07-FE08 lifecycle gap so reservation priority blocks ordinary borrowing, the notified owner can request the held copy, and FE07 approval atomically fulfills the matching reservation.

**Architecture:** FE07 remains the only owner of borrow request creation and approval. Borrowability is classified from copy state plus `ACTIVE`/`NOTIFIED` reservation claims at create time and revalidated under SQL locks at approval time. All copy-reservation mutations use the shared `BookCopies -> Reservations` lock order; no endpoint or schema is added.

**Tech Stack:** Node.js, Express.js, SQL Server through `mssql`, Jest/Supertest, React/Vite frontend error mapping, Markdown SDD artifacts.

## Global Constraints

- Preserve Phase 1 copy-level reservations by `CopyId`.
- Preserve manual librarian queue processing.
- Preserve FE07 all-or-nothing multi-copy requests and approvals.
- Preserve maximum 5 active borrowed copies, 14-day loan duration, one renewal, overdue/fine blockers, and role checks.
- Do not expose another reservation owner's identity in an error response.
- Do not add a fulfillment endpoint, table, column, dependency, or automatic queue job.
- Update specs before behavior and write every production change through RED -> GREEN TDD.
- Use `BookCopies -> Reservations` lock order for queue hold, cancellation, expiration, and borrow approval.
- Do not modify FE09 fine calculation or FE10 delivery behavior.

---

## File Map

### Specification And Traceability

- `.sdd/specs/feat-borrowing-management/SPEC.md`: FE07 reservation-aware borrowability and approval rules.
- `.sdd/specs/feat-borrowing-management/PLAN.md`: FE07 implementation boundary and transaction plan.
- `.sdd/specs/feat-borrowing-management/TASKS.md`: executable integration tasks and validation gate.
- `.sdd/specs/feat-borrowing-management/CHANGELOG.md`: behavior change record.
- `.sdd/specs/feat-reservation-management/SPEC.md`: final CopyId/cancellation language and FE07 fulfillment trigger.
- `.sdd/specs/feat-reservation-management/PLAN.md`: remove the old fulfillment exclusion and describe FE07 handoff.
- `.sdd/specs/feat-reservation-management/TASKS.md`: mark the integration work explicitly.
- `.sdd/specs/feat-reservation-management/CHANGELOG.md`: behavior change record.

### Backend

- `backend/src/services/borrowingService.js`: classify copy borrowability for the current member and map repository outcomes.
- `backend/src/repositories/borrowingRepository.js`: copy/reservation read model and atomic approval fulfillment.
- `backend/src/repositories/reservationRepository.js`: align cancel/expiration lock ordering.
- `backend/tests/helpers/inMemoryBorrowingRepositories.js`: mirror borrowability and atomic rollback behavior.
- `backend/tests/borrowingRoutes.test.js`: create/approval/rollback regression tests.
- `backend/tests/sql/borrowingConcurrency.sqltest.js`: real SQL lock and transaction tests.
- `backend/tests/reservationRoutes.test.js`: cancellation/expiration behavior after lock-order alignment.
- `backend/src/docs/openapi.yaml`: document the two new safe conflict codes without changing endpoint shapes.

### Frontend And Validation

- `frontend/src/api/apiErrorMessages.js`: actionable Vietnamese messages.
- `frontend/test/apiErrorMessages.test.js`: source contract for those messages.
- `.sdd/reviews/fe07-fe08-borrowing-reservation-integration-validation-2026-07-15.md`: final automated evidence and review checklist.

---

### Task 1: Align FE07 And FE08 Source-Of-Truth Contracts

**Files:**
- Modify: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Modify: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Modify: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Modify: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-reservation-management/SPEC.md`
- Modify: `.sdd/specs/feat-reservation-management/PLAN.md`
- Modify: `.sdd/specs/feat-reservation-management/TASKS.md`
- Modify: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-07-15-fe08-borrowing-reservation-integration-design.md`.
- Produces: stable `BR`/`FR`/`AC` identifiers used by code comments and tests in Tasks 2-5.

- [ ] **Step 1: Update FE07 rules and version**

Bump FE07 `SPEC.md` from `0.3.2` to `0.4.0`, set `Last Updated: 2026-07-15`, and add these requirements:

```markdown
- BR-FE07-023: FE07 may accept a copy only when it is `AVAILABLE` with no `ACTIVE`/`NOTIFIED` reservation claim, or when it is `RESERVED` by a `NOTIFIED` reservation owned by the requesting member.
- BR-FE07-024: An `ACTIVE` reservation queue for a copy blocks ordinary borrow-request creation and approval until staff processes or resolves that queue.
- BR-FE07-025: Approving a borrow request for a requester-owned `NOTIFIED` reservation must atomically change the matching reservation to `FULFILLED` with the borrow request, details, copy status, and audit records.

- FR-FE07-023: IF a requested copy has an `ACTIVE` reservation queue, FE07 shall reject create/approve with `RESERVATION_QUEUE_PRIORITY` and shall change no record.
- FR-FE07-024: IF a copy is `RESERVED` by a `NOTIFIED` reservation owned by the borrowing member, FE07 shall allow request creation and shall revalidate that ownership during approval.
- FR-FE07-025: WHEN staff approves a held owner's request, FE07 shall update every matching `NOTIFIED` reservation to `FULFILLED` in the approval transaction.

- AC-FE07-015: Given an active reservation queue, when another member creates or approves a borrow request, then FE07 returns `409 RESERVATION_QUEUE_PRIORITY` and preserves all state.
- AC-FE07-016: Given a requester-owned notified reservation and reserved copy, when the owner creates a borrow request, then FE07 creates the normal pending request without releasing the hold.
- AC-FE07-017: Given that pending request, when staff approves it, then borrowing records, copy status, reservation fulfillment, and audits commit atomically.
```

Replace the old absolute-availability wording with the approved borrowability contract. Keep `OVERDUE` derived and keep the five-copy limit unchanged.

- [ ] **Step 2: Update FE08 rules and remove stale ambiguity**

Bump FE08 `SPEC.md` from `0.3.1` to `0.4.0`, set `Last Updated: 2026-07-15`, and add/replace:

```markdown
- BR-FE08-003: A member may cancel only their own reservation while its status is `ACTIVE` or `NOTIFIED`.
- BR-FE08-015: Only FE07 approval for the same member and copy may transition a `NOTIFIED` reservation to `FULFILLED`.
- BR-FE08-016: An `ACTIVE` queue entry grants reservation priority and blocks ordinary FE07 create/approve actions for that copy until queue processing or terminal resolution.

- FR-FE08-025: WHEN FE07 approves the notified reservation owner's borrow request, FE08 shall transition the matching reservation to `FULFILLED` in the same transaction.
- FR-FE08-026: IF FE07 evaluates a copy with an active queue or another member's notified hold, FE08 reservation state shall prevent the ordinary borrow operation without exposing the reservation owner.

- AC-FE08-011: Given a notified owner borrows the held copy through FE07 approval, then the reservation becomes `FULFILLED` and the copy becomes `BORROWED` atomically.
- AC-FE08-012: Given a copy has active reservation priority, when another member attempts to borrow it, then the operation is denied and queue order is preserved.
```

Set `copyId` to required in Section 10.2 and change `POST /api/reservations` to `{ copyId: number }`. Remove “team may change” and “depends on database decision.”

- [ ] **Step 3: Update plans, tasks, and changelogs**

Add an integration section to both plans. Add checked/unchecked task rows using these IDs:

```markdown
| FE07-T029 | Enforce reservation-aware borrowability for create and approval. | BR-FE07-023/024; AC-FE07-015/016 | FE08 queue state | RED/GREEN route tests pass. |
| FE07-T030 | Fulfill matching notified reservations in the approval transaction. | BR-FE07-025; AC-FE07-017 | FE07-T029 | SQL and in-memory rollback tests pass. |
| FE08-T025 | Align cancellation/expiration lock order and FE07 fulfillment handoff. | BR-FE08-015/016; AC-FE08-011/012 | FE07-T029/T030 | Concurrency tests pass without deadlock. |
```

Record the design decision and no-schema/no-endpoint boundary in both changelogs.

- [ ] **Step 4: Run documentation checks**

Run:

```powershell
rg -n "depends on database decision|team may change|cancel only their own active reservations|FE07 borrow/return or fulfillment implementation" .sdd/specs/feat-borrowing-management .sdd/specs/feat-reservation-management
git diff --check
```

Expected: the stale scans return no active requirement text; `git diff --check` exits `0`.

- [ ] **Step 5: Commit Task 1**

```powershell
git add .sdd/specs/feat-borrowing-management .sdd/specs/feat-reservation-management
git commit -m "docs: align borrowing reservation contracts"
```

---

### Task 2: Enforce Reservation Priority At Borrow-Request Creation

**Files:**
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- Modify: `backend/src/repositories/borrowingRepository.js`
- Modify: `backend/src/services/borrowingService.js`

**Interfaces:**
- Produces: `borrowingRepository.findBorrowabilityByCopyIds(copyIds, userId)` returning copy state plus reservation claim fields.
- Produces: `validateCopiesBorrowable(copyIds, userId)` used by both create and approve.

- [ ] **Step 1: Add RED route tests**

Append focused tests with this setup pattern:

```js
test('active reservation queue blocks ordinary borrow request creation', async () => {
  const { app, authDependencies, borrowingDependencies } = makeTestApp();
  const member = await createVerifiedUser({ app, authDependencies, borrowingDependencies, email: 'queue-blocked@example.test' });
  const queueOwner = await createVerifiedUser({ app, authDependencies, borrowingDependencies, email: 'queue-owner@example.test' });

  borrowingDependencies.state.reservations.push({
    reservationId: 901,
    userId: queueOwner.userId,
    copyId: 1,
    status: 'ACTIVE',
    reservedAt: new Date('2026-06-09T00:00:00.000Z'),
  });

  const response = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] });

  expect(response.status).toBe(409);
  expect(response.body.error.code).toBe('RESERVATION_QUEUE_PRIORITY');
  expect(borrowingDependencies.state.borrowRequests).toHaveLength(0);
});

test('notified owner can request their reserved copy', async () => {
  const { app, authDependencies, borrowingDependencies } = makeTestApp();
  const member = await createVerifiedUser({ app, authDependencies, borrowingDependencies, email: 'held-owner@example.test' });
  borrowingDependencies.state.copies.find((copy) => copy.copyId === 1).status = 'RESERVED';
  borrowingDependencies.state.reservations.push({
    reservationId: 902,
    userId: member.userId,
    copyId: 1,
    status: 'NOTIFIED',
    notifiedAt: new Date('2026-06-09T00:00:00.000Z'),
    expiresAt: new Date('2026-06-11T00:00:00.000Z'),
  });

  const response = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] });

  expect(response.status).toBe(201);
  expect(response.body.borrowRequest.details[0]).toMatchObject({ copyId: 1, status: 'REQUESTED' });
  expect(borrowingDependencies.state.reservations[0].status).toBe('NOTIFIED');
});
```

Add a third test asserting another member receives `COPY_NOT_AVAILABLE` for the same `RESERVED` copy and the response does not contain the owner's email/user ID.

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm.cmd --prefix backend test -- --runInBand borrowingRoutes.test.js -t "reservation queue|reserved copy"
```

Expected: active queue currently allows creation and notified owner currently receives `COPY_NOT_AVAILABLE`.

- [ ] **Step 3: Add the repository read model**

Replace the private FE07 copy lookup with:

```js
async function findBorrowabilityByCopyIds(copyIds, userId) {
  // Parameterize the existing copy ID list exactly as findCopiesByIds does.
  // OUTER APPLY one ACTIVE queue claim and one NOTIFIED hold per copy.
  // Return copyId/book/status plus hasActiveReservation,
  // notifiedReservationId, and notifiedReservationUserId.
}
```

The SQL projection must use:

```sql
OUTER APPLY (
  SELECT TOP 1 r.ReservationId
  FROM Reservations r
  WHERE r.CopyId = bc.CopyId AND r.Status = 'ACTIVE'
  ORDER BY r.ReservedAt ASC, r.ReservationId ASC
) activeQueue
OUTER APPLY (
  SELECT TOP 1 r.ReservationId, r.UserId
  FROM Reservations r
  WHERE r.CopyId = bc.CopyId AND r.Status = 'NOTIFIED'
  ORDER BY r.NotifiedAt ASC, r.ReservationId ASC
) notifiedHold
```

Mirror those fields in `inMemoryBorrowingRepositories.js` and include `reservations` in `snapshotMutationState()` / `restoreMutationState()`.

- [ ] **Step 4: Implement the minimal service classifier**

Use one classifier for create and approval:

```js
function classifyCopyBorrowability(copy, userId) {
  if (copy.status === 'AVAILABLE' && copy.hasActiveReservation) {
    throw errors.conflict('RESERVATION_QUEUE_PRIORITY', 'Reservation queue priority must be processed before borrowing.');
  }

  if (copy.status === 'AVAILABLE' && !copy.notifiedReservationId) {
    return 'NORMAL_AVAILABLE';
  }

  if (
    copy.status === 'RESERVED' &&
    copy.notifiedReservationId &&
    Number(copy.notifiedReservationUserId) === Number(userId)
  ) {
    return 'HELD_FOR_MEMBER';
  }

  if (copy.status === 'RESERVED' && !copy.notifiedReservationId) {
    throw errors.conflict('RESERVATION_STATE_CONFLICT', 'Reserved copy state is inconsistent.');
  }

  throw errors.conflict('COPY_NOT_AVAILABLE', 'A requested copy is not available.');
}
```

`validateCopiesBorrowable(copyIds, userId)` must still return `COPY_NOT_FOUND` for missing IDs and must classify every copy before request creation.

- [ ] **Step 5: Verify GREEN**

Run the same focused command, then:

```powershell
npm.cmd --prefix backend test -- --runInBand borrowingRoutes.test.js
```

Expected: all FE07 route tests pass.

- [ ] **Step 6: Commit Task 2**

```powershell
git add backend/src/services/borrowingService.js backend/src/repositories/borrowingRepository.js backend/tests/helpers/inMemoryBorrowingRepositories.js backend/tests/borrowingRoutes.test.js
git commit -m "feat: enforce reservation priority in borrowing"
```

---

### Task 3: Fulfill Notified Reservations Inside Borrow Approval

**Files:**
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- Modify: `backend/src/services/borrowingService.js`
- Modify: `backend/src/repositories/borrowingRepository.js`

**Interfaces:**
- Extends: `approveBorrowRequest(...)` result outcomes.
- Produces: `{ outcome: 'APPROVED', borrowRequest, fulfilledReservationIds }`.

- [ ] **Step 1: Add RED approval and rollback tests**

Add tests proving:

```js
expect(approveResponse.status).toBe(200);
expect(heldReservation.status).toBe('FULFILLED');
expect(heldCopy.status).toBe('BORROWED');
expect(auditActions).toEqual(expect.arrayContaining(['BORROW_REQUEST_APPROVE', 'RESERVATION_FULFILL']));
```

Add a rollback repository wrapper that throws only after writing `RESERVATION_FULFILL`:

```js
const reservationAuditFailingRepository = {
  create: jest.fn(async (entry) => {
    await authDependencies.auditLogRepository.create(entry);
    if (entry.action === 'RESERVATION_FULFILL') {
      throw new Error('Reservation audit write failed.');
    }
  }),
};
```

After the failed approval assert request `PENDING`, detail `REQUESTED`, copy `RESERVED`, reservation `NOTIFIED`, and no surviving approval/fulfillment audit.

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm.cmd --prefix backend test -- --runInBand borrowingRoutes.test.js -t "fulfills reservation|reservation audit"
```

Expected: approval rejects `RESERVED` or leaves reservation `NOTIFIED`.

- [ ] **Step 3: Update the in-memory approval transaction**

For each requested detail, classify the copy under the same rules. Collect matching notified reservations, update them only after every validation passes, and write both audit types before returning. The snapshot must restore reservations and logs on failure.

Return repository outcomes exactly as follows:

```js
{ outcome: 'RESERVATION_QUEUE_PRIORITY' }
{ outcome: 'RESERVATION_STATE_CONFLICT' }
{ outcome: 'COPY_NOT_AVAILABLE' }
{ outcome: 'APPROVED', borrowRequest, fulfilledReservationIds }
```

- [ ] **Step 4: Update the SQL approval transaction**

Inside `approveBorrowRequest`, after locking each copy, lock its queue claims:

```sql
SELECT ReservationId, UserId, Status
FROM Reservations WITH (UPDLOCK, HOLDLOCK)
WHERE CopyId = @CopyId
  AND Status IN ('ACTIVE', 'NOTIFIED')
ORDER BY CASE WHEN Status = 'NOTIFIED' THEN 0 ELSE 1 END,
         ReservedAt ASC,
         ReservationId ASC;
```

Apply the borrowability matrix under those locks. After request/detail/copy updates, update every matching notified reservation:

```sql
UPDATE Reservations
SET Status = 'FULFILLED', UpdatedAt = GETDATE()
WHERE ReservationId = @ReservationId
  AND UserId = @MemberUserId
  AND CopyId = @CopyId
  AND Status = 'NOTIFIED';
```

Require one affected row for each expected fulfillment. A mismatch returns `RESERVATION_STATE_CONFLICT` after rollback.

For each fulfilled reservation, clone the service-provided audit base with:

```js
{
  action: 'RESERVATION_FULFILL',
  targetType: 'RESERVATION',
  targetId: reservationId,
  metadata: { requestId, copyId, memberUserId },
}
```

- [ ] **Step 5: Map outcomes in the service**

Add explicit mappings before the generic fallback:

```js
if (approvalResult?.outcome === 'RESERVATION_QUEUE_PRIORITY') {
  throw errors.conflict('RESERVATION_QUEUE_PRIORITY', 'Reservation queue priority must be processed before borrowing.');
}
if (approvalResult?.outcome === 'RESERVATION_STATE_CONFLICT') {
  throw errors.conflict('RESERVATION_STATE_CONFLICT', 'Reserved copy state changed. Reload and try again.');
}
```

- [ ] **Step 6: Verify GREEN and commit**

Run:

```powershell
npm.cmd --prefix backend test -- --runInBand borrowingRoutes.test.js borrowingRepository.test.js
git diff --check
```

Then commit:

```powershell
git add backend/src/services/borrowingService.js backend/src/repositories/borrowingRepository.js backend/tests/helpers/inMemoryBorrowingRepositories.js backend/tests/borrowingRoutes.test.js
git commit -m "feat: fulfill reservations during borrow approval"
```

---

### Task 4: Align Reservation Lock Order And Add SQL Concurrency Evidence

**Files:**
- Modify: `backend/src/repositories/reservationRepository.js`
- Modify: `backend/tests/reservationRoutes.test.js`
- Modify: `backend/tests/sql/borrowingConcurrency.sqltest.js`

**Interfaces:**
- Preserves all FE08 endpoint and DTO shapes.
- Makes every copy-reservation mutation lock `BookCopies` before `Reservations`.

- [ ] **Step 1: Add RED cancellation/expiration regression tests**

Keep existing route expectations and add source/behavior tests proving cancellation of `NOTIFIED` releases only its `RESERVED` copy, while an already fulfilled reservation cannot be cancelled.

```js
expect(cancelResponse.status).toBe(409);
expect(cancelResponse.body.error.code).toBe('RESERVATION_NOT_ACTIVE');
expect(state.reservations.find(({ reservationId }) => reservationId === fulfilledId).status).toBe('FULFILLED');
```

- [ ] **Step 2: Align SQL lock order**

Refactor `cancelReservation` to:

1. Read `CopyId` without mutation.
2. Begin transaction.
3. Lock `BookCopies` by `CopyId` using `UPDLOCK, HOLDLOCK`.
4. Re-read and lock the reservation using `UPDLOCK, HOLDLOCK` with `Status IN ('ACTIVE','NOTIFIED')`.
5. Cancel and release only when the re-read state remains valid.

Refactor `expireOverdueHolds` to identify candidate copy/reservation IDs, sort by `CopyId`, lock copies first, revalidate each `NOTIFIED` expiration, then update reservations/copies in the same transaction.

- [ ] **Step 3: Add SQL seed helpers**

Extend the SQL test seed with `reservationIds` and:

```js
async function insertReservation(seed, { userId, copyId, status, reservedAt, notifiedAt = null, expiresAt = null }) {
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .input('CopyId', sql.Int, copyId)
    .input('Status', sql.NVarChar(20), status)
    .input('ReservedAt', sql.DateTime, reservedAt)
    .input('NotifiedAt', sql.DateTime, notifiedAt)
    .input('ExpiresAt', sql.DateTime, expiresAt)
    .query(`
      INSERT INTO Reservations (UserId, CopyId, ReservedAt, NotifiedAt, ExpiresAt, Status)
      OUTPUT INSERTED.ReservationId
      VALUES (@UserId, @CopyId, @ReservedAt, @NotifiedAt, @ExpiresAt, @Status)
    `);
  const reservationId = result.recordset[0].ReservationId;
  seed.reservationIds.push(reservationId);
  return reservationId;
}
```

Delete reservation audits and reservations before deleting copies/users in `cleanSeed`.

- [ ] **Step 4: Add SQL RED/GREEN scenarios**

Add these tests:

- Active queue plus ordinary pending request: approval returns `RESERVATION_QUEUE_PRIORITY`, queue hold succeeds, final copy `RESERVED`, reservation `NOTIFIED`, request `PENDING`.
- Held owner approval: final request `APPROVED`, copy `BORROWED`, reservation `FULFILLED`.
- Two approvals for one held copy: exactly one `APPROVED`; the other remains `PENDING` with safe conflict outcome.
- Cancellation/expiration versus approval: no deadlock; final state matches serialized order and any remaining `ACTIVE` queue still blocks ordinary approval.

Run only when the mutation-safe SQL environment is configured:

```powershell
$env:FE07_SQL_TEST_ALLOW_MUTATION='true'
npm.cmd --prefix backend test -- --runTestsByPath tests/sql/borrowingConcurrency.sqltest.js
```

Expected: all targeted SQL tests pass; no timeout/deadlock.

- [ ] **Step 5: Commit Task 4**

```powershell
git add backend/src/repositories/reservationRepository.js backend/tests/reservationRoutes.test.js backend/tests/sql/borrowingConcurrency.sqltest.js
git commit -m "fix: serialize reservation and borrowing transitions"
```

---

### Task 5: Publish Error And API Contracts

**Files:**
- Modify: `frontend/test/apiErrorMessages.test.js`
- Modify: `frontend/src/api/apiErrorMessages.js`
- Modify: `backend/src/docs/openapi.yaml`

**Interfaces:**
- Produces Vietnamese handling for `RESERVATION_QUEUE_PRIORITY` and `RESERVATION_STATE_CONFLICT`.
- Preserves API endpoint/request/response shapes.

- [ ] **Step 1: Add RED frontend message assertions**

Add to `expectedMessages`:

```js
RESERVATION_QUEUE_PRIORITY: 'Bản sao này đang có hàng đợi đặt chỗ. Thủ thư cần xử lý hàng đợi trước khi duyệt mượn.',
RESERVATION_STATE_CONFLICT: 'Trạng thái giữ chỗ vừa thay đổi. Vui lòng tải lại dữ liệu và thử lại.',
```

Run:

```powershell
node --test frontend/test/apiErrorMessages.test.js
```

Expected: FAIL because the new codes fall through to backend copy.

- [ ] **Step 2: Add the messages and OpenAPI notes**

Add the same entries to `BORROWING_ERROR_MESSAGES`. Document both `409` codes on borrow-request create/approve responses; do not add endpoints or fields.

- [ ] **Step 3: Verify and commit**

Run:

```powershell
node --test frontend/test/apiErrorMessages.test.js
npm.cmd --prefix backend test -- --runInBand borrowingContract.test.js
git diff --check
```

Commit:

```powershell
git add frontend/src/api/apiErrorMessages.js frontend/test/apiErrorMessages.test.js backend/src/docs/openapi.yaml
git commit -m "docs: expose reservation priority conflicts"
```

---

### Task 6: Full Validation And Human Review Gate

**Files:**
- Create: `.sdd/reviews/fe07-fe08-borrowing-reservation-integration-validation-2026-07-15.md`
- Modify only when evidence requires: files from Tasks 1-5.

**Interfaces:**
- Produces final automated evidence; does not merge or push.

- [ ] **Step 1: Run focused backend suites**

```powershell
npm.cmd --prefix backend test -- --runInBand borrowingRoutes.test.js borrowingRepository.test.js reservationRoutes.test.js reservationService.test.js systemIntegration.test.js
```

Expected: all focused suites pass with 0 failures.

- [ ] **Step 2: Run full non-SQL suites**

```powershell
npm.cmd --prefix backend test -- --runInBand
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Expected: all commands exit `0`; the existing non-blocking Vite chunk warning may remain.

- [ ] **Step 3: Run SQL and traceability gates**

When the configured mutation-safe SQL environment is available:

```powershell
$env:FE07_SQL_TEST_ALLOW_MUTATION='true'
npm.cmd --prefix backend run test:sql:fe07
npm.cmd run trace:enforce
```

Expected: no SQL failures, deadlocks, or missing traceability IDs.

- [ ] **Step 4: Verify scope and whitespace**

```powershell
git diff main...HEAD --check
git diff main...HEAD --name-only
git diff main...HEAD -- database frontend/src/page frontend/src/component backend/src/routes
```

Expected: no schema, page/component, or route changes; changed files remain inside approved specs, FE07/FE08 service/repositories/tests, OpenAPI, frontend error mapping, and review evidence.

- [ ] **Step 5: Write the validation record**

Create the review file with:

```markdown
# FE07-FE08 Borrowing-Reservation Integration Validation - 2026-07-15

Status: READY FOR HUMAN REVIEW

## Automated Evidence

| Check | Result |
| --- | --- |
| Focused backend tests | PASS |
| Full backend tests | PASS |
| Frontend tests/lint/build | PASS |
| SQL concurrency | PASS or NOT RUN with exact environment reason |
| Traceability | PASS |
| Diff whitespace/scope | PASS |

## Human Review Checklist

- Active queue blocks ordinary member borrow request.
- Notified owner can request the held copy.
- Staff approval changes reservation to fulfilled and copy to borrowed.
- Cancellation/expiration releases holds without bypassing the remaining queue.
- Errors reveal no other member identity.

## Review Outcome

Verdict: Automated evidence is complete; Nhat review is required before integration.
```

- [ ] **Step 6: Commit validation evidence and stop**

```powershell
git add .sdd/reviews/fe07-fe08-borrowing-reservation-integration-validation-2026-07-15.md
git commit -m "docs: validate borrowing reservation integration"
```

Provide the branch, commit list, evidence path, and review checklist. Do not merge or push until Nhat explicitly requests it.

---

## Traceability Summary

| Requirement | Tasks |
| --- | --- |
| BR-FE07-023 / FR-FE07-024 / AC-FE07-016 | 1-3 |
| BR-FE07-024 / FR-FE07-023 / AC-FE07-015 | 1-5 |
| BR-FE07-025 / FR-FE07-025 / AC-FE07-017 | 1, 3-4 |
| BR-FE08-015 / FR-FE08-025 / AC-FE08-011 | 1, 3-4 |
| BR-FE08-016 / FR-FE08-026 / AC-FE08-012 | 1-5 |
| Transaction lock order and rollback | 3-4, 6 |
| Safe user-facing conflicts | 5-6 |
