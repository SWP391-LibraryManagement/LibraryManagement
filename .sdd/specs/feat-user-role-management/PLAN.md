# PLAN.md - FE11 User & Role Management

Status: IMPLEMENTED - LOCAL AUTOMATED VALIDATION COMPLETE

Date: 2026-07-23

Current Extension: Personal-data ownership correction is implemented and locally regression-tested; authenticated browser/human acceptance remains open under FE11-PDO04.

Concurrent Extension: Admin Console Membership Review is implemented with canonical FE04 ownership and locally regression-tested; responsive browser, Azure Staging, and human acceptance remain open.

Owner: Dung

## 1. Purpose

Preserve completed FE11 slice evidence while correcting personal-data ownership.
Sections 3-20 retain historical planning and integration snapshots; Section 21
is the current personal-data ownership implementation boundary.

The previously approved Phase 1 FE11 baseline is complete through B7. The later
2026-07-22 ownership decision supersedes only the broad existing-user update
contract and must be implemented before the revised FE11 scope can be called
complete. Historical completion evidence does not prove Section 21.

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

Implementation State: WAVE A AND WAVE B INTEGRATED; HISTORICAL BATCH RECORD

### Approved Sources

- `docs/superpowers/specs/2026-07-19-fe11-finalization-batch-design.md`
- `docs/superpowers/plans/2026-07-19-fe11-finalization-batch.md`
- `.sdd/rfcs/ADR-002-database-design.md`
- FE02/FE03/FE10/FE11 synchronized contracts and `docs/api/api-contract.md`

### Delivery Shape

1. Governance activation PR: contracts, tasks, validation commands, and debt state only.
2. Wave A: schema/email synchronization, Librarian fields, transactional create/resend hardening, optimistic/no-op updates, atomic deactivation, FE07 serialization dependency, and Admin access hardening.
3. Wave B: canonical Admin request list/detail reads, server pagination, FE07-owned terminal actions, DOCX export, Dashboard evidence, and FE11 browser acceptance.
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

- Historical gate: product work was blocked until the governance PR passed checks, received H3, and merged into `main`.
- Historical gate: Wave A and Wave B generated changes remained uncommitted until their H2 reviews.
- Historical gate: every PR required H3 after checks and before merge.
- PR #54 superseded the activation snapshot and transitioned the approved FE11 scope through integration; current evidence is recorded in `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`.

## 16. Final Governance Closeout

Implementation State: COMPLETE - PR #54 INTEGRATED; PR #59 H2/H3-APPROVED AND MERGED AS `eed2688`

### Scope

- Restore the FE11 Admin Audit Log `action` and numeric `actorId` controls that
  feed the already-approved canonical query builder.
- Add a focused frontend regression mapped to `BR-FE11-018`, `BR-FE11-026`,
  `FR-FE11-033`, and `AC-FE11-018`.
- Reconcile current traceability metadata while preserving historical planning
  snapshots.
- Change no API, schema, role permission, authorization, pagination, redaction,
  or backend behavior.

### Validation Commands

```powershell
npm.cmd run trace:enforce
npm.cmd run test:deployment
npm.cmd --prefix backend run test:coverage:ci
npm.cmd run test:system
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run phase3:performance
npm.cmd run smoke:staging
```

### Review Boundary

- Human H2 approved the published reconciliation and responsive HomePage
  correction commits `962ceb1` and `daaeea6` with their L1-L4 evidence on
  2026-07-20.
- H3 remains mandatory before merge.
- H3, merge, and exact post-merge `main` CI are tracked by PR #59; `v1.0.2` is
  already published at `c988af1`. Any future `v1.0.3` must use a later reviewed
  `main` SHA after its own release gates.

## 18. Admin Console Full Frontend Refactor Slice

Decision: APPROVED BY HUMAN - 2026-07-22.

This Shell-only refactor preserves `/admin/users`, all FE11/FE07/FE12 API and ownership contracts, server authorization, safe DTOs, and database state. It splits the Admin Console into a guarded shell, shared presentation primitives, and independent Dashboard, Library, Circulation, Requests, Users, Permissions, and Audit modules.

Implementation order: governance -> pure presentation RED/GREEN -> shared shell -> Dashboard -> Users -> Requests -> Permissions -> Audit -> Library/Circulation -> legacy removal -> full validation and Azure Staging acceptance.

## 19. Authenticated Admin UX Correction Slice

Decision: APPROVED BY HUMAN - 2026-07-22.

This bounded Hybrid correction updates the FE11 sidebar contract from eight to seven visible entries while preserving Manage Roles in User Management and leaving the permission API/policy unchanged. Shell work switches the user directory to its existing card view before its 1040px table overflows, keeps all canonical Audit filters, presents mapped actions accessibly, and moves safe detail metadata behind a per-row disclosure.

Implementation order: spec/design reconciliation -> focused RED tests -> navigation correction -> responsive user breakpoint -> Audit filter/detail correction -> full frontend validation -> responsive browser acceptance -> Azure Staging review.

## 20. Admin Console Membership Review Integration

