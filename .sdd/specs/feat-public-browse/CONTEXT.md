# CONTEXT.md - FE01 Public / Browse

# Version: 0.1.0

# Status: DRAFT

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
- Pagination and empty-result behavior should be consistent with FE05.

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

## 9. Open Questions For Team / Teacher

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE01-001 | Should inactive/deactivated books be hidden from public search? | Team/Teacher | Open |
| Q-FE01-002 | Which fields are visible to guests on public book details? | Team/Teacher | Open |
| Q-FE01-003 | Should guests see exact available copy count or only available/unavailable? | Team/Teacher | Open |
| Q-FE01-004 | Which search filters are required for Phase 1: title, author, category, publisher, ISBN? | Team/Teacher | Open |
| Q-FE01-005 | Should home page show featured/recent books or only navigation/search? | Team/Teacher | Open |

---

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed and approved.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- Keep public browse endpoints read-only.
- Return only public-safe book fields.
- Search and detail behavior must stay consistent with FE05 and FE06.
