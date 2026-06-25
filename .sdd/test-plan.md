# TEST PLAN - Library Management System

Version: 0.1.0

Status: DRAFT - pending team review

Last Updated: 2026-06-22

Canonical Location: `.sdd/test-plan.md`

---

## 0. Purpose And Source Of Truth

## 0.1 Per-Feature Test Plan Files

The master policy stays in this file, but detailed test ownership is split per feature:

| Feature | Per-Feature Test Plan |
| --- | --- |
| FE01 Public / Browse | `.sdd/specs/feat-public-browse/TEST_PLAN.md` |
| FE02 Authentication | `.sdd/specs/feat-auth/TEST_PLAN.md` |
| FE03 User Profile | `.sdd/specs/feat-user-profile/TEST_PLAN.md` |
| FE04 Membership Management | `.sdd/specs/feat-membership-management/TEST_PLAN.md` |
| FE05 Book Management | `.sdd/specs/feat-book-management/TEST_PLAN.md` |
| FE06 Inventory / Book Copy | `.sdd/specs/feat-inventory-book-copy/TEST_PLAN.md` |
| FE07 Borrowing Management | `.sdd/specs/feat-borrowing-management/TEST_PLAN.md` |
| FE08 Reservation Management | `.sdd/specs/feat-reservation-management/TEST_PLAN.md` |
| FE09 Fine Management | `.sdd/specs/feat-fine-management/TEST_PLAN.md` |
| FE10 Notification Management | `.sdd/specs/feat-notification-management/TEST_PLAN.md` |
| FE11 User & Role Management | `.sdd/specs/feat-user-role-management/TEST_PLAN.md` |
| FE12 Reporting & Statistics | `.sdd/specs/feat-reporting-statistics/TEST_PLAN.md` |

Rule: when a feature `SPEC.md`, `PLAN.md`, or `TASKS.md` changes, update that feature's `TEST_PLAN.md` in the same PR.

---


This document is the canonical project-level test plan for the SWP391 Library Management System.

It follows the Spec-Driven and Agent-Driven Development playbook structure provided by the team:

- tests are part of the SHELL workstream;
- tests are generated from specs and acceptance criteria;
- agents can generate test drafts, but humans review gaps;
- green tests plus a completed spec checklist are required before merge;
- coverage and security gates are planned explicitly in the roadmap.

This file does not replace feature-level source documents. For each feature, testing must still trace back to:

- `.sdd/specs/feat-{name}/SPEC.md`
- `.sdd/specs/feat-{name}/PLAN.md`
- `.sdd/specs/feat-{name}/TASKS.md`
- `.sdd/specs/feat-{name}/CHANGELOG.md`

When this test plan and a feature spec disagree, update the spec and this plan together through team review.

---

## 1. Coverage Target

### 1.1 Minimum Coverage Rule

Target state:

- Minimum coverage: `>=80%` for all new code.
- Required: unit tests for all service/business logic functions.
- Required: integration tests for all API endpoints, including happy path and error path.
- E2E tests: optional but encouraged for critical user flows.
- No merge if existing tests break.

This matches the project constitution and the playbook Article 5 testing requirements.

### 1.2 Project-Specific Coverage Scope

For this project, coverage applies first to backend business logic because the backend owns the core rules:

- authentication and authorization;
- borrowing eligibility;
- book/copy availability;
- reservation queue logic;
- return flow;
- fine calculation;
- notification trigger logic;
- reporting aggregation logic;
- input validation and permission checks.

Frontend coverage is currently not enforced by automated component tests. Until frontend test tooling is added, every frontend PR must at minimum pass lint/build and include manual UI verification notes.

### 1.3 Current Coverage Status

Current status as of 2026-06-22:

- Backend Jest tests exist in `backend/tests/`.
- Backend test command: `npm.cmd --prefix backend test`.
- Frontend lint command: `npm.cmd --prefix frontend run lint`.
- Frontend build command: `npm.cmd --prefix frontend run build`.
- Traceability command: `node scripts/check-traceability.js` or `npm.cmd run trace`.
- A formal Jest coverage threshold is not enforced yet.
- Browser E2E tests are not implemented yet.
- SQL Server test database integration is not fully formalized yet.

Known action item:

- Add a coverage script and CI threshold once the baseline is agreed, then enforce that coverage must not decrease below the baseline.

---

## 2. Test Strategy

### 2.1 Position In The Hybrid Framework

Testing belongs in the SHELL layer and uses Agent-Driven Development support:

```text
Spec -> Agent generates tests -> Human reviews gaps -> Tests run green -> Spec checklist complete
```

Project rule:

