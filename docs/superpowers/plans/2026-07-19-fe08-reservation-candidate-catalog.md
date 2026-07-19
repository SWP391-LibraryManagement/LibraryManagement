# FE08 Reservation Candidate Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace FE08's hardcoded `DEMO_RESERVABLE` catalog with a member-only, SQL-backed candidate API while preserving the approved `POST /api/reservations { copyId }` mutation contract.

**Architecture:** Add a read-only `/api/reservations/candidates` route through the existing FE08 validator/controller/service/repository stack. The repository returns one safe projection per `BORROWED` or `RESERVED` copy belonging to an active book, with server-owned search and pagination. The member page consumes that envelope; the existing create mutation remains authoritative for eligibility and race checks.

**Tech Stack:** Node.js, Express, `express-validator`, `mssql`, Jest/Supertest, React, Axios, Node test runner, Playwright, SQL Server.

## Global Constraints

- Keep `POST /api/reservations` target as physical `CopyId`; do not add `bookId` mutation support.
- Candidate reads require authentication and the `MEMBER` role; FE01 public browse and FE06 staff copy reads remain unchanged.
- Return only `copyId`, `bookId`, `title`, `authorName`, `copyStatus`, and `activeReservationCount`.
- Never return barcode, location, owner, email, timestamps, or version values.
- Return only active-book copies whose status is `BORROWED` or `RESERVED`.
- Use parameterized SQL, no schema migration, no audit write, no notification write, and no mutation lock in the candidate read path.
- Use query defaults `q = ''`, `page = 1`, `limit = 20`; enforce `page >= 1` and `1 <= limit <= 100`.
- Order by `Book.Title ASC`, `Book.BookId ASC`, `BookCopy.CopyId ASC`.
- Preserve existing safe generic `401`, `403`, and `400` envelopes.
- Keep `DEMO_BORROW_CATALOG` unchanged; remove only `DEMO_RESERVABLE`.
- Do not mark `TD-028` resolved until focused tests, SQL validation, browser acceptance, traceability, safety checks, and evidence documentation pass.

---

## Task 1: Lock FE08 requirements and traceability

**Files:**
- Modify: `.sdd/specs/feat-reservation-management/SPEC.md`
- Modify: `.sdd/specs/feat-reservation-management/PLAN.md`
- Modify: `.sdd/specs/feat-reservation-management/TASKS.md`
- Modify: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Interfaces:**
- Produces stable IDs used by implementation tests: `FR-FE08-029`, `AC-FE08-015`, `AC-FE08-016`, `NFR-FE08-SEC-004`, and `NFR-FE08-PERF-003`.

- [x] **Step 1: Add the candidate contract to SPEC.md.**

Add the endpoint to the API table and add these stable requirements without changing existing FE08 lifecycle rules:

```markdown
| FR-FE08-029 | Member reads a paginated candidate catalog from GET /api/reservations/candidates; rows contain one active-book BORROWED/RESERVED copy and safe book metadata, while POST /api/reservations remains authoritative. |
| AC-FE08-015 | A member sees only copyId, bookId, title, authorName, copyStatus, and activeReservationCount; barcode, location, owner, email, timestamps, and version are absent. |
| AC-FE08-016 | The member page uses the candidate endpoint for search and selection and does not import or render DEMO_RESERVABLE. |
| NFR-FE08-SEC-004 | Candidate reads are member-only and expose no staff-only copy or reservation-owner metadata. |
| NFR-FE08-PERF-003 | Candidate reads default to page 1 and limit 20, enforce page >= 1 and limit 1..100, and use deterministic title/book/copy ordering. |
```

Document the response envelope `{ data, pagination }`, the eligible statuses, safe projection, advisory consistency, and no-schema-migration boundary.

- [x] **Step 2: Update PLAN.md, TASKS.md, and CHANGELOG.md.**

Add candidate catalog scope, exact implementation files, focused validation commands, atomic tasks, the 2026-07-19 user approval, and removal of `DEMO_RESERVABLE`.

- [x] **Step 3: Verify documentation traceability.**

Run:

```powershell
git diff --check
rg -n "FR-FE08-029|AC-FE08-015|AC-FE08-016|NFR-FE08-SEC-004|NFR-FE08-PERF-003" .sdd/specs/feat-reservation-management
```

Expected: no whitespace errors; every new ID appears in the SPEC and its PLAN/TASKS traceability.

- [x] **Step 4: Commit the source-of-truth update.**

```powershell
git add .sdd/specs/feat-reservation-management/SPEC.md .sdd/specs/feat-reservation-management/PLAN.md .sdd/specs/feat-reservation-management/TASKS.md .sdd/specs/feat-reservation-management/CHANGELOG.md
git commit -m "docs: specify FE08 reservation candidate catalog"
```

---

## Task 2: Write RED backend contract tests and extend the in-memory repository

**Files:**
- Modify: `backend/tests/helpers/inMemoryReservationRepositories.js`
- Modify: `backend/tests/reservationRoutes.test.js`

**Interfaces:**
- Consumes existing `createReservationService`, `createApp`, and FE08 auth setup.
- Produces `reservationRepository.listReservationCandidates({ q, page, limit })` returning `{ rows, total }` with safe fields only.

- [x] **Step 1: Extend the in-memory candidate state.**

Add `status: 'ACTIVE'` and `authorName` to default books. Implement a repository method that filters active books and `BORROWED`/`RESERVED` copies, searches title/author, orders by title/book/copy, computes active reservation counts, slices the requested page, and returns `{ rows, total }`. Map exactly:

```javascript
{
  copyId,
  bookId,
  title,
  authorName,
  copyStatus,
  activeReservationCount
}
```

Do not expose the helper's barcode/location fields through this method.

- [x] **Step 2: Add RED route tests tagged with the new IDs.**

Cover member success, guest `401`, non-member `403`, invalid `q/page/limit`, empty results, active-book/status filtering, deterministic order, active-only queue counts, pagination, redacted keys, and no reservation/audit mutation. The core assertion must be equivalent to:

```javascript
const response = await request(app)
  .get('/api/reservations/candidates?q=clean&page=1&limit=1')
  .set('Authorization', authHeader(member.accessToken))
  .expect(200);

expect(response.body.data[0]).toEqual({
  copyId: expect.any(Number),
  bookId: expect.any(Number),
  title: 'Clean Code',
  authorName: 'Robert C. Martin',
  copyStatus: expect.stringMatching(/^(BORROWED|RESERVED)$/),
  activeReservationCount: expect.any(Number),
});
expect(Object.keys(response.body.data[0]).sort()).toEqual([
  'activeReservationCount', 'authorName', 'bookId', 'copyId', 'copyStatus', 'title',
]);
```

- [x] **Step 3: Run RED.**

```powershell
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationRoutes.test.js
```

Expected: only the new candidate cases fail because the route/service/repository methods do not exist.

- [x] **Step 4: Commit the RED contract.**

```powershell
git add backend/tests/helpers/inMemoryReservationRepositories.js backend/tests/reservationRoutes.test.js
git commit -m "test: define FE08 reservation candidate contract"
```

---

## Task 3: Implement the protected backend read path and OpenAPI

**Files:**
- Modify: `backend/src/validators/reservationValidators.js`
- Modify: `backend/src/routes/reservationRoutes.js`
- Modify: `backend/src/controllers/reservationController.js`
- Modify: `backend/src/services/reservationService.js`
- Modify: `backend/src/repositories/reservationRepository.js`
- Modify: `backend/src/docs/openapi.yaml`

**Interfaces:**
- Validator produces normalized `req.query`.
- Service consumes `listReservationCandidates(filters, actor)` and returns `{ data, pagination }`.
- Repository consumes `{ q, page, limit }` and returns `{ rows, total }`.

- [x] **Step 1: Add query validators.**

Add and export `listReservationCandidatesValidators` with `q.trim().isLength({ max: 200 })`, `page.isInt({ min: 1 }).toInt().default(1)`, `limit.isInt({ min: 1, max: 100 }).toInt().default(20)`, and the existing `handleValidationErrors`.

- [x] **Step 2: Mount the route and controller.**

