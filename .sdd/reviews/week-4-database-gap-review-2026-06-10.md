# Week 4 Database Gap Review

Date: 2026-06-10
Status: REVIEW COMPLETE - SCHEMA REVISION NEEDED BEFORE WEEK 5 IMPLEMENTATION

## Scope

Review `database/Librarymanagement.sql` against approved Phase 1 specs and `.sdd/rfcs/ADR-002-database-design.md`.

This review does not change the database schema. It identifies gaps that must be resolved before backend repositories/services are implemented.

## Current Tables Detected

| Table | Columns | Foreign Keys |
|---|---|---|
| `Roles` | RoleId, RoleName | - |
| `Users` | UserId, Username, Email, PasswordHash, Phone, Status, CreatedAt | - |
| `UserRoles` | UserId, RoleId | FOREIGN KEY (UserId) REFERENCES Users(UserId)<br>FOREIGN KEY (RoleId) REFERENCES Roles(RoleId) |
| `UserProfiles` | ProfileId, UserId, FullName, Address, DateOfBirth, AvatarUrl | FOREIGN KEY (UserId) REFERENCES Users(UserId) |
| `MembershipApplications` | ApplicationId, UserId, Status, AppliedAt, ApprovedAt | FOREIGN KEY (UserId) REFERENCES Users(UserId) |
| `Categories` | CategoryId, CategoryName | - |
| `Authors` | AuthorId, AuthorName | - |
| `Publishers` | PublisherId, PublisherName | - |
| `Books` | BookId, Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl | FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId)<br>FOREIGN KEY (AuthorId) REFERENCES Authors(AuthorId)<br>FOREIGN KEY (PublisherId) REFERENCES Publishers(PublisherId) |
| `BookCopies` | CopyId, BookId, Barcode, Status, Location | FOREIGN KEY (BookId) REFERENCES Books(BookId) |
| `BorrowRequests` | RequestId, UserId, RequestDate, Status | FOREIGN KEY (UserId) REFERENCES Users(UserId) |
| `BorrowDetails` | BorrowDetailId, RequestId, CopyId, DueDate, ReturnDate, Status | FOREIGN KEY (RequestId) REFERENCES BorrowRequests(RequestId)<br>FOREIGN KEY (CopyId) REFERENCES BookCopies(CopyId) |
| `Reservations` | ReservationId, UserId, CopyId, ReservedAt, Status | FOREIGN KEY (UserId) REFERENCES Users(UserId)<br>FOREIGN KEY (CopyId) REFERENCES BookCopies(CopyId) |
| `Fines` | FineId, UserId, BorrowDetailId, Amount, Reason, Status, PaidAt | FOREIGN KEY (UserId) REFERENCES Users(UserId)<br>FOREIGN KEY (BorrowDetailId) REFERENCES BorrowDetails(BorrowDetailId) |
| `AuditLogs` | LogId, UserId, Action, CreatedAt | FOREIGN KEY (UserId) REFERENCES Users(UserId) |

## Feature Coverage

| Area | Required By Specs/ADR | Status | Finding |
|---|---|---|---|
| FE02/FE11 Users/Roles | Users, Roles, UserRoles with active/inactive status, unique username/email, password hash, role assignments | PARTIAL | Users/Roles/UserRoles exist; Users has Status and PasswordHash. Missing token/session tables, lock/rate-limit fields, email verification fields, UpdatedAt. Seed uses unsafe password-like values. |
| FE03 User Profile | UserProfiles with own profile fields and user FK | PARTIAL | UserProfiles exists with FullName, Address, DateOfBirth, AvatarUrl. Phone is in Users, which is acceptable but should be confirmed in FE03/FE11 planning. |
| FE04 Membership | Membership applications/status and link to user/member | PARTIAL | MembershipApplications exists. Missing explicit reviewed membership/member status table if FE04 needs approved member status separate from application status. |
| FE01/FE05 Books | Books, Categories, Authors, Publishers; active/inactive book status; searchable metadata | PARTIAL | Core tables exist. Books lacks Status/IsActive and ISBN unique constraint; public browse rule needs inactive books hidden. |
| FE06 Inventory | BookCopies with barcode, location, approved statuses | PARTIAL | BookCopies exists. Status is free text with no CHECK constraint for AVAILABLE/BORROWED/RESERVED/DAMAGED/LOST/INACTIVE. |
| FE07 Borrowing | Borrow request/detail records with member, copy, borrow date, due date, return date, status, creator/processor | PARTIAL | BorrowRequests/BorrowDetails exist. Missing ApprovedAt/BorrowDate/CreatedBy/ProcessedBy and explicit requester/member naming. BorrowDetails Status defaults BORROWED even before approval may be ambiguous. |
| FE08 Reservation | Reservations with user, copy, queue/status, expiry/hold data | PARTIAL | Reservations exists. Missing ExpiresAt/QueuePosition/NotifiedAt or hold deadline fields from reservation queue behavior. |
| FE09 Fine | Fine calculation trace: overdue days, rate, amount, related borrow/copy, calculation date, paid/collection details | PARTIAL | Fines exists. Missing OverdueDays, RatePerDay, CalculatedAt, CreatedBy, payment/collection method/reference, waiver fields if needed. |
| FE10 Notification | Notifications/templates/attempts without raw secrets | MISSING | No notification tables found. FE10 needs records/templates/attempts or documented mock-only storage decision. |
| Audit Logs | Actor/action/target/timestamp/safe metadata | PARTIAL | AuditLogs exists but only UserId, Action, CreatedAt. Missing TargetType, TargetId, Metadata, IpAddress/request context if needed. |
| FE12 Reporting | Read-only reporting over source tables | OK | No separate reporting table required in Phase 1; source tables exist partially but depend on gap fixes above. |

