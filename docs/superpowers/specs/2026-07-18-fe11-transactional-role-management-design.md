# FE11 Transactional Role Management Design

Status: DESIGN APPROVED; WRITTEN SPEC REVIEW PENDING - 2026-07-18

Feature: FE11 User & Role Management

## 1. Decision

Use SDD Full depth for a bounded FE11 role-management slice. Implement role assignment and revocation through a dedicated transactional repository that validates the acting Admin, locks the affected role state, applies one deterministic mutation, and writes the audit entry in the same SQL transaction.

This slice is Core behavior because an incorrect role mutation can grant stale privileges, remove a user's final role, remove the last active Admin, or leave an unaudited authorization change.

## 2. Source Requirements

The design implements or advances these approved FE11 requirements:

- `BR-FE11-001`, `BR-FE11-007..010`: Admin-only access, at least one role per user, multiple roles, last-Admin protection, and auditability.
- `FR-FE11-012..017`, `FR-FE11-024..027`: assign/revoke behavior, acting-Admin validation, deterministic not-found behavior, duplicate assignment rejection, missing mapping rejection, and final-role protection.
- `AC-FE11-013..015`: successful Admin assignment/revocation and last-Admin rejection.
- `NFR-FE11-SEC-001..005`: server-side RBAC, input validation, and parameterized SQL.
- `NFR-FE11-TXN-003`, `NFR-FE11-TXN-006`: atomic audit plus role mutation and concurrency-safe Admin protection.

Primary source: `.sdd/specs/feat-user-role-management/SPEC.md`.

## 3. Current Problem

The current service checks some invariants before calling separate repository operations, but the role mutation and audit are not atomic. The current SQL silently ignores duplicate assignment and missing-role revocation. User and role lookup failures also use inconsistent `400` semantics, and the acting Admin is not revalidated at mutation time.

These gaps correspond to `TD-013`, the role-management portion of `TD-014`, and the role-test portion of `TD-015` in `TECH_DEBT.md`.

## 4. Scope

### In Scope

- Validate `userId` and `roleId` as positive integers at the HTTP boundary and again at the service boundary.
- Revalidate that the acting user exists, is active, and currently holds the Admin role inside the role-mutation transaction.
- Return deterministic errors for missing users/roles, duplicate assignment, absent mapping, final-user-role revocation, and last-active-Admin revocation.
- Apply the role mapping and write its audit record in one transaction.
- Lock the affected user-role mappings and active Admin count so concurrent role revocations cannot remove every active Admin.
- Add route, service, and repository tests using RED-GREEN TDD.
- Update FE11 planning, traceability, test strategy, changelog, and technical-debt records for this slice.

### Out of Scope

- User list/detail DTO reconciliation.
- User or librarian profile updates, including `department` and `specialization`.
- Optimistic-concurrency updates and account deactivation.
- Admin console, permissions matrix, audit-log UI, and request-management UI.
- Database schema changes or stored procedures.
- Role creation, role editing, permission editing, or role hierarchy.

## 5. Architecture

Create `backend/src/repositories/userRoleRepository.js` as the single owner of transactional role mutations. Keeping this logic separate avoids adding another responsibility to the existing large `userRepository.js` and gives the concurrency rules a focused test boundary.

The request flow remains:

```text
route validator
  -> userManagementController
  -> userManagementService
  -> userRoleRepository transaction
  -> userRepository readback
```

The controller and public endpoints remain unchanged. The service maps repository outcomes to safe API errors and fetches the updated safe managed-user view only after a successful commit.

## 6. Repository Contract

The repository exposes one operation:

```js
mutateUserRole({
  operation, // 'ASSIGN' or 'REVOKE'
  adminUserId,
  userId,
  roleId,
  ipAddress,
  userAgent,
  now,
})
```

It returns one of these outcomes without throwing for expected business conditions:

| Outcome | Meaning |
| --- | --- |
| `ASSIGNED` | Mapping and assignment audit committed. |
| `REVOKED` | Mapping and revocation audit committed. |
| `ADMIN_NOT_FOUND` | Acting Admin user ID does not exist. |
| `ADMIN_REQUIRED` | Acting user is inactive or no longer holds Admin. |
| `USER_NOT_FOUND` | Target user does not exist. |
| `ROLE_NOT_FOUND` | Requested role does not exist. |
| `USER_ALREADY_HAS_ROLE` | Assignment mapping already exists. |
| `USER_ROLE_NOT_FOUND` | Revocation mapping does not exist. |
| `LAST_USER_ROLE` | Revocation would leave the target with no role. |
| `LAST_ADMIN_ROLE` | Revocation would leave zero active Admin role holders. |

Unexpected database failures throw and trigger rollback.

## 7. Transaction And Locking Flow

For both assignment and revocation, the repository performs the following steps inside one SQL transaction:

1. Lock and load the acting user. Distinguish a missing user from an inactive/non-Admin user.
2. Lock and load the target user.
3. Lock and load the requested role.
4. Lock the target's `UserRoles` rows and determine whether the requested mapping exists.
5. For assignment, reject an existing mapping; otherwise insert it.
6. For revocation, reject a missing mapping and reject a target that has only one role.
7. When revoking Admin, lock the active Admin-role set and reject the mutation when only one active Admin remains.
8. Insert `USER_ROLE_ASSIGN` or `USER_ROLE_REVOKE` into `AuditLogs` with only safe role metadata.
9. Commit. Any SQL or audit failure rolls back the mapping change.

