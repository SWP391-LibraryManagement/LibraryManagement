# FE11 Audit Log Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILLS: Use `using-git-worktrees` for Task 0, then `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `FE11-AUD01` / `TD-024` as one Admin-owned, searchable, filterable, read-only Audit Log boundary with typed SQL pagination, action-aware safe metadata projection, canonical frontend consumption, and explicit retirement of the prototype route.

**Architecture:** Keep the existing Express `routes -> controllers -> services -> repositories` flow. The repository owns typed filtering and stable pagination but returns raw rows; `adminService` owns the default-deny DTO projection; the React Admin page consumes only the projected DTO through `adminApi` and never parses raw metadata.

**Tech Stack:** Node.js CommonJS, Express 5, express-validator 7, Jest 30, SQL Server via `mssql`, React 19, Vite 8, Node test runner, Markdown SDD artifacts.

## Global Constraints

- Product implementation is blocked until governance PR #32 (`docs/fast-track-delivery-mode`) passes H3 and merges to `main`; planning and plan review may proceed before that merge.
- Implement only `BR-FE11-018`, `BR-FE11-026`, `FR-FE11-033`, `AC-FE11-018`, `TD-024`, and task `FE11-AUD01`.
- Canonical endpoint is `GET /api/admin/audit-logs`; accepted query names are exactly `page`, `limit`, `q`, `action`, `actorId`, `from`, and `to`.
- Defaults are `page = 1` and `limit = 20`; `limit` is restricted to `1..100`.
- Authentication and Admin authorization run before detailed query validation.
- Stable order is `CreatedAt DESC, LogId DESC`; every filter and pagination operation runs in SQL with typed `mssql` parameters.
- Raw `Metadata` and `UserAgent` are never returned. Invalid JSON, top-level arrays/scalars, unknown actions, and invalid field shapes produce `details: {}`.
- The legacy `GET /api/users/audit-logs` path remains an explicit static route before `/:userId`, always returns `404 NOT_FOUND`, and invokes no authentication, user-management, or audit service.
- Keep the current approved user-target join only: `USER`, `USERS`, and `ACCOUNT` targets may receive a user label; other target types return `label: null` and the UI renders type/ID.
- Do not add schema, dependency, authentication, export, audit-write, update/delete, compatibility-alias, or hidden action-filter behavior.
- Keep whole FE11 `Implementation State: DEFERRED`; this slice closes only after H2, required checks, H3, merge, and post-merge integration evidence.
- Every production behavior change must have an observed failing test first. Generated implementation remains uncommitted until H2 approval.

---

### Task 0: Clear The Governance Gate And Create The Implementation Worktree

**Files:**
- Read only: PR #32 and `origin/main`
- Create worktree: `.worktrees/fe11-audit-log-implementation`
- Create branch: `fix/fe11-audit-log-contract`
- Copy reviewed plan: `docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md`

**Interfaces:**
- Consumes: governance activation commit `2d93465` and H3 approval for PR #32.
- Produces: one isolated Builder worktree based on the authoritative activated `main`.

- [ ] **Step 1: Verify PR #32 has merged after H3**

```powershell
$pr = gh pr view 32 --json state,isDraft,mergeCommit,statusCheckRollup,mergeable,url | ConvertFrom-Json
if ($pr.state -ne 'MERGED') { throw 'PR #32 must receive H3 and merge before TD-024 product implementation.' }
if (-not $pr.mergeCommit.oid) { throw 'PR #32 merge commit is missing.' }
```

Expected: `state` is `MERGED`, the exact required check is successful, and a merge commit exists. If the PR is still open, stop at the H3 gate; do not create product-code changes.

- [ ] **Step 2: Refresh the authoritative base and confirm activation ancestry**

```powershell
git fetch origin main
git merge-base --is-ancestor 2d93465 origin/main
if ($LASTEXITCODE -ne 0) { throw 'Fast-Track activation commit is not present on origin/main.' }
```

Expected: the ancestry command exits `0`.

- [ ] **Step 3: Create the isolated implementation worktree**

From repository root:

```powershell
git worktree add .worktrees/fe11-audit-log-implementation -b fix/fe11-audit-log-contract origin/main
```

Expected: the new worktree is on `fix/fe11-audit-log-contract`, based on the merged activation state, and `git status --short` is empty.

- [ ] **Step 4: Carry the reviewed plan into the implementation branch**

```powershell
Copy-Item -LiteralPath `
  '.worktrees/fe11-audit-log-plan/docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md' `
  -Destination '.worktrees/fe11-audit-log-implementation/docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md'
```

Expected: only the reviewed plan is untracked. Do not commit it or any generated implementation before H2.

---

### Task 1: Lock The Canonical Admin Route And Retire The Legacy Route

**Files:**
- Create: `backend/src/validators/adminValidators.js`
- Create: `backend/tests/adminAuditLogRoutes.test.js`
- Modify: `backend/src/routes/adminRoutes.js`
- Modify: `backend/src/controllers/adminController.js`
- Modify: `backend/src/routes/userManagementRoutes.js`
- Modify: `backend/src/controllers/userManagementController.js`
- Modify: `backend/tests/userManagementRoutes.test.js`

**Interfaces:**
- Produces: `isDateOnly(value)`, `validateAuditDateRange(value, { req })`, `assignValidatedAuditQuery(req, res, next)`, `auditLogQueryValidators`, and `controller.listAuditLogs(req, res, next)`.
- Produces: normalized service input `{ page, limit, q?, action?, actorId?, from?, to? }` with blank optional fields omitted.
- Retires: `userManagementController.listAuditLogs` and the functional `/api/users/audit-logs` service path.

- [ ] **Step 1: Write failing canonical route tests**

Create `backend/tests/adminAuditLogRoutes.test.js` with this harness before the cases:

```js
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');

const request = require('supertest');
const { createApp } = require('../src/app');

function makeApp({ roles = ['ADMIN'], adminService } = {}) {
  const authService = {
    authenticateToken: jest.fn(async () => ({
      userId: 99,
      email: 'admin@example.test',
      roles,
    })),
  };

  return createApp({
    authService,
    adminService: adminService || { listAuditLogs: jest.fn() },
    userManagementService: {},
  });
}
```

Cover these exact cases:

```js
test('GET /api/admin/audit-logs requires authentication', async () => {
  const response = await request(makeApp()).get('/api/admin/audit-logs?page=0');

  expect(response.status).toBe(401);
  expect(response.body.error.code).toBe('UNAUTHORIZED');
});

test('GET /api/admin/audit-logs authorizes before validating query details', async () => {
  const adminService = { listAuditLogs: jest.fn() };
  const response = await request(makeApp({ roles: ['MEMBER'], adminService }))
    .get('/api/admin/audit-logs?page=0')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(403);
  expect(response.body.error.code).toBe('ROLE_REQUIRED');
  expect(adminService.listAuditLogs).not.toHaveBeenCalled();
});

test('GET /api/admin/audit-logs sends the normalized canonical query to the service', async () => {
  const payload = {
    data: [],
    pagination: { page: 2, limit: 50, total: 0, totalPages: 0 },
  };
  const adminService = { listAuditLogs: jest.fn(async () => payload) };
  const response = await request(makeApp({ adminService }))
    .get('/api/admin/audit-logs?page=2&limit=50&q=%20login%20&action=%20AUTH_LOGIN_SUCCESS%20&actorId=7&from=2026-07-01&to=2026-07-18')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(200);
  expect(adminService.listAuditLogs).toHaveBeenCalledWith({
    page: 2,
    limit: 50,
    q: 'login',
    action: 'AUTH_LOGIN_SUCCESS',
    actorId: 7,
    from: '2026-07-01',
    to: '2026-07-18',
  });
  expect(response.body).toEqual(payload);
});
```

Add this table-driven validation block:

```js
test.each([
  ['/api/admin/audit-logs?page=0', 'page'],
  ['/api/admin/audit-logs?page=1.5', 'page'],
  ['/api/admin/audit-logs?limit=0', 'limit'],
  ['/api/admin/audit-logs?limit=101', 'limit'],
  ['/api/admin/audit-logs?q=%20%20', 'q'],
  [`/api/admin/audit-logs?q=${'x'.repeat(101)}`, 'q'],
  ['/api/admin/audit-logs?action=%20%20', 'action'],
  [`/api/admin/audit-logs?action=${'x'.repeat(101)}`, 'action'],
  ['/api/admin/audit-logs?actorId=0', 'actorId'],
  ['/api/admin/audit-logs?actorId=1.5', 'actorId'],
  ['/api/admin/audit-logs?from=2026-02-30', 'from'],
  ['/api/admin/audit-logs?to=18-07-2026', 'to'],
  ['/api/admin/audit-logs?from=2026-07-19&to=2026-07-18', 'to'],
])('rejects invalid audit query %s', async (url, field) => {
  const adminService = { listAuditLogs: jest.fn() };
  const response = await request(makeApp({ adminService }))
    .get(url)
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.details).toEqual(
    expect.arrayContaining([expect.objectContaining({ field })])
  );
  expect(adminService.listAuditLogs).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Write failing legacy retirement tests**

Update `backend/tests/userManagementRoutes.test.js`:

```js
test('GET /api/users/audit-logs is retired with NOT_FOUND and invokes no service', async () => {
  const userManagementService = {
    listAuditLogs: jest.fn(),
    getUser: jest.fn(),
  };
  const response = await request(makeApp({ userManagementService }))
    .get('/api/users/audit-logs');

  expect(response.status).toBe(404);
  expect(response.body.error.code).toBe('NOT_FOUND');
  expect(userManagementService.listAuditLogs).not.toHaveBeenCalled();
  expect(userManagementService.getUser).not.toHaveBeenCalled();
});
```

Delete the old Admin-success and non-Admin authorization tests for the functional legacy endpoint. The retired path must return the same `404 NOT_FOUND` without a token and with any token because it is no longer an authenticated resource.

- [ ] **Step 3: Run the route RED tests**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminAuditLogRoutes.test.js tests/userManagementRoutes.test.js
```

Expected: FAIL because `adminValidators.js`, `/admin/audit-logs`, and `adminController.listAuditLogs` do not exist and the legacy path still invokes the prototype handler.

- [ ] **Step 4: Implement the canonical query boundary**

Create `backend/src/validators/adminValidators.js` with these exports:

```js
const { matchedData, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

function isDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateAuditDateRange(value, { req }) {
  const from = req.query.from;
  if (!from || from <= value) return true;
  throw new Error('From date must be before or equal to to date.');
}

function assignValidatedAuditQuery(req, res, next) {
  const data = matchedData(req, { locations: ['query'] });
  req.validatedAuditQuery = {
    page: data.page ?? 1,
    limit: data.limit ?? 20,
    ...(data.q ? { q: data.q } : {}),
    ...(data.action ? { action: data.action } : {}),
    ...(data.actorId ? { actorId: data.actorId } : {}),
    ...(data.from ? { from: data.from } : {}),
    ...(data.to ? { to: data.to } : {}),
  };
  return next();
}
```

Define the remainder of the file exactly as follows:

```js
const auditLogQueryValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100.')
    .toInt(),
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search must be between 1 and 100 characters.'),
  query('action')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Action must be between 1 and 100 characters.'),
  query('actorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Actor ID must be a positive integer.')
    .toInt(),
  query('from')
    .optional()
    .custom(isDateOnly)
    .withMessage('From date must use YYYY-MM-DD.'),
  query('to')
    .optional()
    .custom(isDateOnly)
    .withMessage('To date must use YYYY-MM-DD.')
    .bail()
    .custom(validateAuditDateRange),
  handleValidationErrors,
  assignValidatedAuditQuery,
];

module.exports = {
  isDateOnly,
  validateAuditDateRange,
  assignValidatedAuditQuery,
  auditLogQueryValidators,
};
```

Wire the route after Admin middleware:

```js
// @spec FR-FE11-033
router.get(
  '/audit-logs',
  ...requireAdmin,
  auditLogQueryValidators,
  controller.listAuditLogs
);
```

Add the controller method:

```js
listAuditLogs: async (req, res, next) => {
  try {
    return res.status(200).json(
      await service.listAuditLogs(req.validatedAuditQuery || req.query)
    );
  } catch (error) {
    return next(error);
  }
},
```

- [ ] **Step 5: Implement explicit legacy retirement**

In `backend/src/routes/userManagementRoutes.js`, import `safeErrors` and keep this static route before `/:userId` without `requireAdmin`:

```js
router.get('/audit-logs', (req, res, next) => (
  next(errors.notFound('NOT_FOUND', 'Resource not found.'))
));
```

Remove `listAuditLogs` from `userManagementController`. Do not redirect or alias the retired path.