- Do not trust a claim that work is finished only because someone says it is finished.
- Trust evidence: green tests, passing validation checks, and completed spec checklist.

### 2.2 Decision Matrix

| Task Type | Spec Depth | Agent Autonomy | Human Responsibility |
| --- | --- | --- | --- |
| Unit tests | None or direct code/spec context | Agentic ADD | Review missing business cases and edge cases |
| Integration tests | Light spec | Agentic ADD | Confirm endpoint contracts, auth, and data setup |
| E2E tests | Light spec | Guided | Select critical user flows and verify UI behavior |
| Security tests/audit | Safety constraints + endpoint list | Guided | Confirm real risk coverage and approve fixes |

### 2.3 Test Levels

| Test Level | Purpose | Required For | Current Project Location |
| --- | --- | --- | --- |
| Unit | Verify one service/function/business rule in isolation | All service/business logic functions | `backend/tests/*.test.js` |
| Integration/API | Verify REST endpoints, auth, validation, and data effects | Every implemented API endpoint | `backend/tests/*Routes.test.js`, `backend/tests/integration.test.js` |
| E2E | Verify critical browser-level user flows | Critical flows such as login, borrow, return, fine payment, reports | Gap - future `tests/e2e/` or frontend E2E setup |
| Manual UI | Verify layout, responsive behavior, visible states, and UX | Every UI-facing change | PR checklist / screenshots |
| Security/Dependency | Verify no Critical/High vulnerabilities and no unsafe dependency drift | Week 12 and before release | `npm audit`, code review, endpoint authorization checks |

### 2.4 Standard Test Design

Every meaningful test set should include:

- Happy path: main success scenario.
- Error cases: invalid input, missing data, unauthorized/forbidden actions, not found records.
- Edge cases: `null`, `undefined`, empty values, empty collections, missing optional fields.
- Boundary values: maximum borrow limit, due date boundary, fine amount boundary, pagination limits.
- Security checks: auth bypass, role bypass, injection input, sensitive data exposure.

---

## 3. Test Schedule

Testing is continuous, but the roadmap has focused test and security weeks.

| Phase / Week | Focus | Expected Output |
| --- | --- | --- |
| Week 6 | Authentication quality gate | Auth has `>=80%` coverage target; login/register/reset/auth middleware tests pass |
| Week 10 | Core feature acceptance | All core features pass acceptance tests mapped to their `SPEC.md` |
| Week 11 | Testing Sprint | Agent generates unit tests for all business logic; agent generates integration tests for API endpoints; Test Engine reviews and fills gaps; coverage report reaches `>=80%` target |
| Week 12 | Security Audit | Full codebase security audit; Critical/High vulnerabilities fixed; dependency audit completed |
| Every sprint | Regression protection | Existing tests pass before merge; no coverage decrease after baseline exists |

Note from the playbook: Week 11-12 is a quality sprint, not a new-feature sprint. The focus is testing, security audit, bug fixing, and clean build evidence.

### 3.1 Week 11 Testing Sprint Details

Required activities:

1. List every service/business logic function.
2. Generate or write unit tests for each function.
3. List every backend API endpoint.
4. Generate or write integration tests for each endpoint.
5. Cover happy path and error path for each endpoint.
6. Run coverage report.
7. Test Engine reviews low-coverage areas and missing acceptance criteria.
8. Fill gaps until the agreed coverage target is reached or exceptions are documented.

### 3.2 Week 12 Security Audit Details

Required activities:

1. Run dependency audit for backend and frontend.
2. Review protected endpoints for server-side RBAC enforcement.
3. Check validation on every user-controlled input boundary.
4. Check that no stack traces or internal errors leak to clients.
5. Check that tests/fixtures do not contain secrets or real personal data.
6. Fix all Critical and High vulnerabilities before release/merge.
7. Document any accepted Medium/Low risk with reason and owner.

---

## 4. Test Engine Role

### 4.1 Role Definition

Each sprint must assign one Test Engine.

The Test Engine coordinates agent-assisted test writing and controls coverage quality.

Core responsibility:

```text
Ensure >=80% test coverage before merge, or document the reviewed exception.
```

### 4.2 Test Engine Responsibilities

The Test Engine must:

- maintain this `.sdd/test-plan.md` file;
- check that feature `SPEC.md`, `PLAN.md`, and `TASKS.md` include testable requirements;
- ask agents or teammates to generate missing tests from specs;
- review generated tests for missing gaps, weak assertions, and false confidence;
- make sure existing tests pass before merge;
- make sure coverage does not decrease after the baseline is enabled;
- verify that integration tests include happy path and error path;
- record manual UI verification evidence for UI changes;
- coordinate Week 11 testing sprint and Week 12 security audit.

