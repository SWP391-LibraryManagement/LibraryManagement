# PLAN.md - FE08 Reservation Management

Status: APPROVED - V0.4.4 CANDIDATE CONTRACT; IMPLEMENTATION IN PROGRESS

Owner: Nhat

Updated: 2026-07-19

Workflow State: FE08-T028 through FE08-T034 are agent-side complete; FE08-T035 through FE08-T039 implement approved TD-028; final repository/human integration remains open

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
- Deterministic reservation-list pagination and stable queue/list ordering.
- Protected member-safe reservation-candidate search and pagination backed by SQL state.
- Removal of the hardcoded `DEMO_RESERVABLE` catalog.

Not included:

- FE07 return automation or general borrowing implementation outside the approved reservation handoff.
- FE10 email delivery worker changes.
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
| Member candidate source is FE08 protected API | `GET /api/reservations/candidates` returns one redacted row per active-book `BORROWED`/`RESERVED` copy; FE01 and FE06 contracts remain unchanged. |

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

### 3.8 V0.4.2 Normalization

- Keep `CopyId` as the only Phase 1 reservation target; reject `bookId` in create/process-queue payloads.
- Make ineligible queue entries deterministic: skip for the current run, leave `ACTIVE`, and leave the copy unchanged.
- Make empty queue deterministic: return no selection and change no copy/reservation state.
- Make FE10 failure deterministic: keep the committed hold and write `RESERVATION_NOTIFY_FAILED`; no automatic retry worker.
- Add `page = 1`, `limit = 20`, bounds `page >= 1`, `limit = 1..100`, and stable list/queue ordering.
- Reconcile `QueuePosition`, `NotifiedAt`, `ExpiresAt`, and `CancelledAt` with immutable notification-history semantics: notified/expiry timestamps survive terminal transitions, while `CancelledAt` exists only for cancelled rows.
- Preserve the shared `BookCopies -> Reservations` lock order for queue, cancellation, expiration, and FE07 fulfillment.

### 3.9 V0.4.4 Reservation Candidate Catalog

- Add member-only `GET /api/reservations/candidates` with optional `q`, `page`, and `limit`.
- Return exactly `copyId`, `bookId`, `title`, nullable `authorName`, `copyStatus`, and `activeReservationCount` in `{ data, pagination }`.
- Filter to active books and physical copies in `BORROWED` or `RESERVED`; order by title, book ID, then copy ID.
- Keep the read path parameterized, read-only, unaudited, and independent from FE01 public browse and FE06 staff inventory.
- Keep `POST /api/reservations { copyId }` authoritative for member eligibility, duplicate, limit, and stale-copy conflict checks.
- Replace `DEMO_RESERVABLE` with server candidate state; search and pagination are server-owned, and the UI does not invent ETA or availability counts.

---

## 4. Review Notes

- This plan covers the approved backend and frontend reservation slice.
- Frontend lifecycle rendering, queue semantics, error isolation, and hold-expiration processing are aligned with `SPEC.md`.
- FE07 approval may fulfill only the matching notified reservation; automatic queue processing after return remains out of scope for Phase 1.
- The v0.4.2 contract normalization is not implementation completion evidence; FE08-T028 through FE08-T033 remain pending.
- The v0.4.4 candidate contract was explicitly approved on 2026-07-19; it does not close TD-028 until FE08-T035 through FE08-T039 and all validation gates pass.

## 5. B7 Closeout Evidence

- Commit `236043864304627f3577baafa9b8648c13c7a691` is contained in `main`.
- GitHub Actions CI run `29217437981` completed successfully for that commit.
- The scoped integration/review record is `.sdd/reviews/fe08-b7-integration-review-closeout-2026-07-13.md`.

## 6. V0.4.2 Verification Gates

| Gate | Command | Expected result |
| --- | --- | --- |
| FE08 backend | `npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRoutes.test.js tests/integration.test.js` | Deterministic queue, pagination, failure-audit, and lifecycle cases pass. |
| FE08 frontend | `node --test frontend/test/reservationFrontend.test.js` | Canonical lifecycle, error isolation, and server-refresh cases pass when the focused file exists. |
| Traceability | `npm.cmd run trace:enforce` | FE08 changed files satisfy the traceability threshold. |
| Diff hygiene | `git diff --check` | No whitespace errors. |
| FE08 candidate backend | `npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRoutes.test.js` | Role, validation, search, pagination, redaction, order, and no-mutation cases pass. |
| FE08 candidate SQL | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/reservationCandidates.sqltest.js` | Real SQL filtering, active counts, ordering, pagination, and safe projection pass on disposable SQL Server. |
| FE08 candidate browser | isolated Playwright `tests/e2e/fe08-reservation-candidate-catalog.spec.js` | Member catalog/search/create/refresh flow passes without protected metadata exposure. |

## 7. V0.4.3 Baseline Review And Implementation Gate

- [x] Nhat confirmed the `CopyId`-only process-queue contract on 2026-07-17.
- [x] Nhat confirmed skip/empty-queue/no-retry notification policies on 2026-07-17.
- [x] Nhat confirmed pagination and stable ordering on 2026-07-17.
- [x] Nhat confirmed FE07 fulfillment remains the only `NOTIFIED -> FULFILLED` trigger on 2026-07-17.

## 8. V0.4.4 Candidate Review And Implementation Gate

- [x] User approved TD-028 Option A on 2026-07-19.
- [x] User approved `docs/superpowers/specs/2026-07-19-fe08-reservation-candidate-catalog-design.md` on 2026-07-19.
- [x] Implementation plan recorded in `docs/superpowers/plans/2026-07-19-fe08-reservation-candidate-catalog.md`.
- [ ] FE08-T035 through FE08-T039 implementation and evidence pass.
- [ ] Decision Gate A and final H3 packet are updated against the final green PR head.
