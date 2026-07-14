# TEST PLAN - Library Management System

Version: 0.2.0

Status: APPROVED

Last Updated: 2026-06-25

Canonical Location: `.sdd/test-plan.md`

---

## 0. Purpose And Source Of Truth

This document is the **master (project-level) test plan** for the SWP391 Library Management System.
It follows the Spec-Driven & Agent-Driven Development playbook:

- tests belong to the SHELL workstream and are generated from specs + acceptance criteria;
- agents may draft tests, but humans review gaps;
- a task is **not** done because someone says so — it is done when tests are green and the spec
  checklist is complete (playbook ch.13.3);
- coverage and security gates are planned explicitly in the roadmap (playbook ch.14).

### 0.1 Two-Tier Structure (master vs per-feature)

Testing is organized in two tiers, mirroring the playbook:

| Tier | Where it lives | What it owns |
| ---- | -------------- | ------------ |
| **Per-feature (detail)** | each feature `SPEC.md` §8 Acceptance Criteria + §16 Traceability Matrix, and `.sdd/specs/feat-{name}/TEST_PLAN.md` | the concrete test targets and the AC↔FR↔test mapping for that feature |
| **Project (control)** | this file + `scripts/check-traceability.js` + CI `ci.yml` | coverage policy, test levels/pyramid, schedule, Validation Gate, Consistency Gate, milestones |

### 0.2 Source of Truth — no duplication

To avoid Spec-Code-Test drift (playbook ch.7.3), there is exactly one home for each kind of fact:

- The **list of test cases per requirement** lives in each feature `SPEC.md` §16 Traceability Matrix
  (`AC-* / FR-* → test`). This is authoritative.
- The **per-feature test strategy** (scope, unit/API/E2E targets, evidence, gaps) lives in that
  feature's `TEST_PLAN.md`.
- This master file **does not re-list per-feature test cases**. It only holds the cross-feature
  policy and a pointer table (§5). When master and a feature document disagree, fix both together
  through review.

### 0.3 Per-Feature Test Plan Files

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

Rule: when a feature `SPEC.md`, `PLAN.md`, or `TASKS.md` changes, update that feature's `TEST_PLAN.md`
(and, if test cases change, the SPEC §16 Traceability Matrix) in the **same PR**.

---

## 1. Coverage Target

### 1.1 Minimum Coverage Rule

- Minimum coverage: `>=80%` for all new backend code (playbook ch.14 Testing Sprint, constitution Article 5).
- Required: unit tests for all service/business-logic functions.
- Required: integration tests for all API endpoints — happy path and error path.
- E2E tests: required for the selected critical flow; `tests/e2e/system-golden-path.spec.js` covers the FE02/FE07/FE09/FE12 hybrid journey.
- No merge if existing tests break.

### 1.2 Project-Specific Coverage Scope

Coverage applies first to backend business logic (the backend owns the core rules): authentication
and authorization, borrowing eligibility, book/copy availability, reservation queue, return flow,
fine calculation, notification triggers, reporting aggregation, input validation and permission checks.

Frontend coverage is not yet enforced by component tests. Until frontend test tooling is added, every
frontend PR must at minimum pass lint/build and include manual UI verification notes.

### 1.3 Current Coverage Status (2026-07-14)

- Backend Jest tests: `npm --prefix backend test` -> **307 tests / 24 suites passing**.
- Completed-module coverage: statements **93.02%**, branches **83.22%**, functions **96.37%**, lines **92.94%**.
- Jest enforces a global 80 percent threshold for all four metrics through `npm --prefix backend run test:coverage:ci` and CI.
- Frontend: **38 tests passing**; `npm --prefix frontend run lint` and `npm --prefix frontend run build` pass.
- Traceability gate: `npm run trace:enforce` (min 70% FR `@spec` coverage for implemented features) —
  **enforced in CI** (`.github/workflows/ci.yml`). Six implemented features are at 100%.