### 4.3 Rotation Rule

The Test Engine role should rotate each sprint so testing knowledge is shared by the team.

Recommended rotation record:

| Sprint | Test Engine | Backup | Notes |
| --- | --- | --- | --- |
| Sprint 1 | TBD | TBD | Foundation and auth tests |
| Sprint 2 | TBD | TBD | Core circulation features |
| Sprint 3 | TBD | TBD | Reports, notification, and integration tests |
| Sprint 4 | TBD | TBD | Testing sprint/security audit |

Team action:

- Fill the assigned names after the team lead confirms the sprint staffing.

---

## 5. Per-Feature Test Requirements

### 5.1 Universal Rule Per Feature

For each feature:

- Unit: each service/business logic function needs at least one meaningful test.
- Integration: each API endpoint needs happy path and error path tests.
- E2E: critical user flows should be covered when E2E tooling exists.
- Manual UI: every changed UI screen must be checked for loading, empty, success, error, and permission states.
- Traceability: tests should reference feature IDs, business rules, or acceptance criteria when practical.

### 5.2 Feature Matrix

| Feature | Unit Test Requirement | Integration/API Requirement | E2E / Manual Critical Flow |
| --- | --- | --- | --- |
| FE01 Public / Browse | Search/filter/sort helper logic if added | Public browse/search/detail endpoints happy + invalid query | Guest searches and views book detail |
| FE02 Authentication | Password hashing, token, validation, reset logic | Register/login/logout/forgot/reset/me endpoints happy + error + auth failure | User registers, logs in, resets password |
| FE03 User Profile | Profile validation and update rules | Profile read/update/change password endpoints happy + forbidden/error | Member updates profile safely |
| FE04 Membership Management | Membership eligibility/status rules | Apply/approve/reject/status endpoints happy + role errors | Member applies; librarian/admin approves |
| FE05 Book Management | Book validation and catalog rules | CRUD/search endpoints happy + validation + forbidden | Librarian creates/updates book |
| FE06 Inventory / Book Copy | Copy status and availability rules | Copy CRUD/status endpoints happy + conflict/error | Librarian manages physical copies |
| FE07 Borrowing Management | Borrow eligibility, limit, availability, return rules | Borrow/request/approve/return/history endpoints happy + error | Member borrows; librarian approves; item returned |
| FE08 Reservation Management | Queue and cancellation rules | Reserve/cancel/queue endpoints happy + unavailable/error | Member reserves unavailable book |
| FE09 Fine Management | Fine calculation and payment status rules | Fine list/calculate/pay endpoints happy + error | Librarian records fine payment |
| FE10 Notification Management | Template validation, safe payload, trigger rules | Notification/template endpoints happy + invalid/forbidden | User sees notification inbox |
| FE11 User & Role Management | Role assignment and permission rules | User/role endpoints happy + forbidden + invalid role | Admin changes user role |
| FE12 Reporting & Statistics | Aggregation and date range rules | Report endpoints happy + invalid range + forbidden | Admin/librarian views reports |

### 5.3 Current Automated Test Inventory

Current backend test files:

| Test File | Main Coverage Area |
| --- | --- |
| `backend/tests/app.test.js` | App startup/basic route behavior |
| `backend/tests/authRoutes.test.js` | Authentication endpoints |
| `backend/tests/authUtils.test.js` | Authentication utility logic |
| `backend/tests/borrowingRoutes.test.js` | Borrowing routes |
| `backend/tests/fineRoutes.test.js` | Fine routes |
| `backend/tests/integration.test.js` | Cross-feature backend integration flow |
| `backend/tests/models.test.js` | Sequelize model definitions/associations |
| `backend/tests/notificationRoutes.test.js` | Notification routes |
| `backend/tests/profileRoutes.test.js` | Profile routes |
| `backend/tests/profileService.test.js` | Profile service logic |
| `backend/tests/reportRoutes.test.js` | Reporting routes |
| `backend/tests/reservationRoutes.test.js` | Reservation routes |
| `backend/tests/userManagementRoutes.test.js` | User and role management routes |

Current gaps to close:

- add enforced coverage reporting;
- add frontend component/unit test approach;
- add E2E flow coverage for critical user journeys;
- add SQL Server-backed integration test environment or documented test double strategy;
- add missing tests for any endpoint/service not represented in the inventory above.

---

### 5.4 Detailed Per-Feature Test Catalog

This catalog turns the feature specs into concrete test targets. It answers: "For each feature, what exactly should the team test?"

Legend:

- Unit = service/business rule tests.
- API = integration tests for backend REST endpoints.
- E2E/manual = browser or manual acceptance flow evidence.
- Evidence = current automated test files already present in the repository.
- Gap = missing or incomplete test coverage that the Test Engine should track.

#### FE01 - Public / Browse (`feat-public-browse`)

Spec basis: `BR-FE01-*`, `FR-FE01-*`, `AC-FE01-*` in `.sdd/specs/feat-public-browse/SPEC.md`.

Must test:

- Unit:
  - search/filter/sort/pagination rules if implemented outside the controller;
  - book visibility rule: public users only see approved/active public catalog data;
  - empty result handling;
  - invalid query, long keyword, unknown category, and boundary page size.
- API:
  - `GET /books` happy path with book list;
  - `GET /books/categories` returns categories;
  - `GET /books/:bookId` happy path;
  - invalid `bookId`, not found book, inactive/deactivated book, invalid filters;
  - no authentication required for public browse endpoints.
- E2E/manual:
  - guest opens home/catalog, searches, filters by category, opens book detail;
  - empty search result shows clear message.
- Current evidence:
  - Public browse behavior is partly served by `backend/src/routes/bookRoutes.js`.
- Gap:
  - No dedicated `bookRoutes.test.js` / public browse route test file is currently listed in `backend/tests/`.

#### FE02 - Authentication (`feat-auth`)

Spec basis: `BR-FE02-*`, `FR-FE02-*`, `AC-FE02-*` in `.sdd/specs/feat-auth/SPEC.md`.

Must test:

- Unit:
  - password hashing and password compare;
  - token creation/verification/expiry handling;
  - OTP/reset token validation;
  - invalid email/password format validation;
  - account status checks.
- API:
  - `POST /auth/register` happy + duplicate email/invalid input;
  - `POST /auth/verify-email` happy + invalid/expired OTP;
  - `POST /auth/resend-verification` happy + invalid user/state;
  - `POST /auth/login` happy + wrong password/unverified/inactive user;
  - `POST /auth/refresh-token` happy + expired/invalid token;
  - `POST /auth/logout` happy + invalid token;
  - `POST /auth/change-password`, `/change-password/request-otp`, `/change-password/confirm` happy + wrong old password/invalid OTP;
  - `POST /auth/forgot-password`, `/reset-password` happy + invalid/expired token;
  - `GET /auth/me` authenticated + unauthenticated.
- E2E/manual:
  - register -> verify -> login -> view current user;
  - forgot password/reset password;
  - change password while logged in.
- Current evidence:
  - `backend/tests/authRoutes.test.js`;
  - `backend/tests/authUtils.test.js`.
- Gap:
  - Coverage threshold is not enforced yet; confirm every auth endpoint has both happy and error path before Week 11.

#### FE03 - User Profile (`feat-user-profile`)

Spec basis: `BR-FE03-*`, `FR-FE03-*`, `AC-FE03-*` in `.sdd/specs/feat-user-profile/SPEC.md`.

Must test:

- Unit:
  - editable field validation;
  - phone/email/display field normalization if implemented;
  - avatar file validation: allowed type, size, missing file, storage path safety;
  - rule that profile update cannot change role, membership status, password, or protected account fields.
- API:
  - `GET /profile/me` authenticated happy path;
  - `PUT /profile/me` happy path with approved fields;
  - `PUT /profile/me` rejects forbidden fields, invalid phone/name, empty body;
  - `POST /profile/me/avatar` happy + missing file/invalid type/oversize/unauthenticated.
- E2E/manual:
  - user opens profile, edits allowed fields, sees saved state;
  - avatar upload success/error states;
  - unauthenticated user is redirected/blocked.
- Current evidence:
  - `backend/tests/profileRoutes.test.js`;
  - `backend/tests/profileService.test.js`.
- Gap:
  - FE03 spec/plan currently has avatar revision status; manual verification should be recorded after UI check.

#### FE04 - Membership Management (`feat-membership-management`)

Spec basis: `BR-FE04-*`, `FR-FE04-*`, `AC-FE04-*` in `.sdd/specs/feat-membership-management/SPEC.md`.

Must test:

- Unit:
  - membership application eligibility;
  - status transition rules: pending, approved, rejected, suspended/expired if present in spec;
  - duplicate active/pending application prevention;
  - effect of membership status on borrowing/reservation eligibility.
- API:
  - member applies for membership happy path;
  - duplicate application rejected;
  - librarian/admin approves/rejects application;
  - unauthorized users cannot approve/reject;
  - member can view own membership status;
  - invalid status transition returns safe error.
- E2E/manual:
  - registered user applies;
  - staff approves;
  - approved member can proceed to borrow/reserve flow.
