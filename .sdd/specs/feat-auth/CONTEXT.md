# CONTEXT.md - FE02 Authentication

# Version: 0.2.3

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Dat

# Last Updated: 2026-07-23

# Feature folder: `.sdd/specs/feat-auth/`

---

## 1. Feature Purpose

Authentication exists to verify the identity of users accessing the library system and establish secure sessions for controlled access.

This feature must keep three things consistent:

- User identity verification through credentials.
- Active session state and token validity.
- Audit logs of authentication events for security and compliance.

Because authentication is the foundation of all access control and security in the system, this feature is treated as a Full Spec feature.

### 1.1 Security and Consistency Outcomes

These are target outcomes, not evidence that the current implementation already satisfies them. Detailed business rules, functional requirements, acceptance criteria, and intentional Phase 1 limitations remain authoritative in `SPEC.md`.

- Passwords are never stored or logged in plaintext. Stored passwords use bcrypt with cost factor at least 10, and production configuration must not reduce that approved cost.
- Verification and password-reset OTPs are generated with a cryptographically secure random source, contain exactly six digits, expire after 15 minutes, and are stored only as hashes. Raw OTPs must not appear in public responses, persistence, application logs, or audit metadata.
- Access tokens expire after 15 minutes. Refresh/session credentials expire after 7 days, are stored only as hashes, and remain linked to the access tokens issued from them.
- Every protected request validates the access token, current user status, linked refresh/session credential, expiry, and required role before business processing.
- Logout revokes the submitted current refresh/session credential immediately. Multiple concurrent sessions remain allowed in Phase 1; handling of other sessions after password change or reset must follow the explicit `SPEC.md` contract.
- A known account is locked after 5 consecutive failed password attempts within a rolling 15-minute window and remains locked for exactly 30 minutes. IP-wide request limiting is not part of the current Phase 1 baseline unless separately approved.
- Public login, verification resend, and forgot-password responses must avoid revealing whether an account exists or is inactive. Duplicate-registration behavior and its acknowledged enumeration risk follow the approved `SPEC.md`.
- User state, credential state, and required audit state must not be left partially updated. Login/session creation, verification/token consumption, password reset/token consumption, and password change/audit must use the transaction boundaries defined by `SPEC.md`; `ACCOUNT_SETUP` completion is atomic.
- Authentication audit records cover login attempts, successes and failures, lock/unlock events, logout, password-change attempts, password-reset requests and outcomes, verification, and account-setup completion. Audit failure handling must be explicit rather than silently claiming the event was recorded.
- Authentication requests use HTTPS outside local development, validate input on the server, use parameterized SQL, and return safe errors without credentials, raw tokens, stack traces, or provider details.
- FE02 owns verification/reset credential generation, hashing, expiry, revocation, and validation. FE10 owns rendering and delivery; delivery failure must not roll back the completed FE02 source transaction or expose the credential.
- The frontend stores tokens only in the selected approved storage, attaches access tokens to protected requests, refreshes an expired access token at most once per failed request, clears invalid session state, and redirects the user to login consistently when recovery fails.

---

## 2. Real-World Workflow

The typical small/medium library authentication workflow:

1. A user (Guest, Member, Librarian, or Admin) accesses the system.
2. The system presents a login form.
3. The user enters credentials (email/username and password).
4. The system verifies credentials against the user database.
5. If invalid, the system rejects the login and shows error message.
6. If valid, the system creates a session/token and returns it to the client.
7. The client stores access and refresh tokens in `localStorage` or `sessionStorage` according to the selected login persistence; session cookies are out of scope for Phase 1.
8. For subsequent requests, the client includes the session/token in the request header.
9. The system validates the token and allows or denies access based on role.
10. When the user logs out, the system invalidates the session/token.
11. If the user forgets their password, they can request a six-digit reset OTP by email.
12. FE02 generates the time-limited OTP, stores only its hash, and asks FE10 to deliver it through the requester bound to `FE02`.
13. The user enters the reset OTP and sets a new password; legacy password-reset links remain compatible, while canonical FE11 setup links use `ACCOUNT_SETUP`.
14. The system updates the password and invalidates the OTP/token.

