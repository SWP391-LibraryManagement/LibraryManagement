# FE11 Transactional Role Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make FE11 role assignment and revocation deterministic, concurrency-safe, and atomically audited without expanding into the remaining deferred FE11 work.

**Architecture:** Add a focused `userRoleRepository` that owns the locked SQL transaction and returns business outcomes. Keep HTTP validation at the route boundary, map outcomes to safe errors in `userManagementService`, and read back the existing safe managed-user DTO only after a successful commit.

**Tech Stack:** Node.js CommonJS, Express 5, express-validator, Jest 30, SQL Server via `mssql`, Markdown SDD artifacts.

## Global Constraints

- Approved stack remains Node.js + Express.js, React + Bootstrap, SQL Server, and RESTful API.
- Implement only `BR-FE11-001`, `BR-FE11-007..010`, `FR-FE11-012..017`, `FR-FE11-024..027`, `AC-FE11-013..015`, `NFR-FE11-SEC-001..005`, `NFR-FE11-TXN-003`, and `NFR-FE11-TXN-006` for this slice.
- Keep FE11 `Implementation State: DEFERRED`; record this completed slice separately because the global checker applies 70% to all 38 FE11 FRs.
- Do not change database schema, public endpoint paths, role hierarchy, user update/deactivation behavior, librarian fields, or Admin UI.
- Authenticate and authorize before exposing input-validation details.
- Use only parameterized SQL; never persist or return credentials, tokens, sessions, or setup links.
- Every production behavior change must have an observed failing test first.
- Preserve unrelated user changes and untracked files.

---

### Task 1: Activate The Approved FE11 Role Slice

**Files:**
- Modify: `docs/superpowers/specs/2026-07-18-fe11-transactional-role-management-design.md`
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Interfaces:**
- Consumes: approved FE11 design and current account-setup task group `FE11-S01..S08`.
- Produces: approved task IDs `FE11-R01..R05` and explicit evidence expectations used by later tasks.

- [ ] **Step 1: Mark the written design approved and record the metadata exception**

Ensure the design status is:

```markdown
Status: APPROVED BY HUMAN - 2026-07-18
```

Its traceability section must state that whole-feature state remains `DEFERRED` until feature-wide evidence reaches the existing gate or a separately approved scoped-denominator contract exists.

- [ ] **Step 2: Add the bounded role slice to FE11 PLAN.md**

Append this scope after the account-setup plan:

```markdown
## 10. Transactional Role Management Slice

### In Scope

- Validate positive-integer target and role IDs.
- Revalidate the acting active Admin under the SQL transaction.
- Assign/revoke role mappings with deterministic duplicate/missing errors.
- Protect the final user role and last active Admin under `UPDLOCK, HOLDLOCK`.
- Commit role mutation and audit together.
- Add route, service, and repository tests.

### Out Of Scope

- User update/deactivation, librarian fields, safe detail DTO reconciliation, and Admin UI.
- Schema changes, role creation/editing, permission editing, and role hierarchy.

### Validation Gate

- Focused RED-GREEN tests prove each repository outcome and API mapping.
- Full backend tests and `trace:enforce` pass.
- FE11 remains whole-feature `DEFERRED`; completed role-slice evidence is recorded separately.
```

Update the top status to mention that account setup is complete, the transactional role slice is approved for implementation, and remaining FE11 work is deferred.

- [ ] **Step 3: Add task group FE11-R01..R05**

Insert before `## Deferred FE11 Work`:

```markdown
## Transactional Role Management Tasks

- [ ] **FE11-R01 - Validate role mutation request IDs.**
  - Maps to: NFR-FE11-SEC-004; FR-FE11-012..013, FR-FE11-024..026.
  - DoD: authenticated Admin requests receive normalized positive integer IDs; invalid IDs return `400 VALIDATION_ERROR` before the service is called.

- [ ] **FE11-R02 - Add RED transactional repository tests.**
  - Maps to: BR-FE11-007..010; FR-FE11-014, FR-FE11-017, FR-FE11-024..027; NFR-FE11-TXN-003/006.
  - DoD: failing tests cover actor/target/role lookup, duplicate/missing mapping, final-role guards, locked Admin count, atomic audit, and rollback.

- [ ] **FE11-R03 - Implement transactional role mutation.**
  - Dependencies: FE11-R02.
  - DoD: one parameterized SQL transaction returns deterministic outcomes, uses required lock hints, and commits or rolls back mapping plus audit together.

- [ ] **FE11-R04 - Map repository outcomes through the FE11 service.**
  - Dependencies: FE11-R03.
  - DoD: service-level RED-GREEN tests prove safe status/code/message mapping and successful safe-user readback without a second audit.

- [ ] **FE11-R05 - Pass the transactional role-management validation gate.**
  - Dependencies: FE11-R01..R04.
  - DoD: focused/full backend tests, traceability, diff hygiene, security review, documentation, debt reconciliation, and human review evidence are complete.
```

Keep the existing line exactly:

```markdown
Implementation State: DEFERRED
```

- [ ] **Step 4: Update TEST_PLAN.md and CHANGELOG.md**

Add the approved role slice to Current Evidence/Gaps and add a dated changelog entry stating that design and task planning were approved but implementation evidence is not yet claimed.

- [ ] **Step 5: Run documentation checks**

Run:

```powershell
npm.cmd run test:traceability-state
npm.cmd run trace:enforce
git diff --check -- docs/superpowers/specs/2026-07-18-fe11-transactional-role-management-design.md .sdd/specs/feat-user-role-management
```

Expected: 4/4 traceability-state tests pass; traceability remains PASS with five enforced PARTIAL features; Markdown diff check is clean.

- [ ] **Step 6: Commit the approved planning checkpoint**

```powershell
git add -- docs/superpowers/specs/2026-07-18-fe11-transactional-role-management-design.md .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md
git commit -m "docs: plan transactional FE11 role management"
```

---

### Task 2: Validate Role Mutation Inputs At The Route Boundary

**Files:**
- Modify: `backend/tests/userManagementRoutes.test.js`
- Modify: `backend/src/validators/userManagementValidators.js`
- Modify: `backend/src/routes/userManagementRoutes.js`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`

**Interfaces:**
- Consumes: existing `handleValidationErrors` and Admin-first route middleware.
- Produces: `assignRoleValidators` and `revokeRoleValidators`; controllers receive numeric IDs and assignment body `{ roleId: number }`.

- [ ] **Step 1: Write failing assignment and revocation route tests**

Add successful normalization cases:

```js
test('POST /api/users/:userId/roles passes normalized IDs and Admin context', async () => {
  const updatedUser = { userId: 7, roles: ['LIBRARIAN', 'MEMBER'] };
  const userManagementService = { assignRole: jest.fn(async () => updatedUser) };
  const app = makeApp({ userManagementService });

  const response = await request(app)
    .post('/api/users/7/roles')
    .set('Authorization', 'Bearer token')
    .send({ roleId: 3 });

  expect(response.status).toBe(200);
  expect(response.body).toEqual(updatedUser);
  expect(userManagementService.assignRole).toHaveBeenCalledWith(
    7,
    { roleId: 3 },
    expect.objectContaining({ adminUserId: 99 })
  );
});

test('DELETE /api/users/:userId/roles/:roleId passes normalized IDs and Admin context', async () => {
  const updatedUser = { userId: 7, roles: ['MEMBER'] };
  const userManagementService = { revokeRole: jest.fn(async () => updatedUser) };
  const app = makeApp({ userManagementService });

  const response = await request(app)
    .delete('/api/users/7/roles/3')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(200);
  expect(response.body).toEqual(updatedUser);
  expect(userManagementService.revokeRole).toHaveBeenCalledWith(
    7,
    3,
    expect.objectContaining({ adminUserId: 99 })
  );
});
```

Add table-driven invalid cases for `userId` values `0`, `-1`, `not-a-user`, assignment body role IDs `0`, `-1`, `missing`, and revocation role parameter values `0`, `-1`, `not-a-role`. Each test must expect `400`, code `VALIDATION_ERROR`, field-specific details, and no service call.

- [ ] **Step 2: Run RED**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js
```

