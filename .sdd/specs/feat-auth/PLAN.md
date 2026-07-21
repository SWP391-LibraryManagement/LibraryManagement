# PLAN.md - FE02 Authentication

Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Date: 2026-07-15
Owner: Dat

## 1. Purpose

Implement FE02 Authentication according to the approved `SPEC.md`, ADR-003 Authentication Approach, the revised SQL Server schema, and the Phase 1 API contract.

FE02 is a Core feature. Implementation must be small, testable, and reviewed before merge.

## 2. Source Documents

- `.sdd/specs/feat-auth/SPEC.md`
- `.sdd/rfcs/ADR-003-authentication-approach.md`
- `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`
- `.sdd/rfcs/ADR-005-admin-created-account-setup-boundary.md`
- `.sdd/rfcs/ADR-002-database-design.md`
- `docs/api/api-contract.md`
- `database/Librarymanagement.sql`
- `.sdd/constraints/safety.md`

## 3. Scope

### In Scope

- Register account.
- Verify email.
- Resend verification email.
- Login with JWT access token and refresh token.
- Refresh access token.
- Logout and revoke refresh token.
- Change password.
- Forgot password.
- Reset password.
- Current user/session endpoint.
- Server-side validation.
- Password hashing with bcrypt.
- Hashed token storage through `AuthTokens`.
- Safe generic error handling.
- Audit logging for auth events.
- Backend unit/integration tests for core auth rules.

### Out Of Scope

- OAuth/OpenID Connect.
- Real production email provider setup.
- MFA/2FA.
- Social login.
- Full FE11 admin user management.
- Unrelated frontend redesign outside the approved Authentication/OTP UX slice.
- Migrating `CHANGE_PASSWORD_OTP` into FE10 without a separately approved notification type/use case.

## 4. Approved Technical Decisions

| Area | Decision |
| --- | --- |
| Password hashing | `bcrypt`; cost factor 10 for Phase 1 unless performance review changes it. |
| Access token | JWT, 15-minute expiry. |
| Refresh token | Random token, stored as hash in `AuthTokens`, 7-day expiry. |
| Email verification credential | Primary flow is a random six-digit OTP, stored as a hash in `AuthTokens`, 15-minute expiry; legacy token links remain accepted. |
| Password reset credential | Primary flow is a random six-digit OTP, stored as a hash in `AuthTokens`, 15-minute expiry; legacy password-reset tokens remain accepted. |
| Account setup token | FE11 issues/rotates it with an exact 24-hour expiry; FE10 delivers it through the FE11-bound requester; FE02 consumes it and atomically activates the account. |
| Roles | Flat roles from `Roles`/`UserRoles`. |
| Verification/reset email delivery | FE02 creates/validates OTPs and calls the FE10 requester bound to `FE02`; FE10 exclusively renders, sends, and records status/attempts. |
| Change-password OTP delivery | Remains a direct FE02 email flow until a separate FE10 notification type/use case is approved. |
| Rate limiting | Simple server-side failed-login counter using `Users.FailedLoginCount` and `Users.LockedUntil`. |

## 5. Database Dependencies

Required tables/fields exist in `database/Librarymanagement.sql` and passed local SQL Server smoke test:

- `Users`: `PasswordHash`, `Status`, `EmailVerifiedAt`, `FailedLoginCount`, `LockedUntil`, `LastLoginAt`.
- `Roles`, `UserRoles`.
- `AuthTokens`: `TokenType`, `TokenHash`, `ExpiresAt`, `UsedAt`, `RevokedAt`.
- `AuditLogs`.
- `NotificationTemplates`, `Notifications`, `NotificationAttempts` are FE10-owned delivery records; FE02 references its persisted `AuthTokens.TokenId` but does not write notification records directly.

## 6. API Endpoints

Implement the FE02 endpoints from `docs/api/api-contract.md`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register account and create verification OTP. |
| POST | `/api/auth/verify-email` | Verify email with OTP/email or legacy token. |
| POST | `/api/auth/resend-verification` | Resend verification OTP safely. |
| POST | `/api/auth/login` | Login and return access/refresh tokens. |
| POST | `/api/auth/refresh-token` | Exchange a valid refresh token for a new access token without requiring a valid access token. |
| POST | `/api/auth/logout` | Revoke refresh token. |
| POST | `/api/auth/change-password` | Change password for authenticated user. |
| POST | `/api/auth/forgot-password` | Request reset OTP without email enumeration. |
| POST | `/api/auth/reset-password` | Reset password with valid OTP/email or legacy token. |
| GET | `/api/auth/me` | Return safe current user context. |

## 7. Backend File Plan

Expected backend files:

```text
backend/src/config/env.js
backend/src/config/db.js
backend/src/routes/authRoutes.js
backend/src/controllers/authController.js
backend/src/services/authService.js
backend/src/repositories/userRepository.js
backend/src/repositories/authTokenRepository.js
backend/src/repositories/auditLogRepository.js
backend/src/services/notificationService.js
backend/src/services/emailService.js
backend/src/middleware/authMiddleware.js
backend/src/middleware/errorHandler.js
backend/src/validators/authValidators.js
backend/src/utils/passwordPolicy.js
backend/src/utils/tokenUtils.js
backend/src/utils/safeErrors.js
```

