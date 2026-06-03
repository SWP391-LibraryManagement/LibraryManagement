# SPEC.md - FE11 User & Role Management

# Version: 0.1.0

# Status: DRAFT

# Owner: [Member Name]

# Last Updated: 2026-06-03

# Feature ID: FE11

# Feature folder: `.sdd/specs/feat-user-management/`

> Source of truth for FE11 User & Role Management. This spec is a draft and must be reviewed before implementation. It is intentionally detailed because FE11 is critical to system access control and administration.

---

## 1. Feature Overview

### 1.1 Feature Name

User & Role Management

### 1.2 Business Context

User & Role Management allows administrators to create, view, update, and deactivate user accounts (members, librarians, admins) and manage role assignments. This feature ensures that only authorized personnel have access to system functions and that users are managed consistently throughout their lifecycle.

This feature is core because incorrect user/role data can break access control, allow unauthorized actions, expose sensitive data, and create audit liability.

### 1.3 Goal / Outcome

The system shall:

- Allow admins to view a list of all users with filtering and search.
- Allow admins to view detailed user information.
- Allow admins to create new member accounts.
- Allow admins to create new librarian accounts.
- Allow admins to update user information (name, phone, address, email).
- Allow admins to update librarian information (department, specialization, etc.).
- Allow admins to deactivate/reactivate user accounts.
- Allow admins to manage user role assignments (assign/revoke roles).
- Keep every user management action traceable for audit.

### 1.4 Scope Level

- [x] Full Spec - core business logic, high risk, must be correct from the beginning
- [ ] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Admin | System administrator | Can view, create, update, and deactivate all users (members, librarians, admins). Can manage role assignments. Can view audit logs of user management. |
| Librarian | Library staff (non-admin) | Cannot manage users. Can view own profile. |
| Member | Library user (non-staff) | Cannot manage users. Can view own profile. |
| Guest | Unauthenticated visitor | Cannot access user management. |
| Audit Logger | System component | Records all user management actions (create, update, deactivate, role assignment). |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE11-001: The user performing user management actions is authenticated as an Admin.
- PRE-FE11-002: The Users, Roles, and UserRoles tables exist in the database.
- PRE-FE11-003: The user being created/updated has a unique email address.
- PRE-FE11-004: Role definitions (Member, Librarian, Admin) are pre-configured in the Roles table.
- PRE-FE11-005: AuditLogs table exists for recording user management actions.

---

## 4. Main Flows

### MF-FE11-001: View User List

1. Admin navigates to user management section.
2. The system displays a list of all users with basic information (ID, email, name, status, roles).
3. The system supports pagination and sorting by various columns.
4. The system supports filtering by status (active, inactive) and role.
5. The system supports search by email, name, or user ID.
6. Admin can click on a user to view detailed information.

### MF-FE11-002: View User Information

1. Admin opens the user list or searches for a specific user.
2. Admin clicks on a user record to view detailed information.
3. The system displays all user fields: ID, email, username, full name, phone, address, status, roles, created date, last updated date, last login date.
4. The system may show related information like active borrowings, fines, reservations if applicable.

### MF-FE11-003: Create Member Account

1. Admin navigates to create new user form.
2. Admin selects user type: Member.
3. Admin enters required fields: email, password, full name, phone (optional), address (optional).
4. The system validates email format and checks for duplicate email.
5. The system validates password meets complexity requirements.
6. The system hashes the password.
7. The system creates a new user record with status `ACTIVE` and assigns Member role.
8. The system writes an audit log entry.
9. The system shows success message and displays the new user ID.

### MF-FE11-004: Create Librarian Account

1. Admin navigates to create new user form.
2. Admin selects user type: Librarian.
3. Admin enters required fields: email, password, full name, department (optional), specialization (optional).
4. The system validates email and password.
5. The system hashes the password.
6. The system creates a new user record with status `ACTIVE` and assigns Librarian role.
7. The system may also ask for manager/supervisor assignment if applicable.
8. The system writes an audit log entry.
9. The system shows success message.

### MF-FE11-005: Update User Information

