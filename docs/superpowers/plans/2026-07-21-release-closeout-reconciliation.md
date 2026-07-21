# Release Closeout Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the working copy to the current `origin/main`, close the verified release/security/documentation gaps, and produce evidence for a final human release decision without silently expanding FE01-FE12 scope.

**Architecture:** Fast-forward the clean tracked branch to the current remote baseline, then make small shell-layer changes for security gates, release metadata, stale task evidence, and artifact hygiene. Product behavior is not changed unless a dependency update requires a regression fix; any new feature remains Phase 4 work.

**Tech Stack:** Git, Node.js 22/npm, Express/Jest, React/Vite, Playwright, GitHub Actions, Markdown SDD artifacts.

## Global Constraints

- Keep Node.js + Express.js, React + Bootstrap/Material UI, SQL Server, and REST APIs.
- Preserve approved FE01-FE12 contracts and do not implement deferred FE10 inbox, durable avatar storage, or production SLA scope.
- Never commit secrets, Azure dumps, credentials, tokens, or real personal data.
- Do not create a release tag or publish external media without explicit human release approval.
- Every changed behavior must map to the relevant `SPEC.md`, tests, and changelog.

Execution follow-up (2026-07-21): after the read-only closeout audit, the
existing dirty working tree was moved from `main` to the local
`chore/release-closeout-reconciliation` branch without committing or pushing.
This preserves the reviewed baseline while the final evidence diff is prepared.

---

### Task 1: Fast-forward to the current remote baseline

**Files:**
- Modify: Git tracked files through `git pull --ff-only origin main`
- Review: untracked `backend/.zip` and `output/`

- [x] **Step 1: Preserve and inventory untracked artifacts.**

Run:

```powershell
git status --short --untracked-files=all
git ls-tree -r --name-only origin/main backend/.zip output
```

Expected: no tracked collision; retain untracked files for later review.

- [x] **Step 2: Fast-forward the branch.**

Run:

```powershell
git pull --ff-only origin main
```

Expected: `HEAD` becomes `a8729f92d0de98f157ebe8d66ac2000d2ee4f59a` with no tracked merge conflict.

- [x] **Step 3: Confirm the new baseline.**

Run:

```powershell
git status --short --branch
git log --oneline -10
```

Expected: `main` is aligned with `origin/main`; only previously untracked artifacts remain.

---

### Task 2: Add a dependency security gate and resolve current advisories

**Files:**
- Modify: `package.json`
- Modify: `backend/package.json`
- Modify: `frontend/package.json`
- Modify: corresponding lockfiles only when dependency versions are deliberately updated
- Modify: `.github/workflows/ci.yml`
- Modify: `TECH_DEBT.md` if an advisory is accepted rather than fixed

- [x] **Step 1: Capture exact audit findings on the synchronized baseline.**

Run:

```powershell
npm.cmd audit --audit-level=high
npm.cmd --prefix backend audit --audit-level=high
npm.cmd --prefix frontend audit --audit-level=high
```

Expected: identify the exact fixed versions for `axios`, `body-parser`, and `brace-expansion` (or any replacement advisories introduced by the current lockfiles).

- [x] **Step 2: Update only vulnerable dependencies or safe overrides.**

Use the package manager's audit fix proposal as input, review the lockfile diff, and keep the approved dependency policy. Do not run an unreviewed broad upgrade.

- [x] **Step 3: Make high-severity audits fail CI.**

Add these three commands after each install in `.github/workflows/ci.yml`:

```yaml
      - name: Root dependency audit
        run: npm audit --audit-level=high

      - name: Backend dependency audit
        run: npm audit --audit-level=high
        working-directory: backend

      - name: Frontend dependency audit
        run: npm audit --audit-level=high
        working-directory: frontend
```

- [x] **Step 4: Run focused and full regression checks.**

Run:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Expected: all suites pass and the three production audits exit `0`.

---

### Task 3: Reconcile release and feature evidence with merged work

**Files:**
- Modify: `README.md`
- Modify: `plan.md`
- Modify: `.agents/CLAUDE.md`
- Modify: `document/FinalRelease.md`
- Modify: `docs/release/final-submission-checklist-2026-07-20.md`
- Modify: `docs/release/phase3-final-report.md`
- Modify: `.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md`
- Modify: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`
- Modify: stale completion gates under `.sdd/specs/feat-*/PLAN.md` and `TASKS.md`

- [x] **Step 1: Record the actual current baseline.**

Replace stale “H3 pending” statements only after confirming the merge evidence for PR #59. Record the current remote SHA `a8729f9`, CI run `29824756487`, deployment run `29824944954`, and the twelve post-PR #59 commits as a new reviewed reconciliation batch.

- [x] **Step 2: Reconcile historical unchecked boxes.**

Keep historical evidence, but add a dated supersession note or mark the current gate complete where evidence exists. Do not leave contradictory current-state claims such as `Implementation State: COMPLETE` beside an unexplained open completion gate.

- [x] **Step 3: Update release decision wording.**

State whether `v1.0.2` remains the submission release or whether a human-approved `v1.0.3` is eligible after the new batch passes security, visual, and integration review. Do not create the tag in this task.

- [x] **Step 4: Validate documentation consistency.**

Run:

```powershell
npm.cmd run trace:enforce
rg -n -i "H3 pending|H3 remains pending|PR #59 awaits|Implementation State: COMPLETE|PENDING" README.md plan.md .agents .sdd/reviews docs/release .sdd/specs
```

Expected: remaining `PENDING` text is explicitly scoped to genuine human acceptance or documented out-of-scope limitations.

---

### Task 4: Close visual acceptance and submission evidence

**Files:**
- Review: `docs/release/final-submission-checklist-2026-07-20.md`
- Review: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`
- Add only approved screenshots or an approved external demo link

