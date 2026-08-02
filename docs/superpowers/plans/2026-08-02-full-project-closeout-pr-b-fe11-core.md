# Full Project Closeout PR B FE11 Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` and `test-driven-development` task-by-task. Keep the complete persistent diff uncommitted until Nhat approves H2. Core SQL/runtime evidence must fail closed; a skipped mutable suite is not acceptance evidence.

**Goal:** Reconcile FE11's approved account-lifecycle, single-role and permission requirements against the implementation, close the one confirmed permission-surface reachability defect, raise honest source traceability from 35/43 to 43/43, and produce reviewable local/SQL/browser evidence without changing the public API, schema, roles, dependencies or the eight-entry Admin sidebar.

**Architecture:** Existing backend account creation, actor revalidation, deactivation, refresh-token revocation, role replacement and permission-read behavior are retained unless a named RED test proves a defect. The only planned product behavior change is to expose the existing read-only `AdminPermissionsSection` from inside `AdminUsersSection`; the standalone ninth navigation item remains forbidden. Unit/repository tests characterize already-correct Core behavior, a new fail-closed disposable SQL suite proves committed invariants on SQL Server, and focused Playwright proves the embedded permission surface at desktop/mobile sizes.

**Tech Stack:** Node.js 22, Express 5, SQL Server 2022, Jest 30, React 19, Vite 8, Node test runner, Playwright Chromium, PowerShell, Hybrid SDD + ADD.

## Approved baseline and authority

- Worktree: `.worktrees/full-project-closeout-pr-b-fe11`.
- Branch: `feat/full-project-closeout-pr-b-fe11`.
- Starting baseline: `origin/main@042d61907c0ae5a6577ab9d40d5e78601fb4e147`, the exact PR A merge commit.
- Approved design: `docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md`.
- Approved decisions:
  - `BD-003`: assigning the current sole role is an idempotent canonical-DTO no-op and writes no role-change audit;
  - `BD-004`: role changes atomically replace all mappings with exactly one approved role;
  - `BD-005`: preserve exactly eight Admin navigation entries and expose the read-only permission matrix inside the existing user/role-management surface.
- Normative ownership: FE03 owns self-service `fullName`/`phone`/`address`; FE02 owns any future verified email change; FE11 does not expose `PUT /api/users/{userId}` for existing-profile edits.
- Existing immutable evidence remains historical evidence only. A green test or prior deployment does not override a contradictory current SPEC row.
- The original checkout at `D:\SWP391\library-management-system` is user-owned and dirty. Do not edit, stage, stash or clean it.

## Baseline observations already reproduced

| Evidence | Observed result on `042d6190` |
| --- | --- |
| Focused FE11 backend | 8 suites, 176/176 PASS |
| Focused FE11 frontend | 36/36 PASS |
| Focused FE11 Playwright | 1/1 PASS with clean exit |
| Deployment contracts | 20/20 PASS |
| `trace:enforce` | FE11 35/43, 81%, `PARTIAL` |

The audit found two different classes of work:

1. **Observed documentation/trace drift:** current code/tests already prove duplicate handling, actor revalidation, atomic deactivation, stale/self/loan guards, same-role no-op, legacy role normalization and single-role schema enforcement, while several SPEC trace rows still say `Chưa bắt đầu` or describe superseded grant/revoke semantics.
2. **Confirmed product defect:** `AdminPermissionsSection` exists and `GET /api/admin/permissions` is Admin-only, but after removal of the ninth sidebar item there is no reachable UI control that sets `activeSection` to `permissions`. `FR-FE11-032` therefore cannot be completed from the current Admin UI.

## Considered implementation approaches

| Approach | Result | Decision |
| --- | --- | --- |
| Add tags/docs only | Raises coverage but leaves the permission matrix unreachable | Rejected |
| Restore `Permissions` as a ninth sidebar entry | Makes the page reachable but violates `BD-005`, `BR-FE11-016` and `FR-FE11-030` | Rejected |
| Add a lazy read-only matrix toggle inside `AdminUsersSection` | Preserves eight entries, reuses the existing Admin-only API/component and keeps role mutation separate | **Selected** |

## File responsibility map

### Planned production modifications

