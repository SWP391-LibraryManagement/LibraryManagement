# FE10 Personal Notification Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure personal notification inbox for authenticated `MEMBER`, `LIBRARIAN`, and `ADMIN` accounts while preserving the existing email-delivery record, sensitive-content boundary, and Azure staging safety.

**Architecture:** Extend `Notifications` with nullable `ReadAt`, query only current-user eligible non-sensitive rows in SQL, map rows to a fixed safe DTO and backend-owned action allowlist, expose four authenticated endpoints, then consume them through a shared React inbox context, shell bell, and paginated `/notifications` page. Deploy the additive migration and backend before the frontend.

**Tech Stack:** SQL Server/Azure SQL, Node.js 22, Express 5, `mssql`, Jest/Supertest, React 19, React Router 7, Axios, Node test runner, Playwright, Azure App Service, Azure Static Web Apps.

**Plan/H1 approved:** 2026-07-28 by the user in the active task.

## Global Constraints

- The approved source contract is `.sdd/specs/feat-notification-management/SPEC.md` v0.5.0 and the approved design is `docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md`.
- Work only in `codex/docs-fe10-notification-inbox-spec` until the reviewed implementation branch/worktree is chosen. Preserve unrelated root-worktree changes.
- Start product implementation only after this H1-approved governance
  activation reaches `main`, as required by the repository Fast-Track rules.
- Use RED -> GREEN -> focused verification for every task. Do not weaken a failing assertion merely to obtain GREEN.
- Every repository read or mutation must include the authenticated `UserId` and the exact inbox-eligibility predicate before returning data.
- Never expose or include `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, `ACCOUNT_SETUP`, `EMAIL_VERIFY`, userless rows, recipient email, `SafePayload`, idempotency data, provider data, delivery errors, attempts, or source metadata in inbox responses.
- `ReadAt` is orthogonal to `Status`, `SentAt`, `AttemptCount`, `NotificationAttempts`, source state, and idempotency. Read operations must not send, retry, claim, or alter delivery.
- Action routes are fixed backend mappings only: `/membership`, `/reservations/mine`, `/borrowing/history`, `/fines/mine`. Unknown/incompatible rows return `actionPath: null`.
- No WebSocket, service worker, new notification channel, duplicate projection table, global staff log, delete, or archive behavior.
- Migrations are additive, transactional, repeatable, Azure SQL compatible, and verified twice on a disposable database before staging.
- Deploy migration/backend before frontend. Application rollback leaves nullable `ReadAt` in place.

---

## Task 1: Add The Canonical Read-State Schema And Repeatable Migration (FE10-I01)

**Files:**

- Create: `database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql`
- Create: `backend/tests/notificationInboxMigration.test.js`
- Modify: `database/Librarymanagement.sql`
- Modify: `backend/src/models/Notification.js`
- Modify: `.sdd/specs/feat-notification-management/TEST_PLAN.md`

- [ ] **Step 1: Write the RED migration contract test**

Add assertions that both canonical schema and migration contain `ReadAt DATETIME2 NULL`, that the migration is transactional/idempotent, and that backfill runs only in the same first-run branch that adds the column.

```js
expect(migration).toMatch(/COL_LENGTH\('dbo\.Notifications', 'ReadAt'\) IS NULL/i);
expect(migration).toMatch(/ALTER TABLE dbo\.Notifications ADD ReadAt DATETIME2 NULL/i);
expect(migration).toMatch(/SET ReadAt = CreatedAt/i);
expect(migration).toMatch(/IX_Notifications_User_ReadAt_CreatedAt/i);
expect(migration).toMatch(/BEGIN TRANSACTION/i);
expect(migration).toMatch(/ROLLBACK TRANSACTION/i);
expect(migration).toMatch(/THROW/i);
```

The test must also assert that the eligibility SQL includes only:

```text
GENERAL_SYSTEM + MEMBERSHIP_RESULT
RESERVATION_AVAILABLE + RESERVATION_READY
DUE_DATE_REMINDER
OVERDUE_NOTICE
FINE_NOTICE
```

and excludes all three canonical sensitive types plus legacy `EMAIL_VERIFY`.

- [ ] **Step 2: Run the focused test and capture RED**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationInboxMigration.test.js
```

