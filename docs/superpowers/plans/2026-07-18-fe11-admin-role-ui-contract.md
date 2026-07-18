# FE11 Admin Role UI Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the FE11 Admin role modal call the approved numeric-`roleId` assignment/revocation contract and recover safely when a multi-mutation save partially fails.

**Architecture:** Keep the B7-complete backend role transaction unchanged. The frontend loads the authoritative `{ roleId, roleName }` catalog, keeps checkbox state as role names, validates a complete name-to-ID mutation plan before the first request, assigns before revoking, and reloads the target user after any partial failure.

**Tech Stack:** React 19, Vite 7, Axios authorized request wrapper, Node.js built-in test runner, ESLint 9, Express/Jest backend regression tests, Markdown SDD artifacts.

## Global Constraints

- Implement only `TD-022` and the frontend acceptance path for `FR-FE11-012..014`, `FR-FE11-024..027`, and `AC-FE11-013..015`.
- Preserve the approved API: `POST /api/users/{userId}/roles` with `{ roleId: number }` and `DELETE /api/users/{userId}/roles/{roleId}`.
- Do not modify `SPEC.md`, backend role behavior, SQL schema, role hierarchy, Permissions, Audit Logs, navigation, Request Management, update, or deactivation behavior.
- Obtain every role ID from authenticated `GET /api/users/roles`; never hardcode IDs or send role names across the mutation boundary.
- Keep non-editable/unknown existing roles unchanged; only `ADMIN`, `LIBRARIAN`, and `MEMBER` are editable in this modal.
- Validate the entire mutation plan before the first request, perform assignments before revocations, and never describe the multi-request save as atomic.
- On the first mutation failure, stop, reload the target user, keep the modal open, and disable further Save attempts if authoritative reconciliation also fails.
- Every production behavior change must have an observed RED test before implementation.
- Preserve `Implementation State: DEFERRED` for the whole FE11 feature and leave unrelated debt open.
- Preserve unrelated user changes and untracked files.

---

### Task 1: Activate The Approved FE11 Admin Role UI Slice

**Files:**
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `TECH_DEBT.md`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-07-18-fe11-admin-role-ui-contract-design.md` and completed backend role tasks `FE11-R01..R05`.
- Produces: task IDs `FE11-UIR01..UIR05`, validation commands, and `TD-022` state used by all later tasks.

- [ ] **Step 1: Rename the local design branch for implementation**

The current branch contains the reviewed design and plan but will also carry the bounded fix. Rename it before product-code work:

```powershell
git branch -m fix/fe11-admin-role-ui-contract
```

Expected: `git branch --show-current` prints `fix/fe11-admin-role-ui-contract`.

- [ ] **Step 2: Add the bounded slice to FE11 PLAN.md**

Append after the Safe User List And Detail slice:

```markdown
## 12. Admin Role UI Contract Slice

### In Scope

- Load `{ roleId, roleName }` from the authenticated FE11 role catalog.
- Keep checkbox state by role name while mapping every mutation to a positive numeric role ID.
- Send canonical assignment/revocation requests, with assignments before revocations.
- Block invalid catalogs before mutation and reconcile authoritative user roles after partial failure.
- Add focused frontend RED-GREEN tests and affected regression checks.

### Out Of Scope

- Backend role transaction/validators, schema changes, role creation/editing, and permission editing.
- Navigation, Permissions, Audit Logs, Request Management, update, deactivation, and all other FE11 debt.

### Validation Gate

- API adapter tests prove no role name enters a mutation request.
- UI contract tests prove catalog validation, assignment-before-revocation, no-op behavior, and partial-failure reconciliation.
- Full frontend tests/lint/build, focused backend role regression, traceability, and diff hygiene pass.
- Remaining FE11 work stays deferred and human review is required before merge.
```

- [ ] **Step 3: Add FE11-UIR01..UIR05 to TASKS.md**

Insert before `## Deferred FE11 Work`:

```markdown
## Admin Role UI Contract Tasks

- [ ] **FE11-UIR01 - Send numeric role IDs from the frontend API adapter.**
  - Maps to: FR-FE11-012..013; AC-FE11-013..014; FE11 API §11.
  - DoD: assignment sends `{ roleId }`, revocation uses `/{roleId}`, and focused RED-GREEN tests exclude role-name mutation requests.

- [ ] **FE11-UIR02 - Validate and consume the authoritative role catalog.**
  - Maps to: PRE-FE11-004; NFR-FE11-SEC-004; TD-022.
  - Depends on: FE11-UIR01.
  - DoD: only positive IDs for ADMIN/LIBRARIAN/MEMBER enable the modal; invalid/missing catalog data sends no mutation and no hardcoded fallback exists.

- [ ] **FE11-UIR03 - Execute deterministic role diffs and no-op saves.**
  - Maps to: BR-FE11-007..009; FR-FE11-012..014, FR-FE11-027; AC-FE11-013..015.
  - Depends on: FE11-UIR02.
  - DoD: the complete diff is validated before requests, assignments precede revocations, non-editable roles are preserved, and no-op saves send no mutation.

- [ ] **FE11-UIR04 - Reconcile partial failures to server state.**
  - Maps to: BR-FE11-010; FR-FE11-024..027; NFR-FE11-UX-001.
  - Depends on: FE11-UIR03.
  - DoD: the first failed mutation stops the sequence; target detail is reloaded into the open modal; failed reconciliation disables Save and never reports success.

- [ ] **FE11-UIR05 - Pass the Admin role UI validation and integration gates.**
  - Depends on: FE11-UIR01..UIR04.
  - DoD: focused/full frontend, lint/build, focused backend role regression, traceability, diff/security review, documentation, human review, merge, and post-merge CI evidence are complete.
```

Keep this line unchanged:

```markdown
Implementation State: DEFERRED
```

- [ ] **Step 4: Update TEST_PLAN.md and CHANGELOG.md**

Add these test targets to `TEST_PLAN.md`:

```markdown
- Admin role API helpers send only numeric `roleId` values from the authenticated role catalog.
- The role modal validates a complete editable catalog before mutation, assigns before revoking, and preserves non-editable roles.
- Partial mutation failure stops later requests and reloads the target user's authoritative roles into the open modal.
```

Add a dated `CHANGELOG.md` entry stating that the role UI contract design and task group are approved, implementation evidence is not yet claimed, and all unrelated FE11 work remains deferred.

- [ ] **Step 5: Mark TD-022 in progress**

Change only the `TD-022` status cell from `OPEN` to `IN PROGRESS`. Do not edit or close `TD-023..TD-027`.

- [ ] **Step 6: Run documentation checks**

Run:

```powershell
npm.cmd run trace:enforce
git diff --check -- .sdd/specs/feat-user-role-management TECH_DEBT.md
```

Expected: `trace:enforce` reports PASS; the documentation diff has no whitespace errors.

- [ ] **Step 7: Commit the activated slice**

```powershell
git add -- .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md
git commit -m "docs: activate FE11 admin role UI contract"
```

---

### Task 2: Send Numeric Role IDs From The Frontend API Adapter