- Current evidence:
  - No dedicated membership route/test file was found in current backend route inventory.
- Gap:
  - FE04 has approved `SPEC.md` but `PLAN.md` and `TASKS.md` are `NOT STARTED`; do not claim implementation/test completion until decomposed and tested.

#### FE05 - Book Management (`feat-book-management`)

Spec basis: `BR-FE05-*`, `FR-FE05-*`, `AC-FE05-*` in `.sdd/specs/feat-book-management/SPEC.md`.

Must test:

- Unit:
  - required field validation;
  - ISBN/identifier uniqueness rule;
  - category/author/publisher metadata validation;
  - deactivate rule versus hard delete;
  - search/filter/sort rules for management view.
- API:
  - `GET /books/metadata` authorized manager happy path;
  - `GET /books/management` manager list with filters;
  - `POST /books` create happy + missing/duplicate/invalid fields;
  - `PUT /books/:bookId` update happy + not found/invalid;
  - `PATCH /books/:bookId/deactivate` happy + not found/conflict;
  - role check: non-manager cannot create/update/deactivate.
- E2E/manual:
  - librarian/admin creates book, edits book, deactivates book;
  - public browse reflects active catalog data only.
- Current evidence:
  - Book routes exist in `backend/src/routes/bookRoutes.js`.
- Gap:
  - No dedicated `bookRoutes.test.js` is currently listed;
  - FE05 `PLAN.md` and `TASKS.md` are `NOT STARTED`, so prototype code must be reconciled with spec before claiming done.

#### FE06 - Inventory / Book Copy Management (`feat-inventory-book-copy`)

Spec basis: `BR-FE06-*`, `FR-FE06-*`, `AC-FE06-*` in `.sdd/specs/feat-inventory-book-copy/SPEC.md`.

Must test:

- Unit:
  - copy barcode/identifier uniqueness;
  - allowed copy statuses and status transitions;
  - availability calculation by copy status;
  - conflict rule: cannot mark actively borrowed/reserved copy as freely available;
  - location/shelf validation if implemented.
- API:
  - create/list/update/deactivate copy happy paths once endpoints exist;
  - invalid status transition;
  - duplicate barcode;
  - forbidden role;
  - conflict with active borrow/reservation.
- E2E/manual:
  - librarian adds physical copy;
  - changes copy status;
  - borrowing/reservation availability updates accordingly.
- Current evidence:
  - Inventory report endpoint exists under FE12 (`GET /reports/inventory`), but dedicated FE06 copy management routes were not found in current route inventory.
- Gap:
  - FE06 `PLAN.md` and `TASKS.md` are `NOT STARTED`;
  - dedicated copy management API/tests still need to be planned or confirmed.

#### FE07 - Borrowing Management (`feat-borrowing-management`)

Spec basis: `BR-FE07-*`, `FR-FE07-*`, `AC-FE07-*` in `.sdd/specs/feat-borrowing-management/SPEC.md`.

Must test:

- Unit:
  - borrow eligibility: approved membership, active account, no blocking overdue/fine state;
  - borrow limit: maximum 5 active borrowed copies;
  - copy availability check;
  - due date calculation: default 14 calendar days;
  - approve/reject/return/renew state transitions;
  - return transaction recording;
  - renewal boundary and conflict cases.
- API:
  - `POST /borrowing/borrow-requests` happy + unavailable copy + over limit + not approved member;
  - `GET /borrowing/borrow-requests/me` own history only;
  - `GET /borrowing/borrow-requests` staff list + unauthorized member forbidden;
  - `GET /borrowing/members/:memberId/borrowings` staff happy + not found/forbidden;
  - `PATCH /borrowing/borrow-requests/:requestId/approve` happy + conflict/unavailable/forbidden;
  - `PATCH /borrowing/borrow-requests/:requestId/reject` happy + invalid state;
  - `PATCH /borrowing/borrow-details/:borrowDetailId/return` happy + already returned/not found;
  - `PATCH /borrowing/borrow-details/:borrowDetailId/renew` happy + overdue/limit/invalid state.
- E2E/manual:
  - member requests borrow;
  - librarian approves;
  - member sees borrowing history;
  - librarian records return;
  - overdue/renewal behavior checked with deterministic dates.
- Current evidence:
  - `backend/tests/borrowingRoutes.test.js`;
  - `backend/tests/integration.test.js`.
- Gap:
  - Week 11 should verify service-level coverage and all spec edge cases, especially date and limit boundaries.

#### FE08 - Reservation Management (`feat-reservation-management`)

Spec basis: `BR-FE08-*`, `FR-FE08-*`, `AC-FE08-*` in `.sdd/specs/feat-reservation-management/SPEC.md`.

