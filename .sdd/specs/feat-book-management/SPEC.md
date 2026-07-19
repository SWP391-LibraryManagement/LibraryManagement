# SPEC.md - FE05 Book Management

# Version: 0.5.1

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Dung

# Last Updated: 2026-07-17

# Feature ID: FE05

# Feature folder: `.sdd/specs/feat-book-management/`

> Source of truth for FE05 Book Management. Revision v0.5.0 was approved by human review on 2026-07-16 and is ready for implementation planning.

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
- Derive public availability from FE06-owned physical-copy state without allowing FE05 to mutate copy status.
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
4. The system applies the approved query filters and `sort`/`order` fields defined in Section 11.

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
2. Librarian provides a reason and confirms deactivation using the last-seen book version.
3. The system rechecks the version and changes book status to `INACTIVE`.
4. The system prevents future borrowing/public visibility without rewriting copy/workflow history.
5. The book update and audit log commit atomically.

### MF-FE05-007: View Derived Public Availability

1. A guest/member opens public browse, or a librarian/admin opens book management.
2. The system loads the current `Books.Status` and FE06-owned `BookCopies.Status` values.
3. The system derives `AVAILABLE` (`Còn sách`) only when `Books.Status = ACTIVE` and at least one related copy is `AVAILABLE`.
4. Otherwise, the system derives `UNAVAILABLE` (`Không khả dụng`) without exposing whether copies are borrowed, reserved, damaged, lost, or inactive.
5. FE05 returns the derived summary and does not modify any `BookCopies` record.

### MF-FE05-008: Reactivate Book

1. Librarian/admin opens an `INACTIVE` book in management view.
2. The actor provides a reason and confirms reactivation using the last-seen book version.
3. The system rechecks the version and changes only `Books.Status` to `ACTIVE`.
4. Existing copy states remain unchanged; derived availability is recalculated from current FE06-owned copies.
5. The book update and audit log commit atomically.

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

