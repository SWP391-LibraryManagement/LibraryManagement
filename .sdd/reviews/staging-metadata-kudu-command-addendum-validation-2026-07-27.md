# Staging Metadata Kudu Command Addendum Validation - 2026-07-27

Status: H2 ADDENDUM APPROVED; LOCAL CANDIDATE PASS; H3 PENDING

Baseline: `f3fa7c1dc43fdc4cca5fb928a42d66efb694495e`

Branch: `codex/fix-staging-metadata-kudu-runtime`

## Scope And Authority

- The user approved the original H2 candidate, then approved this H2 addendum
  after `origin/main` introduced an overlapping bundled migration runtime.
- The addendum adopts that locked `migration-runtime/node_modules` package and
  changes only how the existing manual Kudu command supplies `NODE_PATH`.
- No SQL, API, workflow trigger, actor role, database permission, firewall,
  Azure resource, or dependency version changes.
- H3 remains required before merge or running the staging metadata repair.

## Proven Runtime Finding

A harmless read-only command probe against the staging Kudu `/api/command`
endpoint produced:

| Command form | Exit | Result |
| --- | ---: | --- |
| `TEST_FLAG=codex-proof node ...` | 127 | Kudu tried to execute `TEST_FLAG=codex-proof` as the program |
| `env TEST_FLAG=codex-proof node ...` | 0 | Node received `TEST_FLAG=codex-proof` |

The command endpoint therefore does not interpret POSIX assignment-prefix
syntax. The bundled runtime is still the correct dependency boundary, but its
invocation must be:

```text
env NODE_PATH=/home/site/wwwroot/migration-runtime/node_modules node scripts/migrateLibraryMetadata.js
```

## TDD Evidence

- RED: focused deployment test passed 3/4 and rejected the old
  `NODE_PATH=... node ...` command.
- GREEN: focused deployment test passed 4/4 after adding the explicit `env`
  executable and a regression assertion that forbids the assignment-prefix
  form.

## Local Validation

| Check | Result |
| --- | --- |
| Focused staging migration workflow | PASS - 4/4 |
| All deployment utilities | PASS - 14/14 |
| Metadata migration/readiness backend tests | PASS - 2 suites, 3/3 |
| Traceability enforcement | PASS - FE05 31/31; no implemented feature below 70% |
| Tracked diff whitespace | PASS |
| Untracked review whitespace | PASS |
| Changed-path scope | PASS - six approved files only |
| Secret-value scan | PASS |

Baseline CI run `30277665874` passed for exact commit `f3fa7c1`. The addendum
branch must still pass its own exact-head CI after publication.

## Remaining Boundary

- Exact-head CI must pass after push.
- H3 must approve the exact PR diff before merge.
- After H3 merge, run the manual repair once and require readiness plus full
  staging smoke to pass.
