# Library Operational Page Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. This slice explicitly uses inline execution without subagents or a separate reviewer. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize operational page headers, data states, toolbars, tables, confirmations, and completion feedback across FE07, FE08, FE06, FE09, and FE12 without changing business behavior.

**Architecture:** Add small compositional structural primitives beside the existing feedback primitives, then migrate pages in the approved order. Pages continue to own API calls, view models, filters, selection, and mutations; shared components own layout, semantics, responsive table hooks, modal confirmation, and duplicate-action prevention.

**Tech Stack:** React 19, React Router 7, Vite 8, Bootstrap 5, existing MUI/lucide icons, Node built-in test runner, CSS in `frontend/src/styles/app-shell.css`.

## Global Constraints

- No backend, API contract, database schema, or business-rule change.
- No change to fine calculation, borrowing eligibility, renewal rules, reservation queue order, report metrics, or inventory status transitions.
- No new client role or server authorization behavior.
- No new production or test dependency.
- FE06 remains presentation-only and retains its current mock/in-memory data boundary.
- FE09 remains presentation-only and retains localStorage/sample-data behavior; `FE09-T012` remains open.
- Protected operational pages use Vietnamese user-facing labels; identifiers and test names remain English.
- Keep existing API methods, view-model helpers, route guards, and feature utility tests intact.
- Implement in order: shared primitives, FE07, FE08, FE06, FE09, FE12, validation.
- Use `apply_patch` for manual edits and stage only files belonging to the current task.

## File Map

### New files

- `frontend/src/component/shared/OperationalPatterns.jsx`: structural `PageHeader`, `DataToolbar`, and `DataTable` components.
- `frontend/test/operationalPatternsFrontend.test.js`: shared component and navigation contracts.
- `frontend/test/inventoryOperationalFrontend.test.js`: FE06 presentation-boundary contracts.
- `frontend/test/fineOperationalFrontend.test.js`: FE09 shell, shared-state, and prototype-boundary contracts.
- `frontend/test/reportOperationalFrontend.test.js`: FE12 shared-pattern adoption contracts.
- `frontend/src/styles/fine-management.css`: FE09 page-local styles after removing its duplicate application shell.
- `.sdd/reviews/library-ux-slice3-validation-review-2026-07-15.md`: final automated evidence and human-review checklist.

### Shared files modified throughout the plan

- `frontend/src/component/shared/Feedback.jsx`: `StatusNotice`, compatibility `DataNotice`, actionable `EmptyState`, `ConfirmAction`, and shared toast semantics.
- `frontend/src/component/layout/AppLayout.jsx`: compose `PageHeader` and register Inventory/Fines navigation icons.
- `frontend/src/utils/appNavigation.js`: expose Inventory and Fines to existing staff roles.
- `frontend/src/styles/app-shell.css`: operational primitive styles and mobile labeled-row table behavior.

### Feature files modified

- FE07: all files under `frontend/src/page/borrowing/`.
- FE08: `frontend/src/page/reservation/MyReservationsPage.jsx` and `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`.
- FE06: `frontend/src/page/InventoryPage.jsx` and files under `frontend/src/component/inventory/`.
- FE09: `frontend/src/page/FineManagement.jsx`.
- FE12: all files under `frontend/src/page/report/`.

---

### Task 1: Shared Operational Primitives and Staff Navigation

**Files:**
- Create: `frontend/src/component/shared/OperationalPatterns.jsx`
- Create: `frontend/test/operationalPatternsFrontend.test.js`
- Modify: `frontend/src/component/shared/Feedback.jsx:1-151`
- Modify: `frontend/src/component/layout/AppLayout.jsx:1-161`
- Modify: `frontend/src/utils/appNavigation.js:1-48`
- Modify: `frontend/src/styles/app-shell.css:159-230,275-343,519-604`
- Modify: `frontend/test/appShellFrontend.test.js:12-42`

**Interfaces:**
- Consumes: existing `Modal`, `LoadingBlock`, `.ph`, `.toolbar`, `.lib-table`, and staff role visibility.
- Produces: `PageHeader({ title, subtitle, actions })`, `DataToolbar({ primary, filters, summary, actions, className })`, `DataTable({ caption, headers, loading, loadingRows, isEmpty, emptyState, children, className })`, `StatusNotice`, `ConfirmAction`, and compatible `DataNotice`.

- [ ] **Step 1: Write failing shared contracts**

Create `frontend/test/operationalPatternsFrontend.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('shared operational components expose the approved Slice 3 contracts', async () => {
  const structural = await readFile(new URL('../src/component/shared/OperationalPatterns.jsx', import.meta.url), 'utf8');
  const feedback = await readFile(new URL('../src/component/shared/Feedback.jsx', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');

  for (const name of ['PageHeader', 'DataToolbar', 'DataTable']) {
    assert.match(structural, new RegExp(`export function ${name}\\b`), name);
  }
  assert.match(feedback, /export function StatusNotice\b/);
  assert.match(feedback, /export function DataNotice\(props\)/);
  assert.match(feedback, /export function ConfirmAction\b/);
  assert.match(feedback, /pendingLabel = 'Đang xử lý\.\.\.'/);
  assert.match(layout, /import \{ PageHeader \} from '\.\.\/shared\/OperationalPatterns';/);
  assert.match(layout, /<PageHeader title=\{title\} subtitle=\{subtitle\} actions=\{actions\} \/>/);
});

test('shared data table exposes semantic and mobile labeling hooks', async () => {
  const structural = await readFile(new URL('../src/component/shared/OperationalPatterns.jsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');

  assert.match(structural, /<caption className="sr-only">\{caption\}<\/caption>/);
  assert.match(structural, /scope="col"/);
  assert.match(structural, /className=\{`lib-table operational-table/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*\.operational-table td::before/);
  assert.match(styles, /content:\s*attr\(data-label\)/);
});

