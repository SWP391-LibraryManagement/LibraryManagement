# SPEC.md - FE06 Inventory / Book Copy Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Long

# Last Updated: 2026-06-02

# Feature ID: FE06

# Feature folder: `.sdd/specs/feat-inventory-book-copy/`

> Source of truth for FE06 Inventory / Book Copy Management. This spec is a draft and must be reviewed before implementation. It is intentionally detailed because FE06 protects physical copy availability used by borrowing, reservation, fines, and reports.

---

## 1. Feature Overview

### 1.1 Feature Name

Inventory / Book Copy Management

### 1.2 Business Context

The library manages real physical copies of each book. A book title can have many copies, and each copy has its own barcode, shelf location, and status.

Inventory / Book Copy Management helps librarians know which copies are available, borrowed, reserved, damaged, lost, or otherwise unavailable. Accurate inventory data is required before the system can safely approve borrowing, process reservations, calculate fines, or generate inventory reports.

### 1.3 Goal / Outcome

The system shall:

- Allow librarians/admins to view the inventory of physical book copies.
- Allow librarians/admins to check the status of a specific book copy.
- Allow librarians/admins to add and update physical book copies for existing books.
- Allow librarians/admins to update copy availability/status with validation.
- Keep copy barcode unique and copy status traceable.
- Protect borrowing and reservation consistency when copy status changes.

### 1.4 Scope Level

- [x] Full Spec - core business logic, high risk, must be correct from the beginning
- [ ] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Librarian | Library staff | View inventory, check copy status, add/update book copies, update copy status when allowed. |
| Admin | System administrator | Has librarian permissions and can audit inventory changes. |
| Member | Registered library user | May indirectly see availability summary through browse/book details, but cannot manage copies. |
| Guest | Unauthenticated visitor | May indirectly see public availability summary if FE01/FE05 supports it, but cannot manage copies. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE06-001: The actor is authenticated for protected inventory management actions.
- PRE-FE06-002: The actor has `LIBRARIAN` or `ADMIN` role for copy management actions.
- PRE-FE06-003: The target book exists before a new copy is created.
- PRE-FE06-004: The target copy exists before checking or updating copy status.
- PRE-FE06-005: The approved copy status list and allowed status transitions are confirmed before implementation.

---

## 4. Main Flows

### MF-FE06-001: View Inventory

1. Librarian/admin opens the inventory screen.
2. The system returns book copy records with book title, barcode, status, and location.
3. The actor filters by book, barcode, status, location, or keyword when available.
4. The system shows inventory data without allowing unauthorized changes.

### MF-FE06-002: Check Book Copy Status

1. Librarian/admin searches or selects a specific copy.
2. The system validates that the copy exists.
3. The system returns copy status, barcode, location, book information, and related active borrow/reservation indicators when available.
4. The actor uses this information to decide whether the copy can be borrowed, reserved, repaired, or updated.

### MF-FE06-003: Update Book Copy Availability

1. Librarian/admin selects a book copy.
2. The actor chooses a new status or availability value.
3. The system validates the requested status value.
4. The system checks whether active borrowing or reservation records block the status change.
5. If allowed, the system updates `BookCopies.Status`.
6. The system writes an audit log entry.
7. The system shows the updated copy status.

### MF-FE06-004: Manage Book Copies

1. Librarian/admin opens a book's copy management screen.
2. The actor adds a new copy or edits an existing copy.
3. The system validates required fields, barcode uniqueness, target book, and status.
4. The system saves the copy record.
5. The system writes an audit log entry for create or update actions.

---

## 5. Alternative Flows

### AF-FE06-001: Copy Is Currently Borrowed

1. Librarian/admin attempts to manually mark a borrowed copy as available.
2. The system detects an active `BorrowDetails` record or `BookCopies.Status = BORROWED`.
3. The system rejects the manual availability update unless the change is part of an approved FE07 return flow.
4. The system explains that borrowed copies must be returned through Borrowing Management.

### AF-FE06-002: Copy Is Reserved