**Files:**
- Modify: `frontend/test/userManagementApi.test.js`
- Modify: `frontend/src/api/userManagementApi.js`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`

**Interfaces:**
- Consumes: `authorizedRequest`, numeric `userId`, and numeric `roleId` supplied by the page orchestration.
- Produces: `assignManagedUserRole(userId, roleId)` and `revokeManagedUserRole(userId, roleId)` matching FE11 API §11.

- [ ] **Step 1: Add the failing API contract test**

Append to `frontend/test/userManagementApi.test.js`:

```js
test('FE11 role mutations send numeric role IDs through the canonical contract', async () => {
  const source = await readFile(apiPath, 'utf8');

  assert.match(
    source,
    /export async function assignManagedUserRole\(userId, roleId\)[\s\S]*?url: `\/users\/\$\{userId\}\/roles`[\s\S]*?data: \{ roleId \}/,
  );
  assert.match(
    source,
    /export async function revokeManagedUserRole\(userId, roleId\)[\s\S]*?url: `\/users\/\$\{userId\}\/roles\/\$\{roleId\}`/,
  );
  assert.doesNotMatch(
    source,
    /export async function (?:assign|revoke)ManagedUserRole\(userId, roleName\)/,
  );
  assert.doesNotMatch(source, /data: \{ roleName \}/);
});
```

- [ ] **Step 2: Run RED and confirm the current role-name contract fails**

Run:

```powershell
node --test test/userManagementApi.test.js
```

Working directory: `frontend`.

Expected: FAIL because the current helpers accept `roleName`, send `{ roleName }`, and interpolate the name into the DELETE path.

- [ ] **Step 3: Replace both mutation helpers**

In `frontend/src/api/userManagementApi.js`, replace the existing helpers with:

```js
export async function assignManagedUserRole(userId, roleId) {
  try {
    const response = await authorizedRequest({
      method: 'post',
      url: `/users/${userId}/roles`,
      data: { roleId },
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not assign role.'), { cause: error });
  }
}

export async function revokeManagedUserRole(userId, roleId) {
  try {
    const response = await authorizedRequest({
      method: 'delete',
      url: `/users/${userId}/roles/${roleId}`,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not revoke role.'), { cause: error });
  }
}
```

- [ ] **Step 4: Run GREEN**

Run:

```powershell
node --test test/userManagementApi.test.js
```

Working directory: `frontend`.

Expected: all `userManagementApi` tests PASS.

- [ ] **Step 5: Mark FE11-UIR01 complete and commit**

Update the task checkbox and add the observed RED/GREEN evidence, then run:

```powershell
git add -- frontend/test/userManagementApi.test.js frontend/src/api/userManagementApi.js .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix(fe11): send numeric role IDs from admin API"
```

---

### Task 3: Validate The Role Catalog Before Opening Or Saving

**Files:**
- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `frontend/src/page/UserManagement.jsx`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`

**Interfaces:**
- Consumes: `fetchRoles()` response `{ data: Array<{ roleId, roleName }> }` and `editableRoles = ['ADMIN', 'LIBRARIAN', 'MEMBER']`.
- Produces: `normalizeEditableRoleCatalog(roleCatalog)` and `buildRoleMutationPlan(currentRoleNames, selectedRoleNames, roleCatalog)`; both throw the safe catalog error before any mutation when the catalog is incomplete or invalid.

- [ ] **Step 1: Add failing source-contract tests for catalog integrity**

Append to `frontend/test/userManagementFrontend.test.js`:

```js
test('FE11 role editing requires a complete numeric role catalog', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /function normalizeEditableRoleCatalog\(roleCatalog = \[\]\)/);
  assert.match(source, /Number\.isInteger\(roleId\) && roleId > 0/);
  assert.match(source, /seenIds\.has\(roleId\)/);
  assert.match(source, /normalized\.length !== editableRoles\.length/);
  assert.match(source, /async function loadRoles\(\)/);
  assert.match(source, /async function openRoleModal\(user\)[\s\S]*?await loadRoles\(\)/);
  assert.doesNotMatch(source, /editableRoles\.map\(\(roleName\) => \(\{ roleName \}\)\)/);
});

test('FE11 role mutation plan preserves names for UI and emits catalog IDs', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /function buildRoleMutationPlan\(currentRoleNames, selectedRoleNames, roleCatalog\)/);
  assert.match(source, /assignments\.push\(\{ roleName, roleId \}\)/);
  assert.match(source, /revocations\.push\(\{ roleName, roleId \}\)/);
});
```

- [ ] **Step 2: Run RED**

Run:

```powershell
node --test test/userManagementFrontend.test.js
```

Working directory: `frontend`.

Expected: FAIL because catalog validation, retryable `loadRoles`, and the mutation-plan helper do not exist; the current name-only fallback still exists.

- [ ] **Step 3: Add catalog normalization and mutation planning**

Add after `editableRoles` in `frontend/src/page/UserManagement.jsx`:

```js
const ROLE_CATALOG_ERROR = 'Không thể tải danh mục vai trò. Vui lòng thử lại.';

function normalizeEditableRoleCatalog(roleCatalog = []) {
  const seenNames = new Set();
  const seenIds = new Set();
  const normalized = [];

  for (const role of roleCatalog) {
    const roleName = String(role?.roleName || '').trim().toUpperCase();
    if (!editableRoles.includes(roleName)) continue;

    const roleId = Number(role?.roleId);
    if (
      !(Number.isInteger(roleId) && roleId > 0)
      || seenNames.has(roleName)
      || seenIds.has(roleId)
    ) {
      throw new Error(ROLE_CATALOG_ERROR);
    }

    seenNames.add(roleName);
    seenIds.add(roleId);
    normalized.push({ roleId, roleName });
  }

  if (normalized.length !== editableRoles.length) {
    throw new Error(ROLE_CATALOG_ERROR);
  }

  return normalized;
}

function buildRoleMutationPlan(currentRoleNames, selectedRoleNames, roleCatalog) {
  const editableCatalog = normalizeEditableRoleCatalog(roleCatalog);
  const currentRoles = new Set(currentRoleNames || []);
  const selectedRoles = new Set(selectedRoleNames || []);
  const assignments = [];
  const revocations = [];

  for (const { roleId, roleName } of editableCatalog) {
    if (selectedRoles.has(roleName) && !currentRoles.has(roleName)) {
      assignments.push({ roleName, roleId });
    }
    if (currentRoles.has(roleName) && !selectedRoles.has(roleName)) {
      revocations.push({ roleName, roleId });
    }
  }

  return { assignments, revocations };
}
```

Only names in the editable catalog participate in the diff, so existing non-editable roles remain untouched.

- [ ] **Step 4: Replace the name-only fallback with retryable catalog state**

Add next to the existing `roles` state:

```js
const [rolesError, setRolesError] = useState('');
const [rolesLoading, setRolesLoading] = useState(false);
const [roleSyncBlocked, setRoleSyncBlocked] = useState(false);
```

Add this page function before `openRoleModal`:

```js
async function loadRoles() {
  setRolesLoading(true);
  setRolesError('');

  try {
    const result = await fetchRoles();
    const catalog = normalizeEditableRoleCatalog(result.data || []);
    setRoles(catalog);
    return catalog;
  } catch (error) {
    setRoles([]);
    setRolesError(ROLE_CATALOG_ERROR);
    throw new Error(ROLE_CATALOG_ERROR, { cause: error });
  } finally {
    setRolesLoading(false);
  }
}
```

Replace the current role-loading effect with:

```js
useEffect(() => {
  loadRoles().catch(() => {});
// loadRoles is intentionally the page-owned catalog boundary for this mount.
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Replace `openRoleModal` with:

```js
async function openRoleModal(user) {
  if (!(await requireAdminSession())) return;

  try {
    if (rolesError || roles.length === 0) {
      await loadRoles();
    } else {
      normalizeEditableRoleCatalog(roles);
    }
    setRoleSyncBlocked(false);
    setRoleUser(user);
  } catch (error) {
    setToast({ type: 'error', message: error.message });
  }
}
```

Remove this fallback entirely:

```js
editableRoles.map((roleName) => ({ roleName }))
```

In `RoleModal`, use only the validated `roles` prop:

```js
const availableRoles = roles;
```

Pass the loading/block state through the existing modal call so both states are consumed before Task 5 adds the enforcement behavior:

```jsx
<RoleModal
  user={roleUser}
  roles={roles}
  savingBlocked={rolesLoading || roleSyncBlocked}
  onClose={() => setRoleUser(null)}
  onSave={saveRoles}
/>
```

- [ ] **Step 5: Run GREEN and lint the changed page**

Run:

```powershell
node --test test/userManagementFrontend.test.js
npm.cmd run lint
```

Working directory: `frontend`.

Expected: focused tests PASS and ESLint reports no errors.

- [ ] **Step 6: Mark FE11-UIR02 complete and commit**

```powershell
git add -- frontend/test/userManagementFrontend.test.js frontend/src/page/UserManagement.jsx .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix(fe11): require numeric admin role catalog"
```

---

### Task 4: Execute Assignments Before Revocations And Handle No-Ops

**Files:**
- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `frontend/src/page/UserManagement.jsx`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`

**Interfaces:**
- Consumes: `buildRoleMutationPlan(...)`, numeric API helpers from Task 2, and the validated `roles` catalog from Task 3.
- Produces: deterministic `saveRoles(nextRoles)` behavior with preflight validation, assignment-before-revocation order, and zero-request no-op handling.

- [ ] **Step 1: Add failing ordering and no-op source tests**

Append:

```js
test('FE11 role saves validate the full plan and assign before revoking', async () => {
  const source = await readFile(pagePath, 'utf8');
  const saveRoles = source.match(/async function saveRoles\(nextRoles\)[\s\S]*?\n  }\n\n  return \(/)?.[0] || '';

  assert.match(saveRoles, /buildRoleMutationPlan\(roleUser\.roles \|\| \[\], nextRoles, roles\)/);
  assert.match(saveRoles, /for \(const \{ roleId \} of assignments\)/);
  assert.match(saveRoles, /assignManagedUserRole\(roleUser\.userId, roleId\)/);
  assert.match(saveRoles, /for \(const \{ roleId \} of revocations\)/);
  assert.match(saveRoles, /revokeManagedUserRole\(roleUser\.userId, roleId\)/);
  assert.ok(saveRoles.indexOf('of assignments') < saveRoles.indexOf('of revocations'));
  assert.match(saveRoles, /assignments\.length === 0 && revocations\.length === 0/);
});
```

- [ ] **Step 2: Run RED**

Run:

```powershell
node --test test/userManagementFrontend.test.js
```

Expected: FAIL because `saveRoles` still sends names directly and does not have a planned no-op branch.

- [ ] **Step 3: Replace the successful mutation body**

Replace `saveRoles` with this version; Task 5 will fill the reconciliation catch while preserving the successful path:

```js
async function saveRoles(nextRoles) {
  if (!roleUser) return;

  if (!(await requireAdminSession())) {
    throw new Error('Admin login required.');
  }

  const { assignments, revocations } = buildRoleMutationPlan(
    roleUser.roles || [],
    nextRoles,
    roles,
  );

  if (assignments.length === 0 && revocations.length === 0) {
    setRoleUser(null);
    setRoleSyncBlocked(false);
    return;
  }

  try {
    for (const { roleId } of assignments) {
      await assignManagedUserRole(roleUser.userId, roleId);
    }

    for (const { roleId } of revocations) {
      await revokeManagedUserRole(roleUser.userId, roleId);
    }

    setToast({ type: 'success', message: 'Đã cập nhật vai trò người dùng.' });
    setRoleUser(null);
    setRoleSyncBlocked(false);
    setSelectedUser(null);
    await loadUsers();
  } catch (error) {
    throw error;
  }
}
```

The complete plan is built before either loop; an invalid catalog therefore throws before any request.

- [ ] **Step 4: Run GREEN**

Run:

```powershell
node --test test/userManagementFrontend.test.js
```

Expected: focused frontend tests PASS.

- [ ] **Step 5: Mark FE11-UIR03 complete and commit**

```powershell
git add -- frontend/test/userManagementFrontend.test.js frontend/src/page/UserManagement.jsx .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix(fe11): sequence admin role mutations safely"
```

---

### Task 5: Reconcile Partial Failures And Lock Unsynchronized Saves

**Files:**
- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `frontend/src/page/UserManagement.jsx`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`

**Interfaces:**
- Consumes: `fetchManagedUser(userId)`, `roleUser`, `selectedUser`, and the mutation sequence from Task 4.
- Produces: refreshed modal role state after failure, `roleSyncBlocked` protection when refresh fails, and modal-local safe errors.

- [ ] **Step 1: Add failing reconciliation and modal-lock tests**

Append:

```js
test('FE11 partial role failure reloads the target and keeps the modal authoritative', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /catch \(error\) \{[\s\S]*?await fetchManagedUser\(roleUser\.userId\)/);
  assert.match(source, /setRoleUser\(refreshedUser\)/);
  assert.match(source, /setRoleSyncBlocked\(true\)/);
  assert.match(source, /useEffect\(\(\) => \{[\s\S]*?setSelectedRoles\(new Set\(user\.roles \|\| \[\]\)\)/);
  assert.match(source, /\}, \[user\]\);/);
  assert.match(source, /savingBlocked=\{rolesLoading \|\| roleSyncBlocked\}/);
  assert.match(source, /catch \(error\) \{\s*setError\(error\.message\)/);
});
```

- [ ] **Step 2: Run RED**

Run:

```powershell
node --test test/userManagementFrontend.test.js
```

Expected: FAIL because partial-failure reconciliation, local selection synchronization, and blocked Save behavior are absent.

- [ ] **Step 3: Synchronize RoleModal with refreshed user state**

Change the signature and state setup:

```js
function RoleModal({ user, roles, savingBlocked, onClose, onSave }) {
  const [selectedRoles, setSelectedRoles] = useState(() => new Set(user.roles || []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const availableRoles = roles;

  useEffect(() => {
    setSelectedRoles(new Set(user.roles || []));
    setError('');
  }, [user]);
```

Replace `handleSave` with:

```js
async function handleSave(event) {
  event.preventDefault();

  if (savingBlocked) {
    setError('Không thể lưu cho đến khi trạng thái vai trò được tải lại.');
    return;
  }

  if (selectedRoles.size === 0) {
    setError('Every user must keep at least one role.');
    return;
  }

  setSaving(true);
  setError('');
  try {
    await onSave(Array.from(selectedRoles));
  } catch (error) {
    setError(error.message);
  } finally {
    setSaving(false);
  }
}
```

Guard closing and saving while work is active:

```jsx
<div className="um-modal-backdrop" onMouseDown={() => { if (!saving) onClose(); }}>
```

```jsx
<button type="button" className="um-icon-button" disabled={saving} onClick={onClose} aria-label="Close">
```

```jsx
<button type="button" className="um-secondary-button" disabled={saving} onClick={onClose}>
```

```jsx
<button type="submit" className="um-primary-button" disabled={saving || savingBlocked}>
```

- [ ] **Step 4: Reconcile the authoritative target after a mutation failure**

Replace the catch in `saveRoles` with:

```js
  } catch (error) {
    try {
      const refreshedUser = await fetchManagedUser(roleUser.userId);
      setRoleUser(refreshedUser);
      setRoleSyncBlocked(false);
      if (selectedUser?.userId === refreshedUser.userId) {
        setSelectedUser(refreshedUser);
      }
    } catch {
      setRoleSyncBlocked(true);
    }
    throw error;
  }
```

Pass the block state and clear it only when closing intentionally:

```jsx
<RoleModal
  user={roleUser}
  roles={roles}
  savingBlocked={rolesLoading || roleSyncBlocked}
  onClose={() => {
    setRoleUser(null);
    setRoleSyncBlocked(false);
  }}
  onSave={saveRoles}
/>
```

- [ ] **Step 5: Run GREEN, full frontend tests, and lint/build**

Run from `frontend`:

```powershell
node --test test/userManagementFrontend.test.js test/userManagementApi.test.js
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: focused and full frontend tests PASS, ESLint reports no errors, and Vite production build succeeds. The existing bundle-size advisory may remain non-blocking.

- [ ] **Step 6: Mark FE11-UIR04 complete and commit**

```powershell
git add -- frontend/test/userManagementFrontend.test.js frontend/src/page/UserManagement.jsx .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "fix(fe11): reconcile partial admin role updates"
```

---

### Task 6: Pass The Validation Gate And Prepare Human Review

**Files:**
- Create: `.sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `TECH_DEBT.md`

**Interfaces:**
- Consumes: completed `FE11-UIR01..UIR04` code/tests and existing backend B7 role evidence.
- Produces: four-layer validation evidence and a human-review-ready branch; `TD-022` remains `IN PROGRESS` until merge and post-merge CI.

- [ ] **Step 1: Run focused backend role regression**

Run from `backend`:

```powershell
npm.cmd test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRoleRepository.test.js
```

Expected: 3 suites and the current focused FE11 role tests PASS; no backend file changed.

- [ ] **Step 2: Run full frontend validation**

Run from `frontend`:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: all frontend tests PASS, lint has zero errors, and the production build succeeds.

- [ ] **Step 3: Run project checks**

Run from repository root:

```powershell
npm.cmd run trace:enforce
git diff --check origin/main...HEAD
git status --short
```

Expected: traceability PASS, no whitespace errors, and only intended FE11/frontend/documentation files are changed.

- [ ] **Step 4: Perform the four-layer review**

Create `.sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md` with these exact sections:

```markdown
# FE11 Admin Role UI Contract Validation

Date: 2026-07-18
Scope: FE11-UIR01..UIR05 / TD-022 only

## L1 Automated Evidence
## L2 Spec Compliance
## L3 Constitution And Safety
## L4 Acceptance And Residual Risks
## Files Changed
## Human Review Gate
## Integration State
```

Record command results and counts, map the successful flow to `FR-FE11-012..014` and `AC-FE11-013..015`, and explicitly state:

- Role IDs come only from the authenticated catalog.
- Backend authorization, validation, and transaction behavior are unchanged.
- Multi-request UI saves are not atomic; reconciliation is the approved recovery boundary.
- Browser E2E remains CI regression evidence rather than a new role-specific interaction test.
- All unrelated FE11 work remains deferred.

- [ ] **Step 5: Update validation-ready records**

In `TASKS.md`, keep `FE11-UIR05` unchecked until human review. Add automated evidence beneath it.

In `TEST_PLAN.md`, move the role UI gap into Current Evidence and retain residual browser/SQL environment notes.

In `CHANGELOG.md`, add a validation-ready entry without claiming merge or B7 integration.

Keep `TD-022` as `IN PROGRESS`; do not mark it resolved before post-merge CI.

- [ ] **Step 6: Commit the validation packet**

```powershell
git add -- .sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md
git commit -m "docs: record FE11 admin role UI validation"
```

- [ ] **Step 7: Stop for human implementation review**

Present the changed files, RED/GREEN evidence, four validation layers, and residual risks. Do not push, open a PR, or mark `FE11-UIR05` complete until the user explicitly approves implementation review.

---

### Task 7: Integrate And Close TD-022 After Post-Merge CI

**Files:**
- Modify: `.sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `TECH_DEBT.md`
- Modify: `.agents/CLAUDE.md`

**Interfaces:**
- Consumes: explicit human implementation approval, successful PR CI, merge commit, and successful post-merge `main` CI.
- Produces: B7 integration evidence, completed `FE11-UIR05`, resolved `TD-022`, and updated project memory.

- [ ] **Step 1: Record human review before publishing**

After explicit approval, mark the Human Review Gate in the validation record and add the review date beneath `FE11-UIR05`. Commit:

```powershell
git add -- .sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md .sdd/specs/feat-user-role-management/TASKS.md
git commit -m "docs: record FE11 admin role UI review"
```

- [ ] **Step 2: Push and open a draft PR**

```powershell
git push -u origin fix/fe11-admin-role-ui-contract
@'
## What changed

- Align FE11 Admin role assignment/revocation with the approved numeric `roleId` contract.
- Validate the authenticated role catalog before mutation.
- Assign before revoking and reconcile the modal after partial failure.

## Spec mapping

- FR-FE11-012..014, FR-FE11-024..027
- AC-FE11-013..015
- TD-022 only

## Validation

- Focused and full frontend tests, lint, and build PASS.
- Focused backend FE11 role regression PASS.
- `trace:enforce` and diff hygiene PASS.

No backend, schema, or FE11 SPEC change is included.
'@ | gh pr create --draft --base main --head fix/fe11-admin-role-ui-contract --title "fix(fe11): align admin role UI contract" --body-file -
```

The PR body must state the exact SPEC IDs, files, RED/GREEN evidence, no backend/schema change, and residual multi-request atomicity boundary.

- [ ] **Step 3: Require PR CI before merge**

Run:

```powershell
$prNumber = gh pr view --json number --jq .number
gh pr checks $prNumber --watch
```

Expected: `foundation-checks` PASS. Mark ready and merge only after the user authorizes integration.

- [ ] **Step 4: Require post-merge main CI**

Identify the `main` push run for the merge commit and run:

```powershell
$mergeSha = gh pr view $prNumber --json mergeCommit --jq .mergeCommit.oid
$runId = gh run list --branch main --workflow CI --event push --limit 20 --json databaseId,headSha --jq ".[] | select(.headSha == `"$mergeSha`") | .databaseId" | Select-Object -First 1
if (-not $runId) { throw "Post-merge CI run was not found for $mergeSha" }
gh run watch $runId --exit-status
```

Expected: post-merge `foundation-checks` PASS.

- [ ] **Step 5: Create the B7 closeout documentation change**

On a fresh docs branch from the successful merge commit:

- Mark `FE11-UIR05` complete with PR, merge commit, and CI run IDs.
- Change `TD-022` from `IN PROGRESS` to `RESOLVED` and add the closing PR/commit evidence.
- Add a B7 integration entry to FE11 `CHANGELOG.md`.
- Set the validation record Integration State to complete.
- Update `.agents/CLAUDE.md` so TD-022 is no longer listed as unresolved; keep `TD-023..TD-027` deferred.

Validate and commit:

```powershell
npm.cmd run trace:enforce
git diff --check
git add -- .agents/CLAUDE.md .sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md
git commit -m "docs: close FE11 admin role UI B7"
```

Publish this small closeout through the normal reviewed PR/CI/merge flow. The whole FE11 feature remains `Implementation State: DEFERRED`.