## Blockers Before Week 5

| ID | Severity | Issue | Required Action |
|---|---|---|---|
| DB-BLOCKER-001 | High | Seed data inserts `PasswordHash` values of `123`, which violates no plaintext/password-like seed rule. | Replace with non-login demo hashes or remove seeded users before implementation. Do not commit real credentials. |
| DB-BLOCKER-002 | High | No refresh token, password reset token, email verification token, or account setup token storage model exists. | Add reviewed token/session tables or document a stateless/mock design in ADR/spec before FE02 implementation. |
| DB-BLOCKER-003 | High | No notification tables exist for FE10 although FE10 requires records/templates/attempts. | Add `Notifications`, `NotificationTemplates`, `NotificationAttempts` or explicitly limit FE10 Phase 1 to mock-only without persistence and update spec/ADR. |
| DB-BLOCKER-004 | High | Borrowing records do not fully capture borrow approval/creator/borrow date needed for traceability. | Revise borrow tables with approved date/user/status fields before FE07 repositories. |
| DB-BLOCKER-005 | High | Fine table cannot fully trace fine calculation. | Add overdue days, rate, calculated timestamp, and collection metadata before FE09 implementation. |
| DB-BLOCKER-006 | Medium | Book and copy statuses are free text without constraints; Books lacks active/inactive status. | Add CHECK constraints or controlled lookup strategy and book status field. |
| DB-BLOCKER-007 | Medium | AuditLogs table is too thin for administrative action traceability. | Add target type/id and safe metadata fields. |

## Recommended Schema Revision Tasks

1. Create `database/schema-review-notes.md` or update `ADR-002` with final table decisions.
2. Revise `database/Librarymanagement.sql` only after team approval of the blockers above.
3. Prioritize FE02/FE11 schema first because Week 5 Sprint 1 starts with Auth & Users.
4. Add token/session/audit tables before writing auth repositories.
5. Add notification persistence or explicitly approve mock-only notification storage before FE10 planning.
6. Keep seed data safe: no real emails, no raw passwords, no usable default admin credentials.

## Week 4 Gate Result

PASS AFTER REVISION. The current SQL script has been revised and smoke-tested locally. Team review is still required before merge because database schema is a Core artifact.

## Schema Revision Verification

Status: PASSED LOCAL SQLCMD SMOKE TEST

After the initial gap review, `database/Librarymanagement.sql` was revised to address the Week 4 blockers:

- Added auth token storage through `AuthTokens`.
- Added notification persistence tables.
- Added user auth/status fields.
- Added member status table.
- Added book/copy/status constraints.
- Added borrowing, reservation, fine, and audit trace fields.
- Replaced unsafe seed password values with non-production demo placeholder hashes.
- Added `SET QUOTED_IDENTIFIER ON` and `SET ANSI_NULLS ON` for SQL Server filtered index support.

Local verification command:

```powershell
sqlcmd -S localhost -E -b -i database\Librarymanagement.sql
```

Result: PASS on local SQL Server `MSSQLSERVER`.

Post-run check found 20 tables, including `AuthTokens`, `NotificationTemplates`, `Notifications`, and `NotificationAttempts`.

## Additional Status-Alignment Findings From Phase 1 Audit

Status: ACTION REQUIRED BEFORE FEATURE IMPLEMENTATION

The SQL script passes a local smoke test, but a later Phase 1 SPEC audit found enum/status alignment gaps that must be resolved before repositories and services are implemented:

| ID | Severity | Area | SPEC Requirement | Current SQL Gap | Required Action |
| --- | --- | --- | --- | --- | --- |
| DB-FOLLOWUP-001 | High | FE07 Borrowing | `BorrowDetails.Status` must support requested and damaged/lost/returned lifecycle states. | `CK_BorrowDetails_Status` allows `BORROWED`, `RETURNED`, `OVERDUE`, `LOST`; it does not allow `REQUESTED` or `DAMAGED`. | Add approved FE07 detail status values before FE07 implementation. |
| DB-FOLLOWUP-002 | High | FE07 Borrowing | `BorrowRequests.Status` must support `COMPLETED` when all details are terminal. | `CK_BorrowRequests_Status` allows `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`; it does not allow `COMPLETED`. | Add `COMPLETED` before FE07 return workflow implementation. |
| DB-FOLLOWUP-003 | High | FE07 Borrowing | `BorrowDetails.DueDate` is required only when a borrow detail is approved/borrowed. | `DueDate` is `NOT NULL`, which conflicts with requested details created before approval. | Allow `DueDate` to be nullable until approval or revise the approved FE07 data rule. |
| DB-FOLLOWUP-004 | Medium | FE08 Reservation | Reservation status values include `ACTIVE`, `CANCELLED`, `NOTIFIED`, `FULFILLED`, and `EXPIRED`. | `CK_Reservations_Status` allows `ACTIVE`, `FULFILLED`, `CANCELLED`, `EXPIRED`; it does not allow `NOTIFIED`. | Add `NOTIFIED` or update FE08 SPEC before FE08 implementation. |
| DB-FOLLOWUP-005 | Medium | FE10 Notification | Notification status values include `PENDING`, `SENT`, `DELIVERED`, `FAILED`, and `SKIPPED`. | `CK_Notifications_Status` allows `PENDING`, `SENT`, `FAILED`, `CANCELLED`; it does not allow `DELIVERED` or `SKIPPED`, and adds `CANCELLED`. | Align SQL and FE10 SPEC status values before FE10 implementation. |

These are not Phase 1 SPEC blockers, but they are Week 4/implementation blockers.
