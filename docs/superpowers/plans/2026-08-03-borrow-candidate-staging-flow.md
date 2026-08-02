# Borrow Candidate Staging Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make HomePage circulation actions agree with FE07/FE08 eligibility, explain a genuinely empty FE07 candidate catalog truthfully, and provide two safe resettable staging-only borrow candidates.

**Architecture:** Extend the existing FE01 title-level read model with one coarse `circulationAction` enum derived in SQL, project it through the existing public DTO, and let Member UI actions consume that field without changing staff physical availability. Keep FE07 candidate rules unchanged. Add one explicitly invoked staging script whose mutation path is database-name guarded, flag guarded, fixture-owned, audited, and transactional.

**Tech Stack:** Node.js 22, Express 5, CommonJS, SQL Server via `mssql`, React 19/Vite, Node test runner for frontend contract tests, Jest/Supertest for backend tests, Playwright for browser acceptance, Hybrid SDD repository gates.

## Global Constraints

- Work only in `D:\SWP391\library-management-system\.worktrees\borrow-candidate-staging-flow` on branch `fix/borrow-candidate-staging-flow`, based on `origin/main@f7b9561`.
- Never rename the branch to a name containing `codex`.
- Preserve the dirty root checkout at `D:\SWP391\library-management-system`; do not stage, clean, reset, or rewrite it.
- The approved design is `docs/superpowers/specs/2026-08-03-borrow-candidate-staging-flow-design.md` at commit `f8723b0`.
- H1 approval of this exact plan is required before implementation begins.
- Repository Constitution overrides the generic frequent-commit convention: keep generated implementation changes uncommitted through RED/GREEN and focused validation; obtain H2; then create the reviewed implementation commit. Obtain H3 before merge/deploy.
- Do not loosen `GET /api/borrow-requests/candidates`, change FE08 queue behavior, add schema/status values/routes/dependencies, or expose copy/reservation/member details through FE01.
- Keep `availabilityStatus` backward compatible. `circulationAction` is additive and public-safe.
- Do not run the staging reset automatically from startup, deployment, migration, or CI.
- Do not create a video demo.

---

## File Map

### Specification and contract files

- Modify `docs/superpowers/specs/2026-08-03-borrow-candidate-staging-flow-design.md`: record approval, the 20-character ISBN-safe identifiers, and non-executing deployment packaging.
- Add `docs/superpowers/plans/2026-08-03-borrow-candidate-staging-flow.md`: this H1 execution contract.
- Modify `.sdd/specs/feat-public-browse/SPEC.md`: add FE01 truthfulness rules and acceptance criteria for the four-state action.
- Modify `.sdd/specs/feat-public-browse/PLAN.md`: add the read-model/frontend delivery slice and verification commands.
- Modify `.sdd/specs/feat-public-browse/TASKS.md`: add FE01-T015 through FE01-T017 and trace mappings.
- Modify `.sdd/specs/feat-public-browse/CHANGELOG.md`: record the additive public DTO and HomePage behavior.
- Modify `.sdd/specs/feat-borrowing-management/SPEC.md`: add truthful candidate-empty and staging-fixture requirements.
- Modify `.sdd/specs/feat-borrowing-management/PLAN.md`: add the FE07 shell/operations slice and acceptance path.
- Modify `.sdd/specs/feat-borrowing-management/TASKS.md`: add FE07-T062 through FE07-T064 and trace mappings.
- Modify `.sdd/specs/feat-borrowing-management/CHANGELOG.md`: record empty-state and staging tooling behavior.
- Modify `backend/src/docs/openapi.yaml`: add required `circulationAction` enum to `PublicBookSummary`.
- Modify `docs/api/api-contract.md`: document physical availability versus Member continuation semantics.
- Modify `docs/deployment/azure-staging-guide.md`: document guarded `status`/`reset` execution and rollback handling.

### Backend implementation and tests

- Modify `backend/src/repositories/bookRepository.js`: derive the four-state title-level action using correlated `EXISTS` predicates.
- Modify `backend/src/services/bookService.js`: validate/project the public-safe enum with fail-closed fallback.
- Modify `backend/tests/publicBrowseRepository.test.js`: lock SQL precedence, blocker rules, and read-only behavior.
- Modify `backend/tests/bookAvailabilityRepository.test.js`: retain physical availability invariants while adding circulation invariants.
- Modify `backend/tests/helpers/inMemoryBookRepositories.js`: mirror the read-model decision for route-level tests.
- Modify `backend/tests/bookRoutes.test.js`: prove list/detail add the safe field without leaking protected data.
- Modify `backend/tests/publicBrowseRoutes.test.js`: prove OpenAPI requires exactly the approved enum.

### Frontend implementation and tests

- Modify `frontend/src/utils/homeBookActions.js`: use `circulationAction` exclusively for Member actions and return explicit disabled actions.
- Modify `frontend/src/page/HomePage.jsx`: prevent navigation and render disabled action controls consistently in cards/panel/modal.
- Modify `frontend/test/homeBookActions.test.js`: cover Guest, Member four-state, staff, invalid/missing state, and legacy roles.
- Modify `frontend/test/publicBrowseFrontend.test.js`: verify all HomePage action surfaces respect `disabled`.
- Modify `frontend/src/page/borrowing/BorrowRequestPage.jsx`: separate server-empty and search-empty messages.
- Modify `frontend/test/borrowingFrontend.test.js`: lock the two empty-state branches and existing API-error branch.

