# Governance And Release Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile the approved SDD source of truth and current release evidence with the already-merged implementation at `main`, without changing business, API, or security behavior or creating a release tag.

**Architecture:** This is a Hybrid SDD + ADD closeout. Core work is limited to synchronizing FE02's OTP delivery contract with the implemented FE10 requester boundary. Shell work updates release metadata, test-plan status, localization evidence, stale context, and the remaining presentation-only Vietnamese labels. No backend, database, API, permission, or deployment behavior changes are authorized.

**Tech Stack:** Markdown/SDD artifacts, Git metadata, Node.js validation scripts, Jest, Node test runner, Vite, Playwright, GitHub Actions evidence.

## Global Constraints

- Preserve the approved Node.js + Express.js, React + Bootstrap, SQL Server, REST stack.
- Do not change business behavior, schema, API payloads, permissions, or deployment configuration. Frontend source changes are limited to presentation-only labels already required by the approved localization design plus the requestor-approved H3 responsive HomePage shell follow-up documented in that design.
- Keep `SPEC.md` as the source of truth and record observable behavior changes in the feature changelog.
- Human H2 approval is recorded for published commits `962ceb1` and `daaeea6`;
  H3 remains required before merge.
- Do not claim H3 approval, merge, create `v1.0.3`, or publish a video from this batch.
- Validate all four layers: automated checks, spec compliance, constitution/safety, and acceptance evidence.

---

### Task 1: Reconcile FE02 OTP Source of Truth

