# FE11 Admin Navigation And Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close `TD-023` by exposing the approved eight-item Admin Console navigation and a read-only, Admin-only FE11 permission matrix composed in the frontend with independent FE12 role counts.

**Architecture:** FE11 owns a deterministic Phase 1 permission policy in a backend policy module and exposes fresh allowlisted DTOs through `GET /api/admin/permissions`. The React Admin Console consumes that API without a hardcoded matrix, derives module coverage from `allowedRoles`, and joins role counts from the existing FE12 `/api/reports/users` response by `roleName`; FE11 and FE12 loading/error state remain independent.

**Tech Stack:** Node.js, Express.js, Jest, Supertest, React 19, Vite, Node test runner, Bootstrap-compatible existing Admin Console CSS, OpenAPI 3.0 YAML.

## Global Constraints

- Decision mode is Hybrid SDD + ADD at Standard depth: authorization/API/policy/ownership/failure isolation are Core; presentation is Shell.
- Implement only `TD-023`, `FR-FE11-030`, `FR-FE11-032`, `AC-FE11-016`, and `AC-FE11-017`.
- The Admin Console sidebar contains exactly `home`, `dashboard`, `library`, `circulation`, `requests`, `users`, `permissions`, and `audit`, in that order.
- `membership`, Confirm Payment, and Confirm Borrow are not Admin Console sidebar entries; FE04 routes, APIs, components, and product behavior remain untouched.
- Add only Admin-only `GET /api/admin/permissions`; authentication and Admin authorization execute before the controller.
- The response top-level keys are exactly `roles` and `permissions`; role and permission object keys match the approved design exactly.
- The backend is the only product-code owner of the 15-row Phase 1 permission matrix.
- FE12 `GET /api/reports/users` remains the only owner of global `usersByRole` counts; do not add `/api/admin/user-summary` or derive counts from paginated users.
- FE11 matrix and FE12 count requests load, fail, retry, and preserve their last successful values independently.
- Do not add permission editing, role hierarchy, role CRUD, database schema changes, dependencies, FE12 production changes, FE04 production changes, or `TD-025` behavior.
- Keep `.sdd/specs/feat-user-role-management/TASKS.md` at whole-feature `Implementation State: DEFERRED` throughout this bounded slice.
- Add `@spec FR-FE11-032` traceability to the backend service/route boundary and preserve existing `FR-FE11-030` frontend traceability expectations.
- Generated product/test/docs changes remain uncommitted until H2 human review. H3 remains mandatory after PR checks and before merge.

---

## File Map

### Create

- `backend/src/policies/adminPermissionPolicy.js` - immutable canonical role and permission definitions; no service, repository, or transport behavior.
- `backend/tests/adminPermissionService.test.js` - exact DTO, ordering, allowlist, uniqueness, and fresh-object tests.
- `backend/tests/adminPermissionRoutes.test.js` - authentication, Admin-first authorization, controller delegation, and exact response tests.
- `frontend/src/utils/adminPermissions.js` - pure role-summary, module-coverage, and matrix-cell derivation helpers; contains no permission definitions.
- `frontend/test/adminPermissions.test.js` - executable tests for numeric zero defaults and `allowedRoles` derivation.
- `.sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md` - L1-L4 H2/B7 evidence record.

### Modify

- `.sdd/specs/feat-user-role-management/PLAN.md` - activate and later close the bounded navigation/permissions slice.
- `.sdd/specs/feat-user-role-management/TASKS.md` - add `FE11-PERM01..FE11-PERM06` while retaining whole-feature `DEFERRED`.
- `.sdd/specs/feat-user-role-management/TEST_PLAN.md` - add focused targets and observed evidence.
- `.sdd/specs/feat-user-role-management/CHANGELOG.md` - record approval, H2 readiness, and later B7 integration without overstating whole FE11.
- `TECH_DEBT.md` - move `TD-023` from `OPEN` to `IN PROGRESS`, then to Resolved only after merge and post-merge CI.
- `backend/src/services/adminService.js` - clone the immutable policy into fresh response DTOs.
- `backend/src/controllers/adminController.js` - add the read-only permissions handler.
- `backend/src/routes/adminRoutes.js` - register the Admin-first route.
- `frontend/src/api/adminApi.js` - add `adminApi.permissions()`.
- `frontend/src/page/UserManagement.jsx` - exact sidebar, Permissions state/load/retry/rendering, dynamic coverage, and independent FE11/FE12 status.
- `frontend/test/adminApi.test.js` - lock the canonical adapter path.
- `frontend/test/userManagementFrontend.test.js` - lock exact navigation, API loading, no matrix fallback, dynamic derivation, and failure isolation.
- `frontend/test/appShellFrontend.test.js` - replace the stale Membership sidebar expectation with the approved Permissions expectation.
- `docs/api/api-contract.md` - document the exact endpoint and response.
- `backend/src/docs/openapi.yaml` - add strict schemas and endpoint documentation.

## Locked Interfaces

```js
// backend/src/services/adminService.js
function getPermissions(): {
  roles: Array<{ roleName: 'ADMIN' | 'LIBRARIAN' | 'MEMBER', label: string }>,
  permissions: Array<{
    permissionKey: string,
    label: string,
    moduleKey: string,
    moduleLabel: string,
    allowedRoles: Array<'ADMIN' | 'LIBRARIAN' | 'MEMBER'>,
  }>,
}
```

```js
// frontend/src/utils/adminPermissions.js
buildPermissionRoleSummary(roles, usersByRole): Array<{ roleName, label, count }>
buildPermissionModuleCoverage(roles, permissions): Array<{ moduleKey, moduleLabel, counts }>
roleAllowsPermission(permission, roleName): boolean
```

```js
// frontend/src/api/adminApi.js
adminApi.permissions(): Promise<{ roles, permissions }>
```

## Plan-Level Exact Choices

- `moduleKey` values are locked in this plan as `USER_ROLE`, `LIBRARY`, `BORROW_RETURN`, `FINE`, and `REPORTS`; `moduleLabel` values remain the approved human-readable labels.
- Module coverage order is the first appearance order of the canonical permission list: User & Role, Library, Borrow/Return, Fine, Reports.
- The endpoint consumes no body/query values. No new validation/error branch is added for unused GET input; the controller always calls `getPermissions()` with no arguments.
- The Permissions role cards are non-interactive `<article>` elements. Manage Roles remains available only from the existing All Users action flow.
- Existing FE04 Membership code remains in `UserManagement.jsx` even though it is no longer reachable from the Admin Console sidebar; removal/refactoring is outside TD-023.

---

### Task 1: Activate The Approved TD-023 Slice In Governance

