# FE05 Catalog Data Hygiene Design

- Date: 2026-08-04
- Branch: `codex/fix-fe05-acceptance-cleanup`
- Scope: FE05 staff catalog status UX and Azure staging acceptance-fixture cleanup

## Problem

The staff catalog currently combines two independent problems:

1. A one-book activate/deactivate command changes the status filter to the committed target status. The refreshed table then contains only rows with that status, which makes unaffected books look as if they changed together.
2. The 2026-08-02 staging acceptance harness retained synthetic users, books, copies, loans, reservations, fines, notifications, and audit rows after verification. It marked them inactive instead of deleting them, so `Acceptance Book lms-acceptance-*` records remain visible to staff with blank ISBN values.

## Goals

- A status command mutates only the addressed `bookId` and reloads a mixed-status canonical list so unaffected rows remain visibly independent.
- The management page always states which status filter is applied.
- Operators can discover and hard-delete only verified staging acceptance fixture graphs.
- Cleanup is dry-run by default, parameterized, transactional, staging-only, and fail-closed on incomplete fixture identity.
- Existing FE05 rules remain unchanged: ISBN stays optional for real catalog books, copy status remains FE06-owned, and no public API or schema is added.

## Considered Approaches

### 1. Exact fixture purge plus mixed-status reload (selected)

Add a tracked operator script that discovers fixture runs from the exact title/barcode/user conventions, requires `LibraryManagementStaging`, and only deletes after an explicit `--execute`. Change both FE05 status entry points to retain search/category, clear the status filter to `Tất cả trạng thái`, reset to page 1, and reload server data.

This removes the source data pollution and fixes the misleading UI without changing catalog schema or hiding records through presentation-only rules.

### 2. Hide acceptance titles in the FE05 query (rejected)

Filtering `Acceptance Book lms-acceptance-*` in the repository would leave synthetic users and business records in staging, couple production behavior to a test naming convention, and conceal rather than repair the data problem.

### 3. Add an `IsTestData` schema flag (rejected)

A new cross-table marker would require schema, API, migration, and ownership changes for a one-time staging hygiene issue. It is disproportionate to the approved scope.

## Product UX Design

The status mutation flow becomes:

```text
selected book -> PATCH /api/books/{bookId}/{deactivate|reactivate}
              -> server commits one Books.Status row
              -> frontend keeps q/category, sets status="", page=1
              -> GET /api/admin/books canonical mixed-status list
              -> each row renders its own Books.Status
```

The panel displays `Đang lọc trạng thái: <label>` using the applied filter, not the unsubmitted draft selection. The mutation toast states that the list returned to all statuses.

## Cleanup Tool Design

The tracked script lives at `backend/scripts/cleanupStagingAcceptanceData.js` and exposes:

- no flag: read-only discovery and a candidate summary;
- `--run-id <runId>`: restrict discovery/execution to one validated run;
- `--execute`: enable deletion after discovery and identity checks.

Every accepted run ID must match `^lms-acceptance-20260802-[0-9a-f]{8}$`. Discovery requires the four exact historical full-run username/email pairs (`acc_member_a_<runId>`, `acc_member_b_<runId>`, `acc_librarian_<runId>`, and `acc_admin_<runId>` with their matching `.invalid` emails), one exact-title book, and one exact-barcode copy. Execution uses one serializable transaction and deletes child rows before parent rows. It also deletes audit rows by fixture actor or exact fixture target IDs. Any unexpected reference causes rollback.

The script never logs credentials, token hashes, passwords, or connection strings. It prints run IDs and aggregate row counts only.

## Documentation Amendment

Future temporary acceptance seeds should use `ACC-<8 hex suffix>` as the synthetic ISBN instead of `NULL`. This does not make ISBN mandatory for real FE05 books; it only keeps staff acceptance evidence recognizable if inspection occurs before cleanup.

## Error Handling

- Wrong database: abort before discovery or mutation.
- Invalid run ID: reject before opening a transaction.
- Incomplete identity set: report the counts and refuse deletion.
- Foreign-key or SQL failure: rollback the complete run cleanup.
- Post-delete residue: rollback and report failure.

## Verification

- RED-GREEN contract tests for dry-run default, staging guard, run-ID validation, exact identity checks, child-before-parent deletes, and zero-residue verification.
- RED-GREEN frontend tests for mixed-status reload and the applied-filter label.
- Backend FE05 route regression proving a status command addresses one `bookId`.
- Focused backend/frontend suites, frontend lint/build, traceability, secret scan, and `git diff --check`.
- Before any real staging deletion, run dry-run and review the exact candidate run IDs/counts.
