# FE05 Legacy Acceptance Identity Amendment Design

- Date: 2026-08-04
- Branch: `codex/fix-fe05-cleanup-legacy-identity`
- Scope: staging cleanup operator and FE05 closeout evidence only

## Problem

PR #112 added a fail-closed cleanup operator for the historical
`lms-acceptance-20260802-*` staging fixtures. The operator derives the final
eight hexadecimal characters from each run ID and expects usernames and email
addresses to contain only that suffix.

The retained staging rows used the complete run ID instead:

```text
acc_member_a_<full-run-id>
member-a.<full-run-id>@lms.invalid
```

The original dry-run therefore reported `0 users / 1 book / 1 copy` and
correctly refused deletion even though all four synthetic users still existed.

## Selected Approach

Match the four historical username/email pairs with the complete validated run
ID. Keep the eight-character suffix only for the future synthetic ISBN
`ACC-<suffix>`.

This is the smallest correction because the run ID already has a strict
allowlist pattern and is obtained from the exact title/barcode pair. It restores
the intended `4 users / 1 book / 1 copy` identity gate without broad wildcard
matching.

## Alternatives Considered

### Support both suffix-only and full-run identities

Rejected for this legacy batch. Accepting two identity formats widens the delete
boundary and could count eight users if both formats coexist. Future fixture
contracts can add a separately reviewed versioned matcher when needed.

### Keep using one-off direct SQL

Rejected as the repository fix. The approved direct-SQL execution cleaned the
current staging database safely, but leaving the tracked operator inconsistent
would make restored staging snapshots fail the same dry-run again.

## Safety Boundaries

- Restrict execution to `LibraryManagementStaging`.
- Require the exact run-ID pattern
  `^lms-acceptance-20260802-[0-9a-f]{8}$`.
- Require exactly four full-run user identities, one exact-title book, and one
  exact-barcode copy before deletion.
- Keep parameterized SQL, one serializable transaction per run,
  child-before-parent deletion, rollback on SQL/FK errors, and residue checks.
- Do not change schema, application API, roles, normal FE05 behavior, or the
  optional ISBN rule for real books.

## Verification

- Add a regression assertion that discovery and cleanup SQL use the full run ID
  for historical usernames/emails and do not reduce it with `RIGHT(..., 8)`.
- Preserve tests for staging guard, dry-run default, exact `4/1/1` validation,
  deletion order, rollback boundaries, and synthetic ISBN generation.
- Run focused cleanup/operator tests, the full backend suite, traceability,
  secret scan, and `git diff --check`.
- Record the completed staging cleanup and browser QA evidence in FE05 closeout
  documentation without changing product completion claims outside FE05-T021.
