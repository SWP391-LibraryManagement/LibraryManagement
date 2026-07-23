# SPEC.md - FE12 Reporting & Statistics

# Version: 0.1.7

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Nhat

# Last Updated: 2026-07-21

# Feature ID: FE12

# Feature folder: `.sdd/specs/feat-reporting-statistics/`

> Current delivery status (2026-07-20): `COMPLETE` for the approved Phase 1 scope.
> `TASKS.md` and `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> are authoritative for current implementation state. Older `Not Started`,
> `PARTIAL`, `READY FOR REVIEW`, or pending-review labels retained below are
> historical planning/evidence snapshots, not the current delivery state.

> Source of truth for FE12 Reporting & Statistics. v0.1.5 preserves the approved report scope while making access, empty-filter, unknown-status, pagination, audit, and export behavior deterministic; human re-review is required.

---

## 1. Feature Overview

### 1.1 Feature Name

Reporting & Statistics

### 1.2 Business Context

Librarians and administrators need summary information to understand library activity: borrowing volume, returned/overdue items, inventory status, and user/member statistics. Reports support operational decisions without requiring staff to manually inspect raw database records.

Reporting must be read-only. Source features remain responsible for creating and updating business data; FE12 only aggregates and presents approved metrics.

### 1.3 Goal / Outcome

The system shall:

- Allow authorized actors to view borrowing reports.
- Allow authorized actors to view inventory reports.
- Allow authorized actors to view user statistics.
- Validate report filters.
- Aggregate data from source tables without modifying source records.
- Protect reports from unauthorized access and excessive personal data exposure.

### 1.4 Scope Level

- [ ] Full Spec - core business logic, high risk, must be correct from the beginning
- [x] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Librarian | Library staff | View all three Phase 1 reports: borrowing, inventory, and user statistics. |
| Admin | System administrator | View all three Phase 1 reports: borrowing, inventory, and user statistics. |
| Member | Registered library user | No staff reporting access in FE12. |
| Guest | Unauthenticated visitor | No reporting access. |
| Source Features | Internal data providers | Provide source data through database records. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE12-001: Actor is authenticated.
- PRE-FE12-002: Actor has a role allowed to view the requested report.
- PRE-FE12-003: Report source tables exist and status definitions are approved.
- PRE-FE12-004: Every supplied report filter is one of the exact query fields in Section 11 and satisfies the validation rules in Sections 6 and 10.3.
- PRE-FE12-005: The report is read-only and does not update source data.

---

## 4. Main Flows

### MF-FE12-001: View Borrowing Report

1. Librarian/admin opens borrowing report.
2. Actor selects zero or more approved filters: `fromDate`, `toDate`, `status`, `bookId`, or `userId`.
3. The system validates filters.
4. The system reads `BorrowRequests`, `BorrowDetails`, `BookCopies`, `Books`, and related member data.
5. The system calculates approved borrowing metrics.
6. The system displays the report without changing borrowing data.

### MF-FE12-002: View Inventory Report

1. Librarian/admin opens inventory report.
2. Actor selects zero or more approved filters: `categoryId`, `bookId`, `status`, or `location`.
3. The system validates filters.
4. The system reads `Books`, `BookCopies`, categories, authors, and publishers.
5. The system calculates approved inventory metrics.
6. The system displays inventory counts and status summaries.

### MF-FE12-003: View User Statistics

1. Librarian/admin opens user statistics.
2. Actor selects zero or more approved filters: `roleId`, `status`, `membershipStatus`, `fromDate`, or `toDate`.
3. The system validates filters.
4. The system reads `Users`, `UserRoles`, `Roles`, and `Members`; runtime membership status and approval date come from `Members`.
5. The system calculates approved user/member metrics.
6. The system displays aggregate statistics without exposing unnecessary personal details.

---

## 5. Alternative Flows

### AF-FE12-001: Unauthorized Report Access

1. Guest, member, or unauthorized actor requests a report.
2. The system checks role permission.
3. The system denies access.

### AF-FE12-002: Invalid Filter

1. Actor submits invalid date range, status, role, or ID filter.
2. The system rejects malformed values, unsupported enum values, and invalid date ranges with a validation error. A well-formed positive ID that has no matching source record follows AF-FE12-003 instead.
3. The report is not generated.

### AF-FE12-003: No Data For Report

1. Actor selects filters that match no records.
2. The system returns an empty report with zero counts.
3. The system does not return an error.

### AF-FE12-004: Source Data Incomplete

1. Report source records are missing optional fields.
2. The system returns `null` for missing optional display fields and groups an unrecognized source status as `UNKNOWN`; it does not silently remove the source record from reproducible totals.
3. The system does not change source records.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE12-001: Reports are read-only and must not modify source data.
- BR-FE12-002: Guests and members cannot access staff reports.
- BR-FE12-003: Report access must be role-protected on the server; both Librarian and Admin may access borrowing, inventory, and user-statistics reports, while Member and Guest may access none.
- BR-FE12-004: Borrowing reports must use FE07 borrowing records as source of truth. Borrow-period and top-book metrics count only `BorrowDetails` in `BORROWED`, `RETURNED`, `LOST`, `DAMAGED`, or `OVERDUE`; `REQUESTED` is not a handed-over loan and does not contribute.
- BR-FE12-005: Inventory reports must use FE06/BookCopies status as source of truth.
- BR-FE12-006: User statistics must use FE11/Users/Roles data as source of truth.
- BR-FE12-007: Membership statistics, if shown, must use FE04 membership data as source of truth.
- BR-FE12-008: Report filter syntax, enum membership, dates, and pagination must be validated before query execution; a well-formed positive filter ID that does not match a source record is valid and yields an empty report.
- BR-FE12-009: Date range filters must use valid `YYYY-MM-DD` values with start <= end. For user statistics, the date range limits only `newMembersByPeriod` by non-null `Members.ApprovedAt`; a historical approval remains counted even if the current membership/account status later becomes inactive, while total/status/role counts remain global subject to non-date filters.
- BR-FE12-010: Reports must use approved status definitions from source features; an unrecognized persisted source status must be grouped as `UNKNOWN` and remain included in reproducible totals.
- BR-FE12-011: User statistics must not expose unnecessary personal data.
- BR-FE12-012: Aggregate counts must be reproducible from source records.
- BR-FE12-013: CSV, PDF, spreadsheet, and other report export are strictly out of scope for Phase 1; FE12 exposes no export endpoint or export control.
- BR-FE12-014: Every successful Librarian/Admin report view must write one safe audit event identifying actor, report type, timestamp, and success without raw filter/query values or returned report rows.
- BR-FE12-015: Detailed rows use `page=1`, `limit=20`, with `page>=1` and `limit=1..100`; stable ordering is borrowing `BorrowDate DESC, BorrowDetailId DESC`, inventory `Title ASC, BookId ASC, CopyId ASC`, and users `UserId ASC`.
- BR-FE12-016: Each report accepts an optional trimmed `q` of at most 200 characters. Borrowing search matches book title, barcode, username, email, or user ID; inventory search matches title, barcode, location, or book ID; user search matches user ID, role, account status, or membership status. Search and selected filters are applied before aggregation and pagination.

---

## 7. Functional Requirements

- FR-FE12-001: When an authorized actor views borrowing report, the system shall return the exact borrowing metrics and row fields defined in Section 10.3.
- FR-FE12-002: When an authorized actor views inventory report, the system shall return the exact inventory metrics and row fields defined in Section 10.3 and identify low-stock books with two or fewer effective available copies.
- FR-FE12-003: When an authorized actor views user statistics, the system shall return the exact user/member metrics and row fields defined in Section 10.3, with date filters applied to approval-period growth only.
- FR-FE12-004: If an actor is unauthorized, then the system shall deny report access.
- FR-FE12-005: If report filter syntax, enum membership, date range, page, or limit is invalid, then the system shall reject the request before report query execution.
- FR-FE12-006: If valid filters match no data, including a well-formed unknown source ID, then the system shall return zero aggregates and empty detailed rows.
- FR-FE12-007: When reports are generated, the system shall not update source data.
- FR-FE12-008: When user statistics are generated, the system shall return aggregate data by default rather than raw personal details.
- FR-FE12-009: When an authorized report request succeeds, the system shall write the safe report-view audit event required by BR-FE12-014.
- FR-FE12-010: When detailed rows are returned, the system shall apply the approved pagination defaults, bounds, and report-specific stable ordering from BR-FE12-015.
- FR-FE12-011: When staff searches or filters a report, the system shall combine `q` with all supplied report-specific filters, reload canonical server metrics and rows, and avoid a redundant successful-load banner.

---

## 8. Acceptance Criteria

- AC-FE12-001: Given a Librarian or Admin, when viewing borrowing report, then borrowing totals and status counts are displayed.
- AC-FE12-002: Given a Librarian or Admin, when viewing inventory report, then copy counts by status and book/category are displayed according to filters, and books with 0-2 available copies appear in the low-stock list. Status/location filters select matching books and filtered copy totals without hiding those books' full availability from low-stock calculation.
- AC-FE12-003: Given a Librarian or Admin, when viewing user statistics with a date range, then total/status/role counts remain global and `newMembersByPeriod` includes only approvals in that range.
- AC-FE12-004: Given a guest or member, when requesting staff reports, then access is denied.
- AC-FE12-005: Given malformed/unsupported report filters or invalid pagination/date range, when submitted, then the system returns a validation error before querying.
- AC-FE12-006: Given valid filters with no matching data or a well-formed unknown ID, when the report is generated, then the system returns zero aggregates and empty rows.
- AC-FE12-007: Given a report request, when the report completes, then no source business records are modified.
- AC-FE12-008: Given user statistics, when results are returned, then unnecessary personal profile details are not exposed.
- AC-FE12-009: Given a successful Librarian/Admin report view, when the response completes, then one safe audit event records actor, report type, timestamp, and success without raw filters or report rows.
- AC-FE12-010: Given detailed report rows without explicit pagination, when returned, then `page=1`, `limit=20`, and the report-specific stable ordering apply; invalid bounds are rejected.
- AC-FE12-011: Given a Librarian/Admin enters search text and report filters, when applying them, then filtering occurs before aggregation/pagination, user rows are ordered by increasing `userId`, and no “Đã tải dữ liệu” success notice is rendered.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE12-001 | Guest requests report | Return unauthorized response. |
| EC-FE12-002 | Member requests staff report | Return forbidden response. |
| EC-FE12-003 | Invalid date range | Reject request. |
| EC-FE12-004 | Unsupported status filter | Reject request. |
| EC-FE12-005 | Well-formed positive category/book/member/role ID has no matching source record | Return zero aggregates and empty rows; do not treat the unknown ID as malformed. |
| EC-FE12-006 | No matching records | Return zero counts and empty rows. |
| EC-FE12-007 | Persisted source status value is not recognized | Group as `UNKNOWN` and keep the record in reproducible totals. |
| EC-FE12-008 | Report query timeout | Return safe error and log safely. |
| EC-FE12-009 | Large valid date range | Return aggregate metrics and paginate detailed rows using the approved defaults/bounds; do not substitute a warning-only response. |
| EC-FE12-010 | Missing optional source field | Use safe fallback in report display. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Source for user statistics and member/staff counts. |
| UserRoles | Source for role-based user statistics. |
| Roles | Provides role names. |
| Members | Source for runtime membership status counts and `ApprovedAt` growth periods. |
| Books | Source for inventory and borrowing report book metadata. |
| Categories | Source for inventory grouping. |
| BookCopies | Source for inventory status counts. |
| BorrowRequests | Source for borrowing request counts and status. |
| BorrowDetails | Source for borrowed/returned/overdue item counts. |
| Fines | Not used by the three approved Phase 1 reports; any fine-report extension requires a later FE12 spec revision. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| fromDate | date | No | Exact `YYYY-MM-DD`; must be <= `toDate` when both provided. For user statistics, applies to `Members.ApprovedAt` growth only. |
| toDate | date | No | Exact `YYYY-MM-DD`; must be >= `fromDate` when both provided and includes the full selected day. For user statistics, applies to `Members.ApprovedAt` growth only. |
| status | string | No | Must be an approved status for selected report type. |
| categoryId | integer | No | Used for inventory report. |
| bookId | integer | No | Used for borrowing/inventory report. |
| userId | integer | No | Staff-only filter when approved. |
| roleId | integer | No | Used for user statistics. |
| page | integer | No | Defaults to 1; must be an integer at least 1 for detailed rows. |
| limit | integer | No | Defaults to 20; must be an integer from 1 through 100. |
| q | string | No | Trimmed free-text search, maximum 200 characters, using the report-specific fields in BR-FE12-016. |

---

### 10.3 Report Response Contract

All three report endpoints return `{ metrics, rows, page, limit, totalRows }`. `rows` are the detailed records after filters; `metrics` are calculated from the full filtered source set before pagination.

| Report | Metrics contract | Detailed row contract |
| ------ | ---------------- | --------------------- |
| Borrowing | `activeLoans` counts `BORROWED` details; `overdueLoans` counts `BORROWED` details whose due date is before the current `Asia/Ho_Chi_Minh` business date; `borrowCountByPeriod` groups qualifying actual-loan details by `BorrowDate` (`YYYY-MM-DD`); `topBorrowedBooks` returns at most 10 books ordered by borrow count descending, title ascending, then `BookId` ascending. | `borrowDetailId`, `requestId`, `userId`, `bookId`, `copyId`, `status`, `borrowDate`, `dueDate`, `returnDate`. `OVERDUE` is a derived display status for an overdue `BORROWED` detail. |
| Inventory | `totalBooks` counts distinct books in the filtered book scope; `totalCopies` counts filtered copies; `copiesByStatus` groups filtered copies by approved FE06 status; `lowStockBooks` lists distinct books with 0..2 effective `AVAILABLE` copies, using full availability for each selected book even when a status/location filter narrows the rows. | `bookId`, `title`, `copyId`, `barcode`, `location`, `status`, `effectiveAvailability`. |
| Users | `totalMembers` counts users with the `Member` role; `usersByStatus` groups users by approved FE02 status; `usersByRole` groups users by FE11 role; `membershipByStatus` groups canonical FE04 member status; `newMembersByPeriod` groups every non-null historical `Members.ApprovedAt` by `YYYY-MM-DD` within the requested range regardless of current membership/account status. | `userId`, `status`, `roles`, `membershipStatus`, `createdAt`, `approvedAt`; no profile address, phone, password, token, or unnecessary personal fields. |

Date filters for the borrowing report apply to `BorrowDate`; date filters for user statistics apply only to `newMembersByPeriod`; inventory reports have no date filter in Phase 1.

---

## 11. API / Interface Contract

> The endpoints and request/response shapes below are the canonical Phase 1 contract for this feature.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/reports/borrowing` | Librarian/Admin | Query: `q?, fromDate?, toDate?, status?, bookId?, userId?, page=1, limit=20` | `BorrowingReportResponse` from Section 10.3 | Stable row order: `BorrowDate DESC, BorrowDetailId DESC`. |
| GET | `/api/reports/inventory` | Librarian/Admin | Query: `q?, categoryId?, bookId?, status?, location?, page=1, limit=20` | `InventoryReportResponse` from Section 10.3 | Stable row order: `Title ASC, BookId ASC, CopyId ASC`. |
| GET | `/api/reports/users` | Librarian/Admin | Query: `q?, roleId?, status?, membershipStatus?, fromDate?, toDate?, page=1, limit=20` | `UserReportResponse` from Section 10.3 | Stable row order: `UserId ASC`; no raw personal profile details. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE12-SEC-001: Report endpoints must require authentication.
- NFR-FE12-SEC-002: Report endpoints must enforce role-based access on the server.
- NFR-FE12-SEC-003: User statistics must avoid unnecessary personal data exposure.
- NFR-FE12-SEC-004: Report filters must be validated to prevent injection and excessive queries.

