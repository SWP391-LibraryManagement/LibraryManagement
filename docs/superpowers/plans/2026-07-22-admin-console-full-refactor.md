# Admin Console Full Frontend Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3,000-line FE11 Admin Console monolith with a modular, accessible, responsive single-route frontend and deploy the verified result to Azure Staging without changing backend or business contracts.

**Architecture:** Keep `/admin/users` as the only Admin Console route and keep `frontend/src/page/UserManagement.jsx` as a compatibility entry. Build `AdminConsolePage` from a shared shell, small presentation primitives, and independently owned Dashboard, Library, Circulation, Requests, Users, Permissions, and Audit modules. Preserve existing API adapters and safe DTOs; extract only presentation and section state.

**Tech Stack:** React 19, React Router, Lucide React, existing Bootstrap/shared CSS tokens, Node test runner, ESLint, Vite, Playwright, Express/Jest regression suite, GitHub Actions, Azure Static Web Apps/App Service.

## Global Constraints

- The public Admin entry URL remains exactly `/admin/users`.
- The default Admin section remains User Management.
- Navigation remains exactly Home, Dashboard, Library, Borrowing Management, Request Management, All Users, Permissions, and Audit Logs in the approved order.
- No backend endpoint, request payload, response DTO, authorization rule, business outcome, or database schema changes.
- Backend authorization remains authoritative; no development bypass or client-only permission decision.
- FE07 continues to own borrow-request mutations; FE11 request terminal states remain read-only.
- FE11 owns the permission matrix; FE12 owns role counts and reporting data.
- Audit raw values remain canonical and only their presentation is localized.
- FE04 Membership and FE09 Fine functionality outside the Admin Console remain untouched.
- No new runtime dependency is introduced.
- Every behavior change follows RED-GREEN-REFACTOR and preserves existing tests.
- Human visual acceptance remains separate from automated responsive evidence.

---

## File Map

### New production files

- `frontend/src/page/admin/AdminConsolePage.jsx` — route-level access guard, active section, logout, section composition.
- `frontend/src/page/admin/adminAccess.js` — pure stored-identity parsing.
- `frontend/src/page/admin/adminNavigation.js` — the canonical eight-entry navigation definition.
- `frontend/src/page/admin/components/AdminShell.jsx` — desktop sidebar and mobile navigation panel.
- `frontend/src/page/admin/components/AdminPageHeader.jsx` — section title, refresh, primary action.
- `frontend/src/page/admin/components/AdminFilterBar.jsx` — labeled responsive filter layout.
- `frontend/src/page/admin/components/AdminDateField.jsx` — persistent label around native date input.
- `frontend/src/page/admin/components/AdminActionButton.jsx` — icon plus visible action label.
- `frontend/src/page/admin/components/AdminEmptyState.jsx` — loading/error/empty/filtered-empty presentation.
- `frontend/src/page/admin/components/AdminPagination.jsx` — bounded pagination controls.
- `frontend/src/page/admin/dashboard/AdminDashboardSection.jsx` — dashboard data ownership and rendering.
- `frontend/src/page/admin/dashboard/adminDashboardViewModel.js` — positive top-five chart transformation.
- `frontend/src/page/admin/users/AdminUsersSection.jsx` — list, statistics, filters, detail, lifecycle and role UI.
- `frontend/src/page/admin/users/UserEditorModal.jsx` — create/edit form.
- `frontend/src/page/admin/users/UserRoleModal.jsx` — authoritative role diff UI.
- `frontend/src/page/admin/users/UserDetailDrawer.jsx` — safe detail DTO presentation.
- `frontend/src/page/admin/users/userPresentation.js` — primary role, date, validation and role-plan helpers.
- `frontend/src/page/admin/requests/AdminRequestsSection.jsx` — canonical request list/detail/export and FE07 mutation delegation.
- `frontend/src/page/admin/permissions/AdminPermissionsSection.jsx` — FE11 matrix plus FE12 counts.
- `frontend/src/page/admin/permissions/permissionPresentation.js` — localized labels and allow/deny decision objects.
- `frontend/src/page/admin/audit/AdminAuditSection.jsx` — canonical audit filters and safe rows.
- `frontend/src/page/admin/audit/adminAuditPresentation.js` — localized action/detail labels over raw values.
- `frontend/src/page/admin/library/AdminLibrarySection.jsx` — approved library read/presentation ownership.
- `frontend/src/page/admin/circulation/AdminCirculationSection.jsx` — approved circulation presentation and actions.
- `frontend/src/page/admin/admin-console.css` — Admin tokens, desktop, mobile, focus and reduced-motion rules.

### New or replaced tests

- `frontend/test/adminConsolePresentation.test.js`
- `frontend/test/adminConsoleStructure.test.js`
- `tests/e2e/fe11-admin-request-management.spec.js`

### Modified governance and compatibility files

- `.sdd/specs/feat-user-role-management/PLAN.md`
- `.sdd/specs/feat-user-role-management/TASKS.md`
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementFrontend.test.js`
- `frontend/test/userManagementApi.test.js`
- `frontend/test/adminRequestManagementFrontend.test.js`
- `frontend/test/appShellFrontend.test.js`
- `frontend/test/vietnameseUi.test.js`
- `.sdd/reviews/admin-console-full-refactor-validation-2026-07-22.md`

---

### Task 1: Activate The Bounded FE11 UX Refactor Records

**Files:**
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-07-22-admin-console-full-refactor-design.md`.
- Produces: task IDs `FE11-UXR01` through `FE11-UXR07` used by implementation comments and validation evidence.

- [ ] **Step 1: Add the approved plan slice**

Append this exact bounded slice to `PLAN.md`:

```markdown
## 18. Admin Console Full Frontend Refactor Slice

Decision: APPROVED BY HUMAN - 2026-07-22.

This Shell-only refactor preserves `/admin/users`, all FE11/FE07/FE12 API and ownership contracts, server authorization, safe DTOs, and database state. It splits the Admin Console into a guarded shell, shared presentation primitives, and independent Dashboard, Library, Circulation, Requests, Users, Permissions, and Audit modules.

Implementation order: governance -> pure presentation RED/GREEN -> shared shell -> Dashboard -> Users -> Requests -> Permissions -> Audit -> Library/Circulation -> legacy removal -> full validation and Azure Staging acceptance.
```

