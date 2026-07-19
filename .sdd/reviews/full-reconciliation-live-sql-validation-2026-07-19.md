# Full Reconciliation Live SQL Validation - 2026-07-19

Status: PASS

Scope: FE01-FE12 reconciliation SQL-backed validation on local SQL Server.

## Isolated Runtime

- Disposable database: `LibraryManagementReconciliationTest`
- Disposable SQL login: `lms_reconciliation_runner`
- Authentication secret: generated in process memory only; never written to a file or command output
- Application databases: not used or mutated

## Schema Validation

The canonical `database/Librarymanagement.sql` baseline was applied to the disposable database.
These migrations were then applied twice, in order, to prove repeatable execution:

1. `database/migrations/2026-07-19-fe04-membership-concurrency.sql`
2. `database/migrations/2026-07-19-fe05-book-rowversion.sql`
3. `database/migrations/2026-07-19-fe06-bookcopy-rowversion.sql`
4. `database/migrations/2026-07-19-fe10-otp-templates.sql`
5. `database/migrations/2026-07-19-fe11-finalization.sql`

Result: baseline PASS; migration pass 1/2 PASS; migration pass 2/2 PASS.

## SQL-Backed Suites

Command boundary: Jest `**/*.sqltest.js` with the feature mutation flags enabled only for the disposable database process.

| Suite | Result |
| --- | --- |
| `backend/tests/sql/publicBrowseAvailability.sqltest.js` | PASS |
| `backend/tests/sql/profileConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/membershipConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/bookConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/inventoryConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/borrowingConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/fineConcurrency.sqltest.js` | PASS |
| `backend/tests/sql/systemIntegration.sqltest.js` | PASS |

Aggregate result: **8/8 suites, 61/61 tests passed**.

## Defects Exposed During Live Validation

1. The baseline used a physical `BookCopies.RowVersion` name while the canonical FE06 binding requires `BookCopies.Version`.
2. FE11 migration dynamic SQL attempted to concatenate `QUOTENAME` inside `EXEC`; the migration now builds a statement variable and executes it through `sys.sp_executesql`.
3. FE12 system SQL assertions expected stale payload fields and were aligned to the deterministic contract.
4. The FE07 concurrency barrier conflicted with the intentional member-scoped `sp_getapplock`; the test now accepts only the approved serialized outcomes.
5. FE05 compared a canonical 16-character rowversion hex string with an 8-byte binary string returned by the `mssql` driver for `CONVERT(VARCHAR, RowVersion, 2)`, so every valid update/deactivate/reactivate was classified as stale. FE05 now reads raw rowversion buffers and normalizes both comparison operands through one hex encoder.

## Cleanup Evidence

Cleanup ran in a `finally` boundary after the suites:

- Database state: `DB_CLEAN`
- Login state: `LOGIN_CLEAN`
- Saved environment or credential file: none

## Residual Boundary

This record proves the listed schema and SQL-backed automated gate. It does not replace feature-specific browser acceptance, whole-repository regression, final diff review, CI association, or human integration acceptance.
