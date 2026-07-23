# CHANGELOG.md - FE12 Reporting & Statistics

## 2026-07-23 - Move detail pagination into SQL snapshots

- Materialized each filtered report source once per request, calculated totals and grouped metrics in SQL, and returned stable detail pages with `OFFSET/FETCH`.
- Returned only bounded aggregate resultsets plus the requested detail page instead of transferring the complete filtered snapshot to Node.
- Counted historical non-null membership approval dates in growth metrics even when current membership or account state is inactive.
- Aligned the in-memory report repository with SQL for user `q` matching across ID/role/account/membership status and stable `UserId ASC` detail ordering.
- Added the missing BR-FE12-016, FR-FE12-011, and AC-FE12-011 traceability rows and corrected coverage totals to `16/11/11`.

## 2026-07-21 - Report Search And Filter Completion

- Added server-side `q` search to all three staff reports and exposed the approved filters in the Librarian/Admin UI.
- Changed user-detail ordering to increasing `UserId` and removed redundant successful-load notices.
- Added FE12 requirements and tests for combined search/filter behavior and canonical cross-feature reporting data.

## 2026-07-20 - Vietnamese UI localization and typography

- Localized frontend-generated labels, states, accessibility names, and safe error feedback for this feature.
- Preserved API contracts, raw enum values, permissions, business rules, and user-owned catalog/profile data.
- Applied the shared `Be Vietnam Pro` body and `Noto Serif` heading typography contract with Unicode-capable fallbacks.

## 2026-07-19 - Phase 2 Exit Closeout

- feat-reporting-statistics is accepted within the complete Phase 2 FE01-FE12 reconciliation recorded by PR #40/#41; validation and residual boundaries are consolidated in `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Deferred and future-scope limitations remain explicit and are not widened by this closeout.

## 2026-07-19 - Deterministic Policy Implementation Reconciliation

- Replaced legacy report payloads with the exact `{ metrics, rows, page, limit, totalRows }` contract across backend, OpenAPI, frontend consumers, and cross-feature tests.
- Added page/limit validation, stable report-specific ordering, canonical unknown-ID/status behavior, and date-only borrowing row serialization.
- Allowed both Librarian and Admin to view all three reports and made every successful view write safe metadata without filters or rows.
- Applied inventory status/location filters to the same copy while preserving full-book effective availability for low-stock calculations.
- Evaluated user approval-period date bounds in SQL without narrowing global user/status/role metrics.
- Added deterministic policy, repository, frontend-envelope, and no-export regression coverage; full automated suites, lint, build, traceability, and diff hygiene pass.
- Bound overdue filtering to the same application-computed `Asia/Ho_Chi_Minh` business date used by report aggregation, removed the invalid `RequestDate` fallback for missing `BorrowDate`, and aligned the in-memory `OVERDUE` filter with production derived-status behavior.
- Removed the unused legacy `DEMO_REPORTS` fixture so future report work cannot silently reuse the obsolete payload.
- Fresh Playwright acceptance passed across all three canonical report screens, zero-result filtering, mobile overflow, Member denial, and Guest redirect.
- SQL-backed system integration now passes on disposable SQL Server with cleanup evidence; human re-review and any commit/push/merge decision remain pending.

## 2026-07-17 - Phase 1 Baseline Approved

- Nhật approved the normalized FE12 report filters, deterministic responses, database-side processing, audit, and out-of-scope export policy as the Phase 1 baseline; implementation follow-up remains pending.

## 2026-07-17 - Final Filter And Query Contract Audit

- Replaced open-ended filter examples with the exact query fields for each report.
- Made database-side filtering and safe failure logging explicit performance/logging requirements.

## 2026-07-17 - Deterministic Report Response Contract - v0.1.6

- Added exact metrics and detailed-row schemas for borrowing, inventory, and user reports.
- Defined date semantics, top-book limit/tie-breaking, and report response envelopes.

## 2026-07-17 - Deterministic Report Policy - v0.1.5

- Changed `SPEC.md` to `READY FOR REVIEW` while preserving the completed base slice as historical evidence.
- Confirmed both Librarian and Admin can access borrowing, inventory, and user-statistics reports.
- Standardized well-formed unknown IDs as empty reports and unknown persisted statuses as `UNKNOWN` groups.
- Added deterministic detail pagination/order and made successful report-view audit mandatory.
- Locked all report export strictly out of Phase 1 and replaced the `TBD` traceability entry with an out-of-scope contract test.

## 2026-07-13 - B7 Integration And Review Closeout

- Nhat confirmed the human review gate and selected local merge after the clean FE12 re-review.
- Commit `58747bc10657ed1accb44950ae0c5edbd178a242` reached `main` and was pushed to `origin/main`.
- GitHub Actions CI run `29249491818` passed for the same commit, including traceability, backend
  tests, frontend lint/tests/build, and the backend health import check.
