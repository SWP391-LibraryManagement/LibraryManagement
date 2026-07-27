# FE07/FE08/FE10/FE12 Business-Rule Alignment Validation

Date: 2026-07-27

## 1. Review State

- Branch: `codex/fe07-fe10-fe12-rule-alignment`
- Published branch head:
  `f346ae07d5d2885c0d5b8131479dee764edd97ec`
- Integrated `origin/main`: `8d0059bd28b6a7fc8e4ccbdf767ce4120a86aee7`
- Approved delivery order: SPEC -> PLAN/TASKS -> RED -> minimal code -> GREEN -> L1-L4/runtime evidence
- Approved account model: every persisted account has exactly one mutually
  exclusive role under `DEC-GEN-005`; Member and staff renewal use separate
  single-role accounts.
- Reconciliation state: Nhat approved the latest `8d0059b` H2 addendum on
  2026-07-27. The reviewed merge was committed as `f346ae0` and pushed to
  draft PR #63.
- Required PR checks: CI run `30244750250` passed for exact head `f346ae0`.
- First H3 result: no product-code or business-spec defect; one valid P2
  finding identified stale current-state H2 wording in governance documents.
- Current publication authority: the documentation-only H3 remediation may be
  prepared uncommitted. Fresh H2 remains required before committing or pushing
  it, and repeated H3 remains required before merge.

Sections 3-9 retain the prior `e99daf5` evidence as historical baseline.
Section 11 is the authoritative product addendum for `8d0059b`; Section 12 is
the authoritative current gate for the H3 governance-evidence remediation.

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
- `frontend/src/page/reservation/MyReservationsPage.jsx`
- `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- `frontend/src/utils/libraryFeatureViewModels.js`
- `frontend/test/reservationFrontend.test.js`

The integrated working tree contains 40 changed files against `origin/main`.
The only additional FE08 production delta against `origin/main` is the bounded
null-safe queue-position presentation in the two reservation pages and shared
view-model formatter. No schema, public route, dependency, role, lifecycle,
queue algorithm, or architecture changed in this branch.

## 3. RED Evidence

| Acceptance | Command | Observed failure before production change |
| --- | --- | --- |
| AT-001 / FE07-T052 | Historical only: the original branch test used a multi-role actor. | `DEC-GEN-005` and Nhat's single-role confirmation superseded that actor premise. The obsolete test and authorization delta were removed; reconciliation uses the existing single-role contract as a GREEN baseline, not a new RED behavior claim. |
| AT-002 / FE07-T049 | `npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js --testNamePattern "due date locked|return serializes"` | Route returned stale `overdueDays = 12` instead of `2`; repository source contract did not contain the locked due date/user, committed return date, or evidence callback. |
| AT-003 / FE07-T050 | Run the business-date test once with `TZ=UTC` and once with `TZ=America/New_York`. | UTC passed; New York returned `2026-03-21` instead of `2026-03-22`. |
| AT-004 / FE10-S11 | `npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js --testNamePattern "unsafe stored template"` | All three unsafe stored definitions resolved as `{ notificationId: 1, status: "SENT" }` instead of rejecting. |
| AT-005 / FE12-N11 | `npm.cmd --prefix backend test -- --runTestsByPath tests/reportRoutes.test.js --testNamePattern "unsupported query keys"` | Borrowing, inventory, and users endpoints each returned `200` instead of safe `400`. |
| Prior-main FE08 integration / FE08-T047 | First Chromium run against the historical intermediate `8f231d7` merge. | Reservation creation succeeded, but the branch E2E looked for obsolete `Đã đặt chỗ`; runtime correctly rendered `Đang đặt chỗ`. Upstream `e20fdc3` independently contained the correction and held-copy handoff, so the branch retained that behavior without a duplicate FE08 production change. |
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
| BD-006 / AT-006 | FE08-T047 | Requester 1/1, SIT-003/SIT-004 2/2, and browser acceptance 2/2 | No additional FE08 production or contract change from the rule-alignment slice |
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

## 10. Prior H2 Gate

The `e99daf5` integration received H2 approval and was committed/pushed as
`2a478ba1ac025d319c6e09ef0eff73ae650a09d3`. That approval does not cover the
new merge with `origin/main` at `8d0059b`.

## 11. H2 Addendum - `main@8d0059b`

### 11.1 Incoming scope and reconciliation

- Incoming commit: `8d0059b fix: sync reservation queue and fine permissions`.
- FE07: combined the parallel v0.7.8 branches as v0.7.9; positive FE09
  `UNPAID` fines remain the canonical borrow/renew blocker and Member
  reconciliation stays read-only.
- FE08: combined the parallel v0.5.9 branches as v0.5.10. Upstream
  `FE08-T046` owns copy-scoped queue positions; the branch regression task is
  now `FE08-T047`.
- FE09: upstream `FE09-T024` makes `/api/fines/me` single-role Member-only,
  adds FE07 due/return/borrow context, and leaves Member presentation
  read-only.
- FE11: `BR-FE11-028` now explicitly includes FE09 own-fine access while
  preserving exactly one mutually exclusive account role.

### 11.2 RED-GREEN evidence

| Scope | Observed result |
| --- | --- |
| FE08-T046 RED | Focused frontend test failed because `formatReservationQueuePosition` was `undefined`; the mapper returned null while the incoming pages still interpolated `#${item.queue}`. |
| FE08-T046 GREEN | Shared formatter returns `Chưa xác định` for null/undefined and preserves `#2 trong hàng đợi cuốn này`; Member/staff source contracts use it and direct `#${...queue}` interpolation is absent. Focused result: 1/1 passed. |
| FE09 focused backend | 1 suite, 22/22 passed, including Guest 401, Librarian/Admin 403, Member-only own rows, and FE07 borrowing context. |
| FE08/FE09 focused frontend | 17/17 passed; Member fine UI remains read-only and queue-position presentation is null-safe. |
| Cross-feature | 7 suites, 295/295 passed across borrowing, reservation, fine, notification, reporting, and system integration. |
| One-role invariant | 2 suites, 3/3 selected cases passed for single-role renewal, exactly-one-role enforcement, and legacy multiple-mapping repair. |
| Timezone matrix | UTC 3/3 and America/New_York 3/3 passed with identical outcomes. |

