# PLAN.md - FE07 Borrowing Management

Status: APPROVED - V0.5.1 RECONCILIATION IMPLEMENTED; FINAL INTEGRATION/HUMAN GATES PENDING

Owner: Nhat

Updated: 2026-07-16

Workflow State: FE07-T031 through FE07-T037 and FE07-T040 are agent-side complete; FE07-T038 final repository/human closeout remains open

---

## 1. Scope

Reconcile and harden the existing Phase 2 FE07 slice against approved `SPEC.md` v0.5.0.

## Revision Drift Note

The existing FE07 implementation and completed B7/B8 tasks predate `SPEC.md` v0.5.0. The approved revision requires dedicated reconciliation for canonical `Members` eligibility, parent-book guards, the member-scoped five-copy lock, persisted approval/borrow metadata, `Asia/Ho_Chi_Minh` date policy, future-return rejection, and mandatory rejection reasons. Existing passing results remain historical evidence, not evidence for these new requirements.

Included:

- Member creates borrow requests for ordinary available copies or copies held by their own notified reservation.
- Member views only their own borrowing history.
- Librarian/admin lists, approves, rejects, returns, and renews borrowing records.
- Return processing updates copy status and exposes fine-review data for FE09.
- Renewal checks overdue, unpaid fine, renewal limit, and FE08 reservation conflict.
- Borrowing actions write audit logs and create safe FE10 notification requests where useful.
- Frontend borrowing screens expose actionable loading, empty, permission, eligibility, invalid-state, and API error feedback.

Not included:

- FE09 fine calculation or fine creation.
- FE10 delivery worker implementation.
- Redesigning frontend screens outside FE07 borrowing workflows.
- Hardware/RFID flows.

---

## 2. Approved Rules Used

| Rule | Plan impact |
| --- | --- |
| Maximum active borrowed copies is 5 | Create and approve paths enforce the limit. |
| Default loan duration is 14 days | Approval sets due date to approval date + 14 calendar days. |
| One renewal per detail | Renew path increments `RenewalCount` once only. |
| Pending items use `BorrowDetails.Status = REQUESTED` | Database script and repository use the approved status. |
| Unpaid fine blocks borrowing/renewal | Service checks `Fines` before create and renew. |
| Reservation by another member blocks renewal | Service checks FE08 reservation state before renewal. |
| Active reservation queue blocks ordinary borrowing | Create and approval return `RESERVATION_QUEUE_PRIORITY` until staff resolves the queue. |
| Notified owner may borrow the held copy | FE07 accepts the normal request and revalidates reservation ownership during approval. |
| FE07 approval fulfills the hold | Request, details, copy, matching reservation, and audits commit atomically. |
| FE07 does not create fines | Return response exposes `fineCandidate`; no `Fines` insert is performed. |
| Canonical eligibility is active account plus approved membership | Create, approval, and renewal require `Users.Status = ACTIVE` and `Members.Status = APPROVED`. |
| Parent book must remain active | Create and approval reject inactive parent books with `BOOK_INACTIVE`. |
| Approval uses a member-scoped five-copy lock | Lock order is `member -> BookCopies -> BorrowRequests/BorrowDetails -> Reservations`; count occurs after locks. |
| Approval metadata is transaction history | Store `CreatedBy`, `ApprovedAt`, `ApprovedBy`, and per-detail `BorrowDate`; due date is borrow date +14 calendar days. |
| Business dates use `Asia/Ho_Chi_Minh` | Return dates before borrow date or after the current business date are rejected. |
| Rejection reason is mandatory | Trimmed length is 1..500 and the reason is stored in rejection audit metadata. |

---

## 3. Implementation Plan

### 3.1 API and Access Control

- Add `/api/borrow-requests`, `/api/borrow-details`, and `/api/members/{memberId}/borrowings`.
- Reuse FE02 authentication.
- Keep member actions scoped to the current member.
- Restrict staff actions to librarian/admin.

### 3.2 Borrow Request

- Validate `copyIds` and reject duplicates.
- Check active account and approved membership.
- Apply the reservation-aware borrowability contract to every copy.
- Reject users blocked by overdue active loans or unpaid fines.
- Create `PENDING` request and `REQUESTED` details.

### 3.3 Staff Approval and Rejection

- Recheck member eligibility, borrowing blockers, reservation-aware copy borrowability, and borrow limit.
- Approve transactionally: request status, detail status, due date, copy status, matching reservation fulfillment, and audits.
- Reject pending requests without changing copy status.

### 3.4 Return and Renewal

- Return updates detail status, return date, copy status, and request completion.
- Damaged/lost/overdue returns expose fine-review data only.
- Renewal extends due date by 14 days only when all rules pass.

### 3.5 Tests

- Add route tests with in-memory repositories.
- Cover create, duplicate copy, unavailable copy, approve, history, return, fine candidate, completion, renewal, reservation conflict, and role guards.
- Add focused frontend Node tests for borrowing API error messages and generic fallback behavior.

### 3.6 Frontend Error Handling

- Keep borrowing-specific error messages scoped to `borrowingApi` so other feature APIs retain generic handling.
- Translate FE07 role, eligibility, borrowing-limit, copy, return-state, and renewal-conflict codes into actionable Vietnamese messages.
- Validate and implement the exact borrowing-history query contract: `status?`, `fromDate?`, `toDate?`, `page?`, `limit?`, defaults/bounds, inclusive date semantics, and stable ordering.
- Preserve authentication, validation-detail, backend-message, and network fallbacks.