**Files:**
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `TECH_DEBT.md`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-07-19-fe11-admin-navigation-permissions-design.md` and this reviewed implementation plan.
- Produces: active task IDs `FE11-PERM01..FE11-PERM06`, explicit file ownership, and `TD-023: IN PROGRESS` before product implementation.

- [ ] **Step 1: Create the isolated execution worktree**

Use the `using-git-worktrees` skill before execution. Base the feature branch on `docs/fe11-admin-permissions-contract` so the approved design and committed plan are included:

```powershell
git worktree add .worktrees/fe11-admin-navigation-permissions -b feat/fe11-admin-navigation-permissions docs/fe11-admin-permissions-contract
```

Expected: a clean worktree on `feat/fe11-admin-navigation-permissions` containing design commit `dbd59f1` and the plan commit created from this document.

- [ ] **Step 2: Verify dependencies and scope before editing**

```powershell
git fetch origin main
git merge-base --is-ancestor 411fa25 origin/main
git merge-base --is-ancestor c286cd9 origin/main
git status --short --branch
rg -n "TD-023|TD-025|Implementation State: DEFERRED|FE11-ENV01" TECH_DEBT.md .sdd/specs/feat-user-role-management
```

Expected: both ancestry commands exit `0`; `TD-023` and `TD-025` are `OPEN`; whole FE11 is `DEFERRED`; the new execution worktree is clean.

- [ ] **Step 3: Add the bounded slice to FE11 PLAN and TASKS**

Append this exact PLAN section after Fast-Track Batch 1:

```markdown
## 14. Admin Navigation And Permissions Slice

Integration State: IN PROGRESS

### In Scope

- Align the Admin Console sidebar to the approved eight entries.
- Add Admin-only `GET /api/admin/permissions` with the canonical 15-row Phase 1 policy.
- Compose FE11 permission data with independent FE12 `usersByRole` counts in the frontend.
- Derive module coverage and matrix cells from `allowedRoles`; keep the view read-only.

### Out Of Scope

- Permission editing, role hierarchy/CRUD, schema changes, FE04 removal, FE12 production changes, and TD-025.

### Validation Gate

- Backend policy/service/route tests prove exact DTOs, fresh objects, and Admin-first authorization.
- Frontend tests prove exact sidebar order, canonical API usage, no hardcoded matrix fallback, FE12 counts, derived coverage, and isolated retries/errors.
- Full tests, coverage, lint, build, browser E2E, OpenAPI parse, health import, traceability, diff hygiene, scope scan, and secret scan pass.
- H2 precedes commit/push; H3 precedes merge; TD-023 closes only after post-merge main CI and closeout evidence.
```

Insert this exact TASKS group before `## Deferred FE11 Work`:

```markdown
## Admin Navigation And Permissions Tasks

- [ ] **FE11-PERM01 - Activate the approved TD-023 contract.**
  - Maps to: TD-023; FR-FE11-030/032; AC-FE11-016/017.
  - DoD: PLAN/TASKS/TEST_PLAN/CHANGELOG and debt state name the bounded scope; whole FE11 remains deferred.

- [ ] **FE11-PERM02 - Add the canonical permission policy and fresh service DTO.**
  - Maps to: FR-FE11-032; BR-FE11-017; AC-FE11-017.
  - DoD: backend owns exactly 3 roles and 15 permissions; every call returns independent allowlisted objects with stable order.

- [ ] **FE11-PERM03 - Expose Admin-only GET /api/admin/permissions.**
  - Maps to: BR-FE11-001/011/012/017; FR-FE11-015/032; AC-FE11-017; NFR-FE11-SEC-001/002.
  - DoD: authentication and Admin authorization run before controller invocation; Admin receives exactly `{ roles, permissions }`.

- [ ] **FE11-PERM04 - Align Admin navigation and consume the permission API.**
  - Maps to: BR-FE11-016/017; FR-FE11-030/032; AC-FE11-016/017.
  - DoD: sidebar has exactly eight approved entries; Permissions is reachable; Membership remains untouched outside the sidebar; no frontend matrix constant remains.

- [ ] **FE11-PERM05 - Compose FE11 permissions with independent FE12 counts.**
  - Maps to: FR-FE11-032; AC-FE11-017; TD-026 ownership decision.
  - DoD: role cards use FE12 `usersByRole`; coverage/cells derive from FE11 `allowedRoles`; independent failures preserve last success and expose retry controls.

- [ ] **FE11-PERM06 - Pass H2/H3/B7 and close TD-023.**
  - Depends on: FE11-PERM01..FE11-PERM05.
  - DoD: L1-L4 evidence, human reviews, implementation PR merge, post-merge main CI, closeout PR, and final main CI are recorded; TD-023 is resolved while TD-025 and whole FE11 remain deferred.
```

- [ ] **Step 4: Mark debt and test strategy as active without claiming implementation**

Change only the `TD-023` status cell from `OPEN` to `IN PROGRESS` and update `Last Updated` to `2026-07-19`.

Add this TEST_PLAN section after Fast-Track Batch 1 current targets:

```markdown
## 3.2 TD-023 Current Targets

- Exact eight-entry Admin Console sidebar and reachable Permissions section.
- Admin-first `GET /api/admin/permissions` with exact role/permission DTO keys and 15 canonical rows.
- Fresh response objects, valid/deduplicated role arrays, and no repository/write dependency.
- FE12 `usersByRole` counts composed independently from FE11 matrix data.
- Derived module coverage/matrix cells, retryable isolated errors, and no hardcoded frontend matrix fallback.
```

Prepend this CHANGELOG entry:

```markdown
## 2026-07-19 - Admin Navigation And Permissions Slice Approved

- Approved Hybrid SDD + ADD Standard-depth design and implementation plan for `TD-023`.
- Locked the exact eight-entry Admin Console sidebar, Admin-only `GET /api/admin/permissions`, canonical 15-row FE11 policy, and independent FE12 role counts.
- Activated `FE11-PERM01..FE11-PERM06` and marked `TD-023` in progress without claiming product implementation.
- Preserved FE04 Membership, TD-025, and whole-feature `Implementation State: DEFERRED`.
```

- [ ] **Step 5: Verify the governance activation diff**

```powershell
rg -n "FE11-PERM01|FE11-PERM06|TD-023.*IN PROGRESS|Implementation State: DEFERRED|TD-025.*OPEN" .sdd/specs/feat-user-role-management TECH_DEBT.md
git diff --check
```

Expected: all six task IDs exist; `TD-023` is in progress; `TD-025` remains open; whole FE11 remains deferred; diff check passes.

Do not commit this generated governance diff before H2.

---

### Task 2: Add The Canonical Backend Policy And Fresh Service DTO

**Files:**
- Create: `backend/src/policies/adminPermissionPolicy.js`
- Create: `backend/tests/adminPermissionService.test.js`
- Modify: `backend/src/services/adminService.js`

**Interfaces:**
- Consumes: no database or repository; exact policy from the approved TD-023 design.
- Produces: immutable `adminPermissionPolicy` and `adminService.getPermissions()` returning fresh DTOs.

- [ ] **Step 1: Write the failing service contract tests**

Create `backend/tests/adminPermissionService.test.js`:

```js
jest.mock('../src/repositories/adminRepository', () => ({
  getResourceConfig: jest.fn(),
  getDashboard: jest.fn(),
  listBooks: jest.fn(),
  listResource: jest.fn(),
  createResource: jest.fn(),
  updateResource: jest.fn(),
  deactivateResource: jest.fn(),
  listBorrowings: jest.fn(),
  listRequests: jest.fn(),
}));
jest.mock('../src/repositories/auditLogRepository', () => ({
  listAuditLogs: jest.fn(),
}));

const adminRepository = require('../src/repositories/adminRepository');
const auditLogRepository = require('../src/repositories/auditLogRepository');
const adminService = require('../src/services/adminService');

const EXPECTED_PERMISSIONS = [
  { permissionKey: 'USER_VIEW', label: 'View users', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'USER_CREATE', label: 'Create accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'USER_UPDATE', label: 'Update accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'USER_DEACTIVATE', label: 'Deactivate accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'ROLE_MANAGE', label: 'Manage roles', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'AUDIT_VIEW', label: 'View audit logs', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'CATALOG_MANAGE', label: 'Manage library catalog', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'METADATA_MANAGE', label: 'Manage authors/publishers/categories', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN'] },
  { permissionKey: 'BORROW_APPROVE_REJECT', label: 'Approve/reject borrow requests', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'RETURN_RENEW_PROCESS', label: 'Process returns and renewals', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'FINE_CALCULATE_COLLECT', label: 'Calculate and collect fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'FINE_WAIVE_CANCEL', label: 'Waive or cancel fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN'] },
  { permissionKey: 'REPORT_VIEW', label: 'View reports', moduleKey: 'REPORTS', moduleLabel: 'Reports', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'BORROW_REQUEST_CREATE', label: 'Create borrow request', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
  { permissionKey: 'BORROW_HISTORY_VIEW_OWN', label: 'View own borrowing history', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
];

test('getPermissions returns the exact deterministic allowlisted contract', () => {
  const result = adminService.getPermissions();

  expect(Object.keys(result)).toEqual(['roles', 'permissions']);
  expect(result.roles).toEqual([
    { roleName: 'ADMIN', label: 'Admin' },
    { roleName: 'LIBRARIAN', label: 'Librarian' },
    { roleName: 'MEMBER', label: 'Member' },
  ]);
  expect(result.permissions).toEqual(EXPECTED_PERMISSIONS);

  for (const role of result.roles) {
    expect(Object.keys(role)).toEqual(['roleName', 'label']);
  }
  for (const permission of result.permissions) {
    expect(Object.keys(permission)).toEqual([
      'permissionKey',
      'label',
      'moduleKey',
      'moduleLabel',
      'allowedRoles',
    ]);
    expect(new Set(permission.allowedRoles).size).toBe(permission.allowedRoles.length);
    expect(permission.allowedRoles.every((roleName) => (
      ['ADMIN', 'LIBRARIAN', 'MEMBER'].includes(roleName)
    ))).toBe(true);
  }
  for (const repositoryMethod of Object.values(adminRepository)) {
    expect(repositoryMethod).not.toHaveBeenCalled();
  }
  expect(auditLogRepository.listAuditLogs).not.toHaveBeenCalled();
});

test('getPermissions returns fresh nested objects on every call', () => {
  const first = adminService.getPermissions();
  first.roles[0].label = 'Changed';
  first.permissions[0].label = 'Changed';
  first.permissions[0].allowedRoles.push('MEMBER');
  first.permissions.reverse();

  const second = adminService.getPermissions();
  expect(second.roles[0]).toEqual({ roleName: 'ADMIN', label: 'Admin' });
  expect(second.permissions[0]).toMatchObject({
    permissionKey: 'USER_VIEW',
    label: 'View users',
    allowedRoles: ['ADMIN'],
  });
  expect(second.permissions).toEqual(EXPECTED_PERMISSIONS);
});
```

- [ ] **Step 2: Run the service test to observe RED**

Run from `backend/`:

```powershell
npm.cmd test -- --runTestsByPath tests/adminPermissionService.test.js
```

Expected: FAIL because `adminService.getPermissions` does not exist.

- [ ] **Step 3: Create the immutable policy module**

Create `backend/src/policies/adminPermissionPolicy.js`:

```js
function freezePermission(permission) {
  return Object.freeze({
    ...permission,
    allowedRoles: Object.freeze([...permission.allowedRoles]),
  });
}

const adminPermissionPolicy = Object.freeze({
  roles: Object.freeze([
    Object.freeze({ roleName: 'ADMIN', label: 'Admin' }),
    Object.freeze({ roleName: 'LIBRARIAN', label: 'Librarian' }),
    Object.freeze({ roleName: 'MEMBER', label: 'Member' }),
  ]),
  permissions: Object.freeze([
    { permissionKey: 'USER_VIEW', label: 'View users', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'USER_CREATE', label: 'Create accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'USER_UPDATE', label: 'Update accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'USER_DEACTIVATE', label: 'Deactivate accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'ROLE_MANAGE', label: 'Manage roles', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'AUDIT_VIEW', label: 'View audit logs', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'CATALOG_MANAGE', label: 'Manage library catalog', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'METADATA_MANAGE', label: 'Manage authors/publishers/categories', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN'] },
    { permissionKey: 'BORROW_APPROVE_REJECT', label: 'Approve/reject borrow requests', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'RETURN_RENEW_PROCESS', label: 'Process returns and renewals', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'FINE_CALCULATE_COLLECT', label: 'Calculate and collect fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'FINE_WAIVE_CANCEL', label: 'Waive or cancel fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN'] },
    { permissionKey: 'REPORT_VIEW', label: 'View reports', moduleKey: 'REPORTS', moduleLabel: 'Reports', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'BORROW_REQUEST_CREATE', label: 'Create borrow request', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
    { permissionKey: 'BORROW_HISTORY_VIEW_OWN', label: 'View own borrowing history', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
  ].map(freezePermission)),
});

module.exports = { adminPermissionPolicy };
```

- [ ] **Step 4: Add the fresh service DTO**

At the top of `backend/src/services/adminService.js` add:

```js
const { adminPermissionPolicy } = require('../policies/adminPermissionPolicy');
```

Add before `getDashboard`:

```js
// @spec FR-FE11-032, BR-FE11-017, AC-FE11-017
function getPermissions() {
  return {
    roles: adminPermissionPolicy.roles.map(({ roleName, label }) => ({ roleName, label })),
    permissions: adminPermissionPolicy.permissions.map((permission) => ({
      permissionKey: permission.permissionKey,
      label: permission.label,
      moduleKey: permission.moduleKey,
      moduleLabel: permission.moduleLabel,
      allowedRoles: [...permission.allowedRoles],
    })),
  };
}
```

Add `getPermissions` to `module.exports` before `getDashboard`.

- [ ] **Step 5: Run GREEN and the affected service regression**

```powershell
npm.cmd test -- --runTestsByPath tests/adminPermissionService.test.js tests/adminAuditLogService.test.js
```

