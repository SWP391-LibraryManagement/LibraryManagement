# FE11 Finalization Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Shared Core files must have one serial writer; do not dispatch parallel writers for Wave A or Wave B production files.

**Goal:** Complete the remaining approved FE11 user lifecycle and Admin Request Management requirements through B7 using one governance PR, two implementation waves, and one closeout PR.

**Architecture:** Wave A adds an idempotent SQL Server migration, synchronizes shared email/profile contracts, routes update/deactivation through one transactional lifecycle repository, and removes the frontend development Admin bypass. Wave B keeps FE07 as the sole borrow-request mutation owner while FE11 adds paginated Admin read DTOs, authoritative detail loading, safe multi-page CSV export, and feature-specific browser acceptance.

**Tech Stack:** Node.js, Express.js, `mssql`, SQL Server, Jest, Supertest, React 19, Vite, Node test runner, Playwright, OpenAPI 3.0 YAML, PowerShell, GitHub CLI.

## Global Constraints

- Decision mode is Hybrid SDD + ADD at Full depth: schema, authorization, optimistic concurrency, credential invalidation, audit atomicity, and FE07 ownership are Core; Admin presentation and CSV composition are Shell.
- Use exactly four PRs: governance activation, Wave A implementation, Wave B implementation, and documentation closeout.
- Product work starts only after the governance activation PR merges into `main`.
- Generated implementation changes remain uncommitted until that wave receives H2. H3 is required after PR checks and before every merge.
- `Users.Email` and `Notifications.RecipientEmail` are `NVARCHAR(255)`; `UserProfiles.Department` and `UserProfiles.Specialization` are nullable `NVARCHAR(100)`; `Users.DeactivatedAt` is nullable `DATETIME`.
- `fullName` remains trimmed, required, and limited to 100 characters to match FE03 and `UserProfiles.FullName`.
- `UserManagementView.updatedAt` is the non-null effective version `COALESCE(Users.UpdatedAt, Users.CreatedAt)`; update and deactivation compare that same value.
- `department` and `specialization` are returned only for a current `LIBRARIAN` role and are rejected for non-Librarian targets.
- `INACTIVE` plus null `DeactivatedAt` means `PENDING_ACTIVATION`; it is not an idempotent deactivation result.
- Deactivation revokes active `REFRESH` credentials atomically; authenticated access tokens become unusable because their refresh/session IDs no longer resolve.
- FE07 remains the sole owner of `/api/borrow-requests/{requestId}/approve` and `/reject`; do not add Admin mutation aliases.
- Admin request list query names are exactly `page`, `limit`, `q`, `status`, `from`, and `to`; response keys are exactly `data` and `pagination`.
- Add no dependency, migration framework, session table, role CRUD, permission editing, FE04 behavior change, FE12 production change, or unrelated Admin Console refactor.
- If live SQL Server is unavailable, retain only that execution evidence under `TD-021`; missing code, browser acceptance, or static migration evidence cannot be deferred.

---

## File Map

### Create

- `database/migrations/2026-07-19-fe11-finalization.sql` - idempotent schema migration with preflight checks and deterministic email uniqueness.
- `backend/src/repositories/userLifecycleRepository.js` - transactional optimistic update and atomic deactivation outcomes.
- `backend/tests/fe11SchemaMigration.test.js` - static migration, baseline, model, and parameter-width checks.
- `backend/tests/accountSetupRepository.test.js` - transactional acting-Admin, duplicate, setup-source, and rollback tests.
- `backend/tests/userRepository.test.js` - safe DTO, effective-version, and Librarian-field SQL projection tests.
- `backend/tests/userLifecycleRepository.test.js` - transaction, lock, no-op, stale, duplicate, deactivation, audit, and rollback tests.
- `backend/tests/adminDashboardService.test.js` - evidence-only read DTO and FE12 ownership-boundary tests for the existing dashboard.
- `backend/tests/adminRequestRepository.test.js` - distinct-header pagination, matching count/data filters, stable ordering, and safe row grouping.
- `backend/tests/adminRequestService.test.js` - request list/detail normalization and projection tests.
- `backend/tests/adminRequestRoutes.test.js` - Admin-first request list/detail route validation tests.
- `frontend/src/utils/adminRequests.js` - canonical query, paginated export, and CSV escaping helpers.
- `frontend/test/adminRequests.test.js` - pure request-query/export helper tests.
- `tests/e2e/fe11-admin-console.spec.js` - isolated FE11 Admin browser acceptance.
- `tests/e2e/support/fe11Fixtures.js` - E2E-only user/request service fixtures.
- `.sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md` - Wave A L1-L4 and H2 evidence.
- `.sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md` - Wave B L1-L4 and H2 evidence.
- `.sdd/reviews/fe11-finalization-closeout-2026-07-19.md` - final B7 integration record.

### Modify In Governance Activation

- `.sdd/rfcs/ADR-002-database-design.md`
- `.sdd/specs/feat-auth/SPEC.md`
- `.sdd/specs/feat-auth/CHANGELOG.md`
- `.sdd/specs/feat-user-profile/SPEC.md`
- `.sdd/specs/feat-user-profile/CHANGELOG.md`
- `.sdd/specs/feat-notification-management/SPEC.md`
- `.sdd/specs/feat-notification-management/CHANGELOG.md`
- `.sdd/specs/feat-user-role-management/SPEC.md`
- `.sdd/specs/feat-user-role-management/PLAN.md`
- `.sdd/specs/feat-user-role-management/TASKS.md`
- `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- `docs/api/api-contract.md`
- `TECH_DEBT.md`

### Modify In Wave A

- `database/Librarymanagement.sql`
- `backend/src/models/User.js`
- `backend/src/models/UserProfile.js`
- `backend/src/models/Notification.js`
- `backend/src/repositories/userRepository.js`
- `backend/src/repositories/accountSetupRepository.js`
- `backend/src/repositories/notificationRepository.js`
- `backend/src/repositories/borrowingRepository.js` only if the current request-first lock order must be corrected to the already approved FE07 member-first order.
- `backend/src/services/userManagementService.js`
- `backend/src/controllers/userManagementController.js`
- `backend/src/routes/userManagementRoutes.js`
- `backend/src/validators/userManagementValidators.js`
- `backend/src/docs/openapi.yaml`
- `backend/tests/userManagementService.test.js`
- `backend/tests/userManagementRoutes.test.js`
- `backend/tests/userRoleRepository.test.js`
- `backend/tests/notificationRoutes.test.js`
- `backend/tests/models.test.js`
- `backend/tests/borrowingRepository.test.js`
- `backend/tests/sql/borrowingConcurrency.sqltest.js`
- `backend/tests/helpers/inMemoryAuthRepositories.js`
- `frontend/src/api/userManagementApi.js`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementApi.test.js`
- `frontend/test/userManagementFrontend.test.js`
- `docs/api/api-contract.md`

### Modify In Wave B

- `backend/src/validators/adminValidators.js`
- `backend/src/repositories/adminRepository.js`
- `backend/src/services/adminService.js`
- `backend/src/controllers/adminController.js`
- `backend/src/routes/adminRoutes.js`
- `backend/src/docs/openapi.yaml`
- `backend/tests/adminBorrowingRouteBoundary.test.js`
- `backend/tests/borrowingRoutes.test.js`
- `backend/tests/borrowingRepository.test.js`
- `frontend/src/api/adminApi.js`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/adminApi.test.js`
- `frontend/test/userManagementFrontend.test.js`
- `tests/e2e/support/systemTestServer.js`
- `docs/api/api-contract.md`

### Modify In Closeout

- `.agents/CLAUDE.md`
- `.sdd/specs/feat-user-role-management/PLAN.md`
- `.sdd/specs/feat-user-role-management/TASKS.md`
- `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- `.sdd/specs/feat-user-role-management/SPEC.md`
- `.sdd/specs/feat-auth/SPEC.md`
- `.sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md`
- `.sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md`
- `TECH_DEBT.md`

## Locked Interfaces

