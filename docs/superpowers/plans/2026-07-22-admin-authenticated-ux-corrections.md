# Admin Authenticated UX Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the redundant Permissions sidebar item and correct User Management/Audit responsiveness without changing role management, Audit filters, APIs, authorization, or redaction.

**Architecture:** Keep the shared Admin navigation contract as the only sidebar source. Reuse the existing user cards at laptop widths, and keep Audit raw values separate from Vietnamese presentation while rendering safe details in a native disclosure. The backend and API adapters remain untouched.

**Tech Stack:** React 19, Vite 8, plain CSS, Node.js test runner, Playwright browser acceptance.

## Global Constraints

- `/admin/users` remains the Admin Console entry and User Management remains the default section.
- Manage Roles remains available from every eligible user row/card.
- Audit continues to submit canonical `q`, `action`, `actorId`, `from`, `to`, `page`, and `limit` values.
- No backend endpoint, DTO, authorization rule, schema, dependency, or redaction rule changes.
- UI copy is Vietnamese while canonical API values remain unchanged.

---

### Task 1: Lock the corrected navigation and responsive contracts

**Files:**
- Modify: `frontend/test/userManagementFrontend.test.js`
- Modify: `frontend/test/adminConsoleStructure.test.js`

**Interfaces:**
- Consumes: `ADMIN_NAVIGATION`, `.admin-user-table`, `.admin-user-cards`, `AdminAuditSection` source contracts.
- Produces: failing assertions for seven navigation entries, a `1440px` card breakpoint, canonical Audit filters, mapped action choices, and safe-detail disclosure.

- [ ] **Step 1: Write the failing navigation and responsive tests**

```js
assert.deepEqual(entries, [
  ['home', 'Trang chủ'],
  ['dashboard', 'Tổng quan'],
  ['library', 'Thư viện'],
  ['circulation', 'Quản lý mượn trả'],
  ['requests', 'Quản lý yêu cầu'],
  ['users', 'Quản lý người dùng'],
  ['audit', 'Nhật ký hoạt động'],
]);
assert.doesNotMatch(navigation, /id: 'permissions'/);
assert.match(css, /@media \(max-width: 1440px\)[^]*?\.admin-user-table \{ display: none; \}[^]*?\.admin-user-cards \{ display: grid;/);
```

- [ ] **Step 2: Write the failing Audit presentation test**

```js
assert.match(source, /list="admin-audit-action-options"/);
assert.match(source, /<datalist id="admin-audit-action-options">/);
assert.match(source, /<details className="admin-audit-details-disclosure">/);
assert.match(source, /<summary>Xem chi tiết \(\{details\.length\}\)<\/summary>/);
assert.doesNotMatch(source, /placeholder="AUTH_LOGIN_SUCCESS"/);
```

- [ ] **Step 3: Run the focused suite and verify RED**

Run from `frontend`: `node --test --test-name-pattern="FE11 modular console|FE11 desktop table|FE11 audit|Admin CSS" test/userManagementFrontend.test.js test/adminConsoleStructure.test.js`

Expected: FAIL because navigation still contains Permissions, cards switch only at 900px, and Audit has neither the action list nor disclosure.

### Task 2: Apply the navigation and User Management responsive corrections

**Files:**
- Modify: `frontend/src/page/admin/adminNavigation.js`
- Modify: `frontend/src/page/admin/admin-console.css`
- Test: `frontend/test/userManagementFrontend.test.js`
- Test: `frontend/test/adminConsoleStructure.test.js`

**Interfaces:**
- Consumes: shared `ADMIN_NAVIGATION` and the existing table/card markup.
- Produces: seven visible navigation entries and a content-safe laptop card breakpoint.

- [ ] **Step 1: Remove only the Permissions navigation entry and unused icon import**

```js
import {
  BookCopy,
  ClipboardList,
  Home,
  LayoutDashboard,
  Library,
  Users,
} from 'lucide-react';

export const ADMIN_NAVIGATION = Object.freeze([
  { id: 'home', icon: Home, label: 'Trang chủ', path: '/home' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { id: 'library', icon: Library, label: 'Thư viện' },
  { id: 'circulation', icon: BookCopy, label: 'Quản lý mượn trả' },
  { id: 'requests', icon: ClipboardList, label: 'Quản lý yêu cầu' },
  { id: 'users', icon: Users, label: 'Quản lý người dùng' },
  { id: 'audit', icon: ClipboardList, label: 'Nhật ký hoạt động' },
]);
```

- [ ] **Step 2: Switch the user directory to cards before the 1040px table overflows**