- [x] **Step 1: Run the latest staging smoke and browser flows.**

Run the documented staging smoke against the current staging URLs and the full Playwright suite. Expected: frontend, health, SQL catalog, CORS allow/deny, protected route, and 4/4 browser flows pass. The current staging workflow `29824944954` and local Playwright run satisfy this automated gate.

- [x] **Step 2: Perform human desktop/mobile visual acceptance.**

Inspect Home/catalog/detail, authentication, member borrowing/reservation, librarian operations, reports, and Admin at desktop and 390px mobile widths. Resolve or explicitly record any catalog/API failure before signing acceptance.

- [x] **Step 3: Record the acceptance result.**

Update the localization validation packet and final checklist with reviewer/date/evidence. If the teacher requires a video, add the real URL; never invent one.

---

### Task 5: Clean release artifacts and whitespace

**Files:**
- Modify: `.gitignore` with selective patterns for generated Azure dumps/packages
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md` to remove the known trailing whitespace
- Review: `backend/.zip` and `output/azure-mail-20260721-145625/`

- [x] **Step 1: Inspect untracked files for secrets/PII.**

Run a targeted search over the untracked deployment artifacts. Preserve intentional visual evidence; do not commit Azure logs, dumps, or packages containing credentials or personal data.

- [x] **Step 2: Remove or selectively ignore generated artifacts.**

Use an explicit, human-approved target list. Do not recursively delete all of `output/`, because some screenshots may be release evidence.

- [x] **Step 3: Fix whitespace and verify repository hygiene.**

Run:

```powershell
git diff --check
git status --short --untracked-files=all
```

Expected: no whitespace errors and only intentionally retained artifacts remain.

---

### Task 6: Final validation packet

**Files:**
- Modify: the applicable dated validation/release records

- [x] **Step 1: Run the complete gate.**

```powershell
npm.cmd run trace:enforce
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run test:deployment
git diff --check
```

- [x] **Step 2: Record exact counts and residual limitations.**

Document test counts, coverage, staging evidence, dependency audit status, visual acceptance, and the final release SHA. Keep SQL CI, durable avatar storage, FE10 inbox UI, and production SLA clearly labeled as accepted limitations if they remain out of scope.

- [ ] **Step 3: Stop at human release approval.**

Do not create `v1.0.3`, publish external media, or change Azure resources without the team's explicit release decision.

---

### Task 7: Apply the approved minimal mobile visual remediation

**Files:**
- Modify: `tests/e2e/fe08-reservation-candidate-catalog.spec.js`
- Modify: `tests/e2e/fe11-admin-request-management.spec.js`
- Modify: `frontend/src/styles/app-shell.css`
- Modify: `frontend/src/page/UserManagement.jsx`
- Review: `output/playwright/`

**Interfaces:**
- Consumes: the existing FE08 member reservation queue DOM and FE11 Admin topbar/table DOM.
- Produces: mobile layouts whose visible controls remain inside their containers without changing APIs, business behavior, desktop layout, or the Admin table's internal horizontal scrolling.

- [x] **Step 1: Write the failing FE08 mobile containment assertion.**

After the existing `390x844` reload, measure the first candidate row, its status badge, and its action button. Assert that the badge and button are visible and their right edges do not exceed the row's right edge by more than one CSS pixel.

- [x] **Step 2: Run the FE08 test and verify RED.**

Run:

```powershell
$env:E2E_FRONTEND_PORT='4196'
$env:E2E_BACKEND_PORT='3121'
npx.cmd playwright test tests/e2e/fe08-reservation-candidate-catalog.spec.js --project=chromium
```

Expected before the CSS fix: FAIL because the long waiting-status badge is clipped beyond the candidate row on the `390px` viewport.

- [x] **Step 3: Implement the minimal FE08 mobile CSS.**

Inside the existing `@media (max-width: 640px)` block, change only `.member-reservation-catalog .queue-item`: use a two-column grid, allow the text stack and badge to shrink/wrap, and place the action button on a full-width row.

- [x] **Step 4: Run the FE08 test and verify GREEN.**

Repeat the Step 2 command. Expected: PASS with no document-level horizontal overflow and all candidate controls contained in the row.

- [x] **Step 5: Write the failing FE11 mobile topbar assertion.**

In the Admin request-management E2E flow, open `Quản lý người dùng`, switch to `390x844`, and assert that `.um-actions` starts at least eight CSS pixels below the heading. Also assert that the document has no horizontal overflow and `.um-content` remains the horizontal-scroll container for the wide table.

- [x] **Step 6: Run the FE11 test and verify RED.**

Run:

```powershell
$env:E2E_FRONTEND_PORT='4197'
$env:E2E_BACKEND_PORT='3122'
npx.cmd playwright test tests/e2e/fe11-admin-request-management.spec.js --project=chromium
```

Expected before the CSS fix: FAIL because the mobile topbar has no separation between the heading block and action row.

- [x] **Step 7: Implement the minimal FE11 mobile CSS.**

Inside the existing `@media (max-width: 900px)` block, add a gap to `.um-topbar`, allow `.um-actions` to wrap at full width, and give its buttons a responsive flex basis. Preserve `.um-content { overflow: auto; }` and `.um-table { min-width: 850px; }`.

- [x] **Step 8: Run the focused tests and full visual regression gate.**

Run both focused tests, then:

```powershell
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
git diff --check
```

Expected: all commands pass. Capture fresh FE08 and FE11 mobile screenshots in `output/playwright/` and update the visual/release evidence with the exact result; do not commit, tag, or publish.
