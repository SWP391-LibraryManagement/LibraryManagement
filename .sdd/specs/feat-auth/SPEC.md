# SPEC.md - FE02 Authentication

# Version: 0.6.0

# Status: READY FOR REVIEW - OTP AND ACCOUNT SETUP REVISION

# Owner: Dat

# Last Updated: 2026-07-15

# Feature ID: FE02

# Feature folder: `.sdd/specs/feat-auth/`

> Source of truth for FE02 Authentication. This spec is approved for Phase 2 planning. It is intentionally detailed because FE02 is the foundation of all access control and security in the system.
>
> Decisions in this spec were reviewed and approved on 2026-06-10. See `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
>
> The FE02/FE10 OTP revision and FE02/FE10/FE11 account-setup revision require final human review before implementation. See ADR-004 and ADR-005.

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
| FE10 Notification Management | Internal dependency | Receives account-verification and password-reset OTP requests only through the requester bound to `FE02`, then renders, delivers, and records safe status/attempt metadata. |
| Email Provider | External or mocked service | FE10 uses the configured provider adapter for verification/reset delivery; FE02 uses direct delivery only for `CHANGE_PASSWORD_OTP`. |
| Audit Logger | System component | Records all authentication events (login attempt, success, failure, logout, password change, password reset). |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE02-001: The database has Users, Roles, UserRoles, and AuditLogs tables.
- PRE-FE02-002: FE10's configured email-provider adapter is available or an injected mock is used for development/tests.
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
6. The system generates a six-digit email verification OTP with 24-hour expiration and stores only its hash.
7. FE02 requests verification OTP delivery exactly once through the FE10 requester bound to `FE02`, using the persisted `AuthTokens.TokenId` for source traceability and idempotency.
8. The system shows the OTP verification step and asks the user to check their inbox.

### MF-FE02-002: Email Verification (Registration)

1. User enters the six-digit verification OTP together with the registered email. Legacy verification-link tokens remain accepted for compatibility.
2. The system validates the OTP or legacy token (format, expiration, matches user record).
3. If valid, the system sets user status to `ACTIVE`.
4. The system invalidates the OTP/token.
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
4. The system generates a six-digit password reset OTP with 15-minute expiration.
5. The system stores only the OTP hash in the database.
6. FE02 requests password-reset OTP delivery exactly once through the FE10 requester bound to `FE02`, using the persisted `AuthTokens.TokenId` for source traceability and idempotency.
7. The system shows success message (regardless of whether email found or not, to prevent user enumeration).

### MF-FE02-008: Reset Password

1. User enters the six-digit reset OTP together with the requested email. Legacy password-reset tokens remain accepted for compatibility.
2. The system validates the OTP or legacy token (format, expiration, matches user record).
3. If valid, the system shows password reset form.
4. User enters new password (twice).
5. The system validates new password meets complexity requirements.
6. The system hashes the new password.
7. The system updates the user's password.
8. The system invalidates the reset OTP/token.
9. The system writes an audit log: password reset.
10. The system shows success message and redirects to login.

### MF-FE02-009: Validate Session/Token (Per-Request)

1. Client sends a protected API request with session/token in header/cookie.
2. The system extracts and validates the session/token.
3. The system checks expiration, format, and signature (if JWT).
4. If valid, the system identifies the user and allows the request to proceed.
5. If invalid or expired, the system returns 401 Unauthorized and asks user to login again.

### MF-FE02-010: Complete Admin-Created Account Setup

1. User opens the FE11 setup link and submits the opaque `ACCOUNT_SETUP` token with a new password and confirmation.
2. FE02 hashes the submitted token and loads an active, unused, unrevoked `ACCOUNT_SETUP` record.
3. FE02 confirms the token is unexpired, belongs to an `INACTIVE` admin-created account, and the account has not completed setup.
4. FE02 validates the new password using the approved FE02 password policy.
5. In one transaction, FE02 stores the bcrypt password hash, sets `EmailVerifiedAt` when absent, resets failed-login lock fields, changes status to `ACTIVE`, marks the setup token used, revokes any other active setup tokens, and writes the setup-completion audit event.
6. The system returns a safe success response and directs the user to login.

---

## 5. Alternative Flows

### AF-FE02-001: User Email Already Registered

1. Guest submits registration form with email already in use.
2. The system detects duplicate email.
3. The system returns error: "Email is already registered. Please login or use forgot password."

### AF-FE02-002: Email Verification Credential Expired

1. User submits an old verification OTP or legacy verification link.
2. The system detects the OTP/token is expired or invalid.
3. The system returns a safe expiry message and offers a new OTP.
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

### AF-FE02-005: Reset Credential Already Used

1. User successfully resets password using an OTP or legacy token.
2. The same reset credential is used again.
3. The system detects the OTP/token is already used and invalid.
4. The system returns a safe invalid-code message and offers a new reset OTP.

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
- BR-FE02-005: A user password must be hashed with bcrypt (cost â‰¥ 10) before storage.
- BR-FE02-006: A user password verification must compare plaintext input against the stored hash, not store or transmit plaintext.
- BR-FE02-007: Login must not reveal whether a user email is registered (prevent user enumeration).
- BR-FE02-008: Failed login attempts must be tracked and rate-limited (e.g., max 5 attempts before account lock).
- BR-FE02-009: Failed login must trigger account lock after threshold reached.
- BR-FE02-010: JWT access tokens expire after 15 minutes and refresh tokens expire after 7 days.
- BR-FE02-011: A session/token must be invalidated on logout.
- BR-FE02-012: Every protected request must validate the session/token before processing.
- BR-FE02-013: Password reset and account setup must prove email ownership through the purpose-specific credential.
- BR-FE02-014: Password reset tokens expire after 15 minutes. Admin-created account setup tokens expire after 24 hours unless FE11 chooses a shorter setup flow.
- BR-FE02-015: A user's role(s) are determined by `UserRoles` table and may be cached but must be verified on sensitive operations.
- BR-FE02-016: Every authentication event (login attempt, success, failure, logout, password change/reset) must be auditable.
- BR-FE02-017: HTTPS must be enforced for login/password/token transmission; plain HTTP is forbidden.
- BR-FE02-018: A user may change their password only if authenticated.
- BR-FE02-019: A password change must require entry of the current password for verification.
- BR-FE02-020: FE02 must use the FE10 requester bound to `FE02` as the single notification delivery boundary for account-verification and password-reset OTPs; FE02 must not also create a notification record, send either email directly, or return either OTP in public/test HTTP response fields.
- BR-FE02-021: Each verification/reset OTP delivery request must reference the persisted `AuthTokens.TokenId` as `sourceEntityId` and derive its idempotency key from notification type plus token ID, never from the OTP. A resend creates a new token ID and a new notification event/key.
- BR-FE02-022: FE10 delivery failure must not roll back user creation, OTP creation, or the generic forgot-password response. FE02 must allow the approved resend flow to issue a new OTP event.
- BR-FE02-023: FE02 owns consumption, not issuance or delivery, of FE11 `ACCOUNT_SETUP` tokens. FE11 creates/rotates the token and FE10 delivers the setup link through the requester bound to `FE11`.
- BR-FE02-024: Successful account setup must atomically update the password hash, email verification timestamp, lock fields, `INACTIVE -> ACTIVE` status, setup-token usage/revocation, and auth audit entry.
- BR-FE02-025: Password-reset OTP/token processing must never activate an ordinary inactive account; only a valid `ACCOUNT_SETUP` token may activate an admin-created setup account.

---

## 7. Functional Requirements

- FR-FE02-001: When a guest submits valid registration data, the system shall create a new user with `INACTIVE` status.
- FR-FE02-002: When a user is registered, FE02 shall create a six-digit verification OTP with a 24-hour expiry, store only its hash, and request exactly one delivery through the FE10 requester bound to `FE02`; legacy verification tokens remain accepted for compatibility.
- FR-FE02-003: When a user submits a valid verification OTP and email, or a valid legacy verification token, the system shall activate the user account and invalidate the OTP/token.
- FR-FE02-004: When a user submits login form with valid credentials and active account, the system shall create a session/token and return it to the client.
- FR-FE02-005: When a user submits login form with invalid email or password, the system shall reject the request and not reveal whether the email exists.
- FR-FE02-006: When a user exceeds failed login attempts threshold, the system shall lock the account.
- FR-FE02-007: When a user requests logout, the system shall invalidate the session/token immediately.
- FR-FE02-008: When a user makes a protected request, the system shall validate the session/token before allowing the request.
- FR-FE02-009: When a session/token expires, the system shall return 401 Unauthorized for subsequent requests using that token.
- FR-FE02-010: When an authenticated user submits change password form, the system shall verify current password and update to new password.
- FR-FE02-011: When a guest submits forgot password form for an eligible account, FE02 shall create a six-digit password-reset OTP with a 15-minute expiry, store only its hash, and request exactly one delivery through the FE10 requester bound to `FE02` without revealing whether the email exists.
- FR-FE02-012: When a user submits a valid reset OTP and email, or a valid legacy password-reset token, with a new password, the system shall update the password for an eligible active account and invalidate the reset credential without changing account activation state.
- FR-FE02-013: When a user's account is created, the system shall assign default role(s) based on user type (member, librarian, admin).
- FR-FE02-014: When checking user permissions, the system shall retrieve roles from `UserRoles` table.
- FR-FE02-022: When FE02 requests verification/reset OTP delivery, it shall send `otp`, `expiresInMinutes`, `sourceEntityType: AuthToken`, `sourceEntityId: tokenId`, and an idempotency key derived from type plus token ID; it shall not perform a second direct send, direct notification-record write, or HTTP debug-token response.

### 7.1 Unwanted Behavior Requirements (EARS)

The following requirements formalize the error-handling and abnormal-condition branches already described in Sections 5 (Alternative Flows), 6 (Business Rules), and 9 (Edge Cases). Each is expressed in EARS Unwanted syntax (`IF ...` / `WHERE ...`) and traces back to a source AF/EC/BR.

- FR-FE02-015: IF a guest submits registration data with an email that is already registered, the system shall reject the registration and return the message "Email is already registered. Please login or use forgot password." without creating a new user record. (Source: AF-FE02-001, EC-FE02-003, BR-FE02-001)
- FR-FE02-016: IF a user submits an email verification OTP/token that is expired, malformed, or does not match any user record, the system shall reject activation, keep the account `INACTIVE`, and offer to resend a new verification email. (Source: AF-FE02-002, BR-FE02-004)
- FR-FE02-017: IF a user attempts to log in to an account whose status is `LOCKED`, the system shall reject the login and return the account-lock message instructing the user to reset their password or contact support. (Source: AF-FE02-003, BR-FE02-009)
- FR-FE02-018: IF a user submits a password-reset or account-setup credential that has already been used, expired, or does not match an eligible user, the system shall reject the request and return a safe invalid-code message without changing any password. (Source: AF-FE02-005, BR-FE02-014)
- FR-FE02-019: IF a submitted new password (during registration, change, or reset) does not meet the configured complexity policy, the system shall reject the operation and return a complexity-requirement error without persisting the password. (Source: AF-FE02-007, BR-FE02-005, Q-FE02-001)
- FR-FE02-020: IF an authenticated user attempts to change their password to a value identical to the current password, the system shall reject the change and return the message "New password must be different from current password." (Source: AF-FE02-006)
- FR-FE02-021: IF a protected request presents a session/token that is malformed, has an invalid signature, or has expired, the system shall reject the request with 401 Unauthorized and shall not process the requested operation. (Source: AF-FE02-004, EC-FE02-014, BR-FE02-012)
- FR-FE02-023: IF FE10 returns `FAILED` or throws a safe requester error during verification/reset delivery, FE02 shall preserve the completed source transaction and public response semantics, record no raw OTP in logs/audits, and allow resend to create a new OTP token event. (Source: EC-FE02-009, BR-FE02-022)
- FR-FE02-024: When a user submits a valid FE11 `ACCOUNT_SETUP` token and compliant password, FE02 shall atomically complete setup and activate the account according to MF-FE02-010.
- FR-FE02-025: IF an `ACCOUNT_SETUP` token is invalid, expired, used, revoked, belongs to an ineligible account, or loses a concurrent completion race, FE02 shall reject setup without changing password, account state, token state, or audit success state.

---

## 8. Acceptance Criteria

- AC-FE02-001: Given valid registration data and unique email, when a guest registers, then the system creates an inactive user, persists the verification OTP hash, and requests one FE10 verification email without a duplicate direct send.
- AC-FE02-002: Given a valid six-digit verification OTP and registered email, when the user submits them, then the account is activated and the user can login; a valid legacy verification token produces the same result.
- AC-FE02-003: Given an expired verification OTP/token, when the user submits it, then the system rejects it and offers to resend.
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
- AC-FE02-014: Given valid registered email, when user requests password reset, then FE02 persists the reset OTP hash and requests one six-digit reset OTP email through FE10 without a duplicate direct send.
- AC-FE02-015: Given invalid registered email, when user requests password reset, then the system returns success message (no user enumeration).
- AC-FE02-016: Given a valid reset OTP/email or legacy password-reset token, when the user submits a new password, then the system updates the eligible active account password and invalidates the reset credential without activating an inactive account.
- AC-FE02-017: Given an expired reset OTP/token, when the user submits a new password, then the system rejects the request.
- AC-FE02-018: Given a reset OTP/token used once, when the same credential is reused, then the system rejects the request.
- AC-FE02-019: Given FE10 delivery fails after a verification/reset OTP token is created, when FE02 completes the source request, then the user/token state remains valid, no raw OTP is exposed, and the resend flow can issue a new token ID and notification key.
- AC-FE02-020: Given a valid unused FE11 `ACCOUNT_SETUP` token for an inactive admin-created account, when the user submits a compliant password, then password, verification timestamp, lock fields, status, token usage, and audit commit atomically.
- AC-FE02-021: Given an invalid, expired, used, revoked, ineligible, or concurrently consumed setup token, when setup is submitted, then FE02 rejects it and persists no partial activation.

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
| EC-FE02-009 | FE10/provider cannot deliver a verification or reset OTP | Preserve the created user/token and public response semantics, expose no OTP, and allow resend to create a new OTP token event. |
| EC-FE02-010 | Password hash update fails in database | Roll back transaction; return error to user. |
| EC-FE02-011 | Token generation library fails | Return 500 error; log incident; offer user to try again. |
| EC-FE02-012 | User claims email was compromised; requests immediate logout all sessions | Admin can manually invalidate all tokens for the user. |
| EC-FE02-013 | Concurrent login attempts from same user | Allow both; user will have multiple active tokens (or invalidate old ones based on strategy). |
| EC-FE02-014 | Client sends malformed JWT token | Return 401 Unauthorized. |
| EC-FE02-015 | Clock skew between server and client token validation | Use reasonable time skew tolerance (e.g., 30 seconds). |
| EC-FE02-016 | Two setup-completion requests use the same token concurrently | Exactly one transaction succeeds; the other receives a safe invalid/used credential error. |
| EC-FE02-017 | Password-reset credential targets an inactive account | Reject reset; do not activate. Account activation requires `ACCOUNT_SETUP`. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Stores user account, email, password hash, status, and metadata. |
| Roles | Defines role names (Member, Librarian, Admin) and descriptions. |
| UserRoles | Maps users to roles. |
| AuthTokens | Stores hashes and lifecycle metadata for verification OTPs, password-reset credentials, account-setup credentials, refresh tokens, and change-password OTPs. |
| AuditLogs | Records all authentication events. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| userId | integer | Yes | Primary key. |
| email | string | Yes | Unique, valid email format, max 255 chars. |
| username | string | No | Optional alternative login field. |
| passwordHash | string | Yes | bcrypt hash, never plaintext. Before setup, FE11 stores an unusable bcrypt hash of a discarded server-generated random value; fixed literal placeholders are forbidden. |
| fullName | string | No | User's display name. |
| phoneNumber | string | No | User's phone number. |
| address | string | No | User's address. |
| status | enum | Yes | Values: `ACTIVE`, `INACTIVE`, `LOCKED`, `DELETED`. |
| createdAt | datetime | Yes | Account creation timestamp. |
| updatedAt | datetime | Yes | Last update timestamp. |
| lastLoginAt | datetime | No | Last successful login timestamp (for audit). |
| failedLoginCount | integer | No | Counter for failed login attempts. |
| lockedUntil | datetime | No | Timestamp when account will auto-unlock. |
| tokenId | integer | Conditional | `AuthTokens` primary key; used as FE10 source reference and sensitive-notification idempotency input. |
| tokenType | enum/string | Conditional | Distinguishes verification OTP, password reset, account setup, refresh, and change-password OTP purposes. |
| tokenHash | string | Conditional | Hash of the raw OTP/token; raw credentials are never persisted. |
| expiresAt | datetime | Conditional | Server-enforced credential expiry. Verification OTP and account setup are 24 hours; password-reset OTP is 15 minutes. |
| usedAt | datetime | No | Set when a one-time credential is consumed. |
| revokedAt | datetime | No | Set when an older credential is invalidated or a refresh token is revoked. |

### 10.3 State Model & Transition Rules (User Account)

This subsection formalizes the lifecycle of the `User.status` field (see 10.2 Data Fields). The state set is fixed to the four declared enum values: `ACTIVE`, `INACTIVE`, `LOCKED`, `DELETED`. No additional states are introduced. Every transition below traces back to a Main Flow (MF), Alternative Flow (AF), Functional Requirement (FR), Business Rule (BR), Edge Case (EC), or Resolved Question (Q) already present in this spec.

#### a) State Diagram

```mermaid
stateDiagram-v2
    [*] --> INACTIVE : register (MF-001 / FR-001)
    INACTIVE --> ACTIVE : verify email (MF-002 / FR-003)
    INACTIVE --> ACTIVE : complete setup via reset token (MF-008 / FR-012)
    ACTIVE --> LOCKED : failed logins exceed threshold (MF-004 / FR-006)
    LOCKED --> ACTIVE : successful password reset (AF-003 / FR-012)
    LOCKED --> ACTIVE : admin unlock (AF-003)
    LOCKED --> ACTIVE : automatic unlock after N hours (AF-003)
    ACTIVE --> DELETED : soft delete
    INACTIVE --> DELETED : soft delete
    LOCKED --> DELETED : soft delete
    DELETED --> [*]