SQL uses typed parameters for every value. Locking reads use `UPDLOCK, HOLDLOCK` on the affected users, role mappings, and Admin count. No request value is concatenated into SQL.

## 8. API And Error Contract

Endpoints stay unchanged:

- `POST /api/users/{userId}/roles` with `{ roleId: number }`.
- `DELETE /api/users/{userId}/roles/{roleId}`.

Expected responses:

| Condition | HTTP | Code | Message |
| --- | ---: | --- | --- |
| Invalid ID shape | 400 | `VALIDATION_ERROR` | Field-specific validation detail. |
| Acting Admin missing | 404 | `ADMIN_NOT_FOUND` | `Acting admin was not found.` |
| Acting user inactive or no longer Admin | 403 | `ADMIN_REQUIRED` | `Admin access is required.` |
| Target user missing | 404 | `USER_NOT_FOUND` | `User was not found.` |
| Role missing | 404 | `ROLE_NOT_FOUND` | `Role was not found.` |
| Role already assigned | 409 | `USER_ALREADY_HAS_ROLE` | `User already has this role.` |
| Role mapping absent | 404 | `USER_ROLE_NOT_FOUND` | `User does not have this role.` |
| Revocation removes final user role | 400 | `LAST_USER_ROLE` | `Every user must keep at least one role.` |
| Revocation removes last active Admin | 400 | `LAST_ADMIN_ROLE` | `Cannot remove the last Admin role.` |

Successful requests continue to return the safe managed-user representation with updated roles. No password, token, session, or setup-link data is added.

## 9. Service Responsibilities

`userManagementService` will:

- Parse and reject invalid positive-integer IDs when invoked outside HTTP routes.
- Call `userRoleRepository.mutateUserRole` with the authenticated Admin context.
- Map each expected repository outcome to the API contract above.
- Fetch and return the updated managed-user view after `ASSIGNED` or `REVOKED`.
- Stop writing a separate role audit through `writeAudit`, because the repository transaction owns that audit.

The service will not perform preflight existence or role-count checks for role mutation. Preflight checks would be race-prone and could disagree with the locked transaction state.

## 10. Validation Boundary

`userManagementValidators.js` will add focused validators:

- Assignment: positive-integer `userId` route parameter and positive-integer `roleId` JSON body field.
- Revocation: positive-integer `userId` and `roleId` route parameters.

Validation runs after authentication and Admin authorization, preserving the current rule that unauthenticated and non-Admin callers receive `401`/`403` before request-shape details are exposed.

## 11. Testing Strategy

Implementation follows strict RED-GREEN TDD.

### Route Tests

- Admin context and normalized IDs reach the service.
- Invalid target or role IDs return `400 VALIDATION_ERROR` and never call the service.
- Existing authentication and Admin authorization behavior remains unchanged.

### Service Tests

- Each repository outcome maps to the documented HTTP status, code, and safe message.
- Assignment/revocation success returns the updated safe user.
- The service calls only the transactional repository for mutation and does not write a second audit.
- Invalid direct service inputs fail before repository access.

### Repository Tests

- Successful assignment commits the mapping and audit together.
- Successful revocation commits the deletion and audit together.
- Duplicate assignment and missing mapping return deterministic outcomes without mutation or audit.
- Missing acting Admin, stale Admin privilege, missing target, and missing role return deterministic outcomes.
- Final-user-role and last-active-Admin guards reject before mutation.
- Audit failure rolls back the mapping change.
- SQL uses parameter inputs and contains the required lock hints on protected reads.

### Regression Validation

- Focused FE11 tests.
- Full backend test suite and coverage.
- Traceability enforcement.
- Frontend lint/build and existing E2E only if backend contract changes affect shared verification.
- `git diff --check` and secret-pattern review.

## 12. Documentation And Traceability

When implementation begins:

- Change FE11 `Implementation State` from `DEFERRED` to `PARTIAL`.
- Add a separately reviewable task group for this role-management slice to FE11 `PLAN.md` and `TASKS.md`.
- Update FE11 `TEST_PLAN.md` and `CHANGELOG.md`.
- Add `@spec` tags to the transactional repository and service branches.
- Mark `TD-013` resolved after passing evidence.
- Narrow `TD-014` and `TD-015` to their remaining non-role gaps rather than claiming all FE11 not-found and service-test debt is closed.

## 13. Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Concurrent Admin revocations remove all Admins | Lock affected mappings and active Admin-role set in the transaction. |
| Audit succeeds/fails independently of mutation | Insert audit inside the same transaction. |
| Token contains stale Admin role | Revalidate active Admin role under the mutation transaction. |
| Service preflight races with SQL state | Repository outcomes are the only business-state decision source. |
| SQL Server is unavailable in CI | Unit-test transaction branches and lock-bearing SQL; retain SQL-backed integration as explicit residual evidence gap. |
| Scope expands into all FE11 debt | Keep update, deactivation, DTO, librarian fields, and UI explicitly out of scope. |

## 14. Definition Of Done

This slice is complete only when:

- The approved endpoints enforce the deterministic error contract.
- Assignment/revocation and audit commit or roll back together.
- Concurrent last-Admin protection is represented by locked SQL reads.
- Route, service, and repository RED-GREEN tests pass.
- Existing backend tests and traceability checks pass.
- FE11 planning, task state, test plan, changelog, and technical debt are synchronized.
- A human reviews the implementation and validation evidence.
