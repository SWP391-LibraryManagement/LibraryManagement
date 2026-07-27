# Staging Email Delivery Remediation Design

**Status:** APPROVED - DESIGN AND WRITTEN REVIEW 2026-07-27

**Design approved:** 2026-07-27

**Approver:** User in the active task

**Written document approved:** 2026-07-27

**Delivery method:** Hybrid, Full depth for Core notification rules

**Implementation baseline:** `origin/main` at
`ca69dc87badf4d1056c0a63d97e5e411fb4cbd68`

## 1. Outcome And Scope

This bounded FE10/FE11 remediation restores three already-approved email
delivery contracts:

1. Existing databases receive the canonical `ACCOUNT_SETUP` notification
   template required by FE11.
2. Successful sensitive synchronous sends persist the provider message ID
   already returned by the configured SMTP adapter.
3. Non-sensitive `PENDING` notifications are processed automatically by a
   system-owned, in-process worker while the backend is awake.

The existing protected manual processing endpoint remains available. The
worker is best-effort on the current Azure App Service F1 plan because that plan
has `Always On = false`; it is not presented as guaranteed scheduling while the
application is asleep.

Out of scope:

- changing SMTP credentials, sender identity, or Gmail configuration;
- adding Azure Functions, Logic Apps, queues, or paid Azure resources;
- changing public notification routes or response DTOs;
- automatically reissuing expired `ACCOUNT_SETUP` credentials;
- automatically retrying `FAILED` notifications;
- changing the approved synchronous handling of sensitive notifications.

## 2. Source-Of-Truth Ledger

| Source ID | Source and location | Revision/date | Evidence it can prove | Authority level | Owner | Conflicts |
| --- | --- | --- | --- | --- | --- | --- |
| S-001 | User decisions in the active task | 2026-07-27 | Approves the three-part repair and the in-process 60-second best-effort worker | Highest for this bounded remediation | User | None after approval |
| S-002 | `.sdd/specs/feat-notification-management/SPEC.md` | v0.4.4, approved 2026-07-27 | Canonical types/templates, synchronous sensitive delivery, queued non-sensitive delivery, Notification Worker/System actor, attempts and safe metadata | Approved feature baseline | Nhat | Deployed worker startup is missing |
| S-003 | `.sdd/specs/feat-user-role-management/SPEC.md` and `.sdd/rfcs/ADR-005-admin-created-account-setup-boundary.md` | Approved/accepted 2026-07-15 through 2026-07-27 | `ACCOUNT_SETUP -> ACCOUNT_SETUP`, FE11-only requester, 24-hour token and resend boundary | Approved cross-feature baseline | Nhat | Existing staging database lacks the template |
| S-004 | `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md` | Approved 2026-07-15 | Sensitive FE02 mail is synchronous and persists safe status/attempt data | Approved cross-feature baseline | Nhat | Runtime discards the returned provider ID |
| S-005 | Repository implementation and tests | `origin/main` at `ca69dc8` | Observable behavior: manual queue processor exists; no worker lifecycle exists; sensitive success writes a null provider ID | Observational, not normative | unassigned | Conflicts with S-002/S-004 |
| S-006 | Azure staging App Service configuration | Inspected 2026-07-27 | Plan `F1`, `Always On = false`, backend running | Environment evidence | unassigned | Limits worker guarantee |
| S-007 | Azure staging SMTP verification | Inspected 2026-07-27 | Configured SMTP transport successfully verifies without exposing credentials | Environment evidence | unassigned | No SMTP transport defect observed |
| S-008 | Azure SQL staging notification records/templates | Inspected 2026-07-27 | `ACCOUNT_SETUP` template absent; recent sensitive notifications are `SENT`; non-sensitive rows remain `PENDING`; sensitive attempts lack provider IDs | Environment evidence | unassigned | Confirms schema/data drift and worker gap |
| S-009 | `.sdd/rfcs/ADR-002-database-design.md` and existing migration practice | Current at `ca69dc8` | Existing environments are synchronized through reviewable idempotent migrations; code deployment does not automatically apply them | Approved database process | Team | Requires an explicit staging migration step |

