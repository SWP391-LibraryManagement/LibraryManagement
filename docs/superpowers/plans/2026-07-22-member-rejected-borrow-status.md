# Member Rejected Borrow Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show `Đã từ chối` in member borrowing history after staff rejects a pending borrow request, while preserving `BorrowDetails.Status = REQUESTED` in persistence.

**Architecture:** Add the owning request's status to the existing borrow-detail read model as `requestStatus`. The frontend history mapper will prefer `REJECTED` only when the owning request was rejected and will otherwise keep the existing detail-status and derived-overdue behavior.

**Tech Stack:** Node.js, Express.js, Jest, Supertest, SQL Server `mssql`, React, Vite, Node test runner, OpenAPI YAML.

## Global Constraints

- Preserve the approved Node.js + Express.js backend, React + Bootstrap frontend, SQL Server database, and RESTful API stack.
- Do not change the database schema or persisted `BorrowDetails.Status` enum.
- Keep history query filters limited to `REQUESTED`, `BORROWED`, `RETURNED`, `LOST`, `DAMAGED`, and derived `OVERDUE`.
- Keep authentication, role checks, pagination, stable ordering, rejection audit behavior, and rejection-reason validation unchanged.
- Do not expose rejection reasons or staff identity to members.
- Preserve all unrelated authentication and admin-console working-tree changes.
- Do not commit generated implementation until the required human review is complete.

---

## File Map

| File | Responsibility |
| --- | --- |
| `.sdd/specs/feat-borrowing-management/SPEC.md` | Define the rejected-request history read contract and acceptance criterion. |
| `.sdd/specs/feat-borrowing-management/TASKS.md` | Record the maintenance task and its verification evidence. |
| `.sdd/specs/feat-borrowing-management/CHANGELOG.md` | Record the observable member-history correction. |
| `backend/src/repositories/borrowingRepository.js` | Map the already-selected SQL `RequestStatus` into borrow-detail responses. |
| `backend/tests/helpers/inMemoryBorrowingRepositories.js` | Keep in-memory route-test behavior aligned with SQL read-model behavior. |
| `backend/tests/borrowingRoutes.test.js` | Reproduce reject-then-member-history behavior through the HTTP boundary. |
| `backend/src/docs/openapi.yaml` | Document `BorrowDetail.requestStatus`. |
| `backend/tests/borrowingContract.test.js` | Lock the OpenAPI response shape and enum. |
| `frontend/src/utils/libraryFeatureViewModels.js` | Resolve the effective member-visible status without changing persisted detail status. |
| `frontend/test/borrowingFrontend.test.js` | Prove rejected and still-pending requests render differently. |

### Task 1: Align The Approved FE07 Contract

**Files:**
- Modify: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Modify: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Modify: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-07-22-member-rejected-borrow-status-design.md`.
- Produces: `BR-FE07-029`, `FR-FE07-029`, `AC-FE07-023`, and maintenance task `FE07-T041` for implementation traceability.

- [ ] **Step 1: Add the read-model business and functional rules**

Set `Version` to `0.7.1`, set `Last Updated` to `2026-07-22`, and add these exact rules to the next sequential positions in `SPEC.md`:

```markdown
- BR-FE07-029: Borrowing-history detail rows must expose the owning request status separately from the persisted detail status. When the owning request is `REJECTED`, the member-visible status is rejected while the persisted detail remains `REQUESTED`.

- FR-FE07-029: When a member views a borrow detail whose owning request is `REJECTED`, the system shall return `requestStatus = REJECTED` and the frontend shall display `Đã từ chối` instead of `Chờ xử lý` without changing `BorrowDetails.Status`.
```

- [ ] **Step 2: Add the acceptance criterion and API note**

Add this acceptance criterion and clarify both borrowing-history endpoints in Section 11:

```markdown
- AC-FE07-023: Given a member's pending borrow request, when staff rejects it and the member reloads borrowing history, then every detail belonging to that request displays `Đã từ chối`; the request remains `REJECTED` and each persisted detail remains `REQUESTED`.
```

Replace the existing `requestStatus` row in Section 10.2 with this exact clarification:

```markdown
| requestStatus | string | Yes | Values: `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, `CANCELLED`. Borrowing-history detail responses expose this owning-request state separately from persisted `detailStatus`. |
```

Append this exact sentence to the Notes cell for both history endpoints in Section 11:

```markdown
Each returned detail includes `requestStatus` from its owning request; `status` remains the detail status used by filters.
```