- Added `.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md` with integration,
  scope-control, documentation, and remaining-follow-up evidence.
- CSV/PDF export, dashboards, BI integration, and the shared logout-shell issue remain outside FE12.

## 2026-07-13 - Final Review Remediation

- Read inventory categories from the authorized metadata controller envelope.
- Matched in-memory low-stock rows to the production response with category metadata and copy details.
- Corrected parity fixtures to use explicit category records and production-valid book-copy statuses.
- Excluded `REQUESTED` details from borrow-period and top-book activity metrics while counting all actual-loan statuses.
- Documented `Members` as the runtime source for membership status and `ApprovedAt` user-statistics data.
- Updated `SPEC.md` to version 0.1.4.

## 2026-07-13 - Independent Review Remediation

- Aligned the in-memory borrowing report helper with production joined-row filtering and aggregation semantics.
- Aligned selected-user role, status, and membership aggregates with production SQL row semantics.
- Documented FE12 report success payload schemas and exact runtime filter status enums in OpenAPI.
- Updated the FE12 specification metadata to version 0.1.3.

## 2026-06-10

- Created FE12 Reporting & Statistics feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Updated current owner and assignment scope after team redistribution: UC58-UC60 and FT59-FT61 owned by Nhat.
- Defined FE12 as a read-only reporting feature for borrowing reports, inventory reports, and user statistics.
- Clarified API contract policy so REST endpoints may stay in SPEC.md unless the team reintroduces a shared API contract file.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.

## 2026-06-10 - Backend Slice Ready For Review

- Added the FE12 plan and task checklist for Nhat's reporting scope.
- Added read-only borrowing, inventory, and user statistics report endpoints.
- Added filter validation, zero-result handling, role protection, and audit logs for successful report access.
- Added backend tests for report metrics, zero-result behavior, personal-data suppression, invalid ranges, and access control.

## 2026-06-25 - Traceability Matrix Completed

- Completed Traceability Matrix to cover all BR/FR/AC IDs (added AC mapping).

## 2026-06-20 - Frontend UI Implemented and Accessibility Validated

- Implemented borrowing report, inventory report, and user statistics screens with date filters, category filters, and chart components.
- Wired all frontend screens to backend APIs using axios and React hooks.
- Added table captions, column header scopes, accessible labels for date inputs, selects, and pagination buttons.
- Added loading, empty, and error states on all reviewed screens.
- Validated: `npm.cmd --prefix frontend run lint`, `npm.cmd --prefix frontend run build`, `npm.cmd --prefix backend test`.
- Merged via PR #7 into `feat/fe07-fe08-fe10-fe12-ui-polish`.

## 2026-07-10 - Inventory Category Filter Completed

- Added the missing category selector to the inventory report screen and loaded options from the existing book metadata endpoint.
- Applied the selected `categoryId` to `GET /api/reports/inventory`, with a reset control to return to all categories.
- Added focused frontend tests for the inventory report query parameters.

## 2026-07-13 - B6 Validation Hardening

- Corrected borrowing request status counts so joined detail rows do not duplicate request totals.
- Made date-only `toDate` filters include the full selected day through an exclusive next-day boundary.
- Based new-member periods on `Members.ApprovedAt` instead of account creation time.
- Counted inventory categories by unique books and exposed total/available copies for low-stock rows.
- Added safe audit logging for failed FE12 access and aligned OpenAPI with implemented filters.
- Added frontend report route guards, removed fabricated demo fallback statistics, and restored
  category options from the authorized metadata payload.
- Added responsive report layout rules for shrinking flex content, single-column mobile report
  splits, and mobile-safe date filters.
- Added FE12-specific API error messages so backend failures never claim demo fallback data.
- Added focused backend/frontend regression tests and recorded B6 automated validation evidence.
- Completed fresh browser validation for Admin/Member/Guest access, all three report screens,
  inventory filtering, loading/empty/error states, and desktop/mobile overflow behavior.
- Removed raw query/filter values from successful report audit entries.
- Clarified user report date semantics: global totals remain unchanged while member growth uses
  `Members.ApprovedAt` within the optional inclusive date range.
- Enforced exact `YYYY-MM-DD` report dates and documented `400` responses for every FE12 endpoint.
- Removed fixed sample date defaults and omitted blank date query parameters on report pages.
- Aligned low-stock behavior across backend, UI, and test doubles at two or fewer available copies.
- Preserved full-copy availability for low-stock calculations when status/location filters select
  books, and included books with zero physical copies.
- Corrected the inventory category chart label to describe unique book counts.
- Strengthened the borrowing date-range integration test with real source data and matching
  in-memory filter behavior.
## 2026-07-22

- Verified all report filters/charts remain backend-owned and reduced report-only bottom spacing.
