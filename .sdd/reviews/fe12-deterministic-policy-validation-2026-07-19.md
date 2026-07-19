# FE12 Deterministic Policy Validation - 2026-07-19

Status: AUTOMATED B6 AND AGENT BROWSER ACCEPTANCE COMPLETE; SQL-BACKED AND HUMAN B7/L4 PENDING

Branch: `feat/fe12-deterministic-policy`

## Decision

Use Hybrid development at Standard depth. The response/API contract, report authorization,
filter semantics, audit privacy, source-status normalization, and deterministic ordering are Core
and follow SDD. The three React report consumers are bounded Shell work implemented against the
approved Core contract.

## Scope

This wave reconciles FE12-N02 through FE12-N06 only. It does not add export, dashboards, BI,
schema changes, dependencies, or source-record mutation.

## Findings Addressed

| Finding | Resolution | Evidence |
| --- | --- | --- |
| Backend and frontend still used legacy report fields | Use exact `{ metrics, rows, page, limit, totalRows }` envelopes everywhere | `backend/tests/reportContract.test.js`, `frontend/test/reportOperationalFrontend.test.js` |
| Pagination bounds/defaults were not enforced consistently | Validate `page>=1`, `limit=1..100`; return defaults 1/20 | `backend/tests/reportDeterministicPolicy.test.js` |
| Unknown well-formed IDs and persisted statuses were non-deterministic | Return canonical empty reports; normalize persisted values to `UNKNOWN` | `backend/tests/reportDeterministicPolicy.test.js`, `backend/tests/reportInMemoryParity.test.js` |
| Successful view audit metadata could drift or expose filters | Emit only report type, success result, and timestamp plus standard actor/context fields | `backend/tests/reportService.test.js`, `backend/tests/reportRoutes.test.js` |
| Inventory status/location filters could match different copies | Apply both predicates to the same `bc` row and calculate full-book availability separately | `backend/tests/reportRepository.test.js` |
| User approval-period filtering was evaluated only in Node.js | Evaluate the date predicate in SQL without adding it to the global user `WHERE` scope | `backend/tests/reportRepository.test.js` |
| Borrowing row dates did not match OpenAPI `format: date` | Serialize borrow/due/return dates as `YYYY-MM-DD` in production and in-memory repositories | `backend/tests/reportRepository.test.js`, `backend/tests/reportDeterministicPolicy.test.js` |
| Derived overdue SQL filtering depended on the database host date instead of the approved library timezone | Bind the same application-computed `Asia/Ho_Chi_Minh` business date used by aggregation as `@BusinessDate`; remove `GETDATE()` dependence | `backend/tests/reportRepository.test.js` |
| Missing `BorrowDate` was silently assigned to `RequestDate` in period metrics | Group only by the canonical `BorrowDate`; keep missing dates out of `borrowCountByPeriod` in production and the in-memory test double | `backend/tests/reportRepository.test.js`, `backend/tests/reportInMemoryParity.test.js` |
| The in-memory `OVERDUE` filter did not mirror production derived-overdue behavior | Apply the same `BORROWED` plus past-due business-date rule before building the test-double report | `backend/tests/reportInMemoryParity.test.js` |
| Cross-feature and SQL-backed test sources asserted legacy payloads | Align assertions to the deterministic envelope | `backend/tests/integration.test.js`, `backend/tests/systemIntegration.test.js`, `backend/tests/sql/systemIntegration.sqltest.js` |
| Report pages could not display canonical detailed rows | Render response metrics, row tables, total counts, and page metadata without personal profile fields | `frontend/test/reportOperationalFrontend.test.js` |
| Dead frontend fixtures still preserved the legacy FE12 envelope | Remove the unused `DEMO_REPORTS` export and assert it cannot return | `frontend/test/reportAccess.test.js` |
| Export absence was documented but not executable | Assert no report export route, OpenAPI path, or frontend control exists | `backend/tests/reportDeterministicPolicy.test.js` |

## Automated Evidence

| Check | Result |
| --- | --- |
| Focused FE12 backend gate | PASS - 6 suites, 46 tests |
| Focused FE12 frontend gate | PASS - 12 tests |
| Full backend suite | PASS - 39 suites, 615 tests |
| Backend coverage threshold | PASS - 92.54% statements, 82.33% branches, 97.14% functions, 92.47% lines |
| Full frontend suite | PASS - 121 tests |
| Frontend lint | PASS |
| Frontend production build | PASS; existing bundle-size warning remains non-blocking |
| Traceability enforcement | PASS - FE12 10/10 FR tags, 100% |
| Diff hygiene | PASS - `git diff --check` |
| Playwright system golden path | PASS - 1/1 before repository remediation; canonical full-flow evidence retained |
| Exact-diff isolated Playwright CLI acceptance | PASS - Librarian all three reports, canonical metrics/rows, zero state, mobile no-overflow, Member `/forbidden`, Guest `/login` on port 4184 |

Verification commands:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reportRoutes.test.js tests/reportRepository.test.js tests/reportContract.test.js tests/reportInMemoryParity.test.js tests/reportService.test.js tests/reportDeterministicPolicy.test.js
node --test frontend/test/reportAccess.test.js frontend/test/reportFilters.test.js frontend/test/reportOperationalFrontend.test.js
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
npm.cmd run test:e2e -- --project=chromium
```

## Validation Layers

| Layer | Status | Evidence / Gap |
| --- | --- | --- |
| L1 Automated | PASS for configured non-SQL checks | Focused/full tests, lint, build, traceability, diff hygiene pass |
| L2 Spec compliance | PASS after review remediation; human re-review pending | Business-date, canonical `BorrowDate`, derived-overdue parity, deterministic contract, and affected BR/FR/AC cases map to code/tests |
| L3 Constitution/safety | PASS for current diff | Read-only, server RBAC, validation, parameterized SQL, safe audit metadata, no export/dependency/schema change |
| L4 Acceptance | PARTIAL | Agent-driven browser demonstration passes; explicit human acceptance is not yet recorded |

## Remaining Gates

- SQL-backed system integration was not executed because `DB_SERVER`, `DB_NAME`, and an approved
  mutable `SYSTEM_SQL_TEST_ALLOW_MUTATION=true` environment are not configured in this worktree.
- Fresh browser checks cover Librarian success, Member/Guest denial, all three canonical metric/row
  screens, borrowing zero state, and desktop/mobile layout. Exact-diff follow-up used isolated port
  `4184` because `4173` belongs to the FE03 worktree and was neither reused nor stopped. Admin access
  and error-state behavior remain covered by automated route/frontend tests rather than a fresh
  browser actor flow.
- Human integration review must confirm system fit and decide whether to commit, push, merge, or
  keep the branch. Historical FE12 B7 evidence does not close this deterministic wave.

## Scope Control

- No commit, push, merge, or PR was created.
- The dirty primary checkout and unrelated worktrees were not modified or reverted.
- FE04/FE09 schema work remains deferred while the FE11 schema worktree overlaps those files.
