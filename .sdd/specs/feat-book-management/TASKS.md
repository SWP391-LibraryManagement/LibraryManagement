# TASKS.md - FE05 Book Management

Status: READY FOR REVIEW - FE05 reconciliation and live SQL complete; merge/human gates pending

Owner: Dung

Updated: 2026-07-19

Workflow State: FE05-T001 through FE05-T008 executed; final integration remains gated

---

## Task Rules

- Execute tasks in numeric order and start each behavior task with its named RED tests.
- Do not mark a task complete because prototype code exists.
- FE05 may read `BookCopies` for availability but must never write copy status.
- Existing-book mutations require the caller's last-seen version; do not silently normalize invalid queries or fields.
- Add `@spec` tags to changed implementation files for mapped FR/BR IDs.

## Ordered Tasks

- [x] **FE05-T001 - Add RED route, repository, SQL, and frontend contract tests.**
  - Maps to: BR-FE05-001 through BR-FE05-018; FR-FE05-001 through FR-FE05-026; AC-FE05-001 through AC-FE05-017.
  - Files: create `backend/tests/bookRoutes.test.js`, create `backend/tests/helpers/inMemoryBookRepositories.js`, `backend/tests/bookAvailabilityRepository.test.js`, create `backend/tests/sql/bookConcurrency.sqltest.js`, `frontend/test/bookManagementFrontend.test.js`.
  - Dependency: none.
  - RED: cover public/staff visibility, query policy, metadata validation, RBAC, derived availability, prohibited copy mutation, current/stale/missing `If-Match`, reason validation, status-only transitions, and audit rollback.
  - Verify RED: focused commands fail only on missing v0.5.0 behavior, including the current `/availability` prototype expectations.
  - DoD: every AC has an assertion and concurrent/rollback tests inspect unchanged book, copy, workflow, and audit state.

- [x] **FE05-T002 - Add SQL rowversion and document the data contract.**
  - Maps to: BR-FE05-005, BR-FE05-014 through BR-FE05-016; FR-FE05-011, FR-FE05-018, FR-FE05-022, FR-FE05-023; AC-FE05-006, AC-FE05-010, AC-FE05-013, AC-FE05-014; NFR-FE05-TXN-001/002.
  - Files: `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md`, `backend/src/models/Book.js`, `backend/src/docs/openapi.yaml`.
  - Dependency: FE05-T001.
  - GREEN: add `Books` SQL `rowversion`, preserve the filtered unique ISBN index, define opaque version encoding, and document mutation headers/responses.
  - Verify: schema smoke/SQL tests can create, read, and compare book versions without changing copy rows.
  - DoD: no FE05-owned availability column or physical-delete path is introduced.

- [x] **FE05-T003 - Implement deterministic validators and route topology.**
  - Maps to: BR-FE05-001 through BR-FE05-007, BR-FE05-016 through BR-FE05-018; FR-FE05-001 through FR-FE05-017, FR-FE05-023 through FR-FE05-026; AC-FE05-001 through AC-FE05-009, AC-FE05-014 through AC-FE05-017; NFR-FE05-SEC-001 through NFR-FE05-SEC-005.
  - Files: `backend/src/app.js`, `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js`, create `backend/src/validators/bookValidators.js`, `backend/src/docs/openapi.yaml`.
  - Dependency: FE05-T001, FE05-T002.
  - GREEN: expose approved public/admin routes; validate IDs, keyword 1..200, page/limit, sort/order, title, ISBN, references, year, pages, rating, URL/path, `If-Match`, and reason.
  - Verify: route tests produce deterministic `400`, `401`, `403`, `404`, and `409` responses without stack traces.
  - DoD: invalid supplied values are rejected, not clamped, coerced to another policy, or ignored.

- [x] **FE05-T004 - Reconcile public/staff reads and derived availability.**
  - Maps to: BR-FE05-001, BR-FE05-008, BR-FE05-009, BR-FE05-011 through BR-FE05-013, BR-FE05-017; FR-FE05-001 through FR-FE05-004, FR-FE05-009, FR-FE05-010, FR-FE05-014, FR-FE05-017, FR-FE05-019, FR-FE05-020, FR-FE05-024; AC-FE05-001 through AC-FE05-004, AC-FE05-011, AC-FE05-015; NFR-FE05-PERF-001/002.
  - Files: `backend/src/services/bookService.js`, `backend/src/repositories/bookRepository.js`, `backend/tests/bookRoutes.test.js`, `backend/tests/bookAvailabilityRepository.test.js`.
  - Dependency: FE05-T003.
  - GREEN: public reads hide inactive books and return safe fields; staff reads include status/version; availability is `AVAILABLE` only for active books with at least one available copy and otherwise `UNAVAILABLE`.
  - Verify: focused route/repository tests pass filters, stable sorting/pagination, public detail `404`, staff inactive detail, and all copy-state aggregations.
  - DoD: no read path writes or caches FE05-owned availability state.

