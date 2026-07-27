# TASKS.md - FE05 Book Management

Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Implementation State: COMPLETE

Owner: Dung

Updated: 2026-07-19

Workflow State: COMPLETE for the approved Phase 2 scope; H3, merge, and exact post-merge `main` CI are recorded in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Pending/open gate statements retained below are historical execution snapshots superseded by that evidence.

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
  - RED: cover public/staff visibility, public ISBN exclusion/title-author search, staff ISBN visibility/search, query policy, metadata validation, RBAC, derived availability, prohibited copy mutation, current/stale/missing `If-Match`, reason validation, status-only transitions, and audit rollback.
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
  - GREEN: public reads hide inactive books, exclude ISBN, and match q only against title/author; staff reads retain ISBN/status/version and ISBN search; availability is `AVAILABLE` only for active books with at least one available copy and otherwise `UNAVAILABLE`.
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
| BR-FE05-019, BR-FE05-020 | FE05-T009 |
| BR-FE05-021 | FE05-T012 |
| BR-FE05-022 | FE05-T013, FE05-T014, FE05-T015 |
| FR-FE05-001 through FR-FE05-004 | FE05-T003, FE05-T004 |
| FR-FE05-005 through FR-FE05-010 | FE05-T004, FE05-T005, FE05-T006 |
| FR-FE05-011 through FR-FE05-017 | FE05-T003, FE05-T005 |
| FR-FE05-018 through FR-FE05-021 | FE05-T004, FE05-T005, FE05-T006 |
| FR-FE05-022 through FR-FE05-026 | FE05-T002, FE05-T003, FE05-T005, FE05-T006 |
| FR-FE05-027, FR-FE05-028 | FE05-T009 |
| FR-FE05-029 | FE05-T011 |
| FR-FE05-030 | FE05-T012 |
| FR-FE05-031 | FE05-T013, FE05-T014, FE05-T015 |
| AC-FE05-001 through AC-FE05-004 | FE05-T004 |
| AC-FE05-005 through AC-FE05-007 | FE05-T005 |
| AC-FE05-008 through AC-FE05-010 | FE05-T005, FE05-T006 |
| AC-FE05-011, AC-FE05-012 | FE05-T004, FE05-T006 |
| AC-FE05-013 through AC-FE05-017 | FE05-T002, FE05-T003, FE05-T006, FE05-T007 |
| AC-FE05-018, AC-FE05-019 | FE05-T009 |
| AC-FE05-020 | FE05-T011 |
| AC-FE05-021 | FE05-T012 |
| AC-FE05-022 | FE05-T013, FE05-T014, FE05-T015 |

## Completion Gate

- [~] FE05-T001 through FE05-T008 are agent-side complete; independent human integration review remains open.
- [x] Focused backend 45/45, SQL 7/7, frontend 6/6, traceability 26/26, and diff checks pass.
- [ ] Full merge-gate suites pass when the implementation branch is ready.
- [ ] FE06 owner confirms FE05 performs no copy-status mutation.
- [ ] Dung confirms public/staff endpoint and stale-write UX behavior.
## 2026-07-22 corrective batch

- [x] Connect staff search and draft filters to the same paginated Admin book list and add regression coverage.
- [x] Remove rating from Librarian/Admin book list, detail, create, and update surfaces without widening the API contract.
- [x] Remove the status reason/confirmation inputs while retaining a generated audit reason and `If-Match` safeguards.
- [x] Add a reviewable metadata compatibility migration for deployed databases.
- [x] Expose catalog status in the Librarian update form while preserving dedicated status commands, generated audit reasons, and `If-Match` safeguards.
- [x] **FE05-T009 - Replace editable cover URLs with managed file upload.**
  - Maps to: BR-FE05-019/020, FR-FE05-027/028, AC-FE05-018/019, NFR-FE05-SEC-006, NFR-FE05-TXN-003, NFR-FE05-UX-003.
  - RED: require multipart create, invalid-signature rejection, stale replacement cleanup, managed-path deletion safety, and file-picker/preview frontend behavior.
  - GREEN: parse authenticated multipart metadata/cover input, validate and store managed images, compensate failed mutations, serve the cover directory, resolve backend asset paths, and replace both URL text inputs.
  - Boundary: no SQL schema change; `Books.CoverUrl`, rowversion/`If-Match`, book/audit atomicity, public-safe reads, and FE06 copy ownership remain unchanged.
- [~] **FE05-T010 - Verify and human-review v0.6.1.**
  - Focused automated evidence must cover backend route/storage, frontend contracts, lint/build, OpenAPI, traceability, and diff hygiene.
  - Evidence: focused FE05 backend 58/58, focused FE05 frontend 10/10, full frontend 215/215, frontend lint/build, FE05 traceability 30/30 (100%), and `git diff --check` pass.
  - Remaining gate: human review of the complete v0.6.1 implementation diff.
