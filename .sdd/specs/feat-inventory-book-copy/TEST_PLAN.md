# FE06 Test Plan - Inventory / Book Copy Management

Version: 0.2.0
Status: DRAFT - deferred (TD-005); planned targets only
Last Updated: 2026-06-25

Source Spec: `.sdd/specs/feat-inventory-book-copy/SPEC.md`
Feature IDs: `BR-FE06-*`, `FR-FE06-*`, `AC-FE06-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Physical book copy creation, barcode/identifier uniqueness, copy status, availability, and integration with borrowing/reservation.

## 2. Unit Test Targets

- Copy barcode/identifier uniqueness.
- Allowed copy statuses and status transitions.
- Availability calculation by copy status.
- Conflict rule: actively borrowed/reserved copy cannot be marked freely available.
- Location/shelf validation if implemented.

## 3. API / Integration Test Targets

- Create/list/update/deactivate copy happy paths once endpoints exist.
- Duplicate barcode rejected.
- Invalid status transition rejected.
- Forbidden role rejected.
- Conflict with active borrow/reservation rejected.

## 4. E2E / Manual Acceptance Flow

- Librarian adds a physical copy.
- Librarian changes copy status.
- Borrowing/reservation availability updates accordingly.
- Inventory report reflects copy state.

## 5. Current Evidence

- Inventory report endpoint exists under FE12 (`GET /reports/inventory`).
- Dedicated FE06 copy management routes were not found in current backend route inventory.

## 6. Gaps

- FE06 `PLAN.md` and `TASKS.md` are `NOT STARTED`.
- Dedicated copy management API/tests need to be planned or confirmed.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
