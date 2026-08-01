# FE07 Return-Date Business Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use the repository TDD workflow and execute this plan inline because the current H1 does not authorize delegation, commit, push, or merge. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the default FE07 return date as the current `Asia/Ho_Chi_Minh` business date so FE09 calculates overdue fines from the committed calendar date seen by the return UI.

**Architecture:** Keep FE07 as the owner of the committed return date and FE09 as a downstream reader. At the service-to-repository boundary, pass the canonical `YYYY-MM-DD` business date already derived by `libraryBusinessTime`; SQL Server continues to bind the value through the existing parameterized `sql.Date` input.

**Tech Stack:** Node.js, Express, Jest, in-memory FE07 repository double, `mssql`, SQL Server.

## Global Constraints

- Source of truth remains AC-FE07-006, AC-FE07-008, FR-FE07-021, and the `returnDate` data/API contracts in the approved FE07 SPEC.
- Do not change schema, API shape, roles, fine rates, explicit-return-date validation, audit semantics, FE08 handoff, or FE09 calculation behavior.
- Modify only `backend/tests/borrowingRoutes.test.js`, `backend/src/services/borrowingService.js`, and uncommitted FE07 plan/task/evidence documents.
- H1 authorizes uncommitted RED/GREEN implementation and local validation only. Commit, push, staging mutation/rerun, task closure, H2, and H3 remain blocked.

---

### Task 1: Reproduce the service-to-SQL date drift

**Files:**

- Modify: `backend/tests/borrowingRoutes.test.js`
- Read: `backend/src/services/borrowingService.js`
- Read: `backend/src/repositories/borrowingRepository.js`

**Interfaces:**

- Consumes: `clock() = 2026-07-22T17:30:00.000Z`, which is business date `2026-07-23` in `Asia/Ho_Chi_Minh`.
- Produces: a regression proving the repository persistence input and stored in-memory value are exactly `2026-07-23` while the fine candidate remains one day overdue.

- [x] **Step 1: Extend the existing UTC-midnight return test**

Wrap `borrowingDependencies.borrowingRepository.returnBorrowDetail`, capture `input.returnDate`, execute a default-date return, and assert:

```javascript
expect(persistedReturnDate).toBe('2026-07-23');
expect(storedDetail.returnDate).toBe('2026-07-23');
expect(response.body.fineCandidate.overdueDays).toBe(1);
```

- [x] **Step 2: Prove RED**

Run:

```powershell
Push-Location backend
$env:TZ='UTC'
& .\node_modules\.bin\jest.cmd --runInBand tests\borrowingRoutes.test.js -t "default return persists the Vietnam business date across UTC midnight"
Remove-Item Env:TZ -ErrorAction SilentlyContinue
Pop-Location
```

Expected: the new assertion fails because the repository receives the raw UTC `Date` (`2026-07-22T17:30:00.000Z`) instead of `2026-07-23`.

### Task 2: Persist the canonical business date

**Files:**

- Modify: `backend/src/services/borrowingService.js`
- Test: `backend/tests/borrowingRoutes.test.js`

**Interfaces:**

- Consumes: existing `returnBusinessDate: YYYY-MM-DD` derived from explicit input or `formatBusinessDate(clock())`.
- Produces: `borrowingRepository.returnBorrowDetail({ returnDate: returnBusinessDate })`; no repository, schema, or API change.

- [x] **Step 1: Apply the minimal fix**

Change only the persistence argument:

```javascript
const returnedDetail = await borrowingRepository.returnBorrowDetail({
  borrowDetailId,
  detailStatus,
  copyStatus,
  returnDate: returnBusinessDate,
  // existing audit/evidence fields remain unchanged
});
```

- [x] **Step 2: Prove GREEN and explicit-date compatibility**

Run:

```powershell
$env:TZ='UTC'
Push-Location backend
& .\node_modules\.bin\jest.cmd --runInBand tests\borrowingRoutes.test.js tests\borrowingRepository.test.js tests\fineManagementRoutes.test.js tests\fineRoutes.test.js tests\fineContract.test.js
Remove-Item Env:TZ -ErrorAction SilentlyContinue
Pop-Location
```

Expected: all selected tests pass; explicit `returnDate` validation and transaction evidence remain unchanged.

### Task 3: Validate and stop at H2 boundary

**Files:**

- Update: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Update: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Update: `.sdd/reviews/release-closeout-staging-acceptance-2026-08-02.md`

**Interfaces:**

- Consumes: RED/GREEN output and repository diff.
- Produces: L1-L3 evidence plus an explicit L4 gap; FE07-T061 remains open until a deployed clean staging acceptance passes.

- [x] **Step 1: Run local validation**

```powershell
$env:TZ='UTC'
Push-Location backend
& .\node_modules\.bin\jest.cmd --runInBand tests\borrowingRoutes.test.js tests\borrowingRepository.test.js tests\fineManagementRoutes.test.js
Remove-Item Env:TZ -ErrorAction SilentlyContinue
Pop-Location
npm --prefix backend test
npm --prefix backend run test:coverage:ci -- --silent
npm run test:system
npm run trace:enforce
npm run test:secrets
git diff --check
```

Run the disposable FE07 SQL suite only when its named non-staging database and `FE07_SQL_TEST_ALLOW_MUTATION=true` are already configured; otherwise record it as not run and do not substitute Azure staging mutation.

- [x] **Step 2: Stop without integration actions**

Report changed files, exact test counts, L2/L3 review, the unexecuted L4 staging rerun, and residual risk. Do not commit, push, deploy, rerun live staging, close FE07-T061, or grant H2/H3.

## Execution evidence — 2026-08-02

- Baseline before RED: FE07 route plus repository `85/85` passed.
- RED: expected persistence input `2026-07-23`; received raw `2026-07-22T17:30:00.000Z` while the pre-existing fine-candidate assertion remained green.
- GREEN: the focused UTC-boundary regression passed `1/1`; the production diff is one changed argument, `returnDate: returnBusinessDate`.
- Focused FE07/FE09/repository under `TZ=UTC`: `5` suites and `114/114` tests passed. The same regression passed under `America/New_York`.
- Installed Tedious `sql.Date` contract smoke mapped canonical `2026-07-23` to `2026-07-23` with `useUTC=true`, while the original raw clock value mapped to `2026-07-22`.
- System integration: `11/11` passed. Full backend and coverage: `74` suites and `1,175/1,175` tests passed; statements `91.98%`, branches `81.28%`, functions `97.08%`, lines `91.94%`.
- Traceability enforcement passed with FE07 `44/44` FR tags (`100%`); tracked-secret tests passed `5/5`; `git diff --check` passed.
- Disposable SQL was not run because `DB_SERVER`, `DB_NAME`, and `FE07_SQL_TEST_ALLOW_MUTATION` were not configured. Azure staging was not used as a substitute.
- L4 remains open: the change has not been committed, deployed, or exercised in another live staging acceptance.

## H2 publication authorization — 2026-08-02

- The user approved the frozen FE07 remediation diff for a scoped commit, branch push, and Draft PR.
- The original H1 constraints above remain the historical execution boundary; this later H2 authorizes publication only for the reviewed files listed in `.sdd/reviews/fe07-return-date-business-persistence-h2-2026-08-02.md`.
- FE07-T061, real-SQL/staging acceptance, H3, and merge remain open.