## 3. Evidence Classification

| Evidence ID | Classification | Current evidence | Required resolution |
| --- | --- | --- | --- |
| E-001 | `observed-behavior` | The canonical baseline seed contains `ACCOUNT_SETUP`, but the existing staging database does not. | Add and apply a reviewable idempotent migration that upserts the missing canonical template. |
| E-002 | `observed-behavior` | SMTP returns `providerMessageId`, but sensitive notification success passes `null` to `markSent`. | Preserve the provider result in the safe attempt record. |
| E-003 | `observed-behavior` | Non-sensitive rows stay `PENDING` until a staff caller invokes the protected route. | Start a system-owned worker that reuses the existing claim/send/transition core. |
| E-004 | `approved-requirement` | `FAILED` sends are retried manually in Phase 1. | Keep the worker restricted to `PENDING`; do not auto-retry `FAILED`. |
| E-005 | `observed-behavior` | F1 disables Always On and may suspend the process. | State and test best-effort behavior; do not claim guaranteed scheduling. |

## 4. Business Decision Log

| Decision ID | Slice ID | Question | Options considered | Approved decision | Rationale | Approver | Decision date | Affected requirements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BD-001 | SL-001 | How should existing databases receive the missing setup template? | Rebuild DB; runtime auto-create; idempotent migration | Add an idempotent `ACCOUNT_SETUP` upsert migration and apply it explicitly to staging | Preserves rows and follows approved migration practice | User | 2026-07-27 | ADR-005; Q-FE10-003; Q-FE11-015 |
| BD-002 | SL-002 | What should be stored after a successful sensitive SMTP send? | Null; full provider response; message ID only | Persist only the normalized provider message ID already returned by the adapter | Restores traceability without exposing provider details or message content | User | 2026-07-27 | FE10 attempt/traceability requirements; ADR-004/005 |
| BD-003 | SL-003 | How should staging process queued non-sensitive notifications? | Manual only; in-process worker; Azure timer service | Use an opt-in in-process worker every 60 seconds, batch size 20 | No additional Azure resource is required for the demo environment | User | 2026-07-27 | FE10 Notification Worker/System actor flow |
| BD-004 | SL-003 | Which identity may run automatic processing? | Fake Admin; fake Librarian; system-only construction boundary | Add a system-only processor and keep the HTTP role check unchanged | SYSTEM is an internal actor, not a login role | User | 2026-07-27 | Q-FE10-007; authorization invariants |
| BD-005 | SL-003 | What guarantee is exposed on F1? | Guaranteed schedule; best-effort; disable worker | Best-effort while the backend is awake, with an immediate startup pass and later 60-second passes | Matches the actual F1 lifecycle and avoids misleading operational claims | User | 2026-07-27 | NFR-FE10-REL; environment constraint E-005 |

## 5. Actor Responsibility Matrix

| Actor | Business goal | May initiate | Must not perform | State transitions owned | Data read/write scope | Handoffs | Failure paths |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FE11 requester | Deliver one new account setup event | Canonical synchronous `ACCOUNT_SETUP` after source commit | Queue setup content, expose setup links, or reuse FE02 types | FE10 records `PROCESSING -> SENT/FAILED` | Safe notification/source metadata and attempt only | SMTP adapter; FE02 later consumes setup token | Delivery failure leaves account `INACTIVE`; Admin may resend after cooldown |
| FE02 requester | Deliver verification/reset OTP events | Canonical synchronous FE02 sensitive types | Persist or expose raw OTP/rendered content | FE10 records `PROCESSING -> SENT/FAILED` | Safe metadata and attempt only | SMTP adapter | Source flow remains committed; new source token is required for reissue |
| System notification worker | Deliver queued non-sensitive events | Internal startup pass and scheduled batches | Process sensitive rows, auto-retry `FAILED`, or impersonate a login role | Claims `PENDING -> PROCESSING`, then records `SENT/FAILED` | Non-sensitive notification rows and attempts | SMTP adapter | Safe error recorded; later schedule continues |
| Librarian/Admin | Operate manual recovery boundary | Existing protected process-pending and retry routes | Use SYSTEM identity or submit sensitive auth content | Existing manual transitions only | Authorized FE10 API DTOs | Notification service | Existing safe 4xx/5xx behavior remains |
| Azure App Service | Host the backend process | Start/stop/restart the Node process | Guarantee execution while F1 is asleep | None | Process lifecycle only | Starts/stops worker with server | Worker resumes with a startup pass after wake/restart |

