# Fast-Track Hybrid Delivery Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate the corrected Fast-Track governance model through a reviewed documentation PR and prepare FE11 Batch 1 for TD-024, TD-026, and TD-027 without changing product behavior.

**Architecture:** The Integration Lead is the only writer in the control worktree. Read-only lanes inventory contracts and evidence in parallel. H1 reviews the exact governance activation package; H2 reviews later generated implementation or SPEC-evidence diffs before commit; H3 performs final integration review after required PR checks.

**Tech Stack:** Markdown SDD artifacts, Git worktrees/branches, PowerShell, `rg`, Node.js traceability checker, GitHub CLI, existing FE11/FE12 contracts and evidence.

## Global Constraints

- Baseline is `origin/main@1eb426196ebbc80339e2aed4558270967cd7269e` unless a newer non-overlapping `main` commit is explicitly accepted.
- This plan changes governance, planning, and evidence files only; it does not change backend, frontend, database, schema, dependencies, or runtime configuration.
- Keep whole-feature FE11 `Implementation State: DEFERRED`.
- Batch 1 scope is only `TD-024`, `TD-026`, and `TD-027`.
- Keep `TD-023` and `TD-025` `OPEN`; their order is dependency forecasting, not implementation authorization.
- Use up to three lanes, but only the Integration Lead writes files in the control worktree.
- H2 is local pre-commit AI-output review. H3 is final PR integration review after required checks.
- Do not commit or push the governance activation diff before H1 approval.
- Do not start product implementation before the governance activation PR merges into `main`.
- Prepare TD-027 read-only in parallel, but serialize its actual `SPEC.md` edit after TD-026 merges.
- Stop immediately for contract ambiguity, overlapping Core drift, secret exposure, permission/schema/auth/API expansion, incompatible agent assumptions, or a failed required check.

---

### Task 1: Reconcile Governance Authority

**Files:**
- Modify: `.sdd/constitution.md`
- Modify: `.agents/AGENTS.md`
- Modify: `.agents/CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md`

**Interfaces:**
- Consumes: approved Fast-Track concept and pre-H1 verifier findings.
- Produces: one non-conflicting H1/H2/H3 authority model.

- [x] **Step 1: Preserve the isolated baseline**