- [x] **FE05-T011 - Keep a status-updated book visible.**
  - Maps to: FR-FE05-029, AC-FE05-020, NFR-FE05-UX-004.
  - After the dedicated activate/deactivate command succeeds, switch the management status filter to the committed target status, reset to page 1, and reload canonical server data.
  - Preserve metadata PUT, dedicated status commands, `If-Match`, and server-owned list filtering/pagination.

## 2026-07-23 cross-feature contract correction

- [x] **FE05-T012 - Lock the protected active-reference read boundary.**
  - Maps to: BR-FE05-021, FR-FE05-030, AC-FE05-021.
  - Add the implemented `/api/books/metadata` boundary to SPEC/PLAN/TEST_PLAN and cover Guest/Member denial plus Librarian/Admin active-only results.
- [x] Clarify Librarian/Admin FE05 parity and the Admin-only FE11 reference-data mutation boundary.
- [x] Reconcile the managed-cover scope and current SPEC version in PLAN.

## 2026-07-27 deployed metadata readiness correction

- [x] **FE05-T013 - Fail deployment readiness on metadata schema drift.**
  - Maps to: BR-FE05-022, FR-FE05-031, AC-FE05-022, NFR-FE05-DEP-001.
  - Add a read-only `/health/ready` check for the canonical `Authors`, `Publishers`, and `Categories` tables plus their persisted `Status`/`CreatedAt` columns.
  - Keep the reviewed `2026-07-22-library-metadata-compatibility.sql` migration available for direct execution by an authorized database operator.
  - Extend staging smoke so a code-only deploy cannot pass while the Admin metadata tabs remain broken.
  - Preserve the migration policy: liveness never mutates schema, and CI does not apply SQL automatically.
- [x] **FE05-T014 - Remove the failed Kudu repair path and keep deployment fail-closed.**
  - Maps to: BR-FE05-022, FR-FE05-031, AC-FE05-022, NFR-FE05-DEP-001.
  - Remove the `Repair staging metadata schema` workflow, Kudu runner, bundled migration runtime, operator npm command, and their dedicated tests/review evidence.
  - Make `Deploy staging` manual-only so normal pushes run CI without automatically producing a known-failing staging deployment.
  - Preserve the reviewed SQL migration, read-only readiness endpoint, Admin/Librarian role boundaries, and fail-closed staging smoke.
- [x] **FE05-T015 - Reconcile legacy metadata schema in the backend startup runtime.**
  - Maps to: BR-FE05-022, FR-FE05-031, AC-FE05-022, NFR-FE05-DEP-001.
  - Package the reviewed metadata compatibility SQL with the backend and apply it transactionally before the HTTP listener starts.
  - Verify the postcondition, refuse to listen on failure, keep `/health/ready` read-only, and retain the manual-only staging workflow.
  - Defer `Status` validation to a dynamic SQL batch so SQL Server compiles it only after the missing
    metadata columns have been added in the same transaction.
  - Lock the compile-order correction with a regression test and execute the candidate twice on a
    specifically named disposable local SQL Server database before deployment.
  - Cover migration loading/application, startup ordering/failure, deployment packaging, smoke
    behavior, and existing Admin/Librarian role boundaries.

## 2026-07-28 CI/CD activation

- [x] **FE05-T016 - Deploy staging automatically after successful main CI.**
  - Maps to: NFR-FE05-DEP-001.
  - Trigger `Deploy staging` only after the exact `main` CI run succeeds, while retaining manual reruns.
  - Check out the CI-tested commit, retain the packaged startup migration and fail-closed smoke test, and prevent failed CI runs from deploying.
  - Evidence: the workflow policy and staging smoke regressions pass locally; the pushed workflow run provides live deployment evidence.

- [x] **FE05-T017 - Permit separately approved feature compatibility migrations in the startup gate.**
  - Maps to: NFR-FE05-DEP-001.
  - Keep FE05 catalog readiness read-only while allowing the startup gate to package, apply, and verify the FE02-owned `CHANGE_PASSWORD_OTP` constraint migration before listen.
  - Evidence: deployment policy and focused startup/schema regressions verify both reviewed migrations remain packaged and fail closed.

## 2026-07-28 single-book status-list correction

- [~] **FE05-T018 - Preserve and correctly render a mixed-status list after a one-book status command.**
  - Maps to: BR-FE05-011, FR-FE05-029, FR-FE05-032, AC-FE05-020, AC-FE05-023.
  - Preserve read-only availability in the detail projection and mutate only the selected canonical `bookId`.
  - Clear the status filter and reload the canonical mixed-status first page after both the update form and standalone status command.
  - Render the management-list status column from canonical `Books.Status`, not `availabilityStatus`.
  - Verify focused frontend tests, full frontend tests, lint/build, traceability, and diff hygiene before human review.
