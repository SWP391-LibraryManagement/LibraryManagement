# ADR-002: Database Design

Status: APPROVED - FE11 FINALIZATION MIGRATION ACTIVE; IMPLEMENTATION PENDING
Date: 2026-06-10
Last Updated: 2026-07-23

## Context

The approved database is SQL Server. The current baseline script is `database/Librarymanagement.sql`.

Feature specs define the source of truth for business behavior. The SQL script is a baseline design artifact and must be reviewed against approved specs before feature implementation.

## Decision

Use SQL Server with relational tables for users, roles, books, copies, borrowing, reservations, fines, notifications, reports source data, and audit logs.

Database access in the application must use the `mssql` Node.js package with parameterized queries. Direct string interpolation in SQL is forbidden.

## Baseline Table Ownership

| Area | Expected Tables | Owning Feature |
| --- | --- | --- |
| Users and roles | `Users`, `Roles`, `UserRoles` | FE02, FE11 |
| Profile and membership | `UserProfiles`, `Members`, membership/application tables if present | FE03, FE04 |
| Books | `Books`, `Categories`, `Authors`, `Publishers` if present | FE01, FE05 |
| Inventory/copies | `BookCopies` or equivalent copy inventory table | FE06 |
| Borrowing | `BorrowRequests`, `BorrowTransactions`, `BorrowDetails` or equivalent | FE07 |
| Reservations | `Reservations` or equivalent queue/hold table | FE08 |
| Fines | `Fines`, fine payment/collection records if present | FE09 |
| Notifications | `Notifications`, `NotificationTemplates`, `NotificationAttempts` if present | FE10 |
| Audit | `AuditLogs` | Cross-feature, especially FE02, FE05, FE07, FE09, FE11 |
| Reporting | Read-only queries over source tables | FE12 |

## Required Schema Review Items

Before implementation, check `database/Librarymanagement.sql` against these approved rules:

- Users must support active/inactive status and role assignments.
- Password hashes must be stored, never plaintext passwords.
- Email/username uniqueness must match FE02/FE11 approved rules.
- Refresh/reset/setup tokens must not be stored as raw secrets if implementation stores tokens; store hashed tokens where feasible.
- Book availability must derive from approved copy/status data, not only a loose display field.
- Categories, authors, and publishers store a database-generated `CreatedAt` timestamp so protected catalog-management reads do not invent creation dates.
- Categories, authors, and publishers use `ACTIVE`/`INACTIVE` status instead of physical deletion; existing book references are preserved.
- Copy statuses must align with approved Phase 1 statuses: `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE`.
- Borrowing must record member, copy/book, borrow date, due date, status, and creator.
- Fine calculation must be traceable: overdue days, rate, amount, related borrow/copy, calculation date.
- Notification attempts must not store raw reset tokens or sensitive links in logs.
- Audit logs must capture actor, action, target, timestamp, and safe metadata.
- FE07 persists `BorrowRequests.Status` as `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, or `CANCELLED`; `BorrowDetails.Status` as `REQUESTED`, `BORROWED`, `RETURNED`, `LOST`, or `DAMAGED`. `BorrowDetails.DueDate` is nullable for `REQUESTED` details and required by the approval flow before `BORROWED`. `OVERDUE` is derived for FE09/FE12 from `BORROWED` plus `DueDate < today`, so it is excluded from `CK_BorrowDetails_Status`.

## Migration Policy

- Do not silently change database schema.
- Any schema change affecting behavior must update the related `SPEC.md` or ADR before implementation.
- For Phase 1, SQL scripts may be used instead of a migration framework, but every schema revision must be reviewable.
- Seed data must not include real personal data, passwords, tokens, or secrets.

## FE10 Durable Delivery Claim Decision

The approved FE10 lifecycle includes `PENDING`, `PROCESSING`, `SENT`, and
`FAILED`. `DELIVERED`, `SKIPPED`, and `CANCELLED` remain compatibility values
without Phase 1 transitions.

- A queued worker changes one eligible row from `PENDING` to `PROCESSING` in a
  locked transaction and commits before provider I/O.
- A synchronous sensitive request is inserted as `PROCESSING` before provider
  I/O, while rendered credentials remain memory-only.
- `PROCESSING -> SENT` and `PROCESSING -> FAILED` each use a new short
  transaction that also inserts the matching `NotificationAttempts` row.
- If provider I/O completes but terminal persistence fails, the durable row
  remains `PROCESSING`. It is not automatically reclaimed and cannot use the
  manual retry endpoint because delivery may already have occurred.

The canonical constraint is synchronized by the reviewable idempotent migration
`database/migrations/2026-07-23-fe10-processing-status.sql`. Review requires
static model/baseline/OpenAPI parity plus two successful executions on a named
disposable local SQL Server database before Azure deployment.

## FE11 Finalization Migration Decision

The approved FE11 Finalization Batch activates one reviewable, idempotent SQL Server script at
`database/migrations/2026-07-19-fe11-finalization.sql`. Product implementation has not started at
this governance checkpoint.

The migration must synchronize these five existing-table columns with the baseline schema and
application contracts:

| Table | Column | Target definition |
| --- | --- | --- |
| `Users` | `Email` | `NVARCHAR(255) NOT NULL` |
| `Users` | `DeactivatedAt` | `DATETIME NULL` |
| `UserProfiles` | `Department` | `NVARCHAR(100) NULL` |
| `UserProfiles` | `Specialization` | `NVARCHAR(100) NULL` |
| `Notifications` | `RecipientEmail` | `NVARCHAR(255) NOT NULL` |

`Users.Email` uses deterministic unique index `UX_Users_Email`. Before altering it, the script must
fail safely when any email exceeds 255 characters or when case-insensitive duplicates exist. The
script must preserve data, use deterministic object names, contain no seed identity or credential,
and be safe to execute twice without duplicate columns, constraints, indexes, or data mutation.

Review requires static contract checks plus two successful executions against a disposable SQL
Server database when that environment is available. If live SQL Server is unavailable, only that
execution evidence may remain recorded under `TD-021`; the script, baseline, models, bindings, and
static idempotence checks remain mandatory.

The required disposable SQL Server evidence passed on 2026-07-19: the canonical baseline and all
five reconciliation migrations executed successfully, the migrations passed a second execution,
and the database/login were removed afterward. See
`.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.

