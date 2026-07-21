# FE12 Test Plan - Reporting & Statistics

Version: 0.8.0
Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Last Updated: 2026-07-19

Source Spec: `.sdd/specs/feat-reporting-statistics/SPEC.md`
Feature IDs: `BR-FE12-*`, `FR-FE12-*`, `AC-FE12-*`
Authoritative AC↔test mapping: `SPEC.md` §16 Traceability Matrix (this file is the strategy, not the case list).

---

## 1. Test Scope

Read-only borrowing, inventory, and user/statistics reports for authorized staff.

Normalization follow-up covers Librarian access to all three reports, well-formed unknown IDs returning empty reports, `UNKNOWN` status grouping, deterministic pagination/order, mandatory successful-view audit, and absence of export endpoints/controls.

It also covers the exact `{ metrics, rows, page, limit, totalRows }` frontend contract,
date-only borrowing row fields, same-copy inventory status/location filters, and database-evaluated
membership approval-period predicates that do not narrow global user totals.

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

- `backend/tests/reportRepository.test.js` (12 focused aggregation/date/filter-boundary tests, including the bound library-business-date overdue predicate and missing-`BorrowDate` behavior).
- `backend/tests/reportContract.test.js` (4 OpenAPI filter, enum, response, and error contract tests).
- `backend/tests/reportRoutes.test.js` (11 integration tests, including audit privacy, strict dates, user-period semantics, and low stock).
- `backend/tests/reportInMemoryParity.test.js` (10 production-parity tests for borrowing, inventory, and user aggregates, including derived-overdue filtering and missing-`BorrowDate` behavior).
- `backend/tests/reportDeterministicPolicy.test.js` (4 deterministic policy tests covering pagination bounds, unknown IDs/statuses, stable ordering, date-only rows, and no-export surfaces).
- `backend/tests/reportService.test.js` (safe successful-view audit metadata and all-staff access).
- `backend/tests/integration.test.js` and `backend/tests/systemIntegration.test.js` (canonical FE12 envelope in cross-feature flows).
- `frontend/test/reportAccess.test.js` (6 route guard, truthful error-state, metadata, responsive, and unfiltered-default tests).
- `frontend/test/reportFilters.test.js` (3 query-builder tests).
- `frontend/test/reportOperationalFrontend.test.js` (3 shared-pattern/API/deterministic-envelope contract tests).
- Focused FE12 backend suites: **6 suites / 46 tests passed**.
- Full backend suite: **39 suites / 615 tests passed**.
- Backend coverage threshold passed: **92.54% statements, 82.33% branches, 97.14% functions, 92.47% lines**.
- Focused FE12 frontend tests: **12 tests passed**; full frontend suite: **121 tests passed**.
- Frontend lint and production build passed.
- Traceability enforcement passed with FE12 at **10/10 tagged FRs (100%)**.
- `git diff --check` passed.
- Playwright system golden path passed **1/1** for canonical borrowing/inventory/user report screens,
  borrowing zero-result filtering, mobile overflow, Member denial, and Guest redirect.
- After repository review remediation, exact-diff isolated Playwright CLI acceptance passed again on
  frontend port `4184`: Librarian loaded all three canonical screens, mobile `390x844` had no
  document overflow, Member reached `/forbidden`, and Guest reached `/login`. Port `4173` remained
  untouched because it belongs to the FE03 worktree.

## 6. Browser Evidence

The evidence in this section belongs to the historical base slice. It does not yet prove the
v0.1.6 deterministic response envelope or new detailed-row tables in the current worktree.

Fresh deterministic-wave browser evidence on 2026-07-19:

- Librarian completed the system golden path and loaded all three canonical report pages.
- Borrowing displayed deterministic metrics/rows and a future date range produced the truthful
  zero-result detail state.
- Inventory and user-statistics detailed tables rendered from the canonical envelopes.
- Mobile `390x844` had no document-level horizontal overflow.
- Member access redirected to `/forbidden`; Guest access redirected to `/login`.
- Screenshots were written under `output/playwright/`; the test passed despite known harness noise
  from non-FE12 `/api/profile/me` and `/api/books/metadata` services that still require SQL Server.
- Exact-diff follow-up acceptance used an isolated Playwright CLI session at `http://127.0.0.1:4184`;
  it reconfirmed Librarian borrowing/inventory/users access, canonical metric/detail tables, mobile
  no-overflow, Member denial, and Guest login redirect. The mobile screenshot is
  `output/playwright/fe12-isolated-user-statistics-mobile.png`.

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

- Human integration re-review is pending; agent-driven browser acceptance is present but does not
  substitute for human B7/L4 approval.
- SQL-backed system integration passes with `SYSTEM_SQL_TEST_ALLOW_MUTATION=true` against the disposable reconciliation database; cleanup is recorded in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- The historical base-slice re-review and human acceptance do not close the v0.1.6 follow-up.
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

## 10. Search And Filter Follow-up

- Verify all three report endpoints accept a trimmed parameterized `q` and combine it with report-specific filters.
- Verify borrowing search covers title, barcode, account identity, and user ID without SQL interpolation.
- Verify inventory search covers title, barcode, location, and book ID while preserving low-stock calculations.
- Verify user search covers safe non-PII identifiers/status fields and detail rows use `UserId ASC`.
- Verify successful loading renders no redundant “Đã tải dữ liệu” notice while failures remain visible.
