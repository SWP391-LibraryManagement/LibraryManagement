# FE06 Inventory Reconciliation Validation - 2026-07-19

## Decision

- Method: Hybrid SDD+ADD, Full depth for inventory state, schema, concurrency, and audit Core; bounded ADD for the frontend Shell.
- Scope: FE06-T001 through FE06-T008 in `feat/fe06-inventory-reconciliation`.
- Integration state: ready for human review; no commit, push, PR, or merge performed.

## Fresh evidence

| Gate | Command / check | Result |
| --- | --- | --- |
| Focused backend | `npm.cmd --prefix backend test -- --runTestsByPath tests/inventoryRoutes.test.js --silent` | 31/31 passed |
| FE06 SQL contract | `npm.cmd --prefix backend run test:sql:fe06 -- --silent` | 5/5 static passed; 1 live SQL test skipped |
| FE06 frontend | `node --test frontend/test/inventoryOperationalFrontend.test.js` | 6/6 passed |
| Full backend | `npm.cmd --prefix backend test -- --silent` | 633/633 passed |
| Full frontend | `npm.cmd --prefix frontend test` | 124/124 passed |
| Coverage | `npm.cmd --prefix backend run test:coverage:ci -- --silent` | statements 92.51%, branches 82.46%, functions 97.10%, lines 92.44% |
| Frontend lint/build | `npm.cmd --prefix frontend run lint` and `npm.cmd --prefix frontend run build` | passed; Vite chunk-size warning only |
| Traceability | `npm.cmd run trace:enforce` | FE06 24/24 (100%); enforcement passed |
| OpenAPI | PyYAML load plus FE06 route assertions | passed |
| Import smoke | backend app/routes/service require smoke | passed |
| Diff hygiene | `git diff --check` | passed |

## Spec and safety checks

- Inventory list returns the exact server-owned page/count envelope and whitelists copy/book summary fields.
- Create is server-controlled `AVAILABLE`, rejects inactive parent books, and never edits FE05 metadata.
- Existing-copy mutations require opaque `If-Match`; stale state returns `409 STALE_COPY_STATE` without mutation.
- Manual state changes reject direct `BORROWED`/`RESERVED`, require a trimmed reason, and direct conflicts to FE07/FE08.
- Repository lock order is `BookCopies -> BorrowDetails -> Reservations`; mutation and audit share one transaction.
- Deactivation is soft-only and duplicate current-version deactivation is idempotent without a second transition audit.
- No secret, borrower identity, reservation-owner identity, fine data, or protected audit metadata is exposed by FE06 responses.

## Open gates

- Live SQL rowversion/concurrency execution requires `DB_SERVER`/`DB_NAME` and `FE06_SQL_TEST_ALLOW_MUTATION=true` in an approved mutable SQL Server environment.
- Browser/L4 acceptance and FE05/FE07/FE08 ownership/lock-order confirmation remain pending.
- Human B7 integration review remains mandatory before commit, publication, or merge.

## Post-Origin Sync Revalidation

- Fast-forwarded the dirty feature worktree from `62ac2d1` to `origin/main@b2ad9b1` without overlap, commit, stash, or loss of local changes.
- Fresh focused verification after the sync: `inventoryRoutes.test.js` passed 31/31.
