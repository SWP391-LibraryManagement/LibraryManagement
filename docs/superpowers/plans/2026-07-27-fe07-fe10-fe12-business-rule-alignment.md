# FE07/FE10/FE12 Business-Rule Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to
> implement this plan task-by-task. Delegation is not authorized unless Nhat
> explicitly requests it. Use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align four active FE07, FE10, and FE12 Core contracts while proving
the unchanged FE08 handoffs and preserving every existing public route, schema,
role, and frontend workflow.

**Architecture:** Keep the current Express route-controller-service-repository
layers. FE07 uses the project-wide single-role authorization model and keeps
business-date calculations in the service, while its return repository exposes a transaction-locked internal
snapshot used by both audit and response construction. FE10 adds a separate
stored-definition gate before rendering. FE12 adds exact endpoint-key
middleware before existing value validators.

**Tech Stack:** Node.js, Express.js, express-validator, Jest, Supertest, SQL
Server through `mssql`, React/Vite, and Playwright.

## Global Constraints

- Source of truth: approved FE07 v0.7.6, FE10 v0.4.4, and FE12 v0.2.0 SPECs
  plus the approved design
  `docs/superpowers/specs/2026-07-27-fe07-fe10-fe12-business-rule-alignment-design.md`.
- Delivery order is SPEC -> PLAN/TASKS -> RED -> minimal code -> GREEN ->
  L1-L4/runtime evidence.
- No database schema, public route, role, notification type, report field,
  frontend workflow, dependency, or architecture change.
- FE08 is regression-only; a failing FE08 contract blocks completion and does
  not authorize an FE08 product change.
- Every production change carries the applicable existing `@spec` IDs.
- Keep all generated implementation changes uncommitted until the complete
  local diff and L1-L4 evidence receive H2 from Nhat.
- Do not commit the pending merge, push the reconciled head, update the draft
  PR, or merge during implementation or H2-addendum preparation.
- Run mutable SQL only when the configured `DB_NAME` is explicitly confirmed
  as a disposable local database and `FE07_SQL_TEST_ALLOW_MUTATION=true`.
- Staging checks are read-only. Never use real PII, credentials, tokens, OTPs,
  or mutable staging business data as evidence.
- A deterministic failure receives at most three total attempts. A suspected
  E2E flake may be rerun once with the first failure retained in evidence.

---

## File Map

| Responsibility | Files |
| --- | --- |
| FE07 single-role renewal and business-date policy | `backend/src/services/borrowingService.js` |
| FE07 authoritative return transaction | `backend/src/repositories/borrowingRepository.js` |
| FE07 in-memory transaction parity | `backend/tests/helpers/inMemoryBorrowingRepositories.js` |
| FE07 route and repository regressions | `backend/tests/borrowingRoutes.test.js`, `backend/tests/borrowingRepository.test.js` |
| Optional FE07 real SQL evidence | `backend/tests/sql/borrowingConcurrency.sqltest.js` |
| FE10 stored-definition gate | `backend/src/services/notificationService.js` |
| FE10 safety regressions | `backend/tests/notificationRoutes.test.js` |
| FE12 exact query-key boundary | `backend/src/validators/reportValidators.js` |
| FE12 boundary regressions | `backend/tests/reportRoutes.test.js` |
| FE08 unchanged handoff evidence | `backend/tests/reservationRoutes.test.js`, `backend/tests/systemIntegration.test.js` |
| Real browser/runtime evidence | `tests/e2e/system-golden-path.spec.js`, `tests/e2e/fe08-reservation-candidate-catalog.spec.js` |
| Final evidence record | `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md` |

---

### Task 1: Historical FE07 Multi-Role Renewal Attempt (Superseded)

**Task ID:** `FE07-T051` (superseded multi-role scenario; reconciled in Task 8)

This section records the original RED/GREEN evidence only. Nhat's later
single-role confirmation supersedes its actor premise. Do not retain the
multi-role test or its authorization delta in the integrated result.

