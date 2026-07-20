# FE06 Test Plan - Inventory / Book Copy Management

Version: 0.3.1
Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
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

- Focused route tests: `35/35` pass, including post-precheck borrow, reservation, parent-status, and create-parent races.
- FE06 frontend contract tests: `6/6` pass.
- FE06 SQL contract/concurrency suite: `10/10` pass on disposable SQL Server, including locked workflow/parent rechecks after service prechecks.
- Full backend `633/633` and frontend `124/124` pass.
- Coverage thresholds pass: statements 92.51%, branches 82.46%, functions 97.10%, lines 92.44%.
- Frontend lint/build, OpenAPI parse, traceability `24/24`, import smoke, and diff checks pass.
- Disposable schema plus FE06 migration pass 1/2 and pass 2/2 succeeded; cleanup returned `DB_CLEAN` and `LOGIN_CLEAN`.

## 6. Historical Pre-Exit Gaps (Superseded)

- Disposable SQL Server execution, two-pass FE06 migration application, and cleanup are recorded in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- At this pre-exit checkpoint, browser/L4 acceptance plus FE05/FE07/FE08 ownership confirmation remained open.
- H3, merge, and exact post-merge `main` CI later closed those gates; canonical completion evidence is `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