Run:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git rev-parse origin/main
```

Expected: linked worktree `fe11-role-ui-contract`, branch `docs/fast-track-delivery-mode`, and baseline `1eb426196ebbc80339e2aed4558270967cd7269e`.

- [x] **Step 2: Correct Constitution review ordering**

Use version `0.1.1` and require:

```markdown
- AI-generated changes may receive a required local human output review before they are committed or published as a pull request.
- Every pull request must pass the available automated checks before final human integration review and merge approval.
- A local output review never authorizes merge; merge approval remains a separate post-check integration decision.
```

- [x] **Step 3: Correct the Fast-Track design and agent rules**

Lock these meanings:

- H1 reviews the batch and the exact documentation-only activation diff.
- H1 authorizes the reviewed activation commit/PR, not its merge.
- H2 reviews later local generated implementation or SPEC-evidence diffs before commit.
- H3 applies before every PR merge after required checks.
- Task/debt activation becomes authoritative only on `main`.
- Shared `SPEC.md` edits are serialized.

- [x] **Step 4: Validate governance consistency**

Run:

```powershell
rg -n "local human output review|final human integration review|H2 - Local|H3 - Final|governance activation|authoritative only after" .sdd/constitution.md .agents/AGENTS.md .agents/CLAUDE.md docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md
git diff --check -- .sdd/constitution.md .agents/AGENTS.md .agents/CLAUDE.md docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md
```

Expected: all authority markers exist and diff check is empty.

---

### Task 2: Lock The TD-024 Audit Contract

**Files:**
- Create: `docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md`

**Interfaces:**
- Consumes: FE11 `q/action/actorId/from/to/page/limit` contract and every current AuditLogs writer.
- Produces: exact Admin endpoint, projection, retirement, tests, and ownership for TD-024.

- [x] **Step 1: Inventory current writers and readers**

Run:

```powershell
rg -n "GET.*api/admin/audit-logs|q\?|actorId\?|from\?|to\?" .sdd/specs/feat-user-role-management/SPEC.md
rg -n "action:\s*'[^']+'|writeAudit\([^\r\n]*'[^']+'|INSERT INTO AuditLogs" backend/src/services backend/src/repositories --glob '*.js'
rg -n "audit-logs|listAuditLogs|fetchAuditLogs|Metadata" backend/src frontend/src backend/tests frontend/test
```

Expected: canonical query names, cross-feature actions, prototype route, page/limit-only behavior, and raw metadata drift are visible.

- [x] **Step 2: Lock the action-aware default-deny design**

The design must state:

- `GET /api/admin/audit-logs` only.
- Query names remain `q`, `action`, `actorId`, `from`, `to`, `page`, `limit`.
- All persisted rows are eligible; `action` narrows them.
- Invalid JSON, scalar/array metadata, unknown actions, and invalid shapes return `details: {}`.
- Each current action has an explicit projector.
- Raw email, identifier, token IDs, nested objects, notes, reasons, messages, and paths are omitted.
- Free text is replaced only by `notesProvided`, `reasonProvided`, or `noteProvided` booleans.
- A recursive credential/secret veto runs after projection.
- The legacy route returns `404 NOT_FOUND` without invoking a service.
- `frontend/test/adminApi.test.js` owns the direct Admin API contract.

- [x] **Step 3: Validate the Audit design**

Run:

```powershell
rg -n 'Status: H1 REVIEW READY|`q`|`from`|Action-Aware Safe Projection|details: \{\}|404.*NOT_FOUND|frontend/test/adminApi.test.js' docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md
git diff --check -- docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md
```

Expected: every corrected contract marker is present. Do not commit.

---

### Task 3: Lock The TD-026 FE12 Reuse Decision

**Files:**
- Create: `docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md`

**Interfaces:**
- Consumes: FE11 `{ data, pagination }`, undocumented `summary`, and completed FE12 `/api/reports/users`.
- Produces: one non-duplicating summary source and TD-023 dependency forecast.

- [x] **Step 1: Verify FE12 ownership and response**

Run:

```powershell
rg -n "BR-FE12-006|usersByStatus|usersByRole|/api/reports/users|B7 integration" .sdd/specs/feat-reporting-statistics/SPEC.md .sdd/specs/feat-reporting-statistics/TASKS.md .sdd/specs/feat-reporting-statistics/CHANGELOG.md backend/src/repositories/reportRepository.js backend/src/docs/openapi.yaml
rg -n "summary|setUserSummary|usersByRole|permissions" backend/src/repositories/userRepository.js frontend/src/page/UserManagement.jsx docs/api/api-contract.md
```

Expected: FE12 already supplies authoritative total/status/role counts and FE11 list still emits undocumented summary.

- [x] **Step 2: Select Option C**

Lock this mapping:

```text
total      <- totals.users
active     <- usersByStatus.ACTIVE || 0
inactive   <- usersByStatus.INACTIVE || 0
librarians <- usersByRole.LIBRARIAN || 0
```

Keep `GET /api/users` exactly `{ data, pagination }`. Do not create `/api/admin/user-summary`. TD-023 remains outside Batch 1 and must not derive counts from paginated rows.

- [x] **Step 3: Validate the decision**

Run:

```powershell
rg -n 'Option A|Option B|Option C|GET /api/reports/users|Do not create `/api/admin/user-summary`|TD-023 remains outside Batch 1' docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md
git diff --check -- docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md
```

Expected: FE12 reuse, no new endpoint, and dependency boundary are explicit. Do not commit.

---

### Task 4: Correct The TD-027 Evidence Matrix

**Files:**
- Create: `.sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md`
- Modify: `.sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md`

**Interfaces:**
- Consumes: actual FE11 traceability-table structure and merged B7 evidence.
- Produces: exact existing cells for a later evidence-only PR.

- [x] **Step 1: Verify missing account-setup B7 evidence**

Run:

```powershell
git show -s --format='%H %P %s' c7f7821
git show -s --format='%H %P %s' e8f467c
git merge-base --is-ancestor c7f7821 e8f467c
gh run view 29392143926 --json databaseId,headSha,conclusion,status,name,url
```

Expected: `c7f7821` is contained by `e8f467c`; CI `29392143926` is successful on `e8f467c`.

- [x] **Step 2: Add the account-setup B7 integration record**

Record the two commits and CI run in the existing review. Do not claim whole-feature completion.

- [x] **Step 3: Lock exact TD-027 rows**

Use these groups:

```text
COMPLETE AC: 001, 002, 003, 006, 010, 013..015, 020..022
COMPLETE unwanted FR: 015, 022, 024..027, 029, 037, 038
PARTIAL unwanted FR: 016, 017
UNCHANGED AC: 004, 005, 007..009, 011, 012, 016..019, 023
UNCHANGED unwanted FR: 018..021, 023, 028, 030..035
```

Update both `Test Case` and `Status` cells later. Do not add desired-FR status cells. Apply the actual `SPEC.md` edit only after TD-026 merges.

- [x] **Step 4: Validate the matrix and B7 evidence**

Run:

```powershell
rg -n 'COMPLETE \(B7\)|FR-FE11-016|FR-FE11-017|PARTIAL|Rows That Must Remain Not Started|serial writer window|sole authority' .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md
rg -n 'B7 Integration Evidence|c7f7821|e8f467c|29392143926' .sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md
git diff --check -- .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md .sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md
```

Expected: actual cells, serial ownership, and exact integration evidence are present. Do not commit.

---

### Task 5: Fan In The Corrected H1 Packet

**Files:**
- Create: `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md`
- Modify: `docs/superpowers/plans/2026-07-18-fast-track-hybrid-delivery-mode.md`

**Interfaces:**
- Consumes: Tasks 1-4.
- Produces: H1-001..H1-006, exact activation scope, ownership, validation, and stop rules.

- [x] **Step 1: Create the H1 packet**

The packet must lock:

- H1-001 corrected governance authority.
- H1-002 corrected Audit contract.
- H1-003 FE12 reuse and no summary endpoint.
- H1-004 actual TD-027 cells.
- H1-005 `TD-024 -> TD-026 -> TD-027`; TD-023/025 forecast only.
- H1-006 activation docs PR + checks + H3 + merge.

- [x] **Step 2: Run cross-artifact checks**

Run:

```powershell
rg -n 'H1-001|H1-002|H1-003|H1-004|H1-005|H1-006|TD-024 -> TD-026 -> TD-027|H1 Approval Effect' .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
rg -n 'GET /api/admin/audit-logs|q.*action.*actorId.*from.*to|404.*NOT_FOUND' docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
rg -n 'Option C|/api/reports/users|no `/api/admin/user-summary`|no summary endpoint' docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
rg -n 'FR-FE11-016|FR-FE11-017|serial.*TD-026|existing.*Status' .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
git diff --check
```

Expected: every decision matches across artifacts and diff check is empty.

- [x] **Step 3: Run repository policy validation**

Run:

```powershell
npm.cmd run trace:enforce
git status --short
git diff --name-only
git ls-files --others --exclude-standard
```

Expected: traceability PASS. Only the reviewed governance/H1 files are changed or untracked. Do not commit.

---

### Task 6: Apply H1, Publish Activation PR, And Reach H3

**Files:**
- Modify: the four H1 artifact status lines
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `TECH_DEBT.md`

**Interfaces:**
- Consumes: explicit human approval of H1-001..H1-006.
- Produces: activation docs PR, H3 merge gate, authoritative Batch 1 state on `main`, and a detailed TD-024 plan.

- [x] **Step 1: Stop for explicit H1 approval**

Present the complete local diff, H1 decisions, activation file list, dependency order, ownership, and validation results. Do not continue until the human explicitly approves H1-001..H1-006.

- [x] **Step 2: Mark H1 artifacts approved**

Change:

```text
H1 REVIEW READY -> APPROVED BY HUMAN - 2026-07-18
```

in:

- `docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md`
- `docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md`
- `.sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md`
- `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md`

Also change the Fast-Track design status:

```text
APPROVED CONCEPT - H1 REVISION REVIEW READY -> APPROVED BY HUMAN - 2026-07-18
```

Add to the H1 packet:

```markdown
## Human Approval

