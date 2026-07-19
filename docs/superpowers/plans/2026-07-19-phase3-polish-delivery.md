# Phase 3 Polish and Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the roadmap's Phase 3 documentation, deployment, user-testing, performance, report, presentation, and rehearsal deliverables for the accepted FE01-FE12 release.

**Architecture:** Preserve the approved application and API contracts. Add only operational configuration/documentation, deterministic measurement scripts and records, and presentation assets. Use the existing GitHub Actions staging workflow, Azure App Service/Static Web Apps endpoints, and the existing local system golden-path harness as the evidence sources.

**Tech Stack:** Node.js 22, Express, React/Vite, Playwright, GitHub Actions, Azure App Service, Azure Static Web Apps, Azure SQL, Markdown, and PowerPoint.

## Global Constraints

- Approved stack remains Node.js + Express.js, React + Bootstrap, SQL Server, and RESTful API.
- No core feature behavior changes without an approved `SPEC.md`, `PLAN.md`, `TASKS.md`, and review.
- Never commit secrets, credentials, tokens, raw OTPs, connection strings, or real PII.
- Only observed results may be marked `PASS`; unavailable human/provider evidence stays explicitly open.
- CI does not mutate the Azure SQL schema; schema execution remains a reviewed operator action.
- Deferred boundaries remain explicit: SMTP inbox delivery, notification inbox UI, durable avatars, shared SQL CI, and frontend bundle splitting unless this plan's performance task proves a safe polish.

---

### Task 1: Lock the Phase 3 evidence contract

**Files:**
- Create: `docs/superpowers/specs/2026-07-19-phase3-polish-delivery-design.md`
- Create: `docs/superpowers/plans/2026-07-19-phase3-polish-delivery.md`
- Modify: `docs/deployment/azure-staging-guide.md`
- Modify: `docs/release/week13-acceptance-record.md`
- Modify: `plan.md`

**Interfaces:**
- Consumes: `origin/main` at `64831fe`, the Hybrid roadmap, the deployment workflow, and the approved feature evidence.
- Produces: a traceable Phase 3 design/plan and an operational guide that documents `TRUST_PROXY=true` for proxied production App Service traffic.

- [x] **Step 1: Record the observed proxy failure and correction**

  Update the Azure runtime settings table/commands to include the non-secret
  `TRUST_PROXY=true` setting. Explain that it is required because the existing
  HTTPS enforcement middleware reads `x-forwarded-proto` only when this flag is
  enabled. Do not include any secret value.

- [x] **Step 2: Refresh the release checklist from evidence**

  Replace stale Week 13 shared-quality counts with the current `origin/main`
  evidence (916 backend tests, 149 frontend tests, 100% traceability) and add
  a dated Phase 3 staging evidence section. Keep authenticated staging user
  acceptance unchecked until a human observes it with synthetic accounts.

- [x] **Step 3: Mark the Phase 3 plan active**

  Update `plan.md` so its active checkpoints link to the Phase 3 design,
  performance report, acceptance record, and presentation artifacts created by
  later tasks. Keep the deferred operational boundaries intact.

- [x] **Step 4: Run a placeholder and secret scan**

  Run:

  ```powershell
  rg -n "<YouTube link>|<Azure Static Web Apps URL>|<Azure App Service URL>|TBD|TODO|API_KEY|PASSWORD=|JWT_SECRET=" docs document plan.md
  ```

  Expected: only intentionally documented unavailable external artifacts may
  remain, and no secret-like values are present.

- [x] **Step 5: Commit the evidence contract**

  ```powershell
  git add docs/superpowers/specs/2026-07-19-phase3-polish-delivery-design.md docs/superpowers/plans/2026-07-19-phase3-polish-delivery.md docs/deployment/azure-staging-guide.md docs/release/week13-acceptance-record.md plan.md
  git commit -m "docs: define phase 3 delivery evidence"
  ```

### Task 2: Measure and polish frontend performance

**Files:**
- Create: `scripts/phase3-performance.js`
- Create: `docs/release/phase3-performance-report.md`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/test/phase3Performance.test.js`

**Interfaces:**
- Consumes: the existing Vite build output and deterministic E2E backend at
  `http://127.0.0.1:3100`.
- Produces: a reproducible report with bundle sizes and p95 timings; route
  loading remains compatible with the current React Router setup.

- [x] **Step 1: Add failing contract tests for route-level lazy loading**

  Add tests that import the app source as text and assert that the largest
  role-specific pages are loaded through `lazy(() => import(...))` and that a
  `Suspense` fallback exists. Keep the test focused on the performance boundary;
  it must not assert business behavior or change API calls.

