# Library App Shell UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one role-aware, Vietnamese app shell with route-derived navigation, a real mobile drawer, a functional profile header, and a role-aware `/home` dashboard.

**Architecture:** Keep navigation and audience decisions in pure utilities that can be tested with Node's built-in test runner. `AppLayout` owns the responsive shell and composes `Header`; a new route wrapper selects the existing public home or a protected role dashboard without changing backend contracts.

**Tech Stack:** React 19, React Router 7, lucide-react, MUI Avatar/Menu components already installed, CSS in `frontend/src/styles/app-shell.css`, Node test runner.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-14-library-ux-system-design.md`.
- Preserve Node.js + Express.js, React + Bootstrap/MUI, SQL Server, and REST contracts.
- Do not add dependencies.
- Do not change backend authorization or business rules.
- Remove the non-functional global header search; keep search local to owning pages.
- `/home` is public browse for guests and a role-aware dashboard for authenticated users.
- Protected-page labels are Vietnamese; source identifiers and test names remain English.
- Keep tokens, OTPs, passwords, SMTP settings, and personal data out of source and tests.
- Use TDD for each behavior change and commit after each independently reviewable task.

---

## File Structure

- Create `frontend/src/utils/appNavigation.js`: pure role, route, and dashboard-audience decisions.
- Create `frontend/test/appShellFrontend.test.js`: contract and source-level regression tests.
- Modify `frontend/src/component/layout/AppLayout.jsx`: responsive drawer, active route, shared header composition.
- Modify `frontend/src/component/layout/Header.jsx`: mobile menu trigger and profile-only header; remove global search.
- Delete `frontend/src/component/layout/Sidebar.jsx`: unused legacy layout implementation.
- Create `frontend/src/page/dashboard/HomeRoutePage.jsx`: guest/authenticated route selection.
- Create `frontend/src/page/dashboard/RoleDashboardPage.jsx`: member/staff dashboard surface.
- Create `frontend/src/page/dashboard/dashboardViewModel.js`: pure API response summary mapping.
- Modify `frontend/src/App.jsx`: route `/home` through `HomeRoutePage`.
- Modify `frontend/src/styles/app-shell.css`: drawer, backdrop, header, dashboard, and mobile behavior.

---

### Task 1: Navigation and Dashboard Contracts

**Files:**
- Create: `frontend/src/utils/appNavigation.js`
- Create: `frontend/test/appShellFrontend.test.js`

**Interfaces:**
- Produces: `APP_NAV_GROUPS`, `getVisibleNavigation(roles)`, `getActiveNavigationKey(pathname)`, `getDashboardAudience(roles)`.
- Consumes: role names `MEMBER`, `LIBRARIAN`, and `ADMIN` already stored in `authUser.roles`.

- [ ] **Step 1: Write the failing contract tests**

Create `frontend/test/appShellFrontend.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  getActiveNavigationKey,
  getDashboardAudience,
  getVisibleNavigation,
} from '../src/utils/appNavigation.js';

test('navigation visibility follows stored roles', () => {
  assert.deepEqual(
    getVisibleNavigation(['MEMBER']).map((item) => item.key),
    ['home', 'borrow-request', 'borrowing-history', 'my-reservations'],
  );
  assert.deepEqual(
    getVisibleNavigation(['LIBRARIAN']).map((item) => item.key),
    ['home', 'borrow-requests-admin', 'process-returns', 'reservations-librarian', 'member-details', 'borrowing-report', 'inventory-report', 'user-statistics'],
  );
});

test('active navigation is derived from the current URL', () => {
  assert.equal(getActiveNavigationKey('/home'), 'home');
  assert.equal(getActiveNavigationKey('/borrowing/history'), 'borrowing-history');
  assert.equal(getActiveNavigationKey('/reports/inventory'), 'inventory-report');
  assert.equal(getActiveNavigationKey('/unknown'), null);
});

test('dashboard audience is role aware', () => {
  assert.equal(getDashboardAudience([]), 'guest');
  assert.equal(getDashboardAudience(['MEMBER']), 'member');
  assert.equal(getDashboardAudience(['LIBRARIAN']), 'staff');
  assert.equal(getDashboardAudience(['ADMIN']), 'staff');
});