```

#### b) Trạng thái (State meanings)

| State | Ý nghĩa |
| ----- | ------- |
| INACTIVE | Tài khoản đã được tạo nhưng chưa xác minh email (hoặc tài khoản do admin tạo chưa hoàn tất thiết lập mật khẩu). Không thể đăng nhập. |
| ACTIVE | Tài khoản đã xác minh và đang hoạt động. Đây là trạng thái duy nhất cho phép đăng nhập thành công. |
| LOCKED | Tài khoản bị khóa tự động do vượt ngưỡng số lần đăng nhập sai. Không thể đăng nhập cho đến khi được mở khóa. |
| DELETED | Tài khoản đã bị xóa mềm. Trạng thái cuối, không thể đăng nhập và không thể quay lại bất kỳ trạng thái nào khác. |

#### c) Valid Transitions

| From | To | Trigger / Event | Điều kiện | FR / BR liên quan |
| ---- | -- | --------------- | --------- | ----------------- |
| `[*]` (none) | INACTIVE | Guest đăng ký tài khoản | Dữ liệu đăng ký hợp lệ, email chưa tồn tại | MF-FE02-001, FR-FE02-001, BR-FE02-001, BR-FE02-004 |
| INACTIVE | ACTIVE | Người dùng bấm link xác minh email | Verification token hợp lệ, chưa hết hạn (24h), khớp user | MF-FE02-002, FR-FE02-003, BR-FE02-004 |
| INACTIVE | ACTIVE | Hoàn tất thiết lập mật khẩu cho tài khoản admin tạo | `ACCOUNT_SETUP` hợp lệ, chưa dùng/chưa thu hồi | MF-FE02-010, FR-FE02-024, BR-FE02-023, BR-FE02-024 |
| ACTIVE | LOCKED | Số lần đăng nhập sai vượt ngưỡng | failedLoginCount đạt ngưỡng cấu hình (ví dụ 5) | MF-FE02-004, FR-FE02-006, BR-FE02-008, BR-FE02-009 |
| LOCKED | ACTIVE | Reset mật khẩu thành công | Reset token hợp lệ, mật khẩu mới đạt độ phức tạp | AF-FE02-003, FR-FE02-012, Q-FE02-001 |
| LOCKED | ACTIVE | Admin mở khóa thủ công | Hành động của admin có thẩm quyền | AF-FE02-003 |
| LOCKED | ACTIVE | Tự động mở khóa sau N giờ | lockedUntil đã qua thời điểm hiện tại | AF-FE02-003, EC-FE02-006 |
| ACTIVE | DELETED | Xóa mềm tài khoản | Hành động xóa mềm hợp lệ | 10.2 (status enum) |
| INACTIVE | DELETED | Xóa mềm tài khoản | Hành động xóa mềm hợp lệ | 10.2 (status enum) |
| LOCKED | DELETED | Xóa mềm tài khoản | Hành động xóa mềm hợp lệ | 10.2 (status enum) |

#### d) Invalid Transitions (cấm tường minh)

- DELETED → bất kỳ trạng thái nào: tài khoản đã xóa mềm không thể được khôi phục về ACTIVE, INACTIVE hay LOCKED trong phạm vi FE02 (DELETED là trạng thái cuối).
- INACTIVE → LOCKED: tài khoản chưa kích hoạt không thể đăng nhập, do đó không thể tích lũy đủ số lần đăng nhập sai để bị khóa (MF-FE02-003 b5, BR-FE02-002).
- LOCKED → ACTIVE khi chưa thỏa điều kiện mở khóa: không được tự chuyển về ACTIVE nếu chưa qua reset mật khẩu, admin unlock, hoặc đủ thời gian auto-unlock (AF-FE02-003).
- INACTIVE → ACTIVE bằng đăng nhập: đăng nhập không kích hoạt tài khoản; chỉ xác minh email hoặc hoàn tất setup mới chuyển sang ACTIVE (FR-FE02-003, Q-FE02-008).
- INACTIVE / LOCKED / DELETED → đăng nhập thành công: chỉ ACTIVE mới đăng nhập được (MF-FE02-003 b5, FR-FE02-005, FR-FE02-017, Q-FE02-008).
- ACTIVE → INACTIVE: không có sự kiện nào trong FE02 đưa tài khoản đã kích hoạt trở lại trạng thái chưa xác minh.

#### e) Invariants (bất biến luôn đúng)

- INV-FE02-001: Một user luôn có đúng một giá trị `status` tại một thời điểm, thuộc tập {ACTIVE, INACTIVE, LOCKED, DELETED}. (10.2)
- INV-FE02-002: Chỉ tài khoản có `status = ACTIVE` mới có thể đăng nhập thành công. (MF-FE02-003 b5, FR-FE02-004, Q-FE02-008)
- INV-FE02-003: Tài khoản mới tạo qua đăng ký luôn bắt đầu ở `INACTIVE`, không bao giờ ở `ACTIVE` ngay lập tức. (MF-FE02-001 b5, FR-FE02-001)
- INV-FE02-004: `DELETED` là trạng thái hấp thụ (absorbing) — không có chuyển trạng thái nào rời khỏi `DELETED`.
- INV-FE02-005: Khi tài khoản chuyển sang `LOCKED`, mọi nỗ lực đăng nhập đều bị từ chối với thông báo khóa cho đến khi được mở khóa. (AF-FE02-003, FR-FE02-017)
- INV-FE02-006: Mọi chuyển trạng thái liên quan đến xác thực (kích hoạt, khóa, mở khóa, reset) đều phải ghi audit log. (BR-FE02-016, NFR-FE02-LOG-001..005)
- INV-FE02-007: Việc chuyển sang `LOCKED` chỉ xảy ra khi `failedLoginCount` đạt ngưỡng cấu hình; không có đường nào khác đưa tài khoản vào `LOCKED`. (MF-FE02-004, FR-FE02-006, BR-FE02-008)

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract may stay in this SPEC.md unless the team reintroduces a dedicated shared API contract document.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/auth/register` | Guest | `{ email: string, username?: string, password: string, confirmPassword: string, fullName?: string, phoneNumber?: string }` | `{ userId: number, email: string, message: "Verification email sent" }` | Sends a six-digit verification OTP. |
| POST | `/api/auth/verify-email` | Guest | `{ email: string, otp: string }` or `{ token: string }` | `{ message: "Account verified. You can now login." }` | Primary OTP flow plus legacy token compatibility. |
| POST | `/api/auth/resend-verification` | Guest | `{ email: string }` | `{ message: "Verification email sent" }` | Resends verification email. |
| POST | `/api/auth/login` | Guest | `{ email: string, password: string }` | `{ userId: number, token?: string, sessionId?: string, expiresIn: number }` | Returns token or sets session cookie. |
| POST | `/api/auth/logout` | Authenticated | `{}` | `{ message: "Logged out" }` | Invalidates session/token. |
| POST | `/api/auth/refresh-token` | Authenticated | `{ token: string }` | `{ token: string, expiresIn: number }` | Refreshes expired token (if using JWT). |
| POST | `/api/auth/change-password` | Authenticated | `{ currentPassword: string, newPassword: string }` | `{ message: "Password changed" }` | Requires current password verification. |
| POST | `/api/auth/forgot-password` | Guest | `{ email: string }` | `{ message: "Password reset email sent" }` | Sends a six-digit reset OTP for eligible accounts; no user enumeration. |
| POST | `/api/auth/reset-password` | Guest | `{ email: string, otp: string, newPassword: string }` or `{ token: string, newPassword: string }` | `{ message: "Password reset successful" }` | OTP/legacy reset updates eligible active accounts; canonical `ACCOUNT_SETUP` follows MF-FE02-010 and activates atomically. |
| POST | `/api/auth/verify-session` | Authenticated | `{}` | `{ valid: boolean, userId: number, roles: string[] }` | Checks if session/token is still valid. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE02-SEC-001: All passwords must be hashed using bcrypt with cost factor â‰¥ 10.
- NFR-FE02-SEC-002: Plaintext passwords must never be logged, stored, or transmitted except over HTTPS.
- NFR-FE02-SEC-003: HTTPS must be enforced for all authentication endpoints; HTTP requests must be redirected or rejected.
- NFR-FE02-SEC-004: JWT access tokens must expire after 15 minutes and refresh tokens after 7 days.
- NFR-FE02-SEC-005: Failed login attempts must be rate-limited (e.g., max 5 attempts per 15 minutes per IP/user).
- NFR-FE02-SEC-006: Account lockout mechanism must exist after threshold exceeded.
- NFR-FE02-SEC-007: Verification and reset tokens must be cryptographically secure (high entropy).
- NFR-FE02-SEC-008: Verification OTPs expire after 24 hours, password-reset OTPs after 15 minutes, and admin-created account setup tokens after 24 hours.
- NFR-FE02-SEC-009: Password reset must require email verification; old password verification alone is insufficient.
- NFR-FE02-SEC-010: Login responses must not reveal whether email is registered (prevent user enumeration).
- NFR-FE02-SEC-011: All inputs (email, password, token) must be validated and sanitized on the server.
- NFR-FE02-SEC-012: SQL injection must be prevented using parameterized queries.
- NFR-FE02-SEC-013: Cross-site request forgery (CSRF) protection must be implemented if using session cookies.
- NFR-FE02-SEC-014: Cross-site scripting (XSS) must be prevented by escaping output and setting secure headers.
- NFR-FE02-SEC-015: Verification/reset OTPs may exist in FE02 and FE10 provider memory only for the active request. They must not appear in notification persistence, application logs, audit metadata, production or test HTTP responses, or idempotency keys. Tests must capture deterministic OTPs through injected dependencies rather than debug response fields.

