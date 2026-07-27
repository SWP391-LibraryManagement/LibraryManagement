# SPEC.md - FE01 Public / Browse

# Version: 0.4.0

# Status: APPROVED - BASELINE 2026-07-17; RESPONSIVE ADDENDUM H3-APPROVED, MERGED PR #59; HOMEPAGE POLISH IMPLEMENTED LOCALLY, HUMAN ACCEPTANCE PENDING

# Owner: Dung

# Last Updated: 2026-07-27

# Feature ID: FE01

# Feature folder: `.sdd/specs/feat-public-browse/`

> Current delivery status (2026-07-26): `COMPLETE` for the approved Phase 1/2
> baseline and the bounded responsive HomePage addendum merged through PR #59.
> FE01-T009 through FE01-T012 Homepage polish is implemented locally with green
> automated evidence; human visual, navigation, and role-visibility acceptance
> remains a separate release decision.
> `TASKS.md` and `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> are authoritative for current implementation state. Older `Not Started`,
> `PARTIAL`, `READY FOR REVIEW`, or pending-review labels retained below are
> historical planning/evidence snapshots, not the current delivery state.

> Source of truth for FE01 Public / Browse. Revision v0.3.0 is approved as the baseline after its availability dependency was made explicit.

> Responsive addendum boundary: the mobile navigation and narrow-screen layout
> requirement below is integrated through PR #59. The remaining release review
> is human visual acceptance of the current main candidate, not an implementation
> or merge gate.

---

## 1. Feature Overview

### 1.1 Feature Name

Public / Browse

### 1.2 Business Context

Guests need a simple way to discover books before creating an account or applying for membership. A public catalog reduces manual questions for librarians and helps potential members understand what the library offers.

Public browsing must be safe and read-only. It may use high-level availability internally to choose the correct owning workflow, but the HomePage presentation for Guest and Member does not render availability labels or protected inventory details.

### 1.3 Goal / Outcome

The system shall:

- Allow guests to view the home page.
- Allow guests to search the public book catalog.
- Allow guests to view public book information.
- Allow guests to view public book details.
- Use the latest public availability after copy state changes for correct action routing while limiting visible HomePage status labels to Librarian/Admin.
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
| Librarian | Library staff | May use the same public-safe reads; FE01 gives no write permission and catalog management belongs to FE05. |
| Admin | System administrator | May use the same public-safe reads; FE01 gives no write permission and management belongs to FE05/FE11. |

### 2.1 Homepage Role Continuation Matrix

The header contains library branding and account actions only. It does not render the former `Khám phá sách`, `Hội viên`/`Thư viện của tôi`/`Nghiệp vụ`, `Về thư viện`, or `Hỗ trợ` navigation groups. Role-owned destinations remain available through the page's role continuation panel and other owning controls, derived from the account's single FE11 role.

| Audience | Connected destinations |
| -------- | ---------------------- |
| Guest | `/login`, `/register`, and the public catalog section. |
| Member | `/membership`, `/borrowing/new`, `/borrowing/history`, and `/reservations/mine`. |
| Librarian | `/membership`, `/librarian/borrow-requests`, `/librarian/returns`, and `/librarian/inventory`. |
| Admin | `/admin/users`, `/membership`, `/reports/users`, and `/reports/inventory`. |

The public library experience is available at `/home` for Guest and Admin through the role-aware home route, and directly at `/homepage` for every actor. Member/Librarian `/home` remains their role dashboard. FE01 links only to existing owning screens and does not duplicate their protected operations.

---

## 3. Preconditions

The feature can only start when:

- PRE-FE01-001: Public catalog data exists in `Books`.
- PRE-FE01-002: Searchable public metadata is available: a title, author name when present, and the required `BookId`; ISBN remains FE05 staff metadata and is excluded from FE01 search and responses.
- PRE-FE01-003: Public endpoints are available without authentication.
- PRE-FE01-004: Returned fields are restricted to public-safe catalog data.
- PRE-FE01-005: Pagination defaults are defined for search results.

---

## 4. Main Flows

### MF-FE01-001: View Home Page

1. Guest opens the public home page.
2. The system loads public navigation, search entry points, and the recent public books using the default browse ordering.
3. The system displays login/register links for member-only actions.
4. At supported mobile widths, the system keeps the same browse and account/member actions reachable through an accessible navigation menu.
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
4. The system shows title, author, category, publisher, publish year, and cover; Guest/Member HomePage presentation omits the availability label.

### MF-FE01-004: View Book Details

1. Guest opens the book detail page.
2. The system retrieves detailed public book data.
3. The system retrieves the approved high-level availability information from inventory.
4. The system displays description and public metadata.
5. The system presents member-only actions as navigation to login/register or membership flows.

### MF-FE01-005: Reflect Current Availability On Home/Search

1. An owning workflow changes a physical copy state through FE06, FE07, or FE08.
2. Guest opens `/home`, or any actor opens the public library view at `/homepage`, search, or book detail.
3. The system reads the latest committed active catalog records and FE06-owned copy states.
4. Librarian/Admin HomePage presentation displays `Còn sách` when at least one copy is `AVAILABLE`, otherwise `Không khả dụng`; Guest/Member presentation renders neither label.
5. FE01 and FE05 do not modify copy status while producing this summary.

### MF-FE01-006: Continue To A Role-Owned Workflow

1. The actor opens a role continuation action or book action.
2. The system derives the audience from the account's single `ADMIN`, `LIBRARIAN`, or `MEMBER` role; an unauthenticated actor is Guest.
3. The system shows the audience label and destinations defined in the Homepage Role Continuation Matrix.
4. A public-section action scrolls or filters within Homepage; a protected action navigates to the registered owning route.
5. The owning feature and its route guard enforce authorization. FE01 does not simulate completion or perform the protected mutation.

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
- BR-FE01-004: Guest and Member public list/detail responses exclude ISBN and all staff-only metadata; Librarian/Admin may access ISBN only through the server-authorized FE05 management projection.
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
- BR-FE01-015: FE11 accounts hold exactly one role. Public-book actions route `MEMBER` to member-owned borrowing/reservation workflows and route `ADMIN`/`LIBRARIAN` to staff-owned management workflows.
- BR-FE01-016: HomePage must not render availability badges to Guest or Member. Guest receives a generic login continuation without availability disclosure; an authenticated `MEMBER` must see the explicit owning action selected from current availability (`Mượn sách này` to FE07 or `Đặt chỗ sách này` to FE08). Librarian/Admin may see the high-level status and explicit FE05/FE06 management action.
- BR-FE01-017: The HomePage header must not render the removed `Khám phá sách`, audience service, `Về thư viện`, or `Hỗ trợ` navigation groups on desktop or mobile.

---

## 7. Functional Requirements

- FR-FE01-001: When a guest opens the home page, the system shall display the public home page without requiring login.
- FR-FE01-002: When a guest searches books with valid BR-FE01-006 criteria, the system shall return public-visible matching books using only the approved query fields.
- FR-FE01-003: If no public books match the search criteria, then the system shall return an empty result with a clear message.
- FR-FE01-004: When a Guest or Member views book information, the system shall return only public-safe summary fields and shall not return ISBN.
- FR-FE01-005: When a Guest or Member views book details, the system shall return public-safe detailed book fields and shall not return ISBN; an authenticated Librarian/Admin may receive ISBN only from the FE05 staff projection.
- FR-FE01-006: If a requested book does not exist or is not public-visible, then the system shall return a not-found response.
- FR-FE01-007: When search page or limit values are invalid, the system shall reject them with a validation response and shall not silently normalize them.
- FR-FE01-008: The system shall derive availability using approved inventory status rules rather than hardcoded values whenever it selects an owning route or presents the status to Librarian/Admin.
- FR-FE01-009: When an owning FE06/FE07/FE08 workflow changes copy state, HomePage shall use the latest committed state for staff presentation and correct Member workflow routing.
- FR-FE01-010: If a book has no available copies, Librarian/Admin HomePage may display `Không khả dụng`; Guest/Member HomePage shall omit the status without exposing copy barcodes, locations, or borrower data.
- FR-FE01-011: When search text is empty or omitted, the system shall return the default public browse page using `page=1`, `limit=20`, and `Title ASC, BookId ASC`.
- FR-FE01-012: If a book ID is not a positive integer, the system shall return a validation error; if the positive ID is missing or hidden, the system shall return not found.
- FR-FE01-013: When optional author, category, publisher, or cover data is missing, the system shall keep the public-visible book in the response and return `null` for the missing field.
- FR-FE01-014: When an authenticated account opens HomePage, the system shall use its single FE11 role: `MEMBER` routes to FE07/FE08 member workflows, while `LIBRARIAN` or `ADMIN` routes to FE05/FE06 staff workflows.
- FR-FE01-015: The public footer shall present compact responsive contact information, keep phone/email readable without avoidable desktop wrapping, and open readable, dismissible information for Privacy, Terms, and browser storage controls without navigating to an empty link.
- FR-FE01-016: The public home header shall show library branding and account actions without the former `Khám phá sách`, audience service, `Về thư viện`, or `Hỗ trợ` navigation groups; role continuation actions shall remain connected to registered owning routes through the account's single role.
- FR-FE01-017: The home page shall provide additional catalog-topic, library-journey, and role-aware continuation sections whose actions reuse current public filters and owning feature routes.
- FR-FE01-018: Guest and Member shall not see availability badges in HomePage list, search, information-panel, or detail-modal presentations. Guest shall see a generic login continuation; Member shall see `Mượn sách này` for `AVAILABLE` and `Đặt chỗ sách này` otherwise, with `bookId` passed to the owning FE07/FE08 route. Librarian/Admin accounts retain high-level status and management actions.

---

## 8. Acceptance Criteria

- AC-FE01-001: Given a guest, when the guest opens the home page, then the system displays public search/browse entry points and recent public books when catalog data exists; featured-book content is not required in Phase 1.
- AC-FE01-002: Given public-visible books exist, when the guest searches by keyword, then matching books are returned.
- AC-FE01-003: Given no books match the keyword, when the guest searches, then an empty result message is shown.
- AC-FE01-004: Given a valid public book, when a Guest or Member views book information, then summary metadata is shown without ISBN.
- AC-FE01-005: Given a valid public book, when a Guest or Member views book details from HomePage, then detailed public metadata is shown without ISBN or an availability label.
- AC-FE01-006: Given an invalid book ID, when the guest opens details, then a not-found response is returned.
- AC-FE01-007: Given a deactivated/hidden book, when the guest searches or opens details, then the book is not exposed publicly.
- AC-FE01-008: Given a public request, when the system responds, then no protected user, borrowing, reservation, fine, or audit data is included.
- AC-FE01-009: Given an owning workflow commits a copy transition, when Librarian/Admin opens HomePage then the latest high-level status is shown; Guest/Member sees no status label while Member routing still follows the latest state.
- AC-FE01-010: Given an empty search, when a guest submits it, then the first default browse page is returned with `page=1`, `limit=20`, and `Title ASC, BookId ASC`.
- AC-FE01-011: Given invalid `page` or `limit`, when the guest searches, then the system returns a validation response and does not query with normalized values.
- AC-FE01-012: Given a non-numeric or non-positive book ID, when details are requested, then a validation response is returned; a well-formed missing/hidden ID returns not found.
- AC-FE01-013: Given a public-visible book with missing optional metadata, when it is listed or opened, then the book remains present and each missing field is returned as `null` for safe UI fallback.
- AC-FE01-014: Given an account whose single role is `LIBRARIAN` or `ADMIN`, when the account opens a public book action, then an available book routes to FE05 management and an unavailable book routes to FE06 inventory inspection; a `MEMBER` routes only to member-owned workflows.
- AC-FE01-015: Given a user on the public home page, when the footer is displayed, then phone, email, and address remain readable at the supported width; selecting Privacy, Terms, or Cookie opens matching information in an accessible dialog that can be closed by its controls, backdrop, or Escape key.
- AC-FE01-016: Given a Guest, Member, Librarian, or Admin on the public home page, when the header is displayed, then none of the four removed navigation groups is rendered on desktop or mobile, while branding, account actions, and role continuation destinations remain available.
- AC-FE01-017: Given a Guest, Member, Librarian, or Admin viewing the extended home page, when the user selects a topic or role continuation action, then the catalog is filtered or the user is routed to an existing screen valid for that audience without simulated data or success.
- AC-FE01-018: Given the same book is viewed on HomePage by each role, then Guest sees no availability badge and a generic login continuation; Member sees no badge but receives the explicit FE07 borrow or FE08 reservation action; Librarian/Admin sees the approved high-level status and staff management action.

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
| EC-FE01-008 | Book has no available copies | Hide the HomePage status from Guest/Member; show `Không khả dụng` only to Librarian/Admin. |
| EC-FE01-009 | Optional category/author/publisher/cover metadata missing | Keep the public-visible book, return `null` for the missing field, and let the UI show a safe fallback. ISBN is never part of the public projection. |
| EC-FE01-010 | Database query fails | Return safe generic error without stack trace. |
| EC-FE01-011 | Copy status changed shortly before public request | Return the latest committed availability summary from the database. |
| EC-FE01-012 | Account role is Admin or Librarian | Do not route the account to a Member-only mutation screen. |

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
| GET | `/api/books` | Guest/Member/Librarian/Admin | Query: `q?, categoryId?, authorId?, publisherId?, page=1, limit=20` | `{ data: PublicBookSummary[], pagination: { page, limit, total, totalPages } }` | `q` matches title/author only. Public summaries exclude ISBN; authentication does not widen this list response. Top-level keys are exactly `data` and `pagination`; `page>=1`, `limit=1..100`; invalid values are rejected before query; empty `q` returns default browse results. |
| GET | `/api/books/{bookId}` | Guest/Member/Librarian/Admin | - | Public book detail for Guest/Member; authenticated management detail for Librarian/Admin | Guest/Member receive the FE01 safe projection without ISBN. ISBN and other staff-only fields may be returned only after server-side FE11 single-role authorization for FE05 management; inactive records remain hidden from Guest/Member. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE01-SEC-001: Public endpoints must validate all query and route parameters.
- NFR-FE01-SEC-002: Guest/Member public responses must not include ISBN, protected user, borrowing, reservation, fine, audit, or staff-only inventory data.
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
- NFR-FE01-UX-002: HomePage book presentation must hide availability from Guest/Member and clearly distinguish the high-level state when shown to Librarian/Admin.
- NFR-FE01-UX-003: Footer contact details must remain compact on desktop, keep the email on one line at supported desktop widths, and reflow without horizontal overflow at tablet and mobile widths.
- NFR-FE01-UX-004: The simplified public header must remain responsive and keep account actions usable without rendering empty navigation space or the removed mobile accordions.
- NFR-FE01-UX-005: Extended home sections must remain responsive, provide on-view and interaction feedback, and become immediately visible when reduced motion is requested. The four membership benefit cards must form an aligned grid: cards in the same row share the same top edge and columns use equal widths without a permanent stagger offset.

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
| FE11 User & Role Management | Internal | Supplies the account's current single role used for public-account actions. |
| SQL Server database | Technical | Stores public book catalog data. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE01-001 | Hide inactive/deactivated books from all public search/detail views. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-002 | Availability badges remain staff-only. Guest receives a generic login continuation; Member receives an explicit `Mượn sách này` or `Đặt chỗ sách này` action connected to FE07/FE08 using the selected `bookId`; Librarian/Admin receives the high-level state and FE05/FE06 action. No exact copy count is exposed. | Product-owner correction 2026-07-27 (supersedes the 2026-07-25 action-label decision) | APPROVED |
| Q-FE01-003 | Phase 1 public query fields are exactly `q`, `categoryId`, `authorId`, `publisherId`, `page`, and `limit`; `q` matches title or author name case-insensitively. | Review packet 2026-06-10; filter normalization 2026-07-17 | APPROVED |
| Q-FE01-004 | ISBN is excluded from Guest/Member HomePage search, public list, and public detail. It remains FE05 management metadata visible/searchable only to authenticated Librarian/Admin users. | Product-owner correction 2026-07-27 (supersedes review packet 2026-06-10) | APPROVED |
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
| BR-FE01-001..007 | UC01-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Complete |
| BR-FE01-008..012 | UC01-UC04 | `bookAvailabilityRepository.test.js`; `publicBrowseAvailability.sqltest.js`; `bookRoutes.test.js` | Complete |
| BR-FE01-013..014 | UC02-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Complete |
| BR-FE01-015 | UC01-UC04 | `homeBookActions.test.js` single-role Member/staff cases plus defensive legacy case | Complete |
| BR-FE01-016 | UC01-UC04 | `publicBrowseFrontend.test.js` availability-visibility boundary | Complete |
| BR-FE01-017 | UC01 | `publicBrowseFrontend.test.js` removed desktop/mobile header groups | Complete |
| FR-FE01-001..007 | UC01-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Complete |
| FR-FE01-008..010 | UC01, UC02, UC04 | `bookAvailabilityRepository.test.js`; `publicBrowseAvailability.sqltest.js`; `bookRoutes.test.js` | Complete |
| FR-FE01-011..013 | UC02-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Complete |
| FR-FE01-014 | UC01-UC04 | `homeBookActions.test.js` | Complete |
| FR-FE01-015 | UC01 | `publicBrowseFrontend.test.js` footer policy controls | Complete |
| FR-FE01-016 | UC01 | `publicBrowseFrontend.test.js` simplified header and retained role continuation destinations | Complete |
| FR-FE01-017 | UC01 | `publicBrowseFrontend.test.js` extended home sections | Complete |
| FR-FE01-018 | UC01-UC04 | `publicBrowseFrontend.test.js` Guest/Member versus staff presentation | Complete |
| AC-FE01-001..008 | UC01-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Complete |
| AC-FE01-009 | UC01, UC02 | `publicBrowseAvailability.sqltest.js`; `bookAvailabilityRepository.test.js` | Complete |
| AC-FE01-010..013 | UC02-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Complete |
| AC-FE01-014 | UC01-UC04 | `homeBookActions.test.js` invalid legacy Member/staff-array cases | Complete |
| AC-FE01-015 | UC01 | `publicBrowseFrontend.test.js` accessible policy dialog case | Complete |
| AC-FE01-016 | UC01 | `publicBrowseFrontend.test.js` removed header groups and retained account/role actions | Complete |
| AC-FE01-017 | UC01 | `publicBrowseFrontend.test.js` topic and role continuation actions | Complete |
| AC-FE01-018 | UC01-UC04 | `publicBrowseFrontend.test.js` role visibility cases | Complete |

Coverage: 17/17 BR, 18/18 FR, and 18/18 AC have current automated evidence mappings.

---

## 17. Review Checklist

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Public-visible fields are approved.
- [x] Search filters and pagination behavior are approved.
- [x] Availability display policy is approved with FE06.
- [x] Hidden/deactivated book behavior is approved with FE05.
- [x] API contract is approved in SPEC.md or copied to a dedicated shared API contract file if the team reintroduces one.
- [x] Every acceptance criterion can become a test.