Expected: FAIL because the migration file and `ReadAt` schema/model contract do not yet exist.

- [ ] **Step 3: Implement the migration and canonical schema/model**

The migration shall enable the SQL Server indexed-object session settings, use `XACT_ABORT`, and keep first-run backfill inside the column-add branch so a repeated run does not mark notifications created after migration as read.

```sql
IF COL_LENGTH('dbo.Notifications', 'ReadAt') IS NULL
BEGIN
    ALTER TABLE dbo.Notifications ADD ReadAt DATETIME2 NULL;

    UPDATE dbo.Notifications
    SET ReadAt = CAST(CreatedAt AS DATETIME2)
    WHERE UserId IS NOT NULL
      AND (
        (NotificationType = 'GENERAL_SYSTEM' AND TemplateKey = 'MEMBERSHIP_RESULT')
        OR (NotificationType = 'RESERVATION_AVAILABLE' AND TemplateKey = 'RESERVATION_READY')
        OR (NotificationType = 'DUE_DATE_REMINDER' AND TemplateKey = 'DUE_DATE_REMINDER')
        OR (NotificationType = 'OVERDUE_NOTICE' AND TemplateKey = 'OVERDUE_NOTICE')
        OR (NotificationType = 'FINE_NOTICE' AND TemplateKey = 'FINE_NOTICE')
      );
END;
```

Create `IX_Notifications_User_ReadAt_CreatedAt` only when absent, with key columns `(UserId, ReadAt, CreatedAt DESC)` and `NotificationId`, `NotificationType`, `TemplateKey`, `Title`, and `Body` included for the inbox query. Add `{ attribute: 'readAt', name: 'ReadAt', type: 'DATETIME2', nullable: true }` to the model.

- [ ] **Step 4: Run focused GREEN and schema regression tests**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationInboxMigration.test.js tests/notificationRepository.test.js tests/fe10OtpTemplateMigration.test.js
npm.cmd run schema:azure:prepare
```

Expected: all selected Jest tests PASS and Azure schema preparation reports a generated schema without create/switch-database statements.

- [ ] **Step 5: Commit the bounded schema slice**

```powershell
git add database/Librarymanagement.sql database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql backend/src/models/Notification.js backend/tests/notificationInboxMigration.test.js .sdd/specs/feat-notification-management/TEST_PLAN.md
git commit -m "feat(fe10): add personal inbox read state schema"
```

---

## Task 2: Add SQL-Owned Inbox Queries And Safe Projection (FE10-I02)

**Files:**

- Create: `backend/src/utils/notificationInbox.js`
- Create: `backend/tests/notificationInboxRepository.test.js`
- Modify: `backend/src/repositories/notificationRepository.js`
- Modify: `backend/tests/helpers/inMemoryNotificationRepositories.js`
- Modify: `backend/tests/notificationRoutes.test.js`

- [ ] **Step 1: Write RED utility and repository tests**

Cover:

- safe DTO exact keys: `notificationId`, `type`, `title`, `message`, `createdAt`, `readAt`, `actionPath`;
- exact type/template action mapping and `null` for mismatches;
- SQL predicates include `UserId`, eligibility, read-state, optional type, `CreatedAt DESC, NotificationId DESC`, `OFFSET`, and `FETCH NEXT`;
- count applies the same ownership/eligibility predicate;
- mark-one preserves the first `ReadAt` timestamp on replay;
- mark-all uses one server timestamp and returns zero on replay;
- sensitive, userless, and other-user records never materialize.

```js
expect(toSafeInboxItem(row)).toEqual({
  notificationId: row.notificationId,
  type: 'DUE_DATE_REMINDER',
  title: row.title,
  message: row.body,
  createdAt: row.createdAt,
  readAt: null,
  actionPath: '/borrowing/history',
});
expect(Object.keys(toSafeInboxItem(row)).sort()).toEqual([
  'actionPath', 'createdAt', 'message', 'notificationId', 'readAt', 'title', 'type',
]);
```

- [ ] **Step 2: Run focused RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationInboxRepository.test.js tests/notificationRoutes.test.js
```

Expected: FAIL because the inbox utility/repository operations do not exist.

