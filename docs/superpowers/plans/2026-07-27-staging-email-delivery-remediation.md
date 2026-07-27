# Staging Email Delivery Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore FE11 account-setup email delivery, persist safe SMTP message
IDs for sensitive sends, and drain non-sensitive pending notifications through
an opt-in in-process worker on Azure staging.

**Architecture:** Keep FE10 as the single delivery owner. Add one idempotent
data migration, preserve the existing provider result in the sensitive terminal
transition, split the queued-delivery loop behind human and system wrappers,
then run it through a small lifecycle-managed worker. The existing protected
manual endpoint and all public DTOs remain unchanged.

**Tech Stack:** Node.js 22, CommonJS, Express 5, Jest 30, SQL Server T-SQL,
Azure App Service F1, Nodemailer SMTP.

## Global Constraints

- Implementation baseline is `origin/main` at
  `ca69dc87badf4d1056c0a63d97e5e411fb4cbd68`.
- Work only in
  `D:\SWP391\library-management-system\.worktrees\fix-staging-email-delivery`
  on branch `codex/fix-staging-email-delivery`.
- Follow RED -> GREEN -> REFACTOR for every production change.
- Keep AI-generated implementation changes uncommitted until the complete local
  diff and L1-L4 evidence receive H2 human approval.
- Do not push, publish a PR, merge, or change the Azure plan without the
  corresponding project gate.
- `ACCOUNT_SETUP` remains synchronous, FE11-owned, and provider-memory-only.
- `FAILED` notifications remain manual-retry only.
- The worker may claim only non-sensitive `PENDING` rows.
- SYSTEM is an internal actor, never a fabricated login role.
- Worker defaults are disabled, 60,000 ms, and batch size 20.
- The F1 worker is best-effort while the backend is awake; do not claim
  guaranteed scheduling.
- Persist only `providerMessageId`, never a full provider response.
- Never print or commit SMTP credentials, connection strings, recipient PII,
  OTPs, tokens, setup links, or rendered sensitive content.
- Preserve the direct Express app export from `backend/src/index.js`.
- Do not add dependencies, routes, public response fields, notification types,
  or database schema objects.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `.sdd/specs/feat-notification-management/SPEC.md` | Record the approved v0.4.5 worker and delivery-evidence contract. |
| `.sdd/specs/feat-notification-management/PLAN.md` | Add the ordered remediation plan and gate boundary. |
| `.sdd/specs/feat-notification-management/TASKS.md` | Activate FE10-S12 through FE10-S16 with test and evidence ownership. |
| `.sdd/specs/feat-notification-management/CHANGELOG.md` | Record the approved remediation contract without claiming implementation. |
| `database/migrations/2026-07-27-fe10-account-setup-template.sql` | Idempotently upsert the canonical active `ACCOUNT_SETUP` template. |
| `backend/src/services/notificationService.js` | Preserve sensitive provider IDs and expose a construction-bound system queue processor. |
| `backend/src/services/notificationWorker.js` | Own worker enablement, scheduling, overlap protection, safe failure handling, and stop behavior. |
| `backend/src/serverRuntime.js` | Couple HTTP server start/stop signals to the worker lifecycle without changing the Express export. |
| `backend/src/config/env.js` | Parse and validate worker settings. |
| `backend/src/index.js` | Compose the default worker/runtime and retain `module.exports = app`. |
| `backend/.env.example` | Document non-secret worker defaults. |
| `backend/tests/notificationRepository.test.js` | Verify migration shape and canonical baseline synchronization. |
| `backend/tests/notificationRoutes.test.js` | Prove provider ID persistence, system processing, safe audit identity, and unchanged HTTP authorization. |
| `backend/tests/notificationWorker.test.js` | Prove disabled/enabled, startup, interval, overlap, failure recovery, and stop behavior. |
| `backend/tests/serverRuntime.test.js` | Prove the worker starts after listen and stops on SIGTERM/SIGINT. |
| `backend/tests/envConfig.test.js` | Prove worker defaults and positive-integer validation. |
| `.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md` | Record local RED/GREEN, full-suite, staging migration, deployment, and safe runtime evidence. |

---

### Task 1: Activate The Approved FE10 Remediation Contract

**Files:**

- Modify: `.sdd/specs/feat-notification-management/SPEC.md:1-35,70-190,430-475`
- Modify: `.sdd/specs/feat-notification-management/PLAN.md:1-20,260-end`
- Modify: `.sdd/specs/feat-notification-management/TASKS.md:1-20,296-end`
- Modify: `.sdd/specs/feat-notification-management/CHANGELOG.md:1`

**Interfaces:**

- Consumes: approved design
  `docs/superpowers/specs/2026-07-27-staging-email-delivery-remediation-design.md`.
- Produces: SPEC v0.4.5 and task IDs `FE10-S12` through `FE10-S16`.

- [ ] **Step 1: Update the SPEC header and approved decision**

Set the header to:

```markdown
# Version: 0.4.5

# Status: APPROVED - STAGING EMAIL DELIVERY REMEDIATION 2026-07-27
```

Append this current-revision note before the first horizontal rule:

```markdown
> Revision v0.4.5 restores three previously approved delivery obligations:
> existing databases receive the canonical `ACCOUNT_SETUP` template through an
> idempotent migration; successful sensitive sends retain only the provider
> message ID in attempt history; and an opt-in SYSTEM worker processes queued
> non-sensitive `PENDING` records while the backend is awake. The protected
> manual endpoint and manual-only retry policy remain unchanged. On the staging
> F1 plan this schedule is explicitly best-effort because Always On is disabled.
> The user approved the design and written contract on 2026-07-27.
```

