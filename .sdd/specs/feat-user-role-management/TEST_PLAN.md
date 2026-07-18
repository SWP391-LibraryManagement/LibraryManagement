# FE11 Test Plan - User & Role Management

Version: 0.3.4
Status: AUDIT LOG IMPLEMENTATION H2-READY; PRIOR SLICES COMPLETE THROUGH B7; FAST-TRACK BATCH 1 ACTIVE; REMAINING FE11 TESTS PLANNED
Last Updated: 2026-07-18

Source Spec: `.sdd/specs/feat-user-role-management/SPEC.md`
Feature IDs: `BR-FE11-*`, `FR-FE11-*`, `AC-FE11-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

User administration, role listing, role assignment/revocation, account status management, and audit logs.

## 2. Unit Test Targets

- Role assignment/revocation rules.
- Admin role API helpers send only numeric `roleId` values from the authenticated role catalog.
- The role modal validates a complete editable catalog before mutation, assigns before revoking, and preserves non-editable roles.
- Partial mutation failure stops later requests and reloads the target user's authoritative roles into the open modal.
- Account status transition rules.
- Protected admin action validation.
- Audit log creation for important admin actions.
- Guard against privilege escalation.
- Atomic inactive account creation and setup-token issuance.
- Setup resend eligibility, cooldown, token rotation, delivery failure, and credential non-exposure.

## 3. API / Integration Test Targets

- `GET /users`: list users with authorization.
- `GET /users/roles`: list roles.
- `GET /admin/audit-logs`: Admin-only search/filter/date/pagination with sensitive metadata redaction.
- `GET /users/:userId`: happy path, not found, forbidden.
- `POST /users`: admin creates user, duplicate, invalid fields.
- `POST /users`: inactive state, valid unusable bcrypt hash, atomic rollback, FE10 safe delivery status.
- `POST /users/:userId/resend-setup`: eligibility, cooldown, rotation, safe provider failure, authorization.
- `GET /users` and `GET /users/:userId`: only `UserManagementView` fields and approved related summaries are returned; credential/token/session/link fields are absent.
- `PUT /users/:userId`: matching `expectedUpdatedAt` updates allowed fields; stale state returns `409 STALE_USER_STATE`; forbidden fields are rejected.
- `PATCH /users/:userId/status`: valid transition, invalid transition.
- `POST /users/:userId/roles`: assign role, invalid role, duplicate, forbidden.
- `DELETE /users/:userId/roles/:roleId`: revoke role, invalid role, forbidden.

## 3.1 Fast-Track Batch 1 Current Targets

- Canonical Admin Audit Logs: SPEC query names, Admin-first authorization, typed validation/filtering, stable order, action-aware default-deny projection, and legacy 404 retirement.
- User list envelope: no top-level `summary`; Admin counters reuse FE12 `/api/reports/users` with numeric zero defaults.
- Evidence metadata: only approved existing Test Case/Status cells change in a serial post-TD-026 window.

## 4. E2E / Manual Acceptance Flow

- Admin creates user.
- Admin assigns/removes role.
- Non-admin cannot access admin screens/actions.
- Audit log shows admin action.

## 5. Current Evidence

- `backend/tests/userManagementRoutes.test.js`
- `backend/tests/userManagementService.test.js` for the completed account-setup slice.
- `backend/tests/userRoleRepository.test.js` for locked transactional role mutation and audit rollback.
- Approved role-slice design: `docs/superpowers/specs/2026-07-18-fe11-transactional-role-management-design.md`.
- Approved role-slice plan: `docs/superpowers/plans/2026-07-18-fe11-transactional-role-management.md`.
- Automated role-slice evidence: 70/70 focused tests and 399/399 full backend tests.
- Approved safe-read design: `docs/superpowers/specs/2026-07-18-fe11-safe-user-list-detail-design.md`.
- Approved safe-read plan: `docs/superpowers/plans/2026-07-18-fe11-safe-user-list-detail.md`.
- `backend/tests/userRepository.test.js` for safe DTO mapping, approved search SQL, aggregate predicates, zero defaults, and hostile-column exclusion.
- `backend/tests/userManagementService.test.js` for strict list normalization and detail `404 USER_NOT_FOUND`.
- `backend/tests/userManagementRoutes.test.js` for Admin-first list/detail validation.
- `frontend/test/userManagementApi.test.js` and `frontend/test/userManagementFrontend.test.js` for query omission, `phoneNumber`, detail loading, summaries, and stale-row recovery.
- Automated safe-read evidence: 105/105 focused backend, 434/434 full backend, 81/81 frontend, coverage/lint/build/traceability PASS.
- Approved Admin role UI design: `docs/superpowers/specs/2026-07-18-fe11-admin-role-ui-contract-design.md`.
- Approved Admin role UI plan: `docs/superpowers/plans/2026-07-18-fe11-admin-role-ui-contract.md`.
- `frontend/test/userManagementApi.test.js` proves numeric assignment bodies and revocation paths with no role-name mutation contract.
- `frontend/test/userManagementFrontend.test.js` proves catalog validation, numeric mutation planning, assignment-before-revocation order, no-op behavior, reconciliation, and Save lock.
- Automated Admin role UI evidence: 12/12 focused frontend, 101/101 full frontend, 105/105 focused backend role regression, lint/build/traceability/diff/security PASS.
- Approved Audit Log design: `docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md`.
- Approved Audit Log plan: `docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md`.
- `backend/tests/adminAuditLogRoutes.test.js`, `backend/tests/auditLogRepository.test.js`, and `backend/tests/adminAuditLogService.test.js` prove canonical ownership, Admin-first validation, typed filtered SQL pagination, stable order, and action-aware default-deny projection.
- `frontend/test/adminApi.test.js`, `frontend/test/userManagementApi.test.js`, and `frontend/test/userManagementFrontend.test.js` prove canonical endpoint consumption, legacy adapter removal, filter construction, and nested safe DTO rendering.
- Audit Log H2 evidence: 246/246 focused backend, 598/598 full backend, 111/111 frontend, coverage/lint/build/OpenAPI/traceability/diff/security/scope checks PASS.

## 6. Gaps

- Account setup, transactional backend role mutation, safe list/detail, and Admin role-action UI are complete through human review, merge, and post-merge CI.
- Admin role-action UI `FE11-UIR01..UIR05` is complete through B7; PR #30 and post-merge CI `29644292781` passed, and `TD-022` is resolved.
- Audit Log implementation is H2-ready with local L1-L4 evidence; `TD-024` remains `IN PROGRESS` and `FE11-AUD01` remains unchecked until H2 approval, PR checks, H3, merge, and post-merge CI.
- Request Management lacks the canonical detail endpoint and a focused terminal-state immutability acceptance test (`TD-025`).
- Open debt also includes TD-012, remaining TD-014/015, TD-017, Admin Console drift TD-023, list-envelope drift TD-026, and stale SPEC evidence metadata TD-027.

## 7. Transactional Role Slice

- Route tests validate Admin-first authorization and positive-integer user/role IDs.
- Service tests map deterministic repository outcomes to safe HTTP errors.
- Repository tests prove locked actor/target/role state, duplicate/missing mapping errors, final-role guards, atomic audit, and rollback.
- Repository coverage: 100% statements, 90.24% branches, 100% functions, and 100% lines.
- SQL Server-backed concurrent acceptance remains an explicit environment-dependent follow-up.

## 8. Safe User List And Detail Slice

- Route tests prove Admin-first authorization and strict list/detail validation.
- Service tests prove defaults-only-when-omitted, enum/search normalization, direct-input rejection, dedicated detail read, and `404 USER_NOT_FOUND`.
- Repository tests prove the explicit `UserManagementView` allowlist, `phoneNumber`, deterministic roles, approved search fields/order, three aggregate predicates, and zero defaults.
- Frontend tests prove `ALL`/empty-search omission, authorized detail fetch, real detail drawer data, and stale-row recovery after 404.
- Full evidence: 434/434 backend tests, 81/81 frontend tests, 92.47% statement coverage, 82.35% branch coverage, lint/build/traceability PASS.
- Real SQL Server aggregate execution and browser-level drawer interaction remain environment-dependent residual checks; emitted SQL and frontend contracts are automated.

## 9. Admin Role UI Contract Slice

- The API adapter accepts only numeric `roleId` for assignment and revocation.
- The page accepts IDs only from the authenticated catalog and rejects missing, duplicate, zero, or invalid editable entries before mutation.
- The complete diff is planned before the first request; assignments run before revocations and no-op saves send no mutation.
- The first mutation failure stops the sequence and reloads the authoritative target into the open modal; failed reconciliation disables Save.
- Role-specific browser interaction remains a residual acceptance check; existing browser E2E stays the CI regression boundary.
- Real SQL Server concurrent last-Admin execution remains environment-dependent and is covered locally by the unchanged focused backend contract tests.

## 10. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```

## 11. Audit Log H2-Ready Slice

- Route tests prove authentication and Admin authorization run before detailed validation, canonical query values are normalized, and the retired user-management route always returns `404 NOT_FOUND` without service invocation.
- Repository tests prove typed parameters, escaped LIKE search, one shared filter scope, stable `CreatedAt DESC, LogId DESC` order, restricted user-target joins, and zero-page empty results.
- Service tests cover the approved cross-feature action matrix, hostile and malformed metadata, safe actor/target mapping, non-user labels, and omission of raw metadata/user-agent fields.
- Frontend tests prove filter application/reset/refresh, canonical Admin API ownership, and React text rendering from nested `actor`, `target`, and `details` only.
- Real SQL Server execution and browser interaction remain explicit environment-dependent H2 review items; no schema, dependency, authentication, audit-write, or TD-026 behavior changed.