1. Admin opens user detail page for an existing user.
2. Admin edits one or more fields: full name, phone, address, department, specialization.
3. The system validates updated email if changed (must be unique).
4. The system updates the user record.
5. The system updates the `UpdatedAt` timestamp.
6. The system writes an audit log entry with details of what changed.
7. The system shows success message.

### MF-FE11-006: Deactivate User Account

1. Admin opens user detail page.
2. Admin clicks "Deactivate Account" button.
3. The system may show a confirmation dialog with warnings (active borrowings, pending requests).
4. Admin confirms deactivation.
5. The system sets user status to `INACTIVE`.
6. The system keeps user data intact (does not delete).
7. The system invalidates any active sessions/tokens for that user.
8. The system writes an audit log entry.
9. The system shows success message.

### MF-FE11-007: Reactivate User Account

1. Admin opens a deactivated user's detail page.
2. Admin clicks "Reactivate Account" button.
3. The system confirms reactivation.
4. The system sets user status to `ACTIVE`.
5. The system writes an audit log entry.
6. The system shows success message.

### MF-FE11-008: Manage User Roles

1. Admin opens user detail page.
2. Admin views current roles assigned to the user.
3. Admin can add additional role to the user (assign role).
4. Admin can remove role from the user (revoke role).
5. The system validates that action (e.g., cannot remove last admin role from last admin).
6. The system updates the UserRoles mapping.
7. The system writes an audit log entry with role change details.
8. The system shows success message.

### MF-FE11-009: Unlock Locked Account

1. Admin identifies a locked account (due to too many failed login attempts).
2. Admin opens the user's detail page.
3. Admin can click "Unlock Account" button.
4. The system resets the failed login counter.
5. The system updates `LockedUntil` timestamp to null.
6. The system writes an audit log entry.
7. The system shows success message.

---

## 5. Alternative Flows

### AF-FE11-001: Email Already Exists

1. Admin attempts to create a new user with an email already in use.
2. The system detects duplicate email.
3. The system returns error: "Email is already registered. Use a different email or update the existing user."

### AF-FE11-002: User Has Active Borrowings

1. Admin attempts to deactivate a user who has active borrowed books.
2. The system detects active borrowings.
3. The system shows warning: "This user has [N] active borrowed items. Deactivate anyway?"
4. Admin can choose to proceed or cancel.

### AF-FE11-003: Cannot Remove Last Admin

1. Admin attempts to remove the Admin role from the last remaining admin user.
2. The system detects this is the last admin.
3. The system rejects the action: "Cannot remove admin role from the last admin user."

### AF-FE11-004: Update Email to Duplicate

1. Admin updates a user's email to an address already in use by another user.
2. The system detects duplicate email.
3. The system rejects the update.

### AF-FE11-005: Update Password

1. Admin may need to reset a user's password (e.g., user forgot password and cannot self-reset).
2. Admin opens user detail page and clicks "Reset Password".
3. The system generates a temporary password or reset token.
4. Admin either displays the temporary password to the user or sends reset email.
5. The system writes an audit log entry.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE11-001: Only authenticated Admin users can access user management features.
- BR-FE11-002: Only authenticated Admin users can create new users.
- BR-FE11-003: Users cannot be permanently deleted; only deactivated (set to INACTIVE status).
- BR-FE11-004: Each user must have a unique email address in the system.
- BR-FE11-005: When a user is created, a password must be set and hashed with bcrypt.
- BR-FE11-006: When a user account is deactivated, all active sessions/tokens for that user must be invalidated.
- BR-FE11-007: Every user must have at least one role assigned (Member, Librarian, or Admin).
- BR-FE11-008: A user can have multiple roles assigned simultaneously (e.g., Librarian and Admin).
- BR-FE11-009: The system must never allow removal of all Admin roles if only one Admin remains.
- BR-FE11-010: Every user management action (create, update, deactivate, role change) must be auditable.
- BR-FE11-011: A member user cannot create or manage other users.
- BR-FE11-012: A librarian user cannot create or manage users.
- BR-FE11-013: Password reset by admin must follow the same hashing and security requirements as user registration.
- BR-FE11-014: User information updates must preserve creation date and update the UpdatedAt timestamp.
- BR-FE11-015: Deactivation must be reversible; reactivation must restore user status to ACTIVE.

