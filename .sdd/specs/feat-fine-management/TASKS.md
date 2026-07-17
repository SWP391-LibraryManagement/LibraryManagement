# TASKS.md - FE09 Fine Management

Status: APPROVED - BASELINE 2026-07-17; IMPLEMENTATION FOLLOW-UP PENDING

Owner: Dung

Updated: 2026-07-17

Workflow State: SPEC v0.4.0 normalized; historical T001-T011 evidence remains separate from reconciliation tasks

---

## Historical Server-Side Tasks

The checked tasks below are historical TD-001/002/003 implementation evidence. They are not v0.4.0 completion evidence.

| ID | Historical task | Status |
| --- | --- | --- |
| FE09-T001 | Fine repository: borrow-detail lookup, fine CRUD, and transaction foundation | [x] DONE |
| FE09-T002 | Server-side overdue calculation from stored dates | [x] DONE |
| FE09-T003 | Duplicate-fine prevention | [x] DONE |
| FE09-T004 | Historical collection workflow | [x] DONE - requires v0.4.0 no-partial reconciliation |
| FE09-T005 | Mark paid and admin waive/cancel service paths | [x] DONE - requires v0.4.0 contract reconciliation |
| FE09-T006 | Fine visibility and owner/staff access | [x] DONE - list contract reconciliation pending |
| FE09-T007 | Authorization for collection/paid/waive | [x] DONE |
| FE09-T008 | Audit logs for fine actions | [x] DONE - atomicity reconciliation pending |
| FE09-T009 | Routes and app wiring while retaining legacy CRUD | [x] DONE - production boundary reconciliation pending |
| FE09-T010 | In-memory server-side route tests | [x] DONE - v0.4.0 cases pending |
| FE09-T011 | SQL `Fines` status check update | [x] DONE |
| FE09-T012 | Frontend alignment | [ ] NOT STARTED - deferred TD-004 |

## V0.4.0 Reconciliation Tasks

- [ ] **FE09-T013 - Add RED contract, timezone, terminal-state, and concurrency tests.**
  - Maps to: BR-FE09-001 through BR-FE09-019; FR-FE09-001 through FR-FE09-017; AC-FE09-001 through AC-FE09-015.
  - Files: `backend/tests/fineManagementRoutes.test.js`, create `backend/tests/fineContract.test.js`, create `backend/tests/sql/fineConcurrency.sqltest.js`, create `backend/tests/helpers/inMemoryFineRepositories.js`.
  - Dependency: historical FE09-T001 through FE09-T011.
  - RED: add tests for no partial amount, full payment metadata, timezone boundary, list pagination/order, admin waive/cancel, invalid reason/query, terminal conflicts, and atomic audit failure.
  - Verify RED: focused backend/SQL commands fail only on v0.4.0 behavior not covered by the historical slice.
  - DoD: every v0.4.0 acceptance criterion has a concrete assertion.

- [ ] **FE09-T014 - Reconcile schema, model, API, and legacy boundary.**
  - Maps to: BR-FE09-010, BR-FE09-016 through BR-FE09-019; FR-FE09-002, FR-FE09-007, FR-FE09-010, FR-FE09-011, FR-FE09-014 through FR-FE09-016; AC-FE09-002, AC-FE09-006, AC-FE09-011, AC-FE09-013/014.
  - Files: `database/Librarymanagement.sql`, `backend/src/models/Fine.js`, `backend/src/routes/fineRoutes.js`, `backend/src/controllers/fineManagementController.js`, `backend/src/docs/openapi.yaml`, `backend/tests/fineContract.test.js`.
  - Dependency: FE09-T013.
  - GREEN: expose server-side list, waive, and cancel routes; remove `collectedAmount` from the production contract; retain legacy CRUD only as explicitly deferred demo behavior.
  - Verify: contract tests assert exact actors, payloads, status codes, pagination, and safe errors.
  - DoD: schema fields match the approved payment metadata and no undocumented optional policy remains.

- [ ] **FE09-T015 - Reconcile calculation and duplicate prevention.**
  - Maps to: BR-FE09-005 through BR-FE09-009, BR-FE09-019; FR-FE09-003 through FR-FE09-006, FR-FE09-017; AC-FE09-003 through AC-FE09-005, AC-FE09-015; NFR-FE09-SEC-004, NFR-FE09-TXN-001, NFR-FE09-PERF-002.
  - Files: create `backend/src/utils/libraryBusinessTime.js`, `backend/src/services/fineManagementService.js`, `backend/src/repositories/fineRepository.js`, `backend/tests/fineManagementRoutes.test.js`, `backend/tests/sql/fineConcurrency.sqltest.js`.
  - Dependency: FE09-T013, FE09-T014.
  - GREEN: calculate using stored dates and `Asia/Ho_Chi_Minh`; use `overdueDays * 5000`; return an existing active fine unchanged; lock duplicate detection.
  - Verify: route/SQL tests pass on-time, overdue, missing-date, client-tampering, timezone-boundary, and concurrent duplicate cases.
  - DoD: no persisted fine has non-positive amount and no recalculation mutates an existing active amount.

