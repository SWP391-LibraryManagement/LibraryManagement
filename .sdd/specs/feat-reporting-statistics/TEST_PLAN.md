# FE12 Test Plan - Reporting & Statistics

Version: 0.1.0
Status: DRAFT - pending team review
Last Updated: 2026-06-22

Source Spec: `.sdd/specs/feat-reporting-statistics/SPEC.md`
Feature IDs: `BR-FE12-*`, `FR-FE12-*`, `AC-FE12-*`

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

- `backend/tests/reportRoutes.test.js`

## 6. Gaps

- Add frontend/manual evidence for report pages, especially inventory report UI states.

## 7. Required Commands / Evidence Before Merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/check-traceability.js
```
