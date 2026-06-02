# SPEC.md - FE07 Borrowing Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Nhat

# Last Updated: 2026-06-02

# Feature ID: FE07

# Feature folder: `.sdd/specs/feat-borrowing-management/`

> Source of truth for FE07 Borrowing Management. This spec is a draft and must be reviewed before implementation. It is intentionally detailed because FE07 is a core business feature.

---

## 1. Feature Overview

### 1.1 Feature Name

Borrowing Management

### 1.2 Business Context

Borrowing Management controls the main circulation workflow of the library: members request to borrow books, librarians approve and process the request, borrowed copies are returned, loans may be renewed, and borrowing history is kept for later reports and fine calculation.

This feature is core because wrong borrowing data can break inventory, fines, reservation, reports, and audit history.

### 1.3 Goal / Outcome

The system shall:

- Allow eligible members to create borrow requests.
- Allow librarians/admins to approve or reject borrow requests.
- Record borrowed book copies with due dates and statuses.
- Process returned book copies and update inventory accurately.
- Allow renewals when policy allows.
- Provide borrowing history for members and librarians.
- Keep every borrow/return action traceable for audit and reporting.

### 1.4 Scope Level

- [x] Full Spec - core business logic, high risk, must be correct from the beginning
- [ ] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor     | Description                  | Permission / Responsibility |
| --------- | ---------------------------- | --------------------------- |
| Member    | Registered library user      | Create borrow request, view own borrowing history, request renewal if allowed. |
| Librarian | Library staff                | View member borrowing information, approve/reject borrow requests, process borrow handover, process returns. |
| Admin     | System administrator         | Has librarian permissions and can view all borrowing records. |
| Guest     | Unauthenticated visitor      | No borrowing permissions. |
| Notification Service | External service | May receive notification requests when borrow/return/renewal result changes. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE07-001: The user account exists and has an active status.
- PRE-FE07-002: The member has an approved membership status before borrowing.
- PRE-FE07-003: The requested book copy exists in `BookCopies`.
- PRE-FE07-004: Protected actions are performed by an authenticated actor with the correct role.
- PRE-FE07-005: Loan policy values are configured or approved by the team: maximum active borrowed copies, default loan days, and renewal limit.

---

## 4. Main Flows

### MF-FE07-001: Create Borrow Request

1. Member searches or browses books.
2. Member selects one or more available book copies/books to borrow.
3. The system validates member eligibility.
4. The system validates borrow limit and copy availability.
5. The system creates a `BorrowRequests` record with status `PENDING`.
6. The system creates related `BorrowDetails` records for requested copies, or stores equivalent request detail records if the database is revised.
7. The system shows the request result to the member.

### MF-FE07-002: Approve And Process Borrow Request

1. Librarian opens pending borrow requests.
2. Librarian reviews member information, requested copies, and eligibility warnings.
3. Librarian approves the request.
4. The system revalidates member eligibility and copy availability.
5. The system sets `BorrowRequests.Status` to `APPROVED`.
6. The system sets each approved `BorrowDetails.Status` to `BORROWED`.
7. The system assigns due date for each borrowed copy.
8. The system updates each related `BookCopies.Status` to `BORROWED`.
9. The system writes an audit log entry.

### MF-FE07-003: Reject Borrow Request

1. Librarian opens a pending borrow request.
2. Librarian enters a rejection reason.
3. The system sets `BorrowRequests.Status` to `REJECTED`.
4. The system keeps all related book copies available.
5. The system writes an audit log entry.

### MF-FE07-004: Process Return Request

1. Librarian searches for the member or borrow request.
2. Librarian selects the borrowed copy being returned.
3. Librarian confirms return condition: normal, damaged, or lost.
4. The system sets `BorrowDetails.ReturnDate` to the return date.
5. The system updates `BorrowDetails.Status` to `RETURNED`, `DAMAGED`, or `LOST`.
6. The system updates `BookCopies.Status` to `AVAILABLE`, `DAMAGED`, or `LOST`.
7. The system detects overdue return and triggers fine calculation requirements for FE09.
8. The system writes an audit log entry.

### MF-FE07-005: Renew Borrowed Books

1. Member or librarian opens active borrowed items.
2. Actor selects a borrowed copy to renew.
3. The system checks renewal eligibility.
4. The system extends due date according to loan policy.
5. The system writes an audit log entry and shows the new due date.

### MF-FE07-006: View Borrowing History