- [x] **Step 2: Run the focused test and verify the RED state**

  ```powershell
  npm.cmd --prefix frontend test -- --test-name-pattern "Phase 3 performance"
  ```

  Expected: the new lazy-loading assertion fails against the current eager
  import graph.

- [x] **Step 3: Implement safe route-level code splitting**

  Convert the large page imports in `frontend/src/App.jsx` to named
  `lazy(() => import(...))` declarations, wrap the route tree in `Suspense` with
  the existing neutral loading presentation, and leave route paths, guards,
  props, API clients, and role checks unchanged.

- [x] **Step 4: Run focused and full frontend checks**

  ```powershell
  npm.cmd --prefix frontend test
  npm.cmd --prefix frontend run lint
  npm.cmd --prefix frontend run build
  ```

  Expected: all frontend tests pass, lint is clean, and the build emits
  multiple route chunks with no primary JavaScript chunk above 500 kB.

- [x] **Step 5: Add the reproducible timing harness**

  `scripts/phase3-performance.js` shall:

  1. read the generated `frontend/dist/assets` files and report raw/gzip byte
     sizes;
  2. start `tests/e2e/support/systemTestServer.js` on an isolated port;
  3. create one synthetic verified actor through `POST /__e2e__/setup`;
  4. login and call `GET /api/auth/me` 30 times with the returned access token;
  5. report median and p95 wall-clock milliseconds; and
  6. terminate the child process in a `finally` path without printing tokens.

  The script must exit non-zero if setup, login, or the measured request fails.

- [x] **Step 6: Run the harness and publish the report**

  ```powershell
  npm.cmd run phase3:performance
  ```

  Record the exact date, commit SHA, Node version, bundle sizes, p50/p95
  timings, and the comparison to the approved FE02 session target. If the
  environment cannot prove a target, record it as unverified rather than
  changing the target.

- [x] **Step 7: Commit the performance slice**

  ```powershell
  git add scripts/phase3-performance.js frontend/src/App.jsx frontend/test/phase3Performance.test.js frontend/package.json docs/release/phase3-performance-report.md
  git commit -m "perf: measure and split phase 3 frontend routes"
  ```

### Task 3: Capture user testing and acceptance evidence

**Files:**
- Create: `docs/release/phase3-user-testing-record.md`
- Modify: `docs/testing/system-integration-demo-runbook.md`
- Modify: `docs/release/week13-acceptance-record.md`

**Interfaces:**
- Consumes: local browser golden-path output, current staging smoke output,
  the approved feature checklist, and existing synthetic-data cleanup rules.
- Produces: an evidence matrix that separates automated observations from
  human-only authenticated staging acceptance.

- [x] **Step 1: Run local browser golden path**

  ```powershell
  npm.cmd run test:e2e
  ```

  Verify the login -> borrow -> approve -> return -> fine -> report flow,
  desktop/mobile overflow assertion, and screenshot output. Do not copy
  credentials or bearer tokens into the record.

- [x] **Step 2: Run independent current-staging smoke**

  ```powershell
  $env:STAGING_FRONTEND_URL='https://lemon-wave-04db51100.7.azurestaticapps.net'
  $env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
  npm.cmd run smoke:staging
  ```

  Record only the endpoint origins and the five named checks from the command
  output. Add the workflow run URL and exact SHA.

- [x] **Step 3: Record the user-testing matrix**

  Include scenarios for public browse, authentication boundary, member borrow,
  staff approval/return, reservation queue, fine calculation/payment, safe
  notification metadata, reporting, responsive layout, and cleanup. Each row
  must have source, observed result, evidence path, and owner. Mark the
  authenticated staging rows `OPEN - HUMAN OBSERVATION REQUIRED` unless they
  have been directly observed.

- [x] **Step 4: Record rehearsal and fallback behavior**

  Update the runbook with a five-minute path, a screenshot/API fallback, and a
  reset procedure. Ensure no raw OTP, token, SMTP body, or credential appears.

- [x] **Step 5: Commit the acceptance slice**

  ```powershell
  git add docs/release/phase3-user-testing-record.md docs/release/week13-acceptance-record.md docs/testing/system-integration-demo-runbook.md
  git commit -m "docs: record phase 3 user testing evidence"
  ```

### Task 4: Complete release report and presentation deliverables

