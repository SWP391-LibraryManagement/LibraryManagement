# SPEC.md - FE11 User & Role Management

# Version: 0.1.0

# Status: APPROVED

# Owner: Dung

# Last Updated: 2026-06-10

# Feature ID: FE11

# Feature folder: `.sdd/specs/feat-user-role-management/`

> Source of truth for FE11 User & Role Management. This spec is approved for Phase 2 planning. It is intentionally detailed because FE11 is critical to system access control and administration.
>
> Decisions in this spec were reviewed and approved on 2026-06-10. See `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.

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
- Allow admins to deactivate user accounts.
- Allow admins to deactivate librarian accounts.
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

### MF-FE11-003: Create User Account

1. Admin navigates to create new user form.
2. Admin selects user type: Member or another non-librarian user type approved by the team.
3. Admin enters required fields: email, full name, phone (optional), address (optional).
4. The system validates email format and checks for duplicate email.
5. The system creates a new user record with status `INACTIVE`, assigns Member role, and stores an unusable placeholder password hash if the current database requires `PasswordHash NOT NULL`.
6. The system generates a one-time password setup token (valid for 24 hours).
7. The system sends a password setup link to the user's email via the notification system (FE02/FE10).
8. The user cannot login until the password setup link is completed through FE02.
9. The system writes an audit log entry.
10. The system shows success message and displays the new user ID.

### MF-FE11-004: Update User Information

1. Admin opens user detail page for an existing user.
2. Admin edits one or more fields: full name, phone, address, or email.
3. The system validates updated email if changed (must be unique).
4. The system updates the user record.
5. The system updates the `UpdatedAt` timestamp.
6. The system writes an audit log entry with details of what changed.
7. The system shows success message.

### MF-FE11-005: Deactivate User Account

1. Admin opens user detail page.
2. Admin clicks "Deactivate Account" button.
3. The system checks active borrowings and blocks deactivation when active borrowings exist.
4. Admin confirms deactivation.
5. The system sets user status to `INACTIVE`.
6. The system keeps user data intact (does not delete).
7. The system invalidates any active sessions/tokens for that user.
8. The system writes an audit log entry.
9. The system shows success message.

### MF-FE11-006: Create Librarian Account

1. Admin navigates to create new user form.
2. Admin selects user type: Librarian.
3. Admin enters required fields: email, full name, department (optional), specialization (optional).
4. The system validates email format and checks for duplicate email.
5. The system creates a new user record with status `INACTIVE`, assigns Librarian role, and stores an unusable placeholder password hash if the current database requires `PasswordHash NOT NULL`.
6. The system generates a one-time password setup token (valid for 24 hours).
7. The system sends a password setup link to the user's email via the notification system (FE02/FE10).
8. The user cannot login until the password setup link is completed through FE02.
9. The system writes an audit log entry.
10. The system shows success message.

### MF-FE11-007: Update Librarian Account

1. Admin opens an existing librarian account.
2. Admin edits librarian fields such as full name, phone, email, department, or specialization.
3. The system validates changes and email uniqueness.
4. The system saves updates.
5. The system updates the `UpdatedAt` timestamp.
6. The system writes an audit log entry.
7. The system shows success message.

### MF-FE11-008: Deactivate Librarian Account

1. Admin opens an existing librarian account.
2. Admin confirms deactivation.
3. The system sets librarian user status to `INACTIVE`.
4. The system invalidates any active sessions/tokens for that librarian.
5. The system writes an audit log entry.
6. The system shows success message.

### MF-FE11-009: Manage Roles

1. Admin opens user detail page.
2. Admin views current roles assigned to the user.
3. Admin can add additional role to the user (assign role).
4. Admin can remove role from the user (revoke role).
5. The system validates that action (e.g., cannot remove last admin role from last admin).
6. The system updates the UserRoles mapping.
7. The system writes an audit log entry with role change details.
8. The system shows success message.

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

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE11-001: Only authenticated Admin users can access user management features.
- BR-FE11-002: Only authenticated Admin users can create new users.
- BR-FE11-003: Users cannot be permanently deleted; only deactivated (set to INACTIVE status).
- BR-FE11-004: Each user must have a unique email address in the system.
- BR-FE11-005: When an admin creates a user, the account must start in `INACTIVE` setup state and must not be login-capable until the user completes password setup through FE02.
- BR-FE11-006: When a user account is deactivated, all active sessions/tokens for that user must be invalidated.
- BR-FE11-007: Every user must have at least one role assigned (Member, Librarian, or Admin).
- BR-FE11-008: A user can have multiple roles assigned simultaneously (e.g., Librarian and Admin).
- BR-FE11-009: The system must never allow removal of all Admin roles if only one Admin remains.
- BR-FE11-010: Every user management action (create, update, deactivate, role change) must be auditable.
- BR-FE11-011: A member user cannot create or manage other users.
- BR-FE11-012: A librarian user cannot create or manage users.
- BR-FE11-013: Admin never enters, sees, or creates passwords directly. Password setup generates a one-time token link sent via email, and the user sets their own password through FE02.
- BR-FE11-014: User information updates must preserve creation date and update the UpdatedAt timestamp.
- BR-FE11-015: Librarian accounts are user accounts with the Librarian role and must follow the same security, audit, and deactivation rules as other user accounts.

---

## 7. Functional Requirements

- FR-FE11-001: When admin opens user list, the system shall display all users with pagination and support for filtering/searching.
- FR-FE11-002: When admin views user details, the system shall display all user information and related data.
- FR-FE11-003: When admin creates a new user account with valid data, the system shall create an `INACTIVE` user record with the selected approved role and send a password setup link.
- FR-FE11-004: When admin updates user information, the system shall validate email uniqueness before updating.
- FR-FE11-005: When admin submits a create user form with duplicate email, the system shall reject the request with clear error message.
- FR-FE11-006: The system shall never require admin to enter a password when creating users; password setup must happen through a one-time FE02 token flow.
- FR-FE11-007: When admin updates user information, the system shall update the UpdatedAt timestamp.
- FR-FE11-008: When admin deactivates a user account, the system shall set status to INACTIVE and invalidate active sessions.
- FR-FE11-009: When admin creates a new librarian account with valid data, the system shall create an `INACTIVE` user record with Librarian role and send a password setup link.
- FR-FE11-010: When admin updates librarian account information, the system shall validate and save librarian-specific fields such as department and specialization.
- FR-FE11-011: When admin deactivates a librarian account, the system shall set status to INACTIVE and invalidate active sessions.
- FR-FE11-012: When admin assigns a role to a user, the system shall create an entry in UserRoles table.
- FR-FE11-013: When admin revokes a role from a user, the system shall remove the entry from UserRoles table.
- FR-FE11-014: When admin revokes the last Admin role, the system shall reject the action.

---

## 8. Acceptance Criteria

- AC-FE11-001: Given admin access, when viewing user list, then system displays paginated list with filtering and search.
- AC-FE11-002: Given admin access, when viewing a user detail page, then all user information is displayed.
- AC-FE11-003: Given valid user data, when admin creates new user account, then an inactive user record is created with an approved role and setup link is sent.
- AC-FE11-004: Given existing user, when admin updates user information, then changes are saved and UpdatedAt is updated.
- AC-FE11-005: Given duplicate email, when admin creates new user, then system rejects with error message.
- AC-FE11-006: Given admin creates new member or librarian, then NO password field is required or shown and the account cannot login until setup is completed.
- AC-FE11-007: Given active user, when admin deactivates account, then status changes to INACTIVE.
- AC-FE11-008: Given duplicate email in update, when admin updates user, then system rejects the update.
- AC-FE11-009: Given user with active session, when admin deactivates account, then session is invalidated.
- AC-FE11-010: Given valid librarian data, when admin creates new librarian account, then an inactive user record is created with Librarian role and setup link is sent.
- AC-FE11-011: Given existing librarian account, when admin updates librarian information, then changes are saved and UpdatedAt is updated.
- AC-FE11-012: Given active librarian account, when admin deactivates librarian account, then status changes to INACTIVE and active sessions are invalidated.
- AC-FE11-013: Given user without Admin role, when admin assigns Admin role, then UserRoles table is updated.
- AC-FE11-014: Given user with Admin role, when admin revokes Admin role (not last admin), then UserRoles table is updated.
- AC-FE11-015: Given last admin user, when admin attempts to revoke Admin role, then system rejects action.

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
| EC-FE11-015 | Librarian-specific field is too long or invalid | Reject the update and return a validation error. |

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
| passwordHash | string | Yes | bcrypt hash, never store plaintext. Admin-created accounts may store an unusable placeholder hash until the user completes password setup through FE02, matching the current SQL `PasswordHash NOT NULL` constraint. |
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
| passwordSetupToken | string | No | One-time token for password setup. Expires after 24 hours or first use. Token value must not be exposed to admin. |
| passwordSetupTokenExpiresAt | datetime | No | Expiration timestamp for password setup token. |
| lockedUntil | datetime | No | Timestamp when account will auto-unlock (if locked). |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract may stay in this SPEC.md unless the team reintroduces a dedicated shared API contract document.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/users` | Admin | Query: page, limit, status, role, search | List of users with pagination | Supports filtering and search. |
| GET | `/api/users/{userId}` | Admin | - | User detail information | Includes roles and related data. |
| POST | `/api/users` | Admin | `{ email: string, fullName: string, type: "member"\|"librarian", phone?: string, address?: string, department?: string, specialization?: string }` | Created inactive user with ID and setup link sent to email | Creates new user without admin-entered password; sends password setup link to email via FE02/FE10. |
| PUT | `/api/users/{userId}` | Admin | `{ fullName?: string, phone?: string, address?: string, department?: string }` | Updated user | Updates user information. |
| PATCH | `/api/users/{userId}/status` | Admin | `{ status: "INACTIVE" }` | Updated user status | Deactivate user or librarian account. |
| POST | `/api/users/{userId}/roles` | Admin | `{ roleId: number }` | User with updated roles | Assign role to user. |
| DELETE | `/api/users/{userId}/roles/{roleId}` | Admin | - | User with updated roles | Revoke role from user. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE11-SEC-001: All user management endpoints must require authentication and Admin role.
- NFR-FE11-SEC-002: Role-based access control must be enforced on the server.
- NFR-FE11-SEC-003: Password setup completion must use FE02 bcrypt hashing rules (cost >= 10).
- NFR-FE11-SEC-004: All inputs (email, name, phone, address, department, specialization, role IDs) must be validated and sanitized on the server.
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
- Admin-initiated password reset for existing users unless explicitly added by FE02/FE11 later.
- Account unlock after failed login lockout unless explicitly added by FE02/FE11 later.
- Reactivating deactivated accounts unless explicitly approved as a separate flow later.
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

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE11-001 | Admins cannot deactivate themselves. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-002 | Prevent deactivation of users with active borrowings. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-003 | Password setup uses the same FE02 password complexity rule. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-004 | Email is case-insensitive for login and uniqueness. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-005 | Admin-created user receives one-time password setup link when FE10/email mock is available. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-006 | Do not permanently delete deactivated user data in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-007 | No role hierarchy in Phase 1; roles are flat. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-008 | Admin cannot view sensitive account fields such as password hash, reset tokens, refresh tokens. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-009 | User deactivation notification is optional/future work; no mandatory Phase 1 notification. | Review packet 2026-06-10 | APPROVED |

