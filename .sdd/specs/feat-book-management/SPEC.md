# SPEC.md - FE05 Book Management

# Version: 0.2.0

# Status: APPROVED

# Owner: Dung

# Last Updated: 2026-06-25

# Feature ID: FE05

# Feature folder: `.sdd/specs/feat-book-management/`

> Source of truth for FE05 Book Management. This spec is approved for Phase 2 planning. It is intentionally detailed because FE05 is a core business feature that provides the library catalog used by borrowing, reservation, reporting, and inventory features.

---

## 1. Feature Overview

### 1.1 Feature Name

Book Management

### 1.2 Business Context

Book Management controls the library catalog and provides accurate book information for guests, members, librarians, and other library features.

This feature is important because incorrect book information can affect searching, inventory tracking, borrowing operations, reservations, reporting, and audit records.

### 1.3 Goal / Outcome

The system shall:

- Allow guests and members to search books.
- Allow guests and members to view book details.
- Allow librarians/admins to view book lists.
- Allow librarians/admins to add new books.
- Allow librarians/admins to update book information.
- Allow librarians/admins to deactivate books.
- Maintain accurate book metadata for inventory, borrowing, and reporting features.
- Keep book management actions traceable for audit purposes.

### 1.4 Scope Level

- [ ] Full Spec - core business logic, high risk, must be correct from the beginning
- [x] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
|---------|-------------|-----------------------------|
| Guest | Unauthenticated visitor | Search books and view book details. |
| Member | Registered library user | Search books and view book details. |
| Librarian | Library staff | View book list, add books, update books, deactivate books. |
| Admin | System administrator | Has librarian permissions and can manage all books. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE05-001: The book record exists before it can be viewed or updated.
- PRE-FE05-002: Protected actions are performed by an authenticated actor with the correct role.
- PRE-FE05-003: Required book information is provided before creating a book.
- PRE-FE05-004: ISBN uniqueness rules are configured and approved by the team.
- PRE-FE05-005: Categories, authors, and publishers exist before being assigned to books.

---

## 4. Main Flows

### MF-FE05-001: Search Books

1. Guest or member enters search criteria.
2. The system validates search parameters.
3. The system searches active books.
4. The system returns matching results.
5. The system supports pagination when applicable.

### MF-FE05-002: View Book Details

1. Guest or member selects a book.
2. The system retrieves book information.
3. The system displays detailed book information.
4. The system displays author, category, publisher, and availability information.

### MF-FE05-003: View Book List

1. Librarian opens book management.
2. The system retrieves book records.
3. The system displays paginated book list.
4. The librarian may filter and sort results.

### MF-FE05-004: Add Book

1. Librarian enters book information.
2. The system validates required fields.
3. The system validates ISBN uniqueness.
4. The system creates a new book record.
5. The system writes an audit log entry.

### MF-FE05-005: Update Book Information

1. Librarian selects an existing book.
2. Librarian modifies information.
3. The system validates updated data.
4. The system saves changes.
5. The system writes an audit log entry.

### MF-FE05-006: Deactivate Book

1. Librarian selects an active book.
2. Librarian confirms deactivation.
3. The system changes book status to `INACTIVE`.
4. The system prevents future borrowing of the book.
5. The system writes an audit log entry.

---

## 5. Alternative Flows

### AF-FE05-001: Duplicate ISBN

1. Librarian submits a new book.
2. The system detects an existing ISBN.
3. The system rejects creation.
4. The system returns a validation error.

### AF-FE05-002: Invalid Category

1. Librarian submits book information.
2. The selected category does not exist.
3. The system rejects the request.
4. The system returns an error message.

### AF-FE05-003: Book Not Found

1. User requests book details.
2. The book ID does not exist.
3. The system returns a not-found response.

### AF-FE05-004: Unauthorized Access

1. Guest or member attempts to add, update, or deactivate a book.
2. The system validates permissions.
3. The system denies access.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE05-001: Guests and members may only search books and view book details.
- BR-FE05-002: Only librarians and admins may add books.
- BR-FE05-003: Only librarians and admins may update books.
- BR-FE05-004: Only librarians and admins may deactivate books.
- BR-FE05-005: ISBN must be unique across all books.
- BR-FE05-006: Book title is required.
- BR-FE05-007: A book belongs to exactly one category in Phase 1.
- BR-FE05-008: Deactivated books cannot be borrowed.
- BR-FE05-009: Deactivated books should not appear in public search results.
- BR-FE05-010: Every create, update, and deactivate action must be auditable.