---

## 3. Feature Boundary

FE02 includes:

- User self-registration with email verification and exactly the `Member` role; Librarian/Admin account creation belongs to FE11.
- User login with credentials.
- User logout and session termination.
- Password change (authenticated user).
- Forgot password request.
- Password reset via six-digit email OTP, with legacy reset-link compatibility.
- Password setup completion for admin-created FE11 accounts through a hashed, single-use `ACCOUNT_SETUP` token.
- Session/token validation for subsequent requests.
- Session timeout management.

FE02 does not include:

- User account/profile data management. That belongs to FE03.
- User role and permission management. That belongs to FE11.
- Multi-factor authentication (MFA). Out of scope for Phase 1.
- OAuth/SSO integration. Out of scope for Phase 1.
- Account-verification and password-reset notification rendering/delivery. That belongs to FE10; FE02 owns OTP generation/validation and retains direct delivery only for `CHANGE_PASSWORD_OTP` until a separate FE10 type is approved.

---

## 4. Current Data Model Notes

The current SQL script includes:

- `Users(UserId, Username, Email, PasswordHash, Phone, Status, EmailVerifiedAt, FailedLoginCount, LockedUntil, LastLoginAt, CreatedAt, UpdatedAt, DeactivatedAt)`
- `Roles(RoleId, RoleName)`
- `UserRoles(UserId, RoleId, CreatedAt)`
- `AuthTokens(TokenId, UserId, TokenType, TokenHash, ExpiresAt, UsedAt, RevokedAt, CreatedAt, CreatedByIp)`
- `AuditLogs(LogId, UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent, CreatedAt)`
- `UserProfiles(ProfileId, UserId, FullName, Address, DateOfBirth, AvatarUrl, Department, Specialization, CreatedAt, UpdatedAt)` for profile data owned by FE03.

Phase 1 decisions and alignment notes:

- Passwords use bcrypt with cost factor at least 10; plaintext and simple hashes such as MD5 are forbidden.
- Authentication uses JWT access tokens plus database-backed refresh credentials; session cookies are out of scope.
- Email-verification and password-reset OTPs expire after 15 minutes; `ACCOUNT_SETUP` tokens expire after 24 hours.
- A known account locks after 5 consecutive failed password attempts within a rolling 15-minute window and automatically unlocks after 30 minutes. IP-wide login limiting is not implemented in Phase 1.
- Admin-created accounts from FE11 remain `INACTIVE` until FE02 atomically completes password setup and activation.
- FE11 owns setup-token issuance/resend, FE10 owns setup-link delivery, and FE02 owns setup-token consumption/password activation.
- Persisted user statuses are `ACTIVE`, `INACTIVE`, and `LOCKED`; FE11 deactivation is represented by `INACTIVE` plus `DeactivatedAt`.
- Password history is not supported and remains out of scope unless the approved schema and specification are extended.
- Authentication audit records cover login, logout, password change/reset, lockout, verification, and account-setup events without storing raw credentials.
- The repository currently defaults `LOGIN_LOCKOUT_MINUTES` to 15 in configuration, which conflicts with the approved 30-minute lock duration and must be reconciled before implementation compliance is claimed.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC05 | Register Account | Dat |
| UC06 | Login | Dat |
| UC07 | Logout | Dat |
| UC08 | Change Password | Dat |
| UC09 | Forgot Password | Dat |
| UC10 | Reset Password | Dat |

---

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT05 | Register success | Dat |
| FT06 | Login success | Dat |
| FT07 | Login fail | Dat |
| FT08 | Logout success | Dat |
| FT09 | Change password success | Dat |
| FT10 | Forgot password request | Dat |
| FT11 | Reset password success | Dat |

