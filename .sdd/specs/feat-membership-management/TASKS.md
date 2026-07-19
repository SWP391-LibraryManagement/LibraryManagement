# TASKS.md - FE04 Membership Management

Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Implementation State: COMPLETE

Owner: Dat

Updated: 2026-07-19

Workflow State: FE04-T001 through FE04-T008 are agent-side complete; FE04-T009 awaits final repository rerun and human acceptance

---

## Task Rules

- Execute tasks in numeric order unless the dependency field explicitly permits parallel work.
- Start every behavior task with the named failing test; do not mark a task complete from prototype code presence.
- Keep `MembershipApplications` history immutable and `Members.Status` canonical.
- Do not assign roles, implement borrowing/reservation, or add expiry/payment behavior.
- Add `@spec` tags to changed implementation files for the mapped FR/BR IDs.

## Ordered Tasks

- [x] **FE04-T001 - Add RED membership contract and concurrency tests.**
  - Maps to: BR-FE04-001 through BR-FE04-018; FR-FE04-001 through FR-FE04-012; AC-FE04-001 through AC-FE04-011.
  - Files: `backend/tests/membershipRoutes.test.js`, `backend/tests/helpers/inMemoryMembershipRepositories.js`, create `backend/tests/sql/membershipConcurrency.sqltest.js`.
  - Dependency: none.
  - RED: add named cases for active applicant access, canonical `NONE`, duplicate pending, approved block, rejected re-application, review race, atomic rollback, private status, required reason, and non-blocking/idempotent FE10 delivery.
  - Verify RED: `npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js tests/sql/membershipConcurrency.sqltest.js` fails only on the missing v0.2.0 behavior.
  - DoD: each approved AC has at least one concrete assertion and injected failures prove no partial state.

- [x] **FE04-T002 - Reconcile SQL and persistence contracts.**
  - Maps to: BR-FE04-003, BR-FE04-014 through BR-FE04-017; FR-FE04-001 through FR-FE04-005, FR-FE04-010, FR-FE04-011; AC-FE04-001 through AC-FE04-004, AC-FE04-006, AC-FE04-009; NFR-FE04-TXN-001/002.
  - Files: `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md`, `backend/src/models/Member.js`, `backend/src/models/MembershipApplication.js`, `backend/src/repositories/membershipRepository.js`.
  - Dependency: FE04-T001.
  - GREEN: enforce at most one pending application while retaining history; expose transaction methods for apply/approve/reject with deterministic conflict outcomes.
  - Verify: SQL tests from FE04-T001 pass for duplicate apply, competing reviews, and rollback.
  - DoD: no `EXPIRED` state or physical history deletion is introduced; parameterized SQL is used throughout.
  - Evidence: baseline/model/ADR checks pass; the migration ran twice and all four static plus six mutable SQL cases passed in the disposable SQL Server run recorded in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.

- [x] **FE04-T003 - Reconcile authentication, authorization, validation, and API contract.**
  - Maps to: BR-FE04-001, BR-FE04-002, BR-FE04-006 through BR-FE04-011, BR-FE04-017; FR-FE04-006 through FR-FE04-008; AC-FE04-005 through AC-FE04-008; NFR-FE04-SEC-001 through NFR-FE04-SEC-004.
  - Files: `backend/src/routes/membershipRoutes.js`, `backend/src/controllers/membershipController.js`, `backend/src/validators/membershipValidators.js`, `backend/src/services/membershipService.js`, `backend/src/docs/openapi.yaml`.
  - Dependency: FE04-T001.
  - GREEN: permit authenticated active `MEMBER` users to apply/view own status without requiring a prior membership projection; deny non-member roles; retain Librarian/Admin review guards; validate IDs, status, pagination, and reason.
  - Verify: focused route tests return `401`, `403`, `400`, `404`, or `409` according to the approved branch and never expose stack traces.
  - DoD: all five endpoints and response/error contracts are documented in OpenAPI.
  - Evidence: non-member apply/status denial and active `MEMBER` applicant boundaries pass; the full route suite passes the reconciled atomicity, response, concurrency, audit, and notification behavior.