- [ ] **Step 2: Add the task group**

Append to `TASKS.md` with every item initially unchecked:

```markdown
## Admin Console Full Frontend Refactor Tasks

- [ ] **FE11-UXR01 - Add pure navigation, dashboard, permission, and audit presentation contracts.**
- [ ] **FE11-UXR02 - Build the responsive Admin shell and shared presentation primitives.**
- [ ] **FE11-UXR03 - Migrate Dashboard and User Management with desktop/mobile parity.**
- [ ] **FE11-UXR04 - Migrate Requests, Permissions, and Audit without changing API ownership.**
- [ ] **FE11-UXR05 - Migrate Library/Circulation and remove unreachable membership/payment Admin code.**
- [ ] **FE11-UXR06 - Cut over `/admin/users` and pass focused/full automated validation.**
- [ ] **FE11-UXR07 - Pass authenticated desktop/mobile Azure Staging acceptance and publish validation evidence.**
```

- [ ] **Step 3: Record the approved change**

Prepend to `CHANGELOG.md`:

```markdown
## 2026-07-22 - Admin Console full frontend refactor approved

- Approved a Shell-only modular refactor under `FE11-UXR01..UXR07`.
- Preserves all backend, API, authorization, database, FE07 mutation, FE11 permission/audit, and FE12 reporting contracts.
- Adds responsive user cards, decision-focused charts, labeled actions, localized audit presentation, distinct permission decisions, persistent filter labels, and explicit loading/error/empty states.
- Removes only unreachable Admin Console membership/payment code; canonical FE04 and FE09 functionality remains unchanged.
```

- [ ] **Step 4: Verify governance remains enforceable**

Run: `npm.cmd run trace:enforce`

Expected: exit `0`, all feature traceability remains above the enforcement threshold, and no FE11 requirement becomes `NOT STARTED`.

- [ ] **Step 5: Commit the governance activation**

```powershell
git add .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/CHANGELOG.md
git commit -m "docs: activate admin console frontend refactor"
```

---

### Task 2: Add Pure Presentation Contracts

**Files:**
- Create: `frontend/test/adminConsolePresentation.test.js`
- Create: `frontend/src/page/admin/adminNavigation.js`
- Create: `frontend/src/page/admin/dashboard/adminDashboardViewModel.js`
- Create: `frontend/src/page/admin/permissions/permissionPresentation.js`
- Create: `frontend/src/page/admin/audit/adminAuditPresentation.js`

**Interfaces:**
- Produces: `ADMIN_NAVIGATION`, `selectOperationalChartRows(rows, limit)`, `getPermissionDecision(allowed)`, `formatAuditAction(action)`, `formatAuditDetailKey(key)`.
- Consumes: canonical raw role, permission, audit, and chart values without mutating them.

- [ ] **Step 1: Write the failing pure-contract tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { ADMIN_NAVIGATION } from '../src/page/admin/adminNavigation.js';
import { selectOperationalChartRows } from '../src/page/admin/dashboard/adminDashboardViewModel.js';
import { getPermissionDecision } from '../src/page/admin/permissions/permissionPresentation.js';
import { formatAuditAction, formatAuditDetailKey } from '../src/page/admin/audit/adminAuditPresentation.js';

test('Admin navigation keeps the approved eight entries in order', () => {
  assert.deepEqual(ADMIN_NAVIGATION.map(({ id, label }) => [id, label]), [
    ['home', 'Trang chủ'], ['dashboard', 'Tổng quan'], ['library', 'Thư viện'],
    ['circulation', 'Quản lý mượn trả'], ['requests', 'Quản lý yêu cầu'],
    ['users', 'Quản lý người dùng'], ['permissions', 'Phân quyền'],
    ['audit', 'Nhật ký hoạt động'],
  ]);
});

test('Dashboard keeps only five positive chart rows', () => {
  assert.deepEqual(selectOperationalChartRows([
    { label: 'A', value: 0 }, { label: 'B', value: 6 }, { label: 'C', value: 5 },
    { label: 'D', value: 4 }, { label: 'E', value: 3 }, { label: 'F', value: 2 },
    { label: 'G', value: 1 },
  ]), [
    { label: 'B', value: 6 }, { label: 'C', value: 5 }, { label: 'D', value: 4 },
    { label: 'E', value: 3 }, { label: 'F', value: 2 },
  ]);
  assert.deepEqual(selectOperationalChartRows([{ label: 'A', value: 0 }]), []);
});

test('Permission decisions distinguish allowed and denied values', () => {
  assert.deepEqual(getPermissionDecision(true), { label: 'Có', symbol: '✓', tone: 'allowed' });
  assert.deepEqual(getPermissionDecision(false), { label: 'Không', symbol: '—', tone: 'denied' });
});

test('Audit presentation localizes known values and preserves unknown safe values', () => {
  assert.deepEqual(formatAuditAction('AUTH_LOGIN_SUCCESS'), {
    label: 'Đăng nhập thành công', raw: 'AUTH_LOGIN_SUCCESS', known: true,
  });
  assert.deepEqual(formatAuditAction('CUSTOM_SAFE_EVENT'), {
    label: 'CUSTOM_SAFE_EVENT', raw: 'CUSTOM_SAFE_EVENT', known: false,
  });
  assert.equal(formatAuditDetailKey('roleName'), 'Vai trò');
  assert.equal(formatAuditDetailKey('customKey'), 'customKey');
});
```

- [ ] **Step 2: Run RED and confirm the expected failure**

Run from `frontend`: `node --test test/adminConsolePresentation.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/page/admin/adminNavigation.js`.

- [ ] **Step 3: Implement the minimal pure modules**

```js
// adminNavigation.js
import { BookCopy, ClipboardList, Home, LayoutDashboard, Library, Shield, Users } from 'lucide-react';

