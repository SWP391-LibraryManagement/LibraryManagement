# SPEC.md - FE11 User & Role Management

# Version: 0.5.0

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Dung

# Last Updated: 2026-07-20

# Feature ID: FE11

# Feature folder: `.sdd/specs/feat-user-role-management/`

> Current delivery status (2026-07-20): `COMPLETE` for the approved Phase 1 scope.
> `TASKS.md` and `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> are authoritative for current implementation state. Older `Not Started`,
> `PARTIAL`, `READY FOR REVIEW`, or pending-review labels retained below are
> historical planning/evidence snapshots, not the current delivery state.

> Source of truth for FE11 User & Role Management. This spec is approved for Phase 2 planning. It is intentionally detailed because FE11 is critical to system access control and administration.
>
> Decisions in this spec were reviewed and approved on 2026-06-10. See `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
>
> The admin-created account setup revision is approved through `ADR-005-admin-created-account-setup-boundary.md`. The FE11 Finalization Batch governance contract was approved on 2026-07-19; Wave A/Wave B product implementation remains pending its named H2/H3 gates.

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
- Provide admin console navigation for Home, Dashboard, Library, Borrowing Management, Request Management, All Users, and Audit Logs.
- Provide read-only permission/reporting views that summarize users, roles, access rules, and audit activity without duplicating FE12 reporting scope.
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
3. The system returns users in stable order `CreatedAt DESC, UserId DESC` and applies the canonical pagination contract.
4. The system supports filtering by `status` (`ACTIVE`, `INACTIVE`, or `LOCKED`) and `role` (`member`, `librarian`, or `admin`).
5. The system supports a trimmed `search` value against email, name, or user ID.
6. Admin can click on a user to view detailed information.

### MF-FE11-002: View User Information

1. Admin opens the user list or searches for a specific user.
2. Admin clicks on a user record to view detailed information.
3. The system returns the safe `UserManagementView` DTO defined in Section 10.3: ID, email, username, full name, phone, address, status, roles, created date, last updated date, last login date, and approved librarian fields when applicable.
4. The detail response includes `relatedSummary` with `activeBorrowingCount`, `unpaidFineTotal`, and `openReservationCount`; missing source records produce zero values. Credential hashes, raw tokens, token hashes, session identifiers, reset/setup links, and secret audit metadata are never returned.

### MF-FE11-003: Create User Account

1. Admin navigates to create new user form.
2. Admin selects exactly one supported user type: `member` or `librarian`.
3. Admin enters required fields: email, full name, phone (optional), address (optional).
4. The system validates and normalizes the request at the route boundary.
5. In one transaction, the system locks and revalidates the active acting Admin, checks normalized email/username uniqueness, creates a new user record with status `INACTIVE`, assigns the Member role, stores an unusable bcrypt hash of a discarded server-generated value, creates a hashed `ACCOUNT_SETUP` token with a 24-hour expiry, and writes the FE11 audit entry.
6. After the source transaction commits, FE11 requests `ACCOUNT_SETUP` delivery through the requester bound to `FE11`, using `AuthToken` source metadata and idempotency key `FE11:ACCOUNT_SETUP:<tokenId>`.
7. FE10 renders and sends the setup link without persisting or returning the raw token, link, or rendered sensitive content.
8. Password-based login remains unavailable while the account is `INACTIVE`.
9. If delivery fails, the account remains `INACTIVE` and the response reports only safe delivery status; the Admin can use the approved resend flow.
10. The system shows the new user ID, assigned role, account status, and safe setup-delivery status.

### MF-FE11-004: Update User Information

1. Admin opens user detail page for an existing user.
2. Admin edits one or more fields: full name, phone, address, or email, and submits the `expectedUpdatedAt` effective version from the loaded record.
3. The system validates updated email if changed (must be unique).
4. The system updates the record only when `COALESCE(Users.UpdatedAt, Users.CreatedAt)` still equals `expectedUpdatedAt`.
5. If the value is stale, the system returns `409 STALE_USER_STATE` and changes nothing; otherwise it updates the user and advances `UpdatedAt`.
6. The system writes an audit log entry with details of what changed.
7. The system shows success message.

### MF-FE11-005: Deactivate User Account

1. Admin opens user detail page.
2. Admin clicks "Deactivate Account" button and submits the loaded `expectedUpdatedAt` effective version.
3. The system rejects an `INACTIVE` pending-activation account with `409 ACCOUNT_PENDING_ACTIVATION`; only an already-deactivated account with non-null `deactivatedAt` is an idempotent no-op.
4. The system checks active borrowings and blocks deactivation when active borrowings exist.
5. Admin confirms deactivation of an `ACTIVE` or `LOCKED` account.
6. The system sets user status to `INACTIVE` and records server timestamp `deactivatedAt`.
7. The system keeps user data intact (does not delete).
8. In the same transaction, the system invalidates all active refresh/session credentials for that user.
9. The system writes the audit log entry in the same transaction; if credential invalidation or audit persistence fails, the deactivation rolls back.
10. The system shows success message.

### MF-FE11-006: Create Librarian Account

1. Admin navigates to create new user form.
2. Admin selects user type: Librarian.
3. Admin enters required fields: email, full name, department (optional), specialization (optional).
4. The system validates and normalizes the request at the route boundary.
5. In one transaction, the system locks and revalidates the active acting Admin, checks normalized email/username uniqueness, creates a new user record with status `INACTIVE`, persists trimmed nullable `department`/`specialization`, assigns the Librarian role, stores an unusable bcrypt hash of a discarded server-generated value, creates a hashed `ACCOUNT_SETUP` token with a 24-hour expiry, and writes the FE11 audit entry.
6. After the source transaction commits, FE11 requests `ACCOUNT_SETUP` delivery through the requester bound to `FE11`, using `AuthToken` source metadata and idempotency key `FE11:ACCOUNT_SETUP:<tokenId>`.
7. FE10 renders and sends the setup link without persisting or returning the raw token, link, or rendered sensitive content.
8. Password-based login remains unavailable while the account is `INACTIVE`.
9. If delivery fails, the account remains `INACTIVE` and the response reports only safe delivery status; the Admin can use the approved resend flow.
10. The system shows the new user ID, assigned role, account status, and safe setup-delivery status.

### MF-FE11-007: Update Librarian Account

1. Admin opens an existing librarian account.
2. Admin edits the librarian fields `fullName`, `phone`, `email`, `department`, and `specialization` and submits the loaded effective `expectedUpdatedAt`.
3. The system validates changes, 100-character Librarian field limits, and email uniqueness inside the transaction.
4. The system compares `COALESCE(Users.UpdatedAt, Users.CreatedAt)` and rejects stale state without mutation.
5. The system saves only effective changes; a no-op keeps the effective version and writes no success audit.
6. The system advances storage `UpdatedAt` and writes one safe audit for an effective change.
7. The system shows the authoritative safe DTO.

### MF-FE11-008: Deactivate Librarian Account

1. Admin opens an existing librarian account.
2. Admin confirms deactivation and submits the loaded effective `expectedUpdatedAt`.
3. The system rejects pending activation, stale state, self-target, or active-borrowing conflicts without mutation.
4. For an `ACTIVE` or `LOCKED` librarian, the system sets status to `INACTIVE` and records server timestamp `deactivatedAt`.
5. In the same transaction, the system invalidates all active refresh/session credentials for that librarian.
6. The system writes the audit log entry in the same transaction; failure rolls back the deactivation.
7. The system shows the authoritative safe DTO.

### MF-FE11-009: Manage Roles

