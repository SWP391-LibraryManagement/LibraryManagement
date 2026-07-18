# PLAN.md - FE11 User & Role Management

Status: APPROVED - BASELINE 2026-07-17; ACCOUNT SETUP, TRANSACTIONAL ROLE, SAFE LIST/DETAIL, AND ADMIN ROLE UI SLICES COMPLETE; FAST-TRACK BATCH 1 ACTIVE; REMAINING WORK DEFERRED

Date: 2026-07-15

Owner: Dung

## 1. Purpose

Implement the smallest approved FE11 slice that normalizes admin-created account setup across FE02, FE10, FE11, the API contract, and SQL behavior.

The rest of FE11 remains unplanned and must not be treated as complete through this slice.

## 2. Source Documents

- `.sdd/specs/feat-user-role-management/SPEC.md`
- `.sdd/specs/feat-auth/SPEC.md`
- `.sdd/specs/feat-notification-management/SPEC.md`
- `.sdd/rfcs/ADR-003-authentication-approach.md`
- `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`
- `.sdd/rfcs/ADR-005-admin-created-account-setup-boundary.md`
- `docs/api/api-contract.md`
- `database/Librarymanagement.sql`
- `.sdd/constraints/safety.md`

## 3. Slice Scope

### In Scope

- Create Member/Librarian accounts as `INACTIVE`.
- Store an unusable bcrypt hash of a discarded random value while setup is incomplete.
- Atomically create user, profile, initial role, hashed `ACCOUNT_SETUP` token, and FE11 audit event.
- Deliver canonical `ACCOUNT_SETUP` through the FE10 requester bound to `FE11`.
- Return safe `SENT`/`FAILED` setup-delivery status.
- Add Admin-only setup resend with token rotation and 60-second cooldown.
- Complete setup through the existing FE02 token endpoint, atomically activating the account.
- Add focused service, route, repository, and integration tests.

### Out Of Scope

- Remaining FE11 CRUD/admin-console debt unrelated to account setup.
- Public setup resend.
- Admin password reset for active accounts.
- Deactivated-account reactivation.
- Changing FE02 verification/reset OTP ownership from ADR-004.

## 4. Approved Contract

| Area | Decision |
| --- | --- |
| Initial state | `INACTIVE` |
| Setup token owner | FE11 |
| Setup completion owner | FE02 |
| Delivery owner | FE10 requester bound to `FE11` |
| Notification pair | `ACCOUNT_SETUP -> ACCOUNT_SETUP` |
| Template variables | `setupLink`, `expiresInHours` |
| Token storage | SHA-256 hash in `AuthTokens`, 24-hour expiry |
| Source reference | `AuthToken` plus persisted token ID |
| Idempotency | `FE11:ACCOUNT_SETUP:<tokenId>` |
| Delivery failure | Non-blocking; account remains `INACTIVE` |
| Resend | Admin-only; revoke old active token, create new event, 60-second cooldown |

## 5. Transaction Boundaries

- FE11 source transaction: `Users` + `UserProfiles` + `UserRoles` + `AuthTokens` + `AuditLogs`.
- FE10 provider delivery starts only after source commit and uses its own delivery transaction.
- FE02 completion transaction: password hash + `EmailVerifiedAt` + `Status=ACTIVE` + setup token `UsedAt` + auth audit.
- No distributed transaction spans FE11 and FE10.

## 6. API Changes

| Method | Endpoint | Behavior |
| --- | --- | --- |
| POST | `/api/users` | Creates `INACTIVE` account and returns safe setup-delivery status. |
| POST | `/api/users/{userId}/resend-setup` | Rotates setup token for an eligible incomplete account and requests new delivery. |
| POST | `/api/auth/reset-password` | Existing token shape consumes canonical FE11 `ACCOUNT_SETUP` and activates atomically. |

## 7. Expected Implementation Files

```text
backend/src/services/userManagementService.js
backend/src/services/authService.js
backend/src/services/notificationService.js
backend/src/repositories/userRepository.js
backend/src/repositories/authTokenRepository.js
backend/src/repositories/auditLogRepository.js
backend/src/routes/userManagementRoutes.js
backend/src/validators/userManagementValidators.js
backend/tests/userManagementService.test.js
backend/tests/userManagementRoutes.test.js
backend/tests/authRoutes.test.js
backend/tests/notificationRoutes.test.js
backend/tests/helpers/inMemoryAuthRepositories.js
backend/tests/helpers/inMemoryNotificationRepositories.js
database/Librarymanagement.sql
```

## 8. Test-First Order