export const ADMIN_NAVIGATION = Object.freeze([
  { id: 'home', icon: Home, label: 'Trang chủ', path: '/home' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { id: 'library', icon: Library, label: 'Thư viện' },
  { id: 'circulation', icon: BookCopy, label: 'Quản lý mượn trả' },
  { id: 'requests', icon: ClipboardList, label: 'Quản lý yêu cầu' },
  { id: 'users', icon: Users, label: 'Quản lý người dùng' },
  { id: 'permissions', icon: Shield, label: 'Phân quyền' },
  { id: 'audit', icon: ClipboardList, label: 'Nhật ký hoạt động' },
]);
```

```js
// adminDashboardViewModel.js
export function selectOperationalChartRows(rows = [], limit = 5) {
  return rows
    .map((row) => ({ ...row, value: Number(row?.value) || 0 }))
    .filter((row) => row.value > 0)
    .slice(0, limit);
}
```

```js
// permissionPresentation.js
export function getPermissionDecision(allowed) {
  return allowed
    ? { label: 'Có', symbol: '✓', tone: 'allowed' }
    : { label: 'Không', symbol: '—', tone: 'denied' };
}
```

```js
// adminAuditPresentation.js
const ACTION_LABELS = Object.freeze({
  AUTH_LOGIN_ATTEMPT: 'Thử đăng nhập',
  AUTH_LOGIN_SUCCESS: 'Đăng nhập thành công',
  AUTH_LOGOUT: 'Đăng xuất',
  USER_CREATE: 'Tạo người dùng',
  USER_UPDATE: 'Cập nhật người dùng',
  USER_DEACTIVATE: 'Vô hiệu hóa người dùng',
  USER_ROLE_ASSIGN: 'Gán vai trò',
  USER_ROLE_REVOKE: 'Thu hồi vai trò',
  REPORT_USERS_VIEW: 'Xem báo cáo người dùng',
});

const DETAIL_LABELS = Object.freeze({
  roleName: 'Vai trò', reportType: 'Loại báo cáo', status: 'Trạng thái',
  reason: 'Lý do', changedFields: 'Trường đã thay đổi',
});

export function formatAuditAction(action) {
  const raw = String(action || '').trim();
  return { label: ACTION_LABELS[raw] || raw || 'Chưa xác định', raw, known: Boolean(ACTION_LABELS[raw]) };
}

export function formatAuditDetailKey(key) {
  return DETAIL_LABELS[key] || key;
}
```

- [ ] **Step 4: Run GREEN**

Run from `frontend`: `node --test test/adminConsolePresentation.test.js`

Expected: PASS, 4 tests, 0 failures.

- [ ] **Step 5: Commit the pure contracts**

```powershell
git add frontend/test/adminConsolePresentation.test.js frontend/src/page/admin/adminNavigation.js frontend/src/page/admin/dashboard/adminDashboardViewModel.js frontend/src/page/admin/permissions/permissionPresentation.js frontend/src/page/admin/audit/adminAuditPresentation.js
git commit -m "test: define admin console presentation contracts"
```

---

### Task 3: Build Shared Admin Primitives And Styles

**Files:**
- Create: `frontend/test/adminConsoleStructure.test.js`
- Create: `frontend/src/page/admin/components/AdminPageHeader.jsx`
- Create: `frontend/src/page/admin/components/AdminFilterBar.jsx`
- Create: `frontend/src/page/admin/components/AdminDateField.jsx`
- Create: `frontend/src/page/admin/components/AdminActionButton.jsx`
- Create: `frontend/src/page/admin/components/AdminEmptyState.jsx`
- Create: `frontend/src/page/admin/components/AdminPagination.jsx`
- Create: `frontend/src/page/admin/admin-console.css`

**Interfaces:**
- Produces: presentation-only components with no API imports.
- Consumes: labels, values, callbacks, icons, and children from section modules.

- [ ] **Step 1: Write RED source-boundary tests**

The test reads each new file and asserts that shared components do not import `api/`, date fields have visible labels, action buttons render visible text, CSS includes focus/reduced-motion/mobile-card contracts, and pagination bounds page buttons to a five-page window.

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../src/page/admin/', import.meta.url);

test('Admin shared components are presentation only', async () => {
  for (const file of ['AdminPageHeader.jsx', 'AdminFilterBar.jsx', 'AdminDateField.jsx', 'AdminActionButton.jsx', 'AdminEmptyState.jsx', 'AdminPagination.jsx']) {
    const source = await readFile(new URL(`components/${file}`, root), 'utf8');
    assert.doesNotMatch(source, /api\//);
  }
});

test('Admin date and action controls expose visible labels', async () => {
  const date = await readFile(new URL('components/AdminDateField.jsx', root), 'utf8');
  const action = await readFile(new URL('components/AdminActionButton.jsx', root), 'utf8');
  assert.match(date, /<span>\{label\}<\/span>/);
  assert.match(date, /type="date"/);
  assert.match(action, /<span>\{label\}<\/span>/);
});

test('Admin CSS defines mobile cards, focus and reduced motion', async () => {
  const css = await readFile(new URL('admin-console.css', root), 'utf8');
  assert.match(css, /\.admin-user-cards/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 900px\)/);
});
```

- [ ] **Step 2: Run RED**

Run from `frontend`: `node --test test/adminConsoleStructure.test.js`

Expected: FAIL because `components/AdminPageHeader.jsx` does not exist.

- [ ] **Step 3: Implement the shared primitives**

Use these exact public signatures:

```jsx
export function AdminPageHeader({ eyebrow, title, refreshing = false, onRefresh, primaryAction })
export function AdminFilterBar({ children, actions, className = '' })
export function AdminDateField({ id, label, value, onChange, min, max })
export function AdminActionButton({ icon: Icon, label, tone = 'neutral', disabled = false, title, onClick })
export function AdminEmptyState({ icon: Icon, title, description, action })
export function AdminPagination({ page, totalItems, pageSize = 8, onPageChange })
```

`AdminDateField` must render `<label htmlFor={id}><span>{label}</span><input id={id} type="date" value={value} onChange={onChange} min={min} max={max} /></label>`. `AdminActionButton` must render `<Icon aria-hidden="true" />` and `<span>{label}</span>`. `AdminPagination` must calculate a centered page window of at most five page numbers and always expose Previous/Next controls.

- [ ] **Step 4: Add the style foundation**

Start `admin-console.css` with the approved tokens and required accessibility contracts:

```css
.admin-console {
  --admin-ink: #2a2118;
  --admin-paper: #fffdf8;
  --admin-canvas: #faf6ef;
  --admin-brass: #a87532;
  --admin-brass-dark: #7b5528;
  --admin-success: #18794e;
  --admin-danger: #b42318;
  --admin-muted: #6b6153;
  --admin-line: #e7ddca;
  min-height: 100vh;
  background: var(--admin-canvas);
  color: var(--admin-ink);
  font-family: var(--sans);
}

.admin-console :where(button, input, select, textarea):focus-visible {
  outline: 3px solid color-mix(in srgb, var(--admin-brass) 35%, transparent);
  outline-offset: 2px;
}

.admin-user-cards { display: none; }

@media (max-width: 900px) {
  .admin-user-table { display: none; }
  .admin-user-cards { display: grid; gap: 12px; }
  .admin-filter-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .admin-console *, .admin-console *::before, .admin-console *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: Run GREEN and lint the new files**

Run from `frontend`:

```powershell
node --test test/adminConsoleStructure.test.js
npm.cmd run lint
```

Expected: both commands exit `0`.

- [ ] **Step 6: Commit shared presentation**

```powershell
git add frontend/test/adminConsoleStructure.test.js frontend/src/page/admin/components frontend/src/page/admin/admin-console.css
git commit -m "feat: add admin console presentation primitives"
```

---

### Task 4: Build The Guarded Responsive Shell

**Files:**
- Create: `frontend/src/page/admin/adminAccess.js`
- Create: `frontend/src/page/admin/components/AdminShell.jsx`
- Create: `frontend/src/page/admin/AdminConsolePage.jsx`
- Modify: `frontend/test/adminConsoleStructure.test.js`

**Interfaces:**
- `readStoredAdminAccess()` returns `{ authenticated, isAdmin, user }`.
- `AdminShell` consumes `activeSection`, `currentUser`, `onSectionChange`, `onHome`, `onLogout`, and `children`.
- `AdminConsolePage` owns `activeSection = 'users'` and renders no protected section before access succeeds.

- [ ] **Step 1: Add failing shell tests**

Assert that the shell imports `ADMIN_NAVIGATION`, uses `aria-current`, exposes `aria-expanded`/`aria-controls` on a `Menu` button, handles Escape, and that `AdminConsolePage` performs `<Navigate to="/login" replace />` and `<Navigate to="/home" replace />` before section rendering.

- [ ] **Step 2: Run RED**

Run from `frontend`: `node --test test/adminConsoleStructure.test.js`

Expected: FAIL because `AdminShell.jsx`, `adminAccess.js`, and `AdminConsolePage.jsx` are absent.

- [ ] **Step 3: Move the existing access parser without semantic changes**

Move `readStoredAdminAccess` from the current `UserManagement.jsx` into `adminAccess.js`, keep its storage keys and role normalization unchanged, and export it.

- [ ] **Step 4: Implement `AdminShell`**

The shell must derive every navigation control from `ADMIN_NAVIGATION`, map `home` to `onHome`, map the other entries to `onSectionChange(id)`, close the mobile panel after navigation, close on Escape, and return focus to the Menu trigger. It must not import feature APIs.

- [ ] **Step 5: Implement the route-level composition contract**

`AdminConsolePage` starts with:

```jsx
const access = readStoredAdminAccess();
const [activeSection, setActiveSection] = useState('users');

if (!access.authenticated) return <Navigate to="/login" replace />;
if (!access.isAdmin) return <Navigate to="/home" replace />;
```

For this task it may render an explicit section placeholder inside `AdminShell`; it is not wired from `UserManagement.jsx` until Task 11.

- [ ] **Step 6: Run GREEN, full frontend tests and build**

Run from `frontend`:

```powershell
node --test test/adminConsoleStructure.test.js
npm.cmd test
npm.cmd run build
```

Expected: all commands exit `0`; the live route is still backed by the legacy entry at this checkpoint.

- [ ] **Step 7: Commit the shell**

```powershell
git add frontend/src/page/admin/adminAccess.js frontend/src/page/admin/components/AdminShell.jsx frontend/src/page/admin/AdminConsolePage.jsx frontend/test/adminConsoleStructure.test.js
git commit -m "feat: add guarded responsive admin shell"
```

---

### Task 5: Migrate Dashboard With Decision-Focused Charts

**Files:**
- Create: `frontend/src/page/admin/dashboard/AdminDashboardSection.jsx`
- Modify: `frontend/test/adminConsoleStructure.test.js`
- Modify: `frontend/src/page/admin/AdminConsolePage.jsx`

**Interfaces:**
- `AdminDashboardSection()` owns `adminApi.dashboard()` loading/error/last-success state.
- It consumes `selectOperationalChartRows` before rendering every chart.
- It renders `AdminPageHeader`, approved summary cards, `AdminLineChart`, and `AdminEmptyState`.

- [ ] **Step 1: Add RED dashboard structure tests**

Assert that the new section calls `adminApi.dashboard()`, guards stale responses with `createLatestRequestGuard`, passes all three datasets through `selectOperationalChartRows`, and renders `Dữ liệu sẽ xuất hiện khi có giao dịch phù hợp.` for an empty transformed dataset.

- [ ] **Step 2: Run RED**

Run from `frontend`: `node --test test/adminConsolePresentation.test.js test/adminConsoleStructure.test.js`

Expected: FAIL because `AdminDashboardSection.jsx` is absent.

- [ ] **Step 3: Move and tighten the chart implementation**

Move the existing `formatChartLabel` and `AdminLineChart` presentation into `AdminDashboardSection.jsx`. The section must transform each dataset first:

```js
const mostBorrowed = selectOperationalChartRows(data?.charts?.mostBorrowed);
const overdue = selectOperationalChartRows(data?.charts?.overdue);
const returnedToday = selectOperationalChartRows(data?.charts?.returnedToday);
```

`AdminLineChart` must treat `rows.length === 0` as its only empty branch because all-zero rows have already been removed.

- [ ] **Step 4: Preserve refresh behavior**

Use one `createLatestRequestGuard()` stored in `useRef`, keep the last successful `data` after a later error, show `Đang cập nhật...` during refresh, and show an inline retry action after failure.

- [ ] **Step 5: Wire Dashboard into `AdminConsolePage`**

Render `<AdminDashboardSection />` only when `activeSection === 'dashboard'`.

- [ ] **Step 6: Run GREEN and build**

Run from `frontend`:

```powershell
node --test test/adminConsolePresentation.test.js test/adminConsoleStructure.test.js
npm.cmd run lint
npm.cmd run build
```

Expected: exit `0` for every command.

- [ ] **Step 7: Commit Dashboard**

```powershell
git add frontend/src/page/admin/dashboard frontend/src/page/admin/AdminConsolePage.jsx frontend/test/adminConsoleStructure.test.js
git commit -m "feat: refactor admin dashboard presentation"
```

---

### Task 6: Migrate User Management And Mobile Cards

**Files:**
- Create: `frontend/src/page/admin/users/AdminUsersSection.jsx`
- Create: `frontend/src/page/admin/users/UserEditorModal.jsx`
- Create: `frontend/src/page/admin/users/UserRoleModal.jsx`
- Create: `frontend/src/page/admin/users/UserDetailDrawer.jsx`
- Create: `frontend/src/page/admin/users/userPresentation.js`
- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `frontend/test/userManagementApi.test.js`
- Modify: `frontend/test/adminConsoleStructure.test.js`
- Modify: `frontend/src/page/admin/AdminConsolePage.jsx`
- Modify: `frontend/src/page/admin/admin-console.css`

**Interfaces:**
- `AdminUsersSection({ onToast })` owns user list/statistics/roles/detail/mutation state.
- `userPresentation.js` exports `validateUserForm`, `normalizeEditableRoleCatalog`, `buildRoleMutationPlan`, `getPrimaryRole`, and `formatAdminDate`.
- Desktop table and mobile cards consume the same `users` array and the same action callbacks.

- [ ] **Step 1: Redirect existing source-contract tests to the new owners and add RED mobile assertions**

Update tests so form/role helpers are read or imported from `users/userPresentation.js`, API behavior is asserted in `AdminUsersSection.jsx`, and the structure test requires both `.admin-user-table` and `.admin-user-cards`. Add assertions that visible action text contains `Chỉnh sửa`, `Phân quyền`, and `Vô hiệu hóa`.

- [ ] **Step 2: Run RED**

Run from `frontend`:

```powershell
node --test test/userManagementFrontend.test.js test/userManagementApi.test.js test/adminConsoleStructure.test.js
```

Expected: FAIL because the new user module files do not exist.

- [ ] **Step 3: Move pure user helpers**

Move the current implementations of `validateUserForm`, `normalizeEditableRoleCatalog`, `buildRoleMutationPlan`, `getPrimaryRole`, and `formatDate` into `userPresentation.js`. Rename only `formatDate` to `formatAdminDate` to avoid ambiguous imports. Preserve validation limits and role mutation order exactly.

- [ ] **Step 4: Move modals and drawer without changing business behavior**

Move `UserModal` to `UserEditorModal`, `RoleModal` to `UserRoleModal`, and the current user-detail JSX into `UserDetailDrawer`. Preserve effective-version payloads, librarian fields, setup-note behavior, catalog validation, authoritative reconciliation, and safe detail summaries.

- [ ] **Step 5: Implement desktop and mobile rendering from one data source**

The desktop container must use the approved eight-column table contract:

```jsx
<div className="admin-user-table" aria-label="Danh sách người dùng dạng bảng">
  <table aria-label="Danh sách người dùng">
    <thead><tr>
      <th>Người dùng</th><th>Username</th><th>Số điện thoại</th><th>Vai trò</th>
      <th>Trạng thái</th><th>Ngày tạo</th><th>Lần đăng nhập</th><th>Thao tác</th>
    </tr></thead>
    <tbody>{users.map((user) => <UserTableRow key={user.userId} user={user} />)}</tbody>
  </table>
</div>
```

The mobile container must map the same `users`:

```jsx
<div className="admin-user-cards" aria-label="Danh sách người dùng dạng thẻ">
  {users.map((user) => (
    <article key={user.userId} className="admin-user-card">
      <button type="button" className="admin-user-card-summary" onClick={() => openUserDetail(user.userId)}>
        <strong>{user.fullName || 'Chưa cập nhật tên'}</strong>
        <span>{user.email}</span>
        <StatusBadge status={user.status} />
      </button>
      <dl>
        <div><dt>Vai trò</dt><dd><div className="admin-badge-row">{(user.roles || []).map((role) => <RoleBadge key={role} role={role} />)}</div></dd></div>
        <div><dt>Lần đăng nhập</dt><dd>{formatAdminDate(user.lastLoginAt)}</dd></div>
      </dl>
      <div className="admin-user-card-actions">
        <AdminActionButton icon={Edit2} label="Chỉnh sửa" onClick={() => openEditModal(user)} />
        <AdminActionButton icon={Shield} label="Phân quyền" onClick={() => openRoleModal(user)} />
        <AdminActionButton icon={PowerOff} label="Vô hiệu hóa" tone="danger" disabled={!['ACTIVE', 'LOCKED'].includes(user.status)} title="Tài khoản này đã ngừng hoạt động." onClick={() => deactivateUser(user)} />
      </div>
    </article>
  ))}
</div>
```

Every action uses `AdminActionButton` with visible labels. Disabled deactivation uses title `Tài khoản này đã ngừng hoạt động.`.

- [ ] **Step 6: Preserve data and mutation ownership**

Move `loadUsers`, `refreshUserDirectory`, `loadUserStatistics`, `loadRoles`, `openUserDetail`, create/edit/deactivate, and role-save logic into `AdminUsersSection`. Preserve independent errors, stale guards, safe DTO fields, optimistic timestamps, no-op role saves, assignment-before-revocation, and reconciliation after partial failure.

- [ ] **Step 7: Wire Users and styles**

Render `<AdminUsersSection onToast={setToast} />` for `activeSection === 'users'`. At widths above 900px hide cards; at or below 900px hide the table and show cards. At 1366px apply controlled `text-overflow: ellipsis` to email/username cells instead of `overflow-wrap: anywhere`.

- [ ] **Step 8: Run GREEN and affected regressions**

Run from `frontend`:

```powershell
node --test test/userManagementFrontend.test.js test/userManagementApi.test.js test/adminConsolePresentation.test.js test/adminConsoleStructure.test.js
npm.cmd run lint
npm.cmd run build
```

Expected: all commands exit `0`.

- [ ] **Step 9: Commit User Management**

```powershell
git add frontend/src/page/admin/users frontend/src/page/admin/AdminConsolePage.jsx frontend/src/page/admin/admin-console.css frontend/test/userManagementFrontend.test.js frontend/test/userManagementApi.test.js frontend/test/adminConsoleStructure.test.js
git commit -m "feat: refactor admin user management experience"
```

---

### Task 7: Migrate Request Management Without Ownership Drift

**Files:**
- Create: `frontend/src/page/admin/requests/AdminRequestsSection.jsx`
- Modify: `frontend/test/adminRequestManagementFrontend.test.js`
- Modify: `frontend/test/adminConsoleStructure.test.js`
- Modify: `frontend/src/page/admin/AdminConsolePage.jsx`
- Modify: `frontend/src/page/admin/admin-console.css`

**Interfaces:**
- `AdminRequestsSection({ onToast })` owns filters, server pagination, detail, DOCX export, and FE07 mutation delegation.
- Consumes: `adminApi.requests`, `adminApi.requestDetail`, existing request/export helpers, `borrowingApi.approveRequest`, and `borrowingApi.rejectRequest` exactly as the legacy flow does.

- [ ] **Step 1: Move request contract tests to the new module and add RED labeled-date assertions**

Require `AdminDateField` for `request-from` and `request-to`, preserve `Lọc trạng thái`, page size 20, terminal-state controls, canonical detail fetch, and DOCX export across all filtered pages.

- [ ] **Step 2: Run RED**

Run from `frontend`: `node --test test/adminRequestManagementFrontend.test.js test/adminConsoleStructure.test.js`

Expected: FAIL because `AdminRequestsSection.jsx` is absent.

- [ ] **Step 3: Move the request state and handlers**

Move `loadRequests`, `applyRequestFilters`, `openRequestDetail`, `exportRequests`, request detail state, and FE07 approve/reject handlers into `AdminRequestsSection`. Preserve raw statuses, server page/limit totals, invalid date-range guard, frozen export filters, and `409 BORROW_REQUEST_NOT_PENDING` behavior.

- [ ] **Step 4: Replace the dense toolbar**

Use `AdminFilterBar` with search/status/date fields in `.admin-filter-grid` and Apply/Reset/Export in `.admin-filter-actions`. Render Reset only when any filter differs from `{ q: '', status: 'ALL', from: '', to: '' }`.

- [ ] **Step 5: Wire Requests and verify**

Run from `frontend`:

```powershell
node --test test/adminRequestManagementFrontend.test.js test/adminConsoleStructure.test.js
npm.cmd run lint
npm.cmd run build
```

Expected: all commands exit `0`.

- [ ] **Step 6: Commit Request Management**

```powershell
git add frontend/src/page/admin/requests frontend/src/page/admin/AdminConsolePage.jsx frontend/src/page/admin/admin-console.css frontend/test/adminRequestManagementFrontend.test.js frontend/test/adminConsoleStructure.test.js
git commit -m "feat: refactor admin request management layout"
```

---

### Task 8: Migrate Permissions With Distinct Decisions

**Files:**
- Create: `frontend/src/page/admin/permissions/AdminPermissionsSection.jsx`
- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `frontend/src/page/admin/AdminConsolePage.jsx`
- Modify: `frontend/src/page/admin/admin-console.css`

**Interfaces:**
- `AdminPermissionsSection()` independently loads `adminApi.permissions()` and `reportApi.users()`.
- Consumes: existing `buildPermissionRoleSummary`, `buildPermissionModuleCoverage`, `roleAllowsPermission`, localized role/module/permission labels, and `getPermissionDecision`.

- [ ] **Step 1: Add RED copy and decision assertions**

Require `Dữ liệu phân quyền`, `Thống kê tài khoản theo vai trò`, the multi-role explanation, and classes `permission-decision allowed` / `permission-decision denied`. Reject `Ma trận FE11` and `Thống kê FE12`.

- [ ] **Step 2: Run RED**

Run from `frontend`: `node --test test/userManagementFrontend.test.js test/adminConsolePresentation.test.js`

Expected: FAIL because `AdminPermissionsSection.jsx` is absent.

- [ ] **Step 3: Move independent loading behavior**

Move permission and user-statistics loaders into the section. Preserve last-success values and independent retry controls. Do not add a hardcoded permission matrix or derive counts from paginated users.

- [ ] **Step 4: Render semantic decisions**

For every role/permission cell:

```jsx
const decision = getPermissionDecision(roleAllowsPermission(permission, role.roleName));
return <span className={`permission-decision ${decision.tone}`}><b aria-hidden="true">{decision.symbol}</b>{decision.label}</span>;
```

Use sticky table headers and neutral denied styling; do not communicate decisions by color alone.

- [ ] **Step 5: Wire, verify and commit**

Run from `frontend`:

```powershell
node --test test/adminConsolePresentation.test.js test/userManagementFrontend.test.js
npm.cmd run lint
npm.cmd run build
```

Expected: all commands exit `0`.

```powershell
git add frontend/src/page/admin/permissions frontend/src/page/admin/AdminConsolePage.jsx frontend/src/page/admin/admin-console.css frontend/test/userManagementFrontend.test.js
git commit -m "feat: clarify admin permission decisions"
```

---

### Task 9: Migrate Audit Logs With Localized Presentation

**Files:**
- Create: `frontend/src/page/admin/audit/AdminAuditSection.jsx`
- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `frontend/src/page/admin/AdminConsolePage.jsx`
- Modify: `frontend/src/page/admin/admin-console.css`

**Interfaces:**
- `AdminAuditSection()` owns the canonical `q`, `action`, `actorId`, `from`, `to`, page, and limit filter state.
- Consumes: `formatAuditAction`, `formatAuditDetailKey`, the safe DTO-only detail formatter, and `adminApi.auditLogs`.

- [ ] **Step 1: Add RED audit presentation assertions**

Keep the exact filter param builder assertions. Require persistent visible labels `Hành động`, `Mã người thực hiện`, `Từ ngày`, and `Đến ngày`. Require `formatAuditAction(log.action)` and `formatAuditDetailKey(key)`. Reject direct `<span>{log.action}</span>` rendering.

- [ ] **Step 2: Run RED**

Run from `frontend`: `node --test test/userManagementFrontend.test.js test/adminConsolePresentation.test.js`

Expected: FAIL because `AdminAuditSection.jsx` is absent.

- [ ] **Step 3: Move audit state and safe DTO formatting**

Move `buildAuditLogParams`, safe detail-entry filtering, target projection, value formatting, loader, independent last-success/error state, and pagination into `AdminAuditSection`. Preserve authorization, pagination, redaction, raw action filter values, and unknown safe detail keys.

- [ ] **Step 4: Render localized labels over raw values**

Render each action as:

```jsx
const action = formatAuditAction(log.action);
<span className="admin-audit-action" title={action.raw}>{action.label}</span>
```

Render each safe detail `dt` with `formatAuditDetailKey(key)` and keep the raw value formatter unchanged.

- [ ] **Step 5: Replace the audit toolbar and verify**

Use a labeled responsive filter grid. Keep `Áp dụng` and `Xóa lọc` in a separate action row. Run:

```powershell
node --test test/adminConsolePresentation.test.js test/userManagementFrontend.test.js
npm.cmd run lint
npm.cmd run build
```

Expected: all commands exit `0`.

- [ ] **Step 6: Commit Audit**

```powershell
git add frontend/src/page/admin/audit frontend/src/page/admin/AdminConsolePage.jsx frontend/src/page/admin/admin-console.css frontend/test/userManagementFrontend.test.js
git commit -m "feat: localize admin audit presentation"
```

---

### Task 10: Migrate Library And Circulation, Then Remove Legacy Hidden Paths

**Files:**
- Create: `frontend/src/page/admin/library/AdminLibrarySection.jsx`
- Create: `frontend/src/page/admin/circulation/AdminCirculationSection.jsx`
- Modify: `frontend/src/page/admin/AdminConsolePage.jsx`
- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `frontend/test/membershipFrontend.test.js`
- Modify: `frontend/test/fineManagementFrontend.test.js`

**Interfaces:**
- `AdminLibrarySection({ onToast })` preserves approved FE05 read-only book ownership and existing metadata presentation/actions.
- `AdminCirculationSection({ onToast })` preserves approved FE07 circulation behavior.
- Neither section imports FE04 membership components nor local-storage fine helpers.

- [ ] **Step 1: Add RED ownership tests**

Require the new Library section to avoid duplicate FE05 book mutation adapters, the Circulation section to use the existing borrowing API, and all Admin module sources to exclude `getFineRecords`, `saveFineRecords`, `MembershipApplicationsTable`, `MembershipFilter`, `MembershipReviewModal`, `activeSection === 'membership'`, and `activeSection === 'payments'`.

- [ ] **Step 2: Run RED**

Run from `frontend`:

```powershell
node --test test/userManagementFrontend.test.js test/membershipFrontend.test.js test/fineManagementFrontend.test.js
```

Expected: FAIL because new section files are absent and legacy imports still exist in `UserManagement.jsx`.

- [ ] **Step 3: Move approved Library behavior**

Move library resource tabs, loaders, read-only book table, metadata presentation, export, and any already-approved metadata action handlers into `AdminLibrarySection`. Preserve the canonical FE05 navigation for book mutations and do not introduce `adminApi.createBook`, `updateBook`, or `deactivateBook`.

- [ ] **Step 4: Move approved Circulation behavior**

Move circulation filters, list, renew/return UI, pagination, and existing borrowing API calls into `AdminCirculationSection` without changing request/status values or validation.

- [ ] **Step 5: Remove only unreachable Admin Console legacy code**

Delete membership/payment imports, state, loaders, section metadata, render branches, and local-storage fine review handlers from the Admin Console implementation. Do not edit FE04 membership production files or FE09 fine production files.

- [ ] **Step 6: Wire, verify and commit**

Run from `frontend`:

```powershell
node --test test/userManagementFrontend.test.js test/membershipFrontend.test.js test/fineManagementFrontend.test.js test/borrowingFrontend.test.js
npm.cmd run lint
npm.cmd run build
```

Expected: all commands exit `0`.

```powershell
git add frontend/src/page/admin/library frontend/src/page/admin/circulation frontend/src/page/admin/AdminConsolePage.jsx frontend/test/userManagementFrontend.test.js frontend/test/membershipFrontend.test.js frontend/test/fineManagementFrontend.test.js
git commit -m "refactor: complete admin section migration"
```

---

### Task 11: Cut Over The Compatibility Entry And Responsive E2E

**Files:**
- Replace: `frontend/src/page/UserManagement.jsx`
- Modify: `frontend/test/appShellFrontend.test.js`
- Modify: `frontend/test/appCodeSplitting.test.js`
- Modify: `frontend/test/vietnameseUi.test.js`
- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `tests/e2e/fe11-admin-request-management.spec.js`

**Interfaces:**
- `UserManagement.jsx` exports the new page without changing `App.jsx` or `/admin/users`.
- E2E continues to use the real system test server and canonical Admin login.

- [ ] **Step 1: Add RED compatibility and responsive assertions**

Require the compatibility entry to be exactly:

```jsx
export { default } from './admin/AdminConsolePage';
```

Update source scans to read `page/admin/**/*.jsx` plus `admin-console.css`. In the E2E mobile block replace `internalTableScroll === true` with these expectations:

```js
await expect(page.locator('.admin-user-table')).toBeHidden();
await expect(page.locator('.admin-user-cards')).toBeVisible();
await expect(page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).first()).toBeVisible();
expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
```

At 1366px assert the table is visible, cards are hidden, and no page overflow exists.

- [ ] **Step 2: Run RED against the old entry**

Run from repo root:

```powershell
npm.cmd --prefix frontend test
npx.cmd playwright test tests/e2e/fe11-admin-request-management.spec.js --project=chromium
```

Expected: frontend contract or responsive E2E fails because the old monolith is still the route entry and mobile still uses internal table scrolling.

- [ ] **Step 3: Replace the compatibility entry and update source scans**

Replace `UserManagement.jsx` with the one-line export above. Update tests that previously read only that file to read their new owning module or concatenate the Admin module tree for localization/source checks.

- [ ] **Step 4: Run GREEN focused/full frontend and E2E**

Run from repo root:

```powershell
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npx.cmd playwright test tests/e2e/fe11-admin-request-management.spec.js --project=chromium
```

Expected: all commands exit `0`; E2E proves mobile cards, laptop table, request behavior, and no page overflow.

- [ ] **Step 5: Commit the cutover**

```powershell
git add frontend/src/page/UserManagement.jsx frontend/test tests/e2e/fe11-admin-request-management.spec.js
git commit -m "refactor: cut over modular admin console"
```

---

### Task 12: Full Validation, Evidence, Azure Staging Deployment And Acceptance

**Files:**
- Create: `.sdd/reviews/admin-console-full-refactor-validation-2026-07-22.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Interfaces:**
- Consumes: completed `FE11-UXR01..UXR06`, clean automated results, browser screenshots, workflow run URL and deployed SHA.
- Produces: `FE11-UXR07` acceptance evidence and an honest release boundary between automated checks and human signoff.