1. Admin opens user detail page.
2. Admin views current roles assigned to the user.
3. Admin can add additional role to the user (assign role).
4. Admin can remove role from the user (revoke role).
5. The system locks the affected role mappings, counts active Admin role holders in the same transaction, and rejects any action that would leave zero Admin role holders.
6. The system updates the UserRoles mapping.
7. The system writes an audit log entry with role change details.
8. The system shows success message.

### MF-FE11-014: Resend Password Setup Email

1. Admin opens an admin-created account whose password setup is incomplete.
2. Admin requests a new setup email.
3. In one transaction, the system first locks and revalidates the active acting Admin, then confirms that the target account is `INACTIVE`, has `ACCOUNT_SETUP` token history, has not completed setup, and is outside the 60-second issuance cooldown.
4. In that transaction, FE11 revokes prior active setup tokens, creates a new hashed `ACCOUNT_SETUP` token with a 24-hour expiry, and writes the resend audit entry.
5. FE11 requests a new `ACCOUNT_SETUP` delivery through the requester bound to `FE11`, using the new token ID and idempotency key.
6. The system returns safe `SENT` or `FAILED` delivery status without returning the token or setup link.

### MF-FE11-010: View Admin Dashboard And Console Navigation

1. Admin opens the admin console.
2. The system displays dashboard summary cards and operational charts using read-only data from book, borrowing, request, user, and fine sources.
3. The sidebar shows approved admin sections: Home, Dashboard, Library, Borrowing Management, Request Management, All Users, and Audit Logs.
4. The system does not show the removed `Permissions`, `Confirm Payment`, or `Confirm Borrow` sidebar entries.

### MF-FE11-011: View Permissions

1. Admin opens Permissions.
2. The system displays role summary and permission matrix for Admin, Librarian, and Member.
3. The system uses FE11 roles as the source of truth and does not allow non-admin users to edit permissions.

### MF-FE11-012: View Audit Logs

1. Admin opens Audit Logs.
2. The system lists important administrative/system actions with actor, action, target, timestamp, and safe details.
3. Admin may search logs and filter by date range. The API continues to support optional `action` and `actorId` filters for integrations, but the simplified Admin toolbar does not render separate controls for them.
4. Audit logs are read-only from the UI.

### MF-FE11-013: Manage Admin Request Review View

1. Admin opens Request Management.
2. The system lists borrow/request records using FE07 request data with search/filter/export controls.
3. Admin may view request detail.
4. Requests with status `PENDING` / `Chờ xác nhận` can be acted on by the approved borrowing workflow.
5. Requests with status `COMPLETED` / `Hoàn thành` are read-only and cannot be edited from this view.

---

## 5. Alternative Flows

### AF-FE11-001: Email Already Exists

1. Admin attempts to create a new user with an email already in use.
2. The system detects duplicate email.
3. The system returns error: "Email is already registered. Use a different email or update the existing user."

### AF-FE11-002: User Has Active Borrowings

1. Admin attempts to deactivate a user who has active borrowed books.
2. The system detects active borrowings.
3. The system rejects deactivation and reports: "This user has [N] active borrowed items."
4. Admin must resolve the active borrowing lifecycle before retrying deactivation.

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
- BR-FE11-003: Users cannot be permanently deleted; only deactivated (set to `INACTIVE` with server `deactivatedAt`). A deactivated account cannot be reactivated in Phase 1.
- BR-FE11-004: Each user must have a unique email address in the system.
- BR-FE11-005: When an Admin creates a user, the account must start with `INACTIVE` status and remain unable to authenticate until FE02 completes password setup and atomically activates it.
- BR-FE11-006: When a user account is deactivated, status change, `deactivatedAt`, invalidation of all active refresh/session credentials, and the audit log must commit atomically.
- BR-FE11-007: Every user must have at least one role assigned (Member, Librarian, or Admin).
- BR-FE11-008: A user can have multiple roles assigned simultaneously (e.g., Librarian and Admin).
- BR-FE11-009: The system must never allow removal of all Admin roles. The remaining-Admin count and role mutation must be checked under a transaction lock so concurrent role changes cannot bypass this rule.
- BR-FE11-010: Every user management action (create, update, deactivate, role change) must be auditable.
- BR-FE11-011: A member user cannot create or manage other users.
- BR-FE11-012: A librarian user cannot create or manage users.
- BR-FE11-013: Admin never enters, sees, or creates passwords directly. Password setup generates a one-time token link sent via email, and the user sets their own password through FE02.
- BR-FE11-014: User information updates must preserve creation date and update the UpdatedAt timestamp.
- BR-FE11-015: Librarian accounts are user accounts with the Librarian role and must follow the same security, audit, and deactivation rules as other user accounts.
- BR-FE11-016: The admin sidebar is an FE11-controlled access surface; it must show only approved admin sections and must not include the removed `Permissions`, `Confirm Payment`, or `Confirm Borrow` entries.
- BR-FE11-017: Permissions UI is a read-only role summary/matrix unless a separate role-editing action is explicitly performed under Manage Roles.
- BR-FE11-018: Audit Logs are read-only to admins and must not expose password hashes, tokens, or unnecessary personal data.
- BR-FE11-019: Admin Request Management may show FE07 request data, but completed requests are read-only; only pending requests may expose action controls.
- BR-FE11-020: Admin Dashboard may aggregate operational counts/charts, but detailed report generation remains owned by FE12 Reporting & Statistics.
- BR-FE11-021: FE11 owns issuance and revocation of admin-created `ACCOUNT_SETUP` tokens; FE02 owns token consumption, password hashing, and activation; FE10 owns setup-link rendering and delivery.
- BR-FE11-022: FE11 must request setup delivery only through `createSourceNotificationRequester('FE11')` using canonical pair `ACCOUNT_SETUP -> ACCOUNT_SETUP`, `sourceEntityType: AuthToken`, persisted token ID, and idempotency key `FE11:ACCOUNT_SETUP:<tokenId>`.
- BR-FE11-023: Raw setup tokens and links may exist only in process memory for the active request and must never appear in persistence, logs, audits, Admin responses, or test-only HTTP fields.
- BR-FE11-024: User, profile, initial role, setup token, and FE11 audit creation must commit or roll back together after the transaction locks and revalidates the active acting Admin and performs authoritative normalized email/username uniqueness checks; FE10 provider delivery occurs only after this source transaction and remains non-blocking.
- BR-FE11-025: Admin resend is allowed only after the source transaction locks and revalidates the active acting Admin and confirms an `INACTIVE` admin-created account with incomplete setup token history; each resend revokes prior active setup tokens and creates a new token/event/key after a 60-second cooldown.
- BR-FE11-026: User list/detail/update responses must use the approved `UserManagementView` DTO and must never expose password hashes, raw or hashed auth credentials, session identifiers, setup/reset links, or secret audit metadata.
- BR-FE11-027: Every user-information update and deactivation must use optimistic concurrency with the loaded non-null `updatedAt` effective version `COALESCE(Users.UpdatedAt, Users.CreatedAt)`; a stale mutation returns HTTP `409` with code `STALE_USER_STATE` and persists no field or audit-success change. If submitted update values produce no effective field change, the system returns the current safe DTO with HTTP `200`, does not advance storage `UpdatedAt`, and writes no success audit.

---

## 7. Functional Requirements

