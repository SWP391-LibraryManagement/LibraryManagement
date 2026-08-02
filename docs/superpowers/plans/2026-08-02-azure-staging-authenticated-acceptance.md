# Azure Staging Authenticated Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the deployed staging system's authenticated, cross-role circulation behavior with four disposable synthetic accounts, then revoke/deactivate every fixture while preserving audit history.

**Architecture:** A temporary local operator harness uploads a short-lived Node fixture utility through the authenticated Kudu VFS/command APIs. Product behavior is exercised through the real staging UI; SQL is limited to seed, due-date setup, exact-ID inspection, and cleanup. No harness, credential, endpoint, workflow, or fixture remains active after the run.

**Tech Stack:** Azure CLI, Azure App Service Kudu, Node.js 22, `mssql`, `bcrypt`, Playwright/Chromium, React/Vite staging UI, Express staging API, SQL Server, PowerShell on Windows.

## Global Constraints

- Baseline/deployed SHA must be `e01585a9aa7d603daf932f7ac6459eaa0752746c`; approved design is commit `944c584c4867cc1d8abfd992537d089e04468638`.
- Staging frontend is `https://www.thuvienhub.io.vn`; API is `https://app-library-api-staging-nhat714.azurewebsites.net`.
- Azure target is resource group `rg-library-staging`, app `app-library-api-staging-nhat714`, SQL server `sql-library-staging-ea-nhat714`, database `LibraryManagementStaging`.
- Use exactly four synthetic `.invalid` accounts: Member A, Member B, Librarian, and Admin; every account gets a distinct runtime-random password.
- Never print, persist, screenshot, commit, or send a raw password, token, cookie, connection string, publishing credential, or authorization header. Password hashes may exist only in the database user row and the short-lived seed input that is deleted immediately after seed; they never enter logs, screenshots, evidence, or Git.
- Use one run-specific book/copy. SQL mutations must be parameterized and restricted to manifest IDs.
- No production access, new app endpoint, schema, migration, workflow, role, dependency, or product behavior.
- Cleanup runs in `finally`; incomplete cleanup blocks task closeout and any rerun.
- Staging mutations and the temporary harness require the user's H1 approval of this plan before execution.
- Do not commit generated evidence/task changes before the combined H2 review.

---

## Execution status — 2026-08-02

- Status: `STOPPED_BEFORE_STAGING_MUTATION`; the authenticated scenario was not executed and no live-acceptance task is eligible for closeout.
- Three deterministic bootstrap attempts were consumed. The first two stopped because the Windows Node process could not launch the Azure CLI shim. The third stopped before its first Kudu request because Azure returned an SCM URI containing user information and the request constructor rejected it.
- The publishing credential was exposed only in local task tool output during that rejected request construction. It was immediately rotated with the App Service `newpassword` action and the replacement credential was verified without printing its value.
- The harness now removes username/password components from the SCM URI before constructing any request. A read-only post-incident check confirmed the web app is `Running`, HTTPS-only, `/health` is `ok`, and `/home/data/staging-acceptance` is absent (`404`).
- No synthetic user, membership, book, copy, loan, reservation, fine, notification, audit fixture, Kudu runtime, or seed-input file was created by these attempts.
- A fresh H1 review is required before another staging mutation attempt because the approved three-attempt limit is exhausted. Until then, FE04-ADM05, FE04-CONV-002, FE11-UXR07, FE11-UXR08, FE11-UXR09, and FE11-PDO04 remain open.

### Fresh H1 retry outcome

- The user granted a fresh H1 for one additional staging acceptance attempt.
- Read-only preflight passed after Azure SQL serverless resumed asynchronously: deployed SHA `e01585a9aa7d603daf932f7ac6459eaa0752746c`, public smoke `PASS`, database `Online`, Kudu Node `v18.17.1`, and the sanitized SCM URL contained no user information.
- Pre-mutation verification recorded one non-reproducible backend test failure (`1174/1175`), then the isolated owning suite passed `73/73` and the one allowed full rerun passed backend `1175/1175` plus frontend `273/273` without a source change.
- Run `lms-acceptance-20260802-72e4f014` stopped in `prepareRemoteRuntime`: Kudu returned HTTP `504` while extracting the deployed `node_modules.tar.gz`. The fixture script was not uploaded, `preflight`/`seed` were not called, and no synthetic database row was created.
- The in-runtime cleanup helper could not complete after the timed-out command. A separately placed fixed-target helper removed only `/home/data/staging-acceptance`; both that runtime path and the external helper then returned `404`. App Service remained `Running`, the database remained `Online`, `/health` returned `200`, and a public book read returned `200`.
- The focused local Playwright command for FE04/FE11 exited cleanly with `2/2` passing. This supplies new local clean-exit evidence but does not substitute for authenticated Azure staging acceptance.
- No Azure acceptance task is eligible for closeout. Another live attempt requires a new reviewed execution approach that avoids synchronous full-archive extraction through the Kudu command timeout.
- Read-only diagnosis confirmed `/home/site/wwwroot/migration-runtime/node_modules/mssql/package.json` exists. The ignored harness was prepared by setting `NODE_PATH` to that deployed runtime and removing the archive extraction step.

### No-extraction H1 retry outcome

- The user granted one H1 attempt for the no-extraction approach. Preflight passed: deployed SHA matched, Azure SQL auto-resumed to `Online`, public smoke passed, and the previous runtime/helper paths returned `404`.
- Fresh local baseline passed backend `1175/1175`, frontend `273/273`, and the ignored harness contract checks.
- Run `lms-acceptance-20260802-b4f7910a` prepared the no-extraction runtime, then stopped during fixture `preflight`; `seed` was never called. The external helper removed the runtime and itself, with both paths returning `404`.
- Root cause is runtime compatibility: Kudu's default Node is `v18.17.1`, while deployed `mssql 12.5.5` requires Node `>=18.19.0` and failed with `dc.tracingChannel is not a function`. A parameterized read-only SQL check returned zero users and zero copies for the run ID.
- Read-only diagnosis found the App Service Oryx Node `v22.22.2`, and proved it loads the deployed `mssql`. The ignored harness now discovers that compatible binary and uses it for fixture phases; contract tests pass `5/5` and transport preflight passes. This prepared path has not been executed live. Do not rerun without a new H1.

