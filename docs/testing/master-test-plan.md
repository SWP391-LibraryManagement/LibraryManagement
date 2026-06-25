# Master Test Plan - Library Management System

Version: 0.2.0

Status: DRAFT - pending team review

Last Updated: 2026-06-22

> Canonical policy note: the authoritative test policy for this project now lives in `D:\SWP391\library-management-system\.sdd\test-plan.md`. This document remains an extended testing reference and should not contradict the canonical `.sdd/test-plan.md`.
---

## 1. Purpose

This document defines the project-level testing plan for the SWP391 Library Management System.

It applies the testing and validation guidance from the Spec-Driven and Agent-Driven Development playbook to this repository:

- specs define intended behavior;
- acceptance criteria become testable evidence;
- tasks are only done when they are verifiable;
- implementation and tests are generated or updated together;
- validation checks code against spec before merge;
- CI checks automation, while humans verify spec compliance and demo evidence.

This document is the extended testing reference. The canonical project testing policy lives in `.sdd/test-plan.md`. It does not replace feature-level `SPEC.md`, `PLAN.md`, `TASKS.md`, or `CHANGELOG.md` files.

---

## 2. Playbook Alignment

The playbook does not require a file with the exact name `master-test-plan.md`, but it repeatedly requires the following test/validation behaviors. This document is the project artifact that makes those behaviors explicit.

| Playbook Guidance | Project Rule In This Plan |
| --- | --- |
| Acceptance criteria should be testable. | Every new or changed AC should map to at least one automated or manual test evidence item. |
| TASKS.md items must be verifiable. | Each implementation task should include done criteria and expected tests. |
| Implementation should generate/update tests at the same time. | Code PRs should include related tests unless a documented exception exists. |
| Validation compares spec, code, and tests. | Use the consistency matrix in section 9 before merge. |
| Validation Gate has automated checks plus spec compliance plus acceptance demo. | Use the four-layer merge gate in section 10. |
| Tests passing alone is not enough. | CI pass is required but not sufficient; reviewers must check scope and spec compliance. |
| Code change without required spec sync-back is technical debt. | Behavior changes must update the related spec/changelog/tasks. |

---

## 3. Authoritative Source Documents

Testing must follow these repository artifacts:

- `D:\SWP391\library-management-system\.sdd\constitution.md`
- `D:\SWP391\library-management-system\.sdd\shared_context.md`
- `D:\SWP391\library-management-system\.sdd\constraints\global.md`
- `D:\SWP391\library-management-system\.sdd\constraints\business.md`
- `D:\SWP391\library-management-system\.sdd\constraints\safety.md`
- `D:\SWP391\library-management-system\.agents\AGENTS.md`
- `D:\SWP391\library-management-system\.agents\CLAUDE.md`
- `D:\SWP391\library-management-system\.sdd\specs\feat-{name}\SPEC.md`
- `D:\SWP391\library-management-system\.sdd\specs\feat-{name}\PLAN.md`
- `D:\SWP391\library-management-system\.sdd\specs\feat-{name}\TASKS.md`
- `D:\SWP391\library-management-system\.sdd\specs\feat-{name}\CHANGELOG.md`

When code and spec disagree, the project rules treat the spec as the source of truth unless the spec is updated and reviewed.

---

## 4. Test Scope

### 4.1 In Scope

This master plan covers Phase 1 feature testing:

| Feature ID | Feature Name | Risk Notes |
| --- | --- | --- |
| FE01 | Public / Browse | Public search/display correctness |
| FE02 | Authentication | Security-critical |
| FE03 | User Profile | Personal data handling |
| FE04 | Membership Management | Borrowing eligibility dependency |
| FE05 | Book Management | Catalog data integrity |
| FE06 | Inventory / Book Copy Management | Availability and copy status dependency |
| FE07 | Borrowing Management | Core business rules |
| FE08 | Reservation Management | Queue and eligibility rules |
| FE09 | Fine Management | Money/fine calculation rules |
| FE10 | Notification Management | Safe notification payloads and email channel |
| FE11 | User & Role Management | Authorization-critical |
| FE12 | Reporting & Statistics | Aggregate correctness and privacy |

### 4.2 Out Of Scope For This Draft