- [ ] **Step 3: Implement the fixed utility contract**

Export only stable helpers needed by service/tests:

```js
const INBOX_TYPES = Object.freeze([
  'GENERAL_SYSTEM',
  'RESERVATION_AVAILABLE',
  'DUE_DATE_REMINDER',
  'OVERDUE_NOTICE',
  'FINE_NOTICE',
]);

function getInboxActionPath(notification) { /* exact type/template switch */ }
function toSafeInboxItem(notification) { /* exact seven-field DTO */ }
```

Do not derive a route from `title`, `body`, `safePayload`, a request parameter, or arbitrary source values.

- [ ] **Step 4: Implement repository operations**

Add and export:

```js
listInboxForUser({ userId, page, limit, readState, type })
countUnreadForUser(userId)
markInboxReadForUser({ notificationId, userId })
markAllInboxReadForUser(userId)
```

`listInboxForUser` returns `{ notifications, total }`; service computes `totalPages`. Filtering and pagination remain inside SQL. `markInboxReadForUser` uses `COALESCE(ReadAt, SYSUTCDATETIME())` on an owned eligible row so replay returns the same timestamp. `markAllInboxReadForUser` captures one `SYSUTCDATETIME()` value and updates only own eligible `ReadAt IS NULL` rows.

Mirror the same semantics in the in-memory repository so route/integration tests exercise ownership and idempotence, not a permissive fake.

- [ ] **Step 5: Run focused GREEN**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationInboxRepository.test.js tests/notificationRoutes.test.js tests/notificationRepository.test.js
```

Expected: all selected tests PASS; existing delivery-claim tests remain green.

- [ ] **Step 6: Commit the repository slice**

```powershell
git add backend/src/utils/notificationInbox.js backend/src/repositories/notificationRepository.js backend/tests/helpers/inMemoryNotificationRepositories.js backend/tests/notificationInboxRepository.test.js backend/tests/notificationRoutes.test.js
git commit -m "feat(fe10): add owned notification inbox repository"
```

---

## Task 3: Expose Authenticated Inbox APIs With IDOR-Safe Errors (FE10-I03)

**Files:**

- Modify: `backend/src/validators/notificationValidators.js`
- Modify: `backend/src/services/notificationService.js`
- Modify: `backend/src/controllers/notificationController.js`
- Modify: `backend/src/routes/notificationRoutes.js`
- Modify: `backend/src/docs/openapi.yaml`
- Modify: `backend/tests/notificationRoutes.test.js`

- [ ] **Step 1: Add RED route/service cases**

Add table-driven tests for `MEMBER`, `LIBRARIAN`, and `ADMIN`, plus:

- anonymous `401` and authenticated unsupported-role `403`;
- default and explicit page/limit/read-state/type filters;
- invalid page, limit, read state, sensitive type, and unknown type return `400 VALIDATION_ERROR`;
- cross-user, sensitive, and missing mark-one IDs return the same `404` body;
- list/count exclude all sensitive and userless rows;
- mark-one replay preserves `readAt`;
- mark-all updates only own eligible unread rows and replay returns `{ updated: 0 }`;
- no response contains forbidden metadata or changes delivery status/attempts.

Use one exact not-found response for all protected-object cases:

```js
{
  error: {
    code: 'NOTIFICATION_NOT_FOUND',
    message: 'Notification was not found.',
  },
}
```

- [ ] **Step 2: Run route RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js
```

Expected: new inbox cases FAIL with route `404` or missing service methods.

- [ ] **Step 3: Add validators and routes in collision-safe order**

Import `query` from `express-validator`. Validate default page `1`, default limit `20`, maximum limit `100`, `readState` in `all|unread|read`, and `type` in the five eligible types. Register static `/mine/*` paths before `/:id/read`.

```js
router.get('/mine', authenticate, requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'), listMineValidators, controller.listMine);
router.get('/mine/unread-count', authenticate, requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'), controller.unreadCount);
router.patch('/mine/read-all', authenticate, requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'), controller.markAllRead);
router.patch('/:id/read', authenticate, requireAnyRole('MEMBER', 'LIBRARIAN', 'ADMIN'), markReadValidators, controller.markRead);
```

- [ ] **Step 4: Add thin controllers and service boundary methods**

