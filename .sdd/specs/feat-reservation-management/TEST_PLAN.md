# FE08 Test Plan - Reservation Management

Version: 0.2.0
Status: READY FOR REVIEW
Last Updated: 2026-06-25

Source Spec: `.sdd/specs/feat-reservation-management/SPEC.md`
Feature IDs: `BR-FE08-*`, `FR-FE08-*`, `AC-FE08-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Reservation creation, queue behavior, cancellation, queue processing, hold expiry, and notification integration.

## 2. Unit / Service Test Targets

- Reservation eligibility: approved membership and active account.
- Duplicate reservation prevention; active-reservation limit (max 3).
- Queue ordering (ReservedAt) and skip-ineligible-member behavior.
- Cancellation rules (owner-only; already cancelled/expired rejected).
- Process-queue hold + notification trigger; hold expiry and promotion of the next reservation.
- Concurrency: at most one NOTIFIED hold per copy.

## 3. API / Integration Test Targets

- `POST /api/reservations`: happy, duplicate, not eligible, available/non-existent copy, over limit.
- `GET /api/reservations/me`: own reservations only.
- `POST /api/reservations/process-queue`: staff happy, empty queue, skip ineligible, concurrency, forbidden.
- `POST /api/reservations/expire-holds`: expire overdue hold and promote next.
- `GET /api/reservations`: staff list, member forbidden.
- `PATCH /api/reservations/:reservationId/cancel`: happy, invalid owner/state.

## 4. E2E / Manual Acceptance Flow

- Member reserves a book → staff processes queue → member sees ready notification → member cancels.

## 5. Current Evidence

- `backend/tests/reservationRoutes.test.js` (13 tests; AC-FE08-001..010, FR-FE08-011..022).
- `backend/tests/integration.test.js`.
- Traceability: FR `@spec` coverage **100%** (`npm run trace:enforce`).

## 6. Gaps

- FR-FE08-023/024 (held copy blocks other members' borrow/renewal) are enforced in FE07; an end-to-end
  cross-feature integration test is still pending (TD-011).
- TD-010 (cancel returns current reservation state alongside the 409) is resolved.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
