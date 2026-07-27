# PLAN.md - FE07 Borrowing Management

Status: H3 GOVERNANCE REMEDIATION - FRESH H2 PENDING

Owner: Nhat

Updated: 2026-07-27

Workflow State: The Phase 2 baseline remains complete. Nhat approved the
`8d0059b` H2 addendum on 2026-07-27; the reviewed result was committed as
`f346ae0`, pushed to draft PR #63, and CI run `30244750250` passed. The first
H3 review found no FE07 code or business-rule defect and returned only stale
governance wording. The documentation-only remediation remains uncommitted
pending fresh H2 and repeated H3.

---

## 1. Scope

Preserve the completed Phase 2 FE07 reconciliation and apply the bounded staff-decision/return UX correction defined by approved `SPEC.md` v0.7.3.

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
- Admin circulation keeps request/copy identifiers in canonical data while showing nine operational columns that fit the supported desktop layout without horizontal scrolling.
- Librarian/Admin can send one selected overdue `borrowDetailId` from the return workspace to FE09's server-authoritative calculation without supplying dates, overdue days, or amount.

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
| FE07 does not create fines | Return response exposes `fineCandidate`; no FE07 service/repository inserts `Fines`. The staff return UI may invoke FE09's canonical calculation endpoint for the selected overdue `borrowDetailId`. |
| Canonical eligibility is active non-staff MEMBER identity | Member-self-service create/candidate/history requires `MEMBER` without `LIBRARIAN`/`ADMIN`; approval still revalidates the request owner's active `MEMBER` identity, and FE04 does not gate FE07. |
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
- Check active account and non-staff `MEMBER` authorization at member-self-service routes.
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
- Cover create, duplicate copy, unavailable copy, approve, history, return, fine candidate, completion, renewal, reservation conflict, and single-role guards.
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

## 7. V0.7.3 Staff Decision And Return UX Correction

1. Add a RED frontend regression requiring complete canonical request/member/copy context in both staff decision dialogs and stable multi-character rejection input.
2. Keep the shared modal mounted across controlled-input rerenders by reading the latest close callback through a ref instead of restarting focus management whenever an inline callback changes identity.
3. Reuse one request-review summary for approve and reject so Librarian/Admin make both decisions against the same canonical fields.
4. Keep staff operational notices exception-oriented: normal/on-time returns rely on the visible dates and condition instead of an extra affirmative banner; overdue/damaged/lost warnings remain visible.
5. Reconcile return due-state presentation with canonical borrow/due/renewal fields and the `Asia/Ho_Chi_Minh` business date; distinguish upcoming, due-today, and overdue states explicitly.
6. Preserve the existing FE07 API, role guards, server-side revalidation, atomic approval/rejection/return transactions, member-history reconciliation, FE06 copy ownership, FE08 reservation ownership, and FE09/FE10 boundaries.
7. Run the focused frontend test, frontend lint/build, FE07 traceability, and diff hygiene before human review.

### V0.7.3 Verification Gates

| Gate | Command | Expected result |
| --- | --- | --- |
| FE07 frontend | `node --test frontend/test/borrowingFrontend.test.js` | Decision-context and stable rejection-input regression passes with the existing FE07 frontend contract suite. |
| Frontend quality | `npm.cmd --prefix frontend run lint` and `npm.cmd --prefix frontend run build` | No lint error and production bundle builds. |
| Traceability | `npm.cmd run trace:enforce` | FE07 remains at the repository threshold. |
| Diff hygiene | `git diff --check` | No whitespace errors. |

## 8. V0.7.4 Business-Time And Return-State Remediation

1. Add UTC-host regressions proving return overdue days and renewal eligibility
   still use the `Asia/Ho_Chi_Minh` business date.
2. Route return and renewal decisions through the shared business-time helper;
   remove host-local calendar arithmetic.
3. Align the in-memory repository with SQL by requiring the physical copy to be
   `BORROWED` before return mutation and returning
   `BORROW_STATE_CONFLICT` otherwise.
4. Reconcile mutable SQL tests with role-based eligibility and explicit
   concurrent return conflict outcomes.
5. Run focused tests under `TZ=UTC`, then run mutable SQL only on a named
   disposable local database before full verification and H2.

## 9. V0.7.6 FE08 Held-Copy Handoff