---

## 7. Functional Requirements

- FR-FE05-001: The system shall allow guests to search books.
- FR-FE05-002: The system shall allow members to search books.
- FR-FE05-003: The system shall allow users to view book details.
- FR-FE05-004: The system shall allow librarians/admins to view book lists.
- FR-FE05-005: The system shall validate ISBN uniqueness before creating a book.
- FR-FE05-006: The system shall create a new book when provided valid data.
- FR-FE05-007: The system shall allow updating existing books.
- FR-FE05-008: The system shall deactivate books using status-based deactivation.
- FR-FE05-009: The system shall support pagination in book searches.
- FR-FE05-010: The system shall support filtering by category, author, and status.

### Unwanted Behaviour Requirements (Error / Abnormal Conditions)

- FR-FE05-011: IF an ISBN is provided that already exists on another book during create or update, the system shall reject the request and return a validation error without modifying any record. (Source: AF-FE05-001, EC-FE05-003, BR-FE05-005)
- FR-FE05-012: IF book title is missing or empty during create or update, the system shall reject the request and return a validation error identifying the title field. (Source: EC-FE05-002, BR-FE05-006, NFR-FE05-UX-001)
- FR-FE05-013: IF a referenced category, author, or publisher does not exist during create or update, the system shall reject the request and return an error message. (Source: AF-FE05-002, EC-FE05-005, EC-FE05-006, EC-FE05-007)
- FR-FE05-014: IF a requested book ID does not exist when viewing, updating, or deactivating a book, the system shall return a not-found response and shall not create a new record. (Source: AF-FE05-003, EC-FE05-001)
- FR-FE05-015: IF a guest or member attempts to add, update, or deactivate a book, the system shall deny access and return a forbidden response. (Source: AF-FE05-004, EC-FE05-009, BR-FE05-002, BR-FE05-003, BR-FE05-004)
- FR-FE05-016: IF a provided publish year is invalid or set in the future during create or update, the system shall reject the request and return a validation error. (Source: EC-FE05-008)
- FR-FE05-017: IF a search keyword exceeds the allowed maximum length, the system shall reject the search and return a validation message. (Source: EC-FE05-011)
- FR-FE05-018: IF a book update or its audit log entry fails partway through, the system shall roll back both the book update and the audit log so no partial change persists. (Source: EC-FE05-012, NFR-FE05-TXN-001)
- FR-FE05-019: WHERE a book has status `INACTIVE`, the system shall prevent it from being borrowed and shall exclude it from public search results while keeping borrow/reservation history and copy records unchanged. (Source: BR-FE05-008, BR-FE05-009, EC-FE05-010, Q-FE05-007)

---

## 8. Acceptance Criteria