Add these exact traceability rows to Section 16:

```markdown
| AC-FE07-023 | UC30 | borrowingRoutes.test.js > "member history exposes a rejected owning request without changing detail status"; borrowingFrontend.test.js > "member history displays rejected requests without relabeling pending details" | Planned |
| BR-FE07-029 | UC30 | FE07-T041 | Planned |
| FR-FE07-029 | UC30 | FE07-T041 | Planned |
```

- [ ] **Step 3: Add the maintenance task and changelog entry**

Append this task to `TASKS.md`:

```markdown
- [ ] **FE07-T041 - Show rejected borrow requests correctly in member history.**
  - Maps to: BR-FE07-029, FR-FE07-029, AC-FE07-023.
  - RED: reject a member request, reload `/api/borrow-requests/me`, and prove the response lacks `requestStatus = REJECTED`; prove the frontend maps the row to `Pending`.
  - GREEN: expose `requestStatus` in SQL/in-memory read models and prefer it only for rejected member-history display.
  - Verify: focused backend route/contract tests, frontend borrowing tests, lint/build, traceability, and diff hygiene pass.
```

Add this entry to the top of `CHANGELOG.md`:

```markdown
## 2026-07-22 - Correct rejected request status in member history

- Exposed the owning borrow-request status in canonical detail history rows.
- Displayed rejected requests as `Đã từ chối` while preserving persisted detail status `REQUESTED` and existing history filters.
```

- [ ] **Step 4: Verify documentation consistency**

Run:

```powershell
rg -n "BR-FE07-029|FR-FE07-029|AC-FE07-023|FE07-T041|requestStatus" .sdd/specs/feat-borrowing-management
git diff --check -- .sdd/specs/feat-borrowing-management
```

Expected: all four identifiers are present, the API note names `requestStatus`, and `git diff --check` emits no output.

- [ ] **Step 5: Hold the documentation commit for human review**

After human review, the proposed documentation commit is:

```powershell
git add -- .sdd/specs/feat-borrowing-management/SPEC.md .sdd/specs/feat-borrowing-management/TASKS.md .sdd/specs/feat-borrowing-management/CHANGELOG.md
git commit -m "docs: define rejected borrow history status"
```

### Task 2: Add The Backend Read-Model Regression

**Files:**
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/src/repositories/borrowingRepository.js`
- Modify: `backend/tests/helpers/inMemoryBorrowingRepositories.js`

**Interfaces:**
- Consumes: the existing `RequestStatus` column selected by `borrowDetailSelect`; existing `BorrowDetail.status` remains the detail lifecycle.
- Produces: `BorrowDetail.requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'` in SQL and in-memory responses.

- [ ] **Step 1: Write the failing HTTP regression test**

Add this test inside the existing FE07 route test suite:

```javascript
// @spec FR-FE07-029, AC-FE07-023
test('member history exposes a rejected owning request without changing detail status', async () => {
  const { app, authDependencies, borrowingDependencies } = makeTestApp();
  const member = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'rejected-history.member@example.test',
  });
  const librarian = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'rejected-history.librarian@example.test',
    role: 'LIBRARIAN',
    approveMember: false,
  });

  const created = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] })
    .expect(201);

  await request(app)
    .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/reject`)
    .set('Authorization', authHeader(librarian.accessToken))
    .send({ reason: 'Không thể xử lý yêu cầu này.' })
    .expect(200);

  const history = await request(app)
    .get('/api/borrow-requests/me')
    .set('Authorization', authHeader(member.accessToken))
    .expect(200);

  expect(history.body.borrowings).toEqual([
    expect.objectContaining({
      requestId: created.body.borrowRequest.requestId,
      status: 'REQUESTED',
      requestStatus: 'REJECTED',
    }),
  ]);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js -t "member history exposes a rejected owning request"
