# Final Governance Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a review-ready `v1.0.2` closeout candidate that restores the approved FE11 Audit Log filters, reconciles current SDD status, and aligns governance and release documentation without changing backend behavior.

**Architecture:** Keep the existing FE11 API, query builder, authorization, and redaction boundaries unchanged. Restore only the missing React controls, prove them with source-level frontend regression tests, then reconcile documentation metadata and release references as a separate shell layer.

**Tech Stack:** React 19, Node.js test runner, Express 5, Jest, Playwright, Markdown SDD artifacts, GitHub Actions.

## Global Constraints

- Approved stack remains Node.js + Express.js, React + Bootstrap, SQL Server, and REST APIs.
- No API endpoint, schema, role permission, business rule, dependency, or staging secret changes.
- Preserve all user-authored untracked files; only ignore `.worktrees/` and `.superpowers/`.
- Every FE11 behavior change maps to `BR-FE11-018`, `BR-FE11-026`, `FR-FE11-033`, and `AC-FE11-018`.
- Use TDD for the FE11 UI behavior: observe RED before editing production code.
- Do not commit generated implementation changes until the human H2 review approves the complete diff and L1-L4 evidence.

---

### Task 1: Prepare the Isolated Baseline

**Files:**
- Existing worktree: `D:/SWP391/.worktrees/library-management-system/final-governance-closeout`
- Existing branch: `docs/final-governance-closeout`

**Interfaces:**
- Consumes: approved design commit `a6f47b6`.
- Produces: installed dependencies and a clean baseline for later RED/GREEN evidence.

- [x] **Step 1: Verify branch and tree state**

Run:

```powershell
git status --short --branch
git log -2 --oneline
```

Expected: branch `docs/final-governance-closeout`, no tracked changes, design commit `a6f47b6` at `HEAD`.

- [x] **Step 2: Install exact dependencies**

Run:

```powershell
npm.cmd ci
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
```

Expected: all three installs exit `0` without modifying tracked lockfiles.

- [x] **Step 3: Run focused baseline checks**

Run:

```powershell
npm.cmd --prefix frontend test
npm.cmd run trace:enforce
git diff --check
```

Expected: frontend `151/151`, traceability `12/12` at `100%`, no diff errors.

---

### Task 2: Restore FE11 Audit Log Filters With TDD

**Files:**
- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `frontend/src/page/UserManagement.jsx`

**Interfaces:**
- Consumes: `auditFilters`, `setAuditFilters`, `buildAuditLogParams`, and `loadAuditLogs` already defined in `UserManagement.jsx`.
- Produces: visible `action` and `actorId` controls that feed the existing canonical query builder.

- [x] **Step 1: Write the failing frontend regression test**

Add this test after the existing audit query-builder test:

```javascript
test('FE11 Audit exposes the approved action and actor filters', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /aria-label="Lọc hành động"[\s\S]*?value=\{auditFilters\.action\}/);
  assert.match(source, /setAuditFilters\(\(current\) => \(\{[\s\S]*?action: event\.target\.value/);
  assert.match(source, /aria-label="Actor ID"[\s\S]*?type="number"[\s\S]*?value=\{auditFilters\.actorId\}/);
  assert.match(source, /setAuditFilters\(\(current\) => \(\{[\s\S]*?actorId: event\.target\.value/);
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm.cmd --prefix frontend test -- --test-name-pattern="FE11 Audit exposes"
```

Expected: FAIL because `UserManagement.jsx` does not render `aria-label="Lọc hành động"` or `aria-label="Actor ID"`.

- [x] **Step 3: Restore the minimal production controls**

Insert these controls between the audit search field and the date inputs:

```jsx
<input
  aria-label="Lọc hành động"
  value={auditFilters.action}
  maxLength={100}
  placeholder="AUTH_LOGIN_SUCCESS"
  onChange={(event) => setAuditFilters((current) => ({
    ...current,
    action: event.target.value,
  }))}
/>
<input
  aria-label="Actor ID"
  type="number"
  min="1"
  step="1"
  value={auditFilters.actorId}
  onChange={(event) => setAuditFilters((current) => ({
    ...current,
    actorId: event.target.value,
  }))}
/>
```

Restore the audit toolbar grid to:

```css
.um-toolbar.audit { display: grid; grid-template-columns: minmax(260px, 1fr) 190px 100px 150px 150px auto auto; margin-bottom: 0; }
```

- [x] **Step 4: Verify GREEN and frontend regression**

Run:

```powershell
npm.cmd --prefix frontend test -- --test-name-pattern="FE11 Audit"
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Expected: focused FE11 tests pass, full frontend `152/152`, lint and build pass.

- [x] **Step 5: Record the uncommitted checkpoint**

Run:

```powershell
git diff -- frontend/test/userManagementFrontend.test.js frontend/src/page/UserManagement.jsx
git diff --check
```

Expected: only the approved FE11 filter controls, toolbar layout, and regression test appear.

---

### Task 3: Reconcile Current Feature Completion Metadata

**Files:**
- Modify: `.sdd/specs/feat-auth/SPEC.md`
- Modify: `.sdd/specs/feat-book-management/SPEC.md`
- Modify: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Modify: `.sdd/specs/feat-fine-management/SPEC.md`
- Modify: `.sdd/specs/feat-inventory-book-copy/SPEC.md`
- Modify: `.sdd/specs/feat-membership-management/SPEC.md`
- Modify: `.sdd/specs/feat-notification-management/SPEC.md`
- Modify: `.sdd/specs/feat-public-browse/SPEC.md`
- Modify: `.sdd/specs/feat-reporting-statistics/SPEC.md`
- Modify: `.sdd/specs/feat-reservation-management/SPEC.md`
- Modify: `.sdd/specs/feat-user-profile/SPEC.md`
- Modify: `.sdd/specs/feat-user-role-management/SPEC.md`
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Interfaces:**
- Consumes: `Implementation State: COMPLETE` from every feature `TASKS.md` and `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Produces: an explicit current-status interpretation while retaining historical planning snapshots.

- [x] **Step 1: Add the same current-delivery note to every feature SPEC**

Insert after the `Feature folder` header in all twelve `SPEC.md` files:

```markdown
> Current delivery status (2026-07-20): `COMPLETE` for the approved Phase 1 scope.
> `TASKS.md` and `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> are authoritative for current implementation state. Older `Not Started`,
> `PARTIAL`, `READY FOR REVIEW`, or pending-review labels retained below are
> historical planning/evidence snapshots, not the current delivery state.
```

- [x] **Step 2: Reconcile the FE11 Audit Log current rows**

Update FE11 version to `0.4.4`, `Last Updated` to `2026-07-20`, and change the current traceability rows for `AC-FE11-018` and `FR-FE11-033` to:

```markdown
| AC-FE11-018 | Audit-log view is searchable/filterable and redacts sensitive fields | FR-FE11-033 | BR-FE11-018, BR-FE11-026 | FE11-AUD01; `frontend/test/userManagementFrontend.test.js`; final governance closeout validation | COMPLETE (B7 + final closeout) |
```

```markdown
| FR-FE11-033 | Audit logs are searchable/filterable and redacted | BR-FE11-018, BR-FE11-026 | EC-FE11-018 | FE11-AUD01; `frontend/test/userManagementFrontend.test.js`; final governance closeout validation | COMPLETE (B7 + final closeout) |
```

- [x] **Step 3: Add FE11 closeout evidence**

Add a `2026-07-20 - Final Governance Closeout` entry to `CHANGELOG.md` recording:

- restored `action` and `actorId` controls;
- regression-test evidence;
- no API, schema, permission, or redaction change;
- commit `f10e7f4` reconciled through the reviewed closeout batch.

Add a completed `FE11-CLOSE01` task to `TASKS.md` mapped to `FR-FE11-033` and `AC-FE11-018`. Add the same bounded closeout and validation commands to the current evidence section of `PLAN.md`.

- [x] **Step 4: Verify the documentation reconciliation**

Run:

```powershell
rg -l "Current delivery status \(2026-07-20\): `COMPLETE`" .sdd/specs/*/SPEC.md
rg -n "FR-FE11-033|AC-FE11-018|FE11-CLOSE01" .sdd/specs/feat-user-role-management
npm.cmd run trace:enforce
git diff --check
```

Expected: twelve SPEC paths contain the current-delivery note; FE11 rows and task are complete; traceability remains `12/12`, `100%`.

---

### Task 4: Approve Governance Metadata and Release Candidate References

**Files:**
- Modify: `.sdd/constitution.md`
- Modify: `.agents/AGENTS.md`
- Modify: `.sdd/constraints/global.md`
- Modify: `.sdd/constraints/business.md`
- Modify: `.sdd/constraints/safety.md`
- Modify: `.gitignore`
- Modify: `README.md`
- Modify: `plan.md`
- Modify: `docs/release/phase3-final-report.md`
- Modify: `docs/release/final-submission-checklist-2026-07-20.md`
- Modify: `document/FinalRelease.md`

**Interfaces:**
- Consumes: human approval of the design and the published `v1.0.1` baseline.
- Produces: approved governance headers and a consistent next immutable release reference, `v1.0.2`.

- [x] **Step 1: Promote governance headers without changing normative rules**

Apply these metadata-only transitions:

```text
.sdd/constitution.md: Version 0.1.2, Status APPROVED, Last Updated 2026-07-20
.agents/AGENTS.md: Version 0.1.1, Status APPROVED, Last Updated 2026-07-20
.sdd/constraints/global.md: Version 0.1.1, Status APPROVED, Last Updated 2026-07-20
.sdd/constraints/business.md: Version 0.1.1, Status APPROVED - PHASE 1 BASELINE, Last Updated 2026-07-20
.sdd/constraints/safety.md: Version 0.1.1, Status APPROVED, Last Updated 2026-07-20
```

- [x] **Step 2: Ignore only local tooling directories**

Append under the scratch/tooling section of `.gitignore`:

```gitignore
.worktrees/
.superpowers/
```

Do not add ignore rules for `GLOSSARY.md`, `MISSION.md`, `RESOURCES.md`, `learning-records/`, or the presentation briefing document.

- [x] **Step 3: Align release references to `v1.0.2`**

Replace the canonical release reference in the five release/source documents and update the final operator commands and release URL to `v1.0.2`. State that the tag is created only after H3 merge and exact post-merge CI.

- [x] **Step 4: Verify governance and release consistency**

Run:

```powershell
rg -n "^# Status: DRAFT|^Status: DRAFT" .sdd/constitution.md .agents/AGENTS.md .sdd/constraints
rg -n "v1\.0\.0-final-release" README.md plan.md docs/release document/FinalRelease.md
rg -n "v1\.0\.2" README.md plan.md docs/release document/FinalRelease.md
git check-ignore -v .worktrees .superpowers
git diff --check
```

Expected: no draft governance headers; no old canonical release references; all intended files reference `v1.0.2`; both tooling directories are ignored.

---

### Task 5: Produce Four-Layer Validation Evidence

**Files:**
- Create: `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`
- Modify: `docs/release/final-submission-checklist-2026-07-20.md`

**Interfaces:**
- Consumes: completed Tasks 2-4 and the current public staging URLs.
- Produces: exact L1-L4 evidence for H2/H3 review and the future `v1.0.2` tag.

- [x] **Step 1: Run L1 automated validation sequentially**

Run:

```powershell
npm.cmd run trace:enforce
npm.cmd run test:deployment
npm.cmd --prefix backend run test:coverage:ci
npm.cmd run test:system
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
$env:E2E_FRONTEND_PORT='4473'
$env:E2E_BACKEND_PORT='3400'
$env:E2E_FRONTEND_URL='http://127.0.0.1:4473'
$env:E2E_BACKEND_URL='http://127.0.0.1:3400'
npm.cmd run test:e2e
npm.cmd run phase3:performance
```

Expected: all commands pass; frontend total is `152`, backend remains `916`, E2E remains `4/4`.

- [x] **Step 2: Run L3 safety and dependency checks**

Run:

```powershell
npm.cmd audit --omit=dev --audit-level=high
npm.cmd --prefix backend audit --omit=dev --audit-level=high
npm.cmd --prefix frontend audit --omit=dev --audit-level=high
node -e "require('yamljs').load('./src/docs/openapi.yaml'); console.log('OPENAPI_PARSE_OK')"
node -e "const app=require('./src/index'); if(!app||typeof app.listen!=='function') throw new Error('invalid export'); console.log('BACKEND_IMPORT_OK')"
```

Run the final two Node commands from `backend/`. Expected: zero vulnerabilities, OpenAPI parse pass, backend import pass.

- [x] **Step 3: Run public staging acceptance**

Run:

```powershell
$env:STAGING_FRONTEND_URL='https://lemon-wave-04db51100.7.azurestaticapps.net'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
```

Expected: six checks pass: frontend, health, SQL catalog, allowed CORS, blocked CORS, and protected route.

- [x] **Step 4: Write the validation record using observed results**

The review must contain these exact sections:

```markdown
# Final Governance Closeout Validation - 2026-07-20

## Decision
## Changed scope
## L1 - Automated checks
## L2 - Spec and traceability compliance
## L3 - Constitution and safety compliance
## L4 - Acceptance verification
## Residual boundaries
## H2 review boundary
```

Record actual command results, the approved FE11 IDs, unchanged API/schema/permission boundaries, public staging result, and the remaining human-only H2/H3/tag steps. Add the validation record to the final submission checklist.

- [x] **Step 5: Prepare the H2 review diff without committing**

Run:

```powershell
git status --short --branch
git diff --stat
git diff --check
git diff -- . ':!package-lock.json' ':!backend/package-lock.json' ':!frontend/package-lock.json'
```

Expected: only files named in this plan are changed; all generated implementation remains uncommitted for human H2 review.
