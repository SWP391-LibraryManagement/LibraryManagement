# SPEC.md - FE04 Membership Management

# Version: 0.2.2

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Dat

# Last Updated: 2026-07-19

# Feature ID: FE04

# Feature folder: `.sdd/specs/feat-membership-management/`

> Source of truth for FE04 Membership Management. Revision v0.2.2 aligns the approved workflow with the current code baseline without expanding implementation scope.

---

## 1. Feature Overview

### 1.1 Feature Name

Membership Management

### 1.2 Business Context

The library needs a controlled way to decide which registered users are approved members. Approved membership is required before borrowing books, reserving books, and using other Phase 1 member services.

Membership Management provides an application and review workflow. It must be separate from account creation and role assignment so that authentication and authorization remain clean.

### 1.3 Goal / Outcome

The system shall:

- Allow authenticated users with the `MEMBER` role to apply for membership.
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
| Member Applicant | Authenticated user with the `MEMBER` role applying for membership | Submit membership application and view own membership status. |
| Member | User with approved membership | View membership status. |
| Librarian | Library staff | Review, approve, or reject membership applications. |
| Admin | System administrator | Has membership review permissions. |
| Notification Service | Internal feature | Receives a safe `MEMBERSHIP_RESULT` request after approval/rejection commits when the FE04 requester is configured. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE04-001: The user has an existing account in `Users`.
- PRE-FE04-002: The actor is authenticated for protected membership actions.
- PRE-FE04-003: The user's account has `Users.Status = ACTIVE`; `INACTIVE` and `LOCKED` accounts cannot apply.
- PRE-FE04-004: The user has neither an approved membership nor a pending application; a user whose canonical membership is `REJECTED` may create one new `PENDING` application under BR-FE04-016.
- PRE-FE04-005: Approval/rejection actor has Librarian or Admin permission according to FE11.

---

## 4. Main Flows

### MF-FE04-001: Apply For Membership

1. Authenticated user with the `MEMBER` role opens membership application.
2. The system checks whether the user is eligible to apply.
3. The user submits the application.
4. The system validates duplicate and status rules.
5. In one transaction, the system creates a `MembershipApplications` record with status `PENDING` and creates/updates the user's canonical `Members` projection to `PENDING`.
6. After the membership transaction commits, the system writes the application audit entry.
7. The system preserves all previous application records as immutable history and shows the pending status to the user.

### MF-FE04-002: Approve Membership Application

1. Librarian/admin opens pending membership applications.
2. Librarian/admin reviews applicant information.
3. Librarian/admin chooses approve.
4. The system verifies the application is still `PENDING`.
5. In one transaction, the system updates the application to `APPROVED`, stores `MembershipApplications.ApprovedAt` and reviewer, updates canonical `Members.Status` to `APPROVED`, and stores the same server timestamp in `Members.ApprovedAt`.
6. After commit, the system writes the review audit entry and then requests a non-blocking FE10 notification with `type = GENERAL_SYSTEM`, `templateKey = MEMBERSHIP_RESULT`, and FE04-bound source context when the requester is configured; delivery failure does not roll back approval.

### MF-FE04-003: Reject Membership Application

1. Librarian/admin opens a pending membership application.
2. Librarian/admin enters a rejection reason.
3. Librarian/admin chooses reject.
4. The system verifies the application is still `PENDING`.
5. In one transaction, the system updates the application to `REJECTED`, stores reviewer and required rejection reason, updates canonical `Members.Status` to `REJECTED`, and keeps `Members.ApprovedAt = null`.
6. After commit, the system writes the review audit entry and then requests a non-blocking FE10 notification with `type = GENERAL_SYSTEM`, `templateKey = MEMBERSHIP_RESULT`, and FE04-bound source context when the requester is configured; delivery failure does not roll back rejection.

### MF-FE04-004: View Membership Status

1. Authenticated user opens membership status page.
2. The system loads canonical membership status from `Members` when a row exists and the current/latest application from `MembershipApplications` ordered by `AppliedAt DESC, ApplicationId DESC`.
3. The system derives `membershipStatusView`: `NONE` when no member/application exists, otherwise the canonical `Members.Status` value (`PENDING`, `APPROVED`, `REJECTED`, or `INACTIVE`). Membership does not expire in Phase 1.
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
3. The system rejects the new application because renewal/expiry is outside Phase 1.

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