---

## 15.1 Approved Design Decisions

The following decisions were approved in the Phase 1 review packet on 2026-06-10 and are now part of this spec.

| Decision | Approved Answer | Status |
| -------- | --------------- | ------ |
| Q-FE11-001 | Admins cannot deactivate themselves. | APPROVED |
| Q-FE11-002 | Prevent deactivation of users with active borrowings. | APPROVED |
| Q-FE11-003 | Password setup uses the same FE02 password complexity rule. | APPROVED |
| Q-FE11-004 | Email is case-insensitive for login and uniqueness. | APPROVED |
| Q-FE11-005 | Admin-created user receives one-time password setup link when FE10/email mock is available. | APPROVED |
| Q-FE11-006 | Do not permanently delete deactivated user data in Phase 1. | APPROVED |
| Q-FE11-007 | No role hierarchy in Phase 1; roles are flat. | APPROVED |
| Q-FE11-008 | Admin cannot view sensitive account fields such as password hash, reset tokens, refresh tokens. | APPROVED |
| Q-FE11-009 | User deactivation notification is optional/future work; no mandatory Phase 1 notification. | APPROVED |

---

## 16. Traceability Matrix

### FE11 Acceptance Criteria to Requirements to Tests

| AC ID | Acceptance Criterion | Related FR | Related BR | Test Case | Status |
| ----- | -------------------- | ---------- | ---------- | --------- | ------ |
| AC-FE11-001 | Admin accesses user list -> system displays paginated list with filtering and search | FR-FE11-001 | BR-FE11-001, BR-FE11-010 | FT50 | Not Started |
| AC-FE11-002 | Admin accesses user detail page -> all user information displayed | FR-FE11-002 | BR-FE11-001, BR-FE11-010 | FT51 | Not Started |
| AC-FE11-003 | Valid user data submitted by admin -> inactive user record created with approved role and setup link sent | FR-FE11-003 | BR-FE11-002, BR-FE11-004, BR-FE11-005, BR-FE11-007 | FT52 | Not Started |
| AC-FE11-004 | Admin updates user information -> changes saved, UpdatedAt timestamp updated | FR-FE11-004, FR-FE11-007 | BR-FE11-010, BR-FE11-014 | FT53 | Not Started |
| AC-FE11-005 | Duplicate email submitted when creating user -> system rejects with error message | FR-FE11-005 | BR-FE11-004 | FT52 | Not Started |
| AC-FE11-006 | Admin creates new user -> no password field required or shown; account cannot login until FE02 setup completes | FR-FE11-006 | BR-FE11-005, BR-FE11-013 | FT52, FT55 | Not Started |
| AC-FE11-007 | Active user deactivated by admin -> status changes to INACTIVE | FR-FE11-008 | BR-FE11-003, BR-FE11-006, BR-FE11-010 | FT54 | Not Started |
| AC-FE11-008 | Admin updates user email to duplicate -> system rejects the update | FR-FE11-004 | BR-FE11-004 | FT53 | Not Started |
| AC-FE11-009 | User with active session deactivated by admin -> session invalidated | FR-FE11-008 | BR-FE11-006 | FT54 | Not Started |
| AC-FE11-010 | Valid librarian data submitted by admin -> inactive user record created with Librarian role and setup link sent | FR-FE11-009 | BR-FE11-002, BR-FE11-004, BR-FE11-005, BR-FE11-007, BR-FE11-015 | FT55 | Not Started |
| AC-FE11-011 | Admin updates librarian information -> changes saved, UpdatedAt timestamp updated | FR-FE11-010 | BR-FE11-010, BR-FE11-014, BR-FE11-015 | FT56 | Not Started |
| AC-FE11-012 | Active librarian account deactivated by admin -> status changes to INACTIVE and sessions are invalidated | FR-FE11-011 | BR-FE11-003, BR-FE11-006, BR-FE11-010, BR-FE11-015 | FT57 | Not Started |
| AC-FE11-013 | User without Admin role receives Admin role assignment -> UserRoles updated | FR-FE11-012 | BR-FE11-007, BR-FE11-008, BR-FE11-010 | FT58 | Not Started |
| AC-FE11-014 | User with Admin role has role revoked (not last admin) -> UserRoles updated | FR-FE11-013 | BR-FE11-007, BR-FE11-010 | FT58 | Not Started |
| AC-FE11-015 | Last remaining admin attempts to revoke Admin role -> system rejects action | FR-FE11-014 | BR-FE11-009, BR-FE11-010 | FT58 | Not Started |