- FR-FE11-001: When admin opens user list, the system shall display the paginated `UserManagementView` list using `page = 1`/`limit = 20` defaults, `limit = 1..100` bounds, stable order `CreatedAt DESC, UserId DESC`, and the approved status/role/search filters.
- FR-FE11-002: When admin views user details, the system shall return the safe `UserManagementView` DTO with the required three-field `relatedSummary` and deterministic zero defaults, excluding every credential, token, session, link, and secret audit field listed in Section 10.3.
- FR-FE11-003: When Admin creates a new user account with valid data, the system shall revalidate the active acting Admin and normalized uniqueness inside the source transaction, atomically create an `INACTIVE` user, profile, approved role, hashed setup token, and audit entry, then request one FE10 setup delivery and return safe delivery status.
- FR-FE11-004: When admin updates user information, the system shall validate email uniqueness against other users before updating; a normalized email equal to the current user's email is not a duplicate, and other submitted changes are processed normally.
- FR-FE11-005: When admin submits a create user form with duplicate normalized email, including a concurrent conflict enforced by deterministic index `UX_Users_Email`, the system shall return `409 EMAIL_ALREADY_EXISTS`, persist no partial account/setup/audit state, and request no FE10 delivery.
- FR-FE11-006: The system shall never require admin to enter a password when creating users; password setup must happen through a one-time FE02 token flow.
- FR-FE11-007: When admin updates user information with at least one effective field change, the system shall update the `UpdatedAt` timestamp; a no-op update returns the current safe DTO without changing `UpdatedAt` or writing a success audit.
- FR-FE11-008: When admin deactivates an `ACTIVE` or `LOCKED` user account with matching effective `expectedUpdatedAt`, the system shall atomically set status to `INACTIVE`, set `deactivatedAt`, invalidate all active refresh/session credentials, and write the audit record; pending activation returns `409 ACCOUNT_PENDING_ACTIVATION` without mutation.
- FR-FE11-009: When Admin creates a new librarian account with valid data, the system shall revalidate the active acting Admin and normalized uniqueness inside the source transaction, atomically create an `INACTIVE` user, profile with trimmed nullable `department`/`specialization`, Librarian role, hashed setup token, and audit entry, then request one FE10 setup delivery and return safe delivery status.
- FR-FE11-010: When admin updates librarian account information, the system shall validate and save trimmed nullable `department` and `specialization` limited to 100 characters, advance storage `UpdatedAt` for an effective change, and audit the change.
- FR-FE11-011: When admin deactivates an `ACTIVE` or `LOCKED` librarian account with matching effective `expectedUpdatedAt`, the system shall atomically set status to `INACTIVE`, set `deactivatedAt`, invalidate all active refresh/session credentials, and write the audit record; pending activation returns `409 ACCOUNT_PENDING_ACTIVATION` without mutation.
- FR-FE11-012: When admin assigns a role to a user, the system shall create an entry in UserRoles table.
- FR-FE11-013: When admin revokes a role from a user, the system shall remove the entry from UserRoles table.
- FR-FE11-014: When admin assigns or revokes a role, the system shall lock the affected role mappings, evaluate the remaining Admin count in the same transaction, and reject any mutation that would leave zero Admin role holders.
- FR-FE11-030: When admin opens the console, the system shall display approved sidebar sections and shall hide removed Confirm Payment / Confirm Borrow navigation items.
- FR-FE11-031: When admin opens Dashboard, the system shall display read-only operational summary and chart data sourced from approved feature owners.
- FR-FE11-032: When admin opens Permissions, the system shall display role summary and permission matrix for Admin, Librarian, and Member.
- FR-FE11-033: When admin opens Audit Logs, the system shall display searchable/filterable read-only audit entries; the visible toolbar shall contain text search and date-range controls without separate `action` or `actorId` inputs.
- FR-FE11-034: When admin opens Request Management, the system shall list request records with search/filter/DOCX-export controls and view detail; export shall include every server page matching the frozen filters and only the approved request projection.
- FR-FE11-035: IF a request is already `COMPLETED`, the system shall disable edit/action controls and allow view-only access.
- FR-FE11-036: When Admin requests setup resend for an eligible incomplete account after cooldown, FE11 shall revalidate the active acting Admin inside the source transaction, revoke prior active setup tokens, create a new token ID, write an audit entry, and request one new FE10 `ACCOUNT_SETUP` delivery only after commit.
- FR-FE11-037: IF FE10 setup delivery fails during create or resend, FE11 shall preserve the committed `INACTIVE` account/token state and return only safe `FAILED` delivery status.
- FR-FE11-038: IF setup resend targets an ineligible account or occurs within 60 seconds of the latest setup-token issuance, FE11 shall reject the request without issuing or exposing a new credential.

### 7.1 Unwanted Behavior Requirements (Error / Abnormal Conditions)

These EARS Unwanted-behavior requirements promote existing error/abnormal branches (Alternative Flows, Business Rules, Edge Cases, Resolved Questions) into traceable functional requirements.

- FR-FE11-015: IF a non-admin user (Member, Librarian, or Guest) attempts to access any user management feature, the system shall reject the request with an authorization error. (Source: BR-FE11-001, BR-FE11-011, BR-FE11-012)
- FR-FE11-016: IF admin requests details, update, deactivation, or role change for a user ID that does not exist, the system shall return a not-found error. (Source: EC-FE11-002)
- FR-FE11-017: IF the acting Admin user is missing during create, setup resend, update, deactivation, or role mutation, the system shall return `404 ADMIN_NOT_FOUND` and shall not perform a source mutation or success audit; an inactive or non-Admin actor returns `403 ADMIN_REQUIRED`. (Source: EC-FE11-001)
- FR-FE11-018: IF admin attempts to deactivate their own account, the system shall reject the action. (Source: Q-FE11-001, EC-FE11-006)
- FR-FE11-019: IF admin attempts to deactivate a user who has active borrowings, the system shall block the deactivation and report the number of active borrowed items. (Source: AF-FE11-002, Q-FE11-002, MF-FE11-005 step 3)
- FR-FE11-020: IF admin updates a user's email to an address already used by another user, the system shall reject the update with a clear error message. (Source: AF-FE11-004, BR-FE11-004)
- FR-FE11-021: IF the submitted email is malformed, contains an SQL injection payload, or exceeds 255 characters, the system shall sanitize the input, reject the request, and return a validation error. (Source: EC-FE11-003, EC-FE11-004, EC-FE11-005)
- FR-FE11-022: IF a database error occurs during user creation, the system shall roll back the transaction and return an error without creating a partial user record. (Source: EC-FE11-008, NFR-FE11-TXN-001)
- FR-FE11-023: WHERE an update or deactivation `expectedUpdatedAt` does not equal `COALESCE(Users.UpdatedAt, Users.CreatedAt)`, the system shall reject the mutation with HTTP `409` and code `STALE_USER_STATE`, preserving the existing record and writing no success audit. (Source: EC-FE11-007, BR-FE11-027)
- FR-FE11-024: IF admin assigns a role that does not exist, the system shall return a not-found error and shall not modify the UserRoles mapping. (Source: EC-FE11-010)
- FR-FE11-025: IF admin assigns a role the user already holds, the system shall reject the request with the message "User already has this role." (Source: EC-FE11-011)
- FR-FE11-026: IF admin attempts to revoke a role the user does not hold, the system shall return a not-found error. (Source: EC-FE11-012)
- FR-FE11-027: IF revoking a role would leave the user with no role at all, the system shall reject the action because every user must retain at least one role. (Source: EC-FE11-013, BR-FE11-007)
- FR-FE11-028: IF admin submits a librarian-specific field (department, specialization) that is too long or invalid, the system shall reject the update and return a validation error. (Source: EC-FE11-015, BR-FE11-015)
- FR-FE11-029: IF a user attempts to complete password setup with a token that is expired or already used, the system shall reject the request and shall not activate password-based login. (Source: data field `passwordSetupToken` / `passwordSetupTokenExpiresAt` in section 10.2, BR-FE11-013)

---

## 8. Acceptance Criteria