- SQL Server shared-state integration is available through the mutation-gated local `test:sql:system` suite.
- Browser E2E is enabled through Playwright Chromium and runs in CI.

---

## 2. Test Strategy

### 2.1 Position In The Hybrid Framework

```text
Spec -> Agent generates tests -> Human reviews gaps -> Tests run green -> Spec checklist complete
```

Trust evidence (green tests, passing checks, completed spec checklist), not a "done" claim.

### 2.2 Test Pyramid (target shape)

The suite should be pyramid-shaped: a broad base of fast unit tests, fewer integration tests, and a
small number of E2E flows.

```text
        /\        E2E / manual — few, critical journeys only (login, borrow→return, fine pay)
       /　 \       Integration/API — every endpoint, happy + error path
      /____\      Unit — every service/business rule, edge + boundary (the broad base)
```

| Test Level | Purpose | Required For | Location |
| --- | --- | --- | --- |
| Unit | Verify one service/function/business rule in isolation | All service/business-logic functions | `backend/tests/*.test.js` (in-memory repository doubles) |
| Integration/API | Verify REST endpoints, auth, validation, data effects | Every implemented API endpoint | `backend/tests/*Routes.test.js`, `backend/tests/integration.test.js` |
| E2E | Verify critical browser-level flows | Critical journeys | Present: `tests/e2e/system-golden-path.spec.js` |
| Manual UI | Verify layout/responsive/visible states | Every UI-facing change | PR checklist / screenshots |
| Security/Dependency | No Critical/High vulns, no unsafe dependency drift | Week 12 + before release | `npm audit`, code review, RBAC checks |

### 2.3 Decision Matrix

| Task Type | Spec Depth | Agent Autonomy | Human Responsibility |
| --- | --- | --- | --- |
| Unit tests | Direct code/spec context | Agentic ADD | Review missing business/edge cases |
| Integration tests | Light spec | Agentic ADD | Confirm endpoint contracts, auth, data setup |
| E2E tests | Light spec | Guided | Select critical flows, verify UI behavior |
| Security tests/audit | Safety constraints + endpoint list | Guided | Confirm real risk coverage, approve fixes |

### 2.4 Standard Test Design

Every meaningful test set includes: happy path; error cases (invalid input, missing data,
unauthorized/forbidden, not found); edge cases (`null`/`undefined`/empty); boundary values (borrow
limit, due-date boundary, fine-amount boundary, pagination); and security checks (auth/role bypass,
injection input, sensitive-data exposure).

---

## 3. Test Schedule

| Phase / Week | Focus | Expected Output |
| --- | --- | --- |
| Week 6 | Authentication quality gate | Auth `>=80%` coverage; login/register/reset/middleware tests pass |
| Week 10 | Core feature acceptance | All core features pass acceptance tests mapped to `SPEC.md` |
| Week 11 | Testing Sprint | Unit tests for all business logic; integration tests for all endpoints; coverage report reaches `>=80%` |
| Week 12 | Security Audit | Full security audit; Critical/High vulns fixed; dependency audit done |
| Every sprint | Regression protection | Existing tests pass before merge; no coverage decrease after baseline |

Week 11–12 is a quality sprint, not a new-feature sprint.

### 3.1 Week 11 Testing Sprint
List every service function and endpoint → generate/write unit + integration tests (happy + error)
→ run coverage report → Test Engine reviews low-coverage areas and missing acceptance criteria →
fill gaps until the target is met or exceptions are documented.

### 3.2 Week 12 Security Audit
Dependency audit (backend + frontend) → review server-side RBAC on protected endpoints → validate
every user-controlled input boundary → ensure no stack traces leak to clients → ensure
tests/fixtures contain no secrets/real personal data → fix all Critical/High vulns → document any
accepted Medium/Low risk with reason and owner.

---

## 4. Test Engine Role

