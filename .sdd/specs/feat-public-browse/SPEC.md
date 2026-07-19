# SPEC.md - FE01 Public / Browse

# Version: 0.3.1

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Dung

# Last Updated: 2026-07-17

# Feature ID: FE01

# Feature folder: `.sdd/specs/feat-public-browse/`

> Source of truth for FE01 Public / Browse. Revision v0.3.0 is approved as the baseline after its availability dependency was made explicit.

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
- Display the latest public availability after copy state changes through the owning FE06/FE07/FE08 workflow.
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
- PRE-FE01-002: Searchable book metadata is available: a title and the required `BookId`; ISBN is included when present.
- PRE-FE01-003: Public endpoints are available without authentication.
- PRE-FE01-004: Returned fields are restricted to public-safe catalog data.
- PRE-FE01-005: Pagination defaults are defined for search results.

---

## 4. Main Flows

### MF-FE01-001: View Home Page

1. Guest opens the public home page.
2. The system loads public navigation, search entry points, and the recent public books using the default browse ordering.
3. The system displays login/register links for member-only actions.
4. The system does not require authentication.

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
4. The system shows title, author, category, publisher, publish year, cover, and the approved safe availability summary.

### MF-FE01-004: View Book Details

1. Guest opens the book detail page.
2. The system retrieves detailed public book data.
3. The system retrieves the approved high-level availability information from inventory.
4. The system displays description and public metadata.
5. The system presents member-only actions as navigation to login/register or membership flows.

### MF-FE01-005: Reflect Current Availability On Home/Search

1. An owning workflow changes a physical copy state through FE06, FE07, or FE08.
2. Guest/member opens `/home`, search, or book detail.
3. The system reads the latest committed active catalog records and FE06-owned copy states.
4. The UI displays `Còn sách` when at least one copy is `AVAILABLE`, otherwise `Không khả dụng`.
5. FE01 and FE05 do not modify copy status while producing this summary.

---

## 5. Alternative Flows

### AF-FE01-001: No Search Keyword

1. Guest submits an empty search.
2. The system returns the default first page of public browse results using the approved sort order.
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
2. The system returns `404 Not Found` and exposes no hidden catalog fields.
3. The system does not expose hidden catalog data.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE01-001: Public browse is read-only.
- BR-FE01-002: Guests may view the home page without authentication.
- BR-FE01-003: Guests may search only public-visible books.
- BR-FE01-004: Guests may view only public-safe book fields.
- BR-FE01-005: Public search must support pagination.
- BR-FE01-006: Public search accepts only `q`, `categoryId`, `authorId`, `publisherId`, `page`, and `limit`. `q` is trimmed, must be 1..200 characters when supplied, and matches title or author name case-insensitively; ID filters must be positive integers.
- BR-FE01-007: Missing or hidden books must not expose internal database details.
- BR-FE01-008: Public availability display must be derived from FE06 inventory rules when shown.
- BR-FE01-009: FE01 must not create, update, deactivate, borrow, reserve, or fine records.
- BR-FE01-010: Public responses must not expose user data, borrowing records, reservation queues, fines, audit logs, or protected staff fields.
- BR-FE01-011: Public availability must be computed from current `BookCopies.Status` for active books and must not use a hardcoded or stale UI-only value.
- BR-FE01-012: Public browse must hide `Books.Status = INACTIVE` even if one or more copies are marked `AVAILABLE`.
- BR-FE01-013: Public browse defaults to `page=1`, `limit=20`, and stable ordering `Title ASC, BookId ASC`; `page` must be an integer at least 1 and `limit` must be an integer from 1 through 100.
- BR-FE01-014: Missing optional catalog metadata must not remove an otherwise public-visible book; the response returns `null` and the UI uses a safe fallback label/image.

---

## 7. Functional Requirements