test('shared header has no decorative global search', async () => {
  const source = await readFile(new URL('../src/component/layout/Header.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /placeholder="Search books, members, loans/);
  assert.doesNotMatch(source, /className="app-search"/);
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```powershell
cd frontend
npm test -- --test-name-pattern="navigation|dashboard audience|decorative global search"
```

Expected: FAIL because `src/utils/appNavigation.js` does not exist and the old search is present.

- [ ] **Step 3: Implement the pure navigation contract**

Create `frontend/src/utils/appNavigation.js`:

```js
export const APP_NAV_GROUPS = [
  {
    label: 'Thành viên',
    roles: ['MEMBER'],
    items: [
      { key: 'borrow-request', label: 'Mượn sách', path: '/borrowing/new' },
      { key: 'borrowing-history', label: 'Lịch sử mượn', path: '/borrowing/history' },
      { key: 'my-reservations', label: 'Đặt chỗ của tôi', path: '/reservations/mine' },
    ],
  },
  {
    label: 'Thủ thư',
    roles: ['LIBRARIAN', 'ADMIN'],
    items: [
      { key: 'borrow-requests-admin', label: 'Yêu cầu mượn', path: '/librarian/borrow-requests' },
      { key: 'process-returns', label: 'Xử lý trả sách', path: '/librarian/returns' },
      { key: 'reservations-librarian', label: 'Quản lý đặt chỗ', path: '/librarian/reservations' },
      { key: 'member-details', label: 'Chi tiết thành viên', path: '/librarian/members' },
    ],
  },
  {
    label: 'Báo cáo',
    roles: ['LIBRARIAN', 'ADMIN'],
    items: [
      { key: 'borrowing-report', label: 'Báo cáo mượn sách', path: '/reports/borrowing' },
      { key: 'inventory-report', label: 'Báo cáo tồn kho', path: '/reports/inventory' },
      { key: 'user-statistics', label: 'Thống kê người dùng', path: '/reports/users' },
    ],
  },
];

const HOME_ITEM = { key: 'home', label: 'Tổng quan', path: '/home' };

export function getVisibleNavigation(roles = []) {
  const items = APP_NAV_GROUPS
    .filter((group) => group.roles.some((role) => roles.includes(role)))
    .flatMap((group) => group.items);
  return [HOME_ITEM, ...items];
}

export function getActiveNavigationKey(pathname) {
  return [HOME_ITEM, ...APP_NAV_GROUPS.flatMap((group) => group.items)]
    .find((item) => item.path === pathname)?.key || null;
}

export function getDashboardAudience(roles = []) {
  if (roles.includes('ADMIN') || roles.includes('LIBRARIAN')) return 'staff';
  if (roles.includes('MEMBER')) return 'member';
  return 'guest';
}
```

- [ ] **Step 4: Run the pure contract tests**

Run:

```powershell
cd frontend
node --test --test-name-pattern="navigation visibility|active navigation|dashboard audience" test/appShellFrontend.test.js
```

Expected: 3 tests PASS; header search test remains FAIL until Task 2.

- [ ] **Step 5: Commit Task 1**

```powershell
git add frontend/src/utils/appNavigation.js frontend/test/appShellFrontend.test.js
git commit -m "test: define app shell navigation contract"
```

---

### Task 2: Responsive AppLayout and Header

**Files:**
- Modify: `frontend/src/component/layout/AppLayout.jsx`
- Modify: `frontend/src/component/layout/Header.jsx`
- Modify: `frontend/src/styles/app-shell.css`
- Delete: `frontend/src/component/layout/Sidebar.jsx`
- Test: `frontend/test/appShellFrontend.test.js`

**Interfaces:**
- Consumes: `APP_NAV_GROUPS`, `getActiveNavigationKey`, and current roles.
- Produces: `Header({ onOpenNavigation, navigationOpen })` and the `app-sidebar-open` responsive state.

- [ ] **Step 1: Extend the failing source contract tests**

Append to `frontend/test/appShellFrontend.test.js`:

```js
test('app layout exposes an accessible mobile navigation drawer', async () => {
  const source = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');

  assert.match(source, /useLocation\(\)/);
  assert.match(source, /aria-label="Mở điều hướng"/);
  assert.match(source, /aria-expanded=\{navigationOpen\}/);
  assert.match(source, /className=\{`app-sidebar\$\{navigationOpen \? ' app-sidebar-open' : ''\}`\}/);
  assert.match(source, /className="app-sidebar-backdrop"/);
  assert.match(styles, /@media \(max-width: 860px\)[\s\S]*\.app-sidebar-open/);
});

test('app layout composes the shared profile header', async () => {
  const source = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');
  assert.match(source, /import Header from '.\/Header';/);
  assert.match(source, /<Header/);
  assert.doesNotMatch(source, /<div className="app-avatar">N<\/div>/);
});
```

- [ ] **Step 2: Run the tests to verify RED**

Run:

```powershell
cd frontend
node --test test/appShellFrontend.test.js
```

Expected: drawer, header composition, and search-removal tests FAIL.

- [ ] **Step 3: Refactor `Header` to profile plus mobile navigation**

Change the public signature to:

```jsx
export default function Header({ onOpenNavigation, navigationOpen = false }) {
```

Replace the search block at the start of the header with:

```jsx
<button
  type="button"
  className="app-icon-btn app-menu-trigger"
  onClick={onOpenNavigation}
  aria-label="Mở điều hướng"
  aria-controls="app-navigation"
  aria-expanded={navigationOpen}
>
  <Menu size={20} />
</button>
```

Import `Menu` from `lucide-react`, remove `Search`, and keep the existing profile trigger,
profile fallback, menu popup, and logout behavior unchanged.

- [ ] **Step 4: Refactor `AppLayout` to own the drawer state**

Use this state and route skeleton inside `AppLayout`:

```jsx
const location = useLocation();
const [navigationOpen, setNavigationOpen] = useState(false);
const menuTriggerRef = useRef(null);
const activeKey = getActiveNavigationKey(location.pathname);

useEffect(() => {
  setNavigationOpen(false);
}, [location.pathname]);

function closeNavigation({ restoreFocus = false } = {}) {
  setNavigationOpen(false);
  if (restoreFocus) window.requestAnimationFrame(() => menuTriggerRef.current?.focus());
}
```

Render the shell with:

```jsx
<aside id="app-navigation" className={`app-sidebar${navigationOpen ? ' app-sidebar-open' : ''}`}>
  {/* existing brand and role-filtered nav groups */}
</aside>
{navigationOpen && (
  <button
    type="button"
    className="app-sidebar-backdrop"
    onClick={() => closeNavigation({ restoreFocus: true })}
    aria-label="Đóng điều hướng"
  />
)}
<div className="app-main">
  <Header
    onOpenNavigation={(event) => {
      menuTriggerRef.current = event.currentTarget;
      setNavigationOpen((open) => !open);
    }}
    navigationOpen={navigationOpen}
  />
  {/* existing page header and children */}
</div>
```

Use `APP_NAV_GROUPS` and `activeKey`; remove the `active` prop as an active-state source while
temporarily accepting it in the function signature to avoid breaking existing callers.

- [ ] **Step 5: Add responsive CSS**

Replace the current 860px collapsed-sidebar rule with:

```css
.app-menu-trigger { display: none; }
.app-sidebar-backdrop { display: none; }

@media (max-width: 860px) {
  .app-menu-trigger { display: grid; }
  .app-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 70;
    width: min(300px, 86vw);
    transform: translateX(-102%);
    transition: transform 180ms ease;
    box-shadow: 18px 0 48px rgba(36, 29, 22, 0.18);
  }
  .app-sidebar.app-sidebar-open { transform: translateX(0); }
  .app-sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 60;
    border: 0;
    background: rgba(36, 29, 22, 0.42);
  }
  .app-brand-text, .app-nav-label, .app-nav-item span { display: initial; }
  .app-nav-item { justify-content: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  .app-sidebar { transition: none; }
}
```

- [ ] **Step 6: Delete the unused legacy component**

Run:

```powershell
git rm frontend/src/component/layout/Sidebar.jsx
```

Confirm before deletion:

```powershell
rg -n "component/layout/Sidebar|layout/Sidebar" frontend/src
```

Expected: no imports.

- [ ] **Step 7: Run tests and lint**

Run:

```powershell
cd frontend
node --test test/appShellFrontend.test.js
npm run lint
```

Expected: app-shell tests PASS and lint reports zero errors.

- [ ] **Step 8: Commit Task 2**

```powershell
git add frontend/src/component/layout/AppLayout.jsx frontend/src/component/layout/Header.jsx frontend/src/styles/app-shell.css frontend/test/appShellFrontend.test.js
git commit -m "feat: add responsive role-aware app shell"
```

---

### Task 3: Role-aware `/home` Dashboard

**Files:**
- Create: `frontend/src/page/dashboard/HomeRoutePage.jsx`
- Create: `frontend/src/page/dashboard/RoleDashboardPage.jsx`
- Create: `frontend/src/page/dashboard/dashboardViewModel.js`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/styles/app-shell.css`
- Test: `frontend/test/appShellFrontend.test.js`

**Interfaces:**
- Consumes: `getDashboardAudience`, `borrowingApi`, `reservationApi`, and `reportApi`.
- Produces: `HomeRoutePage`, `RoleDashboardPage({ audience, roles })`, `buildMemberSummary`, and `buildStaffSummary`.

- [ ] **Step 1: Write failing dashboard mapping tests**

Append:

```js
import { buildMemberSummary, buildStaffSummary } from '../src/page/dashboard/dashboardViewModel.js';

test('member dashboard summarizes personal activity', () => {
  assert.deepEqual(
    buildMemberSummary(
      { borrowRequests: [{ status: 'APPROVED' }, { status: 'COMPLETED' }] },
      { reservations: [{ status: 'WAITING' }, { status: 'CANCELLED' }] },
    ),
    { activeBorrows: 1, completedBorrows: 1, activeReservations: 1 },
  );
});

test('staff dashboard summarizes operational queues', () => {
  assert.deepEqual(
    buildStaffSummary(
      { borrowRequests: [{ status: 'PENDING' }, { status: 'APPROVED' }] },
      { reservations: [{ status: 'WAITING' }, { status: 'READY' }] },
    ),
    { pendingBorrowRequests: 1, waitingReservations: 1, readyReservations: 1 },
  );
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```powershell
cd frontend
node --test --test-name-pattern="dashboard summarizes" test/appShellFrontend.test.js
```

Expected: FAIL because `dashboardViewModel.js` does not exist.

- [ ] **Step 3: Implement pure summary mapping**

Create `frontend/src/page/dashboard/dashboardViewModel.js`:

```js
export function buildMemberSummary(borrowing = {}, reservations = {}) {
  const borrowRows = borrowing.borrowRequests || [];
  const reservationRows = reservations.reservations || [];
  return {
    activeBorrows: borrowRows.filter((row) => ['APPROVED', 'BORROWED'].includes(row.status)).length,
    completedBorrows: borrowRows.filter((row) => ['COMPLETED', 'RETURNED'].includes(row.status)).length,
    activeReservations: reservationRows.filter((row) => !['CANCELLED', 'EXPIRED', 'COMPLETED'].includes(row.status)).length,
  };
}

export function buildStaffSummary(borrowing = {}, reservations = {}) {
  const borrowRows = borrowing.borrowRequests || [];
  const reservationRows = reservations.reservations || [];
  return {
    pendingBorrowRequests: borrowRows.filter((row) => row.status === 'PENDING').length,
    waitingReservations: reservationRows.filter((row) => row.status === 'WAITING').length,
    readyReservations: reservationRows.filter((row) => row.status === 'READY').length,
  };
}
```

- [ ] **Step 4: Implement route selection**

Create `HomeRoutePage.jsx`:

```jsx
import HomePage from '../HomePage';
import { getDashboardAudience } from '../../utils/appNavigation';
import RoleDashboardPage from './RoleDashboardPage';

function readStoredUser() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function HomeRoutePage() {
  const user = readStoredUser();
  const audience = getDashboardAudience(user?.roles || []);
  return audience === 'guest'
    ? <HomePage />
    : <RoleDashboardPage audience={audience} roles={user.roles || []} />;
}
```

Modify `App.jsx` to import `HomeRoutePage` and render it for `/home`; keep `HomePage` private to the route wrapper.

- [ ] **Step 5: Implement `RoleDashboardPage` with existing APIs**

The component must:

```jsx
export default function RoleDashboardPage({ audience }) {
  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const request = audience === 'member'
      ? Promise.all([borrowingApi.listMine(), reservationApi.listMine()])
      : Promise.all([borrowingApi.listAll({ status: 'PENDING' }), reservationApi.listAll()]);

    request
      .then(([borrowing, reservations]) => {
        if (!active) return;
        setSummary(audience === 'member'
          ? buildMemberSummary(borrowing, reservations)
          : buildStaffSummary(borrowing, reservations));
      })
      .catch((error) => active && setNotice(error.message))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [audience]);

  return (
    <AppLayout title={audience === 'member' ? 'Tổng quan của bạn' : 'Tổng quan vận hành'}>
      {notice && <DataNotice type="error" title="Không thể tải tổng quan">{notice}</DataNotice>}
      {loading ? <LoadingBlock rows={3} /> : <DashboardContent audience={audience} summary={summary} />}
    </AppLayout>
  );
}
```

`DashboardContent` renders three KPI cards and only links to existing permitted routes:

- Member: `/borrowing/new`, `/borrowing/history`, `/reservations/mine`.
- Staff: `/librarian/borrow-requests`, `/librarian/returns`, `/reports/borrowing`.

Do not add placeholder features or fabricated demo metrics.

- [ ] **Step 6: Add dashboard CSS**

Add `.dashboard-actions`, `.dashboard-action`, and mobile one-column behavior using the existing `kpi-grid`, `kpi-card`, and token variables. Cards must use at most 12px radius and have stable icon/action dimensions.

- [ ] **Step 7: Run targeted tests and lint**

Run:

```powershell
cd frontend
node --test test/appShellFrontend.test.js
npm run lint
```

Expected: all app-shell tests PASS and lint reports zero errors.

- [ ] **Step 8: Commit Task 3**

```powershell
git add frontend/src/page/dashboard frontend/src/App.jsx frontend/src/styles/app-shell.css frontend/test/appShellFrontend.test.js
git commit -m "feat: add role-aware library dashboard"
```

---

### Task 4: App Shell Validation Gate

**Files:**
- Modify only if validation reveals a defect in files already listed in Tasks 1-3.

**Interfaces:**
- Consumes the completed shell and dashboard.
- Produces B6 evidence for automated, spec, constitution, and acceptance layers.

- [ ] **Step 1: Run automated checks**

```powershell
cd frontend
node --test test/appShellFrontend.test.js
npm run lint
npm run build
```

Expected: all commands exit `0`; build produces `frontend/dist`.

- [ ] **Step 2: Run spec compliance checks**

Confirm with `rg`:

```powershell
rg -n "app-search|Search books, members, loans" src/component/layout
rg -n "Mở điều hướng|Đóng điều hướng|aria-expanded" src/component/layout
rg -n "Tổng quan của bạn|Tổng quan vận hành" src/page/dashboard
```

Expected: no global search results; accessible drawer and both dashboard titles present.

- [ ] **Step 3: Run responsive manual acceptance**

At 1440px, 1024px, 768px, and 390px verify:

- Sidebar is persistent on desktop and an explicit drawer at 860px and below.
- Drawer closes after route selection and backdrop activation.
- Profile menu remains reachable.
- Page title and primary action do not overlap.
- Member and staff accounts see only permitted navigation and dashboard links.

- [ ] **Step 4: Inspect final diff**

```powershell
git status --short
git diff --check
git diff --stat origin/main...HEAD
```

Expected: only App Shell plan files changed; no secrets, generated assets, or unrelated formatting.

- [ ] **Step 5: Commit validation-only fixes if required**

```powershell
git add frontend
git commit -m "fix: close app shell UX validation gaps"
```

Skip this commit when validation requires no code correction.

---

## Human Review Gate

Review the slice against:

- `UX-FE-001`, `UX-FE-007`, `UX-FE-008`.
- `NFR-UX-001`, `NFR-UX-002`, `NFR-UX-003`.
- `AC-UX-004`, `AC-UX-006`, `AC-UX-007`, `AC-UX-008`.

Do not begin the Auth UX plan until this App Shell slice passes automated checks and human review.

