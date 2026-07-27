# Staging Metadata Kudu Node Compatibility Validation - 2026-07-27

Status: H1/H2 AUTO-APPROVED; LOCAL CANDIDATE PASS; H3 PENDING

Baseline: `c0d22e7391dd77a521c06bff18587ab11c22e533`

Branch: `codex/fix-kudu-node-runtime-compat`

## Authority And Scope

- The user authorized automatic H1/H2/H3 progression until staging and the
  target FE flows are verified.
- The candidate changes only the dependency lock used by the bounded,
  manual-only metadata migration inside Kudu.
- The Node 22 backend keeps `mssql` 12.5.5. Only the migration sidecar uses
  `mssql` 11.0.1 plus `dotenv` 17.4.2.
- No SQL, API, trigger, role, permission, firewall, Azure resource, or
  application dependency changes.

## Proven Failure

- PR 66 merged as `c0d22e7`; exact-head CI run `30278991398` passed.
- Automatic deploy run `30279275037` deployed the exact head and failed closed
  at the expected pre-migration readiness `503`.
- Repair attempt 1, run `30279292848`, deployed the isolated runtime but failed
  before opening a database connection.
- Kudu reported Node `18.17.1`; the deployed `mssql` 12.5.5 package declares
  Node `>=18.19.0` and failed while importing
  `diagnostics_channel.tracingChannel`.

The failure therefore remains outside SQL execution. The database was not
partially migrated by repair attempt 1.

## TDD And Compatibility Evidence

- RED: focused deployment workflow passed 3/4 and rejected copying the Node 22
  application lockfile into the Kudu migration runtime.
- GREEN: focused deployment workflow passed 5/5 after both workflows copied
  the isolated package and lockfile.
- A local Node 18.17.1 process reproduced the `mssql` 12.5.5 import failure.
- The same Node 18.17.1 process loaded locked `mssql` 11.0.1 and `dotenv`
  17.4.2 successfully and exposed the expected `connect`/`config` functions.
- The isolated production dependency audit reports zero vulnerabilities.

## Local Validation

| Check | Result |
| --- | --- |
| Focused staging migration workflow | PASS - 5/5 |
| All deployment utilities | PASS - 15/15 |
| Metadata migration/readiness backend tests | PASS - 2 suites, 3/3 |
| Traceability enforcement | PASS - FE05 31/31; no implemented feature below 70% |
| Isolated runtime production audit | PASS - 0 vulnerabilities |
| Node 18.17.1 dependency-load probe | PASS |
| Tracked and untracked whitespace | PASS |
| Changed-path scope | PASS - nine approved files only |
| Secret-value scan | PASS |

## Remaining Gates

- Exact-head PR CI and two-axis H3 review must pass before merge.
- Repair attempt 2 must apply and verify the reviewed migration, then staging
  readiness, smoke, and the target browser flows must pass.
