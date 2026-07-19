# PLAN.md - FE11 User & Role Management

Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED

Date: 2026-07-19

Owner: Dung

## 1. Purpose

Preserve the completed bounded FE11 slices and govern the remaining user-lifecycle and Admin Request Management work through the approved Finalization Batch. Sections 3-14 retain historical slice scope/evidence; Section 15 is the active execution boundary.

Whole FE11 remains incomplete until the Finalization closeout records all required H2/H3, merge, exact `main` CI, and acceptance evidence.

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
- `docs/superpowers/specs/2026-07-19-fe11-finalization-batch-design.md`
- `docs/superpowers/plans/2026-07-19-fe11-finalization-batch.md`

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

Integration State: COMPLETE THROUGH B7

### Scope And Order

1. `TD-024` / `FE11-AUD01`: canonical Admin Audit Logs read boundary.
2. `TD-026` / `FE11-ENV01`: restore `{ data, pagination }` and reuse FE12 `/api/reports/users` for counters.
3. `TD-027` / `FE11-META01`: apply the approved evidence matrix after TD-026 merges.

At Batch 1 close, `TD-023` and `TD-025` remained outside that batch. Section 14 later completed `TD-023`; Section 15 now activates `TD-025` and the remaining FE11 finalization scope.

### Gates

- H1 locks Batch 1 and the exact governance activation diff.
- H2 is required before each generated implementation or SPEC-evidence diff is committed and pushed.
- H3 is required after checks and before every PR merge.
- TD-027 analysis may run in parallel, but its `SPEC.md` edit is serialized after TD-026.

### Integration Evidence

- `TD-024` / `FE11-AUD01`: PR #33, merge `3c88e432`, post-merge CI `29651173195`.
- `TD-026` / `FE11-ENV01`: PR #34, merge `411fa25a`, post-merge CI `29652243809`.
- `TD-027` / `FE11-META01`: PR #35, merge `c286cd9b`, post-merge CI `29652617587`.
- Batch 1 did not authorize `TD-023` or `TD-025`; Section 14 separately completed `TD-023`, and Section 15 now governs `TD-025` plus the remaining finalization work.

## 14. Admin Navigation And Permissions Slice

Integration State: COMPLETE THROUGH B7

### In Scope

- Align the Admin Console sidebar to the approved eight entries.
- Add Admin-only `GET /api/admin/permissions` with the canonical 15-row Phase 1 policy.
- Compose FE11 permission data with independent FE12 `usersByRole` counts in the frontend.
- Derive module coverage and matrix cells from `allowedRoles`; keep the view read-only.

### Out Of Scope

- Permission editing, role hierarchy/CRUD, schema changes, FE04 removal, FE12 production changes, and TD-025.

### Validation Gate

- Backend policy/service/route tests prove exact DTOs, fresh objects, and Admin-first authorization.
- Frontend tests prove exact sidebar order, canonical API usage, no hardcoded matrix fallback, FE12 counts, derived coverage, and isolated retries/errors.
- Full tests, coverage, lint, build, browser E2E, OpenAPI parse, health import, traceability, diff hygiene, scope scan, and secret scan pass.
- H2 precedes commit/push; H3 precedes merge; TD-023 closes only after post-merge main CI and closeout evidence.

### Integration Evidence

- H2 approved the unchanged implementation diff on 2026-07-19; H3 approved PR #37 for merge on 2026-07-19.
- PR #37 passed `foundation-checks` in run `29654621448` and merged into `main` as `356130e4905a59d219bae8e9b369f7690348cba2`.
- Exact post-merge `main` CI run `29655548150` passed all `foundation-checks`.
- At this bounded slice close, `TD-023` was resolved while `TD-025` and whole FE11 remained deferred; Section 15 now supersedes that deferred state with governance-only activation.

## 15. FE11 Finalization Batch

Implementation State: WAVE A IMPLEMENTED LOCALLY; H2 PENDING

### Approved Sources

- `docs/superpowers/specs/2026-07-19-fe11-finalization-batch-design.md`
- `docs/superpowers/plans/2026-07-19-fe11-finalization-batch.md`
- `.sdd/rfcs/ADR-002-database-design.md`
- FE02/FE03/FE10/FE11 synchronized contracts and `docs/api/api-contract.md`

### Delivery Shape

1. Governance activation PR: contracts, tasks, validation commands, and debt state only.
2. Wave A: schema/email synchronization, Librarian fields, transactional create/resend hardening, optimistic/no-op updates, atomic deactivation, FE07 serialization dependency, and Admin access hardening.
3. Wave B: canonical Admin request list/detail reads, server pagination, FE07-owned terminal actions, CSV, Dashboard evidence, and FE11 browser acceptance.
4. Documentation closeout: exact PR/merge/main-CI evidence and whole-feature B7 state.

### Core Contracts

- `Users.Email` and `Notifications.RecipientEmail` are `NVARCHAR(255)`.
- `UserProfiles.Department` and `UserProfiles.Specialization` are nullable `NVARCHAR(100)` and FE11-admin-managed only.
- `fullName` remains maximum 100 characters.
- `UserManagementView.updatedAt` is `COALESCE(Users.UpdatedAt, Users.CreatedAt)` and the same value is compared by update/deactivation.
- FE11 create and setup resend revalidate the active acting Admin inside their source transactions; duplicate email is transaction-authoritative and safe.
- `INACTIVE` plus null `DeactivatedAt` is pending activation and returns `409 ACCOUNT_PENDING_ACTIVATION` from deactivation.
- FE07 remains the sole approve/reject mutation owner; FE11 owns only the Admin request read DTOs and presentation.
- Admin request queries are `page`, `limit`, `q`, `status`, `from`, and `to`; list responses contain exactly `data` and `pagination`.

### Gates

- Product work is blocked until the governance PR passes checks, receives H3, and merges into `main`.
- Wave A and Wave B generated changes remain uncommitted until their H2 reviews.
- Every PR requires H3 after checks and before merge.
- Only the closeout PR may transition whole FE11 to `COMPLETE THROUGH B7`.
- All finalization task checkboxes remain open at governance activation; this section records authorization, not implementation evidence.