**Files:**
- Modify: `.sdd/specs/feat-auth/SPEC.md`
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`
- Modify: `.sdd/specs/feat-auth/PLAN.md`
- Modify: `.sdd/specs/feat-auth/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-notification-management/SPEC.md`
- Modify: `.sdd/specs/feat-notification-management/PLAN.md`
- Review: `.sdd/specs/feat-auth/TASKS.md`, `.sdd/specs/feat-notification-management/SPEC.md`, `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`

**Interfaces:**
- Consumes: the implemented `createSourceNotificationRequester('FE02')` boundary and existing FE02/FE10 contracts.
- Produces: a single FE02 contract stating that FE02 creates/validates OTPs and FE10 renders/delivers verification and reset notifications through the FE02-bound requester.

- [x] **Step 1: Locate all contradictory FE02 direct-delivery statements**

Run:

```powershell
rg -n 'directly through `emailService`|direct email|requester-bound|token-ID idempotency|FE10 requester' .sdd/specs/feat-auth/SPEC.md .sdd/specs/feat-auth/TASKS.md .sdd/specs/feat-notification-management/SPEC.md .sdd/rfcs/ADR-004-auth-otp-notification-boundary.md
```

Expected: every FE02 verification/reset delivery statement is identified before editing.

- [x] **Step 2: Update FE02 rules and requirements to match the approved FE10 boundary**

Change only verification/reset delivery statements. Preserve the separate direct `CHANGE_PASSWORD_OTP` email path, legacy token compatibility, generic forgot-password behavior, and non-blocking delivery failure. Update the version/status metadata and add a dated changelog entry explaining that this synchronizes the spec with the already-merged implementation.

- [x] **Step 3: Verify the FE02/FE10 contract is internally consistent**

Run the command from Step 1 again and inspect the remaining matches. Expected: no FE02 statement claims direct verification/reset delivery; FE02 references `createSourceNotificationRequester('FE02')` or the equivalent requester-bound contract.

---

### Task 2: Refresh Canonical Test And Feature Metadata

**Files:**
- Modify: `.sdd/test-plan.md`
- Modify: `.sdd/specs/feat-fine-management/SPEC.md`
- Modify: `.sdd/specs/feat-reservation-management/TASKS.md`
- Modify: `.sdd/specs/feat-auth/SPEC.md`
- Modify: `.sdd/specs/feat-user-role-management/SPEC.md`
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-public-browse/PLAN.md`
- Modify: `.sdd/specs/feat-public-browse/TASKS.md`
- Modify: `.sdd/specs/feat-membership-management/PLAN.md`
- Modify: `.sdd/specs/feat-membership-management/TASKS.md`
- Modify: `.sdd/specs/feat-book-management/PLAN.md`
- Modify: `.sdd/specs/feat-book-management/TASKS.md`
- Modify: `.sdd/specs/feat-inventory-book-copy/SPEC.md`
- Modify: `.sdd/specs/feat-inventory-book-copy/PLAN.md`
- Modify: `.sdd/specs/feat-inventory-book-copy/TASKS.md`
- Modify: `.sdd/specs/feat-inventory-book-copy/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Modify: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Modify: `.sdd/specs/feat-reservation-management/PLAN.md`
- Modify: `.sdd/specs/feat-fine-management/PLAN.md`
- Modify: `.sdd/specs/feat-fine-management/TASKS.md`
- Modify: `.sdd/specs/feat-reporting-statistics/PLAN.md`
- Modify: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Review: all remaining `.sdd/specs/feat-*/PLAN.md`, `TASKS.md`, and `TEST_PLAN.md`

**Interfaces:**
- Consumes: fresh local reconciliation counts from the validation gate and the Phase 2/3 exit evidence.
- Produces: current test-plan readiness data and explicit notes that old unchecked historical gates are superseded by the dated Phase 2 exit packet rather than silently deleted.

- [x] **Step 1: Record current automated inventory**

Update `.sdd/test-plan.md` metadata to `Last Updated: 2026-07-20` and record the fresh local reconciliation baseline: 917 backend tests, 172 frontend tests, 53 backend suites, 92%+ configured coverage, 10 system integration tests, and 4 browser E2E suites. Keep the remote CI run's historical 171-test result distinct from this later local baseline.

- [x] **Step 2: Reconcile the readiness table**

Update the readiness table so FE01-FE12 are marked complete for the approved Phase 1 scope, while retaining explicit deferred boundaries and linking `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md` as the superseding evidence.

- [x] **Step 3: Normalize the remaining stale feature headers/counters**

Change FE09's stale `READY FOR REVIEW` header to the approved baseline status, update FE08's historical trace counter to `29/29`, and add a short supersession note to FE02/FE11 schema checklist areas pointing to the merged migration evidence. Do not delete historical checklist rows.

---

### Task 3: Reconcile Release And Governance Documents

**Files:**
- Modify: `README.md`
- Modify: `plan.md`
- Modify: `document/FinalRelease.md`
- Modify: `docs/release/final-submission-checklist-2026-07-20.md`
- Modify: `docs/release/phase3-final-report.md`
- Modify: `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`
- Modify: `.agents/CLAUDE.md`

**Interfaces:**
- Consumes: tag `v1.0.2` at `c988af1`, validated application baseline `cce59d0`, PR #54/#57/#58, CI run `29712597463`, and staging run `29712612188`.
- Produces: documentation that distinguishes the published `v1.0.2` artifact from the untagged validated application baseline and records the remaining human decisions.

- [x] **Step 1: State the current release split**

Document that `v1.0.2` is published at `c988af1`, while `cce59d0` is the validated application baseline 20 commits ahead. A future `v1.0.3` must point to the later reviewed `main` SHA after this reconciliation merges; do not create the tag.

- [x] **Step 2: Close stale H2-ready wording without inventing approval**

Add post-integration addenda to the final governance validation and submission checklist recording PR #54 merge, CI success, and the published tag. Preserve an explicit note that this reconciliation requires its own H2/H3 and exact post-merge CI before any later release tag decision.

- [x] **Step 3: Synchronize project memory**

Update `.agents/CLAUDE.md`, `README.md`, `plan.md`, and `document/FinalRelease.md` so current SMTP observation, Vietnamese localization, current-main status, and deferred boundaries agree.

---

### Task 4: Close Vietnamese Localization Evidence

**Files:**
- Modify: `docs/superpowers/specs/2026-07-20-vietnamese-ui-localization-design.md`
- Modify: `docs/superpowers/plans/2026-07-20-vietnamese-ui-localization.md`
- Create: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`

**Interfaces:**
- Consumes: merged PR #58, current frontend tests/lint/build, current CI and staging evidence.
- Produces: a dated L1-L4 packet that reports what is verified, what is merged, and what still requires human review or external evidence.

- [x] **Step 1: Mark the design as implemented with evidence**

Change the design status to identify PR #58 as merged and link the validation packet. Do not claim a runtime language switcher or translate user-owned content.

- [x] **Step 2: Add a closeout summary to the implementation plan**

Keep the granular historical steps intact, add an authoritative completion summary, and mark only the final verification checklist items supported by fresh evidence.

- [x] **Step 3: Write the L1-L4 validation packet**

