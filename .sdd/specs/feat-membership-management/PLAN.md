# PLAN.md - FE04 Membership Management

Status: APPROVED - BASELINE 2026-07-17; IMPLEMENTATION FOLLOW-UP PENDING

Owner: Dat

Updated: 2026-07-17

Workflow State: SPEC v0.2.0 and implementation plan approved; implementation not started

> **For implementation agents:** Execute `TASKS.md` in order. Every behavior task starts with a failing focused test, adds the smallest implementation that satisfies the approved spec, and ends with the listed verification gate.

---

## 1. Goal

Reconcile the existing FE04 prototype with the approved canonical membership contract so that application history, current eligibility, reviewer metadata, audit data, and FE10 delivery remain deterministic under normal and concurrent use.

## 2. Source Documents

- `.sdd/specs/feat-membership-management/SPEC.md` v0.2.0.
- `.sdd/specs/feat-membership-management/CONTEXT.md` v0.2.0.
- `.sdd/specs/feat-membership-management/TEST_PLAN.md`.
- `.sdd/rfcs/ADR-002-database-design.md`.
- `.sdd/specs/feat-notification-management/SPEC.md` for `MEMBERSHIP_RESULT` requester ownership.
- `database/Librarymanagement.sql`.
- `.sdd/constraints/safety.md`.

## 3. Existing Baseline And Drift

The repository already contains FE04 routes, controller, service, repository, validators, route tests, in-memory repositories, and frontend screens. These files are prototype evidence, not completion evidence for v0.2.0.

| Approved contract | Current drift to reconcile |
| --- | --- |
| `Members.Status` is the canonical eligibility source | Status response currently prefers the latest application and does not return the approved `{ membershipStatusView, memberStatus, currentApplication }` shape. |
| Application/member/audit writes are atomic | Repository mutations and service-level audit writes are currently separate operations. |
| At most one pending application and one final review result | In-memory checks exist, but SQL-level uniqueness and concurrent review evidence are missing. |
| Rejected users may re-apply while preserving history | Prototype behavior needs explicit route and SQL tests for the new pending row plus canonical projection reset. |
| FE10 delivery occurs once after commit and is non-blocking | The current service has no FE04-bound notification requester integration. |
| Registered active users may apply/view status | Routes currently require the `MEMBER` role, which is not the same as an active registered account and can block pre-membership applicants. |
| Applicant UI shows server truth | The page currently falls back to fabricated demo status/application data after API failure. |

## 4. Scope

### In Scope

- Apply, own status, staff list, approve, and reject endpoints from `SPEC.md` section 11.
- Canonical `Members` projection and immutable `MembershipApplications` history.
- Active-account checks, one-pending concurrency, re-application, reviewer metadata, required rejection reason, and no-expiry state rules.
- Atomic application/member/audit writes.
- One idempotent, non-blocking FE10 `MEMBERSHIP_RESULT` request after review commit.
- Server-backed member/staff frontend states without demo fallbacks.
- Focused route, repository, SQL concurrency, frontend, and traceability evidence.

### Out Of Scope

- FE02 registration/login/email verification.
- FE03 profile editing.
- FE07 borrowing, FE08 reservation, or FE11 role assignment implementation.
- Membership expiry, renewal, payment, or a new membership-number scheme.
- FE10 provider/worker redesign beyond consuming its approved requester interface.

## 5. File And Interface Map

| Area | Files | Responsibility |
| --- | --- | --- |
| SQL contract | `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md` | Enforce one pending application per user and retain approved member/application fields without physical history deletion. |
| HTTP boundary | `backend/src/routes/membershipRoutes.js`, `backend/src/controllers/membershipController.js`, `backend/src/validators/membershipValidators.js` | Authentication, staff RBAC, ID/query/reason validation, and approved response shapes. |
| Business rules | `backend/src/services/membershipService.js` | Active-account eligibility, canonical status derivation, re-application, final-state checks, and post-commit FE10 request. |
| Persistence | `backend/src/repositories/membershipRepository.js`, `backend/src/repositories/auditLogRepository.js` | Transactional application/member/audit writes and deterministic latest-application queries. |
| Notification boundary | `backend/src/services/notificationService.js`, `backend/src/services/membershipService.js`, `backend/src/app.js` | Create and inject the FE04-bound `MEMBERSHIP_RESULT` requester with source metadata and idempotency key. |
| API documentation | `backend/src/docs/openapi.yaml` | Document the five FE04 endpoints, safe response fields, errors, and role rules. |
| Backend tests | `backend/tests/membershipRoutes.test.js`, `backend/tests/helpers/inMemoryMembershipRepositories.js`, `backend/tests/sql/membershipConcurrency.sqltest.js` | RED/GREEN route behavior, rollback, re-application, one-pending, one-final-result, and non-blocking delivery evidence. |
| Frontend | `frontend/src/page/MembershipPage.jsx`, `frontend/src/component/membership/*`, `frontend/src/api/libraryFeatureApi.js` | Render canonical status/list responses and review actions without fabricated server state. |
| Frontend tests | `frontend/test/membershipFrontend.test.js` | Source-level regression checks for role access, canonical states, error handling, and removal of demo fallback data. |