**Files:**
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/src/services/borrowingService.js`

**Interfaces:**
- Consumes: `hasAnyRole(actor, allowedRoles)` and
  `renewBorrowDetail(borrowDetailIdInput, input, actor, context)`.
- Produces: role-order-independent staff scope; loan-owner eligibility remains
  unchanged.

- [x] **Step 1: Add the failing route regression**

Add this test inside `describe('FE07 borrowing management', ...)`:

```js
test('multi-role librarian renews another member loan while member-only remains owner-scoped', async () => {
  const { app, authDependencies, borrowingDependencies } = makeTestApp({
    clock: () => new Date('2026-03-07T12:00:00.000Z'),
  });
  const owner = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'renew-owner@example.test',
  });
  const memberOnly = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'renew-member-only@example.test',
  });
  const staff = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'renew-multi-role@example.test',
    role: 'LIBRARIAN',
    approveMember: false,
  });

  authDependencies.state.rolesByUserId.set(staff.userId, ['MEMBER', 'LIBRARIAN']);
  const multiRoleLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'renew-multi-role@example.test', password: 'Password1!' })
    .expect(200);

  const created = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(owner.accessToken))
    .send({ copyIds: [1, 2] })
    .expect(201);
  const approved = await request(app)
    .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
    .set('Authorization', authHeader(staff.accessToken))
    .send({})
    .expect(200);
  const [staffTarget, memberTarget] = approved.body.borrowRequest.details;

  const staffResponse = await request(app)
    .patch(`/api/borrow-details/${staffTarget.borrowDetailId}/renew`)
    .set('Authorization', authHeader(multiRoleLogin.body.accessToken))
    .send({});
  expect(staffResponse.status).toBe(200);
  expect(staffResponse.body.borrowDetail.renewalCount).toBe(1);

  const memberResponse = await request(app)
    .patch(`/api/borrow-details/${memberTarget.borrowDetailId}/renew`)
    .set('Authorization', authHeader(memberOnly.accessToken))
    .send({});
  expect(memberResponse.status).toBe(403);
  expect(memberResponse.body.error.code).toBe('BORROW_DETAIL_OWNER_REQUIRED');
});
```

- [x] **Step 2: Run RED**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js --testNamePattern "multi-role librarian renews"
```

Expected: FAIL because the staff request returns
`403 BORROW_DETAIL_OWNER_REQUIRED`.

- [x] **Step 3: Apply the minimal authorization change**

Replace the ownership/role block in `renewBorrowDetail` with:

```js
const isStaff = hasAnyRole(actor, ['LIBRARIAN', 'ADMIN']);
const isMember = hasAnyRole(actor, ['MEMBER']);

// @spec BR-FE07-003, FR-FE07-009
if (!isStaff && isMember && borrowDetail.userId !== actor.userId) {
  throw errors.forbidden(
    'BORROW_DETAIL_OWNER_REQUIRED',
    'Members can renew only their own borrowed items.'
  );
}

if (!isStaff && !isMember) {
  throw errors.forbidden('ROLE_REQUIRED', 'Your role cannot perform this action.');
}
```

Do not change `ensureEligibleMember(borrowDetail.userId)`,
`ensureNoBorrowingBlockers(borrowDetail.userId)`, renewal count, fine,
overdue, or reservation checks.

- [x] **Step 4: Run GREEN**

Run the command from Step 2.

Expected: PASS for both multi-role staff success and member-only denial.

- [x] **Step 5: Checkpoint without commit**

Inspect `git diff -- backend/src/services/borrowingService.js
backend/tests/borrowingRoutes.test.js`. Do not stage or commit.

---

### Task 2: FE07 Authoritative Return Snapshot

**Task ID:** `FE07-T048`

