# TASKS.md - FE08 Reservation Management

Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Implementation State: COMPLETE

Owner: Nhat

Updated: 2026-07-19

Workflow State: FE08-T028 through FE08-T039 are agent-side complete; final repository/human integration remains open

---

## 1. Backend Tasks

- [x] FE08-T01 Add reservation routes under `/api/reservations`.
- [x] FE08-T02 Add request validators for create, list, cancel, process, and process queue.
- [x] FE08-T03 Add role guard middleware for member/librarian/admin actions.
- [x] FE08-T04 Add reservation service rules for eligibility, duplicate active reservation, available-copy rejection, and max active limit.
- [x] FE08-T05 Add SQL repository methods for copy lookup, reservation CRUD, staff list, and queue hold.
- [x] FE08-T06 Add member endpoints: create reservation, list my reservations, cancel my `ACTIVE` or `NOTIFIED` reservation.
- [x] FE08-T07 Add staff endpoints: list reservations, process one reservation, process next queue item.
- [x] FE08-T08 Create FE10 `RESERVATION_READY` notification request during queue processing.
- [x] FE08-T09 Write audit logs for create, cancel, and process actions.

## 2. Test Tasks

- [x] FE08-T10 Add in-memory reservation repository test helper.
- [x] FE08-T11 Test reservation creation, duplicate rejection, available-copy rejection, and 3-active limit.
- [x] FE08-T12 Test owner-only cancellation and repeated cancellation handling.
- [x] FE08-T13 Test staff listing and earliest eligible queue processing.
- [x] FE08-T14 Test notification request creation when a copy is held.
- [x] FE08-T15 Test authentication and role guards.

## 3. Frontend Tasks

- [x] FE08-T16 Implement member my reservations screen.
- [x] FE08-T17 Implement librarian reservation management screen.
- [x] FE08-T18 Implement librarian reservation queue processing screen.
- [x] FE08-T19 Wire frontend screens to backend APIs.
- [x] FE08-T20 Add accessibility: table captions, header scopes, form labels, keyboard support.
- [x] FE08-T21 Add loading, empty, and error states on all screens.

## 4. Frontend Correctness Tasks

- [x] FE08-T22 Map `NOTIFIED` and `FULFILLED` to canonical UI states.
- [x] FE08-T23 Keep only `Waiting` (`ACTIVE`) reservations in the librarian queue and exclude `NOTIFIED` plus terminal states from queue actions.
- [x] FE08-T24 Add reservation-specific Vietnamese API errors without affecting other APIs.
- [x] FE08-T25 Connect staff hold-expiration processing to `POST /api/reservations/expire-holds`.
- [x] FE08-T26 Remove local-only fulfillment and deletion controls.
- [x] FE08-T27 Add focused frontend regression tests for lifecycle, error isolation, and page contract.

## 4.1 FE07-FE08 Integration Task

- [x] FE08-T025 Align cancellation/expiration lock order and FE07 fulfillment handoff. Trace: BR-FE08-015/016; AC-FE08-011/012. Dependency: FE07-T029/T030. Done when concurrency tests pass without deadlock.

## 4.2 V0.4.3 Normalization Tasks

- [x] **FE08-T028 - Lock deterministic API and pagination behavior.**
  - Maps to: FR-FE08-027, AC-FE08-013, NFR-FE08-PERF-001/002.
  - Files: `backend/src/routes/reservationRoutes.js`, `backend/src/validators/reservationValidators.js`, `backend/src/controllers/reservationController.js`, `backend/src/services/reservationService.js`, `backend/src/repositories/reservationRepository.js`, `backend/src/docs/openapi.yaml`, `backend/tests/reservationRoutes.test.js`.
  - Dependency: historical FE08-T01 through FE08-T15.
  - RED: add tests for `process-queue` requiring staff `copyId`, rejecting `bookId`, defaulting page/limit, rejecting invalid supplied values, and stable `ReservedAt ASC, ReservationId ASC` ordering.
  - GREEN: align validators, service, repository, and API documentation with SPEC v0.4.2.
  - DoD: invalid query/body values are rejected without normalization or repository query.