1. Accept `bookId` plus `copyId` as frontend-only selection hints from FE08.
2. Select the exact copy only when it exists in FE07's protected,
   reservation-aware candidate response for the current Member.
3. Keep `POST /api/borrow-requests` and its server-side eligibility/reservation
   checks authoritative.
4. Preserve the normal `PENDING` request followed by Librarian/Admin approval
   and atomic FE08 fulfillment.

## 10. V0.7.5 Rule-Alignment Plan

The detailed executable plan is
`docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`.

1. Reconcile the branch with `DEC-GEN-005` and `main` task `FE07-T047`: every
   account has exactly one role and the former multi-role renewal scenario is
   superseded.
2. Preserve Member owner-only renewal and Librarian/Admin cross-member renewal
   as separate single-role paths; remove the branch-local multi-role test and
   unnecessary authorization delta while retaining all loan-owner checks.
3. Add a RED return regression that changes the due date between service
   preflight and the repository lock, then require response and audit metadata
   to use the locked transaction snapshot.
4. Extend the SQL and in-memory repository return contract with authoritative
   `userId`, `requestId`, `copyId`, `dueDate`, `returnDate`, and `overdueDays`
   evidence without exposing the internal evidence in the public DTO.
5. Add a renewal regression that passes under both `TZ=UTC` and
   `TZ=America/New_York`; remove host-local date arithmetic from service,
   SQL-repository checks, and in-memory parity checks.
6. Run focused FE07 route/repository tests first. Run mutable SQL only when
   `DB_NAME` is a named disposable local database and
   `FE07_SQL_TEST_ALLOW_MUTATION=true`.
7. Keep the implementation diff uncommitted until L1-L4 evidence is complete
   and Nhat grants the H2 addendum.

## 11. V0.7.7 Main-Integration Addendum

1. Preserve `FE07-T047` and `FE07-T048` from `main` for single-role
   member-self-service and the exact held-copy handoff.
2. Use `FE07-T049` through `FE07-T052` for the rule-alignment tasks; do not
   reuse or overwrite the upstream task IDs.
3. Keep the authoritative return snapshot and shared business-date changes from
   v0.7.5 because they are independent of account cardinality.
4. Run the FE07 role/renewal, return snapshot, and timezone regressions against
   the merged `main` implementation before full verification.
5. Do not commit the merge until the reconciled SPEC, PLAN/TASKS, code, tests,
   and evidence receive H2 addendum approval.

## 12. V0.7.9 FE09 Member-Fine Integration Addendum

1. Keep FE07's positive-`UNPAID` borrow/renew blocker unchanged and identify
   FE09 as the canonical fine-state owner.
2. Let FE09-T024 project FE07 due/return/borrow status through the Member-only
   read path; do not add an FE07 fine mutation.
3. Preserve exactly-one-role access: Member reconciles own fines, while
   Librarian/Admin record collection through staff routes.
4. Re-run focused fine/borrowing, one-role, timezone, cross-feature, full, and
   browser gates against `main@8d0059b`.
5. Keep the merge uncommitted and unpushed until the H2 addendum is approved.

## 13. V0.8.0 Pending-Copy Claim Correction

1. Add focused RED cases proving a second member can neither see nor request a
   copy already claimed by a `PENDING` request.
2. Under the existing member/copy transaction locks, recheck
   `PENDING + REQUESTED` claims before inserting any request/detail rows.
3. Keep `BookCopies.Status` unchanged while pending; approval consumes the
   claim into `BORROWED`, and rejection releases it through request status.
4. Make FE06 status/deactivation mutations reject a pending FE07 claim.
5. Expose current physical copy status in the safe FE11 Admin detail and reload
   Admin/Librarian state after both successful and conflicting decisions.
6. Run focused backend/frontend tests, full regression, lint/build,
   traceability, and diff hygiene; human review remains required.

## 14. V0.8.1 Same-Title Workflow Invariant

1. Add RED coverage for a Member submitting another copy of a `BookId` already
   present in their pending request or active loan.
2. Filter candidates at `BookId` scope and revalidate under the existing
   member-scoped transaction lock before request insertion.
3. During approval, reject a legacy duplicate if the Member already has a
   `BORROWED` detail for the same `BookId`; preserve rejection as cleanup.
4. Expose distinct owner-role/account/copy approval blockers to FE11 without
   transferring FE07 command ownership.