## 6. Business Slice Contracts

| Slice ID | Actor and outcome | Trigger | Preconditions | Happy path | Alternative/failure paths | Rules/calculations | State invariants | Permissions/data ownership | Acceptance examples | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-001 | FE11 can deliver a setup email in an upgraded database | Admin creates or resends an eligible account setup | Idempotent migration was applied; template is active | FE10 finds the canonical template, renders only in memory, sends synchronously and records safe status | Missing provider/config records safe failure; expired old tokens are not revived | Variables remain `setupLink`, `expiresInHours`; migration may run repeatedly | No raw token/link/body is persisted or returned | FE11 issues; FE10 delivers; FE02 consumes | AT-001, AT-002 | `approved-requirement` |
| SL-002 | Operator can correlate a successful SMTP attempt | Sensitive provider send resolves successfully | Adapter returns a message ID or null | FE10 stores the normalized ID in `NotificationAttempts.ProviderMessageId` | Missing ID remains null; transition failure stays a safe internal error | Maximum persisted width follows the existing 255-character repository contract | No full provider response, recipient content, token, OTP or link is stored in the attempt | FE10 owns delivery evidence | AT-003 | `approved-requirement` |
| SL-003 | System drains queued non-sensitive mail while the app is awake | Backend starts, then each configured interval elapses | Worker enabled; positive interval and batch size; backend process alive | One non-overlapping batch claims oldest rows, sends and records attempts | Batch error is safely logged and the next interval remains scheduled; F1 sleep pauses execution | Default interval 60,000 ms; default batch 20; one batch at a time | Sensitive and `FAILED` rows are never claimed; HTTP authorization remains unchanged | SYSTEM owns automatic trigger; FE10 owns transitions | AT-004 through AT-009 | `approved-requirement` |

## 7. Component And Lifecycle Design

### 7.1 Template Migration

Add an idempotent migration under `database/migrations/` that:

- starts a transaction and uses `XACT_ABORT ON`;
- updates the existing `ACCOUNT_SETUP` row to the canonical active subject/body,
  or inserts it when absent;
- uses the approved variables `{{setupLink}}` and `{{expiresInHours}}`;
- makes no schema change and does not modify unrelated templates;
- can be applied twice with the same final row.

`database/Librarymanagement.sql` already contains the correct canonical seed and
remains unchanged unless a drift test proves otherwise. Deployment does not
auto-run migrations, so staging application is a separate, recorded step.

### 7.2 Sensitive Provider Evidence

The sensitive branch in `notificationService` captures the result from
`emailProvider.send()` and passes
`providerResult?.providerMessageId || null` to `markSent`.

The service continues to return only the existing minimal DTO. Provider
response details are not added to HTTP, audit metadata, application logs, or
notification content.

### 7.3 System Processing Boundary

Refactor the existing queue loop into one internal batch function. Two wrappers
may invoke it:

- the existing `processPendingNotifications(input, actor, context)` wrapper,
  which retains the `LIBRARIAN`/`ADMIN` authorization and human audit user;
- a construction-bound system processor used only by the worker, which writes
  the same aggregate audit action with `userId = null`.

The public route, validator, controller, and response contract do not change.
The worker never creates a fabricated Admin or Librarian actor.

### 7.4 Worker Lifecycle

Add a small worker component with injected processor, scheduler and logger:

- disabled unless `NOTIFICATION_WORKER_ENABLED=true`;
- validates positive integer
  `NOTIFICATION_WORKER_INTERVAL_MS` (default `60000`) and
  `NOTIFICATION_WORKER_BATCH_SIZE` (default `20`);