### 12.2 Transaction Integrity

- NFR-FE02-TXN-001: User creation and verification token generation must be atomic.
- NFR-FE02-TXN-002: Login and session/token creation must be atomic.
- NFR-FE02-TXN-003: Password change and audit log write must be atomic.
- NFR-FE02-TXN-004: Password reset and token invalidation must be atomic.
- NFR-FE02-TXN-005: Account setup completion must atomically update password, verification/status/lock state, token usage/revocation, and audit success.

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
- NFR-FE02-UX-003: Verification email must clearly identify the six-digit OTP and its expiry without exposing unrelated account data.
- NFR-FE02-UX-004: Password reset email must clearly identify the six-digit OTP and its expiry without implying that the email contains a reset link.
- NFR-FE02-UX-005: Registration shall show account-details and email-verification steps, preserve non-secret values after recoverable failures, and focus the OTP input when verification begins.
- NFR-FE02-UX-006: The frontend shall prevent duplicate resend requests while pending and apply a visible 60-second cooldown after a successful verification or reset OTP resend.
- NFR-FE02-UX-007: OTP controls shall accept exactly six digits and use a masked destination email in user-facing copy.

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
- Migrating `CHANGE_PASSWORD_OTP` into FE10; FE02 retains that direct-email flow until a separate notification type/use case is approved.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE03 User Profile | Internal | After authentication, users manage profile in FE03. |
| FE10 Notification Management | Internal | FE10 is the single rendering/delivery/status owner for account-verification and password-reset OTP email through the requester bound to `FE02`. |
| FE11 User & Role Management | Internal | Provides roles and owns admin-created account/setup-token issuance and resend; FE02 consumes setup tokens and activates accounts. |
| SQL Server database | Technical | Stores Users, Roles, UserRoles, and AuditLogs tables. |
| Configured Email Provider Adapter | Technical | FE10 uses the configured provider adapter in deployed environments and an injected mock in tests. FE02 direct email remains only for `CHANGE_PASSWORD_OTP`. |
| bcrypt library | Technical | Node.js bcrypt or equivalent for password hashing. |
| JWT library | Technical | jsonwebtoken or equivalent if using JWT strategy. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE02-001 | Password requires at least 8 chars, 1 uppercase, 1 number, and 1 special char. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-002 | Access token expires after 15 minutes; refresh token expires after 7 days. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-003 | Email verification is required. FE02 generates the OTP and FE10 delivers it through a configured provider adapter; tests inject a mock provider. | Review packet 2026-06-10; ADR-004 approval 2026-07-15 | APPROVED |
| Q-FE02-004 | Multiple concurrent sessions are allowed in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-005 | Failed login attempts are rate-limited with a simple measurable server-side rule. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-006 | Password reset token expires after 15 minutes. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-007 | Password change attempts and failed login attempts are logged. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-008 | Inactive users cannot log in; inactive-user auto-lock job is out of scope for Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-009 | Use JWT access token plus refresh token. | Review packet 2026-06-10 | APPROVED |
| Q-FE02-010 | Password reset requires verified email ownership through a six-digit reset OTP; legacy password-reset tokens remain accepted for compatibility. | Review packet 2026-06-10; OTP alignment 2026-07-14 | APPROVED |
| Q-FE02-011 | The interactive frontend uses six-digit email OTPs for verification and reset, keeps legacy token payloads for compatibility, and applies a 60-second client resend cooldown. | Nhat confirmation 2026-07-14 | APPROVED |
| Q-FE02-012 | FE02 creates/validates verification and reset OTPs; FE10 exclusively renders and delivers those two email types through the requester bound to `FE02`. Delivery failure is non-blocking and resend creates a new token event. | ADR-004; Nhat approval 2026-07-15 | APPROVED |
| Q-FE02-013 | FE11 issues `ACCOUNT_SETUP`; FE10 delivers it only for FE11; FE02 atomically consumes it and changes the account from `INACTIVE` to `ACTIVE`. | ADR-005; Nhat approval 2026-07-15 | APPROVED |

