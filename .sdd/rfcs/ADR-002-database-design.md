# ADR-002: Database Design

Status: Approved for Week 4 schema review
Date: 2026-06-10

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
- Copy statuses must align with approved Phase 1 statuses: `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE`.
- Borrowing must record member, copy/book, borrow date, due date, status, and creator.
- Fine calculation must be traceable: overdue days, rate, amount, related borrow/copy, calculation date.
- Notification attempts must not store raw reset tokens or sensitive links in logs.
- Audit logs must capture actor, action, target, timestamp, and safe metadata.

## Migration Policy

- Do not silently change database schema.
- Any schema change affecting behavior must update the related `SPEC.md` or ADR before implementation.
- For Phase 1, SQL scripts may be used instead of a migration framework, but every schema revision must be reviewable.
- Seed data must not include real personal data, passwords, tokens, or secrets.

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
