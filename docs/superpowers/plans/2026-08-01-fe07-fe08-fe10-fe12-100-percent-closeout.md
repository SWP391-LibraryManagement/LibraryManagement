# FE07 FE08 FE10 FE12 100 Percent Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current approved FE07, FE08, FE10, and FE12 implementation enforceable at 100% production-source FR traceability without changing business behavior, then produce fresh local acceptance evidence and an exact external staging blocker report.

**Architecture:** Existing business behavior remains unchanged because the audited FRs are already implemented and covered by backend, frontend, and browser tests. The batch adds requirement tags at the owning production boundaries, strengthens the traceability gate so `COMPLETE` features require 100%, reconciles the four task headers, and validates the unchanged behavior from unit level through the connected browser flow. Azure mutation and publication remain behind the repository's H2/H3 human gates.

**Tech Stack:** Node.js 22, Express, React/Vite, SQL Server 2022, Node test runner, Jest, Playwright, GitHub Actions, Azure CLI.

## Global Constraints

- The approved source of truth remains each feature's `.sdd/specs/feat-*/SPEC.md`; no requirement, API, schema, role, state transition, or UI behavior is added by this batch.
- Core business behavior and security boundaries must remain unchanged; production edits are limited to `@spec` annotations at already-tested ownership points.
- `COMPLETE` implementation metadata requires 100% FR tags in `backend/src` and `frontend/src`; `PARTIAL` keeps the configured minimum floor.
- No secret, credential, provider detail, or real PII may be written to source, tests, logs, or plan evidence.
- SQL mutation tests may run only against a named disposable local database and must not target staging or a shared developer database.
- No commit, push, PR publication, Azure resume/deploy, or merge occurs before the required human H2/H3 gates.

---

### Task 1: Enforce 100% traceability for COMPLETE features

**Files:**
- Modify: `scripts/traceability-state.test.js`
- Modify: `scripts/traceability-state.js`
- Modify: `scripts/check-traceability.js`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `parseImplementationState(taskText)` and the existing `--min=<number>` partial-feature floor.
- Produces: `requiredCoverage(state, partialMinimum)` returning `100` for `COMPLETE`, the configured minimum for `PARTIAL`, and `null` for inactive states.

- [x] **Step 1: Write the failing threshold test**

```js
test('requires full traceability for COMPLETE features while preserving the PARTIAL floor', () => {
  assert.equal(requiredCoverage('COMPLETE', 70), 100);
  assert.equal(requiredCoverage('PARTIAL', 70), 70);
  assert.equal(requiredCoverage('NOT_STARTED', 70), null);
  assert.equal(requiredCoverage('DEFERRED', 70), null);
});
```

- [x] **Step 2: Run the threshold test and verify RED**

Run: `npm run test:traceability-state`

Expected: FAIL because `requiredCoverage` is not exported.

- [x] **Step 3: Implement the per-state threshold**

```js
function requiredCoverage(state, partialMinimum) {
  if (state === 'COMPLETE') return 100;
  if (state === 'PARTIAL') return partialMinimum;
  return null;
}
```

Update `check-traceability.js` so each row records `required`, fails when `pct < required`, and reports the per-row requirement. Rename the CI step to `Spec traceability gate (COMPLETE = 100%, PARTIAL >= 70%)`.

- [x] **Step 4: Run the threshold test and verify GREEN**

Run: `npm run test:traceability-state`

Expected: all traceability-state tests PASS.

### Task 2: Close FE07 and FE08 production-source traceability

