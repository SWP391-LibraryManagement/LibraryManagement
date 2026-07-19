# FE06 Test Plan - Inventory / Book Copy Management

Version: 0.3.0
Status: READY FOR REVIEW - focused and live SQL evidence recorded; acceptance pending
Last Updated: 2026-07-19

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

- Create/list/update/status/deactivate copy happy paths.
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

- Focused route tests: `31/31` pass.
- FE06 frontend contract tests: `6/6` pass.
- FE06 SQL contract/concurrency suite: `6/6` pass, including the mutable rowversion/transaction case on disposable SQL Server.
- Full backend `633/633` and frontend `124/124` pass.
- Coverage thresholds pass: statements 92.51%, branches 82.46%, functions 97.10%, lines 92.44%.
- Frontend lint/build, OpenAPI parse, traceability `24/24`, import smoke, and diff checks pass.

## 6. Gaps

- Disposable SQL Server execution, two-pass FE06 migration application, and cleanup are recorded in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Browser/L4 acceptance plus FE05/FE07/FE08 ownership confirmation remain open.
- Human B7 integration review remains mandatory before commit or merge.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
