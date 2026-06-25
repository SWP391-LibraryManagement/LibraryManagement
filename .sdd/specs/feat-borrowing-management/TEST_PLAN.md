# FE07 Test Plan - Borrowing Management

Version: 0.1.0
Status: DRAFT - pending team review
Last Updated: 2026-06-22

Source Spec: `.sdd/specs/feat-borrowing-management/SPEC.md`
Feature IDs: `BR-FE07-*`, `FR-FE07-*`, `AC-FE07-*`

---

## 1. Test Scope

Borrow request creation, approval/rejection, member borrowing history, return flow, renewal flow, and core circulation business rules.

## 2. Unit Test Targets

- Borrow eligibility: approved membership, active account, no blocking overdue/fine state.
- Borrow limit: maximum 5 active borrowed copies.
- Copy availability check.
- Due date calculation: default 14 calendar days.
- Approve/reject/return/renew state transitions.
- Return transaction recording.
- Renewal boundary and conflict cases.

## 3. API / Integration Test Targets

- `POST /borrowing/borrow-requests`: happy path, unavailable copy, over limit, not approved member.
- `GET /borrowing/borrow-requests/me`: own history only.
- `GET /borrowing/borrow-requests`: staff list, unauthorized member forbidden.
- `GET /borrowing/members/:memberId/borrowings`: staff happy path, not found, forbidden.
- `PATCH /borrowing/borrow-requests/:requestId/approve`: happy path, conflict, unavailable copy, forbidden.
- `PATCH /borrowing/borrow-requests/:requestId/reject`: happy path, invalid state.
- `PATCH /borrowing/borrow-details/:borrowDetailId/return`: happy path, already returned, not found.
- `PATCH /borrowing/borrow-details/:borrowDetailId/renew`: happy path, overdue, limit, invalid state.

## 4. E2E / Manual Acceptance Flow

- Member requests borrow.
- Librarian approves.
- Member sees borrowing history.
- Librarian records return.
- Overdue/renewal behavior is checked with deterministic dates.

## 5. Current Evidence

- `backend/tests/borrowingRoutes.test.js`
- `backend/tests/integration.test.js`

## 6. Gaps

- Week 11 should verify service-level coverage and all spec edge cases, especially date and limit boundaries.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/check-traceability.js
```