Add this approved decision after the existing `Q-FE10-012`:

```markdown
| Q-FE10-013 | Staging uses an opt-in in-process SYSTEM worker with a 60-second default interval and batch size 20. It runs once after startup, prevents overlapping local passes, processes only non-sensitive `PENDING` rows, and stops with the HTTP server. The existing staff endpoint remains protected and `FAILED` retry remains manual. F1 sleep pauses the worker. | User approval and written design 2026-07-27 | APPROVED |
```

Extend the relevant delivery/attempt text with:

```markdown
- A successful provider result persists only its normalized
  `providerMessageId` in `NotificationAttempts`; no full provider response,
  rendered sensitive content, token, OTP, setup link, or recipient content is
  copied into audit, logs, HTTP, or notification content.
- Automatic SYSTEM processing is construction-bound and writes aggregate audit
  metadata with `UserId = NULL`; it never fabricates an Admin or Librarian.
```

- [ ] **Step 2: Add PLAN section 14**

Append:

```markdown
## 14. V0.4.5 Staging Email Delivery Remediation

Approved design:
`docs/superpowers/specs/2026-07-27-staging-email-delivery-remediation-design.md`.

1. Add and verify an idempotent migration for the canonical active
   `ACCOUNT_SETUP` template; do not rebuild or delete the existing database.
2. Capture the sensitive provider result and persist only
   `providerMessageId` through the existing guarded `markSent` transaction.
3. Extract the existing queued-delivery loop behind a common private core.
   Preserve the staff-authorized wrapper and add a construction-bound SYSTEM
   wrapper with null-user aggregate audit metadata.
4. Add an opt-in worker with an immediate startup pass, 60-second default
   interval, batch size 20, overlap guard, safe error code, and stop behavior.
5. Wire the worker to the backend HTTP lifecycle without changing the direct
   Express app export or starting timers on module import.
6. Keep generated implementation uncommitted until focused/full validation,
   secret scans, staging-safe checks, and H2 review pass.
```

- [ ] **Step 3: Add TASKS section 14**

Append:

```markdown
## 14. Staging Email Delivery Remediation

### FE10-S12 Activate The Approved Remediation Contract

- [x] Status: DESIGN AND WRITTEN CONTRACT APPROVED 2026-07-27
- Files: approved design and FE10 SPEC/PLAN/TASKS/CHANGELOG.
- DoD: v0.4.5 records the migration, safe provider-ID evidence, SYSTEM worker,
  best-effort F1 limitation, unchanged HTTP authorization, and manual retry.

### FE10-S13 Restore The Existing-Database Account Setup Template

- [ ] Status: NOT STARTED
- Depends on: FE10-S12.
- Files: `database/migrations/2026-07-27-fe10-account-setup-template.sql`,
  `backend/tests/notificationRepository.test.js`.
- DoD: migration is transactional, idempotent, additive, canonical, and passes
  two executions with exactly one active `ACCOUNT_SETUP` row.

### FE10-S14 Preserve Sensitive Provider Message IDs

- [ ] Status: NOT STARTED
- Depends on: FE10-S12.
- Files: `backend/src/services/notificationService.js`,
  `backend/tests/notificationRoutes.test.js`.
- DoD: FE02 and FE11 sensitive success attempts store only the adapter message
  ID while persistence, audit, logs, and responses remain credential-free.

### FE10-S15 Add The Best-Effort SYSTEM Worker

- [ ] Status: NOT STARTED
- Depends on: FE10-S12.
- Files: notification service/worker/runtime/config/index, `.env.example`, and
  focused service/worker/runtime/config tests.
- DoD: enabled startup and interval passes are non-overlapping; disabled mode
  has no timer; safe failures recover; stop clears scheduling; only
  non-sensitive `PENDING` rows are processed; manual HTTP authorization is
  unchanged.

### FE10-S16 Pass Local H2 And Staging Validation

- [ ] Status: NOT STARTED
- Depends on: FE10-S13..S15.
- Files: FE10 TASKS/CHANGELOG and
  `.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md`.
- DoD: focused and full test gates pass; migration passes twice; diff/security
  review passes; H2 approves commits; staging template/worker settings/deploy
  and safe queue/provider-attempt evidence are recorded without secrets or PII.
```

- [ ] **Step 4: Add the CHANGELOG entry**

Prepend:

```markdown
## 2026-07-27 - Approve staging email delivery remediation (v0.4.5)

- Required an idempotent existing-database upsert for the canonical active
  `ACCOUNT_SETUP` template.
- Required successful sensitive sends to retain only the SMTP provider message
  ID in attempt history.
- Approved an opt-in, lifecycle-managed SYSTEM worker for non-sensitive
  `PENDING` rows with defaults of 60 seconds and 20 rows.
- Preserved protected manual processing, manual-only failed retry, sensitive
  synchronous delivery, minimal DTOs, and provider-memory-only credentials.
- Recorded that Azure App Service F1 pauses the worker while the app sleeps.
- User approved the design and written contract on 2026-07-27; implementation
  remains unclaimed pending RED/GREEN evidence and H2.
```

- [ ] **Step 5: Validate the governance activation diff**

Run:

```powershell
rg -n "0\\.4\\.5|Q-FE10-013|FE10-S1[2-6]|NOTIFICATION_WORKER|best-effort" `
  .sdd/specs/feat-notification-management `
  docs/superpowers/specs/2026-07-27-staging-email-delivery-remediation-design.md
git diff --check
npm run trace:enforce
```

Expected: all new IDs/settings are found, `git diff --check` reports nothing,
and traceability enforcement passes.

- [ ] **Step 6: Stop for H1 review and publish only the reviewed governance activation**

Expected reviewed files are the four FE10 SDD files only. After H1 authorizes
the exact diff:

```powershell
git add -- `
  .sdd/specs/feat-notification-management/SPEC.md `
  .sdd/specs/feat-notification-management/PLAN.md `
  .sdd/specs/feat-notification-management/TASKS.md `
  .sdd/specs/feat-notification-management/CHANGELOG.md
git commit -m "docs: activate FE10 email delivery remediation"
```

Publish the governance-only commit to a draft PR, require its checks, and stop
for H3. After explicit H3 merge approval and merge:

```powershell
git fetch origin main
git merge --ff-only origin/main
$activationCommit = git log --format=%H `
  --grep="docs: activate FE10 email delivery remediation" -1
git merge-base --is-ancestor $activationCommit origin/main
```

Expected: the final command exits 0. Do not start Task 2 until the governance
activation is authoritative on `origin/main`.

---

### Task 2: Add The Idempotent ACCOUNT_SETUP Template Migration

**Files:**

- Create: `database/migrations/2026-07-27-fe10-account-setup-template.sql`
- Modify: `backend/tests/notificationRepository.test.js`

**Interfaces:**

- Consumes: canonical seed in `database/Librarymanagement.sql`.
- Produces: an additive migration that leaves exactly one active canonical
  `ACCOUNT_SETUP` row when `TemplateCode` is unique.

- [ ] **Step 1: Write the failing migration contract test**

Add:

```javascript
test('account setup template migration is canonical, transactional, and repeatable', () => {
  const root = path.join(__dirname, '..', '..');
  const baseline = fs.readFileSync(path.join(root, 'database', 'Librarymanagement.sql'), 'utf8');
  const migration = fs.readFileSync(
    path.join(
      root,
      'database',
      'migrations',
      '2026-07-27-fe10-account-setup-template.sql'
    ),
    'utf8'
  );

  for (const sqlText of [baseline, migration]) {
    expect(sqlText).toMatch(/ACCOUNT_SETUP/i);
    expect(sqlText).toMatch(/\{\{setupLink\}\}/);
    expect(sqlText).toMatch(/\{\{expiresInHours\}\}/);
  }
  expect(migration).toMatch(/SET XACT_ABORT ON/i);
  expect(migration).toMatch(/BEGIN TRANSACTION/i);
  expect(migration).toMatch(/IF EXISTS[\s\S]*TemplateCode = 'ACCOUNT_SETUP'/i);
  expect(migration).toMatch(/UPDATE NotificationTemplates[\s\S]*Status = 'ACTIVE'/i);
  expect(migration).toMatch(/INSERT INTO NotificationTemplates/i);
  expect(migration).toMatch(/COMMIT TRANSACTION/i);
  expect(migration).toMatch(/ROLLBACK TRANSACTION/i);
  expect(migration).toMatch(/THROW/i);
  expect(migration).not.toMatch(/\bDELETE\b/i);
});
```

- [ ] **Step 2: Run the focused test and capture RED**

Run:

```powershell
npx jest --runInBand --runTestsByPath tests/notificationRepository.test.js
```

Expected: FAIL because
`2026-07-27-fe10-account-setup-template.sql` does not exist.

- [ ] **Step 3: Add the minimal migration**

Create:

```sql
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT 1
        FROM NotificationTemplates
        WHERE TemplateCode = 'ACCOUNT_SETUP'
    )
    BEGIN
        UPDATE NotificationTemplates
        SET Subject = N'Set up your library account',
            Body = N'Complete your library account setup: {{setupLink}}. This link expires in {{expiresInHours}} hours.',
            Status = 'ACTIVE',
            UpdatedAt = GETDATE()
        WHERE TemplateCode = 'ACCOUNT_SETUP';
    END
    ELSE
    BEGIN
        INSERT INTO NotificationTemplates (TemplateCode, Subject, Body, Status)
        VALUES (
            'ACCOUNT_SETUP',
            N'Set up your library account',
            N'Complete your library account setup: {{setupLink}}. This link expires in {{expiresInHours}} hours.',
            'ACTIVE'
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
```

- [ ] **Step 4: Run the focused test and capture GREEN**

Run the Step 2 command again.

Expected: `notificationRepository.test.js` passes.

- [ ] **Step 5: Keep the implementation uncommitted for H2**

Run:

```powershell
git diff --check
git diff -- database/migrations/2026-07-27-fe10-account-setup-template.sql `
  backend/tests/notificationRepository.test.js
```

Expected: only the migration and its focused test appear; no secret or staging
connection value appears.

---

### Task 3: Preserve Sensitive Provider Message IDs

**Files:**

- Modify: `backend/tests/notificationRoutes.test.js:1340-1410,2340-2445`
- Modify: `backend/src/services/notificationService.js:698-730`

**Interfaces:**

- Consumes: `emailProvider.send(message) -> { providerMessageId: string | null }`.
- Produces: `notificationRepository.markSent({ notificationId,
  providerMessageId })` with no public DTO change.

- [ ] **Step 1: Write failing FE02 and FE11 assertions**

Change the existing sensitive table assertion to:

```javascript
expect(notificationDependencies.state.attempts).toEqual([
  expect.objectContaining({
    status: 'SENT',
    providerMessageId: `mock-${recipientEmail}`,
  }),
]);
```

Add to the FE11 `ACCOUNT_SETUP` success test:

```javascript
expect(notificationDependencies.state.attempts).toEqual([
  expect.objectContaining({
    status: 'SENT',
    providerMessageId: 'mock-new.member@example.test',
  }),
]);
```

Keep the existing scans that prove OTP, setup link, rendered subject/body, and
provider failure details are absent from persisted/audited/exposed data.

- [ ] **Step 2: Run the focused tests and capture RED**

Run:

```powershell
npx jest --runInBand --runTestsByPath tests/notificationRoutes.test.js `
  -t "sends .* synchronously|allows only the FE11-bound requester"
```

Expected: FAIL because the attempts currently contain
`providerMessageId: null`.

- [ ] **Step 3: Capture and pass the provider result**

Replace the sensitive provider block with:

```javascript
let providerFailed = false;
let providerResult = null;

try {
  providerResult = await emailProvider.send({
    to: recipient.recipientEmail,
    subject: renderedTitle,
    body: renderedBody,
  });
} catch (error) {
  try {
    notification = await notificationRepository.markFailed({
      notificationId: notification.notificationId,
      safeErrorMessage: 'Notification delivery failed.',
    });
  } catch (markFailedError) {
    throw safeInternalError(
      'NOTIFICATION_DELIVERY_FAILURE_TRANSITION_FAILED',
      'Notification delivery failure could not be recorded.'
    );
  }
  providerFailed = true;
}

if (!providerFailed) {
  try {
    notification = await notificationRepository.markSent({
      notificationId: notification.notificationId,
      providerMessageId: providerResult?.providerMessageId || null,
    });
  } catch (error) {
    throw safeInternalError(
      'NOTIFICATION_DELIVERY_TRANSITION_FAILED',
      'Notification delivery state could not be recorded.'
    );
  }
}
```

- [ ] **Step 4: Run focused GREEN and sensitive regressions**

Run:

```powershell
npx jest --runInBand --runTestsByPath tests/notificationRoutes.test.js `
  -t "synchronously|ACCOUNT_SETUP|sensitive markSent|sensitive markFailed|provider"
```

Expected: all selected tests pass; no stored secret assertion changes.

- [ ] **Step 5: Keep the implementation uncommitted for H2**

Run:

```powershell
git diff --check
git diff -- backend/src/services/notificationService.js `
  backend/tests/notificationRoutes.test.js
```

Expected: only provider-result capture and the two focused expectations appear.

---

### Task 4: Add A Construction-Bound SYSTEM Queue Processor

**Files:**

- Modify: `backend/tests/notificationRoutes.test.js:463-675`
- Modify: `backend/src/services/notificationService.js:870-930`

**Interfaces:**

- Consumes: the current private queue claim/send/terminal-transition loop.
- Produces:
  `notificationService.createSystemNotificationProcessor() -> Readonly<{
  processPendingNotifications(input?: { limit?: number }): Promise<Result>
  }>`.
- Preserves:
  `notificationService.processPendingNotifications(input, actor, context)`.

- [ ] **Step 1: Write the failing system-processor test**

Add after the existing queued-processing tests:

```javascript
test('processes queued mail through a construction-bound SYSTEM processor', async () => {
  const {
    notificationService,
    notificationDependencies,
    authDependencies,
    emailProviderMessages,
  } = makeTestApp();
  notificationDependencies.state.notifications.push({
    notificationId: 996,
    type: 'DUE_DATE_REMINDER',
    templateKey: 'DUE_DATE_REMINDER',
    recipientEmail: 'system-worker@example.test',
    title: 'Due date reminder',
    body: 'Due date: 2026-07-30',
    status: 'PENDING',
    attemptCount: 0,
  });

  const processor = notificationService.createSystemNotificationProcessor();
  const result = await processor.processPendingNotifications({ limit: 1 });

  expect(result).toMatchObject({ processed: 1, failed: 0 });
  expect(emailProviderMessages).toHaveLength(1);
  expect(notificationDependencies.state.attempts).toEqual([
    expect.objectContaining({
      status: 'SENT',
      providerMessageId: 'mock-system-worker@example.test',
    }),
  ]);
  expect(authDependencies.state.auditLogs).toEqual([
    expect.objectContaining({
      userId: null,
      action: 'NOTIFICATION_PROCESS_PENDING',
      metadata: { processed: 1, failed: 0 },
    }),
  ]);
  expect(Object.isFrozen(processor)).toBe(true);
});
```

Do not alter the existing public/member `403` route assertions.

- [ ] **Step 2: Run the focused test and capture RED**

Run:

```powershell
npx jest --runInBand --runTestsByPath tests/notificationRoutes.test.js `
  -t "construction-bound SYSTEM processor"
```

Expected: FAIL because
`createSystemNotificationProcessor` is not a function.

- [ ] **Step 3: Extract one private batch core**

Replace the current processing function with:

```javascript
async function processPendingNotificationBatch(
  input = {},
  { auditUserId = null, context = {} } = {}
) {
  const limit = Number(input.limit || 20);
  const result = {
    processed: 0,
    failed: 0,
    notifications: [],
  };

  for (let index = 0; index < limit; index += 1) {
    const claim = await notificationRepository.claimNextPending();
    if (!claim) {
      break;
    }

    const notification = claim.notification;
    let providerResult;

    try {
      providerResult = await emailProvider.send({
        to: notification.recipientEmail,
        subject: notification.title,
        body: notification.body,
      });
    } catch (error) {
      const updatedNotification = await notificationRepository.markClaimFailed({
        claim,
        safeErrorMessage: safeFailureMessage(error),
      });

      result.failed += 1;
      result.notifications.push(updatedNotification);
      continue;
    }

    const updatedNotification = await notificationRepository.markClaimSent({
      claim,
      providerMessageId: providerResult?.providerMessageId || null,
    });

    result.processed += 1;
    result.notifications.push(updatedNotification);
  }

  await writeAudit(context, 'NOTIFICATION_PROCESS_PENDING', {
    userId: auditUserId,
    metadata: { processed: result.processed, failed: result.failed },
  });

  return result;
}

async function processPendingNotifications(input, actor, context = {}) {
  requireInternalActor(actor);
  return processPendingNotificationBatch(input, {
    auditUserId: actor.userId,
    context,
  });
}

function createSystemNotificationProcessor() {
  return Object.freeze({
    async processPendingNotifications(input = {}) {
      return processPendingNotificationBatch(input, {
        auditUserId: null,
        context: {},
      });
    },
  });
}
```

Add `createSystemNotificationProcessor` to the service return object.

- [ ] **Step 4: Run system and authorization GREEN**

Run:

```powershell
npx jest --runInBand --runTestsByPath tests/notificationRoutes.test.js `
  -t "SYSTEM processor|processes queued|claims one pending|notification APIs are protected"
```

Expected: system processor, queue concurrency, and HTTP authorization tests
pass.

- [ ] **Step 5: Keep the implementation uncommitted for H2**

Run `git diff --check` and review the two changed files.

Expected: the queue loop exists once, the human wrapper still calls
`requireInternalActor`, and no SYSTEM login role is introduced.

---

### Task 5: Add Worker Configuration And Scheduling

**Files:**

- Create: `backend/src/services/notificationWorker.js`
- Create: `backend/tests/notificationWorker.test.js`
- Modify: `backend/src/config/env.js:1-90`
- Modify: `backend/tests/envConfig.test.js`
- Modify: `backend/.env.example:24-45`

**Interfaces:**

- Consumes:
  `processor.processPendingNotifications({ limit }): Promise<Result>`.
- Produces:
  `createNotificationWorker(options) -> { start(): Promise, runOnce(): Promise,
  stop(): void }`.
- Configuration:
  `notificationWorkerEnabled`, `notificationWorkerIntervalMs`,
  `notificationWorkerBatchSize`.

- [ ] **Step 1: Write failing config tests**

Preserve and restore these environment variables in `envConfig.test.js`:

```javascript
const workerEnvNames = [
  'NOTIFICATION_WORKER_ENABLED',
  'NOTIFICATION_WORKER_INTERVAL_MS',
  'NOTIFICATION_WORKER_BATCH_SIZE',
];
const originalWorkerEnv = Object.fromEntries(
  workerEnvNames.map((name) => [name, process.env[name]])
);
```

Add this restoration loop inside the existing `afterEach` before
`jest.resetModules()`:

```javascript
for (const name of workerEnvNames) {
  if (originalWorkerEnv[name] === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = originalWorkerEnv[name];
  }
}
```

Add:

```javascript
test('uses safe disabled notification worker defaults', () => {
  for (const name of workerEnvNames) {
    delete process.env[name];
  }

  const env = require('../src/config/env');

  expect(env.notificationWorkerEnabled).toBe(false);
  expect(env.notificationWorkerIntervalMs).toBe(60000);
  expect(env.notificationWorkerBatchSize).toBe(20);
});

test.each([
  ['NOTIFICATION_WORKER_INTERVAL_MS', '0'],
  ['NOTIFICATION_WORKER_INTERVAL_MS', '1.5'],
  ['NOTIFICATION_WORKER_BATCH_SIZE', '-1'],
])('rejects invalid positive worker setting %s=%s', (name, value) => {
  process.env[name] = value;

  expect(() => require('../src/config/env')).toThrow(
    `Invalid positive integer environment value for ${name}`
  );
});
```

In `afterEach`, restore all `workerEnvNames` and call `jest.resetModules()`.

- [ ] **Step 2: Write the failing worker tests**

Create:

```javascript
const { createNotificationWorker } = require('../src/services/notificationWorker');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function makeHarness({ enabled = true, processor } = {}) {
  const scheduled = [];
  const timer = { id: 1 };
  const clearIntervalFn = jest.fn();
  const logger = { error: jest.fn() };
  const effectiveProcessor =
    processor || { processPendingNotifications: jest.fn().mockResolvedValue({
      processed: 0,
      failed: 0,
      notifications: [],
    }) };
  const worker = createNotificationWorker({
    processor: effectiveProcessor,
    enabled,
    intervalMs: 60000,
    batchSize: 20,
    setIntervalFn(callback, intervalMs) {
      scheduled.push({ callback, intervalMs });
      return timer;
    },
    clearIntervalFn,
    logger,
  });

  return { worker, scheduled, timer, clearIntervalFn, logger, processor: effectiveProcessor };
}

test('disabled worker creates no timer and performs no work', async () => {
  const harness = makeHarness({ enabled: false });

  await harness.worker.start();

  expect(harness.scheduled).toHaveLength(0);
  expect(harness.processor.processPendingNotifications).not.toHaveBeenCalled();
});

test('enabled worker runs at startup and on its configured interval', async () => {
  const harness = makeHarness();

  await harness.worker.start();
  await harness.scheduled[0].callback();

  expect(harness.scheduled[0].intervalMs).toBe(60000);
  expect(harness.processor.processPendingNotifications).toHaveBeenNthCalledWith(1, { limit: 20 });
  expect(harness.processor.processPendingNotifications).toHaveBeenNthCalledWith(2, { limit: 20 });
});

test('overlapping passes are skipped and later passes resume', async () => {
  const first = deferred();
  const processor = {
    processPendingNotifications: jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue({ processed: 0, failed: 0, notifications: [] }),
  };
  const harness = makeHarness({ processor });
  const startup = harness.worker.start();

  await expect(harness.worker.runOnce()).resolves.toEqual({ skipped: true });
  first.resolve({ processed: 1, failed: 0, notifications: [] });
  await startup;
  await harness.worker.runOnce();

  expect(processor.processPendingNotifications).toHaveBeenCalledTimes(2);
});

test('safe worker failure does not stop later passes', async () => {
  const processor = {
    processPendingNotifications: jest
      .fn()
      .mockRejectedValueOnce(new Error('recipient@example.test provider-secret'))
      .mockResolvedValue({ processed: 1, failed: 0, notifications: [] }),
  };
  const harness = makeHarness({ processor });

  await harness.worker.start();
  await harness.scheduled[0].callback();

  expect(processor.processPendingNotifications).toHaveBeenCalledTimes(2);
  expect(harness.logger.error).toHaveBeenCalledWith('[notification worker]', {
    code: 'NOTIFICATION_WORKER_BATCH_FAILED',
  });
  expect(JSON.stringify(harness.logger.error.mock.calls)).not.toContain('provider-secret');
  expect(JSON.stringify(harness.logger.error.mock.calls)).not.toContain('recipient@example.test');
});

test('stop clears the active timer and prevents later work', async () => {
  const harness = makeHarness();
  await harness.worker.start();

  harness.worker.stop();
  await harness.worker.runOnce();

  expect(harness.clearIntervalFn).toHaveBeenCalledWith(harness.timer);
  expect(harness.processor.processPendingNotifications).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 3: Run config and worker tests and capture RED**

Run:

```powershell
npx jest --runInBand --runTestsByPath `
  tests/envConfig.test.js tests/notificationWorker.test.js
```

Expected: FAIL because the worker module/settings do not exist.

- [ ] **Step 4: Add worker configuration**

Add to `backend/src/config/env.js` exports:

```javascript
notificationWorkerEnabled: booleanFromEnv('NOTIFICATION_WORKER_ENABLED', false),
notificationWorkerIntervalMs: positiveIntegerFromEnv(
  'NOTIFICATION_WORKER_INTERVAL_MS',
  60000
),
notificationWorkerBatchSize: positiveIntegerFromEnv(
  'NOTIFICATION_WORKER_BATCH_SIZE',
  20
),
```

Add to `backend/.env.example`:

```dotenv
# Best-effort queued notification worker. Keep disabled for local development
# unless the backend should process non-sensitive PENDING notifications.
NOTIFICATION_WORKER_ENABLED=false
NOTIFICATION_WORKER_INTERVAL_MS=60000
NOTIFICATION_WORKER_BATCH_SIZE=20
```

- [ ] **Step 5: Add the minimal worker**

Create:

```javascript
function createNotificationWorker({
  processor,
  enabled = false,
  intervalMs = 60000,
  batchSize = 20,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
  logger = console,
} = {}) {
  if (!processor || typeof processor.processPendingNotifications !== 'function') {
    throw new TypeError('Notification worker requires a pending notification processor.');
  }

  let timer = null;
  let started = false;
  let running = false;

  async function runOnce() {
    if (!enabled || !started || running) {
      return { skipped: true };
    }

    running = true;
    try {
      return await processor.processPendingNotifications({ limit: batchSize });
    } catch (error) {
      logger.error('[notification worker]', {
        code: 'NOTIFICATION_WORKER_BATCH_FAILED',
      });
      return { failed: true };
    } finally {
      running = false;
    }
  }

  async function start() {
    if (!enabled || started) {
      return { started: false };
    }

    started = true;
    timer = setIntervalFn(() => runOnce(), intervalMs);
    const result = await runOnce();
    return { started: true, result };
  }

  function stop() {
    started = false;
    if (timer !== null) {
      clearIntervalFn(timer);
      timer = null;
    }
  }

  return Object.freeze({ start, runOnce, stop });
}

module.exports = {
  createNotificationWorker,
};
```

- [ ] **Step 6: Run config and worker GREEN**

Run the Step 3 command again.

Expected: both suites pass with no open handles.

- [ ] **Step 7: Keep the implementation uncommitted for H2**

Run:

```powershell
git diff --check
git diff -- backend/src/services/notificationWorker.js `
  backend/src/config/env.js backend/.env.example `
  backend/tests/notificationWorker.test.js backend/tests/envConfig.test.js
```

Expected: fixed safe log code only; no error object, email, SMTP detail, or
secret appears in production logging.

---

### Task 6: Wire Worker And HTTP Server Lifecycles

**Files:**

- Create: `backend/src/serverRuntime.js`
- Create: `backend/tests/serverRuntime.test.js`
- Modify: `backend/src/index.js:1-20`
- Test: `backend/tests/app.test.js`

**Interfaces:**

- Consumes: Express `app`, configured notification worker, Node process signals.
- Produces:
  `createServerRuntime({ app, worker, port, processRef, logger }) -> {
  start(): http.Server, stop(): void }`.
- Preserves: `require('../src/index')` returns the Express app.

- [ ] **Step 1: Write the failing runtime lifecycle tests**

Create:

```javascript
const { EventEmitter } = require('events');
const { createServerRuntime } = require('../src/serverRuntime');

function makeRuntime() {
  const processRef = new EventEmitter();
  const server = { close: jest.fn() };
  const app = {
    listen: jest.fn((port, callback) => {
      callback();
      return server;
    }),
  };
  const worker = {
    start: jest.fn().mockResolvedValue({ started: true }),
    stop: jest.fn(),
  };
  const logger = { info: jest.fn() };
  const runtime = createServerRuntime({
    app,
    worker,
    port: 3000,
    processRef,
    logger,
  });

  return { runtime, processRef, server, app, worker, logger };
}

test.each(['SIGTERM', 'SIGINT'])('starts worker after listen and stops on %s', (signal) => {
  const harness = makeRuntime();

  const server = harness.runtime.start();
  harness.processRef.emit(signal);

  expect(server).toBe(harness.server);
  expect(harness.app.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  expect(harness.worker.start).toHaveBeenCalledTimes(1);
  expect(harness.worker.stop).toHaveBeenCalledTimes(1);
  expect(harness.server.close).toHaveBeenCalledTimes(1);
});

test('does not start the same runtime twice', () => {
  const harness = makeRuntime();

  const first = harness.runtime.start();
  const second = harness.runtime.start();

  expect(second).toBe(first);
  expect(harness.app.listen).toHaveBeenCalledTimes(1);
  expect(harness.worker.start).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the runtime and app tests and capture RED**

Run:

```powershell
npx jest --runInBand --runTestsByPath `
  tests/serverRuntime.test.js tests/app.test.js
```

Expected: FAIL because `serverRuntime.js` does not exist.

- [ ] **Step 3: Add the server runtime**

Create:

```javascript
function createServerRuntime({
  app,
  worker,
  port,
  processRef = process,
  logger = console,
} = {}) {
  let server = null;
  let stopped = false;

  function stop() {
    if (stopped) {
      return;
    }
    stopped = true;
    worker.stop();
    if (server) {
      server.close();
    }
  }

  function start() {
    if (server) {
      return server;
    }

    server = app.listen(port, () => {
      logger.info(`Backend server listening on http://localhost:${port}`);
      void worker.start();
    });
    processRef.once('SIGTERM', stop);
    processRef.once('SIGINT', stop);
    return server;
  }

  return Object.freeze({ start, stop });
}

module.exports = {
  createServerRuntime,
};
```

- [ ] **Step 4: Compose the default runtime without import side effects**

Replace `backend/src/index.js` with:

```javascript
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  quiet: true,
});

const { createApp } = require('./app');
const env = require('./config/env');
const { defaultNotificationService } = require('./services/notificationService');
const { createNotificationWorker } = require('./services/notificationWorker');
const { createServerRuntime } = require('./serverRuntime');

const app = createApp();
const processor = defaultNotificationService.createSystemNotificationProcessor();
const worker = createNotificationWorker({
  processor,
  enabled: env.notificationWorkerEnabled,
  intervalMs: env.notificationWorkerIntervalMs,
  batchSize: env.notificationWorkerBatchSize,
});
const runtime = createServerRuntime({
  app,
  worker,
  port: Number(process.env.PORT || 3000),
});

if (require.main === module) {
  runtime.start();
}

module.exports = app;
```

- [ ] **Step 5: Run runtime and direct app export GREEN**

Run the Step 2 command, then:

```powershell
node -e "const app = require('./src/index'); if (!app || typeof app.listen !== 'function') process.exit(1)"
```

Expected: both suites pass, the import check exits 0, and the import does not
open a timer or port.

- [ ] **Step 6: Run the focused FE10 worker integration gate**

Run:

```powershell
npx jest --runInBand --runTestsByPath `
  tests/notificationRepository.test.js `
  tests/notificationRoutes.test.js `
  tests/notificationWorker.test.js `
  tests/serverRuntime.test.js `
  tests/envConfig.test.js `
  tests/app.test.js
```

Expected: all selected suites pass with zero open handles.

- [ ] **Step 7: Keep the implementation uncommitted for H2**

Run `git status --short`, `git diff --check`, and inspect the complete
Task 2-6 diff.

Expected: no public route/DTO/schema/dependency change and no unrelated file.

---

### Task 7: Complete Validation, H2, Publication, And Staging Repair

**Files:**

- Create:
  `.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md`
- Modify: `.sdd/specs/feat-notification-management/TASKS.md`
- Modify: `.sdd/specs/feat-notification-management/CHANGELOG.md`
- External configuration: Azure App Service settings and Azure SQL staging
  migration only after H2-authorized publication.

**Interfaces:**

- Consumes: complete uncommitted Task 2-6 diff.
- Produces: L1-L4 evidence, H2-reviewed commits, CI/deploy evidence, and a
  safely verified staging state.

- [ ] **Step 1: Run L1 focused validation**

From `backend`:

```powershell
npx jest --runInBand --runTestsByPath `
  tests/notificationRepository.test.js `
  tests/notificationRoutes.test.js `
  tests/notificationWorker.test.js `
  tests/serverRuntime.test.js `
  tests/envConfig.test.js `
  tests/app.test.js
```

Expected: all focused suites pass.

- [ ] **Step 2: Run L2 repository validation**

From the worktree root:

```powershell
npm --prefix backend test
npm --prefix frontend test
npm run test:deployment
npm --prefix backend run test:integration:system
npm run trace:enforce
npm --prefix frontend run lint
npm --prefix frontend run build
git diff --check
```

Expected baseline minimums: backend at least 1,063 tests, frontend at least 232
tests, deployment 9 tests; every command exits 0.

- [ ] **Step 3: Run L3 security and scope scans**

Run:

```powershell
git diff --name-only
git diff | rg -n -i `
  "smtp_password|db_password|connectionstring|provider-secret|rawOtp|setupLink.*console|recipientEmail.*console"
rg -n "NOTIFICATION_WORKER|createSystemNotificationProcessor|providerMessageId" `
  backend/src backend/tests backend/.env.example
```

Expected: changed files match this plan; the secret scan has no credential
value or unsafe production log; expected variable names may appear only in
tests/contracts.

- [ ] **Step 4: Prove migration repeatability**

Use a disposable SQL database when available. Otherwise, after H2 and before
deploy, execute the reviewed migration twice against staging through an
exact-IP temporary firewall rule, then query:

```sql
SELECT TemplateCode, Subject, Body, Status, COUNT(*) OVER () AS MatchingRows
FROM NotificationTemplates
WHERE TemplateCode = 'ACCOUNT_SETUP';
```

Expected after both executions: one row, `Status = ACTIVE`, canonical subject,
and both `{{setupLink}}`/`{{expiresInHours}}` variables. Remove the temporary
firewall rule in a `finally` path and confirm zero task-created rules remain.

- [ ] **Step 5: Write the validation record without secrets or PII**

Record:

```markdown
# Staging Email Delivery Remediation Validation

- Baseline commit and worktree branch
- RED command/failure for FE10-S13, FE10-S14, and FE10-S15
- Focused GREEN totals
- Full backend/frontend/deployment/system/lint/build/trace totals
- Migration execution 1/2 and 2/2 result
- Diff, authorization, DTO, secret, and sensitive-content review
- H2 decision and exact reviewed commit set
- Azure settings names only, never values for secrets
- Deployment run/commit
- Masked aggregate staging counts and provider-ID presence only
- F1 best-effort limitation and rollback setting
```

- [ ] **Step 6: Stop for H2 human review**

Present the complete uncommitted Task 2-6 diff plus Steps 1-5 evidence. H2 must
confirm:

- migration is additive and repeatable;
- SYSTEM does not become a login role;
- manual endpoint authorization remains;
- sensitive provider evidence stores only the message ID;
- worker cannot overlap locally or auto-retry `FAILED`;
- F1 limitations are stated accurately;
- no secrets or real recipient data appear.

Do not commit implementation before explicit H2 approval.

- [ ] **Step 7: Commit only the H2-reviewed set**

After H2 approval, make reviewable commits:

```powershell
git add -- `
  database/migrations/2026-07-27-fe10-account-setup-template.sql `
  backend/tests/notificationRepository.test.js
git commit -m "fix: restore FE10 account setup template"

git add -- `
  backend/src/services/notificationService.js `
  backend/tests/notificationRoutes.test.js
git commit -m "fix: preserve FE10 delivery evidence"

git add -- `
  backend/src/services/notificationWorker.js `
  backend/src/serverRuntime.js `
  backend/src/config/env.js `
  backend/src/index.js `
  backend/.env.example `
  backend/tests/notificationWorker.test.js `
  backend/tests/serverRuntime.test.js `
  backend/tests/envConfig.test.js
git commit -m "fix: process queued notifications automatically"

git add -- `
  .sdd/specs/feat-notification-management/TASKS.md `
  .sdd/specs/feat-notification-management/CHANGELOG.md `
  .sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md
git commit -m "docs: record FE10 email remediation evidence"
```

- [ ] **Step 8: Publish and require CI before staging**

Push the reviewed branch and open/update a draft PR only under H2 authority.
Require the repository CI checks to pass for the exact published head. Do not
merge before H3.

- [ ] **Step 9: Apply staging migration and worker settings**

Apply the reviewed migration, then set only:

```text
NOTIFICATION_WORKER_ENABLED=true
NOTIFICATION_WORKER_INTERVAL_MS=60000
NOTIFICATION_WORKER_BATCH_SIZE=20
```

Do not change or print SMTP/SQL secret settings.

- [ ] **Step 10: Deploy and verify safe staging outcomes**

Verify:

```text
GET /health -> 200
deployment smoke -> PASS
ACCOUNT_SETUP template -> exactly one ACTIVE row
non-sensitive PENDING rows -> drain to SENT or safe FAILED while app is awake
new successful attempts -> providerMessageId present when SMTP supplies one
sensitive Notifications title/body/safe payload -> no OTP, token, or setup link
manual endpoint anonymous/member access -> still denied
```

Use masked aggregate evidence only. Do not reuse the expired setup token; an
authorized Admin resend must create a new token/event if live inbox validation
is requested.

- [ ] **Step 11: Perform H3 integration review**

Confirm the branch remains mergeable, required checks passed for the exact
head, staging evidence matches the approved design, and rollback is
`NOTIFICATION_WORKER_ENABLED=false`. Merge only after explicit H3 approval.