- FR-FE01-001: When a guest opens the home page, the system shall display the public home page without requiring login.
- FR-FE01-002: When a guest searches books with valid BR-FE01-006 criteria, the system shall return public-visible matching books using only the approved query fields.
- FR-FE01-003: If no public books match the search criteria, then the system shall return an empty result with a clear message.
- FR-FE01-004: When a guest views book information, the system shall return only public-safe summary fields.
- FR-FE01-005: When a guest views book details, the system shall return public-safe detailed book fields.
- FR-FE01-006: If a requested book does not exist or is not public-visible, then the system shall return a not-found response.
- FR-FE01-007: When search page or limit values are invalid, the system shall reject them with a validation response and shall not silently normalize them.
- FR-FE01-008: The system shall display availability using approved inventory status rules rather than hardcoded values.
- FR-FE01-009: When an owning FE06/FE07/FE08 workflow changes copy state, public home/search/detail views shall show the updated availability by reading the latest committed active book and copy state.
- FR-FE01-010: If a book has no available copies, public browse shall display `Không khả dụng` without exposing copy barcodes, locations, or borrower data.
- FR-FE01-011: When search text is empty or omitted, the system shall return the default public browse page using `page=1`, `limit=20`, and `Title ASC, BookId ASC`.
- FR-FE01-012: If a book ID is not a positive integer, the system shall return a validation error; if the positive ID is missing or hidden, the system shall return not found.
- FR-FE01-013: When optional author, category, publisher, cover, or ISBN data is missing, the system shall keep the public-visible book in the response and return `null` for the missing field.

---

## 8. Acceptance Criteria

- AC-FE01-001: Given a guest, when the guest opens the home page, then the system displays public search/browse entry points and recent public books when catalog data exists; featured-book content is not required in Phase 1.
- AC-FE01-002: Given public-visible books exist, when the guest searches by keyword, then matching books are returned.
- AC-FE01-003: Given no books match the keyword, when the guest searches, then an empty result message is shown.
- AC-FE01-004: Given a valid public book, when the guest views book information, then summary metadata is shown.
- AC-FE01-005: Given a valid public book, when the guest views book details, then detailed metadata and safe availability information are shown.
- AC-FE01-006: Given an invalid book ID, when the guest opens details, then a not-found response is returned.
- AC-FE01-007: Given a deactivated/hidden book, when the guest searches or opens details, then the book is not exposed publicly.
- AC-FE01-008: Given a public request, when the system responds, then no protected user, borrowing, reservation, fine, or audit data is included.
- AC-FE01-009: Given an owning workflow commits a copy transition that leaves at least one copy `AVAILABLE`, when a guest opens `/home` or searches the active book, then public availability shows `Còn sách` without FE01/FE05 writing copy state.
- AC-FE01-010: Given an empty search, when a guest submits it, then the first default browse page is returned with `page=1`, `limit=20`, and `Title ASC, BookId ASC`.
- AC-FE01-011: Given invalid `page` or `limit`, when the guest searches, then the system returns a validation response and does not query with normalized values.
- AC-FE01-012: Given a non-numeric or non-positive book ID, when details are requested, then a validation response is returned; a well-formed missing/hidden ID returns not found.
- AC-FE01-013: Given a public-visible book with missing optional metadata, when it is listed or opened, then the book remains present and each missing field is returned as `null` for safe UI fallback.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE01-001 | Empty search keyword | Return the default first browse page with `page=1`, `limit=20`, and `Title ASC, BookId ASC`. |
| EC-FE01-002 | Search keyword too long | Reject with validation message. |
| EC-FE01-003 | Invalid page or limit | Reject with a validation response before querying; do not silently normalize. |
| EC-FE01-004 | Book ID is not a positive integer | Return a validation response. |
| EC-FE01-005 | Book does not exist | Return not found. |
| EC-FE01-006 | Book is hidden/deactivated | Do not expose the book publicly. |
| EC-FE01-007 | Book has no cover image | Show default/no-cover state. |
| EC-FE01-008 | Book has no available copies | Show `Không khả dụng`. |
| EC-FE01-009 | Optional category/author/publisher/cover/ISBN metadata missing | Keep the public-visible book, return `null` for the missing field, and let the UI show a safe fallback. |
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
| BookCopies | Provides the derived public availability status; exact copy counts are not exposed. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| bookId | integer | Yes for detail | Positive integer. Invalid format returns validation error; a missing/hidden referenced book returns not found. |
| title | string | Yes | Public summary and detail display. |
| isbn | string | No | Public when present, according to approved Q-FE01-004. |
| categoryName | string | No | Public filter/display field; return `null` when unavailable. |
| authorName | string | No | Public filter/display field; return `null` when unavailable. |
| publisherName | string | No | Public display field; return `null` when unavailable. |
| publishYear | integer | No | Must be an integer calendar year when present. |
| description | string | No | Display sanitized content only. |
| coverUrl | string | No | Must not point to an unsafe/internal path; return `null` when absent so the UI can show its standard no-cover state. |
| availabilityStatus | string | Yes | Derived values: `AVAILABLE` (`Còn sách`) or `UNAVAILABLE` (`Không khả dụng`). |
| bookStatus | string | Internal filter only | Public endpoints must filter out `INACTIVE`; do not expose inactive records. |

