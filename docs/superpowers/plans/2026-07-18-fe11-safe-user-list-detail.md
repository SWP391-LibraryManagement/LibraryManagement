# FE11 Safe User List And Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make FE11 user list and detail responses use the approved safe DTO, strict query validation, deterministic detail aggregates, and `404 USER_NOT_FOUND`, with the Admin UI consuming the real detail endpoint.

**Architecture:** Keep the existing Express controller/service/repository flow and the existing `userRepository.js` read boundary. Implement the list and detail as separate safe projections so detail-only aggregates never leak into list or mutation readback responses; keep frontend query normalization in a small pure helper and fetch detail only when a row is selected.

**Tech Stack:** Node.js CommonJS, Express 5, express-validator 7, Jest 30, SQL Server via `mssql`, React 19, Vite 8, Node test runner, Markdown SDD artifacts.

## Global Constraints

- Execute from an isolated worktree based on `origin/main` at or after `66642b5`; bring in only the approved design and this plan from `agent/spec-baseline-fe01`, not the branch's unrelated traceability history.
- Approved stack remains Node.js + Express.js, React + Bootstrap, SQL Server, and RESTful API.
- Implement only `BR-FE11-001`, `BR-FE11-026`, `FR-FE11-001`, `FR-FE11-002`, `FR-FE11-015`, `FR-FE11-016`, `AC-FE11-001`, `AC-FE11-002`, `NFR-FE11-SEC-001`, `NFR-FE11-SEC-002`, `NFR-FE11-SEC-004..006`, and `NFR-FE11-PERF-001` for this slice.
- Keep FE11 `Implementation State: DEFERRED`; record this completed slice separately because the feature-wide traceability denominator is unchanged.
- Do not change database schema, user update/deactivation behavior, account setup, role mutation, Admin dashboard, audit-log UI, or the traceability checker.
- Do not return fake `department` or `specialization` keys; `TD-012` remains open.
- The managed-user response key is `phoneNumber`; create/update request payloads continue to use `phone` in this slice.
- List items and mutation readbacks never contain `relatedSummary`; only `GET /api/users/{userId}` contains it.
- Authenticate and authorize Admin access before exposing input-validation details.
- Use typed SQL parameters and explicit response allowlists; never return credentials, tokens, sessions, setup/reset links, provider payloads, or secret audit metadata.
- Every production behavior change must have an observed failing test first.
- Preserve unrelated user changes and untracked files; stage only files named by the active task.

---

### Task 1: Activate The Approved FE11 Read Slice

**Files:**
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-07-18-fe11-safe-user-list-detail-design.md` and completed FE11 account-setup/transactional-role slices on `origin/main`.
- Produces: task IDs `FE11-U01..U06`, explicit scope, and validation evidence expectations used by Tasks 2-5.

- [ ] **Step 1: Append the safe list/detail slice to FE11 PLAN.md**

Update the top status to:

```markdown
Status: APPROVED - BASELINE 2026-07-17; ACCOUNT SETUP AND TRANSACTIONAL ROLE SLICES COMPLETE; SAFE LIST/DETAIL SLICE APPROVED FOR IMPLEMENTATION; REMAINING WORK DEFERRED
```

Append:

```markdown
## 11. Safe User List And Detail Slice

### In Scope

- Validate list pagination, status, role, search, and detail user ID.
- Return only the explicit `UserManagementView` allowlist with `phoneNumber`.
- Restrict search to email, full name, and user ID with stable ordering.
- Return detail-only borrowing, unpaid-fine, and open-reservation summaries.
- Return `404 USER_NOT_FOUND` for a missing detail user.
- Make the Admin UI fetch and render the real detail response.
- Add route, service, repository, and frontend RED-GREEN tests.

### Out Of Scope

- Schema changes and librarian `department`/`specialization` persistence.
- Update/deactivation, account setup, role mutation, audit-log, dashboard, and request-management behavior.
- Feature-wide traceability-checker policy changes.

### Validation Gate

- Invalid supplied list/detail values are rejected instead of clamped.
- Hostile extra database columns never appear in the safe DTO.
- List items have no `relatedSummary`; detail has exactly three deterministic numeric summary fields.
- Focused/full backend and frontend checks plus `trace:enforce` pass.
- Remaining FE11 work stays deferred and is not reported as complete.
```

- [ ] **Step 2: Add FE11-U01..U06 to TASKS.md**

Insert before `## Deferred FE11 Work`:

```markdown
## Safe User List And Detail Tasks

- [ ] **FE11-U01 - Enforce the canonical user-list contract.**
  - Maps to: FR-FE11-001, AC-FE11-001, NFR-FE11-SEC-004, NFR-FE11-PERF-001.
  - DoD: omitted values use page 1/limit 20; invalid supplied values are rejected; status/role/search are normalized; search uses only email, full name, and user ID; order stays `CreatedAt DESC, UserId DESC`.

- [ ] **FE11-U02 - Return the explicit safe managed-user allowlist.**
  - Maps to: BR-FE11-026, FR-FE11-001, AC-FE11-001, NFR-FE11-SEC-006.
  - DoD: list/readback responses use `phoneNumber`, deterministic uppercase roles, and no credential/token/session/link/audit-secret fields.

- [ ] **FE11-U03 - Add the detail-only related summary query.**
  - Maps to: FR-FE11-002, AC-FE11-002.
  - DoD: one parameterized detail query returns active borrowing count, outstanding unpaid-fine total, and open reservation count with numeric zero defaults.

- [ ] **FE11-U04 - Return deterministic detail validation and not-found errors.**
  - Maps to: FR-FE11-015, FR-FE11-016, NFR-FE11-SEC-001/002/004.
  - DoD: Admin authorization precedes validation; invalid IDs return `400 VALIDATION_ERROR`; valid missing IDs return `404 USER_NOT_FOUND`.

- [ ] **FE11-U05 - Consume the safe list/detail contract in the Admin UI.**
  - Maps to: AC-FE11-001, AC-FE11-002.
  - DoD: UI omits `ALL`/empty search, reads `phoneNumber`, fetches detail on row selection, renders summaries, and reloads a stale list after detail 404.

- [ ] **FE11-U06 - Pass the safe list/detail validation gate.**
  - Dependencies: FE11-U01..U05.
  - DoD: focused/full tests, coverage, frontend lint/build, traceability, diff hygiene, security review, debt reconciliation, validation record, and human review evidence are complete.
```