- [x] **FE05-T005 - Reconcile atomic create and metadata update.**
  - Maps to: BR-FE05-002, BR-FE05-003, BR-FE05-005 through BR-FE05-007, BR-FE05-010, BR-FE05-016; FR-FE05-005 through FR-FE05-007, FR-FE05-011 through FR-FE05-016, FR-FE05-018, FR-FE05-023, FR-FE05-026; AC-FE05-005 through AC-FE05-007, AC-FE05-009, AC-FE05-010, AC-FE05-014, AC-FE05-017.
  - Files: `backend/src/services/bookService.js`, `backend/src/repositories/bookRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/bookRoutes.test.js`, `backend/tests/sql/bookConcurrency.sqltest.js`.
  - Dependency: FE05-T002 through FE05-T004.
  - GREEN: create starts `ACTIVE`; metadata update excludes status/copy fields; unique ISBN, references, field bounds, version comparison, mutation, and audit use one transaction.
  - Verify: focused route and SQL tests pass happy, validation, duplicate, stale, and audit-failure rollback cases.
  - DoD: update returns the advanced version and never changes `Books.Status` or any `BookCopies` row.

- [x] **FE05-T006 - Implement deactivate/reactivate and remove copy mutation ownership.**
  - Maps to: BR-FE05-004, BR-FE05-008 through BR-FE05-010, BR-FE05-012, BR-FE05-014 through BR-FE05-016, BR-FE05-018; FR-FE05-008, FR-FE05-014, FR-FE05-015, FR-FE05-018, FR-FE05-019, FR-FE05-021 through FR-FE05-025; AC-FE05-008 through AC-FE05-010, AC-FE05-012 through AC-FE05-016.
  - Files: `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js`, `backend/src/services/bookService.js`, `backend/src/repositories/bookRepository.js`, `backend/tests/bookRoutes.test.js`, `backend/tests/sql/bookConcurrency.sqltest.js`, `backend/src/docs/openapi.yaml`.
  - Dependency: FE05-T005.
  - RED: tests reject missing/stale version, missing/overlength reason, invalid transition, and any `/availability` copy-status command.
  - GREEN: deactivate/reactivate change only `Books.Status`, write audit atomically, preserve all related records, and return the new version.
  - Verify: route/SQL tests compare book, copies, borrowings, reservations, and audit state before/after each command.
  - DoD: the `/availability` route plus `updateBookAvailability` controller/service/repository methods are removed; calls receive the standard safe `404` response and no state changes.

- [x] **FE05-T007 - Reconcile the book-management frontend.**
  - Maps to: AC-FE05-003, AC-FE05-004, AC-FE05-007, AC-FE05-008, AC-FE05-011 through AC-FE05-017; NFR-FE05-UX-001/002.
  - Files: `frontend/src/page/BookManagement.jsx`, `frontend/src/api/libraryFeatureApi.js`, `frontend/test/bookManagementFrontend.test.js`.
  - Dependency: FE05-T003 through FE05-T006.
  - RED: tests fail while the page sends copy status, calls `/availability`, labels every unavailable book as borrowed, omits `If-Match`, or lacks reason/confirmation.
  - GREEN: consume public/admin responses, preserve last-seen version, send metadata-only update, implement deactivate/reactivate confirmation with reason, and render `Không khả dụng` for derived unavailable state.
  - Verify: `node --test frontend/test/bookManagementFrontend.test.js` passes.
  - DoD: every mutation reloads canonical server state and stale conflicts instruct staff to reload before retrying.

- [x] **FE05-T008 - Close traceability and verification evidence.**
  - Maps to: all FE05 BR/FR/AC IDs and the Definition of Done.
  - Files: changed FE05 implementation/tests, `.sdd/specs/feat-book-management/TEST_PLAN.md`, `.sdd/specs/feat-book-management/CHANGELOG.md`.
  - Dependency: FE05-T001 through FE05-T007.
  - Verify: focused backend, SQL, frontend, `npm.cmd run trace:enforce`, and `git diff --check` pass; full suites run only at the merge gate.
  - DoD: recorded evidence states exact results and does not reuse prototype or historical test results for unverified v0.5.0 behavior.

## Requirement-To-Task Coverage

| Requirement IDs | Planned tasks |
| --- | --- |
| BR-FE05-001 through BR-FE05-007 | FE05-T003, FE05-T004, FE05-T005 |
| BR-FE05-008 through BR-FE05-013 | FE05-T004, FE05-T006 |
| BR-FE05-014 through BR-FE05-018 | FE05-T002, FE05-T003, FE05-T005, FE05-T006 |
| FR-FE05-001 through FR-FE05-004 | FE05-T003, FE05-T004 |
| FR-FE05-005 through FR-FE05-010 | FE05-T004, FE05-T005, FE05-T006 |
| FR-FE05-011 through FR-FE05-017 | FE05-T003, FE05-T005 |
| FR-FE05-018 through FR-FE05-021 | FE05-T004, FE05-T005, FE05-T006 |
| FR-FE05-022 through FR-FE05-026 | FE05-T002, FE05-T003, FE05-T005, FE05-T006 |
| AC-FE05-001 through AC-FE05-004 | FE05-T004 |
| AC-FE05-005 through AC-FE05-007 | FE05-T005 |
| AC-FE05-008 through AC-FE05-010 | FE05-T005, FE05-T006 |
| AC-FE05-011, AC-FE05-012 | FE05-T004, FE05-T006 |
| AC-FE05-013 through AC-FE05-017 | FE05-T002, FE05-T003, FE05-T006, FE05-T007 |

## Completion Gate

- [~] FE05-T001 through FE05-T008 are agent-side complete; independent human integration review remains open.
- [x] Focused backend 45/45, SQL 7/7, frontend 6/6, traceability 26/26, and diff checks pass.
- [ ] Full merge-gate suites pass when the implementation branch is ready.
- [ ] FE06 owner confirms FE05 performs no copy-status mutation.
- [ ] Dung confirms public/staff endpoint and stale-write UX behavior.