Expected: both suites PASS; the permission tests prove exact shape/order and fresh nested arrays.

Do not commit before H2.

---

### Task 3: Expose The Admin-First Permissions Route

**Files:**
- Create: `backend/tests/adminPermissionRoutes.test.js`
- Modify: `backend/src/controllers/adminController.js`
- Modify: `backend/src/routes/adminRoutes.js`

**Interfaces:**
- Consumes: `adminService.getPermissions()` from Task 2.
- Produces: authenticated Admin-only `GET /api/admin/permissions` with no request input and exact service response passthrough.

- [ ] **Step 1: Write the failing route tests**

Create `backend/tests/adminPermissionRoutes.test.js`:

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
    adminService,
    userManagementService: {},
  });
}

const payload = {
  roles: [
    { roleName: 'ADMIN', label: 'Admin' },
    { roleName: 'LIBRARIAN', label: 'Librarian' },
    { roleName: 'MEMBER', label: 'Member' },
  ],
  permissions: [
    {
      permissionKey: 'USER_VIEW',
      label: 'View users',
      moduleKey: 'USER_ROLE',
      moduleLabel: 'User & Role',
      allowedRoles: ['ADMIN'],
    },
  ],
};

test('GET /api/admin/permissions requires authentication before the controller', async () => {
  const adminService = { getPermissions: jest.fn(() => payload) };
  const response = await request(makeApp({ adminService }))
    .get('/api/admin/permissions');

  expect(response.status).toBe(401);
  expect(response.body.error.code).toBe('UNAUTHORIZED');
  expect(adminService.getPermissions).not.toHaveBeenCalled();
});

test.each([['MEMBER'], ['LIBRARIAN']])(
  'GET /api/admin/permissions rejects %s before the controller',
  async (roleName) => {
    const adminService = { getPermissions: jest.fn(() => payload) };
    const response = await request(makeApp({ roles: [roleName], adminService }))
      .get('/api/admin/permissions')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ROLE_REQUIRED');
    expect(adminService.getPermissions).not.toHaveBeenCalled();
  }
);

test('GET /api/admin/permissions returns the exact service payload to Admin', async () => {
  const adminService = { getPermissions: jest.fn(() => payload) };
  const response = await request(makeApp({ adminService }))
    .get('/api/admin/permissions')
    .set('Authorization', 'Bearer token');

  expect(response.status).toBe(200);
  expect(adminService.getPermissions).toHaveBeenCalledWith();
  expect(response.body).toEqual(payload);
});
```

- [ ] **Step 2: Run the route test to observe RED**

```powershell
npm.cmd test -- --runTestsByPath tests/adminPermissionRoutes.test.js
```

Expected: FAIL with `404` because `/api/admin/permissions` is absent.

- [ ] **Step 3: Add the controller and route**

Add this handler to the object returned by `createAdminController`:

```js
permissions: async (req, res, next) => {
  try {
    return res.status(200).json(await service.getPermissions());
  } catch (error) {
    return next(error);
  }
},
```

Register this route immediately after `/audit-logs` in `backend/src/routes/adminRoutes.js`:

```js
// @spec FR-FE11-032, BR-FE11-017, AC-FE11-017
router.get('/permissions', ...requireAdmin, controller.permissions);
```

- [ ] **Step 4: Run focused backend GREEN**

```powershell
npm.cmd test -- --runTestsByPath tests/adminPermissionService.test.js tests/adminPermissionRoutes.test.js tests/adminAuditLogRoutes.test.js tests/securityRegression.test.js
```

Expected: all four suites PASS; security regression continues to prove Admin routes require authentication when environment defaults are unsafe.

Do not commit before H2.

---

### Task 4: Align Navigation And Render The Dynamic Permissions View

**Files:**
- Create: `frontend/src/utils/adminPermissions.js`
- Create: `frontend/test/adminPermissions.test.js`
- Modify: `frontend/src/api/adminApi.js`
- Modify: `frontend/src/page/UserManagement.jsx`
- Modify: `frontend/test/adminApi.test.js`
- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `frontend/test/appShellFrontend.test.js`

**Interfaces:**
- Consumes: FE11 `{ roles, permissions }` and existing FE12 `{ usersByRole }`.
- Produces: exact sidebar, reachable read-only Permissions section, numeric role cards, derived module coverage/matrix cells, and independent retry/error behavior.

- [ ] **Step 1: Write the failing API and pure derivation tests**

Append to `frontend/test/adminApi.test.js`:

```js
test('FE11 Permissions use the canonical Admin endpoint and authorized wrapper', async () => {
  const source = await readFile(apiPath, 'utf8');
  assert.match(
    source,
    /permissions\(\)[\s\S]*?authorizedRequest\([\s\S]*?url: '\/admin\/permissions'/,
  );
});
```

Create `frontend/test/adminPermissions.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPermissionModuleCoverage,
  buildPermissionRoleSummary,
  roleAllowsPermission,
} from '../src/utils/adminPermissions.js';