- AC-FE05-001: Given public-visible books exist, when a guest searches books, then matching active books are returned.
- AC-FE05-002: Given public-visible books exist, when a member searches books, then matching active books are returned.
- AC-FE05-003: Given a valid active book, when a guest or member opens book details, then book metadata and safe availability information are displayed.
- AC-FE05-004: Given a librarian/admin opens the book list, when filters are applied, then the system returns a paginated list of books.
- AC-FE05-005: Given valid required book data and a unique ISBN when provided, when a librarian/admin adds a book, then the system creates the book record.
- AC-FE05-006: Given a duplicate ISBN, when a librarian/admin adds or updates a book, then the system rejects the request.
- AC-FE05-007: Given an existing book and valid updates, when a librarian/admin updates book information, then the system saves the changes.
- AC-FE05-008: Given an active book, when a librarian/admin deactivates it, then the book becomes inactive and is excluded from public search.
- AC-FE05-009: Given a guest or member attempts to add, update, or deactivate a book, when the request is processed, then access is denied.
- AC-FE05-010: Given a create, update, or deactivate action succeeds, when the action completes, then an audit record is written if audit logging is approved.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE05-001 | Book ID does not exist | Return not found. |
| EC-FE05-002 | Book title is missing | Reject create/update request. |
| EC-FE05-003 | ISBN is duplicate | Reject create/update request. |
| EC-FE05-004 | ISBN is empty | Allow empty ISBN; when provided, ISBN must be unique. |
| EC-FE05-005 | Category ID does not exist | Reject request. |
| EC-FE05-006 | Author ID does not exist | Reject request. |
| EC-FE05-007 | Publisher ID does not exist | Reject request. |
| EC-FE05-008 | Publish year is invalid or in the future | Reject request. |
| EC-FE05-009 | Guest/member attempts protected book management | Return forbidden response. |
| EC-FE05-010 | Deactivate book with active borrowed/reserved copies | Allow status-based catalog deactivation; keep borrow/reservation history and copy records unchanged. |
| EC-FE05-011 | Search keyword too long | Reject with validation message. |
| EC-FE05-012 | Database update partially fails | Roll back book update and audit log. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Books | Stores book catalog metadata. |
| Categories | Provides book category classification. |
| Authors | Provides author information. |
| Publishers | Provides publisher information. |
| BookCopies | Provides availability summary through FE06. |
| UserRoles | Checks librarian/admin permissions. |
| AuditLogs | Records create, update, and deactivate actions if approved. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| bookId | integer | Yes for updates | Must exist in `Books`. |
| title | string | Yes | Required, trimmed, max length according to schema. |
| isbn | string | No/Recommended | Unique when provided; mandatory only if Q-FE05-001 is approved. |
| categoryId | integer | Yes | Must reference `Categories`. |
| authorId | integer | Yes | Must reference `Authors` in current SQL. |
| publisherId | integer | No/Recommended | Must reference `Publishers` when provided. |
| publishYear | integer | No | Must be a valid year and not in the future. |
| description | string | No | Must be sanitized before display. |
| coverUrl | string | No | Must be a safe URL/path according to approved storage policy. |
| status | string | Recommended | Add `ACTIVE`/`INACTIVE` if status-based deactivation is approved. |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract may stay in this SPEC.md unless the team reintroduces a dedicated shared API contract document.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/books` | Guest/Member/Librarian/Admin | Query: `q?, categoryId?, authorId?, publisherId?, status?, page?, limit?` | Paginated book summaries | Public callers receive only active/public-safe books. |
| GET | `/api/books/{bookId}` | Guest/Member/Librarian/Admin | - | Book detail | Public-safe detail for guest/member; staff may see management fields if approved. |
| GET | `/api/admin/books` | Librarian/Admin | Query: `q?, status?, categoryId?, page?, limit?` | Paginated management list | Protected endpoint. |
| POST | `/api/books` | Librarian/Admin | `{ title, isbn?, categoryId, authorId, publisherId?, publishYear?, description?, coverUrl? }` | Created book | Validates required fields and unique ISBN. |
| PUT | `/api/books/{bookId}` | Librarian/Admin | `{ title, isbn?, categoryId, authorId, publisherId?, publishYear?, pages?, rating?, description?, coverUrl?, status?: "ACTIVE"\|"INACTIVE" }` | Updated book | Validates references, unique ISBN, and optional status update. |
| PATCH | `/api/books/{bookId}/deactivate` | Librarian/Admin | `{ reason?: string }` | Deactivated book | Prefer status-based deactivation. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE05-SEC-001: Book management endpoints must require authentication and Librarian/Admin role.
- NFR-FE05-SEC-002: Public book endpoints must return only public-safe fields.
- NFR-FE05-SEC-003: All inputs such as title, ISBN, IDs, year, and URLs must be validated server-side.
- NFR-FE05-SEC-004: SQL injection must be prevented using parameterized queries or approved ORM patterns.
- NFR-FE05-SEC-005: Description and cover URL must be sanitized or escaped before display.

### 12.2 Transaction Integrity

- NFR-FE05-TXN-001: Create/update/deactivate and audit log should succeed or roll back together when audit logging is used.
- NFR-FE05-TXN-002: Book deactivation must not leave FE06 copy availability in an inconsistent state.

### 12.3 Performance

- NFR-FE05-PERF-001: Book search and management list must support pagination.
- NFR-FE05-PERF-002: Search should use indexed/filterable fields where practical: title, ISBN, category, author, publisher.

### 12.4 Logging and Audit

- NFR-FE05-LOG-001: Add, update, and deactivate book actions should be traceable with actor, timestamp, book ID, and result.

### 12.5 Usability

- NFR-FE05-UX-001: Validation errors must clearly identify invalid book fields.
- NFR-FE05-UX-002: Deactivation should require confirmation in the UI before submission.

---

## 13. Out of Scope

This feature does not include:

- Physical copy/barcode/location management.
- Borrow request, return, or renewal workflow.
- Reservation queue workflow.
- Fine calculation or payment.
- Public home page design and navigation.
- User, role, or membership management.
- Bulk import/export unless approved later.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE01 Public / Browse | Internal | Uses public-safe catalog data for home/search/detail pages. |
| FE02 Authentication | Internal | Identifies staff actors for protected actions. |
| FE06 Inventory / Book Copy Management | Internal | Owns physical copies and availability counts. |
| FE07 Borrowing Management | Internal | Uses book data during borrowing. |
| FE08 Reservation Management | Internal | Uses book data during reservation. |
| FE11 User & Role Management | Internal | Provides librarian/admin permissions. |
| SQL Server database | Technical | Current SQL script has `Books`, `Categories`, `Authors`, and `Publishers`. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE05-001 | ISBN is optional but must be unique when provided. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-002 | Multiple books can share the same title. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-003 | Deactivated books are hidden from public search but visible in staff/admin management views. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-004 | Soft delete/deactivation is required; no physical delete in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-005 | A book belongs to one category in Phase 1; many-to-many categories are future work. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-006 | Cover images are stored as URL/path text, not binary database content. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-007 | Deactivation hides the book from public catalog even when copies are borrowed or reserved; history and copy records remain unchanged. | User correction 2026-06-21 | APPROVED |
| Q-FE05-008 | Staff update form may set book status directly to `ACTIVE` or `INACTIVE`; public browse must hide `INACTIVE` books. | User request 2026-06-21 | APPROVED |

---

## 15.1 Approved Design Decisions

The following decisions were approved in the Phase 1 review packet on 2026-06-10 and are now part of this spec.

| Decision | Approved Answer | Status |
| -------- | --------------- | ------ |
| Q-FE05-001 | ISBN is optional but must be unique when provided. | APPROVED |
| Q-FE05-002 | Multiple books can share the same title. | APPROVED |
| Q-FE05-003 | Deactivated books are hidden from public search but visible in staff/admin management views. | APPROVED |
| Q-FE05-004 | Soft delete/deactivation is required; no physical delete in Phase 1. | APPROVED |
| Q-FE05-005 | A book belongs to one category in Phase 1; many-to-many categories are future work. | APPROVED |
| Q-FE05-006 | Cover images are stored as URL/path text, not binary database content. | APPROVED |
| Q-FE05-007 | Deactivation hides the book from public catalog even when copies are borrowed or reserved; history and copy records remain unchanged. | APPROVED |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE05-001 | UC17, UC18, UC19, UC20 | FT18, FT19, FT20, FT21 | Not Started |
| FR-FE05-001 | UC18 | FT18 | Not Started |
| FR-FE05-002 | UC19 | FT20 | Not Started |
| FR-FE05-003 | UC17, UC20 | FT19, FT21 | Not Started |
| FR-FE05-004 | UC21 | FT22 | Not Started |
| BR-FE05-002 | UC22 | FT23 | Not Started |
| FR-FE05-006 | UC22 | FT23 | Not Started |
| BR-FE05-003 | UC23 | FT24 | Not Started |
| FR-FE05-007 | UC23 | FT24 | Not Started |
| BR-FE05-004 | UC24 | FT25 | Not Started |
| FR-FE05-008 | UC24 | FT25 | Not Started |
| BR-FE05-010 | UC22, UC23, UC24 | FT23, FT24, FT25 | Not Started |
| FR-FE05-011 | UC22, UC23 | TBD | Not Started |
| FR-FE05-012 | UC22, UC23 | TBD | Not Started |
| FR-FE05-013 | UC22, UC23 | TBD | Not Started |
| FR-FE05-014 | UC17, UC20, UC23, UC24 | TBD | Not Started |
| FR-FE05-015 | UC22, UC23, UC24 | TBD | Not Started |
| FR-FE05-016 | UC22, UC23 | TBD | Not Started |
| FR-FE05-017 | UC18, UC19 | TBD | Not Started |
| FR-FE05-018 | UC23 | TBD | Not Started |
| FR-FE05-019 | UC24 | TBD | Not Started |

---

## 17. Review Checklist

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Proposed decisions in Section 15.1 are approved or changed.
- [x] ISBN mandatory/optional rule is approved.
- [x] Book status/deactivation schema is confirmed with database owner.
- [x] Public search/detail boundary with FE01 is confirmed.
- [x] Physical copy boundary with FE06 is confirmed.
- [x] API contract is approved in this SPEC.md or copied to a dedicated shared API contract file if the team reintroduces one.
- [x] Every acceptance criterion can become a test.
