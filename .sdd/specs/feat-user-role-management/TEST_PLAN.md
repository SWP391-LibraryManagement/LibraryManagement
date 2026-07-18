# FE11 Test Plan - User & Role Management

Version: 0.3.0
Status: ACCOUNT SETUP AND TRANSACTIONAL ROLE SLICES COMPLETE; SAFE LIST/DETAIL SLICE VALIDATION READY; REMAINING FE11 TESTS PLANNED
Last Updated: 2026-07-18

Source Spec: `.sdd/specs/feat-user-role-management/SPEC.md`
Feature IDs: `BR-FE11-*`, `FR-FE11-*`, `AC-FE11-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

User administration, role listing, role assignment/revocation, account status management, and audit logs.

## 2. Unit Test Targets

- Role assignment/revocation rules.
- Account status transition rules.
- Protected admin action validation.
- Audit log creation for important admin actions.
- Guard against privilege escalation.
- Atomic inactive account creation and setup-token issuance.
- Setup resend eligibility, cooldown, token rotation, delivery failure, and credential non-exposure.

## 3. API / Integration Test Targets

- `GET /users`: list users with authorization.
- `GET /users/roles`: list roles.
- `GET /users/audit-logs`: admin only.
- `GET /users/:userId`: happy path, not found, forbidden.
- `POST /users`: admin creates user, duplicate, invalid fields.
- `POST /users`: inactive state, valid unusable bcrypt hash, atomic rollback, FE10 safe delivery status.
- `POST /users/:userId/resend-setup`: eligibility, cooldown, rotation, safe provider failure, authorization.
- `GET /users` and `GET /users/:userId`: only `UserManagementView` fields and approved related summaries are returned; credential/token/session/link fields are absent.
- `PUT /users/:userId`: matching `expectedUpdatedAt` updates allowed fields; stale state returns `409 STALE_USER_STATE`; forbidden fields are rejected.
- `PATCH /users/:userId/status`: valid transition, invalid transition.
- `POST /users/:userId/roles`: assign role, invalid role, duplicate, forbidden.
- `DELETE /users/:userId/roles/:roleId`: revoke role, invalid role, forbidden.

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

## 6. Gaps

- The account-setup and transactional role slices are complete; the safe list/detail automated validation gate passes and awaits human implementation review.
- Tests should be reconciled with approved spec and role/audit edge cases.
- Open debt (Validation Gate): TD-012 (department/specialization persistence), remaining non-role portions of TD-014 (not-found/acting-admin semantics), remaining TD-015 service coverage, and TD-017 (dev-bypass guard).

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

## 9. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