- [x] **FE08-T029 - Lock deterministic queue outcomes.**
  - Maps to: FR-FE08-018, FR-FE08-020, FR-FE08-021; AC-FE08-006/007/009; Q-FE08-006/007/008.
  - Files: `backend/src/services/reservationService.js`, `backend/src/repositories/reservationRepository.js`, `backend/tests/reservationRoutes.test.js`.
  - Dependency: FE08-T028.
  - RED: add cases proving an ineligible active reservation remains `ACTIVE`, an empty queue returns no selection with unchanged copy state, and notification failure keeps the hold while writing `RESERVATION_NOTIFY_FAILED`.
  - GREEN: remove policy alternatives and keep the approved state transitions deterministic.
  - DoD: no automatic notification retry worker or hidden owner data is introduced.

- [x] **FE08-T030 - Reconcile reservation data fields and state invariants.**
  - Maps to: BR-FE08-008 through BR-FE08-013, BR-FE08-017; FR-FE08-006 through FR-FE08-009, FR-FE08-019, FR-FE08-022, FR-FE08-028; AC-FE08-006 through AC-FE08-009, AC-FE08-014; NFR-FE08-TXN-001/002, NFR-FE08-LOG-001.
  - Files: `database/Librarymanagement.sql`, `backend/src/models/Reservation.js`, `backend/src/repositories/reservationRepository.js`, `backend/tests/models.test.js`, `backend/tests/reservationRoutes.test.js`.
  - Dependency: FE08-T029.
  - RED: add fulfilled, expired, notified-cancelled, and never-notified-cancelled timestamp-retention cases.
  - GREEN: ensure notification timestamps remain immutable history, `CancelledAt` is cancellation-only, and queue/cancel/expire/fulfill writes use `BookCopies -> Reservations` locking and audit consistently.
  - DoD: notified reservations retain original timestamps in terminal states, never-notified rows keep them null, only cancelled rows have `CancelledAt`, and at most one notified hold exists per copy.

- [x] **FE08-T031 - Reconcile FE07 fulfillment and priority boundary.**
  - Maps to: BR-FE08-011, BR-FE08-014 through BR-FE08-016; FR-FE08-023 through FR-FE08-026; AC-FE08-008, AC-FE08-011/012.
  - Files: `backend/src/services/borrowingService.js`, `backend/src/repositories/borrowingRepository.js`, `backend/src/services/reservationService.js`, `backend/tests/borrowingRoutes.test.js`, `backend/tests/reservationRoutes.test.js`, `backend/tests/sql/borrowingConcurrency.sqltest.js`.
  - Dependency: FE08-T030 and approved FE07-T031 through FE07-T036.
  - GREEN: only same-member/same-copy FE07 approval fulfills `NOTIFIED`; active queue and another-member holds block ordinary borrow/renewal without exposing owner data.
  - DoD: shared lock suffix and transaction rollback evidence remain aligned with FE07.

- [x] **FE08-T032 - Reconcile frontend lifecycle and server refresh evidence.**
  - Maps to: AC-FE08-001 through AC-FE08-013; NFR-FE08-UX-001/002.
  - Files: `frontend/src/page/reservation/*`, `frontend/src/api/libraryFeatureApi.js`, `frontend/test/reservationFrontend.test.js`.
  - Dependency: FE08-T028 through FE08-T031.
  - RED: add focused assertions for `ACTIVE`/`NOTIFIED`/`FULFILLED` labels, queue visibility, pagination, error isolation, and refresh after expiration/cancel/process.
  - GREEN: frontend displays only canonical server state and never offers local fulfillment/deletion or automatic retry controls.
  - DoD: the focused frontend test file exists and its command is recorded in `TEST_PLAN.md`.

- [x] **FE08-T033 - Complete requirement traceability and test plan.**
  - Maps to: all FE08 BR/FR/AC/NFR IDs, including FR-FE08-027/028 and AC-FE08-013/014.
  - Files: `.sdd/specs/feat-reservation-management/SPEC.md`, `TEST_PLAN.md`, `CHANGELOG.md`, `TASKS.md`.
  - Dependency: FE08-T028 through FE08-T032.
  - DoD: no `TBD`, policy alternatives, or missing requirement rows remain; historical B7 results and v0.4.3 evidence are separated.