- BR-FE05-001: Guests may only search books and view book details.
- BR-FE05-002: Only librarians and admins may add books.
- BR-FE05-003: Only librarians and admins may update books.
- BR-FE05-004: Only librarians and admins may deactivate books.
- BR-FE05-005: ISBN must be unique across all books.
- BR-FE05-006: Book title is required.
- BR-FE05-007: A book belongs to exactly one category in Phase 1.
- BR-FE05-008: Deactivated books cannot be borrowed.
- BR-FE05-009: Deactivated books must not appear in public search/detail results.
- BR-FE05-010: Every create, update, deactivate, and reactivate action must be auditable.
- BR-FE05-011: Public availability is not the same as catalog visibility; `Books.Status` controls active/inactive catalog visibility, while FE06-owned `BookCopies.Status` values provide the read-only availability source.
- BR-FE05-012: FE05 must not create or perform manual transitions on `BookCopies.Status`; copy lifecycle changes belong to FE06, FE07, or FE08 according to the owning workflow.
- BR-FE05-013: For an `ACTIVE` book, public availability is `AVAILABLE` only when at least one related copy has `BookCopies.Status = AVAILABLE`; otherwise it is `UNAVAILABLE`. An `INACTIVE` book is never public-visible or borrowable regardless of copy state.
- BR-FE05-014: `Books.Status` has exactly two states, `ACTIVE` and `INACTIVE`; valid transitions are create -> `ACTIVE`, `ACTIVE -> INACTIVE`, and `INACTIVE -> ACTIVE`. Physical deletion is forbidden in Phase 1.
- BR-FE05-015: Deactivation/reactivation changes only `Books.Status`; FE05 never rewrites related copy, borrowing, reservation, or history rows.
- BR-FE05-016: Every update/deactivate/reactivate of an existing book requires the caller's last-seen SQL `rowversion` through `If-Match`; stale/missing versions return `409 STALE_BOOK_STATE` with no mutation.
- BR-FE05-017: Book queries use deterministic controls: keyword length 1..200 when provided; `page` defaults to 1; `limit` defaults to 20 and must be 1..100. Public `/api/books` accepts only `q`, `categoryId`, `authorId`, `publisherId`, `page`, and `limit` and always orders by `Title ASC, BookId ASC`; staff `/api/admin/books` additionally accepts sort fields `title`, `publishYear`, or `createdAt` and order `asc` or `desc`.
- BR-FE05-018: Deactivation/reactivation requires a trimmed non-empty reason of at most 500 characters, stored in audit metadata.


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
- FR-FE05-020: WHEN book data is returned to staff or public browse, the system shall derive the availability summary from the latest committed FE06 copy states according to BR-FE05-013 and shall not persist an FE05-owned availability value. (Source: MF-FE05-007, BR-FE05-011, BR-FE05-012, BR-FE05-013)
- FR-FE05-021: IF a caller attempts to change `BookCopies.Status` through an FE05 book endpoint, the system shall reject the request and shall not modify `Books` or `BookCopies`. (Source: BR-FE05-012, EC-FE05-013)
- FR-FE05-022: WHEN an authorized actor reactivates an `INACTIVE` book with a matching version and non-empty reason, the system shall set `Books.Status = ACTIVE`, preserve all related copy/workflow records, recalculate derived availability, and write the audit atomically. (Source: MF-FE05-008, BR-FE05-014, BR-FE05-015)
- FR-FE05-023: IF `If-Match` is missing or does not match current book `rowversion` during update/deactivate/reactivate, the system shall return `409 STALE_BOOK_STATE` and change no record. (Source: BR-FE05-016, EC-FE05-014)
- FR-FE05-024: IF a public query contains an unapproved field, or any keyword, pagination, staff sort, or staff order value violates BR-FE05-017, the system shall return a validation error rather than silently applying a different policy. (Source: EC-FE05-011, EC-FE05-015)
- FR-FE05-025: IF deactivation/reactivation reason is missing, blank after trimming, or longer than 500 characters, the system shall reject the command and preserve all state. (Source: BR-FE05-018, EC-FE05-016)
- FR-FE05-026: IF `pages` is not an integer from 1 to 10,000, or `rating` is outside 0.0 to 5.0 or has more than one decimal place during create/update, the system shall reject the request with field-level validation and change no record. (Source: EC-FE05-017, Section 10.2)

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
- AC-FE05-010: Given a create, update, deactivate, or reactivate action succeeds, when the action completes, then the book change and required audit record commit atomically.
- AC-FE05-011: Given an active book whose latest committed copy state contains at least one `AVAILABLE` copy, when staff or public browse loads the book, then the response shows `AVAILABLE`/`Còn sách` without changing any copy.
- AC-FE05-012: Given a caller submits a copy-status mutation through an FE05 endpoint, when the request is processed, then the request is rejected and all book/copy states remain unchanged.
- AC-FE05-013: Given an `INACTIVE` book, matching `If-Match`, and non-empty reason, when staff reactivates it, then only `Books.Status` becomes `ACTIVE`, copy states remain unchanged, and derived availability reflects current copies.
- AC-FE05-014: Given a stale or missing `If-Match`, when staff updates/deactivates/reactivates a book, then FE05 returns `409 STALE_BOOK_STATE` and preserves all state.
- AC-FE05-015: Given an unapproved public query field or invalid pagination/staff-sort/keyword input, when a list/search endpoint is called, then FE05 returns a validation error using the deterministic query policy.
- AC-FE05-016: Given a missing/blank/overlength deactivation or reactivation reason, when staff submits the command, then FE05 rejects it and preserves book/copy/workflow state.
- AC-FE05-017: Given invalid `pages` or `rating`, when staff creates or updates a book, then FE05 returns field-level validation and preserves the book, copy, workflow, and audit state.

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
| EC-FE05-013 | Caller attempts copy-status mutation through FE05 | Reject request; direct copy transitions must use the owning FE06/FE07/FE08 workflow. |
| EC-FE05-014 | Missing/stale `If-Match` rowversion | Return `409 STALE_BOOK_STATE`; caller reloads current state. |
| EC-FE05-015 | Unapproved public query field or invalid page/limit/staff sort/order | Reject using BR-FE05-017; do not silently normalize. |
| EC-FE05-016 | Missing/blank/overlength state-transition reason | Reject command and preserve all state. |
| EC-FE05-017 | `pages` or `rating` violates Section 10.2 bounds/precision | Reject create/update with field-level validation and no mutation. |

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
| AuditLogs | Records every create, update, deactivate, and reactivate action. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| bookId | integer | Yes for updates | Must exist in `Books`. |
| title | string | Yes | Required, trimmed, 1..255 characters. |
| isbn | string | No | Trimmed, max 20 characters, unique when provided. |
| categoryId | integer | Yes | Must reference `Categories`. |
| authorId | integer | Yes | Must reference `Authors` in current SQL. |
| publisherId | integer | No | Must reference `Publishers` when provided. |
| publishYear | integer | No | Must be a valid year and not in the future. |
| pages | integer | No | Integer from 1 to 10,000 when provided. |
| rating | decimal | No | Value from 0.0 to 5.0 with at most one decimal place when provided. |
| description | string | No | Must be sanitized before display. |
| coverUrl | string | No | Must be a safe URL/path according to approved storage policy. |
| status | string | Yes | Values: `ACTIVE`, `INACTIVE`; controls catalog visibility and borrow eligibility. |
| availabilityStatus | string | Derived/read-only | Values: `AVAILABLE`, `UNAVAILABLE`; computed from `Books.Status` and FE06-owned copy states according to BR-FE05-013. |
| actionReason | string | Required for deactivate/reactivate | Trimmed, 1..500 characters; stored in audit metadata. |
| version | opaque string | Yes for existing-book mutation | API representation of SQL Server `rowversion`; supplied through `If-Match` and advanced on every mutation. |
| metadataCreatedAt | datetime | Yes for category/author/publisher records | Database-generated creation timestamp returned by protected metadata-management reads. |
| metadataStatus | string | Yes for category/author/publisher records | `ACTIVE` or `INACTIVE`; inactive metadata remains on existing books but cannot be assigned by new book mutations. |