---

## 7. Key Risks

- Weak password hashing allows attackers to crack credentials offline.
- Missing rate limiting on login allows brute force attacks.
- Session tokens not validated on each request allows unauthorized access.
- Session/token expiration not enforced allows account hijacking.
- Password reset token not validated or expired allows unauthorized password changes.
- SQL injection in login queries allows credential bypass.
- Plain text passwords in transit allows credential interception (must use HTTPS).
- Concurrent login attempts can create multiple valid sessions, complicating logout.
- User enumeration via registration endpoint reveals which emails are registered.
- Email verification not enforced during registration allows fake accounts.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE03 User Profile | After authentication, users can manage their profile data. |
| FE10 Notification Management | Renders and delivers FE02 verification/reset OTPs and FE11 account-setup links through requester-bound ownership; staff HTTP cannot submit the sensitive FE02 types. |
| FE11 User & Role Management | Uses role information after authentication and owns admin-created account/setup-token issuance and resend. |
| Database (SQL Server) | Stores user credentials and session state. |
| Email Provider Adapter | FE10 uses the configured provider adapter for verification/reset delivery; FE02 still uses direct email only for `CHANGE_PASSWORD_OTP`. |

---

## 9. Resolved Questions For Team / Teacher

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE02-001 | Password requires at least 8 chars, 1 uppercase, 1 number, and 1 special char. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-002 | Access token expires after 15 minutes; refresh token expires after 7 days. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-003 | Email verification is required. FE02 generates the OTP and FE10 delivers it through a configured provider adapter; tests inject a mock provider. | Review packet 2026-06-10; ADR-004 approval 2026-07-15 | APPROVED |
| Q-FE02-004 | Multiple concurrent sessions are allowed in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-005 | Known accounts lock after 5 consecutive failed password attempts in a rolling 15-minute window; IP-wide login limiting is not implemented; unlock occurs automatically after 30 minutes. | Auth policy normalization 2026-07-17; code alignment 2026-07-19 | APPROVED |
| Q-FE02-006 | Password reset token expires after 15 minutes. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-007 | Password change attempts and failed login attempts are logged. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-008 | Inactive users cannot log in; inactive-user auto-lock job is out of scope for Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-009 | Use JWT access token plus refresh token. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-010 | Password reset requires verified email ownership through a six-digit reset OTP; legacy password-reset tokens remain accepted for compatibility. | Review packet 2026-06-10; OTP alignment 2026-07-14 | APPROVED |
| Q-FE02-013 | Canonical FE11 `ACCOUNT_SETUP` tokens are consumed by FE02; valid completion atomically updates password, email verification, token usage, audit, and `INACTIVE -> ACTIVE`. | Nhat confirmation 2026-07-15; ADR-005 | APPROVED |

---

## 10. Implementation and Maintenance Notes

- The approved Phase 1 implementation baseline is complete; `SPEC.md`, `PLAN.md`, `TASKS.md`, tests, and review evidence determine current delivery status.
- `SPEC.md` remains the FE02 source of truth. Future behavior changes require approved specification and task updates before implementation.
- Passwords must use bcrypt with cost factor at least 10; production tuning must not reduce the approved cost.
- Authentication endpoints must use HTTPS outside local development, and plain HTTP credential/token processing must be rejected or redirected before business processing.
- Every protected endpoint must validate the access token, current user/session state, and required server-side role before processing.
- Known-account lockout follows the approved 5-attempt, rolling 15-minute, 30-minute-lock rule; Phase 1 does not claim IP-wide limiting.
- Authentication events must be recorded in `AuditLogs` without passwords, raw OTPs, raw tokens, or sensitive provider details.
- All SQL access must use parameterized queries.
- FE02 owns verification/reset credential lifecycle, FE10 owns requester-bound rendering/delivery, and direct FE02 delivery remains limited to `CHANGE_PASSWORD_OTP`.