- [x] **FE08-T034 - Normalize terminal timestamp semantics in documentation.**
  - Maps to: BR-FE08-017, FR-FE08-028, AC-FE08-014, Q-FE08-009, INV-FE08-009..010.
  - DoD: SPEC, PLAN, TASKS, TEST_PLAN, and CHANGELOG agree that notification timestamps are immutable history and `CancelledAt` is cancellation-only; implementation files remain unchanged.
  - Review state: documentation complete and human review confirmed by Nhat on 2026-07-17.

- [x] **FE08-T035 - Approve and trace the member-safe candidate contract.**
  - Maps to: FR-FE08-029, AC-FE08-015/016, NFR-FE08-SEC-004, NFR-FE08-PERF-003, Q-FE08-011.
  - Files: FE08 `SPEC.md`, `PLAN.md`, `TASKS.md`, `CHANGELOG.md`; candidate design and implementation plan.
  - DoD: Option A and the written design are explicitly human-approved; query, projection, role, ordering, and non-goals are unambiguous.

- [x] **FE08-T036 - Implement and validate the backend candidate API.**
  - Maps to: FR-FE08-029, AC-FE08-015, NFR-FE08-SEC-004, NFR-FE08-PERF-003.
  - Files: FE08 validators/routes/controller/service/repository, OpenAPI, in-memory helper, route tests, and `backend/tests/sql/reservationCandidates.sqltest.js`.
  - RED: role, query, safe-key, status, search, ordering, pagination, active-count, and no-mutation cases fail before the route exists.
  - GREEN: member-only `{ data, pagination }` projection passes focused Jest and disposable SQL Server suites.
  - Validation: backend candidate contract `23/23`; focused SQL `2/2`; aggregate SQL `9/9` suites and `69/69` tests.

- [x] **FE08-T037 - Replace `DEMO_RESERVABLE` with canonical server candidates.**
  - Maps to: FR-FE08-029, AC-FE08-015/016, NFR-FE08-PERF-003.
  - Files: `frontend/src/api/libraryFeatureApi.js`, `frontend/src/page/reservation/MyReservationsPage.jsx`, `frontend/src/utils/libraryFeatureViewModels.js`, `frontend/test/reservationFrontend.test.js`.
  - RED: source tests fail while the page imports the demo catalog or lacks `reservationApi.listCandidates`.
  - GREEN: server search/page state, loading/empty/error states, real `copyId` mutation, and post-mutation refresh pass without invented ETA or availability counts.
  - Validation: current full frontend `149/149`, lint PASS, build PASS, and no `DEMO_RESERVABLE` reference remains.

- [x] **FE08-T038 - Add isolated browser acceptance for candidate selection.**
  - Maps to: FR-FE08-029, AC-FE08-015/016.
  - Files: `tests/e2e/fe08-reservation-candidate-catalog.spec.js` and deterministic E2E support only if required.
  - DoD: member catalog, search query, safe payload, real reservation creation, canonical refresh, and mobile overflow pass on isolated ports.
  - Validation: focused FE08 browser `1/1`; full Playwright `4/4` on `4185/3101`.

- [x] **FE08-T039 - Close TD-028 with full validation evidence.**
  - Maps to: all v0.4.4 candidate IDs.
  - Files: `TECH_DEBT.md`, focused validation review, full acceptance packet, and PR evidence.
  - DoD: focused/full backend/frontend/coverage/integration/SQL/E2E/traceability/safety gates pass; TD-028 moves to RESOLVED; final H3 remains explicit.
  - Validation: evidence recorded in `.sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md`; H3 and post-merge `main` CI remain human gates.

## 5. Validation

