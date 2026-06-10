# SPEC.md - FE04 Membership Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Dat

# Last Updated: 2026-06-10

# Feature ID: FE04

# Feature folder: `.sdd/specs/feat-membership-management/`

> Source of truth for FE04 Membership Management. This spec is a draft and must be reviewed before implementation.

---

## 1. Feature Overview

### 1.1 Feature Name

Membership Management

### 1.2 Business Context

The library needs a controlled way to decide which registered users are approved members. Approved membership may be required before borrowing books, reserving books, and using other member services.

Membership Management provides an application and review workflow. It must be separate from account creation and role assignment so that authentication and authorization remain clean.

### 1.3 Goal / Outcome

The system shall:

- Allow registered users to apply for membership.
- Allow authorized librarians/admins to approve membership applications.
- Allow authorized librarians/admins to reject membership applications.
- Allow users to view their own membership status.
- Maintain traceable membership application status for borrowing and reservation eligibility.

### 1.4 Scope Level

- [ ] Full Spec - core business logic, high risk, must be correct from the beginning
- [x] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Guest | Unauthenticated visitor | No membership application access; must register/login first. |
| Member Applicant | Registered user applying for membership | Submit membership application and view own membership status. |
| Member | User with approved membership | View membership status. |
| Librarian | Library staff | Review, approve, or reject membership applications if policy allows. |
| Admin | System administrator | Has membership review permissions. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE04-001: The user has an existing account in `Users`.
- PRE-FE04-002: The actor is authenticated for protected membership actions.
- PRE-FE04-003: The user's account status allows membership application.
- PRE-FE04-004: The user does not already have an approved membership or duplicate pending application unless re-application is approved.
- PRE-FE04-005: Approval/rejection actor has Librarian or Admin permission according to FE11.

---

## 4. Main Flows

### MF-FE04-001: Apply For Membership

1. Registered user opens membership application.
2. The system checks whether the user is eligible to apply.
3. The user submits the application.
4. The system validates duplicate and status rules.
5. The system creates a `MembershipApplications` record with status `PENDING`.
6. The system shows the pending status to the user.

### MF-FE04-002: Approve Membership Application

1. Librarian/admin opens pending membership applications.
2. Librarian/admin reviews applicant information.
3. Librarian/admin chooses approve.
4. The system verifies the application is still `PENDING`.
5. The system updates application status to `APPROVED` and stores approval timestamp.
6. The system writes an audit log entry if approved.

### MF-FE04-003: Reject Membership Application

1. Librarian/admin opens a pending membership application.
2. Librarian/admin enters rejection reason if required by policy.
3. Librarian/admin chooses reject.
4. The system verifies the application is still `PENDING`.
5. The system updates application status to `REJECTED`.
6. The system stores rejection information if the schema supports it.
7. The system writes an audit log entry if approved.

### MF-FE04-004: View Membership Status

1. Authenticated user opens membership status page.
2. The system loads the user's latest or active membership application.
3. The system displays membership status: no application, pending, approved, rejected, or expired if supported.
4. The system does not expose other users' membership status.

---

## 5. Alternative Flows

### AF-FE04-001: Duplicate Pending Application

1. User already has a pending application.
2. User submits another application.
3. The system rejects the duplicate and returns current status.

### AF-FE04-002: Already Approved Member

1. User already has approved membership.
2. User attempts to apply again.
3. The system rejects the new application unless renewal is approved.

### AF-FE04-003: Unauthorized Review Action

1. Member or guest attempts to approve/reject an application.
2. The system checks role permission.
3. The system denies the action.

### AF-FE04-004: Application State Changed Before Review