Mount this route before the staff `GET '/'` route:

```javascript
router.get(
  '/candidates',
  authenticate,
  requireAnyRole('MEMBER'),
  listReservationCandidatesValidators,
  controller.listCandidates
);
```

Add `controller.listCandidates` that calls `reservationService.listReservationCandidates(req.query, req.user)` and returns status 200.

- [x] **Step 3: Add the service method.**

Implement the member guard and canonical envelope:

```javascript
async function listReservationCandidates(filters = {}, actor) {
  requireMember(actor);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const result = await reservationRepository.listReservationCandidates({
    q: typeof filters.q === 'string' ? filters.q.trim() : '',
    page,
    limit,
  });
  const total = Number(result.total || 0);
  return {
    data: result.rows,
    pagination: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
  };
}
```

Do not call audit, notification, or mutation methods.

- [x] **Step 4: Add the parameterized SQL repository method.**

Use a safe projection equivalent to:

```sql
SELECT
  bc.CopyId AS copyId,
  bc.BookId AS bookId,
  b.Title AS title,
  a.AuthorName AS authorName,
  bc.Status AS copyStatus,
  (
    SELECT COUNT(*)
    FROM Reservations ar
    WHERE ar.CopyId = bc.CopyId
      AND ar.Status = 'ACTIVE'
  ) AS activeReservationCount,
  COUNT(*) OVER() AS totalRows
FROM BookCopies bc
INNER JOIN Books b ON b.BookId = bc.BookId
LEFT JOIN Authors a ON a.AuthorId = b.AuthorId
WHERE b.Status = 'ACTIVE'
  AND bc.Status IN ('BORROWED', 'RESERVED')
  AND (@Search IS NULL OR b.Title LIKE @Search ESCAPE '\\'
       OR COALESCE(a.AuthorName, '') LIKE @Search ESCAPE '\\')
ORDER BY b.Title ASC, b.BookId ASC, bc.CopyId ASC
OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
```

Bind `Search`, `Offset`, and `Limit` through `mssql`. Escape LIKE metacharacters before binding. Return `total = 0` when the recordset is empty and map only the six contract fields.

- [x] **Step 5: Document OpenAPI.**

Add `ReservationCandidate`, `ReservationCandidatePagination`, and `ReservationCandidateListResponse` schemas with `additionalProperties: false`. Add the endpoint with bearer security, `q/page/limit`, and `200/400/401/403` responses.

- [x] **Step 6: Run GREEN backend tests.**

```powershell
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationRoutes.test.js
```

Expected: all existing and new FE08 route tests pass.

- [x] **Step 7: Commit backend implementation.**

```powershell
git add backend/src/validators/reservationValidators.js backend/src/routes/reservationRoutes.js backend/src/controllers/reservationController.js backend/src/services/reservationService.js backend/src/repositories/reservationRepository.js backend/src/docs/openapi.yaml
git commit -m "feat: add member reservation candidate catalog"
```

---

## Task 4: Add real SQL Server candidate validation

**Files:**
- Create: `backend/tests/sql/reservationCandidates.sqltest.js`

**Interfaces:**
- Consumes the existing disposable SQL environment, mutation guard, `getPool`, and repository method.
- Produces synthetic candidate rows and cleanup evidence.

- [x] **Step 1: Add guarded setup and cleanup.**

Follow the existing feature-scoped `backend/tests/sql/*.sqltest.js` pattern: load `FE08_SQL_TEST_ENV_FILE` before DB imports, require `FE08_SQL_TEST_ALLOW_MUTATION=true`, generate unique in-memory seed suffixes, track every inserted ID, and delete all synthetic rows in a `finally`-equivalent cleanup path.

- [x] **Step 2: Seed all relevant statuses.**

