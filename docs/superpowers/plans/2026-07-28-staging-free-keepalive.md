# Staging Free Keepalive Implementation Plan

**Status:** H1 APPROVED 2026-07-28

**Goal:** Replace the paid B1/Always On staging workaround with a
repository-controlled, best-effort GitHub Actions keepalive and safely return
Azure App Service to F1.

**Design:**
`docs/superpowers/specs/2026-07-28-staging-free-keepalive-design.md`

**Branch:** `codex/chore-staging-free-keepalive`

**Baseline:** `origin/main` at
`2c0b169cbb81421b17ad43580a8688dddffa328c`

## Task 1: Establish RED Workflow Policy Evidence

**Files:**

- Create: `tests/deployment/stagingKeepalivePolicy.test.js`
- Test: `.github/workflows/staging-keepalive.yml`
- Test: `docs/deployment/azure-staging-guide.md`

- [ ] Write a Node test that reads the planned workflow and deployment guide.
- [ ] Require the exact six 10-minute cron offsets.
- [ ] Require `workflow_dispatch`, `permissions: contents: read`, bounded
      concurrency, job timeout, fail-closed `curl`, retry count, retry delay,
      request timeout, and the exact HTTPS `/health` endpoint.
- [ ] Require the guide to state that the approach is best-effort and that a
      successful manual workflow run precedes the F1 downgrade.
- [ ] Run:

```powershell
node --test tests/deployment/stagingKeepalivePolicy.test.js
```

Expected RED: the test fails because
`.github/workflows/staging-keepalive.yml` does not exist.

## Task 2: Add The Minimal Keepalive Workflow

**Files:**

- Create: `.github/workflows/staging-keepalive.yml`

- [ ] Add the approved scheduled and manual triggers.
- [ ] Grant only read-only contents permission.
- [ ] Add one three-minute Ubuntu job.
- [ ] Call only the public staging `/health` endpoint.
- [ ] Use bounded retries and fail on non-2xx responses.
- [ ] Run the focused test from Task 1.

Expected GREEN: the focused workflow policy test passes.

## Task 3: Document F1 Operation And Rollback

**Files:**

- Modify: `docs/deployment/azure-staging-guide.md`

- [ ] Add a `Free-Tier Staging Keepalive` section.
- [ ] State that GitHub schedule delivery and F1 wakefulness are best-effort.
- [ ] Document merge -> successful manual dispatch -> disable Always On ->
      scale to F1.
- [ ] Document post-change health, public catalog, worker-setting, and queue
      verification.
- [ ] Document B1 + Always On rollback.
- [ ] Re-run the focused workflow policy test.

Expected GREEN: workflow and documentation policy assertions pass.

## Task 4: Validate And Stop For H2

**Files:**

- Create:
  `.sdd/reviews/staging-free-keepalive-validation-2026-07-28.md`

- [ ] Run:

```powershell
node --test tests/deployment/stagingKeepalivePolicy.test.js
npm run test:deployment
git diff --check
git diff --name-only
git status --short
```

- [ ] Scan the diff for credentials, tokens, recipient addresses, SMTP values,
      mutation endpoints, and unrelated files.
- [ ] Record the RED failure and GREEN command results in the validation file.
- [ ] Present the complete uncommitted implementation diff and evidence for H2.

H2 authorizes only the reviewed commit set, branch push, and draft pull-request
publication.

## Task 5: Publish And Complete H3

- [ ] After explicit H2 approval, commit the reviewed files.
- [ ] Push `codex/chore-staging-free-keepalive`.
- [ ] Open a draft pull request and wait for all required checks.
- [ ] Confirm the pull request remains mergeable.
- [ ] Present exact check and diff evidence for H3.
- [ ] Merge only after explicit H3 approval.
- [ ] Verify post-merge `main` CI for the exact merge commit.

## Task 6: Activate Keepalive Before Downgrade

- [ ] Manually dispatch `Staging keepalive` from `main`.
- [ ] Wait for the exact run to complete successfully.
- [ ] Verify the job called the expected HTTPS `/health` endpoint and exposed no
      secret.

If the run fails, keep B1/Always On and stop the downgrade.

## Task 7: Return Azure To F1 And Verify

- [ ] Set `alwaysOn=false` for
      `app-library-api-staging-nhat714`.
- [ ] Scale `plan-library-staging` from B1 to F1.
- [ ] Verify:

```text
App Service plan SKU = F1
alwaysOn = false
GET /health = 200
GET /api/books = 200
NOTIFICATION_WORKER_ENABLED = true
NOTIFICATION_WORKER_INTERVAL_MS = 60000
NOTIFICATION_WORKER_BATCH_SIZE = 20
PENDING/PROCESSING queue counts are recorded without PII
```

- [ ] Record the GitHub run, Azure state, endpoint results, and aggregate queue
      counts in the validation record without secret values.

## Task 8: Roll Back If Live Verification Fails

If the post-downgrade checks repeatedly fail:

- [ ] Scale `plan-library-staging` back to B1.
- [ ] Set `alwaysOn=true`.
- [ ] Re-run health, catalog, worker-setting, and aggregate queue checks.
- [ ] Report the exact failure and rollback evidence.
