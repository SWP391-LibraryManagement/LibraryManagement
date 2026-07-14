# Week 11-12 Quality Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Do not use subagents for this repository task.

**Goal:** Add measurable Week 11 coverage and browser evidence, then complete the Week 12 security audit without changing production business behavior.

**Architecture:** Jest measures the completed backend module set and enforces an 80 percent floor. Playwright runs the real React frontend against a localhost-only Express host built from the existing system integration harness, with FE09 exercised through Playwright API context. Security evidence combines dependency audit output with repository-level RBAC, validation, safe-error, and secret checks.

**Tech Stack:** Node.js, Jest, Playwright Chromium, React/Vite, Express, existing in-memory integration repositories, npm audit.

## Global Constraints

- Work on branch `test/week11-quality-sprint`; never use a `codex` branch name.
- Do not change production business rules, SQL schema, or approved feature specs.
- Do not commit credentials, `.env` content, generated coverage, Playwright reports, traces, or screenshots.
- Do not use `npm audit fix --force`.
- Keep SQL mutation tests local-only.
- Every new test must map to an existing BR/FR/AC or a documented quality gate.

---

### Task 1: Establish Coverage Baseline And Gap Matrix

**Files:**
- Create: `.sdd/reviews/week11-coverage-evidence-2026-07-14.md`
- Inspect: `backend/package.json`
- Inspect: `backend/coverage/coverage-summary.json`

**Interfaces:**
- Consumes: existing Jest `collectCoverageFrom` configuration.
- Produces: exact baseline percentages and a ranked list of uncovered files/branches.

- [ ] Run `npm.cmd --prefix backend run test:coverage -- --coverageReporters=json-summary --coverageReporters=text`.
- [ ] Record suite/test counts and all four global coverage metrics.
- [ ] Rank files below 80 percent, prioritizing services and validators over route wiring.
- [ ] Map each selected gap to the current feature SPEC/TEST_PLAN requirement.
- [ ] Commit with `docs: record week 11 coverage baseline`.

### Task 2: Close Meaningful Coverage Gaps

**Files:**
- Modify: focused files under `backend/tests/`
- Modify only if required: test helpers under `backend/tests/helpers/`
- Update: `.sdd/reviews/week11-coverage-evidence-2026-07-14.md`

**Interfaces:**
- Consumes: Task 1 gap matrix.
- Produces: tests for uncovered business, validation, authorization, and safe-error branches.

- [ ] Add one failing test per selected uncovered behavior.
- [ ] Run each focused test and confirm the expected red result.
- [ ] Add only test/helper changes needed to exercise existing production behavior.
- [ ] Re-run focused tests until green.
- [ ] Re-run coverage and repeat until all configured metrics reach at least 80 percent or a documented exception is approved.
- [ ] Commit in small feature-focused test commits.

### Task 3: Enforce Coverage In CI

**Files:**
- Modify: `backend/package.json`
- Modify: `.github/workflows/ci.yml`
- Update: `.sdd/test-plan.md`
- Update: `.sdd/reviews/week11-coverage-evidence-2026-07-14.md`

**Interfaces:**
- Consumes: green >=80 percent baseline from Task 2.
- Produces: `test:coverage:ci` and a CI blocking step.

- [ ] Add Jest `coverageThreshold.global` values of 80 for branches, functions, lines, and statements.
- [ ] Add `test:coverage:ci` using `--coverage --coverageReporters=text-summary`.
- [ ] Add a CI step after backend tests.
- [ ] Mark the Week 11 milestone complete only after the command exits 0.
- [ ] Commit with `test: enforce backend coverage threshold`.

### Task 4: Add Hybrid Playwright Golden Path

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.js`
- Create: `tests/e2e/support/systemTestServer.js`
- Create: `tests/e2e/system-golden-path.spec.js`
- Modify: `.gitignore`
- Modify: `.github/workflows/ci.yml`
- Update: `.sdd/test-plan.md`

**Interfaces:**
- Test server listens on `127.0.0.1:3100` and mounts the production-aligned app.
- Vite listens on `127.0.0.1:4173` with `VITE_API_BASE_URL=http://127.0.0.1:3100/api`.
- Playwright consumes runtime-generated actor credentials and safe IDs from `/__e2e__` controls.

- [ ] Add `@playwright/test` as a root dev dependency and install Chromium.
- [ ] Write the Playwright test first and confirm it fails because the test server/config is absent.
- [ ] Add the test-only server with runtime actor seeding, overdue fixture control, and FE09 state synchronization.
- [ ] Implement the browser/API journey: member login -> borrow -> librarian login -> approve -> overdue return -> FE09 calculate/paid -> FE12 report.
- [ ] Capture trace and screenshot on failure; verify desktop and mobile report rendering without overlap.
- [ ] Add `test:e2e` and a CI Chromium install/run step.
- [ ] Commit with `test: add system browser golden path`.

### Task 5: Complete Week 12 Security Audit

**Files:**
- Create: `.sdd/reviews/week12-security-audit-2026-07-14.md`
- Modify lock/package files only for verified Critical/High dependency fixes.
- Add focused security regression tests only when a concrete defect is found.

**Interfaces:**
- Consumes: npm lockfiles, protected route definitions, validators, safe error middleware, tracked source.
- Produces: dependency counts, RBAC/validation inventory, secret scan result, findings and accepted risk table.

- [ ] Run production audits for root, backend, and frontend using JSON output.
- [ ] Trace every Critical/High finding to its direct dependency and runtime reachability.
- [ ] Apply the smallest non-breaking dependency fix where required and re-run tests.
- [ ] Scan tracked files for common credential/private-key patterns without printing `.env` values.
- [ ] Verify protected routes use authentication/role middleware and input validators.
- [ ] Verify 5xx responses and notification payloads do not expose stacks/secrets.
- [ ] Record Medium/Low accepted risks with owner and follow-up; commit with `docs: record week 12 security audit`.

### Task 6: Final Quality Gate And Review Handoff

**Files:**
- Update evidence documents with only observed results.

**Interfaces:**
- Consumes: all commands and evidence from Tasks 1-5.
- Produces: a clean reviewable branch.

- [ ] Run `npm.cmd --prefix backend test`.
- [ ] Run `npm.cmd --prefix backend run test:coverage:ci`.
- [ ] Run the mutation-gated SQL system test against the explicit local environment.
- [ ] Run `npm.cmd --prefix frontend test`, lint, and build.
- [ ] Run `npm.cmd run test:e2e`.
- [ ] Run `npm.cmd run trace:enforce` and `git diff --check`.
- [ ] Confirm generated artifacts and local secrets are untracked/ignored.
- [ ] Commit final evidence updates and present merge/push/keep/discard options.
