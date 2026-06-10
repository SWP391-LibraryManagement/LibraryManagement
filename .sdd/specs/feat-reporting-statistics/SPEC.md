# SPEC.md - FE12 Reporting & Statistics

# Version: 0.1.0

# Status: DRAFT

# Owner: Long

# Last Updated: 2026-06-10

# Feature ID: FE12

# Feature folder: `.sdd/specs/feat-reporting-statistics/`

> Source of truth for FE12 Reporting & Statistics. This spec is a draft and must be reviewed before implementation.

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
| Librarian | Library staff | View operational borrowing and inventory reports if approved. |
| Admin | System administrator | View all approved reports and user statistics. |
| Member | Registered library user | No staff reporting access in FE12. |
| Guest | Unauthenticated visitor | No reporting access. |
| Source Features | Internal data providers | Provide source data through database records. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE12-001: Actor is authenticated.
- PRE-FE12-002: Actor has a role allowed to view the requested report.
- PRE-FE12-003: Report source tables exist and status definitions are approved.
- PRE-FE12-004: Report filters such as date range, status, category, role, or member are valid.
- PRE-FE12-005: The report is read-only and does not update source data.

---

## 4. Main Flows

### MF-FE12-001: View Borrowing Report

1. Librarian/admin opens borrowing report.
2. Actor selects optional filters such as date range, borrow status, return status, member, or book.
3. The system validates filters.
4. The system reads `BorrowRequests`, `BorrowDetails`, `BookCopies`, `Books`, and related member data.
5. The system calculates approved borrowing metrics.
6. The system displays the report without changing borrowing data.

### MF-FE12-002: View Inventory Report

1. Librarian/admin opens inventory report.
2. Actor selects optional filters such as book, category, status, or location.
3. The system validates filters.
4. The system reads `Books`, `BookCopies`, categories, authors, and publishers.
5. The system calculates approved inventory metrics.
6. The system displays inventory counts and status summaries.

### MF-FE12-003: View User Statistics

1. Admin or approved actor opens user statistics.
2. Actor selects optional filters such as role, status, membership status, or date range.
3. The system validates filters.
4. The system reads `Users`, `UserRoles`, `Roles`, and `MembershipApplications`.
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
2. The system rejects the request with validation error.
3. The report is not generated.

### AF-FE12-003: No Data For Report

1. Actor selects filters that match no records.
2. The system returns an empty report with zero counts.
3. The system does not return an error.

### AF-FE12-004: Source Data Incomplete

1. Report source records are missing optional fields.
2. The system uses safe fallback values or excludes those records according to approved report rules.
3. The system does not change source records.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE12-001: Reports are read-only and must not modify source data.
- BR-FE12-002: Guests and members cannot access staff reports.
- BR-FE12-003: Report access must be role-protected on the server.
- BR-FE12-004: Borrowing reports must use FE07 borrowing records as source of truth.
- BR-FE12-005: Inventory reports must use FE06/BookCopies status as source of truth.
- BR-FE12-006: User statistics must use FE11/Users/Roles data as source of truth.
- BR-FE12-007: Membership statistics, if shown, must use FE04 membership data as source of truth.
- BR-FE12-008: Report filters must be validated before query execution.
- BR-FE12-009: Date range filters must have valid start/end order.
- BR-FE12-010: Reports must use approved status definitions from source features.
- BR-FE12-011: User statistics must not expose unnecessary personal data.
- BR-FE12-012: Aggregate counts must be reproducible from source records.
- BR-FE12-013: Export is out of scope unless approved by the team.

---

## 7. Functional Requirements

- FR-FE12-001: When an authorized actor views borrowing report, the system shall return approved borrowing metrics.
- FR-FE12-002: When an authorized actor views inventory report, the system shall return approved inventory metrics.
- FR-FE12-003: When an authorized actor views user statistics, the system shall return approved user/member metrics.
- FR-FE12-004: If an actor is unauthorized, then the system shall deny report access.
- FR-FE12-005: If report filters are invalid, then the system shall reject the request.
- FR-FE12-006: If report filters match no data, then the system shall return zero/empty report results.
- FR-FE12-007: When reports are generated, the system shall not update source data.
- FR-FE12-008: When user statistics are generated, the system shall return aggregate data by default rather than raw personal details.

---

## 8. Acceptance Criteria

