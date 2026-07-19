# CONTEXT.md - FE01 Public / Browse

# Version: 0.1.0

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Dung

# Last Updated: 2026-06-10

# Feature folder: `.sdd/specs/feat-public-browse/`

---

## 1. Feature Purpose

Public / Browse exists so guests can discover library books before logging in or becoming members.

This feature must keep four things clear:

- Public users can view safe catalog information.
- Public search and browse use the official book catalog.
- Public pages do not expose protected user, borrowing, reservation, or fine data.
- Public browse remains read-only and does not modify book or inventory records.

FE01 is a Standard Spec feature because it is user-facing and depends on catalog correctness, but it does not own core catalog management.

---

## 2. Real-World Workflow

The typical public browsing workflow:

1. A guest opens the library website.
2. The system displays a home page with available public navigation.
3. The guest searches or browses books.
4. The system returns matching public book information.
5. The guest opens a book result.
6. The system displays safe book details and high-level availability information.
7. If the guest wants member-only actions, the system routes them to authentication or membership flows.

---

## 3. Feature Boundary

FE01 includes:

- View home page.
- Search public book catalog.
- View public book information.
- View public book details.
- Read-only display of categories, authors, publishers, covers, and high-level availability.

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
- Availability may need to be calculated from `BookCopies.Status = AVAILABLE`.
- Public responses must not expose internal inventory fields such as exact barcode policy if the team decides barcode is staff-only.
- Search behavior needs approved matching rules: title only, author/category/publisher, ISBN, or all.
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
- Search results may mislead guests if availability is not calculated consistently with FE06.
- Public endpoints may expose protected data if response DTOs are not controlled.
- Empty, invalid, or very broad searches may degrade performance without pagination.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE05 Book Management | Owns official book metadata and active/deactivated catalog state. |
| FE06 Inventory / Book Copy Management | Provides availability counts/status for public display. |
| FE02 Authentication | Provides login/register routing for member-only actions. |
| FE04 Membership Management | Owns membership application flow after public discovery. |
| SQL Server database | Stores books, categories, authors, publishers, and copies. |

---

## 9. Resolved Questions For Team / Teacher

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE01-001 | Hide inactive/deactivated books from all public search/detail views. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-002 | Guests see simple availability only: Available/Unavailable, not exact copy count. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-003 | Phase 1 filters: keyword, title, author, category; pagination required. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-004 | A non-null ISBN is visible to guests; a missing ISBN is returned as `null`. | Review packet 2026-06-10; normalization 2026-07-17 | APPROVED |
| Q-FE01-005 | Home page displays navigation/search and recent books; featured books are optional/out of scope unless manually configured. | Review packet 2026-06-10 | APPROVED |
| Q-FE01-008 | Missing optional catalog metadata returns `null` without excluding a public-visible book. | Spec normalization 2026-07-17 | APPROVED |

---

## 10. Notes For Implementation Later

- The baseline `SPEC.md`, `PLAN.md`, and `TASKS.md` are approved; implementation follow-up remains pending.
- Prototype behavior is not completion evidence; follow the ordered tasks and record fresh validation.
- Keep public browse endpoints read-only.
- Return only public-safe book fields.
- Search and detail behavior must stay consistent with FE05 and FE06.