**Files:**
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/tests/borrowingRepository.test.js`
- Modify: `backend/src/services/borrowingService.js`
- Modify: `backend/src/repositories/borrowingRepository.js`
- Modify: `backend/tests/helpers/inMemoryBorrowingRepositories.js`
- Modify only when disposable SQL is confirmed:
  `backend/tests/sql/borrowingConcurrency.sqltest.js`

**Interfaces:**
- Consumes: the current
  `returnBorrowDetail({ borrowDetailId, detailStatus, copyStatus, returnDate,
  auditLogRepository, auditEntry })` contract.
- Produces: the same mapped detail plus an internal
  `authoritativeReturn` object containing `requestId`, `userId`, `copyId`,
  `dueDate`, `returnDate`, and `overdueDays`. The service strips this internal
  object before returning the public `borrowDetail`.

- [x] **Step 1: Add the stale-preflight RED regression**

Add a route test that sets an initial due date, changes it only when the
repository transaction starts, and checks response/audit parity:

```js
test('return response and audit use the due date locked by the repository', async () => {
  let currentTime = new Date('2026-06-01T00:00:00.000Z');
  const { app, authDependencies, borrowingDependencies } = makeTestApp({
    clock: () => currentTime,
  });
  const member = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'return-locked-owner@example.test',
  });
  const librarian = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'return-locked-librarian@example.test',
    role: 'LIBRARIAN',
    approveMember: false,
  });
  const created = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] })
    .expect(201);
  const approved = await request(app)
    .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
    .set('Authorization', authHeader(librarian.accessToken))
    .send({})
    .expect(200);
  const borrowDetailId = approved.body.borrowRequest.details[0].borrowDetailId;
  const storedDetail = borrowingDependencies.state.borrowDetails.find(
    (detail) => detail.borrowDetailId === borrowDetailId
  );
  storedDetail.dueDate = '2026-06-08';
  currentTime = new Date('2026-06-20T00:00:00.000Z');

  const originalReturn = borrowingDependencies.borrowingRepository.returnBorrowDetail;
  borrowingDependencies.borrowingRepository.returnBorrowDetail = async (input) => {
    storedDetail.dueDate = '2026-06-18';
    return originalReturn.call(borrowingDependencies.borrowingRepository, input);
  };

  const response = await request(app)
    .patch(`/api/borrow-details/${borrowDetailId}/return`)
    .set('Authorization', authHeader(librarian.accessToken))
    .send({ condition: 'NORMAL', returnDate: '2026-06-20' })
    .expect(200);

  expect(response.body.borrowDetail).not.toHaveProperty('authoritativeReturn');
  expect(response.body.fineCandidate.overdueDays).toBe(2);
  const audit = authDependencies.state.auditLogs.find(
    (entry) => entry.action === 'BORROW_DETAIL_RETURN'
  );
  expect(audit.metadata).toMatchObject({
    dueDate: '2026-06-18',
    returnDate: '2026-06-20',
    overdueDays: 2,
    condition: 'NORMAL',
  });
});
```

- [x] **Step 2: Add the repository source-contract RED assertions**

Extend the existing return lock-order test in
`backend/tests/borrowingRepository.test.js`:

```js
expect(source).toContain('bd.DueDate');
expect(source).toContain('br.UserId');
expect(source).toContain('INSERTED.ReturnDate');
expect(source).toContain('buildReturnEvidence(authoritativeReturn)');
expect(source.indexOf('buildReturnEvidence(authoritativeReturn)')).toBeGreaterThan(
  detailLockIndex
);
```

- [x] **Step 3: Run RED**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js --testNamePattern "due date locked|return serializes"
```

Expected: the route test reports stale `overdueDays = 12`, and the repository
source-contract assertions fail.

- [x] **Step 4: Extend the SQL repository contract**

In `backend/src/repositories/borrowingRepository.js`:

1. Accept optional `buildReturnEvidence` while retaining optional `auditEntry`
   for existing direct repository callers.
2. Lock `bd.DueDate` and `br.UserId` with the detail.
3. Add `INSERTED.ReturnDate` to the detail update output.
4. Build evidence after locked values and the committed return value exist,
   but before the audit write and transaction commit.
5. Return the mapped detail with internal `authoritativeReturn`.

Use this contract:

```js
async function returnBorrowDetail({
  borrowDetailId,
  detailStatus,
  copyStatus,
  returnDate,
  auditLogRepository,
  auditEntry,
  buildReturnEvidence,
}) {
  let authoritativeReturn = null;
  let returnEvidence = null;
  // Existing transaction setup and lock order remain unchanged.

  // The locked detail query includes bd.DueDate and br.UserId.
  // The UPDATE output includes INSERTED.RequestId, INSERTED.CopyId,
  // and INSERTED.ReturnDate.
  authoritativeReturn = {
    requestId: Number(lockedDetail.RequestId),
    userId: Number(lockedDetail.UserId),
    copyId: Number(lockedDetail.CopyId),
    dueDate: lockedDetail.DueDate,
    returnDate: detail.ReturnDate,
  };
  returnEvidence = typeof buildReturnEvidence === 'function'
    ? buildReturnEvidence(authoritativeReturn)
    : null;
  const resolvedAuditEntry = returnEvidence?.auditEntry || auditEntry;

  if (auditLogRepository && resolvedAuditEntry) {
    await auditLogRepository.create({ ...resolvedAuditEntry, transaction });
  }

  // Commit, then preserve the existing post-commit readback behavior.
  const returnedDetail = await findBorrowDetailById(borrowDetailId);
  return {
    ...returnedDetail,
    authoritativeReturn: {
      ...authoritativeReturn,
      overdueDays: returnEvidence?.overdueDays ?? null,
    },
  };
}
```

The real implementation must retain every existing rollback and conflict path;
the snippet defines only the changed contract and ordering.

- [x] **Step 5: Mirror the contract in the in-memory repository**

After the detail/copy are selected and before mutation, call the same
`buildReturnEvidence` callback with the current in-memory detail:

```js
const authoritativeReturn = {
  requestId: detail.requestId,
  userId: detail.userId,
  copyId: detail.copyId,
  dueDate: detail.dueDate,
  returnDate,
};
const returnEvidence = typeof buildReturnEvidence === 'function'
  ? buildReturnEvidence(authoritativeReturn)
  : null;
const resolvedAuditEntry = returnEvidence?.auditEntry || auditEntry;
```

Use `resolvedAuditEntry` for the transactional audit and return:

```js
return {
  ...mapDetail(detail),
  authoritativeReturn: {
    ...authoritativeReturn,
    overdueDays: returnEvidence?.overdueDays ?? null,
  },
};
```

- [x] **Step 6: Build response and audit from one service callback**

In `backend/src/services/borrowingService.js`, remove the preflight
`overdueDays` and prebuilt return audit. Pass:

```js
buildReturnEvidence: ({ requestId, userId, copyId, dueDate, returnDate: committedReturnDate }) => {
  const overdueDays = overdueDaysBetween(dueDate, committedReturnDate);
  return {
    overdueDays,
    auditEntry: buildAuditEntry(context, 'BORROW_DETAIL_RETURN', {
      userId: actor.userId,
      targetType: 'BORROW_DETAIL',
      targetId: borrowDetailId,
      metadata: {
        requestId,
        memberId: userId,
        copyId,
        dueDate: formatBusinessDate(dueDate),
        returnDate: formatBusinessDate(committedReturnDate),
        condition: input.condition,
        overdueDays,
        notes: input.notes || null,
      },
    }),
  };
},
```

After conflict handling, strip the internal object:

```js
const { authoritativeReturn, ...publicBorrowDetail } = returnedDetail;
const overdueDays = authoritativeReturn.overdueDays;

return {
  borrowDetail: publicBorrowDetail,
  fineCandidate: {
    userId: authoritativeReturn.userId,
    borrowDetailId,
    copyId: authoritativeReturn.copyId,
    condition: input.condition,
    overdueDays,
    needsFineReview:
      overdueDays > 0 || input.condition === 'DAMAGED' || input.condition === 'LOST',
  },
};
```

- [x] **Step 7: Run GREEN**

Run the command from Step 3, then:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
```

Expected: both suites pass; public response has no internal evidence field;
audit and `fineCandidate` use the locked due date.

- [ ] **Step 8: Optional real SQL evidence**

Not run: `DB_NAME` and `FE07_SQL_TEST_ALLOW_MUTATION` were both unset, so no
mutable SQL command was authorized.

First print only the database name and confirm it is disposable local data:

```powershell
Write-Output $env:DB_NAME
Write-Output $env:FE07_SQL_TEST_ALLOW_MUTATION
```

Run the SQL suite only when the name is explicitly disposable and the mutation
flag is `true`:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/sql/borrowingConcurrency.sqltest.js --testNamePattern "return"
```

Expected: return concurrency, locked snapshot, and audit rollback tests pass.
Otherwise record SQL evidence as not run; do not point the test at staging or a
shared database.

- [x] **Step 9: Checkpoint without commit**

Inspect the five-file FE07 diff. Do not stage or commit.

---

### Task 3: FE07 Shared Renewal Calendar Arithmetic

**Task ID:** `FE07-T049`

**Files:**
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/src/services/borrowingService.js`
- Modify: `backend/src/repositories/borrowingRepository.js`
- Modify: `backend/tests/helpers/inMemoryBorrowingRepositories.js`

**Interfaces:**
- Consumes: `formatBusinessDate`, `addBusinessDays`, and
  `compareBusinessDates` from `backend/src/utils/libraryBusinessTime.js`.
- Produces: an exact `YYYY-MM-DD` `newDueDate` independent of host timezone.

- [x] **Step 1: Add the timezone-sensitive RED regression**

```js
test('renewal extends the business due date identically across host timezones', async () => {
  const { app, authDependencies, borrowingDependencies } = makeTestApp({
    clock: () => new Date('2026-03-07T12:00:00.000Z'),
  });
  const member = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'renew-business-date@example.test',
  });
  const librarian = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: 'renew-business-date-staff@example.test',
    role: 'LIBRARIAN',
    approveMember: false,
  });
  const created = await request(app)
    .post('/api/borrow-requests')
    .set('Authorization', authHeader(member.accessToken))
    .send({ copyIds: [1] })
    .expect(201);
  const approved = await request(app)
    .patch(`/api/borrow-requests/${created.body.borrowRequest.requestId}/approve`)
    .set('Authorization', authHeader(librarian.accessToken))
    .send({})
    .expect(200);
  const borrowDetailId = approved.body.borrowRequest.details[0].borrowDetailId;
  borrowingDependencies.state.borrowDetails.find(
    (detail) => detail.borrowDetailId === borrowDetailId
  ).dueDate = '2026-03-08';

  const response = await request(app)
    .patch(`/api/borrow-details/${borrowDetailId}/renew`)
    .set('Authorization', authHeader(member.accessToken))
    .send({})
    .expect(200);

  expect(response.body.borrowDetail.dueDate).toBe('2026-03-22');
});
```

- [x] **Step 2: Run the RED timezone matrix**

```powershell
$env:TZ='UTC'
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js --testNamePattern "business due date identically"
$env:TZ='America/New_York'
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js --testNamePattern "business due date identically"
Remove-Item Env:TZ -ErrorAction SilentlyContinue
```

Expected: the current host-local implementation fails in at least
`America/New_York`.

- [x] **Step 3: Remove host-local service arithmetic**

Delete the local `addDays()` helper and replace renewal extension with:

```js
// @spec BR-FE07-015, FR-FE07-009, NFR-FE07-TIME-001
const currentDueDate = formatBusinessDate(borrowDetail.dueDate);
const newDueDate = addBusinessDays(currentDueDate, LOAN_DAYS);
```

- [x] **Step 4: Use shared comparison helpers in repository parity**

Import `formatBusinessDate` and `compareBusinessDates` in the SQL repository
and in-memory helper. Replace affected renewal comparisons with:

```js
compareBusinessDates(formatBusinessDate(detail.DueDate), String(today)) < 0
```

and:

```js
compareBusinessDates(formatBusinessDate(item.dueDate), String(today)) < 0
```

Use the same comparison in the in-memory `hasOverdueActiveLoans` method so the
service preflight and authoritative in-memory transaction agree. Do not alter
the SQL `bd.DueDate < @Today` predicate because SQL Server already compares
typed `date` values.

- [x] **Step 5: Run GREEN in both timezones**

Repeat Step 2.

Expected: both timezone runs pass with due date `2026-03-22`.

- [x] **Step 6: Run the focused FE07 suites**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
```

