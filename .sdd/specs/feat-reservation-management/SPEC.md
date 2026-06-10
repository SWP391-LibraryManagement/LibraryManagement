# SPEC.md - FE08 Reservation Management

# Version: 0.1.0

# Status: APPROVED

# Owner: Nhat

# Last Updated: 2026-06-10

# Feature ID: FE08

# Feature folder: `.sdd/specs/feat-reservation-management/`

> Source of truth for FE08 Reservation Management. This spec is approved for Phase 2 planning.

---

## 1. Feature Overview

### 1.1 Feature Name

Reservation Management

### 1.2 Business Context

When a book is not currently available, members need a fair way to reserve it and wait for availability. Librarians need to view and process the reservation queue so the next eligible member can be notified when a copy becomes available.

Reservation Management protects fairness and prevents confusion when many members want the same book.

### 1.3 Goal / Outcome

The system shall:

- Allow eligible members to reserve unavailable books.
- Allow members to cancel their active reservations.
- Allow librarians/admins to view and process reservation queues.
- Update reservation status when a copy becomes available or when reservation is cancelled.
- Trigger notification requirements for FE10 when a reserved book becomes available.

### 1.4 Scope Level

- [ ] Full Spec - core business logic, high risk, must be correct from the beginning
- [x] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Member | Registered library user | Create reservation, cancel own reservation, view own reservation status. |
| Librarian | Library staff | View reservation list, process reservation queue, release/expire reservations when allowed. |
| Admin | System administrator | Has librarian permissions and can view reservation reports/audit. |
| Guest | Unauthenticated visitor | No reservation permissions. |
| Notification Service | External service | Receives notification request when a reserved book becomes available. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE08-001: The user is authenticated as Member, Librarian, or Admin.
- PRE-FE08-002: The member account is active.
- PRE-FE08-003: The member has approved membership status before creating a reservation.
- PRE-FE08-004: The requested book or book copy exists.
- PRE-FE08-005: Reservation policy is approved: reservation target, maximum active reservations, reservation expiry time, and queue behavior.

---

## 4. Main Flows

### MF-FE08-001: Reserve Book

1. Member opens a book detail page or unavailable copy information.
2. Member chooses to reserve the book.
3. The system validates member eligibility and reservation limit.
4. The system checks whether reservation is allowed for the selected book/copy.
5. The system creates a `Reservations` record with status `ACTIVE`.
6. The system records reservation time for queue order.
7. The system shows reservation status to the member.

### MF-FE08-002: Cancel Reservation

1. Member opens their reservation list.
2. Member selects an active reservation.
3. Member confirms cancellation.
4. The system changes reservation status to `CANCELLED`.
5. The system writes an audit log if required.

### MF-FE08-003: View Reservation List

1. Librarian/admin opens the reservation management screen.
2. The system displays active reservations with member, book/copy, reserved time, and status.
3. The librarian/admin filters by book, member, status, or date range when available.

### MF-FE08-004: Process Reservation Queue

1. A borrowed/reserved copy becomes available, or a librarian opens the queue manually.
2. The system identifies the earliest eligible active reservation.
3. The system marks the copy as reserved for that member or keeps reservation active according to policy.
4. The system triggers FE10 notification requirement.
5. The system updates queue state.

### MF-FE08-005: Trigger Book Available Notification

1. Reservation queue selects the next member.
2. The system creates or sends a notification request to FE10.
3. The member receives book available information through the configured channel when FE10 is implemented.

---

## 5. Alternative Flows

### AF-FE08-001: Book Copy Is Available

1. Member attempts to reserve an available copy.
2. The system rejects reservation and recommends borrowing instead.

### AF-FE08-002: Duplicate Active Reservation

1. Member already has an active reservation for the same book/copy.
2. Member attempts to reserve again.
3. The system rejects duplicate reservation.

### AF-FE08-003: Member Becomes Ineligible Before Queue Processing

1. Member has active reservation.
2. Queue is processed later.
3. The system detects member is no longer eligible.
4. The system skips or holds the reservation according to approved policy.

### AF-FE08-004: Reservation Expires

1. Member is notified that a book is available.
2. Member does not borrow within the reservation hold period.
3. The system marks reservation `EXPIRED` and moves to the next reservation if any.

---

## 6. Business Rules

