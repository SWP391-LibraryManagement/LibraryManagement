# CONTEXT.md - FE11 User & Role Management

# Version: 0.3.1

# Status: APPROVED - ADMIN ACCOUNT-GOVERNANCE BOUNDARY 2026-07-28

# Owner: Dung

# Last Updated: 2026-07-28

# Feature folder: `.sdd/specs/feat-user-role-management/`

---

## 1. Feature Purpose

User & Role Management exists to allow administrators to create and view accounts and manage account lifecycle and roles. Existing-user personal/account profile fields are read-only in FE11; authenticated users maintain their own approved profile fields through FE03.

This feature must keep three things consistent:

- The boundary between Admin-visible account information and user-owned personal profile information.
- User role assignments and permissions.
- User status lifecycle (`INACTIVE` during admin-created setup, `ACTIVE` after setup, and later deactivation/lock states).

Because user/role data controls access to all other features, this feature is treated as a Full Spec feature.

---

## 2. Real-World Workflow

The typical small/medium library administration workflow:

1. An admin needs to add a new member to the system.
2. The admin accesses the user management interface.
3. The admin creates a new user account with email and member details, without entering a password.
4. The system validates the email is unique and assigns the Member role.
5. The system keeps the account inactive until password setup is completed.
6. The system sends a one-time password setup link to the user's email; the admin never sees a password or token.
7. Later, a librarian needs more privileges; admin changes their role from Librarian to Librarian+Admin.
8. The user updates their own name, phone, or address through FE03; Admin sees the result as read-only.
9. When a user leaves, the admin deactivates the account (does not delete).
10. For an existing account, the admin can change only its role or deactivate it; profile correction belongs to the authenticated account owner through FE03.
11. The admin can view audit logs of all user management actions.

---

## 3. Feature Boundary

FE11 includes:

- View list of all users with filtering, sorting, and search.
- View safe allowlisted user details without passwords, credential/token hashes, session identifiers, setup/reset links, or secret audit metadata.
- View detailed user information.
- Create member accounts.
- Create librarian accounts.
- Keep all existing-account personal/profile fields read-only in FE11.
- Deactivate user accounts.
- Deactivate librarian accounts.
- Replace each user's single account role atomically.
- Initiate password setup emails for newly created users without exposing passwords or tokens to admins.
- Resend an incomplete admin-created account setup email through an Admin-only action.

FE11 does not include:

- Admin editing of an existing user's name, phone, or address. Authenticated self-service editing belongs to FE03.
- Existing-account email change. Any future capability requires a verified FE02 flow and is outside Phase 1.
- User registration/signup by self-service. That belongs to FE02 Authentication.
- Password reset by users themselves. That belongs to FE02 Authentication.
- Unlocking accounts after failed login lockout unless explicitly added by FE02/FE11 later.
- Reactivating deactivated accounts unless explicitly approved as a separate flow later.
- Admin-initiated password reset for existing users unless explicitly added by FE02/FE11 later.
- Permanent user deletion. Only deactivation is supported.
- User import/export or bulk operations.
- Role-based activity reports or analytics.
- LDAP/Active Directory user synchronization.
- OAuth or SSO integration.

---

## 4. Current Data Model Notes

The current SQL script should include:

- `Users(UserId, Email, Username, PasswordHash, FullName, PhoneNumber, Address, Status, CreatedAt, UpdatedAt, LastLoginAt)`
- `Roles(RoleId, RoleName, Description)`
- `UserRoles(UserId, RoleId)` - maps users to roles
- `AuditLogs(LogId, UserId, Action, TargetUserId, Details, CreatedAt)`

Potential issues to review:

- Admin-created users start `INACTIVE`; FE02 changes them to `ACTIVE` only after successful setup-token consumption.
- `Users` table needs `LastLoginAt` for tracking active users.
- `Users` table needs `FailedLoginCount` and `LockedUntil` fields for account lockout management.
- Admin-created users must use the FE02 password setup flow. If SQL keeps `PasswordHash NOT NULL`, FE11 stores an unusable bcrypt hash of a discarded random value; fixed literal placeholders are forbidden.
- FE11 stores only the hash of a 24-hour `ACCOUNT_SETUP` token in `AuthTokens` and uses its token ID for FE10 source traceability/idempotency.
- `UserRoles` stores exactly one role per account and `UX_UserRoles_UserId` enforces that cardinality. Role changes replace the current mapping atomically; the compatibility `roles` array contains exactly one item.
- `AuditLogs` must capture what changed and by whom; simple action text is insufficient.
- Need to prevent removal of Admin role if only one admin remains.
- Email uniqueness constraint should be case-insensitive.
- Need `Department` and `Specialization` fields for librarian accounts.
- FE11 must reject existing-user `fullName`, `phone`, `address`, and `email` mutation attempts server-side; hiding controls in the Admin UI is not sufficient.
- Shared passwords must not be displayed to admins.