1. Member opens own borrowing history, or librarian/admin opens a member's borrowing information.
2. The system returns current and past borrowing records.
3. The system supports filtering by status and date range when available.

---

## 5. Alternative Flows

### AF-FE07-001: Member Is Not Eligible

1. The system detects inactive membership, unpaid blocking fine, overdue active loan, or exceeded borrow limit.
2. The system rejects the request or approval action.
3. The system returns a clear error message explaining the blocking reason.

### AF-FE07-002: Copy Becomes Unavailable Before Approval

1. Member creates a borrow request while the copy appears available.
2. Before librarian approval, another process changes the copy status.
3. The system revalidates availability during approval.
4. The system rejects the unavailable copy and asks the librarian to update the request.

### AF-FE07-003: Partial Return

1. A borrow request contains multiple borrowed copies.
2. Member returns only some copies.
3. The system updates only returned `BorrowDetails`.
4. The remaining details stay `BORROWED` until returned, lost, or damaged.

### AF-FE07-004: Renewal Not Allowed

1. Actor requests renewal.
2. The system detects a blocking condition: overdue item, unpaid blocking fine, renewal limit reached, or active reservation by another member.
3. The system rejects renewal and keeps the due date unchanged.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE07-001: A guest cannot create, approve, process, or view protected borrowing records.
- BR-FE07-002: A member can create borrow requests only for their own account.
- BR-FE07-003: A librarian/admin can view and process borrow requests for any member.
- BR-FE07-004: A member must have active account status and approved membership status before borrowing.
- BR-FE07-005: A member cannot borrow more active copies than the configured borrow limit.
- BR-FE07-006: A member with overdue active loans or unpaid blocking fines may be restricted from borrowing.
- BR-FE07-007: A copy can be borrowed only when `BookCopies.Status = AVAILABLE`.
- BR-FE07-008: Approval must recheck copy availability and member eligibility.
- BR-FE07-009: When a borrow request is approved, each borrowed copy status must change to `BORROWED`.
- BR-FE07-010: Every borrowed copy must have a due date.
- BR-FE07-011: Every return must store a return date.
- BR-FE07-012: A returned normal copy must become `AVAILABLE`.
- BR-FE07-013: A lost or damaged copy must not become available automatically.
- BR-FE07-014: Overdue return must be detectable and traceable for FE09 Fine Management.
- BR-FE07-015: Renewal must not be allowed when the item is overdue, blocked by policy, or reserved by another member.
- BR-FE07-016: Every create/approve/reject/return/renew action must be auditable.
- BR-FE07-017: Borrowing history must be read-only for members.

---

## 7. Functional Requirements

- FR-FE07-001: When a member submits a borrow request, the system shall validate member eligibility before creating the request.
- FR-FE07-002: When a member submits a borrow request with valid data, the system shall create a pending borrow request.
- FR-FE07-003: If a requested copy is not available, the system shall reject that copy from the borrow request.
- FR-FE07-004: When a librarian approves a borrow request, the system shall revalidate all business rules before approval.
- FR-FE07-005: When approval succeeds, the system shall update the borrow request, borrow details, due dates, and book copy statuses.
- FR-FE07-006: When a librarian rejects a borrow request, the system shall keep copy statuses unchanged and store rejection information if supported.
- FR-FE07-007: When a librarian processes a return, the system shall update return date, detail status, and copy status.
- FR-FE07-008: If the return is overdue, the system shall mark or expose enough data for FE09 to calculate fine.
- FR-FE07-009: When renewal is requested, the system shall validate renewal policy before changing due date.
- FR-FE07-010: When a member views borrowing history, the system shall return only that member's records.
- FR-FE07-011: When a librarian/admin views member borrowing information, the system shall allow searching by member identity.
- FR-FE07-012: While a borrow detail is `BORROWED`, the related copy shall not be available for another borrow approval.

---

## 8. Acceptance Criteria