Expected: new invalid-ID tests fail because role routes have no validators and controllers receive string parameters.

- [ ] **Step 3: Implement focused validators**

Update the validator module:

```js
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

function positiveIdParam(name, label) {
  return param(name)
    .isInt({ min: 1 })
    .withMessage(`${label} must be a positive integer.`)
    .toInt();
}

const assignRoleValidators = [
  positiveIdParam('userId', 'User ID'),
  body('roleId')
    .exists({ values: 'null' })
    .withMessage('Role ID is required.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

const revokeRoleValidators = [
  positiveIdParam('userId', 'User ID'),
  positiveIdParam('roleId', 'Role ID'),
  handleValidationErrors,
];
```

Retain `resendSetupValidators` using the same helper. Export all three validator arrays.

Wire routes after Admin authentication/authorization:

```js
router.post('/:userId/roles', ...requireAdmin, assignRoleValidators, controller.assignRole);
router.delete(
  '/:userId/roles/:roleId',
  ...requireAdmin,
  revokeRoleValidators,
  controller.revokeRole
);
```

- [ ] **Step 4: Run GREEN and regression route tests**

Run the focused command from Step 2.

Expected: all `userManagementRoutes.test.js` tests pass; unauthenticated/non-Admin tests still return `401`/`403` before validation details.

- [ ] **Step 5: Mark FE11-R01 complete and commit**

```powershell
git add -- backend/tests/userManagementRoutes.test.js backend/src/validators/userManagementValidators.js backend/src/routes/userManagementRoutes.js .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix: validate FE11 role mutation inputs"
```

---

### Task 3: Build The Transactional Role Repository

**Files:**
- Create: `backend/tests/userRoleRepository.test.js`
- Create: `backend/src/repositories/userRoleRepository.js`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`

**Interfaces:**
- Consumes: `getPool`, `sql.Transaction`, `sql.Request`, and SQL tables `Users`, `Roles`, `UserRoles`, `AuditLogs`.
- Produces: `mutateUserRole({ operation, adminUserId, userId, roleId, ipAddress, userAgent, now }) -> { outcome, role? }`.

- [ ] **Step 1: Create the mocked SQL transaction harness**

In `userRoleRepository.test.js`, mock `../src/config/db` with a `Transaction` that records `commitCount` and `rollbackCount`, and a `Request` that records typed inputs then delegates each SQL string to `pool.transactionQuery(query, inputs)`.

Use a queue helper:

```js
function useTransactionResults(results) {
  const calls = [];
  getPool.mockResolvedValue({
    async transactionQuery(query, inputs) {
      calls.push({ query, inputs });
      const next = results.shift();
      if (next instanceof Error) throw next;
      return { recordset: next || [] };
    },
  });
  return calls;
}
```

Reset `getPool` and `sql.Transaction.instances` before each test.

- [ ] **Step 2: Write RED outcome and atomicity tests**

Add tests for:

```js
test('assigns a missing mapping and audits in one committed transaction', async () => {
  const calls = useTransactionResults([
    [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 1 }],
    [{ UserId: 7 }],
    [{ RoleId: 3, RoleName: 'LIBRARIAN' }],
    [],
    [],
    [],
  ]);

  await expect(userRoleRepository.mutateUserRole({
    operation: 'ASSIGN', adminUserId: 99, userId: 7, roleId: 3,
    ipAddress: '127.0.0.1', userAgent: 'jest', now: FIXED_NOW,
  })).resolves.toEqual({
    outcome: 'ASSIGNED', role: { roleId: 3, roleName: 'LIBRARIAN' },
  });

  expect(calls.some(({ query }) => query.includes('INSERT INTO UserRoles'))).toBe(true);
  expect(calls.some(({ query }) => query.includes('INSERT INTO AuditLogs'))).toBe(true);
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(1);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(0);
});
```

Add corresponding successful revocation. Add table-driven expected outcomes for `ADMIN_NOT_FOUND`, `ADMIN_REQUIRED`, `USER_NOT_FOUND`, `ROLE_NOT_FOUND`, `USER_ALREADY_HAS_ROLE`, `USER_ROLE_NOT_FOUND`, `LAST_USER_ROLE`, and `LAST_ADMIN_ROLE`. Expected business outcomes must roll back read-only transactions and must not execute mutation/audit SQL.

Add an audit-insert failure case that expects the original error, `commitCount = 0`, and `rollbackCount = 1` after the mapping SQL was attempted.

Assert protected select SQL contains `UPDLOCK` and `HOLDLOCK`, and assert input values are present in the captured typed input maps rather than interpolated into SQL.

- [ ] **Step 3: Run RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userRoleRepository.test.js
```