- AC-FE11-001: Given admin access, when viewing user list, then the system displays the safe paginated list with defaults/bounds, stable order, status/role filters, and trimmed email/name/user-ID search.
- AC-FE11-002: Given admin access, when viewing a user detail page, then the safe `UserManagementView` DTO and approved related summaries are displayed without credentials, token/session data, setup/reset links, or secret audit metadata.
- AC-FE11-003: Given valid user data, when Admin creates a new user account, then an inactive user, approved role, hashed setup token, and audit entry commit together and one FE10 setup delivery is requested.
- AC-FE11-004: Given an existing user and a matching effective `expectedUpdatedAt`, when Admin submits at least one effective change, then the allowed changes are saved and storage `UpdatedAt` advances; when the submission is a no-op, then the current safe DTO is returned with unchanged effective `updatedAt` and no success audit.
- AC-FE11-005: Given duplicate normalized email, when admin creates a new user, then the system returns `409 EMAIL_ALREADY_EXISTS`, persists no partial source state, and requests no setup delivery.
- AC-FE11-006: Given Admin creates a new member or librarian, then no password/token/link field is required or shown, the account stays `INACTIVE`, and login remains unavailable until FE02 setup completion.
- AC-FE11-007: Given an `ACTIVE` or `LOCKED` user and matching effective `expectedUpdatedAt`, when admin deactivates the account, then status changes to `INACTIVE`; a pending-activation account returns `409 ACCOUNT_PENDING_ACTIVATION` without mutation.
- AC-FE11-008: Given duplicate email in update, when admin updates user, then system rejects the update.
- AC-FE11-009: Given user with active session, when admin deactivates account, then session is invalidated.
- AC-FE11-010: Given valid librarian data, when Admin creates a new librarian account, then an inactive user, Librarian role, hashed setup token, and audit entry commit together and one FE10 setup delivery is requested.
- AC-FE11-011: Given an existing librarian account, when admin updates valid Librarian information with matching effective `expectedUpdatedAt`, then changes are saved and storage `UpdatedAt` is updated.
- AC-FE11-012: Given an `ACTIVE` or `LOCKED` librarian account and matching effective `expectedUpdatedAt`, when admin deactivates it, then status changes to `INACTIVE` and active sessions are invalidated.
- AC-FE11-013: Given user without Admin role, when admin assigns Admin role, then UserRoles table is updated.
- AC-FE11-014: Given user with Admin role, when admin revokes Admin role (not last admin), then UserRoles table is updated.
- AC-FE11-015: Given last admin user, when admin attempts to revoke Admin role, then system rejects action.
- AC-FE11-016: Given admin opens the console sidebar, then the approved sections are visible and Confirm Payment / Confirm Borrow are not visible.
- AC-FE11-017: Given admin opens Permissions, then role counts and permission matrix are displayed using FE11 role data.
- AC-FE11-018: Given admin opens Audit Logs, then log rows can be reviewed without exposing sensitive credential/token fields.
- AC-FE11-019: Given admin opens Request Management, then pending requests can expose approved action controls and completed requests are view-only.
- AC-FE11-020: Given setup delivery fails after account creation commits, then the account remains `INACTIVE`, no credential is exposed, and the response reports safe `FAILED` status.
- AC-FE11-021: Given an eligible incomplete setup account outside cooldown, when Admin resends setup, then prior active tokens are revoked and a new FE10 event uses a new token ID/idempotency key.
- AC-FE11-022: Given an active, locked, self-registered inactive, completed-setup, or cooldown-limited account, when Admin requests setup resend, then the system rejects it without creating a credential.
- AC-FE11-023: Given an Admin submits an update or deactivation with stale effective `expectedUpdatedAt`, when the current user record has changed, then the system returns `409 STALE_USER_STATE` and persists no submitted field, lifecycle change, credential revocation, or success audit.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE11-001 | Acting Admin is missing, inactive, or no longer has Admin role | Revalidate inside create/resend/update/deactivation/role transactions; return `404 ADMIN_NOT_FOUND` or `403 ADMIN_REQUIRED` before mutation. |
| EC-FE11-002 | User ID to be updated does not exist | Return not found error. |
| EC-FE11-003 | Email contains SQL injection payload | Sanitize input and validate email format; reject if invalid. |
| EC-FE11-004 | Email address with special characters | Validate email format strictly according to RFC standards. |
| EC-FE11-005 | Password setup value longer than 255 characters | FE02 rejects the setup request with a field validation error; FE11 never receives or stores the password. |
| EC-FE11-006 | Attempting to deactivate self (admin) | Reject the action. |
| EC-FE11-007 | Concurrent update/deactivation of the same user | Compare `expectedUpdatedAt` with `COALESCE(UpdatedAt, CreatedAt)`; reject a mismatch with `409 STALE_USER_STATE`, persist no field/lifecycle/credential change, and write no success audit. |
| EC-FE11-008 | Database update fails during user creation | Roll back transaction; return error to user. |
| EC-FE11-009 | Invalidating sessions for deactivated user fails | Roll back status, `deactivatedAt`, and audit changes; return a safe error and keep the account active. |
| EC-FE11-010 | Role does not exist when assigning | Return not found error. |
| EC-FE11-011 | User already has the role being assigned | Reject with message: "User already has this role." |
| EC-FE11-012 | Attempting to revoke non-existent role | Return not found error. |
| EC-FE11-013 | User has no role after revocation | Reject; user must have at least one role. |
| EC-FE11-014 | Email update to same email | Treat the normalized email as unchanged; process any other effective field changes. If no other field changes, return `200` with the current safe DTO, preserve `UpdatedAt`, and write no success audit. |
| EC-FE11-015 | Librarian-specific field is too long or invalid | Reject the update and return a validation error. |
| EC-FE11-016 | Removed admin sidebar item is requested directly | Return `404 Not Found`; do not expose or redirect to a removed workflow. |
| EC-FE11-017 | Completed request action attempted from admin request view | Reject action and keep request unchanged. |
| EC-FE11-018 | Audit log detail contains sensitive token/password fields | Redact those fields before response/display. |
| EC-FE11-019 | Setup provider delivery fails after source transaction commits | Keep account `INACTIVE`; return safe `FAILED`; allow Admin resend after cooldown. |
| EC-FE11-020 | Setup resend requested for self-registered or completed account | Reject with `ACCOUNT_SETUP_NOT_ELIGIBLE`; create no token/notification. |
| EC-FE11-021 | Setup resend requested within 60 seconds | Reject with `ACCOUNT_SETUP_RESEND_COOLDOWN`; include safe retry timing only. |
| EC-FE11-022 | Deactivation targets an `INACTIVE` account whose `deactivatedAt` is null | Reject with `409 ACCOUNT_PENDING_ACTIVATION`; Phase 1 does not convert pending activation into deactivated state. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Stores user account data: email, password hash, name, phone, address, status, timestamps. |
| Roles | Defines available roles: Member, Librarian, Admin. |
| UserRoles | Maps users to roles; supports multiple roles per user. |
| AuthTokens / session records | Required server-side mechanism for invalidating active refresh/session credentials during deactivation and role-sensitive account changes. |
| AuditLogs | Records all user management actions. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| userId | integer | Yes | Primary key, auto-increment. |
| email | string | Yes | Unique, valid email format, max 255 chars. |
| username | string | No | Optional alternative login field. |
| passwordHash | string | Yes | bcrypt hash, never plaintext. Before setup, store an unusable bcrypt hash of a server-generated random value that is immediately discarded; fixed literal placeholders are forbidden. |
| fullName | string | Yes | User's display name, trimmed, maximum 100 characters to match FE03 and `UserProfiles.FullName`. |
| phoneNumber | string | No | User's phone number. |
| address | string | No | User's address. |
| department | string | No | Nullable `UserProfiles.Department`, trimmed, maximum 100 characters; FE11 Admin management only and returned only for a current Librarian role. |
| specialization | string | No | Nullable `UserProfiles.Specialization`, trimmed, maximum 100 characters; FE11 Admin management only and returned only for a current Librarian role. |
| status | enum | Yes | Values: `ACTIVE`, `INACTIVE`, `LOCKED`, matching the current Users table constraint. |
| createdAt | datetime | Yes | Account creation timestamp. |
| updatedAt | datetime | Yes | FE11 response/concurrency value is non-null `COALESCE(Users.UpdatedAt, Users.CreatedAt)`; storage `Users.UpdatedAt` remains nullable for legacy rows. |
| lastLoginAt | datetime | No | Last successful login timestamp. |
| lastPasswordChangedAt | datetime | No | Last password change timestamp. |
| deactivatedAt | datetime | No | Server timestamp set when an existing account is deactivated; null for active or pending-setup accounts. |
| setupTokenId | integer | Conditional | Persisted `AuthTokens.TokenId` for token type `ACCOUNT_SETUP`; used for source traceability and idempotency. |
| setupTokenHash | string | Conditional | Cryptographic hash only; raw token is never persisted. |
| setupTokenExpiresAt | datetime | Conditional | Expires 24 hours after issuance. |
| setupTokenUsedAt | datetime | No | Set by FE02 when password setup completes successfully. |
| setupTokenRevokedAt | datetime | No | Set when FE11 resends setup or otherwise revokes an incomplete credential. |
| lockedUntil | datetime | No | Timestamp when account will auto-unlock (if locked). |

