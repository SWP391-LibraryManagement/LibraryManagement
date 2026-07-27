# FE07/FE08/FE10/FE12 Business-Rule Alignment Validation

Date: 2026-07-27

## 1. Review State

- Branch: `codex/fe07-fe10-fe12-rule-alignment`
- Pre-H2 branch head: `31dd0b2f874a459aec758c91e5ab8b9eabf1ab99`
- Integrated `origin/main`: `359fb25f082536e1e1b2529876f7e31a0c8e322c`
- Approved delivery order: SPEC -> PLAN/TASKS -> RED -> minimal code -> GREEN -> L1-L4/runtime evidence
- Approved account model: every persisted account has exactly one mutually
  exclusive role under `DEC-GEN-005`; Member and staff renewal use separate
  single-role accounts.
- Reconciliation state: the integrated merge is ready to be concluded under
  the approved H2 addendum.
- H2 addendum: approved by Nhat on 2026-07-27 for this integrated diff and
  evidence package.
- Publication authority: granted to conclude the merge, push the reconciled
  branch, and update draft PR #63. H3 remains required before merge to `main`.

## 2. Changed Files

- `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
- `.sdd/specs/feat-borrowing-management/CHANGELOG.md`
- `.sdd/specs/feat-borrowing-management/PLAN.md`
- `.sdd/specs/feat-borrowing-management/SPEC.md`
- `.sdd/specs/feat-borrowing-management/TASKS.md`
- `.sdd/specs/feat-borrowing-management/TEST_PLAN.md`
- `.sdd/specs/feat-reservation-management/PLAN.md`
- `.sdd/specs/feat-reservation-management/SPEC.md`
- `.sdd/specs/feat-reservation-management/TASKS.md`
- `.sdd/specs/feat-reservation-management/TEST_PLAN.md`
- `.sdd/specs/feat-notification-management/CHANGELOG.md`
- `.sdd/specs/feat-notification-management/PLAN.md`
- `.sdd/specs/feat-notification-management/SPEC.md`
- `.sdd/specs/feat-notification-management/TASKS.md`
- `.sdd/specs/feat-reporting-statistics/CHANGELOG.md`
- `.sdd/specs/feat-reporting-statistics/PLAN.md`
- `.sdd/specs/feat-reporting-statistics/SPEC.md`
- `.sdd/specs/feat-reporting-statistics/TASKS.md`
- `backend/src/repositories/borrowingRepository.js`
- `backend/src/services/borrowingService.js`
- `backend/src/services/notificationService.js`
- `backend/src/validators/reportValidators.js`
- `backend/tests/borrowingRepository.test.js`
- `backend/tests/borrowingRoutes.test.js`
- `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- `backend/tests/notificationRoutes.test.js`
- `backend/tests/reportRoutes.test.js`
- `tests/e2e/system-golden-path.spec.js`
- `docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`
- `docs/superpowers/specs/2026-07-27-fe07-fe10-fe12-business-rule-alignment-design.md`
- `frontend/test/homeBookActions.test.js`

The integrated working tree contains 31 changed files against `origin/main`.
No FE08 production file, schema, public route, dependency, role, frontend
workflow, or architecture changed in this branch.

## 3. RED Evidence

| Acceptance | Command | Observed failure before production change |
| --- | --- | --- |
| AT-001 / FE07-T051 | Historical only: the original branch test used a multi-role actor. | `DEC-GEN-005` and Nhat's single-role confirmation superseded that actor premise. The obsolete test and authorization delta were removed; reconciliation uses the existing single-role contract as a GREEN baseline, not a new RED behavior claim. |
| AT-002 / FE07-T048 | `npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js --testNamePattern "due date locked|return serializes"` | Route returned stale `overdueDays = 12` instead of `2`; repository source contract did not contain the locked due date/user, committed return date, or evidence callback. |
| AT-003 / FE07-T049 | Run the business-date test once with `TZ=UTC` and once with `TZ=America/New_York`. | UTC passed; New York returned `2026-03-21` instead of `2026-03-22`. |
| AT-004 / FE10-S11 | `npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js --testNamePattern "unsafe stored template"` | All three unsafe stored definitions resolved as `{ notificationId: 1, status: "SENT" }` instead of rejecting. |
| AT-005 / FE12-N11 | `npm.cmd --prefix backend test -- --runTestsByPath tests/reportRoutes.test.js --testNamePattern "unsupported query keys"` | Borrowing, inventory, and users endpoints each returned `200` instead of safe `400`. |

## 4. GREEN And L1 Evidence

| Scope | Observed result |
| --- | --- |
| FE07-T051 single-role reconciliation | 3/3 passed before cleanup and 3/3 passed after cleanup. A single-role Librarian may renew another member's eligible loan; a separate Member remains owner-scoped; FE11 database repair/invariant cases remain green. |
| FE07-T048 focused | 2/2 passed. Response and audit use the locked due date and the public DTO excludes `authoritativeReturn`. |
| FE07-T049 timezone matrix | UTC 3/3 and America/New_York 3/3 passed with identical business dates and role outcomes. |
| FE07 full route/repository | 79/79 passed. |
| FE10 focused | 4/4 passed, including preservation of runtime template-data sanitization. |
| FE10 full | 139/139 passed. |
| FE12 focused | 3/3 passed with zero selected repository calls and no unknown value in the response. |
| FE12 full | 14/14 passed. |
| FE08 requester | 1/1 passed. |
| FE08 SIT-003/SIT-004 | 2/2 passed using equivalent Windows-safe pattern `SIT-00[34]`. The original pipe pattern was interpreted by the Windows command shell before Jest and did not run the suite. |
| Cross-feature L1 | 7 suites, 281/281 tests passed after single-role reconciliation. |

