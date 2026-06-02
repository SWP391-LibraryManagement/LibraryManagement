# SPEC.md - FE11 User & Role Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Dung

# Last Updated: 2026-06-02

# Feature ID: FE11

# Feature folder: `.sdd/specs/feat-user-role-management/`

> Source of truth for FE11 User & Role Management. This spec is a draft and must be reviewed before implementation. It is intentionally detailed because FE11 controls authorization and access to all protected features in the system.

---

## 1. Feature Overview

### 1.1 Feature Name

User & Role Management

### 1.2 Business Context

User & Role Management controls user accounts, librarian accounts, role assignments, and authorization permissions throughout the Library Management System.

This feature is core because incorrect account or role data can expose protected resources, break security policies, and affect every module that relies on authorization.

### 1.3 Goal / Outcome

The system shall:

- Allow admins to view user accounts.
- Allow admins to create user accounts.
- Allow admins to update user accounts.
- Allow admins to deactivate user accounts.
- Allow admins to create librarian accounts.
- Allow admins to update librarian accounts.
- Allow admins to deactivate librarian accounts.
- Allow admins to manage role assignments.
- Maintain audit records for account and role changes.
- Provide authorization data for all protected modules.

### 1.4 Scope Level

- [x] Full Spec - core business logic, high risk, must be correct from the beginning
- [ ] Standard Spec
- [ ] Light Spec

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
|--------|-------------|-----------------------------|
| Admin | System administrator | View users, create/update/deactivate accounts, manage roles. |
| Librarian | Library staff | No user management permissions unless explicitly granted. |
| Member | Registered user | Access own account information only. |
| Guest | Unauthenticated visitor | No user management permissions. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE11-001: The actor is authenticated.
- PRE-FE11-002: The actor has Admin role.
- PRE-FE11-003: Required user information is provided.
- PRE-FE11-004: Role definitions exist in the system.
- PRE-FE11-005: Email and username uniqueness rules are configured.

---

## 4. Main Flows

### MF-FE11-001: View User List

1. Admin opens user management.
2. System retrieves users.
3. System displays paginated user list.
4. Admin may filter and search users.

### MF-FE11-002: View User Information

1. Admin selects a user.
2. System retrieves user details.
3. System displays account information and assigned roles.

### MF-FE11-003: Create User Account

1. Admin enters user information.
2. System validates input.
3. System validates uniqueness constraints.
4. System creates account.
5. System writes audit log.

### MF-FE11-004: Update User Information

1. Admin selects a user.
2. Admin updates account data.
3. System validates changes.
4. System saves updates.
5. System writes audit log.

### MF-FE11-005: Deactivate User Account

1. Admin selects a user.
2. Admin confirms deactivation.
3. System changes account status to INACTIVE.
4. System writes audit log.

### MF-FE11-006: Create Librarian Account

1. Admin creates a user account.
2. Admin assigns Librarian role.
3. System saves account and role assignment.
4. System writes audit log.

### MF-FE11-007: Update Librarian Account

1. Admin selects librarian account.
2. Admin updates information.
3. System validates changes.
4. System saves updates.
5. System writes audit log.

### MF-FE11-008: Deactivate Librarian Account

1. Admin selects librarian account.
2. Admin confirms deactivation.
3. System changes status to INACTIVE.
4. System writes audit log.

### MF-FE11-009: Manage Roles

1. Admin selects a user.
2. Admin assigns or removes roles.
3. System validates role rules.
4. System updates role assignments.
5. System writes audit log.

---

## 5. Alternative Flows

### AF-FE11-001: Duplicate Email

1. Admin submits account information.
2. System detects duplicate email.
3. System rejects request.

### AF-FE11-002: Duplicate Username

1. Admin submits account information.
2. System detects duplicate username.
3. System rejects request.

### AF-FE11-003: User Not Found

1. Admin requests user information.
2. User does not exist.
3. System returns not-found response.

### AF-FE11-004: Unauthorized Access

1. Non-admin actor attempts user management.
2. System validates permissions.
3. System denies access.

---

## 6. Business Rules

- BR-FE11-001: Only admins may manage users.
- BR-FE11-002: Only admins may manage librarian accounts.
- BR-FE11-003: Only admins may assign roles.
- BR-FE11-004: Email must be unique.
- BR-FE11-005: Username must be unique.
- BR-FE11-006: Deactivated accounts cannot authenticate.
- BR-FE11-007: Every account modification must be auditable.
- BR-FE11-008: Every role assignment must be auditable.
- BR-FE11-009: A user must have at least one role.
- BR-FE11-010: Soft delete shall be used for account deactivation.

---

## 7. Functional Requirements