1. Librarian opens a pending application.
2. Another authorized actor approves/rejects it first.
3. The system rechecks status before saving.
4. The second action is rejected as invalid state.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE04-001: Guests cannot apply for membership until authenticated.
- BR-FE04-002: Only registered users with eligible account status may apply.
- BR-FE04-003: A user cannot have more than one pending membership application.
- BR-FE04-004: A user with approved membership cannot submit another application unless renewal/re-application is approved.
- BR-FE04-005: New applications must start with status `PENDING`.
- BR-FE04-006: Only librarians/admins may approve membership applications.
- BR-FE04-007: Only librarians/admins may reject membership applications.
- BR-FE04-008: Only `PENDING` applications can be approved or rejected.
- BR-FE04-009: Approval must record approval timestamp.
- BR-FE04-010: Rejection should record rejection reason if the team approves the field.
- BR-FE04-011: Users may view only their own membership status.
- BR-FE04-012: Membership status must be available for FE07 and FE08 eligibility checks.
- BR-FE04-013: Approval/rejection actions must be traceable.

---

## 7. Functional Requirements

- FR-FE04-001: When an eligible registered user applies for membership, the system shall create a pending application.
- FR-FE04-002: If a user already has a pending application, then the system shall reject a duplicate application.
- FR-FE04-003: If a user already has approved membership, then the system shall reject a new application unless renewal is approved.
- FR-FE04-004: When a librarian/admin approves a pending application, the system shall mark it approved and record approval time.
- FR-FE04-005: When a librarian/admin rejects a pending application, the system shall mark it rejected.
- FR-FE04-006: If a non-authorized actor attempts approval/rejection, then the system shall deny access.
- FR-FE04-007: When a user views membership status, the system shall return only that user's membership status.
- FR-FE04-008: If the application is not pending, then the system shall reject approve/reject state changes.

---

## 8. Acceptance Criteria

- AC-FE04-001: Given an eligible registered user with no pending/approved membership, when the user applies, then a `PENDING` application is created.
- AC-FE04-002: Given a user already has a pending application, when the user applies again, then the duplicate application is rejected.
- AC-FE04-003: Given a pending application, when a librarian/admin approves it, then status becomes `APPROVED` and approval time is recorded.
- AC-FE04-004: Given a pending application, when a librarian/admin rejects it, then status becomes `REJECTED`.
- AC-FE04-005: Given a member tries to approve an application, when the request is processed, then access is denied.
- AC-FE04-006: Given an approved or rejected application, when approval/rejection is attempted again, then the system rejects the invalid state transition.
- AC-FE04-007: Given an authenticated user, when viewing membership status, then only that user's status is returned.
- AC-FE04-008: Given a guest, when viewing membership status or applying, then the system requires authentication.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE04-001 | Guest applies for membership | Return unauthorized response. |
| EC-FE04-002 | User account inactive | Reject application. |
| EC-FE04-003 | Duplicate pending application | Reject duplicate and return current status. |
| EC-FE04-004 | Already approved membership | Reject unless renewal is approved. |
| EC-FE04-005 | Application ID not found | Return not found. |
| EC-FE04-006 | Non-pending application approved/rejected | Reject invalid state transition. |
| EC-FE04-007 | Unauthorized actor approves/rejects | Return forbidden response. |
| EC-FE04-008 | Missing rejection reason when required | Reject request. |
| EC-FE04-009 | Concurrent review by two staff users | Only first valid transition succeeds. |
| EC-FE04-010 | Database update fails during review | Roll back status/timestamp/audit changes. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Stores applicant account and account status. |
| UserProfiles | Provides applicant profile information for review if needed. |
| UserRoles | Checks librarian/admin review permission. |
| MembershipApplications | Stores membership application status and timestamps. |
| AuditLogs | Records approval/rejection actions if approved. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| applicationId | integer | Yes for review | Must exist in `MembershipApplications`. |
| userId | integer | Yes | Must reference applicant user. |
| status | string | Yes | Proposed values: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`. |
| appliedAt | datetime | Yes | Defaults to current server time. |
| approvedAt | datetime | Required on approval | Existing SQL supports this field. |
| reviewedBy | integer | Recommended | Reviewer user ID if schema is extended. |
| rejectedAt | datetime | Recommended | Needed for clear rejection history. |
| rejectionReason | string | Optional/Recommended | Required only if Q-FE04-002 is approved. |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract must be copied into `docs/api/api-contract.md` before implementation if the team keeps a dedicated API document.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/membership/applications` | Registered User | `{}` or application fields if approved | Created application | Creates pending application. |
| GET | `/api/membership/status/me` | Registered User | - | Own membership status | User's own status only. |
| GET | `/api/membership/applications` | Librarian/Admin | Query: `status?, page?, limit?` | Paginated applications | Protected review list. |
| PATCH | `/api/membership/applications/{applicationId}/approve` | Librarian/Admin | Optional notes | Approved application | Pending only. |
| PATCH | `/api/membership/applications/{applicationId}/reject` | Librarian/Admin | `{ reason?: string }` | Rejected application | Reason required if approved. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE04-SEC-001: Membership endpoints must validate actor identity.
- NFR-FE04-SEC-002: Approval and rejection must enforce role-based access on the server.
- NFR-FE04-SEC-003: Users must not view another user's membership status through member endpoints.
- NFR-FE04-SEC-004: Request IDs, status values, and reason text must be validated.

