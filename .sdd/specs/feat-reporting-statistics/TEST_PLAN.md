# FE12 Test Plan - Reporting & Statistics

Version: 0.7.0
Status: COMPLETE
Last Updated: 2026-07-13

Source Spec: `.sdd/specs/feat-reporting-statistics/SPEC.md`
Feature IDs: `BR-FE12-*`, `FR-FE12-*`, `AC-FE12-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Read-only borrowing, inventory, and user/statistics reports for authorized staff.

## 2. Unit Test Targets

- Aggregation calculations for borrowing, inventory, and users.
- Strict `YYYY-MM-DD` date validation and inclusive boundary ranges.
- User date ranges affecting approval-period growth without changing global totals.
- Low-stock classification at 0-2 available copies.
- Zero-data reports.
- Read-only guarantee: reporting does not mutate source data.
- Privacy rule: reports do not expose unnecessary personal data.

## 3. API / Integration Test Targets

- `GET /reports/borrowing`: happy path, invalid date range, forbidden role.
- `GET /reports/inventory`: happy path, low-stock threshold, empty inventory, invalid filter, forbidden role.
- `GET /reports/users`: happy path, approval-date range semantics, invalid filters, forbidden role.
- Report endpoints are read-only and staff-only.
- Successful report audits omit raw query values; failure audits keep only safe diagnostic fields.
- OpenAPI documents `400` validation responses, exact status enums, and success payload schemas for all FE12 endpoints.
- Production and in-memory report repositories preserve the same filter, aggregation, and response-shape semantics.

## 4. E2E / Manual Acceptance Flow

- Staff opens borrowing report.
- Staff opens inventory report.
- Staff opens user statistics report.
- Member/non-staff cannot access reports.

## 5. Current Evidence

- `backend/tests/reportRepository.test.js` (8 focused aggregation/date/filter-boundary tests).
- `backend/tests/reportContract.test.js` (4 OpenAPI filter, enum, response, and error contract tests).
- `backend/tests/reportRoutes.test.js` (11 integration tests, including audit privacy, strict dates, user-period semantics, and low stock).
- `backend/tests/reportInMemoryParity.test.js` (8 production-parity tests for borrowing, inventory, and user aggregates).
- `frontend/test/reportAccess.test.js` (6 route guard, truthful error-state, metadata, responsive, and unfiltered-default tests).
- `frontend/test/reportFilters.test.js` (3 query-builder tests).
- Focused FE12 backend suites: **4 suites / 31 tests passed**.
- Full backend suite: **18 suites / 236 tests passed**.
- Full frontend suite: **24 tests passed**.
- Frontend lint and production build passed.
- Traceability enforcement passed with FE12 at **8/8 tagged FRs (100%)**.

## 6. Browser Evidence

- Admin loaded borrowing, inventory, and user reports from the in-memory backend harness.
- Guest was redirected to `/login`; Member was redirected to `/forbidden`.
- The original browser harness exposed the authorized `Software Engineering` category and retained the selected filter.
- A later review found that the harness payload did not mirror the production metadata controller envelope;
  the production `response.data.categories` path is now covered by a focused regression test.
- Desktop `1265x720` and mobile `390x844` checks showed no page, main, content, filter,
  or split overflow; wide tables remained locally scrollable inside `.lib-table-wrap`.
- Loading, low-inventory empty, and backend-unavailable error states were observed. The
  error state cleared report data and did not claim demo fallback data.
- Browser screenshot capture timed out, so evidence is recorded from DOM snapshots and
  measured layout values rather than image artifacts.

## 7. Gaps

- Final independent re-review completed cleanly with no Critical or Important findings.
- Nhat confirmed human review in the Codex task; no PR or separate reviewer identity is inferred.
- Shared `AppLayout` logout currently navigates to `/login` without clearing auth storage;
  this pre-existing authentication-shell issue is outside FE12 and should be handled separately.

## 8. B7 Integration Evidence

- Commit `58747bc10657ed1accb44950ae0c5edbd178a242` is in `main` and `origin/main`.
- GitHub Actions CI run `29249491818` passed for the same commit.
- The successful CI job covered traceability enforcement, backend tests, frontend lint/tests/build,
  and the backend health import check.
- Detailed evidence is recorded in
  `.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md`.

## 9. Verification Commands

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