- runs one asynchronous pass after backend startup, then schedules later passes;
- uses an in-memory overlap guard so a slow pass is not duplicated by the next
  timer tick;
- catches batch failures, logs only a stable safe code plus aggregate context,
  and remains scheduled;
- exposes `stop()` to clear the timer;
- is started/stopped by the backend entrypoint with the HTTP server;
- does not start when `index.js` is imported by tests.

Repository claim locking remains the cross-process protection. The worker adds
only process-local overlap protection.

### 7.5 Staging Configuration

After reviewed code and migration are ready:

```text
NOTIFICATION_WORKER_ENABLED=true
NOTIFICATION_WORKER_INTERVAL_MS=60000
NOTIFICATION_WORKER_BATCH_SIZE=20
```

The migration is applied to the existing staging database before or with the
compatible backend deployment. No SMTP secret is read into test output or
committed to the repository.

## 8. Error And Safety Contract

- Provider send failure records the existing generic safe failure message.
- A provider success followed by a failed database transition remains
  `DELIVERY_STATE_UNCERTAIN`; it is not automatically resent.
- Worker failures never terminate the HTTP server.
- Worker logs contain no email address, message body, token, OTP, setup link,
  SMTP response, connection string, or secret.
- `FAILED` notifications remain manual-retry only.
- Sensitive rows remain excluded by both type and template defensive checks.
- The migration is additive/idempotent and preserves existing staging rows.
- The old expired staging `ACCOUNT_SETUP` token is not reused. A new FE11 resend
  must create a new token, source event and idempotency key.

## 9. Acceptance And Test-First Evidence

| Acceptance ID | Decision | RED evidence required before implementation | GREEN/acceptance evidence |
| --- | --- | --- | --- |
| AT-001 | BD-001 | Migration test/probe shows an existing DB without `ACCOUNT_SETUP` remains missing | First execution inserts the canonical active row |
| AT-002 | BD-001 | Repeatability assertion is absent/fails | Second execution succeeds and leaves exactly one canonical row |
| AT-003 | BD-002 | Sensitive success attempt currently contains `providerMessageId: null` despite the mock provider returning an ID | Attempt stores the mock provider ID; public response/audit remain minimal |
| AT-004 | BD-003/004 | No automatic system processor exists | System processor drains one non-sensitive `PENDING` notification without a login actor |
| AT-005 | BD-004 | A naive worker would need a fabricated staff actor | Worker uses the system-only construction boundary; HTTP non-staff access still returns `403` |
| AT-006 | BD-003 | No worker lifecycle tests exist | Disabled worker performs zero work; enabled worker runs at startup and on the configured schedule |
| AT-007 | BD-003 | Concurrent timer ticks can overlap in a naive implementation | Slow first pass causes the next tick to skip; later ticks resume |
| AT-008 | BD-003/005 | Uncaught processor failure could stop scheduling or the server | Failure is safely logged and a later scheduled pass executes |
| AT-009 | BD-003 | Broad queue processing could touch sensitive/failed rows | Existing and new tests prove only non-sensitive `PENDING` rows are claimable |
| AT-010 | All | Existing notification/auth/deployment tests establish the baseline | Focused tests, all backend tests, frontend tests, deployment tests, lint/build and traceability remain green |
| AT-011 | All | Staging shows missing template, pending rows and null provider IDs | Template exists; newly processed attempts have correct safe status/provider ID; pending count drains while app is awake |

All production changes follow RED -> GREEN -> REFACTOR. No production file is
edited before its focused failing test is captured.

## 10. Requirements Traceability Matrix