**Files:**
- Create: `docs/release/phase3-final-report.md`
- Create: `docs/release/phase3-rehearsal-record.md`
- Create: `presentation/phase3-final-defense.pptx`
- Modify: `document/FinalRelease.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: all prior Phase 2 evidence, Phase 3 staging/performance/user-test
  records, architecture/RDS/SDS docs, and the existing demo runbook.
- Produces: a source-linked final report and a rendered presentation deck with
  no fabricated links or claims.

- [x] **Step 1: Write the final report**

  Cover scope, architecture, feature traceability, test totals, staging
  deployment, performance result, user-testing result, known limitations,
  ethical/security safeguards, and exact reproducibility commands. Separate
  observed outcomes from open human/provider checks.

- [x] **Step 2: Replace release placeholders with honest status**

  In `document/FinalRelease.md`, add the observed staging frontend/backend
  origins and workflow evidence. Replace unavailable video/tag links with an
  explicit `Not published in this repository` status and link to the local
  rehearsal record instead of inventing a URL.

- [x] **Step 3: Create and render the presentation**

  Use the `presentations:Presentations` skill. The deck must contain: problem
  and users, architecture, feature map, core golden path, quality gates,
  staging topology, performance result, limitations, and a five-minute demo
  sequence. Use only synthetic/example data.

- [x] **Step 4: Run a timed rehearsal**

  Follow the runbook once at normal pace and once at five-minute pace. Record
  elapsed time, checkpoint results, fallback used, and any follow-up. Render
  the deck to images/PDF and inspect the output before marking the artifact
  verified.

- [x] **Step 5: Commit delivery artifacts**

  ```powershell
  git add docs/release/phase3-final-report.md docs/release/phase3-rehearsal-record.md presentation/phase3-final-defense.pptx document/FinalRelease.md README.md
  git commit -m "docs: complete phase 3 delivery package"
  ```

### Task 5: Run the four-layer final validation and integration

**Files:**
- Modify: `.github/workflows/deploy-staging.yml` only if a proven Phase 3 fix is required
- Create: `.sdd/reviews/phase3-final-validation-2026-07-19.md`

**Interfaces:**
- Consumes: all tracked Phase 3 artifacts, current branch commits, staging
  workflow evidence, and the validation checklist.
- Produces: a review record that proves or explicitly identifies each required
  Phase 3 item before integration.

- [x] **Step 1: Run the complete local validation set**

  ```powershell
  npm.cmd ci
  npm.cmd --prefix backend ci
  npm.cmd --prefix frontend ci
  npm.cmd run trace:enforce
  npm.cmd run test:deployment
  npm.cmd --prefix backend run test:coverage:ci
  npm.cmd --prefix backend run test:integration:system
  npm.cmd --prefix frontend test
  npm.cmd --prefix frontend run lint
  npm.cmd --prefix frontend run build
  npm.cmd run test:e2e
  npm.cmd run phase3:performance
  ```

- [ ] **Step 2: Dispatch staging from the final branch/main SHA**

  ```powershell
  gh workflow run deploy-staging.yml --repo SWP391-LibraryManagement/LibraryManagement --ref main
  gh run watch <observed-run-id> --repo SWP391-LibraryManagement/LibraryManagement --exit-status
  ```

  Replace `<observed-run-id>` in the executed command with the actual ID and
  record the resulting URL; no placeholder may remain in the evidence file.

- [x] **Step 3: Audit all four validation layers**

  Write `.sdd/reviews/phase3-final-validation-2026-07-19.md` with approach,
  exact files, commands/results, traceability mapping, safety review,
  acceptance evidence, open human/provider checks, and residual risks.

- [ ] **Step 4: Push a reviewable branch and wait for required CI**

  ```powershell
  git push -u origin docs/phase3-polish-delivery
  gh pr create --repo SWP391-LibraryManagement/LibraryManagement --base main --head docs/phase3-polish-delivery --title "docs: complete Phase 3 polish and delivery" --body-file docs/release/phase3-final-report.md
  gh pr checks <observed-pr-number> --repo SWP391-LibraryManagement/LibraryManagement --watch
  ```

- [ ] **Step 5: Integrate only after validation evidence is complete**

  Merge through the repository's normal review gate, verify post-merge main
  CI, and update the final validation record with the merge commit. Do not
  close the goal while any required Phase 3 deliverable is missing or while
  the evidence is merely inferred.

## Self-review checklist

- All roadmap Phase 3 outputs map to Tasks 1-5.
- No unobserved staging, SMTP, SQL, video, or human acceptance claim is marked
  `PASS`.
- The plan contains no `TBD`, `TODO`, or vague implementation step.
- Route splitting preserves every existing route guard and API contract.
- Every performance and acceptance number in the final report has a command,
  output, or rendered artifact behind it.
