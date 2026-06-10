# SPEC.md - FE07 Borrowing Management

# Version: 0.1.0

# Status: APPROVED

# Owner: Nhat

# Last Updated: 2026-06-10

# Feature ID: FE07

# Feature folder: `.sdd/specs/feat-borrowing-management/`

> Source of truth for FE07 Borrowing Management. This spec is approved for Phase 2 planning. It is intentionally detailed because FE07 is a core business feature.

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
- PRE-FE07-005: Loan policy values are approved: maximum active borrowed copies is 5, default loan duration is 14 calendar days, and renewal limit is 1 renewal per borrowed copy.

---

## 4. Main Flows

### MF-FE07-001: Create Borrow Request

1. Member searches or browses books.
2. Member selects one or more available book copies to borrow.
3. The system validates member eligibility.
4. The system validates borrow limit and copy availability.
5. The system creates a `BorrowRequests` record with status `PENDING`.
6. The system creates related `BorrowDetails` records for requested copies with status `REQUESTED`.
7. The system shows the request result to the member.

### MF-FE07-002: Approve And Process Borrow Request

1. Librarian opens pending borrow requests.
2. Librarian reviews member information, requested copies, and eligibility warnings.
3. Librarian approves the request.
4. The system revalidates member eligibility and copy availability.
5. The system sets `BorrowRequests.Status` to `APPROVED`.
6. The system sets each approved `BorrowDetails.Status` to `BORROWED`.
7. The system assigns due date for each borrowed copy as approval date plus 14 calendar days.
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
7. The system detects overdue, damaged, or lost return data and exposes it for FE09 Fine Management.
8. If all details in the request are `RETURNED`, `DAMAGED`, or `LOST`, the system sets `BorrowRequests.Status` to `COMPLETED`.
9. The system writes an audit log entry.

### MF-FE07-005: Renew Borrowed Books

1. Member or librarian opens active borrowed items.
2. Actor selects a borrowed copy to renew.
3. The system checks renewal eligibility: not overdue, no unpaid fine, renewal count is 0, and no active reservation conflict from FE08.
4. The system extends due date by 14 calendar days from the current due date.
5. The system sets renewal count to 1.
6. The system writes an audit log entry and shows the new due date.

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
- BR-FE07-005: A member cannot have more than 5 active borrowed copies at the same time.
- BR-FE07-006: A member with overdue active loans or any unpaid fine with amount greater than 0 cannot create a new borrow request or renew an existing borrowed copy.
- BR-FE07-007: A copy can be borrowed only when `BookCopies.Status = AVAILABLE`.
- BR-FE07-008: Approval must recheck copy availability and member eligibility.
- BR-FE07-009: When a borrow request is approved, each borrowed copy status must change to `BORROWED`.
- BR-FE07-010: Every borrowed copy must have a due date; the default due date is 14 calendar days from the borrow approval date.
- BR-FE07-011: Every return must store a return date.
- BR-FE07-012: A returned normal copy must become `AVAILABLE`.
- BR-FE07-013: A lost or damaged copy must not become available automatically.
- BR-FE07-014: Overdue return must be detectable and traceable for FE09 Fine Management.
- BR-FE07-015: Each borrow detail may be renewed at most 1 time; a valid renewal extends the due date by 14 calendar days from the current due date.
- BR-FE07-016: Every create/approve/reject/return/renew action must be auditable.
- BR-FE07-017: Borrowing history must be read-only for members.
- BR-FE07-018: Renewal must not be allowed when the item is overdue, the member has an unpaid fine, the renewal limit has been reached, or the item is reserved by another member.
- BR-FE07-019: Pending borrow request items must be stored in `BorrowDetails` with status `REQUESTED`; no separate request-detail table is used in Phase 1.
- BR-FE07-020: When all details in a borrow request reach a terminal status (`RETURNED`, `LOST`, or `DAMAGED`), the request status must become `COMPLETED`.
- BR-FE07-021: FE07 must not calculate or create fine records for overdue, damaged, or lost returns; it only exposes return data for FE09 Fine Management.

---

## 7. Functional Requirements

