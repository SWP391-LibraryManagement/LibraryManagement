# FE12 Test Plan - Reporting & Statistics

Version: 0.2.0
Status: READY FOR REVIEW
Last Updated: 2026-06-25

Source Spec: `.sdd/specs/feat-reporting-statistics/SPEC.md`
Feature IDs: `BR-FE12-*`, `FR-FE12-*`, `AC-FE12-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Read-only borrowing, inventory, and user/statistics reports for authorized staff.

## 2. Unit Test Targets

- Aggregation calculations for borrowing, inventory, and users.
- Date range validation and boundary ranges.
- Zero-data reports.
- Read-only guarantee: reporting does not mutate source data.
- Privacy rule: reports do not expose unnecessary personal data.

## 3. API / Integration Test Targets

- `GET /reports/borrowing`: happy path, invalid date range, forbidden role.
- `GET /reports/inventory`: happy path, empty inventory, forbidden role.
- `GET /reports/users`: happy path, invalid filters, forbidden role.
- Report endpoints are read-only and staff-only.

## 4. E2E / Manual Acceptance Flow

- Staff opens borrowing report.
- Staff opens inventory report.
- Staff opens user statistics report.
- Member/non-staff cannot access reports.

## 5. Current Evidence

- `backend/tests/reportRoutes.test.js` (7 tests: borrowing/inventory aggregates + no-mutation,
  user stats PII redaction + empty filter, RBAC 401/403 on all three endpoints, invalid filter/range,
  empty inventory totals, audit-log on view).
- Traceability: FR `@spec` coverage **100%** (`npm run trace:enforce`).

## 6. Gaps

- Add frontend/manual evidence for report pages, especially inventory report UI states.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
