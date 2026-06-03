# SPEC.md - FE02 Authentication

# Version: 0.1.0

# Status: DRAFT

# Owner: Dat

# Last Updated: 2026-06-03

# Feature ID: FE02

# Feature folder: `.sdd/specs/feat-authentication/`

> Source of truth for FE02 Authentication. This spec is a draft and must be reviewed before implementation. It is intentionally detailed because FE02 is the foundation of all access control and security in the system.

---

## 1. Feature Overview

### 1.1 Feature Name

Authentication

### 1.2 Business Context

Authentication is the mechanism by which the Library Management System verifies user identity and establishes secure sessions for controlled access. Every user (Guest, Member, Librarian, Admin) must authenticate to gain access to protected features.

This feature is core because compromised authentication can expose sensitive data, allow unauthorized borrowing, prevent legitimate users from accessing the system, and create audit liability.

### 1.3 Goal / Outcome

The system shall:

- Allow users to register accounts with email verification.
- Allow users to login with email/username and password.
- Establish secure sessions/tokens for authenticated requests.
- Allow users to change their password securely.
- Allow users to reset forgotten passwords via email.
- Invalidate sessions when users logout.
- Validate authentication on every protected request.
- Maintain audit logs of all authentication events.

### 1.4 Scope Level

- [x] Full Spec - core business logic, high risk, must be correct from the beginning
- [ ] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Guest | Unauthenticated visitor | Can register, login, and request password reset. Cannot access member/librarian/admin features. |
| Member | Registered authenticated user with member role | Can login, logout, change password, view profile. Access member features (borrow, reserve, etc.). |
| Librarian | Authenticated user with librarian role | Can login, logout, change password. Access librarian features (approve borrows, process returns, etc.). |
| Admin | Authenticated user with admin role | Can login, logout, change password. Access all admin features. |
| Email Service | External service | Receives password reset and account verification token requests and delivers them to user email addresses. |
| Audit Logger | System component | Records all authentication events (login attempt, success, failure, logout, password change, password reset). |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE02-001: The database has Users, Roles, UserRoles, and AuditLogs tables.
- PRE-FE02-002: Email service is available or can be mocked for development.
- PRE-FE02-003: Password hashing library (bcrypt) is available in the tech stack.
- PRE-FE02-004: Session/token management strategy is approved (JWT or session cookies).
- PRE-FE02-005: HTTPS is enforced or can be enforced in the deployment environment.
- PRE-FE02-006: Team has resolved password policy (length, complexity) and session timeout values.

---

## 4. Main Flows

### MF-FE02-001: User Registration

1. Guest accesses the registration form.
2. Guest enters email, password, confirm password, and optional full name/phone.
3. The system validates input and checks for duplicate email.
4. The system hashes the password with bcrypt.
5. The system creates a user record with status `INACTIVE`.
6. The system generates a verification token with expiration (e.g., 24 hours).
7. The system sends verification email to the user's email address.
8. The system shows success message and asks user to check email.

### MF-FE02-002: Email Verification (Registration)

1. User clicks the verification link in the email (includes verification token).
2. The system validates the token (format, expiration, matches user record).
3. If valid, the system sets user status to `ACTIVE`.
4. The system invalidates the verification token.
5. The system shows success message and redirects to login.

### MF-FE02-003: User Login

1. User (authenticated or unauthenticated) accesses the login form.
2. User enters email/username and password.
3. The system looks up the user by email/username.
4. The system verifies the password against the stored hash.
5. The system checks user status (must be `ACTIVE`, not `INACTIVE`, `LOCKED`, `DELETED`).
6. If valid, the system creates a session/token with expiration.
7. The system stores or returns the session/token to the client.
8. The system writes an audit log: login success.
9. The system redirects user to the home page or member dashboard.

### MF-FE02-004: Failed Login Attempt

1. User enters invalid credentials.
2. The system verifies the password and detects mismatch.
3. The system increments failed login counter for the user.
4. If failed counter exceeds threshold (e.g., 5 attempts), the system locks the account.
5. The system returns generic error message (not revealing user existence).
6. The system writes an audit log: login failed, reason.

### MF-FE02-005: User Logout

