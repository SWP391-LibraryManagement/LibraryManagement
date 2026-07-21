# Admin Membership Review Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive, Admin-native FE04 membership review module to the existing Admin Console without changing FE04 APIs, schema, state transitions, authorization, audit, or FE10 delivery ownership.

**Architecture:** FE11 owns the Admin shell and adds one `membership` navigation/section composition point. A focused `admin/membership` module consumes the existing `membershipApi`; pure normalization/feedback helpers keep response handling testable while the backend remains authoritative for review rules.

**Tech Stack:** React 19, Vite, Lucide React, Axios, Node test runner, Playwright Chromium, Express FE04 API, SQL Server production repository.

## Global Constraints

- Sidebar order is exactly Home, Dashboard, Library, Circulation, Requests, Users, Membership Review, Audit.
- `Duyệt hội viên` follows `Quản lý người dùng`; Permissions and the removed payment/borrow confirmations stay absent.
- Use only canonical FE04 endpoints; do not create `/api/admin/membership` aliases.
- Preserve `/membership` for Member/Librarian.
- Search is at most 100 characters; rejection reason is trimmed and 1..500; page size is 10.
- Only `PENDING` rows expose decisions; reload authoritative data after every mutation success or failure.
- A `FAILED` notification status is a delivery warning after a committed decision, not a failed decision.
- No backend production, API, schema, migration, role, or membership-state change is allowed; a test-only in-memory FE04 service may be wired into the existing E2E harness.
- No document-level overflow at 1440x900, 1366x768, 1280x720, or 390x844.
- Fast-Track H2 overrides generic frequent commits: keep Tasks 1-4 uncommitted, review once, then commit in Task 5.

## File Map

| File | Responsibility |
| --- | --- |
| `frontend/src/page/admin/membership/adminMembershipPresentation.js` | Pure FE04 list normalization, pending decision, notification feedback. |
| `frontend/src/page/admin/membership/AdminMembershipSection.jsx` | Filters, paging, table/cards, mutations, reload and feedback. |
| `frontend/src/page/admin/membership/AdminMembershipReviewModal.jsx` | Accessible detail, approval confirmation, rejection input. |
| `frontend/src/page/admin/adminNavigation.js` | Exact eight-entry sidebar. |
| `frontend/src/page/admin/AdminConsolePage.jsx` | Admin-only section composition. |
| `frontend/src/page/admin/admin-console.css` | Responsive module and warning toast. |
| `frontend/test/*.test.js` | Pure/source ownership and regression contracts. |
| `backend/tests/helpers/systemIntegrationHarness.js` | Test-only in-memory FE04 service for authenticated browser acceptance. |
| `tests/e2e/fe04-admin-membership-review.spec.js` | Authenticated real FE04 review acceptance. |

---

### Task 1: Navigation And Pure Presentation Contracts

**Files:**
- Create: `frontend/src/page/admin/membership/adminMembershipPresentation.js`
- Modify: `frontend/src/page/admin/adminNavigation.js`
- Modify: `frontend/test/adminConsolePresentation.test.js`
- Modify: `frontend/test/appShellFrontend.test.js`

**Interfaces:**
- Consumes: `{ applications, page, limit, total, totalPages }`.
- Produces: `ADMIN_MEMBERSHIP_PAGE_SIZE`, `EMPTY_ADMIN_MEMBERSHIP_FILTERS`, `normalizeAdminMembershipList`, `isPendingMembershipApplication`, `getMembershipDecisionFeedback`.

- [ ] **Step 1: Write failing navigation and helper tests**

```js
import {
  getMembershipDecisionFeedback,
  isPendingMembershipApplication,
  normalizeAdminMembershipList,
} from '../src/page/admin/membership/adminMembershipPresentation.js';

test('Admin navigation keeps the approved eight entries in order without Permissions', () => {
  assert.deepEqual(ADMIN_NAVIGATION.map(({ id, label }) => [id, label]), [
    ['home', 'Trang chủ'], ['dashboard', 'Tổng quan'], ['library', 'Thư viện'],
    ['circulation', 'Quản lý mượn trả'], ['requests', 'Quản lý yêu cầu'],
    ['users', 'Quản lý người dùng'], ['membership', 'Duyệt hội viên'],
    ['audit', 'Nhật ký hoạt động'],
  ]);
});

test('Admin membership presentation keeps canonical paging and safe feedback', () => {
  const result = normalizeAdminMembershipList({
    applications: [{ applicationId: 41, status: 'pending', applicant: { email: 'an@example.test' } }],
    page: 2, limit: 10, total: 11, totalPages: 2,
  });
  assert.equal(result.applications[0].status, 'PENDING');
  assert.deepEqual(result.pagination, { page: 2, limit: 10, total: 11, totalPages: 2 });
  assert.equal(isPendingMembershipApplication(result.applications[0]), true);
  assert.deepEqual(getMembershipDecisionFeedback('approve', 'FAILED'), {
    type: 'warning', message: 'Đã duyệt đơn, nhưng thông báo kết quả chưa gửi được.',
  });
});
```