- `frontend/src/page/admin/users/AdminUsersSection.jsx`: add the lazy show/hide permission-matrix control and mount the existing read-only matrix inside the user/role surface.
- `frontend/src/page/admin/permissions/AdminPermissionsSection.jsx`: support an embedded heading mode without creating a second page-level `h1`; keep all permission data read-only.
- `backend/src/routes/userManagementRoutes.js`: add precise source trace annotations for the intentionally retired profile-update boundary; no route is added.
- `backend/src/services/userManagementService.js`: add precise source trace annotations for stale deactivation and same-role canonical readback; no behavior change is planned.
- `backend/src/repositories/userLifecycleRepository.js`: add the proven stale-state trace annotation; no SQL behavior change is planned.
- `backend/src/repositories/userRoleRepository.js`: add the proven no-op/legacy-normalization/single-role trace annotations; no SQL behavior change is planned.

### Planned test modifications/additions

- `backend/tests/accountSetupRepository.test.js`: add requirement labels to the existing duplicate/actor/no-partial-state evidence; no weaker assertion is allowed.
- `backend/tests/userManagementService.test.js`: add requirement labels and retain safe error/DTO assertions for duplicate, stale, no-op and actor outcomes.
- `backend/tests/userManagementRoutes.test.js`: add explicit safe HTTP-envelope characterization for duplicate, stale and retired-profile paths.
- `backend/tests/userLifecycleRepository.test.js`: label and retain actor/self/pending/stale/loan/rollback evidence.
- `backend/tests/userRoleRepository.test.js`: add the missing zero-current-mapping normalization case and label same-role/multiple-role/last-admin/rollback evidence.
- `backend/tests/fe11SchemaMigration.test.js`: label the existing `UX_UserRoles_UserId` invariant.
- `backend/tests/adminPermissionService.test.js`: label the deterministic read-only allowlist.
- `backend/tests/adminPermissionRoutes.test.js`: label Admin/Member/Librarian isolation and safe payload behavior.
- `backend/tests/helpers/systemIntegrationHarness.js`: expose the production read-only permission policy through the existing in-memory Admin E2E service; no database behavior is added.
- `backend/tests/sql/fe11Core.sqltest.js`: new fail-closed disposable SQL evidence for account, lifecycle, role, audit and credential invariants.
- `frontend/test/userManagementFrontend.test.js`: RED/GREEN contract for an embedded permission surface and unchanged eight-entry navigation.
- `frontend/test/adminPermissions.test.js`: label/read-only matrix derivation and ensure no local mutation path is introduced.
- `tests/e2e/fe11-admin-request-management.spec.js`: extend the existing FE11 Admin journey to open/hide the matrix and verify desktop/mobile accessibility without a ninth sidebar item.

### Planned SDD/evidence modifications