1. Authenticated user requests logout (clicks logout button or API call).
2. The system invalidates the session/token.
3. The system clears session/token from client (cookie deletion or local storage clear).
4. The system writes an audit log: logout.
5. The system redirects to login page or home page.

### MF-FE02-006: Change Password

1. Authenticated user accesses change password form.
2. User enters current password and new password (twice).
3. The system verifies current password against user's stored hash.
4. The system validates new password meets complexity requirements.
5. The system hashes the new password.
6. The system updates the user's password in the database.
7. The system optionally invalidates all other active sessions for the user.
8. The system writes an audit log: password changed.
9. The system shows success message.

### MF-FE02-007: Forgot Password Request

1. Unauthenticated user accesses forgot password form.
2. User enters their email address.
3. The system looks up the user by email.
4. The system generates a password reset token with expiration (e.g., 1 hour).
5. The system stores the reset token in the database.
6. The system sends password reset email with token link.
7. The system shows success message (regardless of whether email found or not, to prevent user enumeration).

### MF-FE02-008: Reset Password

1. User clicks the password reset link in email (includes reset token).
2. The system validates the reset token (format, expiration, matches user record).
3. If valid, the system shows password reset form.
4. User enters new password (twice).
5. The system validates new password meets complexity requirements.
6. The system hashes the new password.
7. The system updates the user's password.
8. The system invalidates the reset token.
9. The system writes an audit log: password reset.
10. The system shows success message and redirects to login.

### MF-FE02-009: Validate Session/Token (Per-Request)

1. Client sends a protected API request with session/token in header/cookie.
2. The system extracts and validates the session/token.
3. The system checks expiration, format, and signature (if JWT).
4. If valid, the system identifies the user and allows the request to proceed.
5. If invalid or expired, the system returns 401 Unauthorized and asks user to login again.

---

## 5. Alternative Flows

### AF-FE02-001: User Email Already Registered

1. Guest submits registration form with email already in use.
2. The system detects duplicate email.
3. The system returns error: "Email is already registered. Please login or use forgot password."

### AF-FE02-002: Password Verification Link Expired

1. User clicks verification link from old email.
2. The system detects token is expired or invalid.
3. The system returns error: "Verification link expired. Request a new one."
4. The system may offer option to resend verification email.

### AF-FE02-003: Account Locked Due to Too Many Failed Logins

1. User makes too many failed login attempts.
2. The system locks the account automatically.
3. The system returns error: "Account is locked due to too many failed attempts. Please reset your password or contact support."
4. Account can be unlocked by: successful password reset, admin unlock, or automatic unlock after N hours.

### AF-FE02-004: Session Expired During User Activity

1. User's session/token expires while user is using the system.
2. Client makes a request with expired token.
3. The system returns 401 Unauthorized.
4. The client redirects user to login page with message: "Your session expired. Please login again."

### AF-FE02-005: Reset Token Already Used

1. User successfully resets password using a token.
2. Same reset token is used again by another party (or in a cached link).
3. The system detects the token is already used and invalid.
4. The system returns error: "This reset link is no longer valid. Request a new one."

### AF-FE02-006: New Password Matches Old Password

1. User attempts to change password to the same password as before (or a recently used password).
2. The system detects password reuse.
3. The system returns error: "New password must be different from current password. Do not reuse recent passwords."

### AF-FE02-007: Password Does Not Meet Complexity Requirements

1. User enters a password that is too weak (e.g., too short, no uppercase/number).
2. The system returns error: "Password must be at least [N] characters and contain uppercase, lowercase, and number."

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE02-001: A guest must provide valid email, password, and confirmations to register.
- BR-FE02-002: A guest cannot access member/librarian/admin features without logging in.
- BR-FE02-003: A user can only be created in the registration flow; users cannot be created by other actors in this feature.
- BR-FE02-004: A registered user account must be verified via email before being activated.
- BR-FE02-005: A user password must be hashed with bcrypt (cost ≥ 10) before storage.
- BR-FE02-006: A user password verification must compare plaintext input against the stored hash, not store or transmit plaintext.
- BR-FE02-007: Login must not reveal whether a user email is registered (prevent user enumeration).
- BR-FE02-008: Failed login attempts must be tracked and rate-limited (e.g., max 5 attempts before account lock).
- BR-FE02-009: Failed login must trigger account lock after threshold reached.
- BR-FE02-010: A session/token must have an expiration time (e.g., 8 hours for web, 30 days for mobile with refresh).
- BR-FE02-011: A session/token must be invalidated on logout.
- BR-FE02-012: Every protected request must validate the session/token before processing.
- BR-FE02-013: Password reset must require email verification to prevent reset attacks.
- BR-FE02-014: Password reset tokens must expire quickly (e.g., 1 hour).
- BR-FE02-015: A user's role(s) are determined by `UserRoles` table and may be cached but must be verified on sensitive operations.
- BR-FE02-016: Every authentication event (login attempt, success, failure, logout, password change/reset) must be auditable.
- BR-FE02-017: HTTPS must be enforced for login/password/token transmission; plain HTTP is forbidden.
- BR-FE02-018: A user may change their password only if authenticated.
- BR-FE02-019: A password change must require entry of the current password for verification.