The following are not fully implemented in the repository yet and are tracked as gaps:

- enforced coverage threshold in CI;
- browser E2E automation;
- frontend component tests;
- production-like SQL Server test database;
- performance/load testing;
- penetration testing;
- mutation testing automation.

These are future hardening items, not excuses to merge broken or untested core behavior.

---

## 5. Target Testing Requirements

The target state follows the playbook's capstone-style testing expectations, adapted to this Node.js + Express + React + SQL Server project.

### 5.1 Universal Rules

- Existing tests must pass before merge.
- No test may be skipped, weakened, or deleted just to make a PR pass.
- Core business rules must have automated tests.
- Every protected endpoint must have authentication and authorization checks.
- Happy paths, error paths, boundary values, and important edge cases must be covered.
- Tests must not use real secrets, production credentials, or real personal data.
- Date-sensitive tests must use fixed clocks or deterministic dates.
- Tests should be traceable to feature IDs and spec acceptance criteria.

### 5.2 Backend Target

- Unit tests for service/business logic functions.
- Integration/API tests for REST endpoints, including happy path and key error paths.
- Cross-feature integration tests when one feature triggers or depends on another feature.
- Coverage target: at least 80 percent for new code once coverage tooling is enabled.
- SQL Server test DB should be considered for later high-fidelity integration tests. Current in-memory tests are acceptable for fast Phase 1 feedback but are not a complete replacement for DB-backed integration testing.

### 5.3 Frontend Target

- Lint and build must pass.
- Manual UI checks are required for each user-facing PR.
- Complex hooks/utilities should have automated tests after frontend test tooling is agreed.
- Critical user-facing flows should later have E2E tests.

### 5.4 Safety Target

- No secrets in tests, fixtures, screenshots, logs, or commits.
- Error responses must not expose stack traces to clients.
- Authorization rules must be tested on the server side.
- Notification tests must verify safe payload behavior for sensitive data.

---

## 6. Test Planning Workflow Per Feature

For each feature or meaningful change, testing should follow the same SDD flow.

### Step 1 - SPEC.md Defines Testable Behavior

Before coding, confirm the related `SPEC.md` contains:

- business rules with stable IDs;
- functional requirements;
- acceptance criteria;
- unwanted/error patterns;
- edge cases;
- out-of-scope items;
- traceability matrix.

If an expected behavior is not in the spec, update the spec first or document that the change is out of scope.

### Step 2 - PLAN.md Includes Test Strategy

Each active feature `PLAN.md` should state:

- which unit tests are needed;
- which API/integration tests are needed;
- which manual UI checks are needed;
- important risks and edge cases;
- test data requirements;
- dependencies or mocks/test doubles.

### Step 3 - TASKS.md Makes Work Verifiable

Each implementation task should include:

- task ID;
- files to change;
- spec references;
- dependencies;
- done criteria;
- expected tests or manual verification.

A task is too vague if the reviewer cannot tell what test proves it is done.

### Step 4 - Implement Code And Tests Together

Implementation PRs should include code and tests together when behavior changes.

Expected test design:

- happy path tests;
- error/unwanted pattern tests;
- boundary value tests;
- role/permission tests;
- cross-feature tests when applicable.

### Step 5 - Validate Spec Against Code And Tests

Before merge, run the Validation Gate in section 10 and record evidence in the PR.

---

## 7. Test Design Standards

### 7.1 Naming

Test names should describe behavior, not implementation details.

Preferred patterns:

```text
<actor/action> <condition> <expected result>
```

Examples:

```text
member creates a pending request only for available unique copies
librarian approves request and member sees only own history
rejects missing template variables and redacts password reset token data
```

### 7.2 BDD / Given-When-Then Style

For manual tests, E2E tests, or complex integration tests, use Given-When-Then thinking:

```text
Given an approved member
When the member requests an available copy
Then the system creates a pending borrow request
```

This mirrors the playbook idea that acceptance criteria should be directly testable.

### 7.3 Required Scenario Types

For each non-trivial feature, include relevant scenarios from this list:

| Scenario Type | Required When |
| --- | --- |
| Happy path | Always for implemented behavior |
| Validation error | User input can be invalid |
| Authorization error | Endpoint/action is protected |
| Boundary value | Limits, dates, amounts, counts, or lengths exist |
| State transition | Entity has statuses such as pending/approved/returned |
| Cross-feature | Feature triggers notification, fine, report, inventory, or auth behavior |
| Out-of-scope guard | There is risk of feature creep or unauthorized behavior |
| Regression test | Bug fix changes behavior |

---

## 8. Test Levels

| Level | Purpose | Current Location | Current Status |
| --- | --- | --- | --- |
| Unit tests | Verify utility/service logic | `backend/tests/*.test.js` | Present for selected modules |
| API/route tests | Verify REST endpoints and role checks | `backend/tests/*Routes.test.js` | Present for several backend features |
| Cross-feature integration tests | Verify feature-to-feature flows | `backend/tests/integration.test.js` | Present |
| Frontend lint/build checks | Verify frontend code quality and build | `frontend/` via CI | Present |
| Manual UI tests | Verify UI behavior visually | Section 14 of this document | Required for UI changes |
| Contract/API tests | Verify API contract compatibility | Not formalized yet | Gap |
| E2E tests | Verify browser-level user flows | Not created yet | Future |
| Mutation/adversarial tests | Challenge test suite quality | Not created yet | Future |

---

## 9. Consistency Matrix

Before merging feature work, reviewers should check artifact consistency.

| Check | Question | Evidence |
| --- | --- | --- |
| SPEC vs PLAN | Does the plan implement the approved requirements? | Related `PLAN.md` sections |
| SPEC vs TASKS | Does every implementation task reference the spec? | Related `TASKS.md` rows |
| SPEC vs CODE | Does code implement the required behavior and avoid out-of-scope behavior? | Diff review and source files |
| SPEC vs TESTS | Does each acceptance criterion have automated or manual test evidence? | Test files and manual checklist |
| PLAN vs TASKS | Does each planned component have tasks? | `PLAN.md` and `TASKS.md` comparison |
| PLAN vs CODE | Does code follow the chosen architecture? | Source file structure and dependencies |
| CODE vs TESTS | Do tests verify behavior rather than implementation accidents? | Test review and test run result |

Minimum rule:

```text
No orphan code. No orphan spec requirement. No orphan test.
```

Meaning:

- code should trace back to an approved spec/task;
- spec requirements should trace forward to code/tests or a documented pending status;
- tests should trace back to expected behavior, not accidental implementation.

---

## 10. Validation Gate Before Merge

Validation Gate starts when implementation is claimed to be done. It is not optional.

### L1 - Automated Checks

- [ ] Backend tests pass.
- [ ] Frontend lint passes.
- [ ] Frontend build passes.
- [ ] CI passes.
- [ ] No test is skipped without documented approval.
- [ ] No existing test is weakened to make the PR pass.