```js
// backend/src/repositories/userLifecycleRepository.js
updateManagedUser({
  adminUserId: number,
  userId: number,
  expectedUpdatedAt: Date,
  changes: {
    email?: string,
    fullName?: string,
    phone?: string | null,
    address?: string | null,
    department?: string | null,
    specialization?: string | null,
  },
  ipAddress?: string | null,
  userAgent?: string | null,
  now?: Date,
}): Promise<{
  outcome: 'UPDATED' | 'NO_CHANGE' | 'ADMIN_NOT_FOUND' | 'ADMIN_REQUIRED' |
    'USER_NOT_FOUND' | 'STALE_USER_STATE' | 'EMAIL_ALREADY_EXISTS' |
    'LIBRARIAN_FIELDS_FORBIDDEN',
  changedFields?: string[],
}>

deactivateManagedUser({
  adminUserId: number,
  userId: number,
  expectedUpdatedAt: Date,
  ipAddress?: string | null,
  userAgent?: string | null,
  now?: Date,
}): Promise<{
  outcome: 'DEACTIVATED' | 'ALREADY_DEACTIVATED' | 'ADMIN_NOT_FOUND' |
    'ADMIN_REQUIRED' | 'USER_NOT_FOUND' | 'CANNOT_DEACTIVATE_SELF' |
    'STALE_USER_STATE' | 'ACCOUNT_PENDING_ACTIVATION' | 'ACTIVE_BORROWINGS_EXIST',
  activeBorrowingCount?: number,
}>
```

```js
// backend/src/repositories/adminRepository.js
listRequests({ page, limit, q, status, from, to }): Promise<{
  data: Array<AdminRequestListItem>,
  pagination: { page, limit, total, totalPages },
}>

// backend/src/services/adminService.js
getRequest(requestId): Promise<AdminRequestDetail>
```

```js
// frontend/src/utils/adminRequests.js
buildAdminRequestParams({ page, limit, q, status, from, to }): object
fetchAllAdminRequestRows(loadPage, filters): Promise<AdminRequestListItem[]>
buildAdminRequestCsv(rows): string
```

## Pull Request And Gate Matrix

| PR | Branch | Scope | Pre-merge gate |
| --- | --- | --- | --- |
| 1 | `docs/fe11-finalization-batch-design` | Design, plan, governance activation, contract/debt/task state | H1 exact governance review, checks, H3 |
| 2 | `feat/fe11-finalization-wave-a` | Schema and User Lifecycle Core | H2, checks, H3 |
| 3 | `feat/fe11-finalization-wave-b` | Request Management and browser acceptance | H2, checks, H3 |
| 4 | `docs/fe11-finalization-closeout` | Final B7 evidence and project memory | H2, checks, H3 |

---

### Task 1: Activate The Finalization Batch Governance

**Files:** Governance files listed in the File Map.

**Interfaces:**
- Consumes: approved design commit `086933d`, the reviewed correction that defines effective `updatedAt`, and this implementation plan.
- Produces: active tasks `FE11-FIN01..FE11-FIN02`, debt states `IN PROGRESS`, and authoritative schema/API contracts before product work.

- [ ] **Step 1: Verify the design branch and base**

```powershell
git fetch origin main
git merge-base --is-ancestor f706c5457254db16401009e260dd9528aeb8c3c5 origin/main
git status --short --branch
git log -3 --oneline
```

Expected: ancestry exits `0`; the branch contains the approved design and plan commits; no unrelated file is dirty.

- [ ] **Step 2: Update the authoritative cross-feature contracts**

Apply these exact decisions:

```markdown
- FE02: email max 255; `deactivatedAt` migration is active; FE11 managed DTO version is `COALESCE(UpdatedAt, CreatedAt)`; FE02 behavior is otherwise unchanged.
- FE03: `UserProfiles.Department` and `Specialization` are FE11-admin-managed optional columns and remain excluded from FE03 self-profile read/update DTOs; `fullName` remains max 100.
- FE10: `recipientEmail` persistence is max 255; no delivery ownership or sensitive-notification rule changes.
- FE11: update/deactivation use the effective non-null version; pending activation deactivation returns `409 ACCOUNT_PENDING_ACTIVATION`; request list/detail contracts match the approved design.
- ADR-002: name the five target columns, deterministic `UX_Users_Email`, idempotent script path, and live-twice validation requirement.
```

In `docs/api/api-contract.md`, document the exact create, update, deactivation, setup-resend, request list, and request detail payloads from the design. Do not document Admin mutation aliases.

- [ ] **Step 3: Add the Finalization task group**

Append this group before `## Deferred FE11 Work`:

```markdown
## FE11 Finalization Batch Tasks

- [ ] **FE11-FIN01 - Approve and activate the FE11 Finalization Batch.**
  - Maps to: TD-012, TD-014, TD-015, TD-016, TD-017, TD-025.
  - DoD: approved design/plan, synchronized Core contracts, two-wave ownership, validation commands, and debt activation are merged before product work.

- [ ] **FE11-LIFE01 - Add the idempotent schema migration and synchronized contracts.**
  - Maps to: TD-012, TD-016; FR-FE11-010/021; FE02/FE03/FE10 shared schema dependencies.
  - DoD: five target columns, deterministic email uniqueness, models, bindings, baseline, static tests, and optional live-twice evidence agree.

- [ ] **FE11-LIFE02 - Persist and return Librarian fields safely.**
  - Maps to: BR-FE11-015/026; FR-FE11-010/028; AC-FE11-011; TD-012.
  - DoD: create/read/update use 100-character nullable fields only for current Librarian targets and expose no fake fields for other roles.

- [ ] **FE11-LIFE03 - Implement optimistic and no-op managed-user updates.**
  - Maps to: BR-FE11-004/010/014/027; FR-FE11-004/007/020/021/023; AC-FE11-004/008/023; TD-014/015/016.
  - DoD: actor/target locks, effective version, duplicate mapping, no-op behavior, safe audit allowlist, and rollback are proven.

- [ ] **FE11-LIFE04 - Implement atomic deactivation and credential invalidation.**
  - Maps to: BR-FE11-003/006/010/015; FR-FE11-008/011/016..019/023; AC-FE11-007/009/012/023; TD-014/015/016.
  - DoD: lifecycle-mode guards, active borrowing block, REFRESH revocation, audit, rollback, and FE07 approval serialization are proven.

- [ ] **FE11-LIFE05 - Align the Admin UI and remove implicit development Admin access.**
  - Maps to: NFR-FE11-SEC-001/002/004; AC-FE11-004/007/011/012/023; TD-017.
  - DoD: all modes require stored authenticated Admin state; update/deactivate send the effective version and reload authoritative state.

- [ ] **FE11-LIFE06 - Pass Wave A H2/H3/B7 integration.**
  - Depends on: FE11-LIFE01..FE11-LIFE05.

- [ ] **FE11-REQ01 - Canonicalize Admin request list and detail reads.**
  - Maps to: BR-FE11-019/026; FR-FE11-034; AC-FE11-019; TD-025.

- [ ] **FE11-REQ02 - Align request pagination, detail, actions, and CSV UI.**
  - Maps to: FR-FE11-034/035; AC-FE11-019; TD-025.

- [ ] **FE11-REQ03 - Prove FE07 terminal-state immutability.**
  - Maps to: BR-FE11-019; FR-FE11-035; FE07 request lifecycle invariants; TD-025.

- [ ] **FE11-ACC01 - Pass FE11 browser acceptance and Wave B integration.**
  - Depends on: FE11-REQ01..FE11-REQ03.

- [ ] **FE11-FIN02 - Publish final FE11 B7 closeout.**
  - Depends on: FE11-LIFE06, FE11-ACC01.
  - DoD: all four PRs and exact main CI runs are recorded; FE11 is complete through B7; only unavailable live SQL evidence may remain under TD-021.
```

- [ ] **Step 4: Activate debt and validation targets without claiming implementation**

Change `TD-012`, `TD-014`, `TD-015`, `TD-016`, `TD-017`, and `TD-025` to `IN PROGRESS`. Keep `TD-021` `PARTIAL`. Add TEST_PLAN sections for Wave A and Wave B commands and prepend an FE11 CHANGELOG entry stating that product implementation has not started.

Leave every new task checkbox, including `FE11-FIN01`, unchecked in the governance diff. A merged governance PR authorizes execution but does not by itself prove any product task or integration task complete.

