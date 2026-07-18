# FE11 Test Plan - User & Role Management

Version: 0.3.0
Status: ACCOUNT SETUP SLICE COMPLETE; TRANSACTIONAL ROLE SLICE APPROVED; REMAINING FE11 TESTS PLANNED
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
- Approved role-slice design: `docs/superpowers/specs/2026-07-18-fe11-transactional-role-management-design.md`.
- Approved role-slice plan: `docs/superpowers/plans/2026-07-18-fe11-transactional-role-management.md`.

## 6. Gaps

- The account-setup slice has reviewable `PLAN.md`/`TASKS.md`; all remaining FE11 slices still need approved planning.
- Tests should be reconciled with approved spec and role/audit edge cases.
- Open debt (Validation Gate): TD-012 (department/specialization persistence), TD-013 (assign-existing / remove-missing role no-op), TD-014 (404 vs 400 for not-found), TD-015 (service-level coverage exists for account setup but remains missing for most FE11 business rules), TD-017 (dev-bypass guard).

## 7. Transactional Role Slice

- Route tests validate Admin-first authorization and positive-integer user/role IDs.
- Service tests map deterministic repository outcomes to safe HTTP errors.
- Repository tests prove locked actor/target/role state, duplicate/missing mapping errors, final-role guards, atomic audit, and rollback.
- SQL Server-backed concurrent acceptance remains an explicit environment-dependent follow-up.

## 8. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
