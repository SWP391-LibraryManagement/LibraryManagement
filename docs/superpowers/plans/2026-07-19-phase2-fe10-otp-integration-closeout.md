# Phase 2 FE10 OTP Integration Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close `FE10-S05` with complete ADR-004 verification evidence, targeted coverage additions, synchronized SDD status, merged PR evidence, and exact post-merge `main` CI.

**Architecture:** Preserve the existing FE02-bound in-process notification requester and FE10 provider-memory delivery architecture. Add characterization evidence for currently under-specified boundary cases, change production code only if a new assertion exposes non-conformance, then use a two-PR flow so the repository records both implementation integration and post-merge closeout facts.

**Tech Stack:** Node.js, Express.js, Jest, SQL Server contract fixtures, GitHub Actions, GitHub CLI, Markdown SDD artifacts.

## Global Constraints

- Use Hybrid SDD+ADD at Full depth for OTP ownership/security and Light depth for evidence-only closeout.
- FE02 owns OTP generation, hashing, expiry, revocation, and validation; FE10 owns rendering, provider delivery, safe status, attempts, and safe metadata.
- Raw OTP and rendered sensitive content must never enter persistence, audit, logs, HTTP responses, or saved evidence.
- Keep `CHANGE_PASSWORD_OTP`, legacy token acceptance, FE11 setup, FE04 membership result, FE09 caller integration, frontend UI, real SMTP credentials, schema tables/indexes, and new dependencies out of scope.
- Use the current worktree branch `feat/phase2-fe10-otp-integration` based on `origin/main@e89c10b`.
- The repository H2 rule overrides generic frequent-commit guidance: keep generated test/evidence changes uncommitted until the complete diff and validation evidence are reviewed.
- The user's 2026-07-19 standing approval authorizes inline execution and all review/merge/closeout actions, but every automated and scope gate must still pass before integration.

---

### Task 1: Lock The Approved Design And Establish The Requirement Audit

**Files:**
- Modify: `docs/superpowers/specs/2026-07-19-phase2-fe10-otp-integration-closeout-design.md`
- Create: `docs/superpowers/plans/2026-07-19-phase2-fe10-otp-integration-closeout.md`

**Interfaces:**
- Consumes: ADR-004 verification contract and approved FE10 `PLAN.md`/`TASKS.md`.
- Produces: approved design and this executable plan.

- [ ] **Step 1: Record design approval**

Set design status to `APPROVED BY USER - 2026-07-19` and record standing approval without claiming that validation or integration has already passed.

- [ ] **Step 2: Self-review design and plan**

Run:

```powershell
$placeholderMatches = rg -n -i "TBD|TODO|implement later|fill in details|similar to task" docs/superpowers/specs/2026-07-19-phase2-fe10-otp-integration-closeout-design.md docs/superpowers/plans/2026-07-19-phase2-fe10-otp-integration-closeout.md | Where-Object { $_ -notmatch 'placeholderMatches|Placeholder scan' }
if ($placeholderMatches) { $placeholderMatches; throw 'Plan contains placeholders.' }
git diff --check
```

Expected: no placeholder matches and no diff errors.

- [ ] **Step 3: Commit approved planning artifacts**

```powershell
git add -- docs/superpowers/specs/2026-07-19-phase2-fe10-otp-integration-closeout-design.md docs/superpowers/plans/2026-07-19-phase2-fe10-otp-integration-closeout.md
git commit -m "docs: approve phase2 FE10 OTP plan"
```

Expected: docs-only commit; worktree clean.

---

### Task 2: Expand FE10 Ownership And HTTP Boundary Evidence

**Files:**
- Modify: `backend/tests/notificationRoutes.test.js`
- Test: `backend/tests/notificationRoutes.test.js`

**Interfaces:**
- Consumes: `createSourceNotificationRequester(sourceFeature)` and `POST /api/notifications/requests`.
- Produces: direct evidence for ADR-004 verification items 1 and 2.

- [ ] **Step 1: Strengthen the HTTP source override assertion**

Replace the existing status-only `sourceFeature` HTTP test with exact response and no-side-effect assertions:

```js
test('rejects an allowlisted sourceFeature supplied through HTTP', async () => {
  const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
  const admin = await createVerifiedUser({
    app,
    authDependencies,
    email: 'notif.http-source-normalization@example.test',
    role: 'ADMIN',
  });
  const auditCountBefore = authDependencies.state.auditLogs.length;

  const response = await request(app)
    .post('/api/notifications/requests')
    .set('Authorization', authHeader(admin.accessToken))
    .send({
      type: 'DUE_DATE_REMINDER',
      recipientEmail: 'reader@example.test',
      templateKey: 'DUE_DATE_REMINDER',
      templateData: { dueDate: '2026-07-20' },
      sourceFeature: ' fe07 ',
    });

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    error: {
      code: 'SOURCE_FEATURE_HTTP_FORBIDDEN',
      message: 'Notification source cannot be supplied through HTTP.',
    },
  });
  expect(notificationDependencies.state.notifications).toHaveLength(0);
  expect(notificationDependencies.state.attempts).toHaveLength(0);
  expect(emailProviderMessages).toHaveLength(0);
  expect(authDependencies.state.auditLogs).toHaveLength(auditCountBefore);
});
```