```

Expected: FAIL because the returned row has no `requestStatus` property; request rejection itself must succeed.

- [ ] **Step 3: Add the minimal production and in-memory mappings**

In `backend/src/repositories/borrowingRepository.js`, extend `mapBorrowDetail`:

```javascript
// @spec FR-FE07-029
requestStatus: row.RequestStatus,
status: row.DetailStatus,
```

In `backend/tests/helpers/inMemoryBorrowingRepositories.js`, extend `mapDetail` while preserving the persisted detail status:

```javascript
function mapDetail(detail) {
  if (!detail) {
    return null;
  }

  const owningRequest = borrowRequests.find(
    (request) => request.requestId === detail.requestId
  );

  return clone({
    borrowDetailId: detail.borrowDetailId,
    requestId: detail.requestId,
    userId: detail.userId,
    copyId: detail.copyId,
    borrowDate: toDateOnly(detail.borrowDate),
    dueDate: toDateOnly(detail.dueDate),
    returnDate: toDateOnly(detail.returnDate),
    renewalCount: detail.renewalCount,
    requestStatus: owningRequest?.status || null,
    status: detail.status,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    member: mapMember(detail.userId),
    copy: mapCopy(getCopy(detail.copyId)),
  });
}
```

- [ ] **Step 4: Run focused backend tests and verify GREEN**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js -t "member history exposes a rejected owning request|member history excludes another member request|member history includes a request later on toDate"
```

Expected: PASS for the new rejected-history case and the existing member-scope/date cases.

- [ ] **Step 5: Hold the backend commit for human review**

After human review, the proposed backend commit is:

```powershell
git add -- backend/tests/borrowingRoutes.test.js backend/src/repositories/borrowingRepository.js backend/tests/helpers/inMemoryBorrowingRepositories.js
git commit -m "fix: expose borrow request status in history"
```

### Task 3: Lock The OpenAPI Response Contract

**Files:**
- Modify: `backend/tests/borrowingContract.test.js`
- Modify: `backend/src/docs/openapi.yaml`

**Interfaces:**
- Consumes: `BorrowDetail.requestStatus` produced by Task 2.
- Produces: a documented response property with the FE07 request-status enum.

- [ ] **Step 1: Write the failing OpenAPI contract assertion**

Add to the existing FE07 schema contract test:

```javascript
const borrowDetail = document.components.schemas.BorrowDetail;
expect(borrowDetail.required).toContain('requestStatus');
expect(borrowDetail.properties.requestStatus).toEqual({
  type: 'string',
  enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
});
```

- [ ] **Step 2: Run the contract test and verify RED**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingContract.test.js
```

Expected: FAIL because `BorrowDetail.requestStatus` is not documented.

- [ ] **Step 3: Add the OpenAPI property**

Update `BorrowDetail` in `backend/src/docs/openapi.yaml`:

```yaml
BorrowDetail:
  type: object
  required: [borrowDetailId, requestId, copyId, status, requestStatus, renewalCount]
  properties:
    borrowDetailId: { type: integer, minimum: 1 }
    requestId: { type: integer, minimum: 1 }
    copyId: { type: integer, minimum: 1 }
    borrowDate: { type: string, format: date, nullable: true }
    dueDate: { type: string, format: date, nullable: true }
    returnDate: { type: string, format: date, nullable: true }
    renewalCount: { type: integer, minimum: 0, maximum: 1 }
    requestStatus: { type: string, enum: [PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED] }
    status:
      type: string
      enum: [REQUESTED, BORROWED, RETURNED, LOST, DAMAGED]
      description: OVERDUE is derived for reporting when status is BORROWED and dueDate is before today.
```

- [ ] **Step 4: Run the contract test and verify GREEN**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingContract.test.js
```

Expected: PASS.

- [ ] **Step 5: Hold the contract commit for human review**

After human review, the proposed contract commit is:

```powershell
git add -- backend/tests/borrowingContract.test.js backend/src/docs/openapi.yaml
git commit -m "docs: expose borrow request status in detail responses"
```

### Task 4: Render Rejected Status In Member History

**Files:**
- Modify: `frontend/test/borrowingFrontend.test.js`
- Modify: `frontend/src/utils/libraryFeatureViewModels.js`

**Interfaces:**
- Consumes: `{ status: DetailStatus, requestStatus: RequestStatus }` from Tasks 2-3.
- Produces: `mapBorrowDetailsToHistoryRows(details)` rows whose `status` is `Rejected` only when `requestStatus === 'REJECTED'`.

- [ ] **Step 1: Write the failing frontend mapper regression**

Add this Node test:

```javascript
test('member history displays rejected requests without relabeling pending details', async () => {
  const { mapBorrowDetailsToHistoryRows } = await loadBorrowingViewModels();
  const { getStatusLabel } = await import('../src/utils/uiLabels.js');
  const rows = mapBorrowDetailsToHistoryRows([
    {
      borrowDetailId: 51,
      requestId: 21,
      copyId: 1,
      status: 'REQUESTED',
      requestStatus: 'REJECTED',
    },
    {
      borrowDetailId: 52,
      requestId: 22,
      copyId: 2,
      status: 'REQUESTED',
      requestStatus: 'PENDING',
    },
  ]);

  assert.equal(rows[0].status, 'Rejected');
  assert.equal(getStatusLabel(rows[0].status), 'Đã từ chối');
  assert.equal(rows[1].status, 'Pending');
});
```

