# CONTEXT.md - FE06 Inventory / Book Copy Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Long

# Last Updated: 2026-06-02

# Feature folder: `.sdd/specs/feat-inventory-book-copy/`

---

## 1. Feature Purpose

Inventory / Book Copy Management exists to track physical copies of books in the library.

This feature keeps the library's physical inventory accurate by managing each copy's barcode, location, and availability status. It supports borrowing, reservation, reporting, and daily librarian operations.

Because copy status affects whether a book can be borrowed or reserved, this feature is treated as a Full Spec feature.

---

## 2. Real-World Workflow

1. A librarian views the current inventory of books and physical copies.
2. The librarian checks a specific copy by barcode, book, location, or status.
3. The librarian adds new physical copies when the library receives more copies of an existing book.
4. The librarian updates copy metadata such as barcode or shelf location when needed.
5. The librarian updates copy availability/status when a copy is unavailable, damaged, lost, reserved, or restored.
6. Other features use the copy status to decide whether a copy can be borrowed, reserved, or reported.

---

## 3. Feature Boundary

FE06 includes:

- View inventory.
- Check book copy status.
- Update book copy availability/status.
- Manage physical book copies, barcode, location, and status.

FE06 does not include:

- Creating or editing book-level metadata such as title, author, publisher, category, ISBN, or cover. That belongs to FE05.
- Borrow approval, return processing, renewal, or borrowing history. That belongs to FE07.
- Reservation queue ownership. That belongs to FE08.
- Fine calculation or fine payment. That belongs to FE09.
- Reporting dashboards. That belongs to FE12.

---

## 4. Current Data Model Notes

The current SQL script includes:

- `Books(BookId, Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`
- `BorrowDetails(BorrowDetailId, RequestId, CopyId, DueDate, ReturnDate, Status)`
- `Reservations(ReservationId, UserId, CopyId, ReservedAt, Status)`
- `AuditLogs(LogId, UserId, Action, CreatedAt)`

Current sample copy statuses:

- `AVAILABLE`
- `BORROWED`
- `RESERVED`

Potential issues to review:

- The current schema does not define an approved list of copy status values.
- The current schema has no `CreatedAt`, `UpdatedAt`, or `IsDeleted` field for `BookCopies`.
- The current schema does not store who updated a copy status.
- If the team needs damaged/lost/inactive copies, status values such as `DAMAGED`, `LOST`, or `INACTIVE` must be approved before implementation.

These are not blockers for drafting, but they must be resolved before implementation.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC25 | View Inventory | Long |
| UC26 | Check Book Copy Status | Long |
| UC27 | Update Book Copy Availability | Long |
| UC28 | Manage Book Copies | Long |

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT26 | View inventory | Long |
| FT27 | Check book copy status | Long |
| FT28 | Update book copy availability | Long |
| FT29 | Manage book copies | Long |

---

## 7. Key Risks

- Incorrect copy status can allow borrowing an unavailable copy.
- Updating a copy status without checking active borrow/reservation data can corrupt FE07 or FE08 workflows.
- Duplicate barcode values can make physical copy lookup unreliable.
- Hard deleting copies can break borrow, reservation, fine, and audit history.
- Status values can become inconsistent if they are not defined and validated.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE02 Authentication | Identifies the current actor. |
| FE05 Book Management | Provides book-level records that copies belong to. |
| FE07 Borrowing Management | Uses copy status and updates copies when borrow/return happens. |
| FE08 Reservation Management | Uses copy status and may hold copies for reservations. |
| FE09 Fine Management | May depend on lost/damaged copy status when fines are created. |
| FE11 User & Role Management | Provides librarian/admin permissions. |
| FE12 Reporting & Statistics | Uses inventory data for inventory reports. |

---

## 9. Open Questions For Team / Teacher

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE06-001 | What is the approved list of `BookCopies.Status` values? | Team/DB owner | Open |
| Q-FE06-002 | Should FE06 support `DAMAGED`, `LOST`, or `INACTIVE` status values? | Team/Teacher | Open |
| Q-FE06-003 | Can librarians add book copies only for existing books, or can they also create book metadata from this screen? | Team | Open |
| Q-FE06-004 | Should copy deletion be forbidden and replaced with `INACTIVE` status? | Team/Teacher | Open |
| Q-FE06-005 | Which status transitions are allowed manually, and which must be controlled only by FE07/FE08? | Team/Teacher | Open |

---

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- Barcode uniqueness must be enforced.
- Copy status updates must validate active borrow and reservation records.
- Protected inventory actions must check role and input on the server.