- [ ] **Step 6: Run the route GREEN tests**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminAuditLogRoutes.test.js tests/userManagementRoutes.test.js
```

Expected: both suites PASS; unauthenticated and non-Admin requests are rejected before validation, valid input is normalized, invalid input returns `VALIDATION_ERROR`, and the legacy route returns `NOT_FOUND` without service invocation.

---

### Task 2: Implement Typed Filtered SQL Pagination

**Files:**
- Create: `backend/tests/auditLogRepository.test.js`
- Modify: `backend/src/repositories/auditLogRepository.js`

**Interfaces:**
- Replaces: `listRecent({ page, limit })`.
- Produces: `listAuditLogs({ page, limit, q, action, actorId, from, to })` returning raw row fields plus `{ page, limit, total, totalPages }`.
- Preserves: `create(...)` unchanged for all audit writers.

- [ ] **Step 1: Write failing repository tests**

Create `backend/tests/auditLogRepository.test.js` with this database harness:

```js
jest.mock('../src/config/db', () => ({
  sql: {
    Date: 'Date',
    Int: 'Int',
    MAX: 'MAX',
    NVarChar: (size) => `NVarChar(${size})`,
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const auditLogRepository = require('../src/repositories/auditLogRepository');

function useRecordsets(recordsets) {
  const capture = { inputs: {}, query: '' };
  getPool.mockResolvedValue({
    request() {
      return {
        input(name, type, value) {
          capture.inputs[name] = { type, value };
          return this;
        },
        async query(statement) {
          capture.query = statement;
          return { recordsets };
        },
      };
    },
  });
  return capture;
}

beforeEach(() => getPool.mockReset());
```

Cover:

```js
test('listAuditLogs binds typed pagination and every supplied filter', async () => {
  const capture = useRecordsets([[], [{ Total: 0 }]]);

  await auditLogRepository.listAuditLogs({
    page: 2,
    limit: 20,
    q: 'login',
    action: 'AUTH_LOGIN_SUCCESS',
    actorId: 7,
    from: '2026-07-01',
    to: '2026-07-18',
  });

  expect(capture.inputs).toMatchObject({
    Offset: { type: 'Int', value: 20 },
    Limit: { type: 'Int', value: 20 },
    Search: { type: 'NVarChar(202)', value: '%login%' },
    Action: { type: 'NVarChar(100)', value: 'AUTH_LOGIN_SUCCESS' },
    ActorId: { type: 'Int', value: 7 },
    FromDate: { type: 'Date', value: '2026-07-01' },
    ToDate: { type: 'Date', value: '2026-07-18' },
  });
});
```

Add these exact assertions and mapping cases:

```js
test('listAuditLogs escapes LIKE metacharacters and keeps request text out of SQL', async () => {
  const capture = useRecordsets([[], [{ Total: 0 }]]);

  await auditLogRepository.listAuditLogs({ page: 1, limit: 20, q: '50%_[' });

  expect(capture.inputs.Search.value).toBe(String.raw`%50\%\_\[%`);
  expect(capture.query).toContain("LIKE LOWER(@Search) ESCAPE '\\'");
  expect(capture.query).not.toContain('50%_[x]');
});

test('listAuditLogs applies one filter scope to data and count with stable order', async () => {
  const capture = useRecordsets([[], [{ Total: 21 }]]);

  const result = await auditLogRepository.listAuditLogs({
    page: 2,
    limit: 20,
    q: 'login',
    action: 'AUTH_LOGIN_SUCCESS',
    actorId: 7,
    from: '2026-07-01',
    to: '2026-07-18',
  });

  expect(capture.query.match(/al\.Action = @Action/g)).toHaveLength(2);
  expect(capture.query.match(/al\.UserId = @ActorId/g)).toHaveLength(2);
  expect(capture.query.match(/al\.CreatedAt >= @FromDate/g)).toHaveLength(2);
  expect(capture.query.match(/al\.CreatedAt < DATEADD\(DAY, 1, @ToDate\)/g)).toHaveLength(2);
  expect(capture.query).toContain('LOWER(al.Action) LIKE LOWER(@Search)');
  expect(capture.query).toContain("LOWER(COALESCE(actor.Email, '')) LIKE LOWER(@Search)");
  expect(capture.query).toContain("LOWER(COALESCE(actorProfile.FullName, '')) LIKE LOWER(@Search)");
  expect(capture.query).toContain("LOWER(COALESCE(al.TargetType, '')) LIKE LOWER(@Search)");
  expect(capture.query).toContain('CONVERT(NVARCHAR(20), al.TargetId) LIKE @Search');
  expect(capture.query).toContain('ORDER BY al.CreatedAt DESC, al.LogId DESC');
  expect(capture.query).toContain("IN ('USER', 'USERS', 'ACCOUNT')");
  expect(result.pagination).toEqual({ page: 2, limit: 20, total: 21, totalPages: 2 });
});

test('listAuditLogs maps raw rows and keeps metadata inside the repository boundary', async () => {
  const createdAt = new Date('2026-07-18T10:00:00.000Z');
  useRecordsets([[
    {
      LogId: 10,
      UserId: 7,
      ActorEmail: 'admin@example.test',
      ActorName: 'Admin User',
      Action: 'USER_ROLE_ASSIGN',
      TargetType: 'USER',
      TargetId: 15,
      TargetEmail: 'member@example.test',
      TargetName: 'Member User',
      Metadata: '{"roleId":2,"roleName":"LIBRARIAN"}',
      IpAddress: '203.0.113.10',
      CreatedAt: createdAt,
    },
  ], [{ Total: 1 }]]);

  const result = await auditLogRepository.listAuditLogs({ page: 1, limit: 20 });

  expect(result.data[0]).toEqual({
    logId: 10,
    userId: 7,
    actorEmail: 'admin@example.test',
    actorName: 'Admin User',
    action: 'USER_ROLE_ASSIGN',
    targetType: 'USER',
    targetId: 15,
    targetEmail: 'member@example.test',
    targetName: 'Member User',
    metadata: '{"roleId":2,"roleName":"LIBRARIAN"}',
    ipAddress: '203.0.113.10',
    createdAt,
  });
  expect(result.pagination.totalPages).toBe(1);
});

test('listAuditLogs reports zero pages for an empty result', async () => {
  useRecordsets([[], [{ Total: 0 }]]);

  await expect(auditLogRepository.listAuditLogs({ page: 1, limit: 20 })).resolves.toMatchObject({
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
});
```

These cases prove:

- each filter works independently and all filters combine with `AND`;
- `q` searches action, actor email, actor full name, target type, and target ID text;
- data and count statements contain the same generated `WHERE` fragment;
- order is exactly `ORDER BY al.CreatedAt DESC, al.LogId DESC`;
- target user joins are restricted to `USER`, `USERS`, and `ACCOUNT`;
- LIKE metacharacters are escaped and request text never appears literally in SQL;
- total `0` yields `totalPages: 0`, while nonzero totals use `Math.ceil(total / limit)`;
- returned rows remain raw repository rows and still contain `metadata` for service-only projection.

- [ ] **Step 2: Run the repository RED test**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/auditLogRepository.test.js
```

Expected: FAIL because only `listRecent` exists and it lacks canonical filters, typed date inputs, shared `WHERE`, and zero-total pagination.

- [ ] **Step 3: Implement `listAuditLogs`**

Keep `create(...)` unchanged. Add this helper and replace `listRecent` with the following `listAuditLogs` structure:

```js
function escapeLikePattern(value) {
  return String(value).replace(/[\\%_\[]/g, (character) => `\\${character}`);
}

// @spec FR-FE11-033
async function listAuditLogs({
  page = 1,
  limit = 20,
  q,
  action,
  actorId,
  from,
  to,
} = {}) {
  const offset = (page - 1) * limit;
  const clauses = ['1 = 1'];

  if (q) clauses.push(`(
    LOWER(al.Action) LIKE LOWER(@Search) ESCAPE '\\'
    OR LOWER(COALESCE(actor.Email, '')) LIKE LOWER(@Search) ESCAPE '\\'
    OR LOWER(COALESCE(actorProfile.FullName, '')) LIKE LOWER(@Search) ESCAPE '\\'
    OR LOWER(COALESCE(al.TargetType, '')) LIKE LOWER(@Search) ESCAPE '\\'
    OR CONVERT(NVARCHAR(20), al.TargetId) LIKE @Search ESCAPE '\\'
  )`);
  if (action) clauses.push('al.Action = @Action');
  if (actorId) clauses.push('al.UserId = @ActorId');
  if (from) clauses.push('al.CreatedAt >= @FromDate');
  if (to) clauses.push('al.CreatedAt < DATEADD(DAY, 1, @ToDate)');

  const whereSql = clauses.join('\n        AND ');
  const request = (await getPool()).request()
    .input('Offset', sql.Int, offset)
    .input('Limit', sql.Int, limit);

  if (q) request.input('Search', sql.NVarChar(202), `%${escapeLikePattern(q)}%`);
  if (action) request.input('Action', sql.NVarChar(100), action);
  if (actorId) request.input('ActorId', sql.Int, actorId);
  if (from) request.input('FromDate', sql.Date, from);
  if (to) request.input('ToDate', sql.Date, to);

  const result = await request.query(`
    SELECT
      al.LogId,
      al.UserId,
      actor.Email AS ActorEmail,
      actorProfile.FullName AS ActorName,
      al.Action,
      al.TargetType,
      al.TargetId,
      target.Email AS TargetEmail,
      targetProfile.FullName AS TargetName,
      al.Metadata,
      al.IpAddress,
      al.CreatedAt
    FROM AuditLogs al
    LEFT JOIN Users actor ON al.UserId = actor.UserId
    LEFT JOIN UserProfiles actorProfile ON actor.UserId = actorProfile.UserId
    LEFT JOIN Users target
      ON al.TargetId = target.UserId
      AND UPPER(COALESCE(al.TargetType, '')) IN ('USER', 'USERS', 'ACCOUNT')
    LEFT JOIN UserProfiles targetProfile ON target.UserId = targetProfile.UserId
    WHERE ${whereSql}
    ORDER BY al.CreatedAt DESC, al.LogId DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

    SELECT COUNT_BIG(*) AS Total
    FROM AuditLogs al
    LEFT JOIN Users actor ON al.UserId = actor.UserId
    LEFT JOIN UserProfiles actorProfile ON actor.UserId = actorProfile.UserId
    WHERE ${whereSql};
  `);

  const data = result.recordsets[0].map((row) => ({
    logId: row.LogId,
    userId: row.UserId,
    actorEmail: row.ActorEmail,
    actorName: row.ActorName,
    action: row.Action,
    targetType: row.TargetType,
    targetId: row.TargetId,
    targetEmail: row.TargetEmail,
    targetName: row.TargetName,
    metadata: row.Metadata,
    ipAddress: row.IpAddress,
    createdAt: row.CreatedAt,
  }));
  const total = Number(result.recordsets[1]?.[0]?.Total || 0);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}
```

Export `create` and `listAuditLogs`; do not export `escapeLikePattern`. The fixed `whereSql` is used by both SELECT statements.

- [ ] **Step 4: Run the repository GREEN test**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/auditLogRepository.test.js
```

Expected: PASS with typed parameter capture, identical filter scope in data/count queries, stable order, restricted target join, and correct zero-total pagination.

---

### Task 3: Add The Action-Aware Default-Deny Projector

**Files:**
- Create: `backend/tests/adminAuditLogService.test.js`
- Modify: `backend/src/services/adminService.js`
- Modify: `backend/src/services/userManagementService.js`
- Modify: `backend/tests/userManagementService.test.js`

**Interfaces:**
- Produces: `parseMetadataObject(rawMetadata)`, `projectAuditDetails(action, metadata)`, `projectAuditLog(row)`, and `listAuditLogs(query = {})` in `adminService`.
- Produces helpers: `readPositiveInteger`, `readNonNegativeNumber`, `readIsoDate`, `readPositiveIntegerArray`, `readChangedFields`, `hasProvidedText`, and `stripSensitiveKeys`.
- Removes: `userManagementService.listAuditLogs` and obsolete `listRecent` mocks/tests.

- [ ] **Step 1: Write failing service projection tests**

Create `backend/tests/adminAuditLogService.test.js` with this seam and row factory:

```js
jest.mock('../src/repositories/auditLogRepository', () => ({
  create: jest.fn(),
  listAuditLogs: jest.fn(),
}));

const auditLogRepository = require('../src/repositories/auditLogRepository');
const adminService = require('../src/services/adminService');

function rawRow(action, metadata, overrides = {}) {
  return {
    logId: 10,
    userId: 7,
    actorEmail: 'admin@example.test',
    actorName: 'Admin User',
    action,
    targetType: 'USER',
    targetId: 15,
    targetEmail: 'member@example.test',
    targetName: 'Member User',
    metadata: JSON.stringify(metadata),
    ipAddress: '203.0.113.10',
    createdAt: new Date('2026-07-18T10:00:00.000Z'),
    userAgent: 'must-not-leak',
    ...overrides,
  };
}

async function project(action, metadata, overrides) {
  auditLogRepository.listAuditLogs.mockResolvedValue({
    data: [rawRow(action, metadata, overrides)],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  });
  const result = await adminService.listAuditLogs({});
  return result.data[0];
}

beforeEach(() => auditLogRepository.listAuditLogs.mockReset());
```

Assert canonical output:

```js
test('listAuditLogs applies defaults and returns only the canonical DTO', async () => {
  auditLogRepository.listAuditLogs.mockResolvedValue({
    data: [rawRow('USER_ROLE_ASSIGN', { roleId: 2, roleName: 'LIBRARIAN' })],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  });

  const result = await adminService.listAuditLogs({});

  expect(auditLogRepository.listAuditLogs).toHaveBeenCalledWith({
    page: 1,
    limit: 20,
    q: undefined,
    action: undefined,
    actorId: undefined,
    from: undefined,
    to: undefined,
  });
  expect(result.data[0]).toEqual({
    logId: 10,
    action: 'USER_ROLE_ASSIGN',
    actor: { userId: 7, email: 'admin@example.test', fullName: 'Admin User' },
    target: { type: 'USER', id: 15, label: 'member@example.test' },
    details: { roleId: 2, roleName: 'LIBRARIAN' },
    ipAddress: '203.0.113.10',
    createdAt: new Date('2026-07-18T10:00:00.000Z'),
  });
  expect(result.data[0]).not.toHaveProperty('metadata');
  expect(result.data[0]).not.toHaveProperty('userAgent');
});

test('non-user targets never borrow a user label', async () => {
  const row = await project('FINE_CALCULATE', {
    borrowDetailId: 4,
    memberId: 9,
    overdueDays: 2,
    amount: 10000,
  }, {
    targetType: 'FINE',
    targetId: 15,
    targetEmail: 'wrong-user@example.test',
    targetName: 'Wrong User',
  });

  expect(row.target).toEqual({ type: 'FINE', id: 15, label: null });
});
```

Add this approved projector matrix. Every row is an executable fixture; actions in the same `actions` array share the same projector contract:

```js
const projectorCases = [
  { actions: ['USER_CREATE'], metadata: { roleName: 'MEMBER', email: 'omit@example.test' }, expected: { roleName: 'MEMBER' } },
  { actions: ['USER_UPDATE'], metadata: { fields: ['email', 'fullName', 'passwordHash'] }, expected: { changedFields: ['email', 'fullName'] } },
  { actions: ['USER_DEACTIVATE'], metadata: { status: 'INACTIVE' }, expected: { newStatus: 'INACTIVE' } },
  { actions: ['USER_ROLE_ASSIGN', 'USER_ROLE_REVOKE'], metadata: { roleId: 2, roleName: 'LIBRARIAN' }, expected: { roleId: 2, roleName: 'LIBRARIAN' } },
  { actions: ['BORROW_REQUEST_CREATE'], metadata: { copyIds: [1, 2] }, expected: { copyIds: [1, 2] } },
  { actions: ['BORROW_REQUEST_APPROVE'], metadata: { approvedMemberId: 9, copyIds: [1, 2], notes: 'omit' }, expected: { memberUserId: 9, copyIds: [1, 2], notesProvided: true } },
  { actions: ['BORROW_REQUEST_REJECT'], metadata: { rejectedMemberId: 9, reason: 'omit' }, expected: { memberUserId: 9, reasonProvided: true } },
  { actions: ['BORROW_DETAIL_RETURN'], metadata: { requestId: 3, memberId: 9, copyId: 1, condition: 'NORMAL', overdueDays: 0, notes: null }, expected: { requestId: 3, memberId: 9, copyId: 1, condition: 'NORMAL', overdueDays: 0, notesProvided: false } },
  { actions: ['BORROW_DETAIL_RENEW'], metadata: { requestId: 3, memberId: 9, copyId: 1, newDueDate: '2026-08-01T00:00:00.000Z', notes: 'ok' }, expected: { requestId: 3, memberId: 9, copyId: 1, newDueDate: '2026-08-01T00:00:00.000Z', notesProvided: true } },
  { actions: ['RESERVATION_FULFILL'], metadata: { requestId: 3, copyId: 1, memberUserId: 9 }, expected: { requestId: 3, copyId: 1, memberUserId: 9 } },
  { actions: ['RESERVATION_CREATE', 'RESERVATION_EXPIRE'], metadata: { copyId: 1 }, expected: { copyId: 1 } },
  { actions: ['RESERVATION_CANCEL'], metadata: { copyId: 1, reason: 'omit' }, expected: { copyId: 1, reasonProvided: true } },
  { actions: ['RESERVATION_NOTIFY_FAILED'], metadata: { code: 'NOTIFICATION_REQUEST_FAILED', message: 'omit' }, expected: { code: 'NOTIFICATION_REQUEST_FAILED' } },
  { actions: ['RESERVATION_PROCESS'], metadata: { copyId: 1, selectedUserId: 9, expiresAt: '2026-07-20T00:00:00.000Z' }, expected: { copyId: 1, selectedUserId: 9, expiresAt: '2026-07-20T00:00:00.000Z' } },
  { actions: ['FINE_CALCULATE'], metadata: { borrowDetailId: 4, memberId: 9, overdueDays: 2, amount: 10000 }, expected: { borrowDetailId: 4, memberId: 9, overdueDays: 2, amount: 10000 } },
  { actions: ['FINE_COLLECT'], metadata: { collectedAmount: 5000, fullyCollected: false, note: 'omit' }, expected: { collectedAmount: 5000, fullyCollected: false, noteProvided: true } },
  { actions: ['FINE_MARK_PAID'], metadata: { amount: 10000, note: null }, expected: { amount: 10000, noteProvided: false } },
  { actions: ['FINE_WAIVE', 'FINE_CANCEL'], metadata: { reason: 'omit' }, expected: { reasonProvided: true } },
  { actions: ['BOOK_COPY_CREATE'], metadata: { bookId: 3, barcode: 'BC-1', status: 'AVAILABLE', location: 'A1' }, expected: { bookId: 3, barcode: 'BC-1', status: 'AVAILABLE', location: 'A1' } },
  { actions: ['BOOK_COPY_UPDATE'], metadata: { before: { bookId: 3, status: 'AVAILABLE', title: 'omit', isbn: 'omit' }, patch: { location: 'B2', status: 'DAMAGED' } }, expected: { bookId: 3, changedFields: ['location', 'status'], previousStatus: 'AVAILABLE', newStatus: 'DAMAGED' } },
  { actions: ['BOOK_COPY_STATUS_UPDATE'], metadata: { oldStatus: 'AVAILABLE', newStatus: 'DAMAGED', reason: 'omit' }, expected: { previousStatus: 'AVAILABLE', newStatus: 'DAMAGED', reasonProvided: true } },
  { actions: ['BOOK_COPY_DEACTIVATE'], metadata: { oldStatus: 'AVAILABLE', newStatus: 'INACTIVE' }, expected: { previousStatus: 'AVAILABLE', newStatus: 'INACTIVE' } },
  { actions: ['MEMBERSHIP_APPLICATION_SUBMITTED', 'MEMBERSHIP_APPLICATION_APPROVED'], metadata: { userId: 9, status: 'APPROVED' }, expected: { userId: 9, status: 'APPROVED' } },
  { actions: ['MEMBERSHIP_APPLICATION_REJECTED'], metadata: { userId: 9, status: 'REJECTED', reason: 'omit' }, expected: { userId: 9, status: 'REJECTED', reasonProvided: true } },
  { actions: ['PROFILE_UPDATE'], metadata: { fields: ['fullName', 'phone', 'passwordHash'] }, expected: { changedFields: ['fullName', 'phone'] } },
  { actions: ['REPORT_ACCESS_DENIED'], metadata: { code: 'ROLE_REQUIRED', statusCode: 403, method: 'GET', path: '/api/reports/users' }, expected: { code: 'ROLE_REQUIRED', statusCode: 403, method: 'GET', reportType: 'USERS' } },
  { actions: ['NOTIFICATION_REQUEST_CREATE'], metadata: { type: 'DUE_DATE_REMINDER', channel: 'EMAIL', sourceFeature: 'FE07', sourceEntityType: 'BorrowRequest', sourceEntityId: 3 }, expected: { type: 'DUE_DATE_REMINDER', channel: 'EMAIL', sourceFeature: 'FE07', sourceEntityType: 'BorrowRequest', sourceEntityId: 3 } },
  { actions: ['NOTIFICATION_RETRY'], metadata: { fromStatus: 'FAILED', toStatus: 'PENDING' }, expected: { previousStatus: 'FAILED', newStatus: 'PENDING' } },
  { actions: ['NOTIFICATION_PROCESS_PENDING'], metadata: { processed: 4, failed: 1 }, expected: { processed: 4, failed: 1 } },
];

for (const fixture of projectorCases) {
  for (const action of fixture.actions) {
    test(`${action} returns only its approved detail fields`, async () => {
      await expect(project(action, fixture.metadata)).resolves.toMatchObject({
        details: fixture.expected,
      });
    });

    test(`${action} ignores hostile extra keys`, async () => {
      const hostile = {
        ...fixture.metadata,
        passwordHash: 'forbidden',
        tokenId: 88,
        nested: { sessionSecret: 'forbidden' },
      };
      const row = await project(action, hostile);
      expect(row.details).toEqual(fixture.expected);
      expect(JSON.stringify(row.details)).not.toContain('forbidden');
    });

    test(`${action} fails closed for a malformed required field`, async () => {
      const [requiredKey] = Object.keys(fixture.metadata);
      const malformed = { ...fixture.metadata, [requiredKey]: { invalid: true } };
      await expect(project(action, malformed)).resolves.toMatchObject({ details: {} });
    });
  }
}
```

Add these derived/empty/default-deny tests:

```js
const emptyDetailActions = [
  'AUTH_PASSWORD_CHANGE_FAILURE', 'AUTH_VERIFY_EMAIL', 'AUTH_LOGIN_LOCKED',
  'AUTH_ACCOUNT_AUTO_UNLOCKED', 'AUTH_LOGIN_INACTIVE', 'AUTH_LOGIN_FAILURE',
  'AUTH_LOGIN_SUCCESS', 'AUTH_REFRESH_TOKEN', 'AUTH_LOGOUT',
  'AUTH_PASSWORD_CHANGE_SUCCESS', 'AUTH_CHANGE_PASSWORD_OTP_REQUESTED',
  'AUTH_PASSWORD_RESET_SUCCESS', 'AUTH_REGISTER', 'AUTH_RESEND_VERIFICATION',
  'AUTH_PASSWORD_RESET_REQUEST', 'AUTH_LOGIN_ATTEMPT',
  'AUTH_ACCOUNT_SETUP_COMPLETE', 'USER_ACCOUNT_SETUP_RESEND',
];

test.each(emptyDetailActions)('%s always returns empty details', async (action) => {
  await expect(project(action, { tokenId: 99, email: 'omit@example.test' }))
    .resolves.toMatchObject({ details: {} });
});

test.each([
  ['REPORT_BORROWING_VIEW', 'BORROWING'],
  ['REPORT_INVENTORY_VIEW', 'INVENTORY'],
  ['REPORT_USERS_VIEW', 'USERS'],
])('%s derives reportType without exposing metadata', async (action, reportType) => {
  await expect(project(action, {})).resolves.toMatchObject({ details: { reportType } });
});

test.each(['{', '[]', '"scalar"', 'null'])('invalid metadata %s returns empty details', async (metadata) => {
  const row = await project('USER_ROLE_ASSIGN', {}, { metadata });
  expect(row.details).toEqual({});
});

test('unknown actions return empty details', async () => {
  await expect(project('UNKNOWN_ACTION', { passwordHash: 'forbidden' }))
    .resolves.toMatchObject({ details: {} });
});

test('AuthToken notification sources omit the credential identifier', async () => {
  const row = await project('NOTIFICATION_REQUEST_CREATE', {
    type: 'ACCOUNT_SETUP',
    channel: 'EMAIL',
    sourceFeature: 'FE11',
    sourceEntityType: 'AuthToken',
    sourceEntityId: 99,
  });
  expect(row.details).toEqual({
    type: 'ACCOUNT_SETUP',
    channel: 'EMAIL',
    sourceFeature: 'FE11',
    sourceEntityType: 'AuthToken',
  });
});

test('invalid IDs, numbers, dates, arrays, and nested allowed values fail closed', async () => {
  await expect(project('USER_ROLE_ASSIGN', { roleId: 0, roleName: 'ADMIN' }))
    .resolves.toMatchObject({ details: {} });
  await expect(project('FINE_CALCULATE', { borrowDetailId: 1, memberId: 2, overdueDays: -1, amount: Infinity }))
    .resolves.toMatchObject({ details: {} });
  await expect(project('BORROW_DETAIL_RENEW', { requestId: 1, memberId: 2, copyId: 3, newDueDate: 'not-a-date', notes: null }))
    .resolves.toMatchObject({ details: {} });
  await expect(project('BORROW_REQUEST_CREATE', { copyIds: [1, { token: 'nested' }] }))
    .resolves.toMatchObject({ details: {} });
});

test('projected arrays are capped at 100 values', async () => {
  const row = await project('BORROW_REQUEST_CREATE', {
    copyIds: Array.from({ length: 120 }, (_, index) => index + 1),
  });
  expect(row.details.copyIds).toHaveLength(100);
});
```

Together these tests assert:

- malformed JSON, arrays, scalars, and unknown actions return `{}`;
- arrays are capped at 100 scalar values;
- IDs must be positive integers;
- counts and monetary values must be finite nonnegative numbers;
- dates normalize to ISO strings;
- changed fields use only the action-specific allowlists;
- nested object values are omitted;
- raw reason, notes, note, email, message, identifier, path, token ID, and source `AuthToken` identifiers are absent;
- recursive keys matching password, hash, token, OTP, authorization, cookie, secret, session, credential, API key, setup link, or reset link are removed after projection.

- [ ] **Step 2: Run the service RED tests**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminAuditLogService.test.js tests/userManagementService.test.js
```

Expected: FAIL because `adminService.listAuditLogs` and the projector do not exist and user management still owns prototype listing tests.

- [ ] **Step 3: Implement defensive query normalization and DTO mapping**

Add `const auditLogRepository = require('../repositories/auditLogRepository');` beside the existing repository import. Add these internal query helpers before the public service functions:

```js
function validationError(field, message) {
  return errors.badRequest('VALIDATION_ERROR', 'Invalid request.', [{ field, message }]);
}

function normalizeAuditInteger(value, { field, defaultValue, min = 1, max } = {}) {
  if (value === undefined || value === null) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) {
    throw validationError(field, `${field} is invalid.`);
  }
  return parsed;
}

function normalizeAuditText(value, field) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (text.length < 1 || text.length > 100) {
    throw validationError(field, `${field} must be between 1 and 100 characters.`);
  }
  return text;
}

function normalizeAuditDate(value, field) {
  if (value === undefined || value === null) return undefined;
  const text = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00.000Z`)
    : new Date(Number.NaN);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw validationError(field, `${field} must use YYYY-MM-DD.`);
  }
  return text;
}

function normalizeAuditListQuery(query = {}) {
  const normalized = {
    page: normalizeAuditInteger(query.page, { field: 'page', defaultValue: 1 }),
    limit: normalizeAuditInteger(query.limit, {
      field: 'limit',
      defaultValue: 20,
      max: 100,
    }),
    q: normalizeAuditText(query.q, 'q'),
    action: normalizeAuditText(query.action, 'action'),
    actorId: normalizeAuditInteger(query.actorId, {
      field: 'actorId',
      defaultValue: undefined,
    }),
    from: normalizeAuditDate(query.from, 'from'),
    to: normalizeAuditDate(query.to, 'to'),
  };

  if (normalized.from && normalized.to && normalized.from > normalized.to) {
    throw validationError('to', 'From date must be before or equal to to date.');
  }

  return normalized;
}
```

- [ ] **Step 4: Implement the exact action allowlist**

Add the following internal projector implementation after the query helpers. Do not export projector helpers; tests exercise them through `listAuditLogs`.

```js
const INVALID_AUDIT_VALUE = Symbol('INVALID_AUDIT_VALUE');
const USER_TARGET_TYPES = new Set(['USER', 'USERS', 'ACCOUNT']);
const USER_CHANGED_FIELDS = new Set([
  'email', 'fullName', 'phone', 'address', 'department', 'specialization', 'status',
]);
const PROFILE_CHANGED_FIELDS = new Set([
  'fullName', 'address', 'dateOfBirth', 'avatarUrl', 'phone',
]);
const BOOK_COPY_CHANGED_FIELDS = new Set(['barcode', 'location', 'status']);
const EMPTY_DETAIL_ACTIONS = new Set([
  'AUTH_PASSWORD_CHANGE_FAILURE', 'AUTH_VERIFY_EMAIL', 'AUTH_LOGIN_LOCKED',
  'AUTH_ACCOUNT_AUTO_UNLOCKED', 'AUTH_LOGIN_INACTIVE', 'AUTH_LOGIN_FAILURE',
  'AUTH_LOGIN_SUCCESS', 'AUTH_REFRESH_TOKEN', 'AUTH_LOGOUT',
  'AUTH_PASSWORD_CHANGE_SUCCESS', 'AUTH_CHANGE_PASSWORD_OTP_REQUESTED',
  'AUTH_PASSWORD_RESET_SUCCESS', 'AUTH_REGISTER', 'AUTH_RESEND_VERIFICATION',
  'AUTH_PASSWORD_RESET_REQUEST', 'AUTH_LOGIN_ATTEMPT',
  'AUTH_ACCOUNT_SETUP_COMPLETE', 'USER_ACCOUNT_SETUP_RESEND',
]);
const REPORT_TYPES_BY_ACTION = {
  REPORT_BORROWING_VIEW: 'BORROWING',
  REPORT_INVENTORY_VIEW: 'INVENTORY',
  REPORT_USERS_VIEW: 'USERS',
};
const REPORT_TYPES_BY_PATH = {
  '/api/reports/borrowing': 'BORROWING',
  '/api/reports/inventory': 'INVENTORY',
  '/api/reports/users': 'USERS',
};
const SENSITIVE_AUDIT_KEY = /password|hash|token|otp|authorization|cookie|secret|session|credential|api[-_ ]?key|setup[-_ ]?link|reset[-_ ]?link/i;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseMetadataObject(rawMetadata) {
  if (typeof rawMetadata !== 'string' || rawMetadata.trim() === '') return null;
  try {
    const parsed = JSON.parse(rawMetadata);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readText(value, { optional = false, max = 255 } = {}) {
  if (value === undefined || value === null) {
    return optional ? undefined : INVALID_AUDIT_VALUE;
  }
  if (typeof value !== 'string') return INVALID_AUDIT_VALUE;
  const text = value.trim();
  if (!text || text.length > max) return INVALID_AUDIT_VALUE;
  return text;
}

function readPositiveInteger(value, { optional = false } = {}) {
  if (value === undefined || value === null) {
    return optional ? undefined : INVALID_AUDIT_VALUE;
  }
  return Number.isInteger(value) && value > 0 ? value : INVALID_AUDIT_VALUE;
}

function readNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : INVALID_AUDIT_VALUE;
}

function readBoolean(value) {
  return typeof value === 'boolean' ? value : INVALID_AUDIT_VALUE;
}

function readIsoDate(value) {
  if (typeof value !== 'string') return INVALID_AUDIT_VALUE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? INVALID_AUDIT_VALUE : date.toISOString();
}

function readPositiveIntegerArray(value) {
  if (!Array.isArray(value)) return INVALID_AUDIT_VALUE;
  const projected = [];
  for (const item of value.slice(0, 100)) {
    const parsed = readPositiveInteger(item);
    if (parsed === INVALID_AUDIT_VALUE) return INVALID_AUDIT_VALUE;
    projected.push(parsed);
  }
  return projected;
}

function readChangedFields(value, allowedFields) {
  if (!Array.isArray(value)) return INVALID_AUDIT_VALUE;
  const projected = [];
  for (const item of value.slice(0, 100)) {
    const field = readText(item, { max: 50 });
    if (field === INVALID_AUDIT_VALUE) return INVALID_AUDIT_VALUE;
    if (allowedFields.has(field) && !projected.includes(field)) projected.push(field);
  }
  return projected;
}

function hasProvidedText(value) {
  if (value === undefined || value === null || value === '') return false;
  return typeof value === 'string' ? value.trim().length > 0 : INVALID_AUDIT_VALUE;
}

function buildAuditDetails(fields) {
  const output = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === INVALID_AUDIT_VALUE) return null;
    if (value !== undefined) output[key] = value;
  }
  return output;
}

function stripSensitiveKeys(value) {
  if (Array.isArray(value)) return value.slice(0, 100).map(stripSensitiveKeys);
  if (!isPlainObject(value)) return value;
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (!SENSITIVE_AUDIT_KEY.test(key)) output[key] = stripSensitiveKeys(item);
  }
  return output;
}

function projectAuditDetails(action, rawMetadata) {
  if (EMPTY_DETAIL_ACTIONS.has(action)) return {};
  if (REPORT_TYPES_BY_ACTION[action]) return { reportType: REPORT_TYPES_BY_ACTION[action] };

  const metadata = parseMetadataObject(rawMetadata);
  if (!metadata) return {};
  let projected;

  switch (action) {
    case 'USER_CREATE':
      projected = buildAuditDetails({ roleName: readText(metadata.roleName, { max: 100 }) });
      break;
    case 'USER_UPDATE':
      projected = buildAuditDetails({
        changedFields: readChangedFields(
          metadata.changedFields ?? metadata.fields,
          USER_CHANGED_FIELDS
        ),
      });
      break;
    case 'USER_DEACTIVATE':
      projected = buildAuditDetails({
        newStatus: readText(metadata.newStatus ?? metadata.status, { max: 50 }),
      });
      break;
    case 'USER_ROLE_ASSIGN':
    case 'USER_ROLE_REVOKE':
      projected = buildAuditDetails({
        roleId: readPositiveInteger(metadata.roleId),
        roleName: readText(metadata.roleName, { max: 100 }),
      });
      break;
    case 'BORROW_REQUEST_CREATE':
      projected = buildAuditDetails({ copyIds: readPositiveIntegerArray(metadata.copyIds) });
      break;
    case 'BORROW_REQUEST_APPROVE':
      projected = buildAuditDetails({
        memberUserId: readPositiveInteger(metadata.memberUserId ?? metadata.approvedMemberId),
        copyIds: readPositiveIntegerArray(metadata.copyIds),
        notesProvided: hasProvidedText(metadata.notes),
      });
      break;
    case 'BORROW_REQUEST_REJECT':
      projected = buildAuditDetails({
        memberUserId: readPositiveInteger(metadata.memberUserId ?? metadata.rejectedMemberId),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'BORROW_DETAIL_RETURN':
      projected = buildAuditDetails({
        requestId: readPositiveInteger(metadata.requestId),
        memberId: readPositiveInteger(metadata.memberId),
        copyId: readPositiveInteger(metadata.copyId),
        condition: readText(metadata.condition, { max: 50 }),
        overdueDays: readNonNegativeNumber(metadata.overdueDays),
        notesProvided: hasProvidedText(metadata.notes),
      });
      break;
    case 'BORROW_DETAIL_RENEW':
      projected = buildAuditDetails({
        requestId: readPositiveInteger(metadata.requestId),
        memberId: readPositiveInteger(metadata.memberId),
        copyId: readPositiveInteger(metadata.copyId),
        newDueDate: readIsoDate(metadata.newDueDate),
        notesProvided: hasProvidedText(metadata.notes),
      });
      break;
    case 'RESERVATION_FULFILL':
      projected = buildAuditDetails({
        requestId: readPositiveInteger(metadata.requestId),
        copyId: readPositiveInteger(metadata.copyId),
        memberUserId: readPositiveInteger(metadata.memberUserId),
      });
      break;
    case 'RESERVATION_CREATE':
    case 'RESERVATION_EXPIRE':
      projected = buildAuditDetails({ copyId: readPositiveInteger(metadata.copyId) });
      break;
    case 'RESERVATION_CANCEL':
      projected = buildAuditDetails({
        copyId: readPositiveInteger(metadata.copyId),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'RESERVATION_NOTIFY_FAILED':
      projected = buildAuditDetails({ code: readText(metadata.code, { max: 100 }) });
      break;
    case 'RESERVATION_PROCESS':
      projected = buildAuditDetails({
        copyId: readPositiveInteger(metadata.copyId),
        selectedUserId: readPositiveInteger(metadata.selectedUserId),
        expiresAt: readIsoDate(metadata.expiresAt),
      });
      break;
    case 'FINE_CALCULATE':
      projected = buildAuditDetails({
        borrowDetailId: readPositiveInteger(metadata.borrowDetailId),
        memberId: readPositiveInteger(metadata.memberId),
        overdueDays: readNonNegativeNumber(metadata.overdueDays),
        amount: readNonNegativeNumber(metadata.amount),
      });
      break;
    case 'FINE_COLLECT':
      projected = buildAuditDetails({
        collectedAmount: readNonNegativeNumber(metadata.collectedAmount),
        fullyCollected: readBoolean(metadata.fullyCollected),
        noteProvided: hasProvidedText(metadata.note),
      });
      break;
    case 'FINE_MARK_PAID':
      projected = buildAuditDetails({
        amount: readNonNegativeNumber(metadata.amount),
        noteProvided: hasProvidedText(metadata.note),
      });
      break;
    case 'FINE_WAIVE':
    case 'FINE_CANCEL':
      projected = buildAuditDetails({ reasonProvided: hasProvidedText(metadata.reason) });
      break;
    case 'BOOK_COPY_CREATE':
      projected = buildAuditDetails({
        bookId: readPositiveInteger(metadata.bookId),
        barcode: readText(metadata.barcode, { max: 100 }),
        status: readText(metadata.status, { max: 50 }),
        location: readText(metadata.location, { optional: true, max: 100 }),
      });
      break;
    case 'BOOK_COPY_UPDATE': {
      if (!isPlainObject(metadata.before) || !isPlainObject(metadata.patch)) return {};
      const statusChanged = Object.prototype.hasOwnProperty.call(metadata.patch, 'status')
        && metadata.patch.status !== metadata.before.status;
      projected = buildAuditDetails({
        bookId: readPositiveInteger(metadata.before.bookId),
        changedFields: readChangedFields(Object.keys(metadata.patch), BOOK_COPY_CHANGED_FIELDS),
        previousStatus: statusChanged
          ? readText(metadata.before.status, { max: 50 })
          : undefined,
        newStatus: statusChanged
          ? readText(metadata.patch.status, { max: 50 })
          : undefined,
      });
      break;
    }
    case 'BOOK_COPY_STATUS_UPDATE':
      projected = buildAuditDetails({
        previousStatus: readText(metadata.previousStatus ?? metadata.oldStatus, { max: 50 }),
        newStatus: readText(metadata.newStatus, { max: 50 }),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'BOOK_COPY_DEACTIVATE':
      projected = buildAuditDetails({
        previousStatus: readText(metadata.previousStatus ?? metadata.oldStatus, { max: 50 }),
        newStatus: readText(metadata.newStatus, { max: 50 }),
      });
      break;
    case 'MEMBERSHIP_APPLICATION_SUBMITTED':
    case 'MEMBERSHIP_APPLICATION_APPROVED':
      projected = buildAuditDetails({
        userId: readPositiveInteger(metadata.userId),
        status: readText(metadata.status, { max: 50 }),
      });
      break;
    case 'MEMBERSHIP_APPLICATION_REJECTED':
      projected = buildAuditDetails({
        userId: readPositiveInteger(metadata.userId),
        status: readText(metadata.status, { max: 50 }),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'PROFILE_UPDATE':
      projected = buildAuditDetails({
        changedFields: readChangedFields(
          metadata.changedFields ?? metadata.fields,
          PROFILE_CHANGED_FIELDS
        ),
      });
      break;
    case 'REPORT_ACCESS_DENIED': {
      const rawPath = readText(metadata.path, { optional: true, max: 200 });
      if (rawPath === INVALID_AUDIT_VALUE) return {};
      projected = buildAuditDetails({
        code: readText(metadata.code, { max: 100 }),
        statusCode: readNonNegativeNumber(metadata.statusCode),
        method: readText(metadata.method, { optional: true, max: 20 }),
        reportType: rawPath ? REPORT_TYPES_BY_PATH[rawPath] : undefined,
      });
      break;
    }
    case 'NOTIFICATION_REQUEST_CREATE': {
      const sourceEntityType = readText(metadata.sourceEntityType, { optional: true, max: 50 });
      if (sourceEntityType === INVALID_AUDIT_VALUE) return {};
      projected = buildAuditDetails({
        type: readText(metadata.type, { max: 100 }),
        channel: readText(metadata.channel, { max: 50 }),
        sourceFeature: readText(metadata.sourceFeature, { optional: true, max: 50 }),
        sourceEntityType,
        sourceEntityId: sourceEntityType === 'AuthToken'
          ? undefined
          : readPositiveInteger(metadata.sourceEntityId, { optional: true }),
      });
      break;
    }
    case 'NOTIFICATION_RETRY':
      projected = buildAuditDetails({
        previousStatus: readText(metadata.previousStatus ?? metadata.fromStatus, { max: 50 }),
        newStatus: readText(metadata.newStatus ?? metadata.toStatus, { max: 50 }),
      });
      break;
    case 'NOTIFICATION_PROCESS_PENDING':
      projected = buildAuditDetails({
        processed: readNonNegativeNumber(metadata.processed),
        failed: readNonNegativeNumber(metadata.failed),
      });
      break;
    default:
      return {};
  }

  return projected ? stripSensitiveKeys(projected) : {};
}

function projectAuditLog(row) {
  const targetType = typeof row.targetType === 'string' ? row.targetType.trim() : null;
  const isUserTarget = USER_TARGET_TYPES.has(String(targetType || '').toUpperCase());
  return {
    logId: row.logId,
    action: row.action,
    actor: {
      userId: row.userId ?? null,
      email: row.actorEmail ?? null,
      fullName: row.actorName ?? null,
    },
    target: {
      type: targetType,
      id: row.targetId ?? null,
      label: isUserTarget ? (row.targetEmail || row.targetName || null) : null,
    },
    details: projectAuditDetails(row.action, row.metadata),
    ipAddress: row.ipAddress ?? null,
    createdAt: row.createdAt,
  };
}
```

Add the public service function and export it with the existing Admin functions:

```js
// @spec FR-FE11-033, BR-FE11-018, BR-FE11-026, AC-FE11-018
async function listAuditLogs(query = {}) {
  const filters = normalizeAuditListQuery(query);
  const result = await auditLogRepository.listAuditLogs(filters);
  return {
    data: result.data.map(projectAuditLog),
    pagination: result.pagination,
  };
}
```

Remove the obsolete audit-list function/export from `userManagementService` and delete its old normalization tests/mocks from `userManagementService.test.js` without weakening account-setup or role-mutation coverage.

- [ ] **Step 5: Run the service GREEN tests**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminAuditLogService.test.js tests/userManagementService.test.js
```

Expected: PASS for every approved action family, malformed/hostile metadata, canonical DTO mapping, and removal of the obsolete user-management listing contract.

---

### Task 4: Migrate The Admin Frontend To The Canonical DTO

**Files:**
- Create: `frontend/test/adminApi.test.js`
- Modify: `frontend/src/api/adminApi.js`
- Modify: `frontend/src/api/userManagementApi.js`
- Modify: `frontend/src/page/UserManagement.jsx`
- Modify: `frontend/test/userManagementApi.test.js`
- Modify: `frontend/test/userManagementFrontend.test.js`

**Interfaces:**
- Produces: `adminApi.auditLogs(params = {})` using `GET /admin/audit-logs`.
- Produces page helpers: `buildAuditLogParams(input)` and `formatAuditDetailEntries(details)`.
- Removes: `fetchAuditLogs` and every `/users/audit-logs` frontend reference.

- [ ] **Step 1: Write failing API and UI source-contract tests**

Create `frontend/test/adminApi.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiPath = new URL('../src/api/adminApi.js', import.meta.url);

test('FE11 Audit Logs use the canonical Admin endpoint and authorized wrapper', async () => {
  const source = await readFile(apiPath, 'utf8');
  assert.match(
    source,
    /auditLogs\(params = \{\}\)[\s\S]*?authorizedRequest\([\s\S]*?url: '\/admin\/audit-logs'[\s\S]*?params/,
  );
  assert.doesNotMatch(source, /\/users\/audit-logs/);
});
```

Append to `frontend/test/userManagementApi.test.js`:

```js
test('FE11 user-management API no longer owns Audit Logs', async () => {
  const source = await readFile(apiPath, 'utf8');
  assert.doesNotMatch(source, /export async function fetchAuditLogs/);
  assert.doesNotMatch(source, /\/users\/audit-logs/);
});
```

Append to `frontend/test/userManagementFrontend.test.js`:

```js
test('FE11 Audit query builder omits blanks and preserves nonblank server validation input', async () => {
  const source = await readFile(pagePath, 'utf8');
  const functionMatch = source.match(/function buildAuditLogParams\([^]*?\n}\r?\n/);
  assert.ok(functionMatch, 'buildAuditLogParams must exist');
  const buildAuditLogParams = new Function(
    `const AUDIT_TABLE_PAGE_SIZE = 20; ${functionMatch[0]}; return buildAuditLogParams;`,
  )();

  assert.deepEqual(buildAuditLogParams({
    page: 2,
    q: '  login  ',
    action: '  AUTH_LOGIN_SUCCESS  ',
    actorId: '7',
    from: '2026-07-01',
    to: '2026-07-18',
  }), {
    page: 2,
    limit: 20,
    q: 'login',
    action: 'AUTH_LOGIN_SUCCESS',
    actorId: 7,
    from: '2026-07-01',
    to: '2026-07-18',
  });
  assert.deepEqual(buildAuditLogParams({ q: ' ', action: '', actorId: '' }), {
    page: 1,
    limit: 20,
  });
  assert.equal(buildAuditLogParams({ actorId: 'invalid' }).actorId, 'invalid');
});

test('FE11 Audit controls reset pagination and refresh with applied filters', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /loadAuditLogs\(1, \{ filters: auditFilters \}\)/);
  assert.match(source, /setAuditFilters\(EMPTY_AUDIT_FILTERS\)[\s\S]*?loadAuditLogs\(1, \{ filters: EMPTY_AUDIT_FILTERS \}\)/);
  assert.match(source, /loadAuditLogs\(auditPagination\.page, \{ announce: true, filters: auditFilters \}\)/);
});

test('FE11 Audit renders only the nested safe DTO as React text', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /log\.actor\?\.fullName/);
  assert.match(source, /log\.actor\?\.email/);
  assert.match(source, /log\.target\?\.label/);
  assert.match(source, /log\.target\?\.type/);
  assert.match(source, /log\.target\?\.id/);
  assert.match(source, /formatAuditDetailEntries\(log\.details\)/);
  assert.match(source, /pageSize=\{auditPagination\.limit \|\| AUDIT_TABLE_PAGE_SIZE\}/);
  assert.doesNotMatch(source, /log\.metadata/);
  assert.doesNotMatch(source, /JSON\.stringify\(log\.details/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(source, /log\.(?:actorName|actorEmail|targetName|targetEmail|targetType|targetId)/);
});
```

These tests assert:

- `buildAuditLogParams` trims `q`/`action`, converts a valid actor ID, preserves nonblank invalid input for server rejection, preserves `from`/`to`, and omits only blank optional fields;
- Apply and Clear call `loadAuditLogs(1, ...)` so pagination resets;
- refresh calls `loadAuditLogs(auditPagination.page, { announce: true, filters: auditFilters })`;
- actor reads `log.actor?.fullName` / `log.actor?.email`;
- target reads `log.target?.label` / `type` / `id`;
- details use `formatAuditDetailEntries(log.details)` and never `JSON.stringify`, `dangerouslySetInnerHTML`, or raw `metadata`;
- audit pagination uses limit `20`, while other Admin tables keep the default page size `8`.

- [ ] **Step 2: Run the frontend RED tests**

```powershell
node --test frontend/test/adminApi.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js
```

Expected: FAIL because the API still uses the legacy adapter and the page renders flat prototype fields without canonical filters/details.

- [ ] **Step 3: Implement the API migration and query helper**

Add to `adminApi`:

```js
auditLogs(params = {}) {
  return authorizedRequest(
    { method: 'get', url: '/admin/audit-logs', params },
    'Khong the tai nhat ky hoat dong.'
  );
},
```

Remove `fetchAuditLogs` from `userManagementApi.js` and its import from `UserManagement.jsx`.

Add near the Admin page constants:

```js
const ADMIN_TABLE_PAGE_SIZE = 8;
const AUDIT_TABLE_PAGE_SIZE = 20;
const EMPTY_AUDIT_FILTERS = { q: '', action: '', actorId: '', from: '', to: '' };

function buildAuditLogParams({ page = 1, limit = AUDIT_TABLE_PAGE_SIZE, ...filters } = {}) {
  const params = { page, limit };
  const q = String(filters.q || '').trim();
  const action = String(filters.action || '').trim();
  const actorIdText = String(filters.actorId ?? '').trim();
  if (q) params.q = q;
  if (action) params.action = action;
  if (actorIdText) {
    params.actorId = /^\d+$/.test(actorIdText) ? Number(actorIdText) : actorIdText;
  }
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  return params;
}

function formatAuditDetailEntries(details) {
  return Object.entries(details || {}).filter(([, value]) => (
    ['string', 'number', 'boolean'].includes(typeof value)
    || (Array.isArray(value) && value.every((item) => (
      item === null || ['string', 'number', 'boolean'].includes(typeof item)
    )))
  ));
}

function formatAuditDetailValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  return String(value);
}
```

- [ ] **Step 4: Implement filter state, loading, rendering, and pagination**

Add state beside the existing Audit state and initialize pagination with the canonical default:

```js
const [auditFilters, setAuditFilters] = useState(EMPTY_AUDIT_FILTERS);
const [auditPagination, setAuditPagination] = useState({
  page: 1,
  limit: AUDIT_TABLE_PAGE_SIZE,
  total: 0,
  totalPages: 0,
});
```

Change the loader signature to:

```js
async function loadAuditLogs(
  page = auditPagination.page,
  { announce = false, filters = auditFilters } = {}
) {
  if (!getStoredAdminUser()) {
    setAuditLogs([]);
    setAuditError('Vui lòng đăng nhập bằng tài khoản quản trị viên để xem nhật ký hoạt động.');
    return;
  }

  setAuditLoading(true);
  setAuditError('');
  try {
    const result = await adminApi.auditLogs(buildAuditLogParams({
      ...filters,
      page,
      limit: AUDIT_TABLE_PAGE_SIZE,
    }));
    setAuditLogs(result.data || []);
    setAuditPagination(result.pagination || {
      page,
      limit: AUDIT_TABLE_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    });
    setAuditUpdatedAt(new Date());
    if (announce) setToast({ type: 'success', message: 'Đã làm mới nhật ký hoạt động.' });
  } catch (error) {
    setAuditError(error.message);
    if (announce) setToast({ type: 'error', message: error.message });
  } finally {
    setAuditLoading(false);
  }
}
```

Replace the Audit refresh branch with:

```js
else if (activeSection === 'audit') {
  loadAuditLogs(auditPagination.page, { announce: true, filters: auditFilters });
}
```

Add this toolbar before the Audit table heading:

```jsx
<div className="um-toolbar audit">
  <div className="um-search">
    <Search size={18} />
    <input
      aria-label="Tìm nhật ký"
      value={auditFilters.q}
      maxLength={100}
      placeholder="Tìm hành động, actor hoặc đối tượng..."
      onChange={(event) => setAuditFilters((current) => ({
        ...current,
        q: event.target.value,
      }))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') loadAuditLogs(1, { filters: auditFilters });
      }}
    />
  </div>
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
  <input
    aria-label="Từ ngày"
    type="date"
    value={auditFilters.from}
    onChange={(event) => setAuditFilters((current) => ({
      ...current,
      from: event.target.value,
    }))}
  />
  <input
    aria-label="Đến ngày"
    type="date"
    value={auditFilters.to}
    onChange={(event) => setAuditFilters((current) => ({
      ...current,
      to: event.target.value,
    }))}
  />
  <button
    type="button"
    className="um-secondary-button"
    disabled={auditLoading}
    onClick={() => loadAuditLogs(1, { filters: auditFilters })}
  >
    Áp dụng
  </button>
  <button
    type="button"
    className="um-secondary-button"
    disabled={auditLoading}
    onClick={() => {
      setAuditFilters(EMPTY_AUDIT_FILTERS);
      loadAuditLogs(1, { filters: EMPTY_AUDIT_FILTERS });
    }}
  >
    <FilterX size={16} /> Xóa lọc
  </button>
</div>
```

Add a `Chi tiết an toàn` column and render rows only from the nested DTO:

```jsx
<td>
  <strong>{log.actor?.fullName || log.actor?.email || 'Hệ thống'}</strong>
  {log.actor?.fullName && log.actor?.email && <small>{log.actor.email}</small>}
</td>
<td>
  <strong>{log.target?.label || (log.target?.id ? `#${log.target.id}` : '-')}</strong>
  {log.target?.type && <small>{log.target.type}</small>}
</td>
<td>
  {formatAuditDetailEntries(log.details).length === 0 ? '-' : (
    <dl className="um-audit-details">
      {formatAuditDetailEntries(log.details).map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{formatAuditDetailValue(value)}</dd>
        </div>
      ))}
    </dl>
  )}
</td>
```

Do not render raw JSON or HTML. React text escaping remains the only rendering path.

Change pagination to preserve existing tables:

```js
function AdminTablePagination({
  page,
  totalItems,
  onPageChange,
  pageSize = ADMIN_TABLE_PAGE_SIZE,
}) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  // existing buttons
}
```

Pass `pageSize={auditPagination.limit || AUDIT_TABLE_PAGE_SIZE}` only for Audit Logs.

- [ ] **Step 5: Run the frontend GREEN tests**

```powershell
node --test frontend/test/adminApi.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Expected: source-contract tests, lint, and production build PASS; no legacy endpoint or unsafe metadata rendering remains.

---

### Task 5: Synchronize Contracts And Assemble The H2 Evidence Package

**Files:**
- Modify: `docs/api/api-contract.md`
- Modify: `backend/src/docs/openapi.yaml`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Create: `.sdd/reviews/fe11-audit-log-validation-2026-07-18.md`

**Interfaces:**
- Produces: synchronized human/API documentation for `GET /api/admin/audit-logs` and an L1-L4 H2 review packet.
- Does not close: `FE11-AUD01` or `TD-024` before H2/H3/merge evidence exists.

- [ ] **Step 1: Document the canonical API**

Append this FE11 subsection to `docs/api/api-contract.md` before the implementation notes:

````markdown
### GET `/api/admin/audit-logs`

Actor: authenticated Admin. Authentication and Admin authorization run before detailed query validation.

| Query | Type | Required | Contract |
| --- | --- | --- | --- |
| `page` | integer | No | Default `1`; minimum `1` |
| `limit` | integer | No | Default `20`; range `1..100` |
| `q` | string | No | Trimmed `1..100`; searches action, actor email/full name, target type, and target ID text |
| `action` | string | No | Trimmed exact action, `1..100` |
| `actorId` | integer | No | Positive user ID |
| `from` | date | No | Inclusive `YYYY-MM-DD` lower bound |
| `to` | date | No | Inclusive `YYYY-MM-DD` upper bound; must not precede `from` |

Response `200`:

```json
{
  "data": [
    {
      "logId": 10,
      "action": "USER_ROLE_ASSIGN",
      "actor": {
        "userId": 7,
        "email": "admin@example.test",
        "fullName": "Admin User"
      },
      "target": {
        "type": "USER",
        "id": 15,
        "label": "member@example.test"
      },
      "details": {
        "roleId": 2,
        "roleName": "LIBRARIAN"
      },
      "ipAddress": "203.0.113.10",
      "createdAt": "2026-07-18T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Rules:

- Rows are ordered by `CreatedAt DESC, LogId DESC`; filtering and pagination run in SQL with typed parameters.
- `details` is an action-aware allowlist. Raw `Metadata`, `UserAgent`, passwords, hashes, tokens, OTPs, sessions, credentials, setup/reset links, raw notes/reasons/emails/identifiers, raw paths, and nested objects are not returned.
- Invalid JSON, top-level arrays/scalars, unknown actions, and invalid projected field shapes return `details: {}`.
- Only targets with type `USER`, `USERS`, or `ACCOUNT` may receive a joined user label. Other target types return `label: null`.
- An empty result returns `totalPages: 0`.
- The retired `GET /api/users/audit-logs` path always returns `404 NOT_FOUND` and is not a compatibility alias.
````

Update the OpenAPI title/description to include FE11, add an `Admin Audit` tag, and add these schemas under `components.schemas`:

```yaml
    AuditLogActor:
      type: object
      additionalProperties: false
      required: [userId, email, fullName]
      properties:
        userId: { type: integer, nullable: true, minimum: 1 }
        email: { type: string, nullable: true, format: email }
        fullName: { type: string, nullable: true }
    AuditLogTarget:
      type: object
      additionalProperties: false
      required: [type, id, label]
      properties:
        type: { type: string, nullable: true }
        id: { type: integer, nullable: true, minimum: 1 }
        label: { type: string, nullable: true }
    AuditLogDetails:
      type: object
      additionalProperties: false
      properties:
        roleId: { type: integer, minimum: 1 }
        roleName: { type: string }
        changedFields: { type: array, maxItems: 100, items: { type: string } }
        newStatus: { type: string }
        previousStatus: { type: string }
        copyIds: { type: array, maxItems: 100, items: { type: integer, minimum: 1 } }
        memberUserId: { type: integer, minimum: 1 }
        requestId: { type: integer, minimum: 1 }
        memberId: { type: integer, minimum: 1 }
        copyId: { type: integer, minimum: 1 }
        selectedUserId: { type: integer, minimum: 1 }
        borrowDetailId: { type: integer, minimum: 1 }
        userId: { type: integer, minimum: 1 }
        bookId: { type: integer, minimum: 1 }
        sourceEntityId: { type: integer, minimum: 1 }
        condition: { type: string }
        barcode: { type: string }
        location: { type: string }
        status: { type: string }
        code: { type: string }
        method: { type: string }
        reportType: { type: string, enum: [BORROWING, INVENTORY, USERS] }
        type: { type: string }
        channel: { type: string }
        sourceFeature: { type: string }
        sourceEntityType: { type: string }
        newDueDate: { type: string, format: date-time }
        expiresAt: { type: string, format: date-time }
        overdueDays: { type: number, minimum: 0 }
        amount: { type: number, minimum: 0 }
        collectedAmount: { type: number, minimum: 0 }
        statusCode: { type: integer, minimum: 0 }
        processed: { type: integer, minimum: 0 }
        failed: { type: integer, minimum: 0 }
        fullyCollected: { type: boolean }
        reasonProvided: { type: boolean }
        notesProvided: { type: boolean }
        noteProvided: { type: boolean }
    AuditLogEntry:
      type: object
      additionalProperties: false
      required: [logId, action, actor, target, details, ipAddress, createdAt]
      properties:
        logId: { type: integer, minimum: 1 }
        action: { type: string }
        actor: { $ref: '#/components/schemas/AuditLogActor' }
        target: { $ref: '#/components/schemas/AuditLogTarget' }
        details: { $ref: '#/components/schemas/AuditLogDetails' }
        ipAddress: { type: string, nullable: true }
        createdAt: { type: string, format: date-time }
    AuditLogPagination:
      type: object
      additionalProperties: false
      required: [page, limit, total, totalPages]
      properties:
        page: { type: integer, minimum: 1 }
        limit: { type: integer, minimum: 1, maximum: 100 }
        total: { type: integer, minimum: 0 }
        totalPages: { type: integer, minimum: 0 }
    AuditLogListResponse:
      type: object
      additionalProperties: false
      required: [data, pagination]
      properties:
        data:
          type: array
          items: { $ref: '#/components/schemas/AuditLogEntry' }
        pagination: { $ref: '#/components/schemas/AuditLogPagination' }
```

Add this path under `paths`:

```yaml
  /api/admin/audit-logs:
    get:
      tags: [Admin Audit]
      summary: Search and filter redacted cross-feature audit logs (FR-FE11-033)
      security: [{ bearerAuth: [] }]
      parameters:
        - { name: page, in: query, required: false, schema: { type: integer, minimum: 1, default: 1 } }
        - { name: limit, in: query, required: false, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
        - { name: q, in: query, required: false, schema: { type: string, minLength: 1, maxLength: 100 } }
        - { name: action, in: query, required: false, schema: { type: string, minLength: 1, maxLength: 100 } }
        - { name: actorId, in: query, required: false, schema: { type: integer, minimum: 1 } }
        - { name: from, in: query, required: false, schema: { type: string, format: date } }
        - { name: to, in: query, required: false, schema: { type: string, format: date } }
      responses:
        '200':
          description: Redacted audit-log page
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AuditLogListResponse' }
        '400': { $ref: '#/components/responses/ValidationError' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '403': { $ref: '#/components/responses/Forbidden' }
```

Do not document raw metadata or a legacy alias.

- [ ] **Step 2: Run focused backend integration tests**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminAuditLogRoutes.test.js tests/adminAuditLogService.test.js tests/auditLogRepository.test.js tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/securityRegression.test.js
```

Expected: all six suites PASS.

- [ ] **Step 3: Run full L1 validation**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
Push-Location backend
node -e "require('yamljs').load('src/docs/openapi.yaml'); console.log('OpenAPI OK')"
Pop-Location
npm.cmd run trace:enforce
git diff --check
```

Expected: all commands PASS. A deterministic failure receives at most three total attempts; a suspected E2E flake may be rerun once with evidence.

- [ ] **Step 4: Run scope and sensitive-data scans**

```powershell
git diff --name-only
git diff --check
git diff -U0 | rg -n "(?i)(password|passwd|token|otp|authorization|cookie|secret|session|credential|api[-_]?key|setup[-_]?link|reset[-_]?link)"
rg -n "fetchAuditLogs|/users/audit-logs|listRecent" backend frontend
```

Expected: changed files remain inside TD-024 ownership; sensitive-term matches are limited to projector deny rules and negative test assertions; no functional legacy call or `listRecent` reference remains.

- [ ] **Step 5: Record L1-L4 evidence for H2**

Create `.sdd/reviews/fe11-audit-log-validation-2026-07-18.md` only after the commands finish, recording exact observed suite/test counts and command results.

The packet must contain:

- L1: observed RED failures, GREEN focused tests, full tests, coverage, lint, build, traceability, diff check, scope scan, and sensitive-data scan.
- L2: mapping from `FE11-AUD01` code/tests to `FR-FE11-033`, `AC-FE11-018`, `BR-FE11-018`, `BR-FE11-026`, and `TD-024`.
- L3: Admin-first authorization, boundary validation, typed parameterized SQL, action-aware default-deny projection, no raw metadata/secrets, and no schema/auth/dependency expansion.
- L4: reviewer-demonstrated filter combinations, pagination/order, safe details, non-user target labels, legacy `404`, frontend read-only flow, and residual environment gaps.

Update `TEST_PLAN.md` and `CHANGELOG.md` to say implementation is H2-ready only after evidence exists. Keep `TD-024` `IN PROGRESS` and `FE11-AUD01` unchecked until the authorized closeout gate.

- [ ] **Step 6: Stop for H2 review before commit or push**

Present the complete uncommitted diff and `.sdd/reviews/fe11-audit-log-validation-2026-07-18.md` to the human reviewer. H2 approval authorizes only the reviewed commit set, push, draft PR publication, and ready-for-review transition after required checks pass; H3 remains required before merge.

---

### Task 6: Publish After H2 And Integrate Only After H3

**Files:**
- Commit: the exact H2-reviewed TD-024 diff only
- Publish branch: `fix/fe11-audit-log-contract`
- Create PR: one TD-024 implementation PR against `main`
- Stage later batch closeout evidence: no per-slice closeout PR

**Interfaces:**
- Consumes: explicit H2 approval, the unchanged reviewed diff, and passing local L1 evidence.
- Produces: reviewed commits, required PR CI, an H3 decision packet, merge evidence, and post-merge CI evidence for the final Batch 1 closeout.

- [ ] **Step 1: Confirm the H2-reviewed diff has not changed**

Record the H2 diff hash before approval:

```powershell
git diff --binary | git hash-object --stdin
```

Immediately before committing, rerun the command and require the same hash. If it differs, stop and present the new diff for H2 again.

- [ ] **Step 2: Create the approved commit set**

After explicit H2 approval, create these reviewable commits without changing content between them:

```powershell
git add -- backend/src/validators/adminValidators.js backend/src/routes/adminRoutes.js backend/src/controllers/adminController.js backend/src/routes/userManagementRoutes.js backend/src/controllers/userManagementController.js backend/src/services/adminService.js backend/src/services/userManagementService.js backend/src/repositories/auditLogRepository.js backend/tests/adminAuditLogRoutes.test.js backend/tests/adminAuditLogService.test.js backend/tests/auditLogRepository.test.js backend/tests/userManagementRoutes.test.js backend/tests/userManagementService.test.js
git commit -m "feat(fe11): add canonical admin audit log boundary"

git add -- frontend/src/api/adminApi.js frontend/src/api/userManagementApi.js frontend/src/page/UserManagement.jsx frontend/test/adminApi.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js
git commit -m "feat(fe11): migrate admin audit log UI"

git add -- docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md docs/api/api-contract.md backend/src/docs/openapi.yaml .sdd/reviews/fe11-audit-log-validation-2026-07-18.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md
git commit -m "docs: record FE11 audit log validation"
```

Expected: `git status --short` is empty. Do not include `SPEC.md`, schema, dependencies, TD-026 files, or unrelated user changes.

- [ ] **Step 3: Push and open the draft implementation PR**

```powershell
git push -u origin fix/fe11-audit-log-contract
@'
## What changed

- Add canonical Admin-only `GET /api/admin/audit-logs` with `q`, `action`, `actorId`, `from`, `to`, `page`, and `limit`.
- Apply typed SQL filters/pagination and action-aware default-deny details projection.
- Migrate the Admin UI and retire `/api/users/audit-logs` with `404 NOT_FOUND`.

## Spec mapping

- BR-FE11-018, BR-FE11-026
- FR-FE11-033
- AC-FE11-018
- FE11-AUD01 / TD-024 only

## Validation

- RED-GREEN route, repository, service, API, and frontend contract tests
- Full backend/frontend tests, coverage, lint, build, traceability, diff and sensitive-data scans
- No schema, dependency, authentication, audit-write, or TD-026 change

## Residual gap

- SQL Server-backed and browser interaction evidence is recorded explicitly if the local environment cannot provide it; GitHub CI remains required.
'@ | gh pr create --draft --base main --head fix/fe11-audit-log-contract --title "feat(fe11): add canonical admin audit logs" --body-file -
```

- [ ] **Step 4: Require PR checks and prepare H3 evidence**

```powershell
$prNumber = gh pr view --json number --jq .number
gh pr checks $prNumber --watch
gh pr ready $prNumber
gh pr view $prNumber --json number,url,isDraft,mergeable,mergeStateStatus,statusCheckRollup,commits,files
```

Expected: required checks pass, the branch is mergeable, and the PR is ready. Present the exact PR URL, commit SHAs, changed-file scope, L1-L4 packet, and residual risks. Do not merge without explicit H3 approval.

- [ ] **Step 5: Merge only after explicit H3 approval**

Use the repository's normal non-destructive merge command after the user explicitly approves H3:

```powershell
gh pr merge $prNumber --merge --delete-branch
```

Do not use admin merge, bypass checks, force push, or a CI waiver.

- [ ] **Step 6: Associate the exact post-merge `main` CI run**

```powershell
$mergeSha = gh pr view $prNumber --json mergeCommit --jq .mergeCommit.oid
$runId = gh run list --branch main --workflow CI --event push --limit 20 --json databaseId,headSha --jq ".[] | select(.headSha == `"$mergeSha`") | .databaseId" | Select-Object -First 1
if (-not $runId) { throw "Post-merge CI run was not found for $mergeSha" }
gh run watch $runId --exit-status
```

Expected: the post-merge `foundation-checks` run passes for the exact merge SHA.

- [ ] **Step 7: Preserve evidence for the Batch 1 closeout**

Record the TD-024 PR number, merge SHA, PR CI run, post-merge CI run, and final L1-L4 result in the pre-reviewed Batch 1 closeout workspace. Do not open a separate TD-024 closeout PR. Keep whole FE11 deferred and proceed next to `TD-026`; the final mechanical Batch 1 closeout occurs only after `TD-024`, `TD-026`, and `TD-027` have each passed their own H2/H3 flow.

---

## Self-Review

- Spec coverage: Tasks 1-5 cover canonical ownership, Admin-first validation, all query filters, stable typed SQL pagination, safe action projection, frontend migration, legacy retirement, API docs, and L1-L4 evidence.
- Type consistency: query names, DTO fields, helper names, repository method, and frontend adapter names are identical across tasks.
- Scope: no schema, dependency, auth expansion, compatibility alias, export, audit writes, or cross-domain label joins are included.
- Residual acceptance gap: a real SQL Server execution and browser interaction remain environment-dependent if those environments are unavailable; emitted SQL, source contracts, and component behavior remain automated.

Plan complete and saved to `docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md`. Execute inline with `executing-plans` only after PR #32 receives H3 and merges.