Must test:

- Unit:
  - reservation eligibility: approved membership and active account;
  - duplicate reservation prevention;
  - queue ordering and priority rules;
  - cancellation rules;
  - process queue behavior when copy becomes available;
  - notification trigger for reservation-ready event.
- API:
  - `POST /reservations` happy + duplicate + not eligible + unavailable/invalid book;
  - `GET /reservations/me` own reservations only;
  - `POST /reservations/process-queue` staff/system happy + forbidden;
  - `GET /reservations` staff list + member forbidden;
  - `PATCH /reservations/:reservationId/cancel` happy + invalid owner/state;
  - `PATCH /reservations/:reservationId/process` happy + invalid state/not found.
- E2E/manual:
  - member reserves a book;
  - staff/system processes queue;
  - member receives/sees ready notification;
  - member cancels reservation.
- Current evidence:
  - `backend/tests/reservationRoutes.test.js`;
  - `backend/tests/integration.test.js`.
- Gap:
  - Confirm queue order and notification trigger tests map to FE08 acceptance criteria.

#### FE09 - Fine Management (`feat-fine-management`)

Spec basis: `BR-FE09-*`, `FR-FE09-*`, `AC-FE09-*` in `.sdd/specs/feat-fine-management/SPEC.md`.

Must test:

- Unit:
  - overdue fine calculation: 5,000 VND per overdue day per copy;
  - fine starts the day after due date;
  - zero fine when returned on or before due date;
  - boundary dates and timezone-safe deterministic dates;
  - paid/unpaid/status transition rules;
  - traceability from fine to borrowing/return transaction.
- API:
  - `GET /fines` happy + authorization/filtering;
  - `POST /fines` happy + invalid amount/member/borrow reference;
  - `PUT /fines/:fineId` happy + invalid status/amount/not found;
  - `DELETE /fines/:fineId` authorization + not found + unsafe delete guard if spec disallows deletion.
- E2E/manual:
  - overdue borrow generates/calculates fine;
  - librarian records payment;
  - member/staff sees correct fine status.
- Current evidence:
  - `backend/tests/fineRoutes.test.js`.
- Gap:
  - FE09 `PLAN.md` and `TASKS.md` are `NOT STARTED`; prototype fine code must be reconciled against the approved spec before claiming spec-driven completion.

#### FE10 - Notification Management (`feat-notification-management`)

Spec basis: `BR-FE10-*`, `FR-FE10-*`, `AC-FE10-*` in `.sdd/specs/feat-notification-management/SPEC.md`.

Must test:

- Unit:
  - notification request validation;
  - template variable validation;
  - safe payload/redaction rules;
  - recipient ownership and role visibility;
  - retry/status transition rules for pending/processed/failed notifications.
- API:
  - `POST /notifications/requests` happy + invalid template + missing recipient + forbidden;
  - `POST /notifications/process-pending` happy + no pending + failed send handling + unauthorized;
  - inbox/list/read endpoints if/when exposed by backend should test own-notification-only access.
- E2E/manual:
  - user sees notification inbox UI;
  - reservation/borrow/fine event creates visible notification;
  - sensitive tokens or internal payloads are not shown.
- Current evidence:
  - `backend/tests/notificationRoutes.test.js`;
  - `backend/tests/integration.test.js` for cross-feature flows.
- Gap:
  - If frontend notification inbox exists, add manual UI evidence and/or future E2E test for inbox states.

#### FE11 - User & Role Management (`feat-user-role-management`)

Spec basis: `BR-FE11-*`, `FR-FE11-*`, `AC-FE11-*` in `.sdd/specs/feat-user-role-management/SPEC.md`.

Must test:

- Unit:
  - role assignment/revocation rules;
  - account status transition rules;
  - protected admin action validation;
  - audit log creation for important admin actions;
  - guard against privilege escalation.
- API:
  - `GET /users` list users with authorization;
  - `GET /users/roles` list roles;
  - `GET /users/audit-logs` admin only;
  - `GET /users/:userId` happy + not found/forbidden;
  - `POST /users` admin creates user + duplicate/invalid;
  - `PUT /users/:userId` admin updates user + forbidden fields;
  - `PATCH /users/:userId/status` valid/invalid transition;
  - `POST /users/:userId/roles` assign role + invalid/duplicate/forbidden;
  - `DELETE /users/:userId/roles/:roleId` revoke role + invalid/forbidden.
- E2E/manual:
  - admin creates user;
  - admin assigns/removes role;
  - non-admin cannot access admin screens/actions;
  - audit log shows admin action.
- Current evidence:
  - `backend/tests/userManagementRoutes.test.js`.
