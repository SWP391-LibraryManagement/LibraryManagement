# CONTEXT.md - FE08 Reservation Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Nhat

# Last Updated: 2026-06-02

# Feature folder: `.sdd/specs/feat-reservation-management/`

---

## 1. Feature Purpose

Reservation Management lets members wait for unavailable books in a fair, traceable order.

The feature prevents ad-hoc manual waiting lists and helps librarians know who should be notified first when a copy becomes available.

---

## 2. Real-World Workflow

1. A member wants a book that is currently unavailable.
2. The member creates a reservation.
3. The system places the reservation into a queue.
4. A copy later becomes available, usually after return.
5. The system or librarian selects the next eligible reservation.
6. The system triggers a book available notification.
7. The member borrows the book within the allowed time or the reservation expires/cancels.

---

## 3. Feature Boundary

FE08 includes:

- Reserve book.
- Cancel reservation.
- View reservation list.
- Process reservation queue.
- Trigger book available notification requirement.

FE08 does not include:

- Borrow approval/return implementation. That belongs to FE07.
- Notification delivery implementation. That belongs to FE10.
- Fine calculation. That belongs to FE09.
- Study seat reservation. It is out of scope.

---

## 4. Current Data Model Notes

The current SQL script has:

- `Reservations(ReservationId, UserId, CopyId, ReservedAt, Status)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`

Potential issue to review:

- Current schema reserves by `CopyId`, but real reservation is often by `BookId`, because the member usually waits for any copy of a book. The team must decide whether to keep copy-level reservation or change to book-level reservation.
- Current schema has no `ExpiresAt`, `NotifiedAt`, or `FulfilledAt` fields.
- Current schema has no cancellation reason field.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC36 | Reserve Book | Nhat |
| UC37 | Cancel Reservation | Nhat |
| UC38 | View Reservation List | Nhat |
| UC39 | Process Reservation Queue | Nhat |
| UC40 | Trigger Book Available Notification | Nhat |

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT37 | Reserve book | Nhat |
| FT38 | Cancel reservation | Nhat |
| FT39 | View reservation list | Nhat |
| FT40 | Process reservation queue | Nhat |
| FT41 | Trigger book available notification | Nhat |

---

## 7. Key Risks

- Queue order can become unfair if reservation ordering is unclear.
- Reservation by `CopyId` may be too strict if any copy of the book should satisfy the reservation.
- A copy can be accidentally borrowed by another member after it should be held for the reservation.
- Renewal in FE07 can conflict with active reservations if policy is not defined.
- Notification failure can leave members unaware that the book is available.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE02 Authentication | Identifies the current actor. |
| FE04 Membership Management | Confirms whether a member is eligible to reserve. |
| FE06 Inventory / Book Copy Management | Provides book copy status. |
| FE07 Borrowing Management | Return flow can release a copy into reservation queue. |
| FE10 Notification Management | Sends book available notifications. |
| FE11 User & Role Management | Provides role permissions. |

---

## 9. Open Questions For Team / Teacher

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE08-001 | Reservation should target `BookId` or `CopyId`? | Team/DB owner | Open |
| Q-FE08-002 | Maximum active reservations per member? | Team/Teacher | Open |
| Q-FE08-003 | Reservation hold/expiry time after notification? | Team/Teacher | Open |
| Q-FE08-004 | Queue processing automatic, manual, or both? | Team/Teacher | Open |
| Q-FE08-005 | Can an active reservation block renewal in FE07? | Team/Teacher | Open |

---

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- Queue processing should be transactional.
- Members must never cancel another member's reservation.
