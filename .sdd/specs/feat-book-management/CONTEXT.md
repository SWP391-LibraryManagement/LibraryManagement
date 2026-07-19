# CONTEXT.md - FE05 Book Management

# Version: 0.2.0

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Dung

# Last Updated: 2026-07-16

# Feature folder: `.sdd/specs/feat-book-management/`

---

## 1. Feature Purpose

Book Management exists to maintain the library's book catalog and ensure book information remains accurate, searchable, and available for borrowing operations.

This feature must keep three things consistent:

- Book metadata and catalog information.
- Book availability for members and guests.
- Relationships between books, authors, categories, publishers, and physical copies.

FE05 is a Standard Spec feature in the Master Feature List. It still needs clear business rules because catalog data is used by inventory, borrowing, reservation, and reporting features.

---

## 2. Real-World Workflow

The typical library workflow:

1. A librarian adds a new book into the library catalog.
2. The system validates required information and uniqueness constraints (e.g., ISBN).
3. The book becomes available for searching and viewing.
4. Guests and members can search for books and view details.
5. Librarians can update book information when necessary.
6. Librarians may deactivate books that are no longer available or should not appear in circulation.
7. Inventory Management maintains the physical copies associated with each book.
8. Borrowing and Reservation Management use book information to support borrowing and reservation operations.

---

## 3. Feature Boundary

FE05 includes:

- Search books.
- View book details.
- View book list.
- Add new books.
- Update book information.
- Deactivate books.
- Manage book catalog metadata.

FE05 does not include:

- Physical copy management. That belongs to FE06.
- Borrowing workflow. That belongs to FE07.
- Reservation queue management. That belongs to FE08.
- Fine management. That belongs to FE09.
- User and role management. That belongs to FE11.

---

## 4. Current Data Model Notes

The current SQL design includes:

- `Books(BookId, Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl, Status)`
- `Authors(AuthorId, AuthorName)`
- `Categories(CategoryId, CategoryName)`
- `Publishers(PublisherId, PublisherName)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`

Implementation reconciliation points:

- ISBN uniqueness constraints must be enforced.
- The current SQL supports one author per book; multiple authors would require a later schema change.
- Status-based deactivation must be used instead of physical deletion.
- Current SQL includes `Books.Status = ACTIVE|INACTIVE`; FE05 deactivation/reactivation changes only this field and leaves FE06 copy state untouched.
- FE05 availability is read-only and derived from `Books.Status` plus FE06-owned `BookCopies.Status`; FE05 has no copy-status mutation endpoint.
- Existing-book mutations require SQL `rowversion`/`If-Match` to reject stale updates deterministically.
- Search performance may require indexing on ISBN, Title, and Author.

These decisions are reflected in `SPEC.md` v0.5.0 and must be reconciled against the existing prototype before implementation can be considered complete.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC17 | View Book Details (Guest) | Dung |
| UC18 | Search Books (Guest) | Dung |
| UC19 | Search Books (Member) | Dung |
| UC20 | View Book Details (Member) | Dung |
| UC21 | View Book List | Dung |
| UC22 | Add Book | Dung |
| UC23 | Update Book Information | Dung |
| UC24 | Deactivate Book | Dung |

---

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT18 | Search books (Guest) | Dung |
| FT19 | View book details (Guest) | Dung |
| FT20 | Search books (Member) | Dung |
| FT21 | View book details (Member) | Dung |
| FT22 | View book list | Dung |
| FT23 | Add book | Dung |
| FT24 | Update book information | Dung |
| FT25 | Deactivate book | Dung |

---

## 7. Key Risks

- Duplicate ISBN records may create catalog inconsistencies.
- Incorrect book metadata may affect searching and reporting.
- Deactivating books hides the catalog record from public browse while keeping copy, borrowing, reservation, and history records unchanged.
- Search performance may degrade with large numbers of books.
- Concurrent updates may overwrite book information if version control is not considered.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE02 Authentication | Identifies current user and permissions. |
| FE06 Inventory / Book Copy Management | Owns physical book copies. |
| FE07 Borrowing Management | Uses book information during borrowing. |
| FE08 Reservation Management | Uses book information for reservations. |
| FE11 User & Role Management | Controls librarian permissions. |

---

## 9. Resolved Questions For Team / Teacher

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE05-001 | ISBN is optional but must be unique when provided. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-002 | Multiple books can share the same title. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-003 | Deactivated books are hidden from public search but visible in staff/admin management views. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-004 | Soft delete/deactivation is required; no physical delete in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-005 | A book belongs to one category in Phase 1; many-to-many categories are future work. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-006 | Cover images are stored as URL/path text, not binary database content. | Review packet 2026-06-10 | APPROVED |
| Q-FE05-007 | Deactivation hides the book from public catalog even when copies are borrowed or reserved; history and copy records remain unchanged. | User correction 2026-06-21 | APPROVED |
| Q-FE05-008 | Staff use dedicated deactivate/reactivate commands for `Books.Status`; metadata update does not change status, and public browse hides `INACTIVE` books. | Nhat approval after cross-feature audit 2026-07-15 | APPROVED |

---

## 10. Notes For Implementation Later

- The baseline `SPEC.md`, `PLAN.md`, and `TASKS.md` are approved; implement only the ordered task currently in scope.
- Prototype behavior is not completion evidence; record fresh focused validation for each task.
- ISBN validation must be enforced on the server.
- Status-based deactivation is required; physical deletion is forbidden in Phase 1.
- Search APIs should support pagination and filtering.
- Every API endpoint must validate role and input on the server.