Keep this line unchanged:

```markdown
Implementation State: DEFERRED
```

- [ ] **Step 3: Update TEST_PLAN.md and CHANGELOG.md**

Add the approved design and implementation plan under Current Evidence. Add a `2026-07-18 - Safe User List And Detail Slice Approved` changelog entry stating the exact allowlist, strict query validation, aggregate semantics, no-schema decision, TDD requirement, and that no implementation evidence is claimed yet.

- [ ] **Step 4: Run documentation checks**

```powershell
npm.cmd run trace:enforce
git diff --check -- .sdd/specs/feat-user-role-management
```

Expected: traceability enforcement remains PASS with FE11 whole-feature `DEFERRED`, and the Markdown diff is clean. Do not add or modify traceability-checker scripts in this slice.

- [ ] **Step 5: Commit the planning checkpoint**

```powershell
git add -- .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md
git commit -m "docs: activate FE11 safe user reads"
```

---

### Task 2: Implement The Safe User List Vertical Slice

**Files:**
- Create: `backend/tests/userRepository.test.js`
- Create: `frontend/src/utils/userManagementQuery.js`
- Modify: `backend/tests/userManagementRoutes.test.js`
- Modify: `backend/tests/userManagementService.test.js`
- Modify: `backend/src/validators/userManagementValidators.js`
- Modify: `backend/src/routes/userManagementRoutes.js`
- Modify: `backend/src/controllers/userManagementController.js`
- Modify: `backend/src/services/userManagementService.js`
- Modify: `backend/src/repositories/userRepository.js`
- Modify: `frontend/test/userManagementApi.test.js`
- Modify: `frontend/src/api/userManagementApi.js`
- Modify: `frontend/src/page/UserManagement.jsx`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`

**Interfaces:**
- Consumes: existing `handleValidationErrors`, Admin-first middleware, `listManagedUsers({ page, limit, status, role, search })`, and current pagination envelope.
- Produces: `listUsersValidators`, `req.validatedListQuery`, canonical service filters, `buildManagedUserListParams(input)`, and safe list items with `phoneNumber` and no `relatedSummary`.

- [ ] **Step 1: Write failing list route tests**

Add to `backend/tests/userManagementRoutes.test.js`:

```js
test('GET /api/users normalizes the approved list query', async () => {
  const userManagementService = {
    listUsers: jest.fn(async () => ({
      data: [],
      pagination: { page: 2, limit: 50, total: 0, totalPages: 0 },
    })),
  };
  const app = makeApp({ userManagementService });

  const response = await request(app)
    .get('/api/users?page=2&limit=50&status=active&role=member&search=%20Alice%20')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(200);
  expect(userManagementService.listUsers).toHaveBeenCalledWith({
    page: 2,
    limit: 50,
    status: 'ACTIVE',
    role: 'MEMBER',
    search: 'Alice',
  });
});

test.each([
  ['/api/users?page=0', 'page'],
  ['/api/users?page=1.5', 'page'],
  ['/api/users?page=abc', 'page'],
  ['/api/users?limit=0', 'limit'],
  ['/api/users?limit=101', 'limit'],
  ['/api/users?status=DELETED', 'status'],
  ['/api/users?role=GUEST', 'role'],
  [`/api/users?search=${'x'.repeat(201)}`, 'search'],
  ['/api/users?search=%20%20%20', 'search'],
])('GET %s rejects invalid %s', async (url, field) => {
  const userManagementService = { listUsers: jest.fn() };
  const app = makeApp({ userManagementService });

  const response = await request(app)
    .get(url)
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.details).toEqual(
    expect.arrayContaining([expect.objectContaining({ field })])
  );
  expect(userManagementService.listUsers).not.toHaveBeenCalled();
});