Each sprint assigns one **Test Engine** who coordinates agent-assisted test writing and controls
coverage quality (target: `>=80%` before merge, or a documented reviewed exception). Responsibilities:
maintain this file; check that feature `SPEC.md`/`PLAN.md`/`TASKS.md` carry testable requirements;
ask agents/teammates to generate missing tests from specs; review drafts for weak assertions and
false confidence; ensure existing tests pass and coverage does not regress; verify integration tests
cover happy + error paths; record manual UI evidence; run the Week 11/12 sprints. The role rotates
each sprint (record below).

| Sprint | Test Engine | Backup | Notes |
| --- | --- | --- | --- |
| Sprint 1 | TBD | TBD | Foundation and auth tests |
| Sprint 2 | TBD | TBD | Core circulation features |
| Sprint 3 | TBD | TBD | Reports, notification, integration tests |
| Sprint 4 | TBD | TBD | Testing sprint / security audit |

---

## 5. Per-Feature Pointers (no duplication)

Detailed test targets for each feature live in that feature's `TEST_PLAN.md` (§0.3) and the AC↔test
mapping lives in each `SPEC.md` §16. This section only keeps the one-line policy matrix and the
readiness summary; it intentionally does **not** restate per-feature test cases.

### 5.1 Universal Rule Per Feature

- Unit: each service/business-logic function needs at least one meaningful test.
- Integration: each API endpoint needs happy-path and error-path tests.
- E2E: critical user flows when E2E tooling exists.
- Manual UI: every changed screen checked for loading/empty/success/error/permission states.
- Traceability: every `AC-*` should map to a test in `SPEC.md` §16; every `FR-*` implemented should
  carry an `@spec` tag (checked by `scripts/check-traceability.js`).

### 5.2 Feature Matrix (one line each)

| Feature | Unit Requirement | Integration/API Requirement | E2E / Manual Critical Flow |
| --- | --- | --- | --- |
| FE01 Public / Browse | Search/filter/sort helpers if added | Public browse/search/detail happy + invalid query | Guest searches and views detail |
| FE02 Authentication | Hashing, token, validation, reset logic | Register/login/logout/forgot/reset/me happy + error + auth failure | Register, login, reset password |
| FE03 User Profile | Profile validation and update rules | Profile read/update/change-password happy + forbidden/error | Member updates profile safely |
| FE04 Membership | Eligibility/status rules | Apply/approve/reject/status happy + role errors | Member applies; staff approves |
| FE05 Book Management | Book validation/catalog rules | CRUD/search happy + validation + forbidden | Librarian creates/updates book |
| FE06 Inventory / Copy | Copy status/availability rules | Copy CRUD/status happy + conflict/error | Librarian manages copies |
| FE07 Borrowing | Eligibility, limit, availability, return rules | Request/approve/return/history happy + error | Borrow → approve → return |
| FE08 Reservation | Queue and cancellation rules | Reserve/cancel/queue happy + unavailable/error | Member reserves unavailable book |
| FE09 Fine | Fine calculation and payment-status rules | Calculate/collect/paid/list happy + error | Librarian records fine payment |
| FE10 Notification | Template validation, safe payload, trigger rules | Notification/template happy + invalid/forbidden | User sees notification inbox |
| FE11 User & Role | Role assignment and permission rules | User/role happy + forbidden + invalid role | Admin changes user role |
| FE12 Reporting | Aggregation and date-range rules | Report happy + invalid range + forbidden | Staff views reports |

### 5.3 Current Automated Test Inventory (backend, 2026-06-25)

| Test File | Main Coverage Area |
| --- | --- |
| `backend/tests/app.test.js` | App startup / basic route behavior |
| `backend/tests/authRoutes.test.js` | FE02 authentication endpoints |
| `backend/tests/authUtils.test.js` | FE02 authentication utility logic |
| `backend/tests/borrowingRoutes.test.js` | FE07 borrowing routes |
| `backend/tests/fineRoutes.test.js` | FE09 legacy prototype CRUD routes |
| `backend/tests/fineManagementRoutes.test.js` | FE09 server-side calculate/collect/paid/waive |
| `backend/tests/integration.test.js` | Cross-feature backend integration flow |
| `backend/tests/models.test.js` | Sequelize model definitions/associations |
| `backend/tests/notificationRoutes.test.js` | FE10 notification routes |
| `backend/tests/profileRoutes.test.js` | FE03 profile routes |
| `backend/tests/profileService.test.js` | FE03 profile service logic |
| `backend/tests/reportRoutes.test.js` | FE12 reporting routes |
| `backend/tests/reservationRoutes.test.js` | FE08 reservation routes |
| `backend/tests/userManagementRoutes.test.js` | FE11 user & role routes |

