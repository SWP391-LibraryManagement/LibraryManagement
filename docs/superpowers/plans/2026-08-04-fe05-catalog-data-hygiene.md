# FE05 Catalog Data Hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove verified synthetic acceptance fixture graphs from staging and stop one-book status changes from presenting a target-status-only list that looks like a bulk update.

**Architecture:** FE05 continues to mutate one canonical `bookId` through the existing PATCH endpoints. After success, the frontend retains search/category, clears the status filter, resets to page 1, and reloads a mixed-status server list. A separate tracked backend operator script discovers exact acceptance identities, defaults to dry-run, and hard-deletes one verified fixture graph per serializable transaction only on `LibraryManagementStaging`.

**Tech Stack:** React, Node.js, Jest, Node test runner, SQL Server through `mssql`, existing SDD documents.

## Global Constraints

- No schema, public API, role, or dependency change.
- ISBN remains optional for real FE05 books.
- FE05 must never mutate `BookCopies.Status` during normal catalog operations.
- Cleanup must be staging-only, parameterized, transactional, dry-run by default, and exact-run scoped.
- Do not print credentials, token hashes, connection strings, or synthetic passwords.

---

### Task 1: Reconcile FE05 Status-List Contract

**Files:**
- Modify: `.sdd/specs/feat-book-management/SPEC.md`
- Modify: `.sdd/specs/feat-book-management/PLAN.md`
- Modify: `.sdd/specs/feat-book-management/TASKS.md`
- Modify: `.sdd/specs/feat-book-management/CHANGELOG.md`
- Modify: `frontend/test/bookManagementFrontend.test.js`

**Interfaces:**
- Consumes: existing `loadBooks({ q, status, categoryId, pageNumber })`.
- Produces: approved contract that both status entry points use `status: ''`, keep `q/categoryId`, reset page 1, and display the applied status filter.

- [x] **Step 1: Update the frontend contract test first**

Replace the target-status assertions with:

```js
test('single-book status update reloads a mixed-status canonical list', async () => {
  const { page } = await sources();

  assert.match(page, /const statusChanged = updateForm\.status !== selectedBook\.status/);
  assert.ok((page.match(/setAppliedStatusFilter\(''\)/g) || []).length >= 2);
  assert.ok((page.match(/status: ''/g) || []).length >= 2);
  assert.ok((page.match(/categoryId: appliedCategoryFilter/g) || []).length >= 2);
  assert.ok((page.match(/q: appliedSearchQuery/g) || []).length >= 2);
  assert.ok((page.match(/pageNumber: 1/g) || []).length >= 2);
  assert.doesNotMatch(page, /setAppliedStatusFilter\(targetStatus\)/);
});

test('management list states the applied status filter', async () => {
  const { page } = await sources();
  assert.match(page, /Đang lọc trạng thái:/);
  assert.match(page, /getStatusLabel\(appliedStatusFilter\)/);
});
```

- [x] **Step 2: Run RED**

Run: `node --test frontend/test/bookManagementFrontend.test.js`

Expected: FAIL because production still switches to `targetStatus` and has no applied-filter summary.

- [x] **Step 3: Update the approved FE05 contract**

Change `FR-FE05-029`, `AC-FE05-020`, and `NFR-FE05-UX-004` to require a mixed-status reload. Add `NFR-FE05-UX-005` requiring the applied status label. Add `FE05-T021` and a 2026-08-04 changelog entry.

- [x] **Step 4: Commit only after implementation verification**

Keep these documentation changes uncommitted with implementation until human review.

---

### Task 2: Implement Mixed-Status Reload and Filter Visibility

**Files:**
- Modify: `frontend/src/page/BookManagement.jsx`
- Test: `frontend/test/bookManagementFrontend.test.js`

**Interfaces:**
- Consumes: `appliedSearchQuery`, `appliedCategoryFilter`, `getStatusLabel()`.
- Produces: `appliedStatusLabel` and consistent reload behavior for `confirmStatusFromUpdate()` and `handleStatusChange()`.

- [x] **Step 1: Implement the minimal GREEN change**

In both status handlers, remove `targetStatus` filter assignment and use:

```js
setStatusFilter('');
setAppliedStatusFilter('');
setPage(1);
const nextBooks = await loadBooks({
  status: '',
  categoryId: appliedCategoryFilter,
  q: appliedSearchQuery,
  pageNumber: 1,
});
```

Add:

```js
const appliedStatusLabel = appliedStatusFilter
  ? getStatusLabel(appliedStatusFilter)
  : 'Tất cả trạng thái';
```

Render near the management filters:

```jsx
<p className="bm-applied-filter">
  Đang lọc trạng thái: <strong>{appliedStatusLabel}</strong>
</p>
```

Update success copy to state that the list returned to all statuses.

- [x] **Step 2: Run GREEN**

Run: `node --test frontend/test/bookManagementFrontend.test.js`

Expected: 12 tests pass.

- [x] **Step 3: Run frontend quality checks**

Run: `npm.cmd test`, `npm.cmd run lint`, and `npm.cmd run build` from `frontend/`.

Expected: all tests pass, lint exits 0, build exits 0.

---

### Task 3: Add Exact Staging Acceptance Cleanup Tool

**Files:**
- Create: `backend/scripts/cleanupStagingAcceptanceData.js`
- Create: `backend/tests/stagingAcceptanceCleanupScript.test.js`
- Modify: `backend/package.json`
- Modify: `docs/superpowers/plans/2026-08-02-azure-staging-authenticated-acceptance.md`
- Modify: `docs/superpowers/specs/2026-08-02-release-closeout-staging-acceptance-design.md`