Commands:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/check-traceability.js
```

### L2 - Spec Compliance

- [ ] Related `SPEC.md` was read.
- [ ] Related `PLAN.md` and `TASKS.md` were checked.
- [ ] Implementation matches approved scope.
- [ ] Out-of-scope behavior was not added.
- [ ] Acceptance criteria are satisfied.
- [ ] Error/unwanted patterns are handled.
- [ ] Behavior changes update spec/changelog/task docs.

### L3 - Constitution And Safety Compliance

- [ ] No secrets, tokens, credentials, or real personal data are committed.
- [ ] Server-side input validation is preserved.
- [ ] Role-based access is enforced on the backend.
- [ ] Internal stack traces are not exposed to users.
- [ ] Approved stack remains unchanged unless an RFC/spec update exists.
- [ ] Dependencies were not added without justification.

### L4 - Acceptance Criteria Demo

- [ ] Core user flow is demonstrated or manually verified.
- [ ] UI changes are checked in browser.
- [ ] Manual checklist evidence is recorded when automated tests do not cover the UI.
- [ ] Remaining test gaps are listed in PR notes or follow-up tasks.

Do not merge with the explanation "mostly done". A feature can be marked complete only when the required gate evidence exists or gaps are explicitly accepted by the team lead.

---

## 11. Current Automated Test Inventory

Current backend automated test files:

| Test File | Main Coverage |
| --- | --- |
| `backend/tests/app.test.js` | App foundation and health behavior |
| `backend/tests/authRoutes.test.js` | FE02 authentication API flows |
| `backend/tests/authUtils.test.js` | FE02 authentication utility logic |
| `backend/tests/borrowingRoutes.test.js` | FE07 borrowing API and business rules |
| `backend/tests/fineRoutes.test.js` | FE09 fine API and business rules |
| `backend/tests/integration.test.js` | Cross-feature FE02/FE07/FE08/FE09/FE10/FE12 flows |
| `backend/tests/models.test.js` | Backend model-level checks |
| `backend/tests/notificationRoutes.test.js` | FE10 notification API and safety behavior |
| `backend/tests/profileRoutes.test.js` | FE03 user profile API behavior |
| `backend/tests/profileService.test.js` | FE03 profile service behavior |
| `backend/tests/reportRoutes.test.js` | FE12 reports API and aggregates |
| `backend/tests/reservationRoutes.test.js` | FE08 reservation API and business rules |
| `backend/tests/userManagementRoutes.test.js` | FE11 user and role management API behavior |

---

## 12. Feature Coverage Matrix

| Feature | Automated Backend Tests | Frontend / Manual Evidence | Status |
| --- | --- | --- | --- |
| FE01 Public / Browse | Not identified yet | Manual UI/API check needed | Gap |
| FE02 Authentication | `authRoutes.test.js`, `authUtils.test.js`, `integration.test.js` | Login/register/reset UI manual check | Backend covered; UI evidence needed |
| FE03 User Profile | `profileRoutes.test.js`, `profileService.test.js` | Profile UI manual check | Backend covered; UI evidence needed |
| FE04 Membership Management | Not identified yet | Manual UI/API check needed | Gap |
| FE05 Book Management | Not identified yet | Manual UI/API check needed | Gap |
| FE06 Inventory / Book Copy | Not identified yet | Inventory UI manual check needed | Gap |
| FE07 Borrowing Management | `borrowingRoutes.test.js`, `integration.test.js` | Borrowing UI manual check | Backend covered; UI evidence needed |
| FE08 Reservation Management | `reservationRoutes.test.js`, `integration.test.js` | Reservation UI manual check | Backend covered; UI evidence needed |
| FE09 Fine Management | `fineRoutes.test.js`, `integration.test.js` | Fine flow manual check | Backend covered; UI evidence needed |
| FE10 Notification Management | `notificationRoutes.test.js`, `integration.test.js` | Inbox UI out of Phase 1 scope unless spec changes | Backend covered |
| FE11 User & Role Management | `userManagementRoutes.test.js` | User/role UI manual check if implemented | Backend covered |
| FE12 Reporting & Statistics | `reportRoutes.test.js`, `integration.test.js` | Reporting UI manual check | Backend covered; UI evidence needed |

---

## 13. Standard Commands

Run all backend tests:

```powershell
npm.cmd --prefix backend test
```

Run only integration tests:

```powershell
npm.cmd --prefix backend test -- integration
```

Run frontend lint:

```powershell
npm.cmd --prefix frontend run lint
```

Build frontend:

```powershell
npm.cmd --prefix frontend run build
```

Run traceability report:

```powershell
node scripts/check-traceability.js
```

---

## 14. Manual UI Test Checklist

Use this checklist for UI changes before merge.

### 14.1 General UI

- [ ] Page loads without console-breaking errors.
- [ ] Layout is readable on desktop.
- [ ] Main actions are visible and understandable.
- [ ] Buttons and links have clear labels.
- [ ] Empty, loading, and error states are handled.
- [ ] Forms preserve user input where appropriate.
- [ ] Success and error messages are understandable.

### 14.2 Accessibility Basics

- [ ] Inputs have labels.
- [ ] Keyboard navigation works for main controls.
- [ ] Focus states are visible.
- [ ] Color contrast is acceptable.
- [ ] Tables have readable headers.
- [ ] Icons are not the only way to understand an action.

### 14.3 FE07 Borrowing UI

- [ ] Borrow request list displays correctly.
- [ ] Status badges are clear.
- [ ] Create, approve, reject, and return flows show correct feedback.
- [ ] Unauthorized users cannot access staff-only actions.

### 14.4 FE08 Reservation UI

- [ ] Reservation list displays correctly.
- [ ] Queue/status information is readable.
- [ ] Cancel/process actions show correct feedback.
- [ ] Error states are handled.

### 14.5 FE12 Reporting UI

- [ ] Report filters work.
- [ ] Summary cards and tables display correctly.
- [ ] Empty report data does not break layout.
- [ ] Export/refresh actions, if present, behave correctly.

---

## 15. Test Data Strategy

Automated tests should use deterministic test data:

- in-memory repositories for fast backend route/service tests;
- fake users with `example.test` or `example.com` style addresses;
- no real student, librarian, or production data;
- no real SMTP/database credentials;
- fixed clocks where date-sensitive logic is tested;
- small focused fixtures instead of large opaque data dumps.

Known limitation:

- In-memory tests are fast and useful, but they do not fully prove SQL Server schema/query behavior. Add DB-backed integration tests later when the test database setup is agreed.

---

## 16. Sync-Back Rule

If implementation changes behavior in a way that affects specs, update the spec artifacts before or with the code change.

Sync-back is required when:

- a hotfix changes error behavior;
- a refactor changes data shape or API response shape;
- a security patch changes auth flow;
- a UI/API change adds behavior not described in the spec;
- a test reveals that the spec is ambiguous or wrong.

Required updated files may include:

- related `SPEC.md`;
- related `PLAN.md`;
- related `TASKS.md`;
- related `CHANGELOG.md`;
- this master test plan if project-wide test policy changes.

---

## 17. Defect Reporting

When a bug is found, record:

- feature ID;
- expected behavior from `SPEC.md`;
- actual behavior;
- reproduction steps;
- severity;
- affected files/screens;
- test case added or manual verification performed;
- linked PR/commit.

Severity levels:

| Severity | Meaning |
| --- | --- |
| Critical | Security issue, data loss, or system unusable |
| High | Core business flow broken |
| Medium | Important workflow degraded |
| Low | Cosmetic or minor issue |

Bug fix rule:

- Identify root cause first.
- Add or update a regression test when feasible.
- Run the affected test suite and full backend test suite before merge.

---

## 18. Current CI Gate

The current CI workflow is:

`D:\SWP391\library-management-system\.github\workflows\ci.yml`

Current CI checks:

- install root dependencies;
- run spec traceability report;
- install backend dependencies;
- install frontend dependencies;
- run backend tests;
- run frontend lint;
- build frontend;
- run backend health import check.

CI passing does not replace human review. CI verifies automated conditions; reviewers still verify scope, spec compliance, and acceptance criteria evidence.

---

## 19. Known Gaps And Follow-Up Tasks

| Gap | Why It Matters | Recommended Action |
| --- | --- | --- |
| No enforced coverage threshold yet | Playbook target is measurable coverage for business logic | Add Jest coverage script and agree threshold |
| No frontend automated tests yet | UI regressions can slip through manual-only checks | Add React component or E2E tests for critical flows |
| No E2E framework yet | Critical user flows are not browser-verified automatically | Evaluate Playwright for login, borrowing, reservation, reporting |
| No SQL Server test DB path yet | In-memory tests do not catch schema/query issues | Add DB-backed integration test plan after DB setup stabilizes |
| Some features have no identified backend tests | Feature coverage is uneven | Add tests or mark pending with owner and reason |
| Not all feature `PLAN.md` files include a test strategy | PLAN.md should include test strategy before implementation | Update active feature plans during next SDD documentation pass |
| Manual UI evidence is not stored per release | Review evidence can disappear in chat/PR comments | Add release or PR test evidence notes under `docs/testing/` |
| Contract/API testing is not formalized | Frontend/backend integration can drift | Add OpenAPI/API contract checks when API contract stabilizes |

---

## 20. Definition Of Done For Testing

A feature or PR is test-ready when:

- related spec, plan, and tasks are identified;
- implementation scope matches approved spec;
- automated tests are added or updated for backend business behavior;
- protected actions have auth/role coverage;
- manual UI checks are completed for user-facing changes;
- all existing automated tests pass;
- CI passes;
- no secrets are committed;
- reviewer verifies spec compliance;
- remaining test gaps are documented with owner or follow-up task.

A feature is not done just because tests are green. It is done when tests are green and the spec checklist is satisfied.


