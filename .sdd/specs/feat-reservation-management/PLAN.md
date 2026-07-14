# PLAN.md - FE08 Reservation Management

Status: IN PROGRESS

Owner: Nhat

Updated: 2026-07-15

---

## 1. Scope

Maintain the approved Phase 1 FE08 backend and frontend reservation slice from `SPEC.md`.

Included:

- Existing member and staff reservation APIs and frontend screens.
- Canonical rendering of the approved FE08 reservation lifecycle.
- Reservation-specific Vietnamese API errors.
- Manual staff queue processing and manual hold-expiration processing.
- Server-backed refresh after hold expiration.
- FE07 handoff that preserves queue priority and fulfills the notified owner's hold during borrow approval.

Not included:

- FE07 return automation or general borrowing implementation outside the approved reservation handoff.
- FE10 email delivery worker changes.
- Server-side reservation pagination.
- Automatic queue processing or hold-expiration jobs.

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

- Use the existing `/api/reservations` routes under Express.
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
- Allow cancellation only for the owner while the reservation is `ACTIVE` or `NOTIFIED`.
- Mark cancelled records as `CANCELLED` with `CancelledAt`; cancelling a `NOTIFIED` reservation releases its held copy atomically.

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

### 3.6 Frontend Correctness

- Map `NOTIFIED` to ready for pickup and `FULFILLED` to completed.
- Keep only `Waiting` (`ACTIVE`) reservations in the librarian queue; show `Ready to pick up` (`NOTIFIED`) in the all-reservations list only.
- Use a reservation-only Vietnamese error resolver.
- Expose the existing hold-expiration endpoint to staff, reload canonical server state, and report success only after that reload succeeds.
- Do not expose local-only fulfillment or deletion controls.

### 3.7 FE07 Borrowing Handoff

- Preserve FE08 ownership of queue order, queue processing, cancellation, and expiration.
- Expose `ACTIVE` and `NOTIFIED` reservation claims to FE07 create/approval validation.
- Treat FE07 approval for the same member and copy as the only `NOTIFIED -> FULFILLED` trigger.
- Use the shared `BookCopies -> Reservations` lock order for hold, cancellation, expiration, and fulfillment transitions.
- Keep queue processing manual and add no endpoint, schema field, or automatic job.

---

## 4. Review Notes

- This plan covers the approved backend and frontend reservation slice.
- Frontend lifecycle rendering, queue semantics, error isolation, and hold-expiration processing are aligned with `SPEC.md`.
- FE07 approval may fulfill only the matching notified reservation; automatic queue processing after return remains out of scope for Phase 1.

## 5. B7 Closeout Evidence

- Commit `236043864304627f3577baafa9b8648c13c7a691` is contained in `main`.
- GitHub Actions CI run `29217437981` completed successfully for that commit.
- The scoped integration/review record is `.sdd/reviews/fe08-b7-integration-review-closeout-2026-07-13.md`.