Add service methods:

```js
listMyNotifications(input, actor)
countMyUnreadNotifications(actor)
markMyNotificationRead(notificationId, actor)
markAllMyNotificationsRead(actor)
```

The service rechecks allowed login roles, always takes `userId` from `actor`, maps repository rows through `toSafeInboxItem`, computes pagination, and throws the single safe `NOTIFICATION_NOT_FOUND` error when mark-one returns no owned eligible row. It never accepts `userId` or `actionPath` from HTTP input.

- [ ] **Step 5: Document exact OpenAPI schemas and operations**

Add `SafeInboxItem`, `NotificationInboxPage`, `UnreadCount`, and `MarkAllReadSummary` schemas with `additionalProperties: false`. Document all four paths, query constraints, allowed roles, safe `400/401/403/404/500` responses, and the seven-field DTO exclusions.

- [ ] **Step 6: Run focused GREEN and coverage gate**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js tests/notificationInboxRepository.test.js
npm.cmd --prefix backend run test:coverage:ci
```

Expected: focused tests PASS and global configured coverage thresholds remain satisfied.

- [ ] **Step 7: Commit the API slice**

```powershell
git add backend/src/validators/notificationValidators.js backend/src/services/notificationService.js backend/src/controllers/notificationController.js backend/src/routes/notificationRoutes.js backend/src/docs/openapi.yaml backend/tests/notificationRoutes.test.js
git commit -m "feat(fe10): expose personal notification inbox api"
```

---

## Task 4: Add The Frontend Client, View Model, And Shared Inbox Context (FE10-I04)

**Files:**

- Create: `frontend/src/utils/notificationInboxViewModel.js`
- Create: `frontend/src/context/NotificationInboxContext.jsx`
- Create: `frontend/test/notificationInboxFrontend.test.js`
- Modify: `frontend/src/api/libraryFeatureApi.js`
- Modify: `frontend/src/api/apiErrorMessages.js`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Write RED frontend contract tests**

Use the existing Node test style. Import pure view-model helpers and inspect JSX/API source for:

- four exact endpoint methods;
- badge values `0 -> null`, `1 -> "1"`, `99 -> "99"`, `100 -> "99+"`;
- fixed frontend defense-in-depth action allowlist;
- provider wraps routes, polls every `60000`, refreshes on `focus`, and prevents overlapping count requests;
- successful read refreshes count;
- failed read emits safe warning but still navigates when `actionPath` is allowlisted.

```js
assert.equal(formatUnreadBadge(0), null);
assert.equal(formatUnreadBadge(99), '99');
assert.equal(formatUnreadBadge(100), '99+');
assert.equal(isAllowedNotificationActionPath('https://evil.test'), false);
```

- [ ] **Step 2: Run frontend RED**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js
```

Expected: FAIL because the client/view model/context do not exist.

- [ ] **Step 3: Add the authorized client methods**

Reuse `authorizedRequest` in `libraryFeatureApi.js` so refresh-token behavior remains consistent.

```js
export const notificationInboxApi = {
  listMine(params = {}) { /* GET /notifications/mine */ },
  unreadCount() { /* GET /notifications/mine/unread-count */ },
  markRead(notificationId) { /* PATCH /notifications/{id}/read */ },
  markAllRead() { /* PATCH /notifications/mine/read-all */ },
};
```

Add Vietnamese safe error messages for validation, authentication, not-found, and network failures. Do not display backend stack/provider details.

- [ ] **Step 4: Add pure view-model helpers**

Export `formatUnreadBadge`, `isAllowedNotificationActionPath`, and stable read-state filter constants. Keep URL approval independent of API data.

- [ ] **Step 5: Add the shared provider**

Mount `NotificationInboxProvider` inside router context and outside route content in `App.jsx`. The provider owns unread count, one non-overlapping refresh, focus/60-second refresh, read-and-navigate behavior, and shared warning toast. It checks stored authentication/roles before calling FE10 and resets count when logged out.

Do not treat an API error as an empty successful inbox. Do not redirect to login merely because the inbox endpoint fails; existing auth-refresh behavior remains authoritative.

- [ ] **Step 6: Run frontend GREEN, lint, and build**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Expected: focused tests PASS; ESLint exits 0; Vite build completes.