---

## 7. Functional Requirements

- FR-FE11-001: When admin opens user list, the system shall display all users with pagination and support for filtering/searching.
- FR-FE11-002: When admin views user details, the system shall display all user information and related data.
- FR-FE11-003: When admin creates a new member account with valid data, the system shall create a user record with Member role.
- FR-FE11-004: When admin creates a new librarian account with valid data, the system shall create a user record with Librarian role.
- FR-FE11-005: When admin submits a create user form with duplicate email, the system shall reject the request with clear error message.
- FR-FE11-006: When admin submits a create user form with invalid password, the system shall reject the request.
- FR-FE11-007: When admin updates user information, the system shall validate email uniqueness before updating.
- FR-FE11-008: When admin updates user information, the system shall update the UpdatedAt timestamp.
- FR-FE11-009: When admin deactivates a user account, the system shall set status to INACTIVE and invalidate active sessions.
- FR-FE11-010: When admin reactivates a user account, the system shall set status to ACTIVE.
- FR-FE11-011: When admin assigns a role to a user, the system shall create an entry in UserRoles table.
- FR-FE11-012: When admin revokes a role from a user, the system shall remove the entry from UserRoles table.
- FR-FE11-013: When admin revokes the last Admin role, the system shall reject the action.
- FR-FE11-014: When admin resets a user's password, the system shall hash the new password and update the user record.

---

## 8. Acceptance Criteria