## 6. Approved Interfaces

| Method | Endpoint | Required behavior |
| --- | --- | --- |
| `POST` | `/api/membership/applications` | Authenticated active registered user; creates application and canonical `PENDING` projection atomically. |
| `GET` | `/api/membership/status/me` | Returns only the actor's `{ membershipStatusView, memberStatus, currentApplication }`. |
| `GET` | `/api/membership/applications` | Librarian/Admin; validated status filter and paginated review list. |
| `PATCH` | `/api/membership/applications/{applicationId}/approve` | Pending only; application/member/reviewer/audit commit together, then FE10 is requested. |
| `PATCH` | `/api/membership/applications/{applicationId}/reject` | Pending only; trimmed `reason` length 1..500, atomic review writes, then FE10 is requested. |

The FE10 requester call must use type `MEMBERSHIP_RESULT`, source feature `FE04`, source application ID, final status, and idempotency key `FE04:MEMBERSHIP_RESULT:<applicationId>:<finalStatus>`. Raw internal exceptions or protected reviewer data must not cross the HTTP response.

## 7. Ordered Implementation Strategy

### 7.1 Lock The Contract With RED Tests

- Extend route tests for active registered applicants without a pre-existing member role, canonical `NONE`, re-application, invalid transitions, privacy, pagination, and FE10 failure.
- Add SQL tests that race two applications for one user and two final review commands for one application.
- Make tests assert no partial application/member/audit state after injected failure.

### 7.2 Reconcile Schema And Persistence

- Add a reviewable SQL uniqueness mechanism that permits history but allows at most one `PENDING` application per `UserId`.
- Keep `Members.UserId` canonical and unique; do not add `EXPIRED` or delete historical applications.
- Move apply/approve/reject plus audit writes into repository transactions and return explicit outcomes for duplicate pending, invalid final state, and not found.

### 7.3 Reconcile Boundary And Service Rules

- Authenticate applicant endpoints without requiring an already-assigned membership role.
- Validate active `Users.Status`, IDs, filters, pagination, and rejection reason on the server.
- Derive status from `Members`; select the latest application by `AppliedAt DESC, ApplicationId DESC` only for display.
- Preserve final application rows and reset only the canonical projection on re-application.

### 7.4 Add FE10 Post-Commit Delivery

- Request exactly one FE04-bound notification after approval/rejection commit.
- Treat duplicate idempotency responses as safe and provider/requester failures as non-blocking.
- Return only safe delivery status; membership state remains committed when delivery fails.

### 7.5 Reconcile Frontend And Evidence

- Consume the canonical response fields and display `NONE`, `PENDING`, `APPROVED`, `REJECTED`, and `INACTIVE` distinctly.
- Remove fabricated application/status rows and show explicit loading, empty, permission, and API-error states.
- Add `@spec` tags, update API documentation/test strategy evidence, and run focused verification before any full-suite merge gate.

## 8. Dependency Order

1. RED route/SQL contract tests.
2. SQL/ADR and repository transaction contract.
3. Validators, routes, service, and canonical response shape.
4. FE10 requester integration.
5. Frontend reconciliation.
6. Traceability, focused verification, then human review.

FE04 implementation must finish before FE07/FE08 can claim canonical membership eligibility integration complete.

## 9. Verification Gates

| Gate | Command | Expected result |
| --- | --- | --- |
| FE04 backend | `npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js` | Focused route suite passes with no skipped FE04 cases. |
| FE04 SQL concurrency | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/membershipConcurrency.sqltest.js` | One-pending, one-final-result, and rollback cases pass when SQL test configuration is available. |
| FE04 frontend | `node --test frontend/test/membershipFrontend.test.js` | Canonical status, no-demo-fallback, and review-state checks pass. |
| Traceability | `npm.cmd run trace:enforce` | FE04 changed implementation files satisfy the repository traceability threshold. |
| Diff hygiene | `git diff --check` | No whitespace errors. |

Full backend/frontend suites remain the final merge gate, but they are not a substitute for the focused RED/GREEN evidence above.

## 10. Human Review Gate

- [x] Confirm applicant endpoints use authenticated active-account identity rather than requiring an already-approved membership role.
- [x] Confirm the SQL one-pending strategy preserves all rejected/approved history.
- [x] Confirm FE10 requester ownership, source metadata, and idempotency key.
- [x] Confirm frontend failure states never replace server truth with demo records.
- [x] Approve `TASKS.md` ordering and mappings before implementation starts.