- [x] `npm.cmd --prefix frontend test` - 14/14 tests passed.
- [x] `npm.cmd --prefix frontend run lint` - passed with 0 ESLint errors.
- [x] `npm.cmd --prefix frontend run build` - Vite 8.0.16 production build passed after transforming 14,323 modules; Vite reported a non-failing chunk-size warning.
- [x] `npm.cmd --prefix backend test` - 15/15 Jest suites and 123/123 tests passed; 0 snapshots.
- [x] B7 post-merge record - commit `236043864304627f3577baafa9b8648c13c7a691` is in `main`; GitHub Actions CI run `29217437981` passed.

### 5.1 Pending V0.4.2 Validation

- [x] FE08-T028 through FE08-T032 focused tests pass: backend/shared boundary 77/77 and frontend 9/9.
- [x] `npm.cmd run trace:enforce` passes with FE08 coverage 28/28.
- [x] `git diff --check` passes.
- [x] Nhat confirmed human review of the normalized contract on 2026-07-17.

### 5.2 Completed V0.4.4 Candidate Validation

- [x] FE08-T036 backend route and SQL tests pass: focused backend `23/23`; SQL aggregate `9/9` suites, `69/69` tests.
- [x] FE08-T037 current frontend tests `149/149`, lint, and build pass with no `DEMO_RESERVABLE` reference.
- [x] FE08-T038 isolated browser acceptance passes: focused `1/1`; full Playwright `4/4` on `4185/3101`.
- [x] FE08-T039 full regression, traceability, safety, and evidence gates pass; final H3, merge, and post-merge `main` CI remain open.

## 6. Traceability

| Spec ID | Covered by |
| --- | --- |
| BR-FE08-001 | FE08-T03, FE08-T15 |
| BR-FE08-002 | FE08-T03, FE08-T04, FE08-T11 |
| BR-FE08-003 | FE08-T06, FE08-T12 |
| BR-FE08-004 | FE08-T03, FE08-T07, FE08-T13 |
| BR-FE08-005 | FE08-T04, FE08-T11 |
| BR-FE08-006 | FE08-T04, FE08-T11 |
| BR-FE08-008 | FE08-T07, FE08-T13 |
| BR-FE08-009 | FE08-T06, FE08-T12, FE08-T13 |
| BR-FE08-012 | FE08-T08, FE08-T14 |
| FR-FE08-004 | FE08-T06, FE08-T12 |
| FR-FE08-005 | FE08-T07, FE08-T13 |
| FR-FE08-008 | FE08-T08, FE08-T14 |
| FR-FE08-010 | FE08-T06, FE08-T12 |
| BR-FE08-015/016; AC-FE08-011/012 | FE08-T025 |

### 6.1 Supplemental Frontend Correctness Traceability

| Spec ID | Covered by |
| --- | --- |
| FR-FE08-005 | FE08-T17, FE08-T19, FE08-T23 |
| FR-FE08-007 | FE08-T18, FE08-T22, FE08-T23 |
| FR-FE08-009 | FE08-T22, FE08-T23, FE08-T27 |
| FR-FE08-017 | FE08-T12, FE08-T24, FE08-T27 |
| FR-FE08-019 | FE08-T25, FE08-T27; `backend/tests/integration.test.js` and `backend/tests/reservationRoutes.test.js` expire-holds promotion coverage |
| NFR-FE08-UX-001 | FE08-T21, FE08-T22, FE08-T24, FE08-T27 |
| FR-FE08-018/020/021/027 | FE08-T028, FE08-T029 |
| AC-FE08-013 | FE08-T028, FE08-T032 |
| FR-FE08-029 | FE08-T035, FE08-T036, FE08-T037, FE08-T038, FE08-T039 |
| AC-FE08-015 | FE08-T035, FE08-T036, FE08-T037, FE08-T038 |
| AC-FE08-016 | FE08-T035, FE08-T037, FE08-T038 |
| NFR-FE08-SEC-004 | FE08-T035, FE08-T036, FE08-T039 |
| NFR-FE08-PERF-003 | FE08-T035, FE08-T036, FE08-T037, FE08-T039 |

## 7. Still Outside This Slice

- Automatic FE07 return-to-queue integration.
- FE10 delivery worker.
- Automatic expiration job.
