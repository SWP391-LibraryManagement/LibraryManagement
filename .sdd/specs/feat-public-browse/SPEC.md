# SPEC.md - FE01 Public / Browse

# Version: 0.2.0

# Status: APPROVED

# Owner: Dung

# Last Updated: 2026-06-30

# Feature ID: FE01

# Feature folder: `.sdd/specs/feat-public-browse/`

> Source of truth for FE01 Public / Browse. This spec is approved for Phase 2 planning.

---

## 1. Feature Overview

### 1.1 Feature Name

Public / Browse

### 1.2 Business Context

Guests need a simple way to discover books before creating an account or applying for membership. A public catalog reduces manual questions for librarians and helps potential members understand what the library offers.

Public browsing must be safe and read-only. It may display book metadata and public availability information, but it must not expose protected user, borrowing, reservation, fine, or staff-only inventory details.

### 1.3 Goal / Outcome

The system shall:

- Allow guests to view the home page.
- Allow guests to search the public book catalog.
- Allow guests to view public book information.
- Allow guests to view public book details.
- Display the latest public availability when staff update book copy status in FE05/FE06.
- Display only public-safe data.
- Keep all public browse behavior read-only.

### 1.4 Scope Level

- [ ] Full Spec - core business logic, high risk, must be correct from the beginning
- [x] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Guest | Unauthenticated visitor | View home page, search books, view public book information and details. |
| Member | Authenticated library user | May use the same public browse functions; member-only actions are handled by other features. |
| Librarian | Library staff | No special write permission in FE01; catalog management belongs to FE05. |
| Admin | System administrator | No special write permission in FE01; management belongs to FE05/FE11. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE01-001: Public catalog data exists in `Books`.
- PRE-FE01-002: Searchable book metadata is available: title and at least one identifier such as `BookId` or ISBN.
- PRE-FE01-003: Public endpoints are available without authentication.
- PRE-FE01-004: Returned fields are restricted to public-safe catalog data.
- PRE-FE01-005: Pagination defaults are defined for search results.

---

## 4. Main Flows

### MF-FE01-001: View Home Page

1. Guest opens the public home page.
2. The system loads public navigation and search entry points.
3. The system may load public catalog highlights if configured.
4. The system displays login/register links for member-only actions.
5. The system does not require authentication.

### MF-FE01-002: Search Books

1. Guest enters a keyword or filter.
2. The system validates query length, page, and filter values.
3. The system searches public-visible books.
4. The system returns paginated results with safe summary fields.
5. The system shows empty-state messaging when no books match.

### MF-FE01-003: View Book Information

1. Guest selects a book from search or browse results.
2. The system validates the book ID.
3. The system loads public book information.
4. The system shows title, author, category, publisher, publish year, cover, and summary availability if approved.

### MF-FE01-004: View Book Details

1. Guest opens the book detail page.
2. The system retrieves detailed public book data.
3. The system retrieves high-level availability information from inventory if approved.
4. The system displays description and public metadata.
5. The system presents member-only actions as navigation to login/register or membership flows.

### MF-FE01-005: Reflect Updated Availability On Home/Search

1. Librarian/admin changes a book's availability through FE05.
2. FE05 updates the related `BookCopies.Status`.
3. Guest/member opens `/home`, search, or book detail.
4. The system reads current active catalog records and copy availability.
5. The UI displays `Còn sách` when at least one active/public copy is available, otherwise `Đã mượn`/unavailable.

---

## 5. Alternative Flows

### AF-FE01-001: No Search Keyword

1. Guest submits an empty search.
2. The system either returns default browse results or asks for a keyword according to approved UI policy.
3. The system does not fail with a server error.

### AF-FE01-002: No Matching Books

1. Guest searches with valid criteria.
2. No public-visible books match.
3. The system returns an empty result set with a clear message.

### AF-FE01-003: Book Not Found

1. Guest opens a book detail URL for a missing book.
2. The system returns a not-found response.
3. The system does not expose internal database details.

### AF-FE01-004: Book Not Publicly Visible

1. Guest opens a book that is inactive, deactivated, or otherwise hidden by policy.
2. The system treats it as not found or unavailable for public display.
3. The system does not expose hidden catalog data.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE01-001: Public browse is read-only.
- BR-FE01-002: Guests may view the home page without authentication.
- BR-FE01-003: Guests may search only public-visible books.
- BR-FE01-004: Guests may view only public-safe book fields.
- BR-FE01-005: Public search must support pagination.
- BR-FE01-006: Public search input must be validated before querying.
- BR-FE01-007: Missing or hidden books must not expose internal database details.
- BR-FE01-008: Public availability display must be derived from FE06 inventory rules when shown.
- BR-FE01-009: FE01 must not create, update, deactivate, borrow, reserve, or fine records.
- BR-FE01-010: Public responses must not expose user data, borrowing records, reservation queues, fines, audit logs, or protected staff fields.
- BR-FE01-011: Public availability must be computed from current `BookCopies.Status` for active books and must not use a hardcoded or stale UI-only value.
- BR-FE01-012: Public browse must hide `Books.Status = INACTIVE` even if one or more copies are marked `AVAILABLE`.