- BR-FE04-001: Guests cannot apply for membership until authenticated with the `MEMBER` role.
- BR-FE04-002: Only authenticated users with the `MEMBER` role and `Users.Status = ACTIVE` may apply.
- BR-FE04-003: A user cannot have more than one pending membership application.
- BR-FE04-004: A user with `Members.Status = APPROVED` cannot submit another application in Phase 1.
- BR-FE04-005: New applications must start with status `PENDING`.
- BR-FE04-006: Only librarians/admins may approve membership applications.
- BR-FE04-007: Only librarians/admins may reject membership applications.
- BR-FE04-008: Only `PENDING` applications can be approved or rejected.
- BR-FE04-009: Approval must record approval timestamp.
- BR-FE04-010: Rejection must record a non-empty rejection reason of at most 500 characters.
- BR-FE04-011: Authenticated users with the `MEMBER` role may view only their own membership status.
- BR-FE04-012: Membership status must be available for FE07 and FE08 eligibility checks.
- BR-FE04-013: Approval/rejection actions must be traceable.
- BR-FE04-014: `Members.Status` is the canonical membership eligibility source for FE07/FE08; `MembershipApplications` is the immutable application/review history.
- BR-FE04-015: Application create/review result and the canonical member projection commit atomically. Audit logging happens after the membership transaction in the current code baseline.
- BR-FE04-016: A rejected user may re-apply; the new application starts `PENDING`, previous applications remain unchanged, and the canonical member projection returns to `PENDING`.
- BR-FE04-017: Membership does not expire in Phase 1; `EXPIRED` is not a valid application/member state.
- BR-FE04-018: After approval/rejection commits and audit logging succeeds, FE04 requests one FE10 notification when the requester is configured, with `type = GENERAL_SYSTEM`, `templateKey = MEMBERSHIP_RESULT`, application source metadata, and idempotency key `FE04:MEMBERSHIP_RESULT:<applicationId>:<finalStatus>`; notification failure is non-blocking and must not change the membership decision.

---

## 7. Functional Requirements

- FR-FE04-001: When an eligible authenticated `MEMBER` applies for membership, the system shall create a pending application.
- FR-FE04-002: If a user already has a pending application, then the system shall reject a duplicate application.
- FR-FE04-003: If a user already has canonical `Members.Status = APPROVED`, then the system shall reject a new application because Phase 1 has no expiry/renewal flow.
- FR-FE04-004: When a librarian/admin approves a pending application, the system shall mark both projections approved, set `MembershipApplications.ApprovedAt` and `Members.ApprovedAt` to the same server timestamp, and record the reviewer.
- FR-FE04-005: When a librarian/admin rejects a pending application, the system shall mark it rejected.
- FR-FE04-006: If a non-authorized actor attempts approval/rejection, then the system shall deny access.
- FR-FE04-007: When an authenticated `MEMBER` views membership status, the system shall return only that user's deterministic status fields, canonical member status when present, and current/latest application; users with no member/application receive `membershipStatusView = NONE`.
- FR-FE04-008: If the application is not pending, then the system shall reject approve/reject state changes.
- FR-FE04-009: When FE07/FE08 checks eligibility, the system shall classify the user as an approved member only when `Users.Status = ACTIVE` and `Members.Status = APPROVED`.
- FR-FE04-010: When a rejected user reapplies, the system shall create a new pending application, preserve prior history, and atomically set `Members.Status = PENDING`.
- FR-FE04-011: When approval/rejection succeeds, the system shall update the application, canonical member projection, reviewer metadata, and decision timestamps in one transaction; approval uses the same timestamp for both `ApprovedAt` fields, while rejection keeps `Members.ApprovedAt = null`. Audit logging occurs after the membership transaction in the current code baseline.
- FR-FE04-012: When approval/rejection commits and audit logging succeeds, the system shall request one idempotent FE10 delivery with `type = GENERAL_SYSTEM` and `templateKey = MEMBERSHIP_RESULT` through the FE04-bound requester when configured, then return safe delivery status without rolling back the decision if delivery fails.

---

## 8. Acceptance Criteria