### 10.3 Safe User Management DTO

`UserManagementView` is the only user representation returned by FE11 list, detail, create, and update endpoints.

| Included field | Rule |
| -------------- | ---- |
| `userId`, `email`, `username`, `fullName`, `phoneNumber`, `address`, `status` | Return only to an authenticated Admin. |
| `roles` | Return role IDs/names from `UserRoles`; never infer roles from client input. |
| `createdAt`, `updatedAt`, `lastLoginAt` | Return as server-generated timestamps; `updatedAt` is the non-null `COALESCE(Users.UpdatedAt, Users.CreatedAt)` optimistic-concurrency value. |
| `department`, `specialization` | Return only when applicable to a Librarian account. |
| `relatedSummary` | Required on detail responses only: `activeBorrowingCount`, `unpaidFineTotal`, `openReservationCount`; each field is zero when no matching source data exists. |

The DTO must exclude `passwordHash`, raw passwords, raw or hashed auth tokens, token IDs used as credentials, refresh/session identifiers, setup/reset links, provider payloads, and secret audit metadata. Adding another field requires a reviewed FE11 spec change.

---

## 11. API / Interface Contract

> The endpoints and request/response shapes below are the canonical Phase 1 contract for this feature.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/users` | Admin | Query: `page=1, limit=20, status?, role?, search?` | Paginated `UserManagementView[]` | `page >= 1`, `limit = 1..100`, `search` is trimmed and 1..200 characters when supplied; invalid values are rejected. Order is `CreatedAt DESC, UserId DESC`; only the safe DTO is returned. |
| GET | `/api/users/{userId}` | Admin | - | `UserManagementView` with required `relatedSummary` | Includes only the three approved aggregate fields with deterministic zero defaults. |
| POST | `/api/users` | Admin | `{ email: string, username?: string, fullName: string, type: "member"\|"librarian", phone?: string, address?: string, department?: string, specialization?: string }` | `201 { userId, email, status: "INACTIVE", roles, setupDeliveryStatus, message }` | Boundary-validates input; source transaction revalidates active Admin and uniqueness, then requests FE10 delivery only after commit; never returns password/token/link. |
| PUT | `/api/users/{userId}` | Admin | `{ expectedUpdatedAt: datetime, fullName?: string, phone?: string, address?: string, email?: string, department?: string, specialization?: string }` | Updated `UserManagementView`; stale state: `409 { code: "STALE_USER_STATE" }` | Compares the loaded effective `updatedAt = COALESCE(UpdatedAt, CreatedAt)`; a stale request changes nothing. |
| PATCH | `/api/users/{userId}/status` | Admin | `{ status: "INACTIVE", expectedUpdatedAt: datetime }` | Updated `UserManagementView` | Only `ACTIVE`/`LOCKED` transition. Pending activation returns `409 ACCOUNT_PENDING_ACTIVATION`; already-deactivated state is idempotent. |
| POST | `/api/users/{userId}/roles` | Admin | `{ roleId: number }` | User with updated roles | Assign role to user. |
| DELETE | `/api/users/{userId}/roles/{roleId}` | Admin | - | User with updated roles | Revoke role from user. |
| POST | `/api/users/{userId}/resend-setup` | Admin | `{}` | `200 { userId, status: "INACTIVE", setupDeliveryStatus, message }` | Source transaction revalidates the active Admin before target history; eligible incomplete account only; revokes prior active token and enforces 60-second cooldown. |
| GET | `/api/admin/dashboard` | Admin | - | Dashboard summary/cards/chart data | Read-only aggregation; detailed reports belong to FE12. |
| GET | `/api/admin/permissions` | Admin | - | Role summary and permission matrix | Read-only matrix unless using role assignment endpoints. |
| GET | `/api/admin/audit-logs` | Admin | Query: `q?, action?, actorId?, from?, to?, page?, limit?` | Audit log list | Redacts sensitive fields. |
| GET | `/api/admin/requests` | Admin | Query: `page?, limit?, q?, status?, from?, to?` | Exactly `{ data, pagination }` | Reads FE07 request data for Admin review UI using the canonical contract below. |
| GET | `/api/admin/requests/{requestId}` | Admin | - | Request detail | Completed requests are view-only. |

### 11.1 Canonical Admin Request Read Contract

- `page` defaults to 1; `limit` defaults to 20 and is bounded to 1..100.
- `q` is trimmed 1..100 when supplied; `status` is one of `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, or `CANCELLED`; `from`/`to` are inclusive `YYYY-MM-DD` values with `from <= to`.
- Authentication and Admin authorization run before detailed validation. Supported values come from validated data, not raw query/params.
- List rows are ordered `RequestDate DESC, RequestId DESC` and contain only `requestId`, `requestDate`, `status`, safe `member`, `itemCount`, ordered `bookTitles`, and unique first-occurrence `categories`.
- Pagination applies to distinct request headers before joining details; count/data use the same filter scope. Valid commas in titles/categories are not reconstructed by splitting comma-delimited SQL text.
- Detail returns only `requestId`, `requestDate`, `status`, `createdAt`, `updatedAt`, safe `member`, safe `items`, and `lifecycle`. Invalid IDs return `400 VALIDATION_ERROR`; missing requests return `404 BORROW_REQUEST_NOT_FOUND`.
- FE11 reads through the FE07 request repository boundary. Only FE07 owns `/api/borrow-requests/{requestId}/approve` and `/reject`; no Admin mutation aliases are added, and non-`PENDING` direct mutations return `409 BORROW_REQUEST_NOT_PENDING` without success writes/audit.

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

- NFR-FE11-TXN-001: Creating a user must be atomic: active-Admin revalidation, authoritative uniqueness checks, user record, profile, default role, hashed setup token, and audit log must succeed together or roll back.
- NFR-FE11-TXN-002: Deactivating a user must be atomic: user status, `deactivatedAt`, credential invalidation, and audit log must succeed together or roll back.
- NFR-FE11-TXN-003: Role assignment must be atomic: UserRoles update and audit log must succeed together or roll back.
- NFR-FE11-TXN-004: FE10 setup delivery runs after the FE11 source transaction; provider/requester failure must not roll back the account or token and must return only safe delivery status.
- NFR-FE11-TXN-005: Setup resend acting-Admin revalidation, token revocation, new token creation, and audit logging must commit or roll back together.
- NFR-FE11-TXN-006: Role assignment/revocation must lock the affected `UserRoles` rows and the Admin-role count before mutation; concurrent operations must serialize so at least one Admin always remains.

