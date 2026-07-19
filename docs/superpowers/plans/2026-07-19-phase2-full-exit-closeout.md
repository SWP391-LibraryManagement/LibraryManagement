# Phase 2 Full Exit Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the complete Phase 2 Core Development scope after the already-merged FE01-FE12 reconciliation and FE02/FE10 OTP follow-up, then transition repository phase metadata to Phase 3 Polish and Delivery.

**Architecture:** Treat PR #40/#41 as the canonical FE01-FE12 product reconciliation and acceptance evidence, and PR #42-#44 as the canonical OTP follow-up evidence. Add explicit implementation-state metadata so CI distinguishes approved specifications from completed implementation, mechanically reconcile stale feature-level pending labels without rewriting historical changelog entries, and add one Phase 2 exit record that binds the four validation layers to the final `main` commit.

**Tech Stack:** Node.js CommonJS, Node built-in test runner, Markdown SDD artifacts, GitHub Actions, Express/React/SQL Server validation evidence.

## Global Constraints

- No product behavior, API contract, database schema, dependency, authentication, authorization, or runtime configuration changes.
- Preserve the approved FE01-FE12 scope and every explicit deferred/future boundary in `TECH_DEBT.md`, `README.md`, feature out-of-scope sections, and `document/FinalRelease.md`.
- Do not rewrite historical changelog statements; add a newer exit entry when current status must be clarified.
- `SPEC.md` remains the requirements source of truth; implementation state belongs in `TASKS.md` and the Phase 2 exit review.
- Phase 2 is complete only after local gates, PR CI, merge, exact post-merge `main` CI, and stale-state audits pass.

---

### Task 1: Make implementation state explicit and testable