- AC-FE04-001: Given an eligible authenticated `MEMBER` with no pending/approved membership, when the user applies, then a `PENDING` application is created.
- AC-FE04-002: Given a user already has a pending application, when the user applies again, then the duplicate application is rejected.
- AC-FE04-003: Given a pending application, when a librarian/admin approves it, then the application and `Members.Status` become `APPROVED`, `MembershipApplications.ApprovedAt` equals `Members.ApprovedAt`, reviewer/approval metadata commits atomically, and one non-blocking FE10 request is attempted after commit when configured.
- AC-FE04-004: Given a pending application and non-empty reason, when a librarian/admin rejects it, then the application and `Members.Status` become `REJECTED`, `Members.ApprovedAt` remains null, reason/reviewer metadata commits atomically, and one non-blocking FE10 request is attempted after commit when configured.
- AC-FE04-005: Given a member tries to approve an application, when the request is processed, then access is denied.
- AC-FE04-006: Given an approved or rejected application, when approval/rejection is attempted again, then the system rejects the invalid state transition.
- AC-FE04-007: Given an authenticated `MEMBER`, when viewing membership status, then only that user's data is returned and a user with no member/application receives `membershipStatusView = NONE`, `memberStatus = null`, and `currentApplication = null`.
- AC-FE04-008: Given a guest, when viewing membership status or applying, then the system requires authentication.
- AC-FE04-009: Given a rejected user with no pending application, when the user reapplies, then a new `PENDING` application is created, prior history remains unchanged, and `Members.Status` becomes `PENDING`.
- AC-FE04-010: Given FE10 delivery fails after a review decision commits, then the application/member decision remains committed and the response exposes only safe `notificationStatus`.
- AC-FE04-011: Given FE07/FE08 checks eligibility, then only an `ACTIVE` user with canonical `Members.Status = APPROVED` passes.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE04-001 | Guest applies for membership | Return unauthorized response. |
| EC-FE04-002 | User account inactive | Reject application. |
| EC-FE04-003 | Duplicate pending application | Reject duplicate and return current status. |
| EC-FE04-004 | Already approved membership | Reject; Phase 1 has no expiry/renewal flow. |
| EC-FE04-005 | Application ID not found | Return not found. |
| EC-FE04-006 | Non-pending application approved/rejected | Reject invalid state transition. |
| EC-FE04-007 | Unauthorized actor approves/rejects | Return forbidden response. |
| EC-FE04-008 | Missing/blank/overlength rejection reason | Reject request without changing application/member state. |
| EC-FE04-009 | Concurrent review by two staff users | Only first valid transition succeeds. |
| EC-FE04-010 | Database update fails during review | Roll back application/member status and timestamp changes; audit is attempted only after the membership transaction commits. |
| EC-FE04-011 | Concurrent re-application creates duplicate pending rows | The current code checks for existing pending/approved applications before insert, but no dedicated concurrency guard is implemented in FE04 code. |
| EC-FE04-012 | FE10 notification request/delivery fails | Keep committed membership decision and return safe `FAILED` delivery status. When requester is not configured, return `NOT_CONFIGURED`. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Stores applicant account and account status. |
| UserProfiles | Provides applicant profile information for review if needed. |
| UserRoles | Checks librarian/admin review permission. |
| Members | Canonical current membership projection consumed by FE07/FE08. |
| MembershipApplications | Stores membership application status and timestamps. |
| Notifications | Receives non-blocking `MEMBERSHIP_RESULT` requests through FE10 after a decision commits when the requester is configured. |
| AuditLogs | Records application/review actions. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| applicationId | integer | Yes for review | Must exist in `MembershipApplications`. |
| userId | integer | Yes | Must reference applicant user. |
| applicationStatus | string | Yes | Values: `PENDING`, `APPROVED`, `REJECTED`; application history is immutable after a final status. |
| memberStatus | string/null | After first application | Canonical `Members.Status`: `PENDING`, `APPROVED`, `REJECTED`, `INACTIVE`; `null` before a `Members` row exists; FE07/FE08 accept only `APPROVED`. |
| membershipStatusView | string | Yes for status response | Derived values: `NONE`, `PENDING`, `APPROVED`, `REJECTED`, `INACTIVE`; `NONE` is never persisted. |
| appliedAt | datetime | Yes | Defaults to current server time. |
| applicationApprovedAt | datetime | Required on approval | Maps to `MembershipApplications.ApprovedAt`; set to the server approval timestamp. |
| memberApprovedAt | datetime | Required when canonical member is approved | Maps to `Members.ApprovedAt`; equals the application approval timestamp and is null for `PENDING`, `REJECTED`, or `INACTIVE`. |
| reviewedBy | integer | Required on approval/rejection | Reviewer user ID; existing SQL supports this field. |
| rejectionReason (`ReviewNote`) | string | Required on rejection | Trimmed, 1..500 characters; existing SQL `ReviewNote` stores the reason. |

### 10.3 Canonical Membership and State Rules