---

## 15.1 Approved Design Decisions

The following decisions were approved in the Phase 1 review packet on 2026-06-10 and are now part of this spec.

| Decision | Approved Answer | Status |
| -------- | --------------- | ------ |
| Q-FE02-001 | Password requires at least 8 chars, 1 uppercase, 1 number, and 1 special char. | APPROVED |
| Q-FE02-002 | Access token expires after 15 minutes; refresh token expires after 7 days. | APPROVED |
| Q-FE02-003 | Email verification is required; FE02 generates the OTP and FE10 delivers it through the configured provider adapter. | APPROVED |
| Q-FE02-004 | Multiple concurrent sessions are allowed in Phase 1. | APPROVED |
| Q-FE02-005 | Failed login attempts are rate-limited with a simple measurable server-side rule. | APPROVED |
| Q-FE02-006 | Password reset token expires after 15 minutes. | APPROVED |
| Q-FE02-007 | Password change attempts and failed login attempts are logged. | APPROVED |
| Q-FE02-008 | Inactive users cannot log in; inactive-user auto-lock job is out of scope for Phase 1. | APPROVED |
| Q-FE02-009 | Use JWT access token plus refresh token. | APPROVED |
| Q-FE02-010 | Password reset requires verified email ownership through a six-digit reset OTP; legacy password-reset tokens remain compatible. | APPROVED |
| Q-FE02-011 | Six-digit OTP is the primary frontend flow; legacy token payloads remain compatible; successful resend starts a 60-second client cooldown. | APPROVED |
| Q-FE02-012 | FE02 owns verification/reset OTP credentials; FE10 owns their rendering/delivery/status through the FE02-bound requester, with non-blocking failure and new-token resend semantics. | APPROVED |
| Q-FE02-013 | FE02 consumes canonical FE11 setup tokens and atomically activates the account; it does not issue or resend those tokens. | APPROVED |