### Staging operations and tests

- Add `backend/scripts/stagingBorrowCandidates.js`: implement read-only `status` and guarded transactional `reset`.
- Add `backend/tests/stagingBorrowCandidates.test.js`: test guards, policy decisions, fixture ownership, rollback, idempotence, and audit writes with an injected fake SQL adapter.
- Modify `backend/package.json`: add the manual `staging:borrow-candidates` script.
- Modify `.github/workflows/deploy-staging.yml`: package this one reviewed operator script without invoking it.
- Modify `tests/deployment/stagingWorkflowPolicy.test.js`: prove the script is present in the backend artifact and absent from deploy/start commands.
- Add `tests/e2e/fe01-fe07-borrow-candidate-flow.spec.js`: lock browser-facing routing/disabled action/empty-state behavior against controlled API responses; keep live reset verification manual because it mutates staging.

---

## Task 1: Activate the Hybrid SDD contract

**Files:**

- Modify: `.sdd/specs/feat-public-browse/SPEC.md`
- Modify: `.sdd/specs/feat-public-browse/PLAN.md`
- Modify: `.sdd/specs/feat-public-browse/TASKS.md`
- Modify: `.sdd/specs/feat-public-browse/CHANGELOG.md`
- Modify: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Modify: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Modify: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Modify: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/deployment/azure-staging-guide.md`

- [ ] Add these exact FE01 identifiers and meanings:

```text
BR-FE01-018: Physical availability must not be used as the Member circulation decision when an open FE07 or FE08 claim exists.
FR-FE01-019: Public book list/detail expose circulationAction = BORROW | RESERVE | WAIT | UNAVAILABLE without copy or owner data.
FR-FE01-020: Member HomePage actions use circulationAction; staff presentation keeps availabilityStatus.
AC-FE01-019: Claimed AVAILABLE copy never produces a direct Member borrow action.
AC-FE01-020: Unclaimed AVAILABLE copy produces BORROW and the same title is FE07-eligible.
AC-FE01-021: BORROWED/RESERVED-only title produces RESERVE.
AC-FE01-022: Pending/queue-only produces WAIT; no path produces UNAVAILABLE; both are disabled.
FE01-T015: RED/GREEN repository, service, route, and OpenAPI contract.
FE01-T016: RED/GREEN role-aware HomePage actions and disabled controls.
FE01-T017: Traceability, regressions, and cross-feature browser acceptance.
```

- [ ] Add these exact FE07 identifiers and meanings:

```text
BR-FE07-038: Candidate eligibility remains server-authoritative and server-empty is not a search miss.
BR-FE07-039: Staging borrow fixtures may mutate only reserved synthetic records under explicit staging guards and audit.
FR-FE07-045: BorrowRequestPage distinguishes zero server candidates from zero local search matches.
FR-FE07-046: Manual status/reset tooling restores two distinct synthetic candidates transactionally without altering unrelated state.
AC-FE07-037: Server-empty and search-empty messages are distinct; API errors remain errors.
AC-FE07-038: Reset rejects wrong DB/missing flag/mixed requests/unexpected states and rolls back.
AC-FE07-039: Every fixture transition is tagged and audited; unrelated rows are invariant.
AC-FE07-040: Reset yields two candidates; after submitting one, the second remains.
FE07-T062: RED/GREEN truthful FE07 candidate empty state.
FE07-T063: RED/GREEN guarded staging status/reset script.
FE07-T064: Cross-feature regression, staging reset, submit-one/remain-one acceptance.
```

- [ ] Mark the new tasks `In Progress`, map all new BR/FR/AC identifiers to their task IDs, and keep the design acceptance mapping explicit:

```text
AC-BCSF-001..004 -> FE01-T015, FE01-T016
AC-BCSF-005      -> FE07-T062
AC-BCSF-006..007 -> FE07-T063
AC-BCSF-008      -> FE01-T017, FE07-T064
```

- [ ] Add the API contract table:

```markdown
| Field | Values | Consumer |
| --- | --- | --- |
| `availabilityStatus` | `AVAILABLE`, `UNAVAILABLE` | Existing physical high-level presentation, especially staff |
| `circulationAction` | `BORROW`, `RESERVE`, `WAIT`, `UNAVAILABLE` | Member continuation only |
```

- [ ] Document that fixture ownership uses ISBN prefix `STAGING-BORROW-DEMO`, concrete 20-character ISBNs `STAGING-BORROW-DEMO1`/`2`, barcode prefix `STG-BORROW-DEMO-`, and location `STAGING-DEMO`.

- [ ] Run the documentation/traceability baseline:

```powershell
npm.cmd run trace
```

Expected: the checker parses all new IDs and task mappings. New tasks may remain in-progress until Task 7, but there are no orphan IDs or malformed ranges.

- [ ] Checkpoint only: inspect `git diff --check` and `git diff -- .sdd docs`; do not commit before H2.

---

## Task 2: Add RED tests for the FE01 circulation read model

**Files:**

- Modify: `backend/tests/publicBrowseRepository.test.js`
- Modify: `backend/tests/bookAvailabilityRepository.test.js`
- Modify: `backend/tests/bookRoutes.test.js`
- Modify: `backend/tests/publicBrowseRoutes.test.js`
- Modify: `backend/tests/helpers/inMemoryBookRepositories.js` only after RED is observed

- [ ] Extend the SQL-contract test with exact precedence and blocker assertions:

```js
// @spec BR-FE01-018, FR-FE01-019, AC-FE01-019, AC-FE01-020, AC-FE01-021, AC-FE01-022
test('public circulation action is read-only and uses FE07/FE08 claim precedence', async () => {
  const capture = capturePublicQuery([]);
  await bookRepository.getHomeBooks({ q: '', page: 1, limit: 20, sort: 'title', order: 'asc' });

  expect(capture.query).toMatch(/THEN\s+'BORROW'[\s\S]*THEN\s+'RESERVE'[\s\S]*THEN\s+'WAIT'[\s\S]*ELSE\s+'UNAVAILABLE'[\s\S]*AS\s+circulationAction/i);
  expect(capture.query).toMatch(/pendingRequest\.Status\s*=\s*'PENDING'/i);
  expect(capture.query).toMatch(/pendingDetail\.Status\s*=\s*'REQUESTED'/i);
  expect(capture.query).toMatch(/openReservation\.Status\s+IN\s*\('ACTIVE',\s*'NOTIFIED'\)/i);
  expect(capture.query).toMatch(/reserveCopy\.Status\s+IN\s*\('BORROWED',\s*'RESERVED'\)/i);
  expect(capture.query).not.toMatch(/(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(?:BorrowRequests|BorrowDetails|Reservations|BookCopies)/i);
});
```

- [ ] Update list/detail API expectations to require this exact safe shape:

```js
{
  bookId: 1,
  title: 'Clean Code',
  categoryName: 'Programming',
  authorName: 'Robert C. Martin',
  publisherName: 'Prentice Hall',
  publishYear: 2008,
  description: '...',
  coverUrl: '/covers/clean-code.png',
  availabilityStatus: 'AVAILABLE',
  circulationAction: 'BORROW',
}
```

Also assert serialized public responses do not contain `copyId`, `reservationId`, `queuePosition`, `userId`, `availableCopies`, or `totalCopies`.

- [ ] Update the OpenAPI test to require:

```js
expect(publicBookSchema.required).toEqual([
  'bookId', 'title', 'availabilityStatus', 'circulationAction',
]);
expect(publicBookSchema.properties.circulationAction).toEqual({
  type: 'string',
  enum: ['BORROW', 'RESERVE', 'WAIT', 'UNAVAILABLE'],
});
```

- [ ] Run the focused RED suite:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRepository.test.js tests/bookAvailabilityRepository.test.js tests/bookRoutes.test.js tests/publicBrowseRoutes.test.js
```

Expected RED: missing SQL alias/predicates, missing DTO field, and missing OpenAPI property. Failures must be assertion failures, not syntax/setup errors.

- [ ] Record the failing assertion names in the working notes; do not commit.

---

## Task 3: Implement the FE01 read model and make backend tests GREEN

**Files:**

- Modify: `backend/src/repositories/bookRepository.js`
- Modify: `backend/src/services/bookService.js`
- Modify: `backend/src/docs/openapi.yaml`
- Modify: `backend/tests/helpers/inMemoryBookRepositories.js`
- Modify: backend tests from Task 2 only where fixture expectations require the additive field

- [ ] Add this decision order to `listSelect()` after `availabilityStatus`:

```sql
CASE
  WHEN b.Status = 'ACTIVE' AND EXISTS (
    SELECT 1
    FROM BookCopies borrowCopy
    WHERE borrowCopy.BookId = b.BookId
      AND borrowCopy.Status = 'AVAILABLE'
      AND NOT EXISTS (
        SELECT 1
        FROM BorrowDetails pendingDetail
        INNER JOIN BorrowRequests pendingRequest
          ON pendingRequest.RequestId = pendingDetail.RequestId
        WHERE pendingDetail.CopyId = borrowCopy.CopyId
          AND pendingDetail.Status = 'REQUESTED'
          AND pendingRequest.Status = 'PENDING'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM Reservations openReservation
        WHERE openReservation.CopyId = borrowCopy.CopyId
          AND openReservation.Status IN ('ACTIVE', 'NOTIFIED')
      )
  ) THEN 'BORROW'
  WHEN b.Status = 'ACTIVE' AND EXISTS (
    SELECT 1
    FROM BookCopies reserveCopy
    WHERE reserveCopy.BookId = b.BookId
      AND reserveCopy.Status IN ('BORROWED', 'RESERVED')
  ) THEN 'RESERVE'
  WHEN b.Status = 'ACTIVE' AND EXISTS (
    SELECT 1
    FROM BookCopies waitingCopy
    WHERE waitingCopy.BookId = b.BookId
      AND (
        EXISTS (
          SELECT 1 FROM BorrowDetails waitingDetail
          INNER JOIN BorrowRequests waitingRequest
            ON waitingRequest.RequestId = waitingDetail.RequestId
          WHERE waitingDetail.CopyId = waitingCopy.CopyId
            AND waitingDetail.Status = 'REQUESTED'
            AND waitingRequest.Status = 'PENDING'
        )
        OR EXISTS (
          SELECT 1 FROM Reservations waitingReservation
          WHERE waitingReservation.CopyId = waitingCopy.CopyId
            AND waitingReservation.Status IN ('ACTIVE', 'NOTIFIED')
        )
      )
  ) THEN 'WAIT'
  ELSE 'UNAVAILABLE'
END AS circulationAction
```

Precedence is mandatory: a title with any borrowable copy is `BORROW`; otherwise any FE08 candidate copy is `RESERVE`; otherwise an open claim is `WAIT`; otherwise it is `UNAVAILABLE`.

- [ ] Add a fail-closed service projection:

```js
const CIRCULATION_ACTIONS = new Set(['BORROW', 'RESERVE', 'WAIT', 'UNAVAILABLE']);

function circulationAction(book) {
  return CIRCULATION_ACTIONS.has(book?.circulationAction)
    ? book.circulationAction
    : 'UNAVAILABLE';
}
```

Then add `circulationAction: circulationAction(book)` to `mapPublicBook`. Do not add it to protected mutation inputs or staff-only fields.

- [ ] Extend `inMemoryBookRepositories.js` with an `initialState.borrowRequests` collection keyed by `requestId`, include it in snapshot/restore/state, and mirror the same decision precedence using `borrowRequests`, `borrowDetails`, and `reservations`. The helper must treat only `PENDING + REQUESTED` as an FE07 claim and only `ACTIVE/NOTIFIED` as an FE08 claim.

- [ ] Add this OpenAPI field to `PublicBookSummary`:

```yaml
circulationAction:
  type: string
  enum: [BORROW, RESERVE, WAIT, UNAVAILABLE]
```

- [ ] Run the focused GREEN suite:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRepository.test.js tests/bookAvailabilityRepository.test.js tests/bookRoutes.test.js tests/publicBrowseRoutes.test.js
```

Expected GREEN: all focused suites pass and the existing physical `availabilityStatus` assertions remain unchanged.

- [ ] Run FE07/FE08 backend regression gates:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js tests/borrowingContract.test.js tests/reservationRoutes.test.js tests/reservationRepository.test.js
```

Expected GREEN: candidate eligibility, reservation priority, and queue behavior are unchanged.

- [ ] Checkpoint only: run `git diff --check`; do not commit.

---

## Task 4: Make every HomePage Member action truthful

**Files:**

- Modify: `frontend/test/homeBookActions.test.js`
- Modify: `frontend/test/publicBrowseFrontend.test.js`
- Modify: `frontend/src/utils/homeBookActions.js`
- Modify: `frontend/src/page/HomePage.jsx`

- [ ] Replace the two-state Member test with a RED table covering the approved enum:

```js
test.each([
  ['BORROW', { label: 'Mượn sách này', path: '/borrowing/new?bookId=12', kind: 'borrow', disabled: false }],
  ['RESERVE', { label: 'Đặt chỗ sách này', path: '/reservations/mine?bookId=12', kind: 'reserve', disabled: false }],
  ['WAIT', { label: 'Đang chờ thư viện xử lý', path: null, kind: 'wait', disabled: true }],
  ['UNAVAILABLE', { label: 'Tạm chưa khả dụng', path: null, kind: 'unavailable', disabled: true }],
])('member maps %s to the truthful continuation', (circulationAction, expected) => {
  assert.deepEqual(
    getHomeBookAction({ book: { bookId: 12, circulationAction }, isLoggedIn: true, roles: ['MEMBER'] }),
    expected,
  );
});
```

Add a missing/unknown-state case that returns the same disabled `UNAVAILABLE` object. Keep Guest and staff tests based on their existing approved routes and `availabilityStatus`.

- [ ] Add source-contract assertions that `HomePage.jsx`:

```js
assert.match(source, /if \(action\.disabled \|\| !action\.path\) return/);
assert.match(source, /disabled=\{showRoleAction && action\.disabled\}/);
assert.match(source, /disabled=\{showRoleBookAction && .*\.disabled\}/);
```

The assertions must cover the search card, information panel, and details modal action surfaces rather than only the utility.

- [ ] Run RED:

```powershell
node --test frontend/test/homeBookActions.test.js frontend/test/publicBrowseFrontend.test.js
```

Expected RED: Member still derives from `availabilityStatus`, waiting actions still navigate, and buttons are not disabled.

- [ ] Implement the Member branch exactly from `book.circulationAction`, returning `{ label, path, kind, disabled }` for every branch. Add `disabled: false` to existing Guest/staff actions so the return type is stable.

- [ ] Guard navigation before clearing modal state:

```js
const handleBookAction = (book) => {
  const action = getHomeBookAction({ book, isLoggedIn, roles: authUser?.roles || [] });
  if (action.disabled || !action.path) return;
  setShowDetails(false);
  setSelectedBook(null);
  navigate(action.path);
};
```

- [ ] Pass `disabled={showRoleAction && action.disabled}` to panel/modal buttons. For inline card buttons, compute the action once per rendered book or pass the same `disabled` expression; set `cursor: 'not-allowed'` only when disabled. Guest controls must remain enabled and route to login.

- [ ] Run GREEN:

```powershell
node --test frontend/test/homeBookActions.test.js frontend/test/publicBrowseFrontend.test.js
```

Expected GREEN: all role and action surfaces agree and no disabled action can navigate.

- [ ] Checkpoint only: run `git diff --check`; do not commit.

---

## Task 5: Distinguish FE07 server-empty from search-empty

**Files:**

- Modify: `frontend/test/borrowingFrontend.test.js`
- Modify: `frontend/src/page/borrowing/BorrowRequestPage.jsx`

- [ ] Add a RED source-contract test that extracts both empty branches and requires these exact messages:

```js
assert.match(source, /books\.length === 0[\s\S]*Hiện không có bản sao đủ điều kiện mượn/);
assert.match(source, /Sách đang được mượn, giữ chỗ hoặc chờ xử lý sẽ không xuất hiện tại đây/);
assert.match(source, /books\.length > 0 && results\.length === 0[\s\S]*Không tìm thấy sách phù hợp/);
assert.match(source, /Hãy thử tên sách hoặc tác giả khác/);
```

Also retain assertions that `.catch` sets `noticeType` to `error`; an API failure must not enter either valid-empty message.

- [ ] Run RED:

```powershell
node --test frontend/test/borrowingFrontend.test.js
```

Expected RED: the page currently has only one `results.length === 0` branch.

- [ ] Replace that branch with two mutually exclusive branches:

```jsx
{!loading && books.length === 0 && (
  <EmptyState icon={BookOpen} title="Hiện không có bản sao đủ điều kiện mượn">
    Sách đang được mượn, giữ chỗ hoặc chờ xử lý sẽ không xuất hiện tại đây.
  </EmptyState>
)}
{!loading && books.length > 0 && results.length === 0 && (
  <EmptyState icon={BookOpen} title="Không tìm thấy sách phù hợp">
    Hãy thử tên sách hoặc tác giả khác.
  </EmptyState>
)}
```

- [ ] Run GREEN:

```powershell
node --test frontend/test/borrowingFrontend.test.js
```

Expected GREEN: existing FE07 layout/behavior tests and the new truthfulness test pass.

- [ ] Checkpoint only: do not commit.

---

## Task 6: Build the read-only staging status mode and mutation guards

**Files:**

- Add: `backend/tests/stagingBorrowCandidates.test.js`
- Add: `backend/scripts/stagingBorrowCandidates.js`
- Modify: `backend/package.json`
- Modify: `.github/workflows/deploy-staging.yml`
- Modify: `tests/deployment/stagingWorkflowPolicy.test.js`

- [ ] Define the public module surface in the RED test:

```js
const {
  FIXTURES,
  assertStagingDatabase,
  assertResetAllowed,
  getBusinessDate,
  inspectFixtures,
  resetFixtures,
  run,
} = require('../scripts/stagingBorrowCandidates');
```

- [ ] Add RED guard and date tests:

```js
expect(() => assertStagingDatabase({ DB_NAME: 'LibraryManagement' }))
  .toThrow('DB_NAME must be LibraryManagementStaging');
expect(() => assertResetAllowed({ DB_NAME: 'LibraryManagementStaging' }))
  .toThrow('STAGING_DEMO_ALLOW_MUTATION must be true');
expect(() => assertResetAllowed({
  DB_NAME: 'LibraryManagementStaging',
  STAGING_DEMO_ALLOW_MUTATION: 'true',
})).not.toThrow();
expect(getBusinessDate(new Date('2026-08-03T17:30:00.000Z'))).toBe('2026-08-04');
```

- [ ] Add RED fixture identity assertions:

```js
expect(FIXTURES).toEqual([
  {
    title: 'Staging Borrow Demo 1',
    isbn: 'STAGING-BORROW-DEMO1',
    barcode: 'STG-BORROW-DEMO-001',
    location: 'STAGING-DEMO',
  },
  {
    title: 'Staging Borrow Demo 2',
    isbn: 'STAGING-BORROW-DEMO2',
    barcode: 'STG-BORROW-DEMO-002',
    location: 'STAGING-DEMO',
  },
]);
```

- [ ] Run RED:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/stagingBorrowCandidates.test.js
```

Expected RED: module does not exist.

- [ ] Implement the CLI shell with no import-time execution:

```js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const defaultDb = require('../src/config/db');

function assertStagingDatabase(env) {
  if (env.DB_NAME !== 'LibraryManagementStaging') {
    throw new Error('DB_NAME must be LibraryManagementStaging');
  }
}

function assertResetAllowed(env) {
  assertStagingDatabase(env);
  if (env.STAGING_DEMO_ALLOW_MUTATION !== 'true') {
    throw new Error('STAGING_DEMO_ALLOW_MUTATION must be true');
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
```

`status` must call only `assertStagingDatabase`; `reset` must call `assertResetAllowed`. Unknown modes fail before opening a pool.

- [ ] Implement `inspectFixtures` with parameterized `@IsbnPrefix`, `@BarcodePrefix`, and `@Location`; return counts/IDs/statuses only. Do not print email, password hash, connection configuration, tokens, or full audit metadata.

- [ ] Add the package script:

```json
"staging:borrow-candidates": "node scripts/stagingBorrowCandidates.js"
```

- [ ] Add a RED deployment-policy assertion before editing the workflow:

```js
assert.match(
  workflow,
  /Copy-Item backend\/scripts\/stagingBorrowCandidates\.js deploy\/backend\/scripts\//,
);
assert.doesNotMatch(workflow, /run:\s*.*staging:borrow-candidates/);
```

- [ ] Update `Prepare backend deployment package` with an explicit, non-executing copy:

```powershell
New-Item -ItemType Directory -Force deploy/backend/scripts | Out-Null
Copy-Item backend/scripts/stagingBorrowCandidates.js deploy/backend/scripts/
```

Do not copy other local demo helpers and do not add a deploy/start step that invokes the script.

- [ ] Run GREEN and a wrong-database CLI proof:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/stagingBorrowCandidates.test.js
$env:DB_NAME='NotStaging'; npm.cmd --prefix backend run staging:borrow-candidates -- status; Remove-Item Env:DB_NAME
node --test tests/deployment/stagingWorkflowPolicy.test.js
```

Expected: unit/deployment tests pass; CLI exits non-zero with `DB_NAME must be LibraryManagementStaging` and opens no SQL connection; deployment only packages the script.

- [ ] Checkpoint only: do not commit.

---

## Task 7: Implement transactional, fixture-only reset behavior

**Files:**

- Modify: `backend/tests/stagingBorrowCandidates.test.js`
- Modify: `backend/scripts/stagingBorrowCandidates.js`

- [ ] Add RED tests using a fake `sql.Transaction`/`sql.Request` adapter for:

  - active Admin resolution failure;
  - configured Member missing, inactive, not exactly `MEMBER`, overdue, positive unpaid fine, or at active/daily limit;
  - mixed tagged/untagged request refusal;
  - `DAMAGED`, `LOST`, or unknown fixture state refusal;
  - pending tagged request transition to `REJECTED` while its detail remains `REQUESTED`;
  - tagged active loan transition to `RETURNED` with Ho Chi Minh business date and request `COMPLETED`;
  - tagged `ACTIVE`/`NOTIFIED` reservation transition to `CANCELLED`;
  - missing fixtures inserted idempotently and existing fixtures reactivated;
  - one `STAGING_BORROW_DEMO_RESET` audit row per reset plus transition audit rows;
  - any injected SQL failure causes one rollback and zero commit;
  - second reset changes no unrelated state and leaves exactly two available tagged copies.

- [ ] Require this transaction skeleton in implementation:

```js
async function resetFixtures({ pool, sql, env, now = new Date() }) {
  assertResetAllowed(env);
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await resetWithinTransaction({
      transaction,
      sql,
      memberEmail: env.STAGING_DEMO_MEMBER_EMAIL,
      businessDate: getBusinessDate(now),
    });
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

- [ ] Bind every variable through `.input(...)`. The only interpolated SQL is static SQL text; do not interpolate email, prefixes, IDs, statuses, dates, or metadata.

- [ ] Resolve the audit actor and Member under the transaction:

```sql
SELECT TOP (1) u.UserId
FROM Users u WITH (UPDLOCK, HOLDLOCK)
INNER JOIN UserRoles ur ON ur.UserId = u.UserId
INNER JOIN Roles r ON r.RoleId = ur.RoleId
WHERE u.Status = 'ACTIVE' AND r.RoleName = 'ADMIN'
ORDER BY u.UserId;
```

The Member lookup must use `LOWER(u.Email) = LOWER(@MemberEmail)`, require active user, approved member, and exactly one role named `MEMBER`. `STAGING_DEMO_MEMBER_EMAIL` is required but never printed.

- [ ] Before any update, lock all tagged books/copies and related open workflow rows with `UPDLOCK, HOLDLOCK`. Refuse a request when the count of all request details differs from the count of tagged details.

- [ ] Apply only these terminal transitions:

```sql
UPDATE BorrowRequests
SET Status = 'REJECTED', RejectedAt = GETDATE(), ProcessedAt = GETDATE(),
    ApprovedBy = @ActorUserId, UpdatedAt = GETDATE()
WHERE RequestId = @RequestId AND Status = 'PENDING';

UPDATE BorrowDetails
SET Status = 'RETURNED', ReturnDate = @BusinessDate, UpdatedAt = GETDATE()
WHERE BorrowDetailId = @BorrowDetailId AND Status = 'BORROWED';

UPDATE BorrowRequests
SET Status = 'COMPLETED', ProcessedAt = GETDATE(), UpdatedAt = GETDATE()
WHERE RequestId = @RequestId AND Status = 'APPROVED';

UPDATE Reservations
SET Status = 'CANCELLED', CancelledAt = GETDATE(), UpdatedAt = GETDATE()
WHERE ReservationId = @ReservationId AND Status IN ('ACTIVE', 'NOTIFIED');
```

Do not rewrite pending `BorrowDetails.Status = 'REQUESTED'`; it is terminal history under a rejected request.

- [ ] Upsert only by the exact two ISBNs/barcodes. Create books with `Status='ACTIVE'` and nullable catalog metadata; create copies with `Status='AVAILABLE'` and `Location='STAGING-DEMO'`. Reactivate only after every tagged blocker has reached an approved terminal state.

- [ ] Insert audit rows through the same transaction using:

```js
JSON.stringify({
  marker: 'STAGING_BORROW_DEMO',
  mode: 'reset',
  fixtureIsbn,
  fromStatus,
  toStatus,
})
```

Use `Action='STAGING_BORROW_DEMO_RESET'` for the batch record and specific actions for request/detail/reservation/copy transitions. Never delete prior `AuditLogs`.

- [ ] Run GREEN:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/stagingBorrowCandidates.test.js
```

Expected GREEN: all policy, rollback, idempotence, and audit tests pass.

- [ ] Run security/secret checks:

```powershell
npm.cmd run test:secrets
rg -n "PasswordHash|DB_PASSWORD|JWT_SECRET|console\.(log|table).*Email" backend/scripts/stagingBorrowCandidates.js
```

Expected: secret gate passes; `rg` returns no unsafe output statements or embedded credential values.

- [ ] Checkpoint only: do not connect to or mutate Azure staging yet; do not commit.

---

## Task 8: Add controlled browser regression coverage

**Files:**

- Add: `tests/e2e/fe01-fe07-borrow-candidate-flow.spec.js`
- Reuse without modifying unless required: `tests/e2e/support/systemTestServer.js`

- [ ] Add Playwright tests that route controlled API responses for four HomePage books and assert:

```js
await expect(page.getByRole('button', { name: 'Mượn sách này' })).toBeEnabled();
await expect(page.getByRole('button', { name: 'Đặt chỗ sách này' })).toBeEnabled();
await expect(page.getByRole('button', { name: 'Đang chờ thư viện xử lý' })).toBeDisabled();
await expect(page.getByRole('button', { name: 'Tạm chưa khả dụng' })).toBeDisabled();
```

Click the enabled actions and assert `/borrowing/new?bookId=...` and `/reservations/mine?bookId=...`. Click attempts on disabled actions must leave the URL unchanged.

- [ ] Add FE07 browser cases:

  - `/api/borrow-requests/candidates -> { books: [] }` renders the server-empty title and no search-empty title;
  - a non-empty candidate response plus unmatched local text renders `Không tìm thấy sách phù hợp`;
  - a 500 response renders the safe error notice and neither valid-empty message.

- [ ] Run RED before implementation wiring if Task 4/5 has not yet made these cases pass, then GREEN:

```powershell
npx.cmd playwright test tests/e2e/fe01-fe07-borrow-candidate-flow.spec.js --project=chromium
```

Expected GREEN: routing, disabled controls, and empty/error states match the approved user flow.

- [ ] Do not include video capture. Keep only normal Playwright trace/screenshot-on-failure behavior already configured by the repository.

- [ ] Checkpoint only: do not commit.

---

## Task 9: Full local validation and H2 review

**Files:** all modified files above.

- [ ] Mark FE01-T015..017 and FE07-T062..064 complete only after their focused evidence is green; update traceability matrices and changelogs with actual test names/counts.

- [ ] Run formatting/diff hygiene:

```powershell
git diff --check
$placeholderMatches = rg -n "TODO|TBD|PLACEHOLDER|NotImplemented|throw new Error\('TODO" backend/scripts/stagingBorrowCandidates.js backend/tests/stagingBorrowCandidates.test.js tests/e2e/fe01-fe07-borrow-candidate-flow.spec.js
if ($LASTEXITCODE -eq 0) { throw "Implementation placeholders found:`n$placeholderMatches" }
```

Expected: `git diff --check` is clean; placeholder scan has no implementation placeholders.

- [ ] Run the full local gates:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd run test:deployment
npm.cmd run test:secrets
npm.cmd run trace:enforce
npx.cmd playwright test tests/e2e/fe01-fe07-borrow-candidate-flow.spec.js --project=chromium
```

Expected baseline minimums: backend remains at or above 74 suites / 1180 tests, frontend remains at or above 275 tests, deployment/secret/trace gates pass, and the new Playwright file passes. Record the actual new totals rather than copying these baseline numbers into changelogs.

- [ ] Inspect scope:

```powershell
git status --short --branch
git diff --stat
git diff --name-only
```

Expected: only files named in this plan are changed; no `.env`, credentials, generated videos, database dumps, or root-checkout files appear.

- [ ] Present H2 evidence to the user: exact branch/base, file list, RED evidence, GREEN commands/counts, security result, traceability result, and remaining live-staging risk. Do not commit/push before explicit H2 approval.

---

## Task 10: Commit, publish PR, H3, merge, deploy, and live staging acceptance

**Files:** no new implementation scope; operational evidence only unless review finds a defect.

- [ ] After explicit H2 approval, stage only reviewed files and commit:

```powershell
git add -- .sdd/specs/feat-public-browse/SPEC.md .sdd/specs/feat-public-browse/PLAN.md .sdd/specs/feat-public-browse/TASKS.md .sdd/specs/feat-public-browse/CHANGELOG.md .sdd/specs/feat-borrowing-management/SPEC.md .sdd/specs/feat-borrowing-management/PLAN.md .sdd/specs/feat-borrowing-management/TASKS.md .sdd/specs/feat-borrowing-management/CHANGELOG.md .github/workflows/deploy-staging.yml backend/src/repositories/bookRepository.js backend/src/services/bookService.js backend/src/docs/openapi.yaml backend/tests/publicBrowseRepository.test.js backend/tests/bookAvailabilityRepository.test.js backend/tests/bookRoutes.test.js backend/tests/publicBrowseRoutes.test.js backend/tests/helpers/inMemoryBookRepositories.js backend/scripts/stagingBorrowCandidates.js backend/tests/stagingBorrowCandidates.test.js backend/package.json frontend/src/utils/homeBookActions.js frontend/src/page/HomePage.jsx frontend/src/page/borrowing/BorrowRequestPage.jsx frontend/test/homeBookActions.test.js frontend/test/publicBrowseFrontend.test.js frontend/test/borrowingFrontend.test.js tests/deployment/stagingWorkflowPolicy.test.js tests/e2e/fe01-fe07-borrow-candidate-flow.spec.js docs/api/api-contract.md docs/deployment/azure-staging-guide.md docs/superpowers/specs/2026-08-03-borrow-candidate-staging-flow-design.md docs/superpowers/plans/2026-08-03-borrow-candidate-staging-flow.md
git diff --cached --name-only
git diff --cached --check
git commit -m "fix: make borrow candidate flow truthful"
```

Before commit, verify `git diff --cached --name-only` exactly matches the file map and contains no environment or generated artifact.

- [ ] Push the non-`codex` branch and open a ready PR:

```powershell
git push -u origin fix/borrow-candidate-staging-flow
$prBody = @"
## Summary
- add the public-safe circulationAction read model
- make Member actions and FE07 empty states truthful
- add guarded, audited staging-only borrow fixtures

## Acceptance
- AC-BCSF-001 through AC-BCSF-008

## Verification
- backend and frontend full suites
- deployment, secrets, and traceability gates
- focused Chromium browser flow
"@
gh pr create --base main --head fix/borrow-candidate-staging-flow --title "fix: make borrow candidate flow truthful" --body $prBody
```

- [ ] Watch all PR checks and review feedback. Any code change caused by review returns to focused RED/GREEN, full gates, and renewed H2 evidence.

- [ ] Present H3 evidence: final commit SHA, CI checks, unresolved review threads (must be zero), branch diff, migration/schema impact (`none`), and exact staging commands. Obtain explicit H3 approval before merge.

- [ ] Merge using the repository-approved PR strategy, verify the resulting `main` commit and post-merge CI, then verify the staging deployment uses that exact commit.

- [ ] On the deployed staging backend root (`/home/site/wwwroot`), run read-only status first:

```bash
npm run staging:borrow-candidates -- status
```

Expected: DB reports `LibraryManagementStaging`; script prints synthetic IDs/counts/statuses only.

- [ ] Capture pre-reset invariants for unrelated rows using the script's read-only summary plus a separately reviewed diagnostic query. Then run reset with one-session environment values only:

```bash
test -n "$STAGING_DEMO_MEMBER_EMAIL" || { echo 'STAGING_DEMO_MEMBER_EMAIL is required.' >&2; exit 1; }
export STAGING_DEMO_ALLOW_MUTATION=true
npm run staging:borrow-candidates -- reset
unset STAGING_DEMO_ALLOW_MUTATION
unset STAGING_DEMO_MEMBER_EMAIL
```

Do not persist `STAGING_DEMO_ALLOW_MUTATION=true` in App Service settings. If reset exits non-zero, stop and inspect; never bypass a guard or manually mass-update unrelated data.

- [ ] Run post-reset status and live browser acceptance as Demo Member:

  1. HomePage shows each synthetic title with `Mượn sách này`.
  2. `/borrowing/new` shows exactly both tagged titles among legal candidates.
  3. Submit one title successfully and capture the created request ID.
  4. Reload candidates and verify the second synthetic title remains.
  5. Verify the submitted title no longer presents an invalid direct-borrow continuation for that active claim.
  6. Verify `STAGING_BORROW_DEMO_RESET` and transition audit rows exist.
  7. Recheck unrelated-row invariants and confirm no change.

- [ ] Run post-deploy gates:

```powershell
if (-not $env:STAGING_FRONTEND_URL) { throw 'STAGING_FRONTEND_URL is required.' }
if (-not $env:STAGING_API_URL) { throw 'STAGING_API_URL is required.' }
npm.cmd run smoke:staging
Remove-Item Env:STAGING_FRONTEND_URL
Remove-Item Env:STAGING_API_URL
```

Expected: smoke passes, live AC-BCSF-001..008 evidence is complete, and no video artifact is required.

- [ ] Final report must include: PR URL, merge commit, deployed commit, staging reset outcome, created request ID, remaining candidate title, audit marker evidence, unrelated-state invariant result, and any known non-blocking dependency advisories.

---

## H1 Execution Contract

Approval of this plan authorizes only Tasks 1-9 in the isolated worktree. It does not authorize commit, push, PR creation, merge, deployment, or staging mutation until their explicit H2/H3 gates are reached.

Implementation is complete only when all AC-BCSF-001..008 are proven locally or on live staging as assigned above. Green `/health` or green unit tests alone are insufficient evidence of business correctness.
