# CONTEXT.md - FE12 Reporting & Statistics

# Version: 0.1.0

# Status: DRAFT

# Owner: Nhat

# Last Updated: 2026-06-10

# Feature folder: `.sdd/specs/feat-reporting-statistics/`

---

## 1. Feature Purpose

Reporting & Statistics exists to help librarians and administrators understand library operations through read-only summaries.

This feature must keep reports separate from source workflows:

- FE12 reads borrowing, inventory, user, membership, and fine data.
- FE12 does not approve borrowing, change copy status, manage users, or calculate fines.
- Source features remain responsible for data correctness.

FE12 is a Standard Spec feature because it aggregates business data and needs role protection, but it is read-only for Phase 1.

---

## 2. Real-World Workflow

The typical reporting workflow:

1. Librarian/admin opens reports.
2. The actor chooses report type: borrowing, inventory, or user statistics.
3. The actor selects filters such as date range, status, category, or role if supported.
4. The system validates filters.
5. The system reads source data and calculates aggregate metrics.
6. The system displays the report without changing source records.

---

## 3. Feature Boundary

FE12 includes:

- View borrowing report.
- View inventory report.
- View user statistics.
- Read-only aggregation and filtering for approved report types.

FE12 does not include:

- Borrowing/return processing. That belongs to FE07.
- Inventory copy management. That belongs to FE06.
- User/role management. That belongs to FE11.
- Fine calculation/payment. That belongs to FE09.
- Editing source data from a report.
- Complex BI dashboards or external analytics integration.

---

## 4. Current Data Model Notes

The current SQL script includes report source tables:

- `Users`, `UserRoles`, `Roles`, `UserProfiles`
- `MembershipApplications`
- `Books`, `Categories`, `Authors`, `Publishers`, `BookCopies`
- `BorrowRequests`, `BorrowDetails`
- `Reservations`
- `Fines`

Potential issues to review:

- Some report metrics require consistent status values across features.
- Date range filtering needs clear date source: request date, due date, return date, paid date, or created date.
- Current SQL does not store all audit/reporting timestamps for every entity.
- Report queries should be read-only and should not become business workflow logic.
- Export formats are not defined.

These are not blockers for drafting, but they must be resolved before implementation.

---

## 5. Main Use Cases From Assignment Sheet

Owner column reflects the current team redistribution.

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC58 | View Borrowing Report | Nhat |
| UC59 | View Inventory Report | Nhat |
| UC60 | View User Statistics | Nhat |

---

## 6. Feature Tests From Assignment Sheet

Owner column reflects the current team redistribution.

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT59 | View borrowing report | Nhat |
| FT60 | View inventory report | Nhat |
| FT61 | View user statistics | Nhat |

---

## 7. Key Risks

- Reports may show incorrect numbers if status definitions differ between features.
- Expensive report queries may become slow without filters or indexes.
- Reports may expose personal user data to unauthorized actors.
- Team may mistake report aggregation for source business logic and duplicate calculations.
- Missing timestamps may make date-range reports incomplete.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE06 Inventory / Book Copy Management | Provides copy status and inventory counts. |
| FE07 Borrowing Management | Provides borrowing and return records. |
| FE09 Fine Management | Provides fine/payment data if later included in reports. |
| FE11 User & Role Management | Provides role permissions and user statistics source. |
| FE04 Membership Management | Provides membership status counts if included. |
| SQL Server database | Stores all reporting source data. |

---

## 9. Resolved Questions For Team / Teacher

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE12-001 | Librarian and Admin can view reports; Member/Guest cannot. | Review packet 2026-06-10 | APPROVED |
| Q-FE12-002 | Borrowing metrics: active loans, overdue loans, borrow count by period, top borrowed books. | Review packet 2026-06-10 | APPROVED |
| Q-FE12-003 | Inventory metrics: total books, total copies, copies by status, low/no availability books. | Review packet 2026-06-10 | APPROVED |
| Q-FE12-004 | User statistics: total members, active/inactive users, new members by period. | Review packet 2026-06-10 | APPROVED |
| Q-FE12-005 | CSV/PDF export is out of scope unless teacher requires it. | Review packet 2026-06-10 | APPROVED |
| Q-FE12-006 | Report access writes audit logs for Admin/Librarian report views. | Review packet 2026-06-10 | APPROVED |

---

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed and approved.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- Keep reports read-only.
- Validate filters server-side.
- Avoid exposing personal details unless necessary and authorized.
- Keep report calculations traceable to source feature statuses.