Remaining gaps (tracked in `TECH_DEBT.md`): broader frontend component tests; a disposable SQL Server
service in shared CI; dedicated `bookRoutes` tests for FE01/FE05; service-level tests for FE11
(TD-015); and full FE09 browser coverage after the legacy frontend is aligned to the server API.

### 5.4 Per-Feature Readiness Summary

| Feature | Spec | Plan/Tasks | Automated Evidence | FR `@spec` | Readiness Note |
| --- | --- | --- | --- | --- | --- |
| FE01 Public / Browse | Approved | Not started | Indirect via book routes | 0% | Needs dedicated route tests |
| FE02 Authentication | Approved | Ready for review | `authRoutes`, `authUtils` | 100% | Add API tests for duplicate email / weak password (TD-018) |
| FE03 User Profile | Draft (avatar) | Draft / manual verify | `profileRoutes`, `profileService` | 0% (tagging pending) | Record manual avatar UI evidence |
| FE04 Membership | Approved | Not started | None | 0% | Needs plan/tasks/routes/tests |
| FE05 Book Management | Approved | Not started | Route exists, no test | 0% | Reconcile prototype with spec |
| FE06 Inventory / Copy | Approved | Not started (deferred) | Inventory report only | 0% | TD-005 deferred |
| FE07 Borrowing | Approved | Ready for review | `borrowingRoutes`, `integration` | 100% | Edge/boundary audited; Week 11 coverage check |
| FE08 Reservation | Approved | Ready for review | `reservationRoutes`, `integration` | 100% | Queue/notification mapped to AC |
| FE09 Fine | Approved | Ready for review | `fineManagementRoutes` (+ legacy `fineRoutes`) | 100% | Server-side done (TD-001/002/003); frontend align = TD-004 |
| FE10 Notification | Approved | Ready for review | `notificationRoutes`, `integration` | 100% | Add inbox UI/manual/E2E evidence |
| FE11 User & Role | Approved | Not started | `userManagementRoutes` | 0% | Service tests missing (TD-015); RBAC/validation debt TD-012..014 |
| FE12 Reporting | Approved | Ready for review | `reportRoutes` | 100% | Add frontend/manual report evidence |

---

## 6. Agent Test Generation Protocol

### 6.1 Test Generation Prompt (Pattern #07)

```text
Write tests for [function/module/API endpoint].

Context:
- Feature: [FE## feature name]
- Source spec: .sdd/specs/feat-{name}/SPEC.md (use §8 Acceptance Criteria + §16 Traceability)
- Module under test: [package/file]
- Test type: [unit / integration / e2e]
- Coverage target: 80% minimum

Include: 1) happy path; 2) error cases from the spec; 3) edge cases (null/undefined/empty);
4) boundary values; 5) security cases where relevant (auth/role bypass, injection, data exposure).

Do not invent business rules not in SPEC.md. Map each important test to a BR/FR/AC where practical.
```

### 6.2 Spec Compliance Check (before accepting generated tests)

1. Did the test read from `SPEC.md`, not only from existing code?
2. Does every important acceptance criterion have test evidence or a documented manual check?
3. Both happy and error paths present?
4. Edge and boundary cases included where relevant?
5. Meaningful assertions, not only status codes?
6. No hardcoded secrets / real personal data?
7. No weakening or deleting of existing tests?
8. If code and spec disagree, was the mismatch reported (not hidden)?