Update `appShellFrontend.test.js` to require `Duyệt hội viên` and replace the old Membership-negative assertion with:

```js
assert.match(navigation, /\{ id: 'membership'[^\n]+label: 'Duyệt hội viên'/);
assert.doesNotMatch(navigation, /label: 'Phân quyền'/);
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --test frontend/test/adminConsolePresentation.test.js frontend/test/appShellFrontend.test.js
```

Expected: FAIL because the helper file is absent and navigation still has seven entries.

- [ ] **Step 3: Implement minimal pure contracts**

Create the helper with these exact exports:

```js
export const ADMIN_MEMBERSHIP_PAGE_SIZE = 10;
export const EMPTY_ADMIN_MEMBERSHIP_FILTERS = Object.freeze({ q: '', status: 'PENDING' });

export function normalizeAdminMembershipList(response = {}, fallback = {}) {
  const rows = Array.isArray(response) ? response : response.applications || response.items || response.data || [];
  const limit = Number(response.limit || response.pagination?.limit || fallback.limit || ADMIN_MEMBERSHIP_PAGE_SIZE);
  const total = Number(response.total || response.pagination?.total || rows.length || 0);
  return {
    applications: rows.map((row) => ({
      applicationId: Number(row.applicationId || row.id),
      userId: row.userId ?? null,
      status: String(row.status || '').toUpperCase(),
      appliedAt: row.appliedAt || row.createdAt || null,
      approvedAt: row.approvedAt || null,
      rejectionReason: row.rejectionReason || row.reviewNote || null,
      applicant: {
        userId: row.applicant?.userId ?? row.userId ?? null,
        fullName: row.applicant?.fullName || row.fullName || row.name || '',
        username: row.applicant?.username || row.username || row.userName || '',
        email: row.applicant?.email || row.email || '',
        phone: row.applicant?.phone || row.phone || '',
      },
    })),
    pagination: {
      page: Number(response.page || response.pagination?.page || fallback.page || 1),
      limit,
      total,
      totalPages: Number(response.totalPages || response.pagination?.totalPages || Math.max(Math.ceil(total / limit), 1)),
    },
  };
}

export function isPendingMembershipApplication(application) {
  return String(application?.status || '').toUpperCase() === 'PENDING';
}

export function getMembershipDecisionFeedback(action, notificationStatus) {
  const approved = action === 'approve';
  if (notificationStatus === 'FAILED') return {
    type: 'warning',
    message: `${approved ? 'Đã duyệt đơn' : 'Đã từ chối đơn'}, nhưng thông báo kết quả chưa gửi được.`,
  };
  return {
    type: 'success',
    message: approved ? 'Đã duyệt đơn đăng ký hội viên.' : 'Đã từ chối đơn đăng ký hội viên.',
  };
}
```

Import `UserCheck` in `adminNavigation.js` and insert:

```js
{ id: 'users', icon: Users, label: 'Quản lý người dùng' },
{ id: 'membership', icon: UserCheck, label: 'Duyệt hội viên' },
{ id: 'audit', icon: ClipboardList, label: 'Nhật ký hoạt động' },
```

- [ ] **Step 4: Verify GREEN**

Run the Step 2 command. Expected: PASS with zero failures.

- [ ] **Step 5: Record checkpoint**

Run `git diff --check` and `git status --short`. Expected: only Task 1 frontend/test files; do not commit before H2.

---

### Task 2: Read-Only Admin Membership Directory

**Files:**
- Create: `frontend/src/page/admin/membership/AdminMembershipSection.jsx`
- Modify: `frontend/src/page/admin/AdminConsolePage.jsx`
- Modify: `frontend/src/page/admin/admin-console.css`
- Modify: `frontend/test/adminConsoleStructure.test.js`
- Modify: `frontend/test/membershipFrontend.test.js`
- Modify: `frontend/test/userManagementFrontend.test.js`

**Interfaces:**
- Consumes: Task 1 helpers and `membershipApi.listApplications(params)`.
- Produces: `AdminMembershipSection({ onToast })` with applied filters `{ q, status }` and server pagination.

- [ ] **Step 1: Write failing ownership/composition tests**

Append to `adminConsoleStructure.test.js`:

```js
test('Admin membership section consumes canonical FE04 reads inside the Admin shell', async () => {
  const section = await readFile(new URL('membership/AdminMembershipSection.jsx', root), 'utf8');
  const page = await readFile(new URL('AdminConsolePage.jsx', root), 'utf8');
  assert.match(section, /membershipApi\.listApplications\(/);
  assert.match(section, /q:\s*appliedFilters\.q/);
  assert.match(section, /status:\s*appliedFilters\.status/);
  assert.match(section, /page:\s*membershipPage/);
  assert.match(section, /limit:\s*ADMIN_MEMBERSHIP_PAGE_SIZE/);
  assert.match(section, /admin-membership-table/);
  assert.match(section, /admin-membership-cards/);
  assert.doesNotMatch(section, /adminApi\.|\/api\/admin\/membership/);
  assert.match(page, /activeSection === 'membership'/);
  assert.match(page, /<AdminMembershipSection onToast=\{setToast\}/);
});
```

Replace the obsolete exclusion in `membershipFrontend.test.js` with:

```js
test('FE04 keeps its workspace and powers embedded Admin review', async () => {
  const page = await readFile(new URL('../src/page/admin/AdminConsolePage.jsx', import.meta.url), 'utf8');
  const section = await readFile(new URL('../src/page/admin/membership/AdminMembershipSection.jsx', import.meta.url), 'utf8');
  assert.match(page, /activeSection === 'membership'/);
  assert.match(section, /membershipApi\.listApplications/);
  assert.doesNotMatch(section, /adminApi\.|\/api\/admin\/membership/);
});
```

In `userManagementFrontend.test.js`, retain only the FE09/payment exclusion:

```js
assert.doesNotMatch(adminSource, /getFineRecords|saveFineRecords/);
assert.doesNotMatch(adminSource, /activeSection === ['"]payments['"]/);
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --test frontend/test/adminConsoleStructure.test.js frontend/test/membershipFrontend.test.js frontend/test/userManagementFrontend.test.js
```

Expected: FAIL because the section and composition do not exist.

- [ ] **Step 3: Implement server-owned list state and rendering**

Create `AdminMembershipSection.jsx` with this state/load contract:

```jsx
import { FilterX, RefreshCw, Search, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { membershipApi } from '../../../api/libraryFeatureApi';
import MembershipStatusBadge from '../../../component/membership/MembershipStatusBadge';
import { createLatestRequestGuard } from '../../../utils/latestRequestGuard';
import { AdminActionButton } from '../components/AdminActionButton';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminFilterBar } from '../components/AdminFilterBar';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPagination } from '../components/AdminPagination';
import { ADMIN_MEMBERSHIP_PAGE_SIZE, EMPTY_ADMIN_MEMBERSHIP_FILTERS, normalizeAdminMembershipList } from './adminMembershipPresentation';

export function AdminMembershipSection({ onToast }) {
const [applications, setApplications] = useState([]);
const [membershipFilters, setMembershipFilters] = useState({ ...EMPTY_ADMIN_MEMBERSHIP_FILTERS });
const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_ADMIN_MEMBERSHIP_FILTERS });
const [membershipPage, setMembershipPage] = useState(1);
const [pagination, setPagination] = useState({ page: 1, limit: ADMIN_MEMBERSHIP_PAGE_SIZE, total: 0, totalPages: 1 });
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const requestGuard = useRef(createLatestRequestGuard());
const notify = useCallback((type, message) => onToast?.({ type, message }), [onToast]);

const loadApplications = useCallback(async ({ announce = false } = {}) => {
  const token = requestGuard.current.begin();
  setLoading(true);
  setError('');
  try {
    const result = normalizeAdminMembershipList(await membershipApi.listApplications({
      q: appliedFilters.q || undefined,
      status: appliedFilters.status === 'ALL' ? undefined : appliedFilters.status,
      page: membershipPage,
      limit: ADMIN_MEMBERSHIP_PAGE_SIZE,
    }), { page: membershipPage, limit: ADMIN_MEMBERSHIP_PAGE_SIZE });
    if (!requestGuard.current.isLatest(token)) return;
    setApplications(result.applications);
    setPagination(result.pagination);
    if (announce) notify('success', 'Đã làm mới danh sách đơn hội viên.');
  } catch (loadError) {
    if (!requestGuard.current.isLatest(token)) return;
    setApplications([]);
    setError(loadError.message);
    notify('error', loadError.message);
  } finally {
    if (requestGuard.current.isLatest(token)) setLoading(false);
  }
}, [appliedFilters, membershipPage, notify]);

useEffect(() => {
  const timer = window.setTimeout(loadApplications, 0);
  return () => window.clearTimeout(timer);
}, [loadApplications]);

function applyFilters() {
  const q = membershipFilters.q.trim();
  if (q.length > 100) {
    notify('error', 'Nội dung tìm kiếm không được vượt quá 100 ký tự.');
    return;
  }
  setMembershipPage(1);
  setAppliedFilters({ q, status: membershipFilters.status });
}

function resetFilters() {
  setMembershipFilters({ ...EMPTY_ADMIN_MEMBERSHIP_FILTERS });
  setMembershipPage(1);
  setAppliedFilters({ ...EMPTY_ADMIN_MEMBERSHIP_FILTERS });
}
```

Add these complete presentation functions above the component:

```jsx
function formatMembershipDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function ApplicantIdentity({ application }) {
  const applicant = application.applicant;
  return <div className="admin-membership-applicant"><strong>{applicant.fullName || applicant.username || 'Chưa có tên'}</strong><small>{applicant.username || `User #${applicant.userId || application.userId}`}</small></div>;
}

function renderMembershipRow(application) {
  return <tr key={application.applicationId}><td>#{application.applicationId}</td><td><ApplicantIdentity application={application} /></td><td><strong>{application.applicant.email || '-'}</strong><small>{application.applicant.phone || '-'}</small></td><td>{formatMembershipDate(application.appliedAt)}</td><td><MembershipStatusBadge status={application.status} /></td></tr>;
}

function renderMembershipCard(application) {
  return <article className="admin-membership-card" key={application.applicationId}><header><strong>#{application.applicationId}</strong><MembershipStatusBadge status={application.status} /></header><ApplicantIdentity application={application} /><p>{application.applicant.email || '-'}</p><p>{application.applicant.phone || '-'}</p><small>{formatMembershipDate(application.appliedAt)}</small></article>;
}
```

Render these exact UI contracts:

```jsx
return <section className="admin-membership admin-membership-directory">
<AdminPageHeader eyebrow="FE04 · Xét duyệt hội viên" title="Duyệt hội viên" refreshing={loading} onRefresh={() => loadApplications({ announce: true })} />
<div className="admin-section-status" aria-live="polite"><span>{loading ? 'Đang đồng bộ dữ liệu FE04.' : 'Danh sách dùng dữ liệu mới nhất từ máy chủ.'}</span>{error ? <strong className="admin-text-error">{error}</strong> : null}</div>
<AdminFilterBar actions={<><AdminActionButton icon={Search} label="Áp dụng" tone="primary" disabled={loading} onClick={applyFilters} /><AdminActionButton icon={FilterX} label="Đặt lại" disabled={loading} onClick={resetFilters} /></>}>
  <label className="admin-field admin-field--search"><span>Tìm đơn hội viên</span><input maxLength={100} value={membershipFilters.q} placeholder="Mã đơn, tên, username hoặc email" onChange={(event) => setMembershipFilters((current) => ({ ...current, q: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter') applyFilters(); }} /></label>
  <label className="admin-field"><span>Trạng thái</span><select aria-label="Lọc trạng thái hội viên" value={membershipFilters.status} onChange={(event) => setMembershipFilters((current) => ({ ...current, status: event.target.value }))}><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Từ chối</option><option value="ALL">Tất cả</option></select></label>
</AdminFilterBar>
<div className="admin-table-scroll admin-membership-table"><table className="admin-data-table" aria-label="Danh sách đơn đăng ký hội viên"><thead><tr><th>Mã đơn</th><th>Người nộp</th><th>Liên hệ</th><th>Ngày nộp</th><th>Trạng thái</th></tr></thead><tbody>{applications.map(renderMembershipRow)}</tbody></table></div>
<div className="admin-membership-cards">{applications.map(renderMembershipCard)}</div>
{!loading && applications.length === 0 ? <AdminEmptyState icon={UserCheck} title="Không có đơn hội viên phù hợp" description="Hãy điều chỉnh bộ lọc hoặc làm mới dữ liệu." /> : null}
{loading && applications.length === 0 ? <AdminEmptyState icon={RefreshCw} title="Đang tải đơn hội viên" description="Dữ liệu đang được đồng bộ từ FE04." /> : null}
<AdminPagination page={membershipPage} totalItems={pagination.total} pageSize={pagination.limit} onPageChange={setMembershipPage} />
</section>;
}
```

Place `formatMembershipDate`, `ApplicantIdentity`, `renderMembershipRow`, and `renderMembershipCard` above `AdminMembershipSection` so the complete file compiles without forward state dependencies.

Import the section in `AdminConsolePage.jsx` and compose it immediately after users:

```jsx
) : activeSection === 'membership' ? (
  <AdminMembershipSection onToast={setToast} />
) : activeSection === 'dashboard' ? (
```

Add baseline CSS:

```css
.admin-membership-directory { display: grid; gap: 16px; }
.admin-membership-table { display: block; }
.admin-membership-cards { display: none; }
.admin-membership-applicant { display: grid; min-width: 0; gap: 3px; }
.admin-membership-applicant strong,
.admin-membership-applicant small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin-membership-card { display: grid; gap: 8px; padding: 16px; border: 1px solid var(--admin-line); border-radius: 16px; background: var(--admin-paper); }
```

- [ ] **Step 4: Verify GREEN**

Run the Step 2 command and `npm.cmd --prefix frontend run build`.

Expected: focused tests pass and Vite reports a successful build.

- [ ] **Step 5: Record checkpoint**

Run `git diff --check` and inspect scope. Expected: Task 1-2 frontend/tests only; no backend file.

---

### Task 3: Approval, Rejection, Conflict Reload, And FE10 Feedback

**Files:**
- Create: `frontend/src/page/admin/membership/AdminMembershipReviewModal.jsx`
- Modify: `frontend/src/page/admin/membership/AdminMembershipSection.jsx`
- Modify: `frontend/src/page/admin/admin-console.css`
- Modify: `frontend/test/adminConsoleStructure.test.js`

**Interfaces:**
- Consumes: `membershipApi.approve`, `membershipApi.reject`, `isPendingMembershipApplication`, `getMembershipDecisionFeedback`.
- Produces: `AdminMembershipReviewModal({ application, saving, onClose, onApprove, onReject })`.

- [ ] **Step 1: Write failing mutation/modal test**

```js
test('Admin membership decisions preserve FE04 review rules', async () => {
  const section = await readFile(new URL('membership/AdminMembershipSection.jsx', root), 'utf8');
  const modal = await readFile(new URL('membership/AdminMembershipReviewModal.jsx', root), 'utf8');
  assert.match(section, /membershipApi\.approve\(selectedApplication\.applicationId\)/);
  assert.match(section, /membershipApi\.reject\(selectedApplication\.applicationId, cleanReason\)/);
  assert.match(section, /await loadApplications\(\)/);
  assert.match(section, /getMembershipDecisionFeedback/);
  assert.match(modal, /isPendingMembershipApplication/);
  assert.match(modal, /maxLength=\{500\}/);
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /Chỉ có thể xem/);
});
```

- [ ] **Step 2: Verify RED**

Run `node --test frontend/test/adminConsoleStructure.test.js`.

Expected: FAIL because the modal and mutation handlers are absent.

- [ ] **Step 3: Implement modal and authoritative mutation flow**

Create the modal with this complete decision boundary:

```jsx
import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import MembershipStatusBadge from '../../../component/membership/MembershipStatusBadge';
import { isPendingMembershipApplication } from './adminMembershipPresentation';

export function AdminMembershipReviewModal({ application, saving, onClose, onApprove, onReject }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const closeButtonRef = useRef(null);
  const pending = isPendingMembershipApplication(application);
  useEffect(() => { closeButtonRef.current?.focus(); }, []);

  function submitRejection() {
    const cleanReason = reason.trim();
    if (!cleanReason) { setError('Lý do từ chối là bắt buộc.'); return; }
    if (cleanReason.length > 500) { setError('Lý do từ chối không được vượt quá 500 ký tự.'); return; }
    onReject(cleanReason);
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={() => { if (!saving) onClose(); }}>
      <div className="admin-modal admin-modal--compact" role="dialog" aria-modal="true" aria-labelledby="admin-membership-review-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal__header"><div><p>FE04 · Chi tiết đơn</p><h2 id="admin-membership-review-title">Đơn hội viên #{application.applicationId}</h2></div><button ref={closeButtonRef} type="button" disabled={saving} onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button></header>
        <div className="admin-modal__body admin-modal__body--single admin-membership-detail">
          <p><strong>Người nộp</strong><span>{application.applicant.fullName || application.applicant.username || '-'}</span></p>
          <p><strong>Username</strong><span>{application.applicant.username || '-'}</span></p>
          <p><strong>Email</strong><span>{application.applicant.email || '-'}</span></p>
          <p><strong>Số điện thoại</strong><span>{application.applicant.phone || '-'}</span></p>
          <p><strong>Trạng thái</strong><MembershipStatusBadge status={application.status} /></p>
          {pending ? <label className="admin-field"><span>Lý do từ chối</span><textarea value={reason} maxLength={500} onChange={(event) => { setReason(event.target.value); setError(''); }} placeholder="Bắt buộc khi từ chối đơn" /><small>{reason.length}/500 ký tự</small>{error ? <small className="admin-field-error">{error}</small> : null}</label> : <p className="admin-form-note">Đơn đã được xử lý. Chỉ có thể xem thông tin.</p>}
        </div>
        {pending ? <footer className="admin-modal__actions"><button type="button" disabled={saving} onClick={submitRejection}>Từ chối</button><button className="admin-modal__primary" type="button" disabled={saving} onClick={onApprove}><Check aria-hidden="true" />{saving ? 'Đang xử lý...' : 'Xác nhận duyệt đơn'}</button></footer> : null}
      </div>
    </div>
  );
}
```

Add this state and close/open contract to the section:

```jsx
const [selectedApplication, setSelectedApplication] = useState(null);
const [saving, setSaving] = useState(false);
const returnFocusRef = useRef(null);

function openApplication(application, event) {
  returnFocusRef.current = event.currentTarget;
  setSelectedApplication(application);
}

function closeApplication() {
  setSelectedApplication(null);
  window.requestAnimationFrame(() => returnFocusRef.current?.focus());
}
```

Use these handlers:

```jsx
async function approveSelected() {
  if (!selectedApplication || saving) return;
  setSaving(true);
  try {
    const result = await membershipApi.approve(selectedApplication.applicationId);
    closeApplication();
    await loadApplications();
    const feedback = getMembershipDecisionFeedback('approve', result.notificationStatus);
    notify(feedback.type, feedback.message);
  } catch (actionError) {
    notify('error', actionError.message);
    await loadApplications();
    closeApplication();
  } finally {
    setSaving(false);
  }
}

async function rejectSelected(reason) {
  if (!selectedApplication || saving) return;
  const cleanReason = reason.trim();
  if (!cleanReason || cleanReason.length > 500) return;
  setSaving(true);
  try {
    const result = await membershipApi.reject(selectedApplication.applicationId, cleanReason);
    closeApplication();
    await loadApplications();
    const feedback = getMembershipDecisionFeedback('reject', result.notificationStatus);
    notify(feedback.type, feedback.message);
  } catch (actionError) {
    notify('error', actionError.message);
    await loadApplications();
    closeApplication();
  } finally {
    setSaving(false);
  }
}
```

Replace the Task 2 row/card renderers with action-aware versions using this exact action:

```jsx
function MembershipRowAction({ application, onOpen }) {
  const label = isPendingMembershipApplication(application) ? 'Xử lý' : 'Chi tiết';
  return <AdminActionButton icon={Eye} label={label} tone={label === 'Xử lý' ? 'primary' : 'neutral'} onClick={(event) => onOpen(application, event)} />;
}
```

Add an action column to the table, render `<MembershipRowAction application={application} onOpen={openApplication} />` in each row/card, and pass `Eye`, `AdminActionButton`, `isPendingMembershipApplication`, and `openApplication` through the exact existing imports/scope. Render the modal with the focus-restoring close handler:

```jsx
{selectedApplication ? <AdminMembershipReviewModal application={selectedApplication} saving={saving} onClose={closeApplication} onApprove={approveSelected} onReject={rejectSelected} /> : null}
```

Add styles:

```css
.admin-toast--warning { background: #8a5a12; }
.admin-membership-detail p { display: grid; gap: 4px; margin: 0; }
.admin-membership-detail p > span { overflow-wrap: anywhere; }
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
node --test frontend/test/adminConsolePresentation.test.js frontend/test/adminConsoleStructure.test.js frontend/test/membershipFrontend.test.js
npm.cmd --prefix frontend run lint
```

Expected: all tests pass and ESLint reports no findings.

- [ ] **Step 5: Record checkpoint**

Run `git diff --check`; confirm no backend/API/schema production file changed and keep the diff uncommitted for H2.

---

### Task 4: Responsive Authenticated Browser Acceptance

**Files:**
- Modify: `frontend/src/page/admin/admin-console.css`
- Modify: `backend/tests/helpers/systemIntegrationHarness.js`
- Create: `tests/e2e/fe04-admin-membership-review.spec.js`
- Modify: `tests/e2e/fe11-admin-request-management.spec.js`

**Interfaces:**
- Consumes: Admin Membership DOM classes and real FE04 endpoints.
- Produces: `E2E-FE04-ADM01` plus screenshots at 1440, 1366, 1280, and 390.

- [ ] **Step 1: Add FE04 to the test-only system harness**

The existing browser server otherwise falls through to the production SQL-backed membership service. Extend only `backend/tests/helpers/systemIntegrationHarness.js` with the in-memory FE04 dependency already used by `membershipRoutes.test.js`:

```js
const { createMembershipService } = require('../../src/services/membershipService');
const { makeInMemoryMembershipDependencies } = require('./inMemoryMembershipRepositories');
```

After constructing `notificationService`, create:

```js
const membershipDependencies = makeInMemoryMembershipDependencies(authDependencies.state);
const membershipService = createMembershipService({
  membershipRepository: membershipDependencies.membershipRepository,
  auditLogRepository: authDependencies.auditLogRepository,
  notificationRequester: notificationService.createSourceNotificationRequester('FE04'),
});
```

Add `membershipService` to `services` and `membershipDependencies` to `dependencies`. Do not modify `backend/src/**`, the FE04 endpoint contract, or `createVerifiedActor`; E2E applicants must still submit through `POST /api/membership/applications`.

- [ ] **Step 2: Write failing real-browser acceptance**

Create the new spec with the existing login/setup helpers and this exact flow:

```js
const { randomUUID } = require('crypto');
const { test, expect } = require('@playwright/test');

const FRONTEND_URL = process.env.E2E_FRONTEND_URL || `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT || 4173}`;
const BACKEND_URL = process.env.E2E_BACKEND_URL || `http://127.0.0.1:${process.env.E2E_BACKEND_PORT || 3100}`;

async function login(page, email, password, expectedPath) {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.getByLabel('Tài khoản của bạn').fill(email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe(expectedPath);
}

async function storedAccessToken(page) {
  return page.evaluate(() => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'));
}

// @spec FR-FE04-014 AC-FE04-013 BR-FE11-016 AC-FE11-016
test('[E2E-FE04-ADM01] Admin reviews Membership inside the responsive Admin Console', async ({ page, request }) => {
  const runId = randomUUID();
  const password = `E2e-${runId}!A1`;
  const memberEmail = `membership-member-${runId}@example.test`;
  const librarianEmail = `membership-librarian-${runId}@example.test`;
  const adminEmail = `membership-admin-${runId}@example.test`;
  const setup = await request.post(`${BACKEND_URL}/__e2e__/setup`, { data: { memberEmail, librarianEmail, adminEmail, password } });
  expect(setup.status()).toBe(201);

  await login(page, memberEmail, password, '/home');
  const memberHeaders = { Authorization: `Bearer ${await storedAccessToken(page)}` };
  const applied = await request.post(`${BACKEND_URL}/api/membership/applications`, { headers: memberHeaders, data: {} });
  expect(applied.status()).toBe(201);
  const rejectedApplicationId = (await applied.json()).currentApplication.applicationId;

  await login(page, adminEmail, password, '/admin/users');
  await expect(page.locator('.admin-shell__sidebar .admin-shell__nav-item')).toHaveCount(8);
  await expect(page.locator('.admin-shell__sidebar').getByRole('button', { name: 'Phân quyền', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Duyệt hội viên', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Duyệt hội viên', exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Danh sách đơn đăng ký hội viên' })).toContainText(memberEmail);

  await page.setViewportSize({ width: 1600, height: 900 });
  await expect(page.locator('.admin-membership-table')).toBeVisible();
  await expect(page.locator('.admin-membership-cards')).toBeHidden();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.admin-membership-table')).toBeHidden();
    await expect(page.locator('.admin-membership-cards')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await page.screenshot({ path: `output/playwright/admin-membership-${viewport.width}.png`, fullPage: true });
  }

  await page.getByRole('button', { name: 'Xử lý', exact: true }).click();
  const rejectionDialog = page.getByRole('dialog');
  await rejectionDialog.getByRole('button', { name: 'Từ chối', exact: true }).click();
  await expect(rejectionDialog.getByText('Lý do từ chối là bắt buộc.', { exact: true })).toBeVisible();
  await rejectionDialog.getByLabel('Lý do từ chối').fill('Thông tin đăng ký chưa đầy đủ.');
  const rejectResponse = page.waitForResponse((response) => response.request().method() === 'PATCH' && response.url().endsWith(`/api/membership/applications/${rejectedApplicationId}/reject`));
  await rejectionDialog.getByRole('button', { name: 'Từ chối', exact: true }).click();
  expect((await rejectResponse).status()).toBe(200);
  await expect(page.getByText('Đã từ chối đơn đăng ký hội viên.', { exact: true })).toBeVisible();

  const reapplied = await request.post(`${BACKEND_URL}/api/membership/applications`, { headers: memberHeaders, data: {} });
  expect(reapplied.status()).toBe(201);
  const approvedApplicationId = (await reapplied.json()).currentApplication.applicationId;
  const pendingReload = page.waitForResponse((response) => response.request().method() === 'GET' && response.url().includes('/api/membership/applications'));
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  expect((await pendingReload).status()).toBe(200);
  await page.getByRole('button', { name: 'Xử lý', exact: true }).click();
  const approveResponse = page.waitForResponse((response) => response.request().method() === 'PATCH' && response.url().endsWith(`/api/membership/applications/${approvedApplicationId}/approve`));
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận duyệt đơn' }).click();
  expect((await approveResponse).status()).toBe(200);
  await expect(page.getByText('Đã duyệt đơn đăng ký hội viên.', { exact: true })).toBeVisible();

  await page.getByLabel('Lọc trạng thái hội viên').selectOption('ALL');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Chỉ có thể xem');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Đóng' }).click();
  await page.getByRole('button', { name: 'Mở menu quản trị', exact: true }).click();
  await page.getByRole('button', { name: 'Duyệt hội viên', exact: true }).click();
  await expect(page.locator('.admin-membership-cards')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.screenshot({ path: 'output/playwright/admin-membership-390.png', fullPage: true });
});
```

Change the existing FE11 spec's navigation count from 7 to 8.

- [ ] **Step 3: Verify RED**

Run:

```powershell
$env:E2E_FRONTEND_PORT='48173'
$env:E2E_BACKEND_PORT='43100'
npx.cmd playwright test tests/e2e/fe04-admin-membership-review.spec.js --project=chromium
```

Expected: FAIL before the responsive module/action contract is complete.

- [ ] **Step 4: Complete responsive CSS**

```css
@media (max-width: 1440px) {
  .admin-membership-table { display: none; }
  .admin-membership-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
}

@media (max-width: 900px) {
  .admin-membership-cards { grid-template-columns: 1fr; }
  .admin-membership-card .admin-action-button { width: 100%; justify-content: center; }
}
```

Keep every card/control width fluid and render the action inside each card.

- [ ] **Step 5: Verify GREEN and inspect images**

Run:

```powershell
npx.cmd playwright test tests/e2e/fe04-admin-membership-review.spec.js tests/e2e/fe11-admin-request-management.spec.js --project=chromium
node --test frontend/test/adminConsolePresentation.test.js frontend/test/adminConsoleStructure.test.js frontend/test/membershipFrontend.test.js frontend/test/appShellFrontend.test.js frontend/test/userManagementFrontend.test.js
```

Expected: Chromium 2/2 and every focused Node test pass. Open every generated image and confirm no clipped sidebar, no page overflow, readable identity/contact, reachable action, modal inside viewport, and one-column mobile cards.

- [ ] **Step 6: Record checkpoint**

Run `git diff --check`; retain screenshots as local evidence and keep product changes uncommitted pending H2.

---

### Task 5: L1-L4 Validation, H2 Commit, Push, And Azure Staging

**Files:**
- Modify: `.sdd/specs/feat-membership-management/PLAN.md`
- Modify: `.sdd/specs/feat-membership-management/TASKS.md`
- Modify: `.sdd/specs/feat-membership-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-membership-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Create: `.sdd/reviews/admin-membership-review-integration-validation-2026-07-22.md`

**Interfaces:**
- Consumes: complete Tasks 1-4 diff and evidence.
- Produces: reviewed implementation/evidence commits, staging run, and open human acceptance gate.

- [ ] **Step 1: Run the fresh validation matrix**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js tests/systemIntegration.test.js
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
$env:E2E_FRONTEND_PORT='48173'
$env:E2E_BACKEND_PORT='43100'
npx.cmd playwright test tests/e2e/fe04-admin-membership-review.spec.js tests/e2e/fe11-admin-request-management.spec.js --project=chromium
git diff --check
```

Expected: both focused backend suites pass; frontend has zero failures; lint/build pass; every implemented feature stays above 70% trace; Chromium 2/2; no diff errors.

- [ ] **Step 2: Perform H2 review**

Record all four layers:

```text
L1 Automated: every Step 1 command passes.
L2 Spec: FR-FE04-014, AC-FE04-013, BR-FE11-016, AC-FE11-016 map to source/tests.
L3 Safety: FE04 server authorization remains authoritative; no backend production/API/schema/credential/unsafe-HTML change; the only backend-side diff is the in-memory E2E harness wiring.
L4 Acceptance: local authenticated Chromium/images pass; Azure human review remains open.
```

Reject any production change outside the Admin membership/shell presentation boundary.

- [ ] **Step 3: Write evidence and synchronize tasks**

The validation record must include exact counts, commands, screenshot paths, Core/Shell ownership, and this open-gate statement:

```text
FE04-ADM05 and FE11-UXR09 remain open until authenticated Azure Staging review is explicitly approved by the human reviewer.
```

- [ ] **Step 4: Commit after H2**

```powershell
git add -- frontend/src/page/admin frontend/test backend/tests/helpers/systemIntegrationHarness.js tests/e2e/fe04-admin-membership-review.spec.js tests/e2e/fe11-admin-request-management.spec.js
git commit -m "feat: integrate membership review into admin console"
git add -- .sdd/specs/feat-membership-management .sdd/specs/feat-user-role-management .sdd/reviews/admin-membership-review-integration-validation-2026-07-22.md
git commit -m "docs: record admin membership review validation"
```

Expected: product/tests and evidence are separate reviewed commits; working tree is clean.

- [ ] **Step 5: Push and deploy reviewed HEAD**

```powershell
git push origin chore/release-closeout-reconciliation
gh workflow run deploy-staging.yml --ref chore/release-closeout-reconciliation
gh run list --workflow deploy-staging.yml --branch chore/release-closeout-reconciliation --event workflow_dispatch --limit 1
```

Watch the returned run until backend, frontend, and smoke jobs are `success`, then verify:

```powershell
Invoke-WebRequest -Uri 'https://app-library-api-staging-nhat714.azurewebsites.net/health' -UseBasicParsing
Invoke-WebRequest -Uri 'https://lemon-wave-04db51100.7.azurestaticapps.net/admin/users' -UseBasicParsing
```

Expected: workflow SHA equals reviewed HEAD and both URLs return HTTP 200.

- [ ] **Step 6: Record deployment and request human acceptance**

Append the exact run URL/ID and deployed SHA to validation/TASKS/CHANGELOG, commit and push that documentation-only update, then ask the reviewer to verify `Duyệt hội viên` on desktop/mobile. Keep FE04-ADM05 and FE11-UXR09 open until explicit approval.
