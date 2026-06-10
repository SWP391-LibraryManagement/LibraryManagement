# PLAN.md - FE08 Reservation Management

Status: READY FOR REVIEW

Owner: Nhat

Updated: 2026-06-10

---

## 1. Scope

Build the Phase 1 backend slice for FE08 Reservation Management from `SPEC.md`.

Included:

- Member creates a reservation for an unavailable physical copy.
- Member views and cancels only their own reservations.
- Librarian/admin views reservations and processes the queue manually.
- Queue processing holds the copy, sets a 2-day hold window, and creates a FE10 notification request.
- Reservation actions write audit logs.

Not included:

- FE07 borrow/return implementation.
- FE10 email delivery worker.
- Frontend reservation screens.
- Automatic queue processing job.

---

## 2. Approved Decisions Used

| Decision | Plan impact |
| --- | --- |
| Reservation target is `CopyId` | `POST /api/reservations` and queue processing require `copyId`. |
| Available copies cannot be reserved | Available copy requests return a conflict and point the user to borrow instead. |
| Maximum active reservations is 3 | Service rejects the fourth active reservation for the same member. |
| Hold window is 2 calendar days | Queue processing sets `ExpiresAt` to now + 2 days. |
| Queue processing is manual in Phase 1 | Staff triggers `/api/reservations/process-queue`. |

---

## 3. Implementation Plan

### 3.1 API and Access Control

- Add `/api/reservations` routes under Express.
- Reuse FE02 token authentication.
- Enforce member-only actions for create, own list, and cancel.
- Enforce librarian/admin-only actions for list all and queue processing.

### 3.2 Create Reservation

- Validate `copyId`.
- Confirm the actor is an active user with approved membership.
- Reject available, damaged, lost, or inactive copies.
- Reject duplicate active reservations for the same copy.
- Reject when the member already has 3 active reservations.
- Insert an `ACTIVE` reservation and preserve queue order by `ReservedAt` / `QueuePosition`.

### 3.3 Member Reservation Actions

- Return only the current member's reservations from `/api/reservations/me`.
- Allow cancellation only for the owner and only while the reservation is `ACTIVE`.
- Mark cancelled records as `CANCELLED` with `CancelledAt`.

### 3.4 Staff Queue Actions

- Return reservation list with member and book/copy details.
- Select the earliest eligible `ACTIVE` reservation for the copy.
- Hold the copy by setting `BookCopies.Status = RESERVED`.
- Set `NotifiedAt` and `ExpiresAt`.
- Create a `RESERVATION_READY` notification request for FE10.

### 3.5 Tests

- Add route-level tests using in-memory repositories.
- Cover create, duplicate, available-copy rejection, active limit, owner-only cancellation, staff list, queue order, notification request, and role guards.
- Run backend Jest suite before handoff.

---

## 4. Review Notes

- This plan keeps FE08 backend-only for the current slice.
- Frontend pages should be planned separately after book/copy browsing screens exist.
- FE07 can later call FE08 queue processing when a copy is returned, but automatic triggering is out of scope for Phase 1.