Insert active and inactive books, active copies in `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, and `INACTIVE` states, plus one active and one terminal reservation for a candidate copy. Use parameterized inserts only.

- [x] **Step 3: Assert filtering, counts, ordering, pagination, and redaction.**

Assert active-book borrowed/reserved copies are present, all other statuses are absent, active reservation counts exclude terminal rows, search and page/limit work, ordering is deterministic, and every returned row has exactly the six safe keys.

- [x] **Step 4: Run the focused SQL suite.**

```powershell
npm.cmd --prefix backend test -- --runInBand --testMatch "**/reservationCandidates.sqltest.js"
```

Expected: all candidate SQL cases pass and cleanup leaves `DB_CLEAN`/synthetic rows clean.

- [x] **Step 5: Commit SQL validation.**

```powershell
git add backend/tests/sql/reservationCandidates.sqltest.js
git commit -m "test: validate FE08 candidate catalog on SQL Server"
```

---

## Task 5: Migrate the member page to server candidates

**Files:**
- Modify: `frontend/src/api/libraryFeatureApi.js`
- Modify: `frontend/src/page/reservation/MyReservationsPage.jsx`
- Modify: `frontend/src/utils/libraryFeatureViewModels.js`
- Modify: `frontend/test/reservationFrontend.test.js`
- Modify: `frontend/test/borrowingFrontend.test.js`

**Interfaces:**
- API method: `reservationApi.listCandidates(params = {})`.
- UI consumes `{ data, pagination }` and calls existing `reservationApi.create(candidate.copyId)`.

- [x] **Step 1: Add API method and RED source tests.**

Add:

```javascript
listCandidates(params = {}) {
  return authorizedReservationRequest(
    { method: 'get', url: '/reservations/candidates', params },
    'Không thể tải danh sách sách có thể đặt chỗ.',
  );
},
```

Extend the frontend source tests to require this method, the candidate URL, and the reservation resolver; update `borrowingFrontend.test.js` to retain only `DEMO_BORROW_CATALOG`; add a failing assertion that `DEMO_RESERVABLE` is absent from `MyReservationsPage.jsx`.

- [x] **Step 2: Run RED frontend tests.**

```powershell
npm.cmd --prefix frontend test -- --test-name-pattern="reservation API|candidate|DEMO_RESERVABLE"
```

Expected: the new candidate assertions fail before the page migration.

- [x] **Step 3: Replace the local catalog state.**

In `MyReservationsPage.jsx`, replace the `DEMO_RESERVABLE` import and `useMemo` filtering with server state `candidates`, `candidatePagination`, `candidateLoading`, and `candidateError`. Implement `loadCandidates({ q, page })` that calls `reservationApi.listCandidates({ q: q.trim(), page, limit: 20 })`, handles empty/error/loading states, and cancels its search timer during effect cleanup.

- [x] **Step 4: Render safe fields and preserve mutation semantics.**

Render title, author, copy status, and active reservation count. Remove invented `availableCopies` and ETA values. Call `reservationApi.create(candidate.copyId)`; after success reload both reservations and candidates. On conflict reload candidates so stale rows disappear. Do not mutate a local candidate catalog as the source of truth.

- [x] **Step 5: Remove the static export.**

Delete only `DEMO_RESERVABLE` from `libraryFeatureViewModels.js`. Keep `DEMO_BORROW_CATALOG` unchanged. Add source tests proving the page no longer imports the removed export.

- [x] **Step 6: Run focused frontend checks.**

```powershell
npm.cmd --prefix frontend test -- --test-name-pattern="reservation API|candidate|DEMO_RESERVABLE"
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Expected: focused tests, lint, and build pass; the known non-blocking chunk warning may remain.

- [x] **Step 7: Commit frontend migration.**

```powershell
git add frontend/src/api/libraryFeatureApi.js frontend/src/page/reservation/MyReservationsPage.jsx frontend/src/utils/libraryFeatureViewModels.js frontend/test/reservationFrontend.test.js frontend/test/borrowingFrontend.test.js
git commit -m "feat: connect FE08 member candidates to server state"
```

---

## Task 6: Add browser acceptance

**Files:**
- Create: `tests/e2e/fe08-reservation-candidate-catalog.spec.js`
- Modify: `tests/e2e/support/systemTestServer.js` only if the existing deterministic setup cannot seed an unavailable copy.

**Interfaces:**
- Consumes existing Playwright `FRONTEND_URL`, `BACKEND_URL`, `/__e2e__/setup`, and member login.
- Produces `E2E-FE08-ACC01`.

