# FE07/FE08/FE10/FE12 H3 Remediation Validation

**Date:** 2026-07-23
**Status:** IN PROGRESS - FRESH H2 REQUIRED
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
   evidence.

No new role, permission, database column/table, dependency, notification retry
worker, report field, or frontend workflow is authorized.

## 2. Prior Reviewed Evidence

| Evidence | Result |
| --- | --- |
| Initial H2 and H2 addendum | Passed |
| Reviewed branch head before H3 remediation | `97aca62667d676fb74a8833b46c27a8f67fefbad` |
| PR #62 CI run | `30014066260` - `success` |
| First H3 review | Returned bounded FE08, FE12, and deployment/governance findings |
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
| Local pre-remediation HEAD | `97aca62667d676fb74a8833b46c27a8f67fefbad` |
| Latest `origin/main` | `cfe8954bc49bbcdd46d8f656f9d0d665cc388dd4` |
| Virtual committed-head merge tree | `d3e4add577dadde7fb3890ea867ea56359c5a34f` |
| PR state | Open, Draft |
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

## 7. Remaining Gates

- [x] Deployment utility, traceability, and diff-hygiene checks pass.
- [x] Full backend tests, system integration, coverage, audits, frontend
      lint/tests/build, Chromium E2E, and backend import check pass.
- [x] Final current-main compatibility and security/diff review pass.
- [ ] Fresh H2 approves the complete uncommitted remediation diff.
- [ ] Only the H2-reviewed files are committed and pushed to PR #62.
- [ ] Updated PR checks pass against the then-current `main`.
- [ ] Repeated Standards and Spec H3 pass before merge.
- [ ] Exact post-merge `main` CI, automatic staging deployment, and read-only
      staging verification pass.

## 8. Final Pre-H2 Automated Evidence

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

The attempted independent Standards/Spec reviewer refresh could not start
because the available subagent quota was exhausted. This is not treated as H2
approval. The complete uncommitted diff remains stopped for explicit human H2.