---

## 7. Functional Requirements

- FR-FE02-001: When a guest submits valid registration data, the system shall create a new user with `INACTIVE` status.
- FR-FE02-002: When a user is registered, the system shall send a verification email with a time-limited token.
- FR-FE02-003: When a user clicks a valid verification link, the system shall activate the user account and invalidate the token.
- FR-FE02-004: When a user submits login form with valid credentials and active account, the system shall create a session/token and return it to the client.
- FR-FE02-005: When a user submits login form with invalid email or password, the system shall reject the request and not reveal whether the email exists.
- FR-FE02-006: When a user exceeds failed login attempts threshold, the system shall lock the account.
- FR-FE02-007: When a user requests logout, the system shall invalidate the session/token immediately.
- FR-FE02-008: When a user makes a protected request, the system shall validate the session/token before allowing the request.
- FR-FE02-009: When a session/token expires, the system shall return 401 Unauthorized for subsequent requests using that token.
- FR-FE02-010: When an authenticated user submits change password form, the system shall verify current password and update to new password.
- FR-FE02-011: When a guest submits forgot password form, the system shall send a password reset email with a time-limited token.
- FR-FE02-012: When a user clicks a valid password reset link and submits new password, the system shall update the password and invalidate the token.
- FR-FE02-013: When a user's account is created, the system shall assign default role(s) based on user type (member, librarian, admin).
- FR-FE02-014: When checking user permissions, the system shall retrieve roles from `UserRoles` table.

---

## 8. Acceptance Criteria