| Decision ID | Requirement ID | Slice/use case | Interface or API | Planned implementation location | Acceptance test ID | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BD-001 | ADR-005; Q-FE10-003; Q-FE11-015 | SL-001 account setup delivery | Internal FE11 requester | `database/migrations/2026-07-27-fe10-account-setup-template.sql` | AT-001, AT-002 | Staging SQL drift + migration repeatability | Ready after written review |
| BD-002 | FE10 attempt traceability; ADR-004/005 | SL-002 sensitive delivery evidence | Internal provider adapter | `backend/src/services/notificationService.js`, focused notification tests | AT-003 | Mock provider ID and attempt state | Ready after written review |
| BD-003 | FE10 worker flow; NFR-FE10-REL | SL-003 queued delivery | Internal lifecycle only | `backend/src/services/notificationWorker.js`, `backend/src/index.js`, config and tests | AT-004, AT-006..AT-009 | Fake scheduler/processor plus integration regression | Ready after written review |
| BD-004 | Q-FE10-007; FE10 authorization | SL-003 system boundary | Existing manual HTTP endpoint unchanged | notification service system processor and route regressions | AT-004, AT-005 | Actor/audit and route authorization evidence | Ready after written review |
| BD-005 | Environment constraint E-005 | SL-003 staging behavior | Azure App Service settings | Staging settings and validation record | AT-011 | F1/Always On evidence and post-deploy SQL/API checks | Ready after written review |

## 11. Quality Gates

| Slice ID | G0 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | Blocker | Owner | Next evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-001..SL-003 | passed | passed | passed | passed | not-started | not-started | not-started | not-started | Implementation plan is pending | Codex / User | Create PLAN/TASKS and RED tests |

Gate interpretation:

- G0-G2 passed from approved FE10/FE11/ADR source contracts and the live defect
  evidence.
- G3 passed because the user approved both the design direction and the exact
  written document on 2026-07-27.
- G4-G7 require the implementation plan, TDD evidence, automated validation,
  staging validation and human review.

## 12. Slice Roadmap

| Order | Slice ID | Outcome | Dependencies | Business risk | Delivery owner | Business approver | Entry gate | Exit evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | SL-001 | Existing DB contains the canonical setup template | Written review; migration access | Admin-created users cannot receive setup links | Codex | User | G3 passed | AT-001/AT-002 plus staging template query |
| 2 | SL-002 | Sensitive attempts retain safe provider correlation | SL-001 is independent; same FE10 test boundary | False confidence without provider traceability | Codex | User | G3 passed | AT-003 and sensitive regression suite |
| 3 | SL-003 | Queued non-sensitive mail drains while backend is awake | System processor and worker configuration | Backlog remains unsent or actor boundary weakens | Codex | User | G3 passed | AT-004..AT-009 plus staging pending-count transition |
| 4 | Integrated staging | New setup sends and queued delivery work together | SL-001..SL-003 reviewed and deployed | Live environment drift | Codex / User | User | G6 passed | AT-011 and human inbox/flow confirmation |

## 13. Verification And Rollback

Local verification:

- focused migration repeatability test or disposable SQL execution;
- focused FE10 sensitive/queue/worker tests;
- full backend and frontend tests;
- deployment tests, lint, build and traceability checks;
- secret and sensitive-content scans over the diff.

Staging verification:

- confirm the new settings without printing secrets;
- apply the idempotent migration and confirm exactly one active
  `ACCOUNT_SETUP` template;
- deploy the reviewed backend;
- confirm health/smoke checks;
- observe existing non-sensitive `PENDING` rows transition to `SENT` or safe
  `FAILED` while the app is awake;
- create a new authorized test event rather than reuse an expired token;
- verify safe attempt metadata contains the provider ID when supplied;
- verify no sensitive value appears in notification rows, audit rows, logs or
  HTTP responses.

Rollback:

- disable `NOTIFICATION_WORKER_ENABLED` to stop automatic processing without a
  code rollback;
- revert the backend deployment if needed;
- leave the canonical `ACCOUNT_SETUP` template in place because it is required
  by the approved FE11 contract;
- do not delete attempt history or notification rows.

## 14. Execution Boundary

Authorized by the approved design:

- write the implementation plan and bounded FE10/FE11 SDD addendum;
- add RED tests, then the minimum migration/service/worker/config changes;
- run local validation;
- apply the additive migration and worker settings to staging;
- deploy and perform safe live verification.

Not authorized without a new decision:

- purchase or provision a new Azure scheduling service;
- change the F1 App Service plan;
- automatically resend expired setup credentials;
- push, merge, or expose secrets/PII;
- redesign notification templates, retry policy, or public APIs.