---

## 11. API / Interface Contract

> The endpoints and request/response shapes below are the canonical Phase 1 contract for this feature.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/books` | Guest/Member | Query: `q?, categoryId?, authorId?, publisherId?, page=1, limit=20` | `{ data: PublicBookSummary[], pagination: { page, limit, total, totalPages } }` | Top-level keys are exactly `data` and `pagination`; `page>=1`, `limit=1..100`; invalid values are rejected before query; empty `q` returns default browse results. |
| GET | `/api/books/{bookId}` | Guest/Member | - | Public book detail | Implemented public detail endpoint; must return only public-safe fields. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE01-SEC-001: Public endpoints must validate all query and route parameters.
- NFR-FE01-SEC-002: Public responses must not include protected user, borrowing, reservation, fine, audit, or staff-only inventory data.
- NFR-FE01-SEC-003: Public endpoints must not expose stack traces or SQL/database errors.
- NFR-FE01-SEC-004: Public display content must be sanitized or escaped to prevent script injection.

### 12.2 Performance

- NFR-FE01-PERF-001: Search results must be paginated.
- NFR-FE01-PERF-002: Search queries must apply the approved keyword/ID filters and pagination in the database query before materializing rows; application-layer full-catalog filtering is not permitted.

### 12.3 Logging and Audit

- NFR-FE01-LOG-001: Public read-only browsing does not require business audit logs.
- NFR-FE01-LOG-002: Public endpoint errors must be logged safely for troubleshooting without storing sensitive data.

### 12.4 Usability

- NFR-FE01-UX-001: Empty search and no-result states must be understandable to guests.
- NFR-FE01-UX-002: Public book detail pages must clearly show `Không khả dụng` when no copy is borrow-available.

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
- `/api/public/*` aliases and a separate public category endpoint.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE05 Book Management | Internal | Owns catalog metadata and active/deactivated book state. |
| FE06 Inventory / Book Copy Management | Internal | Provides the public availability status without exposing exact copy counts. |
| FE02 Authentication | Internal | Provides login/register routes for member-only actions. |
| FE04 Membership Management | Internal | Handles membership application after public discovery. |
| SQL Server database | Technical | Stores public book catalog data. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE01-001 | Hide inactive/deactivated books from all public search/detail views. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-002 | Guests see simple availability only: Available/Unavailable, not exact copy count. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-003 | Phase 1 public query fields are exactly `q`, `categoryId`, `authorId`, `publisherId`, `page`, and `limit`; `q` matches title or author name case-insensitively. | Review packet 2026-06-10; filter normalization 2026-07-17 | APPROVED |
| Q-FE01-004 | A non-null ISBN is visible to guests; a missing ISBN is returned as `null`. | Review packet 2026-06-10; normalization 2026-07-17 | APPROVED |
| Q-FE01-005 | Home page displays navigation/search and recent books; featured books are optional/out of scope unless manually configured. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-006 | Phase 1 canonical public endpoints are `/api/books` and `/api/books/{bookId}`; `/api/public/*` aliases are out of scope and are not part of the API contract. | User correction 2026-06-21; endpoint normalization 2026-07-17 | APPROVED |
| Q-FE01-007 | `/home`, public search, and public detail use the latest FE06-owned `BookCopies.Status` summary after FE06/FE07/FE08 transitions; FE01/FE05 remain read-only for copy state. | Nhat approval after cross-feature audit 2026-07-15 | APPROVED |
| Q-FE01-008 | Empty or omitted search text returns the default first public browse page ordered by `Title ASC, BookId ASC`. | Spec normalization 2026-07-17 | APPROVED |
| Q-FE01-009 | Pagination defaults to `page=1`, `limit=20`; valid bounds are `page>=1` and `limit=1..100`; invalid values are rejected. | Spec normalization 2026-07-17 | APPROVED |
| Q-FE01-010 | A non-positive/non-numeric book ID is a validation error; a well-formed missing or hidden ID is not found. | Spec normalization 2026-07-17 | APPROVED |
| Q-FE01-011 | Missing optional catalog metadata returns `null` and never excludes an otherwise public-visible book. | Spec normalization 2026-07-17 | APPROVED |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE01-001 | UC01-UC04 | FT01-FT04 read-only contract | Not Started |
| BR-FE01-002 | UC01 | FT01 | Not Started |
| BR-FE01-003 | UC02-UC04 | FT02-FT04 public visibility | Not Started |
| BR-FE01-004 | UC03, UC04 | FT03, FT04 safe fields | Not Started |
| BR-FE01-005 | UC02 | FT02 pagination | Not Started |
| BR-FE01-006 | UC02, UC04 | FT02, FT04 validation | Not Started |
| BR-FE01-007 | UC04 | FT04 safe not-found behavior | Not Started |
| BR-FE01-008 | UC01, UC02, UC04 | Planned availability-summary integration case | Not Started |
| BR-FE01-009 | UC01-UC04 | Planned no-public-mutation contract case | Not Started |
| BR-FE01-010 | UC03, UC04 | FT03, FT04 response redaction | Not Started |
| BR-FE01-011 | UC01, UC02, UC04 | Planned latest-copy-state integration case | Not Started |
| BR-FE01-012 | UC02, UC04 | FT02, FT04 hidden-book case | Not Started |
| BR-FE01-013 | UC02 | Planned pagination-default/boundary case | Not Started |
| BR-FE01-014 | UC02-UC04 | Planned missing-metadata fallback case | Not Started |
| FR-FE01-001 | UC01 | FT01 | Not Started |
| FR-FE01-002 | UC02 | FT02 | Not Started |
| FR-FE01-003 | UC02 | FT02 no-results case | Not Started |
| FR-FE01-004 | UC03 | FT03 | Not Started |
| FR-FE01-005 | UC04 | FT04 | Not Started |
| FR-FE01-006 | UC04 | FT04 missing/hidden case | Not Started |
| FR-FE01-007 | UC02 | Planned invalid-pagination rejection case | Not Started |
| FR-FE01-008 | UC01, UC02, UC04 | Planned FE06 availability-rule case | Not Started |
| FR-FE01-009 | UC01, UC02, UC04 | Planned FE06/FE07/FE08 transition-reflection case | Not Started |
| FR-FE01-010 | UC01, UC02, UC04 | Planned unavailable-summary redaction case | Not Started |
| FR-FE01-011 | UC02 | Planned empty-search default-browse case | Not Started |
| FR-FE01-012 | UC04 | Planned ID-validation versus not-found case | Not Started |
| FR-FE01-013 | UC02-UC04 | Planned optional-metadata null case | Not Started |
| AC-FE01-001 | UC01 | FT01 | Not Started |
| AC-FE01-002 | UC02 | FT02 matching-search case | Not Started |
| AC-FE01-003 | UC02 | FT02 no-results case | Not Started |
| AC-FE01-004 | UC03 | FT03 | Not Started |
| AC-FE01-005 | UC04 | FT04 | Not Started |
| AC-FE01-006 | UC04 | FT04 malformed/missing ID cases | Not Started |
| AC-FE01-007 | UC02, UC04 | FT02, FT04 hidden-book cases | Not Started |
| AC-FE01-008 | UC03, UC04 | FT03, FT04 response redaction | Not Started |
| AC-FE01-009 | UC01, UC02 | Planned committed-copy-transition case | Not Started |
| AC-FE01-010 | UC02 | Planned empty-search default-browse case | Not Started |
| AC-FE01-011 | UC02 | Planned invalid-pagination rejection case | Not Started |
| AC-FE01-012 | UC04 | Planned ID-validation versus not-found case | Not Started |
| AC-FE01-013 | UC02-UC04 | Planned missing-metadata null/fallback case | Not Started |

Coverage: 14/14 BR, 13/13 FR, and 13/13 AC have explicit use-case and test intent mappings.

---

## 17. Review Checklist

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Public-visible fields are approved.
- [x] Search filters and pagination behavior are approved.
- [x] Availability display policy is approved with FE06.
- [x] Hidden/deactivated book behavior is approved with FE05.
- [x] API contract is approved in SPEC.md or copied to a dedicated shared API contract file if the team reintroduces one.
- [x] Every acceptance criterion can become a test.