- FR-FE11-001: The system shall allow admins to view user lists.
- FR-FE11-002: The system shall allow admins to view user information.
- FR-FE11-003: The system shall allow admins to create user accounts.
- FR-FE11-004: The system shall validate email uniqueness.
- FR-FE11-005: The system shall validate username uniqueness.
- FR-FE11-006: The system shall allow admins to update user accounts.
- FR-FE11-007: The system shall allow admins to deactivate accounts.
- FR-FE11-008: The system shall allow admins to create librarian accounts.
- FR-FE11-009: The system shall allow admins to manage role assignments.
- FR-FE11-010: The system shall support pagination and filtering for user lists.

---

## 8. Acceptance Criteria

- AC-FE11-001: Given a valid admin, when viewing users, then the system returns a paginated user list.
- AC-FE11-002: Given valid account data, when creating a user, then the system creates the account successfully.
- AC-FE11-003: Given a duplicate email, when creating a user, then the system rejects the request.
- AC-FE11-004: Given a duplicate username, when creating a user, then the system rejects the request.
- AC-FE11-005: Given an existing user, when updating information, then the system persists changes.
- AC-FE11-006: Given an active user, when deactivated, then status becomes INACTIVE.
- AC-FE11-007: Given valid role assignment, when admin updates roles, then role assignments are updated successfully.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
|----|------------------|--------------------------|
| EC-FE11-001 | User ID does not exist | Return not found error. |
| EC-FE11-002 | Duplicate email | Reject request. |
| EC-FE11-003 | Duplicate username | Reject request. |
| EC-FE11-004 | Invalid role ID | Reject role assignment. |
| EC-FE11-005 | Deactivate already inactive user | Reject request. |
| EC-FE11-006 | Remove all user roles | Reject request if not allowed. |
| EC-FE11-007 | Non-admin access | Return forbidden error. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose |
|----------|---------|
| Users | Stores account information. |
| Roles | Stores role definitions. |
| UserRoles | Stores role assignments. |
| AuditLogs | Records user and role changes. |

### 10.2 Data Fields

| Field | Type | Required | Notes |
|---------|------|----------|--------|
| userId | integer | Yes | Primary key |
| username | string | Yes | Unique |
| email | string | Yes | Unique |
| passwordHash | string | Yes | Authentication |
| status | string | Yes | ACTIVE / INACTIVE |
| roleId | integer | Yes | Must exist |
| createdAt | datetime | Yes | System generated |

---

## 11. API / Interface Contract

| Method | Endpoint | Actor |
|----------|----------|--------|
| GET | /api/users | Admin |
| GET | /api/users/{id} | Admin |
| POST | /api/users | Admin |
| PUT | /api/users/{id} | Admin |
| PATCH | /api/users/{id}/deactivate | Admin |
| GET | /api/roles | Admin |
| POST | /api/roles | Admin |
| PATCH | /api/users/{id}/roles | Admin |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE11-SEC-001: All endpoints require authentication.
- NFR-FE11-SEC-002: Role-based access control must be enforced.
- NFR-FE11-SEC-003: Only admins may access FE11 endpoints.

### 12.2 Performance

- NFR-FE11-PERF-001: User list must support pagination.
- NFR-FE11-PERF-002: Search must support username and email lookup.

### 12.3 Logging and Audit

- NFR-FE11-LOG-001: All account and role changes must be logged.

---

## 13. Out of Scope

This feature does not include:

- Authentication logic (FE02).
- Membership approval workflow (FE04).
- Borrowing operations (FE07).
- Reservation management (FE08).
- Fine management (FE09).

---

## 14. Dependencies

| Dependency | Type | Notes |
|------------|------|------|
| FE02 Authentication | Internal | Provides user identity. |
| All protected modules | Internal | Consume role information. |
| SQL Database | Technical | Stores users and roles. |

---

## 15. Open Questions

| ID | Question | Status |
|----|----------|--------|
| Q-FE11-001 | Can a user have multiple roles? | Open |
| Q-FE11-002 | Can an admin deactivate another admin? | Open |
| Q-FE11-003 | Is role hierarchy required? | Open |
| Q-FE11-004 | Is Super Admin required? | Open |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
|---------------|-----------------|------------------|--------|
| BR-FE11-001 | UC49-UC57 | FT50-FT58 | Not Started |
| BR-FE11-004 | UC51 | FT52 | Not Started |
| BR-FE11-005 | UC51 | FT52 | Not Started |
| BR-FE11-006 | UC53, UC56 | FT54, FT57 | Not Started |
| FR-FE11-009 | UC57 | FT58 | Not Started |

---

## 17. Review Checklist

Before this SPEC.md is approved:

- [ ] Open questions are resolved or accepted as TBD.
- [ ] Role assignment rules are approved.
- [ ] User status lifecycle is approved.
- [ ] API contract is copied to docs/api/api-contract.md.
- [ ] Authorization rules are reviewed by the team.
- [ ] Every acceptance criterion can become a test.