- [ ] **Step 5: Present the exact governance diff for H1**

```powershell
git diff --check
git diff --name-only
rg -n "FE11-FIN01|FE11-FIN02|TD-012.*IN PROGRESS|TD-025.*IN PROGRESS|TD-021.*PARTIAL" .sdd/specs/feat-user-role-management TECH_DEBT.md
git diff --binary | git hash-object --stdin
```

Expected: only governance/documentation files changed. Record the diff hash and stop for H1. After H1 confirms this exact diff, commit and publish PR 1; otherwise the governance diff requires H2 before commit.

- [ ] **Step 6: Commit, publish, obtain H3, merge, and verify main**

```powershell
git add -- .sdd/rfcs/ADR-002-database-design.md .sdd/specs/feat-auth/SPEC.md .sdd/specs/feat-auth/CHANGELOG.md .sdd/specs/feat-user-profile/SPEC.md .sdd/specs/feat-user-profile/CHANGELOG.md .sdd/specs/feat-notification-management/SPEC.md .sdd/specs/feat-notification-management/CHANGELOG.md .sdd/specs/feat-user-role-management/SPEC.md .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md docs/api/api-contract.md TECH_DEBT.md docs/superpowers/specs/2026-07-19-fe11-finalization-batch-design.md docs/superpowers/plans/2026-07-19-fe11-finalization-batch.md
git commit -m "docs: activate FE11 finalization batch"
git push -u origin docs/fe11-finalization-batch-design
gh pr create --base main --head docs/fe11-finalization-batch-design --title "docs: activate FE11 finalization batch" --body "Activates FE11-FIN01 and the approved two-wave Full-depth finalization contract. Product work remains blocked until this PR passes checks, receives H3, and merges."
gh pr checks --watch
```

Request H3 with the exact PR diff and checks. After approval:

```powershell
gh pr merge --merge --delete-branch
git fetch origin main
$mergeSha = gh pr view --json mergeCommit --jq .mergeCommit.oid
gh run list --branch main --commit $mergeSha --limit 5
```

Expected: PR 1 and its exact `main` CI pass before Wave A begins.

---

### Task 2: Add The Idempotent Schema Migration And Width Contracts

**Files:** Migration, baseline, models, repository bindings, contract docs, and schema tests from Wave A.

**Interfaces:**
- Consumes: merged governance contract.
- Produces: five synchronized columns and 255-character FE11-to-FE10 email persistence.

- [ ] **Step 1: Create the Wave A worktree**

```powershell
git fetch origin main
git worktree add .worktrees/fe11-finalization-wave-a -b feat/fe11-finalization-wave-a origin/main
npm.cmd ci
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
```

- [ ] **Step 2: Write the failing static schema test**

Create `backend/tests/fe11SchemaMigration.test.js` with assertions equivalent to:

```js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('FE11 migration is guarded, transactional, and idempotent', () => {
  const sql = read('database/migrations/2026-07-19-fe11-finalization.sql');
  expect(sql).toMatch(/SET XACT_ABORT ON/i);
  expect(sql).toMatch(/BEGIN TRANSACTION/i);
  expect(sql).toMatch(/COL_LENGTH\('dbo\.Users', 'DeactivatedAt'\)/i);
  expect(sql).toMatch(/Department/i);
  expect(sql).toMatch(/Specialization/i);
  expect(sql).toMatch(/Notifications[\s\S]*RecipientEmail/i);
  expect(sql).toMatch(/UX_Users_Email/i);
  expect(sql).toMatch(/THROW/i);
  expect(sql).not.toMatch(/INSERT INTO Users|demo_admin|PasswordHash/i);
});

test('baseline, models, and SQL bindings use canonical widths', () => {
  expect(read('database/Librarymanagement.sql')).toMatch(/Email NVARCHAR\(255\)/);
  expect(read('database/Librarymanagement.sql')).toMatch(/RecipientEmail NVARCHAR\(255\)/);
  expect(read('backend/src/models/Notification.js')).toMatch(/NVARCHAR\(255\)/);
  expect(read('backend/src/repositories/accountSetupRepository.js')).toMatch(/Email', sql\.NVarChar\(255\)/);
  expect(read('backend/src/repositories/notificationRepository.js')).toMatch(/RecipientEmail', type: sql\.NVarChar\(255\)/);
});
```

- [ ] **Step 3: Run RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/fe11SchemaMigration.test.js
```

Expected: FAIL because the migration and canonical widths do not exist.

- [ ] **Step 4: Create the migration**

Implement `database/migrations/2026-07-19-fe11-finalization.sql` with this transaction shape:

```sql
SET XACT_ABORT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID('dbo.Users', 'U') IS NULL
     OR OBJECT_ID('dbo.UserProfiles', 'U') IS NULL
     OR OBJECT_ID('dbo.Notifications', 'U') IS NULL
    THROW 51000, 'Required FE11 tables are missing.', 1;

  IF EXISTS (
    SELECT LOWER(LTRIM(RTRIM(Email)))
    FROM dbo.Users
    GROUP BY LOWER(LTRIM(RTRIM(Email)))
    HAVING COUNT(*) > 1
  )
    THROW 51001, 'Users.Email contains case-insensitive duplicates.', 1;

  DECLARE @EmailIndexCount INT;
  DECLARE @EmailIndexName SYSNAME;
  DECLARE @EmailIndexIsConstraint BIT;
  DECLARE @EmailIndexKeyCount INT;
  DECLARE @EmailMaxLength SMALLINT;

  SELECT @EmailMaxLength = max_length
  FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'Email';

  SELECT @EmailIndexCount = COUNT(DISTINCT i.index_id)
  FROM sys.indexes i
  INNER JOIN sys.index_columns ic
    ON ic.object_id = i.object_id AND ic.index_id = i.index_id
  INNER JOIN sys.columns c
    ON c.object_id = ic.object_id AND c.column_id = ic.column_id
  WHERE i.object_id = OBJECT_ID('dbo.Users') AND c.name = 'Email';

  IF @EmailIndexCount > 1
    THROW 51002, 'Users.Email has unsupported multiple dependent indexes.', 1;

  SELECT TOP (1)
    @EmailIndexName = i.name,
    @EmailIndexIsConstraint = i.is_unique_constraint,
    @EmailIndexKeyCount = (
      SELECT COUNT(*)
      FROM sys.index_columns keys
      WHERE keys.object_id = i.object_id
        AND keys.index_id = i.index_id
        AND keys.key_ordinal > 0
    )
  FROM sys.indexes i
  INNER JOIN sys.index_columns ic
    ON ic.object_id = i.object_id AND ic.index_id = i.index_id
  INNER JOIN sys.columns c
    ON c.object_id = ic.object_id AND c.column_id = ic.column_id
  WHERE i.object_id = OBJECT_ID('dbo.Users') AND c.name = 'Email';

  IF @EmailIndexName IS NOT NULL AND (
    NOT EXISTS (
      SELECT 1 FROM sys.indexes
      WHERE object_id = OBJECT_ID('dbo.Users')
        AND name = @EmailIndexName
        AND is_unique = 1
    ) OR @EmailIndexKeyCount <> 1
  )
    THROW 51003, 'Users.Email has an unsupported dependent index.', 1;

  IF @EmailMaxLength <> 510 OR ISNULL(@EmailIndexName, '') <> 'UX_Users_Email'
  BEGIN
    IF @EmailIndexName IS NOT NULL
    BEGIN
      IF @EmailIndexIsConstraint = 1
        EXEC(N'ALTER TABLE dbo.Users DROP CONSTRAINT ' + QUOTENAME(@EmailIndexName));
      ELSE
        EXEC(N'DROP INDEX ' + QUOTENAME(@EmailIndexName) + N' ON dbo.Users');
    END;

    IF @EmailMaxLength <> 510
      ALTER TABLE dbo.Users ALTER COLUMN Email NVARCHAR(255) NOT NULL;
  END;

  IF COL_LENGTH('dbo.Users', 'DeactivatedAt') IS NULL
    ALTER TABLE dbo.Users ADD DeactivatedAt DATETIME NULL;
  ELSE IF EXISTS (
    SELECT 1
    FROM sys.columns c
    INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
    WHERE c.object_id = OBJECT_ID('dbo.Users')
      AND c.name = 'DeactivatedAt'
      AND (t.name <> 'datetime' OR c.is_nullable = 0)
  )
    ALTER TABLE dbo.Users ALTER COLUMN DeactivatedAt DATETIME NULL;

  IF COL_LENGTH('dbo.UserProfiles', 'Department') IS NULL
    ALTER TABLE dbo.UserProfiles ADD Department NVARCHAR(100) NULL;
  ELSE IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.UserProfiles')
      AND name = 'Department'
      AND (max_length <> 200 OR is_nullable = 0)
  )
    ALTER TABLE dbo.UserProfiles ALTER COLUMN Department NVARCHAR(100) NULL;

  IF COL_LENGTH('dbo.UserProfiles', 'Specialization') IS NULL
    ALTER TABLE dbo.UserProfiles ADD Specialization NVARCHAR(100) NULL;
  ELSE IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.UserProfiles')
      AND name = 'Specialization'
      AND (max_length <> 200 OR is_nullable = 0)
  )
    ALTER TABLE dbo.UserProfiles ALTER COLUMN Specialization NVARCHAR(100) NULL;

  IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Notifications')
      AND name = 'RecipientEmail'
      AND max_length <> 510
  )
    ALTER TABLE dbo.Notifications ALTER COLUMN RecipientEmail NVARCHAR(255) NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'UX_Users_Email')
    CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users(Email);

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
```

The second execution must reach COMMIT without dropping/recreating the deterministic index or altering a column.

- [ ] **Step 5: Synchronize baseline, models, and bindings**

Use `NVARCHAR(255)` for every `Users.Email` binding in `userRepository.js` and `accountSetupRepository.js`, and every `Notifications.RecipientEmail` binding in `notificationRepository.js`. Add `deactivatedAt` to `User.js`, add the two profile fields to `UserProfile.js`, and set the Notification model width to 255.

In the baseline script, remove the anonymous inline `UNIQUE` modifier from `Users.Email` and add `CREATE UNIQUE INDEX UX_Users_Email ON Users(Email);` after the table definition.

- [ ] **Step 6: Run GREEN and regression**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/fe11SchemaMigration.test.js tests/models.test.js tests/notificationRoutes.test.js tests/userManagementService.test.js
git diff --check
```

