# PLAN.md - FE12 Reporting & Statistics

Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED

Owner: Nhat

Updated: 2026-07-19

Workflow State: Historical base slice completed B7; deterministic follow-up completed B5, automated B6, and agent browser acceptance, with human B7 pending

---

## 1. Scope

Implement the Phase 2 backend slice for FE12 from the approved `SPEC.md`.

Included:

- Borrowing report metrics from FE07 data.
- Inventory report metrics from FE06 / books and copies data.
- User statistics from FE11 / user and role data.
- Role-protected read-only endpoints.
- Filter validation and zero-result handling.
- Audit logging for successful report views and safe report-access failures.
- Frontend route protection and truthful loading, empty, and error states.

Not included:

- Export to CSV/PDF.
- Dashboards.
- Editable report screens.
- Data warehouse / BI integration.

---

## 2. Approved Decisions Used

| Decision | Plan impact |
| --- | --- |
| Librarian and Admin can view reports | Report endpoints require staff roles. |
| Borrowing metrics are active loans, overdue loans, period counts, and top borrowed books | Borrowing aggregate response exposes those counts; period/top-book activity excludes `REQUESTED` and counts only actual-loan detail statuses. |
| Inventory metrics are total books/copies, status counts, and low/no availability books | Inventory aggregate response exposes those counts and treats 0-2 available copies as low stock. |
| User statistics are total members, active/inactive users, and new members by period | User stats response stays aggregate; date filters affect `newMembersByPeriod` by `Members.ApprovedAt`, not global totals. |
| Report dates use the OpenAPI `date` contract | Backend accepts exact `YYYY-MM-DD` values and rejects timestamps or impossible dates. |
| CSV/PDF export is out of scope | No export route is added. |
| Report access writes audit logs | Successful views and safe access failures are audited without tokens, query values, or internal errors. |
| Unknown well-formed IDs | Return zero aggregates and empty rows; malformed IDs remain validation errors. |
| Unknown source statuses | Group as `UNKNOWN` and retain them in reproducible totals. |
| Detailed rows | Use page 1, limit 20, limit max 100, and the report-specific stable ordering in `SPEC.md`. |

---

## 3. Implementation Plan

### 3.1 Borrowing Report

- Validate date range, status, book, and user filters.
- Return canonical active-loan and overdue-loan metrics plus paginated detailed rows.
- Group actual-loan counts by period and top borrowed books without counting pending `REQUESTED` details.
- Serialize borrowing row dates as exact `YYYY-MM-DD` values and apply stable `BorrowDate DESC, BorrowDetailId DESC` ordering.

### 3.2 Inventory Report

- Validate category, book, status, and location filters.
- Aggregate canonical total-book, total-copy, and copy-status metrics.
- Flag books with two or fewer available copies as low/no availability, using all copies of
  books selected by status/location filters so availability is not distorted by the filter.
- Require combined status/location filters to match the same copy while retaining full-book effective availability.

### 3.3 User Statistics

- Validate role, status, membership status, and date filters.
- Aggregate total members, users by status/role, and membership by status.
- Group users by status and role.
- Keep total/status/role counts independent of date filters.
- Return new members by `Members.ApprovedAt` within the optional inclusive date range without exposing personal fields.
- Evaluate the approval-period date predicate in SQL while keeping it outside the global user `WHERE` scope.

### 3.4 Tests

- Add route tests with in-memory report repository.
- Add focused repository and OpenAPI contract tests for aggregation and filter boundaries.
- Add frontend tests for report route guards, error-state integrity, and inventory category filters.
- Cover borrowing metrics, inventory metrics, user statistics, zero-result handling, access control, strict date-only validation, OpenAPI error responses, low-stock thresholds, and audit privacy.
- Add deterministic envelope, unknown-ID/status, pagination/order, safe success-audit, no-export, same-copy inventory-filter, and date-only row contract tests.

---

## 4. Review Notes

- The slice is read-only and does not modify source data.
- Export remains strictly outside Phase 1; deterministic policy implementation/verification follows only after v0.1.5 review.

## 5. B6 Validation And B7 Integration Status

Automated and browser validation were completed on `feat/fe12-validation`, then independent
reviews identified follow-up correctness, contract, and test-double parity findings. The findings
are remediated, fresh full verification is complete, and the final independent re-review is clean.
Nhat confirmed human review in the Codex task. Commit
`58747bc10657ed1accb44950ae0c5edbd178a242` was then fast-forward merged into `main`, pushed to
`origin/main`, and GitHub Actions CI run `29249491818` passed for the same commit. Detailed B7
evidence is recorded in `.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md`.

## 6. Deterministic Policy Follow-up Status

The v0.1.6 deterministic contract was reconciled on `feat/fe12-deterministic-policy` using
Hybrid/Standard depth: the report API, authorization, filters, audit metadata, and source-data
semantics remained Core; frontend response consumption remained bounded Shell work.

- B5 implementation is complete for FE12-N02 through FE12-N05.
- Automated B6 is complete: focused FE12 tests, full backend/frontend suites, lint, build,
  traceability, and diff hygiene pass.
- SQL-backed system integration passes on the disposable reconciliation SQL Server runtime; baseline/migrations, the shared SQL scenario, and cleanup are recorded in `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Fresh Playwright acceptance passes for canonical borrowing/inventory/user screens, zero-result
  filtering, mobile overflow, Member denial, and Guest redirect.
- Human integration review and any commit/push/merge decision remain pending; the historical
  2026-07-13 B7 evidence does not close this deterministic follow-up.

Current evidence is recorded in
`.sdd/reviews/fe12-deterministic-policy-validation-2026-07-19.md`.