---

## 16. Traceability Matrix

### FE02 Acceptance Criteria to Requirements to Tests

| AC ID | Acceptance Criterion | Related FR | Related BR | Test Case | Status |
| ----- | -------------------- | ---------- | ---------- | --------- | ------ |
| AC-FE02-001 | Guest registers with valid data and unique email -> system creates INACTIVE user and requests one FE10 verification OTP delivery | FR-FE02-001, FR-FE02-002, FR-FE02-022 | BR-FE02-001, BR-FE02-003, BR-FE02-004, BR-FE02-020, BR-FE02-021 | FT05 | Ready for review |
| AC-FE02-002 | Valid verification OTP/email or legacy token submitted -> account activated, user can login | FR-FE02-003 | BR-FE02-004 | FT05 | Ready for review |
| AC-FE02-003 | Expired verification OTP/token submitted -> system rejects, offers resend | FR-FE02-003, FR-FE02-016 | BR-FE02-004 | FT05 | Ready for review |
| AC-FE02-004 | Valid email/password/active account at login -> system returns session/token | FR-FE02-004 | BR-FE02-001, BR-FE02-005, BR-FE02-010 | FT06 | Ready for review |
| AC-FE02-005 | Invalid email at login -> system returns error without revealing email existence | FR-FE02-005 | BR-FE02-007 | FT07 | Ready for review |
| AC-FE02-006 | Valid email but invalid password at login -> error returned, failed attempt counter incremented | FR-FE02-005, FR-FE02-006 | BR-FE02-007, BR-FE02-008 | FT07 | Ready for review |
| AC-FE02-007 | Inactive account login attempt -> system rejects login | FR-FE02-005 | BR-FE02-002 | FT07 | Ready for review |
| AC-FE02-008 | Locked account login attempt -> system rejects with lock message | FR-FE02-005, FR-FE02-006 | BR-FE02-008, BR-FE02-009 | FT07 | Ready for review |
| AC-FE02-009 | Valid session/token in protected request -> request allowed | FR-FE02-008 | BR-FE02-012 | FT06 | Ready for review |
| AC-FE02-010 | Expired session/token in protected request -> 401 Unauthorized returned | FR-FE02-008, FR-FE02-009 | BR-FE02-010, BR-FE02-012 | FT07 | Ready for review |
| AC-FE02-011 | Authenticated user logs out -> session/token invalidated | FR-FE02-007 | BR-FE02-011 | FT08 | Ready for review |
| AC-FE02-012 | Authenticated user changes password with correct current password -> system updates password, returns success | FR-FE02-010 | BR-FE02-018, BR-FE02-019, BR-FE02-006 | FT09 | Ready for review |
| AC-FE02-013 | Authenticated user changes password with incorrect current password -> system rejects change | FR-FE02-010 | BR-FE02-018, BR-FE02-019 | FT09 | Ready for review |
| AC-FE02-014 | Guest requests password reset with valid registered email -> system requests one FE10 reset OTP delivery | FR-FE02-011, FR-FE02-022 | BR-FE02-013, BR-FE02-014, BR-FE02-016, BR-FE02-020, BR-FE02-021 | FT10 | Ready for review |
| AC-FE02-015 | Guest requests password reset with invalid email -> system returns success message (no enumeration) | FR-FE02-011 | BR-FE02-007, BR-FE02-016 | FT10 | Ready for review |
| AC-FE02-016 | Valid reset OTP/legacy reset token updates an eligible active account without activation side effects | FR-FE02-012 | BR-FE02-006, BR-FE02-013, BR-FE02-014, BR-FE02-025 | FT11 | Ready for review |
| AC-FE02-017 | Expired reset token + new password submitted -> system rejects request | FR-FE02-012 | BR-FE02-014 | FT11 | Ready for review |
| AC-FE02-018 | Already-used reset token reused -> system rejects request | FR-FE02-012 | BR-FE02-014 | FT11 | Ready for review |
| AC-FE02-019 | FE10 verification/reset delivery fails -> source state remains valid and resend can issue a new token event | FR-FE02-023 | BR-FE02-022 | FT05, FT10 | Approved for implementation |
| AC-FE02-020 | Valid FE11 setup token completes password setup and atomically activates the account | FR-FE02-024 | BR-FE02-023, BR-FE02-024 | FT11 | Approved for implementation |
| AC-FE02-021 | Invalid/expired/used/revoked/ineligible/concurrent setup token cannot partially activate | FR-FE02-025 | BR-FE02-024, BR-FE02-025 | FT11 | Approved for implementation |