Record traceability, 917 backend tests, the fresh 172-test local frontend baseline, lint/build, 4/4 E2E, current staging smoke, preserved raw status/API values, and residual gaps: no dedicated GitHub review record for PR #58, no external demo video, no shared SQL CI, and no production SLA. Identify remote CI run `29712597463` as the earlier 171-test baseline.

---

### Task 4A: Repair Residual Vietnamese Presentation Labels

**Files:**
- Modify: `frontend/test/vietnameseUi.test.js`
- Modify: `frontend/src/page/UserManagement.jsx`
- Modify: `frontend/src/component/inventory/BookCopies.jsx`
- Modify: `frontend/src/component/inventory/Filter.jsx`
- Modify: `frontend/src/page/borrowing/BorrowRequestsAdminPage.jsx`
- Modify: `frontend/src/page/borrowing/BorrowRequestPage.jsx`

**Interfaces:**
- Consumes: raw API/status values and `getStatusLabel(value)` from `frontend/src/utils/uiLabels.js`.
- Produces: Vietnamese option/badge/fallback text while preserving raw option values, status comparisons, API payloads, and CSS status classes.

- [x] **Step 1: Add a failing localization regression**

Extend `frontend/test/vietnameseUi.test.js` so it rejects raw `ACTIVE`/`INACTIVE` option text, raw status rendering, `Copy #`, and `No library data found.`, and requires `getStatusLabel` at the inventory/admin/borrowing presentation boundaries.

- [x] **Step 2: Run the focused test and verify RED**

```powershell
node --test frontend/test/vietnameseUi.test.js
```

Expected: FAIL on the residual English/raw-status strings.

- [x] **Step 3: Implement the minimal presentation fix**

Use `getStatusLabel` only for displayed option/badge text. Keep raw status values in `value`, comparisons, API requests, and CSS class names. Replace `Copy #` with `Bản sao #` and the empty state with `Không tìm thấy dữ liệu thư viện.`.

- [x] **Step 4: Run the focused test and verify GREEN**

```powershell
node --test frontend/test/vietnameseUi.test.js
```

Observed: 13/13 focused localization tests pass, followed by 172/172 full frontend tests before the separate responsive follow-up; Task 4B raises the current total to 173/173.

---

### Task 4B: Close The H3 Responsive Shell Gap

**Files:**
- Modify: `frontend/src/page/HomePage.jsx`
- Modify: `frontend/test/appShellFrontend.test.js`
- Modify: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`
- Modify: `.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md`

**Interfaces:**

- Consumes: the existing HomePage routes, account actions, and responsive
  acceptance requirement from the localization design.
- Produces: an accessible mobile menu and narrow-screen layout rules while
  preserving every existing navigation/account action and raw value.

- [x] **Step 1: Add RED source and browser contracts.**
- [x] **Step 2: Implement the minimal responsive shell and preserve membership access.**
- [x] **Step 3: Verify 173/173 frontend tests, lint, build, 4/4 permanent E2E,
  and focused 1440px/390px browser screenshots.**
- [ ] **Step 4: Complete human visual acceptance, H3, merge, and
  exact post-merge CI.**

---

### Task 5: Validate The Reconciliation

**Files:**
- Test: repository validation commands and current diff.
- Create: `.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md`
- Create: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`
- Modify: `docs/superpowers/plans/2026-07-20-governance-release-reconciliation.md`

- [x] **Step 1: Run documentation consistency checks**

```powershell
npm.cmd run trace:enforce
git diff --check
rg -n 'directly through `emailService`|PENDING H3|H2-READY|remains uncommitted|Not started|Status: Approved for implementation planning' .sdd/specs .sdd/test-plan.md docs/release README.md plan.md .agents/CLAUDE.md docs/superpowers/specs docs/superpowers/plans
```

Expected: the only remaining matches are explicitly historical/deferred notes with a nearby supersession explanation.

- [x] **Step 2: Run the automated product gates**

```powershell
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
```

Expected: all commands exit 0; no product source behavior changes are introduced.

- [x] **Step 3: Inspect the complete uncommitted diff**

```powershell
git status --short
git diff --stat
git diff --check
Get-Content -Raw .sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md
Get-Content -Raw .sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md
Get-Content -Raw docs/superpowers/plans/2026-07-20-governance-release-reconciliation.md
```

Expected: `git diff --stat` and `git diff --check` validate the tracked diff, while `git status --short` plus explicit reads validate the untracked evidence/plan files. Only the listed SDD/release/evidence files and bounded localization presentation files changed; no secrets, schema, API, authorization, or business behavior changes appear.