- AC-FE07-001: Given an eligible member and available copy, when the member creates a borrow request, then the system creates a `PENDING` borrow request.
- AC-FE07-002: Given an inactive member, when the member creates a borrow request, then the system rejects the request.
- AC-FE07-003: Given a member exceeding the borrow limit, when the member creates a borrow request, then the system rejects the request.
- AC-FE07-004: Given a pending request and available copies, when a librarian approves it, then the system marks the request `APPROVED`, marks details `BORROWED`, sets due dates, and marks copies `BORROWED`.
- AC-FE07-005: Given a pending request whose copy is no longer available, when a librarian approves it, then the system rejects approval and keeps data unchanged.
- AC-FE07-006: Given a borrowed copy, when the librarian processes a normal return, then the system stores return date and marks the copy `AVAILABLE`.
- AC-FE07-007: Given a borrowed copy returned damaged, when the librarian processes the return, then the system marks the copy `DAMAGED` and does not make it available.
- AC-FE07-008: Given an overdue borrowed copy, when it is returned, then the system exposes overdue data for fine calculation.
- AC-FE07-009: Given a borrowed copy eligible for renewal, when renewal succeeds, then the due date is extended.
- AC-FE07-010: Given a borrowed copy not eligible for renewal, when renewal is requested, then the due date remains unchanged and the system returns a reason.
- AC-FE07-011: Given a logged-in member, when viewing borrowing history, then only that member's borrowing records are returned.
- AC-FE07-012: Given a librarian/admin, when viewing member borrowing information, then the system can return records for the selected member.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE07-001 | Member ID does not exist | Return not found error. |
| EC-FE07-002 | Member account inactive | Reject borrow/renewal action. |
| EC-FE07-003 | Membership not approved | Reject borrow request. |
| EC-FE07-004 | Copy ID does not exist | Reject request item. |
| EC-FE07-005 | Copy status is not `AVAILABLE` during approval | Reject approval for that copy. |
| EC-FE07-006 | Duplicate copy in the same borrow request | Reject duplicate item. |
| EC-FE07-007 | Borrow request has zero valid items | Reject request. |
| EC-FE07-008 | Return action on already returned item | Reject as invalid state transition. |
| EC-FE07-009 | Return date before borrow/request date | Reject invalid date. |
| EC-FE07-010 | Renewal requested after item is already returned | Reject renewal. |
| EC-FE07-011 | Concurrent approval of same copy | Only one approval may succeed; later action must fail safely. |
| EC-FE07-012 | Database update partially fails | Roll back the whole transaction. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Stores member, librarian, and admin accounts. |
| UserRoles | Checks actor permission. |
| MembershipApplications | Confirms member eligibility when applicable. |
| Books | Provides book-level display information. |
| BookCopies | Tracks physical copy status and location. |
| BorrowRequests | Stores borrow request header and workflow status. |
| BorrowDetails | Stores copy-level due date, return date, and borrow status. |
| Fines | Read to block borrowing if unpaid fines are configured as blocking. |
| Reservations | Read to block renewal if another member has reservation priority. |
| AuditLogs | Records important borrowing actions. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| requestId | integer | Yes for updates | Must exist in `BorrowRequests`. |
| userId | integer | Yes | Must reference a member user. |
| copyId | integer | Yes | Must reference `BookCopies`. |
| requestDate | datetime | Yes | Defaults to current server time. |
| dueDate | date | Yes when approved | Calculated from loan policy. |
| returnDate | date | No | Required when detail is returned/lost/damaged. |
| requestStatus | string | Yes | Proposed values: `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, `CANCELLED`. |
| detailStatus | string | Yes | Proposed values: `REQUESTED`, `BORROWED`, `RETURNED`, `LOST`, `DAMAGED`, `OVERDUE`. |
| copyStatus | string | Yes | Existing values include `AVAILABLE`, `BORROWED`, `RESERVED`; add `LOST`, `DAMAGED` if approved. |
| actionReason | string | No | Required for reject/lost/damaged when supported. |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract must be copied into `docs/api/api-contract.md` before implementation.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| POST | `/api/borrow-requests` | Member | `{ copyIds: number[] }` | Created borrow request | Creates pending request. |
| GET | `/api/borrow-requests/me` | Member | Query: status, date range | Own borrowing history | Member can see own records only. |
| GET | `/api/borrow-requests` | Librarian/Admin | Query: status, memberId | Borrow request list | Protected endpoint. |
| GET | `/api/members/{memberId}/borrowings` | Librarian/Admin | Query: status, date range | Member borrowing records | For UC34. |
| PATCH | `/api/borrow-requests/{requestId}/approve` | Librarian/Admin | Optional notes | Approved request | Transactional update. |
| PATCH | `/api/borrow-requests/{requestId}/reject` | Librarian/Admin | `{ reason: string }` | Rejected request | Reason recommended. |
| PATCH | `/api/borrow-details/{borrowDetailId}/return` | Librarian/Admin | `{ condition: "NORMAL"|"DAMAGED"|"LOST", notes?: string }` | Updated borrow detail | May trigger fine data. |
| PATCH | `/api/borrow-details/{borrowDetailId}/renew` | Member/Librarian/Admin | Optional notes | Updated due date | Must validate renewal rules. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE07-SEC-001: All protected endpoints must require authentication.
- NFR-FE07-SEC-002: Role-based access must be enforced on the server.
- NFR-FE07-SEC-003: A member must not access another member's borrowing history.
- NFR-FE07-SEC-004: All request IDs, copy IDs, status values, and dates must be validated on the server.

### 12.2 Transaction Integrity

- NFR-FE07-TXN-001: Approving borrow request must be atomic: request status, detail status, due date, copy status, and audit log must succeed together or roll back together.
- NFR-FE07-TXN-002: Returning a copy must be atomic: detail status, return date, copy status, and audit log must succeed together or roll back together.

### 12.3 Performance

- NFR-FE07-PERF-001: Borrowing history should support pagination.
- NFR-FE07-PERF-002: Lookup by member and status should not require scanning all records once data grows.

### 12.4 Logging and Audit

- NFR-FE07-LOG-001: Create, approve, reject, return, damaged, lost, and renewal actions must write audit log entries.

### 12.5 Usability

- NFR-FE07-UX-001: Validation errors must explain the reason: inactive member, borrow limit, unavailable copy, unpaid fine, overdue loan, or invalid state.

---

## 13. Out of Scope

This feature does not include:

- FE08 Reservation Management except reading reservation data when renewal priority must be checked.
- FE09 Fine calculation implementation, although this feature exposes overdue/return data for FE09.
- FE10 Notification delivery implementation.
- Real online payment gateway.
- RFID/QR hardware integration.
- Study seat reservation.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE02 Authentication | Internal | Required for actor identity. |
| FE04 Membership Management | Internal | Determines membership approval/status. |
| FE06 Inventory / Book Copy Management | Internal | Provides copy availability and status updates. |
| FE08 Reservation Management | Internal | May block renewal when another member has reservation priority. |
| FE09 Fine Management | Internal | Uses overdue and return data; unpaid fines may block borrowing. |
| FE10 Notification Management | Internal | May notify borrow/return/renewal results. |
| FE11 User & Role Management | Internal | Provides roles and permissions. |
| SQL Server database | Technical | Current SQL script has `BorrowRequests`, `BorrowDetails`, and `BookCopies`. |

---

## 15. Open Questions

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE07-001 | What is the maximum number of active borrowed copies per member? | Team/Teacher | Open |
| Q-FE07-002 | What is the default loan duration in days? | Team/Teacher | Open |
| Q-FE07-003 | How many renewals are allowed per borrow detail? | Team/Teacher | Open |
| Q-FE07-004 | Does unpaid fine block new borrowing? If yes, what fine statuses/amounts block it? | Team/Teacher | Open |
| Q-FE07-005 | Can a member create borrow request directly, or must librarian create it at the desk? | Team/Teacher | Open |
| Q-FE07-006 | Should `BorrowDetails` support `REQUESTED`, or should requested copies be stored in another table before approval? | Team/DB owner | Open |
| Q-FE07-007 | Should request status become `COMPLETED` automatically when all details are returned/lost/damaged? | Team | Open |
| Q-FE07-008 | Should damaged/lost returns immediately create a fine record, or only expose data for FE09? | Team/Teacher | Open |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE07-004 | UC29, UC32 | FT30, FT33 | Not Started |
| BR-FE07-005 | UC29, UC32 | FT30, FT33 | Not Started |
| BR-FE07-007 | UC29, UC32 | FT30, FT33 | Not Started |
| BR-FE07-009 | UC32, UC35 | FT33, FT36 | Not Started |
| BR-FE07-011 | UC33 | FT34 | Not Started |
| BR-FE07-014 | UC33 | FT34 | Not Started |
| BR-FE07-015 | UC31 | FT32 | Not Started |
| FR-FE07-010 | UC30 | FT31 | Not Started |
| FR-FE07-011 | UC34 | FT35 | Not Started |

---

## 17. Review Checklist

Before this SPEC.md is approved:

- [ ] Open questions Q-FE07-001 to Q-FE07-008 are resolved or explicitly accepted as TBD.
- [ ] Borrow limit and loan duration are approved.
- [ ] Database design for requested copies before approval is confirmed.
- [ ] Return, renewal, and borrowing history flows are reviewed by the team.
- [ ] API contract is copied to `docs/api/api-contract.md`.
- [ ] FE08/FE09 dependencies are checked for conflicts.
- [ ] Every acceptance criterion can become a test.