- [ ] **Step 2: Expand non-FE02 requester coverage to the full allowlist cross-product**

Replace the current two-row parameterization with:

```js
const nonFe02Sources = ['FE04', 'FE07', 'FE08', 'FE09', 'FE11', 'SYSTEM'];
const fe02SensitiveTypes = ['ACCOUNT_VERIFICATION', 'PASSWORD_RESET'];

test.each(
  fe02SensitiveTypes.flatMap((type) =>
    nonFe02Sources.map((sourceFeature) => [type, sourceFeature])
  )
)('rejects %s from the requester bound to %s', async (type, sourceFeature) => {
  const { notificationService, notificationDependencies, authDependencies, emailProviderMessages } =
    makeTestApp();
  const requester = notificationService.createSourceNotificationRequester(sourceFeature);

  await expect(
    requester.createNotificationRequest(
      makeSensitiveRequestInput({
        type,
        recipientEmail: 'reader@example.test',
        templateData: { otp: '234567', expiresInMinutes: type === 'PASSWORD_RESET' ? 15 : 1440 },
        sourceEntityId: 302,
      })
    )
  ).rejects.toMatchObject({
    statusCode: 403,
    code: 'SENSITIVE_NOTIFICATION_INTERNAL_ONLY',
    message: 'Sensitive authentication notifications must be requested internally.',
  });
  expect(notificationDependencies.state.notifications).toHaveLength(0);
  expect(notificationDependencies.state.attempts).toHaveLength(0);
  expect(authDependencies.state.auditLogs).toHaveLength(0);
  expect(emailProviderMessages).toHaveLength(0);
});
```

- [ ] **Step 3: Run the focused evidence test**

Run:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js
```

Expected: PASS. This is characterization of already-implemented behavior; do not manufacture a production diff if it is pre-existing GREEN.

- [ ] **Step 4: If an assertion fails, perform RED-GREEN**

Only when Step 3 exposes non-conformance, make the smallest change in `backend/src/services/notificationService.js` or `backend/src/validators/notificationValidators.js`, rerun the exact failing test, then rerun the full focused file. Do not weaken the assertion or broaden the API.

---

### Task 3: Prove Repeated Password Reset Creates A New Source Event

**Files:**
- Modify: `backend/tests/authRoutes.test.js`
- Test: `backend/tests/authRoutes.test.js`

**Interfaces:**
- Consumes: FE02 `forgotPassword`, OTP token repository, and injected FE10 requester.
- Produces: direct ADR-004 verification evidence for new token ID/idempotency and no duplicate direct delivery.

- [ ] **Step 1: Add the repeated forgot-password characterization test**

Insert after the existing single reset delivery test:

```js
// @spec BR-FE02-020 BR-FE02-021 FR-FE02-011 FR-FE02-022 AC-FE02-014
test('repeated forgot-password creates a new token event and requester key without direct delivery', async () => {
  const { app, dependencies } = makeTestApp();
  const user = await dependencies.userRepository.createRegisteredUser({
    username: 'requester-reset-repeat',
    email: 'requester-reset-repeat@example.test',
    passwordHash: await bcrypt.hash('Password1!', 4),
    phoneNumber: null,
    fullName: 'Requester Reset Repeat',
  });
  await dependencies.userRepository.markEmailVerified(user.userId);

  await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: user.email })
    .expect(200);
  await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: user.email })
    .expect(200);

  const resetTokens = dependencies.state.tokens.filter(
    (item) => item.tokenType === 'PASSWORD_RESET'
  );
  expect(resetTokens).toHaveLength(2);
  expect(resetTokens[0].revokedAt).toEqual(expect.any(Date));
  expect(resetTokens[1].tokenId).not.toBe(resetTokens[0].tokenId);
  expect(dependencies.state.notificationRequests).toEqual([
    expect.objectContaining({
      type: 'PASSWORD_RESET',
      sourceEntityId: resetTokens[0].tokenId,
      idempotencyKey: `FE02:PASSWORD_RESET:${resetTokens[0].tokenId}`,
    }),
    expect.objectContaining({
      type: 'PASSWORD_RESET',
      sourceEntityId: resetTokens[1].tokenId,
      idempotencyKey: `FE02:PASSWORD_RESET:${resetTokens[1].tokenId}`,
    }),
  ]);
  expect(dependencies.state.directEmails).toHaveLength(0);
});
```

- [ ] **Step 2: Run the focused auth test**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/authRoutes.test.js
```