### 12.2 Transaction Integrity

- NFR-FE04-TXN-001: Approval/rejection must update status, timestamps, and audit log atomically if audit logging is used.
- NFR-FE04-TXN-002: Concurrent review must not produce multiple final statuses for one application.

### 12.3 Performance

- NFR-FE04-PERF-001: Membership application list should support pagination and status filtering.

### 12.4 Logging and Audit

- NFR-FE04-LOG-001: Approval and rejection actions should be traceable with actor, application, timestamp, and result.

### 12.5 Usability

- NFR-FE04-UX-001: Applicants must see clear status: no application, pending, approved, rejected.
- NFR-FE04-UX-002: Rejection display should be understandable if rejection reason is supported.

---

## 13. Out of Scope

This feature does not include:

- Account registration or login.
- Password, email verification, or authentication token handling.
- Profile editing.
- Role assignment or user account deactivation.
- Borrowing, return, renewal, or reservation execution.
- Fine calculation or payment.
- Membership payment or online payment gateway.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE02 Authentication | Internal | Provides account identity and authenticated user. |
| FE03 User Profile | Internal | Provides profile data for review if needed. |
| FE07 Borrowing Management | Internal | Requires approved membership for borrowing. |
| FE08 Reservation Management | Internal | May require approved membership for reservation. |
| FE11 User & Role Management | Internal | Provides librarian/admin roles. |
| SQL Server database | Technical | Current SQL script has `MembershipApplications`. |

---

## 15. Open Questions

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE04-001 | Can rejected users re-apply? If yes, when? | Team/Teacher | Open |
| Q-FE04-002 | Is rejection reason required? | Team/Teacher | Open |
| Q-FE04-003 | Does membership expire or require renewal? | Team/Teacher | Open |
| Q-FE04-004 | Does approved membership change a user role, or only application status? | Team/Teacher | Open |
| Q-FE04-005 | Should both Librarian and Admin approve/reject, or Admin only? | Team/Teacher | Open |
| Q-FE04-006 | Should approval/rejection trigger FE10 notification? | Team/Teacher | Open |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE04-002 | UC13 | FT14 | Not Started |
| BR-FE04-003 | UC13 | FT14 | Not Started |
| FR-FE04-001 | UC13 | FT14 | Not Started |
| BR-FE04-006 | UC14 | FT15 | Not Started |
| FR-FE04-004 | UC14 | FT15 | Not Started |
| BR-FE04-007 | UC15 | FT16 | Not Started |
| FR-FE04-005 | UC15 | FT16 | Not Started |
| BR-FE04-011 | UC16 | FT17 | Not Started |
| FR-FE04-007 | UC16 | FT17 | Not Started |

---

## 17. Review Checklist

Before this SPEC.md is approved:

- [ ] Re-application policy is approved.
- [ ] Reviewer roles are approved with FE11.
- [ ] Rejection reason and schema needs are confirmed.
- [ ] Membership status source for FE07/FE08 is confirmed.
- [ ] API contract is copied to `docs/api/api-contract.md` if the team uses a shared API contract.
- [ ] Every acceptance criterion can become a test.