test('GET /api/users authorizes before validating the query', async () => {
  const userManagementService = { listUsers: jest.fn() };
  const app = makeApp({ roles: ['MEMBER'], userManagementService });

  const response = await request(app)
    .get('/api/users?page=0')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(403);
  expect(response.body.error.code).toBe('ADMIN_REQUIRED');
  expect(userManagementService.listUsers).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Write failing service list tests**

Add a focused harness and tests to `backend/tests/userManagementService.test.js`:

```js
function makeReadHarness(userRepositoryOverrides = {}) {
  const userRepository = {
    listManagedUsers: jest.fn(async (query) => ({
      data: [],
      pagination: { ...query, total: 0, totalPages: 0 },
    })),
    getManagedUserById: jest.fn(),
    ...userRepositoryOverrides,
  };
  const service = createUserManagementService({
    userRepository,
    userRoleRepository: {},
    authTokenRepository: {},
    auditLogRepository: {},
    accountSetupRepository: {},
    notificationRequester: { createNotificationRequest: jest.fn() },
  });
  return { service, userRepository };
}

test('listUsers applies defaults only when values are omitted', async () => {
  const { service, userRepository } = makeReadHarness();

  await service.listUsers({});

  expect(userRepository.listManagedUsers).toHaveBeenCalledWith({
    page: 1,
    limit: 20,
    status: null,
    role: null,
    search: null,
  });
});

test('listUsers normalizes approved filters before repository access', async () => {
  const { service, userRepository } = makeReadHarness();

  await service.listUsers({
    page: '2',
    limit: '50',
    status: ' active ',
    role: ' librarian ',
    search: '  user@example.test  ',
  });

  expect(userRepository.listManagedUsers).toHaveBeenCalledWith({
    page: 2,
    limit: 50,
    status: 'ACTIVE',
    role: 'LIBRARIAN',
    search: 'user@example.test',
  });
});

test.each([
  [{ page: 0 }, 'INVALID_PAGE'],
  [{ page: 1.5 }, 'INVALID_PAGE'],
  [{ limit: 101 }, 'INVALID_LIMIT'],
  [{ status: 'DELETED' }, 'INVALID_USER_STATUS'],
  [{ role: 'GUEST' }, 'INVALID_USER_ROLE'],
  [{ search: '   ' }, 'INVALID_USER_SEARCH'],
  [{ search: 'x'.repeat(201) }, 'INVALID_USER_SEARCH'],
])('listUsers rejects invalid direct input %j', async (query, code) => {
  const { service, userRepository } = makeReadHarness();

  await expect(service.listUsers(query)).rejects.toMatchObject({ statusCode: 400, code });
  expect(userRepository.listManagedUsers).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Write failing repository allowlist and SQL tests**

Create `backend/tests/userRepository.test.js` with the database mock and list assertions:

```js
jest.mock('../src/config/db', () => ({
  sql: {
    Int: 'Int',
    NVarChar: (size) => `NVarChar(${size})`,
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const userRepository = require('../src/repositories/userRepository');

function useRecordset(recordset) {
  const capture = { inputs: {}, query: '' };
  getPool.mockResolvedValue({
    request() {
      return {
        input(name, _type, value) {
          capture.inputs[name] = value;
          return this;
        },
        async query(query) {
          capture.query = query;
          return { recordset };
        },
      };
    },
  });
  return capture;
}

beforeEach(() => getPool.mockReset());

test('listManagedUsers returns only the approved base DTO', async () => {
  useRecordset([{
    UserId: 7,
    Username: 'safe.user',
    Email: 'safe@example.test',
    Phone: '0900000000',
    Status: 'ACTIVE',
    FullName: 'Safe User',
    Address: 'Shelf Street',
    LastLoginAt: null,
    CreatedAt: new Date('2026-07-01T00:00:00.000Z'),
    UpdatedAt: new Date('2026-07-18T00:00:00.000Z'),
    Roles: 'member,ADMIN',
    TotalCount: 1,
    PasswordHash: 'forbidden-hash',
    TokenHash: 'forbidden-token',
    SessionId: 'forbidden-session',
    SetupLink: 'https://forbidden.example/setup',
    AuditSecret: 'forbidden-audit',
  }]);

  const result = await userRepository.listManagedUsers({ page: 1, limit: 20 });

  expect(result.data[0]).toEqual({
    userId: 7,
    username: 'safe.user',
    email: 'safe@example.test',
    phoneNumber: '0900000000',
    status: 'ACTIVE',
    fullName: 'Safe User',
    address: 'Shelf Street',
    lastLoginAt: null,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-18T00:00:00.000Z'),
    roles: ['ADMIN', 'MEMBER'],
  });
  expect(result.data[0]).not.toHaveProperty('relatedSummary');
  expect(JSON.stringify(result.data[0])).not.toContain('forbidden-');
});

test('listManagedUsers uses only approved search fields and stable ordering', async () => {
  const capture = useRecordset([]);

  await userRepository.listManagedUsers({
    page: 2,
    limit: 20,
    status: 'ACTIVE',
    role: 'MEMBER',
    search: 'safe',
  });

  expect(capture.inputs).toMatchObject({
    Offset: 20,
    Limit: 20,
    Status: 'ACTIVE',
    Role: 'MEMBER',
    Search: '%safe%',
  });
  expect(capture.query).toContain('LOWER(u.Email) LIKE LOWER(@Search)');
  expect(capture.query).toContain('LOWER(up.FullName) LIKE LOWER(@Search)');
  expect(capture.query).toContain('CONVERT(NVARCHAR(20), u.UserId) LIKE @Search');
  expect(capture.query).not.toContain('LOWER(u.Username) LIKE LOWER(@Search)');
  expect(capture.query).not.toContain('u.Phone LIKE @Search');
  expect(capture.query).not.toContain('LOWER(up.Address) LIKE LOWER(@Search)');
  expect(capture.query).not.toContain('LOWER(roleList.Roles) LIKE LOWER(@Search)');
  expect(capture.query).toContain('ORDER BY CreatedAt DESC, UserId DESC');
});
```

- [ ] **Step 4: Write failing frontend query and field-name tests**

Replace the Task 2 utility import in `frontend/test/userManagementApi.test.js`, then append the tests:

```js
import { buildManagedUserListParams } from '../src/utils/userManagementQuery.js';

test('FE11 list params omit UI sentinels and empty search', () => {
  assert.deepEqual(
    buildManagedUserListParams({
      page: 1,
      limit: 20,
      role: 'ALL',
      status: 'ALL',
      search: '   ',
    }),
    { page: 1, limit: 20 },
  );

  assert.deepEqual(
    buildManagedUserListParams({
      page: 2,
      limit: 50,
      role: 'member',
      status: 'active',
      search: '  Alice  ',
    }),
    { page: 2, limit: 50, role: 'MEMBER', status: 'ACTIVE', search: 'Alice' },
  );
});

test('FE11 Admin UI reads phoneNumber instead of response phone', async () => {
  const source = await readFile(new URL('../src/page/UserManagement.jsx', import.meta.url), 'utf8');

  assert.match(source, /phone:\s*user\?\.phoneNumber\s*\|\|\s*''/);
  assert.match(source, /user\.phoneNumber\s*\|\|\s*'-'/);
  assert.match(source, /selectedUser\.phoneNumber\s*\|\|\s*'-'/);
  assert.doesNotMatch(source, /user\?\.phone\s*\|\|/);
});
```

- [ ] **Step 5: Run the list RED tests**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js
node --test --test-name-pattern="FE11" frontend/test/userManagementApi.test.js
```

Expected: backend failures show missing list validators, silent service clamping, broad search, and `phone`; frontend fails because the query helper and `phoneNumber` reads do not exist.

- [ ] **Step 6: Implement list validators and route wiring**

Update `backend/src/validators/userManagementValidators.js`. Express 5 exposes `req.query` through a getter that reparses the URL, so store express-validator's sanitized result on a dedicated request property:

```js
const { body, matchedData, param, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

const LIST_STATUSES = ['ACTIVE', 'INACTIVE', 'LOCKED'];
const LIST_ROLES = ['MEMBER', 'LIBRARIAN', 'ADMIN'];

function uppercaseTrimmed(value) {
  return String(value).trim().toUpperCase();
}

function assignValidatedListQuery(req, res, next) {
  req.validatedListQuery = matchedData(req, { locations: ['query'] });
  return next();
}

const listUsersValidators = [
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
  query('status')
    .optional()
    .customSanitizer(uppercaseTrimmed)
    .isIn(LIST_STATUSES)
    .withMessage('Status must be ACTIVE, INACTIVE, or LOCKED.'),
  query('role')
    .optional()
    .customSanitizer(uppercaseTrimmed)
    .isIn(LIST_ROLES)
    .withMessage('Role must be MEMBER, LIBRARIAN, or ADMIN.'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search must be between 1 and 200 characters.'),
  handleValidationErrors,
  assignValidatedListQuery,
];
```

Export `listUsersValidators`. Wire it after Admin authorization:

```js
const {
  listUsersValidators,
  resendSetupValidators,
  assignRoleValidators,
  revokeRoleValidators,
} = require('../validators/userManagementValidators');

router.get('/', ...requireAdmin, listUsersValidators, controller.listUsers);
```

Update the controller boundary:

```js
const result = await userManagementService.listUsers(req.validatedListQuery || req.query);
```

- [ ] **Step 7: Implement canonical service list parsing**

Add near the top of `backend/src/services/userManagementService.js`:

```js
const USER_LIST_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'LOCKED']);
const USER_LIST_ROLES = new Set(['MEMBER', 'LIBRARIAN', 'ADMIN']);

function parseListInteger(value, { defaultValue, min, max, code, message }) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) {
    throw errors.badRequest(code, message);
  }
  return parsed;
}

function normalizeListEnum(value, allowed, code, message) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim().toUpperCase();
  if (!allowed.has(normalized)) {
    throw errors.badRequest(code, message);
  }
  return normalized;
}

function normalizeListSearch(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  if (normalized.length < 1 || normalized.length > 200) {
    throw errors.badRequest(
      'INVALID_USER_SEARCH',
      'Search must be between 1 and 200 characters.'
    );
  }
  return normalized;
}
```

Replace `listUsers` with:

```js
async function listUsers(query = {}) {
  // @spec FR-FE11-001, AC-FE11-001
  return userRepository.listManagedUsers({
    page: parseListInteger(query.page, {
      defaultValue: 1,
      min: 1,
      code: 'INVALID_PAGE',
      message: 'Page must be a positive integer.',
    }),
    limit: parseListInteger(query.limit, {
      defaultValue: 20,
      min: 1,
      max: 100,
      code: 'INVALID_LIMIT',
      message: 'Limit must be an integer between 1 and 100.',
    }),
    status: normalizeListEnum(
      query.status,
      USER_LIST_STATUSES,
      'INVALID_USER_STATUS',
      'Status must be ACTIVE, INACTIVE, or LOCKED.'
    ),
    role: normalizeListEnum(
      query.role,
      USER_LIST_ROLES,
      'INVALID_USER_ROLE',
      'Role must be MEMBER, LIBRARIAN, or ADMIN.'
    ),
    search: normalizeListSearch(query.search),
  });
}
```

- [ ] **Step 8: Implement the repository allowlist and approved search**

Replace the managed-role and managed-user mapping in `backend/src/repositories/userRepository.js`:

```js
function mapManagedRoles(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((role) => role.trim().toUpperCase())
    .filter(Boolean)
    .sort();
}

function mapManagedUser(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.UserId,
    username: row.Username,
    email: row.Email,
    phoneNumber: row.Phone,
    status: row.Status,
    fullName: row.FullName,
    address: row.Address,
    lastLoginAt: row.LastLoginAt,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    roles: mapManagedRoles(row.Roles),
  };
}
```

Change the search parameter and predicate to:

```js
request.input('Search', sql.NVarChar(202), `%${search}%`);
where.push(`(
  LOWER(u.Email) LIKE LOWER(@Search)
  OR LOWER(up.FullName) LIKE LOWER(@Search)
  OR CONVERT(NVARCHAR(20), u.UserId) LIKE @Search
)`);
```

Keep the SQL pagination and exact stable order already present. Add above `listManagedUsers`:

```js
// @spec FR-FE11-001, BR-FE11-026
```

- [ ] **Step 9: Implement frontend query normalization and `phoneNumber` reads**

Create `frontend/src/utils/userManagementQuery.js`:

```js
export function buildManagedUserListParams({ page, limit, role, status, search } = {}) {
  const params = {};

  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;

  const normalizedRole = String(role || '').trim().toUpperCase();
  const normalizedStatus = String(status || '').trim().toUpperCase();
  const normalizedSearch = String(search || '').trim();

  if (normalizedRole && normalizedRole !== 'ALL') params.role = normalizedRole;
  if (normalizedStatus && normalizedStatus !== 'ALL') params.status = normalizedStatus;
  if (normalizedSearch) params.search = normalizedSearch;

  return params;
}
```

Import it in `frontend/src/api/userManagementApi.js` and change the list call:

```js
import { buildManagedUserListParams } from '../utils/userManagementQuery';

export async function fetchUsers(params = {}) {
  try {
    const response = await authorizedRequest({
      method: 'get',
      url: '/users',
      params: buildManagedUserListParams(params),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load users.'), { cause: error });
  }
}
```

Change only response reads in `UserManagement.jsx`:

```js
phone: user?.phoneNumber || '',
```

```jsx
<td>{user.phoneNumber || '-'}</td>
```

```jsx
{selectedUser.phoneNumber || '-'}
```

Keep `form.phone` and create/update request payload fields unchanged.

- [ ] **Step 10: Run list GREEN and regression checks**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js
node --test --test-name-pattern="FE11" frontend/test/userManagementApi.test.js
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Expected: focused backend/frontend tests pass; lint and production build pass; existing create/update payload tests remain unchanged.

- [ ] **Step 11: Mark FE11-U01/U02 complete and commit**

```powershell
git add -- backend/tests/userRepository.test.js backend/tests/userManagementRoutes.test.js backend/tests/userManagementService.test.js backend/src/validators/userManagementValidators.js backend/src/routes/userManagementRoutes.js backend/src/controllers/userManagementController.js backend/src/services/userManagementService.js backend/src/repositories/userRepository.js frontend/src/utils/userManagementQuery.js frontend/test/userManagementApi.test.js frontend/src/api/userManagementApi.js frontend/src/page/UserManagement.jsx .sdd/specs/feat-user-role-management/TASKS.md docs/superpowers/plans/2026-07-18-fe11-safe-user-list-detail.md
git commit -m "feat: enforce safe FE11 user list contract"
```

---

### Task 3: Implement The Safe Detail API And Aggregates

**Files:**
- Modify: `backend/tests/userManagementRoutes.test.js`
- Modify: `backend/tests/userManagementService.test.js`
- Modify: `backend/tests/userRepository.test.js`
- Modify: `backend/src/validators/userManagementValidators.js`
- Modify: `backend/src/routes/userManagementRoutes.js`
- Modify: `backend/src/services/userManagementService.js`
- Modify: `backend/src/repositories/userRepository.js`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`

**Interfaces:**
- Consumes: `mapManagedUser(row)` from Task 2 and existing `errors.notFound`.
- Produces: `getUserValidators` and `getManagedUserDetailById(userId) -> UserManagementView & { relatedSummary }`.

- [ ] **Step 1: Write failing detail route tests**

Add:

```js
test('GET /api/users/:userId passes a normalized positive ID', async () => {
  const detail = {
    userId: 7,
    email: 'detail@example.test',
    relatedSummary: {
      activeBorrowingCount: 1,
      unpaidFineTotal: 5000,
      openReservationCount: 2,
    },
  };
  const userManagementService = { getUser: jest.fn(async () => detail) };
  const app = makeApp({ userManagementService });

  const response = await request(app)
    .get('/api/users/7')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(200);
  expect(response.body).toEqual(detail);
  expect(userManagementService.getUser).toHaveBeenCalledWith(7);
});

test.each(['0', '-1', '1.5', 'not-a-user'])(
  'GET /api/users/%s rejects an invalid user ID',
  async (userId) => {
    const userManagementService = { getUser: jest.fn() };
    const app = makeApp({ userManagementService });

    const response = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(userManagementService.getUser).not.toHaveBeenCalled();
  }
);
```

- [ ] **Step 2: Write failing service detail tests**

```js
test('getUser returns the dedicated detail projection', async () => {
  const detail = {
    userId: 7,
    phoneNumber: '0900000000',
    roles: ['MEMBER'],
    relatedSummary: {
      activeBorrowingCount: 1,
      unpaidFineTotal: 5000,
      openReservationCount: 2,
    },
  };
  const { service, userRepository } = makeReadHarness({
    getManagedUserDetailById: jest.fn(async () => detail),
  });

  await expect(service.getUser(7)).resolves.toEqual(detail);
  expect(userRepository.getManagedUserDetailById).toHaveBeenCalledWith(7);
  expect(userRepository.getManagedUserById).not.toHaveBeenCalled();
});

test('getUser returns 404 USER_NOT_FOUND for a missing valid ID', async () => {
  const { service } = makeReadHarness({
    getManagedUserDetailById: jest.fn(async () => null),
  });

  await expect(service.getUser(404)).rejects.toMatchObject({
    statusCode: 404,
    code: 'USER_NOT_FOUND',
    message: 'User was not found.',
  });
});

test.each([0, -1, 1.5, 'not-a-user'])(
  'getUser rejects invalid direct ID %p before repository access',
  async (userId) => {
    const { service, userRepository } = makeReadHarness({
      getManagedUserDetailById: jest.fn(),
    });

    await expect(service.getUser(userId)).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_USER_ID',
    });
    expect(userRepository.getManagedUserDetailById).not.toHaveBeenCalled();
  }
);
```

- [ ] **Step 3: Write failing repository detail tests**

Append to `backend/tests/userRepository.test.js`:

```js
test('getManagedUserDetailById returns exactly three numeric summaries', async () => {
  const capture = useRecordset([{
    UserId: 7,
    Username: 'detail.user',
    Email: 'detail@example.test',
    Phone: '0900000000',
    Status: 'ACTIVE',
    FullName: 'Detail User',
    Address: 'Detail Street',
    LastLoginAt: null,
    CreatedAt: new Date('2026-07-01T00:00:00.000Z'),
    UpdatedAt: new Date('2026-07-18T00:00:00.000Z'),
    Roles: 'MEMBER',
    ActiveBorrowingCount: 2,
    UnpaidFineTotal: '15000.00',
    OpenReservationCount: 3,
    PasswordHash: 'forbidden-hash',
  }]);

  const result = await userRepository.getManagedUserDetailById(7);

  expect(capture.inputs.UserId).toBe(7);
  expect(result.relatedSummary).toEqual({
    activeBorrowingCount: 2,
    unpaidFineTotal: 15000,
    openReservationCount: 3,
  });
  expect(Object.keys(result.relatedSummary).sort()).toEqual(
    ['activeBorrowingCount', 'openReservationCount', 'unpaidFineTotal'].sort()
  );
  expect(result).not.toHaveProperty('passwordHash');
  expect(capture.query).toContain("bd.Status = 'BORROWED'");
  expect(capture.query).not.toContain("bd.Status = 'OVERDUE'");
  expect(capture.query).toContain("f.Status = 'UNPAID'");
  expect(capture.query).toContain('f.Amount - f.PaidAmount');
  expect(capture.query).toContain("r.Status IN ('ACTIVE', 'NOTIFIED')");
});

test('getManagedUserDetailById maps missing aggregates to zero and missing users to null', async () => {
  useRecordset([{
    UserId: 8,
    Username: 'zero.user',
    Email: 'zero@example.test',
    Phone: null,
    Status: 'INACTIVE',
    FullName: 'Zero User',
    Address: null,
    LastLoginAt: null,
    CreatedAt: new Date('2026-07-01T00:00:00.000Z'),
    UpdatedAt: null,
    Roles: 'MEMBER',
    ActiveBorrowingCount: null,
    UnpaidFineTotal: null,
    OpenReservationCount: null,
  }]);

  await expect(userRepository.getManagedUserDetailById(8)).resolves.toMatchObject({
    relatedSummary: {
      activeBorrowingCount: 0,
      unpaidFineTotal: 0,
      openReservationCount: 0,
    },
  });

  useRecordset([]);
  await expect(userRepository.getManagedUserDetailById(999)).resolves.toBeNull();
});
```

- [ ] **Step 4: Run the detail RED tests**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js
```

Expected: failures show the missing detail validator/repository method, string route ID, base readback use, missing aggregates, and current `400` missing-user behavior.

- [ ] **Step 5: Implement detail ID validation and route wiring**

Reuse `positiveIdParam` and add:

```js
const getUserValidators = [
  positiveIdParam('userId', 'User ID'),
  handleValidationErrors,
];
```

Export it and wire:

```js
const {
  listUsersValidators,
  getUserValidators,
  resendSetupValidators,
  assignRoleValidators,
  revokeRoleValidators,
} = require('../validators/userManagementValidators');

router.get('/:userId', ...requireAdmin, getUserValidators, controller.getUser);
```

- [ ] **Step 6: Implement the dedicated detail mapper and query**

Add to `backend/src/repositories/userRepository.js`:

```js
function mapManagedUserDetail(row) {
  const user = mapManagedUser(row);
  if (!user) {
    return null;
  }

  return {
    ...user,
    relatedSummary: {
      activeBorrowingCount: Number(row.ActiveBorrowingCount || 0),
      unpaidFineTotal: Number(row.UnpaidFineTotal || 0),
      openReservationCount: Number(row.OpenReservationCount || 0),
    },
  };
}

// @spec FR-FE11-002, BR-FE11-026
async function getManagedUserDetailById(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT
        u.UserId,
        u.Username,
        u.Email,
        u.Phone,
        u.Status,
        u.LastLoginAt,
        u.CreatedAt,
        u.UpdatedAt,
        up.FullName,
        up.Address,
        roleList.Roles,
        COALESCE((
          SELECT COUNT(*)
          FROM BorrowRequests br
          INNER JOIN BorrowDetails bd ON bd.RequestId = br.RequestId
          WHERE br.UserId = u.UserId
            AND bd.Status = 'BORROWED'
        ), 0) AS ActiveBorrowingCount,
        COALESCE((
          SELECT SUM(f.Amount - f.PaidAmount)
          FROM Fines f
          WHERE f.UserId = u.UserId
            AND f.Status = 'UNPAID'
        ), 0) AS UnpaidFineTotal,
        COALESCE((
          SELECT COUNT(*)
          FROM Reservations r
          WHERE r.UserId = u.UserId
            AND r.Status IN ('ACTIVE', 'NOTIFIED')
        ), 0) AS OpenReservationCount
      FROM Users u
      LEFT JOIN UserProfiles up ON up.UserId = u.UserId
      OUTER APPLY (
        SELECT STUFF((
          SELECT ',' + r.RoleName
          FROM UserRoles ur
          INNER JOIN Roles r ON r.RoleId = ur.RoleId
          WHERE ur.UserId = u.UserId
          ORDER BY r.RoleName
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS Roles
      ) roleList
      WHERE u.UserId = @UserId
    `);

  return mapManagedUserDetail(result.recordset[0]);
}
```

Export `getManagedUserDetailById`. Do not change `getManagedUserById`; mutation readbacks must stay summary-free.

- [ ] **Step 7: Implement service detail validation and 404 mapping**

Replace only `getUser`:

```js
async function getUser(userId) {
  // @spec FR-FE11-002, FR-FE11-016
  const parsedUserId = parsePositiveId(
    userId,
    'INVALID_USER_ID',
    'User id is invalid.'
  );
  const user = await userRepository.getManagedUserDetailById(parsedUserId);

  if (!user) {
    throw errors.notFound('USER_NOT_FOUND', 'User was not found.');
  }

  return user;
}
```

Do not change the shared `getExistingUser` helper, because update/deactivation not-found behavior is outside this slice.

- [ ] **Step 8: Run detail GREEN and affected regression tests**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js tests/userRoleRepository.test.js
```

Expected: all focused tests pass; transactional role mutation still reads back the summary-free `getManagedUserById` shape.

- [ ] **Step 9: Mark FE11-U03/U04 complete and commit**

```powershell
git add -- backend/tests/userManagementRoutes.test.js backend/tests/userManagementService.test.js backend/tests/userRepository.test.js backend/src/validators/userManagementValidators.js backend/src/routes/userManagementRoutes.js backend/src/services/userManagementService.js backend/src/repositories/userRepository.js .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "feat: add safe FE11 user detail summaries"
```

---

### Task 4: Fetch And Render Real User Detail In The Admin UI

**Files:**
- Create: `frontend/test/userManagementFrontend.test.js`
- Modify: `frontend/test/userManagementApi.test.js`
- Modify: `frontend/src/utils/userManagementQuery.js`
- Modify: `frontend/src/api/userManagementApi.js`
- Modify: `frontend/src/page/UserManagement.jsx`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`

**Interfaces:**
- Consumes: backend `GET /api/users/{userId}` detail contract from Task 3.
- Produces: `fetchManagedUser(userId)`, `isManagedUserNotFound(error)`, and detail-drawer rendering from the fetched DTO.

- [ ] **Step 1: Write failing API, error-classification, and component contract tests**

Extend `frontend/test/userManagementApi.test.js`:

```js
import {
  buildManagedUserListParams,
  isManagedUserNotFound,
} from '../src/utils/userManagementQuery.js';

test('FE11 detail 404 classifier reads the wrapped Axios cause safely', () => {
  assert.equal(
    isManagedUserNotFound({ cause: { response: { status: 404 } } }),
    true,
  );
  assert.equal(
    isManagedUserNotFound({
      cause: { response: { status: 400, data: { error: { code: 'USER_NOT_FOUND' } } } },
    }),
    true,
  );
  assert.equal(isManagedUserNotFound(new Error('network failed')), false);
});

test('FE11 detail request uses the authorized request flow', async () => {
  const source = await readFile(apiPath, 'utf8');

  assert.match(
    source,
    /export async function fetchManagedUser\(userId\)[\s\S]*?authorizedRequest\(\{[\s\S]*?url: `\/users\/\$\{userId\}`/,
  );
});
```

Create `frontend/test/userManagementFrontend.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../src/page/UserManagement.jsx', import.meta.url);

test('FE11 row selection fetches detail before opening the drawer', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /async function openUserDetail\(userId\)/);
  assert.match(source, /const detail = await fetchManagedUser\(userId\)/);
  assert.match(source, /setSelectedUser\(detail\)/);
  assert.match(source, /onClick=\{\(\) => openUserDetail\(user\.userId\)\}/);
  assert.doesNotMatch(source, /onClick=\{\(\) => setSelectedUser\(user\)\}/);
});

test('FE11 drawer renders all approved related summaries', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /selectedUser\.relatedSummary\?\.activeBorrowingCount/);
  assert.match(source, /selectedUser\.relatedSummary\?\.unpaidFineTotal/);
  assert.match(source, /selectedUser\.relatedSummary\?\.openReservationCount/);
  assert.match(source, /isManagedUserNotFound\(error\)[\s\S]*?await loadUsers\(pagination\.page\)/);
});
```

- [ ] **Step 2: Run frontend RED**

```powershell
node --test --test-name-pattern="FE11" frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js
```

Expected: failures show the missing detail API, 404 helper, row-selection loader, and summary rendering.

- [ ] **Step 3: Implement the detail API and safe 404 classifier**

Append to `frontend/src/utils/userManagementQuery.js`:

```js
export function isManagedUserNotFound(error) {
  const response = error?.cause?.response;
  return response?.status === 404 || response?.data?.error?.code === 'USER_NOT_FOUND';
}
```

Add to `frontend/src/api/userManagementApi.js`:

```js
export async function fetchManagedUser(userId) {
  try {
    const response = await authorizedRequest({
      method: 'get',
      url: `/users/${userId}`,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load user details.'), { cause: error });
  }
}
```

- [ ] **Step 4: Implement detail loading and stale-row recovery**

Add `fetchManagedUser` to the existing API import and import the classifier:

```js
import {
  createManagedUser,
  deactivateManagedUser,
  assignManagedUserRole,
  ensureManagedUserAccess,
  fetchAuditLogs,
  fetchManagedUser,
  fetchRoles,
  fetchUsers,
  revokeManagedUserRole,
  updateManagedUser,
} from '../api/userManagementApi';
import { isManagedUserNotFound } from '../utils/userManagementQuery';
```

Add inside `UserManagement`:

```js
async function openUserDetail(userId) {
  setSelectedUser(null);

  try {
    const detail = await fetchManagedUser(userId);
    setSelectedUser(detail);
  } catch (error) {
    setToast({ type: 'error', message: error.message });

    if (isManagedUserNotFound(error)) {
      await loadUsers(pagination.page);
    }
  }
}
```

Replace the row click with:

```jsx
<tr key={user.userId} onClick={() => openUserDetail(user.userId)}>
```

The existing row-action wrapper continues to stop propagation, so edit/role/deactivate actions do not trigger detail loading.

- [ ] **Step 5: Render the three summary cards**

Insert after `.um-detail-list` and before drawer actions:

```jsx
<div className="um-related-summary">
  <div>
    <BookCopy size={17} />
    <span>Active borrowings</span>
    <strong>{selectedUser.relatedSummary?.activeBorrowingCount ?? 0}</strong>
  </div>
  <div>
    <Banknote size={17} />
    <span>Unpaid fines</span>
    <strong>{formatCurrency(selectedUser.relatedSummary?.unpaidFineTotal ?? 0)}</strong>
  </div>
  <div>
    <ClipboardList size={17} />
    <span>Open reservations</span>
    <strong>{selectedUser.relatedSummary?.openReservationCount ?? 0}</strong>
  </div>
</div>
```

Add to the component's existing style block:

```css
.um-related-summary { display: grid; gap: 8px; margin: 0 0 24px; }
.um-related-summary > div { display: grid; grid-template-columns: 20px 1fr auto; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc; color: #475569; }
.um-related-summary strong { color: #0f172a; }
```

- [ ] **Step 6: Run frontend GREEN, lint, and build**

```powershell
node --test --test-name-pattern="FE11" frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Expected: all frontend tests pass; lint and production build pass; no new dependency is added.

- [ ] **Step 7: Mark FE11-U05 complete and commit**

```powershell
git add -- frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js frontend/src/utils/userManagementQuery.js frontend/src/api/userManagementApi.js frontend/src/page/UserManagement.jsx .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "feat: load FE11 user detail in Admin UI"
```

---

### Task 5: Validate, Reconcile Debt, And Record Evidence

**Files:**
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `TECH_DEBT.md`
- Create: `.sdd/reviews/fe11-safe-user-list-detail-validation-2026-07-18.md`

**Interfaces:**
- Consumes: completed FE11-U01..U05 implementation and test evidence.
- Produces: FE11-U06 validation record, narrowed `TD-014`/`TD-015`, and reviewer-ready B1-B7 handoff without a whole-feature completion claim.

- [ ] **Step 1: Run focused and full automated checks**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRepository.test.js tests/userRoleRepository.test.js
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```

Expected: all focused/full suites pass, existing coverage thresholds pass, frontend lint/build pass, and traceability remains PASS while FE11 stays whole-feature `DEFERRED`.

- [ ] **Step 2: Run security and diff-hygiene checks**

```powershell
rg -n "passwordHash|tokenHash|refreshToken|sessionId|setupLink|resetLink|providerPayload|auditSecret" backend/src/repositories/userRepository.js backend/src/services/userManagementService.js backend/tests/userRepository.test.js frontend/src/api/userManagementApi.js frontend/src/page/UserManagement.jsx frontend/test
git diff --check
git status --short
```

Expected: sensitive-name matches occur only in explicit forbidden-field tests or pre-existing unrelated account-setup code; no response mapper returns them. Diff check is clean. Status still shows any user's pre-existing unrelated files, which remain unstaged.

- [ ] **Step 3: Reconcile FE11 documentation and technical debt**

Mark `FE11-U06` complete only after every available command passes. Update the PLAN top status to state that account setup, transactional role management, and safe list/detail slices are complete while remaining FE11 work is deferred.

Update TEST_PLAN Current Evidence with:

```markdown
- `backend/tests/userRepository.test.js` for safe list/detail DTO, approved search SQL, aggregate predicates, zero defaults, and hostile-column exclusion.
- `backend/tests/userManagementService.test.js` for strict list normalization and detail `404 USER_NOT_FOUND`.
- `backend/tests/userManagementRoutes.test.js` for Admin-first list/detail validation.
- `frontend/test/userManagementApi.test.js` and `frontend/test/userManagementFrontend.test.js` for query omission, `phoneNumber`, detail loading, summaries, and stale-row recovery.
- Approved design: `docs/superpowers/specs/2026-07-18-fe11-safe-user-list-detail-design.md`.
- Approved implementation plan: `docs/superpowers/plans/2026-07-18-fe11-safe-user-list-detail.md`.
```

Update `TECH_DEBT.md` as follows:

- Keep `TD-012` OPEN and explicitly note that this slice adds no fake librarian fields or schema migration.
- Narrow `TD-014` to remaining update/deactivation and other non-detail not-found/acting-admin semantics; record detail `404 USER_NOT_FOUND` as resolved evidence.
- Narrow `TD-015` to remaining update/deactivation/audit service coverage; record list/detail service tests as completed evidence.
- Leave `TD-016` and `TD-017` unchanged.

Add a changelog entry describing strict list validation, safe DTO, `phoneNumber`, approved search fields, detail aggregates, frontend detail consumption, automated evidence, and residual SQL Server environment evidence.

- [ ] **Step 4: Write the B1-B7 validation record**

Create `.sdd/reviews/fe11-safe-user-list-detail-validation-2026-07-18.md` with exactly these sections:

```markdown
# FE11 Safe User List And Detail Validation

Date: 2026-07-18
Scope: FE11-U01..U06 only

## L1 Automated Evidence
## L2 Spec Compliance
## L3 Constitution And Safety
## L4 Acceptance And Residual Risks
## Files Changed
## Remaining FE11 Work
## Human Review Gate
```

Record exact command results and test counts from Steps 1-2. State explicitly that repository tests verify emitted parameterized SQL and mapping, while a real SQL Server aggregate read remains an environment-dependent residual check if no disposable instance is available. Do not claim whole-feature FE11 completion.

- [ ] **Step 5: Commit validation evidence**

```powershell
git add -- .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md .sdd/reviews/fe11-safe-user-list-detail-validation-2026-07-18.md
git commit -m "docs: record FE11 safe user read validation"
```

## Final Review Checklist

- [ ] Implementation started from current `origin/main` plus only the approved design/plan commits.
- [ ] Every production behavior change was preceded by a focused failing test.
- [ ] Authentication and Admin authorization run before list/detail validation.
- [ ] Invalid supplied pagination/filter/search/ID values are rejected rather than clamped.
- [ ] Search uses only email, full name, and user ID; ordering is stable.
- [ ] Base managed-user responses use only the explicit allowlist and `phoneNumber`.
- [ ] Roles are deterministic uppercase strings.
- [ ] List items and mutation readbacks contain no `relatedSummary`.
- [ ] Detail contains exactly the three approved numeric summaries with zero defaults.
- [ ] Active borrowing counts persisted `BORROWED`; open reservations count `ACTIVE`/`NOTIFIED`; unpaid total uses `UNPAID` outstanding balance.
- [ ] Missing detail returns `404 USER_NOT_FOUND`; invalid ID returns `400 VALIDATION_ERROR`.
- [ ] The Admin UI fetches detail, renders summaries, and reloads stale list data after detail 404.
- [ ] No credential, token, session, link, provider, or secret audit field appears in a response.
- [ ] No database migration or fake librarian-field placeholder was introduced.
- [ ] Focused/full backend and frontend tests, coverage, lint, build, traceability, security scan, and diff checks pass.
- [ ] `TD-014/015` are narrowed without hiding remaining FE11 gaps; `TD-012` stays open.
- [ ] No unrelated user files are staged or committed.