Expected: PASS with no renewal, return, audit, or reservation regression.

- [x] **Step 7: Checkpoint without commit**

Search the affected renewal path:

```powershell
rg -n "setDate|getDate|setHours" backend/src/services/borrowingService.js backend/src/repositories/borrowingRepository.js backend/tests/helpers/inMemoryBorrowingRepositories.js
```

Expected: no host-local calendar arithmetic remains in the affected renewal
logic. Do not stage or commit.

---

### Task 4: FE10 Fail-Closed Stored Template Definitions

**Task ID:** `FE10-S11`

**Files:**
- Modify: `backend/tests/notificationRoutes.test.js`
- Modify: `backend/src/services/notificationService.js`

**Interfaces:**
- Consumes: template `{ subject, body }` returned by
  `notificationRepository.findTemplateByCode(templateKey)`.
- Produces:
  `validateStoredTemplateDefinition(template): void`, throwing safe
  `400 UNSAFE_TEMPLATE_DEFINITION` before rendering or side effects.

- [x] **Step 1: Add table-driven RED tests**

```js
test.each([
  ['subject', '<script>alert(1)</script>Verify'],
  ['body', 'Click onclick=alert(1) to continue'],
  ['body', 'Open javascript:alert(1)'],
])('rejects unsafe stored template %s before persistence or delivery', async (field, value) => {
  const {
    notificationService,
    notificationDependencies,
    emailProviderMessages,
  } = makeTestApp();
  const template = notificationDependencies.state.templates.find(
    (item) => item.templateCode === 'ACCOUNT_VERIFICATION'
  );
  template[field] = value;

  await expect(
    notificationService
      .createSourceNotificationRequester('FE02')
      .createNotificationRequest(
        makeSensitiveRequestInput({
          type: 'ACCOUNT_VERIFICATION',
          recipientEmail: 'unsafe-template@example.test',
          templateData: { otp: '123456', expiresInMinutes: 15 },
          sourceEntityId: 901,
        })
      )
  ).rejects.toMatchObject({
    statusCode: 400,
    code: 'UNSAFE_TEMPLATE_DEFINITION',
  });

  expect(notificationDependencies.state.notifications).toEqual([]);
  expect(notificationDependencies.state.attempts).toEqual([]);
  expect(emailProviderMessages).toEqual([]);
});
```

- [x] **Step 2: Run RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js --testNamePattern "unsafe stored template"
```

Expected: requests are accepted/rendered instead of rejecting with
`UNSAFE_TEMPLATE_DEFINITION`.

- [x] **Step 3: Add the stored-definition gate**

Add near `renderTemplate()`:

```js
function containsUnsafeTemplateDefinition(value) {
  const definition = String(value ?? '');
  return /<\/?[a-z][^>]*>/i.test(definition)
    || /\bon[a-z]+\s*=/i.test(definition)
    || /\bjavascript\s*:/i.test(definition);
}

