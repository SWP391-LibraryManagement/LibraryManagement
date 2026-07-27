# Staging Free Keepalive Design

**Status:** APPROVED - H1 2026-07-28

**Design direction approved:** 2026-07-28

**Approver:** User in the active task

**Written H1 review approved:** 2026-07-28

**Implementation baseline:** `origin/main` at
`2c0b169cbb81421b17ad43580a8688dddffa328c`

## 1. Outcome And Scope

Keep the Azure staging backend responsive enough for the existing in-process
notification worker without paying for App Service B1:

1. GitHub Actions sends an unauthenticated `GET /health` request to the staging
   backend every 10 minutes.
2. The workflow can also be run manually for deployment verification.
3. Azure is downgraded from B1 to F1 only after the workflow exists on `main`
   and a manual run succeeds.
4. The existing notification worker remains enabled with its current
   60-second interval and batch size 20.

This is a best-effort staging/demo solution. GitHub scheduled workflows can be
delayed, and Azure F1 can still unload the application. It is not a production
availability guarantee.

Out of scope:

- changing SMTP credentials, sender identity, or email content;
- changing notification state transitions or retry rules;
- adding Azure Functions, Logic Apps, queues, or paid resources;
- claiming guaranteed delivery time or uptime;
- adding a secret or authenticated health endpoint;
- changing frontend or backend application code.

## 2. Options Considered

| Option | Cost | Benefits | Limitations | Decision |
| --- | --- | --- | --- | --- |
| GitHub Actions scheduled ping | No additional charge for the current public repository on standard hosted runners | Uses the existing repository, is reviewable, supports manual dispatch | Scheduled runs can be delayed and only run from the default branch | Selected |
| UptimeRobot free monitor | Free tier | Five-minute checks and an external dashboard | Adds another account/provider and configuration outside the repository | Rejected for now |
| Synchronous/code redesign | No hosting keepalive dependency for event-driven mail | Stronger delivery behavior for immediate events | Larger product change and does not solve scheduled reminders while asleep | Out of scope |

## 3. Operational Contract

### 3.1 Workflow

Create `.github/workflows/staging-keepalive.yml` with:

- `schedule` at minutes `3,13,23,33,43,53` of every hour;
- `workflow_dispatch` for operator verification;
- read-only repository permissions;
- one Ubuntu job with a three-minute timeout;
- `curl` against
  `https://app-library-api-staging-nhat714.azurewebsites.net/health`;
- fail-closed HTTP handling, a bounded request timeout, and two retries;
- concurrency that cancels a superseded keepalive run.

The off-round minute schedule reduces collision with the common top-of-hour
GitHub Actions load. The endpoint is already public and returns only a generic
health payload, so no credential or repository secret is required.

### 3.2 Azure Transition

The safe transition order is:

1. Review, merge, and pass CI for the workflow on `main`.
2. Run `Staging keepalive` manually and require a successful response.
3. Set App Service `alwaysOn` to `false`.
4. Scale `plan-library-staging` from B1 to F1.
5. Verify the plan is F1, `alwaysOn` is false, `/health` is HTTP 200, and the
   notification worker settings remain unchanged.

Azure remains on B1 until steps 1-2 succeed. This prevents a review or workflow
failure from immediately reintroducing the sleep-related email gap.

### 3.3 Rollback

If the keepalive workflow repeatedly fails or staging becomes unreliable:

1. Scale the plan back to B1.
2. Set `alwaysOn` to `true`.
3. Verify `/health`, `/api/books`, and the notification queue.

Disabling the workflow alone does not restore availability on F1.

## 4. Safety And Failure Handling

- The workflow contains no password, token, publish profile, connection string,
  recipient address, or SMTP value.
- `curl --fail` makes non-2xx responses fail the job instead of reporting a
  false success.
- Retries cover a short F1 cold start but remain bounded.
- The workflow does not call an email, queue-processing, login, or mutation
  endpoint.
- GitHub schedule delay is documented as an accepted staging limitation.
- Azure downgrade is an operator action after merge, not part of pull-request
  execution.

## 5. Test-First Acceptance

| ID | RED evidence | Acceptance evidence |
| --- | --- | --- |
| KA-001 | No keepalive workflow exists | Workflow has `schedule` and `workflow_dispatch` |
| KA-002 | No contract prevents an unsafe interval or secret-bearing endpoint | Deployment test requires the exact six ten-minute offsets and the public HTTPS `/health` URL |
| KA-003 | No contract requires bounded fail-closed behavior | Deployment test requires `curl --fail`, retries, max time, job timeout, and read-only permissions |
| KA-004 | Operator guide does not describe the free keepalive transition | Guide documents merge/manual-run-before-F1 order, best-effort limitation, verification, and rollback |
| KA-005 | B1 is currently active | After merge and successful dispatch, Azure reports F1 with `alwaysOn=false` |
| KA-006 | Runtime evidence could drift during the plan change | Post-change checks prove health, public catalog, worker settings, and aggregate queue state |

The production workflow file is not added until the focused deployment test
has failed for the expected missing-file/contract reason.

## 6. Planned Files

- Create: `.github/workflows/staging-keepalive.yml`
- Create: `tests/deployment/stagingKeepalivePolicy.test.js`
- Modify: `docs/deployment/azure-staging-guide.md`
- Create:
  `.sdd/reviews/staging-free-keepalive-validation-2026-07-28.md`

No frontend, backend, database, dependency, or secret file is in scope.

## 7. Validation Gates

Before H2:

```powershell
node --test tests/deployment/stagingKeepalivePolicy.test.js
npm run test:deployment
git diff --check
git diff --name-only
```

After H2 publication:

- required pull-request checks pass for the exact head;
- H3 confirms the branch is mergeable and approves merge;
- post-merge `main` CI passes;
- a manual `Staging keepalive` run succeeds.

Only then may the Azure B1-to-F1 transition and live verification occur.

## 8. H1 Contract

H1 authorizes only:

- the four planned repository files above;
- an isolated worktree on
  `codex/chore-staging-free-keepalive`;
- uncommitted RED-GREEN implementation;
- the listed local validation commands;
- read-only GitHub/Azure inspection needed to prepare H2 evidence.

H1 does not authorize committing generated implementation, pushing the branch,
opening a pull request, merging, or changing the Azure plan. Those remain H2,
H3, and post-merge operational actions respectively.