**Files:**
- Modify: `scripts/traceability-state.test.js`
- Modify: `backend/src/services/borrowingService.js`
- Modify: `frontend/src/api/apiErrorMessages.js`
- Modify: `backend/src/repositories/reservationRepository.js`
- Modify: `frontend/src/page/reservation/MyReservationsPage.jsx`
- Modify: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`

**Interfaces:**
- Consumes: approved `FR-FE07-040/041/042/044` and `FR-FE08-007/036/037/038` behavior already exercised by borrowing, reservation, frontend, contract, and connected E2E tests.
- Produces: one production-source `@spec` owner for every listed FR, with no runtime code change.

- [x] **Step 1: Write the failing target-feature coverage assertion**

Add a test that reads the four target specs, scans only `backend/src` and `frontend/src` lines containing `@spec`, and asserts every declared target FR is tagged.

```js
for (const featureDirectory of targetFeatureDirectories) {
  const missing = declaredFeatureRequirements(featureDirectory)
    .filter((requirementId) => !productionTags.has(requirementId));
  assert.deepEqual(missing, [], `${featureDirectory} missing production tags`);
}
```

- [x] **Step 2: Run the coverage assertion and verify RED**

Run: `npm run test:traceability-state`

Expected: FAIL listing FE07 and FE08 missing IDs alongside the FE10/FE12 IDs closed in Task 3.

- [x] **Step 3: Add minimal FE07/FE08 annotations at ownership points**

Add comments only:

```js
// @spec FR-FE07-040 - approved/rejected requests create an idempotent FE10 result notification.
// @spec FR-FE07-041 - renew/return commits are followed by a non-blocking FE10 result notification.
// @spec FR-FE07-042 - return exposes a fixed FE08 queue handoff without mutating reservations.
// @spec FR-FE07-044 - stale/blocker error codes map to truthful reload or next-action guidance.
// @spec FR-FE08-007 - the winning queue hold atomically changes the physical copy to RESERVED.
// @spec FR-FE08-036 - only the owner of a NOTIFIED reservation receives the exact-copy FE07 CTA.
// @spec FR-FE08-037, FR-FE08-038 - staff explicitly triggers processing and receives only safe warning data.
```

- [x] **Step 4: Run focused FE07/FE08 regressions**

Run:

```powershell
npm --prefix backend test -- --runInBand --runTestsByPath tests/borrowingRoutes.test.js tests/reservationRoutes.test.js tests/reservationService.test.js tests/borrowingContract.test.js
npm --prefix frontend test -- test/borrowingFrontend.test.js test/reservationFrontend.test.js
```

Expected: all selected tests PASS with unchanged response and UI behavior.

### Task 3: Close FE10 and FE12 traceability and reconcile implementation metadata

**Files:**
- Modify: `backend/src/services/notificationService.js`
- Modify: `backend/src/utils/notificationInbox.js`
- Modify: `frontend/src/context/NotificationInboxContext.jsx`
- Modify: `frontend/src/page/dashboard/RoleDashboardPage.jsx`
- Modify: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Modify: `.sdd/specs/feat-reservation-management/TASKS.md`
- Modify: `.sdd/specs/feat-notification-management/TASKS.md`
- Modify: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Modify: the four matching `CHANGELOG.md` files

**Interfaces:**
- Consumes: approved `FR-FE10-015..020`, `FR-FE12-015`, merged browser/integration evidence, and the stronger COMPLETE gate from Task 1.
- Produces: 100% target FR traceability and `Implementation State: COMPLETE` for the four approved implementation scopes while preserving the separate Azure staging blocker line.

- [x] **Step 1: Add minimal FE10/FE12 annotations at ownership points**

```js
// @spec FR-FE10-017 - FE10 accepts the four FE07 result templates owned by FE07.
// @spec FR-FE10-018 - an idempotency key replays the existing notification across normal and unique-key race paths.
// @spec FR-FE10-015, FR-FE10-019, FR-FE10-020 - inbox projection uses eligible rows and server-owned fixed action paths.
// @spec FR-FE10-016 - authenticated roles receive the canonical inbox refresh/read workflow.
// @spec FR-FE12-015 - staff KPI cards render the FE12 snapshot and use fixed approved drill-down paths.
```

- [x] **Step 2: Reconcile target TASKS metadata and changelogs**

Change exactly one metadata line per target file:

```text
Implementation State: COMPLETE
```

Add a `2026-08-01` changelog entry explaining that the closeout adds no product behavior and that Azure acceptance remains separately blocked until the paused database can be resumed.

- [x] **Step 3: Run traceability-state and enforced traceability gates**

Run:

```powershell
npm run test:traceability-state
npm run trace:enforce
```

Expected: all four target features show 100% and `COMPLETE`; other PARTIAL features retain the 70% floor.

- [x] **Step 4: Run focused FE10/FE12 regressions**

Run:

```powershell
npm --prefix backend test -- --runInBand --runTestsByPath tests/notificationRoutes.test.js tests/notificationInboxRepository.test.js tests/reportRoutes.test.js tests/reportService.test.js
npm --prefix frontend test -- test/notificationInboxFrontend.test.js test/reportOperationalFrontend.test.js
```

Expected: all selected tests PASS with unchanged privacy, idempotency, report, and drill-down behavior.

### Task 4: Produce complete local evidence and stop at the external gates

**Files:**
- Create: `.sdd/reviews/fe07-fe08-fe10-fe12-100-percent-closeout-2026-08-01.md`

**Interfaces:**
- Consumes: the exact uncommitted diff and all validation outputs from Tasks 1-3.
- Produces: a review packet suitable for H2, followed by H3/merge/deploy only after explicit human approval.

- [x] **Step 1: Run full automated verification**

Run:

```powershell
npm --prefix backend test
npm --prefix backend run test:integration:system
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
npm run test:e2e -- --project=chromium
npm run test:deployment
npm run test:secrets
npm run trace:enforce
git diff --check
```

Expected: every command exits `0`; target traceability is 100%.

- [x] **Step 2: Run SQL mutation suites only on a disposable local database**

Create a uniquely named local database, apply `database/Librarymanagement.sql` through the existing Azure-schema preparation path, configure a temporary least-privilege SQL login only for that database, run the FE07 and system SQL suites with both mutation flags set, then drop the exact disposable database and login after evidence capture.

Expected: both guarded SQL suites PASS and the named disposable resources are removed.

- [x] **Step 3: Run browser acceptance**

Run:

```powershell
npx playwright test tests/e2e/fe07-fe12-connected-demo-flow.spec.js tests/e2e/fe08-reservation-candidate-catalog.spec.js tests/e2e/fe10-notification-inbox.spec.js tests/e2e/system-golden-path.spec.js --project=chromium
```

Expected: six Chromium scenarios PASS with no browser errors.

- [x] **Step 4: Record the exact Azure state without mutating it**

Run Azure CLI read-only queries for the Web App and `LibraryManagementStaging` status. Record `Running`, `Paused`, quota errors, or other live values exactly. Do not resume, deploy, or spend quota before H2/H3 authorization.

- [x] **Step 5: Write the H2 review packet**

Record the source ledger, actor boundaries, exact diff, target requirement mapping, commands and counts, SQL cleanup evidence, Azure state, unresolved external blocker, and required human decisions. Do not label Azure acceptance complete while the database is paused.

- [x] **Step 6: Stop before commit/publication**

Present the exact diff fingerprint and request H2. Only after H2 may the reviewed files be committed and pushed; H3 remains mandatory before merge and Azure deployment verification.