Do not add new implementation under legacy placeholder paths such as `backend/src/Controller/Authentication` or `backend/src/Service/...`; leave existing placeholders untouched until a separately approved cleanup task, and place all new work in the ADR-001 architecture.

## 8. Frontend File Plan

Expected frontend integration files:

```text
frontend/src/api/httpClient.js
frontend/src/api/authApi.js
frontend/src/hooks/useAuth.js
```

Existing login/register/forgot-password pages may be connected after backend endpoints are implemented. UI behavior must not be trusted as security enforcement.

The approved Authentication/OTP UX hardening is implemented through `docs/superpowers/plans/2026-07-14-auth-otp-ux.md`. It adds presentation validation, two-step registration, six-digit OTP focus and masking, a 60-second resend cooldown, and responsive/accessibility checks without moving security enforcement out of the backend.

## 9. Test Strategy

### Unit Tests

- Password policy validation.
- Token generation/hash/expiry helpers.
- Auth service register/login/reset/change password paths using mocked repositories.
- Safe error behavior for invalid login and forgot password.

### Integration Tests

- Register -> verify -> login.
- Login fail for wrong password.
- Login fail for inactive/unverified account.
- Refresh token success/failure.
- Logout invalidates refresh token.
- Forgot/reset password success.
- Expired/used reset token fails.
- Protected `/api/auth/me` requires valid token.

## 10. Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Token leakage in logs | Store hashes only; never log raw token values. |
| Email enumeration | Generic forgot-password and resend responses. |
| Weak password handling | Enforce policy server-side and hash with bcrypt. |
| SQL injection | Use `mssql` parameterized queries only. |
| Overly broad CORS | Keep production CORS configurable; do not hardcode permissive production policy. |
| Frontend-only auth checks | Enforce all protected actions server-side. |

## 11. Validation Gate

Before FE02 is considered complete:

- All TASKS.md items are complete.
- Backend tests pass.
- Frontend build passes if frontend integration is included.
- No raw passwords/tokens/secrets are committed.
- API responses match `docs/api/api-contract.md`.
- `SPEC.md` traceability matrix AC-FE02-001 to AC-FE02-018 remains satisfied.
- Reviewer signoff completed for security-sensitive auth code.

## 12. Authentication/OTP UX B7 Status

The frontend hardening slice `FE02-T024` through `FE02-T028` completed automated validation and Nhat's human review before merge. Merge commit `01c66ef` integrated the App Shell and Authentication/OTP UX into `main`.

The first same-commit CI run exposed stale golden-path assumptions. Commit `232ee4c` aligned the E2E password locator, `/home` login destination, and browser clock with the approved UX/runtime contracts. Final `main` commit `6eee459` passed GitHub Actions CI run `29358045198`.

Detailed evidence is recorded in `.sdd/reviews/library-ux-b7-integration-closeout-2026-07-15.md`. This closes the approved Authentication/OTP UX hardening slice. The separate FE02/FE10 delivery implementation, human acceptance, PR #42-#44 integration, and exact post-merge `main` CI are complete and recorded in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.

## 13. FE02/FE10 OTP Delivery Follow-up

ADR-004 and Nhat's 2026-07-15 approval authorize the following ordered implementation slice:

1. Add failing FE10 boundary tests proving staff HTTP and non-FE02 requesters cannot submit `ACCOUNT_VERIFICATION` or `PASSWORD_RESET`.
2. Add failing FE10 OTP tests proving the FE02-bound requester accepts `otp`, `expiresInMinutes`, and `AuthToken` source metadata while no OTP crosses persistence/log/audit/response boundaries.
3. Update FE10 templates/provider wiring and source/type policy with the smallest implementation that passes the focused tests.
4. Add failing FE02 tests proving verification/reset sends use one FE10 requester call, token-ID idempotency, no direct notification write, and no direct duplicate email.
5. Migrate only verification/reset delivery in `authService`; retain direct `CHANGE_PASSWORD_OTP` email and legacy token acceptance.
6. Verify non-blocking FE10 failure, new-token resend semantics, focused FE02/FE10 tests, affected integration tests, traceability, and `git diff --check`.

## 14. FE02/FE11 Account Setup Follow-up

1. Add failing tests proving FE02 accepts only valid FE11 `ACCOUNT_SETUP` credentials for inactive admin-created accounts.
2. Prove setup completion atomically updates password, `EmailVerifiedAt`, lock fields, `Status`, token usage/revocation, and audit.
3. Prove password-reset credentials cannot activate ordinary inactive accounts.
4. Preserve the existing `/api/auth/reset-password` compatibility shape while separating reset and setup business branches.
5. Validate expired, used, revoked, ineligible, and concurrent setup attempts without partial persistence.

## 15. Verification OTP 15-Minute Follow-up

1. Add RED registration/resend and environment-configuration tests for an exact 15-minute verification OTP lifetime.
2. Introduce canonical `EMAIL_VERIFICATION_TTL_MINUTES=15` with temporary legacy-hour fallback.
3. Keep FE02 credential ownership and FE10 rendering/delivery ownership unchanged.
4. Validate focused and full backend tests, traceability, secret/leakage checks, and Azure staging email evidence before integration.
