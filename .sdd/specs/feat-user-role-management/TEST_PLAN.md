# FE11 Test Plan - User & Role Management

Version: 0.1.0
Status: DRAFT - prototype/spec reconciliation required
Last Updated: 2026-06-22

Source Spec: `.sdd/specs/feat-user-role-management/SPEC.md`
Feature IDs: `BR-FE11-*`, `FR-FE11-*`, `AC-FE11-*`

---

## 1. Test Scope

User administration, role listing, role assignment/revocation, account status management, and audit logs.

## 2. Unit Test Targets

- Role assignment/revocation rules.
- Account status transition rules.
- Protected admin action validation.
- Audit log creation for important admin actions.
- Guard against privilege escalation.

## 3. API / Integration Test Targets

- `GET /users`: list users with authorization.
- `GET /users/roles`: list roles.
- `GET /users/audit-logs`: admin only.
- `GET /users/:userId`: happy path, not found, forbidden.
- `POST /users`: admin creates user, duplicate, invalid fields.
- `PUT /users/:userId`: admin updates user, forbidden fields rejected.
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

## 6. Gaps

- FE11 `PLAN.md` and `TASKS.md` are `NOT STARTED`.
- Tests should be reconciled with approved spec and role/audit edge cases.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/check-traceability.js
```