### 6.3 Human Review Requirement

Generated tests are drafts until a human reviews for: missing business rules; wrong assumptions; weak
assertions; over-mocking that hides integration failures; tests that mirror an implementation bug;
missing security/permission scenarios; missing cleanup or deterministic dates.

---

## 7. Pre-Commit Checklist

| # | Area | Item | Project Evidence |
| --- | --- | --- | --- |
| 01 | CODE | Runs locally, no compile/syntax errors | Backend test/start or frontend build succeeds |
| 02 | CODE | No leftover debug statements | Manual grep/review |
| 03 | CODE | No unresolved TODO/FIXME in merged code | Manual grep/review |
| 04 | CODE | Follows naming conventions in `AGENTS.md` | Reviewer check |
| 06 | TEST | All existing tests pass | `npm --prefix backend test` |
| 07 | TEST | Unit tests written for new business logic | Each service function has a meaningful test |
| 08 | TEST | Coverage does not decrease from baseline | Coverage report once baseline enabled |
| 09 | SEC | No secrets/keys/passwords in code | Manual review / secret scan |
| 10 | SEC | Input validation on all new endpoints | Validators/controllers |
| 11 | SEC | Parameterized queries (no injection) | Review Sequelize/raw SQL usage |
| 12 | SPEC | Implements the acceptance criteria | Check each related AC in `SPEC.md` |
| 13 | SPEC | No feature creep outside scope | Diff vs approved `SPEC.md`/`TASKS.md` |
| 14 | TRACE | New/changed FRs carry `@spec` tags | `npm run trace:enforce` passes |
| 15 | DOC | API docs updated for new/changed endpoints | SPEC §11 / OpenAPI when used |

Recommended local commands:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```

Do not merge if a required command fails unless the team lead documents an accepted exception.

---

## 8. Milestones

| Milestone | Target Evidence | Status |
| --- | --- | --- |
| Week 6: Auth `>=80%` coverage | Auth unit/integration tests pass; coverage checked | Pending formal coverage threshold |
| Week 10: Core features pass acceptance | Each implemented core feature has acceptance evidence mapped to `SPEC.md` | Ready for human staging acceptance (6 features) |
| Traceability gate enforced | CI runs `trace:enforce`; implemented features ≥70% | **Done (2026-06-25)** |
| Week 11: `>=80%` coverage verified | Coverage report generated; gaps filled | **Done (2026-07-14)** |
| Week 11: critical browser E2E | Playwright covers login -> borrow -> approve -> return -> fine -> report | **Done (2026-07-14)** |
| Week 12: Security clean | No Critical/High vulns; dependency audit complete | **Done (2026-07-14)** |

---

## 9. Validation Gate B6

Before merge, validate with four evidence layers (playbook ch.13.3):

| Layer | Meaning | Project Evidence | Required Result |
| --- | --- | --- | --- |
| L1 Automated | Unit tests, lint, build, traceability | `npm --prefix backend test`, frontend lint/build, `trace:enforce` | Block merge if a required check fails |
| L2 Spec compliance | Every required behavior has code + trace | `SPEC.md` AC checked vs implementation; `@spec` tags present | Task not done if AC/trace coverage missing |
| L3 Constitution | Security, architecture, CI, standards | Safety constraints, RBAC, no secrets, layer boundaries | Block/escalate if violated |
| L4 Acceptance | AC from spec demonstrated | Manual test, API evidence, screenshot/demo | Return to implementation if acceptance fails |

```text
A task is done when tests are green and the spec checklist is complete — not because someone says so.
```

---

## 10. Maintenance Rules

Update this file when: coverage policy changes; a new test level/tool is added; CI starts enforcing a
coverage threshold; a feature adds endpoints/critical flows; the Week 11/12 plan changes; or the Test
Engine rotation is assigned. Keep this file as the canonical **policy**; keep per-feature test detail
in each feature `TEST_PLAN.md` and per-requirement test mapping in each `SPEC.md` §16.