Approved on 2026-07-18. H1-001..H1-006 are locked for Batch 1.
```

- [x] **Step 3: Correct FE11 slice state and append Batch 1 to `PLAN.md`**

Change the top status to:

```text
Status: APPROVED - BASELINE 2026-07-17; ACCOUNT SETUP, TRANSACTIONAL ROLE, SAFE LIST/DETAIL, AND ADMIN ROLE UI SLICES COMPLETE; FAST-TRACK BATCH 1 ACTIVE; REMAINING WORK DEFERRED
```

Append:

```markdown
## 13. Fast-Track Batch 1

### Scope And Order

1. `TD-024` / `FE11-AUD01`: canonical Admin Audit Logs read boundary.
2. `TD-026` / `FE11-ENV01`: restore `{ data, pagination }` and reuse FE12 `/api/reports/users` for counters.
3. `TD-027` / `FE11-META01`: apply the approved evidence matrix after TD-026 merges.

`TD-023` and `TD-025` remain outside Batch 1 and `OPEN`. Whole FE11 remains deferred.

### Gates

- H1 locks Batch 1 and the exact governance activation diff.
- H2 is required before each generated implementation or SPEC-evidence diff is committed and pushed.
- H3 is required after checks and before every PR merge.
- TD-027 analysis may run in parallel, but its `SPEC.md` edit is serialized after TD-026.
```

- [x] **Step 4: Add Fast-Track tasks to `TASKS.md`**

Change the top status to match `PLAN.md`. Keep:

```text
Implementation State: DEFERRED
```

Insert before `## Deferred FE11 Work`:

```markdown
## Fast-Track Batch 1 Tasks

- [x] **FE11-FT01 - Approve and activate Batch 1 governance.**
  - Scope: TD-024, TD-026, TD-027.
  - Evidence: `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md` and the merged governance activation PR.

- [ ] **FE11-AUD01 - Implement the canonical Admin Audit Log boundary.**
  - Maps to: BR-FE11-018, BR-FE11-026; FR-FE11-033; AC-FE11-018; TD-024.
  - DoD: SPEC query names, Admin-first validation, cross-feature action-aware default-deny projection, stable filtered SQL pagination, frontend migration, legacy `404 NOT_FOUND`, L1-L4 evidence.

- [ ] **FE11-ENV01 - Restore the canonical user-list envelope using FE12 statistics.**
  - Maps to: FR-FE11-001; AC-FE11-001; TD-026.
  - DoD: `/api/users` returns only `data` and `pagination`; Admin counters map from `/api/reports/users`; global counts are independent from page rows.

- [ ] **FE11-META01 - Reconcile completed FE11 evidence metadata.**
  - Maps to: TD-027.
  - Depends on: TD-026 merge and a serial Integration Lead `SPEC.md` writer window.
  - DoD: only approved existing Test Case/Status cells change; requirements and deferred rows remain unchanged; H2, checks, H3, merge, and integration evidence pass.
```

- [x] **Step 5: Update `TEST_PLAN.md` and `CHANGELOG.md`**

Set `TEST_PLAN.md` version to `0.3.3` and status to:

```text
Status: ACCOUNT SETUP, TRANSACTIONAL ROLE, SAFE LIST/DETAIL, AND ADMIN ROLE UI SLICES COMPLETE THROUGH B7; FAST-TRACK BATCH 1 TARGETS ACTIVE; REMAINING FE11 TESTS PLANNED
```

Replace the stale Admin Role UI gap with:

```markdown
- Admin role-action UI `FE11-UIR01..UIR05` is complete through B7; PR #30 and post-merge CI `29644292781` passed, and `TD-022` is resolved.
```

Add current targets:

```markdown
- Canonical Admin Audit Logs: SPEC query names, Admin-first authorization, typed validation/filtering, stable order, action-aware default-deny projection, and legacy 404 retirement.
- User list envelope: no top-level `summary`; Admin counters reuse FE12 `/api/reports/users` with numeric zero defaults.
- Evidence metadata: only approved existing Test Case/Status cells change in a serial post-TD-026 window.
```