The Phase 3 Azure staging upgrade exposed one legacy-schema difference that the disposable
canonical baseline did not: `Books.ISBN` still had the filtered unique index
`UX_Books_ISBN_NotNull` while its width needed reconciliation. The FE05 migration therefore drops
that named index only inside the width-change branch, alters `ISBN`, and recreates the same unique
filtered index in the transaction. The target schema and FE05 contract are unchanged; this makes
the approved migration safe for an existing Week 13 database as well as a canonical baseline.

## FE04 Membership Concurrency Migration Decision

FE04 owns the filtered unique index
`UX_MembershipApplications_User_Pending` on `MembershipApplications(UserId)` where
`Status = 'PENDING'`. This preserves immutable approved/rejected history while making one pending
application per user a database invariant rather than a service-only pre-check.

The reviewable, idempotent migration is
`database/migrations/2026-07-19-fe04-membership-concurrency.sql`. It must fail safely when existing
data already contains duplicate pending rows, create no seed data, and be safe to execute twice.
Application and review mutations must keep the canonical `Members` projection and matching audit
entry in the same SQL transaction; final review reads use `UPDLOCK, HOLDLOCK` and updates retain a
`Status = 'PENDING'` predicate.

## Configuration

Database connection values must come from environment variables, for example:

- `DB_SERVER`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_ENCRYPT`
- `DB_TRUST_SERVER_CERTIFICATE`

No database credentials may be committed.

## Consequences

- Week 4 should include a schema gap review before backend repositories are implemented.
- Repository methods must be written around approved table/column names after schema review.
- FE12 reporting must read from source tables and remain read-only.

## Week 4 Smoke Test Result

`database/Librarymanagement.sql` was revised after the Week 4 database gap review and smoke-tested on local SQL Server.

Command:

```powershell
sqlcmd -S localhost -E -b -i database\Librarymanagement.sql
```

Result:

- PASS on local `MSSQLSERVER`.
- Database created: `LibraryManagementDB`.
- Tables created: 20.
- Confirmed key Week 4 tables: `AuthTokens`, `NotificationTemplates`, `Notifications`, `NotificationAttempts`, `Members`, `AuditLogs`.

Team review is still required before merge because database schema is a Core artifact.

## Week 4 Schema Gate

Before Week 5 implementation starts:

- [x] Produce a database gap review against all approved specs.
- [x] Decide whether `Librarymanagement.sql` is the Phase 1 baseline or needs revision.
- [x] Document required schema changes through the Week 4 database gap review and this ADR.
- [x] Confirm token/session/audit tables for FE02 and FE11 before auth implementation.
- [ ] Team review of the revised SQL script before merge.
## 2026-07-22 deployed metadata reconciliation

Some pre-baseline staging databases contain `Authors`, `Publishers`, and `Categories` without the canonical `Status` and `CreatedAt` columns. The Admin library repository already relies on those fields for list/export/deactivation, so code-only deployment can produce `INTERNAL_ERROR` even when the frontend bundle is current.

The reviewable, transactional, idempotent reconciliation script is `database/migrations/2026-07-22-library-metadata-compatibility.sql`. It adds only missing columns with canonical defaults, preserves existing rows, validates supported status values, and must be applied to an existing environment before deploying repository code that reads those columns.

The same staging review found that older `BorrowRequests` tables can predate the canonical approval/rejection timestamps. `database/migrations/2026-07-22-borrow-request-workflow-columns.sql` idempotently adds missing `ApprovedAt`, `RejectedAt`, `ProcessedAt`, and `UpdatedAt` columns so the FE07 approve/reject transactions can execute on an upgraded database.
