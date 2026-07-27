# CONTEXT.md - FE01 Public / Browse

# Version: 0.1.2

# Status: APPROVED - BASELINE 2026-07-17; HOMEPAGE ROLE/ISBN BOUNDARY ALIGNED 2026-07-27

# Owner: Dung

# Last Updated: 2026-07-27

# Feature folder: `.sdd/specs/feat-public-browse/`

---

## 1. Feature Purpose

Public / Browse exists so guests can discover library books before logging in or becoming members.

This feature must keep four things clear:

- Public users can view safe catalog information.
- Guest/Member search the official catalog by title or author; ISBN remains staff-management metadata.
- Public pages do not expose protected user, borrowing, reservation, or fine data.
- Public browse remains read-only and does not modify book or inventory records.

FE01 is a Standard Spec feature because it is user-facing and depends on catalog correctness, but it does not own core catalog management.

---

## 2. Real-World Workflow

The typical public browsing workflow:

1. A guest opens the library website.
2. The system displays a home page with available public navigation.
3. The guest searches or browses books.
4. The system returns matching public book information without ISBN.
5. The guest opens a book result.
6. The system displays safe book details without exposing availability labels to Guest/Member.
7. The system may use the latest availability internally to choose the correct owning Member workflow; Librarian/Admin may see the approved high-level status.
8. If the guest wants member-only actions, the system routes them to authentication or membership flows.

---

## 3. Feature Boundary

FE01 includes:

- View home page.
- Search public book catalog.
- Search by title or author; ISBN search belongs to FE05 Librarian/Admin management.
- View public book information and details without ISBN.
- Read-only display of categories, authors, publishers, and covers.
- Role-aware HomePage presentation: Guest/Member do not see availability labels; Librarian/Admin may see the high-level state.
- Responsive navigation, connected public sections, footer contact details, and readable policy information.

FE01 does not include:

- Creating, updating, or deactivating books. That belongs to FE05 Book Management.
- Managing physical copies, barcode, location, or detailed copy state. That belongs to FE06 Inventory / Book Copy Management.
- Borrowing books. That belongs to FE07 Borrowing Management.
- Reserving books. That belongs to FE08 Reservation Management.
- Authentication, registration, or membership approval. Those belong to FE02 and FE04.
- Admin/librarian catalog management screens.

---

## 4. Current Data Model Notes

The current SQL script already includes:

- `Books(BookId, Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl)`
- `Categories(CategoryId, CategoryName)`
- `Authors(AuthorId, AuthorName)`
- `Publishers(PublisherId, PublisherName)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`

Potential issues to review:

- The SQL script does not yet define a book active/inactive status field, while public search normally should hide inactive books.
- Availability is calculated from `BookCopies.Status = AVAILABLE`; it remains in the canonical response for workflow routing and approved staff presentation.
- Public responses must not expose ISBN or internal inventory fields such as exact barcode policy.
- Public `q` matches title or author only; FE05 staff management search may also match ISBN, category, and publisher.
- Pagination defaults to `page=1`, `limit=20`, with `page>=1`, `limit=1..100`; invalid values are rejected. Empty search returns the default first page ordered by `Title ASC, BookId ASC`.

These are not blockers for drafting, but they must be resolved before implementation.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC01 | View Home Page | Dung |
| UC02 | Search Books | Dung |
| UC03 | View Book Information | Dung |
| UC04 | View Book Details | Dung |

---

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT01 | Home page display | Dung |
| FT02 | Search books | Dung |
| FT03 | View book information | Dung |
| FT04 | View book details | Dung |

---

## 7. Key Risks

- FE01 may duplicate FE05 book management scope if write actions are accidentally added.
- Public search may expose inactive or internal-only books if filtering rules are unclear.
- Member workflow routing or staff presentation may become stale if availability is not calculated consistently with FE06.
- Public endpoints may expose protected data if response DTOs are not controlled.
- Empty, invalid, or very broad searches may degrade performance without pagination.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE05 Book Management | Owns official book metadata and active/deactivated catalog state. |
| FE06 Inventory / Book Copy Management | Provides the derived availability status for internal routing and approved Librarian/Admin HomePage presentation; exact counts remain private. |
| FE02 Authentication | Provides login/register routing for member-only actions. |
| FE04 Membership Management | Owns membership application flow after public discovery. |
| FE07 Borrowing Management | Owns Member borrow/history and Librarian/Admin request/return destinations opened from Homepage. |
| FE08 Reservation Management | Owns Member reservations and staff reservation management; FE01 only routes to an existing screen. |
| FE11 User & Role Management | Supplies role precedence and Admin user-management destinations. |
| FE12 Reporting & Statistics | Owns Librarian/Admin report destinations exposed by role-aware Homepage actions. |
| SQL Server database | Stores books, categories, authors, publishers, and copies. |

---

## 9. Resolved Questions For Team / Teacher

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE01-001 | Hide inactive/deactivated books from all public search/detail views. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-002 | Availability badges are staff-only. Guest uses a generic login continuation; Member sees the explicit FE07 borrow or FE08 reservation action selected from current availability; Librarian/Admin sees high-level status and management actions. No exact copy count is exposed. | Product-owner correction 2026-07-27, superseding the 2026-07-25 action-label decision | APPROVED |
| Q-FE01-003 | Phase 1 public q matches title or author; approved ID filters and pagination remain required. | Review packet 2026-06-10; product-owner clarification 2026-07-27 | APPROVED |
| Q-FE01-004 | ISBN is excluded from Guest/Member HomePage search, public list, and public detail; it remains visible/searchable only in authenticated Librarian/Admin FE05 management. | Product-owner correction 2026-07-27 (supersedes review packet 2026-06-10) | APPROVED |
| Q-FE01-005 | Home page displays navigation/search and recent books; featured books are optional/out of scope unless manually configured. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-008 | Missing optional catalog metadata returns `null` without excluding a public-visible book. | Spec normalization 2026-07-17 | APPROVED |

---

## 10. Notes For Implementation Later

- The FE01 baseline, responsive addendum, and local Homepage polish tasks are implemented with automated evidence; current-main human visual/navigation acceptance remains a release-level review.
- Prototype behavior is not completion evidence; use the focused tests, traceability gate, and recorded human review for final acceptance.
- Keep public browse endpoints read-only.
- Return only public-safe book fields.
- Search and detail behavior must stay consistent with FE05 and FE06.