- FR-FE07-001: When a member submits a borrow request, the system shall validate member eligibility before creating the request.
- FR-FE07-002: When a member submits a borrow request with valid data, the system shall create a pending borrow request and store requested items as `BorrowDetails.Status = REQUESTED`.
- FR-FE07-003: If a requested copy is not available, the system shall reject that copy from the borrow request.
- FR-FE07-004: When a librarian approves a borrow request, the system shall revalidate all business rules before approval.
- FR-FE07-005: When approval succeeds, the system shall update the borrow request, borrow details, due dates, and book copy statuses.
- FR-FE07-006: When a librarian rejects a borrow request, the system shall keep copy statuses unchanged and store rejection information if supported.
- FR-FE07-007: When a librarian processes a return, the system shall update return date, detail status, and copy status.
- FR-FE07-008: If the return is overdue, damaged, or lost, the system shall expose enough data for FE09 to calculate or create the related fine.
- FR-FE07-009: When renewal is requested, the system shall allow at most 1 renewal per borrow detail and extend the due date by 14 calendar days only when all renewal rules pass.
- FR-FE07-010: When a member views borrowing history, the system shall return only that member's records.
- FR-FE07-011: When a librarian/admin views member borrowing information, the system shall allow searching by member identity.
- FR-FE07-012: While a borrow detail is `BORROWED`, the related copy shall not be available for another borrow approval.
- FR-FE07-013: When all details in a borrow request are `RETURNED`, `LOST`, or `DAMAGED`, the system shall update the request status to `COMPLETED`.

---

## 8. Acceptance Criteria