**Interfaces:**
- Produces: `parseArguments(argv)`, `validateRunId(runId)`, `discoverFixtures(pool, runId)`, `deleteFixtureRun(pool, runId)`, and CLI commands such as `npm run cleanup:staging-acceptance -- --run-id lms-acceptance-20260802-2e3a025d --execute`.
- Consumes: `sql` and `getPool` from `backend/src/config/db.js`.

- [x] **Step 1: Write the cleanup tests first**

Tests must assert:

```js
expect(parseArguments([])).toEqual({ execute: false, runId: null });
expect(validateRunId('lms-acceptance-20260802-2e3a025d')).toBe(true);
expect(validateRunId('1984')).toBe(false);
expect(CLEANUP_SQL).toContain("DB_NAME() <> 'LibraryManagementStaging'");
expect(CLEANUP_SQL).toContain('DELETE FROM NotificationAttempts');
expect(CLEANUP_SQL.indexOf('DELETE FROM NotificationAttempts'))
  .toBeLessThan(CLEANUP_SQL.indexOf('DELETE FROM Notifications'));
expect(CLEANUP_SQL.indexOf('DELETE FROM BookCopies'))
  .toBeLessThan(CLEANUP_SQL.indexOf('DELETE FROM Books'));
expect(CLEANUP_SQL.indexOf('DELETE FROM Books'))
  .toBeLessThan(CLEANUP_SQL.indexOf('DELETE FROM Users'));
expect(CLEANUP_SQL).not.toContain("UPDATE Books SET Status = 'INACTIVE'");
```

Use a fake pool/request to prove dry-run discovery does not execute `CLEANUP_SQL` and `--execute` refuses candidates whose counts are not `4 users / 1 book / 1 copy`.

- [x] **Step 2: Run RED**

Run: `npm.cmd test -- --runTestsByPath tests/stagingAcceptanceCleanupScript.test.js`

Expected: FAIL because the script does not exist.

- [x] **Step 3: Implement argument and identity boundaries**

Use the exact pattern:

```js
const RUN_ID_PATTERN = /^lms-acceptance-20260802-[0-9a-f]{8}$/;
```

Reject unknown flags, duplicate run IDs, invalid IDs, and `--execute` on any database other than `LibraryManagementStaging`.

- [x] **Step 4: Implement parameterized discovery**

Discover only rows where:

```text
Books.Title equals "Acceptance Book " plus the validated run ID
BookCopies.Barcode equals "ACC-" plus the validated run ID
Users.Username equals one of the four approved `acc_*_<8-hex suffix>` identities
Users.Email equals the matching `member-a|member-b|librarian|admin.<suffix>@lms.invalid` identity
```

Return run ID plus user/book/copy counts; do not return PII or credential fields.

- [x] **Step 5: Implement transactional hard deletion**

Build table variables for fixture users, books, copies, requests, details, reservations, fines, notifications, applications, and members. Delete in this dependency order:

```text
NotificationAttempts -> Notifications -> Fines -> Reservations
-> BorrowDetails -> BorrowRequests -> MembershipApplications -> Members
-> AuthTokens -> LoginFailureAttempts -> AuditLogs -> BookCopies -> Books
-> UserProfiles -> UserRoles -> Users
```

Validate `4/1/1` identity counts before deletes and zero users/books/copies after deletes. Throw inside the transaction on mismatch so the caller rolls back.

- [x] **Step 6: Add the operator command and docs**

Add:

```json
"cleanup:staging-acceptance": "node scripts/cleanupStagingAcceptanceData.js"
```

Amend the acceptance docs so future temporary seeds use `ACC-` plus the eight-hex run suffix for ISBN and cleanup means exact hard deletion, not terminalization.

- [x] **Step 7: Run GREEN**

Run: `npm.cmd test -- --runTestsByPath tests/stagingAcceptanceCleanupScript.test.js tests/bookRoutes.test.js`

Expected: both suites pass.

---

### Task 4: Verify and Prepare Staging Execution

**Files:**
- Review all changed files.

**Interfaces:**
- Produces: a reviewable uncommitted implementation diff and a read-only staging cleanup candidate report.

- [x] **Step 1: Run repository gates**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/stagingAcceptanceCleanupScript.test.js tests/bookRoutes.test.js
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
npm.cmd run test:secrets
git diff --check
```

- [x] **Step 2: Review workspace output**

Run `git status --short`, `git diff --stat`, and `git diff` for every changed path. Confirm no generated `dist`, coverage, credential, runtime manifest, or acceptance screenshot is tracked.

- [~] **Step 3: Run staging dry-run only**

When Azure staging DB environment variables are available, run:

```powershell
npm.cmd --prefix backend run cleanup:staging-acceptance -- --run-id lms-acceptance-20260802-2e3a025d
```

Do not pass `--execute` until the candidate run IDs and counts have been reviewed.

Blocked after three fail-closed Kudu attempts: the deployed module path was unavailable to the default runtime, the Kudu Node 18 runtime was incompatible with the deployed dependency graph, and the expected Oryx Node 22 runtime was absent. No staging row was changed or deleted; reassess the execution architecture after H2 instead of adding another Kudu workaround.

- [ ] **Step 4: Human review gate**

Present the complete diff and dry-run evidence. Commit/push and real staging deletion require the repository's human review gate.
