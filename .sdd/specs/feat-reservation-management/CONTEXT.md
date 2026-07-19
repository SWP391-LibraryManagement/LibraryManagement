# CONTEXT.md - FE08 Reservation Management

# Version: 0.2.2

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Nhat

# Last Updated: 2026-07-19

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
5. A librarian/admin manually selects the next eligible reservation for a specific available copy.
6. The system triggers a book available notification.
7. The member borrows the book within the allowed time or the reservation expires/cancels.

---

## 3. Feature Boundary

FE08 includes:

- Reserve book.
- Member-safe candidate search and selection for physical copies.
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

- Phase 1 intentionally reserves by physical `CopyId`; book-level reservation is deferred.
- Current schema includes `QueuePosition`, `ExpiresAt`, `NotifiedAt`, `CancelledAt`, and `Status`; notification/expiry timestamps remain immutable history after terminal transitions, `CancelledAt` is cancellation-only, and fulfillment uses `Status = FULFILLED` with no separate `FulfilledAt` field.
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
- Copy-level reservation is a deliberate Phase 1 constraint; reserving any copy of a book is deferred.
- A held copy is protected by FE07 priority checks and may be borrowed only by the notified reservation owner.
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

## 9. Resolved Questions For Team / Teacher

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE08-001 | Reservation targets physical copy CopyId in Phase 1. | Review packet 2026-06-10 | APPROVED |
| Q-FE08-002 | Member cannot reserve when a copy is currently available. | Review packet 2026-06-10 | APPROVED |
| Q-FE08-003 | Maximum 3 active reservations per member. | Review packet 2026-06-10 | APPROVED |
| Q-FE08-004 | Notified reservation stays valid for 2 calendar days. | Review packet 2026-06-10 | APPROVED |
| Q-FE08-005 | Queue processing is manual by librarian in Phase 1; automatic trigger is future work. | Review packet 2026-06-10 | APPROVED |
| Q-FE08-006 | Ineligible active reservations are skipped for the current run and remain active for a later manual retry. | Nhat normalization review 2026-07-17 | APPROVED |
| Q-FE08-007 | No eligible queue entry returns no selection and leaves copy/reservation state unchanged. | Nhat normalization review 2026-07-17 | APPROVED |
| Q-FE08-008 | FE10 notification failure preserves the committed hold and writes a failure audit; no automatic retry worker is in Phase 1. | Nhat normalization review 2026-07-17 | APPROVED |
| Q-FE08-009 | Notification/expiry timestamps survive terminal transitions; only cancelled rows have `CancelledAt`. | Spec normalization 2026-07-17 | APPROVED |
| Q-FE08-011 | Option A: a protected member-only candidate API returns a six-field redacted row per active-book `BORROWED`/`RESERVED` copy; search and pagination are server-owned and `POST /api/reservations { copyId }` remains authoritative. | FE08 design approval 2026-07-19 | APPROVED |

---

## 10. Notes For Implementation Later

- `SPEC.md` v0.4.4 is baseline-approved; lifecycle normalization and the member-safe candidate slice are automated-validated, with human integration still pending.
- `PLAN.md` and `TASKS.md` record the historical B7 slice separately from the v0.4.3/v0.4.4 reconciliation tasks.
- Queue processing should be transactional.
- Members must never cancel another member's reservation.