Expected: FAIL because `userRoleRepository.js` does not exist.

- [ ] **Step 4: Implement the transaction and deterministic outcomes**

Create the repository with the complete transaction below:

```js
const { sql, getPool } = require('../config/db');

const OPERATIONS = new Set(['ASSIGN', 'REVOKE']);

async function rollbackWith(transaction, outcome) {
  await transaction.rollback();
  return { outcome };
}

async function mutateUserRole({
  operation,
  adminUserId,
  userId,
  roleId,
  ipAddress,
  userAgent,
  now = new Date(),
}) {
  if (!OPERATIONS.has(operation)) {
    throw new TypeError('Role mutation operation must be ASSIGN or REVOKE.');
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const actorResult = await new sql.Request(transaction)
      .input('AdminUserId', sql.Int, adminUserId)
      .query(`
        SELECT
          u.UserId,
          u.Status,
          CASE WHEN EXISTS (
            SELECT 1
            FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
            INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId
            WHERE ur.UserId = u.UserId
              AND UPPER(r.RoleName) = 'ADMIN'
          ) THEN 1 ELSE 0 END AS IsAdmin
        FROM Users u WITH (UPDLOCK, HOLDLOCK)
        WHERE u.UserId = @AdminUserId
      `);

    const actor = actorResult.recordset[0];
    if (!actor) return rollbackWith(transaction, 'ADMIN_NOT_FOUND');
    if (actor.Status !== 'ACTIVE' || !actor.IsAdmin) {
      return rollbackWith(transaction, 'ADMIN_REQUIRED');
    }

    const targetResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT UserId
        FROM Users WITH (UPDLOCK, HOLDLOCK)
        WHERE UserId = @UserId
      `);
    if (!targetResult.recordset[0]) {
      return rollbackWith(transaction, 'USER_NOT_FOUND');
    }

    const roleResult = await new sql.Request(transaction)
      .input('RoleId', sql.Int, roleId)
      .query(`
        SELECT RoleId, RoleName
        FROM Roles WITH (UPDLOCK, HOLDLOCK)
        WHERE RoleId = @RoleId
      `);
    const roleRow = roleResult.recordset[0];
    if (!roleRow) return rollbackWith(transaction, 'ROLE_NOT_FOUND');

    const role = { roleId: roleRow.RoleId, roleName: roleRow.RoleName };
    const mappingResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT ur.RoleId, r.RoleName
        FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId
        WHERE ur.UserId = @UserId
      `);
    const targetRoles = mappingResult.recordset;
    const existingMapping = targetRoles.some((item) => item.RoleId === roleId);

    if (operation === 'ASSIGN' && existingMapping) {
      return rollbackWith(transaction, 'USER_ALREADY_HAS_ROLE');
    }

    if (operation === 'REVOKE' && !existingMapping) {
      return rollbackWith(transaction, 'USER_ROLE_NOT_FOUND');
    }

    if (operation === 'REVOKE' && targetRoles.length <= 1) {
      return rollbackWith(transaction, 'LAST_USER_ROLE');
    }

    if (operation === 'REVOKE' && String(role.roleName).toUpperCase() === 'ADMIN') {
      const adminsResult = await new sql.Request(transaction).query(`
        SELECT ur.UserId
        FROM UserRoles ur WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Roles r WITH (UPDLOCK, HOLDLOCK) ON r.RoleId = ur.RoleId
        INNER JOIN Users u WITH (UPDLOCK, HOLDLOCK) ON u.UserId = ur.UserId
        WHERE UPPER(r.RoleName) = 'ADMIN'
          AND u.Status = 'ACTIVE'
      `);

      if (adminsResult.recordset.length <= 1) {
        return rollbackWith(transaction, 'LAST_ADMIN_ROLE');
      }
    }

    if (operation === 'ASSIGN') {
      await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .input('RoleId', sql.Int, roleId)
        .input('Now', sql.DateTime, now)
        .query(`
          INSERT INTO UserRoles (UserId, RoleId, CreatedAt)
          VALUES (@UserId, @RoleId, @Now)
        `);
    } else {
      await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .input('RoleId', sql.Int, roleId)
        .query(`
          DELETE FROM UserRoles
          WHERE UserId = @UserId AND RoleId = @RoleId
        `);
    }

    const action = operation === 'ASSIGN' ? 'USER_ROLE_ASSIGN' : 'USER_ROLE_REVOKE';
    await new sql.Request(transaction)
      .input('AdminUserId', sql.Int, adminUserId)
      .input('Action', sql.NVarChar(255), action)
      .input('TargetId', sql.Int, userId)
      .input(
        'Metadata',
        sql.NVarChar(sql.MAX),
        JSON.stringify({ roleId: role.roleId, roleName: role.roleName })
      )
      .input('IpAddress', sql.NVarChar(50), ipAddress || null)
      .input('UserAgent', sql.NVarChar(255), userAgent || null)
      .input('Now', sql.DateTime, now)
      .query(`
        INSERT INTO AuditLogs
          (UserId, Action, TargetType, TargetId, Metadata, IpAddress, UserAgent, CreatedAt)
        VALUES
          (@AdminUserId, @Action, 'USER', @TargetId, @Metadata,
           @IpAddress, @UserAgent, @Now)
      `);

    await transaction.commit();
    return { outcome: operation === 'ASSIGN' ? 'ASSIGNED' : 'REVOKED', role };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { mutateUserRole };
```