1. Librarian/admin attempts to manually make a reserved copy available.
2. The system detects an active reservation or `BookCopies.Status = RESERVED`.
3. The system rejects the manual availability update until reservation release behavior is approved in FE08.
4. The actor must process the reservation through FE08 if required.

### AF-FE06-003: Duplicate Barcode

1. Librarian/admin enters a barcode already used by another copy.
2. The system rejects the create/update action.
3. The system asks for a unique barcode.

### AF-FE06-004: Invalid Status Transition

1. Librarian/admin requests a status change that is not in the approved transition list.
2. The system rejects the request and keeps the current status unchanged.

---

## 6. Business Rules

- BR-FE06-001: A guest cannot manage inventory or physical book copies.
- BR-FE06-002: A member cannot add, update, or change status of book copies.
- BR-FE06-003: Only librarian/admin can manage physical book copies.
- BR-FE06-004: Every book copy must belong to an existing `Books` record.
- BR-FE06-005: Every book copy must have a unique barcode.
- BR-FE06-006: Every book copy must have a valid status from the approved copy status list.
- BR-FE06-007: A copy with status `AVAILABLE` may be considered borrowable by FE07 if other borrowing rules pass.
- BR-FE06-008: A copy with status `BORROWED` must not be manually marked `AVAILABLE` outside the FE07 return flow.
- BR-FE06-009: A copy with status `RESERVED` must not be borrowed by another member unless FE08 releases or fulfills the reservation.
- BR-FE06-010: A copy with any approved unavailable status must not be treated as borrowable. Candidate unavailable statuses such as `DAMAGED`, `LOST`, or `INACTIVE` require team approval before implementation.
- BR-FE06-011: Copy status updates must not break active borrow or reservation records.
- BR-FE06-012: Important copy create/update/status-change actions must be auditable.
- BR-FE06-013: Physical copies with transaction history must not be hard deleted unless the team explicitly approves a different archival rule.

---

## 7. Functional Requirements

- FR-FE06-001: When a librarian/admin views inventory, the system shall return book copy records with book and copy information.
- FR-FE06-002: When inventory is viewed, the system shall support filtering by status, book, barcode, or location when available.
- FR-FE06-003: When a librarian/admin checks a copy, the system shall return the current copy status and basic book information.
- FR-FE06-004: When a librarian/admin creates a copy, the system shall validate target book, barcode, status, and location when location is provided or required by policy before saving.
- FR-FE06-005: If the barcode already exists, the system shall reject the create/update request.
- FR-FE06-006: When a librarian/admin updates copy metadata, the system shall preserve the copy identity and related history.
- FR-FE06-007: When a librarian/admin updates copy status, the system shall validate allowed status values and blocked transitions.
- FR-FE06-008: If a copy has active borrowing or reservation dependency, the system shall reject unsafe manual status changes.
- FR-FE06-009: When a copy create/update/status-change succeeds, the system shall write an audit log entry.
- FR-FE06-010: When unauthorized actors attempt copy management, the system shall deny the action.

---

## 8. Acceptance Criteria