Expected: PASS. Do not commit; record the RED reason and GREEN totals in the Wave A validation file.

---

### Task 3: Persist Librarian Fields And Harden Account Setup Mutations

**Files:** `userRepository.js`, `accountSetupRepository.js`, `userManagementService.js`, controller/routes/validators, repository/service/route tests, in-memory auth helper, and frontend form files.

**Interfaces:**
- Consumes: canonical columns from Task 2.
- Produces: `UserManagementView` with non-null `updatedAt`, role-gated Librarian fields, and transaction-authoritative create/resend outcomes.

- [ ] **Step 1: Write repository and service RED tests**

Add tests that lock these exact results:

```js
await expect(userRepository.getManagedUserById(7)).resolves.toMatchObject({
  updatedAt: FIXED_CREATED,
});

expect(librarian).toMatchObject({
  roles: ['LIBRARIAN'],
  department: 'Reference',
  specialization: 'Research Support',
});
expect(member).not.toHaveProperty('department');
expect(member).not.toHaveProperty('specialization');
```

Create `accountSetupRepository.test.js` with the same mocked-transaction style as `userRoleRepository.test.js`. Prove both `createPendingAccount()` and `rotateSetupToken()` lock and revalidate the acting user before any target mutation:

```js
test.each([
  ['missing actor', [], 'ADMIN_NOT_FOUND'],
  ['inactive actor', [{ UserId: 99, Status: 'INACTIVE', IsAdmin: 1 }], 'ADMIN_REQUIRED'],
  ['non-admin actor', [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 0 }], 'ADMIN_REQUIRED'],
])('%s rolls back before setup-source mutation', async (_, actorRows, outcome) => {
  // Assert no Users/AuthTokens/AuditLogs INSERT or UPDATE occurs.
});
```

For create, prove the actor lock precedes locked email/username uniqueness checks and every insert. Prove an existing case-insensitive email and concurrent SQL Server duplicate-key error for deterministic index `UX_Users_Email` both roll back and return `EMAIL_ALREADY_EXISTS`, with no setup delivery request. Preserve the existing deterministic username conflict without misclassifying an unrelated `2601`/`2627` error as email.

For resend, prove the actor lock precedes the target/setup-history lock. Missing, inactive, or non-Admin actors must roll back before token revocation, token creation, or audit.

Extend service tests so Librarian creation persists trimmed fields, Member creation rejects supplied Librarian fields, a 255-character valid email reaches FE10 without truncation, repository actor outcomes map safely, and repository duplicate-email outcomes map to `409 EMAIL_ALREADY_EXISTS` before delivery.

Add create-route RED tests proving authentication and Admin authorization precede invalid-body validation. The validated create payload must normalize `type`, `email`, `username`, `fullName`, `phone`, `address`, `department`, and `specialization`; reject missing/invalid/overlength values; and reject Librarian-only fields for a Member request before the service is invoked.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/accountSetupRepository.test.js tests/userRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js
```

Expected: FAIL because managed reads omit the fields/version fallback, create input ignores Librarian fields, create lacks route validation, and create/resend do not revalidate the acting Admin inside their source transactions.

- [ ] **Step 3: Implement safe projection and account creation**

In every managed-user SELECT, project:

```sql
COALESCE(u.UpdatedAt, u.CreatedAt) AS EffectiveUpdatedAt,
up.Department,
up.Specialization
```

Map with:

```js
const roles = mapManagedRoles(row.Roles);
const result = {
  userId: row.UserId,
  username: row.Username,
  email: row.Email,
  phoneNumber: row.Phone,
  status: row.Status,
  fullName: row.FullName,
  address: row.Address,
  lastLoginAt: row.LastLoginAt,
  createdAt: row.CreatedAt,
  updatedAt: row.EffectiveUpdatedAt,
  roles,
};

if (roles.includes('LIBRARIAN')) {
  result.department = row.Department;
  result.specialization = row.Specialization;
}
return result;
```

Extend `createPendingAccount()` to bind and insert the two nullable fields and set `Users.UpdatedAt = @Now` for new FE11 accounts. Keep FE02 self-registration behavior unchanged; the effective read fallback supports its legacy/null rows.

At the start of both FE11 source transactions, lock the acting user and its Admin role membership using parameterized `UPDLOCK, HOLDLOCK`. Return `ADMIN_NOT_FOUND` for a missing actor and `ADMIN_REQUIRED` for an inactive or non-Admin actor before any source mutation. In create, perform the authoritative email/username uniqueness checks under the transaction; return `EMAIL_ALREADY_EXISTS` or `USERNAME_ALREADY_EXISTS` without inserts. Catch duplicate-key errors only after rollback and map the deterministic email index safely; do not convert an unknown constraint failure into the wrong public conflict. In resend, perform the target/setup-history lock only after actor revalidation.

The service may retain the existing preflight lookup for a fast response, but repository outcomes are authoritative. It must request FE10 delivery only after a committed `CREATED` or `ROTATED` result; actor/duplicate outcomes never create a notification request.

- [ ] **Step 4: Implement validation**

Add `createUserValidators` and assign `matchedData` to `req.validatedUserCreate`; the controller must pass only that object to the service. Normalize optional fields with trimmed blank-to-null behavior. Enforce email 255, full name 100, department/specialization 100, and reject Librarian fields when `type !== 'librarian'`.

- [ ] **Step 5: Run GREEN and completed-slice regressions**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/accountSetupRepository.test.js tests/userRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/userRoleRepository.test.js tests/notificationRoutes.test.js
```

Expected: PASS with active-Admin revalidation, deterministic create conflicts, route validation, and existing account setup, role, safe list/detail, audit, and permissions behavior unchanged.

---

### Task 4: Implement Transactional Optimistic And No-Op Updates

**Files:** lifecycle repository, user-management service/route/validators, tests, audit projection regression.

**Interfaces:** Produces `updateManagedUser()` outcomes from Locked Interfaces.