Add to the top of `CHANGELOG.md`:

```markdown
## 2026-07-18 - Fast-Track Batch 1 Activated

- Approved H1-001..H1-006 for TD-024, TD-026, and TD-027.
- Corrected H1/H2/H3 authority and required the activation docs PR to pass checks and H3 before merge.
- Locked Audit Logs to SPEC query names and action-aware default-deny projection.
- Selected FE12 `/api/reports/users` for Admin counters and preserved the FE11 list envelope.
- Approved the exact existing-cell TD-027 matrix and serial post-TD-026 SPEC ownership.
- Product implementation remains pending per-slice H2 and H3 gates; whole FE11 remains deferred.
```

- [x] **Step 6: Activate debt rows prospectively in the PR diff**

Change only:

```text
TD-024 OPEN -> IN PROGRESS
TD-026 OPEN -> IN PROGRESS
TD-027 OPEN -> IN PROGRESS
```

Keep `TD-023` and `TD-025` `OPEN`. The new states become authoritative only after the activation PR merges.

- [x] **Step 7: Validate the exact activation diff**

Run:

```powershell
npm.cmd run trace:enforce
git diff --check
rg -n "FE11-FT01|FE11-AUD01|FE11-ENV01|FE11-META01" .sdd/specs/feat-user-role-management/TASKS.md
rg -n "TD-024.*IN PROGRESS|TD-026.*IN PROGRESS|TD-027.*IN PROGRESS|TD-023.*OPEN|TD-025.*OPEN" TECH_DEBT.md
rg -n "Admin role-action UI.*complete through B7|29644292781" .sdd/specs/feat-user-role-management/TEST_PLAN.md
git status --short
```

Expected: traceability and diff checks PASS; only approved documentation/evidence files are changed.

- [ ] **Step 8: Commit and publish the H1-reviewed activation PR**

Run:

```powershell
git add -- .sdd/constitution.md .agents/AGENTS.md .agents/CLAUDE.md docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md docs/superpowers/plans/2026-07-18-fast-track-hybrid-delivery-mode.md docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md .sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md
git commit -m "docs: activate fast-track FE11 batch 1"
git push -u origin docs/fast-track-delivery-mode
gh pr create --base main --head docs/fast-track-delivery-mode --title "docs: activate fast-track FE11 batch 1" --body "Activates the H1-reviewed Fast-Track governance package for TD-024, TD-026, and TD-027. No product code or runtime behavior changes."
```

Expected: one documentation-only PR is published. No additional permission prompt is needed because H1 reviewed the exact commit set.

- [ ] **Step 9: Generate the TD-024 detailed plan in a separate docs worktree while activation checks run**

Create or reuse a separate docs worktree/branch that does not modify the activation PR worktree. Use `writing-plans` there to create `docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md`. It may refine implementation steps but must not change H1-002, file ownership, query names, row scope, projector policy, legacy 404 behavior, or validation boundaries. Do not start product implementation, and do not add the new plan to the activation PR.

- [ ] **Step 10: Require checks and stop for H3**

Run:

```powershell
gh pr checks --watch
gh pr view --json number,state,mergeable,headRefOid,statusCheckRollup
```

Expected: required checks pass and the PR is mergeable. Present the PR/check evidence and stop for explicit H3 approval.

- [ ] **Step 11: Merge only after H3 and verify `main`**

After explicit H3 approval:

```powershell
gh pr merge --merge
git fetch origin main
gh run list --branch main --workflow CI --limit 5 --json databaseId,headSha,status,conclusion,url
```

Associate the exact post-merge `main` SHA with its CI run and wait for success. Only then report Batch 1 authoritative and permit TD-024 implementation to begin under its detailed plan and H2 boundary.

---

## Plan Completion Boundary

This plan is complete only when:

- H1-001..H1-006 are approved.
- The exact governance activation PR passes required checks, receives H3, merges, and has successful post-merge `main` CI.
- Batch 1 state is authoritative on `main`.
- The detailed TD-024 implementation plan is ready.

No backend/frontend product code belongs to this plan.