- AC-FE06-001: Given a librarian/admin, when viewing inventory, then the system returns copy records with barcode, status, location, and book information.
- AC-FE06-002: Given a librarian/admin and an existing copy, when checking copy status, then the system returns the current status.
- AC-FE06-003: Given a non-existing copy ID/barcode, when checking copy status, then the system returns a not found error.
- AC-FE06-004: Given a valid existing book and unique barcode, when a librarian/admin creates a copy, then the system stores the new `BookCopies` record.
- AC-FE06-005: Given a duplicate barcode, when creating or updating a copy, then the system rejects the action.
- AC-FE06-006: Given a valid copy and allowed status transition, when a librarian/admin updates availability, then the system updates `BookCopies.Status`.
- AC-FE06-007: Given a borrowed copy, when a librarian/admin manually marks it available outside the return flow, then the system rejects the action.
- AC-FE06-008: Given a reserved copy, when a librarian/admin manually makes it generally available without reservation processing, then the system rejects the action until FE08 reservation release behavior is approved.
- AC-FE06-009: Given an unauthorized member/guest, when attempting to manage copies, then the system denies the action.
- AC-FE06-010: Given a successful copy create/update/status-change, when the action completes, then an audit log entry is recorded.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE06-001 | Book ID does not exist when creating a copy | Return not found error. |
| EC-FE06-002 | Copy ID or barcode does not exist | Return not found error. |
| EC-FE06-003 | Barcode is empty | Reject validation. |
| EC-FE06-004 | Barcode already exists | Reject duplicate barcode. |
| EC-FE06-005 | Status value is not approved | Reject validation. |
| EC-FE06-006 | Location is missing | Allow only if location is optional by team decision; otherwise reject. |
| EC-FE06-007 | Borrowed copy manually changed to available | Reject unsafe transition. |
| EC-FE06-008 | Reserved copy manually changed to available | Reject the action until FE08 reservation release behavior is approved. |
| EC-FE06-009 | Attempt to hard delete copy with borrow/reservation/fine history | Reject hard delete; use inactive/unavailable status if approved. |
| EC-FE06-010 | Concurrent status update on same copy | Only one update should succeed; later action must re-read current status. |
| EC-FE06-011 | Database update partially fails | Roll back the whole transaction. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Identifies librarian/admin actor. |
| UserRoles | Checks copy management permissions. |
| Books | Parent record for physical copies. |
| BookCopies | Stores barcode, status, and location of each physical copy. |
| BorrowDetails | Blocks unsafe status changes when a copy is actively borrowed. |
| Reservations | Blocks unsafe status changes when a copy is actively reserved. |
| Fines | May reference borrow/copy history when lost or damaged fines are supported. |
| AuditLogs | Records important inventory actions. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| copyId | integer | Yes for updates | Must exist in `BookCopies`. |
| bookId | integer | Yes | Must reference an existing `Books.BookId`. |
| barcode | string | Yes | Must be unique and not empty. |
| status | string | Yes | Current values include `AVAILABLE`, `BORROWED`, `RESERVED`; `DAMAGED`, `LOST`, `INACTIVE` require approval. |
| location | string | No/TBD | Current SQL allows null; team should decide if required. |
| actorUserId | integer | Yes for audit | Must identify the actor performing the change. |
| actionReason | string | No/TBD | Recommended for manual status changes such as damaged/lost/inactive. |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract must be copied into `docs/api/api-contract.md` before implementation.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/inventory` | Librarian/Admin | Query: bookId, barcode, status, location, page | Inventory list | Protected endpoint. |
| GET | `/api/book-copies/{copyId}` | Librarian/Admin | None | Copy detail/status | Used for UC26. |
| GET | `/api/book-copies` | Librarian/Admin | Query: barcode | Copy detail/status | Supports checking copy status by barcode. |
| POST | `/api/books/{bookId}/copies` | Librarian/Admin | `{ barcode, status?, location? }` | Created copy | Creates copy for existing book. |
| PATCH | `/api/book-copies/{copyId}` | Librarian/Admin | `{ barcode?, location? }` | Updated copy | Updates metadata only. |
| PATCH | `/api/book-copies/{copyId}/status` | Librarian/Admin | `{ status, reason? }` | Updated copy status | Must validate dependencies and transitions. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE06-SEC-001: Inventory management endpoints must require authentication.
- NFR-FE06-SEC-002: Only librarian/admin roles may create, update, or change status of book copies.
- NFR-FE06-SEC-003: All copy IDs, book IDs, barcode values, status values, and location values must be validated on the server.

### 12.2 Transaction Integrity

- NFR-FE06-TXN-001: Copy status updates must validate current copy state and dependent records before saving.
- NFR-FE06-TXN-002: Status update and audit log should succeed together or roll back together.

### 12.3 Performance

- NFR-FE06-PERF-001: Inventory list should support pagination.
- NFR-FE06-PERF-002: Lookup by barcode should not require scanning all records once data grows.

### 12.4 Logging and Audit

- NFR-FE06-LOG-001: Create copy, update copy metadata, and update copy status actions must write audit log entries.

### 12.5 Usability

- NFR-FE06-UX-001: Validation errors must explain the reason: duplicate barcode, missing book, invalid status, borrowed copy, reserved copy, or unauthorized actor.
- NFR-FE06-UX-002: Inventory screens should show status clearly enough for librarians to avoid selecting unavailable copies by mistake.

---

## 13. Out of Scope

This feature does not include:

- FE05 book metadata creation or editing.
- FE07 borrow approval, return processing, renewal, or borrowing history.
- FE08 reservation queue processing.
- FE09 fine calculation or fine payment.
- FE10 notification delivery.
- FE12 reporting dashboard.
- RFID/QR hardware integration.
- Complex multi-branch inventory management.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE02 Authentication | Internal | Required for actor identity. |
| FE05 Book Management | Internal | Provides parent `Books` records. |
| FE07 Borrowing Management | Internal | Uses and changes `BookCopies.Status` during borrow/return. |
| FE08 Reservation Management | Internal | Uses and changes reservation-related copy state. |
| FE09 Fine Management | Internal | May use lost/damaged copy outcomes if approved. |
| FE11 User & Role Management | Internal | Provides roles and permissions. |
| FE12 Reporting & Statistics | Internal | Reads inventory data. |
| SQL Server database | Technical | Current SQL script has `BookCopies(BookId, Barcode, Status, Location)`. |

---

## 15. Open Questions

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE06-001 | What is the approved list of `BookCopies.Status` values? Current SQL sample uses `AVAILABLE`, `BORROWED`, `RESERVED`. | Team/DB owner | Open |
| Q-FE06-002 | Should FE06 support `DAMAGED`, `LOST`, or `INACTIVE`? | Team/Teacher | Open |
| Q-FE06-003 | Which status transitions can be changed manually by librarian/admin, and which must be done only by FE07/FE08? | Team/Teacher | Open |
| Q-FE06-004 | Is `Location` required for every physical copy? | Team/Teacher | Open |
| Q-FE06-005 | Should hard delete of book copies be forbidden when the copy has history? | Team/Teacher | Open |
| Q-FE06-006 | Should barcode format follow a specific pattern, or only uniqueness is required? | Team | Open |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE06-003 | UC25, UC26, UC27, UC28 | FT26, FT27, FT28, FT29 | Not Started |
| BR-FE06-004 | UC28 | FT29 | Not Started |
| BR-FE06-005 | UC28 | FT29 | Not Started |
| BR-FE06-006 | UC27, UC28 | FT28, FT29 | Not Started |
| BR-FE06-008 | UC27 | FT28 | Not Started |
| BR-FE06-009 | UC27 | FT28 | Not Started |
| FR-FE06-001 | UC25 | FT26 | Not Started |
| FR-FE06-003 | UC26 | FT27 | Not Started |
| FR-FE06-007 | UC27 | FT28 | Not Started |
| FR-FE06-004 | UC28 | FT29 | Not Started |
| AC-FE06-001 | UC25 | FT26 | Not Started |
| AC-FE06-002 | UC26 | FT27 | Not Started |
| AC-FE06-006 | UC27 | FT28 | Not Started |
| AC-FE06-004 | UC28 | FT29 | Not Started |

---

## 17. Review Checklist

Before this SPEC.md is approved:

- [ ] Open questions Q-FE06-001 to Q-FE06-006 are resolved or explicitly accepted as TBD.
- [ ] Approved copy status list is confirmed.
- [ ] Allowed manual status transitions are confirmed.
- [ ] Barcode uniqueness and optional format rules are reviewed.
- [ ] Database design for copy audit fields or status history is confirmed if needed.
- [ ] API contract is copied to `docs/api/api-contract.md`.
- [ ] FE07 and FE08 dependencies are checked for copy status conflicts.
- [ ] Every acceptance criterion can become a test.