- [ ] **Step 7: Commit the shared frontend state slice**

```powershell
git add frontend/src/api/libraryFeatureApi.js frontend/src/api/apiErrorMessages.js frontend/src/utils/notificationInboxViewModel.js frontend/src/context/NotificationInboxContext.jsx frontend/src/App.jsx frontend/test/notificationInboxFrontend.test.js
git commit -m "feat(fe10): add shared notification inbox state"
```

---

## Task 5: Add The Authenticated Shell Bell And Five-Item Preview (FE10-I05)

**Files:**

- Create: `frontend/src/component/notification/NotificationBell.jsx`
- Modify: `frontend/src/component/layout/Header.jsx`
- Modify: `frontend/src/styles/app-shell.css`
- Modify: `frontend/test/notificationInboxFrontend.test.js`
- Modify: `frontend/test/appShellFrontend.test.js`

- [ ] **Step 1: Add RED shell assertions**

Assert that Header renders `NotificationBell`, the component uses the context count, caps the badge through `formatUnreadBadge`, fetches `readState: 'unread', page: 1, limit: 5` only when opened, exposes explicit loading/empty/error states, and includes `Xem tất cả` -> `/notifications`.

Also assert semantic controls:

- bell button has an accessible name and `aria-expanded`;
- popover has a labelled region/menu;
- unread items are buttons, not unsafe anchors;
- no delete/archive/global-log text or method exists.

- [ ] **Step 2: Run shell RED**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js frontend/test/appShellFrontend.test.js
```

Expected: FAIL because Header has no notification bell/preview.

- [ ] **Step 3: Implement the bell and preview**

Use Lucide `Bell`. Fetch preview on closed -> open transition, not on every render. Render at most five newest unread safe items and delegate click behavior to the shared context. Close the popover on outside click, `Escape`, route navigation, and `Xem tất cả`; restore focus to the bell after keyboard dismissal.

Place the bell before the account trigger in `.app-topbar-actions`. Keep the existing profile fallback and logout behavior unchanged.

- [ ] **Step 4: Add responsive, accessible styles**

Add scoped `.notification-*` classes to `app-shell.css`. Verify the popover fits desktop and 390px mobile width without horizontal overflow, badge remains legible at `99+`, unread emphasis is not color-only, and focus rings remain visible.

- [ ] **Step 5: Run shell GREEN, lint, and build**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js frontend/test/appShellFrontend.test.js
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Expected: tests PASS, lint exits 0, build succeeds.

- [ ] **Step 6: Commit the shell slice**

```powershell
git add frontend/src/component/notification/NotificationBell.jsx frontend/src/component/layout/Header.jsx frontend/src/styles/app-shell.css frontend/test/notificationInboxFrontend.test.js frontend/test/appShellFrontend.test.js
git commit -m "feat(fe10): add notification bell and preview"
```

---

## Task 6: Add The Guarded `/notifications` Page (FE10-I06)

**Files:**

- Create: `frontend/src/component/auth/AuthenticatedRouteGuard.jsx`
- Create: `frontend/src/page/notification/NotificationsPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/styles/app-shell.css`
- Modify: `frontend/test/notificationInboxFrontend.test.js`

- [ ] **Step 1: Add RED page and route assertions**

Cover:

- lazy `/notifications` route wrapped by the authenticated guard;
- unauthenticated redirect to `/login` and no role-specific exclusion for MEMBER/LIBRARIAN/ADMIN;
- `Tất cả`, `Chưa đọc`, `Đã đọc` map to `all`, `unread`, `read`;
- every list call sends `page`, `limit: 20`, and `readState`;
- filter change returns to page 1;
- explicit loading, empty, error, unread/read visual states;
- `Đánh dấu tất cả đã đọc` invokes the API, refreshes count/list, and disables while pending;
- click invokes shared read-and-navigate;
- no delete/archive/global-log control.

- [ ] **Step 2: Run page RED**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js
```

Expected: FAIL because the route, guard, and page do not exist.

- [ ] **Step 3: Implement the authenticated guard and lazy route**

The guard checks stored access/refresh token for UX only. Backend authorization remains the security boundary. It accepts any authenticated session and does not reuse the member-only borrowing guard.