- [x] **FE04-T004 - Implement canonical apply, re-application, and own-status behavior.**
  - Maps to: BR-FE04-002 through BR-FE04-005, BR-FE04-011, BR-FE04-012, BR-FE04-014 through BR-FE04-017; FR-FE04-001 through FR-FE04-003, FR-FE04-007, FR-FE04-009, FR-FE04-010; AC-FE04-001, AC-FE04-002, AC-FE04-007 through AC-FE04-009, AC-FE04-011.
  - Files: `backend/src/services/membershipService.js`, `backend/src/repositories/membershipRepository.js`, `backend/tests/membershipRoutes.test.js`, `backend/tests/helpers/inMemoryMembershipRepositories.js`.
  - Dependency: FE04-T002, FE04-T003.
  - GREEN: apply atomically creates a new immutable application and updates/creates the canonical member row; own status returns `{ membershipStatusView, memberStatus, currentApplication }` using deterministic latest-application ordering.
  - Verify: `npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js` passes apply/status/re-application cases.
  - DoD: `NONE` is derived only when both member and application are absent; application history never overrides canonical eligibility.
  - Evidence: focused membership suite passes canonical envelope, one-pending conflict, canonical approved block, deterministic latest history, and rejected re-application cases.

- [x] **FE04-T005 - Implement atomic approval and rejection.**
  - Maps to: BR-FE04-006 through BR-FE04-010, BR-FE04-013 through BR-FE04-015; FR-FE04-004 through FR-FE04-006, FR-FE04-008, FR-FE04-011; AC-FE04-003 through AC-FE04-006; NFR-FE04-LOG-001.
  - Files: `backend/src/services/membershipService.js`, `backend/src/repositories/membershipRepository.js`, `backend/src/repositories/auditLogRepository.js`, `backend/tests/membershipRoutes.test.js`, `backend/tests/sql/membershipConcurrency.sqltest.js`.
  - Dependency: FE04-T002, FE04-T003.
  - GREEN: application, canonical member, reviewer/timestamp/reason, and audit update in one transaction; only one competing final transition succeeds.
  - Verify: focused route and SQL tests pass approval, rejection, invalid state, reason length, rollback, and race cases.
  - DoD: audit metadata identifies actor, application, member, timestamp, result, and safe rejection reason.
  - Evidence: in-memory cases and the six mutable SQL cases pass duplicate apply, competing final review, shared timestamps, reapplication history, and application/review audit rollback.

- [x] **FE04-T006 - Add post-commit FE10 membership-result delivery.**
  - Maps to: BR-FE04-018; FR-FE04-012; AC-FE04-003, AC-FE04-004, AC-FE04-010.
  - Files: `backend/src/services/membershipService.js`, `backend/src/services/notificationService.js`, `backend/src/app.js`, `backend/tests/membershipRoutes.test.js`.
  - Dependency: FE04-T005 and the approved FE10 requester interface.
  - RED: tests assert one FE04-bound call with source application/final status and key `FE04:MEMBERSHIP_RESULT:<applicationId>:<finalStatus>`; requester failure leaves the decision committed.
  - GREEN: invoke FE10 only after commit and return a safe delivery result without raw provider errors.
  - Verify: focused route tests pass success, duplicate-idempotency, and requester-failure cases.
  - DoD: no notification write occurs inside the membership transaction and no delivery failure changes membership state.
  - Evidence: injected FE04 requester tests pass exact type/template/source/idempotency, post-commit ordering, duplicate prevention, safe `PENDING`, and non-blocking `FAILED`; the reconciled shared application wiring is covered by the current integration harness.

- [x] **FE04-T007 - Reconcile staff list and applicant-safe response fields.**
  - Maps to: BR-FE04-011 through BR-FE04-014; FR-FE04-007, FR-FE04-009; AC-FE04-007, AC-FE04-011; NFR-FE04-PERF-001, NFR-FE04-UX-001/002.
  - Files: `backend/src/repositories/membershipRepository.js`, `backend/src/services/membershipService.js`, `backend/tests/membershipRoutes.test.js`, `backend/src/docs/openapi.yaml`.
  - Dependency: FE04-T004, FE04-T005.
  - GREEN: status-filtered paginated staff list remains protected; own status exposes stored rejection reason but not protected reviewer/internal fields.
  - Verify: route tests cover deterministic ordering, page/filter behavior, staff access, and member privacy.
  - DoD: FE07/FE08 can consume active-account plus canonical-approved membership without reading application history.
  - Evidence: focused routes pass deterministic pagination/search/status filtering and own-status returns only `{ membershipStatusView, memberStatus, currentApplication }` without reviewer internals.