- [ ] **FE09-T016 - Reconcile full collection and paid transitions atomically.**
  - Maps to: BR-FE09-004, BR-FE09-012, BR-FE09-013, BR-FE09-017; FR-FE09-007 through FR-FE09-009, FR-FE09-012/013; AC-FE09-006 through AC-FE09-010, AC-FE09-012; NFR-FE09-TXN-002.
  - Files: `backend/src/services/fineManagementService.js`, `backend/src/repositories/fineRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/fineManagementRoutes.test.js`, `backend/tests/sql/fineConcurrency.sqltest.js`.
  - Dependency: FE09-T015.
  - GREEN: collection and paid reconciliation reject `collectedAmount`, set `PaidAmount = Amount`, `CollectedBy`, `PaymentMethod`, `PaidAt`, `PAID`, and audit in one transaction.
  - Verify: tests prove member denial, full collection, terminal retry conflict, concurrent payment winner, and rollback on audit failure.
  - DoD: `PAID` is possible only with full payment metadata and no partial state exists.

- [ ] **FE09-T017 - Reconcile admin waive/cancel terminal transitions.**
  - Maps to: BR-FE09-011, BR-FE09-015; FR-FE09-014/015; AC-FE09-013/014; NFR-FE09-SEC-003, NFR-FE09-TXN-002, NFR-FE09-LOG-001.
  - Files: `backend/src/services/fineManagementService.js`, `backend/src/repositories/fineRepository.js`, `backend/src/routes/fineRoutes.js`, `backend/tests/fineManagementRoutes.test.js`, `backend/tests/sql/fineConcurrency.sqltest.js`.
  - Dependency: FE09-T014, FE09-T016.
  - GREEN: only Admin may transition `UNPAID` to `WAIVED`/`CANCELLED`; reason is trimmed 1..500; state and audit commit atomically; terminal retries return `409 FINE_NOT_RESOLVABLE`.
  - Verify: focused route/SQL tests cover role, reason, state, audit, and concurrency behavior.
  - DoD: resolved fines remain visible and no longer block FE07 eligibility.

- [ ] **FE09-T018 - Reconcile fine reads and FE07/FE12 integration contract.**
  - Maps to: BR-FE09-001 through BR-FE09-003, BR-FE09-010 through BR-FE09-014, BR-FE09-018; FR-FE09-001/002/010/011; AC-FE09-001/002/009/010/011; NFR-FE09-SEC-001/002, NFR-FE09-PERF-001, NFR-FE09-UX-001/002.
  - Files: `backend/src/services/fineManagementService.js`, `backend/src/repositories/fineRepository.js`, `backend/src/controllers/fineManagementController.js`, `backend/tests/fineManagementRoutes.test.js`, `backend/tests/fineContract.test.js`, `backend/tests/borrowingRoutes.test.js`.
  - Dependency: FE09-T014 through FE09-T017.
  - GREEN: route `/api/fines` to server-side list, enforce owner/staff isolation, apply page/limit/status/user filters, order `FineId ASC`, and expose resolved/unpaid state consistently to FE07/FE12.
  - Verify: focused tests cover guest/member/staff roles, unknown IDs, invalid filters, pagination, ordering, and borrowing-block readback.
  - DoD: legacy CRUD cannot be mistaken for the production list contract.

- [ ] **FE09-T019 - Record the frontend migration boundary.**
  - Maps to: BR-FE09-016, AC-FE09-001 through AC-FE09-012, NFR-FE09-UX-001/002.
  - Files: `frontend/src/page/FineManagement.jsx`, `frontend/src/api/libraryFeatureApi.js`, create `frontend/test/fineManagementFrontend.test.js`, `.sdd/specs/feat-fine-management/TEST_PLAN.md`.
  - Dependency: FE09-T018.
  - RED: document/tests fail if the legacy browser-storage UI is presented as production-complete or accepts partial payment.
  - GREEN: keep frontend implementation deferred under TD-004 while documenting the exact server API migration contract and no false completion evidence.
  - DoD: this task does not implement the UI; it makes the boundary explicit for the owner.

- [ ] **FE09-T020 - Close traceability and verification evidence.**
  - Maps to: all FE09 BR/FR/AC/NFR IDs and the Definition of Done.
  - Files: `.sdd/specs/feat-fine-management/SPEC.md`, `PLAN.md`, `TASKS.md`, `TEST_PLAN.md`, `CHANGELOG.md`.
  - Dependency: FE09-T013 through FE09-T019.
  - Verify: focused backend/SQL/contract/frontend-boundary checks, `npm.cmd run trace:enforce`, and `git diff --check` pass; full suites remain the merge gate.
  - DoD: no `TBD`, “optional if supported”, partial-payment policy, or missing requirement mapping remains.

## Validation Status

- Historical TD-001/002/003 evidence remains in the changelog and does not close FE09-T013 through FE09-T020.
- [ ] FE09-T013 through FE09-T019 focused validation passes.
- [ ] Traceability and `git diff --check` pass.
- [x] Human review of SPEC v0.4.0 and this reconciliation plan was confirmed by Nhat on 2026-07-17.

## Out Of This Iteration

- FE09-T012 frontend migration implementation remains deferred until separately approved.
- Online payment gateway, partial payment, automatic scheduler, and lost/damaged fine policy remain out of scope.