function validateStoredTemplateDefinition(template) {
  if (
    containsUnsafeTemplateDefinition(template?.subject)
    || containsUnsafeTemplateDefinition(template?.body)
  ) {
    throw errors.badRequest(
      'UNSAFE_TEMPLATE_DEFINITION',
      'Notification template definition is unsafe.'
    );
  }
}
```

Call it immediately after active-template lookup and before recipient
resolution, template-data validation, rendering, persistence, or provider I/O:

```js
validateStoredTemplateDefinition(template);
const recipient = await resolveRecipient(requestInput);
```

Keep `sanitizeString`, `sanitizePayload`, and `renderTemplate` unchanged so
runtime values remain escaped/sanitized.

- [x] **Step 4: Run GREEN plus runtime-value preservation**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js --testNamePattern "unsafe stored template|sanitizes script content in template data"
```

Expected: unsafe stored definitions reject with zero side effects; the existing
runtime-value sanitization test still passes.

- [x] **Step 5: Run the full FE10 route suite**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js
```

Expected: PASS with source ownership, secret redaction, idempotency,
`PROCESSING`, retry, and DTO contracts unchanged.

- [x] **Step 6: Checkpoint without commit**

Inspect the two-file diff and verify no template content or secret value appears
in errors. Do not stage or commit.

---

### Task 5: FE12 Exact Endpoint Query Allowlists

**Task ID:** `FE12-N11`

**Files:**
- Modify: `backend/tests/reportRoutes.test.js`
- Modify: `backend/src/validators/reportValidators.js`

**Interfaces:**
- Produces:
  `rejectUnsupportedQueryParameters(allowedKeys): ExpressMiddleware`.
- The middleware calls `next()` for exact allowed keys and otherwise calls
  `next(errors.badRequest('UNSUPPORTED_REPORT_QUERY_PARAMETER', ...))`.

- [x] **Step 1: Add the route-level RED matrix**

```js
test.each([
  ['/api/reports/borrowing', 'getBorrowingReport'],
  ['/api/reports/inventory', 'getInventoryReport'],
  ['/api/reports/users', 'getUserStatistics'],
])('rejects unsupported query keys before %s executes', async (path, repositoryMethod) => {
  const { app, authDependencies, borrowingDependencies, reportDependencies } =
    makeTestApp();
  const admin = await createVerifiedUser({
    app,
    authDependencies,
    borrowingDependencies,
    email: `report-allowlist-${repositoryMethod}@example.test`,
    role: 'ADMIN',
    approveMember: false,
  });
  const spies = [
    jest.spyOn(reportDependencies.reportRepository, 'getBorrowingReport'),
    jest.spyOn(reportDependencies.reportRepository, 'getInventoryReport'),
    jest.spyOn(reportDependencies.reportRepository, 'getUserStatistics'),
  ];

  const response = await request(app)
    .get(`${path}?bogus=runtime-secret-value`)
    .set('Authorization', authHeader(admin.accessToken));

  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('UNSUPPORTED_REPORT_QUERY_PARAMETER');
  expect(JSON.stringify(response.body)).not.toContain('runtime-secret-value');
  for (const spy of spies) {
    expect(spy).not.toHaveBeenCalled();
  }
});
```

- [x] **Step 2: Run RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reportRoutes.test.js --testNamePattern "unsupported query keys"
```

Expected: all three requests return `200` and invoke a report repository method.

- [x] **Step 3: Add the reusable exact-key middleware**

Import safe errors and define exact allowlists:

```js
const errors = require('../utils/safeErrors');

const borrowingReportQueryKeys = [
  'q', 'fromDate', 'toDate', 'status', 'bookId', 'userId', 'page', 'limit',
];
const inventoryReportQueryKeys = [
  'q', 'categoryId', 'bookId', 'status', 'location', 'page', 'limit',
];
const userStatisticsQueryKeys = [
  'q', 'roleId', 'status', 'membershipStatus', 'fromDate', 'toDate', 'page', 'limit',
];

function rejectUnsupportedQueryParameters(allowedKeys) {
  const allowed = new Set(allowedKeys);
  return function validateReportQueryKeys(req, res, next) {
    const unsupportedKey = Object.keys(req.query || {}).find((key) => !allowed.has(key));
    if (!unsupportedKey) {
      return next();
    }
    return next(
      errors.badRequest(
        'UNSUPPORTED_REPORT_QUERY_PARAMETER',
        'Report query parameter is not supported.'
      )
    );
  };
}
```

Place the matching middleware first in each validator array:

```js
const borrowingReportValidators = [
  rejectUnsupportedQueryParameters(borrowingReportQueryKeys),
  searchValidator,
  // Existing validators remain unchanged.
];
```

Repeat for inventory and users. Export the factory and key arrays only if a
focused unit test needs them; route behavior is the primary contract.

- [x] **Step 4: Run GREEN**

Repeat Step 2.