### 11.3 Fresh full L1 evidence

| Command | Observed result |
| --- | --- |
| `npm.cmd --prefix backend test` | 61 suites, 1,052/1,052 passed. |
| `npm.cmd --prefix backend run test:coverage:ci` | 61 suites, 1,052/1,052 passed; statements 92.08%, branches 81.46%, functions 97.38%, lines 92.00%. |
| `npm.cmd --prefix frontend test` | 232/232 passed. |
| `npm.cmd --prefix frontend run lint` | Exit 0. |
| `npm.cmd --prefix frontend run build` | Vite production build passed. |
| `npm.cmd run test:traceability-state` | 3/3 passed. |
| `npm.cmd run trace:enforce` | PASS; FE07/FE09/FE10/FE12 remain 100%, FE08 remains 97%, and all active features exceed 70%. |

Generated coverage, build, Playwright report/output, and test-result folders
remain ignored and are not part of the H2 diff.

### 11.4 L2 spec traceability

| Requirement | Task | Code/test evidence |
| --- | --- | --- |
| BR-FE08-020, FR-FE08-035, AC-FE08-022 | FE08-T046 | `mapReservation` preserves null; shared formatter and both pages render null as `Chưa xác định`; focused/frontend/full/browser gates pass. |
| BR-FE09-020, FR-FE09-019, AC-FE09-017 | FE09-T024 | Route and service enforce Member-only access; repository/OpenAPI expose FE07 context; backend 22/22 and frontend read-only checks pass. |
| BD-006, SL-006, AT-006 | FE08-T047 | Requester/SIT coverage is included in cross-feature 295/295; full and Chromium gates pass. |
| DEC-GEN-005, BR-G-009, BR-FE11-028 | Existing FE11 one-role invariant | Exactly-one-role and repair cases pass; FE09 Member/staff tests use separate single-role accounts. |

L2 result: PASS. No task ID collision, duplicate feature version, or
untraced business behavior remains in the current merge result.

### 11.5 L3 Constitution and security

- `/api/fines/me` authenticates and applies `requireMemberOnly` before the
  controller; the service repeats the Member/non-staff check.
- Member scope is forced from authenticated `actor.userId`; query input cannot
  select another user.
- Librarian/Admin mutation ownership and Admin-only waive/cancel remain
  unchanged.
- Fine-list search, user, status, offset, and limit values use typed SQL
  parameters. Dynamic `WHERE` fragments come only from fixed allowlisted
  clauses.
- React renders text normally; no new raw HTML path exists.
- Diff secret scan found no credential/private-key pattern. Safe error tests
  and existing redaction behavior remain green.
- No dependency, schema, public route, role, state-machine, or architecture
  expansion was introduced.

L3 result: PASS.

### 11.6 L4 runtime acceptance

