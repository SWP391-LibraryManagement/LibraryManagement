# TASKS.md - FE07 Borrowing Management

Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Implementation State: COMPLETE

Owner: Nhat

Updated: 2026-07-16

Workflow State: COMPLETE for the approved Phase 2 scope; H3, merge, and exact post-merge `main` CI are recorded in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Pending/open gate statements retained below are historical execution snapshots superseded by that evidence.

---

## Revision Drift Note

Checked tasks below describe the implementation completed against the earlier approved baseline. They do not close the approved v0.5.0 BR/FR/AC items; dedicated unchecked reconciliation tasks are defined in Section 3.2.

## 1. Backend Tasks

- [x] FE07-T01 Add borrowing routes from the approved API contract.
- [x] FE07-T02 Add validators for request IDs, detail IDs, copy IDs, statuses, dates, reject reason, return condition, and notes.
- [x] FE07-T03 Add borrowing service rules for member eligibility, borrow limit, unpaid fine, overdue loan, copy availability, and duplicate request items.
- [x] FE07-T04 Add SQL repository methods for borrow request creation, listing, approval, rejection, return, and renewal.
- [x] FE07-T05 Add member endpoints for create request and own history.
- [x] FE07-T06 Add staff endpoints for list requests and member borrowing info.
- [x] FE07-T07 Add approval flow that marks details `BORROWED`, sets due dates, and marks copies `BORROWED`.
- [x] FE07-T08 Add rejection flow for pending requests.
- [x] FE07-T09 Add return flow for normal, damaged, and lost returns.
- [x] FE07-T10 Add renewal flow with one-renewal limit and FE08 reservation conflict check.
- [x] FE07-T11 Expose fine-review data without creating FE09 fine rows.
- [x] FE07-T12 Write audit logs for create, approve, reject, return, and renew.
- [x] FE07-T13 Align SQL script with approved FE07 statuses.

## 2. Test Tasks

- [x] FE07-T14 Add in-memory borrowing repository helper.
- [x] FE07-T15 Test create request, duplicate copy rejection, and unavailable copy rejection.
- [x] FE07-T16 Test approval and member-only history.
- [x] FE07-T17 Test return processing, completed request update, and fine candidate output.
- [x] FE07-T18 Test renewal success, renewal limit, and reservation conflict.
- [x] FE07-T19 Test authentication and role guards.

## 3. Frontend Tasks

- [x] FE07-T20 Implement member borrow request creation screen.
- [x] FE07-T21 Implement member borrowing history screen.
- [x] FE07-T22 Implement librarian borrow request approval/rejection screen.
- [x] FE07-T23 Implement librarian return processing screen.
- [x] FE07-T24 Implement librarian member borrowing details screen.
- [x] FE07-T25 Wire frontend screens to backend APIs.
- [x] FE07-T26 Add accessibility: table captions, header scopes, form labels, keyboard support.
- [x] FE07-T27 Add loading, empty, and error states on all screens.

## 3.1 FE07-FE08 Integration Tasks

- [x] FE07-T029 Enforce reservation-aware borrowability for create and approval. Trace: BR-FE07-023/024; AC-FE07-015/016. Dependency: FE08 queue state. Done when RED/GREEN route tests pass.
- [x] FE07-T030 Fulfill matching notified reservations in the approval transaction. Trace: BR-FE07-025; AC-FE07-017. Dependency: FE07-T029. Done when SQL and in-memory rollback tests pass.

## 3.2 V0.5.0 Reconciliation Tasks