- [ ] **Step 1: Write repository RED tests**

Mirror `userRoleRepository.test.js` with a mocked SQL transaction. Cover:

```js
const FIXED_NOW = new Date('2026-07-19T08:30:00.000Z');
const FIXED_VERSION = new Date('2026-07-19T08:00:00.000Z');
const ACTIVE_ADMIN = [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 1 }];
const CURRENT_LIBRARIAN = {
  UserId: 7,
  Email: 'librarian@example.test',
  FullName: 'Current Name',
  Phone: null,
  Address: null,
  Department: 'Reference',
  Specialization: 'Research Support',
  Status: 'ACTIVE',
  DeactivatedAt: null,
  EffectiveUpdatedAt: FIXED_VERSION,
};
const STALE_TARGET = { ...CURRENT_LIBRARIAN, EffectiveUpdatedAt: new Date('2026-07-19T08:05:00.000Z') };
const CURRENT_ROLES = [{ RoleName: 'LIBRARIAN' }];
const CURRENT_CHANGES = {
  email: 'librarian@example.test',
  fullName: 'Current Name',
  phone: null,
  address: null,
  department: 'Reference',
  specialization: 'Research Support',
};

function makeLifecycleHarness(results) {
  const calls = [];
  const queued = [...results];
  getPool.mockResolvedValue({
    async transactionQuery(query, inputs) {
      calls.push({ query, inputs });
      const next = queued.shift();
      if (next instanceof Error) throw next;
      return { recordset: next || [] };
    },
  });

  return {
    calls,
    invokeUpdate(overrides = {}) {
      return userLifecycleRepository.updateManagedUser({
        adminUserId: 99,
        userId: 7,
        expectedUpdatedAt: FIXED_VERSION,
        changes: { fullName: 'Current Name' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
        now: FIXED_NOW,
        ...overrides,
      });
    },
    get transaction() {
      return sql.Transaction.instances.at(-1);
    },
  };
}

test.each([
  ['missing actor', [[]], 'ADMIN_NOT_FOUND'],
  ['inactive actor', [[{ UserId: 99, Status: 'INACTIVE', IsAdmin: 1 }]], 'ADMIN_REQUIRED'],
  ['missing target', [ACTIVE_ADMIN, []], 'USER_NOT_FOUND'],
  ['stale version', [ACTIVE_ADMIN, [STALE_TARGET]], 'STALE_USER_STATE'],
])('%s rolls back without update or audit', async (_, queuedResults, outcome) => {
  const harness = makeLifecycleHarness(queuedResults);
  await expect(harness.invokeUpdate()).resolves.toEqual({ outcome });
  expect(harness.calls.some(({ query }) => /UPDATE Users|INSERT INTO AuditLogs/.test(query))).toBe(false);
  expect(harness.transaction.commitCount).toBe(0);
  expect(harness.transaction.rollbackCount).toBe(1);
});

test('no-op writes no field update or audit', async () => {
  const harness = makeLifecycleHarness([ACTIVE_ADMIN, [CURRENT_LIBRARIAN], CURRENT_ROLES]);
  await expect(harness.invokeUpdate({ changes: CURRENT_CHANGES })).resolves.toEqual({ outcome: 'NO_CHANGE' });
  expect(harness.calls.some(({ query }) => /UPDATE Users|UPDATE UserProfiles|INSERT INTO AuditLogs/.test(query))).toBe(false);
});

test('effective update writes one audit and commits', async () => {
  const harness = makeLifecycleHarness([ACTIVE_ADMIN, [CURRENT_LIBRARIAN], CURRENT_ROLES, [], [], [], []]);
  await expect(harness.invokeUpdate({ changes: { fullName: 'Updated Name' } })).resolves.toEqual({
    outcome: 'UPDATED', changedFields: ['fullName'],
  });
  expect(harness.calls.filter(({ query }) => query.includes('INSERT INTO AuditLogs'))).toHaveLength(1);
  expect(harness.transaction.commitCount).toBe(1);
});
```

Assert actor, target, roles, and email checks use parameterized `UPDLOCK, HOLDLOCK`; assert audit metadata is exactly `{ changedFields: [...] }` with sorted field names.

- [ ] **Step 2: Write service and route RED tests**

Route tests must prove authorization precedes invalid body validation and the normalized payload is:

```js
{
  expectedUpdatedAt: new Date('2026-07-19T08:00:00.000Z'),
  email: 'librarian@example.test',
  department: 'Reference',
}
```

Service tests map repository outcomes to `404 USER_NOT_FOUND`, `409 STALE_USER_STATE`, `409 EMAIL_ALREADY_EXISTS`, and `400 VALIDATION_ERROR` for Librarian-only fields. `UPDATED` and `NO_CHANGE` both read back with `getManagedUserById()` and never call the standalone audit repository.

- [ ] **Step 3: Run RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userLifecycleRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js
```

- [ ] **Step 4: Implement the transaction**

Create `userLifecycleRepository.js` using the same transaction/outcome pattern as `userRoleRepository.js`. Compare:

```sql
COALESCE(u.UpdatedAt, u.CreatedAt) = @ExpectedUpdatedAt
```

Compute the normalized effective diff in JavaScript from locked rows. For `NO_CHANGE`, roll back or commit without any DML/audit and return `NO_CHANGE`. For an update, set `Users.UpdatedAt = @Now`, update only changed columns, update/insert the profile fields in the same transaction, and insert one `USER_UPDATE` audit.

Catch SQL duplicate-key numbers `2601` and `2627`, roll back, and return `EMAIL_ALREADY_EXISTS`; rethrow other failures after rollback.

- [ ] **Step 5: Wire validators, controller, route, and service**

Add `updateUserValidators` with a positive `userId`, required ISO8601 `expectedUpdatedAt`, optional validated fields, and a custom body check requiring at least one editable field. Store `matchedData` as `req.validatedUserUpdate`; pass it to the service.

- [ ] **Step 6: Run GREEN**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userLifecycleRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/adminAuditLogService.test.js
```

Expected: all update/no-op/error/audit projection cases pass.

---

### Task 5: Implement Atomic Deactivation And FE07 Serialization

**Files:** lifecycle repository, FE07 repository only if required, auth/service route tests, optional SQL concurrency test.

**Interfaces:** Produces `deactivateManagedUser()` outcomes from Locked Interfaces.

- [ ] **Step 1: Write deactivation RED tests**

Cover actor/target absence, inactive actor, self-target, stale version, pending activation, already-deactivated idempotence, active borrowings, ACTIVE success, LOCKED success, refresh revocation, audit metadata, and injected rollback at token/audit stages.

Use these exact audit details:

```js
expect(JSON.parse(auditCall.inputs.Metadata)).toEqual({
  previousStatus: 'ACTIVE',
  newStatus: 'INACTIVE',
});
```

Assert the token DML contains `TokenType = 'REFRESH'`, `UsedAt IS NULL`, and `RevokedAt IS NULL`.

- [ ] **Step 2: Add the approval/deactivation concurrency evidence**

In the mocked repository test, assert the target member lock precedes BorrowDetails reads. In `borrowingConcurrency.sqltest.js`, add a live test that races approval and deactivation for one member and accepts only these valid final states:

```text
1. approval commits, deactivation returns ACTIVE_BORROWINGS_EXIST, user ACTIVE, request APPROVED;
2. deactivation commits, approval returns MEMBER_ACCOUNT_INACTIVE, user INACTIVE, request PENDING.
```

No final state may contain an `INACTIVE` user with a newly `APPROVED`/`BORROWED` request from the race.

- [ ] **Step 3: Run RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userLifecycleRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/borrowingRepository.test.js
```

- [ ] **Step 4: Implement deactivation**

Inside one SQL transaction:

```sql
-- actor locked and active Admin
-- target locked with COALESCE(UpdatedAt, CreatedAt), Status, DeactivatedAt
-- roles/member-scoped lock compatible with FE07
-- active BORROWED detail count
UPDATE Users
SET Status = 'INACTIVE', DeactivatedAt = @Now, UpdatedAt = @Now
WHERE UserId = @UserId;