### Oryx Node 22 H1 retry outcome

- The user granted one H1 attempt for the prepared Oryx Node 22 path. Read-only preflight passed: the branch contained the deployed baseline, there was no product/dependency diff, harness contracts passed `5/5`, App Service was `Running` and HTTPS-only, Azure SQL resumed to `Online`, the deployed SHA matched, public smoke passed, Node `v22.22.2` loaded the deployed `mssql`, and both previous remote paths returned `404`.
- Run `lms-acceptance-20260802-d6ecf326` prepared the runtime and seeded exactly four synthetic users plus one book/copy. All four actor logins and both member application submissions completed before the Admin membership-review step stopped on a locator timeout.
- The timeout is a deterministic harness responsive-locator mismatch: every actor context uses viewport `1440x900`, while deployed CSS applies `@media (max-width: 1440px)` and hides `.admin-membership-table` in favor of `.admin-membership-cards`. The locator targeted the matching table `<tr>`, which repeatedly resolved but remained hidden. This run does not establish a product membership-review defect.
- Mandatory cleanup returned `CLEANED`: four retained users but zero active users/tokens/members/open loans/open reservations/active books/active copies, with the run-specific copy retained only as inactive history. All four synthetic logins returned `401`, the retained old token returned `401`, and the runtime/helper paths returned `404`.
- Fresh read-only post-run checks showed App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200`, and remote residue `404/404`. The single H1 attempt is consumed; do not rerun until the harness locator is reviewed under a new H1. No live-acceptance task is eligible for closeout.

### Responsive-locator H1 retry outcome

- The user granted one H1 to repair the responsive membership locator with a regression test and execute one additional live attempt. TDD recorded the new contract failing against the table-only selector, then passing `6/6` after the ignored harness selected the visible table row or responsive card. No product/dependency diff was introduced.
- Fresh preflight passed: focused FE04/FE11 Playwright `2/2` with a clean process exit, public smoke `PASS`, deployed SHA matched, App Service was `Running` and HTTPS-only, Azure SQL was `Online`, Node `v22.22.2` loaded the deployed `mssql`, and remote residue was `404/404`.
- Run `lms-acceptance-20260802-6ee409c5` passed the repaired Admin locator, approved both membership applications, passed the eight-item Admin navigation/responsive overflow checks, created and approved Member A's borrow request, created Member B's active reservation, and aged BorrowDetail `59`.
- The run stopped before return mutation because the harness expected `Quá hạn 3 ngày`. At execution time the Vietnam business date was `2026-08-02` while UTC was `2026-08-01`; fixture `age` used `DATEADD(DAY, -3, CAST(GETDATE() AS DATE))`, producing due date `2026-07-29`. The deployed `Asia/Ho_Chi_Minh` due-status helper deterministically maps that date to `Quá hạn 4 ngày`. This is a fixture business-date mismatch, not a product due-status defect.
- Mandatory cleanup returned `CLEANED`: four retained users but zero active users/tokens/members/open loans/open reservations/active books/active copies, with the run-specific copy retained only as inactive history. Four login attempts returned `401`, the old token returned `401`, and the runtime/helper paths returned `404`.
- Fresh post-run checks showed App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200`, remote residue `404/404`, and no local run manifest/artifact. The single H1 attempt is consumed; do not fix or rerun without a new H1. No live-acceptance task is eligible for closeout.

### Business-date fixture H1 retry outcome

- The user granted one H1 to replace SQL server-calendar aging with an exact `Asia/Ho_Chi_Minh` business-date input, add a UTC/Vietnam boundary regression, and execute one additional live attempt.
- TDD recorded six existing contracts passing while the new boundary test failed because the helper did not exist. After the ignored harness added the helper and parameterized `sql.Date` input, syntax checks and all contracts passed `7/7`. The regression maps `2026-08-01T21:20Z` to Vietnam date `2026-08-02` and subtracts three days to `2026-07-30`.
- Fresh preflight passed: focused FE04/FE11 Playwright `2/2` in `27.0s` with a clean process exit, public smoke `PASS`, deployed SHA matched, App Service was `Running` and HTTPS-only, Azure SQL was `Online`, Node `v22.22.2` loaded deployed `mssql`, and remote residue was `404/404`.
- Run `lms-acceptance-20260802-2e3a025d` seeded exactly four synthetic users plus one book/copy, repeated the proven membership/Admin/borrow/reservation milestones, and aged BorrowDetail `60`. The live UI rendered the correct literal `Quá hạn 3 ngày` in three visible locations.
- The run stopped before return mutation because page-wide `getByText(/Quá hạn 3 ngày/i)` resolved to the selected row badge, return-detail badge, and strong summary element; Playwright strict mode requires a unique match. This proves the business-date fix live and identifies a new ignored-harness selector blocker, not a product defect.
- Mandatory cleanup returned `CLEANED`: four retained users but zero active users/tokens/members/open loans/open reservations/active books/active copies, with the run-specific copy retained only as inactive history. Four login attempts returned `401`, the old token returned `401`, and the runtime/helper paths returned `404`.
- Fresh post-run checks showed App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200`, and transport residue `404/404`. The single H1 attempt is consumed; do not fix or rerun without a new H1. No live-acceptance task is eligible for closeout.

### Overdue-label locator H1 retry outcome

- The user granted one H1 to scope the overdue assertion to a unique return-detail region, add a regression for three duplicate visible labels, and execute one additional live attempt.
- TDD recorded seven existing contracts passing while the new locator contract failed against the page-wide assertion. After the ignored harness used `.return-detail .return-dates` with exact text, syntax checks and all contracts passed `8/8`. No product/dependency diff was introduced.
- Fresh preflight passed: focused FE04/FE11 Playwright `2/2` in `23.7s` with a clean process exit, public smoke `PASS`, deployed SHA matched, App Service was `Running` and HTTPS-only, Azure SQL was `Online`, Node `v22.22.2` loaded deployed `mssql`, and remote residue was `404/404`.
- Run `lms-acceptance-20260802-9a3f0f98` seeded exactly four synthetic users plus one book/copy, repeated the membership/Admin/borrow/reservation milestones, aged BorrowDetail `61`, passed the exact `Quá hạn 3 ngày` assertion, committed the return, displayed the queue handoff, and navigated to the reservation workspace.
- The run stopped before fine mutation because the FE09 workflow button's accessible name is `2 Tính tiền phạt`, while the harness required exact name `Tính tiền phạt`. A read-only local Playwright accessibility probe returned exact-name count `0` and suffix-name count `1`. This is a deterministic ignored-harness locator mismatch, not a product FE09 defect.
- Mandatory cleanup returned `CLEANED`: four retained users but zero active users/tokens/members/open loans/open reservations/active books/active copies, with the run-specific copy retained only as inactive history. Four login attempts returned `401`, the old token returned `401`, and the runtime/helper paths returned `404`.
- Fresh post-run checks showed App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200`, transport residue `404/404`, product diff `0`, and local run artifact count `0`. The single H1 attempt is consumed; do not fix or rerun without a new H1. No live-acceptance task is eligible for closeout.

