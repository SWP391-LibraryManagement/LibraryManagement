# FE09 Test Plan - Fine Management

Version: 0.2.0
Status: READY FOR REVIEW
Last Updated: 2026-06-25

Source Spec: `.sdd/specs/feat-fine-management/SPEC.md`
Feature IDs: `BR-FE09-*`, `FR-FE09-*`, `AC-FE09-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Server-side overdue fine calculation, duplicate prevention, collection recording, mark-paid, admin
waive/cancel, audit logging, and fine visibility. The legacy prototype CRUD (`fineService.js`) is kept
for the demo UI and covered separately by `fineRoutes.test.js`.

## 2. Unit / Service Test Targets

- Overdue fine calculation: 5,000 VND per overdue day per copy, starting the day after the due date.
- Zero fine when returned on or before the due date (no record created).
- Amount derived from stored dates only; client-supplied `amount`/`overdueDays` ignored.
- Duplicate prevention: re-calculate returns the existing active fine.
- Collection: `0 ≤ collectedAmount ≤ amount`; PAID iff fully collected.
- Mark paid sets status PAID + PaidAt; terminal-state guards (no re-collect/re-pay).
- Admin-only waive/cancel with required reason; audit log on every state change.

## 3. API / Integration Test Targets (SPEC §11)

- `POST /api/fines/calculate`: happy (201), not overdue (no fine), idempotent (no duplicate), missing
  borrow detail (404), ignores client amount.
- `GET /api/fines/me`: member sees only own fines.
- `GET /api/fines/:fineId`: owner or staff only (member blocked from others' fine).
- `POST /api/fines/:fineId/collections`: full → PAID, partial → UNPAID, over-amount → 400.
- `PATCH /api/fines/:fineId/paid`: staff marks paid; member blocked; double-pay rejected.
- `PATCH /api/fines/:fineId/waive` and `/cancel`: admin only; reason required.

## 4. E2E / Manual Acceptance Flow

- Overdue return → staff calculates fine → records collection / marks paid → member/staff sees status.
- (Frontend `FineManagement.jsx` still uses the legacy CRUD endpoints — migration is TD-004.)

## 5. Current Evidence

- `backend/tests/fineManagementRoutes.test.js` (11 tests; AC-FE09-001..010).
- `backend/tests/fineRoutes.test.js` (legacy prototype CRUD).
- Traceability: FR `@spec` coverage **100%** (`npm run trace:enforce`).

## 6. Gaps

- TD-004: align the frontend to the server-side API and add pagination.
- TD-021: SQL-Server-backed integration test for end-to-end fine persistence.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