UPDATE AuthTokens
SET RevokedAt = @Now
WHERE UserId = @UserId
  AND TokenType = 'REFRESH'
  AND UsedAt IS NULL
  AND RevokedAt IS NULL;
```

Insert the audit and commit. Return `ACCOUNT_PENDING_ACTIVATION` for null `DeactivatedAt` INACTIVE rows and `ALREADY_DEACTIVATED` for non-null rows without DML.

If current FE07 approval still locks the request before the member, make the minimum repository-only correction to the already approved member-first order and keep every FE07 outcome/write unchanged.

- [ ] **Step 5: Run GREEN and optional SQL**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userLifecycleRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/borrowingRepository.test.js tests/borrowingRoutes.test.js
```

When SQL configuration is available:

```powershell
$env:FE07_SQL_TEST_ALLOW_MUTATION='true'
npm.cmd --prefix backend run test:sql:fe07
```

Record unavailable live SQL as environment evidence only; do not mark the static/concurrency contract missing.

---

### Task 6: Align The User Lifecycle UI And Remove The Dev Bypass

**Files:** user-management API/page and frontend tests.

**Interfaces:** Consumes the effective `updatedAt`; produces authoritative reload behavior.

- [ ] **Step 1: Write frontend RED tests**

Add source/helper tests proving:

```js
assert.doesNotMatch(source, /allowDevUserManagementWithoutLogin|MODE !== 'production'/);
assert.match(source, /<Navigate to="\/login" replace/);
assert.match(source, /expectedUpdatedAt: modal\.user\.updatedAt/);
assert.match(apiSource, /deactivateManagedUser\(userId, expectedUpdatedAt\)/);
assert.match(apiSource, /data: \{ status: 'INACTIVE', expectedUpdatedAt \}/);
assert.match(source, /department/);
assert.match(source, /specialization/);
```

Test `validateUserForm()` for email length 255, field length 100, blank-to-null payloads, and hidden Librarian inputs for Member targets.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd --prefix frontend test -- --test-name-pattern="FE11"
```

Expected: failures for the bypass, missing versions, and missing Librarian inputs.

- [ ] **Step 3: Implement the route guard and payloads**

Use stored auth state consistently:

```jsx
const access = readStoredAdminAccess();
if (!access.authenticated) return <Navigate to="/login" replace />;
if (!access.isAdmin) return <Navigate to="/home" replace />;
const currentAdmin = access.user;
```

Require an access or refresh token in the same storage as `authUser`. Remove the mode constant and make `requireAdminSession()` rely on the same helper.

Send `expectedUpdatedAt` for update and deactivation. On success, close the modal/drawer and reload the current authoritative page and detail owner. On stale/pending/active-borrowing errors, keep the form/drawer open and show the safe mapped message.

Enable deactivation only for `ACTIVE` and `LOCKED` rows. Add `ACCOUNT_PENDING_ACTIVATION` to the API error map even though pending rows do not expose the button, because direct/concurrent responses must remain understandable.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

---

### Task 7: Pass Wave A H2, Publish PR 2, And Integrate After H3

**Files:** all Wave A files and Wave A validation record.

- [ ] **Step 1: Run full Wave A evidence**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
node -e "require('yamljs').load('backend/src/docs/openapi.yaml'); console.log('openapi ok')"
node -e "require('./backend/src/app'); console.log('backend import ok')"
npm.cmd run test:e2e
git diff --check
```

Also scan:

```powershell
rg -n "allowDevUserManagementWithoutLogin|MODE !== 'production'|NVarChar\(100\).*Email|RecipientEmail.*NVarChar\(100\)" backend/src frontend/src database
rg -n "password|token|secret|credential" database/migrations/2026-07-19-fe11-finalization.sql .sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md
```

Expected: no product-drift hits; any documentation occurrence is inspected manually.

- [ ] **Step 2: Freeze and present H2**

```powershell
git add -N -- database/migrations/2026-07-19-fe11-finalization.sql backend/src/repositories/userLifecycleRepository.js backend/tests/fe11SchemaMigration.test.js backend/tests/userRepository.test.js backend/tests/userLifecycleRepository.test.js .sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md
git diff --binary | git hash-object --stdin
git diff --check
```

Record the hash, RED/GREEN history, L1-L4 results, residual SQL evidence, and exact file scope. Stop for H2.

In the H2-reviewed Wave A documentation diff, check `FE11-FIN01` and `FE11-LIFE01..FE11-LIFE05` only when their named evidence is present. Keep `FE11-LIFE06` unchecked through the implementation commit and PR checks.

- [ ] **Step 3: Commit the unchanged H2-reviewed set**

```powershell
git add -- database backend/src backend/tests frontend/src frontend/test docs/api .sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md .sdd/specs/feat-user-role-management
git commit -m "feat(fe11): complete user lifecycle core"
git push -u origin feat/fe11-finalization-wave-a
gh pr create --base main --head feat/fe11-finalization-wave-a --title "feat(fe11): complete user lifecycle core" --body "Implements FE11-LIFE01..FE11-LIFE05 from the approved FE11 Finalization Batch. Includes schema/email synchronization, Librarian fields, optimistic/no-op updates, atomic deactivation, access hardening, tests, and H2 evidence. Excludes Request Management behavior."
gh pr checks --watch
```

- [ ] **Step 4: Request H3, merge, and verify exact main CI**

After H3:

```powershell
gh pr merge --merge --delete-branch
git fetch origin main
$waveAMerge = gh pr view --json mergeCommit --jq .mergeCommit.oid
gh run list --branch main --commit $waveAMerge --limit 5
```

Do not mark `FE11-LIFE06` complete until the exact main CI succeeds.

---

### Task 8: Canonicalize The Admin Request List

**Files:** Admin validators/repository/service/controller/routes, tests, docs.

**Interfaces:** Produces the canonical `{ data, pagination }` list.

- [ ] **Step 1: Create the Wave B worktree**

```powershell
git fetch origin main
git worktree add .worktrees/fe11-finalization-wave-b -b feat/fe11-finalization-wave-b origin/main
npm.cmd ci
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
```

- [ ] **Step 2: Write route/service/repository RED tests**

Route tests mirror Audit Logs and prove Admin-first validation for defaults, bounds, enums, dates, and `from <= to`. Unknown keys are ignored by `matchedData`.

Repository tests assert:

```js
expect(sqlText).toMatch(/ORDER BY[\s\S]*RequestDate DESC[\s\S]*RequestId DESC/);
expect(sqlText).toMatch(/OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY/);
expect(sqlText).toMatch(/COUNT\(DISTINCT/);
expect(sqlText).not.toMatch(/STRING_AGG/);
expect(bindings).toMatchObject({ Offset: 20, Limit: 20, Status: 'PENDING' });
```

Use fixtures with titles/categories containing commas and duplicate categories; expect title-per-detail order and unique first-occurrence category order.

- [ ] **Step 3: Run RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminRequestRoutes.test.js tests/adminRequestService.test.js tests/adminRequestRepository.test.js
```

- [ ] **Step 4: Implement canonical validation and pagination**

Add `requestListQueryValidators` and `assignValidatedRequestQuery`. In `adminRepository.listRequests`, page distinct request headers first and join child rows after paging. Use `EXISTS` for title search so one request header appears once. Return grouped DTOs and `Math.ceil(total / limit)`.

Service input is already normalized and returns the repository envelope unchanged. Controller reads `req.validatedRequestQuery`.

- [ ] **Step 5: Run GREEN**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminRequestRoutes.test.js tests/adminRequestService.test.js tests/adminRequestRepository.test.js tests/adminAuditLogRoutes.test.js tests/adminAuditLogService.test.js
```

---

### Task 9: Add The Canonical Request Detail Read Boundary

**Files:** Admin service/controller/routes/validators, borrowing repository read reuse, tests.

**Interfaces:** Produces the exact `AdminRequestDetail` DTO without new SQL in FE11.

- [ ] **Step 1: Write RED tests**

Route tests: 401/403 before invalid ID validation, 400 invalid ID, 404 `BORROW_REQUEST_NOT_FOUND`, 200 exact DTO.

Service projection test:

```js
expect(result).toEqual({
  requestId: 25,
  requestDate: expect.any(Date),
  status: 'PENDING',
  createdAt: expect.any(Date),
  updatedAt: null,
  member: {
    userId: 10,
    memberId: 7,
    fullName: 'Member Name',
    email: 'member@example.test',
    phoneNumber: '0900000000',
    status: 'ACTIVE',
  },
  items: [
    {
      borrowDetailId: 80,
      copyId: 44,
      barcode: 'BC-0044',
      title: 'Book A',
      author: 'Author A',
      location: 'Shelf A',
      status: 'REQUESTED',
    },
  ],
  lifecycle: { approvedAt: null, rejectedAt: null, processedAt: null },
});
expect(JSON.stringify(result)).not.toMatch(/password|token|session|createdBy|approvedBy/i);
```

- [ ] **Step 2: Run RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminRequestRoutes.test.js tests/adminRequestService.test.js
```

- [ ] **Step 3: Implement detail projection**

Add `GET /api/admin/requests/:requestId`. `adminService.getRequest()` calls `borrowingRepository.findBorrowRequestById(requestId)` and maps only approved fields. Do not add repository SQL or mutation aliases.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminRequestRoutes.test.js tests/adminRequestService.test.js tests/borrowingRepository.test.js
```

---

### Task 10: Prove FE07 Terminal-State Immutability

**Files:** FE07 route/repository tests and Admin boundary test; production FE07 files change only if a test exposes non-conformance.

- [ ] **Step 1: Add focused regression tests**

For each status `APPROVED`, `REJECTED`, `COMPLETED`, and `CANCELLED`, call both approve and reject services/routes and assert:

```js
expect(error).toMatchObject({ statusCode: 409, code: 'BORROW_REQUEST_NOT_PENDING' });
expect(repository.approveBorrowRequest).not.toHaveBeenCalled();
expect(repository.rejectBorrowRequest).not.toHaveBeenCalled();
expect(auditLogRepository.create).not.toHaveBeenCalled();
```

Extend `adminBorrowingRouteBoundary.test.js` to forbid `/admin/requests/:id/approve` and `/reject` aliases.

- [ ] **Step 2: Run the tests**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js tests/adminBorrowingRouteBoundary.test.js
```

Expected: existing FE07 terminal guards may already pass. Record that as pre-existing GREEN evidence; do not manufacture a production diff. If a case fails, make only the smallest FE07-owned correction and rerun RED-GREEN.

---

### Task 11: Migrate The Admin Request UI And Safe CSV Export

**Files:** `adminApi.js`, `adminRequests.js`, `UserManagement.jsx`, and frontend tests.

**Interfaces:** Consumes canonical list/detail APIs and FE07 mutations.

- [ ] **Step 1: Create pure helper RED tests**

Test these exact behaviors:

```js
assert.deepEqual(buildAdminRequestParams({
  page: 2, limit: 20, q: '  alice  ', status: 'pending', from: '2026-07-01', to: '2026-07-19',
}), {
  page: 2, limit: 20, q: 'alice', status: 'PENDING', from: '2026-07-01', to: '2026-07-19',
});

assert.equal(escapeCsvCell('=SUM(A1:A2)'), "\"'=SUM(A1:A2)\"");
assert.match(buildAdminRequestCsv(rows), /requestId,requestDate,status,memberUserId/);
```

Also test `fetchAllAdminRequestRows()` with 201 fixtures over three pages, an empty result with `totalPages: 0`, and a page-2 error that produces no CSV result.

- [ ] **Step 2: Implement the helper module**

Use this interface:

```js
export function buildAdminRequestParams(input = {}) {
  const params = {
    page: Number(input.page || 1),
    limit: Number(input.limit || 20),
  };
  const q = String(input.q || '').trim();
  const status = String(input.status || '').trim().toUpperCase();
  if (q) params.q = q;
  if (status && status !== 'ALL') params.status = status;
  if (input.from) params.from = input.from;
  if (input.to) params.to = input.to;
  return params;
}

export function escapeCsvCell(value) {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  const safe = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildAdminRequestCsv(rows) {
  const columns = [
    'requestId', 'requestDate', 'status', 'memberUserId', 'memberName',
    'memberEmail', 'memberPhoneNumber', 'itemCount', 'bookTitles', 'categories',
  ];
  const values = (row) => ({
    requestId: row.requestId,
    requestDate: row.requestDate,
    status: row.status,
    memberUserId: row.member?.userId,
    memberName: row.member?.fullName,
    memberEmail: row.member?.email,
    memberPhoneNumber: row.member?.phoneNumber,
    itemCount: row.itemCount,
    bookTitles: row.bookTitles,
    categories: row.categories,
  });
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => escapeCsvCell(values(row)[column])).join(',')),
  ].join('\r\n');
}
export async function fetchAllAdminRequestRows(loadPage, filters) {
  const rows = [];
  for (let page = 1; ; page += 1) {
    const result = await loadPage({ ...filters, page, limit: 100 });
    rows.push(...(result.data || []));
    if (!(result.data || []).length || page >= Number(result.pagination?.totalPages || 0)) break;
  }
  return rows;
}
```

- [ ] **Step 3: Add API adapters and source RED tests**

Add `adminApi.requestDetail(requestId)`. Lock canonical `from`/`to`, server pagination, `requestId`, authoritative detail fetch, terminal controls, failure preservation, and `requestExporting` state in source tests.

- [ ] **Step 4: Implement the component flow**

Replace client slicing with `requestPagination`. `loadRequests(page)` preserves the last successful page on failure. `openRequestDetail(requestId)` loads from the server before opening. Successful FE07 mutations reload the current page; failure leaves the modal and detail intact. Only `PENDING` renders approve/reject controls.

Export freezes current filters, loads all pages with `limit=100`, builds the fixed CSV, and downloads only after every page succeeds.

- [ ] **Step 5: Run GREEN**

```powershell
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

---

### Task 12: Add Dashboard Evidence And Feature-Specific FE11 Browser Acceptance

**Files:** dashboard service test, E2E fixture service, system server, and FE11 Playwright spec.

**Interfaces:** Produces evidence for the existing read-only Dashboard plus isolated Admin, active Librarian, pending request, terminal request, and more than one list page.

- [ ] **Step 1: Add evidence-only Dashboard coverage**

Create `backend/tests/adminDashboardService.test.js`. Mock `adminRepository.getDashboard()` with the current approved DTO and prove `adminService.getDashboard()` returns the read-only `summary` and `charts` contract without invoking resource mutation or FE12 report-generation methods. Retain the existing Admin authentication/authorization route evidence; do not redesign dashboard SQL, add FE12 production code, or change dashboard behavior solely to satisfy this test.

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminDashboardService.test.js tests/securityRegression.test.js
```

- [ ] **Step 2: Add E2E-only services**

Create `fe11Fixtures.js` with in-memory `userManagementService` and `adminService`. It must implement only the route methods exercised by the Admin page, including the existing read-only Dashboard DTO, and must never be imported by production code.

Expose `seed({ adminUserId, librarianUserId })` that creates:

```js
{
  users: [activeLibrarianWithUpdatedAt],
  requests: Array.from({ length: 21 }, (_, index) => ({
    requestId: index + 1,
    requestDate: new Date(Date.UTC(2026, 6, 19, 8, index, 0)),
    status: index === 20 ? 'COMPLETED' : 'PENDING',
    member: { userId: 500 + index, fullName: `Member ${index + 1}`, email: `member${index + 1}@example.test`, phoneNumber: null },
    itemCount: 1,
    bookTitles: [`Book ${index + 1}`],
    categories: ['General'],
  })),
  pendingRequestId: 1,
  terminalRequestId: 21,
}
```

Rebuild the E2E app in `systemTestServer.js` with `createApp({ ...setup.services, userManagementService, adminService })`, and add `POST /__e2e__/setup-fe11` to create a verified Admin and Librarian plus the fixtures.

- [ ] **Step 3: Write the Playwright test**

The test performs:

```js
await page.goto('/admin/users');
await expect.poll(() => new URL(page.url()).pathname).toBe('/login');