- [x] **FE07-T031 - Add RED canonical eligibility and parent-book tests.**
  - Maps to: BR-FE07-004, BR-FE07-007, BR-FE07-008, BR-FE07-023, BR-FE07-026; FR-FE07-001, FR-FE07-004, FR-FE07-015, FR-FE07-018, FR-FE07-024, FR-FE07-026; AC-FE07-001, AC-FE07-002, AC-FE07-004, AC-FE07-005, AC-FE07-016, AC-FE07-018.
  - Files: `backend/tests/borrowingRoutes.test.js`, `backend/tests/helpers/inMemoryBorrowingRepositories.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Dependency: approved SPEC v0.5.0.
  - RED: add create and approval cases for inactive account, missing/non-approved canonical member, inactive parent book, and requester-owned notified hold whose parent becomes inactive before approval.
  - Verify RED: `npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/sql/borrowingConcurrency.sqltest.js` fails only on missing v0.5.0 behavior.
  - DoD: every blocked branch preserves requests, details, copies, reservations, and audit state and returns the approved safe code.

- [x] **FE07-T032 - Add RED member-scoped five-copy concurrency tests.**
  - Maps to: BR-FE07-005; FR-FE07-014, FR-FE07-019; AC-FE07-003, AC-FE07-019; NFR-FE07-TXN-001, NFR-FE07-TXN-003.
  - Files: `backend/tests/borrowingRepository.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Dependency: FE07-T031.
  - RED: seed one member with four active borrowed details and two pending one-copy requests; approve concurrently against different copies and assert at most one succeeds and committed active total is five.
  - Verify RED: the new test demonstrates the current missing/incorrect member serialization before implementation.
  - DoD: test also asserts no deadlock, loser remains `PENDING`, and loser copy/reservation/audit state is unchanged.

- [x] **FE07-T033 - Reconcile canonical eligibility and parent-book guards.**
  - Maps to: BR-FE07-004, BR-FE07-007, BR-FE07-008, BR-FE07-023, BR-FE07-024; FR-FE07-001, FR-FE07-004, FR-FE07-015, FR-FE07-018, FR-FE07-023, FR-FE07-024, FR-FE07-026; AC-FE07-001, AC-FE07-002, AC-FE07-004, AC-FE07-005, AC-FE07-015, AC-FE07-016, AC-FE07-018.
  - Files: `backend/src/services/borrowingService.js`, `backend/src/repositories/borrowingRepository.js`, `backend/tests/borrowingRoutes.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Dependency: FE07-T031.
  - GREEN: classify eligibility only from active `Users` plus canonical approved `Members`; include parent `Books.Status` in create reads and approval lock/revalidation; keep reservation-aware borrowability unchanged.
  - Verify: focused route/SQL tests pass all eligibility, parent, queue, hold-owner, and rollback cases.
  - DoD: application history is never used as membership eligibility and `BOOK_INACTIVE` changes no state.

- [x] **FE07-T034 - Implement member-first approval locking and transaction metadata.**
  - Maps to: BR-FE07-005, BR-FE07-008 through BR-FE07-010, BR-FE07-025, BR-FE07-026; FR-FE07-004, FR-FE07-005, FR-FE07-012, FR-FE07-014, FR-FE07-019, FR-FE07-022, FR-FE07-025; AC-FE07-003 through AC-FE07-005, AC-FE07-017, AC-FE07-019; NFR-FE07-TXN-001, NFR-FE07-TXN-003.
  - Files: `backend/src/repositories/borrowingRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/borrowingRepository.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Dependency: FE07-T032, FE07-T033.
  - GREEN: acquire a SQL Server member-scoped lock, then lock `BookCopies`, `BorrowRequests/BorrowDetails`, and `Reservations`; calculate active count after locks; atomically persist `ApprovedAt`, `ApprovedBy`, `BorrowDate`, due dates, states, reservation fulfillment, and audits.
  - Verify: SQL tests pass same-copy, same-member/different-copy, reservation fulfillment, metadata, and injected audit failure cases without deadlock.
  - DoD: `activeBorrowedCount + requestedDetailCount` never exceeds five and all approval metadata is non-null on committed approved records.