- [x] **Step 1: Set up an isolated member.**

Use `randomUUID()`, a synthetic password, `request.post('/__e2e__/setup')`, and existing login labels. Navigate to `/reservations/mine`.

- [x] **Step 2: Assert candidate request and redaction.**

Wait for `GET /api/reservations/candidates?page=1&limit=20`, assert `200`, assert response rows contain exactly the six safe fields, and assert the page shows title/status/queue count without barcode/location.

- [x] **Step 3: Assert server search and real mutation.**

Fill `Tìm sách để đặt...`, assert the next request includes encoded `q`, click `Đặt chỗ`, assert `POST /api/reservations` sends numeric `copyId`, and assert the canonical reservation list reloads.

- [x] **Step 4: Run focused browser acceptance.**

```powershell
$env:E2E_FRONTEND_PORT='4185'
$env:E2E_BACKEND_PORT='3101'
npm.cmd run test:e2e -- tests/e2e/fe08-reservation-candidate-catalog.spec.js
```

Expected: `E2E-FE08-ACC01` passes with no mobile horizontal overflow.

- [x] **Step 5: Commit browser acceptance.**

```powershell
git add tests/e2e/fe08-reservation-candidate-catalog.spec.js tests/e2e/support/systemTestServer.js
git commit -m "test: add FE08 reservation candidate browser acceptance"
```

---

## Task 7: Reconcile evidence, debt, and full validation

**Files:**
- Modify: `TECH_DEBT.md`
- Create: `.sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md`
- Modify: `.sdd/reviews/full-reconciliation-human-acceptance-packet-2026-07-19.md`

- [x] **Step 1: Run focused gates.**

```powershell
npm.cmd --prefix backend test -- --runInBand --runTestsByPath tests/reservationRoutes.test.js
npm.cmd --prefix backend test -- --runInBand --testMatch "**/reservationCandidates.sqltest.js"
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```

Record exact counts and the disposable SQL cleanup result.

- [x] **Step 2: Run complete local gates.**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:deployment
npm.cmd run trace:enforce
$env:E2E_FRONTEND_URL='http://127.0.0.1:4185'
$env:E2E_BACKEND_URL='http://127.0.0.1:3101'
npm.cmd run test:e2e
```

Re-run the aggregate disposable SQL Server gate, including the new candidate suite, with no application database mutation.

- [x] **Step 3: Update focused evidence.**

Record commands, counts, safe projection assertions, authorization results, SQL cleanup, browser ports, CI run, advisory consistency, and residual risks. Never record credentials, tokens, raw OTPs, or connection strings.

- [x] **Step 4: Close TD-028 only after all evidence passes.**

Move TD-028 from `OPEN` to the Resolved table with the implementation commit and focused validation record. Keep unrelated human-review debt open until the reviewer signs the packet.

- [x] **Step 5: Update the acceptance packet.**

Fill Decision Gate A with the approved Option A reference, update final head/CI, and leave Gate B unchecked until a named human reviewer completes the FE01-FE12 walkthrough and explicitly approves merge.

- [ ] **Step 6: Commit and push evidence.**

```powershell
git add TECH_DEBT.md .sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md .sdd/reviews/full-reconciliation-human-acceptance-packet-2026-07-19.md
git commit -m "docs: close FE08 candidate catalog validation debt"
git push origin feat/full-reconciliation
```

---

## Plan Self-Review

- **Spec coverage:** access, query validation, eligible statuses, safe projection, advisory consistency, frontend migration, SQL validation, browser acceptance, traceability, and non-goals are covered by Tasks 1-7.
- **Completeness:** every task names files, interfaces, commands, and expected results; no unspecified steps remain.
- **Type consistency:** repository returns `{ rows, total }`; service returns `{ data, pagination }`; frontend consumes `data.data` and `data.pagination`; create consumes numeric `copyId`.
- **Scope:** no schema, dependency, public-browse, staff-inventory, automatic queue, notification, or mutation-target change is included.
- **Safety:** SQL remains parameterized and all SQL-backed fixtures are synthetic and cleaned up.