await login(page, adminEmail, password, '/admin/users');
await page.getByText('Tổng quan', { exact: true }).click();
// assert the five existing operational summary cards and all three read-only chart panels
await page.getByText('Quản lý người dùng', { exact: true }).click();
// edit department/specialization, save, reopen detail, assert persisted
// deactivate fixture, assert authoritative INACTIVE
await page.getByText('Phân quyền', { exact: true }).click();
await expect(page.getByText('Ma trận phân quyền')).toBeVisible();
await page.getByText('Quản lý yêu cầu', { exact: true }).click();
// verify page 1/2, open pending and terminal authoritative details
await expect(page.getByRole('button', { name: /Duyệt yêu cầu/i })).toHaveCount(0);
```

Use `page.waitForEvent('download')` for CSV; read the downloaded file and assert the fixed header, rows from both pages, and no unapproved nested fields.

- [ ] **Step 4: Run browser RED-GREEN**

```powershell
npx playwright test tests/e2e/fe11-admin-console.spec.js --project=chromium
npm.cmd run test:e2e
```

Expected: new FE11 test and existing golden path pass.

---

### Task 13: Pass Wave B H2, Publish PR 3, And Integrate After H3

- [ ] **Step 1: Run full evidence**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
npm.cmd run test:e2e
node -e "require('yamljs').load('backend/src/docs/openapi.yaml'); console.log('openapi ok')"
node -e "require('./backend/src/app'); console.log('backend import ok')"
git diff --check
```

Run scope scans for Admin mutation aliases, legacy `fromDate`/`toDate`, client `pagedRequests`, `STRING_AGG` in request list, and unsafe CSV formulas.

- [ ] **Step 2: Freeze and present H2**

```powershell
git add -N -- backend/tests/adminRequestRepository.test.js backend/tests/adminRequestService.test.js backend/tests/adminRequestRoutes.test.js frontend/src/utils/adminRequests.js frontend/test/adminRequests.test.js tests/e2e/fe11-admin-console.spec.js tests/e2e/support/fe11Fixtures.js .sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md
git diff --binary | git hash-object --stdin
git diff --check
```

Stop for H2 with L1-L4 evidence and the exact diff hash.

In the H2-reviewed Wave B documentation diff, check `FE11-REQ01..FE11-REQ03` only when their named evidence is present. Keep `FE11-ACC01` unchecked through the implementation commit and PR checks.

- [ ] **Step 3: Commit, publish, request H3, and merge**

```powershell
git add -- backend/src backend/tests frontend/src frontend/test tests/e2e docs/api .sdd/specs/feat-user-role-management .sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md
git commit -m "feat(fe11): complete admin request management"
git push -u origin feat/fe11-finalization-wave-b
gh pr create --base main --head feat/fe11-finalization-wave-b --title "feat(fe11): complete admin request management" --body "Implements FE11-REQ01..FE11-REQ03 and supplies pre-integration evidence for FE11-ACC01: canonical Admin request list/detail reads, server pagination, FE07-owned terminal actions, safe CSV export, Dashboard evidence, and FE11 browser acceptance."
gh pr checks --watch
```

After H3, merge and associate the exact `main` CI run. `FE11-ACC01` becomes eligible to close only after that exact run passes and is recorded in PR 4. Do not close FE11 debt before PR 4.

---

### Task 14: Publish Final FE11 B7 Closeout

**Files:** Closeout files from the File Map.

**Interfaces:** Consumes all PR numbers, merge SHAs, H2/H3 records, and exact `main` CI run IDs.

- [ ] **Step 1: Create the closeout worktree**

```powershell
git fetch origin main
git worktree add .worktrees/fe11-finalization-closeout -b docs/fe11-finalization-closeout origin/main
```

- [ ] **Step 2: Apply evidence-only transitions**

Set FE11 PLAN/TASKS top state to `COMPLETE THROUGH B7`. Confirm `FE11-FIN01`, `FE11-LIFE01..FE11-LIFE05`, and `FE11-REQ01..FE11-REQ03` have their named evidence; check `FE11-LIFE06` and `FE11-ACC01` from the exact Wave A/Wave B integration records, then check `FE11-FIN02`. Update traceability statuses for AC-FE11-004/005/007/008/009/011/012/016/017/018/019/023 and remaining partial unwanted-behavior rows only with observed evidence. Update `FR-FE11-031` only from the evidence-only Dashboard service/route/browser coverage; do not claim a Dashboard redesign.

Move `TD-012`, `TD-014`, `TD-015`, `TD-016`, `TD-017`, and `TD-025` to Resolved. Update `.agents/CLAUDE.md` so FE11 is no longer described as deferred. Keep unrelated feature debt unchanged.

If live SQL Server evidence is unavailable, rewrite `TD-021` so its only remaining sentence is the unavailable live migration/concurrency execution; otherwise resolve it with the observed run.

- [ ] **Step 3: Verify facts and scope**

```powershell
git diff --check
git diff --name-only
rg -n "COMPLETE THROUGH B7|FE11-FIN02|TD-012|TD-025|TD-021" .agents/CLAUDE.md .sdd/specs/feat-user-role-management TECH_DEBT.md
$waveAPr = gh pr list --state merged --head feat/fe11-finalization-wave-a --json number --jq '.[0].number'
$waveBPr = gh pr list --state merged --head feat/fe11-finalization-wave-b --json number --jq '.[0].number'
gh pr view $waveAPr --json state,mergeCommit,statusCheckRollup,url
gh pr view $waveBPr --json state,mergeCommit,statusCheckRollup,url
```

- [ ] **Step 4: Obtain closeout H2/H3 and merge PR 4**

Present the exact documentation diff for H2. After approval:

```powershell
git add -- .agents/CLAUDE.md .sdd/specs/feat-auth/SPEC.md .sdd/specs/feat-user-role-management .sdd/reviews/fe11-finalization-*.md TECH_DEBT.md
git commit -m "docs: close FE11 finalization batch"
git push -u origin docs/fe11-finalization-closeout
gh pr create --base main --head docs/fe11-finalization-closeout --title "docs: close FE11 finalization batch"
gh pr checks --watch
```

Request H3 after checks. After H3, merge and watch the final exact `main` CI. FE11 is complete only after that run succeeds.

---

## Self-Review Results

- Spec coverage: Tasks 2-7 cover schema, email delivery width, Librarian create/read/update, effective concurrency version, no-op update, deterministic duplicate email, transactional create/resend acting-Admin checks, route validation, actor/target errors, atomic deactivation, session invalidation, Admin access hardening, and Wave A B7.
- Request and acceptance coverage: Tasks 8-13 cover canonical request query names, distinct-header pagination, matching count/data scope, detail projection, FE07 mutation ownership, terminal immutability, authoritative modal behavior, safe all-page CSV, evidence-only Admin Dashboard coverage, and browser acceptance.
- Cross-feature ownership: FE02/FE03/FE10 receive only schema/data-contract synchronization; FE07 receives no new business rule or Admin alias; FE12 production files are absent.
- Completeness scan: every implementation step names concrete files, interfaces, commands, expected outcomes, and observed integration identifiers.
- Type consistency: `expectedUpdatedAt` is always a Date at the backend boundary and ISO string over HTTP; list/detail use `requestId`; list query uses `from`/`to`; frontend and backend use the same pagination envelope.
- State consistency: pending activation and deactivated accounts are distinguished by `DeactivatedAt`; only ACTIVE/LOCKED transition; terminal borrow requests never expose actions.
- Gate consistency: PR 1 must merge before product work and leaves all new tasks unchecked; Wave A may check `FE11-FIN01` and `FE11-LIFE01..LIFE05` at H2 but not `LIFE06` before exact main CI; Wave B may check `REQ01..REQ03` at H2 but not `ACC01` before exact main CI; every PR requires H3; PR 4 is the only whole-feature completion transition.

## Execution Handoff

Nhat approved the corrected design and this implementation plan on 2026-07-19. That approval
authorizes preparation of the Task 1 governance activation diff; Step 5 still requires review of the
exact governance diff before PR 1 is committed and published.

Plan implementation should use `executing-plans` in serial batches with checkpoints at governance H1, Wave A H2/H3, Wave B H2/H3, and closeout H2/H3. Subagent work is permitted only after explicit user authorization and must remain read-only or file-disjoint from the active Core writer.