- BR-FE08-001: A guest cannot create or cancel reservations.
- BR-FE08-002: A member can create reservations only for their own account.
- BR-FE08-003: A member can cancel only their own active reservations.
- BR-FE08-004: Librarian/admin can view and process all reservation records.
- BR-FE08-005: A member must have active account status and approved membership status to reserve.
- BR-FE08-006: A member cannot create duplicate active reservations for the same reservation target.
- BR-FE08-007: A reservation can be created only when reservation is allowed by policy.
- BR-FE08-008: The reservation queue must preserve `ReservedAt` order unless policy defines priority rules.
- BR-FE08-009: Cancelled reservations must not be selected by queue processing.
- BR-FE08-010: Expired reservations must not be selected by queue processing.
- BR-FE08-011: When a reserved copy is held for a member, it must not be available for normal borrowing by another member.
- BR-FE08-012: Queue processing must trigger a notification requirement for FE10.
- BR-FE08-013: Reservation status changes must be traceable.
- BR-FE08-014: An active reservation or held copy for another member must block FE07 loan renewal for the same copy/reservation target.

---

## 7. Functional Requirements

- FR-FE08-001: When an eligible member submits a reservation request, the system shall create an active reservation.
- FR-FE08-002: If the member already has an active reservation for the same target, the system shall reject the duplicate request.
- FR-FE08-003: If the reservation target is available for immediate borrowing, the system shall reject reservation and recommend borrowing.
- FR-FE08-004: When a member cancels an active reservation, the system shall mark it cancelled.
- FR-FE08-005: When a librarian/admin views reservations, the system shall return reservation records with member and book/copy information.
- FR-FE08-006: When queue processing runs, the system shall select the earliest eligible active reservation.
- FR-FE08-007: When a reservation is selected from queue, the system shall make the reserved item unavailable to other members according to policy.
- FR-FE08-008: When a reserved book becomes available, the system shall trigger a notification request for FE10.
- FR-FE08-009: While a reservation is cancelled or expired, the system shall exclude it from active queue processing.
- FR-FE08-010: When a member views reservations, the system shall return only that member's records.

---

## 8. Acceptance Criteria