1. Add RED tests for inactive creation, valid bcrypt placeholder, full source rollback, and no credential response.
2. Add RED FE10 tests for FE11-only `ACCOUNT_SETUP`, template variables, safe persistence, and provider results.
3. Add RED FE02 tests for atomic setup completion and single-use token behavior.
4. Add RED resend tests for eligibility, cooldown, token rotation, safe failure, and idempotency.
5. Implement the smallest changes needed to pass each focused group.
6. Run affected integration tests, traceability, secret scans, and human review.

## 9. Validation Gate

- No account is `ACTIVE` before setup completion.
- No literal placeholder password hash remains.
- No raw setup token/link appears in DB, audit, logs, HTTP, snapshots, or debug fields.
- FE10 rejects HTTP/non-FE11 `ACCOUNT_SETUP` requests.
- Creation and setup completion pass rollback tests.
- Resend proves cooldown and new token/event/idempotency semantics.
- FE02 verification/reset OTP behavior from ADR-004 remains unchanged.
- Nhat completes human review before commit/merge.

## 10. Transactional Role Management Slice

### In Scope

- Validate positive-integer target and role IDs.
- Revalidate the acting active Admin under the SQL transaction.
- Assign/revoke role mappings with deterministic duplicate/missing errors.
- Protect the final user role and last active Admin under `UPDLOCK, HOLDLOCK`.
- Commit role mutation and audit together.
- Add route, service, and repository tests.

### Out Of Scope

- User update/deactivation, librarian fields, safe detail DTO reconciliation, and Admin UI.
- Schema changes, role creation/editing, permission editing, and role hierarchy.

### Validation Gate

- Focused RED-GREEN tests prove each repository outcome and API mapping.
- Full backend tests and `trace:enforce` pass.
- Remaining FE11 work stays deferred; completed role-slice evidence is recorded separately.

## 11. Safe User List And Detail Slice

### In Scope

- Validate list pagination, status, role, search, and detail user ID.
- Return only the explicit `UserManagementView` allowlist with `phoneNumber`.
- Restrict search to email, full name, and user ID with stable ordering.
- Return detail-only borrowing, unpaid-fine, and open-reservation summaries.
- Return `404 USER_NOT_FOUND` for a missing detail user.
- Make the Admin UI fetch and render the real detail response.
- Add route, service, repository, and frontend RED-GREEN tests.

### Out Of Scope

- Schema changes and librarian `department`/`specialization` persistence.
- Update/deactivation, account setup, role mutation, audit-log, dashboard, and request-management behavior.
- Feature-wide traceability-checker policy changes.

### Validation Gate

- Invalid supplied list/detail values are rejected instead of clamped.
- Hostile extra database columns never appear in the safe DTO.
- List items have no `relatedSummary`; detail has exactly three deterministic numeric summary fields.
- Focused/full backend and frontend checks plus `trace:enforce` pass.
- Remaining FE11 work stays deferred and is not reported as complete.

## 12. Admin Role UI Contract Slice

### In Scope

- Load `{ roleId, roleName }` from the authenticated FE11 role catalog.
- Keep checkbox state by role name while mapping every mutation to a positive numeric role ID.
- Send canonical assignment/revocation requests, with assignments before revocations.
- Block invalid catalogs before mutation and reconcile authoritative user roles after partial failure.
- Add focused frontend RED-GREEN tests and affected regression checks.

### Out Of Scope

- Backend role transaction/validators, schema changes, role creation/editing, and permission editing.
- Navigation, Permissions, Audit Logs, Request Management, update, deactivation, and all other FE11 debt.

### Validation Gate

- API adapter tests prove no role name enters a mutation request.
- UI contract tests prove catalog validation, assignment-before-revocation, no-op behavior, and partial-failure reconciliation.
- Full frontend tests/lint/build, focused backend role regression, traceability, and diff hygiene pass.
- Human review, PR #30, and post-merge CI `29644292781` passed; remaining FE11 work stays deferred.

## 13. Fast-Track Batch 1

### Scope And Order

1. `TD-024` / `FE11-AUD01`: canonical Admin Audit Logs read boundary.
2. `TD-026` / `FE11-ENV01`: restore `{ data, pagination }` and reuse FE12 `/api/reports/users` for counters.
3. `TD-027` / `FE11-META01`: apply the approved evidence matrix after TD-026 merges.

`TD-023` and `TD-025` remain outside Batch 1 and `OPEN`. Whole FE11 remains deferred.

### Gates

- H1 locks Batch 1 and the exact governance activation diff.
- H2 is required before each generated implementation or SPEC-evidence diff is committed and pushed.
- H3 is required after checks and before every PR merge.
- TD-027 analysis may run in parallel, but its `SPEC.md` edit is serialized after TD-026.
