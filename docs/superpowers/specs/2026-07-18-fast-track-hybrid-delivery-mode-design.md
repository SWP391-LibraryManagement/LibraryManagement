# Fast-Track Hybrid Delivery Mode Design

Status: APPROVED BY HUMAN - 2026-07-18

Date: 2026-07-18

Baseline: `origin/main@1eb426196ebbc80339e2aed4558270967cd7269e`

Scope: Project delivery workflow for the remaining SDD/ADD backlog; the first activation batch is FE11 `TD-024`, `TD-026`, and `TD-027`, with `TD-023` and `TD-025` retained as dependency forecasts only.

Revision note: Nhat approved the pre-H1 correction direction on 2026-07-18. The exact Constitution, contract, ownership, and activation diff remains subject to H1 review before commit.

## 1. Decision

Adopt a Fast-Track Hybrid delivery mode with up to three concurrent lanes, one integration lead, and only three types of human gate.

Parallelism is stage-based rather than unrestricted code fan-out. Only one builder may edit shared Core files for the active slice. While that builder implements, the other lanes prepare the next contract and independently verify the current work.

This mode preserves the Hybrid B1-B7 controls while removing repeated confirmations, duplicate closeout PRs, and avoidable serial research.

## 2. Source And Rationale

This design applies the playbook guidance from:

- Chapter 11, printed pages 277-304: multi-agent boundaries, shared state, interface contracts, orchestration, and stop conditions.
- Chapter 13, printed pages 316-340: Core/Shell classification, B1-B7, validation layers, human gates, and the escape hatch.
- Chapter 14, printed pages 341-353: rotating project roles, batch planning, testing/security work, and delivery cadence.

Recent repository evidence shows that the main delay is workflow serialization rather than test runtime:

- FE11 role UI required an implementation PR and a separate closeout PR.
- Each CI run completed in roughly two minutes, while repeated design, publish, review, merge, and closeout approvals added most of the wall-clock delay.
- Remaining FE11 debt shares `frontend/src/page/UserManagement.jsx`, Admin API modules, and backend Admin/user-management layers, so three independent coding agents would create conflicts and incompatible assumptions.

## 3. Goals

- Remove ad hoc confirmations and use only the three explicit gate types defined below.
- Keep Core security, API, permission, data, and state behavior spec-first.
- Keep RED-GREEN evidence and all four validation layers.
- Allow design, implementation, and independent review to overlap safely.
- Publish draft PRs automatically after the implementation diff has passed human review at H2.
- Batch mechanical B7 closeout evidence instead of creating one closeout PR per slice.
- Preserve one accountable integration owner who can explain every merged result.

## 4. Non-Goals

- No automatic merge without the third human gate.
- No parallel writers on the same shared Core files.
- No security, schema, permission, public API, or state-machine change from an ambiguous requirement.
- No CI waiver, skipped test, or reduced server-side authorization requirement.
- No claim that the whole FE11 feature is complete while deferred debt remains.
- No immediate CI workflow rewrite; CI optimization requires its own reviewed infrastructure slice.

## 5. Risk And Specification Depth

| Work type | Default method | Depth |
| --- | --- | --- |
| Authentication, permissions, audit redaction, public API, schema, state transitions | SDD first, bounded ADD after approval | Full |
| Business rules with one integration boundary | Hybrid | Standard or Full |
| Reversible UI composition, copy, adapters, evidence-only docs | ADD inside an approved contract | Light or concrete DoD |

Core includes authorization, validation, redaction, API ownership, data contracts, terminal-state rules, and audit semantics. Shell includes layout, navigation rendering, mechanical adapters, and evidence formatting.

## 6. Operating Topology

### Lane 1 - Integration Lead

- Owns scope, source-of-truth reading, contract decisions, common documentation, and dependency ordering.
- Creates the batch design/plan/task package.
- Assigns file ownership and interface contracts before parallel work.
- Integrates commits, resolves non-overlapping drift, prepares PR evidence, and monitors CI.
- Is the only lane allowed to change shared contracts after human approval.

### Lane 2 - Builder

- Owns RED-GREEN implementation for the active slice in an isolated worktree.
- Is the sole writer for shared Core production files in that slice.
- Maintains local test/evidence checkpoints and reports changed contracts immediately.
- Does not commit AI-generated implementation changes before H2 human review.
- Does not expand scope or reinterpret requirements.

### Lane 3 - Verifier

- Independently reviews spec compliance, standards, security, tests, and residual risks.
- May prepare read-only matrices or add non-conflicting review evidence.
- Does not rewrite Builder production code concurrently.
- Reports findings to the Integration Lead for correction and fan-in validation.

The lanes form a pipeline:

```text
Lead designs slice N+1
        ||
Builder implements slice N
        ||
Verifier reviews slice N / validates slice N-1
```

## 7. Three Human Gates

### H1 - Batch Contract Approval

The human approves one package covering two or three bounded slices:

- Core/Shell classification and spec depth.
- API/data/security contracts and unresolved decisions.
- Dependency order, file ownership, plan, tasks, tests, and validation commands.
- Agent roles and allowed parallel work.

H1 grants standing authorization for the approved batch to:

- Create worktrees and branches.
- Use up to three agent lanes.
- Write RED-GREEN code and tests within scope.
- Prepare complete local diffs and validation evidence for H2 review.

H1 does not authorize committing generated implementation changes, pushing product-code branches, merge, schema expansion, contract changes, or security waivers.

When the H1 package includes the exact Fast-Track governance activation diff, H1 also acts as the pre-commit output review for that documentation-only diff. It authorizes the Integration Lead to commit and publish the governance activation PR. That PR still requires automated checks and H3 before merge, and Batch 1 state becomes authoritative only after the activation PR reaches `main`.

For a batch that requires a governance activation PR, H1's standing product-work authorization becomes usable only after that activation PR merges. Planning may continue in a separate docs worktree while activation checks run, but product implementation must wait.

### H2 - Local Implementation Package Approval

The human reviews one consolidated local AI-output package before generated implementation or SPEC-evidence changes are committed:

- Diff and changed files.
- RED-GREEN history.
- L1 automated evidence.
- L2 spec mapping.
- L3 Constitution/security review.
- L4 acceptance evidence and residual risks.

H2 authorizes the Integration Lead to create the approved commits, push the slice branch, open the draft PR, and mark it ready after required PR checks pass. It does not authorize merge.

H2 is a local pre-commit output review, not the Constitution's final PR integration review. It can occur before a PR exists. Required PR checks run after publication and before H3.

### H3 - Final Integration Approval

The human performs the final PR integration review and approves merge after required PR checks pass and the branch remains mergeable.

H3 authorizes the agent to:

- Merge the approved implementation PR.
- Monitor the exact post-merge `main` CI run.
- Fill only the pre-reviewed closeout evidence fields with PR number, merge SHA, and CI run IDs.
- For the final slice in the batch, publish and merge the mechanical batch-closeout PR after its required checks pass.

Any new behavior, changed requirement, non-mechanical documentation claim, failed required check, or new security risk requires another approval.

H3 applies to every merge, including the Fast-Track governance activation PR, implementation PRs, TD-027 evidence-only PRs, and the final mechanical batch-closeout PR.

H1 occurs once for the approved two- or three-slice batch. H2 and H3 occur once per implementation PR because each generated diff and merge result must be reviewed independently. No additional confirmations are requested for individual tests, worktrees, commands, commits already covered by H2, draft publication, or post-merge monitoring.

## 8. Branch, Worktree, And PR Strategy

- Use one isolated worktree and one implementation branch per active slice.
- Publish the exact H1-reviewed governance activation diff as a documentation PR; Batch 1 task/debt activation is authoritative only after that PR passes checks, receives H3, and merges.
- Use one implementation PR per slice; include design, plan, tasks, tests, code, and validation-ready evidence.
- Keep generated production/test changes uncommitted in the isolated worktree until H2 review. After H2, create the reviewed commit set and publish the PR without another permission prompt.
- Do not run sibling implementation branches against the same shared Core files.
- Design for the next slice may proceed in a separate docs worktree while the current slice is implemented.
- Rebase or merge current `main` only when the incoming drift does not overlap the approved Core contract. Overlapping drift stops the lane and returns to the Integration Lead.
- Collect post-merge evidence for the approved batch in one closeout PR at the end of the batch, rather than one closeout PR per slice.
- The closeout template is reviewed at H3. Afterward, only exact evidence identifiers and already-approved task/debt state transitions may be substituted automatically.

## 9. Validation Model

Every implementation slice retains all four layers:

| Layer | Fast-track evidence |
| --- | --- |
| L1 Automated | Focused RED-GREEN, affected regression, lint/build, traceability, diff, secret/security scans, PR CI |
| L2 Spec | Stable requirement IDs mapped to tasks, code, tests, and acceptance evidence |
| L3 Constitution/Safety | Independent standards/security review, authorization boundary, validation, secrets, audit, scope |
| L4 Acceptance | Browser/API flow or explicit reviewer-demonstrated acceptance; residual environment gaps recorded |

Local checks may run concurrently when they do not write the same output directories. Current GitHub CI remains the required full regression gate for code PRs and `main`.

After H2 approval, draft PR publication is automatic when local focused checks, lint/build where affected, traceability, diff hygiene, and scope checks pass.

## 10. Retry And Stop Rules

