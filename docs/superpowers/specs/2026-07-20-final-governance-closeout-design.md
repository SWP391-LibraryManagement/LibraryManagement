# Final Governance Closeout Design

Date: 2026-07-20

Decision: Hybrid SDD + ADD, Standard depth.

## Goal

Make the current FE01-FE12 release package internally consistent and reviewable
without adding new business scope: restore the approved FE11 audit-log filter
surface, reconcile current completion metadata, establish one canonical release
reference, and keep local tooling artifacts out of the product tree.

## Evidence and problem statement

- `origin/main` and tag `v1.0.1` contain the current release tree.
- `frontend/src/page/UserManagement.jsx` still builds `action` and `actorId`
  query parameters but no longer renders the corresponding controls.
- FE11 SPEC requirements describe a searchable/filterable audit view, while the
  current traceability table still contains `Not Started` rows for the same
  completed requirement IDs.
- Release documents still identify `v1.0.0-final-release` as canonical even
  though `v1.0.1` is the latest published source release.
- `.worktrees/` and `.superpowers/` are local tooling directories and are not
  currently ignored.

## Design alternatives

### A. Restore the approved filter surface (selected)

Render the existing `action` and `actorId` controls again, preserve the current
server contract, add focused frontend regression coverage, and reconcile the
FE11 changelog. This is the smallest behavior change that restores parity with
the approved API/UI contract.

### B. Keep the simplified UI and change the contract

Remove `action` and `actorId` from the UI contract and revise FE11 SPEC,
OpenAPI-supporting notes, tests, and acceptance evidence. This changes an
approved searchable/filterable surface and requires a new human-approved
requirement decision.

### C. Documentation-only closeout

Leave the UI as-is and only update release/status documents. This is fastest but
leaves a contract-to-UI mismatch and does not close the identified regression
risk.

Option A is selected because the backend/API already supports both filters, the
frontend state and query builder already preserve them, and no schema or API
change is needed.

## Scope

### Core-adjacent behavior

- Restore visible Admin Audit Log controls for `action` and numeric `actorId`.
- Preserve server-side validation, redaction, pagination, and Admin-only access.
- Add tests that prove the controls exist and feed the canonical query builder.

### Documentation and governance shell

- Add a current-status legend or reconcile current `FR-*`/`AC-*` rows that are
  stale in completed feature packages, without rewriting historical changelog
  entries.
- Record the FE11 UI reconciliation in its `CHANGELOG.md`, `PLAN.md`, and
  `TASKS.md` evidence sections.
- Update release documents to use the next immutable canonical tag, `v1.0.2`,
  after this closeout is merged and validated.
- Promote project governance status headers from `DRAFT` to `APPROVED` only
  where the existing normative content is unchanged and the human reviewer
  explicitly accepts the status transition.
- Ignore `.worktrees/` and `.superpowers/`; do not delete or rewrite any
  untracked user-authored documents.

## Files likely to change

- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementFrontend.test.js`
- `.sdd/specs/feat-user-role-management/SPEC.md`
- `.sdd/specs/feat-user-role-management/PLAN.md`
- `.sdd/specs/feat-user-role-management/TASKS.md`
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- `scripts/check-traceability.js` and its tests, if a stale-status guard is
  needed after inspecting the existing parser
- `README.md`, `plan.md`, `docs/release/phase3-final-report.md`,
  `docs/release/final-submission-checklist-2026-07-20.md`,
  `document/FinalRelease.md`, and related release evidence
- `.sdd/constitution.md`, `.agents/AGENTS.md`, and
  `.sdd/constraints/*.md` only for explicitly approved status-header changes
- `.gitignore`
- `docs/superpowers/plans/2026-07-20-final-governance-closeout.md`

## Non-goals

- No new API endpoint, database migration, role permission, business rule, or
  notification behavior.
- No deletion of `.worktrees/`, `.superpowers/`, or user-authored untracked
  documents.
- No merge, push, tag creation, or staging configuration mutation in the local
  implementation pass; those require the repository's H2/H3 integration gates.

## Validation contract

1. RED: a focused frontend test fails when the action/actor controls are absent.
2. GREEN: the controls are restored and the focused test passes.
3. L1: traceability, backend coverage, system integration, frontend tests/lint/
   build, E2E, deployment tests, OpenAPI parse, dependency audit, and diff
   hygiene pass.
4. L2: every changed FE11 requirement maps to SPEC, TASKS, code, and tests;
   current completion status is distinguishable from historical snapshots.
5. L3: stack, authorization, validation, redaction, secret, and dependency
   constraints remain unchanged.
6. L4: the existing Admin Audit Log browser acceptance and full system golden
   path pass; release evidence names the exact post-merge tag.

## Approval boundary

This design is ready for human review. Implementation begins only after the
human reviewer confirms Option A and the status-header/release-tag policy.
