# FE08 Test Plan - Reservation Management

Version: 0.1.0
Status: DRAFT - pending team review
Last Updated: 2026-06-22

Source Spec: `.sdd/specs/feat-reservation-management/SPEC.md`
Feature IDs: `BR-FE08-*`, `FR-FE08-*`, `AC-FE08-*`

---

## 1. Test Scope

Reservation creation, queue behavior, cancellation, queue processing, and notification integration.

## 2. Unit Test Targets

- Reservation eligibility: approved membership and active account.
- Duplicate reservation prevention.
- Queue ordering and priority rules.
- Cancellation rules.
- Process queue behavior when copy becomes available.
- Notification trigger for reservation-ready event.

## 3. API / Integration Test Targets

- `POST /reservations`: happy path, duplicate, not eligible, unavailable/invalid book.
- `GET /reservations/me`: own reservations only.
- `POST /reservations/process-queue`: staff/system happy path, forbidden.
- `GET /reservations`: staff list, member forbidden.
- `PATCH /reservations/:reservationId/cancel`: happy path, invalid owner/state.
- `PATCH /reservations/:reservationId/process`: happy path, invalid state, not found.

## 4. E2E / Manual Acceptance Flow

- Member reserves a book.
- Staff/system processes queue.
- Member receives or sees ready notification.
- Member cancels reservation.

## 5. Current Evidence

- `backend/tests/reservationRoutes.test.js`
- `backend/tests/integration.test.js`

## 6. Gaps

- Confirm queue order and notification trigger tests map to FE08 acceptance criteria.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/check-traceability.js
```