### Coverage Summary (FE11)
- **Total AC**: 15 (AC-FE11-001 to AC-FE11-015) ✓ All mapped
- **Total FR**: 14 (FR-FE11-001 to FR-FE11-014) ✓ All mapped
- **Total BR**: 15 (BR-FE11-001 to BR-FE11-015) ✓ All mapped
- **Total Tests**: 9 (FT50 to FT58) - aligned with assignment sheet


### External Assignment Traceability (Excel UC IDs)

| Assignment UC ID | Excel Use Case | Related Main Flow / Requirement | Related Test |
| ---------------- | -------------- | ------------------------------- | ------------ |
| UC49 | View User List | MF-FE11-001; FR-FE11-001 | FT50 |
| UC50 | View User Information | MF-FE11-002; FR-FE11-002 | FT51 |
| UC51 | Create User Account | MF-FE11-003; FR-FE11-003, FR-FE11-005, FR-FE11-006 | FT52 |
| UC52 | Update User Information | MF-FE11-004; FR-FE11-004, FR-FE11-007 | FT53 |
| UC53 | Deactivate User Account | MF-FE11-005; FR-FE11-008 | FT54 |
| UC54 | Create Librarian Account | MF-FE11-006; FR-FE11-009 | FT55 |
| UC55 | Update Librarian Account | MF-FE11-007; FR-FE11-010 | FT56 |
| UC56 | Deactivate Librarian Account | MF-FE11-008; FR-FE11-011 | FT57 |
| UC57 | Manage Roles | MF-FE11-009; FR-FE11-012 to FR-FE11-014 | FT58 |

---

## 17. Review Checklist

All decisions in section 15.1 were approved in the Phase 1 review packet on 2026-06-10.

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Approved decisions recorded: All proposed decisions in Section 15.1 (admin self-deactivation, active borrowings handling, email case-insensitivity, deactivated data retention, role hierarchy, deactivation notification) are explicitly approved by Team/Owner.
- [x] Security decisions (Q-FE11-005: token-based password setup, Q-FE11-008: admin never sees password hashes or tokens) are reviewed and approved by Security/Architect.
- [x] Q-FE11-009 (deactivation notification) is explicitly marked "Out of Scope Phase 1" or moved to future planning.
- [x] Password complexity requirements are approved.
- [x] Admin deactivation policy is clarified.
- [x] Email case-sensitivity for uniqueness is decided.
- [x] Role hierarchy and multiple role support are confirmed.
- [x] User data retention policy after deactivation is defined.
- [x] Database schema for Users, Roles, UserRoles is confirmed.
- [x] API contract is approved in this SPEC.md or copied to a dedicated shared API contract file if the team reintroduces one.
- [x] FE02, FE03 dependencies are checked for conflicts.
- [x] Every acceptance criterion can become a test.
- [x] Security requirements (bcrypt cost, SQL injection prevention) are reviewed.
