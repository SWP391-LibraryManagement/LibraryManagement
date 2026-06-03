# CONTEXT.md - FE11 User & Role Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Dat

# Last Updated: 2026-06-03

# Feature folder: `.sdd/specs/feat-user-management/`

---

## 1. Feature Purpose

User & Role Management exists to allow administrators to create, view, update, and deactivate user accounts and manage role assignments across the library system.

This feature must keep three things consistent:

- User account information (email, name, contact details).
- User role assignments and permissions.
- User status lifecycle (active, inactive, locked, deleted).

Because user/role data controls access to all other features, this feature is treated as a Full Spec feature.

---

## 2. Real-World Workflow

The typical small/medium library administration workflow:

1. An admin needs to add a new member to the system.
2. The admin accesses the user management interface.
3. The admin creates a new user account with email, password, and member details.
4. The system validates the email is unique and password meets requirements.
5. The system assigns the Member role to the new user.
6. The system sends a welcome email or displays temporary password to the admin.
7. Later, a librarian needs more privileges; admin changes their role from Librarian to Librarian+Admin.
8. The admin updates the user's information when they provide new contact details.
9. When a user leaves, the admin deactivates the account (does not delete).
10. The admin can reactivate the account if the user returns.
11. The admin can unlock locked accounts caused by too many failed login attempts.
12. The admin can view audit logs of all user management actions.

---

## 3. Feature Boundary

FE11 includes:

- View list of all users with filtering, sorting, and search.
- View detailed user information.
- Create member accounts.
- Create librarian accounts.
- Update user information (name, phone, address, department, specialization).
- Deactivate user accounts.
- Reactivate user accounts.
- Manage user role assignments (assign/revoke roles).
- Unlock locked user accounts.
- Reset user passwords (admin action).

FE11 does not include:

- User profile editing by non-admins. That belongs to FE03.
- User registration/signup by self-service. That belongs to FE02 Authentication.
- Password reset by users themselves. That belongs to FE02 Authentication.
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

- `Users.Status` field must support values: `ACTIVE`, `INACTIVE`, `LOCKED`, `DELETED`.
- `Users` table needs `LastLoginAt` for tracking active users.
- `Users` table needs `FailedLoginCount` and `LockedUntil` fields for account lockout management.
- `UserRoles` table allows multiple roles per user; system must ensure at least one role per user.
- `AuditLogs` must capture what changed and by whom; simple action text is insufficient.
- Need to prevent removal of Admin role if only one admin remains.
- Email uniqueness constraint should be case-insensitive.
- Need `Department` and `Specialization` fields for librarian accounts.

These are not blockers for drafting, but they must be resolved before implementation.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC36 | View user list | Dat |
| UC37 | View user information | Dat |
| UC38 | Create member account | Dat |
| UC39 | Create librarian account | Dat |
| UC40 | Update user information | Dat |
| UC41 | Deactivate user account | Dat |
| UC42 | Manage user roles | Dat |
| UC43 | Unlock user account | Dat |

---

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT37 | View user list with filtering | Dat |
| FT38 | View user details | Dat |
| FT39 | Create member account | Dat |
| FT40 | Create member with duplicate email | Dat |
| FT41 | Create librarian account | Dat |
| FT42 | Update user information | Dat |
| FT43 | Update user with duplicate email | Dat |
| FT44 | Deactivate user account | Dat |
| FT45 | Reactivate user account | Dat |
| FT46 | Assign role to user | Dat |
| FT47 | Revoke role from user | Dat |
| FT48 | Prevent removal of last admin | Dat |
| FT49 | Unlock locked account | Dat |

---

## 7. Key Risks

- User data corruption if account creation is not transactional (user created but role assignment fails).
- Access control breach if a user is not properly deactivated or role is not properly revoked.
- Privilege escalation if admin role cannot be revoked from the last admin.
- Data integrity loss if all admins are accidentally locked/deactivated without recovery path.
- Account lockout without unlock mechanism traps users indefinitely.
- Email uniqueness not enforced allows duplicate accounts with same email.
- Concurrent role assignment/revocation can create inconsistent state.
- Deactivation without invalidating active sessions allows deactivated user to continue accessing system.
- Audit logs can be incomplete if user management actions are not fully logged.
- Password reset without proper validation allows unauthorized account takeover.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE02 Authentication | Uses user credentials and enforces login; role assignment determines feature access. |
| FE03 User Profile | User profile info (name, phone, address) overlaps with user management. |
| FE07 Borrowing Management | Member user accounts created in FE11 can borrow books in FE07. |
| FE09 Fine Management | May query user status to determine if user with unpaid fines can be deactivated. |

---

## 9. Open Questions For Team / Teacher

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE11-001 | Can an admin deactivate their own account? | Team/Teacher | Open |
| Q-FE11-002 | Should system prevent deactivation of users with active borrowings, or just warn? | Team/Teacher | Open |
| Q-FE11-003 | What is the minimum password length and complexity requirement for user creation? | Team/Teacher | Open |
| Q-FE11-004 | Should email login be case-sensitive or case-insensitive? | Team/Teacher | Open |
| Q-FE11-005 | Should new user creation automatically send welcome email with temporary password? | Team/Teacher | Open |
| Q-FE11-006 | How long should deactivated user data be retained (1 year, 5 years, forever)? | Team/Teacher | Open |
| Q-FE11-007 | Should admin be able to unlock locked accounts, or only auto-unlock after timeout? | Team/Teacher | Open |
| Q-FE11-008 | Should system support role hierarchy (Admin > Librarian > Member)? | Team/Teacher | Open |
| Q-FE11-009 | Can one admin view or reset another admin's password? | Team/Teacher | Open |
| Q-FE11-010 | Should user deactivation send notification email to the user? | Team/Teacher | Open |

---

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- Use database transactions for user creation and role assignment.
- Invalidate all active sessions when user is deactivated.
- Enforce email uniqueness with case-insensitive constraint.
- Every API endpoint must validate role (Admin only) and input on the server.
- Log all user management actions (create, update, deactivate, role change) with admin ID and timestamp.
- Implement strong password hashing (bcrypt) for user passwords.