test('staff navigation includes Inventory and Fines without changing role groups', async () => {
  const navigation = await import('../src/utils/appNavigation.js');

  assert.deepEqual(
    navigation.getVisibleNavigation(['LIBRARIAN']).map((item) => item.key),
    [
      'home',
      'borrow-requests-admin',
      'process-returns',
      'reservations-librarian',
      'member-details',
      'inventory-management',
      'fine-management',
      'borrowing-report',
      'inventory-report',
      'user-statistics',
    ],
  );
  assert.equal(navigation.getActiveNavigationKey('/librarian/inventory'), 'inventory-management');
  assert.equal(navigation.getActiveNavigationKey('/librarian/fines'), 'fine-management');
});
```

Update the existing staff-navigation expectation in `frontend/test/appShellFrontend.test.js` to the same ordered key list.

- [ ] **Step 2: Run the contracts and verify they fail**

Run:

```powershell
node --test frontend/test/operationalPatternsFrontend.test.js frontend/test/appShellFrontend.test.js
```

Expected: FAIL because `OperationalPatterns.jsx`, `StatusNotice`, `ConfirmAction`, and the two navigation items do not exist.

- [ ] **Step 3: Implement structural primitives**

Create `frontend/src/component/shared/OperationalPatterns.jsx`:

```jsx
import { LoadingBlock } from './Feedback';

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function PageHeader({ title, subtitle, actions }) {
  if (!title && !actions) return null;

  return (
    <div className="ph">
      <div>
        {title && <h1 className="ph-title">{title}</h1>}
        {subtitle && <p className="ph-sub">{subtitle}</p>}
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}

export function DataToolbar({ primary, filters, summary, actions, className = '' }) {
  return (
    <div className={joinClassNames('toolbar', 'data-toolbar', className)}>
      {primary && <div className="data-toolbar-primary">{primary}</div>}
      {filters && <div className="data-toolbar-filters">{filters}</div>}
      {(primary || filters) && (summary || actions) && <span className="spacer" />}
      {summary && <div className="data-toolbar-summary">{summary}</div>}
      {actions && <div className="data-toolbar-actions">{actions}</div>}
    </div>
  );
}

export function DataTable({
  caption,
  headers,
  loading = false,
  loadingRows = 4,
  isEmpty = false,
  emptyState,
  children,
  className = '',
}) {
  if (loading) return <LoadingBlock rows={loadingRows} />;

  const normalizedHeaders = headers.map((header) => (
    typeof header === 'string' ? { label: header } : header
  ));

  return (
    <div className="lib-table-wrap">
      <table className={`lib-table operational-table ${className}`.trim()}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {normalizedHeaders.map(({ label, align }) => (
              <th key={label} scope="col" style={align ? { textAlign: align } : undefined}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {isEmpty && emptyState}
    </div>
  );
}
```

- [ ] **Step 4: Extend shared feedback contracts**

In `frontend/src/component/shared/Feedback.jsx`, replace `DataNotice`, extend `EmptyState`, and add `ConfirmAction`:

```jsx
export function StatusNotice({ type = 'info', title, children, action }) {
  const tone = type === 'warning' ? 'warn' : type;
  const Icon = tone === 'error' ? AlertTriangle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`data-notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={17} />
      <div className="data-notice-content">
        {title && <strong>{title}</strong>}
        {children && <p>{children}</p>}
      </div>
      {action && <div className="data-notice-action">{action}</div>}
    </div>
  );
}

export function DataNotice(props) {
  return <StatusNotice {...props} />;
}

export function EmptyState({ icon: Icon = Info, title = 'Chưa có dữ liệu', children, action }) {
  return (
    <div className="empty">
      <Icon size={36} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function ConfirmAction({
  title,
  eyebrow,
  children,
  cancelLabel = 'Hủy',
  confirmLabel = 'Xác nhận',
  pendingLabel = 'Đang xử lý...',
  tone = 'primary',
  pending = false,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      title={title}
      eyebrow={eyebrow}
      onClose={pending ? undefined : onCancel}
      actions={(
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={pending}>{cancelLabel}</button>
          <button
            type="button"
            className={`btn btn-${tone}`}
            onClick={onConfirm}
            disabled={pending || confirmDisabled}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </>
      )}
    >
      {children}
    </Modal>
  );
}
```

Set Toast's role to `toast.type === 'error' ? 'alert' : 'status'` and keep its current 3.2-second lifecycle.

- [ ] **Step 5: Compose the page header and navigation**

In `AppLayout.jsx`, import `PageHeader`, add `ReceiptText` to lucide imports, add icon mappings, and replace the inline `.ph` block:

```jsx
import { PageHeader } from '../shared/OperationalPatterns';

const NAV_ICONS = {
  // existing mappings stay unchanged
  'inventory-management': Boxes,
  'fine-management': ReceiptText,
};

<main className="app-content">
  <PageHeader title={title} subtitle={subtitle} actions={actions} />
  {children}
</main>
```

In `appNavigation.js`, add the following existing-role items after `member-details`:

```js
{ key: 'inventory-management', label: 'Quản lý kho sách', path: '/librarian/inventory' },
{ key: 'fine-management', label: 'Quản lý tiền phạt', path: '/librarian/fines' },
```

- [ ] **Step 6: Add structural and mobile styles**

Add to `app-shell.css`:

```css
.data-toolbar-primary,
.data-toolbar-filters,
.data-toolbar-summary,
.data-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}
.data-notice-content { flex: 1; min-width: 0; }
.data-notice-action { margin-left: auto; }
.empty-action { display: flex; justify-content: center; margin-top: 14px; }

@media (max-width: 640px) {
  .ph-actions,
  .ph-actions > *,
  .data-toolbar-primary,
  .data-toolbar-filters,
  .data-toolbar-summary,
  .data-toolbar-actions {
    width: 100%;
  }
  .ph-actions .btn,
  .data-toolbar-actions .btn { justify-content: center; }
  .operational-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
  .operational-table,
  .operational-table tbody,
  .operational-table tr,
  .operational-table td { display: block; width: 100%; }
  .operational-table tbody tr { padding: 10px 14px; border-bottom: 1px solid var(--lib-line); }
  .operational-table tbody tr:last-child { border-bottom: 0; }
  .operational-table tbody td {
    display: grid;
    grid-template-columns: minmax(96px, 38%) minmax(0, 1fr);
    gap: 12px;
    padding: 7px 0;
    border-bottom: 0;
    text-align: left !important;
  }
  .operational-table td::before {
    content: attr(data-label);
    color: var(--lib-ink-2);
    font-size: 12px;
    font-weight: 600;
  }
}
```

- [ ] **Step 7: Run focused tests**

Run:

```powershell
node --test frontend/test/operationalPatternsFrontend.test.js frontend/test/appShellFrontend.test.js
```

Expected: PASS with 0 failures.

- [ ] **Step 8: Commit**

```powershell
git add frontend/src/component/shared/OperationalPatterns.jsx frontend/src/component/shared/Feedback.jsx frontend/src/component/layout/AppLayout.jsx frontend/src/utils/appNavigation.js frontend/src/styles/app-shell.css frontend/test/operationalPatternsFrontend.test.js frontend/test/appShellFrontend.test.js
git commit -m "feat: add shared operational page patterns"
```

---

### Task 2: FE07 Member Borrowing Tracer

**Files:**
- Modify: `frontend/src/page/borrowing/BorrowRequestPage.jsx:1-93`
- Modify: `frontend/src/page/borrowing/BorrowingHistoryPage.jsx:1-88`
- Modify: `frontend/test/borrowingFrontend.test.js`

**Interfaces:**
- Consumes: `DataToolbar`, `DataTable`, `EmptyState`, `ConfirmAction`, existing `borrowingApi`, and existing FE07 view models.
- Produces: the first complete page adoption and a reference for later migrations.

- [ ] **Step 1: Add failing FE07 member adoption tests**

Append to `frontend/test/borrowingFrontend.test.js`:

```js
test('FE07 member pages use shared operational patterns without changing API calls', async () => {
  const request = await readFile(new URL('../src/page/borrowing/BorrowRequestPage.jsx', import.meta.url), 'utf8');
  const history = await readFile(new URL('../src/page/borrowing/BorrowingHistoryPage.jsx', import.meta.url), 'utf8');

  assert.match(request, /DataToolbar/);
  assert.match(request, /EmptyState/);
  assert.doesNotMatch(request, /<div className="empty">/);
  assert.match(request, /borrowingApi\.createRequest\(\[Number\(copyId\)\]\)/);

  assert.match(history, /DataToolbar/);
  assert.match(history, /DataTable/);
  assert.match(history, /ConfirmAction/);
  assert.match(history, /const \[renewing, setRenewing\] = useState\(false\)/);
  assert.match(history, /data-label="Hạn trả"/);
  assert.match(history, /await borrowingApi\.renewDetail\(renewRow\.borrowDetailId\)/);
  assert.doesNotMatch(history, /<table className="lib-table"/);
});
```

- [ ] **Step 2: Verify the tests fail**

Run:

```powershell
node --test frontend/test/borrowingFrontend.test.js
```

Expected: FAIL on missing shared structural components and `renewing` state.

- [ ] **Step 3: Migrate `BorrowRequestPage`**

Import `DataToolbar` and use it around search. Replace both custom empty blocks with shared empty states:

```jsx
<DataToolbar
  primary={(
    <div className="search-input" style={{ width: '100%' }}>
      <Search size={18} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên sách hoặc tác giả..." aria-label="Tìm sách" />
    </div>
  )}
/>

{results.length === 0 && (
  <EmptyState icon={BookOpen} title="Không tìm thấy sách phù hợp">
    Hãy thử tên sách hoặc tác giả khác.
  </EmptyState>
)}
```

Keep `DEMO_BORROW_CATALOG`, `borrowingApi.createRequest`, the eligibility helper copy, and submit behavior unchanged.

- [ ] **Step 4: Migrate `BorrowingHistoryPage`**

Add pending state and protect the existing mutation:

```jsx
const [renewing, setRenewing] = useState(false);

async function confirmRenew() {
  if (!renewRow || renewing) return;
  setRenewing(true);
  try {
    const data = await borrowingApi.renewDetail(renewRow.borrowDetailId);
    const detail = data.borrowDetail;
    setRows((current) => current.map((row) => row.borrowDetailId === renewRow.borrowDetailId
      ? { ...row, dueDate: detail.dueDate, renewalsLeft: Math.max(0, 1 - Number(detail.renewalCount || 0)) }
      : row));
    showToast(`Đã gia hạn "${renewRow.title}".`, 'success');
    setRenewRow(null);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setRenewing(false);
  }
}
```

Replace the tabs/search row with `DataToolbar`, and render rows through:

```jsx
<DataTable
  caption="Borrowing history table"
  headers={['Sách', 'Ngày mượn', 'Hạn trả', 'Ngày trả', 'Trạng thái', { label: 'Thao tác', align: 'right' }]}
  loading={loading}
  isEmpty={pageRows.length === 0}
  emptyState={<EmptyState icon={History} title="Không có bản ghi nào" />}
>
  {pageRows.map((row) => (
    <tr key={row.id} className={row.status === 'Overdue' ? 'row-overdue' : ''}>
      <td data-label="Sách">
        <div className="row-flex">
          <span className="book-spine" style={{ background: 'linear-gradient(135deg,#a87532,#7b5528)' }} />
          <div className="stack-sm">
            <strong>{row.title}</strong>
            <span className="muted" style={{ fontSize: 13 }}>{row.author}</span>
          </div>
        </div>
      </td>
      <td data-label="Ngày mượn">{fmtDate(row.borrowDate)}</td>
      <td data-label="Hạn trả">{fmtDate(row.dueDate)}</td>
      <td data-label="Ngày trả">{fmtDate(row.returnDate)}</td>
      <td data-label="Trạng thái"><Badge status={row.status} /></td>
      <td data-label="Thao tác" style={{ textAlign: 'right' }}>
        {canRenew(row) && (
          <button className="btn btn-outline btn-sm" onClick={() => setRenewRow(row)}>
            <RefreshCw size={14} /> Gia hạn
          </button>
        )}
      </td>
    </tr>
  ))}
</DataTable>
```

Replace `RenewModal` with `ConfirmAction`, passing `pending={renewing}`, `confirmLabel="Xác nhận gia hạn"`, and the existing book/due-date content.

- [ ] **Step 5: Run FE07 tests**

Run:

```powershell
node --test frontend/test/borrowingFrontend.test.js frontend/test/operationalPatternsFrontend.test.js
```

Expected: PASS with 0 failures.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/page/borrowing/BorrowRequestPage.jsx frontend/src/page/borrowing/BorrowingHistoryPage.jsx frontend/test/borrowingFrontend.test.js
git commit -m "feat: standardize member borrowing UX"
```

---

### Task 3: FE07 Staff Borrowing Patterns

**Files:**
- Modify: `frontend/src/page/borrowing/BorrowRequestsAdminPage.jsx:1-88`
- Modify: `frontend/src/page/borrowing/ProcessReturnsPage.jsx:1-139`
- Modify: `frontend/src/page/borrowing/MemberBorrowingDetailsPage.jsx:1-98`
- Modify: `frontend/test/borrowingFrontend.test.js`

**Interfaces:**
- Consumes: the Task 1 primitives and unchanged FE07 API/view-model contracts.
- Produces: shared staff tables and pending confirmation patterns for approval, rejection, return, and lookup results.

- [ ] **Step 1: Add failing staff adoption tests**

Append:

```js
test('FE07 staff pages use shared tables and pending confirmations', async () => {
  const requests = await readFile(new URL('../src/page/borrowing/BorrowRequestsAdminPage.jsx', import.meta.url), 'utf8');
  const returns = await readFile(new URL('../src/page/borrowing/ProcessReturnsPage.jsx', import.meta.url), 'utf8');
  const member = await readFile(new URL('../src/page/borrowing/MemberBorrowingDetailsPage.jsx', import.meta.url), 'utf8');

  assert.match(requests, /DataTable/);
  assert.match(requests, /ConfirmAction/);
  assert.match(requests, /const \[actionPending, setActionPending\] = useState\(false\)/);
  assert.match(requests, /await borrowingApi\.approve\(approveTarget\.requestId\)/);
  assert.match(requests, /await borrowingApi\.reject\(selected\.requestId, rejectReason\.trim\(\)\)/);

  assert.match(returns, /DataToolbar/);
  assert.match(returns, /DataTable/);
  assert.match(returns, /ConfirmAction/);
  assert.match(returns, /const \[returnTarget, setReturnTarget\] = useState\(null\)/);
  assert.match(returns, /returnDetail\(returnTarget\.borrowDetailId, \{ condition \}\)/);

  assert.match(member, /DataToolbar/);
  assert.match(member, /DataTable/);
  assert.doesNotMatch(member, /<table className="lib-table"/);
});
```

- [ ] **Step 2: Verify failure**

Run `node --test frontend/test/borrowingFrontend.test.js`.

Expected: FAIL on missing structural imports and pending state.

- [ ] **Step 3: Migrate approval and rejection**

In `BorrowRequestsAdminPage.jsx`:

```jsx
const [actionPending, setActionPending] = useState(false);

async function handleApprove() {
  if (!approveTarget || actionPending) return;
  setActionPending(true);
  try {
    await borrowingApi.approve(approveTarget.requestId);
    updateStatus(approveTarget.id, 'Approved', `Đã duyệt yêu cầu ${approveTarget.id}.`);
    setApproveTarget(null);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setActionPending(false);
  }
}
```

Apply the same `actionPending` guard/finally pattern to rejection. Replace the request table with `DataTable`, preserving keyboard row selection and adding `data-label` to every cell. Replace both dialogs with `ConfirmAction`; rejection keeps its textarea inside the dialog and uses `confirmDisabled={!rejectReason.trim()}`.

- [ ] **Step 4: Add return confirmation**

In `ProcessReturnsPage.jsx`:

```jsx
const [returnTarget, setReturnTarget] = useState(null);
const [returning, setReturning] = useState(false);

async function confirmReturn() {
  if (!returnTarget || returning) return;
  setReturning(true);
  try {
    const result = await borrowingApi.returnDetail(returnTarget.borrowDetailId, { condition });
    const remainingLoans = loans.filter((loan) => loan.id !== returnTarget.id);
    setLoans(remainingLoans);
    setSelectedId(remainingLoans[0]?.id || null);
    setCondition('NORMAL');
    setReturnTarget(null);
    showToast(
      result.fineCandidate?.needsFineReview
        ? `Đã ghi nhận trả "${returnTarget.book}". Có dữ liệu cần FE09 xem xét phí phạt.`
        : `Đã ghi nhận trả "${returnTarget.book}".`,
      'success',
    );
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setReturning(false);
  }
}
```

The panel button sets `returnTarget` instead of calling the API directly. Add a `ConfirmAction` with the selected member, book, condition, due date, and fine-review warning. Migrate search to `DataToolbar` and loans to `DataTable`.

- [ ] **Step 5: Migrate member lookup tables**

Use `DataToolbar` for the member ID field and load button. Rewrite `PendingTable` and `LoanTable` to return `DataTable` inside their existing `.lib-card`, preserving captions, row classes, dates, status badges, and empty-state copy. Add `data-label` to all cells.

- [ ] **Step 6: Run FE07 tests**

Run:

```powershell
node --test frontend/test/borrowingFrontend.test.js frontend/test/operationalPatternsFrontend.test.js
```

Expected: PASS with 0 failures and unchanged API assertions.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/page/borrowing/BorrowRequestsAdminPage.jsx frontend/src/page/borrowing/ProcessReturnsPage.jsx frontend/src/page/borrowing/MemberBorrowingDetailsPage.jsx frontend/test/borrowingFrontend.test.js
git commit -m "feat: standardize staff borrowing UX"
```

---

### Task 4: FE08 Reservation Patterns

**Files:**
- Modify: `frontend/src/page/reservation/MyReservationsPage.jsx:1-170`
- Modify: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx:1-178`
- Modify: `frontend/test/reservationFrontend.test.js`

**Interfaces:**
- Consumes: Task 1 primitives and existing reservation API/view-state helpers.
- Produces: shared reservation tables, toolbar, cancel/notify confirmation, and clearly labeled demo fallback.

- [ ] **Step 1: Add failing FE08 adoption test**

Append:

```js
test('FE08 pages adopt shared operational patterns and preserve demo fallback boundaries', async () => {
  const mine = await readFile(new URL('../src/page/reservation/MyReservationsPage.jsx', import.meta.url), 'utf8');
  const staff = await readFile(new URL('../src/page/reservation/ReservationsLibrarianPage.jsx', import.meta.url), 'utf8');

  for (const source of [mine, staff]) {
    assert.match(source, /DataToolbar/);
    assert.match(source, /DataTable/);
    assert.match(source, /ConfirmAction/);
  }
  assert.match(mine, /setReservations\(DEMO_MY_RESERVATIONS\)/);
  assert.match(staff, /setRows\(DEMO_ALL_RESERVATIONS\)/);
  assert.match(mine, /pending=\{cancelling\}/);
  assert.match(staff, /pending=\{notifying\}/);
  assert.doesNotMatch(mine, /<table className="lib-table"/);
  assert.doesNotMatch(staff, /<table className="lib-table"/);
});
```

- [ ] **Step 2: Verify failure**

Run `node --test frontend/test/reservationFrontend.test.js`.

Expected: FAIL on shared component and pending-state assertions.

- [ ] **Step 3: Migrate member reservations**

- Wrap the reservable-book search in `DataToolbar`.
- Render reservation rows with `DataTable` and `data-label` attributes.
- Keep `DEMO_RESERVABLE`, `DEMO_MY_RESERVATIONS`, `reservationApi.create`, `listMine`, and `cancel` unchanged.
- Add `const [cancelling, setCancelling] = useState(false)` and guard `confirmCancel` with try/finally.
- Replace the cancel `Modal` with `ConfirmAction pending={cancelling}`.
- Keep the warning notice visible when `isDemo` is true; change success copy from endpoint wording to `Dữ liệu đặt chỗ đã được cập nhật.`

- [ ] **Step 4: Migrate staff reservations**

- Use `DataToolbar` for search, book filter, status filter, and pagination summary.
- Use `DataTable` for the list view.
- Add `notifying` state around `reservationApi.process` and replace notify `Modal` with `ConfirmAction`.
- Preserve `runHoldExpirationWorkflow`, demo fallback, queue sorting, and disabled server-only actions.
- Keep queue view as a list, but use shared `EmptyState` and user-oriented warning copy.

- [ ] **Step 5: Run FE08 tests**

Run:

```powershell
node --test frontend/test/reservationFrontend.test.js frontend/test/operationalPatternsFrontend.test.js
```

Expected: PASS with 0 failures.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/page/reservation/MyReservationsPage.jsx frontend/src/page/reservation/ReservationsLibrarianPage.jsx frontend/test/reservationFrontend.test.js
git commit -m "feat: standardize reservation UX"
```

---

### Task 5: FE06 Inventory Presentation-Only Migration

**Files:**
- Create: `frontend/test/inventoryOperationalFrontend.test.js`
- Modify: `frontend/src/page/InventoryPage.jsx:1-42`
- Modify: `frontend/src/component/inventory/InventoryManagement.jsx:1-176`
- Modify: `frontend/src/component/inventory/Filter.jsx:1-54`
- Modify: `frontend/src/component/inventory/EditBookModal.jsx:1-181`
- Modify: `frontend/src/component/inventory/BookCopies.jsx:1-169`
- Modify: `frontend/src/component/inventory/StatusBadge.jsx:1-31`

**Interfaces:**
- Consumes: shared operational primitives and current `MOCK_BOOKS`, `MOCK_COPIES`, and inventory API methods already present in `BookCopies`.
- Produces: one app-shell page with shared presentation while preserving prototype boundaries.

- [ ] **Step 1: Write failing FE06 boundary tests**

Create:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('FE06 inventory keeps mock ownership while adopting shared patterns', async () => {
  const management = await readFile(new URL('../src/component/inventory/InventoryManagement.jsx', import.meta.url), 'utf8');
  const filter = await readFile(new URL('../src/component/inventory/Filter.jsx', import.meta.url), 'utf8');

  assert.match(management, /MOCK_BOOKS/);
  assert.match(management, /MOCK_COPIES/);
  assert.doesNotMatch(management, /inventoryApi\.list/);
  assert.match(management, /StatusNotice/);
  assert.match(management, /DataTable/);
  assert.match(management, /Toast/);
  assert.doesNotMatch(management, /<h5/);
  assert.match(filter, /DataToolbar/);
});

test('FE06 dialogs and badges use shared presentation without changing API methods', async () => {
  const edit = await readFile(new URL('../src/component/inventory/EditBookModal.jsx', import.meta.url), 'utf8');
  const copies = await readFile(new URL('../src/component/inventory/BookCopies.jsx', import.meta.url), 'utf8');
  const badge = await readFile(new URL('../src/component/inventory/StatusBadge.jsx', import.meta.url), 'utf8');

  assert.match(edit, /import \{ Modal \}/);
  assert.match(copies, /DataTable/);
  assert.match(copies, /ConfirmAction/);
  assert.match(copies, /inventoryApi\.createCopy/);
  assert.match(copies, /inventoryApi\.updateStatus/);
  assert.match(copies, /inventoryApi\.deactivate/);
  assert.match(badge, /import \{ Badge \}/);
});
```

- [ ] **Step 2: Verify failure**

Run `node --test frontend/test/inventoryOperationalFrontend.test.js`.

Expected: FAIL because FE06 still uses duplicate/custom presentation.

- [ ] **Step 3: Normalize inventory state and filters**

In `InventoryManagement.jsx`:

```jsx
const EMPTY_FILTER = { title: '', author: '', fromYear: '', toYear: '' };
const [toast, showToast, clearToast] = useToast();

<StatusNotice type="warning" title="Dữ liệu trình diễn">
  Màn hình này vẫn dùng dữ liệu mẫu cho đến khi kế hoạch FE06 được phê duyệt.
</StatusNotice>
<Filter filters={filter} onChange={setFilter} onReset={() => setFilter(EMPTY_FILTER)} />
```

Remove the inner page header and outer page padding. Keep filtering against `books`, but use `fromYear` and `toYear` consistently. Replace the custom table with `DataTable`, add cell labels, preserve row click/edit click behavior, and pass `showToast` plus a no-op async refresh to `BookCopies` without introducing `inventoryApi.list`.

In `Filter.jsx`, import `DataToolbar` and use this return block. Disable reset when every filter value is blank.

```jsx
const hasFilters = Object.values(filters).some((value) => String(value).trim());

return (
  <div className="lib-card" style={{ marginBottom: 18 }}>
    <DataToolbar
      primary={(
        <div className="search-input">
          <SearchIcon fontSize="small" />
          <input value={filters.title} onChange={(event) => update('title', event.target.value)} placeholder="Tên đầu sách" aria-label="Lọc theo tên đầu sách" />
        </div>
      )}
      filters={(
        <>
          <input className="input" value={filters.author} onChange={(event) => update('author', event.target.value)} placeholder="Tác giả" aria-label="Lọc theo tác giả" />
          <input className="input" type="number" value={filters.fromYear} onChange={(event) => update('fromYear', event.target.value)} placeholder="Từ năm" aria-label="Lọc từ năm xuất bản" />
          <input className="input" type="number" value={filters.toYear} onChange={(event) => update('toYear', event.target.value)} placeholder="Đến năm" aria-label="Lọc đến năm xuất bản" />
        </>
      )}
      actions={(
        <button type="button" className="btn btn-outline" onClick={onReset} disabled={!hasFilters}>
          <RestartAltIcon fontSize="small" /> Đặt lại
        </button>
      )}
    />
  </div>
);
```

- [ ] **Step 4: Reuse modal and badge presentation**

Rewrite `EditBookModal`'s return with the shared `Modal` while preserving `form`, `errors`, `validate`, and `handleSave`:

```jsx
return (
  <Modal
    title="Chỉnh sửa thông tin đầu sách"
    onClose={onClose}
    width={580}
    actions={(
      <>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          <SaveIcon fontSize="small" /> Lưu thay đổi
        </button>
      </>
    )}
  >
    <div className="form-grid cols-2">
      {[
        ['title', 'Tên đầu sách', 'text'],
        ['author', 'Tác giả', 'text'],
        ['genre', 'Thể loại', 'text'],
        ['isbn', 'ISBN', 'text'],
        ['publishYear', 'Năm xuất bản', 'number'],
        ['publisher', 'Nhà xuất bản', 'text'],
      ].map(([field, label, type]) => (
        <div className="field" key={field}>
          <label htmlFor={`inventory-${field}`}>{label}</label>
          <input
            id={`inventory-${field}`}
            className="input"
            type={type}
            value={form[field]}
            onChange={handle(field)}
          />
          {errors[field] && <span className="field-error">{errors[field]}</span>}
        </div>
      ))}
      <div className="field" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="inventory-description">Mô tả</label>
        <textarea id="inventory-description" className="textarea" value={form.description} onChange={handle('description')} rows={3} />
      </div>
    </div>
  </Modal>
);
```

Rewrite `StatusBadge` with the shared `Badge`:

```jsx
import { Badge } from '../shared/Feedback';

const STATUS_CONFIG = {
  AVAILABLE: { tone: 'available', label: 'Có sẵn' },
  BORROWED: { tone: 'borrowed', label: 'Đang mượn' },
  RESERVED: { tone: 'info', label: 'Đã đặt trước' },
  DAMAGED: { tone: 'pending', label: 'Hư hỏng' },
  LOST: { tone: 'overdue', label: 'Thất lạc' },
  INACTIVE: { tone: 'inactive', label: 'Ngừng lưu hành' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { tone: 'default', label: status };
  return <Badge status={config.tone}>{config.label}</Badge>;
}
```

- [ ] **Step 5: Migrate book-copy presentation**

- Compose the existing modal body through shared `Modal`.
- Render copy rows with `DataTable`, retaining every `inventoryApi` call and the existing `saving` guard.
- Add `deactivateTarget` state; the Ngừng button opens `ConfirmAction` and its confirm handler calls the existing `deactivate(copy)` function.
- Use `DataToolbar` for the add-copy controls and shared `EmptyState` when no copies exist.
- Do not add list loading or new API ownership to `InventoryManagement`.

- [ ] **Step 6: Run FE06 and shared tests**

Run:

```powershell
node --test frontend/test/inventoryOperationalFrontend.test.js frontend/test/operationalPatternsFrontend.test.js
```

Expected: PASS with 0 failures.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/page/InventoryPage.jsx frontend/src/component/inventory/InventoryManagement.jsx frontend/src/component/inventory/Filter.jsx frontend/src/component/inventory/EditBookModal.jsx frontend/src/component/inventory/BookCopies.jsx frontend/src/component/inventory/StatusBadge.jsx frontend/test/inventoryOperationalFrontend.test.js
git commit -m "feat: align inventory presentation patterns"
```

---

### Task 6: FE09 Shared Shell Migration

**Files:**
- Create: `frontend/src/styles/fine-management.css`
- Create: `frontend/test/fineOperationalFrontend.test.js`
- Modify: `frontend/src/page/FineManagement.jsx:1-1368`

**Interfaces:**
- Consumes: `AppLayout`, `StatusNotice`, existing `BookManagement`, local fine workflow state, and existing localStorage helpers.
- Produces: FE09 inside the shared shell with page-local tabs and external CSS; no fine workflow behavior changes yet.

- [ ] **Step 1: Write failing shell-boundary test**

Create:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('FE09 uses AppLayout while retaining prototype data ownership', async () => {
  const source = await readFile(new URL('../src/page/FineManagement.jsx', import.meta.url), 'utf8');

  assert.match(source, /import AppLayout from '\.\.\/component\/layout\/AppLayout';/);
  assert.match(source, /import '\.\.\/styles\/fine-management\.css';/);
  assert.match(source, /getFineRecords/);
  assert.match(source, /saveFineRecords/);
  assert.match(source, /FINE_RECORDS_KEY/);
  assert.match(source, /<BookManagement \/>/);
  assert.match(source, /<AppLayout/);
  assert.doesNotMatch(source, /className="fine-shell"/);
  assert.doesNotMatch(source, /className="fine-sidebar"/);
  assert.doesNotMatch(source, /<style>\{`/);
  assert.doesNotMatch(source, /function handleLogout\(/);
});
```

- [ ] **Step 2: Verify failure**

Run `node --test frontend/test/fineOperationalFrontend.test.js`.

Expected: FAIL on shared shell and external stylesheet assertions.

- [ ] **Step 3: Replace the duplicate application shell**

Remove `useNavigate`, `Home`, `LogOut`, duplicate app navigation markup, session markup, and `handleLogout`. Keep `workspace`, `BookManagement`, `activeSection`, and all workflow handlers.

Use this top-level structure:

```jsx
return (
  <AppLayout
    title={workspace === 'books' ? 'Quản lý sách' : activeMeta.label}
    subtitle={workspace === 'books' ? 'Theo dõi thông tin đầu sách hiện có.' : activeMeta.description}
  >
    <StatusNotice type="warning" title="Dữ liệu trình diễn">
      Giao diện tiền phạt vẫn dùng dữ liệu mẫu và localStorage cho đến khi FE09-T012 được triển khai.
    </StatusNotice>

    <div className="tabs" aria-label="Không gian nghiệp vụ">
      <button type="button" className={`tab${workspace === 'books' ? ' active' : ''}`} onClick={() => setWorkspace('books')}>
        <BookOpen size={14} /> Quản lý sách
      </button>
      <button type="button" className={`tab${workspace === 'fines' ? ' active' : ''}`} onClick={() => setWorkspace('fines')}>
        <ReceiptText size={14} /> Quản lý tiền phạt
      </button>
    </div>

    {workspace === 'books' ? <BookManagement /> : (
      <>
        <div className="tabs" aria-label="Nghiệp vụ tiền phạt">
          {fineSections.map(({ key, label, icon: Icon }) => (
            <button type="button" key={key} className={`tab${activeSection === key ? ' active' : ''}`} onClick={() => setActiveSection(key)}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        <section className="fine-stats">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`fine-stat ${item.tone}`}>
                <div><Icon size={20} /></div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            );
          })}
        </section>
        {activeSection === 'list' && listSection}
        {activeSection === 'calculate' && calculateSection}
        {activeSection === 'collection' && collectionSection}
        {activeSection === 'paid' && paidSection}
      </>
    )}
    {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
  </AppLayout>
);
```

Before this return, move each current `activeSection` JSX block unchanged into the four local constants `listSection`, `calculateSection`, `collectionSection`, and `paidSection`. This is a mechanical extraction only: each constant contains the current section element and continues to reference the same state and handlers.

- [ ] **Step 4: Extract FE09 styles**

Move the existing non-shell `.fine-*` declarations from the inline style block to `frontend/src/styles/fine-management.css`. Delete shell-only selectors for `.fine-shell`, `.fine-sidebar`, `.fine-brand*`, `.fine-app-nav`, `.fine-workflow-nav`, `.fine-session`, `.fine-main`, and their responsive overrides. Keep form, stats, panels, detail, transfer, table, empty, and responsive declarations unchanged until Task 7.

Import the stylesheet once from `FineManagement.jsx`:

```js
import '../styles/fine-management.css';
```

- [ ] **Step 5: Run the FE09 shell test**

Run `node --test frontend/test/fineOperationalFrontend.test.js`.

Expected: PASS with 0 failures.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/page/FineManagement.jsx frontend/src/styles/fine-management.css frontend/test/fineOperationalFrontend.test.js
git commit -m "feat: move fine management into app shell"
```

---

### Task 7: FE09 Shared Workflow Patterns

**Files:**
- Modify: `frontend/src/page/FineManagement.jsx`
- Modify: `frontend/src/styles/fine-management.css`
- Modify: `frontend/test/fineOperationalFrontend.test.js`

**Interfaces:**
- Consumes: Task 6 shell and all existing FE09 local handlers/data helpers.
- Produces: shared toolbar, table, empty state, toast, and confirmations while preserving localStorage/sample-data behavior.

- [ ] **Step 1: Add failing workflow contracts**

Append:

```js
test('FE09 reuses shared workflow components without API alignment', async () => {
  const source = await readFile(new URL('../src/page/FineManagement.jsx', import.meta.url), 'utf8');

  assert.match(source, /DataToolbar/);
  assert.match(source, /DataTable/);
  assert.match(source, /ConfirmAction/);
  assert.match(source, /EmptyState/);
  assert.match(source, /Toast/);
  assert.doesNotMatch(source, /function Toast\(/);
  assert.doesNotMatch(source, /function EmptyState\(/);
  assert.doesNotMatch(source, /<table className="fine-table"/);
  assert.doesNotMatch(source, /authorizedRequest|fineApi/);
  assert.match(source, /DAILY_FINE_RATE/);
  assert.match(source, /saveFineRecords\(fines\)/);
});
```

- [ ] **Step 2: Verify failure**

Run `node --test frontend/test/fineOperationalFrontend.test.js`.

Expected: FAIL on duplicate and missing shared components.

- [ ] **Step 3: Remove duplicate feedback components and translate validation copy**

Import shared `Badge`, `ConfirmAction`, `EmptyState`, `StatusNotice`, `Toast`, and structural `DataTable`, `DataToolbar`. Remove local `Toast` and `EmptyState` functions. Keep `StatusBadge` only as a small adapter over shared `Badge`.

Replace validation strings with the exact Vietnamese equivalents:

```js
errors[field] = 'Trường này là bắt buộc.';
errors.email = 'Email không đúng định dạng.';
errors[field] = 'Giá trị phải là số nguyên dương.';
errors.overdueDays = 'Số ngày quá hạn phải là số nguyên dương.';
errors.amount = 'Số tiền phải lớn hơn 0.';
errors.status = 'Trạng thái không hợp lệ.';
```

- [ ] **Step 4: Migrate fine list toolbar and table**

Use `DataToolbar` for query, status filter, New, and Delete. Use `DataTable` with headers `Phiếu phạt`, `Thành viên`, `Sách`, `Quá hạn`, `Số tiền`, and `Trạng thái`; preserve row selection and add mobile labels.

Use:

```jsx
emptyState={(
  <EmptyState
    icon={ReceiptText}
    title="Không có phiếu phạt phù hợp"
    action={(query || statusFilter !== 'ALL') ? (
      <button type="button" className="btn btn-outline" onClick={() => { setQuery(''); setStatusFilter('ALL'); }}>
        Xóa bộ lọc
      </button>
    ) : null}
  />
)}
```

Keep fine ordering, filtering, selected-fine behavior, local forms, and `saveFineRecords` unchanged.

- [ ] **Step 5: Add consequential-action confirmations**

Add `confirmTarget` state:

```jsx
const [confirmTarget, setConfirmTarget] = useState(null);
```

Use values `{ type: 'delete', fine }`, `{ type: 'collect', fine }`, and `{ type: 'paid', fine }`. Buttons/forms set the target; the shared confirmation calls the existing synchronous handler. Clear the target only after the handler completes.

Render one confirmation:

```jsx
{confirmTarget && (
  <ConfirmAction
    title={confirmTarget.type === 'delete' ? 'Xóa phiếu phạt' : confirmTarget.type === 'collect' ? 'Ghi nhận thu tiền' : 'Đánh dấu đã thanh toán'}
    tone={confirmTarget.type === 'delete' ? 'danger' : 'primary'}
    confirmLabel={confirmTarget.type === 'delete' ? 'Xóa phiếu' : 'Xác nhận'}
    onCancel={() => setConfirmTarget(null)}
    onConfirm={() => {
      if (confirmTarget.type === 'delete') handleDeleteFine();
      if (confirmTarget.type === 'collect') recordCollection();
      if (confirmTarget.type === 'paid') handleMarkPaid();
      setConfirmTarget(null);
    }}
  >
    <p>Kiểm tra lại phiếu phạt và số tiền trước khi tiếp tục.</p>
  </ConfirmAction>
)}
```

Refactor `handleRecordCollection(event)` into `recordCollection()` by removing only `event.preventDefault()`. The form submit prevents default and sets the collect confirmation target. Do not change calculation, transfer validation, or local state updates.

- [ ] **Step 6: Remove obsolete FE09 presentation styles**

Delete `.fine-toolbar`, `.fine-search`, `.fine-select`, `.fine-table*`, `.fine-empty`, and `.fine-toast*` declarations after their markup is gone. Keep form/panel/detail/transfer styles required by the remaining local workflow.

- [ ] **Step 7: Run FE09 tests**

Run:

```powershell
node --test frontend/test/fineOperationalFrontend.test.js frontend/test/operationalPatternsFrontend.test.js
```

Expected: PASS with 0 failures and prototype-boundary assertions intact.

- [ ] **Step 8: Commit**

```powershell
git add frontend/src/page/FineManagement.jsx frontend/src/styles/fine-management.css frontend/test/fineOperationalFrontend.test.js
git commit -m "feat: standardize fine workflow presentation"
```

---

### Task 8: FE12 Report Patterns

**Files:**
- Create: `frontend/test/reportOperationalFrontend.test.js`
- Modify: `frontend/src/page/report/BorrowingReportPage.jsx:1-133`
- Modify: `frontend/src/page/report/InventoryReportPage.jsx:1-184`
- Modify: `frontend/src/page/report/UserStatisticsPage.jsx:1-136`

**Interfaces:**
- Consumes: Task 1 primitives, existing report APIs, filter builders, guards, charts, and view models.
- Produces: shared report filters/tables and outcome-oriented notices without changing report values.

- [ ] **Step 1: Write failing report adoption tests**

Create:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const reportPages = [
  '../src/page/report/BorrowingReportPage.jsx',
  '../src/page/report/InventoryReportPage.jsx',
  '../src/page/report/UserStatisticsPage.jsx',
];

test('FE12 reports use shared toolbar and table patterns', async () => {
  for (const path of reportPages) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /DataToolbar/);
    assert.match(source, /DataTable/);
    assert.doesNotMatch(source, /<table className="lib-table"/);
    assert.doesNotMatch(source, /Đã kết nối backend thật qua GET/);
  }
});

test('FE12 report API and filter contracts remain unchanged', async () => {
  const borrowing = await readFile(new URL(reportPages[0], import.meta.url), 'utf8');
  const inventory = await readFile(new URL(reportPages[1], import.meta.url), 'utf8');
  const users = await readFile(new URL(reportPages[2], import.meta.url), 'utf8');

  assert.match(borrowing, /reportApi\.borrowing\(buildDateRangeReportParams\(from, to\)\)/);
  assert.match(inventory, /reportApi\.inventory\(buildInventoryReportParams\(selectedCategoryId\)\)/);
  assert.match(users, /reportApi\.users\(buildDateRangeReportParams\(from, to\)\)/);
});
```

- [ ] **Step 2: Verify failure**

Run:

```powershell
node --test frontend/test/reportOperationalFrontend.test.js frontend/test/reportFilters.test.js frontend/test/reportAccess.test.js
```

Expected: FAIL on shared pattern and endpoint-copy assertions; existing filter/access tests remain passing.

- [ ] **Step 3: Migrate report toolbars**

- Borrowing/User reports: place date inputs and Apply under `DataToolbar filters`; keep the existing reload action in `AppLayout`.
- Inventory report: place category select under `filters`, Lọc and icon reset under `actions`.
- Keep all input values, submit handlers, disabled states, and parameter builders unchanged.

Set successful load messages to:

```js
setNotice('Dữ liệu báo cáo đã được cập nhật.');
```

- [ ] **Step 4: Migrate report tables**

Replace the top-books, low-inventory, and role/membership tables with `DataTable`. Add `data-label` attributes matching visible Vietnamese headers. Preserve row keys, values, badges, low-stock row class, and empty-state copy.

- [ ] **Step 5: Run report tests**

Run:

```powershell
node --test frontend/test/reportOperationalFrontend.test.js frontend/test/reportFilters.test.js frontend/test/reportAccess.test.js frontend/test/operationalPatternsFrontend.test.js
```

Expected: PASS with 0 failures.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/page/report/BorrowingReportPage.jsx frontend/src/page/report/InventoryReportPage.jsx frontend/src/page/report/UserStatisticsPage.jsx frontend/test/reportOperationalFrontend.test.js
git commit -m "feat: standardize report presentation patterns"
```

---

### Task 9: Slice 3 Validation and Human Review Gate

**Files:**
- Create: `.sdd/reviews/library-ux-slice3-validation-review-2026-07-15.md`
- Modify only if evidence requires correction: files changed in Tasks 1-8

**Interfaces:**
- Consumes: all completed Slice 3 commits.
- Produces: automated evidence and a bounded checklist for Nhat's human review; no merge claim.

- [ ] **Step 1: Run focused frontend contracts**

Run:

```powershell
npm.cmd --prefix frontend test
```

Expected: all frontend Node tests PASS with 0 failures.

- [ ] **Step 2: Run lint and production build**

Run:

```powershell
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Expected: both commands exit `0`; a non-failing Vite chunk-size warning may be recorded but does not block review.

- [ ] **Step 3: Verify scope and whitespace**

Run:

```powershell
git diff main...HEAD --check
git diff main...HEAD --name-only
rg -n "Đã kết nối backend thật qua GET|function Toast\(|function EmptyState\(|className=\"fine-shell\"|<table className=\"lib-table\"" frontend/src/page/borrowing frontend/src/page/reservation frontend/src/component/inventory frontend/src/page/FineManagement.jsx frontend/src/page/report
```

Expected:

- `git diff --check` exits `0`.
- Changed files are limited to approved docs, shared frontend patterns/styles/tests, and target operational pages.
- The source scan returns no endpoint-oriented success copy, FE09 duplicate feedback components/shell, or raw legacy tables in migrated pages.

- [ ] **Step 4: Verify protected contracts did not change**

Run:

```powershell
git diff main...HEAD -- frontend/src/api frontend/src/utils/borrowingAccess.js frontend/src/utils/reportAccess.js backend database
```

Expected: no diff. If any output appears, stop and remove the out-of-scope change before continuing.

- [ ] **Step 5: Write validation record**

Create `.sdd/reviews/library-ux-slice3-validation-review-2026-07-15.md`:

```markdown
# Library UX Slice 3 Validation Review - 2026-07-15

Status: READY FOR HUMAN REVIEW

Branch: `docs/ux-slice3-operational-patterns`

## Scope

Record automated evidence for shared operational patterns and their ordered application to FE07, FE08, FE06, FE09, and FE12. This record does not claim human acceptance, merge, FE06 completion, or FE09-T012 completion.

## Automated Evidence

| Check | Result |
| --- | --- |
| Frontend tests | PASS - all tests, 0 failures |
| Frontend lint | PASS |
| Frontend production build | PASS |
| Diff whitespace | PASS |
| API/backend/database scope | PASS - no changes |
| FE06 boundary | PASS - mock/in-memory ownership retained |
| FE09 boundary | PASS - localStorage/sample-data retained; FE09-T012 open |

## Human Review Checklist

- Borrowing: loading, error, empty, filtered, approval, rejection, renewal, and return confirmation.
- Reservations: demo fallback warning, cancellation, staff list, queue, and notification confirmation.
- Inventory: one page header, filters, empty results, edit dialog, copy table, and prototype warning.
- Fines: shared shell, local tabs, list filters, confirmations, toast, and no loss of embedded book-management access.
- Reports: date/category filters, zero results, values, charts, and table readability.
- Mobile: labeled rows remain understandable at 390px without incoherent overlap.

## Residual Risks

- FE06 remains a prototype until its feature plan/tasks are approved.
- FE09 remains local-data UI until FE09-T012 is implemented.
- Full responsive and keyboard acceptance remains Slice 4.

## Review Outcome

Verdict: **Automated Slice 3 evidence is complete; Nhat's human review is required before integration.**
```

- [ ] **Step 6: Commit the validation record**

```powershell
git add .sdd/reviews/library-ux-slice3-validation-review-2026-07-15.md
git commit -m "docs: record operational UX validation"
```

- [ ] **Step 7: Stop for human review**

Provide Nhat the validation record path, the focused review checklist, and the branch commit summary. Do not merge or push until Nhat explicitly confirms review and requests the next git action.

---

## Traceability Summary

| Requirement | Tasks |
| --- | --- |
| `UX-FE-006`, `AC-UX-005` state coverage | 1-8 |
| `AC-UX-004`, mobile labeled rows | 1-8 |
| `AC-UX-007`, confirmation/focus contract | 1-7 |
| `AC-UX-008`, no API/business/security changes | 1-9 |
| `AC-UX-S3-001` page header | 1, 5, 6 |
| `AC-UX-S3-002` operational states | 1-8 |
| `AC-UX-S3-003` pending confirmations | 1-7 |
| `AC-UX-S3-004` mobile tables | 1-8 |
| `AC-UX-S3-005` FE07 preservation | 2-3, 9 |
| `AC-UX-S3-006` FE08 fallback | 4, 9 |
| `AC-UX-S3-007` FE06 presentation-only | 5, 9 |
| `AC-UX-S3-008` FE09 presentation-only | 6-7, 9 |
| `AC-UX-S3-009` FE12 preservation | 8-9 |
| `AC-UX-S3-010` final scope gate | 9 |