- `MembershipApplications` owns workflow history. Valid transitions are `[*] -> PENDING`, `PENDING -> APPROVED`, and `PENDING -> REJECTED`; final application rows never reopen.
- `Members` owns current eligibility. First application/re-application sets `PENDING`; approval sets `APPROVED`; rejection sets `REJECTED`. `INACTIVE` is retained for schema compatibility but no FE04 Phase 1 application endpoint transitions into it.
- A user may have many historical applications. The service rejects a new application when it detects an existing `PENDING` or `APPROVED` application; before the first application there may be no `Members` row, and once the first application is created, exactly one canonical `Members` row must exist.
- Current/latest application is selected deterministically by `AppliedAt DESC, ApplicationId DESC`; this display rule never overrides canonical eligibility from `Members`.
- `membershipStatusView` is derived as `NONE` only when both the canonical member row and current application are absent; otherwise it mirrors canonical `Members.Status`.
- Application/member writes use one transaction. Audit logging and FE10 notification are requested only after commit and are not part of the membership transaction.

---

## 11. API / Interface Contract

> The endpoints and request/response shapes below are the canonical Phase 1 contract for this feature.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/membership/applications` | Authenticated `MEMBER` | `{}` | Created application and canonical `PENDING` status | Active account only; preserves prior history. |
| GET | `/api/membership/status/me` | Authenticated `MEMBER` | - | Status response with `status`, `membershipStatusView`, `memberStatus`, `currentApplication`, `application`, and `member` | `NONE`/`null` values are returned deterministically before the first application; otherwise canonical status comes from `Members`. |
| GET | `/api/membership/applications` | Librarian/Admin | Query: `q?, status?, page?, limit?` | `{ applications, page, limit, total, totalPages }` | Protected review list; `q` searches application ID, name, username, or email. |
| PATCH | `/api/membership/applications/{applicationId}/approve` | Librarian/Admin | `{}` | Approved application + safe `notificationStatus` | Pending only; application/member commit together, audit and notification run after commit. |
| PATCH | `/api/membership/applications/{applicationId}/reject` | Librarian/Admin | `{ reason: string }` | Rejected application + safe `notificationStatus` | Pending only; reason required, trimmed, max 500; audit and notification run after commit. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE04-SEC-001: Membership endpoints must validate actor identity.
- NFR-FE04-SEC-002: Approval and rejection must enforce role-based access on the server.
- NFR-FE04-SEC-003: Users must not view another user's membership status through member endpoints.
- NFR-FE04-SEC-004: Request IDs, status values, and reason text must be validated.

### 12.2 Transaction Integrity

- NFR-FE04-TXN-001: Application, canonical `Members` projection, and reviewer metadata must commit or roll back together. Audit logging is outside that transaction in the current code baseline.
- NFR-FE04-TXN-002: Review operations enforce one final transition by rechecking pending status inside the review transaction. Apply checks existing pending/approved applications before insert, but no dedicated concurrent-apply guard is implemented in FE04 code.

### 12.3 Performance

- NFR-FE04-PERF-001: Membership application list must apply search, status filtering, counting, and pagination in the database query before materializing rows.

### 12.4 Logging and Audit

- NFR-FE04-LOG-001: Apply, approval, rejection, and canonical projection changes must be traceable with actor, application, member, timestamp, and result.

### 12.5 Usability

- NFR-FE04-UX-001: Applicants must see clear status: no application, pending, approved, rejected.
- NFR-FE04-UX-002: Rejected applicants must see the stored rejection reason without protected reviewer/internal data.

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
| FE10 Notification Management | Internal | Receives non-blocking `MEMBERSHIP_RESULT` requests after approval/rejection commits when configured. |
| FE11 User & Role Management | Internal | Provides librarian/admin roles. |
| SQL Server database | Technical | Current SQL script has `Members` and `MembershipApplications`; FE04 keeps them transactionally consistent. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE04-001 | Rejected users can re-apply after correcting information. | Review packet 2026-06-10 | APPROVED |
| Q-FE04-002 | Rejection reason is required. | Review packet 2026-06-10 | APPROVED |
| Q-FE04-003 | Membership does not expire in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE04-004 | Approved membership changes application/member status only, not user role. | Review packet 2026-06-10 | APPROVED |
| Q-FE04-005 | Librarian and Admin can approve/reject membership applications. | Review packet 2026-06-10 | APPROVED |
| Q-FE04-006 | Approval/rejection requests the canonical FE10 notification after commit when the requester is configured; provider/request failure is non-blocking and does not roll back the decision. | Review packet 2026-06-10; code alignment 2026-07-19 | APPROVED |
| Q-FE04-007 | `Members.Status` is the canonical eligibility source; `MembershipApplications` retains immutable review history. | Nhat approval after cross-feature audit 2026-07-15 | APPROVED |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE04-001 | UC13 | FT14 | Not Started |
| BR-FE04-002 | UC13 | FT14 | Not Started |
| BR-FE04-003 | UC13 | FT14 | Not Started |
| BR-FE04-004 | UC13 | FT14 | Not Started |
| BR-FE04-005 | UC13 | FT14 | Not Started |
| BR-FE04-006 | UC14 | FT15 | Not Started |
| BR-FE04-007 | UC15 | FT16 | Not Started |
| BR-FE04-008 | UC14, UC15 | FT15, FT16 | Not Started |
| BR-FE04-009 | UC14 | FT15 | Not Started |
| BR-FE04-010 | UC15 | FT16 | Not Started |
| BR-FE04-011 | UC16 | FT17 | Not Started |
| BR-FE04-012 | UC16, UC29, UC36 | Planned: FE04-FE07-FE08 canonical eligibility contract test | Planned |
| BR-FE04-013 | UC14, UC15 | FT15, FT16 | Not Started |
| BR-FE04-014 | UC13, UC16, UC29, UC36 | Planned: `Members` canonical projection test | Planned |
| BR-FE04-015 | UC13, UC14, UC15 | Existing: membership transaction and decision-timestamp tests; concurrent apply guard not implemented | Ready for review |
| BR-FE04-016 | UC13 | Planned: rejected applicant re-application history test | Planned |
| BR-FE04-017 | UC16 | Planned: Phase 1 no-expiry state test | Planned |
| BR-FE04-018 | UC14, UC15 | Planned: non-blocking `MEMBERSHIP_RESULT` requester test | Planned |
| FR-FE04-001 | UC13 | FT14 | Not Started |
| FR-FE04-002 | UC13 | FT14 | Not Started |
| FR-FE04-003 | UC13 | FT14 | Not Started |
| FR-FE04-004 | UC14 | FT15 | Not Started |
| FR-FE04-005 | UC15 | FT16 | Not Started |
| FR-FE04-006 | UC14, UC15 | FT15, FT16 | Not Started |
| FR-FE04-007 | UC16 | FT17 | Not Started |
| FR-FE04-008 | UC14, UC15 | FT15, FT16 | Not Started |
| FR-FE04-009 | UC29, UC36 | Planned: active user + canonical approved membership eligibility test | Planned |
| FR-FE04-010 | UC13 | Planned: re-application projection/history test | Planned |
| FR-FE04-011 | UC14, UC15 | Existing: application/member atomicity and dual-ApprovedAt test; audit is post-transaction | Ready for review |
| FR-FE04-012 | UC14, UC15 | Planned: FE10 failure preserves membership decision test | Planned |
| AC-FE04-001 | UC13 | FT14 | Not Started |
| AC-FE04-002 | UC13 | FT14 | Not Started |
| AC-FE04-003 | UC14 | FT15 | Not Started |
| AC-FE04-004 | UC15 | FT16 | Not Started |
| AC-FE04-005 | UC14, UC15 | FT15, FT16 | Not Started |
| AC-FE04-006 | UC14, UC15 | FT15, FT16 | Not Started |
| AC-FE04-007 | UC16 | FT17 | Not Started |
| AC-FE04-008 | UC13, UC16 | FT14, FT17 | Not Started |
| AC-FE04-009 | UC13 | Planned: rejected user creates one new pending application | Planned |
| AC-FE04-010 | UC14, UC15 | Planned: failed notification leaves committed decision | Planned |
| AC-FE04-011 | UC29, UC36 | Planned: only active + canonical approved passes | Planned |

### 16.1 Coverage Summary

| Requirement Type | Total IDs | Mapped IDs | Coverage |
| ---------------- | --------- | ---------- | -------- |
| Business Rules (BR-FE04) | 18 | 18 | 100% |
| Functional Requirements (FR-FE04) | 12 | 12 | 100% |
| Acceptance Criteria (AC-FE04) | 11 | 11 | 100% |
| **Total** | **41** | **41** | **100%** |

---

## 17. Review Checklist

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Re-application policy is approved.
- [x] Reviewer roles are approved with FE11.
- [x] Rejection reason and schema needs are confirmed.
- [x] Membership status source for FE07/FE08 is confirmed.
- [x] API contract is approved in SPEC.md or copied to a dedicated shared API contract file if the team reintroduces one.
- [x] Every acceptance criterion can become a test.

### 17.1 Revision v0.2.0 Review Gate

- [x] Confirm `Members.Status` as the canonical FE07/FE08 eligibility source.
- [x] Confirm atomic application/member writes; audit is post-transaction and concurrent-apply guard is not implemented in the current code baseline.
- [x] Confirm mandatory rejection reason and Phase 1 no-expiry behavior.
- [x] Confirm non-blocking idempotent FE10 `MEMBERSHIP_RESULT` delivery.
