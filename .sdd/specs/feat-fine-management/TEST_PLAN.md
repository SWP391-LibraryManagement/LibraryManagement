# FE09 Test Plan - Fine Management

Version: 0.1.0
Status: DRAFT - prototype reconciliation required
Last Updated: 2026-06-22

Source Spec: `.sdd/specs/feat-fine-management/SPEC.md`
Feature IDs: `BR-FE09-*`, `FR-FE09-*`, `AC-FE09-*`

---

## 1. Test Scope

Overdue fine calculation, fine listing, fine creation/update/delete behavior where allowed by spec, and payment/status handling.

## 2. Unit Test Targets

- Overdue fine calculation: 5,000 VND per overdue day per copy.
- Fine starts the day after due date.
- Zero fine when returned on or before due date.
- Boundary dates and timezone-safe deterministic dates.
- Paid/unpaid/status transition rules.
- Traceability from fine to borrowing/return transaction.

## 3. API / Integration Test Targets

- `GET /fines`: happy path, authorization, filtering.
- `POST /fines`: happy path, invalid amount, invalid member, invalid borrow reference.
- `PUT /fines/:fineId`: happy path, invalid status, invalid amount, not found.
- `DELETE /fines/:fineId`: authorization, not found, unsafe delete guard if spec disallows deletion.

## 4. E2E / Manual Acceptance Flow

- Overdue borrow generates or calculates fine.
- Librarian records fine payment.
- Member/staff sees correct fine status.

## 5. Current Evidence

- `backend/tests/fineRoutes.test.js`

## 6. Gaps

- FE09 `PLAN.md` and `TASKS.md` are `NOT STARTED`.
- Prototype fine code must be reconciled against the approved spec before claiming spec-driven completion.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/check-traceability.js
```