Decision: APPROVED BY HUMAN - 2026-07-22.

The later approved integration supersedes only the seven-entry navigation count and FE04-outside-Admin boundary above. FE11 adds the eighth `Duyệt hội viên` shell entry after All Users; FE04 owns the embedded list/review data and mutations. The executable plan is `docs/superpowers/plans/2026-07-22-admin-membership-review-integration.md`; Permissions remains absent and no backend production/API/schema change is allowed.

## 21. Personal Data Ownership Correction

Decision: APPROVED BY USER - 2026-07-22.

Implementation State: PRODUCT AND CONTRACT IMPLEMENTED; LOCAL AUTOMATED VALIDATION COMPLETE; BROWSER/HUMAN ACCEPTANCE PENDING.

### Goal And Ownership

- FE03 remains the sole Phase 1 owner of authenticated self-service changes to `fullName`, `phone`, and `address`.
- Existing-account email remains read-only in Phase 1; any future change must use an explicitly approved FE02 verification flow.
- FE11 Admin may view personal fields but must not edit them after account creation.
- FE11 Admin may update only `department` and `specialization` for a target that currently has the Librarian role.
- Create-account inputs remain unchanged because Admin must supply initial identity/contact data before the new user can complete setup.

### Files And Responsibilities

| File | Responsibility in this correction |
| --- | --- |
| `backend/tests/userManagementRoutes.test.js` | Prove the HTTP boundary rejects personal/unknown fields and preserves Admin-first authorization. |
| `backend/tests/userManagementService.test.js` | Prove only current-Librarian work fields reach the repository and map forbidden attempts to `403 PERSONAL_PROFILE_ADMIN_FORBIDDEN`. |
| `backend/tests/userRepository.test.js` | Prove allowed work-field updates keep optimistic concurrency/no-op/audit semantics and cannot write personal columns. |
| `backend/src/validators/userManagementValidators.js` | Replace the broad update allowlist with `expectedUpdatedAt`, `department`, and `specialization`; reject personal/unknown fields deterministically. |
| `backend/src/services/userManagementService.js` | Enforce target-role ownership and map personal-field attempts without calling the update repository. |
| `backend/src/repositories/userRepository.js` | Narrow update SQL and audit metadata to Librarian work fields only. |
| `frontend/test/userManagementApi.test.js` | Prove the Admin adapter sends only the revised work-field request shape. |
| `frontend/test/userManagementFrontend.test.js` | Prove existing personal values are read-only and only current Librarians expose work-field editing. |
| `frontend/src/page/admin/users/AdminUsersSection.jsx` | Separate create payloads from existing-Librarian work updates. |
| `frontend/src/page/admin/users/UserEditorModal.jsx` | Render personal fields read-only in edit mode and expose editable work fields only for current Librarians. |
| `frontend/src/page/admin/users/userPresentation.js` | Validate creation fields separately from Librarian work-field updates. |
| `frontend/src/api/userManagementApi.js` | Send the canonical `PUT` body without personal fields. |
| `backend/src/docs/openapi.yaml`, `docs/api/api-contract.md` | Publish the same narrowed request/error contract after implementation. |

### Canonical API Change

`PUT /api/users/{userId}` accepts exactly:

```json
{
  "expectedUpdatedAt": "2026-07-22T00:00:00.000Z",
  "department": "Circulation",
  "specialization": "Reader services"
}
```

Both work fields are optional nullable strings with maximum length 100. The target must currently be a Librarian. Any `fullName`, `phone`, `address`, `email`, or unknown field makes the whole request fail with HTTP `403` and code `PERSONAL_PROFILE_ADMIN_FORBIDDEN`; no field, effective version, or success audit may change.

### Test-First Implementation Order

1. Add route RED cases for each forbidden personal field, mixed allowed/forbidden payloads, unknown fields, non-Librarian targets, and the allowed Librarian work-only shape. Expected initial result: the current broad validator/service accepts at least the personal-field cases.
2. Add service/repository RED cases proving forbidden input causes no repository call, work fields are the only update keys, stale/no-op behavior remains unchanged, and audit details contain no personal field.
3. Narrow validator, service, and repository behavior until the focused backend tests pass.
4. Add frontend RED cases proving personal controls are read-only in existing-user mode, Member/Admin targets have no work-field Save action, and current Librarians submit only `expectedUpdatedAt`, `department`, and `specialization`.
5. Split create/edit validation and payload construction, then make the focused frontend tests pass.
6. Synchronize OpenAPI/shared API documentation and run full backend, frontend, E2E, traceability, security, and diff checks.

### Completion Gate

- Every existing-user personal-field attempt is rejected server-side, including direct and mixed HTTP payloads.
- The Admin UI contains no editable existing-user name, phone, address, or email control.
- Only current Librarian department/specialization changes can advance `UpdatedAt` or write an update-success audit.
- FE03 self-service profile behavior and FE02 account setup/authentication regressions remain green.
- `FE11-PDO02..PDO04` are complete with fresh automated evidence; historical FE11-LIFE03 evidence alone is not accepted.