Expected: PASS as pre-existing behavior. If it fails, retain the test as RED and make only the minimal FE02-owned correction in `backend/src/services/authService.js` or its token repository helper.

- [ ] **Step 3: Run the cross-feature focused gate**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js tests/authRoutes.test.js tests/integration.test.js tests/fe10OtpTemplateMigration.test.js
```

Expected: all suites and tests PASS with zero snapshots or skipped failures.

---

### Task 4: Reconcile FE10-S05 Pre-Integration Evidence

**Files:**
- Modify: `.sdd/specs/feat-auth/PLAN.md`
- Modify: `.sdd/specs/feat-auth/TASKS.md`
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`
- Modify: `.sdd/specs/feat-notification-management/PLAN.md`
- Modify: `.sdd/specs/feat-notification-management/TASKS.md`
- Modify: `.sdd/specs/feat-notification-management/CHANGELOG.md`
- Modify: `.sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md`
- Modify: `docs/superpowers/specs/2026-07-19-phase2-fe10-otp-integration-closeout-design.md`

**Interfaces:**
- Consumes: Tasks 2-3 test output, baseline SQL evidence already merged in PR #40, and the user's standing approval.
- Produces: H2/H3-ready evidence without prematurely claiming merge or post-merge CI.

- [ ] **Step 1: Update status accurately before integration**

Use these boundaries:

- `PLAN.md`: `FE10-S05 HUMAN ACCEPTANCE APPROVED; PR/MAIN CI PENDING`.
- `TASKS.md`: keep the task unchecked or `[~]`, but replace `FINAL HUMAN CLOSEOUT PENDING` with `HUMAN ACCEPTANCE APPROVED; PR/MAIN CI PENDING`.
- FE02 `PLAN.md`/`TASKS.md`: replace the stale OTP delivery implementation/human-closeout pending statements with `HUMAN ACCEPTANCE APPROVED; PR/MAIN CI PENDING`, while leaving unrelated refresh, HTTPS, legacy-token, and future-scope boundaries unchanged.
- FE02 `CHANGELOG.md`: prepend the same focused evidence and standing-approval record without claiming integration.
- `CHANGELOG.md`: prepend a 2026-07-19 entry describing the expanded ownership/reset-event evidence and standing approval.
- Validation review: replace obsolete 131/623 counts and old missing-schema/FE02/SQL statements with fresh commands/results; set L4 to approved for injected-provider scope while leaving integration pending.
- Design: record the final requirement audit result and any production gap or `no product correction required` conclusion.

- [ ] **Step 2: Run contradiction and leakage scans**

```powershell
rg -n -i "shared schema.*pending|FE02 fan-in.*pending|SQL.*pending|human review pending|FINAL HUMAN CLOSEOUT PENDING|OTP delivery implementation follow-up remains pending" .sdd/specs/feat-auth .sdd/specs/feat-notification-management .sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md
rg -n "verificationLink|resetLink" backend/src database/Librarymanagement.sql
rg -n "ACCOUNT_VERIFICATION|PASSWORD_RESET|EMAIL_VERIFY" backend/src/services/authService.js backend/src/services/notificationService.js database/Librarymanagement.sql
git diff --check
```

Expected: no active stale-gate statements; any `verificationLink`/`resetLink` matches are absent from production; `EMAIL_VERIFY` remains only the FE02 token type or explicit defensive legacy exclusion, never a notification template alias.

---

### Task 5: Run H2 Validation And Publish The Integration PR

**Files:** All changed files from Tasks 2-4 plus the approved design/plan commits.

**Interfaces:**
- Consumes: complete uncommitted test/evidence diff.
- Produces: one reviewed integration commit and PR.