- [ ] **Step 2: Run the frontend test and verify RED**

Run:

```powershell
node --test --test-name-pattern "member history displays rejected requests" frontend/test/borrowingFrontend.test.js
```

Expected: FAIL because both rows currently map from detail status `REQUESTED` to `Pending`.

- [ ] **Step 3: Implement the narrow display precedence**

Update `mapBorrowDetailsToHistoryRows`:

```javascript
// @spec FR-FE07-029
export function mapBorrowDetailsToHistoryRows(details = []) {
  return details.map((detail) => {
    const displayStatus = detail.requestStatus === 'REJECTED'
      ? detail.requestStatus
      : detail.status;

    return {
      id: detail.borrowDetailId || `${detail.requestId}-${detail.copyId}`,
      borrowDetailId: detail.borrowDetailId,
      requestId: detail.requestId,
      title: detail.copy?.title || `Bản sao #${detail.copyId}`,
      author: detail.copy?.author || '-',
      borrowDate: detail.borrowDate || detail.createdAt,
      dueDate: detail.dueDate,
      returnDate: detail.returnDate,
      status: statusToUi(displayStatus, { expiresAt: detail.dueDate }),
      renewalsLeft: detail.status === 'BORROWED'
        ? Math.max(0, 1 - Number(detail.renewalCount || 0))
        : 0,
    };
  });
}
```

- [ ] **Step 4: Run the frontend borrowing suite and verify GREEN**

Run:

```powershell
node --test frontend/test/borrowingFrontend.test.js
```

Expected: all tests pass, including existing overdue, pending, pagination, and truthful-state cases.

- [ ] **Step 5: Hold the frontend commit for human review**

After human review, the proposed frontend commit is:

```powershell
git add -- frontend/test/borrowingFrontend.test.js frontend/src/utils/libraryFeatureViewModels.js
git commit -m "fix: show rejected borrow requests to members"
```

### Task 5: Complete Verification And Human Review

**Files:**
- Modify: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Verify only: every file listed in the File Map.

**Interfaces:**
- Consumes: the completed backend, OpenAPI, and frontend slices.
- Produces: focused and repository-level evidence for FE07-T041.

- [ ] **Step 1: Run focused FE07 regression tests**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingContract.test.js
node --test frontend/test/borrowingFrontend.test.js
```

Expected: both backend test files and the frontend borrowing suite pass with zero failures.

- [ ] **Step 2: Run broader static and build gates**

Run:

```powershell
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

Expected: lint, build, and traceability pass; `git diff --check` emits no output.

- [ ] **Step 3: Run the full backend regression suite**

Run:

```powershell
npm.cmd --prefix backend test
```

Expected: all backend suites pass. If an unrelated dirty authentication/admin change fails, record the exact failing test and prove the focused FE07 suites still pass; do not modify unrelated files.

- [ ] **Step 4: Record exact evidence and request human review**

Replace the unchecked marker on `FE07-T041` with `[x]` only after recording the exact pass counts from Steps 1-3 beneath the task. Present the complete FE07 diff for human review before staging implementation files.

- [ ] **Step 5: Commit the reviewed implementation**

Only after the human confirms review, stage the exact FE07 files and verify the staged set before committing:

```powershell
git add -- .sdd/specs/feat-borrowing-management/SPEC.md .sdd/specs/feat-borrowing-management/TASKS.md .sdd/specs/feat-borrowing-management/CHANGELOG.md backend/src/repositories/borrowingRepository.js backend/tests/helpers/inMemoryBorrowingRepositories.js backend/tests/borrowingRoutes.test.js backend/src/docs/openapi.yaml backend/tests/borrowingContract.test.js frontend/src/utils/libraryFeatureViewModels.js frontend/test/borrowingFrontend.test.js docs/superpowers/plans/2026-07-22-member-rejected-borrow-status.md
git diff --cached --name-only
git diff --cached --check
git commit -m "fix: show rejected borrow requests to members"
```

Expected staged files: exactly the eleven paths named by `git add`; no authentication or admin-console files are staged.