- Gap:
  - FE11 `PLAN.md` and `TASKS.md` are `NOT STARTED`; tests should be reconciled with approved spec and role/audit edge cases.

#### FE12 - Reporting & Statistics (`feat-reporting-statistics`)

Spec basis: `BR-FE12-*`, `FR-FE12-*`, `AC-FE12-*` in `.sdd/specs/feat-reporting-statistics/SPEC.md`.

Must test:

- Unit:
  - aggregation calculations for borrowing, inventory, and users;
  - date range validation and boundary ranges;
  - zero-data reports;
  - read-only guarantee: reporting does not mutate source data;
  - privacy rule: reports do not expose unnecessary personal data.
- API:
  - `GET /reports/borrowing` happy + invalid date range + forbidden role;
  - `GET /reports/inventory` happy + empty inventory + forbidden role;
  - `GET /reports/users` happy + invalid filters + forbidden role;
  - report endpoints are read-only and staff-only.
- E2E/manual:
  - staff opens borrowing report;
  - staff opens inventory report;
  - staff opens user statistics report;
  - member/non-staff cannot access reports.
- Current evidence:
  - `backend/tests/reportRoutes.test.js`.
- Gap:
  - Add frontend/manual evidence for report pages, especially inventory report UI states.

### 5.5 Per-Feature Readiness Summary

| Feature | Spec Status | Plan/Tasks Status | Current Automated Evidence | Readiness Note |
| --- | --- | --- | --- | --- |
| FE01 Public / Browse | Approved | Not started | Indirect via book routes only | Needs dedicated route tests |
| FE02 Authentication | Approved | Ready for review | `authRoutes.test.js`, `authUtils.test.js` | Best current coverage candidate |
| FE03 User Profile | Draft avatar revision | Draft/manual verify pending | `profileRoutes.test.js`, `profileService.test.js` | Needs manual avatar/profile UI evidence |
| FE04 Membership | Approved | Not started | None found | Needs plan/tasks/routes/tests |
| FE05 Book Management | Approved | Not started | Route exists, no dedicated test found | Prototype must be reconciled with spec |
| FE06 Inventory / Copy | Approved | Not started | Inventory report only | Needs copy management endpoints/tests confirmed |
| FE07 Borrowing | Approved | Ready for review | `borrowingRoutes.test.js`, `integration.test.js` | Needs coverage/edge audit in Week 11 |
| FE08 Reservation | Approved | Ready for review | `reservationRoutes.test.js`, `integration.test.js` | Needs queue/notification mapping check |
| FE09 Fine | Approved | Not started | `fineRoutes.test.js` | Prototype must be reconciled with spec |
| FE10 Notification | Approved | Ready for review | `notificationRoutes.test.js`, `integration.test.js` | Add inbox UI/manual/E2E evidence |
| FE11 User & Role | Approved | Not started | `userManagementRoutes.test.js` | Needs role/audit edge reconciliation |
| FE12 Reporting | Approved | Ready for review | `reportRoutes.test.js` | Add frontend/manual report evidence |

---

## 6. Agent Test Generation Protocol

### 6.1 Pattern #07 - Test Generation Prompt

Use this prompt pattern when generating tests:

```text
Write tests for [function/module/API endpoint].

Context:
- Feature: [FE## feature name]
- Source spec: .sdd/specs/feat-{name}/SPEC.md
- Module under test: [package/file]
- Test type: [unit / integration / e2e]
- Coverage target: 80% minimum

Include:
1. Happy path.
2. Error cases from the spec.
3. Edge cases with null/undefined/empty values.
4. Boundary values.
5. Security cases where relevant: auth bypass, role bypass, injection, data exposure.

Do not invent business rules that are not in SPEC.md.
Map each important test to a business rule or acceptance criterion where practical.
```

### 6.2 Template Test Writing

Use this short template before writing or reviewing a test file:

```text
Module to test: [package/file]
Test type: [unit / integration / e2e]
Coverage target: 80% minimum

Test strategy:
- Happy path: [main success scenarios]
- Error cases: [from SPEC Unwanted patterns]
- Boundary values: [edge cases from spec]
- Concurrent scenarios: [if relevant]

Test structure:
- File location: [project test path]
- Naming: [behavior/scenario/expected result]
- Helpers: reuse existing test helpers; do not duplicate setup

Project security extension:
- Security: [auth bypass, role bypass, injection, data exposure]

Spec links:
- Feature: [FE##]
- Business rules: [BR/FR IDs]
- Acceptance criteria: [AC IDs]
```

### 6.3 Spec Compliance Check / Pattern #05

Before accepting generated tests, check:

1. Did the test read from `SPEC.md`, not only from existing code?
2. Does every important acceptance criterion have test evidence or a documented manual check?
3. Does the test include both happy and error paths?
4. Are edge and boundary cases included where relevant?
5. Does the test assert meaningful outcomes instead of only checking status codes?
6. Does the test avoid hardcoded secrets and real personal data?
7. Does the test avoid weakening or deleting existing tests?
8. If code and spec disagree, was the mismatch reported instead of hidden?

### 6.4 Human Review Requirement

Generated tests are drafts until a human reviewer checks them.

Human review must look for:

- missing business rules;
- incorrect assumptions;
- weak assertions;
- over-mocking that hides integration failures;
- tests that simply mirror the implementation bug;
- missing security and permission scenarios;
- missing cleanup or deterministic dates.

---

## 7. Pre-Commit Checklist

Use this checklist before committing or opening a PR.

| # | Area | Book Checklist Item | Project Evidence |
| --- | --- | --- | --- |
| 01 | CODE | Code runs locally with no compile/syntax errors | Backend test/start or frontend build succeeds |
| 02 | CODE | No leftover `console.log`, `print`, or debug statements | Manual grep/review before PR |
| 03 | CODE | No unresolved `TODO` / `FIXME` comments in merged code | Manual grep/review before PR |
| 04 | CODE | Code follows naming conventions in `AGENTS.md` | Reviewer checks naming and style |
| 05 | CODE | No `any` type in TypeScript if TypeScript is used | Not currently applicable unless TS is added |
| 06 | TEST | All existing tests still pass after the change | `npm.cmd --prefix backend test` |
| 07 | TEST | Unit tests are written for new business logic | Each service/business function has at least one meaningful test |
| 08 | TEST | Test coverage does not decrease from baseline | Coverage report once baseline is enabled |
| 09 | SEC | No secrets, API keys, or passwords in code | Manual review / secret scan |
| 10 | SEC | Input validation is implemented for all new endpoints | Backend validation/schema/controller checks |
| 11 | SEC | SQL injection cannot happen; use ORM or parameterized queries | Review Sequelize/query usage |
| 12 | SPEC | Code implements the acceptance criteria in the spec | Check every related AC in `SPEC.md` |
| 13 | SPEC | No feature creep outside the spec scope | Compare diff with approved `SPEC.md` / `TASKS.md` |
| 14 | DOC | API documentation is updated for new/changed endpoints | `docs/api/api-contract.md` or OpenAPI/Swagger when used |
| 15 | PERF | No N+1 queries; ORM queries are optimized when needed | Review includes/eager loading and route query count |

Recommended local commands:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/check-traceability.js
```

Do not merge if any required command fails unless the team lead explicitly accepts and documents the reason.

---

## 8. Milestones

| Milestone | Target Evidence | Status |
| --- | --- | --- |
| Week 6: Auth `>=80%` coverage | Auth unit/integration tests pass and coverage target is checked | Pending formal coverage threshold |
| Week 10: All core features pass acceptance tests | Each implemented core feature has acceptance test evidence mapped to `SPEC.md` | In progress |
| Week 11: `>=80%` coverage verified | Coverage report generated; Test Engine fills gaps | Pending |
| Week 12: Security clean | No Critical/High vulnerabilities; dependency audit complete | Pending |

---

## 9. Validation Gate B6

Before merge, validate with four evidence layers:

| Layer | Book Meaning | Project Evidence | Required Result |
| --- | --- | --- | --- |
| L1 Automated checks | Unit tests, linting, type/build checks | Backend tests, frontend lint/build, traceability check | Block merge if required checks fail |
| L2 Spec compliance | Every required behavior has code and trace/evidence | `SPEC.md` acceptance criteria checked against implementation | Task is not done if AC coverage is missing |
| L3 Constitution | Security, architecture, CI, and coding standards | Safety constraints, stack rules, no secrets, RBAC, CI expectations | Block merge or escalate if violated |
| L4 Acceptance | Acceptance criteria from spec are demonstrated | Manual test, API evidence, screenshot/demo where relevant | Return to implementation if acceptance evidence fails |

Core principle:

```text
A task is not done because someone says it is done.
A task is done when tests are green and the spec checklist is complete.
```

---

## 10. Maintenance Rules

Update this file when:

- the team changes coverage policy;
- a new test level/tool is added;
- CI starts enforcing coverage thresholds;
- a feature adds new endpoints or critical flows;
- the Week 11 or Week 12 plan changes;
- the Test Engine rotation is assigned.

Keep `docs/testing/master-test-plan.md` as a companion explanation document, but keep `.sdd/test-plan.md` as the canonical policy.