- [ ] **Step 1: Run complete L1 validation**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
npm.cmd run test:system
npm.cmd run test:deployment
npm.cmd run test:e2e
node -e "require('yamljs').load('backend/src/docs/openapi.yaml'); console.log('openapi ok')"
node -e "require('./backend/src/app'); console.log('backend import ok')"
git diff --check
```

Expected: all configured suites and checks PASS. The known non-blocking Vite chunk advisory may remain.

- [ ] **Step 2: Run L2/L3 scope audit**

```powershell
git diff --name-only
git diff --stat
git diff -- backend/src backend/tests .sdd/specs/feat-auth .sdd/specs/feat-notification-management .sdd/reviews docs/superpowers
rg -n -i "password\s*=|api[_-]?key|private[_-]?key|client[_-]?secret|authorization:\s*bearer" $(git diff --name-only)
```

Expected: only planned FE10/FE02 tests and evidence files; no credentials, frontend product code, FE09 caller, dependency, schema table/index, or `CHANGE_PASSWORD_OTP` behavior change.

- [ ] **Step 3: Record H2 review and commit the exact diff**

Record the diff hash and validation results in the review packet. Then:

```powershell
git add -- backend/tests/notificationRoutes.test.js backend/tests/authRoutes.test.js .sdd/specs/feat-auth/PLAN.md .sdd/specs/feat-auth/TASKS.md .sdd/specs/feat-auth/CHANGELOG.md .sdd/specs/feat-notification-management/PLAN.md .sdd/specs/feat-notification-management/TASKS.md .sdd/specs/feat-notification-management/CHANGELOG.md .sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md docs/superpowers/specs/2026-07-19-phase2-fe10-otp-integration-closeout-design.md
git commit -m "test(fe10): close OTP integration evidence"
git push -u origin feat/phase2-fe10-otp-integration
```

- [ ] **Step 4: Open PR, wait for checks, and merge under standing H3 approval**

Create a draft PR summarizing ADR-004 coverage and no scope expansion. Mark ready after required checks pass. Verify the exact head SHA is unchanged, then merge with `--match-head-commit`. Record PR number, final head, PR CI run, merge SHA, and exact post-merge `main` CI run.

---

### Task 6: Publish The Mechanical FE10-S05 Closeout

**Files:**
- Modify: `.sdd/specs/feat-auth/PLAN.md`
- Modify: `.sdd/specs/feat-auth/TASKS.md`
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`
- Modify: `.sdd/specs/feat-notification-management/PLAN.md`
- Modify: `.sdd/specs/feat-notification-management/TASKS.md`
- Modify: `.sdd/specs/feat-notification-management/CHANGELOG.md`
- Modify: `.sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md`
- Modify: `.agents/CLAUDE.md` only if its FE10 pending sentence remains stale after Task 5.

**Interfaces:**
- Consumes: merged integration PR and exact successful `main` CI.
- Produces: repository-native B7 completion state for FE10-S05.

- [ ] **Step 1: Create a clean closeout worktree from the merged `origin/main`**

```powershell
git fetch origin main
git -C D:\SWP391\library-management-system worktree add D:\SWP391\library-management-system\.worktrees\phase2-fe10-otp-closeout -b docs/phase2-fe10-otp-closeout origin/main
```

Verify `.worktrees/` remains ignored and the new worktree is clean.

- [ ] **Step 2: Apply exact evidence substitutions**

- Mark `FE10-S05` `[x] COMPLETE THROUGH B7`.
- Mark the FE02 OTP-delivery follow-up validation task complete through B7 and remove only the stale OTP-delivery pending statements.
- Set FE10 `PLAN.md`/`TASKS.md` top status to complete for OTP/FE02/FE04/schema reconciliation without claiming real SMTP or inbox UI.
- Record integration PR number, final head SHA, PR CI, merge SHA, post-merge `main` CI, test counts, traceability, standing acceptance, and residual boundaries.
- Update `.agents/CLAUDE.md` only to remove the stale statement that ADR-004/G8-G10 implementation remains pending.

- [ ] **Step 3: Verify the mechanical closeout**

```powershell
git diff --check
git diff --name-only
rg -n -i "FE10-S05|G8-G10.*pending|human.*pending|merge.*pending|main CI.*pending" .agents/CLAUDE.md .sdd/specs/feat-notification-management .sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md
```

Expected: no stale FE10-S05/G8-G10 pending state; deferred real SMTP/inbox/FE09 boundaries remain explicit.

- [ ] **Step 4: Commit, publish, merge, and verify final main CI**

Commit as `docs: close phase2 FE10 OTP integration`, push `docs/phase2-fe10-otp-closeout`, open a docs-only PR, wait for required checks, merge under standing approval, and monitor the exact final `main` CI. Add a persistent PR comment containing merge SHA and CI run ID.

---

## Self-Review Results

- Spec coverage: Tasks 2-3 directly cover all seven ADR-004 verification items; existing provider leakage tests remain authoritative and are rerun in Tasks 3 and 5.
- Scope: no new delivery channel, provider credential, schema table/index, UI, FE09 caller, FE11/FE04 behavior, or `CHANGE_PASSWORD_OTP` change is planned.
- Type consistency: FE02 request types/templates are canonical notification values; the internal FE02 token type `EMAIL_VERIFY` remains separate and is not treated as a notification template alias.
- Integration completeness: Task 5 proves and merges the evidence diff; Task 6 prevents repository status from remaining falsely pending after merge.
- Placeholder scan: the plan contains no TBD/TODO/future fill-in steps; every action names exact files, commands, expected results, and gate behavior.

## Execution Handoff

The user approved the design and granted standing approval on 2026-07-19. Execute inline with `executing-plans`; do not spawn subagents. Stop only for a deterministic failure after the allowed retry budget, secret exposure, or a contract conflict that cannot be resolved from the approved sources.
