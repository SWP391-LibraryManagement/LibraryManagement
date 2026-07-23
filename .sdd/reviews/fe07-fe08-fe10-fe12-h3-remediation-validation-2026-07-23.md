# FE07/FE08/FE10/FE12 H3 Remediation Validation

**Date:** 2026-07-23
**Status:** IN PROGRESS - REPEATED H3 FINDINGS UNDER REMEDIATION
**Branch:** `codex/fe07-fe08-fe10-fe12-business-rules`
**Pull request:** [#62](https://github.com/SWP391-LibraryManagement/LibraryManagement/pull/62)

## 1. Approved Scope

The user approved the H3 remediation addendum in
`docs/superpowers/specs/2026-07-23-fe07-fe08-fe10-fe12-final-verification-remediation-design.md`.
The remediation is limited to:

1. preserving safe FE08 notification-audit warnings when `expire-holds`
   promotes reservations;
2. matching the FE12 in-memory user-report search to existing parameterized SQL
   `LIKE` semantics;
3. correcting the Azure migration-verification boundary and stale task-gate
   evidence;
4. completing SQL `LIKE` closing-bracket parity, multi-warning regression
   proof, the singular FE08 warning OpenAPI contract, and post-H2 governance
   evidence after repeated H3.

No new role, permission, database column/table, dependency, notification retry
worker, report field, or frontend workflow is authorized.

## 2. Prior Reviewed Evidence

| Evidence | Result |
| --- | --- |
| Initial H2 and H2 addendum | Passed |
| Reviewed branch head before H3 remediation | `97aca62667d676fb74a8833b46c27a8f67fefbad` |
| PR #62 CI run | `30014066260` - `success` |
| First H3 review | Returned bounded FE08, FE12, and deployment/governance findings |
| Fresh H2 for first H3 remediation | Passed |
| H2-reviewed remediation head | `b931e005e50dc9c0ec9c177f2874f88a1df943b0` |
| Updated PR #62 CI run | `30019439505` - `success` for `b931e005e50dc9c0ec9c177f2874f88a1df943b0` |
| PR state after updated CI | Open, Ready; `MERGEABLE` / `CLEAN` |
| Repeated H3 review | Returned bounded closing-bracket parity, multi-warning regression, singular OpenAPI, and stale-evidence findings |
| Staging product SHA | `9b02c7eb0078c317c3584472c1666cd01159e2c7` |
| Staging deployment run | `30012925318` - `success` |

The FE10 `2026-07-23-fe10-processing-status.sql` migration was proven
idempotent by running it twice on a named disposable local SQL Server database,
then applied once to Azure staging under the reviewed operator procedure. This
remediation does not replay that migration.

## 3. Root-Cause Evidence

### 3.1 FE08 expiration promotion

`holdReservation` attaches `notificationWarning` as a non-enumerable internal
property. `processQueue` copied that property into its singular top-level
response, but `expireHolds` pushed only the promoted reservation and returned
before copying the warning. JSON serialization therefore preserved the
committed promotion while silently losing the required warning.

Baseline before the new regression:

```text
Test Suites: 3 passed, 3 total
Tests:       61 passed, 61 total
```

RED after adding service and route coverage:

```text
Test Suites: 2 failed, 2 total
Tests:       2 failed, 48 passed, 50 total
Expected notificationWarnings; received undefined.
```

GREEN after the bounded service correction:

```text
Test Suites: 2 passed, 2 total
Tests:       50 passed, 50 total
```

Focused FE08 verification:

```text
Backend:  Test Suites 3 passed; Tests 59 passed.
Frontend: Tests 212 passed; 0 failed.
```

The response now adds optional top-level `notificationWarnings[]`; each item is
exactly `reservationId`, `copyId`, safe `code`, and safe `message`. The existing
singular `processQueue.notificationWarning` and promoted reservation DTO remain
unchanged.

### 3.2 FE12 SQL `LIKE` parity

Production already binds `%${filters.q}%` through `sql.NVarChar` and evaluates
it with SQL `LIKE`. The in-memory user-report repository instead lowercased the
query and used literal `String.includes`, so wildcard inputs behaved
differently in tests.

RED after adding wildcard cases:

```text
Test Suites: 1 failed, 1 total
Tests:       3 failed, 15 passed, 18 total
Failing cases: %MEMBER%, L_BRARIAN, [1-2].
```

GREEN after adding the test-only matcher:

```text
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

Focused FE12 verification:

```text
Test Suites: 3 passed, 3 total
Tests:       46 passed, 46 total
```

Production SQL, query parameters, searchable fields, API payloads, aggregation,
and pagination are unchanged.

### 3.3 Repeated H3 completeness findings

The repeated Standards/Spec H3 reviewed the exact ready PR after CI run
`30019439505`. It confirmed the implemented FE08 expiration-warning
propagation, FE12 baseline wildcard cases, Azure procedure, virtual merge, and
security boundaries, then found four bounded completeness gaps:

1. the test-only SQL `LIKE` compiler treated the first `]` as a class
   terminator and therefore diverged for `[]]` and `[^]]`;
2. the service and route regressions proved only one expiration promotion
   warning rather than every warning in a multi-copy batch;
3. OpenAPI described `expire-holds.notificationWarnings[]` but not the existing
   singular `process-queue.notificationWarning`;
4. the validation/task evidence still described the branch as uncommitted and
   awaiting the already completed H2/CI cycle.

Round-two SQL parity RED:

```text
Test Suites: 1 failed, 1 total
Tests:       2 failed, 18 passed, 20 total
Failing cases: [^]] and []].
```

Round-two SQL parity GREEN:

```text
Test Suites: 3 passed, 3 total
Tests:       48 passed, 48 total
```

The multi-warning FE08 service/route regressions pass against the existing
production loop: 3 suites and 59 tests passed. No FE08 production service
change was required. The singular warning OpenAPI response also parses
successfully.

## 4. Azure Boundary

The staging guide now requires:

1. two executions of every candidate migration only on a named disposable
   local database;
2. one reviewed execution on the intended staging database;
3. read-only target, schema, and `CK_Notifications_Status` constraint checks;
4. immediate removal of the exact temporary operator firewall rule.

Post-merge staging acceptance for this remediation is read-only schema plus
application smoke. It must not rerun the FE10 migration merely to reconfirm
idempotence.

## 5. Current Integration State

Read-only refresh on 2026-07-23:

| Item | Current value |
| --- | --- |
| H2-reviewed remediation HEAD | `b931e005e50dc9c0ec9c177f2874f88a1df943b0` |
| Latest `origin/main` | `cfe8954bc49bbcdd46d8f656f9d0d665cc388dd4` |
| Virtual committed-head merge tree | `e22a848b1f806a4988092581e78e3e76501805c6` |
| PR state | Open, Ready |
| GitHub merge result | `MERGEABLE` / `CLEAN` |

The latest `main` includes a later FE11 Admin Console E2E contract commit.
Repeated H3 must review the exact current merge ref, including independent
OpenAPI changes, rather than relying on the earlier PR CI result.

## 6. Security And Scope Review

- FE08 warning entries contain no member identity, recipient address, provider
  message, rendered notification content, error stack, credential, or secret.
- Existing staff-visible promoted reservation DTOs are not widened or
  narrowed.
- FE12 production SQL remains parameterized; the new pattern compiler exists
  only in the in-memory test repository and receives the already validated
  maximum 200-character query.
- Azure documentation contains no password, connection string, token, operator
  IP, or firewall value.
- The user-owned untracked
  `output/audit-librarian-2026-07-22/` directory remains out of scope and must
  not be staged.

## 7. Gate Snapshot At H2 Freeze

This checklist records the frozen pre-commit candidate. Post-H2 commit, push,
PR-CI, and H3 outcomes are verified from the exact live GitHub head rather than
being predicted inside the commit that creates that head.

- [x] Deployment utility, traceability, and diff-hygiene checks pass.
- [x] Full backend tests, system integration, coverage, audits, frontend
      lint/tests/build, Chromium E2E, and backend import check pass.
- [x] Final current-main compatibility and security/diff review pass.
- [x] Fresh H2 approved the first H3 remediation diff.
- [x] Only the H2-reviewed files were committed and pushed as `b931e00`.
- [x] Updated PR checks passed in run `30019439505`.
- [x] Repeated Standards and Spec H3 completed and returned the bounded
      round-two findings recorded above.
- [x] Fresh H2 approves the complete uncommitted round-two remediation diff.
- [ ] Only the new H2-reviewed round-two files are committed and pushed.
- [ ] Updated PR checks pass for the new reviewed head.
- [ ] Repeated Standards and Spec H3 pass before merge.
- [ ] Exact post-merge `main` CI, automatic staging deployment, and read-only
      staging verification pass.

## 8. First H3 Remediation Pre-H2 Automated Evidence

All commands below ran on the final uncommitted remediation state unless the
row is explicitly frontend-only; no frontend source changed after its recorded
lint/test/build run.

| Check | Result |
| --- | --- |
| Focused FE08/FE12 backend | 6 suites, 105 tests passed |
| Full backend | 61 suites, 1,011 tests passed |
| System integration | 1 suite, 10 tests passed |
| Backend coverage | 91.95% statements, 81.27% branches, 97.29% functions, 91.86% lines |
| Frontend | lint passed; 212 tests passed; production build passed |
| Root/backend/frontend audit | 0 vulnerabilities at `high` threshold |
| Chromium E2E | 4/4 passed |
| Deployment utilities | 8/8 passed |
| Traceability enforcement | passed; FE08 28/29 and FE12 11/11 FR tags |
| OpenAPI YAML parse | passed |
| Backend import check | passed |
| Diff hygiene | `git diff --check` passed |
| Latest-main patch application | passed against `origin/main` `cfe8954bc49bbcdd46d8f656f9d0d665cc388dd4` |

The later repeated H3 independently reviewed the ready PR and returned the
round-two findings in Section 3.3. This was the pre-H2 evidence state before
the approval recorded in Section 10.

## 9. Round-Two Remediation Pre-H2 Automated Evidence

All checks below ran against the complete round-two code and contract diff.
The final governance-only evidence update did not change executable source,
tests, OpenAPI, dependencies, or deployment utilities.

| Check | Result |
| --- | --- |
| Focused FE08/FE12 backend | 6 suites, 107 tests passed |
| Full backend | 61 suites, 1,013 tests passed |
| System integration | 1 suite, 10 tests passed |
| Backend coverage | 91.95% statements (914/994), 81.27% branches (699/860), 97.29% functions (144/148), 91.86% lines (904/984) |
| Frontend | lint passed; 212 tests passed; production build passed |
| Root/backend/frontend audit | 0 vulnerabilities at `high` threshold |
| Chromium E2E | 4/4 passed |
| Deployment utilities | 8/8 passed |
| Traceability enforcement | passed; FE08 28/29 and FE12 11/11 FR tags; no feature below 70% |
| OpenAPI YAML parse | passed |
| Backend import check | passed |
| Diff hygiene | `git diff --check` passed |
| Production-boundary review | no round-two diff in `reservationService.js` or `reportRepository.js` |
| Latest-main committed-head merge | clean tree `e22a848b1f806a4988092581e78e3e76501805c6` |
| Latest-main merge plus pre-final-evidence round-two patch | clean tree `9fecfa6dfd5e99dd7476c731163f3be2a7c38fa2` |

The round-two remediation changes only the approved test helper, regressions,
OpenAPI contract, and governance evidence. The user-owned untracked audit
directory remains untouched. This section freezes the complete uncommitted
candidate that was presented for fresh H2; no Azure SQL mutation or Azure
staging deployment occurred during validation.

## 10. Round-Two Local H2 Approval Addendum

**Date:** 2026-07-23

**Decision:** PASS - REVIEWED COMMIT SET AND BRANCH PUSH AUTHORIZED

- L1 automated: focused FE08/FE12, full backend, system integration, coverage,
  frontend lint/tests/build, audits, Chromium E2E, deployment utilities,
  traceability, OpenAPI parsing, backend import, and diff hygiene passed with
  the results recorded in Section 9.
- L2 spec: the diff is limited to the approved repeated-H3 findings for SQL
  `LIKE` closing-bracket parity, FE08 multi-warning proof, the singular warning
  OpenAPI contract, and truthful governance evidence.
- L3 constitution/safety: production FE08 service and FE12 SQL repository are
  unchanged; there is no role, permission, schema, dependency, frontend, Azure,
  secret, credential, or real-PII expansion.
- L4 acceptance: the service and serialized route regressions prove two ordered
  safe warnings, and the report parity regressions prove `[]]` and `[^]]`.

The user explicitly approved H2 after reviewing the frozen candidate whose
latest-main combined tree was
`2bcb4b89f3a445427189caa9526cf5dae5c17126`. This mechanical approval addendum
does not expand the reviewed behavior or file scope. It authorizes commit and
push to PR #62; updated PR checks and repeated H3 remain mandatory before merge.