### 10.3 Book State Model

- New books start `ACTIVE`.
- `ACTIVE -> INACTIVE` is deactivation; `INACTIVE -> ACTIVE` is reactivation.
- Neither transition changes `BookCopies`, borrowings, reservations, or historical records.
- Public endpoints return `404` for `INACTIVE` books; staff management endpoints may return both states.
- No state transitions to physical deletion in Phase 1.

---

## 11. API / Interface Contract

> RESTful API contract for FE05 review. Existing-book mutation endpoints require `If-Match` with the last-seen version.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/books` | Guest/Member/Librarian/Admin | Query: `q?, categoryId?, authorId?, publisherId?, page=1, limit=20` | `{ data: PublicBookSummary[], pagination: { page, limit, total, totalPages } }` | Top-level keys are exactly `data` and `pagination`; public results are active/public-safe and ordered by `Title ASC, BookId ASC`; BR-FE05-017 applies. |
| GET | `/api/books/{bookId}` | Guest/Member/Librarian/Admin | - | Book detail | Public callers receive public-safe `ACTIVE` detail or `404`; staff may receive management fields for both `ACTIVE` and `INACTIVE` books. |
| GET | `/api/admin/books` | Librarian/Admin | Query: `q?, status?, categoryId?, page?, limit?, sort?, order?` | Paginated management list | Protected endpoint; BR-FE05-017 applies. |
| POST | `/api/books` | Librarian/Admin | `{ title, isbn?, categoryId, authorId, publisherId?, publishYear?, pages?, rating?, description?, coverUrl? }` | Created `ACTIVE` book + version | Validates required fields and unique ISBN. |
| PUT | `/api/books/{bookId}` | Librarian/Admin | Header `If-Match`; `{ title, isbn?, categoryId, authorId, publisherId?, publishYear?, pages?, rating?, description?, coverUrl? }` | Updated book + new version | Metadata only; never changes book status or copies. |
| PATCH | `/api/books/{bookId}/deactivate` | Librarian/Admin | Header `If-Match`; `{ reason: string }` | Deactivated book + new version | Sets `INACTIVE`; reason required; no physical delete/copy rewrite. |
| PATCH | `/api/books/{bookId}/reactivate` | Librarian/Admin | Header `If-Match`; `{ reason: string }` | Reactivated book + new version | Sets `ACTIVE`; reason required; copy states remain unchanged. |

### 11.1 Frontend Ownership Boundary

- `frontend/src/page/BookManagement.jsx` is the canonical FE05 mutation surface for book create, metadata update, deactivate, and reactivate actions.
- `frontend/src/page/UserManagement.jsx` may read the Admin Library book list for console context, but its book rows are read-only and expose no duplicate FE05 mutation controls.
- FE11 `adminApi` contains no book mutation aliases; all existing-book mutations use the FE05 API contract above with `If-Match` and reason where required.

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE05-SEC-001: Book management endpoints must require authentication and Librarian/Admin role.
- NFR-FE05-SEC-002: Public book endpoints must return only public-safe fields.
- NFR-FE05-SEC-003: `title`, `ISBN`, category/author/publisher IDs, publish year, pages, rating, description, cover URL, and query inputs must be validated server-side.
- NFR-FE05-SEC-004: SQL injection must be prevented using parameterized queries or approved ORM patterns.
- NFR-FE05-SEC-005: Description and cover URL must be sanitized or escaped before display.

### 12.2 Transaction Integrity

- NFR-FE05-TXN-001: Create/update/deactivate/reactivate and the required audit log must succeed or roll back together.
- NFR-FE05-TXN-002: Book deactivation changes only `Books.Status`; FE05 must leave FE06 copy lifecycle state unchanged and all availability reads must combine the latest committed book/copy states.

### 12.3 Performance

- NFR-FE05-PERF-001: Book search and management list must support pagination.
- NFR-FE05-PERF-002: Search queries must apply the approved keyword/ID filters and pagination in the database query before materializing rows; application-layer full-catalog filtering is not permitted.

### 12.4 Logging and Audit

- NFR-FE05-LOG-001: Add, update, deactivate, and reactivate actions must be traceable with actor, timestamp, book ID, old/new status, reason when applicable, and result.

### 12.5 Usability

- NFR-FE05-UX-001: Validation errors must clearly identify invalid book fields.
- NFR-FE05-UX-002: Deactivation and reactivation must require confirmation in the UI before submission.

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
| SQL Server database | Technical | Current SQL has catalog tables and `Books.Status`; implementation must add SQL `rowversion` for the approved `If-Match` contract. |

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
| Q-FE05-008 | Staff may transition book status through dedicated deactivate/reactivate commands; metadata PUT does not change status, and public browse hides `INACTIVE` books. | Nhat approval after cross-feature audit 2026-07-15 | APPROVED |
| Q-FE05-009 | Staff/public views display simple derived availability (`Còn sách` / `Không khả dụng`). FE05 never updates `BookCopies.Status`; FE06/FE07/FE08 own copy transitions. | Nhat approval after cross-feature audit 2026-07-15 | APPROVED |
| Q-FE05-010 | Existing-book mutations use SQL `rowversion` exposed as an opaque version and require `If-Match`; stale/missing versions return `409 STALE_BOOK_STATE`. | Nhat approval after cross-feature audit 2026-07-15 | APPROVED |
| Q-FE05-011 | Query policy is deterministic: public browse uses the exact FE01 allowlist and fixed `Title ASC, BookId ASC`; staff list additionally accepts sort in title/publishYear/createdAt and order asc/desc. | Nhat approval after cross-feature audit 2026-07-15; user envelope approval 2026-07-19 | APPROVED |

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
| BR-FE05-002 | UC22 | FT23 | Not Started |
| BR-FE05-003 | UC23 | FT24 | Not Started |
| BR-FE05-004 | UC24 | FT25 | Not Started |
| BR-FE05-005 | UC22, UC23 | Planned: optional ISBN uniqueness create/update test | Planned |
| BR-FE05-006 | UC22, UC23 | Planned: trimmed required title validation test | Planned |
| BR-FE05-007 | UC22, UC23 | Planned: exactly-one-category reference test | Planned |
| BR-FE05-008 | UC24, UC29, UC32 | Planned: inactive book cannot enter FE07 create/approval | Planned |
| BR-FE05-009 | UC17, UC18, UC19, UC20, UC24 | Planned: inactive public search/detail returns hidden/404 | Planned |
| BR-FE05-010 | UC22, UC23, UC24 | FT23, FT24, FT25 | Not Started |
| BR-FE05-011 | UC17, UC20, UC21 | Planned: visibility and availability remain distinct | Planned |
| BR-FE05-012 | UC21, UC23, UC25-UC39 | Planned: FE05 copy-state mutation boundary test | Planned |
| BR-FE05-013 | UC17-UC21 | Planned: derived `AVAILABLE`/`UNAVAILABLE` aggregation test | Planned |
| BR-FE05-014 | UC22-UC24 | Planned: ACTIVE/INACTIVE state-transition test | Planned |
| BR-FE05-015 | UC23, UC24 | Planned: state transition preserves copy/workflow rows | Planned |
| BR-FE05-016 | UC23, UC24 | Planned: `If-Match` stale book update test | Planned |
| BR-FE05-017 | UC18, UC19, UC21 | Planned: deterministic query validation test | Planned |
| BR-FE05-018 | UC23, UC24 | Planned: required state-transition reason test | Planned |
| FR-FE05-001 | UC18 | FT18 | Not Started |
| FR-FE05-002 | UC19 | FT20 | Not Started |
| FR-FE05-003 | UC17, UC20 | FT19, FT21 | Not Started |
| FR-FE05-004 | UC21 | FT22 | Not Started |
| FR-FE05-005 | UC22, UC23 | Planned: ISBN pre-write validation test | Planned |
| FR-FE05-006 | UC22 | FT23 | Not Started |
| FR-FE05-007 | UC23 | FT24 | Not Started |
| FR-FE05-008 | UC24 | FT25 | Not Started |
| FR-FE05-009 | UC18, UC19, UC21 | Planned: page/limit result contract test | Planned |
| FR-FE05-010 | UC18, UC19, UC21 | Planned: category/author/status filter test | Planned |
| FR-FE05-011 | UC22, UC23 | Planned: duplicate ISBN leaves state unchanged | Planned |
| FR-FE05-012 | UC22, UC23 | Planned: missing title validation test | Planned |
| FR-FE05-013 | UC22, UC23 | Planned: missing reference validation test | Planned |
| FR-FE05-014 | UC17, UC20, UC23, UC24 | Planned: unknown/hidden book not-found test | Planned |
| FR-FE05-015 | UC22, UC23, UC24 | Planned: non-staff write forbidden test | Planned |
| FR-FE05-016 | UC22, UC23 | Planned: publish-year boundary test | Planned |
| FR-FE05-017 | UC18, UC19 | Planned: overlength keyword rejected test | Planned |
| FR-FE05-018 | UC23 | Planned: book change + audit rollback test | Planned |
| FR-FE05-019 | UC24, UC29, UC32 | Planned: inactive parent blocked by FE07 test | Planned |
| FR-FE05-020 | UC17-UC21 | Planned: derived availability read test | Planned |
| FR-FE05-021 | UC23 | Planned: FE05 copy mutation rejected test | Planned |
| FR-FE05-022 | UC23, UC24 | Planned: reactivation preserves copies and audits | Planned |
| FR-FE05-023 | UC23, UC24 | Planned: stale/missing `If-Match` rejection test | Planned |
| FR-FE05-024 | UC18, UC19, UC21 | Planned: invalid query policy rejection test | Planned |
| FR-FE05-025 | UC23, UC24 | Planned: state-transition reason boundary test | Planned |
| FR-FE05-026 | UC22, UC23 | Planned: pages/rating bounds and precision rejection test | Planned |
| AC-FE05-001 | UC18 | FT18 | Not Started |
| AC-FE05-002 | UC19 | FT20 | Not Started |
| AC-FE05-003 | UC17, UC20 | FT19, FT21 | Not Started |
| AC-FE05-004 | UC21 | FT22 | Not Started |
| AC-FE05-005 | UC22 | FT23 | Not Started |
| AC-FE05-006 | UC22, UC23 | Planned: duplicate ISBN acceptance test | Planned |
| AC-FE05-007 | UC23 | FT24 | Not Started |
| AC-FE05-008 | UC24 | FT25 | Not Started |
| AC-FE05-009 | UC22-UC24 | Planned: protected management authorization test | Planned |
| AC-FE05-010 | UC22-UC24 | Planned: required audit atomicity test | Planned |
| AC-FE05-011 | UC17-UC21 | Planned: at-least-one AVAILABLE copy summary test | Planned |
| AC-FE05-012 | UC23 | Planned: copy-state mutation boundary acceptance test | Planned |
| AC-FE05-013 | UC23, UC24 | Planned: reactivation acceptance test | Planned |
| AC-FE05-014 | UC23, UC24 | Planned: stale version preserves state test | Planned |
| AC-FE05-015 | UC18, UC19, UC21 | Planned: deterministic invalid-query response test | Planned |
| AC-FE05-016 | UC23, UC24 | Planned: missing/blank/overlength reason rejection test | Planned |
| AC-FE05-017 | UC22, UC23 | Planned: invalid pages/rating preserves all state | Planned |

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

### 17.1 Revision v0.5.0 Review Gate

- [x] Confirm FE05 has no `BookCopies.Status` mutation endpoint.
- [x] Confirm derived availability and `ACTIVE` parent-book guard across FE01/FE06/FE07.
- [x] Confirm dedicated deactivate/reactivate commands preserve all copy/workflow rows.
- [x] Confirm `rowversion`/`If-Match`, query limits, and required transition reasons.