Add trace tags above the mutation function:

```js
// @spec BR-FE11-007, BR-FE11-009, BR-FE11-010, FR-FE11-012, FR-FE11-013, FR-FE11-014
// @spec FR-FE11-017, FR-FE11-024, FR-FE11-025, FR-FE11-026, FR-FE11-027
```

- [ ] **Step 5: Run GREEN**

Run the focused repository command. Expected: all repository tests pass with no console warnings.

- [ ] **Step 6: Mark FE11-R02/R03 complete and commit**

```powershell
git add -- backend/tests/userRoleRepository.test.js backend/src/repositories/userRoleRepository.js .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "feat: add transactional FE11 role mutations"
```

---

### Task 4: Map Transaction Outcomes In The Service

**Files:**
- Modify: `backend/tests/userManagementService.test.js`
- Modify: `backend/src/services/userManagementService.js`
- Modify: `backend/src/repositories/userRepository.js`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`

**Interfaces:**
- Consumes: `userRoleRepository.mutateUserRole` outcomes from Task 3.
- Produces: `assignRole(userId, { roleId }, context)` and `revokeRole(userId, roleId, context)` with deterministic `AppException` mappings and safe-user readback.

- [ ] **Step 1: Write the service RED harness and outcome tests**

Add a focused harness:

```js
function makeRoleHarness(outcome) {
  const updatedUser = {
    userId: 7,
    email: 'staff@example.test',
    roles: outcome === 'REVOKED' ? ['MEMBER'] : ['LIBRARIAN', 'MEMBER'],
  };
  const userRepository = {
    getManagedUserById: jest.fn(async () => updatedUser),
  };
  const userRoleRepository = {
    mutateUserRole: jest.fn(async () => ({
      outcome,
      role: { roleId: 3, roleName: 'LIBRARIAN' },
    })),
  };
  const service = createUserManagementService({
    userRepository,
    userRoleRepository,
    authTokenRepository: {},
    auditLogRepository: {},
    accountSetupRepository: {},
    notificationRequester: { createNotificationRequest: jest.fn() },
  });
  return { service, userRepository, userRoleRepository, updatedUser };
}
```

Write success tests proving `operation`, numeric IDs, Admin context, and readback. Add table-driven outcome assertions:

```js
test.each([
  ['ADMIN_NOT_FOUND', 404, 'ADMIN_NOT_FOUND', 'Acting admin was not found.'],
  ['ADMIN_REQUIRED', 403, 'ADMIN_REQUIRED', 'Admin access is required.'],
  ['USER_NOT_FOUND', 404, 'USER_NOT_FOUND', 'User was not found.'],
  ['ROLE_NOT_FOUND', 404, 'ROLE_NOT_FOUND', 'Role was not found.'],
  ['USER_ALREADY_HAS_ROLE', 409, 'USER_ALREADY_HAS_ROLE', 'User already has this role.'],
  ['USER_ROLE_NOT_FOUND', 404, 'USER_ROLE_NOT_FOUND', 'User does not have this role.'],
  ['LAST_USER_ROLE', 400, 'LAST_USER_ROLE', 'Every user must keep at least one role.'],
  ['LAST_ADMIN_ROLE', 400, 'LAST_ADMIN_ROLE', 'Cannot remove the last Admin role.'],
])('maps %s to a safe service error', async (outcome, statusCode, code, message) => {
  const { service, userRepository } = makeRoleHarness(outcome);
  await expect(
    service.assignRole(7, { roleId: 3 }, { adminUserId: 99 })
  ).rejects.toMatchObject({ statusCode, code, message });
  expect(userRepository.getManagedUserById).not.toHaveBeenCalled();
});
```

Add direct-input tests for invalid target, role, and acting Admin IDs; they must reject before repository access.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementService.test.js
```

