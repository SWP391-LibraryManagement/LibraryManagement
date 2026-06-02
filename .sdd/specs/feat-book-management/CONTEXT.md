# CONTEXT.md - FE05 Book Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Dung

# Last Updated: 2026-06-02

# Feature folder: `.sdd/specs/feat-book-management/`

---

## 1. Feature Purpose

Book Management exists to maintain the library's book catalog and ensure book information remains accurate, searchable, and available for borrowing operations.

This feature must keep three things consistent:

- Book metadata and catalog information.
- Book availability for members and guests.
- Relationships between books, authors, categories, publishers, and physical copies.

Because books are the core asset of the library system, this feature is treated as a Full Spec feature.

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

- `Books(BookId, ISBN, Title, Description, PublishYear, CategoryId, PublisherId, Status)`
- `Authors(AuthorId, AuthorName)`
- `BookAuthors(BookId, AuthorId)`
- `Categories(CategoryId, CategoryName)`
- `Publishers(PublisherId, PublisherName)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`

Potential issues to review:

- ISBN uniqueness constraints must be enforced.
- Multiple authors per book require many-to-many relationships.
- Soft delete should be used instead of physical deletion.
- Book status values should be standardized (ACTIVE, INACTIVE).
- Search performance may require indexing on ISBN, Title, and Author.

These are not blockers for drafting but must be validated before implementation.

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
- Deactivating books without checking related inventory may impact borrowing operations.
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

## 9. Open Questions For Team / Teacher

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE05-001 | Is ISBN mandatory for every book? | Team/Teacher | Open |
| Q-FE05-002 | Can multiple books share the same title? | Team/Teacher | Open |
| Q-FE05-003 | Should deactivated books remain searchable? | Team/Teacher | Open |
| Q-FE05-004 | Is soft delete required for books? | Team/Teacher | Open |
| Q-FE05-005 | Can a book belong to multiple categories? | Team/Teacher | Open |
| Q-FE05-006 | Should book cover images be stored in database or file storage? | Team/Teacher | Open |

---

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- ISBN validation must be enforced on the server.
- Soft delete is preferred over physical deletion.
- Search APIs should support pagination and filtering.
- Every API endpoint must validate role and input on the server.