### 3.7 FE07-FE08 Integration

- Keep FE07 as the only owner of borrow request creation and approval.
- Read `ACTIVE` and `NOTIFIED` reservation claims at create time and under approval locks.
- Lock copy rows before reservation rows whenever a transaction changes both states.
- Block ordinary borrowing while an `ACTIVE` queue entry exists.
- Allow a `RESERVED` copy only for the same member who owns its `NOTIFIED` reservation.
- Fulfill matching notified reservations in the approval transaction.
- Preserve manual FE08 queue processing, current endpoint shapes, and the existing database schema.

### 3.8 V0.5.0 Reconciliation Slice

#### Files

| Area | Files | Reconciliation responsibility |
| --- | --- | --- |
| Boundary | `backend/src/routes/borrowingRoutes.js`, `backend/src/controllers/borrowingController.js`, `backend/src/validators/borrowingValidators.js` | Required rejection reason, strict return date, IDs/statuses, and safe error contract. |
| Business rules | `backend/src/services/borrowingService.js`, create `backend/src/utils/libraryBusinessTime.js` | Canonical eligibility, parent-book guard, five-copy formula, and deterministic Ho Chi Minh business dates. |
| Persistence | `backend/src/repositories/borrowingRepository.js`, `backend/src/repositories/auditLogRepository.js` | Member-scoped lock, approved lock order, metadata, atomic reservation/audit updates, and rollback outcomes. |
| Schema/model/API | `database/Librarymanagement.sql`, `backend/src/models/BorrowRequest.js`, `backend/src/models/BorrowDetail.js`, `backend/src/docs/openapi.yaml` | Verify approved columns/enums and align runtime/API metadata without introducing unapproved states. |
| Backend tests | `backend/tests/borrowingRoutes.test.js`, `backend/tests/helpers/inMemoryBorrowingRepositories.js`, `backend/tests/borrowingRepository.test.js`, `backend/tests/borrowingContract.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js` | RED/GREEN eligibility, inactive parent, same-member limit race, metadata, timezone/date, reason, rollback, and traceability evidence. |
| Frontend | `frontend/src/page/borrowing/*`, `frontend/src/api/libraryFeatureApi.js`, `frontend/test/borrowingFrontend.test.js` | Actionable v0.5.0 errors and truthful mutation state. |

#### Ordered Strategy

1. Add missing RED route/repository/SQL tests for canonical eligibility and inactive parent checks at both create and approval.
2. Add a two-request same-member concurrency test proving approvals cannot move a member from four to six active copies.
3. Reconcile repository locking so the member-scoped lock precedes `BookCopies`, then request/detail rows, then reservations; calculate active count only after locks.
4. Reconcile `CreatedBy`, `ApprovedAt`, `ApprovedBy`, `BorrowDate`, and due-date writes in the approval transaction.
5. Centralize `Asia/Ho_Chi_Minh` business-date conversion, reject future/pre-borrow returns, and require rejection reason length 1..500.
6. Align OpenAPI/model/SQL metadata and frontend error behavior, then run focused validation and human review.

#### Explicit Non-Goals

- Do not relabel FE07-T01 through FE07-T030 or the B7 evidence as v0.5.0 completion.
- Do not persist `OVERDUE`, implement `CANCELLED`, create fines, automate reservation queues, or add new endpoint shapes.
- Do not change FE06/FE08 copy/reservation ownership or the approved lock-order suffix.

---

## 4. Review Notes

- `database/Librarymanagement.sql` is aligned with approved FE07 statuses.
- FE07 frontend screens and error states are implemented under FE07-T20 to FE07-T27.
- Nhat confirmed human review; PR #19 merged implementation commit `3a7b0ad1165607b8912c6c0be5f3ef2025c11b55` into `main` as `aeed0dfecb764e6cbe63d7074727f318700e59ea`.
- GitHub Actions CI run `29308540692` passed for the merge commit. Detailed B7 evidence is recorded in `.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md`.
- These records close the earlier baseline only. FE07-T031 through FE07-T038 must be implemented and reviewed before v0.5.0 is considered reconciled.

## 5. V0.5.0 Verification Gates

| Gate | Command | Expected result |
| --- | --- | --- |
| FE07 routes/repository | `npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js tests/borrowingContract.test.js` | New eligibility, metadata, date, reason, and contract cases pass. |
| FE07 SQL concurrency | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/borrowingConcurrency.sqltest.js` | Same-member limit serialization, lock order, rollback, and metadata cases pass when SQL configuration is available. |
| FE07 frontend | `node --test frontend/test/borrowingFrontend.test.js` | v0.5.0 error and truthful-state checks pass. |
| Traceability | `npm.cmd run trace:enforce` | New v0.5.0 changed implementation files meet the repository threshold. |
| Diff hygiene | `git diff --check` | No whitespace errors. |

## 6. V0.5.0 Human Review Gate

- [x] Confirm the member-scoped lock mechanism works on SQL Server and precedes all copy/request/reservation locks.
- [x] Confirm active-count and parent-book/reservation revalidation occur only after relevant locks are held.
- [x] Confirm all business dates are deterministic in `Asia/Ho_Chi_Minh`.
- [x] Confirm rejection reason and approval metadata are persisted/audited exactly as approved.
- [x] Approve FE07-T031 through FE07-T038 before implementation starts.