- [ ] **Step 4: Implement the page with existing shared primitives**

Use `AppLayout`, `DataToolbar`, `Pagination`, `LoadingBlock`/table loading, `EmptyState`, `DataNotice`, and shared toast/context behavior. Keep server ordering and pagination; do not client-sort or fetch the full history.

`markAllRead` updates only through the API. On success reload the current page and unread count; if the current page becomes empty after filtering, move to the last valid page through a fresh server request.

- [ ] **Step 5: Run page GREEN and frontend regression**

```powershell
node --test frontend/test/notificationInboxFrontend.test.js
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Expected: all frontend tests PASS, lint exits 0, build succeeds.

- [ ] **Step 6: Commit the page slice**

```powershell
git add frontend/src/component/auth/AuthenticatedRouteGuard.jsx frontend/src/page/notification/NotificationsPage.jsx frontend/src/App.jsx frontend/src/styles/app-shell.css frontend/test/notificationInboxFrontend.test.js
git commit -m "feat(fe10): add personal notifications page"
```

---

## Task 7: Prove Cross-Feature Fan-In And Three-Role Browser Behavior (FE10-I07)

**Files:**

- Modify: `backend/tests/membershipRoutes.test.js`
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/tests/reservationRoutes.test.js`
- Modify: `backend/tests/integration.test.js`
- Modify: `backend/tests/helpers/systemIntegrationHarness.js`
- Modify: `tests/e2e/support/systemTestServer.js`
- Create: `tests/e2e/fe10-notification-inbox.spec.js`
- Modify: `.sdd/specs/feat-notification-management/TEST_PLAN.md`

- [ ] **Step 1: Add RED cross-feature integration assertions**

For FE04 membership result, FE07 due reminder, and FE08 reservation-ready:

1. create the source event through the existing feature API/service;
2. assert exactly one FE10 record with recipient `userId` and existing email channel;
3. list the recipient inbox and assert the same `notificationId` appears once;
4. assert another user cannot list/read it;
5. assert delivery status/attempt count are unchanged by read mutations.

Do not introduce a second notification call or modify source-feature business outcomes.

- [ ] **Step 2: Run cross-feature RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js tests/borrowingRoutes.test.js tests/reservationRoutes.test.js tests/integration.test.js
```

Expected: new inbox fan-in assertions FAIL until the system harness exposes the implemented inbox repository/API state consistently.

- [ ] **Step 3: Complete only the bounded harness/integration wiring needed for GREEN**

Update shared in-memory dependencies rather than adding test-only product branches. If an existing FE04/FE07/FE08 caller omits `userId`, fix that caller with a focused RED assertion; otherwise leave production source flows unchanged.

- [ ] **Step 4: Add E2E setup controls and browser cases**

Extend `POST /__e2e__/setup` to return all three actor IDs when `adminEmail` is provided. Add a test-only control that seeds eligible, sensitive, userless, and cross-user rows directly into the shared in-memory notification repository; add a one-shot read-failure control to prove navigation remains available.

The Playwright spec must cover:

- MEMBER bell/count/preview/page/filter/mark-one/navigation;
- LIBRARIAN and ADMIN bell/page access;
- `99+` badge using 100 unread owned rows;
- sensitive/userless/cross-user absence;
- direct cross-user `PATCH` returns the same safe `404` as missing;
- mark-all and replay;
- read failure warning plus navigation to the allowlisted business page;
- 390x844 viewport has no horizontal overflow.

- [ ] **Step 5: Run integration and E2E GREEN**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js tests/borrowingRoutes.test.js tests/reservationRoutes.test.js tests/integration.test.js tests/notificationRoutes.test.js
npm.cmd exec -- playwright test tests/e2e/fe10-notification-inbox.spec.js --project=chromium
```

Expected: all selected backend tests PASS and FE10 Playwright cases PASS with no cross-user/sensitive leakage.

- [ ] **Step 6: Commit the integration/browser slice**

```powershell
git add backend/tests/membershipRoutes.test.js backend/tests/borrowingRoutes.test.js backend/tests/reservationRoutes.test.js backend/tests/integration.test.js backend/tests/helpers/systemIntegrationHarness.js tests/e2e/support/systemTestServer.js tests/e2e/fe10-notification-inbox.spec.js .sdd/specs/feat-notification-management/TEST_PLAN.md
git commit -m "test(fe10): verify inbox fan-in and role flows"
```

