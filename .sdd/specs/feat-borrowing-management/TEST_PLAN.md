# FE07 Test Plan - Borrowing Management

Version: 0.2.0
Status: READY FOR REVIEW
Last Updated: 2026-06-25

Source Spec: `.sdd/specs/feat-borrowing-management/SPEC.md`
Feature IDs: `BR-FE07-*`, `FR-FE07-*`, `AC-FE07-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Borrow request creation, approval/rejection, member borrowing history, return flow, renewal flow, and core circulation business rules.

## 2. Unit / Service Test Targets

- Borrow eligibility: approved membership, active account, no blocking overdue/fine state.
- Borrow limit: maximum 5 active borrowed copies.
- Copy availability check (at create and re-check at approval).
- Due date calculation: default 14 calendar days.
- Approve/reject/return/renew state transitions; renewal boundary and conflict cases.

## 3. API / Integration Test Targets

- `POST /api/borrow-requests`: happy, duplicate/unavailable copy, over limit, inactive/unapproved member.
- `GET /api/borrow-requests/me`: own history only.
- `GET /api/borrow-requests`: staff list, unauthorized member forbidden.
- `GET /api/members/:memberId/borrowings`: staff happy, not found, forbidden.
- `PATCH /api/borrow-requests/:requestId/approve`: happy, unavailable copy, concurrent double-borrow, forbidden.
- `PATCH /api/borrow-requests/:requestId/reject`: happy, invalid state.
- `PATCH /api/borrow-details/:borrowDetailId/return`: happy, invalid state/date, already returned.
- `PATCH /api/borrow-details/:borrowDetailId/renew`: happy, overdue, renewal limit, reservation conflict.

## 4. E2E / Manual Acceptance Flow

- Member requests borrow → librarian approves → member sees history → librarian records return.
- Overdue/renewal behavior verified with deterministic dates.

## 5. Current Evidence

- `backend/tests/borrowingRoutes.test.js` (13 tests; AC-FE07-001..006/009..013, FR-FE07-014..021).
- `backend/tests/integration.test.js`.
- Traceability: FR `@spec` coverage **100%** (`npm run trace:enforce`).

## 6. Gaps

- FR-FE07-022 (transaction rollback) is exercised only indirectly; add an explicit case during the Week 11 Testing Sprint.
- TD-007 resolved: Phase 1 borrow policy is all-or-nothing (spec aligned to code, BR-FE07-022). TD-008 (model `allowedValues` sync) resolved.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