- AC-FE07-001: Given an eligible member and available copy, when the member creates a borrow request, then the system creates a `PENDING` borrow request with requested details marked `REQUESTED`.
- AC-FE07-002: Given an inactive member, when the member creates a borrow request, then the system rejects the request.
- AC-FE07-003: Given a member exceeding the borrow limit, when the member creates a borrow request, then the system rejects the request.
- AC-FE07-004: Given a pending request and available copies, when a librarian approves it, then the system marks the request `APPROVED`, marks details `BORROWED`, sets due dates, and marks copies `BORROWED`.
- AC-FE07-005: Given a pending request whose copy is no longer available, when a librarian approves it, then the system rejects approval and keeps data unchanged.
- AC-FE07-006: Given a borrowed copy, when the librarian processes a normal return, then the system stores return date and marks the copy `AVAILABLE`.
- AC-FE07-007: Given a borrowed copy returned damaged, when the librarian processes the return, then the system marks the copy `DAMAGED` and does not make it available.
- AC-FE07-008: Given an overdue borrowed copy, when it is returned, then the system exposes overdue data for fine calculation.
- AC-FE07-009: Given a borrowed copy with no previous renewal and no blocking condition, when renewal succeeds, then the due date is extended by 14 calendar days and renewal count becomes 1.
- AC-FE07-010: Given a borrowed copy that is overdue, already renewed, blocked by unpaid fine, or reserved by another member, when renewal is requested, then the due date remains unchanged and the system returns a reason.
- AC-FE07-011: Given a logged-in member, when viewing borrowing history, then only that member's borrowing records are returned.
- AC-FE07-012: Given a librarian/admin, when viewing member borrowing information, then the system can return records for the selected member.
- AC-FE07-013: Given all details in a borrow request are `RETURNED`, `LOST`, or `DAMAGED`, when the return processing finishes, then the request status becomes `COMPLETED`.
- AC-FE07-014: Given a damaged or lost return, when FE07 records it, then FE07 does not create a fine record and FE09 can later calculate or create the fine from the recorded data.

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
| dueDate | date | Yes when approved | Defaults to borrow approval date plus 14 calendar days. |
| returnDate | date | No | Required when detail is returned/lost/damaged. |
| renewalCount | integer | Yes for renewal support | Defaults to 0; maximum 1 per `BorrowDetail`. Current SQL needs this column or an equivalent persistent field before implementation. |
| requestStatus | string | Yes | Proposed values: `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, `CANCELLED`. |
| detailStatus | string | Yes | Proposed values: `REQUESTED`, `BORROWED`, `RETURNED`, `LOST`, `DAMAGED`, `OVERDUE`. |
| copyStatus | string | Yes | Existing values include `AVAILABLE`, `BORROWED`, `RESERVED`; add `LOST`, `DAMAGED` if approved. |
| actionReason | string | No | Required for reject/lost/damaged when supported. |

---

## 11. API / Interface Contract

> API contract approved for FE07 Phase 1. Final contract stays in this SPEC.md unless the team reintroduces a dedicated shared API contract document.

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
| FE08 Reservation Management | Internal | Checked on 2026-06-10: active reservation/held copy for another member blocks renewal. FE08 owns reservation queue and held-copy state. |
| FE09 Fine Management | Internal | Checked on 2026-06-10: any unpaid fine with amount greater than 0 blocks new borrowing and renewal. FE09 owns fine calculation/creation from FE07 return data. |
| FE10 Notification Management | Internal | May notify borrow/return/renewal results. |
| FE11 User & Role Management | Internal | Provides roles and permissions. |
| SQL Server database | Technical | Current SQL script has `BorrowRequests`, `BorrowDetails`, and `BookCopies`. |

---

## 15. Resolved Questions

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE07-001 | What is the maximum number of active borrowed copies per member? | Team/Teacher | Resolved: 5 active borrowed copies per member (DEC-GEN-001). |
| Q-FE07-002 | What is the default loan duration in days? | Team/Teacher | Resolved: 14 calendar days from borrow approval date (DEC-GEN-002). |
| Q-FE07-003 | How many renewals are allowed per borrow detail? | Team/Teacher | Resolved: 1 renewal per `BorrowDetail`, adding 14 calendar days from current due date. |
| Q-FE07-004 | Does unpaid fine block new borrowing? If yes, what fine statuses/amounts block it? | Team/Teacher | Resolved: any `UNPAID` fine with amount greater than 0 blocks new borrowing and renewal. |
| Q-FE07-005 | Can a member create borrow request directly, or must librarian create it at the desk? | Team/Teacher | Resolved: member creates own borrow request; librarian/admin approves, rejects, returns, renews, and views history. |
| Q-FE07-006 | Should `BorrowDetails` support `REQUESTED`, or should requested copies be stored in another table before approval? | Team/DB owner | Resolved: use `BorrowDetails.Status = REQUESTED`; no extra request-detail table in Phase 1. |
| Q-FE07-007 | Should request status become `COMPLETED` automatically when all details are returned/lost/damaged? | Team | Resolved: yes, mark `BorrowRequests.Status = COMPLETED` when all details are terminal. |
| Q-FE07-008 | Should damaged/lost returns immediately create a fine record, or only expose data for FE09? | Team/Teacher | Resolved: FE07 records damaged/lost return data only; FE09 owns fine creation. |

---

## 15.1 Approval Review Notes

| Review Item | Result |
| ----------- | ------ |
| Flow review | Create request, approve/reject, return, renewal, and history flows were reviewed against resolved FE07 decisions. Flow updates are reflected in Sections 4, 6, 7, and 8. |
| API contract | Approved in Section 11 for Phase 1 RESTful API planning. Endpoints stay in this SPEC.md unless a shared API contract document is reintroduced. |
| FE08 dependency | No FE07 conflict after decision: active reservation/held copy for another member blocks renewal. FE08 must expose reservation conflict state to FE07. |
| FE09 dependency | No FE07 conflict after decision: unpaid fines block borrowing/renewal; FE07 exposes return data and FE09 owns fine calculation/creation. |
| Testability | AC-FE07-001 to AC-FE07-014 are concrete, observable, and mapped to assigned FE07 test cases through the traceability matrix. |

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
| BR-FE07-018 | UC31 | FT32 | Not Started |
| BR-FE07-019 | UC29 | FT30 | Not Started |
| BR-FE07-020 | UC33 | FT34 | Not Started |
| BR-FE07-021 | UC33 | FT34 | Not Started |
| FR-FE07-010 | UC30 | FT31 | Not Started |
| FR-FE07-011 | UC34 | FT35 | Not Started |
| FR-FE07-013 | UC33 | FT34 | Not Started |

---

## 17. Review Checklist

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Resolved questions Q-FE07-001 to Q-FE07-008 are recorded in Section 15 with approved decisions.
- [x] Borrow limit and loan duration are approved.
- [x] Database design for requested copies before approval is confirmed.
- [x] Return, renewal, and borrowing history flows are reviewed by the team.
- [x] API contract is approved in this SPEC.md or copied to a dedicated shared API contract file if the team reintroduces one.
- [x] FE08/FE09 dependencies are checked for conflicts.
- [x] Every acceptance criterion can become a test.
