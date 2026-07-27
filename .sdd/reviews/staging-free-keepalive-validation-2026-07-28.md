# Staging Free Keepalive Validation

**Status:** IMPLEMENTATION COMPLETE; H2 REVIEW PENDING

**Date:** 2026-07-28

**Branch:** `codex/chore-staging-free-keepalive`

**Implementation baseline:**
`2c0b169cbb81421b17ad43580a8688dddffa328c`

**H1 governance commit:**
`40c1707` (`docs: approve staging free keepalive plan`)

## 1. Scope Evidence

The uncommitted implementation changes are limited to:

- `.github/workflows/staging-keepalive.yml`
- `tests/deployment/stagingKeepalivePolicy.test.js`
- `docs/deployment/azure-staging-guide.md`
- this validation record

No frontend, backend, database, dependency, environment, or secret file is
modified.

## 2. RED Evidence

### Initial workflow contract

Command:

```powershell
node --test tests/deployment/stagingKeepalivePolicy.test.js
```

Observed result: `0 passed, 4 failed`.

- The workflow-existence assertion failed because
  `.github/workflows/staging-keepalive.yml` did not exist.
- Least-privilege, bounded-request, and endpoint assertions failed because the
  workflow content was empty.
- The operator-guide assertion failed because the F1 keepalive section did not
  exist.

### Inactivity limitation regression

After discovering the documented GitHub public-repository inactivity boundary,
the guide assertion was extended before the guide:

```text
3 passed, 1 failed
Expected: 60 days followed by gh workflow enable staging-keepalive.yml
```

The guide was then updated with the limitation and recovery command.

## 3. GREEN Evidence

Focused policy command:

```powershell
node --test tests/deployment/stagingKeepalivePolicy.test.js
```

Result: `4 passed, 0 failed`.

Full deployment utility command:

```powershell
npm.cmd run test:deployment
```

Result: `17 passed, 0 failed`.

YAML parser/formatter command:

```powershell
npx.cmd --yes prettier@3.6.2 --check .github/workflows/staging-keepalive.yml
```

Result: `All matched files use Prettier code style!`

Repository diff command:

```powershell
git diff --check
```

Result: exit code `0`. The Windows checkout reported only the repository's
expected future LF-to-CRLF conversion warning for the Markdown guide.

## 4. Workflow Safety Review

- Trigger interval is exactly minutes `3,13,23,33,43,53`, every 10 minutes and
  away from minute zero.
- Manual `workflow_dispatch` is available.
- Repository permission is `contents: read`.
- One job runs with a three-minute timeout.
- `curl` fails on non-2xx responses and has bounded retry, delay, connection,
  and total-request time.
- The only requested URL is the public HTTPS `/health` endpoint.
- No checkout, deployment action, mutation endpoint, authentication endpoint,
  database endpoint, SMTP action, or notification-processing endpoint exists.
- No GitHub secret expression or credential value exists in the workflow.
- Concurrency cancels a superseded keepalive run.

## 5. Documentation Review

The operator guide now states:

- GitHub schedule and Azure F1 wakefulness are best-effort;
- schedules run from the default branch;
- a successful manual run is required before the downgrade;
- Always On is disabled before scaling to F1;
- post-change health, public catalog, worker-setting, and queue checks are
  required;
- a public repository's scheduled workflows can be disabled after 60 days
  without repository activity and can be re-enabled with GitHub CLI;
- rollback is B1 plus `alwaysOn=true`.

## 6. Current Live Pre-Transition Evidence

Read-only checks on 2026-07-28:

```text
App Service plan SKU = B1
App Service plan tier = Basic
alwaysOn = true
NOTIFICATION_WORKER_ENABLED = true
NOTIFICATION_WORKER_INTERVAL_MS = 60000
NOTIFICATION_WORKER_BATCH_SIZE = 20
GET /health = 200
GET /api/books = 200
GitHub repository visibility = PUBLIC
GitHub default branch = main
Current main workflows = CI, Deploy staging
```

This proves the safety guard is intact: Azure remains paid/awake and no
keepalive workflow is active on `main` before H2/H3.

## 7. Secret And Data Review

The reviewed implementation contains:

- no password, token, publish profile, connection string, mailbox, recipient
  address, rendered email content, or notification payload;
- no secret lookup or output command;
- no user or notification record;
- only the public App Service hostname and non-secret worker-setting names.

The existing deployment guide continues to name required secret variables, but
the implementation adds no value for any such variable.

## 8. Remaining Gates

- H2 must review the complete local implementation diff and this evidence.
- After H2, commit and publish only the reviewed files.
- Required pull-request checks must pass for the exact head.
- H3 must approve merge.
- Post-merge `main` CI and a manual keepalive run must succeed.
- Only then may the operator disable Always On and scale B1 to F1.
- Live post-transition evidence and rollback, if needed, remain pending.