**Files:**
- Create: `scripts/traceability-state.js`
- Create: `scripts/traceability-state.test.js`
- Modify: `scripts/check-traceability.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: feature `TASKS.md` text.
- Produces: `parseImplementationState(text)` and `shouldEnforce(state)` for `NOT_STARTED`, `PARTIAL`, `COMPLETE`, and `DEFERRED`.

- [x] **Step 1: Add the focused test command**

Add `"test:traceability-state": "node --test scripts/traceability-state.test.js"` to root scripts.

- [x] **Step 2: Write RED state tests**

Cover parsing all four valid states, enforcing only `PARTIAL`/`COMPLETE`, and rejecting missing or invalid metadata.

- [x] **Step 3: Run RED**

Run: `npm.cmd run test:traceability-state`

Expected: FAIL because `scripts/traceability-state.js` does not exist.

- [x] **Step 4: Implement the pure helper**

Use one anchored `Implementation State:` line and export the valid-state set, parser, and enforcement decision.

- [x] **Step 5: Wire the traceability checker**

Replace the broad top-level `Status:` heuristic with explicit implementation-state parsing. Report `Implementation state`, fail enforcement on missing/invalid metadata, and preserve `--enforce` plus `--min=<n>` behavior.

- [x] **Step 6: Run GREEN**

Run:

```powershell
npm.cmd run test:traceability-state
npm.cmd run trace:enforce
```

Expected: helper tests PASS; traceability initially fails until Task 2 adds metadata to all features.

### Task 2: Reconcile all feature packages to the Phase 2 exit evidence

**Files:**
- Modify: `.sdd/specs/feat-*/TASKS.md` for all twelve feature folders.
- Modify: `.sdd/specs/feat-*/PLAN.md` where the top-level status still says human/integration/merge pending.
- Modify: `.sdd/specs/feat-*/TEST_PLAN.md` where the top-level status still says human/integration/merge pending.
- Modify: `.sdd/specs/feat-*/CHANGELOG.md` by adding a current Phase 2 exit entry only when the feature package still presents an active pending status.

**Interfaces:**
- Consumes: PR #40/#41 reconciliation evidence and PR #42-#44 OTP evidence.
- Produces: exactly one `Implementation State: COMPLETE` line per feature and current status text that points to the canonical exit review.

- [x] **Step 1: Add implementation metadata**

Insert exactly one line in every feature `TASKS.md`:

```text
Implementation State: COMPLETE
```

- [x] **Step 2: Close FE11 integration tasks from existing evidence**

Mark `FE11-LIFE06`, `FE11-ACC01`, and `FE11-FIN02` complete. Cite PR #40 merge `1555111`, final PR CI `29685838610`, post-merge `main` CI `29685953839`, Live SQL `9/9` suites and `69/69` tests, browser `4/4`, and the approved human acceptance packet.

- [x] **Step 3: Normalize current feature status headers**

Use `COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED` for active top-level PLAN/TASKS/TEST_PLAN status headers. Preserve detailed historical entries and explicit future/deferred boundaries.

- [x] **Step 4: Add current changelog closeout entries**

For affected features, add a dated entry that states Phase 2 reconciliation is accepted through PR #40/#41. FE02 and FE10 additionally cite PR #42-#44 for OTP completion. Do not alter older historical statements.

- [x] **Step 5: Verify metadata consistency**

Run a PowerShell assertion that all twelve features contain exactly one `Implementation State: COMPLETE` line and no current header contains `HUMAN ... PENDING`, `INTEGRATION PENDING`, or `READY FOR REVIEW`.

### Task 3: Transition project context to Phase 3

**Files:**
- Modify: `plan.md`
- Modify: `.agents/CLAUDE.md`
- Modify: `README.md`
- Modify: `TECH_DEBT.md` only if current phase wording conflicts with the exit decision.
- Modify: `document/FinalRelease.md` only if the release status conflicts with the exit decision.

**Interfaces:**
- Consumes: completed Phase 2 feature metadata and validation record.
- Produces: one consistent current phase: `Phase 3 - Polish and Delivery`.

- [x] **Step 1: Replace stale root plan text**

Record Phase 2 as complete and define Phase 3 checkpoints: deployment/staging evidence, durable operational configuration, documentation/demo/presentation readiness, and non-blocking performance polish.

- [x] **Step 2: Update agent memory**

Change `.agents/CLAUDE.md` current phase to Phase 3, retain the exact Phase 2 evidence, and preserve deferred boundaries such as real provider delivery, notification inbox UI, durable avatar storage, shared SQL CI, and bundle splitting.

- [x] **Step 3: Align project-facing status**

Ensure `README.md` and final-release status identify Phase 2 as accepted and Phase 3 as the current delivery phase without claiming production SLA or real SMTP/staging proof.

### Task 4: Record and validate the Phase 2 exit

**Files:**
- Create: `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`

**Interfaces:**
- Consumes: local validation output, PR #40-#44 evidence, feature metadata, and residual-boundary records.
- Produces: the canonical Phase 2 exit decision across L1-L4.

- [x] **Step 1: Run metadata and stale-state checks**

Verify all twelve features are `COMPLETE`, FE11 exit tasks are checked, `plan.md` and `.agents/CLAUDE.md` agree, and no active source says Phase 2 implementation or human integration remains pending.

- [x] **Step 2: Run automated gates**

Run:

```powershell
npm.cmd run test:traceability-state
npm.cmd run trace:enforce
npm.cmd --prefix backend test -- --runInBand
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:system
npm.cmd run test:deployment
npm.cmd run test:e2e
git diff --check
```

If local dependencies are absent, install from lockfiles before running the gate. Use isolated browser ports and do not stop unrelated processes.

- [x] **Step 3: Record all four validation layers**

The review must record L1 automated checks, L2 spec/traceability compliance, L3 Constitution/security/scope compliance, and L4 human acceptance plus PR/main evidence. Residual deferred items must be explicitly non-blocking and outside Phase 2.

- [x] **Step 4: Run final scope checks**

Confirm the diff contains only traceability tooling, SDD/status documentation, and the Phase 2 exit record; no product, schema, API, dependency, or runtime behavior changed.

### Task 5: Integrate and close the goal

**Files:**
- Modify only approved review-fix files if PR checks expose a real defect.

- [x] **Step 1: Commit and push the reviewed closeout**

Use focused commits for traceability tooling, feature metadata, and Phase 2 exit evidence.

- [x] **Step 2: Open the Phase 2 exit PR**

The PR body must list the canonical evidence, deferred boundaries, exact changed-file scope, and standing human approval.

- [x] **Step 3: Require PR CI and merge**

Merge only after required CI succeeds.

- [x] **Step 4: Require exact post-merge `main` CI**

Record the merge commit and exact successful `main` workflow run.

- [x] **Step 5: Run the final repository audit**

Confirm `origin/main`, PR state, CI result, phase metadata, feature implementation states, worktree cleanliness, and no active Phase 2 pending wording.

- [x] **Step 6: Complete the goal**

Mark the goal complete only when all prior steps pass and Phase 3 is the single current phase in repository context.