### 12.3 Performance

- NFR-FE11-PERF-001: User-list queries must apply pagination before materializing rows and must not load the full user table into application memory.
- NFR-FE11-PERF-002: User lookup by email or user ID must use the corresponding database key or unique index.
- NFR-FE11-PERF-003: Role lookup must use the `UserRoles`/`Roles` keys and must not perform an unbounded scan for each returned user.

### 12.4 Logging and Audit

- NFR-FE11-LOG-001: Create, update, deactivate, and role assignment actions must write audit log entries.
- NFR-FE11-LOG-002: Audit log must include: action type, admin ID, target user ID, timestamp, and details of changes.

### 12.5 Usability

- NFR-FE11-UX-001: Validation errors must be clear and explain what went wrong (e.g., "Email already exists", "Password too weak").
- NFR-FE11-UX-002: Confirmation dialogs must appear before destructive actions (deactivate, revoke role).
- NFR-FE11-UX-003: User list must display these columns: email, name, status, roles, last login, and created date.
- NFR-FE11-UX-004: The Admin sidebar account email shall stay on one line with ellipsis and a full-value tooltip, and Admin data exports shall use valid `.docx` files rather than CSV downloads. Exported tables shall use landscape pages, fixed proportional column widths, compact readable text, localized statuses, and short Vietnamese dates.

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
| FE10 Notification Management | Internal | Only the requester bound to `FE11` renders and delivers canonical `ACCOUNT_SETUP` links using safe `AuthToken` source metadata. |
| SQL Server database | Technical | Stores FE11 source state; Wave A must synchronize `Users.Email`, `Users.DeactivatedAt`, `UserProfiles.Department`, `UserProfiles.Specialization`, `Notifications.RecipientEmail`, and deterministic `UX_Users_Email` through the approved idempotent migration. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE11-001 | Admins cannot deactivate themselves. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-002 | Prevent deactivation of users with active borrowings. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-003 | Password setup uses the same FE02 password complexity rule. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-004 | Email is case-insensitive for login and uniqueness. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-005 | FE11 always requests one-time setup-link delivery through FE10 after source commit; configured deployments use the provider adapter and tests use a mock. Delivery may safely return `FAILED`. | Review packet 2026-06-10; ADR-005 refinement 2026-07-15 | APPROVED |
| Q-FE11-006 | Do not permanently delete deactivated user data in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-007 | No role hierarchy in Phase 1; roles are flat. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-008 | Admin cannot view sensitive account fields such as password hash, reset tokens, refresh tokens. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-009 | User deactivation notification is optional/future work; no mandatory Phase 1 notification. | Review packet 2026-06-10 | APPROVED |
| Q-FE11-010 | Admin-created account delivery may safely fail after source commit; the account remains `INACTIVE` with its setup token and can be resent through the approved flow. | User correction 2026-06-21; ADR-005 refinement 2026-07-15 | APPROVED |
| Q-FE11-011 | Admin sidebar includes Home, Dashboard, Library, Borrowing Management, Request Management, All Users, and Audit Logs; Permissions, Confirm Payment, and Confirm Borrow are removed from sidebar. | User correction 2026-07-22 | APPROVED |
| Q-FE11-012 | Admin Reports content is consolidated into Dashboard for this prototype; detailed reporting remains FE12. | User correction 2026-06-30 | APPROVED |
| Q-FE11-013 | Admin Request Management is read-only for completed requests and action-enabled only for pending/chờ xác nhận requests. | User correction 2026-06-30 | APPROVED |
| Q-FE11-014 | Admin-created accounts start `INACTIVE` and become `ACTIVE` only after valid FE02 password setup completion. | Nhat confirmation 2026-07-15 | APPROVED |
| Q-FE11-015 | FE11 issues `ACCOUNT_SETUP`; FE10 delivers it only through the requester bound to `FE11`; FE02 consumes it and activates the account. | Nhat confirmation 2026-07-15; ADR-005 | APPROVED |
| Q-FE11-016 | Admin-only resend revokes the prior setup credential, creates a new token/event/key, and enforces a 60-second server cooldown. | Nhat confirmation 2026-07-15; ADR-005 | APPROVED |
| Q-FE11-017 | FE11 responses use the explicit `UserManagementView` allowlist; unspecified or credential-bearing fields are excluded. | Spec normalization 2026-07-17 | APPROVED |
| Q-FE11-018 | User updates and deactivation use `UpdatedAt` optimistic concurrency; stale requests return `409 STALE_USER_STATE`. | Spec normalization 2026-07-17 | APPROVED |
| Q-FE11-019 | Deactivation uses `INACTIVE` plus `deactivatedAt`, invalidates credentials atomically, and has no Phase 1 reactivation flow. | Cross-feature lifecycle normalization 2026-07-17 | APPROVED |
| Q-FE11-020 | Admin-role assignment/revocation serializes the affected role mappings and Admin count so at least one Admin remains. | Role concurrency normalization 2026-07-17 | APPROVED |
| Q-FE11-021 | Managed-user optimistic concurrency exposes and compares non-null `COALESCE(Users.UpdatedAt, Users.CreatedAt)` without a backfill migration. | FE11 Finalization Batch approval 2026-07-19 | APPROVED |
| Q-FE11-022 | `fullName` remains maximum 100; nullable `department` and `specialization` are maximum 100 and only apply to current Librarian targets. | FE11 Finalization Batch approval 2026-07-19 | APPROVED |
| Q-FE11-023 | `INACTIVE` with null `deactivatedAt` is pending activation and deactivation returns `409 ACCOUNT_PENDING_ACTIVATION`; only non-null `deactivatedAt` is idempotently deactivated. | FE11 Finalization Batch approval 2026-07-19 | APPROVED |
| Q-FE11-024 | FE11 create and setup resend revalidate the active acting Admin inside each source transaction; create duplicate email is transaction-authoritative and safe. | FE11 Finalization Batch approval 2026-07-19 | APPROVED |
| Q-FE11-025 | Admin request reads use `page`, `limit`, `q`, `status`, `from`, `to`, exact `{ data, pagination }`, and a dedicated safe detail endpoint; FE07 remains the only mutation owner. | FE11 Finalization Batch approval 2026-07-19 | APPROVED |

---

## 15.1 Approved Design Decisions

The following decisions were approved in the Phase 1 review packet on 2026-06-10 and are now part of this spec.