These are not blockers for drafting, but they must be resolved before implementation.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC49 | View User List | Dung |
| UC50 | View User Information | Dung |
| UC51 | Create User Account | Dung |
| UC52 | Update User Information - reallocated to FE03 self-service; FE11 enforces read-only Admin boundary | Dung |
| UC53 | Deactivate User Account | Dung |
| UC54 | Create Librarian Account | Dung |
| UC55 | Update Librarian Work Information - reallocated/out of FE11 existing-account scope by Q-FE11-029 | Dung |
| UC56 | Deactivate Librarian Account | Dung |
| UC57 | Manage Roles | Dung |

---

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT50 | View user list | Dung |
| FT51 | View user information | Dung |
| FT52 | Create user account | Dung |
| FT53 | Update user information - reallocated to FE03 plus FE11 boundary rejection | Dung |
| FT54 | Deactivate user account | Dung |
| FT55 | Create librarian account | Dung |
| FT56 | Verify Librarian target remains read-only in FE11 | Dung |
| FT57 | Deactivate librarian account | Dung |
| FT58 | Manage roles | Dung |

---

## 7. Key Risks

- User data corruption if account creation is not transactional (user created but role assignment fails).
- Access control breach if a user is not properly deactivated or role is not properly revoked.
- Privilege escalation if admin role cannot be revoked from the last admin.
- Data integrity loss if all admins are accidentally deactivated without recovery path.
- Email uniqueness not enforced allows duplicate accounts with same email.
- Concurrent role replacement can create inconsistent state unless the mapping, final-Admin check, and audit are serialized in one transaction.
- Deactivation without invalidating active sessions allows deactivated user to continue accessing system.
- Audit logs can be incomplete if user management actions are not fully logged.
- Password setup without proper validation allows unauthorized account takeover.
- Unauthorized personal-data mutation can overwrite user-owned information, bypass identity verification, and make audit history misleading.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE02 Authentication | Uses user credentials and enforces login; role assignment determines feature access; owns any future verified existing-account email change. |
| FE03 User Profile | Owns authenticated self-service updates to name, phone, and address; FE11 reads but does not mutate these fields after creation. |
| FE07 Borrowing Management | Member user accounts created in FE11 can borrow books in FE07. |
| FE09 Fine Management | May query user status to determine if user with unpaid fines can be deactivated. |
| FE10 Notification Management | Renders and delivers `ACCOUNT_SETUP` only for the requester bound to `FE11`; persists no setup token/link. |

---

## 9. Resolved Questions For Team / Teacher

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE11-001 | Admins cannot deactivate themselves. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-002 | Prevent deactivation of users with active borrowings. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-003 | Password setup uses the same FE02 password complexity rule. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-004 | Email is case-insensitive for login and uniqueness. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-005 | FE11 requests one-time setup-link delivery through FE10 after source commit; deployed environments use the configured provider and tests use a mock. | Review packet 2026-06-10; ADR-005 refinement 2026-07-15 | APPROVED |
| Q-FE11-006 | Do not permanently delete deactivated user data in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-007 | No role hierarchy in Phase 1; roles are flat. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-008 | Admin cannot view sensitive account fields such as password hash, reset tokens, refresh tokens. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-009 | User deactivation notification is optional/future work; no mandatory Phase 1 notification. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-014 | Admin-created accounts start `INACTIVE` and activate only after FE02 setup completion. | Nhat confirmation 2026-07-15 | APPROVED |
| Q-FE11-015 | FE11 issues setup tokens, FE10 delivers canonical `ACCOUNT_SETUP`, and FE02 consumes/activates. | Nhat confirmation 2026-07-15; ADR-005 | APPROVED |
| Q-FE11-016 | Admin-only resend rotates the setup token/event/key and enforces a 60-second cooldown. | Nhat confirmation 2026-07-15; ADR-005 | APPROVED |
| Q-FE11-027 | Admin may view but cannot edit existing-user name, phone, address, or email; FE03 owns self-service personal updates, FE02 owns any future verified email change, and FE11 owns only current-Librarian department/specialization updates. | User approval 2026-07-22 | APPROVED |
| Q-FE11-028 | Historical decision that temporarily allowed Admin managed-profile editing; superseded by Q-FE11-029. | User approval 2026-07-25 | SUPERSEDED |
| Q-FE11-029 | Supersedes Q-FE11-028: for an existing account, FE11 Admin may view safe account/profile data but may mutate only the account's single role or deactivate the account. FE11 exposes no profile Edit action or `PUT /api/users/{userId}` profile-mutation route. Authenticated users correct their own approved fields through FE03; verified email remains under FE02. | User approval 2026-07-28 | APPROVED |

---

## 10. Notes For Implementation Later

- Treat the earlier broad Admin-update implementation as historical evidence only; it does not satisfy the revised personal-data ownership contract.
- Use database transactions for user creation and role assignment.
- Invalidate all active sessions when user is deactivated.
- Enforce email uniqueness with case-insensitive constraint.
- Every API endpoint must validate role (Admin only) and input on the server.
- Log successful FE11-owned actions (create, setup resend, deactivate, role change) with admin ID and timestamp; the retired profile route must produce no write or success audit.
- Do not expose `PUT /api/users/{userId}` for existing-user profile mutation. Keep role replacement and deactivation as separate Admin-only commands.
- Implement strong password hashing (bcrypt) for user passwords.
