# FE05 Book Reconciliation Validation - 2026-07-19

## Decision

- Method: Hybrid SDD+ADD, Full depth for FE05 Core and bounded ADD for the frontend Shell.
- Scope: FE05-T001 through FE05-T008 in `feat/fe05-book-reconciliation`.
- Integration state: ready for human review; no commit, push, PR, or merge performed.

## Evidence

| Gate | Command / check | Result |
| --- | --- | --- |
| Focused backend | `npm.cmd --prefix backend test -- --runTestsByPath tests/bookRoutes.test.js tests/bookAvailabilityRepository.test.js --silent` | 45/45 passed |
| Focused SQL contract | `npm.cmd --prefix backend run test:sql:fe05 -- --silent` | 7/7 passed on disposable SQL Server |
| Frontend FE05 | `node --test frontend/test/bookManagementFrontend.test.js` | 6/6 passed |
| Full backend | `npm.cmd --prefix backend test -- --silent` | 649/649 passed |
| Full frontend | `npm.cmd --prefix frontend test` | 120/120 passed |
| Coverage | `npm.cmd --prefix backend run test:coverage:ci -- --silent` | statements 92.51%, branches 82.46%, functions 97.10%, lines 92.44% |
| Frontend lint | `npm.cmd --prefix frontend run lint` | passed |
| Frontend build | `npm.cmd --prefix frontend run build` | passed; Vite chunk-size warning only |
| Traceability | `npm.cmd run trace:enforce` | FE05 26/26 (100%); enforcement passed |
| OpenAPI parse | PyYAML load plus FE05 route assertions | passed |
| Import smoke | backend app/routes/service require smoke | passed |
| Diff hygiene | `git diff --check` | passed |

## Spec and safety checks

- Public reads hide inactive books; staff reads use `/api/admin/books` and server-owned pagination.
- Create starts `ACTIVE`; metadata update excludes status and copy lifecycle fields.
- Update/deactivate/reactivate require `If-Match`; stale state maps to `409 STALE_BOOK_STATE` and a reload instruction.
- Deactivate/reactivate require a trimmed reason and write only `Books.Status`; FE05 does not mutate `BookCopies.Status`.
- Availability is derived as `AVAILABLE`/`UNAVAILABLE`; the UI does not label unrelated unavailable states as borrowed.
- SQL access remains parameterized and no secrets were added.

## Open gates

- L4 browser acceptance and FE06 ownership confirmation remain pending.
- Human B7 integration review remains mandatory before commit, publication, or merge.

## Post-Origin Sync Revalidation

- Fast-forwarded the dirty feature worktree from `62ac2d1` to `origin/main@b2ad9b1` without overlap, commit, stash, or loss of local changes.
- Fresh focused verification after the sync and rowversion remediation: `bookRoutes.test.js` plus `bookAvailabilityRepository.test.js` passed 45/45.

## Live SQL Addendum

- The missing `bookConcurrency.sqltest.js` fan-in was restored through RED-GREEN: the FE05 SQL command first failed with `No tests found`, then passed 4/4 static checks.
- Mutable SQL initially proved that every valid mutation was incorrectly classified as stale because `CONVERT(VARCHAR, RowVersion, 2)` crossed the `mssql` driver as an 8-byte binary string while API versions were 16-character hex.
- `bookRepository` now reads raw rowversion buffers and normalizes both operands through one hex encoder.
- FE05 then passed 7/7 SQL cases; after adding the FE03 suite, the aggregate SQL gate passed 8/8 suites, 61/61 tests with `DB_CLEAN`/`LOGIN_CLEAN` cleanup.