### FE02 Unwanted Functional Requirements to Sources to Tests

| FR ID | Unwanted Requirement (summary) | Source AF / EC | Related BR / Q | Test Case | Status |
| ----- | ------------------------------ | -------------- | -------------- | --------- | ------ |
| FR-FE02-015 | Reject registration with already-registered email; no new user created | AF-FE02-001, EC-FE02-003 | BR-FE02-001 | FT05 | Ready for review |
| FR-FE02-016 | Reject expired/malformed verification token; keep account INACTIVE, offer resend | AF-FE02-002 | BR-FE02-004 | FT05 | Ready for review |
| FR-FE02-017 | Reject login to LOCKED account with lock message | AF-FE02-003 | BR-FE02-009 | FT07 | Ready for review |
| FR-FE02-018 | Reject already-used/expired reset token; no password change | AF-FE02-005 | BR-FE02-014 | FT11 | Ready for review |
| FR-FE02-019 | Reject password not meeting complexity policy; do not persist | AF-FE02-007 | BR-FE02-005, Q-FE02-001 | FT09, FT11 | Ready for review |
| FR-FE02-020 | Reject password change reusing current password | AF-FE02-006 | BR-FE02-019 | FT09 | Ready for review |
| FR-FE02-021 | Reject protected request with malformed/invalid/expired token (401) | AF-FE02-004, EC-FE02-014 | BR-FE02-012 | FT07 | Ready for review |
| FR-FE02-023 | Preserve source state and safe public semantics when FE10 verification/reset delivery fails | EC-FE02-009 | BR-FE02-022, Q-FE02-012 | FT05, FT10 | Approved for implementation |
| FR-FE02-025 | Reject invalid or losing-concurrency setup completion without partial state | EC-FE02-016, EC-FE02-017 | BR-FE02-024, BR-FE02-025, Q-FE02-013 | FT11 | Approved for implementation |

