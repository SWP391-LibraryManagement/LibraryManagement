# Clean-code review remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the review findings from `main@8ef8367` without changing APIs, schema, or Azure runtime state.

**Architecture:** Narrow the secret scanner's fixture exception from file scope to an explicitly marked line. Move FE08 handoff selection into a pure helper shared by UI and tests, then render an explicit empty selection for stale handoffs. Documentation changes only correct stale governance and traceability metadata.

**Tech Stack:** Node.js built-in test runner, React 19, GitHub Actions YAML, existing SDD Markdown.

## Global Constraints

- Preserve `SAFE-001`: no real secret, password, token, or credential in source, fixture, log, or commit.
- Preserve `BR-FE07-012`, `BR-FE07-013`, and `FR-FE08-039`; do not change API or database schema.
- Use Node built-ins only for the scanner; do not add dependencies.
- Azure SQL remains paused: do not deploy, run migrations, resume the database, or change Azure settings.
- Each behavioral fix has a failing regression test before production-code changes.

---

### Task 1: Narrow the tracked-secret scanner exception and enforce its tests in CI

**Files:**

- Modify: `scripts/check-tracked-secrets.js`
- Modify: `scripts/check-tracked-secrets.test.js`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/superpowers/plans/2026-07-29-pre-azure-release-remediation.md`

**Interfaces:**

- `scanTrackedFiles(root)` continues to return `{ path, pattern }[]`.
- A line containing `secret-scan: allow-synthetic` is excluded from matching; all other lines in that file still scan.
- CI invokes `npm run test:secrets`, which runs both scanner unit tests and the repository scan.

- [ ] **Step 1: Write failing regressions** — fixture has a marked database URL line plus an unmarked AWS key line; scanner must report only the AWS finding. Build synthetic values from string fragments so the test source is safe to scan.
- [ ] **Step 2: Verify RED** — run `node --test scripts/check-tracked-secrets.test.js`; the line-scope regression must fail because current code skips the full file.
- [ ] **Step 3: Implement minimal scanner change** — filter marked lines before evaluation, remove `SCANNER_TEST_PATH`, and rewrite static samples in test/prior plan.
- [ ] **Step 4: Wire CI** — replace `node scripts/check-tracked-secrets.js` with `npm run test:secrets` after root `npm ci` and before audit.
- [ ] **Step 5: Verify GREEN** — run `npm run test:secrets`; no secret value appears in output.

### Task 2: Make FE08 stale-handoff state explicit and behaviorally tested

**Files:**

- Create: `frontend/src/utils/reservationHandoffState.js`
- Modify: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Modify: `frontend/test/reservationFrontend.test.js`

**Interfaces:**

- `resolveReservationQueueHandoff({ pendingCopyId, currentCopyId, reservations })` returns `{ queueCopyId, notice, consumePendingHandoff }`.
- A stale `pendingCopyId` returns `queueCopyId: null`, the approved warning, and `consumePendingHandoff: true`; it never falls back to an active copy.
- With no pending handoff, the helper retains a valid current copy or selects the first active copy.

- [ ] **Step 1: Write failing behavior tests** — stale handoff with another active copy must yield `null`; ordinary load without handoff selects first active copy.
- [ ] **Step 2: Verify RED** — run `npm --prefix frontend test -- --test-name-pattern "stale handoff"`; it fails because helper export does not exist.
- [ ] **Step 3: Implement helper and consume it** — replace inline selection in `loadReservations()`; add disabled `value=""` placeholder labelled `Chọn bản sao xem hàng đợi` when there are active copies but no chosen copy.
- [ ] **Step 4: Verify GREEN** — run `npm --prefix frontend test -- --test-name-pattern "handoff"`; behavioral tests pass.

### Task 3: Correct traceability and release-state metadata

**Files:**

- Modify: `backend/src/repositories/borrowingRepository.js`
- Modify: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Modify: `backend/tests/borrowingRepository.test.js`
- Modify: `frontend/test/reservationFrontend.test.js`
- Modify: `.sdd/specs/feat-{borrowing-management,reservation-management,notification-management,reporting-statistics}/TASKS.md`
- Modify: `.sdd/specs/feat-reporting-statistics/{SPEC.md,PLAN.md}`

**Interfaces:**

- No runtime interface change.
- FE07 return code traces `BR-FE07-012, BR-FE07-013`; FE08 handoff traces `FR-FE08-039`.
- Release metadata agrees that merge/CI completed and Azure staging is quota-blocked; it does not claim H3 remains pending.

- [ ] **Step 1: Write failing traceability assertions** — extend existing FE07/FE08 tests to require exact IDs and add a Node assertion that rejects H3-pending release text in the four TASKS files.
- [ ] **Step 2: Verify RED** — run the focused backend, frontend, and traceability tests; they fail on missing IDs/stale metadata.
- [ ] **Step 3: Apply smallest changes** — extend existing comments and replace only contradictory present-tense release wording, preserving historical evidence.
- [ ] **Step 4: Verify GREEN** — re-run focused tests and `npm run trace:enforce`.

### Task 4: Full verification and handoff

**Files:** Verify only.

- [ ] **Step 1: Run gates** — `npm run test:secrets`, focused backend tests, full frontend test/lint/build, deployment tests, traceability state/enforce, and `git diff --check`.
- [ ] **Step 2: Commit and publish** — commit reviewed remediation on `fix/clean-code-remediation`, push, open PR, and wait for exact-head CI. Do not merge or deploy without subsequent user approval.
