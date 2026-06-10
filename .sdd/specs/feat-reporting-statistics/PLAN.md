# PLAN.md - FE12 Reporting & Statistics

Status: READY FOR REVIEW

Owner: Nhat

Updated: 2026-06-10

---

## 1. Scope

Implement the Phase 2 backend slice for FE12 from the approved `SPEC.md`.

Included:

- Borrowing report metrics from FE07 data.
- Inventory report metrics from FE06 / books and copies data.
- User statistics from FE11 / user and role data.
- Role-protected read-only endpoints.
- Filter validation and zero-result handling.
- Audit logging for successful report views.

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
| Borrowing metrics are active loans, overdue loans, period counts, and top borrowed books | Borrowing aggregate response exposes those counts. |
| Inventory metrics are total books/copies, status counts, and low/no availability books | Inventory aggregate response exposes those counts. |
| User statistics are total members, active/inactive users, and new members by period | User stats response stays aggregate and hides personal details. |
| CSV/PDF export is out of scope | No export route is added. |
| Report access writes audit logs | Successful report views are audited. |

---

## 3. Implementation Plan

### 3.1 Borrowing Report

- Validate date range, status, book, and user filters.
- Aggregate request and detail status counts.
- Compute active and overdue loans.
- Group borrow counts by period and top borrowed books.

### 3.2 Inventory Report

- Validate category, book, status, and location filters.
- Aggregate total books and copies.
- Group copies by status and books by category.
- Flag low/no availability books.

### 3.3 User Statistics

- Validate role, status, membership status, and date filters.
- Aggregate total users and members.
- Group users by status and role.
- Return new members by period without exposing personal fields.

### 3.4 Tests

- Add route tests with in-memory report repository.
- Cover borrowing metrics, inventory metrics, user statistics, zero-result handling, access control, and invalid ranges.

---

## 4. Review Notes

- The slice is read-only and does not modify source data.
- Any future export or dashboard work should stay outside this approved scope.
