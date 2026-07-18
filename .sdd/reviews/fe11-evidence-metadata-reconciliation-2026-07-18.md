# FE11 Evidence Metadata Reconciliation Matrix

Status: APPROVED BY HUMAN - 2026-07-18

Date: 2026-07-18

Scope: `TD-027`; existing evidence/test-case and status cells only

## Rules

- Do not change requirement wording, IDs, actors, flows, business rules, API behavior, acceptance criteria, or table structure.
- Change only existing `Test Case` and `Status` cells supported by merged B7 records.
- Use `COMPLETE (B7)` for a fully satisfied existing row.
- Use `PARTIAL` when an unwanted-behavior FR spans completed and deferred actions.
- Desired FR rows without their own status cell are represented through their mapped AC rows; do not add a new status structure.
- Keep unimplemented update/deactivation, librarian-field, Admin Console, Audit, Request Management, and optimistic-concurrency rows unchanged.
- Prepare this matrix in parallel, but apply the actual `SPEC.md` edit only in the Integration Lead's serial writer window after TD-026 merges.

## Acceptance-Criteria Rows To Mark Complete

| AC rows | Replacement `Test Case` cell | Replacement `Status` cell | Evidence |
| --- | --- | --- | --- |
| `AC-FE11-001`, `AC-FE11-002` | `FE11-U01..U06; fe11-safe-user-list-detail-validation-2026-07-18.md` | `COMPLETE (B7)` | PR #27, merge `ed6bd717`, CI `29639933730` |
| `AC-FE11-003`, `006`, `010`, `020..022` | `FE11-S01..S07; auth-account-setup-boundary-validation-review-2026-07-15.md` | `COMPLETE (B7)` | merge `c7f7821`, main `e8f467c`, CI `29392143926` |
| `AC-FE11-013..015` | `FE11-R01..R05; FE11-UIR01..UIR05; bounded validation records` | `COMPLETE (B7)` | PR #25 / CI `29631406399`; PR #30 / CI `29644292781` |

These AC rows are the status representation for desired `FR-FE11-001..003`, `006`, `009`, `012..014`, and `036..038`, which do not have independent desired-FR status cells.

## Unwanted-Behavior FR Rows To Mark Complete

| FR row | Replacement `Test Case` cell | Replacement `Status` cell | Evidence |
| --- | --- | --- | --- |
| `FR-FE11-015` | `FE11-U01..U06 and FE11-R01..R05 Admin-first route authorization` | `COMPLETE (B7)` | Safe-read and transactional-role validation records |
| `FR-FE11-022` | `FE11-S01..S07 account-creation rollback coverage` | `COMPLETE (B7)` | Account-setup validation and B7 integration evidence |
| `FR-FE11-024..027` | `FE11-R01..R05 deterministic role outcome coverage` | `COMPLETE (B7)` | Transactional role validation; PR #25 / CI `29631406399` |
| `FR-FE11-029` | `FE11-S01..S07 invalid, expired, used, revoked, and ineligible setup-token coverage` | `COMPLETE (B7)` | Account-setup validation and auth route tests |
| `FR-FE11-037`, `FR-FE11-038` | `FE11-S01..S07 safe delivery failure and resend eligibility/cooldown coverage` | `COMPLETE (B7)` | Account-setup validation; merge `c7f7821`; CI `29392143926` |

## Unwanted-Behavior FR Rows To Mark Partial

| FR row | Replacement `Test Case` cell | Replacement `Status` cell | Reason |
| --- | --- | --- | --- |
| `FR-FE11-016` | `FE11-U01..U06 detail 404 plus FE11-R01..R05 role-target outcomes; update/deactivation pending` | `PARTIAL` | Detail and role targets are covered; update/deactivation and other target actions remain deferred |
| `FR-FE11-017` | `FE11-R01..R05 acting-admin revalidation; other acting-admin actions pending` | `PARTIAL` | Role mutation revalidates the acting Admin; other FE11 actions do not yet satisfy the full row |

## Rows That Must Remain Not Started

- AC rows: `AC-FE11-004`, `005`, `007..009`, `011`, `012`, `016..019`, `023`.
- Unwanted FR rows: `FR-FE11-018..021`, `023`, `028`, `030..035`.
- Any update/deactivation, librarian-field, Admin Console, Audit Log, Request Management, or optimistic-concurrency mapping not listed as complete or partial above.

## Companion Metadata Corrections

The same TD-027 evidence-only PR may correct these stale state descriptions without changing requirements:

- `PLAN.md` and `TASKS.md`: Admin Role UI state becomes `COMPLETE (B7)` while whole FE11 remains `Implementation State: DEFERRED`.
- `TEST_PLAN.md`: remove statements that Admin Role UI human review/merge/CI are pending; record PR #30 and post-merge CI `29644292781`.
- `auth-account-setup-boundary-validation-review-2026-07-15.md`: record merge `c7f7821`, containing main commit `e8f467c`, and successful CI `29392143926` before account-setup rows become `COMPLETE (B7)`.
- Do not rewrite the historical pending checkpoint in `CHANGELOG.md`; its newer top entry already records completion.

## H1 Recommendation

Approve this matrix as the sole authority for the later TD-027 evidence-only diff. Any requirement wording, API behavior, new traceability-table structure, or status change outside the rows above is out of scope and requires separate spec review.
