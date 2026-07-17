# PLAN.md - FE12 Reporting & Statistics

Status: APPROVED - BASELINE 2026-07-17; DETERMINISTIC POLICY IMPLEMENTATION FOLLOW-UP PENDING

Owner: Nhat

Updated: 2026-07-13

Workflow State: B5 implementation, B6 validation, and B7 integration complete

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
- Aggregate request and detail status counts.
- Compute active and overdue loans.
- Group actual-loan counts by period and top borrowed books without counting pending `REQUESTED` details.

### 3.2 Inventory Report

- Validate category, book, status, and location filters.
- Aggregate total books and copies.
- Group copies by status and books by category.
- Flag books with two or fewer available copies as low/no availability, using all copies of
  books selected by status/location filters so availability is not distorted by the filter.

### 3.3 User Statistics

- Validate role, status, membership status, and date filters.
- Aggregate total users and members.
- Group users by status and role.
- Keep total/status/role counts independent of date filters.
- Return new members by `Members.ApprovedAt` within the optional inclusive date range without exposing personal fields.

### 3.4 Tests

- Add route tests with in-memory report repository.
- Add focused repository and OpenAPI contract tests for aggregation and filter boundaries.
- Add frontend tests for report route guards, error-state integrity, and inventory category filters.
- Cover borrowing metrics, inventory metrics, user statistics, zero-result handling, access control, strict date-only validation, OpenAPI error responses, low-stock thresholds, and audit privacy.

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
