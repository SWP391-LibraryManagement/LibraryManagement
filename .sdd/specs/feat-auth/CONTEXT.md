# CONTEXT.md - FE02 Authentication

# Version: 0.1.0

# Status: DRAFT

# Owner: Dat

# Last Updated: 2026-06-10

# Feature folder: `.sdd/specs/feat-auth/`

---

## 1. Feature Purpose

Authentication exists to verify the identity of users accessing the library system and establish secure sessions for controlled access.

This feature must keep three things consistent:

- User identity verification through credentials.
- Active session state and token validity.
- Audit logs of authentication events for security and compliance.

Because authentication is the foundation of all access control and security in the system, this feature is treated as a Full Spec feature.

---

## 2. Real-World Workflow

The typical small/medium library authentication workflow:

1. A user (Guest, Member, Librarian, or Admin) accesses the system.
2. The system presents a login form.
3. The user enters credentials (email/username and password).
4. The system verifies credentials against the user database.
5. If invalid, the system rejects the login and shows error message.
6. If valid, the system creates a session/token and returns it to the client.
7. The client stores the session/token (cookie or local storage).
8. For subsequent requests, the client includes the session/token in the request header.
9. The system validates the token and allows or denies access based on role.
10. When the user logs out, the system invalidates the session/token.
11. If the user forgets their password, they can request a reset link via email.
12. The system generates a time-limited reset token and sends it.
13. The user clicks the reset link, sets a new password, and confirms.
14. The system updates the password and invalidates the reset token.

---

## 3. Feature Boundary

FE02 includes:

- User registration with email verification.
- User login with credentials.
- User logout and session termination.
- Password change (authenticated user).
- Forgot password request.
- Password reset via email link.
- Password setup via email link for admin-created FE11 accounts.
- Session/token validation for subsequent requests.
- Session timeout management.

FE02 does not include:

- User account/profile data management. That belongs to FE03.
- User role and permission management. That belongs to FE11.
- Multi-factor authentication (MFA). Out of scope for Phase 1.
- OAuth/SSO integration. Out of scope for Phase 1.
- Notification sending. That belongs to FE10.

---

## 4. Current Data Model Notes

The current SQL script currently includes:

- `Users(UserId, Username, Email, PasswordHash, Phone, Status, CreatedAt)`
- `Roles(RoleId, RoleName)`
- `UserRoles(UserId, RoleId)`
- `AuditLogs(LogId, UserId, Action, CreatedAt)`
- `UserProfiles(ProfileId, UserId, FullName, Address, DateOfBirth, AvatarUrl)` for profile data owned by FE03.

Potential issues to review:

- Password storage must use bcrypt or similar hashing, not plain text or simple MD5.
- Session/token strategy must be defined: JWT, session cookies, or both?
- Reset/setup token should have expiration time (e.g., reset: 1 hour, admin-created account setup: 24 hours).
- Login attempt rate limiting to prevent brute force attacks.
- Email verification mechanism for registration and password reset.
- Admin-created accounts from FE11 should remain unable to login until password setup is completed.
- User status field (active/inactive/locked) needed to block suspended accounts.
- Password history is not currently supported by the SQL script and should remain out of scope unless the team extends the schema.
- AuditLogs should capture login success/failure, logout, password reset attempts.

These must be resolved before implementation.

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
| FE10 Notification Management | Sends verification emails, password reset links, and login notifications. |
| FE11 User & Role Management | Uses role information to control permissions after authentication. |
| Database (SQL Server) | Stores user credentials and session state. |
| Email Service | Delivers verification and password reset tokens. |

---

## 9. Resolved Questions For Team / Teacher

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE02-001 | Password requires at least 8 chars, 1 uppercase, 1 number, and 1 special char. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-002 | Access token expires after 15 minutes; refresh token expires after 7 days. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-003 | Email verification is required if email/mock provider is available; otherwise it is marked as mock/planned for Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-004 | Multiple concurrent sessions are allowed in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-005 | Failed login attempts are rate-limited with a simple measurable server-side rule. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-006 | Password reset token expires after 15 minutes. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-007 | Password change attempts and failed login attempts are logged. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-008 | Inactive users cannot log in; inactive-user auto-lock job is out of scope for Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-009 | Use JWT access token plus refresh token. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-010 | Password reset requires verified email ownership through reset token only; no extra recovery checks in Phase 1. | Review packet 2026-06-10 | APPROVED |

---

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed and approved.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- All passwords must be hashed with bcrypt (minimum cost factor 10).
- All requests must use HTTPS; plain HTTP login is forbidden.
- Every API endpoint must validate authentication token and validate input on the server.
- Rate limiting must be implemented to prevent brute force attacks on login endpoint.
- All authentication events (login success, failure, logout, password reset) must be logged to AuditLogs.
- Use parameterized queries to prevent SQL injection.
- Session/token validation must happen on every protected endpoint before processing the request.
