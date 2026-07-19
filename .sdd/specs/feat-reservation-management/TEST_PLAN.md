# FE08 Test Plan - Reservation Management

Version: 0.3.1
Status: V0.4.3 AUTOMATED AND LIVE SQL BOUNDARY PASS; HUMAN INTEGRATION PENDING
Last Updated: 2026-07-19

Source Spec: `.sdd/specs/feat-reservation-management/SPEC.md` v0.4.2
Feature IDs: `BR-FE08-*`, `FR-FE08-*`, `AC-FE08-*`
Authoritative AC-to-test mapping: `SPEC.md` section 16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Reservation creation for physical copies, member and staff visibility, deterministic queue
processing, cancellation, hold expiration, FE07 fulfillment handoff, FE10 notification failure,
authorization, pagination, ordering, transaction integrity, and audit traceability.

The normalization tasks are contract work awaiting human review. Existing test results are retained
as historical evidence and do not prove FE08-T028 through FE08-T033 are complete.

## 2. Unit / Service Test Targets

- Eligibility: active user, approved membership, unavailable physical copy, duplicate active reservation, and the maximum of 3 active reservations.
- Contract validation: `CopyId` is the only reservation target; `bookId` is rejected from `process-queue` and invalid values are rejected before repository access.
- Queue selection: exact copy scope, `ReservedAt ASC, ReservationId ASC` ordering, cancelled/expired exclusion, and at most one `NOTIFIED` hold per copy.
- Ineligible queue entry: skip for the current run, preserve `ACTIVE`, and leave the copy unchanged.
- Empty queue: return no selection and leave copy and reservation state unchanged.
- Hold creation: set `RESERVED`, `NotifiedAt`, `ExpiresAt`, and queue metadata atomically; record the notification request and audit event.
- Terminal timestamp history: fulfillment, expiration, and notified cancellation preserve original `NotifiedAt`/`ExpiresAt`; never-notified terminal rows keep them null; only cancelled rows set `CancelledAt`.
- Notification failure: preserve the committed `NOTIFIED`/`RESERVED` hold and write `RESERVATION_NOTIFY_FAILED`; do not create an automatic retry.
- Cancellation: owner-only for `ACTIVE` or `NOTIFIED`; reject terminal or foreign reservations; release a held copy atomically.
- Expiration: expire overdue `NOTIFIED` holds and promote the next eligible reservation without violating queue order.
- FE07 handoff: only the same member borrowing the same notified copy may transition the reservation to `FULFILLED`; other-member borrow and renewal remain blocked without exposing the owner.
- Audit and concurrency: every lifecycle change is traceable and concurrent queue attempts cannot select the same reservation twice.

## 3. API / Integration Test Targets

- `POST /api/reservations`: successful creation, inactive account, unapproved membership, missing copy, available copy, duplicate, and active-limit rejection.
- `GET /api/reservations/me`: member isolation, default `page = 1` and `limit = 20`, and invalid page/limit rejection without normalization.
- `GET /api/reservations`: staff-only access, member denial, filters, stable `ReservedAt ASC, ReservationId ASC` order, defaults, and invalid page/limit rejection.
- `POST /api/reservations/process-queue`: staff-only access, required `copyId`, `bookId` rejection, selected reservation, empty queue, ineligible skip, notification failure, and concurrent selection.
- `POST /api/reservations/expire-holds`: overdue hold expiration, next eligible promotion, and unchanged state when no hold is overdue.
- `PATCH /api/reservations/:reservationId/cancel`: owner-only success, foreign-owner denial, terminal-state conflict, and atomic release of a held copy.
- FE07 integration: matching-owner fulfillment, other-member borrow denial, active-queue priority, renewal denial, and no reservation-owner disclosure.

## 4. E2E / Manual Acceptance Flows

- Eligible member reserves an unavailable copy -> staff processes the queue -> FE10 notification is requested -> the same member borrows the held copy -> reservation becomes `FULFILLED` and copy becomes `BORROWED` atomically.
- Two members queue for one copy -> the earliest eligible member is held first -> an ineligible entry is skipped without state loss -> an expired hold promotes the next eligible member.
- Staff lists reservations with omitted pagination -> the first 20 records appear in stable order; invalid bounds return validation errors.

## 5. Current Evidence

- `backend/tests/reservationRoutes.test.js` contains the historical route coverage for creation, cancellation, queue order, notification request, and role guards.
- `backend/tests/integration.test.js` contains the historical FE07/FE08 borrow, renewal, and hold-expiration integration coverage.
- `frontend/test/reservationFrontend.test.js` contains focused lifecycle, error-isolation, and server-refresh coverage for the existing UI slice; normalized pagination coverage remains pending.
- Historical CI evidence: commit `236043864304627f3577baafa9b8648c13c7a691` is in `main`; GitHub Actions run `29217437981` completed successfully.

## 6. Gaps

- FE08-T028 through FE08-T033 pass the focused backend/shared-boundary gate at 77/77 and frontend at 9/9; traceability is 28/28.
- The FE07/FE08 reservation priority, held-owner fulfillment, race, and rollback paths pass in the disposable SQL Server borrowing suite recorded in the full-reconciliation Live SQL review.
- Final whole-repository and human integration acceptance remain open.
- `TD-028`: the member reservation candidate list still comes from `DEMO_RESERVABLE`; mutations remain server-authoritative, but a member-safe copy-selection API contract is required before the static catalog can be removed.
- Automatic queue processing, automatic hold-expiration jobs, and FE10 delivery workers remain outside Phase 1.

## 7. NFR Coverage

| NFR ID | Test target | Evidence state |
| ------ | ----------- | -------------- |
| NFR-FE08-SEC-001 | Authentication required on every reservation endpoint. | Historical role tests; normalized route matrix pending FE08-T028. |
| NFR-FE08-SEC-002 | Own-list isolation and foreign reservation view/cancel denial. | Historical route coverage; focused regression remains in FE08-T032. |
| NFR-FE08-SEC-003 | Librarian/Admin-only staff list, process, and expire actions. | Historical role coverage; exact endpoint matrix pending FE08-T028. |
| NFR-FE08-TXN-001 | Atomic queue hold and FE07 fulfillment with one concurrency winner. | Historical integration evidence; SQL lock evidence pending FE08-T030/T031. |
| NFR-FE08-TXN-002 | Cancellation/expiration never leaves copy and reservation state inconsistent. | Historical route/integration evidence; rollback evidence pending FE08-T030. |
| NFR-FE08-PERF-001 | Pagination defaults and bounds; invalid values rejected before repository access. | Pending FE08-T028. |
| NFR-FE08-PERF-002 | Exact `CopyId`/`ACTIVE` lookup and `ReservedAt ASC, ReservationId ASC` order. | Pending FE08-T028/T029. |
| NFR-FE08-LOG-001 | Audit coverage for create, cancel, process, notify failure, fulfill, and expire. | Partial historical evidence; normalized audit matrix pending FE08-T029/T031. |
| NFR-FE08-UX-001 | Canonical member labels for every reservation state. | Existing focused frontend evidence; normalized pagination state pending FE08-T032. |
| NFR-FE08-UX-002 | Librarian queue displays stable order and actionable state clearly. | Existing queue UI evidence; deterministic pagination/order assertion pending FE08-T032. |

## 8. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRoutes.test.js tests/integration.test.js
node --test frontend/test/reservationFrontend.test.js
npm.cmd run trace:enforce
git diff --check
```

The full repository test, lint, and build gates remain required by the project before merge; they
are not rerun as part of this documentation-only normalization pass.