### 12.2 Read-only Integrity

- NFR-FE12-INT-001: Report generation must not create, update, or delete source business records.
- NFR-FE12-INT-002: Report metrics must be traceable to source tables and approved status definitions.

### 12.3 Performance

- NFR-FE12-PERF-001: Report queries must apply every supplied approved filter in the database before aggregation and pagination; application-layer full-source filtering is not permitted.
- NFR-FE12-PERF-002: Detailed report rows must use `page=1`, `limit=20`, bounds `page>=1`, `limit=1..100`, and the stable order defined by BR-FE12-015.
- NFR-FE12-PERF-003: Report joins and filters must use the approved primary/foreign-key paths and available indexed status/date fields; unbounded per-row lookup loops are not permitted.

### 12.4 Logging and Audit

- NFR-FE12-LOG-001: Report access failures must be logged safely.
- NFR-FE12-LOG-002: Every successful Librarian/Admin report view must be audited without raw query/filter values, report rows, tokens, or internal errors.

### 12.5 Usability

- NFR-FE12-UX-001: Report filters and zero-result states must be understandable.
- NFR-FE12-UX-002: Metrics must use clear labels and units.

---

## 13. Out of Scope

This feature does not include:

- Editing borrowing, inventory, user, membership, fine, or reservation records.
- Borrowing/return processing.
- Book copy management.
- User/role management.
- Fine calculation or collection.
- External BI tools or analytics warehouse.
- CSV/PDF/spreadsheet or other report export in Phase 1.
- Real-time dashboards unless approved.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE06 Inventory / Book Copy Management | Internal | Provides copy status and inventory source data. |
| FE07 Borrowing Management | Internal | Provides borrowing and return source data. |
| FE09 Fine Management | Internal | Provides fine data if included in later report scope. |
| FE11 User & Role Management | Internal | Provides user/role data and report permissions. |
| FE04 Membership Management | Internal | Provides membership application/status data. |
| SQL Server database | Technical | Stores report source data. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE12-001 | Librarian and Admin can view all three reports (borrowing, inventory, users); Member/Guest cannot view any FE12 report. | Review packet 2026-06-10; normalization 2026-07-17 | APPROVED |
| Q-FE12-002 | Borrowing metrics: active loans, overdue loans, borrow count by period, top borrowed books. Borrow-period and top-book metrics exclude `REQUESTED` and count only actual-loan statuses: `BORROWED`, `RETURNED`, `LOST`, `DAMAGED`, and `OVERDUE`. | Review packet 2026-06-10; final-review remediation 2026-07-13 | APPROVED |
| Q-FE12-003 | Inventory metrics: total books, total copies, copies by status, and low-stock books defined as 0-2 available copies. | Review packet 2026-06-10; B6 clarification 2026-07-13 | APPROVED |
| Q-FE12-004 | User statistics: total members, active/inactive users, and new members by `Members.ApprovedAt`; date ranges affect the new-member period only. | Review packet 2026-06-10; B6 clarification 2026-07-13 | APPROVED |
| Q-FE12-005 | CSV/PDF/spreadsheet and all other report export are strictly out of scope for Phase 1. | Review packet 2026-06-10; normalization 2026-07-17 | APPROVED |
| Q-FE12-006 | Report access writes audit logs for Admin/Librarian report views without persisting raw query/filter values. | Review packet 2026-06-10; B6 clarification 2026-07-13 | APPROVED |
| Q-FE12-007 | A well-formed unknown filter ID returns an empty report; malformed IDs are validation errors. | Spec normalization 2026-07-17 | APPROVED |
| Q-FE12-008 | Unknown persisted source statuses are grouped as `UNKNOWN` and retained in totals. | Spec normalization 2026-07-17 | APPROVED |
| Q-FE12-009 | Detailed rows use deterministic pagination and report-specific stable ordering; large valid date ranges do not return warning-only alternatives. | Spec normalization 2026-07-17 | APPROVED |
| Q-FE12-010 | Report responses use the exact metrics and row fields in Section 10.3; top borrowed books is limited to 10 with deterministic tie-breaking. | Report contract normalization 2026-07-17 | APPROVED |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE12-001 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| BR-FE12-002 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| BR-FE12-003 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| BR-FE12-004 | UC58 | FT59 | Ready for review |
| BR-FE12-005 | UC59 | FT60 | Ready for review |
| BR-FE12-006 | UC60 | FT61 | Ready for review |
| BR-FE12-007 | UC60 | FT61 | Ready for review |
| BR-FE12-008 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| BR-FE12-009 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| BR-FE12-010 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| BR-FE12-011 | UC60 | FT61 | Ready for review |
| BR-FE12-012 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| BR-FE12-013 | UC58, UC59, UC60 | `backend/tests/reportDeterministicPolicy.test.js` no-export route/OpenAPI/frontend check | Automated evidence; human re-review pending |
| BR-FE12-014 | UC58, UC59, UC60 | `backend/tests/reportService.test.js`, `backend/tests/reportRoutes.test.js` safe successful-view audit cases | Automated evidence; human re-review pending |
| BR-FE12-015 | UC58, UC59, UC60 | `backend/tests/reportDeterministicPolicy.test.js`, `backend/tests/reportRepository.test.js` pagination/order cases | Automated evidence; human re-review pending |
| FR-FE12-001 | UC58 | FT59 | Ready for review |
| FR-FE12-002 | UC59 | FT60 | Ready for review |
| FR-FE12-003 | UC60 | FT61 | Ready for review |
| FR-FE12-004 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| FR-FE12-005 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| FR-FE12-006 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| FR-FE12-007 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| FR-FE12-008 | UC60 | FT61 | Ready for review |
| FR-FE12-009 | UC58, UC59, UC60 | `backend/tests/reportService.test.js`, `backend/tests/reportRoutes.test.js` | Automated evidence; human re-review pending |
| FR-FE12-010 | UC58, UC59, UC60 | `backend/tests/reportDeterministicPolicy.test.js`, `backend/tests/reportRepository.test.js`, `backend/tests/reportContract.test.js` | Automated evidence; human re-review pending |
| AC-FE12-001 | UC58 | FT59 | Ready for review |
| AC-FE12-002 | UC59 | FT60 | Ready for review |
| AC-FE12-003 | UC60 | FT61 | Ready for review |
| AC-FE12-004 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| AC-FE12-005 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| AC-FE12-006 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| AC-FE12-007 | UC58, UC59, UC60 | FT59, FT60, FT61 | Ready for review |
| AC-FE12-008 | UC60 | FT61 | Ready for review |
| AC-FE12-009 | UC58, UC59, UC60 | `backend/tests/reportService.test.js`, `backend/tests/reportRoutes.test.js` | Automated evidence; human re-review pending |
| AC-FE12-010 | UC58, UC59, UC60 | `backend/tests/reportDeterministicPolicy.test.js`, `backend/tests/reportRepository.test.js`, `backend/tests/reportContract.test.js` | Automated evidence; human re-review pending |

### 16.1 Coverage Summary

| Requirement Type | Total IDs | Mapped IDs | Coverage |
| ---------------- | --------- | ---------- | -------- |
| Business Rules (BR-FE12-*) | 15 | 15 | 100% |
| Functional Requirements (FR-FE12-*) | 10 | 10 | 100% |
| Acceptance Criteria (AC-FE12-*) | 10 | 10 | 100% |
| **Total** | **35** | **35** | **100%** |

> BR-FE12-013 is mapped to an out-of-scope contract check: the absence of export endpoints and controls is itself verified without implementing export behavior.

---

## 17. Review Checklist

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Report viewer roles are approved.
- [x] Required borrowing metrics are approved.
- [x] Required inventory metrics are approved.
- [x] Required user statistics are approved.
- [x] Export scope is approved or explicitly out of scope.
- [x] API contract is approved in SPEC.md or copied to a dedicated shared API contract file if the team reintroduces one.
- [x] Every acceptance criterion can become a test.
## 2026-07-22 staff-console correction

- Search and filter controls on all three FE12 pages use the canonical report query contracts and render only the returned `metrics`, `rows`, and `totalRows`; demo/chart fallback data is forbidden.
- Report pages use compact bottom spacing so the scrollable content does not end with an oversized blank region.