- [x] **FE04-T008 - Reconcile the membership frontend with server truth.**
  - Maps to: AC-FE04-001 through AC-FE04-010; NFR-FE04-UX-001/002.
  - Files: `frontend/src/page/MembershipPage.jsx`, `frontend/src/component/membership/MembershipApplicationForm.jsx`, `frontend/src/component/membership/MembershipApplicationsTable.jsx`, `frontend/src/component/membership/MembershipReviewModal.jsx`, `frontend/src/component/membership/MyMembershipStatus.jsx`, `frontend/src/component/membership/membershipStatus.js`, `frontend/src/api/libraryFeatureApi.js`, create `frontend/test/membershipFrontend.test.js`.
  - Dependency: FE04-T003 through FE04-T007.
  - RED: source-level tests fail while demo fallback records, legacy status shape, or unbounded rejection input remain.
  - GREEN: use canonical fields, show explicit API errors/empty states, preserve re-apply rules, and refresh from the server after mutations.
  - Verify: `node --test frontend/test/membershipFrontend.test.js` passes.
  - DoD: network failure never fabricates membership status or staff applications.
  - Evidence: 5/5 focused frontend tests pass canonical response use, truthful errors, server search, mutation refresh, no demo/`NONE` fabrication, and 500-character rejection bounds.

- [~] **FE04-T009 - Close traceability and verification evidence.**
  - Maps to: all FE04 BR/FR/AC IDs and the Definition of Done.
  - Files: changed FE04 implementation/tests, `.sdd/specs/feat-membership-management/TEST_PLAN.md`, `.sdd/specs/feat-membership-management/CHANGELOG.md`.
  - Dependency: FE04-T001 through FE04-T008.
  - Verify: focused backend, SQL, frontend, `npm.cmd run trace:enforce`, and `git diff --check` all pass; full suites are run only at the merge gate.
  - DoD: evidence records exact test counts/results, remaining external dependency risks, and human review status without claiming unrun checks.
  - Evidence: FE04 trace is 12/12 and disposable SQL Server validation passes 10/10 FE04 SQL cases with cleanup. Final repository reruns, browser acceptance, cross-feature review, and human acceptance remain open.

## Requirement-To-Task Coverage

| Requirement IDs | Planned tasks |
| --- | --- |
| BR-FE04-001 through BR-FE04-005 | FE04-T001, FE04-T003, FE04-T004 |
| BR-FE04-006 through BR-FE04-010 | FE04-T001, FE04-T003, FE04-T005 |
| BR-FE04-011 through BR-FE04-017 | FE04-T002, FE04-T004, FE04-T005, FE04-T007 |
| BR-FE04-018 | FE04-T006 |
| FR-FE04-001 through FR-FE04-003 | FE04-T004 |
| FR-FE04-004 through FR-FE04-006 | FE04-T005 |
| FR-FE04-007 through FR-FE04-009 | FE04-T003, FE04-T004, FE04-T007 |
| FR-FE04-010, FR-FE04-011 | FE04-T002, FE04-T004, FE04-T005 |
| FR-FE04-012 | FE04-T006 |
| AC-FE04-001, AC-FE04-002 | FE04-T004 |
| AC-FE04-003 through AC-FE04-006 | FE04-T005, FE04-T006 |
| AC-FE04-007, AC-FE04-008 | FE04-T003, FE04-T004, FE04-T007 |
| AC-FE04-009 | FE04-T004 |
| AC-FE04-010 | FE04-T006 |
| AC-FE04-011 | FE04-T007 |

## Completion Gate

- [ ] FE04-T001 through FE04-T009 are complete and independently reviewed.
- [ ] Focused backend, SQL, frontend, traceability, and diff checks pass.
- [x] Full configured non-SQL merge-gate suites pass locally; rerun after SQL/fan-in changes.
- [ ] No secret, raw notification credential, or real personal data is added.
- [ ] Dat and the cross-feature FE07/FE08 owners confirm the canonical eligibility contract.