```css
@media (max-width: 1440px) {
  .admin-user-table { display: none; }
  .admin-user-cards { display: grid; gap: 12px; }
}
```

- [ ] **Step 3: Run the focused navigation/responsive tests and verify GREEN**

Run from `frontend`: `node --test --test-name-pattern="FE11 modular console|FE11 desktop table|Admin CSS" test/userManagementFrontend.test.js test/adminConsoleStructure.test.js`

Expected: PASS.

### Task 3: Correct Audit filter and detail density without losing behavior

**Files:**
- Modify: `frontend/src/page/admin/audit/adminAuditPresentation.js`
- Modify: `frontend/src/page/admin/audit/AdminAuditSection.jsx`
- Modify: `frontend/src/page/admin/admin-console.css`
- Test: `frontend/test/adminConsolePresentation.test.js`
- Test: `frontend/test/userManagementFrontend.test.js`

**Interfaces:**
- Consumes: canonical action strings and the allowlisted `[key, value]` entries returned by `getAuditDetailEntries`.
- Produces: `getAuditActionOptions(): Array<{ value: string, label: string }>` and per-row native disclosures.

- [ ] **Step 1: Export stable mapped action options**

```js
export function getAuditActionOptions() {
  return Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));
}
```

- [ ] **Step 2: Replace the technical placeholder with labeled suggestions and preserve arbitrary raw input**

```jsx
<input
  list="admin-audit-action-options"
  value={auditFilters.action}
  maxLength={100}
  placeholder="Nhập hoặc chọn hành động"
  onChange={(event) => setAuditFilters((current) => ({ ...current, action: event.target.value }))}
/>
<datalist id="admin-audit-action-options">
  {auditActionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
</datalist>
```

- [ ] **Step 3: Render safe details behind a native disclosure**

```jsx
{showAuditDetails ? (
  <td>{details.length === 0 ? '-' : (
    <details className="admin-audit-details-disclosure">
      <summary>Xem chi tiết ({details.length})</summary>
      <dl className="admin-audit-details">
        {details.map(([key, value]) => <div key={key}><dt>{formatAuditDetailKey(key)}</dt><dd>{formatAuditDetailValue(value)}</dd></div>)}
      </dl>
    </details>
  )}</td>
) : null}
```

- [ ] **Step 4: Give Audit filters a responsive two-row layout and style the disclosure**

```css
.admin-audit-filter-bar .admin-filter-grid {
  grid-template-columns: minmax(260px, 2fr) repeat(2, minmax(170px, 1fr));
}

.admin-audit-details-disclosure summary {
  color: var(--admin-brass-dark);
  font-weight: 800;
  cursor: pointer;
}
```

- [ ] **Step 5: Run the focused Audit tests and verify GREEN**

Run from `frontend`: `node --test --test-name-pattern="audit" test/adminConsolePresentation.test.js test/userManagementFrontend.test.js`

Expected: PASS with canonical filters, safe detail projection, Vietnamese presentation, and no technical placeholder regression.

### Task 4: Validate the complete correction

**Files:**
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Create: `.sdd/reviews/admin-console-authenticated-ux-correction-validation-2026-07-22.md`

**Interfaces:**
- Consumes: completed navigation, User Management, and Audit corrections.
- Produces: L1-L4 validation evidence and the next Azure Staging human-review candidate.

- [ ] **Step 1: Run full frontend validation**

Run: `npm.cmd --prefix frontend test`

Expected: all frontend tests pass.

Run: `npm.cmd --prefix frontend run lint`

Expected: exit code 0.

Run: `npm.cmd --prefix frontend run build`

Expected: production build succeeds.

- [ ] **Step 2: Run browser acceptance**

Run the project Playwright workflow at `1280x720`, `1366x768`, `1440x900`, and `390x844`; open User Management and Audit, verify no page overflow, verify cards before table overflow, open one safe-detail disclosure, and confirm Manage Roles remains visible.

Expected: no horizontal page overflow; seven sidebar items; User Management actions remain visible; Audit filters wrap cleanly; safe details expand on demand.

- [ ] **Step 3: Record validation evidence**

Write the exact commands, pass counts, browser viewport results, spec mapping, unchanged backend boundary, residual staging-review requirement, and current commit SHA to `.sdd/reviews/admin-console-authenticated-ux-correction-validation-2026-07-22.md`; add the same bounded outcome to the FE11 changelog.

- [ ] **Step 4: Commit the validated correction**

```bash
git add .sdd/specs/feat-user-role-management docs/superpowers frontend/src/page/admin frontend/test .sdd/reviews/admin-console-authenticated-ux-correction-validation-2026-07-22.md
git commit -m "fix: refine authenticated admin console UX"
```