### Coverage Summary (FE02)
- **Total AC**: 21 (AC-FE02-001 to AC-FE02-021) - all mapped.
- **Total FR**: 25 (FR-FE02-001 to FR-FE02-025) - all mapped.
- **EARS Unwanted FR**: 9 (FR-FE02-015 to FR-FE02-021, FR-FE02-023, FR-FE02-025) = 36% of total FR.
- **Total BR**: 25 (BR-FE02-001 to BR-FE02-025) - all key BR mapped.
- **Total Tests**: 7 (FT05 to FT11) - aligned with assignment sheet


### External Assignment Traceability (Excel UC IDs)

| Assignment UC ID | Excel Use Case | Related Main Flow / Requirement | Related Test |
| ---------------- | -------------- | ------------------------------- | ------------ |
| UC05 | Register Account | MF-FE02-001, MF-FE02-002; FR-FE02-001 to FR-FE02-003 | FT05 |
| UC06 | Login | MF-FE02-003, MF-FE02-004, MF-FE02-009; FR-FE02-004 to FR-FE02-006, FR-FE02-008, FR-FE02-009 | FT06, FT07 |
| UC07 | Logout | MF-FE02-005; FR-FE02-007 | FT08 |
| UC08 | Change Password | MF-FE02-006; FR-FE02-010 | FT09 |
| UC09 | Forgot Password | MF-FE02-007; FR-FE02-011 | FT10 |
| UC10 | Reset Password | MF-FE02-008; FR-FE02-012 | FT11 |

---

## 17. Review Checklist

All decisions in section 15.1 were approved in the Phase 1 review packet on 2026-06-10.

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Approved decisions in Section 15.1 are recorded in the Phase 1 review packet.
- [x] Q-FE02-008 (auto-lock inactive users) is explicitly out of scope for Phase 1.
- [x] Password policy (length, complexity) matches approved decision from Section 15.1.
- [x] Session timeout duration matches approved decision from Section 15.1.
- [x] Session management strategy (JWT vs cookies vs refresh tokens) is confirmed in Section 15.1 approved decision.
- [x] Database schema for Users, Roles, UserRoles, token storage is confirmed.
- [x] FE02/FE10 OTP requester and configured-provider integration approach is confirmed through ADR-004.
- [x] API contract is approved in this SPEC.md or copied to a dedicated shared API contract file if the team reintroduces one.
- [x] FE03, FE10, FE11 dependencies are checked for conflicts.
- [x] Every acceptance criterion can become a test.
- [x] Security requirements are reviewed and approved by security/architect.
- [x] Bcrypt cost factor and token generation randomness are specified.
- [x] Verification/reset delivery has one owner, uses token-ID idempotency, rejects duplicate direct sends, and remains non-blocking on FE10 failure.