Expected: new role tests fail because the factory does not consume `userRoleRepository` and old role methods silently mutate through `userRepository`.

- [ ] **Step 3: Implement service injection and outcome mapping**

Add `userRoleRepository` to the factory dependencies and default it to `../repositories/userRoleRepository`.

Add a positive-ID helper and outcome mapper:

```js
function parsePositiveId(value, code, message, errorFactory = errors.badRequest) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw errorFactory(code, message);
  }
  return parsed;
}

function throwRoleMutationError(outcome) {
  const mappings = {
    ADMIN_NOT_FOUND: () => errors.notFound('ADMIN_NOT_FOUND', 'Acting admin was not found.'),
    ADMIN_REQUIRED: () => errors.forbidden('ADMIN_REQUIRED', 'Admin access is required.'),
    USER_NOT_FOUND: () => errors.notFound('USER_NOT_FOUND', 'User was not found.'),
    ROLE_NOT_FOUND: () => errors.notFound('ROLE_NOT_FOUND', 'Role was not found.'),
    USER_ALREADY_HAS_ROLE: () => errors.conflict('USER_ALREADY_HAS_ROLE', 'User already has this role.'),
    USER_ROLE_NOT_FOUND: () => errors.notFound('USER_ROLE_NOT_FOUND', 'User does not have this role.'),
    LAST_USER_ROLE: () => errors.badRequest('LAST_USER_ROLE', 'Every user must keep at least one role.'),
    LAST_ADMIN_ROLE: () => errors.badRequest('LAST_ADMIN_ROLE', 'Cannot remove the last Admin role.'),
  };
  const createError = mappings[outcome];
  if (!createError) throw errors.internal();
  throw createError();
}
```

Implement assignment/revocation through one private service helper. It must parse `adminUserId`, `userId`, and `roleId`, call `mutateUserRole`, map non-success outcomes, and call `getManagedUserById` only after `ASSIGNED`/`REVOKED`.

Remove role-specific preflight helpers and separate audit calls from the old methods. After `rg` confirms no consumer remains, remove obsolete `findRoleById`, `findRoleByName`, `assignRole`, `revokeRole`, `countUsersByRole`, and `countRolesByUserId` exports and implementations from `userRepository.js`.