## 5. Full Automated Evidence

| Command | Observed result |
| --- | --- |
| `npm.cmd --prefix backend test` | 61 suites, 1,017/1,017 tests passed. |
| `npm.cmd --prefix backend run test:coverage:ci` | Fresh integrated run: 61 suites, 1,017/1,017 tests passed. Statements 92.17%, branches 81.55%, functions 97.38%, lines 92.09%. |
| `npm.cmd --prefix frontend test` | 227/227 tests passed. |
| `npm.cmd --prefix frontend run lint` | Passed with exit code 0. |
| `npm.cmd --prefix frontend run build` | Vite production build passed. |
| `npm.cmd run test:traceability-state` | 3/3 passed. |
| `npm.cmd run trace:enforce` | Passed; all active features remain above 70%, with FE07/FE10/FE12 at 100% and FE08 at 97%. |
| `git diff --check`, `git diff --cached --check`, `git diff --check origin/main` | Passed. Only LF-to-CRLF working-copy warnings were reported for the three reconciliation files. |

Generated `backend/coverage`, `frontend/dist`, Playwright report/output, and test
result directories remain ignored and are not part of the H2 diff.

## 6. SQL And Runtime Evidence

### Optional mutable SQL

- `DB_NAME` was unset.
- `FE07_SQL_TEST_ALLOW_MUTATION` was unset.
- The mutable FE07 SQL suite was not run, and this review makes no real-SQL
  mutation claim.

### Local HTTP/browser runtime

Command:

`npx.cmd playwright test tests/e2e/system-golden-path.spec.js tests/e2e/fe08-reservation-candidate-catalog.spec.js --project=chromium`

Observed:

- 2/2 Chromium scenarios passed against the local HTTP servers.
- `E2E-SYS-001` passed login -> borrow -> approve -> return -> fine -> report.
- The same golden path observed
  `/api/reports/borrowing?bogus=runtime-secret-value` return
  `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` without echoing the value.
- `E2E-FE08-ACC01` passed candidate search and real reservation creation.
- No staging mutation or staging acceptance run was performed.

## 7. L2 Spec Traceability Review

| Decision | Task | Test/evidence | Implementation |
| --- | --- | --- | --- |
| BD-007 / AT-001 | FE07-T051 | Single-role reconciliation baseline before/after cleanup plus FE11 one-role invariant/legacy-repair coverage | Existing one-role renewal guard: Member owner-only; Librarian/Admin cross-member; all blockers remain loan-owner scoped |
| BD-002 / AT-002 | FE07-T048 | Stale-preflight route RED/GREEN plus repository source contract | Locked due/user/return snapshot builds one audit/fine evidence object inside the return transaction |
| BD-003 / AT-003 | FE07-T049 | UTC/New York RED/GREEN matrix | Renewal extension and authoritative comparisons use `libraryBusinessTime` |
| BD-004 / AT-004 | FE10-S11 | Three unsafe-definition cases plus runtime-value preservation | Stored definitions fail closed before recipient lookup, render, persistence, or provider I/O |
| BD-005 / AT-005 | FE12-N11 | Three endpoint allowlist cases plus local HTTP acceptance | Exact-key middleware is first in each endpoint validator array |
| BD-006 / AT-006 | FE08-T042 | Requester, SIT-003, SIT-004, and browser acceptance | No FE08 production or contract change |

L2 result: PASS. No behavior outside the approved SPEC/PLAN/TASKS scope was
identified.

## 8. L3 Constitution And Safety Review

- Every persisted account has exactly one role under `DEC-GEN-005`,
  `BR-G-009`, and the FE11 database invariant. Member and staff renewal tests
  use separate accounts.
- Existing stale/legacy role-array fixtures are defense-in-depth checks for
  invalid data; they are not supported multi-role business actors.
- Server authorization does not let a Member renew another member's loan, and
  staff scope does not bypass loan-owner blockers.
- Return audit remains inside the SQL/in-memory transaction and uses the same
  authoritative snapshot as `fineCandidate`.
- Unsafe stored definitions return a generic code/message and create no
  notification, attempt, or provider call.
- Runtime template values retain the existing sanitization and secret-like key
  redaction paths.
- Unsupported report query values are neither forwarded nor echoed.
- Report behavior remains read-only and existing approved value validators
  remain in place.
- No secret, real PII, schema, dependency, public route, role, frontend
  workflow, or architecture expansion was found.

L3 result: PASS.

## 9. Residual Risks

- The SQL repository contract is covered by source-contract tests, in-memory
  parity, and full regression, but no named disposable SQL Server was
  configured for a mutable transaction run.
- Local browser/runtime acceptance passed; staging was not exercised in this
  batch.
- Normal LF-to-CRLF working-copy warnings remain; `git diff --check` passed.

## 10. H2 Gate

The pre-integration branch previously received H2, but that approval did not
cover the merged `origin/main` result. Nhat explicitly approved this H2
addendum on 2026-07-27 after reviewing the integrated diff and refreshed L1-L4
evidence. The approval authorizes concluding the merge, pushing the branch,
and updating draft PR #63. H3 remains mandatory before merge to `main`.