- [x] **FE07-T035 - Reconcile Ho Chi Minh date policy and rejection reason.**
  - Maps to: BR-FE07-010, BR-FE07-011, BR-FE07-016, BR-FE07-027; FR-FE07-005 through FR-FE07-007, FR-FE07-021, FR-FE07-027; AC-FE07-004, AC-FE07-006 through AC-FE07-008, AC-FE07-020, AC-FE07-021; NFR-FE07-LOG-001, NFR-FE07-TIME-001.
  - Files: create `backend/src/utils/libraryBusinessTime.js`, `backend/src/validators/borrowingValidators.js`, `backend/src/services/borrowingService.js`, `backend/src/repositories/borrowingRepository.js`, `backend/tests/borrowingRoutes.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Dependency: FE07-T034.
  - RED: add midnight-boundary business-date cases, future/pre-borrow return rejection, default return date, borrow/due date +14, and missing/blank/501-character rejection reason cases.
  - GREEN: derive business dates in `Asia/Ho_Chi_Minh`, validate inclusive return range, and store trimmed rejection reason in the rejection audit transaction.
  - Verify: focused route/SQL tests pass and invalid commands preserve request/detail/copy/audit state.
  - DoD: UTC persistence is allowed only when API/business-date conversion is deterministic and tested.

- [x] **FE07-T036 - Align schema, model, OpenAPI, and traceability metadata.**
  - Maps to: BR-FE07-019, BR-FE07-020, BR-FE07-026, BR-FE07-027; FR-FE07-002, FR-FE07-005, FR-FE07-006, FR-FE07-013, FR-FE07-027; AC-FE07-004, AC-FE07-013, AC-FE07-021.
  - Files: `database/Librarymanagement.sql`, `backend/src/models/BorrowRequest.js`, `backend/src/models/BorrowDetail.js`, `backend/src/docs/openapi.yaml`, `backend/tests/borrowingContract.test.js`, `backend/tests/models.test.js`.
  - Dependency: FE07-T034, FE07-T035.
  - RED: contract/model tests assert required creator/approver/borrow-date fields, nullable pre-approval dates, persisted status enums, reason input, future-date rejection description, and derived `OVERDUE` only.
  - GREEN: reconcile metadata with already-approved columns; change schema only when a verified mismatch exists and update ADR if schema changes.
  - Verify: `npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingContract.test.js tests/models.test.js` passes.
  - DoD: no persisted `OVERDUE`, new `CANCELLED` behavior, or FE09 fine write is introduced.

- [x] **FE07-T037 - Reconcile frontend v0.5.0 errors and truthful state.**
  - Maps to: AC-FE07-002 through AC-FE07-005, AC-FE07-015 through AC-FE07-021; NFR-FE07-UX-001.
  - Files: `frontend/src/page/borrowing/*`, `frontend/src/api/libraryFeatureApi.js`, `frontend/test/borrowingFrontend.test.js`.
  - Dependency: FE07-T033 through FE07-T036.
  - RED: tests fail while `BOOK_INACTIVE`, `BORROW_LIMIT_EXCEEDED`, `INVALID_RETURN_DATE`, `REJECTION_REASON_REQUIRED`, stale/eligibility, or reservation-priority errors lack scoped actionable feedback.
  - GREEN: keep FE07-specific error resolution isolated, require rejection reason in staff UI, omit client return date when using server default, and refresh canonical server state after mutations.
  - Verify: `node --test frontend/test/borrowingFrontend.test.js` passes.
  - DoD: UI never fabricates approval/return success or eligibility evidence.

- [~] **FE07-T038 - Run v0.5.0 focused validation and review gate.**
  - Maps to: all new/reconciled v0.5.0 BR/FR/AC IDs and the Definition of Done.
  - Files: `.sdd/specs/feat-borrowing-management/TEST_PLAN.md`, `.sdd/specs/feat-borrowing-management/CHANGELOG.md`, changed FE07 implementation/tests.
  - Dependency: FE07-T031 through FE07-T037.
  - Verify: focused route/repository/contract/model tests, SQL concurrency tests, frontend test, `npm.cmd run trace:enforce`, and `git diff --check` pass; full suites run only at the merge gate.
  - DoD: evidence records exact new results separately from historical B7 results and Nhat completes human review before integration.

## 4. Historical Validation

- [x] `npm test` in `backend`.
- [x] `npm.cmd --prefix frontend run lint` passed.
- [x] `npm.cmd --prefix frontend run build` passed.
- [x] Browser verification: tables, captions, labels, and keyboard navigation verified.
- [x] B6 L2.3 aligned persisted FE07 statuses, SQL metadata, and the OpenAPI contract with the approved runtime/spec.
- [x] B6 L2.3 added focused model/OpenAPI tests and direct staff member-borrowings filter coverage.
- [x] B6 L3 hardened post-commit readback handling, transaction-time approval eligibility, reject/renew audit atomicity, and strict calendar-date validation.
- [x] B6 L3 added in-memory regressions and live SQL evidence for approval eligibility and reject/renew audit rollback.
- [x] B6 L4 removed fabricated FE07 browser state, added complete route guards, fixed modal/responsive behavior, and validated the real member/staff workflow.
- [x] B6 independent-review remediation: unknown-member `404`, reject-race `409`, server-owned return date, truthful approval/return UI, pending-loan partitioning, modal focus, and mobile pagination.
- [x] B6 final automated gate: frontend 37/37, lint/build, backend 273/273, live SQL 14/14 with cleanup, FE07 traceability 22/22, and `git diff --check`.
- [x] Human review by Nhat confirmed on 2026-07-14 before commit, push, or merge.

### 4.1 Pending V0.5.0 Validation

- [x] Focused borrowing route/repository/contract/model tests pass: 66/66.
- [x] Live SQL concurrency evidence proves same-member five-copy serialization and approved lock order as part of the 61/61 aggregate SQL run.
- [x] Frontend v0.5.1 regression tests pass: 18/18.
- [~] Traceability passes at 28/28; `git diff --check` remains part of the final repository rerun.
- [ ] Nhat confirms human review of the reconciliation implementation.

## 5. Traceability

| Spec ID | Covered by |
| --- | --- |
| BR-FE07-001 | FE07-T01, FE07-T19 |
| BR-FE07-002 | FE07-T03, FE07-T05, FE07-T15, FE07-T16 |
| BR-FE07-003 | FE07-T01, FE07-T06, FE07-T19 |
| BR-FE07-004 | FE07-T03, FE07-T15 |
| BR-FE07-005 | FE07-T03, FE07-T07 |
| BR-FE07-006 | FE07-T03, FE07-T10, FE07-T15, FE07-T18 |
| BR-FE07-007 | FE07-T03, FE07-T15 |
| BR-FE07-009 | FE07-T07, FE07-T16 |
| BR-FE07-011 | FE07-T09, FE07-T17 |
| BR-FE07-012 | FE07-T09, FE07-T17 |
| BR-FE07-013 | FE07-T09, FE07-T17 |
| BR-FE07-014 | FE07-T11, FE07-T17 |
| BR-FE07-015 | FE07-T10, FE07-T18 |
| BR-FE07-017 | FE07-T05, FE07-T16, FE07-T20, FE07-T21 |
| BR-FE07-018 | FE07-T10, FE07-T18 |
| BR-FE07-019 | FE07-T04, FE07-T15 |
| BR-FE07-020 | FE07-T09, FE07-T17 |
| BR-FE07-021 | FE07-T11, FE07-T17 |
| BR-FE07-022 | FE07-T03, FE07-T04, FE07-T15 |
| FR-FE07-003 | FE07-T03, FE07-T15, FE07-T029 |
| FR-FE07-008 | FE07-T09, FE07-T11, FE07-T17 |
| FR-FE07-009 | FE07-T10, FE07-T18 |
| FR-FE07-010 | FE07-T05, FE07-T16 |
| FR-FE07-011 | FE07-T06 |
| FR-FE07-013 | FE07-T09, FE07-T17 |
| FR-FE07-016 | FE07-T03, FE07-T10, FE07-T15, FE07-T18 |
| FR-FE07-017 | FE07-T03, FE07-T15 |
| FR-FE07-020 | FE07-T10, FE07-T18 |
| AC-FE07-001 through AC-FE07-014 | SPEC.md Section 16 direct acceptance-test mappings |
| FR-FE07-022 | borrowingConcurrency.sqltest.js > SQL create/approval/return/reject/renew audit-failure rollback tests |
| BR-FE07-023/024; AC-FE07-015/016 | FE07-T029 |
| BR-FE07-025; AC-FE07-017 | FE07-T030 |

### 5.1 V0.5.0 Reconciliation Traceability

| Spec ID | Planned task |
| --- | --- |
| BR-FE07-004; FR-FE07-015 | FE07-T031, FE07-T033 |
| BR-FE07-005; FR-FE07-014, FR-FE07-019; AC-FE07-003, AC-FE07-019 | FE07-T032, FE07-T034 |
| BR-FE07-007/008/023/024; FR-FE07-018/023/024/026; AC-FE07-005/015/016/018 | FE07-T031, FE07-T033 |
| BR-FE07-009/010/025/026; FR-FE07-005/012/022/025; AC-FE07-004/017 | FE07-T034, FE07-T036 |
| BR-FE07-011/027; FR-FE07-006/007/021/027; AC-FE07-006/007/008/020/021 | FE07-T035, FE07-T036, FE07-T037 |
| NFR-FE07-TXN-001/003 | FE07-T032, FE07-T034 |
| NFR-FE07-TIME-001 | FE07-T035 |
| NFR-FE07-UX-001 | FE07-T037 |
| BR-FE07-028; FR-FE07-028; AC-FE07-022 | FE07-T039, FE07-T040 |

### 5.2 V0.5.1 History Contract Tasks

- [x] **FE07-T039 - Normalize borrowing-history contract in documentation.**
  - Maps to: BR-FE07-028, FR-FE07-028, AC-FE07-022, Q-FE07-009, NFR-FE07-PERF-003.
  - DoD: both member and staff history endpoints share the exact filters, date semantics, defaults, bounds, validation order, and stable ordering; implementation files remain unchanged.
  - Review state: documentation complete and human review confirmed by Nhat on 2026-07-17.

- [x] **FE07-T040 - Align history implementation and focused tests.**
  - Maps to: BR-FE07-028, FR-FE07-028, AC-FE07-022.
  - DoD: invalid values fail before query, member scope is enforced, default/boundary pagination and inclusive date filters pass, and stable ordering is covered for member and staff endpoints.
  - Evidence: `/me` now consumes detail-status filters and returns `{ borrowings, pagination }`; the member page sends canonical server `status/page/limit`, removes client-side page slicing, and maps detail rows. Focused backend 66/66 and frontend 18/18 pass.

## 6. Still Outside This Slice

- FE09 fine creation.
- FE10 delivery worker.
- Persisted `OVERDUE`, borrow-request cancellation, and automatic reservation queue processing.

## 7. B7 Integration And Review Closeout

- [x] Nhat confirmed the human review gate before integration.
- [x] Implementation commit `3a7b0ad1165607b8912c6c0be5f3ef2025c11b55` was pushed on `feat/fe07-validation`.
- [x] PR #19 merged into `main` as `aeed0dfecb764e6cbe63d7074727f318700e59ea`.
- [x] GitHub Actions CI run `29308540692` passed for the merge commit and covered traceability, backend tests, frontend lint/tests/build, and backend health import.
- [x] Detailed evidence is recorded in `.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md`.

This closeout remains historical evidence for the earlier approved baseline. It does not mark FE07-T031 through FE07-T038 complete.