---

## 7. Functional Requirements

- FR-FE01-001: When a guest opens the home page, the system shall display the public home page without requiring login.
- FR-FE01-002: When a guest searches books with valid criteria, the system shall return public-visible matching books.
- FR-FE01-003: If no public books match the search criteria, then the system shall return an empty result with a clear message.
- FR-FE01-004: When a guest views book information, the system shall return only public-safe summary fields.
- FR-FE01-005: When a guest views book details, the system shall return public-safe detailed book fields.
- FR-FE01-006: If a requested book does not exist or is not public-visible, then the system shall return a not-found response.
- FR-FE01-007: When search page or limit values are invalid, the system shall reject or normalize them safely.
- FR-FE01-008: When availability is displayed, the system shall use approved inventory status rules rather than hardcoded values.
- FR-FE01-009: When staff updates book availability through FE05, the public home/search/detail views shall show the updated availability by reading the current active book and copy state.
- FR-FE01-010: If a book has no available copies, public browse shall display it as unavailable/`Đã mượn` without exposing copy barcodes, locations, or borrower data.

---

## 8. Acceptance Criteria

- AC-FE01-001: Given a guest, when the guest opens the home page, then the system displays public search/browse entry points.
- AC-FE01-002: Given public-visible books exist, when the guest searches by keyword, then matching books are returned.
- AC-FE01-003: Given no books match the keyword, when the guest searches, then an empty result message is shown.
- AC-FE01-004: Given a valid public book, when the guest views book information, then summary metadata is shown.
- AC-FE01-005: Given a valid public book, when the guest views book details, then detailed metadata and safe availability information are shown.
- AC-FE01-006: Given an invalid book ID, when the guest opens details, then a not-found response is returned.
- AC-FE01-007: Given a deactivated/hidden book, when the guest searches or opens details, then the book is not exposed publicly.
- AC-FE01-008: Given a public request, when the system responds, then no protected user, borrowing, reservation, fine, or audit data is included.
- AC-FE01-009: Given a staff user changes a book from `Đã mượn` to `Còn sách`, when a guest opens `/home` or searches the book, then the public availability display shows the updated available state.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE01-001 | Empty search keyword | Return default browse result or validation message according to approved policy. |
| EC-FE01-002 | Search keyword too long | Reject with validation message. |
| EC-FE01-003 | Invalid page or limit | Reject or normalize safely. |
| EC-FE01-004 | Book ID is not numeric | Return validation error or not-found response. |
| EC-FE01-005 | Book does not exist | Return not found. |
| EC-FE01-006 | Book is hidden/deactivated | Do not expose the book publicly. |
| EC-FE01-007 | Book has no cover image | Show default/no-cover state. |
| EC-FE01-008 | Book has no available copies | Show unavailable status if availability display is approved. |
| EC-FE01-009 | Category/author/publisher record missing | Return book with safe fallback or exclude broken metadata according to policy. |
| EC-FE01-010 | Database query fails | Return safe generic error without stack trace. |
| EC-FE01-011 | Copy status changed shortly before public request | Return the latest committed availability summary from the database. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Books | Provides public book metadata. |
| Categories | Provides public category names. |
| Authors | Provides public author names. |
| Publishers | Provides public publisher names. |
| BookCopies | Provides availability counts/status if displayed. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| bookId | integer | Yes for detail | Must reference `Books`. |
| title | string | Yes | Public summary and detail display. |
| isbn | string | No | Public only if approved by team. |
| categoryName | string | No | Public filter/display field. |
| authorName | string | No | Public filter/display field. |
| publisherName | string | No | Public display field. |
| publishYear | integer | No | Should be a valid year if present. |
| description | string | No | Display sanitized content only. |
| coverUrl | string | No | Must not point to unsafe/internal path. |
| availableCount | integer | No | Derived from FE06 if exact count is approved. |
| availabilityStatus | string | No | Derived from FE06 if public display is approved. |
| bookStatus | string | Internal filter only | Public endpoints must filter out `INACTIVE`; do not expose inactive records. |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract may stay in this SPEC.md unless the team reintroduces a dedicated shared API contract document.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/public/home` | Guest/Member | - | Public home data | Optional if home page needs dynamic highlights. |
| GET | `/api/books` | Guest/Member | Query: `q?, categoryId?, authorId?, publisherId?, page?, limit?` | Public book summaries | Implemented public browse endpoint; returns active/public-safe books only. |
| GET | `/api/books/{bookId}` | Guest/Member | - | Public book detail | Implemented public detail endpoint; must return only public-safe fields. |
| GET | `/api/public/books` | Guest/Member | Query: `q?, categoryId?, authorId?, publisherId?, page?, limit?` | Paginated public book summaries | Optional alias if a dedicated public namespace is reintroduced later. |
| GET | `/api/public/books/{bookId}` | Guest/Member | - | Public book detail | Optional alias if a dedicated public namespace is reintroduced later. |
| GET | `/api/public/categories` | Guest/Member | - | Category list | Optional browse filter endpoint. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE01-SEC-001: Public endpoints must validate all query and route parameters.
- NFR-FE01-SEC-002: Public responses must not include protected user, borrowing, reservation, fine, audit, or staff-only inventory data.
- NFR-FE01-SEC-003: Public endpoints must not expose stack traces or SQL/database errors.
- NFR-FE01-SEC-004: Public display content must be sanitized or escaped to prevent script injection.

### 12.2 Performance

- NFR-FE01-PERF-001: Search results must be paginated.
- NFR-FE01-PERF-002: Search should use indexed/filterable fields where practical: title, ISBN, category, author, publisher.

### 12.3 Logging and Audit

- NFR-FE01-LOG-001: Public read-only browsing does not require business audit logs.
- NFR-FE01-LOG-002: Public endpoint errors should be logged safely for troubleshooting without storing sensitive data.

### 12.4 Usability

- NFR-FE01-UX-001: Empty search and no-result states must be understandable to guests.
- NFR-FE01-UX-002: Public book detail pages must clearly show when a book is unavailable if availability display is approved.

---

## 13. Out of Scope

This feature does not include:

- Book create/update/deactivate workflows.
- Physical copy, barcode, or location management.
- Borrow request creation.
- Reservation creation/cancellation.
- Authentication, registration, password reset, or membership approval.
- Fine calculation or payment.
- Admin/librarian management dashboards.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE05 Book Management | Internal | Owns catalog metadata and active/deactivated book state. |
| FE06 Inventory / Book Copy Management | Internal | Provides public availability if shown. |
| FE02 Authentication | Internal | Provides login/register routes for member-only actions. |
| FE04 Membership Management | Internal | Handles membership application after public discovery. |
| SQL Server database | Technical | Stores public book catalog data. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE01-001 | Hide inactive/deactivated books from all public search/detail views. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-002 | Guests see simple availability only: Available/Unavailable, not exact copy count. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-003 | Phase 1 filters: keyword, title, author, category; pagination required. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-004 | ISBN is visible to guests when available. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-005 | Home page displays navigation/search and recent books; featured books are optional/out of scope unless manually configured. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-006 | Current prototype uses `/api/books` and `/api/books/{bookId}` as the public browse endpoints; `/api/public/*` remains an optional future namespace. | User correction 2026-06-21 | APPROVED |
| Q-FE01-007 | `/home`, public search, and public detail use the latest `BookCopies.Status` summary after librarian/admin availability updates; the public UI shows only simple availability, not internal copy data. | User correction 2026-06-30 | APPROVED |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE01-002 | UC01 | FT01 | Not Started |
| FR-FE01-001 | UC01 | FT01 | Not Started |
| BR-FE01-003 | UC02 | FT02 | Not Started |
| FR-FE01-002 | UC02 | FT02 | Not Started |
| FR-FE01-004 | UC03 | FT03 | Not Started |
| FR-FE01-005 | UC04 | FT04 | Not Started |
| BR-FE01-010 | UC03, UC04 | FT03, FT04 | Not Started |
| AC-FE01-008 | UC03, UC04 | FT03, FT04 | Not Started |
| FR-FE01-009 | UC01, UC02, UC04 | TBD | Ready for review |
| FR-FE01-010 | UC01, UC02, UC04 | TBD | Ready for review |

---

## 17. Review Checklist

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Public-visible fields are approved.
- [x] Search filters and pagination behavior are approved.
- [x] Availability display policy is approved with FE06.
- [x] Hidden/deactivated book behavior is approved with FE05.
- [x] API contract is approved in SPEC.md or copied to a dedicated shared API contract file if the team reintroduces one.
- [x] Every acceptance criterion can become a test.