const roles = [
  { roleName: 'ADMIN', label: 'Admin' },
  { roleName: 'LIBRARIAN', label: 'Librarian' },
  { roleName: 'MEMBER', label: 'Member' },
];
const permissions = [
  { permissionKey: 'USER_VIEW', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'CATALOG_MANAGE', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'BORROW_REQUEST_CREATE', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
];

test('role summary joins FE12 counts by roleName with numeric zero defaults', () => {
  assert.deepEqual(buildPermissionRoleSummary(roles, {
    ADMIN: '2',
    LIBRARIAN: 4,
    MEMBER: 'invalid',
  }), [
    { roleName: 'ADMIN', label: 'Admin', count: 2 },
    { roleName: 'LIBRARIAN', label: 'Librarian', count: 4 },
    { roleName: 'MEMBER', label: 'Member', count: 0 },
  ]);
});

test('module coverage is derived from allowedRoles in first-seen module order', () => {
  assert.deepEqual(buildPermissionModuleCoverage(roles, permissions), [
    { moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', counts: { ADMIN: 1, LIBRARIAN: 0, MEMBER: 0 } },
    { moduleKey: 'LIBRARY', moduleLabel: 'Library', counts: { ADMIN: 1, LIBRARIAN: 1, MEMBER: 0 } },
    { moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', counts: { ADMIN: 0, LIBRARIAN: 0, MEMBER: 1 } },
  ]);
});

test('matrix cells read only the server allowedRoles array', () => {
  assert.equal(roleAllowsPermission(permissions[1], 'ADMIN'), true);
  assert.equal(roleAllowsPermission(permissions[1], 'LIBRARIAN'), true);
  assert.equal(roleAllowsPermission(permissions[1], 'MEMBER'), false);
});
```

- [ ] **Step 2: Add failing source-contract tests for exact navigation and isolation**

Append to `frontend/test/userManagementFrontend.test.js`:

```js
test('FE11 Admin sidebar exposes exactly the approved eight entries in order', async () => {
  const source = await readFile(pagePath, 'utf8');
  const sidebar = source.match(/function Sidebar\([^]*?\n}\r?\n\r?\nfunction AdminLineChart/)?.[0] || '';
  const entries = [...sidebar.matchAll(/\{ id: '([^']+)'[^\n]+label: '([^']+)'/g)]
    .map((match) => [match[1], match[2]]);

  assert.deepEqual(entries, [
    ['home', 'Trang chủ'],
    ['dashboard', 'Tổng quan'],
    ['library', 'Thư viện'],
    ['circulation', 'Quản lý mượn trả'],
    ['requests', 'Quản lý yêu cầu'],
    ['users', 'Quản lý người dùng'],
    ['permissions', 'Phân quyền'],
    ['audit', 'Nhật ký hoạt động'],
  ]);
  assert.doesNotMatch(sidebar, /membership|Confirm Payment|Confirm Borrow/);
});

test('FE11 Permissions loads FE11 matrix and FE12 counts independently', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /async function loadPermissions\(\{ announce = false \} = \{\}\)/);
  assert.match(source, /const result = await adminApi\.permissions\(\)/);
  assert.match(source, /if \(activeSection !== 'permissions'\) return/);
  assert.match(source, /loadPermissions\(\)/);
  assert.match(source, /loadUserStatistics\(\)/);
  assert.match(source, /setPermissionsError\(error\.message\)/);
  assert.match(source, /setUserStatsError\(error\.message\)/);

  const permissionsCatch = source.match(/async function loadPermissions\([^]*?\n {2}\}/)?.[0] || '';
  assert.doesNotMatch(permissionsCatch, /catch \(error\)[^]*?setPermissionPolicy\(/);
  const statisticsBlock = source.match(/async function loadUserStatistics\([^]*?\n {2}\}/)?.[0] || '';
  assert.doesNotMatch(statisticsBlock, /catch \(error\)[^]*?setUserStats\(/);
});

test('FE11 Permissions derives the view from server data without a hardcoded matrix fallback', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /buildPermissionRoleSummary\(permissionPolicy\.roles, userStats\.usersByRole\)/);
  assert.match(source, /buildPermissionModuleCoverage\(permissionPolicy\.roles, permissionPolicy\.permissions\)/);
  assert.match(source, /roleAllowsPermission\(permission, role\.roleName\)/);
  assert.match(source, /permissionPolicy\.permissions\.map/);
  assert.doesNotMatch(source, /const permissionRows =/);
  assert.doesNotMatch(source, /const permissionModules =/);
});
```

In `frontend/test/appShellFrontend.test.js`, replace the old label array entry `'Quản lý hội viên'` with `'Phân quyền'`, then add:

```js
assert.doesNotMatch(source, /\{ id: 'membership'[^\n]+label: 'Quản lý hội viên'/);
```

- [ ] **Step 3: Run frontend RED**

Run from `frontend/`:

```powershell
node --test test/adminApi.test.js test/adminPermissions.test.js test/userManagementFrontend.test.js test/appShellFrontend.test.js
```

Expected: FAIL because the utility and adapter do not exist, Membership remains in the sidebar, Permissions remains unreachable, and the page still owns `permissionRows`/`permissionModules`.

- [ ] **Step 4: Implement the pure derivation utility**

Create `frontend/src/utils/adminPermissions.js`:

```js
function toNonNegativeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

export function buildPermissionRoleSummary(roles = [], usersByRole = {}) {
  return roles.map(({ roleName, label }) => ({
    roleName,
    label,
    count: toNonNegativeCount(usersByRole?.[roleName]),
  }));
}

export function buildPermissionModuleCoverage(roles = [], permissions = []) {
  const modules = new Map();

  for (const permission of permissions) {
    if (!modules.has(permission.moduleKey)) {
      modules.set(permission.moduleKey, {
        moduleKey: permission.moduleKey,
        moduleLabel: permission.moduleLabel,
        counts: Object.fromEntries(roles.map(({ roleName }) => [roleName, 0])),
      });
    }

    const module = modules.get(permission.moduleKey);
    for (const { roleName } of roles) {
      if (permission.allowedRoles.includes(roleName)) {
        module.counts[roleName] += 1;
      }
    }
  }

  return [...modules.values()];
}

export function roleAllowsPermission(permission, roleName) {
  return permission.allowedRoles.includes(roleName);
}
```

- [ ] **Step 5: Add the Admin API adapter and exact sidebar**

Add to `frontend/src/api/adminApi.js` before `auditLogs`:

```js
permissions() {
  return authorizedRequest(
    { method: 'get', url: '/admin/permissions' },
    'Khong the tai ma tran phan quyen.'
  );
},
```

In `UserManagement.jsx`, import the three utility functions and replace the sidebar items with:

```js
// @spec FR-FE11-030, BR-FE11-016, AC-FE11-016
const items = [
  { id: 'home', icon: Home, label: 'Trang chủ', path: '/home' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { id: 'library', icon: Library, label: 'Thư viện' },
  { id: 'circulation', icon: BookCopy, label: 'Quản lý mượn trả' },
  { id: 'requests', icon: ClipboardList, label: 'Quản lý yêu cầu' },
  { id: 'users', icon: Users, label: 'Quản lý người dùng' },
  { id: 'permissions', icon: Shield, label: 'Phân quyền' },
  { id: 'audit', icon: ClipboardList, label: 'Nhật ký hoạt động' },
];
```

Delete only the two frontend product constants beginning `const permissionRows =` and `const permissionModules =`. Do not remove Membership imports, state, loaders, components, or FE04 routes.

Replace the `roles` section metadata key with:

```js
permissions: { eyebrow: 'Kiểm soát truy cập', title: 'Phân quyền' },
```

- [ ] **Step 6: Add independent state, loaders, and derived view models**

Add component state beside the existing user-statistics state:

```js
const [permissionPolicy, setPermissionPolicy] = useState({ roles: [], permissions: [] });
const [permissionsLoading, setPermissionsLoading] = useState(false);
const [permissionsError, setPermissionsError] = useState('');
const [permissionsUpdatedAt, setPermissionsUpdatedAt] = useState(null);
```

Add the derived values beside existing `useMemo` blocks:

```js
const permissionRoleSummary = useMemo(
  () => buildPermissionRoleSummary(permissionPolicy.roles, userStats.usersByRole),
  [permissionPolicy.roles, userStats.usersByRole]
);
const permissionModuleCoverage = useMemo(
  () => buildPermissionModuleCoverage(permissionPolicy.roles, permissionPolicy.permissions),
  [permissionPolicy.roles, permissionPolicy.permissions]
);
```

Add the loader before `loadUserStatistics`:

```js
async function loadPermissions({ announce = false } = {}) {
  setPermissionsLoading(true);
  setPermissionsError('');

  try {
    const result = await adminApi.permissions();
    setPermissionPolicy({
      roles: result.roles || [],
      permissions: result.permissions || [],
    });
    setPermissionsUpdatedAt(new Date());
    if (announce) {
      setToast({ type: 'success', message: 'Đã làm mới ma trận phân quyền.' });
    }
  } catch (error) {
    setPermissionsError(error.message);
    if (announce) setToast({ type: 'error', message: error.message });
  } finally {
    setPermissionsLoading(false);
  }
}
```

Add a dedicated effect so both owners start independently when Permissions opens:

```js
useEffect(() => {
  if (activeSection !== 'permissions') return;
  const timer = setTimeout(() => {
    loadPermissions();
    loadUserStatistics();
  }, 0);

  return () => clearTimeout(timer);
// Each loader owns its own state and retry lifecycle.
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeSection]);
```

Add `permissions: permissionsLoading || userStatsLoading` to the active-section loading calculation used by the topbar. In the refresh handler add:

Replace the repeated inline loading expressions with this exact value after `userDirectoryLoading` is defined:

```js
const activeSectionLoading = {
  users: userDirectoryLoading,
  dashboard: dashboardLoading,
  library: libraryLoading,
  circulation: borrowingsLoading,
  requests: requestsLoading,
  membership: membershipLoading,
  permissions: permissionsLoading || userStatsLoading,
  audit: auditLoading,
}[activeSection] || false;
```

Use `activeSectionLoading` for the refresh button's `disabled` property, spinning icon class, and `Đang tải...` label. In the refresh handler add:

```js
else if (activeSection === 'permissions') {
  loadPermissions({ announce: true });
  loadUserStatistics();
}
```

- [ ] **Step 7: Replace the unreachable hardcoded section with dynamic read-only rendering**

Replace `activeSection === 'roles'` with `activeSection === 'permissions'` and render:

```jsx
{activeSection === 'permissions' && (
  <section className="um-admin-section">
    <div className="um-permission-status-grid" aria-live="polite">
      <article>
        <strong>Ma trận FE11</strong>
        <span>
          {permissionsUpdatedAt
            ? `Cập nhật lúc ${permissionsUpdatedAt.toLocaleTimeString('vi-VN')}`
            : permissionsLoading ? 'Đang tải...' : 'Chưa tải dữ liệu.'}
        </span>
        {permissionsError && (
          <button type="button" className="um-secondary-button" onClick={() => loadPermissions()}>
            Thử lại ma trận
          </button>
        )}
      </article>
      <article>
        <strong>Thống kê FE12</strong>
        <span>{userStatsLoading ? 'Đang tải...' : userStatsError || 'Đã tải số lượng vai trò.'}</span>
        {userStatsError && (
          <button type="button" className="um-secondary-button" onClick={() => loadUserStatistics()}>
            Thử lại thống kê
          </button>
        )}
      </article>
    </div>

    <div className="um-permission-cards">
      {permissionRoleSummary.map((role) => (
        <article key={role.roleName}>
          <RoleBadge role={role.roleName} />
          <strong>{role.count}</strong>
          <span>{role.label} accounts</span>
        </article>
      ))}
    </div>

    <section className="um-panel-grid permissions">
      <div className="um-panel">
        <h2>Module Coverage</h2>
        <table className="um-permission-table compact">
          <thead>
            <tr>
              <th>Module</th>
              {permissionPolicy.roles.map((role) => <th key={role.roleName}>{role.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {permissionModuleCoverage.map((module) => (
              <tr key={module.moduleKey}>
                <td>{module.moduleLabel}</td>
                {permissionPolicy.roles.map((role) => (
                  <td key={role.roleName}>{module.counts[role.roleName] || 0} rules</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="um-panel">
        <h2>Permission Matrix</h2>
        <table className="um-permission-table">
          <thead>
            <tr>
              <th>Permission</th>
              {permissionPolicy.roles.map((role) => <th key={role.roleName}>{role.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {permissionPolicy.permissions.map((permission) => (
              <tr key={permission.permissionKey}>
                <td>{permission.label}</td>
                {permissionPolicy.roles.map((role) => (
                  <td key={role.roleName}>
                    {roleAllowsPermission(permission, role.roleName) ? 'Yes' : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </section>
)}
```

Update the existing CSS selector from `.um-permission-cards button` to `.um-permission-cards article`, remove `cursor: pointer`, include the article selector in the warm-theme border rule, and add:

```css
.um-permission-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.um-permission-status-grid article {
  padding: 14px;
  display: grid;
  gap: 8px;
  border: 1px solid var(--um-line);
  border-radius: 12px;
  background: var(--um-surface);
}
@media (max-width: 900px) {
  .um-permission-status-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 8: Run frontend GREEN and regression**

```powershell
node --test test/adminApi.test.js test/adminPermissions.test.js test/userManagementFrontend.test.js test/appShellFrontend.test.js
npm.cmd run lint
npm.cmd run build
```

Expected: focused tests PASS, ESLint PASS, and production build PASS. The existing non-blocking bundle-size warning may remain.

Do not commit before H2.

---

### Task 5: Synchronize API Contracts And Assemble H2 Evidence

**Files:**
- Modify: `docs/api/api-contract.md`
- Modify: `backend/src/docs/openapi.yaml`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Create: `.sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md`

**Interfaces:**
- Consumes: complete uncommitted implementation and observed RED/GREEN evidence.
- Produces: strict human/OpenAPI contract, L1-L4 H2 packet, and accurate in-progress governance state.

- [ ] **Step 1: Add the human-readable API contract**

Add before the Audit Logs section in `docs/api/api-contract.md`:

```markdown
### GET `/api/admin/permissions`

Actor: authenticated Admin. Authentication and Admin authorization execute before controller handling. The endpoint accepts no body or query parameters and performs no mutation.

Response `200` has exactly two top-level fields:

- `roles`: ordered `ADMIN`, `LIBRARIAN`, `MEMBER`; each object contains only `roleName` and `label`.
- `permissions`: the 15 ordered Phase 1 rules from the approved TD-023 design; each object contains only `permissionKey`, `label`, `moduleKey`, `moduleLabel`, and `allowedRoles`.

Allowed role values are `ADMIN`, `LIBRARIAN`, and `MEMBER`; arrays are deterministic and contain no duplicates. FE12 `GET /api/reports/users` remains the owner of global `usersByRole` counts and the frontend joins the two responses by `roleName` only.

Errors: `401` for missing/invalid authentication and `403` for authenticated non-Admin callers.
```

Copy the full 15-row table from the approved design immediately after this text so the shared API document and design remain identical.

```markdown
| Module | Permission key | Label | Allowed roles |
| --- | --- | --- | --- |
| User & Role | `USER_VIEW` | View users | ADMIN |
| User & Role | `USER_CREATE` | Create accounts | ADMIN |
| User & Role | `USER_UPDATE` | Update accounts | ADMIN |
| User & Role | `USER_DEACTIVATE` | Deactivate accounts | ADMIN |
| User & Role | `ROLE_MANAGE` | Manage roles | ADMIN |
| User & Role | `AUDIT_VIEW` | View audit logs | ADMIN |
| Library | `CATALOG_MANAGE` | Manage library catalog | ADMIN, LIBRARIAN |
| Library | `METADATA_MANAGE` | Manage authors/publishers/categories | ADMIN |
| Borrow/Return | `BORROW_APPROVE_REJECT` | Approve/reject borrow requests | ADMIN, LIBRARIAN |
| Borrow/Return | `RETURN_RENEW_PROCESS` | Process returns and renewals | ADMIN, LIBRARIAN |
| Fine | `FINE_CALCULATE_COLLECT` | Calculate and collect fines | ADMIN, LIBRARIAN |
| Fine | `FINE_WAIVE_CANCEL` | Waive or cancel fines | ADMIN |
| Reports | `REPORT_VIEW` | View reports | ADMIN, LIBRARIAN |
| Borrow/Return | `BORROW_REQUEST_CREATE` | Create borrow request | MEMBER |
| Borrow/Return | `BORROW_HISTORY_VIEW_OWN` | View own borrowing history | MEMBER |
```

- [ ] **Step 2: Add strict OpenAPI schemas and path**

Add an `Admin Permissions` tag and these component schemas:

```yaml
    AdminPermissionRole:
      type: object
      additionalProperties: false
      required: [roleName, label]
      properties:
        roleName: { type: string, enum: [ADMIN, LIBRARIAN, MEMBER] }
        label: { type: string }
    AdminPermissionRule:
      type: object
      additionalProperties: false
      required: [permissionKey, label, moduleKey, moduleLabel, allowedRoles]
      properties:
        permissionKey: { type: string }
        label: { type: string }
        moduleKey: { type: string }
        moduleLabel: { type: string }
        allowedRoles:
          type: array
          minItems: 1
          uniqueItems: true
          items: { type: string, enum: [ADMIN, LIBRARIAN, MEMBER] }
    AdminPermissionsResponse:
      type: object
      additionalProperties: false
      required: [roles, permissions]
      properties:
        roles:
          type: array
          minItems: 3
          maxItems: 3
          items: { $ref: '#/components/schemas/AdminPermissionRole' }
        permissions:
          type: array
          minItems: 15
          maxItems: 15
          items: { $ref: '#/components/schemas/AdminPermissionRule' }
```

Add the path before `/api/admin/audit-logs`:

```yaml
  /api/admin/permissions:
    get:
      tags: [Admin Permissions]
      summary: Read the canonical FE11 Phase 1 permission matrix (FR-FE11-032)
      security: [{ bearerAuth: [] }]
      responses:
        '200':
          description: Canonical read-only roles and permission policy
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AdminPermissionsResponse' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '403': { $ref: '#/components/responses/Forbidden' }
```

- [ ] **Step 3: Run all automated validation layers**

From the repository root:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run trace:enforce
```

From `backend/`:

```powershell
node -e "require('yamljs').load('src/docs/openapi.yaml'); console.log('OpenAPI OK')"
node -e "require('./src/app'); console.log('Backend app import OK')"
```

Expected: full backend/frontend tests and coverage PASS; lint/build PASS; browser E2E PASS on desktop/mobile golden path; OpenAPI prints `OpenAPI OK`; backend import prints `Backend app import OK`; traceability PASS.

- [ ] **Step 4: Run diff, scope, and secret hygiene checks**

```powershell
git diff --check
git status --short
git diff --name-only
git ls-files --others --exclude-standard
rg -n "const permissionRows =|const permissionModules =|/api/admin/user-summary|id: 'membership'.*Quản lý hội viên|activeSection === 'roles'" frontend backend
```

Expected: only files in this plan are changed/untracked; `rg` returns no product-code matches for removed drift patterns.

Review high-confidence sensitive-term matches:

```powershell
$matches = git diff -U0 | rg -n "(?i)(password|passwd|token|otp|authorization|cookie|secret|session|credential|api[-_]?key|setup[-_]?link|reset[-_]?link)"
if ($LASTEXITCODE -eq 0) { $matches }
elseif ($LASTEXITCODE -ne 1) { exit $LASTEXITCODE }
```

Expected: matches are limited to existing safety documentation/tests or negative assertions; no secret value, credential field, token payload, or real PII is introduced.

- [ ] **Step 5: Record exact H2 evidence without closing the slice**

Create `.sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md` with these sections and observed command counts/results:

```markdown
# FE11 Admin Navigation And Permissions Validation - 2026-07-19

Status: H2 REVIEW READY

Scope: `FE11-PERM01..FE11-PERM05` / `TD-023` only

Decision: Hybrid SDD + ADD, Standard depth. Core is Admin-first authorization, exact policy/API ownership, FE11/FE12 ownership, and failure isolation; Shell is the read-only responsive presentation.

## L1 - Automated Evidence

## L2 - Specification Compliance

## L3 - Constitution And Safety

## L4 - Acceptance Evidence

## Residual Risks

## H2 Review Boundary
```

Record the observed RED reason for each new test group, exact GREEN/full command results, coverage, OpenAPI/health/traceability/diff/scope/secret results, and browser evidence. State explicitly that `TD-023`, `FE11-PERM06`, merge, and B7 remain open.

Update TASKS so `FE11-PERM01..FE11-PERM05` are checked only after their DoD and evidence exist; leave `FE11-PERM06` unchecked. Add a CHANGELOG entry titled `Admin Navigation And Permissions H2-Ready` and keep `TD-023` `IN PROGRESS`.

- [ ] **Step 6: Freeze and present the complete uncommitted H2 diff**

Make new files visible to `git diff` without staging their contents:

```powershell
git add -N -- backend/src/policies/adminPermissionPolicy.js backend/tests/adminPermissionService.test.js backend/tests/adminPermissionRoutes.test.js frontend/src/utils/adminPermissions.js frontend/test/adminPermissions.test.js .sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md
git diff --binary | git hash-object --stdin
```

Record the hash in the validation file, rerun `git diff --check`, and present the exact uncommitted diff for H2. Stop before commit or push.

---

### Task 6: Publish The H2-Reviewed Implementation And Integrate Only After H3

**Files:**
- Commit: exact H2-reviewed files from Tasks 1-5
- PR target: `main`

**Interfaces:**
- Consumes: explicit H2 approval, unchanged diff hash, and green local L1-L4 evidence.
- Produces: reviewable implementation PR with passing required checks; no merge before explicit H3.

- [ ] **Step 1: Confirm the reviewed diff is unchanged**

```powershell
git diff --binary | git hash-object --stdin
git diff --check
```

Expected: the hash equals the H2 record. Any mismatch requires renewed H2 review.

- [ ] **Step 2: Create the reviewed commit set**

```powershell
git add -- backend/src/policies/adminPermissionPolicy.js backend/src/services/adminService.js backend/src/controllers/adminController.js backend/src/routes/adminRoutes.js backend/tests/adminPermissionService.test.js backend/tests/adminPermissionRoutes.test.js
git commit -m "feat(fe11): add admin permissions read boundary"

git add -- frontend/src/api/adminApi.js frontend/src/page/UserManagement.jsx frontend/src/utils/adminPermissions.js frontend/test/adminApi.test.js frontend/test/adminPermissions.test.js frontend/test/userManagementFrontend.test.js frontend/test/appShellFrontend.test.js
git commit -m "feat(fe11): align admin permissions console"

git add -- docs/api/api-contract.md backend/src/docs/openapi.yaml .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md TECH_DEBT.md
git commit -m "docs: record FE11 permissions validation"
```

Expected: three commits, no content changes between H2 approval and commit.

- [ ] **Step 3: Push and open the implementation PR**

```powershell
git push -u origin feat/fe11-admin-navigation-permissions
gh pr create --base main --head feat/fe11-admin-navigation-permissions --draft --title "feat(fe11): align admin navigation and permissions" --body "Implements TD-023 / FE11-PERM01..FE11-PERM05 from the approved FE11 Admin Navigation And Permissions design and plan. Adds Admin-only GET /api/admin/permissions, the exact eight-entry Admin sidebar, FE12-backed role counts, derived read-only coverage/matrix rendering, tests, contracts, and H2 evidence. Excludes FE04 removal, permission mutation, schema changes, FE12 production changes, TD-025, and whole-feature FE11 completion."
```

Edit the PR body to identify `SPEC.md`, this plan, `FE11-PERM01..FE11-PERM06`, `TD-023`, L1-L4 evidence, and explicit exclusions. Mark ready only after required checks pass.

- [ ] **Step 4: Wait for checks and request H3**

```powershell
gh pr checks --watch
gh pr view --json number,state,isDraft,mergeable,statusCheckRollup,url
```

Expected: all required checks PASS and the PR is mergeable. Present the PR diff, check results, spec/safety/acceptance evidence, residual risks, and confirmation that whole FE11/TD-025 remain deferred. Stop for explicit H3 approval.

- [ ] **Step 5: Merge only after H3 and verify main CI**

```powershell
gh pr merge --merge --delete-branch
git fetch origin main
$mergeSha = gh pr view --json mergeCommit --jq .mergeCommit.oid
gh run list --branch main --commit $mergeSha --limit 5
gh run watch (gh run list --branch main --commit $mergeSha --limit 1 --json databaseId --jq '.[0].databaseId')
```

Expected: implementation PR is merged and the exact merge commit receives a successful `main` CI run. Do not mark `TD-023` resolved until Task 7 closeout is merged.

---

### Task 7: Close TD-023 With Exact B7 Evidence

**Files:**
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `.sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md`
- Modify: `TECH_DEBT.md`

**Interfaces:**
- Consumes: implementation PR number, merge SHA, PR checks, H3 approval, and exact post-merge main CI run.
- Produces: `FE11-PERM06` complete, `TD-023` resolved, and bounded B7 evidence without changing product code or whole-feature state.

- [ ] **Step 1: Create a closeout branch from successful main**

```powershell
git fetch origin main
git worktree add .worktrees/fe11-admin-permissions-closeout -b docs/fe11-admin-permissions-closeout origin/main
```

Expected: clean closeout worktree at the successful implementation merge.

- [ ] **Step 2: Apply only exact evidence transitions**

Update the validation record status to `B7 INTEGRATION COMPLETE` and add:

- H2 and H3 approval dates.
- implementation PR number and URL.
- implementation merge SHA.
- required PR check result.
- exact post-merge `main` CI run ID and result.

Change PLAN section 14 to `Integration State: COMPLETE THROUGH B7`. Check `FE11-PERM06` and add its integration evidence. Add the observed test totals to TEST_PLAN current evidence. Prepend a B7 CHANGELOG entry.

Move `TD-023` from Open debt to Resolved with a concise summary and the implementation merge short SHA. Keep `TD-025` `OPEN`, keep all unrelated debt unchanged, and keep whole FE11 `Implementation State: DEFERRED`.

- [ ] **Step 3: Verify closeout scope and facts**

```powershell
git diff --check
git diff --name-only
rg -n "FE11-PERM06|TD-023|TD-025|Implementation State: DEFERRED|B7 INTEGRATION COMPLETE" .sdd/specs/feat-user-role-management .sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md TECH_DEBT.md
$implementationPr = gh pr list --state merged --head feat/fe11-admin-navigation-permissions --json number --jq '.[0].number'
$implementationMerge = gh pr view $implementationPr --json mergeCommit --jq '.mergeCommit.oid'
$mainRun = gh run list --branch main --commit $implementationMerge --limit 1 --json databaseId --jq '.[0].databaseId'
gh pr view $implementationPr --json state,mergeCommit,statusCheckRollup,url
gh run view $mainRun --json conclusion,headSha,url
```

Expected: only the six closeout documents changed; GitHub reports the implementation PR merged and the exact merge SHA's main run successful.

- [ ] **Step 4: Obtain closeout H2/H3 and merge**

Present the exact documentation-only diff for H2. After approval:

```powershell
git add -- .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md TECH_DEBT.md
git commit -m "docs: close FE11 admin permissions slice"
git push -u origin docs/fe11-admin-permissions-closeout
gh pr create --base main --head docs/fe11-admin-permissions-closeout --title "docs: close FE11 admin permissions slice"
gh pr checks --watch
```

Request explicit H3 after checks. After H3:

```powershell
gh pr merge --merge --delete-branch
```

Record the closeout merge and final `main` CI in the final handoff. No required work remains for `TD-023`; `TD-025` and the rest of deferred FE11 remain the next independent work.

---

## Self-Review Results

- Spec coverage: Tasks 1-7 cover exact navigation (`FR-FE11-030`, `AC-FE11-016`), Admin-only read boundary, 15-row policy, fresh DTOs, FE12 count ownership, derived coverage/cells, independent failures/retries (`FR-FE11-032`, `AC-FE11-017`), docs, L1-L4, H2/H3, merge, and B7 closeout.
- Scope coverage: FE04 product files, FE12 product files, SQL/schema, authentication implementation, permission mutation, and TD-025 are absent from the file map and commit set.
- Placeholder scan: implementation steps provide exact paths, signatures, test code, policy rows, response schemas, commands, expected RED/GREEN behavior, and gate transitions. Integration-only IDs are retrieved from GitHub before closeout and written as observed evidence.
- Type consistency: backend uses `getPermissions`, frontend uses `adminApi.permissions`, policy fields are `permissionKey`, `label`, `moduleKey`, `moduleLabel`, `allowedRoles`, and all joins use `roleName`.
- State consistency: `permissionPolicy` and `userStats` have separate loading/error setters; neither catch resets the other owner or its own last successful value.
- Governance consistency: `FE11-PERM01..FE11-PERM05` can become H2-ready; only `FE11-PERM06` and `TD-023` close after implementation merge, post-merge CI, and closeout integration. Whole FE11 remains deferred.