- AC-FE12-001: Given an authorized actor, when viewing borrowing report, then borrowing totals and status counts are displayed.
- AC-FE12-002: Given an authorized actor, when viewing inventory report, then copy counts by status and book/category are displayed according to filters.
- AC-FE12-003: Given an authorized actor, when viewing user statistics, then user/member counts are displayed according to approved grouping.
- AC-FE12-004: Given a guest or member, when requesting staff reports, then access is denied.
- AC-FE12-005: Given invalid report filters, when the request is submitted, then the system returns validation error.
- AC-FE12-006: Given filters with no matching data, when report is generated, then the system returns zero/empty result.
- AC-FE12-007: Given a report request, when the report completes, then no source business records are modified.
- AC-FE12-008: Given user statistics, when results are returned, then unnecessary personal profile details are not exposed.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE12-001 | Guest requests report | Return unauthorized response. |
| EC-FE12-002 | Member requests staff report | Return forbidden response. |
| EC-FE12-003 | Invalid date range | Reject request. |
| EC-FE12-004 | Unsupported status filter | Reject request. |
| EC-FE12-005 | Unknown category/book/member/role filter | Return empty report or validation error according to approved policy. |
| EC-FE12-006 | No matching records | Return zero counts and empty rows. |
| EC-FE12-007 | Source status value unknown | Group as `UNKNOWN` or exclude according to approved policy. |
| EC-FE12-008 | Report query timeout | Return safe error and log safely. |
| EC-FE12-009 | Large date range | Require pagination/limits or return warning according to policy. |
| EC-FE12-010 | Missing optional source field | Use safe fallback in report display. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Source for user statistics and member/staff counts. |
| UserRoles | Source for role-based user statistics. |
| Roles | Provides role names. |
| MembershipApplications | Source for membership status counts if included. |
| Books | Source for inventory and borrowing report book metadata. |
| Categories | Source for inventory grouping. |
| BookCopies | Source for inventory status counts. |
| BorrowRequests | Source for borrowing request counts and status. |
| BorrowDetails | Source for borrowed/returned/overdue item counts. |
| Fines | Source for fine-related report extensions if approved. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| fromDate | date | No | Must be <= `toDate` when both provided. |
| toDate | date | No | Must be >= `fromDate` when both provided. |
| status | string | No | Must be an approved status for selected report type. |
| categoryId | integer | No | Used for inventory report. |
| bookId | integer | No | Used for borrowing/inventory report. |
| userId | integer | No | Staff-only filter when approved. |
| roleId | integer | No | Used for user statistics. |
| page | integer | No | Positive integer for detailed rows. |
| limit | integer | No | Must be within approved maximum. |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract must be copied into `docs/api/api-contract.md` before implementation if the team keeps a dedicated API document.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/reports/borrowing` | Librarian/Admin | Query: `fromDate?, toDate?, status?, bookId?, userId?` | Borrowing report metrics | Protected read-only endpoint. |
| GET | `/api/reports/inventory` | Librarian/Admin | Query: `categoryId?, bookId?, status?, location?` | Inventory report metrics | Protected read-only endpoint. |
| GET | `/api/reports/users` | Admin/Librarian if approved | Query: `roleId?, status?, membershipStatus?, fromDate?, toDate?` | User statistics | Access depends on approved role policy. |

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

- NFR-FE12-PERF-001: Reports should support date/status filters to avoid scanning excessive data.
- NFR-FE12-PERF-002: Detailed report rows should be paginated when returned.
- NFR-FE12-PERF-003: Expensive report queries should use indexed fields where practical.

### 12.4 Logging and Audit

- NFR-FE12-LOG-001: Report access failures should be logged safely.
- NFR-FE12-LOG-002: Audit logging of successful report viewing is optional unless required by the team.

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
- CSV/PDF export unless approved.
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

## 15. Open Questions

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE12-001 | Which roles can view borrowing, inventory, and user reports? | Team/Teacher | Open |
| Q-FE12-002 | Which borrowing metrics are required: total requests, borrowed count, returned count, overdue count, by date? | Team/Teacher | Open |
| Q-FE12-003 | Which inventory metrics are required: total copies, available, borrowed, reserved, damaged/lost, by category? | Team/Teacher | Open |
| Q-FE12-004 | Which user statistics are required: total users, by role, active/inactive, membership status? | Team/Teacher | Open |
| Q-FE12-005 | Is export to CSV/PDF required in Phase 1? | Team/Teacher | Open |
| Q-FE12-006 | Should report access be audited? | Team/Teacher | Open |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE12-003 | UC58, UC59, UC60 | FT59, FT60, FT61 | Not Started |
| FR-FE12-001 | UC58 | FT59 | Not Started |
| BR-FE12-004 | UC58 | FT59 | Not Started |
| FR-FE12-002 | UC59 | FT60 | Not Started |
| BR-FE12-005 | UC59 | FT60 | Not Started |
| FR-FE12-003 | UC60 | FT61 | Not Started |
| BR-FE12-006 | UC60 | FT61 | Not Started |
| FR-FE12-005 | UC58, UC59, UC60 | FT59, FT60, FT61 | Not Started |
| FR-FE12-007 | UC58, UC59, UC60 | FT59, FT60, FT61 | Not Started |

---

## 17. Review Checklist

Before this SPEC.md is approved:

- [ ] Report viewer roles are approved.
- [ ] Required borrowing metrics are approved.
- [ ] Required inventory metrics are approved.
- [ ] Required user statistics are approved.
- [ ] Export scope is approved or explicitly out of scope.
- [ ] API contract is copied to `docs/api/api-contract.md` if the team uses a shared API contract.
- [ ] Every acceptance criterion can become a test.