---

## Task 8: Complete Documentation, Full Gates, H2, And Azure Staging (FE10-I08)

**Files:**

- Modify: `docs/architecture/system-architecture.md`
- Modify: `docs/architecture/feature-integration-map.md`
- Modify: `docs/user-manual.md`
- Modify: `docs/testing/master-test-plan.md`
- Modify: `docs/deployment/azure-staging-guide.md`
- Modify: `.github/workflows/deploy-staging.yml`
- Modify: `tests/deployment/stagingWorkflowPolicy.test.js`
- Modify: `.sdd/specs/feat-notification-management/PLAN.md`
- Modify: `.sdd/specs/feat-notification-management/TASKS.md`
- Modify: `.sdd/specs/feat-notification-management/CONTEXT.md`
- Modify: `.sdd/specs/feat-notification-management/CHANGELOG.md`
- Modify: `.agents/CLAUDE.md`
- Create after verification: `.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-27.md`
- Create after staging/H3: `.sdd/reviews/fe10-notification-inbox-staging-h3-closeout-2026-07-27.md`

- [ ] **Step 1: Write RED deployment-policy assertions**

Require an explicit operator confirmation that the FE10 migration has already passed on staging, require `deploy-backend` to depend on preflight, and require `deploy-frontend` to depend on successful backend deployment. Preserve manual-only deployment and fail-closed smoke testing.

```js
assert.match(workflow, /fe10_inbox_migration_confirmed/);
assert.match(workflow, /deploy-backend:[\s\S]*needs: preflight/);
assert.match(workflow, /deploy-frontend:[\s\S]*needs: deploy-backend/);
```

- [ ] **Step 2: Run deployment RED**

```powershell
npm.cmd run test:deployment
```

Expected: the new ordering/confirmation test FAILS against the parallel deployment workflow.

- [ ] **Step 3: Update deployment ordering and operator guide**

Add a required boolean `workflow_dispatch` input `fe10_inbox_migration_confirmed`, a preflight job that fails when false, `deploy-backend.needs: preflight`, and `deploy-frontend.needs: deploy-backend`. Keep smoke depending on both deployed applications.

Document the exact staging order:

1. open a temporary exact-IP Azure SQL firewall rule;
2. apply `database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql` twice with `sqlcmd -b` using the approved operator identity;
3. query column/index/backfill/sensitive-exclusion postconditions;
4. remove the temporary firewall rule;
5. dispatch staging with migration confirmation true;
6. verify backend readiness/API before frontend/browser checks.

Never put server names, passwords, tokens, publish profiles, or connection strings in the repository or evidence file.

- [ ] **Step 4: Update architecture, integration map, user guidance, and active project memory**

Document:

- email record -> own inbox projection -> read state;
- FE04/FE07/FE08 fan-in and sensitive FE02/FE11 exclusion;
- four API operations and actor boundary;
- bell, preview, filters, pagination, mark-all, safe navigation, and error behavior;
- rollback keeps `ReadAt` and disables/removes only frontend/API use.
- FE10 `CONTEXT.md`, `.agents/CLAUDE.md`, and the master test plan distinguish
  the completed historical delivery baseline from the implemented v0.5.0 inbox
  and no longer describe the inbox as deferred or out of scope.

- [ ] **Step 5: Run the disposable SQL migration twice**

Use a named disposable local SQL database, seed one historical eligible row, one sensitive row, one userless row, and one future/new unread row between run 1 and run 2. Apply the migration twice. Assert:

- one `ReadAt` column;
- one named index;
- historical eligible row `ReadAt = CreatedAt`;
- sensitive and userless rows remain excluded;
- row inserted after run 1 remains unread after run 2;
- no notification count, delivery status, attempt, or idempotency change.

Record only non-sensitive aggregate evidence, then drop only the explicitly named disposable database.

