# ADR-003: Authentication Approach

Status: Approved for Week 4 planning
Date: 2026-06-10

## Context

FE02 Authentication and FE11 User & Role Management are high-risk Core features. They require approved specs, explicit planning, tests, and reviewer signoff before implementation.

Approved FE02 decisions include:

- Password requires at least 8 characters, 1 uppercase letter, 1 number, and 1 special character.
- Access token expires after 15 minutes.
- Refresh token expires after 7 days.
- Password reset token expires after 15 minutes.
- Use JWT access token plus refresh token.
- Multiple concurrent sessions are allowed in Phase 1.
- Inactive users cannot log in.
- Failed login attempts are rate-limited by a simple server-side rule.
- Password change attempts and failed login attempts are logged.

## Decision

Use backend-managed authentication with JWT access tokens and refresh tokens.

### Password Storage

- Hash passwords with `bcrypt`.
- Never store plaintext passwords.
- Never log passwords.
- Bcrypt cost factor should be set through configuration or documented in FE02 planning. Phase 1 default recommendation: 10 or 12, depending on local performance.

### Tokens

| Token | Expiration | Storage | Notes |
| --- | --- | --- | --- |
| Access token | 15 minutes | Client-side memory or storage decided by frontend plan | Sent as `Authorization: Bearer <token>`. |
| Refresh token | 7 days | Server-side record recommended; client storage decided by FE02 plan | Must be invalidated on logout. |
| Password reset token | 15 minutes | Store hashed token where feasible | Raw token appears only in email/reset link, never logs. |
| Account setup token | 24 hours unless FE11/FE02 plan chooses stricter value | Store hashed token where feasible | Used for admin-created accounts. |

### Roles And Authorization

- Roles are flat in Phase 1: Guest, Member, Librarian, Admin.
- Server must enforce authorization through middleware/guards.
- Frontend route guards improve UX only; they are not security controls.
- Sensitive actions must verify role on the server using trusted token claims and/or database checks.

### Auth Endpoints

The detailed API contract remains in FE02 `SPEC.md` until a shared `docs/api/api-contract.md` is created.

Expected endpoint groups:

- Register account
- Verify account/email
- Login
- Refresh token
- Logout
- Change password
- Forgot password
- Reset password
- Current user/session check

### Audit And Safety

The backend must audit:

- Login success/failure
- Logout
- Password change attempt/success/failure
- Password reset request and completion without exposing raw token values
- Account activation/verification
- Admin-created account setup events when implemented through FE11

Error responses must be safe and generic. Login and forgot-password flows must not reveal whether an email exists.

## Implementation Constraints

- Implement only after FE02 `PLAN.md` and `TASKS.md` are approved.
- Use `express-validator` or equivalent boundary validation already approved in dependencies.
- Use `helmet` and safe CORS configuration.
- Do not hardcode admin users, passwords, JWT secrets, or token values.
- JWT secrets and database credentials must come from environment variables.
- Tests are required for password validation, login success/failure, inactive account rejection, logout invalidation, refresh behavior, password reset expiration, and authorization guards.

## Consequences

- FE02 and FE11 must coordinate token setup, user status, role assignment, and password setup emails.
- FE10 may deliver email/mock notifications, but FE02 owns auth token generation and validation.
- FE03 profile access depends on authenticated user context.

## Week 4 Auth Planning Gate

Before writing auth code:

- FE02 `PLAN.md` must list auth flow, endpoint scope, token storage model, database dependencies, and tests.
- FE02 `TASKS.md` must decompose work into validation, repository, service, controller, middleware, tests, and frontend integration tasks.
- FE11 `PLAN.md` must define admin-created account setup dependency on FE02/FE10.
- Database schema must confirm fields/tables for password hashes, refresh tokens, reset/setup tokens, user status, roles, and audit logs.
