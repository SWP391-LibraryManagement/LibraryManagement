# CONTEXT.md - FE06 Inventory / Book Copy Management

# Version: 0.2.1

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Dat

# Last Updated: 2026-07-19

# Feature folder: `.sdd/specs/feat-inventory-book-copy/`

---

## 1. Feature Purpose

Inventory / Book Copy Management exists to track the physical copies of each book and their availability for borrowing and reservation.

This feature must keep three levels separate:

- FE05 owns book-level catalog metadata such as title, ISBN, author, category, publisher, and description.
- FE06 owns copy-level inventory data such as barcode, location, physical status, and availability.
- FE07/FE08 consume and update copy status through borrowing and reservation workflows.

FE06 is a Full Spec feature because wrong copy status can directly break borrowing, reservation, fines, and reporting.

---

## 2. Real-World Workflow

The typical inventory workflow:

1. A librarian views inventory for a book or the whole library.
2. The system shows physical copies, barcodes, locations, and statuses.
3. A librarian checks the status of one copy.
4. A librarian updates copy status when the copy changes state outside normal borrow/return flow.
5. A librarian/admin adds, updates, or deactivates physical copies.
6. FE07 and FE08 use the copy status to decide whether the copy can be borrowed or reserved.

---

## 3. Feature Boundary

FE06 includes:

- View inventory.
- Check book copy status.
- Update book copy availability/status.
- Manage physical book copies.
- Track barcode and shelf/location for each copy.

FE06 does not include:

- Creating or editing book metadata. That belongs to FE05.
- Borrow request approval or return processing. That belongs to FE07.
- Reservation queue processing. That belongs to FE08.
- Fine calculation for damaged/lost/overdue copies. That belongs to FE09.
- Public catalog browsing. That belongs to FE01.

---

## 4. Current Data Model Notes

The current SQL script includes:

- `Books(BookId, Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl, Status)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location, Version, CreatedAt, UpdatedAt)`
- `BorrowDetails(BorrowDetailId, RequestId, CopyId, DueDate, ReturnDate, Status)`
- `Reservations(ReservationId, UserId, CopyId, ReservedAt, Status)`

Implementation reconciliation points:

- Copy status values are standardized across FE06, FE07, and FE08.
- Current SQL has `CreatedAt`/`UpdatedAt`; FE06 additionally requires SQL `rowversion` for deterministic `If-Match` concurrency.
- Barcode uniqueness is defined in SQL and must be preserved.
- Direct manual status updates must not conflict with active borrow/reservation records.
- Effective availability is derived from `BookCopies.Status = AVAILABLE` plus parent `Books.Status = ACTIVE`; FE05/FE01 never mutate copy state.
- Manual reservation release always rejects with `RESERVATION_STATE_CONFLICT`; location validation rejects invalid values rather than normalizing them.

These decisions are reflected in `SPEC.md` v0.4.2 and are implemented with automated evidence; cross-feature owner confirmation and final integration remain open.

---

## 5. Main Use Cases From Assignment Sheet

Owner column reflects the current team redistribution.

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC25 | View Inventory | Dat |
| UC26 | Check Book Copy Status | Dat |
| UC27 | Update Book Copy Availability | Dat |
| UC28 | Manage Book Copies | Dat |

---

## 6. Feature Tests From Assignment Sheet

Owner column reflects the current team redistribution.

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT26 | View inventory | Dat |
| FT27 | Check book copy status | Dat |
| FT28 | Update book copy availability | Dat |
| FT29 | Manage book copies | Dat |

---

## 7. Key Risks

- Incorrect copy status may allow the same copy to be borrowed twice.
- Manual availability updates may override active borrowing or reservation state.
- Duplicate barcode values may break copy identification.
- Lost/damaged/deactivated copies may still appear as available if status rules are unclear.
- Inventory totals may become inconsistent with book-level reporting if derived counts are wrong.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE05 Book Management | Provides book records that copies belong to. |
| FE07 Borrowing Management | Updates copy status during borrow and return workflows. |
| FE08 Reservation Management | Uses/reserves copies and may set reserved state. |
| FE09 Fine Management | May use damaged/lost/overdue copy data to create fines. |
| FE11 User & Role Management | Provides librarian/admin permissions. |
| SQL Server database | Stores book copies and related copy transactions. |

---

## 9. Resolved Questions For Team / Teacher

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE06-001 | Allowed copy statuses: AVAILABLE, BORROWED, RESERVED, DAMAGED, LOST, INACTIVE. | Review packet 2026-06-10 | APPROVED |
| Q-FE06-002 | Staff cannot manually set BORROWED or RESERVED; those come only from FE07/FE08 flows. | Review packet 2026-06-10 | APPROVED |
| Q-FE06-003 | DELETE /api/book-copies/{id} deactivates instead of physical delete. | Review packet 2026-06-10 | APPROVED |
| Q-FE06-004 | Location is optional in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE06-005 | Copy condition is not separate from status in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE06-006 | Create/update/deactivate/status-change actions write AuditLogs. | Review packet 2026-06-10 | APPROVED |

---

## 10. Notes For Implementation Later

- Existing FE06 backend/tests are prototype artifacts and must be reconciled only after revision v0.4.0 is reviewed.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until the revised contract is approved and decomposed.
- Barcode uniqueness must be enforced.
- Status transitions must be checked against FE07 and FE08 active records.
- Availability should be derived from copy statuses, not guessed in UI.