- [ ] **Step 6: Run the full local verification matrix**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:deployment
npm.cmd run test:system
npm.cmd run trace:enforce
npm.cmd run test:traceability-state
npm.cmd exec -- playwright test --project=chromium
git diff --check origin/main...HEAD
git status --short
```

Expected: every command exits 0; traceability covers FR-FE10-001..016; no generated secret, build artifact, or unrelated user file is staged.

- [ ] **Step 7: Perform focused security and contradiction scans**

```powershell
rg -n "recipientEmail|safePayload|idempotencyKey|providerMessageId|lastErrorMessage|sourceFeature|sourceEntity" frontend/src backend/src/controllers/notificationController.js backend/src/docs/openapi.yaml
rg -n "ACCOUNT_VERIFICATION|PASSWORD_RESET|ACCOUNT_SETUP|EMAIL_VERIFY" backend/src/utils/notificationInbox.js backend/src/repositories/notificationRepository.js backend/tests/notificationRoutes.test.js
rg -n -i "delete notification|archive notification|global notification log|written review pending|draft v0\.5" .sdd/specs/feat-notification-management docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md
rg -n -i "inbox UI.*deferred|User notification inbox/list UI|Inbox UI out of Phase 1 scope unless spec changes" .sdd/specs/feat-notification-management/CONTEXT.md .agents/CLAUDE.md docs/testing/master-test-plan.md
```

Expected: forbidden DTO fields are absent from frontend/inbox response code; sensitive identifiers appear only in explicit exclusion tests/predicates; no stale v0.5 approval contradiction remains.

- [ ] **Step 8: Record evidence and request H2**

Update FE10 PLAN/TASKS/CHANGELOG and create the H2 validation record with exact commit, commands, pass counts, migration postconditions, security results, known limitations, and rollback. Do not claim staging or H3 before they occur.

Commit only after H2 approval:

```powershell
git add docs/architecture/system-architecture.md docs/architecture/feature-integration-map.md docs/user-manual.md docs/testing/master-test-plan.md docs/deployment/azure-staging-guide.md .github/workflows/deploy-staging.yml tests/deployment/stagingWorkflowPolicy.test.js .sdd/specs/feat-notification-management/PLAN.md .sdd/specs/feat-notification-management/TASKS.md .sdd/specs/feat-notification-management/CONTEXT.md .sdd/specs/feat-notification-management/CHANGELOG.md .agents/CLAUDE.md .sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-27.md
git commit -m "docs(fe10): close personal inbox h2 validation"
```

- [ ] **Step 9: Deploy and verify Azure staging in approved order**

After push/CI approval:

1. apply and verify the migration twice with no PII/secret output;
2. dispatch the manual workflow with confirmation true;
3. verify `/health`, `/health/ready`, and anonymous inbox `401`;
4. sign in as staging MEMBER, LIBRARIAN, and ADMIN and verify the bell/page;
5. verify two different users cannot access each other's notification ID;
6. verify sensitive rows never list/count/read;
7. verify read operations do not change queue/delivery aggregates;
8. verify the custom domain and API CORS origin used by the browser;
9. remove every temporary firewall rule created for the task.

- [ ] **Step 10: Run H3 against the exact deployed head and merge only on approval**

H3 must compare implementation against SPEC v0.5.0, review SQL ownership filters and migration repeatability, confirm action paths cannot be injected, inspect frontend failure behavior, and reconcile local/CI/staging evidence. Record the exact head SHA and run IDs in the closeout file. Merge only after H3 approval and exact-head CI success.

---

## Final Self-Review Checklist

- [ ] Every BR-FE10-014..020, FR-FE10-011..016, and AC-FE10-011..016 maps to at least one task and executable test.
- [ ] No `TBD`, `TODO`, `PLACEHOLDER`, invented endpoint, second channel/table, delete/archive, or global staff log appears in this plan.
- [ ] Method names, routes, field names, type/template pairs, status codes, and response shapes are consistent across SPEC, plan, backend, frontend, OpenAPI, and tests.
- [ ] Sensitive types and legacy `EMAIL_VERIFY` are fail-closed at list, count, and read boundaries.
- [ ] Migration repeatability does not backfill notifications created after the first migration run.
- [ ] Backend and migration precede frontend deployment; rollback is non-destructive.
- [ ] Completion is claimed only from fresh command output, browser evidence, Azure staging evidence, H2, and H3.
