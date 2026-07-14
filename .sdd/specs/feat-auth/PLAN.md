# PLAN.md - FE02 Authentication

Status: READY FOR REVIEW
Date: 2026-06-10
Owner: Dat

## 1. Purpose

Implement FE02 Authentication according to the approved `SPEC.md`, ADR-003 Authentication Approach, the revised SQL Server schema, and the Phase 1 API contract.

FE02 is a Core feature. Implementation must be small, testable, and reviewed before merge.

## 2. Source Documents

- `.sdd/specs/feat-auth/SPEC.md`
- `.sdd/rfcs/ADR-003-authentication-approach.md`
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

## 4. Approved Technical Decisions

| Area | Decision |
| --- | --- |
| Password hashing | `bcrypt`; cost factor 10 for Phase 1 unless performance review changes it. |
| Access token | JWT, 15-minute expiry. |
| Refresh token | Random token, stored as hash in `AuthTokens`, 7-day expiry. |
| Email verification credential | Primary flow is a random six-digit OTP, stored as a hash in `AuthTokens`, 24-hour expiry; legacy token links remain accepted. |
| Password reset credential | Primary flow is a random six-digit OTP, stored as a hash in `AuthTokens`, 15-minute expiry; legacy reset/setup tokens remain accepted. |
| Account setup token | Shared storage through `AuthTokens`; FE11 owns admin-created account flow. |
| Roles | Flat roles from `Roles`/`UserRoles`. |
| Email delivery | Mock notification record or safe stub until FE10 service exists. |
| Rate limiting | Simple server-side failed-login counter using `Users.FailedLoginCount` and `Users.LockedUntil`. |

## 5. Database Dependencies

Required tables/fields exist in `database/Librarymanagement.sql` and passed local SQL Server smoke test:

- `Users`: `PasswordHash`, `Status`, `EmailVerifiedAt`, `FailedLoginCount`, `LockedUntil`, `LastLoginAt`.
- `Roles`, `UserRoles`.
- `AuthTokens`: `TokenType`, `TokenHash`, `ExpiresAt`, `UsedAt`, `RevokedAt`.
- `AuditLogs`.
- `NotificationTemplates`, `Notifications`, `NotificationAttempts` for optional/mock notification integration.

## 6. API Endpoints

Implement the FE02 endpoints from `docs/api/api-contract.md`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register account and create verification OTP. |
| POST | `/api/auth/verify-email` | Verify email with OTP/email or legacy token. |
| POST | `/api/auth/resend-verification` | Resend verification OTP safely. |
| POST | `/api/auth/login` | Login and return access/refresh tokens. |
| POST | `/api/auth/refresh-token` | Exchange refresh token for new access token. |
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
backend/src/repositories/notificationRepository.js
backend/src/middleware/authMiddleware.js
backend/src/middleware/errorHandler.js
backend/src/validators/authValidators.js
backend/src/utils/passwordPolicy.js
backend/src/utils/tokenUtils.js
backend/src/utils/safeErrors.js
```

Existing placeholder files under `backend/src/Controller/Authentication` and `backend/src/Service/...` may either be migrated into the new architecture or kept as compatibility stubs, but new implementation should follow ADR-001 folder structure.

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

Detailed evidence is recorded in `.sdd/reviews/library-ux-b7-integration-closeout-2026-07-15.md`. This closes only the approved Authentication/OTP UX hardening slice; the overall FE02 plan remains `READY FOR REVIEW` until the Core feature's full completion criteria are closed.