- A deterministic failure receives the original attempt plus at most two corrective retries.
- A suspected E2E flake may be rerun once with trace/log evidence; the same second failure is treated as a defect.
- Stop immediately for an ambiguous contract, unexpected shared/Core file drift, secret exposure, permission/schema/API expansion, incompatible agent assumptions, or failed required check.
- Never merge with a waiver unless the team lead explicitly accepts it and the repository records the reason.
- When stopped, preserve the checkpoint, report evidence, and use the documented escape hatch instead of continuing silently.

## 11. First Fast-Track Batch

### Parallel Preparation

- Lead: lock the canonical `TD-024` Audit Logs endpoint, filters, validation, redaction allowlist, and ownership.
- Verifier/docs lane: prepare the read-only `TD-027` evidence matrix without changing `SPEC.md`.
- Analysis lane: resolve the `TD-026` user-list envelope decision by reusing the FE12 user-statistics read model and define its impact on role counts/Permissions.

### Sequential Implementation Order

1. `TD-024` Audit Logs, first because it is P1 security and independently implementable after its contract is locked.
2. `TD-026` user-list envelope, preserving `{ data, pagination }` and migrating Admin counters to the completed FE12 `/api/reports/users` read model.
3. `TD-027` status/evidence metadata, in a serial `SPEC.md` writer window after TD-026 merges.

Forecast outside Batch 1:

4. `TD-023` Admin Console/Permissions, after the FE12-backed role-count source and FE11 permission-matrix ownership are explicit.
5. `TD-025` Request Management, only after FE07 ownership, detail contract, and terminal-state enforcement are locked.

`TD-027` analysis may run in parallel, but its actual `SPEC.md` edit is serialized after TD-026 and must not alter FE11 requirements.

## 12. Dependency Rules

```text
TD-027 matrix preparation ----------- independent read-only evidence lane

TD-026 merge --> TD-027 SPEC edit --- single Integration Lead writer

TD-024 ------------------------------ security-first independent slice

TD-026 --> TD-023 ------------------- FE12-backed summary/count source first

FE07 request contract --> TD-025 ----- server terminal-state ownership first
```

`TD-023` and `TD-025` are dependency forecasts outside Batch 1 and receive no implementation authorization from Batch 1 H1. `TD-023`, `TD-024`, and `TD-025` must not be implemented concurrently on sibling branches because they overlap Admin frontend and backend integration files.

## 13. Required Artifacts

For each batch:

- One approved batch design.
- One governance activation PR with required checks and H3 merge approval.
- One implementation plan with dependency order and file ownership.
- Atomic task groups with stable IDs and DoD.
- Per-slice validation records with L1-L4 evidence.
- One implementation PR per slice.
- One mechanical closeout PR for the completed batch.
- Updated TASKS, changelog, debt register, and agent memory only when evidence supports the state change.

## 14. Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Parallel agents create conflicting code | Only one Builder writes shared Core files; other lanes design or verify |
| Interface assumptions diverge | Lock versioned contracts at H1; producers cannot silently change them |
| Fewer approvals hide scope expansion | H1 grants only explicit batch scope; Core drift stops immediately |
| Batched closeout leaves evidence briefly pending | Use a pre-reviewed template and close the batch immediately after its final post-merge CI |
| Draft PRs publish unreviewed generated work | Require local validation and H2 review before commit/push; keep the PR draft until required checks pass |
| H2 is confused with final PR review | Define H2 as local pre-commit output review and H3 as the post-check Constitution integration review |
| Evidence maintenance conflicts with contract work | Prepare TD-027 read-only in parallel, but serialize its SPEC edit after TD-026 merges |
| Base branch changes during work | Auto-sync only non-overlapping drift; overlapping Core drift escalates |
| CI path filtering skips regressions | No path filtering in this design; future CI optimization needs separate review |

## 15. Success Criteria

Fast-Track mode succeeds when:

- Work uses only H1, H2, and H3 gate types: H1 once per batch, then H2/H3 once per generated slice PR; the exact H1-reviewed governance diff proceeds directly to its required H3 merge gate.
- Agents do not request permission for each test run, worktree, reviewed commit set, draft publication, or mechanical closeout step already authorized by a gate.
- At least two lanes remain productive without concurrent edits to shared Core files.
- Every merged slice has L1-L4 evidence and exact post-merge CI association.
- No security, permission, schema, or public API behavior is implemented from an unlocked assumption.
- Closeout evidence is consolidated per batch while project memory stays accurate.
- The whole-feature completion state remains truthful.

## 16. Open Questions

None at the design-direction level. Nhat approved the correction direction on 2026-07-18. The exact H1 package must still be reviewed before the governance activation commit/PR and before Batch 1 becomes active.