- AC-FE02-001: Given valid registration data and unique email, when a guest registers, then the system creates an inactive user and sends verification email.
- AC-FE02-002: Given a valid verification token in email link, when user clicks it, then the account is activated and user can login.
- AC-FE02-003: Given an expired verification token, when user clicks the link, then the system rejects it and offers to resend.
- AC-FE02-004: Given valid email and password and active account, when user logs in, then the system returns a valid session/token.
- AC-FE02-005: Given invalid email, when user logs in, then the system returns error without revealing email existence.
- AC-FE02-006: Given valid email but invalid password, when user logs in, then the system returns error and increments failed attempt counter.
- AC-FE02-007: Given inactive account, when user logs in, then the system rejects login.
- AC-FE02-008: Given locked account, when user logs in, then the system rejects login with account lock message.
- AC-FE02-009: Given valid session/token, when user makes a protected request, then the request is allowed.
- AC-FE02-010: Given expired session/token, when user makes a protected request, then the system returns 401 Unauthorized.
- AC-FE02-011: Given authenticated user, when user logs out, then the session/token is invalidated.
- AC-FE02-012: Given authenticated user with correct current password, when user changes password, then the system updates password and returns success.
- AC-FE02-013: Given authenticated user with incorrect current password, when user changes password, then the system rejects the change.
- AC-FE02-014: Given valid registered email, when user requests password reset, then the system sends reset email.
- AC-FE02-015: Given invalid registered email, when user requests password reset, then the system returns success message (no user enumeration).
- AC-FE02-016: Given valid reset token, when user submits new password, then the system updates password and invalidates token.
- AC-FE02-017: Given expired reset token, when user submits new password, then the system rejects the request.
- AC-FE02-018: Given reset token used once, when same token is reused, then the system rejects the request.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE02-001 | Registration with SQL injection payload in email | Sanitize input and reject as invalid email format. |
| EC-FE02-002 | Registration with very long password (>1000 chars) | Set reasonable max length (e.g., 255) and reject. |
| EC-FE02-003 | Duplicate registration attempt with same email within seconds | Reject with "Email already registered" message. |
| EC-FE02-004 | User registration with email containing spaces or special chars | Validate email format strictly. |
| EC-FE02-005 | Login attempt with SQL injection in username field | Use parameterized queries; reject as invalid. |
| EC-FE02-006 | User locks their own account by exceeding failed login attempts | Provide password reset or contact admin to unlock. |
| EC-FE02-007 | Multiple password reset requests from same user in quick succession | Invalidate previous token, allow new reset request. |
| EC-FE02-008 | User changes password while having active sessions | Optionally invalidate all other sessions and keep current one. |
| EC-FE02-009 | Verification email not delivered (mail service down) | User can request resend verification email. |
| EC-FE02-010 | Password hash update fails in database | Roll back transaction; return error to user. |
| EC-FE02-011 | Token generation library fails | Return 500 error; log incident; offer user to try again. |
| EC-FE02-012 | User claims email was compromised; requests immediate logout all sessions | Admin can manually invalidate all tokens for the user. |
| EC-FE02-013 | Concurrent login attempts from same user | Allow both; user will have multiple active tokens (or invalidate old ones based on strategy). |
| EC-FE02-014 | Client sends malformed JWT token | Return 401 Unauthorized. |
| EC-FE02-015 | Clock skew between server and client token validation | Use reasonable time skew tolerance (e.g., 30 seconds). |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Stores user account, email, password hash, status, and metadata. |
| Roles | Defines role names (Member, Librarian, Admin) and descriptions. |
| UserRoles | Maps users to roles. |
| Sessions (optional) | Stores active session records if using session cookies. |
| VerificationTokens (optional) | Stores email verification tokens with expiration. |
| PasswordResetTokens (optional) | Stores password reset tokens with expiration. |
| LoginAttempts (optional) | Tracks failed login attempts for rate limiting. |
| AuditLogs | Records all authentication events. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| userId | integer | Yes | Primary key. |
| email | string | Yes | Unique, valid email format, max 255 chars. |
| username | string | No | Optional alternative login field. |
| passwordHash | string | Yes | bcrypt hash, never store plaintext. |
| fullName | string | No | User's display name. |
| phoneNumber | string | No | User's phone number. |
| address | string | No | User's address. |
| status | enum | Yes | Values: `ACTIVE`, `INACTIVE`, `LOCKED`, `DELETED`. |
| createdAt | datetime | Yes | Account creation timestamp. |
| updatedAt | datetime | Yes | Last update timestamp. |
| lastLoginAt | datetime | No | Last successful login timestamp (for audit). |
| failedLoginCount | integer | No | Counter for failed login attempts. |
| lockedUntil | datetime | No | Timestamp when account will auto-unlock. |
| sessionToken | string | No | Current session token (for session cookie strategy). |
| tokenExpiresAt | datetime | No | Session/token expiration timestamp. |
| verificationToken | string | No | Email verification token. |
| verificationTokenExpiresAt | datetime | No | Verification token expiration. |
| resetToken | string | No | Password reset token. |
| resetTokenExpiresAt | datetime | No | Password reset token expiration. |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract must be copied into `docs/api/api-contract.md` before implementation.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/auth/register` | Guest | `{ email: string, password: string, fullName?: string, phoneNumber?: string }` | `{ userId: number, email: string, message: "Verification email sent" }` | Sends verification email. |
| POST | `/api/auth/verify-email` | Guest | `{ token: string }` | `{ message: "Account verified. You can now login." }` | Validates and uses verification token. |
| POST | `/api/auth/resend-verification` | Guest | `{ email: string }` | `{ message: "Verification email sent" }` | Resends verification email. |
| POST | `/api/auth/login` | Guest | `{ email: string, password: string }` | `{ userId: number, token?: string, sessionId?: string, expiresIn: number }` | Returns token or sets session cookie. |
| POST | `/api/auth/logout` | Authenticated | `{}` | `{ message: "Logged out" }` | Invalidates session/token. |
| POST | `/api/auth/refresh-token` | Authenticated | `{ token: string }` | `{ token: string, expiresIn: number }` | Refreshes expired token (if using JWT). |
| POST | `/api/auth/change-password` | Authenticated | `{ currentPassword: string, newPassword: string }` | `{ message: "Password changed" }` | Requires current password verification. |
| POST | `/api/auth/forgot-password` | Guest | `{ email: string }` | `{ message: "Password reset email sent" }` | Sends reset email; no user enumeration. |
| POST | `/api/auth/reset-password` | Guest | `{ token: string, newPassword: string }` | `{ message: "Password reset. You can now login." }` | Validates token and updates password. |
| POST | `/api/auth/verify-session` | Authenticated | `{}` | `{ valid: boolean, userId: number, roles: string[] }` | Checks if session/token is still valid. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE02-SEC-001: All passwords must be hashed using bcrypt with cost factor ≥ 10.
- NFR-FE02-SEC-002: Plaintext passwords must never be logged, stored, or transmitted except over HTTPS.
- NFR-FE02-SEC-003: HTTPS must be enforced for all authentication endpoints; HTTP requests must be redirected or rejected.
- NFR-FE02-SEC-004: Session/token must expire after configured timeout (e.g., 8 hours for web, 30 days for mobile with refresh).
- NFR-FE02-SEC-005: Failed login attempts must be rate-limited (e.g., max 5 attempts per 15 minutes per IP/user).
- NFR-FE02-SEC-006: Account lockout mechanism must exist after threshold exceeded.
- NFR-FE02-SEC-007: Verification and reset tokens must be cryptographically secure (high entropy).
- NFR-FE02-SEC-008: Tokens must expire quickly (verification: 24 hours, reset: 1 hour).
- NFR-FE02-SEC-009: Password reset must require email verification; old password verification alone is insufficient.
- NFR-FE02-SEC-010: Login responses must not reveal whether email is registered (prevent user enumeration).
- NFR-FE02-SEC-011: All inputs (email, password, token) must be validated and sanitized on the server.
- NFR-FE02-SEC-012: SQL injection must be prevented using parameterized queries.
- NFR-FE02-SEC-013: Cross-site request forgery (CSRF) protection must be implemented if using session cookies.
- NFR-FE02-SEC-014: Cross-site scripting (XSS) must be prevented by escaping output and setting secure headers.

### 12.2 Transaction Integrity

- NFR-FE02-TXN-001: User creation and verification token generation must be atomic.
- NFR-FE02-TXN-002: Login and session/token creation must be atomic.
- NFR-FE02-TXN-003: Password change and audit log write must be atomic.
- NFR-FE02-TXN-004: Password reset and token invalidation must be atomic.

### 12.3 Performance

- NFR-FE02-PERF-001: Login response time should be < 1 second for valid credentials.
- NFR-FE02-PERF-002: Email verification should not be a bottleneck; can be asynchronous.
- NFR-FE02-PERF-003: Password hashing (bcrypt) is intentionally slow; expect 100-200ms per hash.
- NFR-FE02-PERF-004: Session/token validation should be < 50ms for typical requests.

### 12.4 Logging and Audit

- NFR-FE02-LOG-001: Every login attempt (success and failure) must be logged with timestamp, email/username, IP address, and reason.
- NFR-FE02-LOG-002: Every logout must be logged.
- NFR-FE02-LOG-003: Every password change must be logged.
- NFR-FE02-LOG-004: Every password reset must be logged.
- NFR-FE02-LOG-005: Account lockout events must be logged.
- NFR-FE02-LOG-006: Failed token validations on protected endpoints must be logged (in debug mode only, not production).

### 12.5 Usability

- NFR-FE02-UX-001: Error messages must be clear but not reveal sensitive details (e.g., "Invalid email or password", not "Email not found").
- NFR-FE02-UX-002: Registration and login forms must provide password strength indicators.
- NFR-FE02-UX-003: Verification email must have clear call-to-action button and link.
- NFR-FE02-UX-004: Password reset email must have clear call-to-action button and link.

---

## 13. Out of Scope

This feature does not include:

- FE03 User Profile management (name, address, phone updates).
- FE11 User & Role Management admin interface (creating users, changing roles).
- Multi-factor authentication (MFA, 2FA, TOTP).
- OAuth 2.0 or OpenID Connect integration.
- LDAP/Active Directory integration.
- Social login (Google, Facebook, etc.).
- Biometric authentication (fingerprint, face recognition).
- Single sign-on (SSO) across multiple systems.
- Real payment gateway integration.
- Hardware token (RSA, YubiKey) support.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE03 User Profile | Internal | After authentication, users manage profile in FE03. |
| FE10 Notification Management | Internal | FE10 sends verification and password reset emails. |
| FE11 User & Role Management | Internal | Provides role information for permission checks. |
| SQL Server database | Technical | Stores Users, Roles, UserRoles, and AuditLogs tables. |
| Email Service | Technical | Must deliver verification and reset tokens. Sendgrid, AWS SES, or mail server. |
| bcrypt library | Technical | Node.js bcrypt or equivalent for password hashing. |
| JWT library | Technical | jsonwebtoken or equivalent if using JWT strategy. |

---

## 15. Open Questions

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE02-001 | What is the minimum password length and complexity requirement? (e.g., 8 chars, at least 1 uppercase, 1 number) | Team/Teacher | Open |
| Q-FE02-002 | What is the session timeout duration? (e.g., 30 minutes, 8 hours, 7 days) | Team/Teacher | Open |
| Q-FE02-003 | Should system enforce email verification during registration, or optional? | Team/Teacher | Open |
| Q-FE02-004 | Should system allow multiple concurrent sessions per user, or invalidate old sessions on new login? | Team/Teacher | Open |
| Q-FE02-005 | Should failed login attempts be rate-limited? If yes, how many attempts before lockout? (e.g., 5 in 15 min) | Team/Teacher | Open |
| Q-FE02-006 | What is the expiration time for password reset tokens? (e.g., 30 minutes, 1 hour, 24 hours) | Team/Teacher | Open |
| Q-FE02-007 | Should system log password change attempts and login failures for audit? How long to keep logs? | Team/Teacher | Open |
| Q-FE02-008 | Should inactive users (no login for N days) be auto-locked? If yes, what is the threshold? | Team/Teacher | Open |
| Q-FE02-009 | Session management strategy: JWT tokens, session cookies, or refresh tokens (JWT + refresh)? | Team/DB owner | Open |
| Q-FE02-010 | Should password reset require email verification only, or also require security questions / recovery codes? | Team/Teacher | Open |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE02-001 | UC01 | FT01, FT02 | Not Started |
| BR-FE02-005 | UC01, UC02 | FT01, FT03 | Not Started |
| BR-FE02-007 | UC02 | FT03, FT04 | Not Started |
| BR-FE02-008 | UC02 | FT03, FT04 | Not Started |
| BR-FE02-010 | UC02, UC03 | FT03, FT05 | Not Started |
| BR-FE02-012 | (All protected features) | (All protected tests) | Not Started |
| BR-FE02-014 | UC05, UC06 | FT07, FT08 | Not Started |
| BR-FE02-016 | (All flows) | (All tests) | Not Started |
| FR-FE02-001 | UC01 | FT01 | Not Started |
| FR-FE02-004 | UC02 | FT03 | Not Started |
| FR-FE02-007 | UC03 | FT05 | Not Started |
| FR-FE02-010 | UC04 | FT06 | Not Started |
| FR-FE02-011 | UC05 | FT07 | Not Started |
| FR-FE02-012 | UC06 | FT08 | Not Started |

---

## 17. Review Checklist

Before this SPEC.md is approved:

- [ ] Open questions Q-FE02-001 to Q-FE02-010 are resolved or explicitly accepted as TBD.
- [ ] Password policy (length, complexity) is approved.
- [ ] Session timeout duration is approved.
- [ ] Session management strategy (JWT vs cookies vs refresh tokens) is confirmed.
- [ ] Database schema for Users, Roles, UserRoles, token storage is confirmed.
- [ ] Email service integration approach is confirmed.
- [ ] API contract is copied to `docs/api/api-contract.md`.
- [ ] FE03, FE10, FE11 dependencies are checked for conflicts.
- [ ] Every acceptance criterion can become a test.
- [ ] Security requirements are reviewed and approved by security/architect.
- [ ] Bcrypt cost factor and token generation randomness are specified.