- [ ] **Step 4: Run GREEN and affected tests**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementService.test.js tests/userRoleRepository.test.js tests/userManagementRoutes.test.js
```

Expected: all focused tests pass; account-setup creation/resend tests remain green.

- [ ] **Step 5: Mark FE11-R04 complete and commit**

```powershell
git add -- backend/tests/userManagementService.test.js backend/src/services/userManagementService.js backend/src/repositories/userRepository.js .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix: enforce deterministic FE11 role errors"
```

---

### Task 5: Validate, Reconcile Debt, And Record Evidence

**Files:**
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `TECH_DEBT.md`
- Create: `.sdd/reviews/fe11-transactional-role-management-validation-2026-07-18.md`

**Interfaces:**
- Consumes: completed FE11-R01..R04 implementation and test evidence.
- Produces: FE11-R05 validation record, narrowed technical debt, and reviewer-ready handoff.

- [ ] **Step 1: Run focused and full automated checks**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userRoleRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd run test:traceability-state
npm.cmd run trace:enforce
```

Expected: focused and full backend suites pass; existing coverage thresholds pass; traceability remains PASS because FE11 is explicitly whole-feature `DEFERRED` while its role slice evidence is recorded in tasks/review.

- [ ] **Step 2: Run security and diff hygiene checks**

```powershell
rg -n "password|token|secret|api[_-]?key|private[_-]?key" backend/src/repositories/userRoleRepository.js backend/src/services/userManagementService.js backend/tests/userRoleRepository.test.js backend/tests/userManagementService.test.js
git diff --check
git status --short
```

Expected: any matches are field names or existing account-setup code only; no credential value is introduced. Diff check is clean. Status still shows the user's pre-existing unrelated changes, which must not be staged.

- [ ] **Step 3: Reconcile FE11 documentation and debt**

Mark `FE11-R05` complete only after all evidence passes. Update TEST_PLAN Current Evidence with route/service/repository files and note the absence of disposable SQL Server concurrency testing as a residual gap.

Add a changelog entry describing deterministic errors, transactional audit, last-Admin locking, and test evidence.

Update `TECH_DEBT.md`:

- Mark `TD-013` resolved with the implementation commit/evidence.
- Narrow `TD-014` to remaining non-role actions whose acting-admin/not-found semantics are not yet reconciled.
- Narrow `TD-015` to remaining FE11 service rules; remove the stale claim that `userManagementService.test.js` is missing.
- Leave `TD-012`, `TD-016`, and any genuinely remaining `TD-017` concern unchanged unless separately proven obsolete.

- [ ] **Step 4: Write the B1-B7 validation record**

Create the review with these sections:

```markdown
# FE11 Transactional Role Management Validation

Date: 2026-07-18
Scope: FE11-R01..R05 only

## L1 Automated Evidence
## L2 Spec Compliance
## L3 Constitution And Safety
## L4 Acceptance And Residual Risks
## Files Changed
## Remaining FE11 Work
```

Record exact command counts/results. State that SQL lock behavior is unit-tested through emitted SQL and transaction branches but real concurrent SQL Server acceptance remains a residual environment gap. Do not claim whole-feature FE11 completion.

- [ ] **Step 5: Commit validation evidence**

```powershell
git add -- .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md .sdd/reviews/fe11-transactional-role-management-validation-2026-07-18.md
git commit -m "docs: record FE11 role management validation"
```

## Final Review Checklist

- [ ] The written design remains human-approved and records the `DEFERRED` metadata decision.
- [ ] Every production change was preceded by a focused failing test.
- [ ] Authentication and Admin authorization run before role input validation.
- [ ] Acting Admin, target user, requested role, target mappings, and active Admin holders are locked and validated in one transaction.
- [ ] Duplicate assignment and absent revocation return deterministic errors without audit or mutation.
- [ ] Final user role and final active Admin cannot be revoked.
- [ ] Mapping mutation and audit commit or roll back together.
- [ ] Service returns only the safe managed-user readback.
- [ ] Focused/full backend tests, coverage, traceability, security scan, and diff checks pass.
- [ ] `TD-013` is closed; `TD-014/015` are narrowed without hiding remaining FE11 gaps.
- [ ] No unrelated user files are staged or committed.