- `.sdd/specs/feat-user-role-management/SPEC.md`: reconcile CF-001..CF-004, correct stale trace rows and document the embedded permission path.
- `.sdd/specs/feat-user-role-management/PLAN.md`: append the bounded PR B implementation and validation contract.
- `.sdd/specs/feat-user-role-management/TASKS.md`: add/track the PR B closeout tasks and keep `Implementation State: PARTIAL` until exact post-merge staging evidence exists.
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`: record the bounded implementation and local evidence without inventing merge/deploy IDs.
- `.sdd/reviews/full-project-closeout-pr-b-fe11-validation-2026-08-02.md`: new H2 validation record containing RED/GREEN, L1-L4, SQL cleanup and residual-gate truth.
- `docs/superpowers/plans/2026-08-02-full-project-closeout-pr-b-fe11-core.md`: this approved executable plan.

### Explicitly unchanged

- No database schema or migration file.
- No public endpoint, request/response contract, role or permission-edit API.
- No `frontend/src/page/admin/adminNavigation.js` change; it remains exactly eight entries.
- No `frontend/src/page/admin/AdminConsolePage.jsx` change; the embedded path is owned entirely by `AdminUsersSection`.
- No dependency, lockfile, workflow, release tag or staging credential change.
- No FE02, FE03, FE04, FE07, FE10 or FE12 production edit.

---

### Task 1: Revalidate the PR B gate and requirement ledger

**Files:**

- Read: `docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md`
- Read: `.sdd/specs/feat-user-role-management/{CONTEXT,SPEC,PLAN,TASKS,TEST_PLAN,CHANGELOG}.md`
- Read: all production/test files listed in the responsibility map.

**Interfaces:** Consumes PR A exact merge evidence. Produces a fixed requirement-to-code-to-test ledger for Tasks 2-6.

- [ ] **Step 1: Confirm branch, baseline and clean isolation**

Run:

```powershell
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git check-ignore -v .worktrees
git -C D:\SWP391\library-management-system status --short --branch
```

Expected: PR B branch at `042d61907c0ae5a6577ab9d40d5e78601fb4e147`, no unexpected PR B changes except this plan, `.worktrees` ignored, and the original checkout still has its pre-existing 11 dirty paths. Stop if `origin/main` moved or the original dirty set changed.

- [ ] **Step 2: Reproduce the focused baseline**

Run:

```powershell
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/accountSetupRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/userLifecycleRepository.test.js tests/userRoleRepository.test.js tests/userRepository.test.js tests/adminPermissionService.test.js tests/adminPermissionRoutes.test.js
node --test frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js frontend/test/adminPermissions.test.js frontend/test/adminConsoleStructure.test.js
npx.cmd playwright test tests/e2e/fe11-admin-request-management.spec.js --project=chromium
npm.cmd run test:deployment
npm.cmd run trace:enforce
```

Expected: reproduce 176 backend PASS, 36 frontend PASS, 1 focused Playwright PASS, 20 deployment PASS, and FE11 35/43 at 81% `PARTIAL`. Any different failure is diagnosed before editing.

- [ ] **Step 3: Freeze the reconciliation ledger**

Record these classifications in the validation file before product edits:

| Group | Normative IDs | Baseline implementation/test | Planned action |
| --- | --- | --- | --- |
| Create/duplicate/no partial state | FR-003/005/009/017/021/022/037, AC-003/005/010/020 | Implemented and focused tests green | Characterize/tag; product change only if a new assertion fails |
| Actor revalidation | FR-017, BR-001/002/024/025 | Implemented under transaction locks | Characterize/tag |
| Deactivation/credentials/audit | FR-008/011/018/019/023/041, AC-007/009/012/023 | Implemented and focused tests green | Characterize/tag + disposable SQL proof |
| Role replacement/no-op/legacy | FR-012..014/024..027, AC-013..015 | Implemented; zero-mapping case missing | Add zero-mapping test, tags and SQL proof |
| Permission matrix/eight nav | FR-030/032, AC-016/017, BD-005 | API/component implemented; UI entry unreachable | RED then minimal embedded UI fix |
| Role isolation/safe DTO/errors | FR-001/002/015/016/017/024/032 | Implemented and focused tests green | Characterize/tag; no envelope expansion |

Stop if implementing the ledger requires a schema, endpoint, role, dependency or file outside the approved boundary.

---

### Task 2: Write the permission-surface RED tests

**Files:**

- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `tests/e2e/fe11-admin-request-management.spec.js`

**Interfaces:** Produces a failing contract for `BD-005`, `FR-FE11-030`, `FR-FE11-032`, `AC-FE11-016` and `AC-FE11-017`.

- [ ] **Step 1: Add the source-structure RED**

Extend the FE11 frontend contract to require all of the following:

- `AdminUsersSection` exposes a button named `Xem ma trận quyền`;
- the button lazily mounts `AdminPermissionsSection` with embedded mode;
- a mounted matrix can be hidden without changing the active Admin navigation section;
- `adminNavigation.js` still has exactly eight approved entries and no `permissions` entry;
- no permission mutation control or endpoint is introduced.

Run:

```powershell
node --test frontend/test/userManagementFrontend.test.js frontend/test/adminPermissions.test.js frontend/test/adminConsoleStructure.test.js
```

Expected RED: the new assertion fails because `AdminUsersSection` has no matrix control or embedded component. Existing assertions remain green.

- [ ] **Step 2: Add the browser RED**

In the existing `E2E-FE11-ACC01` journey, after Admin login and before leaving user management:

1. assert eight navigation buttons and no sidebar `Phân quyền` item;
2. click `Xem ma trận quyền`;
3. wait for `GET /api/admin/permissions` and assert HTTP 200;
4. assert the three role headings and the read-only permission table are visible;
5. check no document horizontal overflow at `1366x768` and `390x844`;
6. click `Ẩn ma trận quyền` and assert the matrix unmounts.

Run:

```powershell
npx.cmd playwright test tests/e2e/fe11-admin-request-management.spec.js --project=chromium
```

Expected RED: the test fails at the missing `Xem ma trận quyền` control, not at fixture setup, login or server startup.

---

### Task 3: Implement the minimal embedded read-only permission surface

**Files:**

- Modify: `frontend/src/page/admin/users/AdminUsersSection.jsx`
- Modify: `frontend/src/page/admin/permissions/AdminPermissionsSection.jsx`

**Interfaces:** Reuses existing `adminApi.permissions()` -> `GET /api/admin/permissions`; does not add a request, response field or mutation.

- [ ] **Step 1: Add lazy parent ownership**

In `AdminUsersSection.jsx`:

- import `AdminPermissionsSection`;
- add boolean state initialized to `false`;
- add a quiet `AdminActionButton` beside `Thêm người dùng` whose label toggles between `Xem ma trận quyền` and `Ẩn ma trận quyền`;
- conditionally mount `<AdminPermissionsSection embedded />` directly below the page header;
- leave user list, role modal, deactivation, filters and all eight sidebar entries unchanged;
- add only verified `@spec` annotations for `FR-FE11-004`, `FR-FE11-007` and `FR-FE11-010` at the existing-profile action boundary.

- [ ] **Step 2: Make the reused component semantically embeddable**

In `AdminPermissionsSection.jsx`:

- accept `embedded = false`;
- in embedded mode render the matrix title as `h2` using existing Admin header classes; the parent page retains the sole page-level `h1`;
- keep refresh, loading, retry, empty-state, role summary, module coverage and matrix logic unchanged;
- keep the component read-only: no form field, save button or mutation function;
- preserve the existing safe default of empty arrays for malformed/missing response fields.

- [ ] **Step 3: Run GREEN**

Run:

```powershell
node --test frontend/test/userManagementFrontend.test.js frontend/test/adminPermissions.test.js frontend/test/adminConsoleStructure.test.js
npx.cmd playwright test tests/e2e/fe11-admin-request-management.spec.js --project=chromium
```

Expected: all focused frontend tests and the one Playwright journey pass; the Playwright process exits cleanly and the sidebar count remains eight.

---

### Task 4: Complete Core characterization and honest source traceability

**Files:**

- Modify: `backend/src/routes/userManagementRoutes.js`
- Modify: `backend/src/services/userManagementService.js`
- Modify: `backend/src/repositories/userLifecycleRepository.js`
- Modify: `backend/src/repositories/userRoleRepository.js`
- Modify: focused backend/frontend test files named in the responsibility map.

**Interfaces:** No public behavior change. Produces proof for the eight currently untagged FR IDs: 004, 007, 010, 020, 023, 025, 026 and 027.

- [ ] **Step 1: Add focused characterization assertions before tags**

Add or tighten these cases:

- retired `PUT /api/users/{id}` returns 404 for personal, work-field and mixed payloads and never calls a management service;
- duplicate normalized email maps to 409 before delivery and has no source mutation/audit/token/notification;
- stale deactivation maps to 409 and performs no user/token/audit DML;
- same-role repository result commits no UserRoles/token/audit DML and service returns canonical safe readback;
- zero legacy mappings and multiple legacy mappings both normalize to one selected mapping on explicit replacement;
- schema source contains `UX_UserRoles_UserId`, and account creation/replacement always inserts one role;
- Member/Librarian access to permission and user-management endpoints remains 403 before service/controller work;
- safe DTO/error assertions reject password/token/session/stack fields.

Run:

```powershell
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/fe11SchemaMigration.test.js tests/accountSetupRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/userLifecycleRepository.test.js tests/userRoleRepository.test.js tests/userRepository.test.js tests/adminPermissionService.test.js tests/adminPermissionRoutes.test.js
```

Expected: characterization cases for existing correct behavior may pass immediately. Record them as `BASELINE-PASS`, not fabricated RED. If any case fails, diagnose with `systematic-debugging`; edit production only when the failure proves an approved requirement gap.

- [ ] **Step 2: Add source tags only after proof**

Map tags as follows:

| Missing ID | Source location | Exact proof |
| --- | --- | --- |
| FR-FE11-004/007/010 | `AdminUsersSection.jsx` and retired route boundary | only role/deactivate actions; no profile/work-field editor |
| FR-FE11-020 | `userManagementRoutes.js` retired-path boundary | direct PUT stays 404 and writes nothing |
| FR-FE11-023 | lifecycle repository/service | effective timestamp mismatch returns stale before DML |
| FR-FE11-025 | role repository/service | same sole role returns canonical readback without audit |
| FR-FE11-026 | role repository | zero/multiple mappings normalize through delete+one insert |
| FR-FE11-027 | role repository plus schema test | replacement always leaves one; unique index enforces at most one |

Run:

```powershell
npm.cmd run trace:enforce
```

Expected: FE11 is 43/43 and 100%, but remains `PARTIAL` until post-merge staging acceptance and final closeout evidence. Do not set `COMPLETE` merely because coverage is 100%.

---

### Task 5: Prove FE11 Core invariants on a disposable SQL Server database

**Files:**

- Create: `backend/tests/sql/fe11Core.sqltest.js`
- Generate temporarily/ignored: `tmp/azure/LibraryManagementStaging.sql`
- Use temporarily: database `LibraryManagement_FE11_PRB_20260802` on local `MSSQLSERVER` only.

**Interfaces:** Exercises the real repositories against a disposable non-staging SQL database. Every dynamic value is parameterized. The suite owns and cleans only run-prefixed synthetic rows.

- [ ] **Step 1: Write the fail-closed SQL suite**

The suite must throw before tests if any of these are false:

- `DB_SERVER`, `DB_NAME` are present;
- `DB_NAME === 'LibraryManagement_FE11_PRB_20260802'`;
- `FE11_SQL_TEST_ALLOW_MUTATION === 'true'`;
- the database name does not contain `Staging`, `Prod` or `Production` case-insensitively.

Do not use `describe.skip`. Use random run-prefixed `example.test` identities and retain exact inserted IDs for cleanup. Test these database outcomes:

1. inactive/non-Admin actor cannot create, deactivate or replace role and no source/audit row changes;
2. duplicate normalized email returns `EMAIL_ALREADY_EXISTS`, with no additional user/profile/role/token/audit rows;
3. stale deactivation, self-deactivation, pending activation and active borrowed detail each reject before lifecycle/token/audit DML;
4. successful ACTIVE and LOCKED deactivation atomically sets `INACTIVE`/`DeactivatedAt`, revokes active REFRESH tokens and inserts exactly one `USER_DEACTIVATE` audit;
5. same-role replacement changes no mapping/token/audit and returns `UNCHANGED`;
6. valid replacement leaves exactly one mapping, revokes active REFRESH tokens and writes one `USER_ROLE_REPLACE` audit;
7. a second direct UserRoles insert for one user is rejected by `UX_UserRoles_UserId`;
8. injected audit failure rolls back lifecycle/role/token changes. Implement the injection only in the disposable database with a test-owned trigger named `TR_FE11_PRB_AuditFail` that throws when the inserted `UserAgent` equals `fe11-prb-force-audit-failure`; drop the trigger in `afterEach`/`afterAll` and fail cleanup if it remains.

`afterEach` and `afterAll` must drop only the exact test trigger, delete only exact synthetic IDs in foreign-key-safe order and close/reset the pool. Cleanup failure fails the suite.

- [ ] **Step 2: Create and verify the exact disposable target**

Run from the PR B worktree:

```powershell
$fe11Db = 'LibraryManagement_FE11_PRB_20260802'
sqlcmd -S localhost -E -b -Q "IF DB_ID(N'$fe11Db') IS NOT NULL THROW 51000, 'Refusing to overwrite existing FE11 database.', 1; CREATE DATABASE [$fe11Db];"
npm.cmd run schema:azure:prepare
sqlcmd -S localhost -E -b -d $fe11Db -i tmp/azure/LibraryManagementStaging.sql
sqlcmd -S localhost -E -b -d $fe11Db -Q "SET NOCOUNT ON; SELECT DB_NAME() AS DatabaseName, COUNT(*) AS RoleCount FROM Roles;"
```

Expected: a newly created exact database, schema application success and the approved role seed. If the database already exists, stop and inspect; never reuse or overwrite it silently.

- [ ] **Step 3: Run mutable SQL GREEN and prove cleanup**

Run:

```powershell
$env:DB_SERVER = 'localhost'
$env:DB_NAME = 'LibraryManagement_FE11_PRB_20260802'
$env:DB_ENCRYPT = 'false'
$env:DB_TRUST_SERVER_CERTIFICATE = 'true'
$env:FE11_SQL_TEST_ALLOW_MUTATION = 'true'
npm.cmd --prefix backend test -- --runInBand --testMatch "**/fe11Core.sqltest.js"
sqlcmd -S localhost -E -b -d LibraryManagement_FE11_PRB_20260802 -Q "SET NOCOUNT ON; IF EXISTS (SELECT 1 FROM Users WHERE Email LIKE 'fe11prb-%@example.test') THROW 51001, 'FE11 fixture cleanup incomplete.', 1; SELECT 'CLEANED' AS CleanupStatus;"
```

Expected: every mutable case passes, none is skipped, and cleanup prints `CLEANED`.

- [ ] **Step 4: Drop only the verified disposable target**

Run:

```powershell
$fe11Db = 'LibraryManagement_FE11_PRB_20260802'
sqlcmd -S localhost -E -b -Q "IF DB_ID(N'$fe11Db') IS NULL THROW 51002, 'Expected FE11 disposable database is missing.', 1; IF EXISTS (SELECT 1 FROM [$fe11Db].sys.tables WHERE name = N'Users') BEGIN ALTER DATABASE [$fe11Db] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$fe11Db]; END ELSE THROW 51003, 'Refusing to drop an unverified database.', 1;"
sqlcmd -S localhost -E -b -Q "IF DB_ID(N'$fe11Db') IS NOT NULL THROW 51004, 'FE11 disposable database cleanup failed.', 1; SELECT 'DROPPED' AS DatabaseCleanup;"
```

Expected: only the exact disposable database is dropped and verification prints `DROPPED`.

---

### Task 6: Reconcile FE11 SDD truth and write the H2 validation record

**Files:**

- Modify: `.sdd/specs/feat-user-role-management/SPEC.md`
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Create: `.sdd/reviews/full-project-closeout-pr-b-fe11-validation-2026-08-02.md`

**Interfaces:** Produces current, evidence-backed `PARTIAL` PR B truth; exact post-merge staging and final feature completion remain downstream facts.

- [ ] **Step 1: Correct only the approved conflicts and stale rows**

In `SPEC.md`:

- correct FR-FE11-025's trace row to the `BD-003` idempotent no-op wording;
- replace obsolete independent grant/revoke wording for FR-FE11-026/027 with `BD-004` replacement/normalization/index wording;
- state that `FR-FE11-032` is reached from the embedded matrix inside user/role management and does not create a ninth sidebar entry;
- update `AC-FE11-005/007/009/010/012/013/014/015/017/023` and `FR-FE11-016..019/021/023/025..027/032` only to the level proven by named tests/SQL/browser evidence;
- retain historical evidence as historical and keep staging/human status open where the current PR has not yet deployed.

In `PLAN.md`, append the PR B scope, chosen embedded approach, SQL gate and post-merge acceptance handoff. In `TASKS.md`, add bounded `FE11-CLB01..FE11-CLB06` tasks for ledger, permission RED/GREEN, Core characterization, SQL evidence, local L1-L4 and post-merge acceptance. Check only tasks with evidence already present; keep the post-merge acceptance task unchecked and keep `Implementation State: PARTIAL`.

- [ ] **Step 2: Write the validation record**

The record must contain:

- exact starting SHA and branch;
- source ledger and decisions BD-003/004/005;
- actual RED failure text/counts for the permission surface;
- focused GREEN counts;
- disposable SQL target, non-skipped results, exact cleanup result and database drop proof;
- L1 commands/counts, L2 mapping, L3 security review and L4 local browser matrix;
- exact persistent file list and `git diff --check` result;
- residual gate: staging exact-SHA acceptance and final `Implementation State: COMPLETE` remain in PR D after PR B merge/deploy evidence.

Do not include passwords, hashes, tokens, cookies, authorization headers, connection strings, full synthetic emails or raw audit metadata.

---

### Task 7: Run the full PR B L1-L4 gate and stop for H2

**Files:** all persistent PR B files.

**Interfaces:** Produces the complete uncommitted H2 packet. No commit, push or PR is authorized by this task.

- [x] **Step 1: Run focused and full automated gates**

Run:

```powershell
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/fe11SchemaMigration.test.js tests/accountSetupRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/userLifecycleRepository.test.js tests/userRoleRepository.test.js tests/userRepository.test.js tests/adminPermissionService.test.js tests/adminPermissionRoutes.test.js
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
node --test frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js frontend/test/adminPermissions.test.js frontend/test/adminConsoleStructure.test.js
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npx.cmd playwright test tests/e2e/fe11-admin-request-management.spec.js --project=chromium
npm.cmd run test:e2e
npm.cmd run test:system
npm.cmd run test:deployment
npm.cmd run trace:enforce
npm.cmd run test:secrets
node -e "require('./backend/node_modules/yamljs').load('backend/src/docs/openapi.yaml'); console.log('openapi ok')"
node -e "require('./backend/src/app'); console.log('backend import ok')"
```

Expected: all commands exit 0; FE11 source trace is 43/43; full E2E exits cleanly. The SQL suite from Task 5 is recorded separately because it requires the named mutable target and must not be hidden inside a conditional aggregate run.

- [x] **Step 2: Run security/dependency and scope gates**

Run:

```powershell
npm.cmd audit --audit-level=high
npm.cmd --prefix backend audit --audit-level=high
npm.cmd --prefix frontend run audit:high
git diff --check
git status --short
git diff --name-only 042d61907c0ae5a6577ab9d40d5e78601fb4e147
git diff --stat 042d61907c0ae5a6577ab9d40d5e78601fb4e147
git diff -- backend/src frontend/src backend/tests frontend/test tests/e2e .sdd/specs/feat-user-role-management .sdd/reviews/full-project-closeout-pr-b-fe11-validation-2026-08-02.md docs/superpowers/plans/2026-08-02-full-project-closeout-pr-b-fe11-core.md
```

Expected: root/backend have no High/Critical issue; frontend fail-closed guard accepts only the documented React Router exception; no whitespace error; changed files are exactly within this plan. No password/token/secret, schema/API/role/dependency/workflow change is present.

- [ ] **Step 3: Present H2 packet**

Present:

- selected approach and why the other two were rejected;
- complete diff and exact diff hash;
- RED/GREEN counts;
- SQL non-skipped result plus fixture/database cleanup proof;
- full L1 results, L2 requirement table, L3 security review, L4 local desktop/mobile result;
- explicit residual: PR B post-merge staging acceptance and whole-feature `COMPLETE` transition are still open.

Stop. Do not commit, stage, push or open a PR until Nhat explicitly approves H2.

---

### Task 8: Publish after H2, request H3, then verify post-merge staging

**Files:** exactly the unchanged H2-reviewed set.

**Interfaces:** Produces PR B integration evidence and the handoff consumed by PR D.

- [ ] **Step 1: Commit and open the PR only after H2**

Run:

```powershell
git add -- backend/src/routes/userManagementRoutes.js backend/src/services/userManagementService.js backend/src/repositories/userLifecycleRepository.js backend/src/repositories/userRoleRepository.js backend/tests/accountSetupRepository.test.js backend/tests/userManagementService.test.js backend/tests/userManagementRoutes.test.js backend/tests/userLifecycleRepository.test.js backend/tests/userRoleRepository.test.js backend/tests/fe11SchemaMigration.test.js backend/tests/adminPermissionService.test.js backend/tests/adminPermissionRoutes.test.js backend/tests/helpers/systemIntegrationHarness.js backend/tests/sql/fe11Core.sqltest.js frontend/src/page/admin/users/AdminUsersSection.jsx frontend/src/page/admin/permissions/AdminPermissionsSection.jsx frontend/test/userManagementFrontend.test.js frontend/test/adminPermissions.test.js tests/e2e/fe11-admin-request-management.spec.js .sdd/specs/feat-user-role-management/SPEC.md .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/reviews/full-project-closeout-pr-b-fe11-validation-2026-08-02.md docs/superpowers/plans/2026-08-02-full-project-closeout-pr-b-fe11-core.md
git diff --cached --check
git diff --cached --name-only
git commit -m "feat(fe11): reconcile user lifecycle and permissions"
git push -u origin feat/full-project-closeout-pr-b-fe11
gh pr create --base main --head feat/full-project-closeout-pr-b-fe11 --title "feat(fe11): reconcile user lifecycle and permissions" --body "Implements the approved PR B FE11 Core reconciliation: embedded read-only permission matrix with the eight-entry sidebar preserved, account/lifecycle/role characterization, non-skipped disposable SQL evidence, 43/43 source traceability, focused browser acceptance and an H2 validation record. No schema, endpoint, role or dependency change. Exact post-merge staging acceptance and final COMPLETE transition remain assigned to PR D."
gh pr checks --watch
```

Expected: staged scope exactly matches H2, the PR targets `main`, required checks pass and the exact head SHA is stable. The PR body contains no credential or local absolute path.

- [ ] **Step 2: Request H3 before merge**

Present PR URL, exact head SHA, complete check rollup and unchanged H2 diff. Merge only after explicit H3. After merge, record the exact merge SHA and wait for exact post-merge CI and staging workflow success.

- [ ] **Step 3: Run exact-SHA FE11 staging acceptance after deployment**

Use only runtime-random synthetic accounts and the exact-manifest cleanup contract from `docs/superpowers/plans/2026-08-02-azure-staging-authenticated-acceptance.md`. The deployed SHA, frontend host, API host and SQL target must match before mutation. Verify:

- Admin opens `/admin/users`, sees eight sidebar entries, opens the embedded matrix, and sees the three-role read-only data at desktop/mobile sizes;
- Member and Librarian receive server-side 403 for `/api/admin/permissions` and user-management mutations;
- invalid and duplicate account creation return 400/409 without partial source/audit/setup state;
- stale/self/pending/active-loan deactivation guards return the approved error without mutation;
- same-role returns canonical DTO without audit; replacement leaves one role, revokes refresh credentials and audits; deactivation is atomic;
- exact-ID cleanup returns `CLEANED`, old login/token attempts return 401, and temporary runtime/helper paths return 404.

If any mismatch occurs, preserve the redacted manifest, complete cleanup, stop and open a bounded remediation slice. Do not mark FE11 complete.

- [ ] **Step 4: Hand exact evidence to PR D**

PR D, not PR B, records the immutable merge SHA, post-merge CI/deploy run IDs, staging acceptance result and final `Implementation State: COMPLETE` transition. This avoids claiming evidence from an unmerged or differently deployed commit.

## Stop conditions

Stop immediately if:

- `origin/main` or the original dirty checkout changes unexpectedly;
- a RED failure is caused by setup rather than the named requirement;
- implementation needs a schema, endpoint, role, dependency, workflow or unlisted Core file;
- server-side denied access returns success;
- the mutable SQL suite skips, targets a non-exact database or cannot prove cleanup;
- a secret/credential/PII finding appears;
- browser/server SHA, host or database state does not match staging preflight;
- synthetic cleanup is not `CLEANED`;
- required CI fails or the PR head changes after H3;
- the same deterministic blocker reaches three total attempts.

## Self-review results

- **Standards:** one serial Core writer; parameterized SQL; server authorization before detailed validation; safe DTO/errors; no secrets; atomic audit/session changes.
- **Spec:** BD-003/004/005 map to explicit tests and source boundaries; no stale trace row changes normative behavior.
- **Scope:** the only planned behavior change is permission-surface reachability inside the approved user/role surface; no ninth navigation item or edit-permission path.
- **TDD:** the permission reachability defect has a real RED; already-correct backend behavior is truthfully recorded as characterization rather than fabricated RED.
- **Evidence:** mutable SQL cannot silently skip; local browser acceptance is separate from exact post-merge staging acceptance.
- **State:** PR B may reach 43/43 trace while remaining `PARTIAL`; only PR D may publish exact post-merge completion evidence.

## Execution handoff

This plan is ready for Nhat's explicit plan approval. Approval authorizes Tasks 1-7 through the uncommitted H2 checkpoint. It does not pre-approve H2, H3, merge, staging mutation after a failed preflight, or the final `COMPLETE` transition.