### FE09 workflow-tab locator H1 retry outcome

- The user granted one H1 to match the numbered FE09 tab by its stable accessible-name suffix, add an accessibility regression, and execute one additional live attempt.
- TDD recorded eight existing contracts passing while the ninth failed against the old exact-name locator. After the ignored harness scoped the tab under `Quy trình quản lý tiền phạt` and used `/Tính tiền phạt$/`, syntax checks and all contracts passed `9/9`. No product/dependency diff was introduced.
- Fresh preflight passed: focused FE04/FE11 Playwright `2/2` in `23.9s` with a clean process exit, public smoke `PASS`, deployed SHA matched `e01585a9aa7d603daf932f7ac6459eaa0752746c`, App Service was `Running` and HTTPS-only, Azure SQL was `Online`, Node `v22.22.2` loaded deployed `mssql`, and remote residue was `404/404`.
- Run `lms-acceptance-20260802-e941b470` seeded exactly four synthetic users plus one book/copy, repeated the membership/Admin/borrow/reservation milestones, aged BorrowDetail `62`, passed the exact `Quá hạn 3 ngày` assertion, committed the return, passed the numbered FE09 tab, advanced through fine calculation, and navigated to the reservation workspace.
- The run stopped before FE08 queue mutation because the harness filtered the generic `.reservation-queue-card` by the run-specific book title. The card does not render that title as card text; it appears only in a copy-selector option. The canonical connected-flow E2E locates the unique `Giữ sách & thông báo` button directly after handoff. This is a deterministic ignored-harness locator mismatch, not a demonstrated product FE08 defect.
- Mandatory cleanup returned `CLEANED`: four retained users but zero active users/tokens/members/open loans/open reservations/active books/active copies, with the run-specific copy retained only as inactive history. Four login attempts returned `401`, the old token returned `401`, and the runtime/helper paths returned `404`.
- Fresh post-run checks showed App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200`, transport residue `404/404`, syntax and harness contracts `9/9`, product diff `0`, and local run artifact count `0`. The single H1 attempt is consumed; no rerun or full L1-L4 closeout gate is permitted from this failed L4 acceptance. No live-acceptance task is eligible for closeout.

### FE08 reservation-queue locator H1 retry outcome

- The user granted one H1 to select the exact fixture copy instead of filtering the generic queue card by book title, add a regression aligned with the queue UI, and execute one additional live attempt.
- TDD recorded nine existing contracts passing while the tenth failed against the old `bookTitle` card filter. After the ignored harness selected `seed.copyId`, waited for the queue head carrying `ACC-${runId}`, and scoped `Giữ sách & thông báo` to that head, syntax checks and all contracts passed `10/10`. No product/dependency diff was introduced.
- Fresh preflight passed: focused FE04/FE11 Playwright `2/2` in `23.3s` with a clean process exit, public smoke `PASS`, deployed SHA matched `e01585a9aa7d603daf932f7ac6459eaa0752746c`, App Service was `Running` and HTTPS-only, Azure SQL was `Online`, required `DB_*` setting names were present without values, Node `v22.22.2` loaded deployed `mssql`, and remote residue was `404/404`.
- Run `lms-acceptance-20260802-372b4ded` seeded exactly four synthetic users plus book `29`/copy `53`, repeated the membership/Admin/borrow/reservation milestones, aged BorrowDetail `63`, passed return and fine calculation, processed the exact-copy FE08 queue, and observed the subsequent Member B notification badge.
- The run stopped on FE12 report readiness because the harness required heading `/Báo cáo mượn sách/i`, while `BorrowingReportPage` renders `Báo cáo mượn/trả`. The canonical system golden-path E2E verifies the `Tổng bản ghi` KPI instead of that stale heading. This is a deterministic ignored-harness locator mismatch, not a demonstrated product FE12 defect.
- Mandatory cleanup returned `CLEANED`: four retained users but zero active users/tokens/members/open loans/open reservations/active books/active copies, with the run-specific copy retained only as inactive history. Four login attempts returned `401`, the old token returned `401`, and the runtime/helper paths returned `404`.
- Fresh post-run checks showed App Service `Running`, Azure SQL `Online`, `/health=200`, `/api/books=200`, transport residue `404/404`, syntax and harness contracts `10/10`, product diff `0`, and local run artifact count `0`. The single H1 attempt is consumed; no rerun or full L1-L4 closeout gate is permitted from this failed L4 acceptance. No live-acceptance task is eligible for closeout.

### FE12 borrowing-report KPI locator H1 retry outcome

- The user granted one H1 to replace the stale FE12 heading locator with the canonical `Tổng bản ghi` KPI, add a regression, and execute one additional live attempt.
- TDD recorded ten existing contracts passing while the eleventh failed against `/Báo cáo mượn sách/i`. After the ignored harness waited for the report `.kpi-card` containing `Tổng bản ghi` and rejected the stale locator, syntax checks and all contracts passed `11/11`. No product/dependency diff was introduced.
- Fresh preflight passed: focused FE04/FE11 Playwright `2/2` in `20.9s` with a clean process exit, public smoke `PASS`, deploy workflow run `30711210037` succeeded for exact SHA `e01585a9aa7d603daf932f7ac6459eaa0752746c`, App Service was `Running` and HTTPS-only, Azure SQL was `Online`, required `DB_*` setting names were present without values, Node `v22.22.2` loaded deployed `mssql`, and remote residue was `404/404`.
- Run `lms-acceptance-20260802-3ea0d609` seeded user IDs `118-121`, book `30`, and copy `54`; aged BorrowDetail `64`; passed every prior locator boundary, exact-copy queue processing, Member B notification, FE12 KPI readiness, Admin audit loading, and all planned negative-authorization/no-mutation assertions.
- The final inspect failed the three-day fine invariant. Exact retained SQL history after cleanup is `FineId=6`, `UserId=118`, `BorrowDetailId=64`, `OverdueDays=2`, `Amount=10000`, `Status=CANCELLED`, `DueDate=2026-07-30`, and `ReturnDate=2026-08-01`. The live return UI had correctly shown `Quá hạn 3 ngày` on Vietnam business date `2026-08-02`.
- Read-only root-cause tracing found that `borrowingService.returnBorrow` computes `returnBusinessDate` but passes raw UTC `returnDate=clock()` to `borrowingRepository.returnBorrowDetail`, which binds it as `sql.Date`. FE09 correctly calculates from the persisted `detail.returnDate`, so this is a genuine FE07 business-date persistence defect exposed downstream in FE09.
- Mandatory cleanup returned `CLEANED`: four retained users but zero active users/tokens/members/open loans/open reservations/active books/active copies, with one run-specific copy retained only as inactive history. Four login attempts and the old token returned `401`; remote residue was `404/404`; local artifact count and product diff were `0`.
- The single H1 attempt is consumed. Do not rerun, change product code, execute full L1-L4 closeout gates, or close tasks under this H1. Product remediation needs a new reviewed H1 with a persisted-date regression, focused FE07/FE09 verification, and a subsequent clean staging acceptance.

---

## File Responsibility Map

### Temporary and ignored — never commit

- `tmp/staging-acceptance/orchestrate.js`: hold Kudu publishing credentials only in memory and own one process-lifetime for runId, raw passwords, seed, browser automation, and mandatory cleanup.
- `tmp/staging-acceptance/fixture.js`: implement `preflight`, `seed`, `inspect`, `age`, `cleanup`, and `verify-cleanup` against deployed staging configuration.
- The temporary implementation intentionally keeps the runner and browser flow in one ignored Node process so raw passwords never cross a process or file boundary.
- `output/playwright/staging-acceptance/<runId>/*.png`: redacted screenshots; excluded from Git.

### Persistent evidence — eligible for commit after H2

- `.sdd/reviews/release-closeout-staging-acceptance-2026-08-02.md`: single source of live acceptance and cleanup evidence.
- `.sdd/specs/feat-membership-management/{PLAN,TASKS,CHANGELOG}.md`: update only FE04 items fully covered by the run and later H2.
- `.sdd/specs/feat-user-role-management/{TASKS,CHANGELOG}.md`: update only FE11 acceptance items fully covered by the run and later H2.
- `.sdd/traceability.yaml`: change only if all required evidence changes a feature status under its existing rules.

### Task 1: Fail-closed Azure and repository preflight

**Files:**

- Read: `docs/deployment/azure-staging-guide.md`
- Read: `.github/workflows/deploy-staging.yml`
- Read: `database/Librarymanagement.sql`
- Read: `backend/src/config/db.js`
- Read: `backend/src/routes/{membership,borrowing,reservation,notification,report,fine}Routes.js`

**Interfaces:**

- Consumes: Azure login, exact resource names, merge/deploy evidence, clean local design branch.
- Produces: `PRECHECK_PASS` or an abort before any staging mutation.

- [ ] **Step 1: Confirm local branch and baseline**

```powershell
git status --short --branch
git rev-parse e01585a9aa7d603daf932f7ac6459eaa0752746c
git merge-base --is-ancestor e01585a9aa7d603daf932f7ac6459eaa0752746c HEAD
```

Expected: current branch contains the baseline; only approved plan documents may be uncommitted.

- [ ] **Step 2: Confirm the live Azure targets without reading secret values**

```powershell
az account show --query "{subscription:id,tenant:tenantId}" -o json
az webapp show --resource-group rg-library-staging --name app-library-api-staging-nhat714 --query "{state:state,host:defaultHostName,httpsOnly:httpsOnly}" -o json
az sql db show --resource-group rg-library-staging --server sql-library-staging-ea-nhat714 --name LibraryManagementStaging --query "{status:status,name:name}" -o json
az webapp config appsettings list --resource-group rg-library-staging --name app-library-api-staging-nhat714 --query "[?starts_with(name,'DB_')].name" -o tsv
```

Expected: the intended subscription/tenant IDs, web app `Running`, exact host, `httpsOnly=true`, database `Online`, and the required DB setting names exist. Do not add Azure account identity fields or remove the query projections; either change would expose PII or secrets.

- [ ] **Step 3: Confirm the deployed SHA and public smoke**

```powershell
gh run view 30711210037 --json headSha,conclusion,url
$env:STAGING_FRONTEND_URL='https://www.thuvienhub.io.vn'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm run smoke:staging
```

Expected: deployed run head is the exact baseline and smoke exits `0`. Clear the two non-secret URL variables after the batch.

- [ ] **Step 4: Confirm no previous acceptance residue matches the new run marker**

Generate a non-secret run ID in memory:

```powershell
$acceptanceRunId = 'lms-acceptance-20260802-' + ([guid]::NewGuid().ToString('N').Substring(0,8))
```

The fixture `preflight` phase must query exact normalized usernames/emails, title, and barcode for this run ID and return zero rows. Any collision aborts.

---

### Task 2: Build and validate the temporary operator harness

**Files:**

- Create temporarily: `tmp/staging-acceptance/kudu-runner.ps1`
- Create temporarily: `tmp/staging-acceptance/orchestrate.ps1`
- Create temporarily: `tmp/staging-acceptance/fixture.js`
- Create temporarily: `tmp/staging-acceptance/acceptance.spec.js`
- Create temporarily: `tmp/staging-acceptance/playwright.config.js`

**Interfaces:**

- Consumes: `runId`, Azure resource names, deployed `backend/src/config/db.js`, local `bcrypt`, Kudu credentials held in memory.
- Produces: manifest IDs, distinct Playwright password environment variables, phase results, cleanup verification.

- [ ] **Step 1: Create the ignored directory and prove Git ignores it**

Create files with `apply_patch`, not shell redirection. Then run:

```powershell
git check-ignore -v tmp/staging-acceptance/kudu-runner.ps1
git check-ignore -v tmp/staging-acceptance/orchestrate.ps1
git check-ignore -v tmp/staging-acceptance/fixture.js
git check-ignore -v tmp/staging-acceptance/acceptance.spec.js
git check-ignore -v tmp/staging-acceptance/playwright.config.js
```

Expected: all five paths are ignored by the root `tmp/` rule.

- [ ] **Step 2: Implement the Kudu runner contract**

`orchestrate.ps1` must run the credential generation, seed, Playwright scenario, inspection, cleanup, token/login verification, and environment clearing in one PowerShell process. It accepts one non-secret parameter:

```powershell
param(
  [Parameter(Mandatory=$true)]
  [ValidatePattern('^lms-acceptance-20260802-[0-9a-f]{8}$')]
  [string]$RunId
)
```

Its top-level structure is fixed:

```powershell
$ErrorActionPreference = 'Stop'
$scenarioStatus = 'NOT_RUN'
$cleanupStatus = 'NOT_RUN'
try {
  # Generate four credentials in memory, seed, and execute the acceptance spec.
  $scenarioStatus = 'PASS'
} catch {
  $scenarioStatus = 'FAIL'
  throw
} finally {
  # Run exact-ID cleanup when a manifest exists, verify cleanup, remove remote files,
  # clear browser/auth environment variables, and null every secret-bearing variable.
}
```

The comments state the only allowed contents of those two blocks; the implementation must use the exact commands and invariants in Tasks 2-4. It must never return before `finally`.

`kudu-runner.ps1` must expose these exact parameters:

```powershell
param(
  [ValidateSet('preflight','seed','inspect','age','cleanup','verify-cleanup')]
  [string]$Phase,
  [Parameter(Mandatory=$true)][string]$RunId,
  [string]$ManifestPath,
  [string]$BorrowDetailId
)
```

It must:

1. call `az webapp deployment list-publishing-credentials` and assign the JSON directly to a PowerShell object;
2. build the Basic header in memory without writing or displaying it;
3. upload `fixture.js` to `/home/site/wwwroot/tmp-staging-acceptance/fixture.js` through Kudu VFS;
4. for `seed`, upload an input JSON containing only runId, account email/username/profile values, password hashes, and role names;
5. for `inspect`, `age`, `cleanup`, and `verify-cleanup`, upload the local non-secret manifest to a run-specific remote input path and delete it after the phase;
6. call Kudu `/api/command` with `node /home/site/wwwroot/tmp-staging-acceptance/fixture.js <phase>` and a fixed working directory;
7. parse stdout as JSON and reject any non-JSON output;
8. delete the remote seed-input file immediately after seed;
9. delete the remote fixture script after `verify-cleanup` or on failure;
10. overwrite credential variables with `$null` in `finally`;
11. never use `Write-Host`, `Write-Output`, `ConvertTo-Json`, or exception dumps on secret-bearing objects.

Expected phase output is the following non-secret envelope:

```json
{
  "runId": "lms-acceptance-20260802-1234abcd",
  "phase": "seed",
  "status": "PASS",
  "ids": {
    "memberAUserId": 1,
    "memberBUserId": 2,
    "librarianUserId": 3,
    "adminUserId": 4,
    "bookId": 1,
    "copyId": 1
  }
}
```

- [ ] **Step 3: Implement the fixture SQL contract**

`fixture.js` must use `sql.Transaction`, `new sql.Request(transaction)`, and `.input(...)` for every dynamic value. Its phases are exact:

```text
preflight:
  assert DB_NAME() = LibraryManagementStaging
  assert required tables/columns and roles ADMIN/LIBRARIAN/MEMBER exist
  assert no normalized username/email/title/barcode collision for runId

seed (one transaction):
  insert four ACTIVE, email-verified Users with four supplied bcrypt hashes
  insert four complete UserProfiles (FullName, Address, DateOfBirth)
  assign one exact role per User through UserRoles
  select one existing ACTIVE Category, Author, Publisher or abort
  insert one ACTIVE Book titled with runId and CreatedBy=adminUserId
  insert one AVAILABLE BookCopy with runId barcode
  return only IDs; do not create Members or MembershipApplications

inspect:
  select exact manifest Users/UserRoles/Members/MembershipApplications
  select exact Book/BookCopy/BorrowRequests/BorrowDetails/Reservations/Fines
  select Notifications and AuditLogs linked to manifest user/entity IDs
  return counts/statuses only; redact metadata text and recipient addresses

age:
  require BorrowDetailId belongs to Member A and manifest CopyId
  require Status='BORROWED'
  require dueDate is a valid YYYY-MM-DD value derived by the operator harness
    from the current Asia/Ho_Chi_Minh business date minus three calendar days
  bind dueDate as a parameterized sql.Date value
  set only DueDate=@dueDate and UpdatedAt=GETDATE()

cleanup (one transaction):
  CANCEL active/notified Reservations for manifest users/copy
  terminalize open BorrowDetails and BorrowRequests for manifest users/copy
  set unpaid fixture Fines to CANCELLED with an acceptance-cleanup reason
  revoke every active AuthToken for the four user IDs
  set Members.Status='INACTIVE'
  set BookCopies.Status='INACTIVE' and Books.Status='INACTIVE'
  set Users.Status='INACTIVE', DeactivatedAt=GETDATE(), UpdatedAt=GETDATE()
  do not delete Notifications, AuditLogs, applications, borrow, reservation, or fine history

verify-cleanup:
  assert zero active Users/AuthTokens/open loans/open reservations/active catalog rows
  assert all four User rows and the book/copy history still exist
  return CLEANED, PARTIAL_CLEANUP, or FAILED_CLEANUP by object ID
```

The script must reject phase/input IDs not belonging to the exact run manifest. It must call `transaction.rollback()` on every failed mutating phase and close the pool in `finally`.

- [ ] **Step 4: Generate four distinct credentials in memory**

Use local Node/bcrypt from the installed backend dependencies; capture stdout into a PowerShell variable and never echo it:

```powershell
$credentialJson = node -e "const c=require('crypto');const b=require('./backend/node_modules/bcrypt');(async()=>{const names=['memberA','memberB','librarian','admin'];const o={};for(const n of names){const p='Acc-'+c.randomBytes(24).toString('base64url')+'!Aa1';o[n]={password:p,hash:await b.hash(p,12)}}process.stdout.write(JSON.stringify(o))})().catch(()=>process.exit(1))"
$acceptanceCredentials = $credentialJson | ConvertFrom-Json
$credentialJson = $null
```

Expected: four unequal passwords, four hashes beginning with `$2`, and no credential output. The seed input receives hashes only; Playwright receives passwords through process environment only.

Use these exact synthetic identities; `<suffix>` is the final eight characters of `$acceptanceRunId` and is not a free-form value:

```text
memberA: username=acc_member_a_<suffix>; email=member-a.<suffix>@lms.invalid; fullName=Acceptance Member A
memberB: username=acc_member_b_<suffix>; email=member-b.<suffix>@lms.invalid; fullName=Acceptance Member B
librarian: username=acc_librarian_<suffix>; email=librarian.<suffix>@lms.invalid; fullName=Acceptance Librarian
admin: username=acc_admin_<suffix>; email=admin.<suffix>@lms.invalid; fullName=Acceptance Admin
all profiles: Address=Staging synthetic fixture; DateOfBirth=2000-01-01; Phone is null
book: Title=Acceptance Book <runId>; ISBN is null
copy: Barcode=ACC-<runId>; Location=STAGING-ACCEPTANCE
```

- [ ] **Step 5: Validate temporary files before Azure execution**

Create `playwright.config.js` with this exact content:

```javascript
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: 'acceptance.spec.js',
  timeout: 180000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
```

```powershell
node --check tmp/staging-acceptance/fixture.js
node --check tmp/staging-acceptance/acceptance.spec.js
node --check tmp/staging-acceptance/playwright.config.js
$parseErrors = $null
[System.Management.Automation.Language.Parser]::ParseFile(
  (Resolve-Path 'tmp/staging-acceptance/kudu-runner.ps1'),
  [ref]$null,
  [ref]$parseErrors
) | Out-Null
if ($parseErrors.Count) { throw 'Temporary Kudu runner has PowerShell parse errors.' }
$parseErrors = $null
[System.Management.Automation.Language.Parser]::ParseFile(
  (Resolve-Path 'tmp/staging-acceptance/orchestrate.ps1'),
  [ref]$null,
  [ref]$parseErrors
) | Out-Null
if ($parseErrors.Count) { throw 'Temporary acceptance orchestrator has PowerShell parse errors.' }
git status --short
```

Expected: syntax checks pass and the ignored temporary files do not appear in Git status.

---

### Task 3: Seed, authenticate, and execute the live UI scenario

**Files:**

- Execute temporarily: `tmp/staging-acceptance/acceptance.spec.js`
- Write ignored artifacts: `output/playwright/staging-acceptance/<runId>/*.png`
- Update ignored manifest: `tmp/staging-acceptance/run/<runId>/manifest.json`

**Interfaces:**

- Consumes: seeded manifest IDs and four runtime password environment variables.
- Produces: role/auth/UI/API/state observations for the exact run.

- [ ] **Step 1: Run preflight and seed**

Invoke the temporary runner in this order:

```powershell
& tmp/staging-acceptance/kudu-runner.ps1 -Phase preflight -RunId $acceptanceRunId
& tmp/staging-acceptance/kudu-runner.ps1 -Phase seed -RunId $acceptanceRunId
```

Expected: both phases return `PASS`; seed returns exactly six positive IDs. Write only those IDs, timestamps, baseline SHA, host names, and phase status to the local manifest.

Define the manifest and Playwright process environment without printing values:

```powershell
$manifestDirectory = Join-Path 'tmp/staging-acceptance/run' $acceptanceRunId
$manifestPath = Join-Path $manifestDirectory 'manifest.json'
$suffix = $acceptanceRunId.Substring($acceptanceRunId.Length - 8)
$env:STAGING_FRONTEND_URL = 'https://www.thuvienhub.io.vn'
$env:STAGING_API_URL = 'https://app-library-api-staging-nhat714.azurewebsites.net'
$env:STAGING_MEMBER_A_EMAIL = "member-a.$suffix@lms.invalid"
$env:STAGING_MEMBER_B_EMAIL = "member-b.$suffix@lms.invalid"
$env:STAGING_LIBRARIAN_EMAIL = "librarian.$suffix@lms.invalid"
$env:STAGING_ADMIN_EMAIL = "admin.$suffix@lms.invalid"
$env:STAGING_MEMBER_A_PASSWORD = $acceptanceCredentials.memberA.password
$env:STAGING_MEMBER_B_PASSWORD = $acceptanceCredentials.memberB.password
$env:STAGING_LIBRARIAN_PASSWORD = $acceptanceCredentials.librarian.password
$env:STAGING_ADMIN_PASSWORD = $acceptanceCredentials.admin.password
```

The manifest directory and JSON are created with `apply_patch`/the operator harness, never shell redirection. The JSON excludes all eight password/hash fields.

Run the remote acceptance spec with no local web server:

```powershell
npx playwright test --config tmp/staging-acceptance/playwright.config.js --workers=1
```

Expected: exactly one temporary acceptance test is collected. A test assertion failure is recorded as scenario `FAIL` and still triggers Task 4 cleanup.

- [ ] **Step 2: Execute role/auth and membership behavior through the UI**

The Playwright spec must use the exact deployed URLs and perform:

```text
Member A login -> /home -> /membership -> Gửi đơn đăng ký -> PENDING
Member A logout; old protected UI context no longer works
Member B login -> /membership -> Gửi đơn đăng ký -> PENDING -> logout
Admin login -> /admin/users -> Duyệt hội viên
  -> approve Member A and Member B through the review dialogs
  -> verify both membership rows/state are APPROVED
Admin UI at 1440x900, 1366x768, 1280x720, 390x844:
  -> exactly eight sidebar items
  -> Membership Review follows All Users
  -> Permissions absent
  -> user and membership cards appear before horizontal overflow
  -> audit action labels are Vietnamese and row detail remains allowlisted/read-only
```

Capture screenshots only after ensuring credential fields, tokens, cookies, emails, and raw audit metadata are not visible.

- [ ] **Step 3: Execute negative server authorization checks**

Capture access tokens only inside the Playwright process and assert:

```text
unauthenticated GET /api/admin/audit-logs -> 401
Member A GET /api/admin/audit-logs -> 403
Member A GET /api/users?page=1 -> 403
Librarian GET /api/users?page=1 -> 403
Member A POST /api/reservations/process-queue -> 403
Admin PUT /api/users/<synthetic-librarian-id> with fullName + exact expectedUpdatedAt -> 404 and no profile change, matching the retired route in approved Q-FE11-029/FR-FE11-028
```

Record method/path/status only. Never attach request headers or bodies containing tokens.

- [ ] **Step 4: Execute the cross-role circulation flow**

Use these UI actions/selectors and expected transitions:

```text
Member A /borrowing/new
  -> choose the run-specific title/copy
  -> click Gửi yêu cầu mượn
  -> success Yêu cầu #<id> đã được tạo

Librarian /librarian/borrow-requests
  -> locate run-specific request
  -> Duyệt -> Duyệt và cấp sách
  -> success Đã duyệt yêu cầu

Member B /reservations/mine
  -> locate run-specific candidate
  -> Đặt chỗ
  -> success and ACTIVE queue state
```

Run `inspect`, extract the exact Member A `BorrowDetailId`, then run `age` for that ID. Refresh `/librarian/returns` and assert the row is overdue.

```powershell
$inspection = & tmp/staging-acceptance/kudu-runner.ps1 -Phase inspect -RunId $acceptanceRunId -ManifestPath $manifestPath
$borrowDetailId = [int](($inspection | ConvertFrom-Json).ids.memberABorrowDetailId)
if ($borrowDetailId -le 0) { throw 'Member A borrow detail was not found in the exact manifest.' }
& tmp/staging-acceptance/kudu-runner.ps1 -Phase age -RunId $acceptanceRunId -ManifestPath $manifestPath -BorrowDetailId $borrowDetailId
```

Continue through UI:

```text
Librarian /librarian/returns
  -> Xác nhận trả sách -> Ghi nhận trả sách
  -> returned success and queue handoff visible

Librarian /librarian/fines
  -> Tính tiền phạt
  -> enter exact BorrowDetailId
  -> Tính từ dữ liệu mượn trả
  -> one UNPAID fine with positive overdueDays and amount

Librarian /librarian/reservations
  -> Giữ sách & thông báo -> Xác nhận giữ sách
  -> Member B reservation becomes NOTIFIED/ready

Member B /notifications
  -> reservation-ready notification belongs to Member B
  -> link opens /reservations/mine and run-specific row is ready

Librarian /reports/borrowing and /home
  -> report/operations cards reflect server state without browser errors

Admin /admin/users -> Audit
  -> expected membership/circulation actors/actions appear without secret fields
```

- [ ] **Step 5: Assert manifest invariants**

Run `inspect` and require:

```text
Member A and Member B membership = APPROVED
Member A BorrowDetail = RETURNED
run-specific copy = RESERVED after queue processing
Member B reservation = NOTIFIED
exactly one fixture fine = UNPAID with amount > 0
Member B has reservation-ready notification
all four users retain exactly one intended role
no row outside manifest IDs is reported as changed by fixture phases
browser console/page errors = []
```

Any mismatch marks the scenario `FAIL` but still proceeds to Task 4 cleanup.

---

### Task 4: Cleanup in finally and prove deactivation

**Files:**

- Execute temporarily: `tmp/staging-acceptance/{kudu-runner.ps1,fixture.js}`
- Update ignored manifest: cleanup status per exact object ID.

**Interfaces:**

- Consumes: exact manifest IDs whether Task 3 passed or failed.
- Produces: `CLEANED`, `PARTIAL_CLEANUP`, or `FAILED_CLEANUP` plus post-cleanup auth checks.

- [ ] **Step 1: Logout every browser context and clear local auth state**

The Playwright `finally` block must call the product logout flow where reachable, then clear cookies, localStorage, and sessionStorage for every context. It must retain one previously issued token only in memory for the revocation assertion.

- [ ] **Step 2: Run exact-ID cleanup and verification**

```powershell
& tmp/staging-acceptance/kudu-runner.ps1 -Phase cleanup -RunId $acceptanceRunId -ManifestPath $manifestPath
& tmp/staging-acceptance/kudu-runner.ps1 -Phase verify-cleanup -RunId $acceptanceRunId -ManifestPath $manifestPath
```

Expected: every object status is `CLEANED`; no wildcard cleanup and no physical delete occurred.

- [ ] **Step 3: Prove credentials and tokens no longer work**

Through Playwright/API request context:

```text
login for each of four accounts -> 401 INVALID_CREDENTIALS
GET /api/auth/me with the retained old token -> 401
GET /api/books does not expose the run-specific inactive book
```

Record status/error code only.

- [ ] **Step 4: Remove all secret-bearing temporary state**

Clear `$acceptanceCredentials` and all `STAGING_*_PASSWORD` variables, delete the exact remote input/script through Kudu, then delete local temporary source files with `apply_patch`. Keep only the non-secret manifest until the review record is complete; then remove it after verifying the persistent record contains all required evidence.

Clear environment variables explicitly:

```powershell
$acceptanceCredentials = $null
@(
  'STAGING_MEMBER_A_PASSWORD','STAGING_MEMBER_B_PASSWORD',
  'STAGING_LIBRARIAN_PASSWORD','STAGING_ADMIN_PASSWORD'
) | ForEach-Object { Remove-Item -LiteralPath "Env:$_" -ErrorAction SilentlyContinue }
```

If cleanup is not `CLEANED`, stop: do not rerun, do not remove the manifest, and do not close any live-acceptance task.

---

### Task 5: Write evidence and conditionally reconcile task status

**Files:**

- Create: `.sdd/reviews/release-closeout-staging-acceptance-2026-08-02.md`
- Modify conditionally: `.sdd/specs/feat-membership-management/{PLAN,TASKS,CHANGELOG}.md`
- Modify conditionally: `.sdd/specs/feat-user-role-management/{TASKS,CHANGELOG}.md`
- Modify conditionally: `.sdd/traceability.yaml`

**Interfaces:**

- Consumes: redacted scenario matrix, exact SHA/run URLs, cleanup proof, H2 decision.
- Produces: truthful persistent evidence and only supported checkbox/status changes.

- [ ] **Step 1: Create the review record with the exact section structure**

Before writing the live closeout decision, rerun the two focused local browser suites that own the historical Windows teardown gap:

```powershell
npx playwright test tests/e2e/fe04-admin-membership-review.spec.js tests/e2e/fe11-admin-request-management.spec.js --project=chromium --workers=1
```

Expected: assertions pass and the Playwright process exits `0` without a webServer teardown timeout. Preserve the exit result and responsive screenshot/overflow evidence; do not mark the local gap complete if the process hangs or times out.

```markdown
# Release Closeout Staging Acceptance - 2026-08-02

## Decision
## Baseline and deployed targets
## Synthetic fixture contract
## Authenticated role matrix
## Cross-role scenario matrix
## Desktop/mobile UX matrix
## Negative authorization matrix
## Server-derived invariant evidence
## Cleanup and token revocation evidence
## Task closeout decision table
## Residual risks and owners
```

Every matrix row includes actor, UI route, API method/path, expected state, actual state, PASS/FAIL, and redacted artifact name. Do not include credentials, token/cookie/header values, raw audit metadata, or full synthetic emails.

- [ ] **Step 2: Apply the closeout decision table exactly**

```text
FE04-ADM05:
  eligible only after FE04-ADM04 and FE04-CONV-001 are eligible, scenario PASS, cleanup CLEANED, desktop/mobile PASS, and combined H2 approval.

FE04-CONV-001:
  eligible only if the focused local FE04/FE11 Playwright command exits 0 without the historical Windows webServer teardown timeout and preserves responsive screenshot/overflow evidence.

FE04-ADM04:
  eligible only under the same clean-exit focused local Playwright evidence as FE04-CONV-001.

FE04-CONV-002:
  remains open unless the same evidence also contains explicit cross-feature owner confirmation and final human release approval.

FE11-UXR07:
  eligible after authenticated Azure desktop/mobile PASS + cleanup CLEANED + combined H2 approval.

FE11-UXR08:
  eligible only if all eight-item sidebar, no Permissions, responsive users, audit density/filter/allowlist, and four viewport assertions PASS.

FE11-UXR09:
  eligible only if FE04-ADM05 is also eligible and Membership Review is proven in the native eight-item Admin shell at all four viewports.

FE11-PDO04:
  eligible only if existing source/test evidence is revalidated and live Admin UI exposes no profile-edit action, while a direct request to the retired personal-profile route returns 404 without changing data.
```

Failed or uncovered items keep `[ ]`; add evidence text without converting them to complete.

- [ ] **Step 3: Run four-layer validation**

```powershell
npm --prefix backend test -- --runInBand
npm --prefix backend run test:coverage:ci
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run audit:high
npm run test:system
npm run test:e2e
npm run test:deployment
npm run trace:enforce
npm run test:secrets
git diff --check
```

Expected: every configured gate exits `0`; frontend audit may print only the already-controlled React Router advisory and its guard must pass.

- [ ] **Step 4: Stop for combined H2 review**

Present the persistent diff, exact validation counts, scenario decision, cleanup decision, and list of tasks kept open. Do not commit, push, open a PR, merge, or remove remaining evidence until the user grants H2.