Expected: all endpoints return safe `400`, do not echo the value, and all three
repository spies remain untouched.

- [x] **Step 5: Run approved-key preservation tests**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reportRoutes.test.js
```

Expected: existing filters, empty IDs, date-only validation, role guards,
audit privacy, pagination, and all report responses remain green.

- [x] **Step 6: Checkpoint without commit**

Inspect the two-file diff. Confirm the unknown-key middleware is first in all
three validator arrays. Do not stage or commit.

---

### Task 6: FE08 Regression-Only Handoff Verification

**Task ID:** `FE08-T042`

**Files:**
- No FE08 production file changes.
- Verify: `backend/tests/reservationRoutes.test.js`
- Verify: `backend/tests/systemIntegration.test.js`

**Interfaces:**
- FE08 -> FE10:
  `RESERVATION_AVAILABLE -> RESERVATION_READY` through the construction-bound
  FE08 requester.
- FE08 -> FE07: active reservation priority blocks another member's renewal
  without changing the loan.

- [x] **Step 1: Run the canonical requester regression**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/reservationRoutes.test.js --testNamePattern "binds FE08 and submits the canonical reservation-ready notification request"
```

Expected: PASS with one FE08-bound requester and canonical source metadata.

- [x] **Step 2: Run cross-feature SIT-003 and SIT-004**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/systemIntegration.test.js --testNamePattern "SIT-003|SIT-004"
```

Expected: queue hold creates one FE10 request, and reservation priority blocks
FE07 renewal without mutation.

- [x] **Step 3: Stop on any FE08 failure**

Do not modify FE08. Diagnose and return to SPEC review if the failure requires
a product-rule change.

---

### Task 7: Cross-Feature Validation And Real Runtime Evidence

**Task IDs:** `FE07-T050`, `FE08-T042`, `FE10-S11`, `FE12-N11`

**Files:**
- Modify: `tests/e2e/system-golden-path.spec.js`
- Create after all commands run:
  `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
- Update task checkboxes/evidence only after observed results exist.

**Interfaces:**
- Produces the H2 review package: complete uncommitted diff, L1-L4 results,
  runtime evidence, gaps, and residual risks.

- [x] **Step 1: Run the focused L1 gate**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js tests/notificationRoutes.test.js tests/reportRoutes.test.js tests/reservationRoutes.test.js tests/systemIntegration.test.js
```

Expected: all six suites pass.

- [x] **Step 2: Run the timezone matrix**

```powershell
$env:TZ='UTC'
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js --testNamePattern "business due date identically|due date locked|single-role librarian renews"
$env:TZ='America/New_York'
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js --testNamePattern "business due date identically|due date locked|single-role librarian renews"
Remove-Item Env:TZ -ErrorAction SilentlyContinue
```

Expected: both runs pass with identical business dates and outcomes.

- [x] **Step 3: Run full automated quality checks**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:traceability-state
npm.cmd run trace:enforce
git diff --check
```

Expected: all commands exit 0; backend coverage remains above the repository's
80% global thresholds; FE07, FE08, FE10, and FE12 traceability remains enforced.

- [x] **Step 4: Run real browser/runtime acceptance**

```powershell
npx.cmd playwright test tests/e2e/system-golden-path.spec.js tests/e2e/fe08-reservation-candidate-catalog.spec.js --project=chromium
```

Expected: both Playwright scenarios pass against actual local HTTP servers.
The golden path proves login -> borrow -> approve -> return -> fine -> report;
the FE08 scenario proves candidate search and a real reservation request. Keep
failure traces/screenshots; do not promote them as passing evidence.

- [x] **Step 5: Verify FE12 through the running HTTP boundary**

During the Playwright runtime, use the authenticated Admin/Librarian request
context already created by the test and assert:

```js
const response = await request.get(
  `${BACKEND_URL}/api/reports/borrowing?bogus=runtime-secret-value`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
expect(response.status()).toBe(400);
const payload = await response.json();
expect(payload).toMatchObject({
  error: { code: 'UNSUPPORTED_REPORT_QUERY_PARAMETER' },
});
expect(JSON.stringify(payload)).not.toContain('runtime-secret-value');
```

Add this assertion to `tests/e2e/system-golden-path.spec.js` after the existing
`accessToken` is read. This is test-only runtime evidence and does not change a
frontend workflow.

- [x] **Step 6: Perform L2 and L3 review**

Check:

```text
L2 Spec:
- BD-007/AT-001 -> FE07-T051 -> single-role reconciliation -> existing role guards
- BD-002/AT-002 -> FE07-T048 -> route/repository RED/GREEN -> locked evidence
- BD-003/AT-003 -> FE07-T049 -> two-timezone RED/GREEN -> shared helpers
- BD-004/AT-004 -> FE10-S11 -> zero-side-effect security regression
- BD-005/AT-005 -> FE12-N11 -> all three endpoints and zero repository calls
- BD-006/AT-006 -> FE08-T042 -> requester plus SIT-003/SIT-004

L3 Constitution/Safety:
- server-side authorization remains role-order independent
- unsafe stored definitions fail closed
- unknown query values are never echoed
- no secret, schema, dependency, public API, or architecture expansion
- return audit remains in the transaction
```

Any gap returns to the owning task; do not weaken the SPEC.

- [x] **Step 7: Record observed evidence**

Create
`.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
with:

1. exact branch and pre-H2 commit;
2. changed-file list;
3. RED command and observed failure for AT-001 through AT-005;
4. GREEN/focused/full/coverage/timezone/traceability command outputs;
5. SQL database name and disposable confirmation, or an explicit "not run"
   statement with no SQL claim;
6. Playwright runtime command and observed scenarios;
7. L2 traceability matrix and L3 safety review;
8. residual risks and the explicit statement that implementation remains
   uncommitted pending H2.

Do not write PASS for an unrun command.

- [x] **Step 8: Prepare H2; do not commit**

Run:

```powershell
git status --short
git diff --stat
git diff --check
```

Present the complete uncommitted diff and evidence to Nhat. Only an explicit H2
approval authorizes staging, committing, pushing, or PR publication.

---

### Task 8: Reconcile The Single-Role Main Contract

**Task ID:** `FE07-T051`

**Files:**
- Modify: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Modify: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Modify: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Modify: `.sdd/specs/feat-reservation-management/PLAN.md`
- Modify: `.sdd/specs/feat-reservation-management/TASKS.md`
- Modify: `docs/superpowers/specs/2026-07-27-fe07-fe10-fe12-business-rule-alignment-design.md`
- Modify: `docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`
- Modify: `backend/tests/borrowingRoutes.test.js`
- Modify: `backend/src/services/borrowingService.js`

**Interfaces:**
- Consumes: `DEC-GEN-005`, `requireMemberOnly`, and the existing
  `renewBorrowDetail()` actor contract.
- Produces: one supported account role per actor; Member owner-only renewal;
  Librarian/Admin cross-member renewal; no multi-role business case.

- [x] **Step 1: Reconcile the written contracts**

Preserve `FE07-T047` and `FE08-T041` from `main`. Record this cleanup as
`FE07-T051` and renumber the regression-only FE08 task to `FE08-T042`.
Classify original BD-001 as superseded and record the approved single-role
decision as BD-007.

- [x] **Step 2: Replace the obsolete route test**

Change the branch-local multi-role renewal test so it uses a normal
single-role `LIBRARIAN` for cross-member renewal and a separate single-role
`MEMBER` for the owner denial. Do not mutate `rolesByUserId` to contain two
roles and do not log in a multi-role account.

- [x] **Step 3: Verify the single-role baseline before cleanup**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/userRoleRepository.test.js --testNamePattern "single-role librarian renews|exactly one role|repairs legacy multiple mappings"
```

Expected: the single-role role boundary and database repair/invariant cases
pass. This is a green reconciliation baseline, not a new RED behavior claim.

- [x] **Step 4: Remove the superseded authorization delta**

Restore the simple one-role renewal authorization shape:

```js
if (hasAnyRole(actor, ['MEMBER']) && borrowDetail.userId !== actor.userId) {
  throw errors.forbidden(
    'BORROW_DETAIL_OWNER_REQUIRED',
    'Members can renew only their own borrowed items.'
  );
}

if (!hasAnyRole(actor, ['MEMBER', 'LIBRARIAN', 'ADMIN'])) {
  throw errors.forbidden('ROLE_REQUIRED', 'Your role cannot perform this action.');
}
```

Do not alter loan-owner eligibility, fines, overdue, reservation, renewal
count, business-date, notification, or audit behavior.

- [x] **Step 5: Verify after cleanup**

Repeat Step 3, then run the focused FE07 route/repository suites. Expected:
all selected tests pass with no multi-role account setup remaining in the
rule-alignment test.

- [x] **Step 6: Continue the full Task 7 verification**

Run the full backend/frontend/traceability/runtime gates against the merged
result and update the validation record. Keep the merge uncommitted until Nhat
approves the H2 addendum.

---

## Plan Approval Gate

- [x] Nhat approves the original consolidated plan and FE07-T048..T051, FE08-T042,
  FE10-S11, and FE12-N11.
- [x] Only after approval, begin Task 1 with RED tests.
- [x] Do not infer plan approval from the earlier SPEC approval.
- [x] Nhat confirms one account has exactly one role and authorizes Task 8
  reconciliation on 2026-07-27.