- [ ] **Step 1: Run fresh full automated validation**

Run from repo root:

```powershell
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd --prefix backend test -- --runInBand
npm.cmd run trace:enforce
npm.cmd run test:deployment
npm.cmd run test:e2e
git diff --check
git status --short
```

Expected: every command exits `0`; `git diff --check` prints nothing; `git status --short` lists only intended governance/evidence updates before their commit.

- [ ] **Step 2: Perform local/browser visual acceptance**

Using an authenticated Admin session, inspect at 1366x768 and 390x844:

- Dashboard: no all-zero chart and no more than five plotted rows.
- Users: laptop table readable; mobile cards visible; labeled actions; no page overflow.
- Requests: labeled dates, responsive filters, pending/terminal actions unchanged.
- Permissions: no FE11/FE12 copy and allowed/denied decisions are distinct.
- Audit: localized action labels, raw values available through title/secondary text, labeled filters.
- Keyboard focus and reduced-motion behavior.

Do not mark human acceptance complete until the reviewer explicitly confirms it.

- [ ] **Step 3: Write the validation record**

Record exact commands, pass/fail counts, commit SHA, browser viewport evidence, known limitations, and the separation between automated evidence and human approval. Do not write `PASS` for any command that was not run in this execution.

- [ ] **Step 4: Close completed task records**