- AC-FE11-001: Given admin access, when viewing user list, then system displays paginated list with filtering and search.
- AC-FE11-002: Given admin access, when viewing a user detail page, then all user information is displayed.
- AC-FE11-003: Given valid member data, when admin creates new member account, then user record is created with Member role.
- AC-FE11-004: Given valid librarian data, when admin creates new librarian account, then user record is created with Librarian role.
- AC-FE11-005: Given duplicate email, when admin creates new user, then system rejects with error message.
- AC-FE11-006: Given invalid password (too weak), when admin creates new user, then system rejects with error message.
- AC-FE11-007: Given existing user, when admin updates user information, then changes are saved and UpdatedAt is updated.
- AC-FE11-008: Given duplicate email in update, when admin updates user, then system rejects the update.
- AC-FE11-009: Given active user, when admin deactivates account, then status changes to INACTIVE.
- AC-FE11-010: Given deactivated user, when admin reactivates account, then status changes to ACTIVE.
- AC-FE11-011: Given user with active session, when admin deactivates account, then session is invalidated.
- AC-FE11-012: Given user without Admin role, when admin assigns Admin role, then UserRoles table is updated.
- AC-FE11-013: Given user with Admin role, when admin revokes Admin role (not last admin), then UserRoles table is updated.
- AC-FE11-014: Given last admin user, when admin attempts to revoke Admin role, then system rejects action.
- AC-FE11-015: Given user account, when admin resets password, then password is updated and hashed.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE11-001 | Admin ID does not exist | Return not found error. |
| EC-FE11-002 | User ID to be updated does not exist | Return not found error. |
| EC-FE11-003 | Email contains SQL injection payload | Sanitize input and validate email format; reject if invalid. |
| EC-FE11-004 | Email address with special characters | Validate email format strictly according to RFC standards. |
| EC-FE11-005 | Password with very long length (>1000 chars) | Set reasonable max length (e.g., 255) and reject. |
| EC-FE11-006 | Attempting to deactivate self (admin) | May allow or show warning; decision depends on team policy. |
| EC-FE11-007 | Concurrent updates to same user | Last write wins or use optimistic locking with version field. |
| EC-FE11-008 | Database update fails during user creation | Roll back transaction; return error to user. |
| EC-FE11-009 | Invalidating sessions for deactivated user fails | Log error but allow deactivation to proceed. |
| EC-FE11-010 | Role does not exist when assigning | Return not found error. |
| EC-FE11-011 | User already has the role being assigned | Reject with message: "User already has this role." |
| EC-FE11-012 | Attempting to revoke non-existent role | Return not found error. |
| EC-FE11-013 | User has no role after revocation | Reject; user must have at least one role. |
| EC-FE11-014 | Email update to same email | Allow (no-op) or accept without complaint. |
| EC-FE11-015 | Reactivating user whose email is now taken | Email may not have changed; proceed with reactivation. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Stores user account data: email, password hash, name, phone, address, status, timestamps. |
| Roles | Defines available roles: Member, Librarian, Admin. |
| UserRoles | Maps users to roles; supports multiple roles per user. |
| Sessions (optional) | Stores active session records for invalidation when user deactivates. |
| AuditLogs | Records all user management actions. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| userId | integer | Yes | Primary key, auto-increment. |
| email | string | Yes | Unique, valid email format, max 255 chars. |
| username | string | No | Optional alternative login field. |
| passwordHash | string | Yes | bcrypt hash, never store plaintext. |
| fullName | string | Yes | User's display name, max 255 chars. |
| phoneNumber | string | No | User's phone number. |
| address | string | No | User's address. |
| department | string | No | For librarian: department assignment. |
| specialization | string | No | For librarian: specialization or expertise. |
| status | enum | Yes | Values: `ACTIVE`, `INACTIVE`, `LOCKED`, `DELETED`. |
| createdAt | datetime | Yes | Account creation timestamp. |
| updatedAt | datetime | Yes | Last update timestamp. |
| lastLoginAt | datetime | No | Last successful login timestamp. |
| lastPasswordChangedAt | datetime | No | Last password change timestamp. |
| lockedUntil | datetime | No | Timestamp when account will auto-unlock (if locked). |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract must be copied into `docs/api/api-contract.md` before implementation.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/users` | Admin | Query: page, limit, status, role, search | List of users with pagination | Supports filtering and search. |
| GET | `/api/users/{userId}` | Admin | - | User detail information | Includes roles and related data. |
| POST | `/api/users` | Admin | `{ email: string, password: string, fullName: string, type: "member"\|"librarian", phone?: string, address?: string }` | Created user with ID | Creates new user. |
| PUT | `/api/users/{userId}` | Admin | `{ fullName?: string, phone?: string, address?: string, department?: string }` | Updated user | Updates user information. |
| PATCH | `/api/users/{userId}/status` | Admin | `{ status: "ACTIVE"\|"INACTIVE" }` | Updated user status | Deactivate or reactivate. |
| PATCH | `/api/users/{userId}/password` | Admin | `{ newPassword: string }` | Success message | Admin reset password for user. |
| PATCH | `/api/users/{userId}/unlock` | Admin | - | Success message | Unlock a locked account. |
| POST | `/api/users/{userId}/roles` | Admin | `{ roleId: number }` | User with updated roles | Assign role to user. |
| DELETE | `/api/users/{userId}/roles/{roleId}` | Admin | - | User with updated roles | Revoke role from user. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE11-SEC-001: All user management endpoints must require authentication and Admin role.
- NFR-FE11-SEC-002: Role-based access control must be enforced on the server.
- NFR-FE11-SEC-003: Password updates must use bcrypt hashing (cost ≥ 10).
- NFR-FE11-SEC-004: All inputs (email, name, password) must be validated and sanitized on the server.
- NFR-FE11-SEC-005: SQL injection must be prevented using parameterized queries.
- NFR-FE11-SEC-006: Admin cannot view other admin's password hash or sensitive details beyond necessary.
- NFR-FE11-SEC-007: Email field must be case-insensitive for uniqueness checks.

### 12.2 Transaction Integrity

- NFR-FE11-TXN-001: Creating a user must be atomic: user record, default role assignment, and audit log must succeed together or roll back.
- NFR-FE11-TXN-002: Deactivating a user must be atomic: user status, session invalidation, and audit log must succeed together or roll back.
- NFR-FE11-TXN-003: Role assignment must be atomic: UserRoles update and audit log must succeed together or roll back.

### 12.3 Performance

- NFR-FE11-PERF-001: User list should support pagination and handle large user counts efficiently.
- NFR-FE11-PERF-002: Lookup by email or user ID should use indexed queries.
- NFR-FE11-PERF-003: Role lookup should be efficient (consider caching role data).

### 12.4 Logging and Audit

- NFR-FE11-LOG-001: Create, update, deactivate, and role assignment actions must write audit log entries.
- NFR-FE11-LOG-002: Audit log must include: action type, admin ID, target user ID, timestamp, and details of changes.

### 12.5 Usability

- NFR-FE11-UX-001: Validation errors must be clear and explain what went wrong (e.g., "Email already exists", "Password too weak").
- NFR-FE11-UX-002: Confirmation dialogs should appear before destructive actions (deactivate, revoke role).
- NFR-FE11-UX-003: User list should display relevant columns: email, name, status, roles, last login, created date.

---

## 13. Out of Scope

This feature does not include:

- User profile editing by non-admins (that belongs to FE03).
- Password reset by users themselves (that belongs to FE02 Authentication).
- Permanent user deletion (only deactivation is supported).
- User import/bulk operations via CSV.
- Role-based activity reports.
- User registration by self-service (that belongs to FE02).
- LDAP/Active Directory user sync.
- Single sign-on (SSO) integration.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE02 Authentication | Internal | User/role info is used for access control. |
| FE03 User Profile | Internal | User profile updates here relate to user data. |
| SQL Server database | Technical | Stores Users, Roles, UserRoles, and AuditLogs tables. |

---

## 15. Open Questions

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE11-001 | Should admins be able to deactivate themselves? | Team/Teacher | Open |
| Q-FE11-002 | Should system prevent deactivation of users with active borrowings, or just warn? | Team/Teacher | Open |
| Q-FE11-003 | What is the password complexity requirement for user creation? (length, uppercase, number, symbol) | Team/Teacher | Open |
| Q-FE11-004 | Should email be case-sensitive or case-insensitive for login and uniqueness checks? | Team/Teacher | Open |
| Q-FE11-005 | Should user creation automatically send welcome email with temporary password? | Team/Teacher | Open |
| Q-FE11-006 | How long should deactivated user data be retained before permanent deletion? (e.g., 1 year, never) | Team/Teacher | Open |
| Q-FE11-007 | Should admin be able to unlock locked accounts, or only auto-unlock after timeout? | Team/Teacher | Open |
| Q-FE11-008 | Should system support role hierarchy (e.g., Admin > Librarian > Member)? | Team/Teacher | Open |
| Q-FE11-009 | Should admin be able to view or reset other admin's passwords? | Team/Teacher | Open |
| Q-FE11-010 | Should user deactivation notify the user via email? | Team/Teacher | Open |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE11-001 | (All FE11 flows) | (All FE11 tests) | Not Started |
| BR-FE11-003 | All update/deactivate flows | All tests | Not Started |
| BR-FE11-004 | Create user flows | FT01, FT02 | Not Started |
| BR-FE11-007 | Create user, role assignment | FT01, FT02, FT08 | Not Started |
| BR-FE11-010 | All flows | All tests | Not Started |
| FR-FE11-001 | View user list | FT01 | Not Started |
| FR-FE11-003 | Create member | FT02 | Not Started |
| FR-FE11-004 | Create librarian | FT02 | Not Started |
| FR-FE11-007 | Update user information | FT03 | Not Started |
| FR-FE11-009 | Deactivate user | FT04 | Not Started |
| FR-FE11-011 | Manage roles | FT08 | Not Started |

---

## 17. Review Checklist

Before this SPEC.md is approved:

- [ ] Open questions Q-FE11-001 to Q-FE11-010 are resolved or explicitly accepted as TBD.
- [ ] Password complexity requirements are approved.
- [ ] Admin deactivation policy is clarified.
- [ ] Email case-sensitivity for uniqueness is decided.
- [ ] Role hierarchy and multiple role support are confirmed.
- [ ] User data retention policy after deactivation is defined.
- [ ] Database schema for Users, Roles, UserRoles is confirmed.
- [ ] API contract is copied to `docs/api/api-contract.md`.
- [ ] FE02, FE03 dependencies are checked for conflicts.
- [ ] Every acceptance criterion can become a test.
- [ ] Security requirements (bcrypt cost, SQL injection prevention) are reviewed.