- AC-FE08-001: Given an eligible member and unavailable reservation target, when the member reserves it, then the system creates an `ACTIVE` reservation.
- AC-FE08-002: Given a member with an active reservation for the same target, when the member reserves again, then the system rejects the duplicate reservation.
- AC-FE08-003: Given an available copy, when the member tries to reserve it, then the system rejects reservation and recommends borrowing.
- AC-FE08-004: Given an active reservation owned by the member, when the member cancels it, then the system marks it `CANCELLED`.
- AC-FE08-005: Given a reservation owned by another member, when a member tries to cancel it, then the system denies the action.
- AC-FE08-006: Given multiple active reservations for the same target, when queue processing runs, then the earliest eligible reservation is selected first.
- AC-FE08-007: Given a cancelled reservation, when queue processing runs, then it is skipped.
- AC-FE08-008: Given a selected reservation, when a copy is held for the member, then other members cannot borrow that held copy.
- AC-FE08-009: Given a selected reservation, when the book becomes available, then a notification request is triggered for FE10.
- AC-FE08-010: Given a logged-in member, when viewing reservations, then only that member's reservations are returned.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE08-001 | Member ID does not exist | Return not found error. |
| EC-FE08-002 | Member account inactive | Reject reservation. |
| EC-FE08-003 | Membership not approved | Reject reservation. |
| EC-FE08-004 | Book/copy does not exist | Return not found error. |
| EC-FE08-005 | Duplicate active reservation | Reject duplicate request. |
| EC-FE08-006 | Member cancels someone else's reservation | Return forbidden error. |
| EC-FE08-007 | Reservation already cancelled/expired | Reject repeated cancellation or return current state. |
| EC-FE08-008 | Queue has no eligible reservation | Leave item available or follow approved policy. |
| EC-FE08-009 | Notification service unavailable | Keep reservation state and record notification failure for retry if supported. |
| EC-FE08-010 | Concurrent queue processing | Only one queue selection may succeed; later action must re-read current state. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Identifies member, librarian, admin. |
| UserRoles | Checks permissions. |
| MembershipApplications | Confirms member eligibility if used as membership source. |
| Books | Provides book information for reservation display. |
| BookCopies | Provides copy status and reservation target in current SQL. |
| Reservations | Stores reservation records and queue order. |
| BorrowDetails | May release a copy into reservation queue after return. |
| AuditLogs | Records reservation state changes. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| reservationId | integer | Yes for updates | Must exist in `Reservations`. |
| userId | integer | Yes | Must reference a member user. |
| copyId | integer | Current SQL: Yes | Current SQL reserves a copy; team may change to book-level reservation. |
| reservedAt | datetime | Yes | Used for queue order. |
| status | string | Yes | Proposed values: `ACTIVE`, `CANCELLED`, `NOTIFIED`, `FULFILLED`, `EXPIRED`. |
| expiresAt | datetime | Recommended | Needed if reservation hold period is supported. |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract may stay in this SPEC.md unless the team reintroduces a dedicated shared API contract document.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/reservations` | Member | `{ bookId?: number, copyId?: number }` | Created reservation | Target depends on database decision. |
| GET | `/api/reservations/me` | Member | Query: status | Own reservations | Member records only. |
| PATCH | `/api/reservations/{reservationId}/cancel` | Member | Optional reason | Cancelled reservation | Own reservation only. |
| GET | `/api/reservations` | Librarian/Admin | Query: bookId, memberId, status | Reservation list | Protected endpoint. |
| PATCH | `/api/reservations/{reservationId}/process` | Librarian/Admin | Optional copyId | Processed reservation | Used for queue processing/manual hold. |
| POST | `/api/reservations/process-queue` | Librarian/Admin/System | `{ bookId?: number, copyId?: number }` | Selected reservation or none | Optional if queue runs manually. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE08-SEC-001: Reservation endpoints must require authentication except public browsing dependencies.
- NFR-FE08-SEC-002: Members must not view or cancel other members' reservations.
- NFR-FE08-SEC-003: Librarian/admin permissions must be checked on the server.

### 12.2 Transaction Integrity

- NFR-FE08-TXN-001: Queue processing must update reservation/copy state atomically.
- NFR-FE08-TXN-002: Cancellation must not leave the reserved copy in an inconsistent state.

### 12.3 Performance

- NFR-FE08-PERF-001: Reservation list should support pagination/filtering.
- NFR-FE08-PERF-002: Queue lookup should use reservation target and status filters.

### 12.4 Logging and Audit

- NFR-FE08-LOG-001: Create, cancel, queue process, notify, fulfilled, and expired actions should be traceable.

### 12.5 Usability

- NFR-FE08-UX-001: The system should show clear reservation status to members.
- NFR-FE08-UX-002: Librarians should see queue order clearly.

---

## 13. Out of Scope

This feature does not include:

- FE07 borrow approval or return implementation.
- FE10 notification delivery implementation.
- Fine calculation.
- Online payment.
- Study seat reservation.
- Complex priority rules unless approved by the team.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE02 Authentication | Internal | Identifies actor. |
| FE04 Membership Management | Internal | Confirms member eligibility. |
| FE06 Inventory / Book Copy Management | Internal | Provides copy availability/status. |
| FE07 Borrowing Management | Internal | Return flow may release copy into reservation queue. Checked on 2026-06-10: active reservation/held copy for another member blocks FE07 renewal. |
| FE10 Notification Management | Internal | Sends book available notification. |
| FE11 User & Role Management | Internal | Provides roles and permissions. |
| SQL Server database | Technical | Current SQL script has `Reservations(UserId, CopyId, ReservedAt, Status)`. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE08-001 | Reservation targets physical copy CopyId in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE08-002 | Member cannot reserve when a copy is currently available. | Review packet 2026-06-10 | APPROVED |
| Q-FE08-003 | Maximum 3 active reservations per member. | Review packet 2026-06-10 | APPROVED |
| Q-FE08-004 | Notified reservation stays valid for 2 calendar days. | Review packet 2026-06-10 | APPROVED |
| Q-FE08-005 | Queue processing is manual by librarian in Phase 1; automatic trigger is future work. | Review packet 2026-06-10 | APPROVED |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE08-005 | UC36 | FT37 | Ready for review |
| BR-FE08-006 | UC36 | FT37 | Ready for review |
| BR-FE08-008 | UC39 | FT40 | Ready for review |
| BR-FE08-009 | UC37, UC39 | FT38, FT40 | Ready for review |
| BR-FE08-014 | UC39 | FT40 | Ready for review |
| FR-FE08-004 | UC37 | FT38 | Ready for review |
| FR-FE08-005 | UC38 | FT39 | Ready for review |
| FR-FE08-008 | UC40 | FT41 | Ready for review |

---

## 17. Review Checklist

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Reservation target is confirmed: book-level or copy-level.
- [x] Maximum active reservations is approved.
- [x] Reservation expiry/hold period is approved.
- [x] Queue processing behavior is approved.
- [x] API contract is approved in this SPEC.md or copied to a dedicated shared API contract file if the team reintroduces one.
- [x] FE07 dependency is checked, especially return and renewal behavior.
- [x] Every acceptance criterion can become a test.
