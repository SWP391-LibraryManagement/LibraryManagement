# FE07/FE08/FE10/FE12 Business-Rule Alignment Validation

Date: 2026-07-27

## 1. Review State

- Branch: `codex/fe07-fe10-fe12-rule-alignment`
- Branch head before the open merge: `4dedddbf7ecb4321317cf62bc2ed7b7aa8f94aa3`
- Integrated `origin/main`: `e99daf5ea98c57de1fa65e50a1d0bdff682562a9`
- Approved delivery order: SPEC -> PLAN/TASKS -> RED -> minimal code -> GREEN -> L1-L4/runtime evidence
- Approved account model: every persisted account has exactly one mutually
  exclusive role under `DEC-GEN-005`; Member and staff renewal use separate
  single-role accounts.
- Reconciliation state: the latest-main merge remains open and uncommitted.
- H2 addendum: pending Nhat review of this latest integrated diff and evidence.
- Publication authority: not granted for this new merge result. Do not commit,
  push, or update draft PR #63 until the latest H2 addendum is approved.

## 2. Changed Files

- `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
- `.sdd/specs/feat-borrowing-management/CHANGELOG.md`
- `.sdd/specs/feat-borrowing-management/PLAN.md`
- `.sdd/specs/feat-borrowing-management/SPEC.md`
- `.sdd/specs/feat-borrowing-management/TASKS.md`
- `.sdd/specs/feat-borrowing-management/TEST_PLAN.md`
- `.sdd/specs/feat-membership-management/SPEC.md`
- `.sdd/specs/feat-public-browse/CHANGELOG.md`
- `.sdd/specs/feat-public-browse/SPEC.md`
- `.sdd/specs/feat-public-browse/TASKS.md`
- `.sdd/specs/feat-reservation-management/CHANGELOG.md`
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

The integrated working tree contains 36 changed files against `origin/main`.
No additional FE08 production file, schema, public route, dependency, role,
frontend workflow, or architecture changed in this branch.

## 3. RED Evidence

| Acceptance | Command | Observed failure before production change |
| --- | --- | --- |
| AT-001 / FE07-T052 | Historical only: the original branch test used a multi-role actor. | `DEC-GEN-005` and Nhat's single-role confirmation superseded that actor premise. The obsolete test and authorization delta were removed; reconciliation uses the existing single-role contract as a GREEN baseline, not a new RED behavior claim. |
| AT-002 / FE07-T049 | `npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js --testNamePattern "due date locked|return serializes"` | Route returned stale `overdueDays = 12` instead of `2`; repository source contract did not contain the locked due date/user, committed return date, or evidence callback. |
| AT-003 / FE07-T050 | Run the business-date test once with `TZ=UTC` and once with `TZ=America/New_York`. | UTC passed; New York returned `2026-03-21` instead of `2026-03-22`. |
| AT-004 / FE10-S11 | `npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js --testNamePattern "unsafe stored template"` | All three unsafe stored definitions resolved as `{ notificationId: 1, status: "SENT" }` instead of rejecting. |
| AT-005 / FE12-N11 | `npm.cmd --prefix backend test -- --runTestsByPath tests/reportRoutes.test.js --testNamePattern "unsupported query keys"` | Borrowing, inventory, and users endpoints each returned `200` instead of safe `400`. |
| Prior-main FE08 integration / FE08-T046 | First Chromium run against the historical intermediate `8f231d7` merge. | Reservation creation succeeded, but the branch E2E looked for obsolete `Đã đặt chỗ`; runtime correctly rendered `Đang đặt chỗ`. Upstream `e20fdc3` independently contained the correction and held-copy handoff, so the branch retained that behavior without a duplicate FE08 production change. |
| Latest-main FE08 same-book rule / FE08-T045 | No new branch RED claim. | `e99daf5` already contains the approved SPEC, implementation, and tests. This integration preserves that upstream change exactly and reruns its focused, cross-feature, and runtime gates. |

## 4. GREEN And L1 Evidence

| Scope | Observed result |
| --- | --- |
| FE07-T052 single-role reconciliation | 3/3 passed before cleanup and 3/3 passed after cleanup. A single-role Librarian may renew another member's eligible loan; a separate Member remains owner-scoped; FE11 database repair/invariant cases remain green. |
| FE07-T049 focused | 2/2 passed. Response and audit use the locked due date and the public DTO excludes `authoritativeReturn`. |
| FE07-T050 timezone matrix | UTC 3/3 and America/New_York 3/3 passed with identical business dates and role outcomes. |
| FE07 full route/repository | 79/79 passed. |
| FE10 focused | 4/4 passed, including preservation of runtime template-data sanitization. |
| FE10 full | 139/139 passed. |
| FE12 focused | 3/3 passed with zero selected repository calls and no unknown value in the response. |
| FE12 full | 14/14 passed. |
| FE08 requester | 1/1 passed. |
| FE08 SIT-003/SIT-004 | 2/2 passed using equivalent Windows-safe pattern `SIT-00[34]`. The original pipe pattern was interpreted by the Windows command shell before Jest and did not run the suite. |
| FE08 same-book repository/service/route | 3 suites, 63/63 passed, covering candidate exclusion, direct-create conflict, terminal-loan allowance, stale-queue skip, source lock/order checks, and service error mapping. |
| FE08 frontend error mapping | 7/7 passed, including `BOOK_ALREADY_BORROWED`. |
| FE08 candidate SQL command | 2/2 source-contract tests passed; 2 mutable SQL cases skipped because no approved disposable database was configured. |
| Cross-feature L1 | Fresh final run against the open `e99daf5` merge: 7 suites, 284/284 tests passed after single-role, held-copy, and same-book integration. |

## 5. Full Automated Evidence

| Command | Observed result |
| --- | --- |
| `npm.cmd --prefix backend test` | Fresh final integrated run: 61 suites, 1,051/1,051 tests passed. |
| `npm.cmd --prefix backend run test:coverage:ci` | Fresh final integrated run: 61 suites, 1,051/1,051 tests passed. Statements 92.08%, branches 81.46%, functions 97.38%, lines 92.00%. |
| `npm.cmd --prefix frontend test` | Fresh final integrated run: 231/231 tests passed. |
| `npm.cmd --prefix frontend run lint` | Passed with exit code 0. |
| `npm.cmd --prefix frontend run build` | Vite production build passed. |
| `npm.cmd run test:traceability-state` | 3/3 passed. |
| `npm.cmd run trace:enforce` | Passed; all active features remain above 70%, with FE07/FE10/FE12 at 100% and FE08 at 97%. |
| `git diff --check`, `git diff --cached --check`, `git diff HEAD --check`, `git diff origin/main --check` | Passed with exit code 0. Only normal LF-to-CRLF working-copy warnings were reported. Conflict-marker scan found 0 markers; the branch diff contains exactly 36 files against `origin/main`; upstream FE08 production/test files have 0 diff lines against `origin/main`. |

Generated `backend/coverage`, `frontend/dist`, Playwright report/output, and test
result directories remain ignored and are not part of the H2 diff.

## 6. SQL And Runtime Evidence

### Optional mutable SQL

- `DB_NAME` was unset.
- `FE07_SQL_TEST_ALLOW_MUTATION` was unset.
- The mutable FE07 SQL suite was not run, and this review makes no real-SQL
  mutation claim.
- The FE08 candidate SQL command ran `2/2` source-contract tests and skipped
  `2` mutable database cases under the same environment boundary.

### Local HTTP/browser runtime

Command:

`npx.cmd playwright test tests/e2e/system-golden-path.spec.js tests/e2e/fe08-reservation-candidate-catalog.spec.js --project=chromium`

Observed:

- The historical first FE08 run against the prior merge failed only on the
  stale `Đã đặt chỗ` locator after the
  successful create response; the runtime snapshot showed the upstream
  `Đang đặt chỗ` label required by FE08 v0.5.6.
- The final combined Chromium run against the open `e99daf5` integration
  passed 2/2 against the local HTTP servers.
- `E2E-SYS-001` passed login -> borrow -> approve -> return -> fine -> report.
- The same golden path observed
  `/api/reports/borrowing?bogus=runtime-secret-value` return
  `400 UNSUPPORTED_REPORT_QUERY_PARAMETER` without echoing the value.
- `E2E-FE08-ACC01` passed candidate search and real reservation creation.
- No staging mutation or staging acceptance run was performed.

## 7. L2 Spec Traceability Review

| Decision | Task | Test/evidence | Implementation |
| --- | --- | --- | --- |
| BD-007 / AT-001 | FE07-T052 | Single-role reconciliation baseline before/after cleanup plus FE11 one-role invariant/legacy-repair coverage | Existing one-role renewal guard: Member owner-only; Librarian/Admin cross-member; all blockers remain loan-owner scoped |
| BD-002 / AT-002 | FE07-T049 | Stale-preflight route RED/GREEN plus repository source contract | Locked due/user/return snapshot builds one audit/fine evidence object inside the return transaction |
| BD-003 / AT-003 | FE07-T050 | UTC/New York RED/GREEN matrix | Renewal extension and authoritative comparisons use `libraryBusinessTime` |
| BD-004 / AT-004 | FE10-S11 | Three unsafe-definition cases plus runtime-value preservation | Stored definitions fail closed before recipient lookup, render, persistence, or provider I/O |
| BD-005 / AT-005 | FE12-N11 | Three endpoint allowlist cases plus local HTTP acceptance | Exact-key middleware is first in each endpoint validator array |
| BD-006 / AT-006 | FE08-T046 | Requester 1/1, SIT-003/SIT-004 2/2, and browser acceptance 2/2 | No additional FE08 production or contract change from the rule-alignment slice |
| BR-FE08-019 / FR-FE08-034 / AC-FE08-021 | FE08-T045 | Repository/service/route 63/63, frontend error mapping 7/7, cross-feature 284/284 | Upstream `e99daf5` candidate exclusion, transactional `BOOK_ALREADY_BORROWED`, stale-queue skip, and shared FE07 Member circulation lock preserved exactly |

L2 result: PASS. No behavior outside the approved rule-alignment scope and the
upstream FE08 v0.5.9 integrated contracts was identified.

## 8. L3 Constitution And Safety Review

- Every persisted account has exactly one role under `DEC-GEN-005`,
  `BR-G-009`, and the FE11 database invariant. Member and staff renewal tests
  use separate accounts.
- Existing stale/legacy role-array fixtures are defense-in-depth checks for
  invalid data; they are not supported multi-role business actors.
- FE08 candidate/create routes remain Member-only; same-book SQL uses typed
  parameters, direct creation revalidates inside the transaction, and queue
  holding revalidates after acquiring the shared FE07 Member circulation lock.
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

The branch previously received H2 and was pushed through
`4dedddbf7ecb4321317cf62bc2ed7b7aa8f94aa3`, but that approval does not cover
the new merge with `origin/main` at `e99daf5`. The
latest integrated diff and refreshed L1-L4/runtime evidence remain uncommitted
pending Nhat's explicit H2 addendum. Only that approval may authorize
concluding this merge, pushing the branch, and updating draft PR #63. H3
remains mandatory before merge to `main`.