| Decision | Approved Answer | Status |
| -------- | --------------- | ------ |
| Q-FE11-001 | Admins cannot deactivate themselves. | APPROVED |
| Q-FE11-002 | Prevent deactivation of users with active borrowings. | APPROVED |
| Q-FE11-003 | Password setup uses the same FE02 password complexity rule. | APPROVED |
| Q-FE11-004 | Email is case-insensitive for login and uniqueness. | APPROVED |
| Q-FE11-005 | FE11 requests setup-link delivery through FE10 after source commit; tests use a provider mock and safe failure is allowed. | APPROVED |
| Q-FE11-006 | Do not permanently delete deactivated user data in Phase 1. | APPROVED |
| Q-FE11-007 | No role hierarchy in Phase 1; roles are flat. | APPROVED |
| Q-FE11-008 | Admin cannot view sensitive account fields such as password hash, reset tokens, refresh tokens. | APPROVED |
| Q-FE11-009 | User deactivation notification is optional/future work; no mandatory Phase 1 notification. | APPROVED |
| Q-FE11-014 | Admin-created accounts start `INACTIVE` until FE02 completes setup. | APPROVED |
| Q-FE11-015 | FE11 issues setup tokens, FE10 delivers `ACCOUNT_SETUP`, and FE02 consumes/activates. | APPROVED |
| Q-FE11-016 | Setup resend is Admin-only, rotates the token/event/key, and uses a 60-second cooldown. | APPROVED |
| Q-FE11-017 | FE11 exposes only the allowlisted `UserManagementView` DTO. | APPROVED |
| Q-FE11-018 | Stale user updates and deactivation requests are rejected by `UpdatedAt` optimistic concurrency with `409 STALE_USER_STATE`. | APPROVED |
| Q-FE11-019 | Deactivation uses `INACTIVE` plus `deactivatedAt`, invalidates credentials atomically, and has no Phase 1 reactivation flow. | APPROVED |
| Q-FE11-020 | Admin-role assignment/revocation serializes the affected role mappings and Admin count so at least one Admin remains. | APPROVED |
| Q-FE11-021 | Managed-user concurrency uses non-null `COALESCE(UpdatedAt, CreatedAt)`. | APPROVED |
| Q-FE11-022 | `fullName`, `department`, and `specialization` use the approved 100-character limits and Librarian ownership rules. | APPROVED |
| Q-FE11-023 | Pending activation is not an idempotent deactivation state. | APPROVED |
| Q-FE11-024 | Create/resend revalidate the active acting Admin transactionally and map duplicate email safely. | APPROVED |
| Q-FE11-025 | Admin request list/detail reads use the canonical finalization contract while FE07 owns mutations. | APPROVED |

---

## 16. Traceability Matrix

### FE11 Acceptance Criteria to Requirements to Tests

| AC ID | Acceptance Criterion | Related FR | Related BR | Test Case | Status |
| ----- | -------------------- | ---------- | ---------- | --------- | ------ |
| AC-FE11-001 | Admin accesses user list -> safe paginated list uses defaults/bounds, stable order, status/role filters, and trimmed search | FR-FE11-001 | BR-FE11-001, BR-FE11-010 | FE11-U01..U06; fe11-safe-user-list-detail-validation-2026-07-18.md | COMPLETE (B7) |
| AC-FE11-002 | Admin accesses user detail -> safe UserManagementView and approved summaries are returned with sensitive fields excluded | FR-FE11-002 | BR-FE11-001, BR-FE11-018, BR-FE11-026 | FE11-U01..U06; fe11-safe-user-list-detail-validation-2026-07-18.md | COMPLETE (B7) |
| AC-FE11-003 | Valid user data -> inactive user/role/setup token/audit commit and one safe setup delivery is requested | FR-FE11-003 | BR-FE11-002, BR-FE11-004, BR-FE11-005, BR-FE11-007, BR-FE11-021..024 | Existing FE11-S01..S07 source/delivery evidence plus pending FE11-LIFE02 actor/route hardening | PARTIAL |
| AC-FE11-004 | Matching expectedUpdatedAt -> effective changes advance UpdatedAt; no-op returns unchanged DTO/version without success audit | FR-FE11-004, FR-FE11-007 | BR-FE11-010, BR-FE11-014, BR-FE11-027 | FE11-LIFE03 optimistic/no-op repository/service cases | Not Started |
| AC-FE11-005 | Duplicate email submitted when creating user -> system rejects with error message | FR-FE11-005 | BR-FE11-004 | FE11-LIFE02 account-setup transaction/service/route cases | Not Started |
| AC-FE11-006 | Admin creates user -> no password/token/link is shown; account stays inactive until FE02 setup completes | FR-FE11-006 | BR-FE11-005, BR-FE11-013, BR-FE11-023 | FE11-S01..S07; auth-account-setup-boundary-validation-review-2026-07-15.md | COMPLETE (B7) |
| AC-FE11-007 | ACTIVE/LOCKED user deactivated by admin -> status changes to INACTIVE; pending activation is rejected | FR-FE11-008 | BR-FE11-003, BR-FE11-006, BR-FE11-010 | FE11-LIFE04 atomic deactivation cases | Not Started |
| AC-FE11-008 | Admin updates user email to duplicate -> system rejects the update | FR-FE11-004 | BR-FE11-004 | FT53 | Not Started |
| AC-FE11-009 | User with active session deactivated by admin -> session invalidated | FR-FE11-008 | BR-FE11-006 | FE11-LIFE04 refresh-credential rollback cases | Not Started |
| AC-FE11-010 | Valid librarian data -> inactive librarian/role/setup token/audit commit and one safe setup delivery is requested | FR-FE11-009 | BR-FE11-002, BR-FE11-004, BR-FE11-005, BR-FE11-007, BR-FE11-015, BR-FE11-021..024 | Existing FE11-S01..S07 source/delivery evidence plus pending FE11-LIFE02 fields/actor hardening | PARTIAL |
| AC-FE11-011 | Admin updates librarian information -> changes saved, UpdatedAt timestamp updated | FR-FE11-010 | BR-FE11-010, BR-FE11-014, BR-FE11-015 | FE11-LIFE02/LIFE03 Librarian projection and update cases | Not Started |
| AC-FE11-012 | Active librarian account deactivated by admin -> status changes to INACTIVE and sessions are invalidated | FR-FE11-011 | BR-FE11-003, BR-FE11-006, BR-FE11-010, BR-FE11-015 | FE11-LIFE04 Librarian deactivation cases | Not Started |
| AC-FE11-013 | User without Admin role receives Admin role assignment -> UserRoles updated | FR-FE11-012 | BR-FE11-007, BR-FE11-008, BR-FE11-010 | FE11-R01..R05; FE11-UIR01..UIR05; bounded validation records | COMPLETE (B7) |
| AC-FE11-014 | User with Admin role has role revoked (not last admin) -> UserRoles updated | FR-FE11-013 | BR-FE11-007, BR-FE11-010 | FE11-R01..R05; FE11-UIR01..UIR05; bounded validation records | COMPLETE (B7) |
| AC-FE11-015 | Last remaining admin attempts to revoke Admin role -> system rejects action | FR-FE11-014 | BR-FE11-009, BR-FE11-010 | FE11-R01..R05; FE11-UIR01..UIR05; bounded validation records | COMPLETE (B7) |
| AC-FE11-016 | Admin console shows only approved sections and hides removed workflows | FR-FE11-030 | BR-FE11-016 | Planned admin-navigation component case | Not Started |
| AC-FE11-017 | Permissions view displays role counts and read-only permission matrix from FE11 data | FR-FE11-032 | BR-FE11-017 | Planned permissions-view integration case | Not Started |
| AC-FE11-018 | Audit-log view is searchable/filterable and redacts sensitive fields | FR-FE11-033 | BR-FE11-018, BR-FE11-026 | FE11-AUD01; `frontend/test/userManagementFrontend.test.js`; final governance closeout validation | COMPLETE (B7 + final closeout) |
| AC-FE11-019 | Pending requests expose only approved actions; completed requests remain view-only | FR-FE11-034, FR-FE11-035 | BR-FE11-019 | FE11-REQ02/REQ03; fe11-finalization-wave-b-validation-2026-07-19.md | READY FOR REVIEW |
| AC-FE11-020 | Setup delivery failure leaves committed account inactive and exposes no credential | FR-FE11-037 | BR-FE11-023, BR-FE11-024 | FE11-S01..S07; auth-account-setup-boundary-validation-review-2026-07-15.md | COMPLETE (B7) |
| AC-FE11-021 | Eligible Admin resend rotates setup token/event/key after cooldown | FR-FE11-036 | BR-FE11-021, BR-FE11-022, BR-FE11-025 | Existing FE11-S01..S07 rotation/delivery evidence plus pending FE11-LIFE02 actor revalidation | PARTIAL |
| AC-FE11-022 | Ineligible/cooldown-limited resend is rejected without credential creation | FR-FE11-038 | BR-FE11-023, BR-FE11-025 | FE11-S01..S07; auth-account-setup-boundary-validation-review-2026-07-15.md | COMPLETE (B7) |
| AC-FE11-023 | Stale expectedUpdatedAt -> 409 STALE_USER_STATE and no update/deactivation/success audit persists | FR-FE11-023 | BR-FE11-027 | FE11-LIFE03/LIFE04 stale mutation cases | Not Started |