Command:

`npx.cmd playwright test tests/e2e/system-golden-path.spec.js tests/e2e/fe08-reservation-candidate-catalog.spec.js --project=chromium`

Observed: Chromium 2/2 passed. `E2E-FE08-ACC01` completed real candidate search
and reservation creation; `E2E-SYS-001` completed login -> borrow -> approve ->
return -> fine -> report and retained the safe unknown-report-query rejection.

### 11.7 Diff hygiene and residual risks

- Working-tree diff against `origin/main`: 40 files; only the four FE08
  presentation/test files are new branch deltas from this integration.
- `git diff --check`, cached/HEAD/origin variants: exit 0.
- Conflict-marker scan: 0.
- `DB_NAME` and `FE07_SQL_TEST_ALLOW_MUTATION` are unset; mutable SQL was not
  run and no new real-SQL mutation claim is made.
- Local browser acceptance passed; staging was not exercised.
- Normal LF-to-CRLF warnings remain non-blocking.

### 11.8 Current gate

Nhat approved the complete `8d0059b` merge, reconciliation, bounded FE08
remediation, and fresh L1-L4 evidence at H2 on 2026-07-27. The reviewed merge
was committed as `f346ae0`, pushed to draft PR #63, and CI run `30244750250`
passed. The first H3 review found one documentation-only current-state defect;
Section 12 supersedes this gate for the remediation.

## 12. H3 Governance-Evidence Remediation

### 12.1 First H3 review

Fixed point and published evidence:

- Base: `origin/main@8d0059bd28b6a7fc8e4ccbdf767ce4120a86aee7`
- Head: `f346ae07d5d2885c0d5b8131479dee764edd97ec`
- Draft PR: #63, merge state `CLEAN`
- Required CI: run `30244750250`, `foundation-checks` success
- Diff parity: local and PR both contained 40 files with no name mismatch,
  unmerged entry, whitespace error, or conflict marker.

Review conclusions:

- Standards review found no unauthorized commit after confirming Nhat's H2
  approval preceded commit and push.
- Spec review found no missing requirement, scope creep, or incorrect product
  behavior.
- The initial FE10 idempotent-replay concern was withdrawn:
  `AC-FE10-008`/`EC-FE10-008` require duplicate keys to return the existing
  `200` record, and the replay path performs no render, new persistence, or
  provider I/O.
- One valid P2 remained: current-state validation, PLAN, TASKS, and one FE10
  traceability row still described the integrated result as uncommitted, H2
  pending, or awaiting PLAN/TASKS approval.

### 12.2 Remediation scope

The uncommitted remediation updates only these 12 Markdown files:

- `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
- `.sdd/specs/feat-borrowing-management/PLAN.md`
- `.sdd/specs/feat-borrowing-management/TASKS.md`
- `.sdd/specs/feat-reservation-management/PLAN.md`
- `.sdd/specs/feat-reservation-management/TASKS.md`
- `.sdd/specs/feat-notification-management/PLAN.md`
- `.sdd/specs/feat-notification-management/SPEC.md`
- `.sdd/specs/feat-notification-management/TASKS.md`
- `.sdd/specs/feat-reporting-statistics/PLAN.md`
- `.sdd/specs/feat-reporting-statistics/TASKS.md`
- `docs/superpowers/specs/2026-07-27-fe07-fe10-fe12-business-rule-alignment-design.md`
- `docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`

No production code, test, schema, dependency, API, business rule, or historical
pre-H2 process instruction changes in this remediation.

### 12.3 Bounded validation

| Command | Observed result |
| --- | --- |
| `npm.cmd run test:traceability-state` | 3/3 passed. |
| `npm.cmd run trace:enforce` | PASS; FE07/FE10/FE12 remain 100%, FE08 remains 97%, and all active features exceed 70%. |
| `npm.cmd run test:deployment` | 9/9 passed. |
| Documentation-only scope check | 12 changed Markdown files, 0 non-Markdown files, and 0 staged files. |
| Current-state stale wording scan | 0 stale original-H2 matches; fresh-H2 wording refers only to this uncommitted documentation remediation. |
| `git diff --check`; `git diff --cached --check` | Both passed with zero error lines; only normal LF-to-CRLF working-copy warnings were emitted. |

### 12.4 Current gate

The documentation-only remediation is uncommitted and unpushed. Fresh H2 must
review the complete 12-file diff and final diff-hygiene evidence before commit
or push. PR #63 remains Draft; updated PR CI and repeated H3 remain mandatory
before merge to `main`.