Mark `FE11-UXR01..UXR06` complete after their evidence exists. Mark `FE11-UXR07` complete only after the authenticated Staging walkthrough and human visual approval.

- [ ] **Step 5: Commit the reviewed implementation/evidence set**

```powershell
git add .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/reviews/admin-console-full-refactor-validation-2026-07-22.md
git commit -m "docs: validate admin console frontend refactor"
```

- [ ] **Step 6: Push the branch and deploy Azure Staging**

```powershell
git push origin chore/release-closeout-reconciliation
gh workflow run deploy-staging.yml --ref chore/release-closeout-reconciliation
gh run list --workflow deploy-staging.yml --branch chore/release-closeout-reconciliation --limit 1
```

Use the returned run ID:

```powershell
$runId = gh run list --workflow deploy-staging.yml --branch chore/release-closeout-reconciliation --limit 1 --json databaseId --jq '.[0].databaseId'
gh run watch $runId --exit-status
gh run view $runId --json status,conclusion,headSha,url,jobs
```

Expected: backend deploy, frontend deploy, and smoke-test jobs all conclude `success`; `headSha` equals the pushed branch SHA.

- [ ] **Step 7: Verify deployed assets and health**

```powershell
Invoke-RestMethod -Uri 'https://app-library-api-staging-nhat714.azurewebsites.net/health' | ConvertTo-Json -Compress
```

Expected: JSON contains `"status":"ok"`.

Open `https://lemon-wave-04db51100.7.azurestaticapps.net/admin/users` in the authenticated browser, repeat the desktop/mobile acceptance checklist, and record the deployed workflow URL and SHA in the validation record.

- [ ] **Step 8: Final diff and worktree check**

```powershell
git diff --check
git status --short --branch
git log -5 --oneline
```

Expected: no unstaged product/evidence changes, branch points at the deployed SHA, and the documented validation commit is present.

---

## Plan Self-Review Checklist

- Design sections 1-16 map to at least one task above.
- Every product-code task begins with a failing test and records the expected RED reason.
- `ADMIN_NAVIGATION`, `selectOperationalChartRows`, `getPermissionDecision`, `formatAuditAction`, and `formatAuditDetailKey` use consistent names across tasks.
- `/admin/users`, the default `users` section, FE07 mutation ownership, FE11 permission/audit ownership, and FE12 statistics ownership remain unchanged.
- FE04/FE09 canonical files are regression-tested but not modified.
- No runtime dependency, backend change, schema change, separate Admin URL, or unapproved business behavior is introduced.
- Automated responsive evidence and human visual approval remain separate.