### FE11 Unwanted-Behavior Requirements to Sources to Tests

| FR ID | Unwanted Behavior | Related BR | Related EC / AF / Q | Test Case | Status |
| ----- | ----------------- | ---------- | ------------------- | --------- | ------ |
| FR-FE11-015 | Non-admin attempts to access user management -> rejected with authorization error | BR-FE11-001, BR-FE11-011, BR-FE11-012 | - | FE11-U01..U06 and FE11-R01..R05 Admin-first route authorization | COMPLETE (B7) |
| FR-FE11-016 | Action targets a non-existent user ID -> not-found error | BR-FE11-010 | EC-FE11-002 | Existing detail/role evidence plus FE11-LIFE03/LIFE04 update/deactivation cases | PARTIAL |
| FR-FE11-017 | Acting admin ID does not exist -> not-found error, no action | BR-FE11-001 | EC-FE11-001 | Existing role evidence plus FE11-LIFE02..LIFE04 create/resend/update/deactivation cases | PARTIAL |
| FR-FE11-018 | Admin attempts to deactivate own account -> rejected | BR-FE11-003 | Q-FE11-001, EC-FE11-006 | FE11-LIFE04 self-deactivation case | Not Started |
| FR-FE11-019 | Deactivate user with active borrowings -> blocked, reports count | BR-FE11-003 | AF-FE11-002, Q-FE11-002 | FE11-LIFE04 borrowing guard case | Not Started |
| FR-FE11-020 | Update email to a duplicate address -> rejected | BR-FE11-004 | AF-FE11-004 | FE11-LIFE03 duplicate update case | Not Started |
| FR-FE11-021 | Malformed / injection / oversized email -> sanitized and rejected | BR-FE11-004 | EC-FE11-003, EC-FE11-004, EC-FE11-005 | FE11-LIFE01/LIFE02/LIFE03 boundary and width cases | Not Started |
| FR-FE11-022 | DB error during user creation -> rollback, no partial record | BR-FE11-010 | EC-FE11-008 | FE11-S01..S07 account-creation rollback coverage | COMPLETE (B7) |
| FR-FE11-023 | Stale expectedUpdatedAt -> 409 STALE_USER_STATE with no partial update | BR-FE11-014, BR-FE11-027 | EC-FE11-007 | FE11-LIFE03/LIFE04 effective-version cases | Not Started |
| FR-FE11-024 | Assign a non-existent role -> not-found error, mapping unchanged | BR-FE11-007 | EC-FE11-010 | FE11-R01..R05 deterministic role outcome coverage | COMPLETE (B7) |
| FR-FE11-025 | Assign a role the user already holds -> rejected | BR-FE11-008 | EC-FE11-011 | FE11-R01..R05 deterministic role outcome coverage | COMPLETE (B7) |
| FR-FE11-026 | Revoke a role the user does not hold -> not-found error | BR-FE11-007 | EC-FE11-012 | FE11-R01..R05 deterministic role outcome coverage | COMPLETE (B7) |
| FR-FE11-027 | Revocation would leave user with no role -> rejected | BR-FE11-007 | EC-FE11-013 | FE11-R01..R05 deterministic role outcome coverage | COMPLETE (B7) |
| FR-FE11-028 | Librarian-specific field too long/invalid -> rejected with validation error | BR-FE11-015 | EC-FE11-015 | FE11-LIFE02/LIFE03 Librarian validation cases | Not Started |
| FR-FE11-029 | Password setup token expired/already used -> rejected, login not activated | BR-FE11-013 | section 10.2 token fields | FE11-S01..S07 invalid, expired, used, revoked, and ineligible setup-token coverage | COMPLETE (B7) |
| FR-FE11-030 | Approved admin sidebar is displayed; removed items hidden | BR-FE11-016 | Q-FE11-011, EC-FE11-016 | Planned admin-navigation component case | Not Started |
| FR-FE11-031 | Admin dashboard displays read-only operational summaries | BR-FE11-020 | Q-FE11-012 | FE11-ACC01 evidence-only service/route/browser cases; Wave B validation | READY FOR REVIEW |
| FR-FE11-032 | Permissions role summary and matrix are displayed | BR-FE11-017 | MF-FE11-011 | Planned permissions-view integration case | Not Started |
| FR-FE11-033 | Audit logs are searchable/filterable and redacted | BR-FE11-018, BR-FE11-026 | EC-FE11-018 | FE11-AUD01; `frontend/test/userManagementFrontend.test.js`; final governance closeout validation | COMPLETE (B7 + final closeout) |
| FR-FE11-034 | Request Management list/detail supports search/filter/export/view | BR-FE11-019 | MF-FE11-013 | FE11-REQ01/REQ02; Wave B validation | READY FOR REVIEW |
| FR-FE11-035 | Completed request actions are disabled/rejected | BR-FE11-019 | Q-FE11-013, EC-FE11-017 | FE11-REQ03; Wave B validation | READY FOR REVIEW |
| FR-FE11-037 | FE10 setup delivery failure preserves inactive source state and returns safe status | BR-FE11-023, BR-FE11-024 | EC-FE11-019, Q-FE11-015 | FE11-S01..S07 safe delivery failure and resend eligibility/cooldown coverage | COMPLETE (B7) |
| FR-FE11-038 | Ineligible or cooldown-limited setup resend creates no credential | BR-FE11-025 | EC-FE11-020, EC-FE11-021, Q-FE11-016 | FE11-S01..S07 safe delivery failure and resend eligibility/cooldown coverage | COMPLETE (B7) |

### Coverage Summary (FE11)

- **Total AC**: 23 (AC-FE11-001 to AC-FE11-023); all ACs are mapped, and account-setup ACs map to FT52/FT55 and FE11-S02/S06.
- **Total FR**: 38 (FR-FE11-001 to FR-FE11-038); FR-FE11-036 maps through AC-FE11-021 and FE11-S06, while FR-FE11-037..038 are mapped above.
- **Total BR**: 27 (BR-FE11-001 to BR-FE11-027).
- **Assignment tests**: FT50 to FT58 remain the external baseline; focused account-setup service/integration tests are mandatory before implementation can close.

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
- [x] Database schema for Users, Roles, UserRoles, and nullable `Users.DeactivatedAt` is confirmed by the merged FE11 finalization migration and Phase 2 exit evidence.
- [x] API contract is approved in this SPEC.md or copied to a dedicated shared API contract file if the team reintroduces one.
- [x] FE02, FE03 dependencies are checked for conflicts.
- [x] Every acceptance criterion can become a test.
- [x] Security requirements (bcrypt cost, SQL injection prevention) are reviewed.
## 2026-07-22 admin-console correction

- Admin User Management is view/create/role/deactivate oriented in this prototype; edit-user-information buttons are hidden from both rows and the detail drawer while the protected backend update contract remains available for compatibility.
- The Audit Logs table displays Action, Actor, Target, IP, and Time only. Safe detail projection remains a backend security boundary but is not rendered as an extra table column.
- Wide Admin tables scroll inside their own content region and must not force the whole console behind horizontal page scrolling.
